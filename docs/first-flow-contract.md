# First-flow contract: reporting and staff triage

Implemented scope: M0/M1 local candidate. Hosted Supabase/Render acceptance is pending. No OpenAI key is needed for this milestone.

## Actors and visibility

- Customer can read owned shipments and report against them. Rider can read assigned shipments and report against them.
- Reporter reads cases they personally reported, their own report text/evidence, and public updates. A tracking number never grants access. Customer and rider reports are not exposed to each other automatically.
- Staff reads the queue, all report details/evidence and internal notes. Only staff can triage and claim ownership. No signup or role-changing endpoint exists.
- Supabase Auth identity is verified by the backend, then mapped to trusted profiles. Role metadata supplied by a browser is ignored. Local mode uses synthetic accounts and signed, one-hour sessions; hosted mode refuses local auth/SQLite.

## Data and matching

`backend/migrations/001_reporting.sql` defines profiles, shipments, cases, reports, append-only-through-API events, mutation receipts and evidence. Runtime business writes use SQLAlchemy transactions. Direct anon/authenticated table access is revoked and RLS enabled; the privileged backend still scopes every query.

New report fields: tracking_id (1–40 chars), allowed actor-specific category, description (10–3,000 trimmed chars). Evidence is optional and uploaded after the report is safely saved. PNG/JPEG magic bytes and 5 MB limits are checked; storage keys use generated IDs, never filenames.

Only an exact same-reporter / same-shipment / same-category / same-description match on an unresolved case attaches automatically. Every new submission key preserves a separate report. Different contexts or reporters create separate cases; related cases are visible to staff as review candidates. Staff linking is deferred to M4. Resolved cases never silently reopen in this milestone.

`Idempotency-Key` is required for reports, triage and evidence. Same actor/action/key/body reuses the result; a different body conflicts. Receipts, business writes and events commit together. PostgreSQL shipment/case row locks serialize concurrent matching/triage/evidence. SQLite tests verify policy and persistence, not PostgreSQL lock semantics.

## Initial state transitions

| From | Staff may move to |
| --- | --- |
| OPEN | TRIAGED, ESCALATED |
| TRIAGED | IN_PROGRESS, WAITING_CUSTOMER, WAITING_RIDER, ESCALATED |
| IN_PROGRESS | WAITING_CUSTOMER, WAITING_RIDER, ESCALATED |
| WAITING_CUSTOMER / WAITING_RIDER | IN_PROGRESS, ESCALATED |
| ESCALATED | TRIAGED, IN_PROGRESS, WAITING_CUSTOMER, WAITING_RIDER |

Same-status updates are allowed with a meaningful public update. Priority LOW/NORMAL/HIGH/URGENT defaults to NORMAL. Saving triage assigns the authenticated staff member, advances the case version and writes public and optional internal events. Stale versions conflict. The UI preserves a staff draft when a newer version appears and requires adopting the current case state before retrying. RESOLVED/REOPENED transitions are not available until their verified recovery/reopening milestones.

## API

Interactive schemas: backend `/docs`; machine contract `/openapi.json`.

| Route | Result / scope |
| --- | --- |
| GET /health; GET /ready | Liveness; database/schema readiness |
| POST /auth/login; POST /auth/logout | One-hour HttpOnly session cookie; clears cookie on sign-out |
| GET /me | Trusted identity/role and allowed report categories |
| GET /shipments | Owned/assigned shipments; staff can read all |
| GET /cases?offset=0&limit=50 | Scoped queue, newest update first, max page size 100 |
| GET /cases/{uuid} | Scoped reports, visible events/evidence, permitted staff transitions |
| POST /reports | `{tracking_id, category, description}` -> `{case_id}` |
| POST /cases/{uuid}/triage | `{version, status, priority, update, internal_note?}` -> current detail |
| POST /cases/{uuid}/evidence | Multipart file -> `{id}`; reporter only |
| GET /cases/{uuid}/evidence/{uuid} | Authenticated image stream; uploader or staff only |

Error body: `{detail: string}` or FastAPI typed validation details. 401 sign-in/session, 403 permission/request verification, 404 scoped absence, 409 retry/version/transition conflict, 413 oversize, 422 invalid data, 503 unavailable provider/database/storage. Never reveal another reporter's existence via case/evidence lookups.

The browser calls same-origin `/api/*`; Next.js proxies to the configured backend. Mutation requests require a custom header and cross-site browser requests are rejected. No permissive cross-origin API configuration is needed. Hosted cookies are Secure, HttpOnly and SameSite=Lax; responses are not cached. Sessions expire rather than silently refresh in this release.

## Screens and acceptance

Sign-in -> role workspace -> new report -> saved case and timeline. Staff workspace -> queue search/filter -> case -> status/priority/public update/internal note -> save. Reporter polls every ten seconds and sees public updates without refresh. MMT timestamps use Asia/Rangoon explicitly.

Forms show validation/network errors and preserve in-page values. A failed evidence upload leaves the report saved and allows retry without re-creating the report; a local file is not retained across browser refresh. Forms warn before leaving via app navigation or closing the page. Storage remains private; images stream through scoped authorization rather than exposing public URLs.

Acceptance requires a deployed Supabase-backed flow and all teammate test records. Passing local SQLite tests/browser smoke does not satisfy hosted persistence, PostgreSQL concurrency, Supabase Auth/Storage or team acceptance.
