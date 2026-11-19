-- Explicit operational initialization AFTER schema 0007, BEFORE traffic reopens.
-- Intentionally non-idempotent: never reopen paused/unknown/existing state.
-- No remote execution path is assumed. See RUNBOOK.md before use.
INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy');
