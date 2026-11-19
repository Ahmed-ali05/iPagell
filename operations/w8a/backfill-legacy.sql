-- Optional, non-authoritative shadow copy. Not required for W8-A login.
-- Bind ?1 = exclusive account ID cursor, ?2 = batch size (1..100).
-- Read the scanned page's IDs separately to advance past already-copied rows.
-- Existing copies are never overwritten. No use in credentials/paused mode.
INSERT INTO account_credentials(account_id,password_hash,recovery_hash,updated_at)
SELECT id,password_hash,recovery_hash,created_at FROM accounts
WHERE id > ?1 AND EXISTS (
  SELECT 1 FROM auth_schema_state WHERE id=1 AND schema_version=7 AND write_mode='legacy'
)
ORDER BY id
LIMIT CASE WHEN ?2 BETWEEN 1 AND 100 THEN ?2 ELSE 0 END
ON CONFLICT(account_id) DO NOTHING
RETURNING account_id;
