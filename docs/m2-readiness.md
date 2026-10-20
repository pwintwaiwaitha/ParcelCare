# Readiness for M2: seven AI checks

2026-10-20. M2 is now BUILDING with Groq following the user's provider choice. Runtime contract and deployment steps: [M2 AI review](m2-ai-review.md). OpenAI API testing returned exhausted credit; Groq live synthetic structured generation passed. The key stays backend-only.

## Ready foundation

- Reporting/triage, three role interfaces, Supabase Auth/PostgreSQL/Storage and both Render services are implemented and deployed.
- Policy tests, full deployed three-role browser smoke, private evidence checks and live PostgreSQL retry/concurrency checks passed for the recorded first-flow release.
- Earlier design revision has production build, local functional regression and local/deployed visual checks. The new teal/yellow reference refresh supports light/dark (default light); production build and local theme checks passed. Its publication/regression results are recorded separately in docs/design-review.md.

## Remaining gates

| Gate | Current evidence / next action |
| --- | --- |
| Team acceptance of M0/M1 | User explicitly confirmed on 2026-10-20 that testing is still in progress. Both teammate checkboxes remain pending. Record results/defects for customer, rider and staff; fix/retest blockers. |
| Reference-based design refresh | Palette/theme choices received and implemented. Complete sequential functional regression, publish and verify the new revision; obtain teammate visual review. |
| AI credentials | OPENAI_API_KEY is not configured in the private backend environment (presence-only check). A backend-only key and usable API access are needed before live M2 verification; keep secrets out of chat, frontend assets and Git. |
| M2 feature specification | Freeze the input snapshot, structured seven-check output, review/version persistence, error/manual fallback and representative evaluation cases before coding. |

## Recommended next discussion

Confirm team results and finalize the reference refresh. Then prepare M2's small requirements/UI/API/data contract and implement it as the next deployed flow. Staff should be able to request a review and inspect classification, summary, suggested priority, missing data, duplicate candidates, evidence consistency and next action with uncertainty. A failed review retains manual handling; a recommendation causes no recovery side effect. Mark evidence not actually inspected as NOT ASSESSED.

M2 planning can proceed while inputs/tests are collected, but moving its runtime implementation ahead of M0/M1 acceptance would depart from the agreed finish/deploy/team-test-before-next-milestone process. Do not mark M0/M1 ACCEPTED or M2 complete without evidence.
