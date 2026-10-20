# Backend verification

Run `python -m pytest -q --tb=short` from backend/. The first-flow suite covers role/record isolation, report preservation, matching, idempotency, triage versions, blocked resolution, private evidence, internal notes and mocked Supabase identity/key handling. Live PostgreSQL/Supabase/Render verification remains pending; recovery tests will be added with those milestones.
