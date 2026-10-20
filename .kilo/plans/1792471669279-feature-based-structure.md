# ParcelCare feature-based structure plan

Reviewed against ParcelCare.zip. Canonical architecture: [Phase 3](../../Phase3_Technical_Design/technical.md). Delivery gates: [Phase 4](../../Phase4_MVP_Implementation/build_plan.md).

- Separate frontend/ and backend/; organize each by business capability under features/.
- Role routes: customer, rider, staff. Customer/rider are mobile first. Seller simulator is internal demo tooling.
- Keep design tokens in frontend/src/shared/design-system/.
- Backend owns authorization, policy, state transitions, controlled tools and persistence.
- Keep all four existing phase folders at root; do not duplicate under docs/.
- Current folders are a scaffold, not working apps. No dev command, API, database or AI integration exists yet.
- Use the PDF's proposed stack. Do not represent a Python backend as an npm workspace.
- Preserve original ZIP and extracted references.

Validate each feature across relevant interfaces, API permissions, audit history, escalation and verified outcomes before marking it complete. Outstanding product policies are listed in Phase 1.
