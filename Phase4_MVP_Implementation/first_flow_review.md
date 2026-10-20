# M0/M1 implementation and deployment review

Reviewed 2026-10-20, Asia/Rangoon. Status: DEPLOYED / TESTING. Frontend https://parcelcare-web.onrender.com and backend https://parcelcare-api.onrender.com are live. Frontend root, API health and Supabase readiness return HTTP 200. Deployed three-role browser test PASSED; teammate acceptance is pending. Reviewed implementation was committed as d6efa5a; Render's actual deployed SHA has not been supplied. Render deployment uses htoomyatmineain/ParcelCare; local origin remains the original team repository.

| Area | Evidence | State |
| --- | --- | --- |
| Frontend runtime | Next.js production build and TypeScript check pass | Local verified |
| Backend policies | `python -m pytest -q --tb=short`: 10 passed; one upstream Starlette/httpx deprecation warning | Local verified |
| Full reporting flow | Headless Chrome: customer submits -> staff triages -> reporter polls update -> refresh preserves report | Local verified |
| Rider flow | Assigned rider submits a manual-category report; another reporter's case remains inaccessible | Local verified |
| Evidence/internal data | PNG upload/read works for authorized account; other reporter denied; staff-only note absent from reporter output | Local verified |
| Responsive layouts | Customer/rider 320/375/390/768px and staff 768/1024/1440px, no horizontal overflow | Smoke verified; full accessibility review pending |
| Supabase integration | Migration applied; five Auth users, three shipments and private evidence bucket seeded. Full three-role Chrome smoke passed with real Auth, saved reports, staff triage, polling, refresh and photo upload/read | Live verified from local app |
| Supabase security | RLS enabled on all eight application tables; anonymous direct case SELECT denied; evidence bucket private | Live verified |
| PostgreSQL concurrency | Four concurrent requests with one retry key produce one case/report; competing staff writes produce one success and one version conflict | Live verified |
| Render | Both public services respond; frontend /api/health and /api/ready reach the Supabase-backed API | Deployed and checked |
| Deployed full flow | TEST_BASE_URL=https://parcelcare-web.onrender.com with node tests/smoke.cjs --supabase: customer/rider reporting, staff triage, polling, refresh persistence, private notes/evidence, case isolation and planned viewport widths all passed | Automated browser verification passed |
| Team testing | Reusable scenario checklist in docs/demo-setup.md | Pending all teammates |

Local screenshots are ignored artifacts under frontend/artifacts/. Open http://localhost:3000 while the local servers are running. Accounts and private local password location are documented in [setup](../docs/demo-setup.md).

Completed behavior includes scoped sign-in, role routes, shipment selection, actor-specific categories, preserved reports, conservative duplicate matching, related-case hints for staff, staff claim/priority/status updates, public/internal timelines, idempotent mutations, optimistic triage versions and optional private images. No AI output is fabricated or shown as live.

Outstanding release steps: record Render's deployed SHA and every teammate's results, and fix/retest any defects. Keep M0/M1 unaccepted until team testing passes. Detailed contracts: [first flow](../docs/first-flow-contract.md).

The ignored backend/.env now uses AUTH_MODE=supabase and the configured PostgreSQL URI. APP_ENV remains local so the localhost frontend can use HTTP cookies; Render must use APP_ENV=production. Sign out and back in after switching: previous local test sessions are not Supabase sessions. Fixed setup handling for Supabase Storage's HTTP 400 / embedded 404 missing-bucket response, and protected the migration ledger with RLS/revoked browser access.

Later milestones remain unimplemented: recovery execution/verification, OpenAI seven-check review, seller simulator, customer replies, complete manual recovery tasks, duplicate linking and reopening. The first-flow triage UI cannot resolve cases.
