import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createDiary } from "../lib/new-diary";
import { backupSchema } from "../lib/validation";
import { makeNotesBackup,parseAnyBackup,planNotesImport,remapDiaryForImport,estimatedImportUsage } from "../lib/notes/backup";
import { noteCreate,noteUpdate,classNoteCreate,classNoteUpdate,subjectKey,validateNoteBytes,localDraftBytes } from "../lib/notes/validation";
import { personalWriteBody,classWriteBody } from "../lib/notes/request-body";
import type { PersonalNote,NoteDraft,ClassNote } from "../types/notes";

function migratedDb(beforeNotes?: (db:DatabaseSync)=>void){
  const db=new DatabaseSync(":memory:");db.exec("PRAGMA foreign_keys=ON");
  for(let index=0;index<=5;index++){
    const file=["0000_glorious_crusher_hogan","0001_amused_tombstone","0002_loving_roland_deschain","0003_melted_dark_phoenix","0004_glossy_stranger","0005_heavy_elektra"][index];
    if(index===5)beforeNotes?.(db);
    const sql=readFileSync(new URL(`../drizzle/${file}.sql`,import.meta.url),"utf8");
    for(const statement of sql.split("--> statement-breakpoint"))if(statement.trim())db.exec(statement);
  }
  return db;
}
function account(db:DatabaseSync,id:string){db.prepare("INSERT INTO accounts(id,username,password_hash,recovery_hash,created_at) VALUES(?,?,?,?,?)").run(id,id,"hash","recovery",1);}
function personal(db:DatabaseSync,id:string,userId:string,bytes=100){
  db.prepare(`INSERT INTO personal_notes(id,user_id,subject_id,subject_name,title,content,pinned,revision,change_seq,byte_size,last_mutation_id,created_at,updated_at,deleted_at)
    VALUES(?,?,'subject','Subject','Title','Text',0,1,0,?,'mutation',1,1,NULL)`).run(id,userId,bytes);
}
test("additive note migration seeds legacy class labels and keeps authored text after class deletion",()=>{
  const db=migratedDb(db=>{
    account(db,"author");
    db.prepare("INSERT INTO classes(id,name,description,owner_id,settings,created_at,updated_at) VALUES('class','Class','', 'author','{}',1,1)").run();
    db.prepare("INSERT INTO class_members(class_id,user_id,role,display_name,joined_at) VALUES('class','author','owner','Author',1)").run();
    for(const [id,label] of [["event-one","Matematica"],["event-two","matematica"]])db.prepare("INSERT INTO class_events(id,class_id,author_id,subject,kind,title,description,due_at,status,revision,created_at,updated_at) VALUES(?,'class','author',?,'task','Task','','2026-10-01T00:00:00Z','active',1,1,1)").run(id,label);
  });
  try{
    assert.equal((db.prepare("SELECT count(*) n FROM class_subjects WHERE class_id='class'").get() as {n:number}).n,1);
    const subject=db.prepare("SELECT id FROM class_subjects WHERE class_id='class'").get() as {id:string};
    assert.ok(subject.id.length<150);
    db.prepare("INSERT INTO class_events(id,class_id,author_id,subject,kind,title,description,due_at,status,revision,created_at,updated_at) VALUES('event-three','class','author','History','task','Task','','2026-10-01T00:00:00Z','active',1,1,1)").run();
    assert.equal((db.prepare("SELECT count(*) n FROM class_subjects WHERE class_id='class'").get() as {n:number}).n,2);
    db.prepare("INSERT INTO class_notes(id,class_id,class_name,author_id,author_name,subject_id,subject_name,title,content,revision,byte_size,last_mutation_id,created_at,updated_at,deleted_at) VALUES('note','class','Class','author','Author',?,'Matematica','Title','Survives',1,100,'mutation',1,1,NULL)").run(subject.id);
    db.prepare("DELETE FROM class_subjects WHERE id=?").run(subject.id);
    assert.equal((db.prepare("SELECT content FROM class_notes WHERE id='note'").get() as {content:string}).content,"Survives");
    db.prepare("DELETE FROM classes WHERE id='class'").run();
    assert.deepEqual({...db.prepare("SELECT class_id,author_id,content FROM class_notes WHERE id='note'").get()},{class_id:null,author_id:"author",content:"Survives"});
  }finally{db.close();}
});
test("personal note sequence, tombstone and quotas are independent from diary snapshots",()=>{
  const db=migratedDb();try{
    account(db,"a");account(db,"b");personal(db,"one","a");personal(db,"other","b");
    assert.equal((db.prepare("SELECT change_seq n FROM personal_notes WHERE user_id='a' AND id='one'").get() as {n:number}).n,1);
    db.prepare("UPDATE personal_notes SET content='Edited',revision=2 WHERE user_id='a' AND id='one'").run();
    assert.equal((db.prepare("SELECT change_seq n FROM personal_notes WHERE user_id='a' AND id='one'").get() as {n:number}).n,2);
    assert.equal((db.prepare("SELECT change_seq n FROM personal_notes WHERE user_id='b' AND id='other'").get() as {n:number}).n,1);
    db.prepare("UPDATE personal_notes SET content='',title='',byte_size=0,deleted_at=3,revision=3 WHERE user_id='a' AND id='one'").run();
    assert.equal((db.prepare("SELECT change_seq n FROM personal_notes WHERE user_id='a' AND id='one'").get() as {n:number}).n,3);
    personal(db,"big","a",8*1024*1024);
    assert.throws(()=>personal(db,"over","a",1),/NOTES_LIMIT/);
    assert.equal((db.prepare("SELECT count(*) n FROM personal_notes WHERE user_id='a' AND deleted_at IS NULL").get() as {n:number}).n,1);
  }finally{db.close();}
});
test("note validation and backup V1/V2 remap diary references without mutating source",()=>{
  const diary=createDiary({name:"Tester",school:"",semester:"S1",schoolYear:"2026/27",startDate:"2026-08-01",endDate:"2027-01-31",preset:"basic"});
  const subject=diary.data.subjects[0],id=crypto.randomUUID(),mutationId=crypto.randomUUID();
  assert.ok(!noteCreate.safeParse({id,expectedUserId:"u",mutationId,baseRevision:0,subjectId:subject.id,subjectName:subject.name,title:" ",content:""}).success);
  assert.ok(!noteUpdate.safeParse({expectedUserId:"u",mutationId,baseRevision:1,subjectId:subject.id,subjectName:subject.name,title:"Title",content:"x".repeat(20001),pinned:false}).success);
  assert.equal(subjectKey(" Mathématiques "),"mathematiques");
  assert.equal(validateNoteBytes({id,subjectId:subject.id,subjectName:subject.name,title:"Title",content:"Text"}),true);
  assert.equal(validateNoteBytes({id,subjectId:subject.id,subjectName:subject.name,title:"Title",content:"🙂".repeat(20_000)}),false);
  const v1=backupSchema.parse({app:"iPagell",exportedAt:new Date().toISOString(),data:diary.data,preferences:diary.preferences});
  assert.deepEqual(parseAnyBackup(v1),v1);
  const originalId=diary.data.subjects[0].id;
  const mapped=remapDiaryForImport(diary.data,diary.preferences);
  assert.notEqual(mapped.data.subjects[0].id,originalId);
  assert.equal(diary.data.subjects[0].id,originalId);
  assert.equal(mapped.preferences.currentSemesterId,mapped.data.semesters[0].id);
  const note:PersonalNote={id,subjectId:originalId,subjectName:subject.name,title:"<script>alert(1)</script>",content:"Safe text",pinned:false,revision:1,changeSeq:1,lastMutationId:mutationId,createdAt:1,updatedAt:1,deletedAt:null};
  const backup=makeNotesBackup(diary.data,diary.preferences,[],[{userId:"u",id,remote:note,draft:null,localVersion:1}],[],[],true);
  assert.equal(parseAnyBackup(backup).app,"iPagell");
  const plan=planNotesImport("another",backup);
  assert.notEqual(plan.entries[0].id,id);
  assert.equal(plan.entries[0].subjectId,plan.data.subjects[0].id);
  assert.equal(estimatedImportUsage([],backup).withinLimit,true);
});
test("create and edit payloads match strict API schemas without extra IDs",()=>{
  const draft:NoteDraft={userId:"u",id:crypto.randomUUID(),space:"personal",subjectId:"subject-1",subjectName:"Matematica",title:" Titolo ",content:"Testo",pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:1,localEditedAt:1};
  assert.equal(noteCreate.parse(personalWriteBody(draft,"u",true)).title,"Titolo");
  assert.equal(classNoteCreate.parse(classWriteBody(draft,"u",true)).title,"Titolo");
  const edited={...draft,baseRevision:1,mutationId:crypto.randomUUID()};
  assert.equal(noteUpdate.parse(personalWriteBody(edited,"u",false)).title,"Titolo");
  assert.equal(classNoteUpdate.parse(classWriteBody(edited,"u",false)).title,"Titolo");
  assert.equal("id" in personalWriteBody(edited,"u",false),false);
  assert.equal("id" in classWriteBody(edited,"u",false),false);
  const classDraft={...draft,space:"class" as const,id:crypto.randomUUID(),classId:"class-1"};
  const replaced={...classDraft,content:"Nuovo testo"};
  assert.equal(localDraftBytes([draft],[classDraft],replaced),new TextEncoder().encode(JSON.stringify([draft,replaced])).byteLength);
});
test("backup keeps a private class draft and restores class text only as unassigned personal copies",()=>{
  const diary=createDiary({name:"Tester",school:"",semester:"S1",schoolYear:"2026/27",startDate:"2026-08-01",endDate:"2027-01-31",preset:"basic"});
  const draft:NoteDraft={userId:"original-account",id:crypto.randomUUID(),space:"class",classId:"old-class",subjectId:"old-class-subject",subjectName:"Storia",title:"Bozza",content:"Non pubblicata",pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:1,localEditedAt:1};
  const authored:ClassNote={id:crypto.randomUUID(),classId:null,className:"Classe passata",authorId:"original-account",authorName:"Autore",subjectId:"old-class-subject",subjectName:"Storia",title:"Pubblicata",content:"Testo conservato",revision:1,lastMutationId:crypto.randomUUID(),createdAt:1,updatedAt:1,deletedAt:null,pinned:false};
  const backup=makeNotesBackup(diary.data,diary.preferences,[],[],[draft],[authored],false);
  assert.equal(backup.completeness,"device-only");
  assert.equal("userId" in backup.classDrafts[0],false);
  assert.equal("authorId" in backup.authoredClassNotes[0],false);
  const plan=planNotesImport("new-account",backup);
  assert.deepEqual(plan.entries.map(entry=>entry.subjectId),["",""]);
  assert.deepEqual(plan.entries.map(entry=>entry.title),["Bozza","Pubblicata"]);
  assert.ok(plan.entries.every(entry=>entry.userId==="new-account"&&entry.space==="personal"));
});
