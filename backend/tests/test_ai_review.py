from uuid import uuid4
import httpx
from sqlalchemy import select
from test_reporting import clients, report
from app.features.cases import ai_review
from app.shared import config
from app.shared.db import AIReview, Case

def output():
    finding={'finding':'Check the reported address.', 'uncertainty':'Customer confirmation is required.', 'report_ids':[]}
    return {**{k:dict(finding) for k in ai_review.CHECKS},'suggested_category':'WRONG_ADDRESS',
        'suggested_priority':'NORMAL','duplicate_case_ids':[],'evidence_status':'NOT_ASSESSED'}

def test_staff_only_persisted_retry_and_no_action(clients,monkeypatch):
    c,sessions=clients; case_id=report(c['ca']).json()['case_id']; path=f'/cases/{case_id}/ai-review'
    monkeypatch.setattr(config,'GROQ_API_KEY','test-only')
    calls=[]
    def generate(data,model): calls.append(data); return output()
    monkeypatch.setattr(ai_review,'generate',generate)
    for role in ['ca','ra','cb']:
        assert c[role].get(path).status_code==403
        assert c[role].post(path,json={'version':1},headers={'Idempotency-Key':str(uuid4())}).status_code==403
    key=str(uuid4()); headers={'Idempotency-Key':key}
    first=c['staff'].post(path,json={'version':1},headers=headers)
    assert first.status_code==200 and first.json()['status']=='COMPLETED'
    assert c['staff'].post(path,json={'version':1},headers=headers).json()['id']==first.json()['id']
    assert len(calls)==1
    with sessions() as db:
        case=db.get(Case,case_id)
        assert case.status=='OPEN' and case.version==1 and case.owner_id is None
        assert len(list(db.scalars(select(AIReview))))==1
    report(c['ca'])
    assert c['staff'].get(path).json()['review']['stale']

def test_failure_retry_and_unconfigured_manual_fallback(clients,monkeypatch):
    c,_=clients;case_id=report(c['ca']).json()['case_id'];path=f'/cases/{case_id}/ai-review'
    monkeypatch.setattr(config,'GROQ_API_KEY','')
    assert c['staff'].post(path,json={'version':1},headers={'Idempotency-Key':str(uuid4())}).status_code==503
    monkeypatch.setattr(config,'GROQ_API_KEY','test-only')
    def fail(*args): raise httpx.ReadTimeout('private provider detail')
    monkeypatch.setattr(ai_review,'generate',fail)
    result=c['staff'].post(path,json={'version':1},headers={'Idempotency-Key':str(uuid4())})
    assert result.json()['status']=='FAILED'
    assert 'private provider detail' not in result.text
    assert c['staff'].get(f'/cases/{case_id}').json()['status']=='OPEN'

def test_provider_reference_validation_and_photo_limitation(monkeypatch):
    payload=output()
    class Response:
        status_code=200
        def json(self):
            import json
            return {'choices':[{'message':{'content':json.dumps(payload)}}]}
    monkeypatch.setattr(httpx.Client,'post',lambda *args,**kwargs:Response())
    data={'reports':[{'id':'r1'}],'related_cases':[]}
    result=ai_review.generate(data,'test-model')
    assert 'NOT ASSESSED' in result['evidence_consistency']['finding']
    payload['summary']['report_ids']=['invented-id']
    import pytest
    with pytest.raises(ValueError,match='source references'): ai_review.generate(data,'test-model')
