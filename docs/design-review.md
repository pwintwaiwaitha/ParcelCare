# Design revision review

2026-10-20, Asia/Rangoon. User confirmed customer/rider mobile first and staff desktop first. Canonical visual contract: [DESIGN.md](../DESIGN.md).

## Implemented

- Shared system-font scale: 16px report/input/timeline text, 14px labels/table/badges, minimum 13px captions. Darker secondary text, stronger section hierarchy and sentence-case status formatting.
- Separate role shells: compact reporter header/mobile bottom navigation and centered content; staff persistent 224px sidebar and aligned semantic queue table at desktop widths.
- Staff case context and triage controls remain side by side from 1024px. Customer/rider case detail stays a readable single column.
- Replaced conflicting stylesheet rules with one mobile-first base and explicit staff desktop rules; no remote fonts or new UI dependencies.
- API policies, polling, permissions, idempotency and status transitions are unchanged. Operational copy omits implementation milestone terminology.

## Verification

- Next.js production build and TypeScript validation passed.
- `node tests/design-review.cjs` passed sequentially against the local frontend with live Supabase: customer/rider 320/375/390/768px, staff 768/1024/1440px, desktop queue/sidebar/two-column layout, minimum rendered text size, intended color-pair contrast and 200% root text resizing.
- Captured and inspected representative screenshots under ignored frontend/artifacts/: design-staff-queue-1440.png, design-staff-case-1440.png, design-customer-cases-390.png and design-customer-report-390.png (plus rider variants).
- Initial simultaneous design/regression runs timed out at sign-in; direct backend/proxy sign-in and sequential design review succeeded. This observation does not establish the cause of that timeout. Final sequential reporting regression and deployment results are recorded below.
- Browser smoke checks do not certify full keyboard/screen-reader behavior, all browser zoom modes, every color combination or teammate acceptance.
- Final sequential `node tests/smoke.cjs --supabase` passed: customer/rider submission, staff triage, reporter polling, refresh persistence, private notes/evidence, record isolation and all planned viewport widths.

## Deployment

Both final local browser suites passed. Revision **70d395f** was pushed to htoomyatmineain/ParcelCare through the separate deployment remote; original team origin is preserved. Render now serves the revised assets at https://parcelcare-web.onrender.com. `TEST_BASE_URL=https://parcelcare-web.onrender.com node tests/design-review.cjs` passed against the published site, covering the desktop queue/two-column case layout, mobile reporter layouts, typography minimums, intended contrast pairs and 200% root text resizing. Teammate visual review and full accessibility acceptance remain pending.

## Reference-based teal/yellow refresh

User supplied the Kinn Htout design reference and selected exact teal #08A6A5 / yellow #FCC829, with light/dark support and default light. Adapted the root contract, semantic palette, layered surfaces, 600-weight headings, inset 14px panels, 18px floating navigation and 8px controls. Retained readable text sizes and ParcelCare's roles/workflow rather than copying civic functionality or unsupported small labels. No new font package or binary was imported.

Theme preference restores before hydration and persists only a light/dark value. Toggle works from sign-in and all role workspaces, supports keyboard use, and falls back to an in-memory selection when storage is unavailable. Exact teal uses dark text (measured 4.88:1), with contrast-derived hover/link colors; yellow supports priority emphasis rather than low-contrast text on white.

Verification for this refresh:
- Production build and TypeScript validation passed.
- `node tests/theme-review.cjs` passed locally against live Supabase: both themes, all roles, default light/reload preference, blocked storage, keyboard/focus, computed theme-token contrast, responsive staff/reporter layouts, bottom-nav submit clearance, empty/error states and 200% root text resizing.
- Sequential full reporting/triage smoke passed in light mode and with TEST_THEME=dark: submission, triage, polling, refresh persistence, private notes/evidence and role isolation. Local theme screenshots were captured and inspected under frontend/artifacts/theme-*.png.
- Publication/live theme verification is pending until observed. Earlier release evidence above remains historical.
- User explicitly confirmed team testing is still in progress; no M0/M1 acceptance or M2 implementation is claimed.
