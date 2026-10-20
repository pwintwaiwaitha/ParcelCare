import os
from dotenv import load_dotenv

load_dotenv()
ENV = os.getenv('APP_ENV', 'local')
AUTH_MODE = os.getenv('AUTH_MODE', 'local')
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./parcelcare.db')
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)
SUPABASE_URL = os.getenv('SUPABASE_URL', '').rstrip('/')
PUBLIC_KEY = os.getenv('SUPABASE_PUBLISHABLE_KEY', '')
SECRET_KEY = os.getenv('SUPABASE_SECRET_KEY', '')
BUCKET = os.getenv('EVIDENCE_BUCKET', 'parcelcare-evidence')
SESSION_SECRET = os.getenv('SESSION_SECRET', '')
DEMO_PASSWORD = os.getenv('DEMO_PASSWORD', '')
def privileged_headers():
    # New sb_secret keys belong in apikey; legacy service-role JWTs also work as bearer tokens.
    headers = {'apikey': SECRET_KEY}
    if SECRET_KEY.startswith('eyJ'): headers['Authorization'] = f'Bearer {SECRET_KEY}'
    return headers
if ENV != 'local' and (AUTH_MODE != 'supabase' or DATABASE_URL.startswith('sqlite') or not SUPABASE_URL or not PUBLIC_KEY or not SECRET_KEY):
    raise RuntimeError('Hosted mode requires Supabase Auth, PostgreSQL, URL and backend keys.')
