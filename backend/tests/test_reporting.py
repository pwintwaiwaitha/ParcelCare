import os
import tempfile
from pathlib import Path
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.shared import config
from app.shared.db import Base, Profile, Shipment, Report, CaseEvent, db_session

@pytest.fixture()
def clients(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(config,'AUTH_MODE','local')
    monkeypatch.setattr(config,'ENV','local')
    monkeypatch.setattr(config,'SESSION_SECRET','test-session-secret-of-at-least-thirty-two-characters')
    monkeypatch.setattr(config,'DEMO_PASSWORD','only-for-automated-tests')
    engine=create_engine(f'sqlite:///{tmp_path / "test.db"}',connect_args={'check_same_thread':False})
    Base.metadata.create_all(engine); sessions=sessionmaker(engine,expire_on_commit=False)
    with sessions.begin() as db:
        for identity,role in [('ca','customer'),('cb','customer'),('ra','rider'),('rb','rider'),('staff','staff')]:
            db.add(Profile(id=identity,email=f'{identity}@test.demo',name=identity,role=role))
        db.flush()
        db.add_all([Shipment(id='s1',tracking_id='PC-1001',customer_id='ca',rider_id='ra',label='Test parcel',destination='Yangon'),Shipment(id='s2',tracking_id='PC-2001',customer_id='cb',rider_id='rb',label='Private parcel',destination='Yangon')])
    def dependency():
        with sessions() as db: yield db
    app.dependency_overrides[db_session]=dependency
    output={}
    for identity in ['ca','cb','ra','rb','staff']:
        client=TestClient(app);client.headers['x-parcelcare-request']='1'
        assert client.post('/auth/login',json={'email':f'{identity}@test.demo','password':config.DEMO_PASSWORD}).status_code==200
        output[identity]=client
    yield output,sessions
    app.dependency_overrides.clear();engine.dispose()

def report(client,**changes):
    body={'tracking_id':'PC-1001','category':'WRONG_ADDRESS','description':'Apartment number is missing from my delivery address.'};body.update(changes)
    return client.post('/reports',json=body,headers={'Idempotency-Key':str(uuid4())})

def test_access_is_not_tracking_id_knowledge(clients):
    c,_=clients
    assert len(c['ca'].get('/shipments').json())==1
    assert report(c['cb']).status_code==404
    assert report(c['rb']).status_code==404
    case_id=report(c['ca']).json()['case_id']
    assert c['cb'].get(f'/cases/{case_id}').status_code==404
    assert c['ra'].get(f'/cases/{case_id}').status_code==404
    assert c['staff'].get(f'/cases/{case_id}').status_code==200

def test_report_retry_and_changed_body_conflict(clients):
    c,sessions=clients;key=str(uuid4());body={'tracking_id':'PC-1001','category':'WRONG_ADDRESS','description':'The apartment number needs to be corrected.'}
    first=c['ca'].post('/reports',json=body,headers={'Idempotency-Key':key})
    again=c['ca'].post('/reports',json=body,headers={'Idempotency-Key':key})
    assert first.json()==again.json()
    assert c['ca'].post('/reports',json={**body,'description':'A different complaint with the same retry key.'},headers={'Idempotency-Key':key}).status_code==409
    with sessions() as db: assert len(list(db.scalars(select(Report))))==1

def test_same_context_preserves_reports_and_distinct_issue_stays_separate(clients):
    c,sessions=clients
    one=report(c['ca']).json()['case_id'];two=report(c['ca']).json()['case_id']
    other=report(c['ca'],category='DAMAGED').json()['case_id']
    rider=report(c['ra']).json()['case_id']
    assert one==two and other!=one and rider!=one
    assert any(c['id']==rider for c in clients[0]['staff'].get(f'/cases/{one}').json()['related_cases'])
    assert clients[0]['ca'].get(f'/cases/{one}').json()['related_cases']==[]
    with sessions() as db: assert len(list(db.scalars(select(Report))))==4

def test_triage_saved_and_internal_note_not_exposed(clients):
    c,_=clients;case_id=report(c['ca']).json()['case_id']
    body={'version':1,'status':'TRIAGED','priority':'HIGH','update':'We are checking the correct address.','internal_note':'Staff-only investigation detail'}
    response=c['staff'].post(f'/cases/{case_id}/triage',json=body,headers={'Idempotency-Key':str(uuid4())})
    assert response.status_code==200
    reporter=c['ca'].get(f'/cases/{case_id}').json()
    assert reporter['status']=='TRIAGED' and reporter['owner']=='staff' and reporter['priority']=='HIGH'
    assert any('correct address' in e['text'] for e in reporter['events'])
    assert 'Staff-only investigation detail' not in str(reporter)
    assert 'Staff-only investigation detail' in str(response.json())

def test_unauthorized_triage_stale_version_and_resolution_blocked(clients):
    c,_=clients;case_id=report(c['ca']).json()['case_id'];key=str(uuid4())
    body={'version':1,'status':'TRIAGED','priority':'NORMAL','update':'The support team is reviewing your report.'}
    assert c['ca'].post(f'/cases/{case_id}/triage',json=body,headers={'Idempotency-Key':key}).status_code==403
    assert c['staff'].post(f'/cases/{case_id}/triage',json=body,headers={'Idempotency-Key':key}).status_code==200
    assert c['staff'].post(f'/cases/{case_id}/triage',json=body,headers={'Idempotency-Key':key}).json()['version']==2
    assert c['staff'].post(f'/cases/{case_id}/triage',json=body,headers={'Idempotency-Key':str(uuid4())}).status_code==409
    assert c['staff'].post(f'/cases/{case_id}/triage',json={**body,'version':2,'status':'RESOLVED'},headers={'Idempotency-Key':str(uuid4())}).status_code==409

def test_evidence_private_idempotent_and_type_limited(clients):
    c,_=clients;case_id=report(c['ca']).json()['case_id'];key=str(uuid4());data=b'\x89PNG\r\n\x1a\nsynthetic-test-bytes'
    upload=c['ca'].post(f'/cases/{case_id}/evidence',files={'file':('proof.png',data,'image/png')},headers={'Idempotency-Key':key})
    assert upload.status_code==200
    assert c['ca'].post(f'/cases/{case_id}/evidence',files={'file':('proof.png',data,'image/png')},headers={'Idempotency-Key':key}).json()==upload.json()
    url=f'/cases/{case_id}/evidence/{upload.json()["id"]}'
    assert c['ca'].get(url).content==data and c['staff'].get(url).content==data
    assert c['cb'].get(url).status_code==404
    assert c['ca'].post(f'/cases/{case_id}/evidence',files={'file':('attack.html',b'<html>bad</html>','text/html')},headers={'Idempotency-Key':str(uuid4())}).status_code==422

def test_auth_and_request_verification(clients):
    c,_=clients
    anonymous=TestClient(app)
    assert anonymous.get('/cases').status_code==401
    assert anonymous.post('/auth/login',json={'email':'ca@test.demo','password':config.DEMO_PASSWORD}).status_code==403
    assert c['ca'].post('/auth/login',json={'email':'ca@test.demo','password':'wrong'}).status_code==401
    assert report(c['staff']).status_code==403
    assert report(c['ca'],category='ACCIDENT').status_code==422
    assert report(c['ca'],description='           ').status_code==422

def test_evidence_size_limit_and_distinct_case_cannot_access_file(clients):
    c,_=clients;one=report(c['ca']).json()['case_id'];two=report(c['ca'],category='DAMAGED').json()['case_id']
    upload=c['ca'].post(f'/cases/{one}/evidence',files={'file':('proof.png',b'\x89PNG\r\n\x1a\nbytes','image/png')},headers={'Idempotency-Key':str(uuid4())}).json()
    assert c['ca'].get(f'/cases/{two}/evidence/{upload["id"]}').status_code==404
    assert c['ca'].post(f'/cases/{one}/evidence',files={'file':('large.png',b'\x89PNG\r\n\x1a\n'+b'x'*(5*1024*1024),'image/png')},headers={'Idempotency-Key':str(uuid4())}).status_code==413

def test_supabase_identity_uses_trusted_profile_not_metadata(clients,monkeypatch):
    import httpx
    from app.shared import auth
    c,_=clients
    monkeypatch.setattr(config,'AUTH_MODE','supabase')
    monkeypatch.setattr(config,'SUPABASE_URL','https://synthetic.supabase.co')
    monkeypatch.setattr(config,'PUBLIC_KEY','synthetic-public-key')
    def login_response(url,**kwargs):
        assert kwargs['headers']['apikey']=='synthetic-public-key'
        return httpx.Response(200,json={'access_token':'synthetic-access-token'})
    def identity_response(url,**kwargs):
        assert kwargs['headers']['Authorization']=='Bearer synthetic-access-token'
        return httpx.Response(200,json={'id':'ca','user_metadata':{'role':'staff'}})
    monkeypatch.setattr(auth.httpx,'post',login_response)
    monkeypatch.setattr(auth.httpx,'get',identity_response)
    assert c['ca'].post('/auth/login',json={'email':'ca@test.demo','password':'synthetic'}).status_code==200
    assert c['ca'].get('/me').json()['role']=='customer'
    assert c['ca'].get('/me').json()['local_demo'] is False

def test_new_secret_keys_are_not_used_as_jwt_bearers(monkeypatch):
    monkeypatch.setattr(config,'SECRET_KEY','sb_secret_synthetic')
    assert config.privileged_headers()=={'apikey':'sb_secret_synthetic'}
    monkeypatch.setattr(config,'SECRET_KEY','eyJ.synthetic.legacy')
    assert config.privileged_headers()['Authorization']=='Bearer eyJ.synthetic.legacy'
