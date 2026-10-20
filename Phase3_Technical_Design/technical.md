# Phase 3 - Technical design

Status: reporting/triage runtimes, initial migration and local tests implemented. Hosted Supabase/Render validation and recovery runtime remain pending. First-flow contracts: [implementation specification](../docs/first-flow-contract.md).

## Structure
```text
frontend/src/
  app/                         # Role routes and layout composition
    customer/
    rider/
    staff/
  features/                    # Business capabilities
    exception-reporting/
    case-tracking/
    address-recovery/
    recovery-review/
    delivery-tasks/
    seller-simulator/          # Internal demo only
  shared/
    api/
    design-system/
backend/
  app/
    features/
      cases/
      shipments/
      approvals/
      tasks/
      ai_agent/
      evidence/
      messaging/
    shared/
  tests/
Phase1_PRD/
Phase2_UIUX/
Phase3_Technical_Design/
Phase4_MVP_Implementation/
docs/
extracted/                     # Reference material, not application code
```

Frontend features own components, hooks, schemas and API adapters as needed. Routes compose features. Shared code serves multiple features; avoid global business-logic buckets and cross-feature internal imports.

Backend features own router, schemas, service and persistence adapters as needed. Shared contains configuration, identity, database clients and common errors. Services enforce policies; frontend visibility and AI prompts are not authorization boundaries. Meaningful policy and integration tests belong in backend/tests/.

## Proposed stack
Next.js + TypeScript + Tailwind + shadcn/ui; independent FastAPI Python backend; Supabase PostgreSQL/Storage with optional Realtime; OpenAI function calling through controlled backend tools. Add pinned dependencies, lockfiles and verified startup commands when runtimes are implemented. An npm workspace cannot install/manage the Python backend.

First-flow implementation uses Next.js/TypeScript and shared semantic React/CSS controls; Tailwind/shadcn are deferred. Pinned npm/Python dependency files and working local commands now exist. Browser API requests go through a same-origin Next.js proxy, with backend-only API_INTERNAL_URL and HttpOnly cookies. Render hosts both application services; hosted data/auth/evidence use Supabase. Explicit synthetic local mode uses SQLite and local uploads for verification only and is rejected in hosted mode. OpenAI is intentionally absent until M2.

Frontend -> authenticated FastAPI -> feature service and policy gate -> database/storage -> audit event. Recorded events trigger AI review/resumption. Validate model output and tool arguments against schemas and current permissions. Never expose backend service-role or OpenAI credentials in the browser.

## Data
shipments, reports, cases, case_events, approvals, messages, tasks, evidence, recovery_jobs. Identity/role records map authenticated users to customer ownership, rider assignment and staff capabilities. Preserve individual reports when attaching them to a case. Store ticket status separately from recovery stage. Bind approvals to actor, case, proposal version, allowed actions, limits and validity; proposal changes invalidate stale approvals. Track task prerequisites, assignment, completion proof and verification separately.

Audit events record actor, action, timestamp and correlation ID; clients cannot rewrite them. Enforce ownership/assignment on reads and writes, scoped storage access and signed URLs. Validate evidence ownership, size and type. Verify seller identity from shipment records. Use synthetic demo data.

## Planned API contracts
| Endpoint | Policy |
| --- | --- |
| GET /health | Basic liveness |
| POST /reports | Customer/rider shipment access; idempotent create-or-match |
| GET /cases; GET /cases/{id} | Role-scoped visibility |
| POST /cases/{id}/recommendations | Authorized review, no recovery side effects |
| POST /cases/{id}/approvals | Authorized staff, explicit proposal scope |
| POST /cases/{id}/address-confirmations | Owning customer and validated address |
| POST /cases/{id}/execute | Authorized staff/internal worker; persist a job and return its ID; recheck approval/version and prerequisites for each action |
| POST /tasks/{id}/completion | Assigned rider; required proof; does not resolve case |
| POST /tasks/{id}/verification | Authorized staff accepts/rejects proof; rejection leaves work open; resolve only after every required outcome |
| POST /cases/{id}/evidence | Scoped validated upload |
| POST /cases/{id}/simulator-messages | Internal demo permission and simulated verified seller |
| POST /cases/{id}/reopen | Authorized staff, accepted evidence/complaint, reason and audit event |
| GET /shipments; GET /shipments/{id} | Customer ownership/rider assignment/staff access; tracking ID is not authorization |
| GET /tasks; GET /tasks/{id} | Assigned rider or authorized staff |
| GET /cases/{id}/events | Role-filtered timeline; exclude staff-only notes from customer/rider output |
| GET /cases/{id}/messages; POST /cases/{id}/messages | Scoped participants; customer replies resume only eligible approved actions |
| GET /cases/{id}/evidence/{evidenceId} | Case access and evidence visibility check before short-lived signed access |
| POST /cases/{id}/assignment | Staff assigns a case owner/manual handler |
| POST /tasks/{id}/assignment | Staff assigns an eligible rider |
| POST /tasks/{id}/blockers | Assigned rider or staff, reason and escalation event |
| POST /cases/{id}/approvals/{approvalId}/revocation | Authorized staff; prevent further approved actions |
| GET /jobs/{id} | Authorized job/case visibility; pending/running/succeeded/failed status |

Use transactions/locking and idempotency keys to prevent duplicate actions and tasks. Preserve distinct issues under the same tracking ID. Record controlled tool execution/failures. Escalate invalid transitions, tool errors and uncertainty instead of reporting success.

## Deployment
Deploy frontend/backend independently. Configure allowed origins, authentication, backend secrets, Supabase migrations, row-level policies and storage rules before sharing a demo. External dispatch and SMS remain mocked and labeled.

## Authentication and storage boundary
Use seeded Supabase Auth identities for customer, rider and staff in the demo. FastAPI validates the token and loads trusted role/ownership records on every protected request. Browser routes and a role picker are not authority. The API owns business writes and evidence authorization; do not let direct browser table/storage writes bypass policies. Any privileged database client must still enforce application-level scope.

## Execution and recovery
Persist recovery_jobs before acknowledging execution; a small Python worker polls pending jobs. Do not rely on request-lifetime background callbacks for recoveries that must survive restart. Persist progress and external-action identifiers; claim jobs transactionally with a lease, and make action retries idempotent. A job status does not replace case status.

Seven AI checks are structured recommendation output, not seven separate autonomous agents. Staff/internal worker triggers recovery; customers/riders can only send their authorized inputs. Outreach requires staff scope; address mutation requires additional confirmed customer input; seller-dependent tasks require explicit seller authority/readiness. Recheck current approval and prerequisites immediately before each side effect. An approval revocation blocks subsequent steps; it cannot undo a message already sent.

Store waiting_on, deadline, proposal version and action progress. The same worker checks deadlines and resumes from recorded replies/events. Model failure leaves review pending with a visible error and manual route. Use bounded retries for transient failures; uncertain outcomes are reconciled/escalated rather than blindly repeated. Database writes and audit/job scheduling must commit together; external integrations remain simulated.

For POST mutations accept an idempotency key scoped to actor/action. Repeating the same key/body returns the prior result; a changed body is a conflict. Use optimistic case/proposal versions for concurrent staff actions. Define typed validation/permission/not-found/conflict errors and never expose another customer's record existence.

## Phase 3 exit gate
Schemas/migrations, identity scope, transition rules, action prerequisites, read/write contracts and restart/retry behavior are specified before their implementation slice is considered ready. Keep runtime modules small; do not introduce a separate message broker, microservices or realtime subscription requirement for this demo.
