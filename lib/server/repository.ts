import type { AccountIdentity, DiarySnapshot } from "@/types/domain";
import { diarySchema } from "@/lib/validation";

export class DiaryRepository {
  constructor(private db: D1Database) {}
  async get(user: AccountIdentity): Promise<DiarySnapshot | null> {
    const row = await this.db
      .prepare("SELECT payload, revision FROM diaries WHERE user_id = ?")
      .bind(user.id)
      .first<{ payload: string; revision: number }>();
    return row
      ? {
          ...diarySchema.parse(JSON.parse(row.payload)),
          revision: row.revision,
        }
      : null;
  }
  async create(user: AccountIdentity, payload: string) {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(
        "INSERT INTO diaries (user_id,payload,revision,created_at,updated_at) VALUES (?,?,1,?,?) ON CONFLICT(user_id) DO NOTHING",
      )
      .bind(user.id, payload, now, now)
      .run();
    return result.meta.changes === 1;
  }
  async update(user: AccountIdentity, payload: string, revision: number) {
    const result = await this.db
      .prepare(
        "UPDATE diaries SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?",
      )
      .bind(payload, new Date().toISOString(), user.id, revision)
      .run();
    return result.meta.changes === 1;
  }
}
