import { tokenHash } from "./password";
import { HttpError } from "./http";
import { parseClassRole, type ClassRole } from "@/lib/classes/permissions";
import type { AccountIdentity } from "@/types/domain";
import type {
  ClassDetail,
  ClassInvite,
  ClassMember,
  ClassSummary,
  CreatedClassInvite,
} from "@/types/classes";
import {
  createInviteCode,
  normalizeInviteCode,
} from "@/lib/classes/validation";

type ClassRow = {
  id: string;
  name: string;
  description: string;
  role: string;
  display_name: string;
  member_count: number;
  created_at: number;
};

function toSummary(row: ClassRow): ClassSummary {
  const role = parseClassRole(row.role);
  if (!role) throw new Error("Invalid class role in database");
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    role,
    displayName: row.display_name,
    memberCount: Number(row.member_count),
    createdAt: Number(row.created_at),
  };
}

export class ClassRepository {
  constructor(private db: D1Database) {}

  async list(user: AccountIdentity): Promise<ClassSummary[]> {
    const result = await this.db
      .prepare(
        `SELECT c.id,c.name,c.description,m.role,m.display_name,c.created_at,
          (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id=c.id) member_count
         FROM class_members m JOIN classes c ON c.id=m.class_id
         WHERE m.user_id=? ORDER BY c.updated_at DESC,c.name ASC LIMIT 50`,
      )
      .bind(user.id)
      .all<ClassRow>();
    return result.results.map(toSummary);
  }

  async get(user: AccountIdentity, classId: string): Promise<ClassDetail> {
    const row = await this.db
      .prepare(
        `SELECT c.id,c.name,c.description,m.role,m.display_name,c.created_at,
          (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id=c.id) member_count
         FROM class_members m JOIN classes c ON c.id=m.class_id
         WHERE m.user_id=? AND c.id=?`,
      )
      .bind(user.id, classId)
      .first<ClassRow>();
    if (!row) throw new HttpError(404, "Classe non trovata");
    const members = await this.db
      .prepare(
        `SELECT user_id,display_name,role,joined_at
         FROM class_members WHERE class_id=?
         ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END,
          display_name COLLATE NOCASE ASC LIMIT 100`,
      )
      .bind(classId)
      .all<{
        user_id: string;
        display_name: string;
        role: string;
        joined_at: number;
      }>();
    return {
      ...toSummary(row),
      members: members.results.map((member): ClassMember => {
        const role = parseClassRole(member.role);
        if (!role) throw new Error("Invalid member role in database");
        return {
          userId: member.user_id,
          displayName: member.display_name,
          role,
          joinedAt: Number(member.joined_at),
          isCurrentUser: member.user_id === user.id,
        };
      }),
    };
  }

  async create(
    user: AccountIdentity,
    input: { name: string; description: string; displayName: string },
  ) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const results = await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO classes (id,name,description,owner_id,settings,created_at,updated_at)
           SELECT ?,?,?,?,'{"membersVisible":true}',?,?
           WHERE (SELECT COUNT(*) FROM classes WHERE owner_id=?) < 20`,
        )
        .bind(
          id,
          input.name,
          input.description,
          user.id,
          now,
          now,
          user.id,
        ),
      this.db
        .prepare(
          `INSERT INTO class_members (class_id,user_id,role,display_name,joined_at)
           SELECT id,?,'owner',?,? FROM classes WHERE id=?`,
        )
        .bind(user.id, input.displayName, now, id),
    ]);
    if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1)
      throw new HttpError(409, "Puoi gestire al massimo 20 classi.");
    return this.get(user, id);
  }

  async update(classId: string, input: { name: string; description: string }, actorId: string) {
    const result = await this.db
      .prepare(
        "UPDATE classes SET name=?,description=?,updated_at=? WHERE id=? AND owner_id=?",
      )
      .bind(input.name, input.description, Date.now(), classId, actorId)
      .run();
    if (result.meta.changes < 1)
      throw new HttpError(404, "Classe non trovata");
  }

  async remove(classId: string, actorId: string) {
    const result = await this.db
      .prepare("DELETE FROM classes WHERE id=? AND owner_id=?")
      .bind(classId, actorId)
      .run();
    if (result.meta.changes < 1)
      throw new HttpError(404, "Classe non trovata");
  }

  async listInvites(classId: string): Promise<ClassInvite[]> {
    const result = await this.db
      .prepare(
        `SELECT id,expires_at,max_uses,uses,revoked_at,created_at
         FROM class_invites WHERE class_id=? ORDER BY created_at DESC LIMIT 50`,
      )
      .bind(classId)
      .all<{
        id: string;
        expires_at: number | null;
        max_uses: number;
        uses: number;
        revoked_at: number | null;
        created_at: number;
      }>();
    return result.results.map((row) => ({
      id: row.id,
      expiresAt: row.expires_at == null ? null : Number(row.expires_at),
      maxUses: Number(row.max_uses),
      uses: Number(row.uses),
      revokedAt: row.revoked_at == null ? null : Number(row.revoked_at),
      createdAt: Number(row.created_at),
    }));
  }

  async createInvite(
    user: AccountIdentity,
    classId: string,
    input: { expiresInDays: number; maxUses: number },
  ): Promise<CreatedClassInvite> {
    const code = createInviteCode();
    const normalized = normalizeInviteCode(code)!;
    const now = Date.now();
    const invite: CreatedClassInvite = {
      id: crypto.randomUUID(),
      code,
      expiresAt: now + input.expiresInDays * 86_400_000,
      maxUses: input.maxUses,
      uses: 0,
      revokedAt: null,
      createdAt: now,
    };
    const result = await this.db
      .prepare(
        `INSERT INTO class_invites
          (id,class_id,secret_hash,created_by,expires_at,max_uses,uses,revoked_at,created_at)
         SELECT ?,?,?,?,?,?,0,NULL,? WHERE EXISTS (SELECT 1 FROM class_members WHERE class_id=? AND user_id=? AND role IN ('owner','moderator'))`,
      )
      .bind(
        invite.id,
        classId,
        tokenHash(normalized),
        user.id,
        invite.expiresAt,
        invite.maxUses,
        now,
        classId,
        user.id,
      )
      .run();
    if (result.meta.changes !== 1)
      throw new HttpError(409, "Invito non creato. Riprova.");
    return invite;
  }

  async revokeInvite(classId: string, inviteId: string, actorId: string) {
    const result = await this.db
      .prepare(
        "UPDATE class_invites SET revoked_at=? WHERE id=? AND class_id=? AND revoked_at IS NULL AND EXISTS (SELECT 1 FROM class_members WHERE class_id=class_invites.class_id AND user_id=? AND role IN ('owner','moderator'))",
      )
      .bind(Date.now(), inviteId, classId, actorId)
      .run();
    if (result.meta.changes !== 1)
      throw new HttpError(404, "Invito non trovato o già revocato");
  }

  async join(
    user: AccountIdentity,
    code: string,
    displayName: string,
  ): Promise<ClassDetail> {
    const normalized = normalizeInviteCode(code);
    if (!normalized) throw new HttpError(400, "Codice invito non valido");
    const now = Date.now();
    const secretHash = tokenHash(normalized);
    const results = await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO class_members (class_id,user_id,role,display_name,joined_at)
           SELECT i.class_id,?,'member',?,?
           FROM class_invites i
           WHERE i.secret_hash=? AND i.revoked_at IS NULL
             AND (i.expires_at IS NULL OR i.expires_at>?) AND i.uses<i.max_uses
             AND NOT EXISTS (SELECT 1 FROM class_departures d WHERE d.class_id=i.class_id AND d.user_id=? AND d.departed_at>=i.created_at)
             AND NOT EXISTS (
               SELECT 1 FROM class_members m
               WHERE m.class_id=i.class_id AND m.user_id=?
             )`,
        )
        .bind(user.id, displayName, now, secretHash, now, user.id, user.id),
      this.db
        .prepare(
          `UPDATE class_invites SET uses=uses+1
           WHERE secret_hash=? AND changes()=1`,
        )
        .bind(secretHash),
    ]);
    if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1)
      throw new HttpError(
        409,
        "Invito scaduto, revocato, esaurito oppure classe già aggiunta.",
      );
    const row = await this.db
      .prepare(
        `SELECT m.class_id FROM class_members m JOIN class_invites i ON i.class_id=m.class_id
         WHERE m.user_id=? AND i.secret_hash=? LIMIT 1`,
      )
      .bind(user.id, secretHash)
      .first<{ class_id: string }>();
    if (!row) throw new Error("Joined class not found");
    return this.get(user, row.class_id);
  }

  async memberRole(classId: string, userId: string): Promise<ClassRole> {
    const row = await this.db
      .prepare("SELECT role FROM class_members WHERE class_id=? AND user_id=?")
      .bind(classId, userId)
      .first<{ role: string }>();
    const role = row ? parseClassRole(row.role) : null;
    if (!role) throw new HttpError(404, "Membro non trovato");
    return role;
  }

  async updateDisplayName(
    classId: string,
    userId: string,
    displayName: string,
  ) {
    const result = await this.db
      .prepare(
        "UPDATE class_members SET display_name=? WHERE class_id=? AND user_id=?",
      )
      .bind(displayName, classId, userId)
      .run();
    if (result.meta.changes !== 1)
      throw new HttpError(404, "Membro non trovato");
  }

  async updateRole(classId: string, userId: string, role: "moderator" | "member", actorId: string) {
    const result = await this.db
      .prepare(
        "UPDATE class_members SET role=? WHERE class_id=? AND user_id=? AND role!='owner' AND EXISTS (SELECT 1 FROM classes c WHERE c.id=class_members.class_id AND c.owner_id=?)",
      )
      .bind(role, classId, userId, actorId)
      .run();
    if (result.meta.changes !== 1)
      throw new HttpError(409, "Il ruolo non può essere modificato");
  }

  async transfer(classId: string, ownerId: string, nextOwnerId: string) {
    if (ownerId === nextOwnerId)
      throw new HttpError(400, "Scegli un altro membro");
    const targetRole = await this.memberRole(classId, nextOwnerId);
    if (targetRole === "owner")
      throw new HttpError(409, "Questo membro è già proprietario");
    const results = await this.db.batch([
      this.db.prepare("UPDATE classes SET owner_id=?,updated_at=? WHERE id=? AND owner_id=? AND EXISTS (SELECT 1 FROM class_members WHERE class_id=? AND user_id=? AND role!='owner')")
        .bind(nextOwnerId, Date.now(), classId, ownerId, classId, nextOwnerId),
      this.db
        .prepare(
          "UPDATE class_members SET role='member' WHERE class_id=? AND user_id=? AND role='owner' AND changes()=1",
        )
        .bind(classId, ownerId),
      this.db
        .prepare(
          "UPDATE class_members SET role='owner' WHERE class_id=? AND user_id=? AND role!='owner' AND changes()=1",
        )
        .bind(classId, nextOwnerId),
    ]);
    if (results.some((result) => result.meta.changes !== 1))
      throw new HttpError(409, "Trasferimento non completato. Ricarica.");
  }

  async removeMember(classId: string, userId: string, actorId: string) {
    const result = await this.db
      .prepare(
        `DELETE FROM class_members WHERE class_id=? AND user_id=? AND role!='owner' AND
         (user_id=? OR EXISTS (SELECT 1 FROM class_members a WHERE a.class_id=class_members.class_id AND a.user_id=? AND (a.role='owner' OR (a.role='moderator' AND class_members.role='member'))))`,
      )
      .bind(classId, userId, actorId, actorId)
      .run();
    if (result.meta.changes < 1)
      throw new HttpError(409, "Il proprietario deve prima trasferire la classe");
  }
}
