# ParcelCare design specification

Updated 2026-10-20. Canonical visual specification for the reporting/triage demo and subsequent feature slices. Product authority and recovery rules remain in Phase1_PRD/requirements.md; screen behavior remains in Phase2_UIUX/design.md. If older visual guidance conflicts, this file takes precedence. This is a design contract, not a claim that all future screens exist.

## People, devices and success

| Interface | Primary context | Successful design |
| --- | --- | --- |
| Customer | Phone, one delivery problem, occasional use | Identify shipment, report clearly, find latest public progress without learning logistics terminology |
| Rider | Phone, between delivery attempts | Pick assigned shipment, capture exception, recover from a failed request without duplicate reports |
| Staff | Desktop, repeated triage across many cases | Compare issue/status/priority/owner at a glance, inspect context and update the reporter without losing orientation |

Customer/rider are mobile first. Staff is desktop first, with an accessible fallback on small screens. Responsive does not mean giving every role the same layout. Main desktop design target: 1440px; staff must retain its desktop structure at 1024px. Mobile target: 390px, verified down to 320px.

## Audit findings driving this revision

The first release rendered important labels, timestamps and descriptions at 8-12px, used faint secondary text, repeated marketing-style headers inside operational screens, and reused the same card list for staff and reporters. Its 1100px breakpoint collapsed staff details too early. The resulting hierarchy emphasized decorative whitespace and large titles over the case information needed to act. The new rules address these observed implementation issues.

## Visual direction

Calm, legible delivery operations. White work surfaces on a cool neutral page; navy for orientation; teal for the primary action. Use borders and spacing for grouping, not extra colored cards. Keep the existing ParcelCare identity; no stock illustrations, hero graphics, decorative gradients or remote font dependency are needed in the workflow.

The hierarchy on every screen is: location/context -> page title and current state -> task content -> primary action -> supporting details. On staff case detail, the issue, tracking ID and status lead; report text and triage controls follow. On reporter case detail, the saved status and public timeline lead. Never make a small label carry the only explanation of a required action.

## Typography

Font: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Use actual available weights 400/500/600/700. Do not synthesize a thin brand/body weight or introduce multiple font families for visual variety. Tracking IDs may use a system monospace stack; numbers use tabular figures.

| Token | rem / default px | Weight | Line height | Use |
| --- | --- | --- | --- | --- |
| caption | 0.8125 / 13 | 400-600 | 1.5 | Timestamps, helper text, footer; never essential report text |
| small | 0.875 / 14 | 400-600 | 1.5 | Badges, navigation, table cells, metadata values |
| body | 1 / 16 | 400 | 1.6 | Report text, descriptions, timelines, form input |
| label | 0.875 / 14 | 600 | 1.5 | Visible field labels and column headings |
| section | 1.25 / 20 | 600 | 1.3 | Card and section titles |
| page-mobile | 1.75 / 28 | 700 | 1.2 | Mobile page title |
| page-desktop | 2 / 32 | 700 | 1.2 | Staff desktop title |
| metric | 1.75 / 28 | 700 | 1.2 | Supporting summary counts |

These are ParcelCare design choices, not WCAG-mandated font sizes. No application text below 13px at default browser settings. Inputs remain 16px on phones. Meaningful content must not shrink at mobile breakpoints. Paragraph measures target 45-75 characters when space permits. Sentence case for statuses/labels; uppercase is limited to short context labels with modest tracking. Use at most one h1 per view and logical h2/h3 levels.

## Color tokens

| CSS token | Value | Role |
| --- | --- | --- |
| --navy | #142B38 | Navigation and orientation |
| --ink | #16323D | Main text |
| --muted | #52636B | Supporting readable text |
| --teal | #106F65 | Primary button and action links |
| --bg | #F4F7F7 | Page canvas |
| --white | #FFFFFF | Cards, table, inputs |
| --line | #DCE5E5 | Grouping borders; not a text color |

Use white text on teal for the primary button. Open uses dark amber on pale amber; triaged/in progress dark blue on pale blue; waiting dark purple on pale purple; escalated/urgent dark red on pale red; verified resolved dark green on pale green. Status always includes readable text. LOW/NORMAL/HIGH/URGENT priority never relies on a colored dot alone. Muted text is still information, not decoration.

Normal text must meet 4.5:1 contrast, and qualifying large text 3:1. Verify actual foreground/background pairs rather than assume a token passes everywhere. Text resizing to 200% must retain content and actions. Sources: [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). These sources support accessibility requirements; the visual style and type scale are project decisions.

## Space, surfaces and controls

Spacing scale: 4/8/12/16/24/32/48px. Page gutters: 16px on phone, 24px on tablet, 32px on desktop. Panel padding: 20px phone, 24px desktop. Section gaps: 24px phone, 32px desktop. Border radius: 12px for cards, 8px for controls, 6px for badges. Avoid nested cards unless they represent genuinely separate objects.

Controls and tappable navigation provide at least a 44px target; customer/rider primary buttons use 48px. Form labels stay visible above controls. Placeholder text supplements labels. Error messages identify the problem and recovery action, appear near the action and use role=alert. Success confirmations use role=status. Focus is a high-contrast 3px outline with offset, visible on light and dark surfaces. Buttons have explicit disabled states, and busy labels explain the current operation.

## Role-specific layouts

### Customer and rider

Base layout is a compact brand/account header, single-column content and bottom navigation for Cases and Report. Bottom navigation respects device safe areas; reserve enough content padding so it never covers the submit button or final timeline item. At 768px and above, navigation may move into the header, while content remains an easy-to-read centered workspace instead of becoming a staff dashboard.

Reports use a centered form no wider than 760px. Case detail is a single readable flow: title/status -> report context -> timeline -> next-step explanation. Summary counts are secondary; they must not push the main task far below the fold. Long issue labels and addresses wrap naturally. On a phone, case cards place the issue/tracking first and status/update underneath rather than compressing both into narrow side-by-side columns.

Only currently implemented destinations appear. Do not add a Tasks tab until rider task behavior exists. Retain the current report fields and data permissions. Plain copy: "My cases", "Report an exception", "Your report is saved", "Update for the reporter". Avoid decorative slogans in operational headings.

### Staff

At 1024px and above: persistent 224px sidebar, 64px topbar, workspace filling the remaining width with a maximum reading/work area of 1600px. No bottom navigation. The page header is compact and functional. Summary counts are supporting information above the queue, not oversized dashboard tiles.

Queue is a semantic table with Tracking ID, Issue, Priority, Status, Owner, Updated and Open action. Each row maintains column alignment and includes a clearly labeled open button. At constrained desktop widths, omit Owner/Updated columns before shrinking meaningful text; the full values remain on case detail. Query controls remain together above the table. Never invent assignment actions or sorting behavior that the API does not implement. Search/filter currently apply to the loaded page and must be labeled accordingly.

At 1024px and above, case detail uses two simultaneous columns: flexible report/timeline context and a 320px-or-wider triage panel. Keep the triage panel near the top and sticky when space permits; avoid fixed panel heights that trap fields or hide the save action. At 768-1023px use the tablet fallback and stack content as needed. On smaller screens use readable cards and stacked forms; no horizontal page scroll.

The triage panel names the action "Save triage & update" and explains that saving assigns the case to the current staff member. Public reporter update and internal note remain visibly distinct. Current status, priority and owner are readable without inspecting a tiny caption. Resolution remains unavailable in this milestone.

## Screen/state requirements

| Screen | Primary focus | Required secondary information |
| --- | --- | --- |
| Sign-in | Credentials and sign-in action | Account determines role; no fake role picker |
| Reporter case list | Open a saved case or create a report | Tracking, issue, public status, latest-update time |
| New report | Shipment, issue, description, submit | Optional evidence, limits, retry after partial upload |
| Reporter case | Current state and public progress | Own report/evidence and clear next-step explanation |
| Staff queue | Compare and open cases | Page-scoped search/filter, ownership, priority, status |
| Staff case | Report context and triage controls | Evidence, internal/public timeline, related-case hint |

Every data screen must distinguish loading, empty, no search results, failed request and successful data. Preserve form values during an in-page network failure. Polling must not clear a staff draft or fabricate a new timestamp. Never add a recovery-stage badge without real backend data. Existing future screens in Phase 2 remain future work.

## Implementation ownership

`frontend/src/app/globals.css` owns shared tokens and breakpoint rules. Role shell selectors are explicit: app-shell--reporter and app-shell--staff. Route composition selects the shell; feature components use shared primitives. Staff table is a separate presentational component. API policy, status transitions, polling and idempotency remain unchanged by this design revision.

Keep one set of rules per component rather than adding a second stylesheet full of conflicting overrides. New components must use this scale. A visual change should include representative screenshots and state checks, not a new unit test for each CSS declaration.

## Delivery checklist for this revision

- [x] Staff retains sidebar, aligned queue and two-column case detail at 1024/1440px.
- [x] Customer/rider remain readable and usable at 320/375/390/768px; safe-area/content padding reserves space for bottom navigation.
- [x] Important report/timeline text is 16px, labels/table data at least 14px, helper text at least 13px.
- [x] Token contrast checks cover body, muted text, labels, status backgrounds and primary buttons. This is not a full accessibility certification.
- [x] Browser checks at 200% root text size preserve page reflow and the staff save action. Full assistive-technology review remains pending.
- [ ] Keyboard focus is visible; table headers, navigation and form labels have meaningful semantics.
- [x] Existing three-role reporting/triage browser smoke passes after the visual changes (sequential run against live Supabase).
- [x] Revised screenshots and remaining limits are recorded in docs/design-review.md; the earlier first-flow screenshots provided the audit baseline. Teammate visual review remains pending.
- [ ] Push/deploy only to the user's selected deployment repository; do not accidentally deploy a design change through the original team remote.
