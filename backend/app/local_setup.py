"""Create ignored local settings without displaying credentials."""
from pathlib import Path
import secrets

path=Path('.env')
if path.exists():
    print('Existing .env preserved.')
else:
    path.write_text('APP_ENV=local\nAUTH_MODE=local\nDATABASE_URL=sqlite:///./parcelcare.db\nDEMO_PASSWORD='+secrets.token_urlsafe(18)+'\nSESSION_SECRET='+secrets.token_urlsafe(48)+'\n',encoding='utf-8')
    print('Created private backend/.env. Open it locally for the synthetic demo password.')
