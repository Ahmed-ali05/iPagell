import { z } from "zod";
import type { AccountIdentity } from "@/types/domain";
import { eventFields, subscriptionInput, subscriptionUpdate, type ClassEvent, type ClassSubscription } from "@/lib/classes/events";
import { HttpError } from "./http";

const snapshot = `json_object('id',e.id,'classId',e.class_id,'className',c.name,'authorId',e.author_id,'authorName',COALESCE(m.display_name,'Ex membro'),'subject',e.subject,'kind',e.kind,'title',e.title,'description',e.description,'dueAt',e.due_at,'status',e.status,'revision',e.revision,'updatedAt',e.updated_at)`;
const eventJoin = "FROM class_events e JOIN classes c ON c.id=e.class_id LEFT JOIN class_members m ON m.class_id=e.class_id AND m.user_id=e.author_id";
const editor = "EXISTS (SELECT 1 FROM class_members a WHERE a.class_id=class_events.class_id AND a.user_id=? AND (a.role IN ('owner','moderator') OR class_events.author_id=a.user_id))";
type SubRow = { id: string; snapshot: string; semester_id: string; subject_id: string; completed: number; reminder: number; revision: number; detached_at: number | null };
const toSub = (r: SubRow): ClassSubscription => ({ id:r.id, event:JSON.parse(r.snapshot), semesterId:r.semester_id, subjectId:r.subject_id, completed:!!r.completed, reminder:!!r.reminder, revision:r.revision, detachedAt:r.detached_at });

export class ClassEventRepository {
  constructor(private db: D1Database) {}
  async list(user: AccountIdentity, classId: string) {
    const rows = await this.db.prepare(`SELECT ${snapshot} AS payload ${eventJoin}
      WHERE e.class_id=? AND EXISTS (SELECT 1 FROM class_members a WHERE a.class_id=e.class_id AND a.user_id=?)
      ORDER BY e.due_at DESC LIMIT 500`).bind(classId,user.id).all<{payload:string}>();
    return rows.results.map(r => JSON.parse(r.payload) as ClassEvent);
  }
  async create(user: AccountIdentity, classId: string, input: z.infer<typeof eventFields>) {
    const id=crypto.randomUUID(), now=Date.now();
    const r=await this.db.prepare(`INSERT INTO class_events (id,class_id,author_id,subject,kind,title,description,due_at,status,revision,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,?,1,?,? WHERE EXISTS (SELECT 1 FROM class_members WHERE class_id=? AND user_id=?)
      AND (SELECT count(*) FROM class_events WHERE class_id=?)<500`)
      .bind(id,classId,user.id,input.subject,input.kind,input.title,input.description,input.dueAt,input.status,now,now,classId,user.id,classId).run();
    if(r.meta.changes!==1) throw new HttpError(409,"Classe non disponibile o limite di 500 eventi raggiunto.");
    return id;
  }
  async update(user: AccountIdentity, classId: string, id: string, input: z.infer<typeof eventFields>, revision: number) {
    const r=await this.db.prepare(`UPDATE class_events SET subject=?,kind=?,title=?,description=?,due_at=?,status=?,updated_at=?,revision=revision+1
      WHERE id=? AND class_id=? AND revision=? AND ${editor}`)
      .bind(input.subject,input.kind,input.title,input.description,input.dueAt,input.status,Date.now(),id,classId,revision,user.id).run();
    if(r.meta.changes<1) throw new HttpError(409,"Evento modificato da un altro membro o non più modificabile. Aggiorna la lista.");
  }
  async remove(user: AccountIdentity, classId: string, id: string, revision: number) {
    const r=await this.db.prepare(`DELETE FROM class_events WHERE id=? AND class_id=? AND revision=? AND ${editor}`).bind(id,classId,revision,user.id).run();
    if(r.meta.changes<1) throw new HttpError(409,"Evento cambiato o non più modificabile. Aggiorna la lista.");
  }
  async subscriptions(user: AccountIdentity) {
    const rows=await this.db.prepare("SELECT * FROM class_event_subscriptions WHERE user_id=? ORDER BY id").bind(user.id).all<SubRow>();
    return rows.results.map(toSub);
  }
  async subscribe(user: AccountIdentity, eventId: string, input: z.infer<typeof subscriptionInput>) {
    const r=await this.db.prepare(`INSERT INTO class_event_subscriptions (id,user_id,source_event_id,event_id,snapshot,semester_id,subject_id,reminder)
      SELECT ?,?,e.id,e.id,${snapshot},?,?,? ${eventJoin}
      WHERE e.id=? AND e.status='active' AND EXISTS (SELECT 1 FROM class_members a WHERE a.class_id=e.class_id AND a.user_id=?)
      AND (SELECT count(*) FROM class_event_subscriptions WHERE user_id=?)<500
      ON CONFLICT(user_id,source_event_id) DO NOTHING`)
      .bind(crypto.randomUUID(),user.id,input.semesterId,input.subjectId,+input.reminder,eventId,user.id,user.id).run();
    if(r.meta.changes!==1) throw new HttpError(409,"Evento già aggiunto, non disponibile o limite di 500 attività raggiunto.");
  }
  async updateSubscription(user: AccountIdentity, id: string, input: z.infer<typeof subscriptionUpdate>) {
    const edits:string[]=[], values:(string|number)[]=[];
    for(const [field,column] of [["completed","completed"],["reminder","reminder"],["semesterId","semester_id"],["subjectId","subject_id"]] as const) {
      const value=input[field];
      if(value!==undefined) { edits.push(column+"=?"); values.push(typeof value==="boolean" ? +value : value); }
    }
    if(input.detach) { edits.push("event_id=NULL","detached_at=COALESCE(detached_at,?)"); values.push(Date.now()); }
    if(input.personalEvent) {
      edits.push("snapshot=json_set(snapshot,'$.subject',?,'$.kind',?,'$.title',?,'$.description',?,'$.dueAt',?,'$.status',?)");
      const e=input.personalEvent; values.push(e.subject,e.kind,e.title,e.description,e.dueAt,e.status);
    }
    const r=await this.db.prepare(`UPDATE class_event_subscriptions SET ${[...edits,"revision=revision+1"].join(",")}
      WHERE id=? AND user_id=? AND revision=? ${input.personalEvent ? "AND event_id IS NULL" : ""}`).bind(...values,id,user.id,input.revision).run();
    if(r.meta.changes!==1) throw new HttpError(409,"Attività aggiornata altrove o ancora collegata. Ricarica e riprova.");
  }
  async unsubscribe(user: AccountIdentity, id: string, revision: number) {
    const r=await this.db.prepare("DELETE FROM class_event_subscriptions WHERE id=? AND user_id=? AND revision=?").bind(id,user.id,revision).run();
    if(r.meta.changes!==1) throw new HttpError(409,"Attività cambiata. Ricarica e riprova.");
  }
}
