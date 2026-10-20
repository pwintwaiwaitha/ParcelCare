# Phase 1 - Product requirements

Status: reviewed specification; software not implemented.

## Baseline
The PDF in extracted/ParcelCare/ defines the current MVP. AI investigates and recommends; authorized staff activates bounded recovery; physical completion and verification remain required. Staff approval never substitutes for customer confirmation, verified seller authorization or delivery proof.

## Three interfaces
| User | Interface | Capabilities |
| --- | --- | --- |
| Customer | Mobile first | Report with tracking ID, details and optional evidence; view own case timeline; confirm corrected address; receive updates |
| Rider | Mobile first | Report failed attempts; see assigned tasks; report blockers; submit completion proof |
| Staff | Responsive desktop workspace | Triage queue; review seven AI checks; approve/decline a specific recovery proposal; manage escalations, messages, tasks and audit history |

Seller Chat Simulator is internal demo tooling, not a fourth public interface.

## MVP flows
- Wrong address: report -> create/match -> recommendation -> staff approval -> customer confirms address -> validate zone/parcel/slot -> redelivery task -> rider proof -> verification -> resolution.
- Wrong item: collect evidence; after staff approval contact verified seller through simulator. Explicit authorization and operational readiness are required before return/replacement tasks. Promised replacement does not mean ready for dispatch.
- Damaged parcel: evidence and staff escalation; seller coordination may be demonstrated, but no automated liability decisions.
- Include all three interfaces, scoped approval, task tracking and audit history.
- Exclude real SMS, live warehouse integrations, refunds, production billing and automatic low-risk activation.

## Broader source catalog
Customer tables also list delayed delivery, missing parcel, delivered but not received and rescheduling. Rider tables also list unavailable/unreachable customer, refusal, accident, vehicle breakdown, lost parcel and access problems. Preserve these as future/manual-triage categories; automated recovery for them is outside this MVP.

## Lifecycle
Source ticket states: OPEN -> TRIAGED -> IN_PROGRESS -> RESOLVED. Additional states: WAITING_CUSTOMER, WAITING_RIDER, ESCALATED and REOPENED. Accepted new evidence or complaint can reopen a resolved case with an audit event.

Track recovery stages separately: recommendation, approval pending, approved execution, physical work and verification. These stages do not replace ticket status. Declining AI activation leaves a manual handling route.

## AI checks and boundaries
Seven checks: exception classification, complaint summary, priority suggestion, missing data, duplicate detection, evidence consistency and recommended next action. Record uncertainty and escalate ambiguous decisions.

Match by tracking ID plus issue context; preserve each source report and its evidence. Different issues can create separate cases. AI similarity alone must not authorize a merge.

Resolve only after all required outcomes are verified. Escalate missing evidence, invalid addresses, unclear authority, contested liability, seller decline/defer and blocked tasks. AI cannot authorize refunds, invent seller consent or resolve unfinished shipments.

## Demo policy defaults
These are implementation defaults for synthetic demo data, not validated courier operating policy.

| Decision | MVP default |
| --- | --- |
| Approver/verifier | Seeded authorized staff permission; customers/riders cannot grant it or verify their own completion |
| Delivery/pickup proof | Assigned rider submits a photo and completion note; authorized staff reviews and accepts/rejects proof |
| Approval scope | Valid for the current proposal version until revoked or case resolution; changed scope requires a new approval |
| Seller wait | Persist a 24-hour response deadline; then escalate without automatic external retries; allow a short seeded deadline for demonstrations |
| Address eligibility | Seeded supported zones and slots; reject unsupported zone, unavailable slot or a shipment already delivered/returned |
| Duplicate matching | Same shipment and issue with an active matching case becomes a candidate; auto-attach only when context clearly agrees, otherwise staff reviews |
| Resolved-case report | Preserve the new report and offer staff an explicit reopen/link decision; never silently discard it |

Review these defaults before production. Exact real-world roles, proof rules, zones and notification policy remain business decisions.

## Action prerequisites
Staff approval permits only the proposed actions. Approved outreach can request customer confirmation or seller authorization without already possessing that confirmation. Updating an address/scheduling redelivery additionally requires customer confirmation and eligibility checks. Return/replacement tasks additionally require the seller's explicit decision and the relevant readiness checks. Every write rechecks its own prerequisites; do not use one blanket consent gate for all execution.

When waiting for a seller, keep IN_PROGRESS and record waiting_on=SELLER plus a deadline rather than inventing a new source ticket status. Customer/rider waits use their source waiting states. If evidence is optional at intake, missing evidence blocks only the actions that require it; collect it when possible and escalate when the prerequisite remains unmet.

## Phase 1 exit gate
Each MVP flow has an actor, prerequisite, allowed action, outcome and escalation path. Demo policy defaults are explicit, and the broader exception catalog is distinguished from implemented recovery scope.

