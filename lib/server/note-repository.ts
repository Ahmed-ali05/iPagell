import type { AccountIdentity } from "@/types/domain";
import type { PersonalNote, ClassNote, ClassSubject } from "@/types/notes";
import { repository } from "./db";
import { HttpError } from "./http";
import { noteByteSize, subjectKey, validateNoteBytes } from "@/lib/notes/validation";

type PrivateRow = {
  id: string; user_id: string; subject_id: string; subject_name: string;
  title: string; content: string; pinned: number; revision: number;
  change_seq: number; last_mutation_id: string; created_at: number;
  updated_at: number; deleted_at: number | null;
};
type SharedRow = Omit<PrivateRow, "user_id" | "change_seq"> & {
  class_id: string | null; class_name: string; author_id: string;
  author_name: string; pinned: number;
};
type SubjectRow = { id: string; class_id: string; name: string; revision: number; archived_at: number | null };

export function privateNote(row: PrivateRow): PersonalNote {
  return { id: row.id, subjectId: row.subject_id, subjectName: row.subject_name,
    title: row.title, content: row.content, pinned: !!row.pinned,
    revision: row.revision, changeSeq: row.change_seq,
    lastMutationId: row.last_mutation_id, createdAt: row.created_at,
    updatedAt: row.updated_at, deletedAt: row.deleted_at };
}
export function sharedNote(row: SharedRow): ClassNote {
  return { id: row.id, classId: row.class_id, className: row.class_name,
    authorId: row.author_id, authorName: row.author_name,
    subjectId: row.subject_id, subjectName: row.subject_name,
    title: row.title, content: row.content, pinned: !!row.pinned,
    revision: row.revision, lastMutationId: row.last_mutation_id,
    createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at };
}
export function classSubject(row: SubjectRow): ClassSubject {
  return { id: row.id, classId: row.class_id, name: row.name,
    revision: row.revision, archivedAt: row.archived_at };
}
export function page<T extends { id: string }>(items: T[], max = 50) {
  const result: T[] = [];
  let bytes = 0;
  for (const item of items) {
    const length = new TextEncoder().encode(JSON.stringify(item)).byteLength;
    if (result.length >= max || (bytes + length > 512 * 1024 && result.length)) break;
    result.push(item); bytes += length;
  }
  return { items: result, hasMore: result.length < items.length };
}

export class NoteRepository {
  constructor(private db: D1Database) {}

  async personalChanges(userId: string, after: number) {
    const rows = await this.db.prepare("SELECT * FROM personal_notes WHERE user_id=? AND change_seq>? ORDER BY change_seq LIMIT 51").bind(userId, after).all<PrivateRow>();
    const result = page(rows.results.map(privateNote));
    return { notes: result.items, nextAfter: result.items.at(-1)?.changeSeq ?? after, hasMore: result.hasMore };
  }
  async personalOne(userId: string, id: string) {
    const row = await this.db.prepare("SELECT * FROM personal_notes WHERE user_id=? AND id=?").bind(userId,id).first<PrivateRow>();
    return row ? privateNote(row) : null;
  }
  private async validPrivateSubject(user: AccountIdentity, subjectId: string, existingId?: string) {
    if (existingId) {
      const old = await this.personalOne(user.id, existingId);
      if (old?.subjectId === subjectId) return;
    }
    const diary = await repository().get(user);
    if (!diary?.data.subjects.some((item) => item.id === subjectId))
      throw new HttpError(400, "Sincronizza il diario e scegli una materia valida.");
  }
  async createPersonal(user: AccountIdentity, input: { id:string; subjectId:string; subjectName:string; title:string; content:string; pinned:boolean; mutationId:string }) {
    const old = await this.personalOne(user.id,input.id);
    if (old) {
      if (old.lastMutationId === input.mutationId) return old;
      throw new HttpError(409,"L'appunto è già stato creato.");
    }
    await this.validPrivateSubject(user,input.subjectId);
    if (!validateNoteBytes(input)) throw new HttpError(413,"Appunto troppo grande.");
    const now=Date.now();
    try {
      const changed = await this.db.prepare(`INSERT OR IGNORE INTO personal_notes
        (id,user_id,subject_id,subject_name,title,content,pinned,revision,change_seq,byte_size,last_mutation_id,created_at,updated_at,deleted_at)
        VALUES (?,?,?,?,?,?,?,1,0,?,?,?,?,NULL)`)
        .bind(input.id,user.id,input.subjectId,input.subjectName,input.title,input.content,Number(input.pinned),noteByteSize(input),input.mutationId,now,now).run();
      if (changed.meta.changes < 1) throw new HttpError(409,"L'appunto è già stato creato.");
    } catch (error) { throw quotaError(error); }
    return (await this.personalOne(user.id,input.id))!;
  }
  async updatePersonal(user: AccountIdentity, id:string, input: { subjectId:string; subjectName:string; title:string; content:string; pinned:boolean; mutationId:string; baseRevision:number }) {
    const old = await this.personalOne(user.id,id);
    if (!old) throw new HttpError(404,"Appunto non trovato.");
    if (old.lastMutationId===input.mutationId) return old;
    if (old.revision!==input.baseRevision || old.deletedAt) throw new HttpError(409,"Appunto modificato altrove.");
    await this.validPrivateSubject(user,input.subjectId,id);
    if (!validateNoteBytes({ id,...input })) throw new HttpError(413,"Appunto troppo grande.");
    try {
      const changed=await this.db.prepare(`UPDATE personal_notes SET subject_id=?,subject_name=?,title=?,content=?,pinned=?,byte_size=?,revision=revision+1,last_mutation_id=?,updated_at=?
        WHERE user_id=? AND id=? AND revision=? AND deleted_at IS NULL`)
        .bind(input.subjectId,input.subjectName,input.title,input.content,Number(input.pinned),noteByteSize({id,...input}),input.mutationId,Date.now(),user.id,id,input.baseRevision).run();
      if(changed.meta.changes<1) throw new HttpError(409,"Appunto modificato altrove.");
    } catch(error) { throw quotaError(error); }
    return (await this.personalOne(user.id,id))!;
  }
  async deletePersonal(userId:string,id:string,baseRevision:number,mutationId:string) {
    const old=await this.personalOne(userId,id);
    if(!old) throw new HttpError(404,"Appunto non trovato.");
    if(old.lastMutationId===mutationId) return old;
    if(old.revision!==baseRevision || old.deletedAt) throw new HttpError(409,"Appunto modificato altrove.");
    const changed=await this.db.prepare(`UPDATE personal_notes SET title='',content='',byte_size=0,deleted_at=?,revision=revision+1,last_mutation_id=?,updated_at=?
      WHERE user_id=? AND id=? AND revision=? AND deleted_at IS NULL`).bind(Date.now(),mutationId,Date.now(),userId,id,baseRevision).run();
    if(changed.meta.changes<1) throw new HttpError(409,"Appunto modificato altrove.");
    return (await this.personalOne(userId,id))!;
  }

  async classSubjects(classId:string) {
    const rows=await this.db.prepare("SELECT * FROM class_subjects WHERE class_id=? ORDER BY archived_at IS NOT NULL,name COLLATE NOCASE LIMIT 300").bind(classId).all<SubjectRow>();
    return rows.results.map(classSubject);
  }
  async addClassSubject(classId:string,name:string,userId:string) {
    const id=crypto.randomUUID(), now=Date.now(), key=subjectKey(name);
    const existing=await this.db.prepare("SELECT name FROM class_subjects WHERE class_id=?").bind(classId).all<{name:string}>();
    if(existing.results.some(subject=>subjectKey(subject.name)===key))throw new HttpError(409,"Materia già presente.");
    const result=await this.db.prepare(`INSERT OR IGNORE INTO class_subjects (id,class_id,name,name_key,revision,archived_at,created_at,updated_at)
      SELECT ?,c.id,?,?,1,NULL,?,? FROM classes c
      WHERE c.id=? AND EXISTS(SELECT 1 FROM class_members WHERE class_id=c.id AND user_id=?)
      AND (SELECT count(*) FROM class_subjects WHERE class_id=c.id AND created_at>0 AND archived_at IS NULL)<60`)
      .bind(id,name,key,now,now,classId,userId).run();
    if(result.meta.changes!==1) throw new HttpError(409,"Materia già presente o limite raggiunto.");
    const row=await this.db.prepare("SELECT * FROM class_subjects WHERE id=? AND class_id=?").bind(id,classId).first<SubjectRow>();
    return classSubject(row!);
  }
  async updateClassSubject(classId:string,id:string,userId:string,role:string,input:{name?:string;archived?:boolean;baseRevision:number}) {
    const old=await this.db.prepare("SELECT * FROM class_subjects WHERE id=? AND class_id=?").bind(id,classId).first<SubjectRow>();
    if(!old) throw new HttpError(404,"Materia non trovata.");
    const name=input.name??old.name, key=subjectKey(name), archived=input.archived===undefined?old.archived_at:input.archived?Date.now():null;
    if(input.name!==undefined){const existing=await this.db.prepare("SELECT name FROM class_subjects WHERE class_id=? AND id<>?").bind(classId,id).all<{name:string}>();
      if(existing.results.some(subject=>subjectKey(subject.name)===key))throw new HttpError(409,"Materia già presente.");}
    const changed=await this.db.prepare(`UPDATE OR IGNORE class_subjects SET name=?,name_key=?,archived_at=?,revision=revision+1,updated_at=?
      WHERE id=? AND class_id=? AND revision=? AND EXISTS(SELECT 1 FROM class_members WHERE class_id=? AND user_id=? AND role IN ('owner','moderator'))`)
      .bind(name,key,archived,Date.now(),id,classId,input.baseRevision,classId,userId).run();
    if(role!=="owner"&&role!=="moderator") throw new HttpError(403,"Azione non consentita.");
    if(changed.meta.changes!==1) throw new HttpError(409,"Materia modificata altrove o nome già usato.");
    const row=await this.db.prepare("SELECT * FROM class_subjects WHERE id=?").bind(id).first<SubjectRow>();
    return classSubject(row!);
  }
  async deleteClassSubject(classId:string,id:string,userId:string,baseRevision:number) {
    const changed=await this.db.prepare(`DELETE FROM class_subjects WHERE id=? AND class_id=? AND revision=? AND EXISTS(SELECT 1 FROM class_members WHERE class_id=? AND user_id=? AND role IN ('owner','moderator'))`)
      .bind(id,classId,baseRevision,classId,userId).run();
    if(changed.meta.changes!==1) throw new HttpError(409,"Materia modificata altrove.");
  }
  async classNotes(classId:string,userId:string,after="") {
    const rows=await this.db.prepare(`SELECT n.*, EXISTS(SELECT 1 FROM class_note_pins p WHERE p.note_id=n.id AND p.user_id=?) pinned
      FROM class_notes n WHERE n.class_id=? AND n.id>? AND n.deleted_at IS NULL
      AND EXISTS(SELECT 1 FROM class_members WHERE class_id=n.class_id AND user_id=?) ORDER BY n.id LIMIT 51`)
      .bind(userId,classId,after,userId).all<SharedRow>();
    const result=page(rows.results.map(sharedNote));
    return { notes:result.items,nextAfter:result.items.at(-1)?.id??after,hasMore:result.hasMore };
  }
  async authoredNotes(userId:string,after="") {
    const rows=await this.db.prepare(`SELECT n.*,0 pinned FROM class_notes n WHERE n.author_id=? AND n.id>? ORDER BY n.id LIMIT 51`)
      .bind(userId,after).all<SharedRow>();
    const result=page(rows.results.map(sharedNote));
    return { notes:result.items,nextAfter:result.items.at(-1)?.id??after,hasMore:result.hasMore };
  }
  async classOne(classId:string,id:string,userId:string) {
    const row=await this.db.prepare(`SELECT n.*,EXISTS(SELECT 1 FROM class_note_pins p WHERE p.note_id=n.id AND p.user_id=?) pinned
      FROM class_notes n WHERE n.class_id=? AND n.id=? AND n.deleted_at IS NULL
      AND EXISTS(SELECT 1 FROM class_members WHERE class_id=n.class_id AND user_id=?)`)
      .bind(userId,classId,id,userId).first<SharedRow>();
    return row?sharedNote(row):null;
  }
  private async classSubjectForNote(classId:string,id:string) {
    const row=await this.db.prepare("SELECT * FROM class_subjects WHERE id=? AND class_id=? AND archived_at IS NULL").bind(id,classId).first<SubjectRow>();
    if(!row) throw new HttpError(400,"Scegli una materia della classe attiva.");
    return row;
  }
  async createClassNote(user:AccountIdentity,classId:string,input:{id:string;subjectId:string;title:string;content:string;mutationId:string}) {
    const old=await this.classOne(classId,input.id,user.id);
    if(old){ if(old.lastMutationId===input.mutationId) return old; throw new HttpError(409,"Appunto già creato."); }
    const subject=await this.classSubjectForNote(classId,input.subjectId);
    const size=noteByteSize({...input,subjectName:subject.name});
    if(size>65536) throw new HttpError(413,"Appunto troppo grande.");
    const now=Date.now();
    try {
      const changed=await this.db.prepare(`INSERT OR IGNORE INTO class_notes
        (id,class_id,class_name,author_id,author_name,subject_id,subject_name,title,content,revision,byte_size,last_mutation_id,created_at,updated_at,deleted_at)
        SELECT ?,c.id,c.name,?,m.display_name,?,?,?,?,1,?,?,?, ?,NULL FROM classes c JOIN class_members m ON m.class_id=c.id AND m.user_id=? WHERE c.id=?`)
        .bind(input.id,user.id,input.subjectId,subject.name,input.title,input.content,size,input.mutationId,now,now,user.id,classId).run();
      if(changed.meta.changes!==1) throw new HttpError(409,"Accesso alla classe cambiato.");
    } catch(error){throw quotaError(error);}
    return (await this.classOne(classId,input.id,user.id))!;
  }
  async updateClassNote(userId:string,classId:string,id:string,input:{subjectId:string;title:string;content:string;mutationId:string;baseRevision:number}) {
    const old=await this.classOne(classId,id,userId);
    if(!old) throw new HttpError(404,"Appunto non trovato.");
    if(old.lastMutationId===input.mutationId) return old;
    if(old.authorId!==userId) throw new HttpError(403,"Solo l'autore può modificare l'appunto.");
    if(old.revision!==input.baseRevision) throw new HttpError(409,"Appunto modificato altrove.");
    const subject= input.subjectId===old.subjectId ? {name:old.subjectName} : await this.classSubjectForNote(classId,input.subjectId);
    const size=noteByteSize({id,...input,subjectName:subject.name});
    if(size>65536) throw new HttpError(413,"Appunto troppo grande.");
    try {
      const changed=await this.db.prepare(`UPDATE class_notes SET subject_id=?,subject_name=?,title=?,content=?,byte_size=?,revision=revision+1,last_mutation_id=?,updated_at=?
        WHERE id=? AND class_id=? AND author_id=? AND revision=? AND deleted_at IS NULL
        AND EXISTS(SELECT 1 FROM class_members WHERE class_id=? AND user_id=?)`)
        .bind(input.subjectId,subject.name,input.title,input.content,size,input.mutationId,Date.now(),id,classId,userId,input.baseRevision,classId,userId).run();
      if(changed.meta.changes!==1) throw new HttpError(409,"Appunto modificato altrove.");
    } catch(error){throw quotaError(error);}
    return (await this.classOne(classId,id,userId))!;
  }
  async deleteClassNote(userId:string,classId:string,id:string,baseRevision:number,mutationId:string) {
    const old=await this.classOne(classId,id,userId);
    if(!old) throw new HttpError(404,"Appunto non trovato.");
    if(old.lastMutationId===mutationId) return old;
    if(old.revision!==baseRevision) throw new HttpError(409,"Appunto modificato altrove.");
    const changed=await this.db.prepare(`UPDATE class_notes SET title='',content='',byte_size=0,deleted_at=?,revision=revision+1,last_mutation_id=?,updated_at=?
      WHERE id=? AND class_id=? AND revision=? AND deleted_at IS NULL AND EXISTS(
        SELECT 1 FROM class_members WHERE class_id=? AND user_id=? AND (user_id=class_notes.author_id OR role IN ('owner','moderator')))`)
      .bind(Date.now(),mutationId,Date.now(),id,classId,baseRevision,classId,userId).run();
    if(changed.meta.changes!==1) throw new HttpError(403,"Azione non consentita o appunto modificato.");
    return (await this.authoredOne(userId,id))??{...old,deletedAt:Date.now(),content:"",title:""};
  }
  async authoredOne(userId:string,id:string) {
    const row=await this.db.prepare("SELECT n.*,0 pinned FROM class_notes n WHERE n.author_id=? AND n.id=?").bind(userId,id).first<SharedRow>();
    return row?sharedNote(row):null;
  }
  async withdrawAuthored(userId:string,id:string,baseRevision:number,mutationId:string) {
    const old=await this.authoredOne(userId,id);
    if(!old) throw new HttpError(404,"Appunto non trovato.");
    if(old.lastMutationId===mutationId) return old;
    const changed=await this.db.prepare(`UPDATE class_notes SET title='',content='',byte_size=0,deleted_at=?,revision=revision+1,last_mutation_id=?,updated_at=?
      WHERE id=? AND author_id=? AND revision=? AND deleted_at IS NULL`)
      .bind(Date.now(),mutationId,Date.now(),id,userId,baseRevision).run();
    if(changed.meta.changes!==1) throw new HttpError(409,"Appunto modificato altrove.");
    return (await this.authoredOne(userId,id))!;
  }
  async pin(userId:string,classId:string,id:string,value:boolean) {
    const note=await this.classOne(classId,id,userId);
    if(!note) throw new HttpError(404,"Appunto non trovato.");
    if(value) await this.db.prepare(`INSERT OR IGNORE INTO class_note_pins(note_id,user_id) SELECT n.id,? FROM class_notes n
      WHERE n.id=? AND n.class_id=? AND n.deleted_at IS NULL AND EXISTS(SELECT 1 FROM class_members WHERE class_id=? AND user_id=?)`).bind(userId,id,classId,classId,userId).run();
    else await this.db.prepare("DELETE FROM class_note_pins WHERE note_id=? AND user_id=? AND EXISTS(SELECT 1 FROM class_members WHERE class_id=? AND user_id=?)").bind(id,userId,classId,userId).run();
    return {ok:true};
  }
}

function quotaError(error:unknown) {
  if(error instanceof Error && error.message.includes("NOTES_LIMIT")) return new HttpError(413,"Limite di appunti o spazio raggiunto.");
  return error;
}
