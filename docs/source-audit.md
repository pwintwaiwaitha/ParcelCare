# Source and design-skills audit

Reviewed 2026-10-20. Original repository contained planning Markdown and extracted references, with no application source, package manifests or local design skills.

## ZIP inventory and precedence
ParcelCare.zip contains one PDF, six PNG diagrams/tables and AI analysis 7 checks.txt. Counterparts remain in extracted/ParcelCare/; extracted/pdf.txt is a PDF text transcription. Preserve the archive and original references.

The PDF defines the staff-approved recovery workflow, three dashboards, internal seller simulator, proposed stack and 48-hour boundary. Customer/rider exception tables have broader scope than the MVP. The ticket lifecycle diagram includes OPEN, TRIAGED, IN_PROGRESS, RESOLVED, waiting, escalation and reopening states. Preserve this source context while limiting automated flows to the PDF's MVP.

The general mermaid diagram also shows tracking alerts and safe automated action. Treat tracking-alert ingestion as future integration and use the updated PDF's mandatory staff activation for this MVP. The document-collection image calls for PRD, workflow, AI agent, database/API and test scenarios; these are covered across Phases 1, 3 and 4, with implementation tests still pending.

## Corrections
- All four phases now cover customer, rider and staff, with mobile-first customer/rider acceptance criteria.
- Separated ticket status from recovery stage; restored reopening and seven AI checks.
- Kept staff activation mandatory; future low-risk automation and commercial pricing remain outside current implementation.
- Standardized staff route naming and separated role routes from business feature slices.
- Kept four phase folders at root rather than duplicating them under docs/.
- Removed misleading npm-managed Python backend assumptions, unmatched Markdown fence and the claim that no open decisions remained.
- Added tracked feature scaffolds without claiming working applications.

## MengTo assessment
[Repository](https://github.com/MengTo/Skills) and [design-first-ui-prompting skill](https://github.com/MengTo/Skills/blob/main/agent-skills/ui/design-first-ui-prompting/SKILL.md) were reviewed. The relevant guidance is applied in Phase 2 through explicit persona, layout, typography, color and constraints.

There was no local SKILL.md or MengTo instruction before review. Current use is documented guidance applied in this revision, not an installed/automatically loaded skill. No third-party code was copied. Game, shader, 3D and marketing workflows are irrelevant to current scope; none were present to remove.

## Remaining work
Implement applications, migrations, auth, recovery tools and tests using Phase 4. This review does not certify runtime behavior because no application exists yet.

## First-flow implementation update — 2026-10-20
The scaffold-only observations above describe the earlier source review. A Next.js/FastAPI reporting/triage candidate now exists with local synthetic auth, SQLite persistence, evidence controls, initial PostgreSQL migration, Supabase integration code and Render Blueprint. Local policy/browser checks are recorded in [demo setup](demo-setup.md). Live Supabase, deployed Render behavior and team acceptance remain unverified. Recovery, AI and seller workflows remain pending. Shared CSS/React controls are used for the first release; Tailwind/shadcn are deferred.
