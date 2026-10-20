# Phase 2 - Interfaces and design system

Status: design specification; screens not implemented.

## Relevant skill
Apply MengTo's [design-first-ui-prompting](https://github.com/MengTo/Skills/blob/main/agent-skills/ui/design-first-ui-prompting/SKILL.md): define persona, success criteria, layout, typography, color, copy and constraints before screen generation. Reviewed for this revision; not installed locally. Game, shader, 3D and marketing-page workflows are outside this operational application's needs.

## Shared design constraints
Minimal operational UI. Proposed tokens: background #F8FAFC, surface #FFFFFF, text #0F172A, primary action #1D4ED8; spacing 4/8/12/16/24/32px. System sans-serif, body 16px with 1.5 line height, headings 24-32px at weight 600. Use blue as action accent; status colors always have text/icon labels.

Tokens belong in frontend/src/shared/design-system/. Implement with Tailwind and shadcn/ui. Check WCAG AA text contrast, keyboard focus, associated labels and actionable inline errors; honor reduced motion.

## Customer: mobile first
Routes: /customer, /customer/reports/new, /customer/cases/[caseId].

Single column from 320px, 16px side padding, minimum 44px touch targets and full-width primary actions; no horizontal page scroll. Bottom navigation: Home and Cases; account for device safe areas. A small authenticated identity/sign-out menu replaces a full account-management feature in the MVP. Add /customer/cases for the case list.

Home shows deliveries and case summaries. Report flow: tracking ID -> issue -> description/evidence -> review -> submit. Show upload progress, retry and camera-permission alternatives. Case detail shows plain-language status, timeline and one next action. Address confirmation displays the proposed address and requires explicit customer confirmation before scheduling.

## Rider: mobile first
Routes: /rider, /rider/reports/new, /rider/tasks/[taskId].

Same mobile spacing and touch constraints. Bottom navigation: Tasks and Report; authenticated identity/sign-out is available in the header. Prioritize destination, task state and next action. Failed-attempt report captures tracking ID, issue, notes and optional evidence. Completion requires proof; blockers capture a reason and alert staff. Distinguish proof submitted from outcome verified.

On network failure preserve current form in memory while the page remains open, warn before navigating away and provide explicit retry. Do not claim offline submission or store sensitive evidence in browser storage. Backend idempotency prevents duplicate retries.

## Staff: desktop workspace
Routes: /staff and /staff/cases/[caseId].

At 1024px and above use sidebar navigation, filterable queue and case details. Show shipment context, seven AI checks, proposal scope/limits, approvals, customer/seller messages, evidence, task readiness and audit timeline. Below 1024px stack panels and use cards or contained table scrolling.

Actions: "Approve address recovery", "Decline AI recovery", "Assign for manual handling". Escalations display the staff owner and reason; avoid an ambiguous staff-to-staff escalation button without a destination. Display pending, approved, expired and declined approval states. Clearly label internal seller simulator and all simulated replies; support approve/request evidence/decline/defer.

## Acceptance
- Loading, empty, validation error, network error and success states for every data view/action.
- Backend enforces customer ownership, rider assignment and staff permissions.
- Customer/rider viewport checks: 320, 375, 390 and 768px; staff: 768, 1024 and 1440px.
- Check keyboard navigation, screen-reader labels, long addresses, large text, safe areas and upload failures.
- Task completion alone must never display Resolved; use verified backend case state.

## Workflow visibility
Show separate ticket status, recovery stage and waiting reason. Staff can see pending customer confirmation, pending seller decision, response deadline, revoked/stale approval and rejected proof. Approval cards state what outreach is permitted and what later actions still require consent. Customer/rider timelines exclude internal reasoning, other reporters' personal data and staff-only seller messages.

Provide staff actions to assign a rider, record a blocker, review proof, request correction and reopen with a reason. Confirm a case has been verified before displaying Resolved. Poll for durable updates in the demo; Realtime is optional. Do not require a manual page refresh to notice task or approval changes.

## Phase 2 exit gate
Screen specifications cover each Phase 1 action, including waiting, denied/stale approval, blocked task, proof rejection and recovery after a failed request. Routes/navigation are complete and match Phase 3 contracts. Implemented screens must pass the viewport/accessibility checks before UI delivery is marked complete.
