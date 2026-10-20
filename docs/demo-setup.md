# First-flow demo setup and review

Status: implemented and tested locally against live Supabase Auth/PostgreSQL/Storage; not deployed to Render or team-accepted. Render account setup/access is still required. This release needs no OpenAI key.

## Check the running local app

Open http://localhost:3000. Synthetic accounts:

| Role | Email | Accessible shipments |
| --- | --- | --- |
| Customer A | customer.a@parcelcare.demo | PC-1001, PC-1002 |
| Customer B | customer.b@parcelcare.demo | PC-2001 |
| Rider A | rider.a@parcelcare.demo | PC-1001, PC-1002 |
| Rider B | rider.b@parcelcare.demo | PC-2001 |
| Staff | staff@parcelcare.demo | All seeded shipments/cases |

Local passwords are generated into ignored `backend/.env` under DEMO_PASSWORD. Open the file privately; do not commit or paste it into chat. All synthetic accounts use that password in local mode. These accounts are app users, separate from the email you use to administer Supabase.

For a fresh local checkout, run from backend/:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
.\.venv\Scripts\python.exe -m app.local_setup
.\.venv\Scripts\python.exe -m app.setup migrate
.\.venv\Scripts\python.exe -m app.setup seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal from frontend/:

```powershell
npm ci
# Copy .env.local.example to .env.local if that file does not exist.
npm run dev
```

For a production-build local check: `npm run build`, then `npm run start -- --port 3000`. Use only one frontend process on port 3000. API contract: http://127.0.0.1:8000/docs.

AUTH_MODE=local deliberately uses synthetic local authentication, SQLite and local uploads for development. The current ignored settings have been switched to AUTH_MODE=supabase and the live PostgreSQL database. APP_ENV=local preserves localhost HTTP cookies; Render must use production. Old local sessions require signing in again. No browser-only persistence is used.

## Configure Supabase privately

1. Sign in with your existing Supabase account and create a dedicated demo project. Email sign-in is fine; connecting the ChatGPT app is optional.
2. Copy backend/.env.example to your ignored backend/.env, preserving your local version elsewhere privately if needed. Set APP_ENV=production and AUTH_MODE=supabase.
3. Set SUPABASE_URL (project API URL), SUPABASE_PUBLISHABLE_KEY (publishable/legacy anon key), and SUPABASE_SECRET_KEY (backend secret/legacy service-role key). The secret key must never go in frontend settings.
4. Set DATABASE_URL to the project's PostgreSQL **session pooler** connection URI with its database password and `sslmode=require`. Use `postgresql+psycopg://...`; URL-encode special characters in the password. Session pooling is chosen for this persistent FastAPI process. Never paste the full URI into chat.
5. Set EVIDENCE_BUCKET=parcelcare-evidence and a private DEMO_PASSWORD of at least 12 characters for initial synthetic accounts.
6. From backend/, run `python -m app.setup migrate` then `python -m app.setup seed` with the configured environment (or the venv Python path above). These are explicit writes to this new demo project. Migration runs once; seeding creates five confirmed synthetic Auth users, trusted profiles, three shipments and a private image bucket. Existing account passwords are preserved.
7. Restart the backend after changing its environment. Confirm the bucket is private, sign-in works, direct anonymous table access is denied, and the app can upload/read private evidence. These hosted checks are pending until the actual project is connected.

Do not point this initial migration at an existing unrelated database with conflicting table names. Migration failure rolls back its SQL transaction; review the database before retrying. No database credentials are shipped with the repository.

## Deploy to Render

The tracked render.yaml is a two-free-web-service Blueprint. Render billing/availability still depends on your account; the file is not evidence of deployment. It creates no background worker for this reporting milestone.

1. Push the reviewed implementation to the GitHub branch you want Render to deploy. Leave unrelated existing changes out of that commit. This implementation has not automatically committed/pushed anything.
2. In Render, create a Blueprint from this repository and review its two services. The repository root is ParcelCare/, so rootDir values are frontend/ and backend/.
3. For parcelcare-api enter APP_ENV=production, AUTH_MODE=supabase and the same private DATABASE_URL/SUPABASE settings above. The Blueprint supplies the non-secret defaults; never use AUTH_MODE=local on Render.
4. Backend build: `pip install -r requirements.lock.txt`. Start: `python -m app.setup migrate && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Health: `/ready`. The migration command is safe to repeat and serializes concurrent first starts. Seed once before asking teammates to sign in.
5. For parcelcare-web set API_INTERNAL_URL to the actual deployed backend HTTPS URL. Frontend build: `npm ci && npm run build`; start: `npm run start -- --port $PORT`. No Supabase secrets belong in this service. No NEXT_PUBLIC API setting is necessary.
6. Open the frontend URL, run the checklist below with separate browser profiles, and record the actual deployed commit/URLs in the milestone tracker.

The frontend uses a same-origin API proxy so sign-in cookies work across separate Render service domains without third-party cookie settings. Free services can cold-start: give the first request time, then retry if needed. PostgreSQL and evidence persist in Supabase across Render restarts.

## Teammate test script

- [ ] Customer A reports PC-1001 with a meaningful description and optional PNG/JPEG photo; case and timeline appear.
- [ ] Refresh: the case remains saved; clicking the photo works only while authorized.
- [ ] Staff opens the case, chooses TRIAGED, sets priority, adds public update plus an internal note, and saves.
- [ ] Customer A sees the public update automatically within the polling interval; internal note is absent.
- [ ] Customer B cannot see customer A's case or evidence, including guessed/copied URLs.
- [ ] Rider A can report PC-1001; rider B cannot report that shipment.
- [ ] Staff can see the rider report. Customer A does not automatically receive the rider's private report contents.
- [ ] Failed requests can be retried; repeated identical retry keys do not duplicate writes. Changed payload with the same key conflicts.
- [ ] A stale staff form is rejected rather than silently overwriting newer work.
- [ ] RESOLVED is unavailable in this milestone; neither evidence submission nor triage resolves a case.
- [ ] Everyone records tested commit, role, expected/actual result and defects. The milestone remains DEPLOYED / TESTING until all pass.

## Verification performed locally

- Backend policy suite: 10 tests passed, including mocked Supabase identity mapping and key-header checks. Supabase mocks do not replace live integration verification.
- Next.js optimized build and TypeScript validation passed.
- Headless Chrome tested actual customer/rider report submission, staff triage, reporter polling, refresh persistence, private notes/evidence and case isolation.
- Browser checks cover customer/rider 320/375/390/768px and staff 768/1024/1440px without horizontal page overflow. This is a smoke check, not a full screen-reader audit.
- Screenshots are local ignored artifacts: frontend/artifacts/customer-case-mobile.png and staff-triage-desktop.png.

The full browser smoke also passed against live Supabase using `node tests/smoke.cjs --supabase`: real sign-in, reporting, staff triage, polling, refresh persistence, private notes/evidence and role isolation. RLS and private bucket settings were checked live. Actual Render deployment/cold starts and teammate acceptance remain unverified. OpenAI, recovery execution, seller simulation, messages/replies, manual task completion and reopening belong to later milestones.
