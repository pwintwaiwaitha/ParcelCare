"""Explicit schema migration and synthetic account setup; never runs on API startup."""
import argparse
import os
from pathlib import Path
from uuid import uuid5, NAMESPACE_URL
import httpx
from sqlalchemy import select, text
from .shared import config
from .shared.db import Base, engine, Session, Profile, Shipment

ACCOUNTS = [
 ('customer.a@parcelcare.demo','May Thu','customer'),
 ('customer.b@parcelcare.demo','Aung Min','customer'),
 ('rider.a@parcelcare.demo','Ko Lin','rider'),
 ('rider.b@parcelcare.demo','Nyi Nyi','rider'),
 ('staff@parcelcare.demo','Su Htet','staff'),
]

def migrate():
    if engine.dialect.name == 'sqlite':
        Base.metadata.create_all(engine); print('Local schema ready.'); return
    migration = Path(__file__).resolve().parents[1] / 'migrations' / '001_reporting.sql'
    with engine.begin() as connection:
        # Serialize simultaneous first deploys and record exactly which SQL was applied.
        connection.execute(text('SELECT pg_advisory_xact_lock(74267123)'))
        connection.execute(text('CREATE TABLE IF NOT EXISTS parcelcare_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'))
        connection.execute(text('ALTER TABLE parcelcare_migrations ENABLE ROW LEVEL SECURITY'))
        connection.execute(text('REVOKE ALL ON TABLE parcelcare_migrations FROM anon, authenticated'))
        if not connection.scalar(text("SELECT version FROM parcelcare_migrations WHERE version='001'")):
            for statement in migration.read_text(encoding='utf-8').split(';'):
                if statement.strip(): connection.execute(text(statement))
            connection.execute(text("INSERT INTO parcelcare_migrations(version) VALUES ('001')"))
    print('Migration 001 applied or already present.')

def seed():
    password = config.DEMO_PASSWORD
    if len(password) < 12: raise SystemExit('Set DEMO_PASSWORD to at least 12 characters in the private environment.')
    ids = {}
    if config.AUTH_MODE == 'supabase':
        if not config.SECRET_KEY: raise SystemExit('A backend Supabase key is required.')
        headers = config.privileged_headers()
        with httpx.Client(headers=headers,timeout=30) as client:
            existing = {}; page = 1
            while True:
                response = client.get(f'{config.SUPABASE_URL}/auth/v1/admin/users',params={'page':page,'per_page':100})
                if response.status_code != 200: raise SystemExit('Cannot list demo identities. Check backend key permissions.')
                users=response.json().get('users',[])
                existing.update({u['email']:u['id'] for u in users})
                if len(users)<100: break
                page += 1
            for email, name, role in ACCOUNTS:
                if email in existing: ids[email]=existing[email]; continue
                response=client.post(f'{config.SUPABASE_URL}/auth/v1/admin/users',json={'email':email,'password':password,'email_confirm':True})
                if response.status_code not in {200,201}: raise SystemExit(f'Cannot seed {email}; inspect Supabase Auth settings. No credentials were printed.')
                ids[email]=response.json()['id']
            response=client.get(f'{config.SUPABASE_URL}/storage/v1/bucket/{config.BUCKET}')
            if response.status_code == 404 or (response.status_code == 400 and str(response.json().get('statusCode')) == '404'):
                response=client.post(f'{config.SUPABASE_URL}/storage/v1/bucket',json={'id':config.BUCKET,'name':config.BUCKET,'public':False,'file_size_limit':5*1024*1024,'allowed_mime_types':['image/jpeg','image/png']})
                if response.status_code not in {200,201}: raise SystemExit('Could not create private evidence bucket.')
            elif response.status_code != 200 or response.json().get('public'):
                raise SystemExit('Evidence bucket is unavailable or public. Configure a private bucket before proceeding.')
    else:
        if len(config.SESSION_SECRET)<32: raise SystemExit('Set a local SESSION_SECRET of at least 32 characters.')
        ids={email:str(uuid5(NAMESPACE_URL,email)) for email,_,_ in ACCOUNTS}
    with Session.begin() as db:
        for email,name,role in ACCOUNTS:
            if not db.get(Profile,ids[email]): db.add(Profile(id=ids[email],email=email,name=name,role=role))
        db.flush()
        for tracking,customer,rider,label,destination in [
            ('PC-1001','customer.a','rider.a','Everyday essentials','Sanchaung, Yangon'),
            ('PC-1002','customer.a','rider.a','Home & living','Kamayut, Yangon'),
            ('PC-2001','customer.b','rider.b','Weekend delivery','Bahan, Yangon'),
        ]:
            if not db.scalar(select(Shipment).where(Shipment.tracking_id == tracking)):
                db.add(Shipment(tracking_id=tracking,customer_id=ids[f'{customer}@parcelcare.demo'],rider_id=ids[f'{rider}@parcelcare.demo'],label=label,destination=destination))
    print('Synthetic accounts and shipments ready. Existing account passwords were not changed.')
    for email,_,role in ACCOUNTS: print(f'{role}: {email}')

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['migrate','seed'])
    args=parser.parse_args()
    migrate() if args.command=='migrate' else seed()
