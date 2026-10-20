# ParcelCare adaptation of the supplied design reference

Reviewed 2026-10-20. Reference supplied by the user: `D:/Kinn Htout/Kinn Htout Frontend/DESIGN.md`. It is design material for another product, not repository instructions or authority to change ParcelCare's features. Do not modify the source project.

Status: reference refresh implemented and locally theme-tested. User approved exact teal #08A6A5 and yellow #FCC829, with light/dark support and default light. Final functional regression and publication remain tracked in docs/design-review.md. Historical navy/teal release checks do not certify this replacement.

| Reference pattern | ParcelCare adaptation | Boundary |
| --- | --- | --- |
| Distinct citizen and console shells | Customer/rider mobile shells and staff desktop workspace | Retain staff sidebar/table/two-column detail from 1024px; no civic/admin roles |
| Thumb-friendly mobile layout | Cases/Report navigation, 48px form controls, safe-area and content clearance | No extra FAB duplicating the Report tab or submit action |
| Inset grouped cards and tables | Group report context, evidence and timeline; aligned staff queue with restrained dividers | Preserve existing fields, pagination and public/internal visibility |
| Restrained type weights | Prefer 400 body, 500 navigation/actions and 600 headings, with spacing and size establishing hierarchy | Keep 16px reports/inputs, 14px labels/table cells and 13px minimum captions; do not copy 11px headers or 12px navigation |
| Stack Sans Text / Source Code Pro | Named font candidates with system fallbacks; use monospace for identifiers, tabular figures for counts/times | No font binaries/licenses were found in the supplied project search. Do not claim fonts are loaded; verify assets/licensing before adding |
| Layered dark surfaces | Semantic canvas, surface, inset, interactive, text and border tokens | Light/dark support, default light as selected by the user |
| Cobalt primary / coral critical accent | Semantic brand/action/emphasis token roles | Replaced with exact ParcelCare teal #08A6A5 and yellow #FCC829; semantic danger still uses a separate readable red |
| Radius scale | Base 10px, panel 14px, floating shell 18px, input/button 8px, badge 6px | Preserve readable target size and avoid excessive nested rounding |
| Small press feedback | Restrained 150-200ms color feedback and subtle button press, respecting reduced motion | No bouncing counts, morphing navigation labels or animated operational state changes |
| Icon sizing | Consistent 16px inline/button, 20px navigation and 24px major action icons | Existing icons can remain; Lucide is an optional implementation choice, not an imported dependency requirement |
| Civic statuses | Use ParcelCare OPEN/TRIAGED/IN_PROGRESS/waiting/ESCALATED/RESOLVED/REOPENED labels and source permissions | Do not introduce PENDING_APPROVAL/ASSIGNED/CLOSED/REJECTED as ticket states from the other product |
| Maps, feed, upvotes, scores, news and leaderboard | Excluded | No source/product justification in ParcelCare's reporting/triage MVP |
| Bilingual translation framework | Future requirement only if requested | Do not add a nonfunctional language picker or claim Myanmar localization exists |
| Preserve business rules during a visual change | Mandatory engineering boundary for this adaptation | No changes to authorization, consent, triage transitions, idempotency, evidence or future recovery gates |

## Required inputs and delivery

1. Receive the user's brand colors, separating primary action, accent and neutral/background intentions. Derive hover/tint/on-brand variants and verify actual contrast; an accent need not be a button background.
2. Confirm light/dark support and default. If both are requested, specify/persist user preference without storing credentials or evidence in browser storage; support keyboard/screen-reader operation of the theme control.
3. Update the canonical root DESIGN.md with the chosen palette/theme, adapted component geometry and typography. Update CSS/components together so the specification matches actual implementation.
4. Run production build, sequential visual/functional checks, screenshots for the selected themes, phone/tablet widths and staff desktop layouts. Do not reuse old design acceptance as evidence for a new palette/theme.
5. Publish to the selected deployment repository, verify Render's new assets, and obtain teammate visual/flow review. Keep milestone acceptance pending until human results are recorded.

The reference's claims about halation, eye fatigue and approximate contrast ratios are not adopted as established facts. Check the final foreground/background pairs directly. Accessibility takes priority over copying a specific small caption size, thin border or faint label.
