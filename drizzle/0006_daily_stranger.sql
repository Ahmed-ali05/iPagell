ALTER TABLE class_notes ADD COLUMN content_format TEXT NOT NULL DEFAULT 'plain' CHECK(content_format IN ('plain','md-lite-v1'));--> statement-breakpoint
ALTER TABLE personal_notes ADD COLUMN content_format TEXT NOT NULL DEFAULT 'plain' CHECK(content_format IN ('plain','md-lite-v1'));--> statement-breakpoint
DROP TRIGGER personal_notes_quota_update;--> statement-breakpoint
CREATE TRIGGER personal_notes_quota_update BEFORE UPDATE OF title,content,content_format,subject_id,subject_name,pinned,deleted_at,byte_size ON personal_notes
WHEN NEW.deleted_at IS NULL AND (
  (SELECT count(*) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL AND id<>NEW.id) >= 500 OR
  (SELECT coalesce(sum(byte_size),0) FROM personal_notes WHERE user_id=NEW.user_id AND deleted_at IS NULL AND id<>NEW.id)+NEW.byte_size > 8388608
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;--> statement-breakpoint
DROP TRIGGER personal_notes_sequence_update;--> statement-breakpoint
CREATE TRIGGER personal_notes_sequence_update AFTER UPDATE OF title,content,content_format,subject_id,subject_name,pinned,deleted_at ON personal_notes BEGIN
  INSERT INTO personal_note_sequences (user_id,seq) VALUES (NEW.user_id,1)
  ON CONFLICT(user_id) DO UPDATE SET seq=seq+1;
  UPDATE personal_notes SET change_seq=(SELECT seq FROM personal_note_sequences WHERE user_id=NEW.user_id)
  WHERE user_id=NEW.user_id AND id=NEW.id;
END;--> statement-breakpoint
DROP TRIGGER class_notes_quota_update;--> statement-breakpoint
CREATE TRIGGER class_notes_quota_update BEFORE UPDATE OF title,content,content_format,subject_id,subject_name,deleted_at,byte_size ON class_notes
WHEN NEW.deleted_at IS NULL AND NEW.class_id IS NOT NULL AND (
  (SELECT count(*) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL AND id<>NEW.id) >= 200 OR
  (SELECT coalesce(sum(byte_size),0) FROM class_notes WHERE class_id=NEW.class_id AND deleted_at IS NULL AND id<>NEW.id)+NEW.byte_size > 4194304
) BEGIN SELECT RAISE(ABORT,'NOTES_LIMIT'); END;
