# M2: persisted staff AI review

## Scope and contract

Staff opens a case and requests seven advisory checks: classification, summary, suggested priority, missing data, duplicate candidates, evidence consistency and next action. Each check includes uncertainty and report references. Staff can edit priority through existing audited triage; category correction remains follow-up work. No recommendation executes a recovery action.

Input is a saved snapshot of case version/category/priority/status, report IDs/descriptions, evidence IDs/MIME types and at most 20 related cases on the same shipment. Names, emails, authentication credentials and storage keys are excluded. Photos are not transmitted or inspected: the backend always replaces the evidence finding with NOT ASSESSED. Staff opens the original evidence separately. Total serialized input is capped at 40,000 characters; larger cases use manual triage.

Groq hosts the configurable model, default `openai/gpt-oss-20b`. This is an open-weight model served through Groq; it does not bill the OpenAI API key. Free-plan rate limits still apply. Schema-constrained JSON is additionally validated with Pydantic, allowed categories, existing report IDs and candidate case IDs. Treat supplied reports as untrusted content. Semantic accuracy still requires staff review.

## API and persistence

- Staff-only GET `/cases/{id}/ai-review`: provider configuration presence and latest review.
- Staff-only POST `/cases/{id}/ai-review`: `{ "version": 1 }` and `Idempotency-Key`; requires current case version. Same key reuses the saved request without another provider call; changed case/version conflicts.
- Migration 002 adds `ai_reviews` with requesting staff ID, request key, case version, input fingerprint/snapshot, model, prompt version, pending/completed/failed state, result/error and timestamp. RLS blocks direct anon/authenticated access.
- A case lock serializes request creation. Pending state is committed before a bounded provider call. Other requests see the saved pending review. Requests interrupted for over 120 seconds become failed when read. Failed requests require a new key to retry; network retries reuse the original key.
- New reports, evidence or case edits change the snapshot fingerprint. The UI marks the saved review stale. It retains the original model, findings and snapshot for audit.
- Provider failures expose a generic error without secrets or provider response content. Existing manual triage remains available. AI review completion/failure adds a staff-only audit event.

## Setup and deployment

Local: save `GROQ_API_KEY` privately in `backend/.env`; optional `GROQ_MODEL` overrides the default. Run `python -m app.setup migrate`, then restart the backend. Never commit `.env`.

Render: set `GROQ_API_KEY` in **parcelcare-api → Environment**, save and redeploy the backend. The frontend needs no AI secret. The normal startup command applies migrations before starting the API. Deploy the matching frontend revision too. A local `.env` is never copied to Render by Git.

## Acceptance

- Automated backend tests cover staff permissions, persistence/retries, no operational action, stale reports, missing configuration/provider failure and invalid source references.
- Live synthetic structured-generation check passed with Groq on 2026-10-20.
- Local production browser test passed: real Groq seven-check review, persistence after reload, staff-only access, light/dark rendering and unchanged case status/version. Screenshots were inspected. Metadata-only duplicates are explicitly unconfirmed.
- Team must test clear wrong address, missing information, potential duplicates, contradictory reports and manual-only categories, plus quota failure/manual continuation.
- This implementation sends text/metadata only. Image consistency evaluation and recovery approval/execution remain outside this milestone's runtime.
- Public deployment and team acceptance must be recorded before calling M2 complete.
