-- W8-B Cloudflare: opens the 0007 fences in legacy mode, in the same migration run.
-- Data only: no schema change, no copy of password or recovery hashes.
-- Non-idempotent by design: an existing, paused or unknown state is never overwritten.
INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy');
