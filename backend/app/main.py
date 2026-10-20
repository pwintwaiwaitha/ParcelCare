from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal
from uuid import UUID, uuid4
import logging
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File, Header
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session as DBSession
from .shared import config
from .shared.db import Base, engine, db_session, Profile, Shipment, Case, Report, CaseEvent, Evidence, Receipt
from .shared.auth import authenticate, current_user
from .features.cases.service import CATEGORIES, MANUAL, TRANSITIONS, scoped_shipments, scoped_cases, get_case, create_report, triage, digest, receipt

@asynccontextmanager
async def lifespan(app):
    if config.ENV == 'local': Base.metadata.create_all(engine)
    yield

app = FastAPI(title='ParcelCare API', version='0.1.0', lifespan=lifespan)
DB = Annotated[DBSession, Depends(db_session)]
User = Annotated[Profile, Depends(current_user)]
Key = Annotated[str, Header(alias='Idempotency-Key', min_length=8, max_length=100)]

@app.middleware('http')
async def security(request: Request, call_next):
    if request.method not in {'GET','HEAD','OPTIONS'} and request.headers.get('x-parcelcare-request') != '1':
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail':'Request verification failed.'}, status_code=403)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

@app.exception_handler(SQLAlchemyError)
async def database_error(request, exc):
    logging.getLogger('parcelcare').error('Database operation failed: %s', type(exc).__name__)
    from fastapi.responses import JSONResponse
    return JSONResponse({'detail':'Could not save or load data. Please retry.'}, status_code=503)

def public_user(user): return {'id':user.id, 'name':user.name, 'email':user.email, 'role':user.role}

class Login(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=200)

@app.get('/health')
def health(): return {'status':'ok'}

@app.get('/ready')
def ready(db: DB):
    db.execute(select(Profile.id).limit(1))
    return {'status':'ready', 'auth_mode':config.AUTH_MODE}

@app.post('/auth/login')
def login(body: Login, response: Response, db: DB):
    token = authenticate(body.email.strip().lower(), body.password, db)
    response.set_cookie('parcelcare_session', token, httponly=True, secure=config.ENV != 'local', samesite='lax', max_age=3600, path='/')
    return {'ok': True}

@app.post('/auth/logout')
def logout(response: Response):
    response.delete_cookie('parcelcare_session', path='/', secure=config.ENV != 'local', httponly=True, samesite='lax')
    return {'ok':True}

@app.get('/me')
def me(user: User): return {**public_user(user), 'local_demo': config.AUTH_MODE == 'local', 'categories':sorted(CATEGORIES.get(user.role, set()))}

@app.get('/staff')
def staff_list(user: User, db: DB):
    if user.role != 'staff': raise HTTPException(403, 'Staff permission required.')
    return [public_user(p) for p in db.scalars(select(Profile).where(Profile.role == 'staff'))]

@app.get('/shipments')
def shipments(user: User, db: DB):
    return [{'id':s.id,'tracking_id':s.tracking_id,'label':s.label,'destination':s.destination,'status':s.status} for s in db.scalars(scoped_shipments(user).order_by(Shipment.tracking_id))]

def case_dict(db, case):
    shipment = db.get(Shipment, case.shipment_id)
    owner = db.get(Profile, case.owner_id) if case.owner_id else None
    return {'id':case.id,'tracking_id':shipment.tracking_id,'shipment_label':shipment.label,'category':case.category,'status':case.status,'priority':case.priority,'owner':owner.name if owner else None,'version':case.version,'created_at':case.created_at,'updated_at':case.updated_at,'manual_only':case.category in MANUAL}

@app.get('/cases')
def cases(user: User, db: DB, offset: int = 0, limit: int = 50):
    if offset < 0 or not 1 <= limit <= 100: raise HTTPException(422, 'Invalid pagination.')
    return [case_dict(db,c) for c in db.scalars(scoped_cases(user).order_by(Case.updated_at.desc(), Case.id).offset(offset).limit(limit))]

@app.get('/cases/{case_id}')
def detail(case_id: UUID, user: User, db: DB):
    case = get_case(db,user,str(case_id))
    reports = select(Report).where(Report.case_id == case.id).order_by(Report.created_at)
    evidence = select(Evidence).where(Evidence.case_id == case.id)
    events = select(CaseEvent).where(CaseEvent.case_id == case.id).order_by(CaseEvent.created_at, CaseEvent.id)
    if user.role != 'staff':
        reports = reports.where(Report.reporter_id == user.id)
        evidence = evidence.where(Evidence.uploader_id == user.id)
        events = events.where(CaseEvent.visibility == 'public')
    related = db.scalars(select(Case).where(Case.shipment_id == case.shipment_id, Case.category == case.category, Case.id != case.id, Case.status != 'RESOLVED').limit(20)) if user.role == 'staff' else []
    return {**case_dict(db,case),'related_cases':[{'id':c.id,'status':c.status} for c in related],'reports':[{'id':r.id,'description':r.description,'created_at':r.created_at,'source':db.get(Profile,r.reporter_id).role} for r in db.scalars(reports)],'events':[{'id':e.id,'text':e.text,'visibility':e.visibility,'created_at':e.created_at} for e in db.scalars(events)],'evidence':[{'id':e.id,'name':e.name} for e in db.scalars(evidence)],'allowed_statuses':[case.status,*sorted(TRANSITIONS.get(case.status,set()))] if user.role == 'staff' else []}

class ReportInput(BaseModel):
    tracking_id: str = Field(min_length=1,max_length=40)
    category: str = Field(min_length=1,max_length=50)
    description: str = Field(min_length=10,max_length=3000)
    @field_validator('tracking_id','description')
    @classmethod
    def trim(cls,value):
        value = value.strip()
        if not value: raise ValueError('This field is required.')
        return value

@app.post('/reports', status_code=201)
def reports(body: ReportInput, user: User, db: DB, idempotency_key: Key):
    if len(body.description) < 10: raise HTTPException(422, 'Please provide at least 10 characters of detail.')
    try: case_id = create_report(db,user,body.model_dump(),idempotency_key)
    except IntegrityError:
        db.rollback()
        prior = receipt(db,user,'report',idempotency_key,digest(body.model_dump()))
        if not prior: raise HTTPException(409,'A simultaneous request changed this report. Retry with the same key.')
        case_id = prior.result_id
    return {'case_id':case_id}

class TriageInput(BaseModel):
    version: int = Field(ge=1)
    status: str
    priority: Literal['LOW','NORMAL','HIGH','URGENT']
    update: str = Field(min_length=5,max_length=2000)
    internal_note: str = Field(default='',max_length=2000)
    @field_validator('update')
    @classmethod
    def trim(cls,value):
        if len(value.strip()) < 5: raise ValueError('Add a meaningful reporter update.')
        return value.strip()

@app.post('/cases/{case_id}/triage')
def update_case(case_id: UUID, body: TriageInput, user: User, db: DB, idempotency_key: Key):
    try: triage(db,user,str(case_id),body.model_dump(),idempotency_key)
    except IntegrityError:
        db.rollback()
        prior = receipt(db,user,f'triage:{case_id}',idempotency_key,digest(body.model_dump()))
        if not prior: raise HTTPException(409,'Another update was saved. Refresh and retry.')
    return detail(case_id,user,db)

MAX_FILE = 5 * 1024 * 1024

@app.post('/cases/{case_id}/evidence')
async def upload(case_id: UUID, user: User, db: DB, idempotency_key: Key, file: UploadFile = File(...)):
    case = get_case(db,user,str(case_id))
    if user.role == 'staff': raise HTTPException(403,'Evidence must be submitted by the reporter.')
    data = await file.read(MAX_FILE + 1)
    if not data or len(data) > MAX_FILE: raise HTTPException(413,'Choose an image smaller than 5 MB.')
    mime = 'image/png' if data.startswith(b'\x89PNG\r\n\x1a\n') else 'image/jpeg' if data.startswith(b'\xff\xd8\xff') else None
    if not mime: raise HTTPException(422,'Only PNG and JPEG images are supported.')
    name = Path((file.filename or 'Evidence').replace('\\','/')).name[:150]
    fingerprint = digest({'data':__import__('hashlib').sha256(data).hexdigest(),'name':name})
    action = f'evidence:{case.id}'
    # Serialize with report/triage writes and evidence retries on the same case.
    db.scalar(select(Case).where(Case.id == case.id).with_for_update())
    prior = receipt(db,user,action,idempotency_key,fingerprint)
    if prior: return {'id':prior.result_id}
    evidence_id = str(uuid4()); object_key = f'{case.id}/{evidence_id}'
    if config.AUTH_MODE == 'supabase':
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                result = await client.post(f'{config.SUPABASE_URL}/storage/v1/object/{config.BUCKET}/{object_key}',headers={**config.privileged_headers(),'Content-Type':mime},content=data)
                if result.status_code not in {200,201}: raise HTTPException(503,'Evidence storage failed. Retry this upload.')
        except httpx.HTTPError: raise HTTPException(503,'Evidence storage is unavailable. Retry this upload.')
    else:
        path = Path('uploads') / object_key; path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(data)
    db.add(Evidence(id=evidence_id,case_id=case.id,uploader_id=user.id,name=name,mime=mime,object_key=object_key))
    db.add(CaseEvent(case_id=case.id,actor_id=user.id,text='Photo evidence submitted for staff review.'))
    db.add(Receipt(actor_id=user.id,action=action,key=idempotency_key,fingerprint=fingerprint,result_id=evidence_id))
    db.commit()
    return {'id':evidence_id}

@app.get('/cases/{case_id}/evidence/{evidence_id}')
def download(case_id: UUID, evidence_id: UUID, user: User, db: DB):
    case = get_case(db,user,str(case_id))
    evidence = db.get(Evidence,str(evidence_id))
    if not evidence or evidence.case_id != case.id or (user.role != 'staff' and evidence.uploader_id != user.id): raise HTTPException(404,'Evidence not found.')
    if config.AUTH_MODE == 'supabase':
        try:
            result = httpx.get(f'{config.SUPABASE_URL}/storage/v1/object/{config.BUCKET}/{evidence.object_key}',headers=config.privileged_headers(),timeout=30)
            if result.status_code != 200: raise HTTPException(503,'Evidence is temporarily unavailable.')
            return Response(result.content,media_type=evidence.mime,headers={'Content-Disposition':'inline'})
        except httpx.HTTPError: raise HTTPException(503,'Evidence is temporarily unavailable.')
    path = Path('uploads') / evidence.object_key
    if not path.exists(): raise HTTPException(404,'Evidence file not found.')
    return FileResponse(path,media_type=evidence.mime)
