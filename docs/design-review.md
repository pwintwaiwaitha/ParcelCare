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

Both final local browser suites passed. Preparing the revision for the user's htoomyatmineain/ParcelCare deployment repository; original team origin is preserved and deployment is a separate Git remote. Render publication and live verification of this revision remain pending until observed. Do not mark teammate visual review complete automatically.
