from datetime import datetime, timedelta, timezone
import secrets
import httpx
import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession
from . import config
from .db import Profile, db_session

def authenticate(email: str, password: str, db: DBSession):
    if config.AUTH_MODE == 'supabase':
        try:
            result = httpx.post(f'{config.SUPABASE_URL}/auth/v1/token?grant_type=password', headers={'apikey': config.PUBLIC_KEY}, json={'email': email, 'password': password}, timeout=20)
            if result.status_code != 200: raise HTTPException(401, 'Email or password is incorrect.')
            return result.json()['access_token']
        except httpx.HTTPError: raise HTTPException(503, 'Sign-in service is unavailable. Please retry.')
    if not config.SESSION_SECRET or not config.DEMO_PASSWORD:
        raise HTTPException(503, 'Configure local demo password and session secret first.')
    profile = db.scalar(select(Profile).where(Profile.email == email.lower()))
    if not secrets.compare_digest(password, config.DEMO_PASSWORD) or not profile:
        raise HTTPException(401, 'Email or password is incorrect.')
    return jwt.encode({'sub': profile.id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)}, config.SESSION_SECRET, algorithm='HS256')

def current_user(request: Request, db: DBSession = Depends(db_session)):
    token = request.cookies.get('parcelcare_session')
    if not token: raise HTTPException(401, 'Please sign in.')
    if config.AUTH_MODE == 'supabase':
        try:
            result = httpx.get(f'{config.SUPABASE_URL}/auth/v1/user', headers={'apikey': config.PUBLIC_KEY, 'Authorization': f'Bearer {token}'}, timeout=15)
            if result.status_code != 200: raise HTTPException(401, 'Session expired. Please sign in again.')
            user_id = result.json()['id']
        except httpx.HTTPError: raise HTTPException(503, 'Identity service is unavailable.')
    else:
        try: user_id = jwt.decode(token, config.SESSION_SECRET, algorithms=['HS256'])['sub']
        except jwt.PyJWTError: raise HTTPException(401, 'Session expired. Please sign in again.')
    profile = db.get(Profile, user_id)
    if not profile: raise HTTPException(403, 'This account has no ParcelCare access.')
    return profile
