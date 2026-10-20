# Phase 4 - MVP implementation checklist

Status: documentation and directory scaffold only. All application delivery items below are pending.

## Foundations
- [ ] Initialize Next.js/TypeScript frontend and FastAPI backend independently; pin dependencies and document verified startup commands.
- [ ] Add secret-free environment examples, Supabase migrations, scoped auth/storage policies and synthetic seed data.
- [ ] Implement customer/rider/staff route shells, health endpoint and Phase 2 tokens/layouts.
- [ ] Seed authenticated demo identities and enforce backend ownership/assignment/permission checks; a frontend role switch must not grant authority.
- [ ] Implement Phase 1 demo policy defaults, durable recovery jobs, transactional audit writes and a polling worker with deadline handling.

## Reports and triage
- [ ] Customer mobile reporting, evidence and case timeline.
- [ ] Rider mobile failed-attempt reporting and assigned tasks.
- [ ] Staff case queue/detail, seven AI checks, scoped approval/revocation, owner/rider assignment, manual handling and audit history.
- [ ] Scoped shipment/task/event/message reads support all screens; customer/rider timelines omit internal staff data.
- [ ] Create/match using tracking ID plus issue context; preserve reports/evidence and handle retries transactionally.

## Recovery slices
- [ ] Wrong address: staff approval, customer confirmation, zone/state/slot checks, controlled update, redelivery task, rider proof and authorized verification.
- [ ] Wrong item: labeled seller simulator, explicit seller authorization, evidence requests and readiness before return/replacement tasks.
- [ ] Damage: evidence and staff escalation; no automated refund/liability decision.
- [ ] Decline/defer, missing evidence, invalid address and blocked task route to manual/escalation paths.
- [ ] Auditable reopening on accepted new evidence/complaints.

## Verification and demo
- [ ] Customer sees only own cases; rider only assigned work; unauthorized users cannot approve or execute.
- [ ] Missing/revoked/stale staff approval blocks recovery. Approved outreach can collect consent; address changes and seller-dependent tasks reject missing action-specific confirmation/authorization server-side.
- [ ] Retries cannot duplicate cases/actions/tasks; different issues remain distinguishable.
- [ ] Proof submission does not resolve a case before all required outcomes are verified.
- [ ] Backend tests cover policy gates, lifecycle, matching, retries, escalation and verification.
- [ ] UI smoke checks cover all three interfaces, loading/empty/error/success states, keyboard use and Phase 2 viewports.
- [ ] Demo uses synthetic data and labeled simulated integrations. Publish only working commands and explicitly list remaining gaps.

Definition of done: demonstrate report -> triage -> recommendation -> staff approval -> consent/policy checks -> controlled task -> physical completion -> verified resolution, plus escalation, through the relevant customer/rider/staff interfaces.

## Delivery order and limits
Build one thin wrong-address slice through all three interfaces first. After its approval/consent/task/verification gates pass, reuse them for wrong-item simulation, then damage escalation. Realtime, account management, other recovery categories and production integrations can wait. The source's 48-hour target is a demo ambition, not a verified delivery estimate; reopening and failure checks remain pending until demonstrated.

## Required scenario evidence
| Scenario | Expected result |
| --- | --- |
| Approved outreach before customer confirmation | Contact/confirmation request allowed; address mutation still blocked |
| Seller approves but replacement is not ready | Record decision; no replacement dispatch yet |
| Rider submits proof; staff rejects it | Case remains unresolved; corrective work is visible |
| Worker restarts or reply arrives twice | Persisted job resumes without duplicate message/task |
| Approval revoked or proposal changes while queued | Subsequent actions stop pending valid authorization |
| Seller deadline passes without reply | Staff escalation and audit event |
| Two reports for same issue; different issue on same shipment | Preserve both reports; attach confirmed match only; keep distinct issue separate |
| New complaint after resolution | Preserve report and require explicit staff reopen/link decision |
| Customer guesses another tracking/case/evidence ID | No unauthorized data or signed evidence URL |

## Phase gates
- Phase 1: product scope, actors, demo policies and outcomes are explicit.
- Phase 2: screen flows cover each action and failure/wait state; verify responsive behavior when screens exist.
- Phase 3: contracts, migrations, authorization and durable execution are ready for the current implementation slice.
- Phase 4: mark a checklist item complete only with implemented behavior and relevant verification evidence. A folder or document alone is not implementation completion.
