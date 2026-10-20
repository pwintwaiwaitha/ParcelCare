# Feature milestones and team test tracker

Updated 2026-10-20 (Asia/Rangoon). Status: M0/M1 deployed on Render with live Supabase. Frontend/API readiness checks pass; deployed browser checks and teammate acceptance are tracked in first_flow_review.md. No teammate acceptance is claimed. This supplements build_plan.md; it does not replace the four phase specifications. Setup: [demo guide](../docs/demo-setup.md); detailed contracts: [first flow](../docs/first-flow-contract.md).

## Agreed scope

User accepted: staff can complete recovery manually inside ParcelCare after declining AI; wrong-item demo uses one return-then-replacement sequence; broader source exception categories are selectable and enter manual triage. Automated recovery remains limited to the PDF MVP. Supabase Auth/PostgreSQL/Storage are integrated, and both app services are deployed on Render. OpenAI integration remains M2 work. Deployment uses the user's htoomyatmineain/ParcelCare repository; the local origin still points to the original team repository.

## First two-hour release

Target M0 + M1: authenticated customer/rider report -> persisted case -> staff queue/triage -> reporter timeline. This is a useful first working flow, not the full recovery MVP. Two hours is a timebox estimate, not a commitment; starting from README scaffolds plus external setup makes the complete MVP unrealistic in that window.

| Elapsed budget | Deliverable | Stop rule |
| --- | --- | --- |
| 0-15 min | Verify local runtimes, Render access and GitHub integration; create/configure Supabase; freeze report contract and role policy | Missing account access is a deployment blocker; record it immediately |
| 15-40 min | Initialize apps, seed identities/shipments, migrations, token checks; deploy role shells and health endpoint | Trigger deployment early; if it fails, fix hosting before adding recovery |
| 40-85 min | Build reporting, minimal role-scoped queue/detail/timeline, staff triage, persistence and idempotent retry | Keep UI simple; no seller workflow or recovery worker in this release |
| 85-105 min | Redeploy, verify remote reads/writes, refresh persistence, role isolation and retry behavior | Failed isolation or persistence blocks release acceptance |
| 105-120 min | Every teammate tests the same release; record defects, fix critical issues and retest if time allows | If tests/fixes exceed budget, release remains TESTING; do not claim completion |

Aim to include a basic private evidence upload. If it cannot be completed, explicitly defer uploads and mark M1 partial; do not display a working upload control. Do not substitute browser memory/localStorage for shared persistence. If Supabase setup blocks progress, a deployed shell is M0 partial, not a completed reporting flow. Live AI is M2; a labeled sample preview is optional and cannot satisfy M2.

## Working method: repeat all four phases for every milestone

1. Phase 1: freeze the small feature's actors, rules, outcomes and failure cases.
2. Phase 2: specify the relevant screens, actions, and loading/empty/error states.
3. Phase 3: specify its fields, constraints, request/response schemas, permissions and transitions; implement migrations alongside code.
4. Phase 4: implement, run relevant checks, deploy, collect every teammate's test result, repair and retest defects.

Finish/deploy/test one usable flow before beginning the next. Keep stable prior flows working. A scaffold, local success, or unchecked team test is not completion.

Status vocabulary: NOT STARTED -> SPEC READY -> BUILDING -> DEPLOYED / TESTING -> ACCEPTED. Use BLOCKED with an owner/reason when needed. Only ACCEPTED means finished; acceptance requires all team members' results for the release plus no unresolved blocker/major defect. Named owners and the team roster must be entered before the first test session.

## Milestone board

Human feature owners and teammate test results remain UNASSIGNED/pending. Frontend: https://parcelcare-web.onrender.com ; backend: https://parcelcare-api.onrender.com . Record Render's actual deployed commit SHA during team testing; the reviewed source baseline is d6efa5a.

2026-10-20 update: user confirmed team testing is still in progress. The reference-based teal/yellow light/dark refresh is tracked in DESIGN.md and docs/design-review.md. M2 readiness and missing backend API credentials are recorded in docs/m2-readiness.md; M0/M1 remain DEPLOYED / TESTING.

| ID | Usable milestone / MVP feature | Depends on | Status |
| --- | --- | --- | --- |
| M0 | Render deployment, seeded sign-in, three role shells, persistent shipment access | Hosting/data setup | DEPLOYED / TESTING — teammate acceptance pending |
| M1 | Customer/rider reporting, evidence, staff triage, own-case tracking | M0 | DEPLOYED / TESTING — teammate acceptance pending |
| M2 | Live structured AI triage with seven checks and manual fallback | M1 | NOT STARTED |
| M3 | Wrong-address recovery through verified redelivery | M2 | NOT STARTED |
| M4 | Complete manual recovery, duplicate review and reopening paths | M3 | NOT STARTED |
| M5 | Wrong-item seller simulation, return then replacement | M4 | NOT STARTED |
| M6 | Damage evidence/escalation and manual-category handling | M4; M5 precedes by delivery order | NOT STARTED |
| M7 | Full-demo regression, restart/deadline checks, team acceptance | M5, M6 | NOT STARTED |

### M0 — deployed foundation

- [x] Initialize pinned Next.js/TypeScript and FastAPI runtimes with reproducible startup/build instructions and secret-free environment examples.
- [x] Connect GitHub to Render: frontend Node web service rooted at frontend/, FastAPI web service rooted at backend/; record actual working commands.
- [x] Configure the server-side frontend API proxy, same-origin request verification, health check and backend-only secrets.
- [x] Create Supabase migrations and synthetic seed data; seed customer A/B, rider A/B and staff identities with trusted role mappings.
- [x] Sign-in/sign-out and role routes; backend validates identity and scopes shipment reads. A route/role picker grants no permissions.
- [x] Restrict direct database/storage access; keep privileged keys out of frontend assets.
- [ ] Team test: open remote URL, sign in by role, see only permitted shipments; sign out; verify refresh and backend health.

### M1 — report to staff triage and reporter timeline

- [x] Freeze report fields: tracking ID, source actor, category, description, evidence references, idempotency key; define response with case ID and preserve individual report IDs in case detail. See first-flow contract.
- [x] Customer and assigned rider can submit reports; all source categories selectable, with manual-only labels outside MVP recovery scope.
- [x] Create report/case/event transactionally; exact retries return prior result; changed payload with same key returns conflict.
- [x] Initial conservative matching: only deterministic same-context matches attach automatically; ambiguous reports remain separate and flagged until M4 review. Preserve every report.
- [x] Private evidence upload/download with ownership, type and size checks; handle upload failure without losing the form while open.
- [x] Staff queue/detail with owner, category, priority, status, triage and manual flag; reporter sees scoped case timeline with polling.
- [x] Loading/empty/validation/network states; no internal notes or another reporter's evidence exposed.
- [ ] Team test: submit customer and rider reports, see them as staff, triage, see permitted update as reporter, retry once, refresh, and attempt another customer's case/evidence URL.


### M2 — seven AI checks

- [ ] Specify input snapshot and output schema: classification, summary, priority suggestion, missing fields, duplicate candidates, evidence consistency, next action; uncertainty and source references accompany findings.
- [ ] Persist recommendation/proposal version, input version, model/prompt version and review errors; all seven checks visible to staff.
- [ ] Call OpenAI on backend with schema validation; treat reports/messages as untrusted content, never as authority to execute tools.
- [ ] Evidence not actually inspected is marked NOT ASSESSED; do not claim photo consistency from filenames or metadata alone.
- [ ] Model timeout/invalid output leaves visible pending/failed review and a manual route. A fixture is labeled and never counted as live AI.
- [ ] Test samples: clear wrong address, missing details, potential duplicate, contradictory evidence and manual-only category. Staff can correct classification/priority with an audit event.
- [ ] Team test: generate real review, inspect seven outputs, force provider failure, confirm no recovery side effect occurs.

### M3 — wrong-address recovery end to end

- [ ] Freeze transition matrix and schemas before coding; implement approval/consent/task prerequisites server-side.
- [ ] Staff approves current proposal with allowed actions or declines to manual handling; revoke/stale/version-conflict handling works.
- [ ] Approved outreach creates an in-app confirmation request; customer enters corrected address, selects seeded slot and explicitly confirms the exact version.
- [ ] Backend validates supported zone, shipment state and slot; unavailable/invalid requests remain unresolved and visible to staff.
- [ ] Persist/claim recovery job and action progress; worker rechecks authorization immediately before each action; transactional task/event creation prevents duplicates.
- [ ] Create redelivery task; staff assigns eligible rider; rider sees task, submits proof or reports blocker.
- [ ] Staff accepts/rejects proof; rejected proof requires corrective work. Case resolves only when all required outcomes are accepted.
- [ ] In-app updates and audit timeline appear across the three interfaces.
- [ ] Team test: happy path plus missing confirmation, revoked approval, unsupported address, duplicate execute, wrong rider, blocked task and rejected proof.

### M4 — manual recovery and case corrections

- [ ] Staff declining AI retains an owner and can request input, create permitted manual tasks, assign riders and record handling notes inside ParcelCare.
- [ ] Manual handling uses the same consent, eligibility, evidence and verification rules; bypassing AI approval does not bypass operational permissions. Record staff authority and reason distinctly from AI approval.
- [ ] Duplicate candidate review lets staff link a report or keep a separate case without deleting its provenance; prevent cross-customer disclosure. No destructive whole-case merge is required for this demo.
- [ ] New report against resolved case is preserved; staff explicitly links or reopens with reason.
- [ ] Reopening invalidates prior recovery authority; new work needs a fresh proposal/approval or explicit authorized manual action. Reconcile existing tasks before new ones.
- [ ] Team test: decline AI and complete manually, reject duplicate candidate, preserve two issues on one shipment, reopen with old approval unusable.

### M5 — wrong item: return then replacement

- [ ] Internal labeled simulator uses seller identity from the shipment; record approve/request-evidence/decline/defer decisions and scope.
- [ ] Customer evidence request/reply UI resumes only eligible approved work; seller timeout escalates with persisted deadline.
- [ ] Authorized staff records simulated replacement stock readiness and return destination, with provenance/audit; a promise alone is insufficient.
- [ ] Fixed demo order: verified seller authorization -> return pickup -> staff-verified return receipt at seeded return destination -> replacement-ready confirmation -> replacement delivery -> staff-verified delivery proof.
- [ ] Record return receipt and replacement readiness separately; customer address authorization required if destination changes.
- [ ] Decline/defer/unclear authority/contested liability routes to staff; no refund or liability automation.
- [ ] Team test: happy path, request evidence, approval without stock readiness, rejected return proof, seller decline, repeated reply and deadline expiry.

### M6 — damage and broader manual exceptions

- [ ] Damage report preserves evidence and assigns staff investigation/escalation owner and reason.
- [ ] Case remains open while escalated; escalation is a handoff, never a verified resolution by itself.
- [ ] Staff can record investigation/communications and route to an authorized manual outcome; only verified outcomes permit closure. External work without verified evidence remains outstanding.
- [ ] Other customer/rider categories enter manual triage with no automatic recovery promise; staff may assign/request input/escalate, recording verified outcomes where supported.
- [ ] Team test: damage evidence and staff handoff, missing evidence, manual-only category and attempted premature closure.

### M7 — full MVP acceptance

- [ ] Deploy the worker for durable recovery; demonstrate restart/resume and lease recovery without duplicate task/message.
- [ ] Check concurrent staff actions, idempotency conflicts, stale proposal, revocation between actions and seller deadline.
- [ ] Recheck ownership/assignment, evidence URLs and internal timeline filtering across every flow.
- [ ] Check customer/rider at 320/375/390/768px; staff at 768/1024/1440px; keyboard labels/focus and failure recovery.
- [ ] Every teammate runs the main three-interface recovery and assigned failure scenarios on the recorded release.
- [ ] Document working URLs/commands, synthetic credentials through an appropriate private channel, actual simulated components and remaining limitations.

## Closing the review gaps

These are implementation prerequisites to complete just before the relevant milestone, not claims that detailed designs already exist.

| Gap | Required artifact / decision | Gate |
| --- | --- | --- |
| Database and API detail | Migrations, relationships/constraints, typed request/response/error schemas, list pagination and concurrency fields | Each owning milestone; first M0/M1 |
| Lifecycle | Actor/from/to/prerequisite/event table for cases and tasks, including waits/escalation/rejection/reopen and verified closure | Initial triage M1; full recovery M3 |
| AI rules | Structured seven-check schema, allowed tools, input scope, failure behavior and fixture evaluations | M2 |
| Priorities | Proposed demo default: LOW/NORMAL/HIGH/URGENT, NORMAL at intake; AI only suggests, staff overrides with reason; no invented SLA | Confirm/freeze M1/M2 |
| Matching | Deterministic matching fields and ambiguous-review UX/API; report provenance preserved | Conservative M1; review M4 |
| Address input | Customer editable address/slot and exact-version confirmation; explicit validation response | M3 |
| Approval expiry | No time-based expiry in initial demo; distinguish stale, revoked, declined and consumed/closed. Remove unexplained expired UI state | M3 |
| Manual authority | Explicit manual task/closure permissions, same operational safeguards, distinct audit reason | M4 |
| Seller readiness | Staff-recorded simulated stock and return receipt, authenticated simulator seller decisions, fixed task ordering | M5 |
| Damage closure | Escalation handoff stays open; verified manual outcome required to resolve | M6 |

Priority defaults, detailed matching rules, upload limits and exact schemas above are proposed implementation choices until frozen in the relevant Phase 1/3 feature spec. Do not silently treat them as original source requirements.

## Deployment choices and research

Research checked 2026-10-20 against official documentation. Keep the proposed Next.js + FastAPI + Supabase architecture. Render can host Next.js as a Node service and FastAPI as a Python service; Vercel is not required. Commands must be verified against the generated project rather than copied as already working.

- [Render Next.js](https://render.com/docs/deploy-nextjs-app) and [FastAPI](https://render.com/docs/deploy-fastapi): implementation/deployment references for the two service roots.
- [Render free-service limits](https://render.com/docs/free): free web services sleep after 15 minutes idle and use ephemeral local files. Keep shared data in Supabase, allow cold-start loading, and do not promise always-running jobs on a sleeping web service.
- [Render background workers](https://render.com/docs/background-workers): plan a worker service before M3 recovery acceptance. Verify current plan availability/cost with the team; no paid resource is authorized by this planning document. If hosting cannot run the worker, durable automated recovery remains blocked rather than silently replaced with request callbacks.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [storage access control](https://supabase.com/docs/guides/storage/security/access-control): restrict exposed data and private evidence. Backend privileged credentials still require explicit application authorization.
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling): use explicit schemas/strict mode where supported, validate again in backend, then enforce permission and business rules. Schema conformance is not action authorization.

## Reusable milestone completion record

Copy for each release. All fields are pending until evidence is supplied.

| Field | Value |
| --- | --- |
| Milestone / feature owner | Pending |
| Scope / acceptance scenarios | Pending |
| Git commit and migration version | Pending |
| Frontend / backend deployed URLs | Pending |
| Deployment timestamp (Asia/Rangoon) | Pending |
| Automated checks and results | Pending |
| Team roster | Pending |
| Each tester: role, scenario, expected/actual, pass/fail, evidence | Pending |
| Defects: severity, owner, status, retest result | Pending |
| Known simulated/deferred behavior | Pending |
| Acceptance decision / next discussion | Pending |

Do not store API keys, passwords or privileged connection strings in this tracker. A new deploy invalidates relevant prior test evidence if behavior changed; record the tested commit. This plan authorizes no team messages and claims no completed runtime behavior.
