import hashlib
import json
from fastapi import HTTPException
from sqlalchemy import select
from ...shared.db import Case, Report, Shipment, Receipt, CaseEvent, now

CATEGORIES = {
 'customer': {'WRONG_ADDRESS','WRONG_ITEM','DAMAGED','DELAYED','MISSING','NOT_RECEIVED','RESCHEDULE'},
 'rider': {'WRONG_ADDRESS','CUSTOMER_UNAVAILABLE','CUSTOMER_UNREACHABLE','REFUSED','ACCIDENT','BREAKDOWN','DAMAGED','LOST','ACCESS'},
}
MANUAL = {'DELAYED','MISSING','NOT_RECEIVED','RESCHEDULE','CUSTOMER_UNAVAILABLE','CUSTOMER_UNREACHABLE','REFUSED','ACCIDENT','BREAKDOWN','LOST','ACCESS','DAMAGED'}

def scoped_shipments(user):
    query = select(Shipment)
    if user.role == 'customer': query = query.where(Shipment.customer_id == user.id)
    elif user.role == 'rider': query = query.where(Shipment.rider_id == user.id)
    return query

def scoped_cases(user):
    query = select(Case)
    if user.role != 'staff':
        query = query.where(Case.id.in_(select(Report.case_id).where(Report.reporter_id == user.id)))
    return query

def get_case(db, user, case_id):
    case = db.scalar(scoped_cases(user).where(Case.id == case_id))
    if not case: raise HTTPException(404, 'Case not found.')
    return case

def digest(payload): return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

def receipt(db, user, action, key, fingerprint):
    found = db.scalar(select(Receipt).where(Receipt.actor_id == user.id, Receipt.action == action, Receipt.key == key))
    if found and found.fingerprint != fingerprint: raise HTTPException(409, 'This retry key was already used for different data.')
    return found

def create_report(db, user, payload, key):
    if user.role not in CATEGORIES: raise HTTPException(403, 'Only customers and riders can submit reports.')
    if payload['category'] not in CATEGORIES[user.role]: raise HTTPException(422, 'Choose a supported report category.')
    fingerprint = digest(payload)
    prior = receipt(db, user, 'report', key, fingerprint)
    if prior: return prior.result_id
    shipment = db.scalar(scoped_shipments(user).where(Shipment.tracking_id == payload['tracking_id']).with_for_update())
    if not shipment: raise HTTPException(404, 'Shipment not found or not available to you.')
    # Lock serializes matching on PostgreSQL. Recheck the receipt after waiting.
    prior = receipt(db, user, 'report', key, fingerprint)
    if prior: return prior.result_id
    case = db.scalar(select(Case).join(Report).where(Case.shipment_id == shipment.id, Case.category == payload['category'], Case.status != 'RESOLVED', Report.reporter_id == user.id, Report.description == payload['description']).order_by(Case.created_at.desc()))
    if not case:
        case = Case(shipment_id=shipment.id, category=payload['category'])
        db.add(case); db.flush()
    report = Report(case_id=case.id, reporter_id=user.id, description=payload['description'])
    db.add(report); db.flush()
    db.add(CaseEvent(case_id=case.id, actor_id=user.id, text='Exception report received. The support team will review it.'))
    db.add(Receipt(actor_id=user.id, action='report', key=key, fingerprint=fingerprint, result_id=case.id))
    db.commit()
    return case.id

TRANSITIONS = {
 'OPEN': {'TRIAGED','ESCALATED'},
 'TRIAGED': {'IN_PROGRESS','WAITING_CUSTOMER','WAITING_RIDER','ESCALATED'},
 'IN_PROGRESS': {'WAITING_CUSTOMER','WAITING_RIDER','ESCALATED'},
 'WAITING_CUSTOMER': {'IN_PROGRESS','ESCALATED'},
 'WAITING_RIDER': {'IN_PROGRESS','ESCALATED'},
 'ESCALATED': {'TRIAGED','IN_PROGRESS','WAITING_CUSTOMER','WAITING_RIDER'},
}

def triage(db, user, case_id, payload, key):
    if user.role != 'staff': raise HTTPException(403, 'Staff permission required.')
    fingerprint = digest(payload)
    action = f'triage:{case_id}'
    prior = receipt(db, user, action, key, fingerprint)
    if prior: return
    case = db.scalar(select(Case).where(Case.id == case_id).with_for_update())
    if not case: raise HTTPException(404, 'Case not found.')
    prior = receipt(db, user, action, key, fingerprint)
    if prior: return
    if case.version != payload['version']: raise HTTPException(409, 'This case changed. Refresh it before saving again.')
    status = payload['status']
    if status != case.status and status not in TRANSITIONS.get(case.status, set()):
        raise HTTPException(409, 'This status transition is not available. Resolution requires a verified recovery outcome.')
    case.status, case.priority, case.owner_id = status, payload['priority'], user.id
    case.version += 1; case.updated_at = now()
    db.add(CaseEvent(case_id=case.id, actor_id=user.id, text=f'Status set to {status}; priority {case.priority}; assigned to {user.name}.', visibility='staff'))
    db.add(CaseEvent(case_id=case.id, actor_id=user.id, text=payload['update']))
    if payload.get('internal_note'):
        db.add(CaseEvent(case_id=case.id, actor_id=user.id, text=payload['internal_note'], visibility='staff'))
    db.add(Receipt(actor_id=user.id, action=action, key=key, fingerprint=fingerprint, result_id=case.id))
    db.commit()
