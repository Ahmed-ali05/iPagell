import { z } from "zod";
import { backupSchema,schoolDataSchema,preferencesSchema } from "@/lib/validation";
import { backupWithClassAgenda } from "@/lib/classes/backup";
import type { BackupPayload,Preferences,SchoolData } from "@/types/domain";
import type { ClassNote,NotesBackupV2,NotesBackupV3,NoteDraft } from "@/types/notes";
import type { ClassSubscription } from "@/lib/classes/events";
import type { PersonalRecord,ImportPlan } from "./storage";
import { noteContent,noteFormat,noteId,noteTitle,subjectId,validateNoteBytes } from "./validation";

const portableText=z.object({id:noteId,subjectId,subjectName:z.string().max(120),title:noteTitle,content:noteContent,createdAt:z.number(),updatedAt:z.number(),revision:z.number().int().positive(),lastMutationId:noteId,deletedAt:z.number().nullable(),pinned:z.boolean(),changeSeq:z.number().int().nonnegative()}).strict();
const portableDraft=z.object({id:noteId,space:z.enum(["personal","class"]),classId:z.string().optional(),subjectId:z.string().max(150),subjectName:z.string().max(120),title:z.string().max(120),content:noteContent,pinned:z.boolean(),baseRevision:z.number().int().nonnegative(),mutationId:noteId,localVersion:z.number().int().nonnegative(),localEditedAt:z.number(),deleted:z.boolean().optional(),conflict:z.unknown().optional(),sourceLabel:z.string().max(250).optional()}).strict();
const backupV2Base=z.object({
  app:z.literal("iPagell"),backupVersion:z.literal(2),exportedAt:z.string().datetime({offset:true}),data:schoolDataSchema,preferences:preferencesSchema,
  notes:z.array(portableText).max(500),pendingNotes:z.array(portableDraft).max(500),classDrafts:z.array(portableDraft).max(500),
  authoredClassNotes:z.array(z.object({className:z.string().max(120),subjectName:z.string().max(120),title:noteTitle,content:noteContent,updatedAt:z.number()}).strict()).max(4000),
  completeness:z.enum(["complete","device-only"]),
}).strict();
export const backupV2Schema=backupV2Base.refine(value=>value.data.semesters.some(s=>s.id===value.preferences.currentSemesterId));
const portableTextV3=portableText.extend({contentFormat:noteFormat});
const classConflict=z.object({id:noteId,classId:z.string().nullable(),className:z.string(),authorId:z.string(),authorName:z.string(),subjectId,subjectName:z.string(),title:z.string(),content:noteContent,contentFormat:noteFormat,createdAt:z.number(),updatedAt:z.number(),revision:z.number().int().positive(),lastMutationId:noteId,deletedAt:z.number().nullable(),pinned:z.boolean()}).strict();
const portableDraftV3=portableDraft.omit({conflict:true}).extend({contentFormat:noteFormat,expectedContentFormat:noteFormat.optional(),conflict:z.union([portableTextV3,classConflict,z.null()]).optional()});
export const backupV3Schema=backupV2Base.omit({backupVersion:true,notes:true,pendingNotes:true,classDrafts:true,authoredClassNotes:true}).extend({
  backupVersion:z.literal(3),notes:z.array(portableTextV3).max(500),pendingNotes:z.array(portableDraftV3).max(500),classDrafts:z.array(portableDraftV3).max(500),
  authoredClassNotes:z.array(z.object({className:z.string().max(120),subjectName:z.string().max(120),title:noteTitle,content:noteContent,contentFormat:noteFormat,updatedAt:z.number()}).strict()).max(4000),
}).strict().refine(value=>value.data.semesters.some(s=>s.id===value.preferences.currentSemesterId));
function upgradeV2(backup:NotesBackupV2):NotesBackupV3 {
  const upgradeDraft=(draft:NotesBackupV2["pendingNotes"][number])=>({...draft,contentFormat:"plain" as const,expectedContentFormat:"plain" as const,
    conflict:draft.conflict&&typeof draft.conflict==="object"?{...draft.conflict as object,contentFormat:"plain" as const}:draft.conflict});
  return {...backup,backupVersion:3,notes:backup.notes.map(note=>({...note,contentFormat:"plain"})),
    pendingNotes:backup.pendingNotes.map(upgradeDraft),classDrafts:backup.classDrafts.map(upgradeDraft),
    authoredClassNotes:backup.authoredClassNotes.map(note=>({...note,contentFormat:"plain"}))} as NotesBackupV3;
}
export function parseAnyBackup(input:unknown):BackupPayload|NotesBackupV3 {
  if(typeof input==="object"&&input!==null&&"backupVersion" in input){
    if(input.backupVersion===2)return backupV3Schema.parse(upgradeV2(backupV2Schema.parse(input) as NotesBackupV2)) as NotesBackupV3;
    return backupV3Schema.parse(input) as NotesBackupV3;
  }
  return backupSchema.parse(input);
}
const stripUser=(draft:NoteDraft)=>{const {userId:unused,...rest}=draft;void unused;return rest;};
export function makeNotesBackup(data:SchoolData,preferences:Preferences,subscriptions:ClassSubscription[],records:PersonalRecord[],classDrafts:NoteDraft[],authored:ClassNote[],complete:boolean):NotesBackupV3 {
  const diary=backupWithClassAgenda(data,preferences,subscriptions);
  const backup:NotesBackupV3={...diary,backupVersion:3,notes:records.flatMap(r=>r.remote&&!r.remote.deletedAt?[r.remote]:[]),pendingNotes:records.flatMap(r=>r.draft?[stripUser(r.draft)]:[]),classDrafts:classDrafts.map(stripUser),
    authoredClassNotes:authored.filter(n=>!n.deletedAt).map(n=>({className:n.className,subjectName:n.subjectName,title:n.title,content:n.content,contentFormat:n.contentFormat,updatedAt:n.updatedAt})),completeness:complete?"complete":"device-only"};
  const bytes=new TextEncoder().encode(JSON.stringify(backup)).byteLength;
  if(bytes>24*1024*1024)throw new Error("BACKUP_LIMIT");
  return backupV3Schema.parse(backup) as NotesBackupV3;
}

export function remapDiaryForImport(data:SchoolData,preferences:Preferences){
  const semesterIds=new Map(data.semesters.map(s=>[s.id,`semester-${crypto.randomUUID()}`]));
  const subjectIds=new Map(data.subjects.map(s=>[s.id,`subject-${crypto.randomUUID()}`]));
  const gradeTypeIds=new Map(data.subjects.flatMap(s=>s.gradeTypes.map(g=>[`${s.id}:${g.id}`,`grade-type-${crypto.randomUUID()}`] as const)));
  const copy:SchoolData={...data,updatedAt:new Date().toISOString(),
    semesters:data.semesters.map(s=>({...s,id:semesterIds.get(s.id)!})),
    subjects:data.subjects.map(s=>({...s,id:subjectIds.get(s.id)!,gradeTypes:s.gradeTypes.map(g=>({...g,id:gradeTypeIds.get(`${s.id}:${g.id}`)!}))})),
    grades:data.grades.map(g=>({...g,id:`grade-${crypto.randomUUID()}`,semesterId:semesterIds.get(g.semesterId)!,subjectId:subjectIds.get(g.subjectId)!,typeId:gradeTypeIds.get(`${g.subjectId}:${g.typeId}`)!})),
    agenda:data.agenda.map(a=>({...a,id:`agenda-${crypto.randomUUID()}`,semesterId:semesterIds.get(a.semesterId)!,subjectId:subjectIds.get(a.subjectId)!,typeId:a.typeId?gradeTypeIds.get(`${a.subjectId}:${a.typeId}`):undefined})),
    absences:data.absences.map(a=>({...a,id:`absence-${crypto.randomUUID()}`,semesterId:semesterIds.get(a.semesterId)!,subjectId:a.subjectId?subjectIds.get(a.subjectId):undefined})),
  };
  return {data:copy,preferences:{...preferences,currentSemesterId:semesterIds.get(preferences.currentSemesterId)!},subjectIds};
}
export function estimatedImportUsage(existing:PersonalRecord[],backup:NotesBackupV3){
  const active=existing.filter(r=>r.remote&&!r.remote.deletedAt||r.draft&&!r.draft.deleted).length;
  const imported=backup.notes.length+backup.pendingNotes.filter(d=>!d.deleted).length+backup.classDrafts.length+backup.authoredClassNotes.length;
  const bytes=existing.reduce((sum,r)=>{const note=r.draft??r.remote;return sum+(note&&!("deletedAt" in note&&note.deletedAt)&&!("deleted" in note&&note.deleted)?new TextEncoder().encode(JSON.stringify(note)).byteLength:0);},0)+
    [...backup.notes,...backup.pendingNotes,...backup.classDrafts,...backup.authoredClassNotes].reduce((sum,n)=>sum+new TextEncoder().encode(JSON.stringify(n)).byteLength,0);
  return {count:active+imported,bytes,withinLimit:active+imported<=500&&bytes<=8*1024*1024&&[...backup.notes,...backup.pendingNotes,...backup.classDrafts,...backup.authoredClassNotes].every(n=>validateNoteBytes({id:crypto.randomUUID(),subjectId:"",subjectName:n.subjectName,title:n.title,content:n.content,contentFormat:n.contentFormat}))};
}

export function planNotesImport(userId:string,backup:NotesBackupV3):ImportPlan {
  const mapped=remapDiaryForImport(backup.data,backup.preferences);
  const entries:NoteDraft[]=[];
  const add=(value:{subjectId:string;subjectName:string;title:string;content:string;contentFormat:"plain"|"md-lite-v1";pinned?:boolean},sourceLabel?:string)=>{
    const subject=mapped.subjectIds.get(value.subjectId)??"";
    entries.push({userId,id:crypto.randomUUID(),space:"personal",subjectId:subject,subjectName:value.subjectName,title:value.title,content:value.content,contentFormat:value.contentFormat,pinned:!!value.pinned,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now(),sourceLabel});
  };
  for(const note of backup.notes)add(note);
  for(const draft of backup.pendingNotes)if(!draft.deleted)add(draft,draft.conflict?"Conflict":"Pending");
  for(const draft of backup.classDrafts)add({...draft,subjectId:""},draft.sourceLabel??draft.classId??"Class draft");
  for(const note of backup.authoredClassNotes)add({...note,subjectId:""},`${note.className} · ${note.subjectName}`);
  return {userId,data:mapped.data,preferences:mapped.preferences,entries,next:0,diaryCommitted:false,createdAt:Date.now()};
}
