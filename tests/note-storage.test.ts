import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { persistPersonalDraft,readPersonal,beginPersonalWrite,acceptPersonalNote,applyPersonalPage,readMeta,NoteDeviceConflict } from '../lib/notes/storage';
import type { NoteDraft,PersonalNote } from '../types/notes';
const draft=(userId=crypto.randomUUID()):NoteDraft=>({userId,id:crypto.randomUUID(),space:'personal',subjectId:'subject',subjectName:'Fisica',title:'Energia',content:'Primo testo',contentFormat:'plain',pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:0});
const remote=(d:NoteDraft,revision=1):PersonalNote=>({id:d.id,subjectId:d.subjectId,subjectName:d.subjectName,title:d.title.trim(),content:d.content,contentFormat:d.contentFormat,pinned:d.pinned,revision,changeSeq:revision,lastMutationId:d.mutationId,createdAt:1,updatedAt:revision,deletedAt:d.deleted?revision:null});

test('typing during an in-flight write rebases only the server-confirmed ancestor',async()=>{
  const first=await persistPersonalDraft(draft(),null);
  await beginPersonalWrite(first.userId,first.id);
  const newer=await persistPersonalDraft({...first,content:'Secondo testo',contentFormat:'md-lite-v1',mutationId:crypto.randomUUID()},first);
  await acceptPersonalNote(first.userId,remote(first));
  const record=await readPersonal(first.userId,first.id);
  assert.equal(record?.draft?.content,'Secondo testo');assert.equal(record?.draft?.conflict,undefined);
  assert.equal(record?.draft?.baseRevision,1);assert.equal(record?.draft?.expectedContentFormat,'plain');
  // The editor still has its pre-acknowledgement expected snapshot.
  const last=await persistPersonalDraft({...newer,content:'Terzo testo',mutationId:crypto.randomUUID()},newer);
  assert.equal(last.baseRevision,1);assert.equal(last.contentFormat,'md-lite-v1');
  await beginPersonalWrite(last.userId,last.id);await acceptPersonalNote(last.userId,remote(last,2));
  assert.equal((await readPersonal(last.userId,last.id))?.draft,null);
});

test('a lost response retains the exact submitted payload while later edits remain local',async()=>{
  const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);
  const second=await persistPersonalDraft({...first,content:'Non perdere questa modifica',mutationId:crypto.randomUUID()},first);
  const retry=await beginPersonalWrite(first.userId,first.id);
  assert.equal(retry?.inFlight?.mutationId,first.mutationId);assert.equal(retry?.inFlight?.content,first.content);
  assert.equal(retry?.draft?.content,second.content);
  await applyPersonalPage(first.userId,[remote(first)],1,0,true);
  const record=await readPersonal(first.userId,first.id);
  assert.equal(record?.inFlight,null);assert.equal(record?.draft?.baseRevision,1);assert.equal(record?.draft?.conflict,undefined);
});

test('a concurrently committed acknowledgement and next local save cannot overwrite text',async()=>{
  for(let i=0;i<12;i++){
    const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);
    const latest={...first,content:'Ultimo testo',mutationId:crypto.randomUUID()};
    await Promise.all([acceptPersonalNote(first.userId,remote(first)),persistPersonalDraft(latest,first)]);
    const record=await readPersonal(first.userId,first.id);
    assert.equal(record?.draft?.content,latest.content);assert.equal(record?.draft?.baseRevision,1);assert.equal(record?.draft?.conflict,undefined);
  }
});

test('another tab changes the draft: stale writer is rejected and neither text is overwritten',async()=>{
  const first=await persistPersonalDraft(draft(),null);
  const second=await persistPersonalDraft({...first,content:'Altra scheda',mutationId:crypto.randomUUID()},first);
  await assert.rejects(persistPersonalDraft({...first,content:'Scheda vecchia',mutationId:crypto.randomUUID()},first),NoteDeviceConflict);
  assert.equal((await readPersonal(first.userId,first.id))?.draft?.content,second.content);
});

test('a real remote conflict stays explicit and does not become a blind rebase',async()=>{
  const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);
  const other={...remote(first),content:'Un altro dispositivo',lastMutationId:crypto.randomUUID()};
  await acceptPersonalNote(first.userId,other);
  const record=await readPersonal(first.userId,first.id);
  assert.equal(record?.draft?.content,first.content);assert.equal(record?.draft?.conflict?.content,other.content);
  await assert.rejects(persistPersonalDraft({...first,content:'Tentativo',mutationId:crypto.randomUUID()},first),NoteDeviceConflict);
});

test('stale paginated reads cannot roll back an acknowledgement or the cursor',async()=>{
  const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);
  await applyPersonalPage(first.userId,[remote(first)],1,0,true);
  const second=await persistPersonalDraft({...first,baseRevision:1,content:'Più nuovo',mutationId:crypto.randomUUID()},first);
  await beginPersonalWrite(second.userId,second.id);await applyPersonalPage(second.userId,[remote(second,2)],2,1,true);
  await applyPersonalPage(second.userId,[remote(first)],1,0,false);
  const record=await readPersonal(second.userId,second.id);
  assert.equal(record?.remote?.content,'Più nuovo');assert.equal(record?.draft,null);
  assert.deepEqual(await readMeta(second.userId),{cursor:2,complete:true});
});

test('a confirmed delete clears its pending tombstone instead of creating a conflict',async()=>{
  const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);await acceptPersonalNote(first.userId,remote(first));
  const removed=await persistPersonalDraft({...first,deleted:true,baseRevision:1,mutationId:crypto.randomUUID()},first);
  await beginPersonalWrite(removed.userId,removed.id);await acceptPersonalNote(removed.userId,{...remote(removed,2),content:'',title:''});
  const record=await readPersonal(removed.userId,removed.id);assert.equal(record?.draft,null);assert.equal(record?.remote?.deletedAt,2);
});

test('an incomplete draft cannot become an in-flight write while another edit repairs it',async()=>{
  const first=await persistPersonalDraft({...draft(),title:''},null);
  assert.equal((await beginPersonalWrite(first.userId,first.id))?.inFlight,undefined);
  const next=await persistPersonalDraft({...first,title:'Completo',mutationId:crypto.randomUUID()},first);
  assert.equal((await beginPersonalWrite(next.userId,next.id))?.inFlight?.mutationId,next.mutationId);
});

test('a definitively rejected write is released so corrected text can be synchronized',async()=>{
  const {rejectPersonalWrite}=await import('../lib/notes/storage');
  const first=await persistPersonalDraft(draft(),null);await beginPersonalWrite(first.userId,first.id);
  const next=await persistPersonalDraft({...first,content:'Corretto',mutationId:crypto.randomUUID()},first);
  await rejectPersonalWrite(first.userId,first.id,first.mutationId);
  const started=await beginPersonalWrite(next.userId,next.id);
  assert.equal(started?.inFlight?.content,'Corretto');assert.equal(started?.inFlight?.mutationId,next.mutationId);
});

test('an IndexedDB write failure aborts atomically and the next retry can succeed',async()=>{
  const first=draft(),original=IDBObjectStore.prototype.put;let rejectOnce=true;
  IDBObjectStore.prototype.put=function(value,key){if(rejectOnce){rejectOnce=false;throw new DOMException('quota','QuotaExceededError');}return original.call(this,value,key);};
  try{
    await assert.rejects(persistPersonalDraft(first,null),{name:'QuotaExceededError'});
    assert.equal(await readPersonal(first.userId,first.id),null);
    const saved=await persistPersonalDraft(first,null);assert.equal(saved.content,first.content);
  }finally{IDBObjectStore.prototype.put=original;}
});

test('class drafts reject another tab without poisoning subsequent valid writes',async()=>{
  const {saveClassDraft,listClassDrafts}=await import('../lib/notes/storage');
  const first={...draft(),space:'class' as const,classId:'class',localVersion:1};await saveClassDraft(first,null);
  const second={...first,content:'Altra scheda',mutationId:crypto.randomUUID(),localVersion:2};await saveClassDraft(second,first);
  await assert.rejects(saveClassDraft({...first,content:'Vecchio'},first),NoteDeviceConflict);
  const last={...second,content:'Ultimo testo',mutationId:crypto.randomUUID(),localVersion:3};await saveClassDraft(last,second);
  assert.equal((await listClassDrafts(first.userId))[0].content,'Ultimo testo');
});
