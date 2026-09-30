"use client";
import { lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState } from "react";
import { BookOpen,ChevronLeft,Download,Plus,Search,Star,Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/i18n";
import { searchKey } from "@/lib/notes/validation";
import type { SchoolData } from "@/types/domain";
import type { NoteCopySeed,NoteDraft,PersonalNote } from "@/types/notes";
import type { useNotes } from "@/hooks/use-notes";
import type { PersonalRecord } from "@/lib/notes/storage";
import { readPersonal } from "@/lib/notes/storage";
import { NOTES_FLUSH_EVENT } from "@/lib/notes/flush";
import { NoteContent } from "@/components/note-content";
import { NoteExport } from "@/components/note-export";
import { noteVisibleText } from "@/lib/notes/format";
const NoteEditor=lazy(()=>import("@/components/note-editor"));

type NotesController=ReturnType<typeof useNotes>;
type Selection={kind:"read"|"edit";id:string}|null;
const dateOptions:Intl.DateTimeFormatOptions={day:"numeric",month:"short",year:"numeric"};
function currentText(record:PersonalRecord){return record.draft??record.remote;}
function editedAt(value:NoteDraft|PersonalNote){return "localEditedAt" in value?value.localEditedAt:value.updatedAt;}
function sortRecords(a:PersonalRecord,b:PersonalRecord){
  const x=currentText(a)!,y=currentText(b)!;
  return Number(!!y.pinned)-Number(!!x.pinned)||editedAt(y)-editedAt(x)||a.id.localeCompare(b.id);
}
function downloadText(name:string,text:string){
  const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=`${name||"appunto"}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function copiedDraft(note:{subjectName:string;title:string;content:string;contentFormat:NoteDraft["contentFormat"]}):NoteDraft{
  return {userId:"",id:crypto.randomUUID(),space:"personal",subjectId:"",subjectName:note.subjectName,title:note.title,content:note.content,contentFormat:note.contentFormat,pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
}
function pinDraft(record:PersonalRecord):NoteDraft|null{
  const value=currentText(record);if(!value)return null;
  return {userId:"",id:record.id,space:"personal",subjectId:value.subjectId,subjectName:value.subjectName,title:value.title,content:value.content,contentFormat:value.contentFormat,expectedContentFormat:record.remote?.contentFormat??"plain",pinned:!value.pinned,baseRevision:record.remote?.revision??0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
}

export function PersonalNotesView({controller,userId,data,initialSubjectId="",initialNew=false,initialOpenId="",onAddSubject,onCopyToClass}:{controller:NotesController;userId:string;data:SchoolData;initialSubjectId?:string;initialNew?:boolean;initialOpenId?:string;onAddSubject:()=>void;onCopyToClass:(note:NoteCopySeed)=>void}){
  const {t,locale}=useI18n();
  const [selection,setSelection]=useState<Selection>(null),[query,setQuery]=useState(""),[filter,setFilter]=useState(initialSubjectId),[error,setError]=useState("");
  const [archiveOpen,setArchiveOpen]=useState(false),[archive,setArchive]=useState<import("@/types/notes").ClassNote[]>([]),[archiveStatus,setArchiveStatus]=useState<"idle"|"loading"|"ready"|"error">("idle");
  const openedInitial=useRef(false);
  const records=useMemo(()=>controller.records.filter(r=>(r.draft&&!r.draft.deleted)||(!r.draft&&r.remote&&!r.remote.deletedAt)).sort(sortRecords),[controller.records]);
  const visible=useMemo(()=>records.filter(r=>{const value=currentText(r)!;const haystack=searchKey(`${value.title} ${noteVisibleText(value.contentFormat,value.content)}`);const matches=filter==="missing"?!data.subjects.some(s=>s.id===value.subjectId):!filter||value.subjectId===filter;return matches&&haystack.includes(searchKey(query));}),[records,filter,query,data.subjects]);
  const selected=selection?controller.records.find(r=>r.id===selection.id)??null:null;
  const subjectName=(id:string,fallback:string)=>data.subjects.find(s=>s.id===id)?.name??`${t("notes.missingSubject")} · ${fallback}`;
  const newNote=(subjectId=filter)=>{if(!data.subjects.length){onAddSubject();return;}const id=crypto.randomUUID();setSelection({kind:"edit",id});setError("");if(subjectId)setFilter(subjectId);};
  useEffect(()=>{if(!initialNew||openedInitial.current)return;openedInitial.current=true;queueMicrotask(()=>{if(!data.subjects.length)onAddSubject();else setSelection({kind:"edit",id:crypto.randomUUID()});});},[initialNew,data.subjects.length,onAddSubject]);
  useEffect(()=>{if(initialOpenId)queueMicrotask(()=>setSelection({kind:"edit",id:initialOpenId}));},[initialOpenId]);
  const archiveLoad=async()=>{
    setArchiveStatus("loading");try{let after="",all:import("@/types/notes").ClassNote[]=[];
      do{const result=await controller.request<{notes:import("@/types/notes").ClassNote[];nextAfter:string;hasMore:boolean}>(`/api/my-class-notes?after=${after}`);
        all=all.concat(result.notes);after=result.nextAfter;if(!result.hasMore)break;
      }while(true);
      setArchive(all.filter(n=>!n.deletedAt));setArchiveStatus("ready");
    }catch{setArchiveStatus("error");}
  };
  const copyFromArchive=async(note:{subjectName:string;title:string;content:string;contentFormat:NoteDraft["contentFormat"]})=>{
    const draft=copiedDraft(note);
    try{await controller.savePersonalDraft(draft,null);setArchiveOpen(false);setSelection({kind:"edit",id:draft.id});}catch{setError(t("notes.saveFailed"));}
  };
  const withdrawAuthored=async(note:import("@/types/notes").ClassNote)=>{
    if(!window.confirm(t("notes.classDeleteConfirm")))return;
    try{await controller.request(`/api/my-class-notes/${note.id}`,{method:"DELETE",body:JSON.stringify({expectedUserId:userId,baseRevision:note.revision,expectedContentFormat:note.contentFormat,mutationId:crypto.randomUUID()})});await archiveLoad();}
    catch{setError(t("notes.error"));}
  };
  const resolveCopy=async(record:PersonalRecord)=>{
    const draft=record.draft;if(!draft)return;
    const copy={...draft,id:crypto.randomUUID(),baseRevision:0,mutationId:crypto.randomUUID(),conflict:null,localVersion:0};
    try{await controller.savePersonalDraft(copy,null);await controller.discardPersonalDraft(record.id,draft);setSelection({kind:"edit",id:copy.id});}
    catch{setError(t("notes.saveFailed"));}
  };
  const chooseAccountVersion=async(record:PersonalRecord)=>{
    if(!record.draft||!window.confirm(t("notes.discardConflictConfirm")))return;
    try{await controller.discardPersonalDraft(record.id,record.draft);setSelection({kind:"read",id:record.id});}catch{setError(t("notes.saveFailed"));}
  };
  const pinSelected=async(record:PersonalRecord)=>{const draft=pinDraft(record);if(!draft)return;
    try{await controller.savePersonalDraft(draft,record.draft);}catch{setError(t("notes.saveFailed"));}
  };
  return <section className="notes-space" aria-label={t("notes.my")}>
    <header className="notes-heading"><div><h2>{t("notes.my")}</h2><p>{t("notes.semesterIndependent")}</p></div>{selection?.kind==="read"&&<button className="soft-button" onClick={()=>setSelection(null)}><ChevronLeft size={18}/>{t("notes.back")}</button>}</header>
    {controller.pending>0&&<p className="notes-banner" role="status">{t("notes.pending",{count:controller.pending})}</p>}
    {controller.phase==="expired"&&<p className="notes-banner error" role="alert">{t("notes.expired")}</p>}
    {controller.phase==="offline"&&<p className="notes-banner" role="status">{t("notes.offline")}</p>}
    {controller.phase==="partial"&&<p className="notes-banner" role="status">{t("notes.partial")}</p>}
    {controller.phase==="upgrade-required"&&<p className="notes-banner error" role="alert">{t("notes.upgradeRequired")} <button onClick={()=>window.location.reload()}>{t("notes.reload")}</button></p>}
    {controller.phase==="error"&&<p className="notes-banner error" role="alert">{t("notes.error")} <button onClick={()=>void controller.refresh()}>{t("notes.retry")}</button></p>}
    {error&&<p className="notes-banner error" role="alert">{error}</p>}
    {selection?.kind==="edit"?<PersonalEditor key={selection.id} id={selection.id} userId={userId} record={selected} controller={controller} data={data} initialSubjectId={initialSubjectId||filter} onDone={()=>setSelection({kind:"read",id:selection.id})} onCancel={()=>setSelection(null)} onAddSubject={onAddSubject}/>
    :selection?.kind==="read"&&selected&&currentText(selected)?<article className="notes-reader panel">
      <div className="notes-reader-actions"><button className="soft-button" onClick={()=>setSelection({kind:"edit",id:selected.id})}>{t("notes.edit")}</button>
        <button className="soft-button" aria-label={currentText(selected)!.pinned?t("notes.unpin"):t("notes.pin")} onClick={()=>void pinSelected(selected)}><Star size={18} fill={currentText(selected)!.pinned?"currentColor":"none"}/></button>
      </div><h2>{currentText(selected)!.title||t("notes.untitled")}</h2><p className="notes-meta">{subjectName(currentText(selected)!.subjectId,currentText(selected)!.subjectName)} · {formatDate(locale,new Date(editedAt(currentText(selected)!)),dateOptions)}</p>
      <NoteContent contentFormat={currentText(selected)!.contentFormat} content={currentText(selected)!.content}/>
      <NoteExport note={{...currentText(selected)!,subjectName:subjectName(currentText(selected)!.subjectId,currentText(selected)!.subjectName),updatedAt:editedAt(currentText(selected)!)}}/>
      <p className="notes-meta" role="status">{t(selected.draft?(selected.draft.conflict?"notes.conflict":"notes.savedDevice"):"notes.synced")}</p>
      {selected.draft?.conflict&&<div className="notes-conflict" role="alert"><h3>{t("notes.conflict")}</h3><div className="notes-conflict-grid"><section><h4>{t("notes.localVersion")}</h4><pre>{selected.draft.title}{"\n\n"}{selected.draft.content}</pre></section><section><h4>{t("notes.accountVersion")}</h4><pre>{selected.draft.conflict.title}{"\n\n"}{selected.draft.conflict.content}</pre></section></div><div className="notes-actions"><button onClick={()=>void resolveCopy(selected)}>{t("notes.keepCopy")}</button><button onClick={()=>void chooseAccountVersion(selected)}>{t("notes.useAccount")}</button><button onClick={()=>downloadText(selected.draft!.title,selected.draft!.content)}>{t("notes.downloadRecovery")}</button></div></div>}
      <div className="notes-actions"><button className="soft-button" onClick={()=>{const note=currentText(selected);if(note)onCopyToClass({id:selected.id,title:note.title,content:note.content,contentFormat:note.contentFormat});}}>{t("notes.copyClass")}</button><button className="soft-button danger-text" onClick={()=>{if(!window.confirm(t("notes.deleteConfirm")))return;const task=selected.remote?controller.deletePersonal(selected.remote,selected.draft):selected.draft?controller.discardPersonalDraft(selected.id,selected.draft):Promise.resolve();void task.then(()=>setSelection(null)).catch(()=>setError(t("notes.saveFailed")));}}><Trash2 size={17}/>{t("notes.delete")}</button></div>
    </article>:<>
      <div className="notes-toolbar"><label className="notes-search"><Search size={18}/><span className="sr-only">{t("notes.search")}</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("notes.search")}/></label><label className="sr-only" htmlFor="notes-subject-filter">{t("notes.filter")}</label><select id="notes-subject-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">{t("notes.allSubjects")}</option>{data.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}{records.some(r=>!data.subjects.some(s=>s.id===currentText(r)?.subjectId))&&<option value="missing">{t("notes.missingSubject")}</option>}</select><button className="primary-button" onClick={()=>newNote()}><Plus size={18}/>{t("notes.new")}</button></div>
      {controller.phase==="loading"?<p role="status">{t("notes.loading")}</p>:visible.length?<div className="notes-list">{visible.map(r=>{const value=currentText(r)!;return <button className="notes-row" key={r.id} onClick={()=>setSelection({kind:"read",id:r.id})}><span className="notes-row-title">{value.pinned&&<Star size={16} fill="currentColor"/>}{value.title||t("notes.untitled")}</span><small>{subjectName(value.subjectId,value.subjectName)} · {formatDate(locale,new Date(editedAt(value)),dateOptions)}</small><span>{noteVisibleText(value.contentFormat,value.content).slice(0,160)}</span>{r.draft&&<small>{r.draft.conflict?t("notes.conflict"):t("notes.savedDevice")}</small>}</button>;})}</div>:<div className="notes-empty"><BookOpen size={28}/><h3>{records.length?t("notes.noResults"):t("notes.empty")}</h3><p>{records.length?t("notes.adjustSearch"):t("notes.emptyHelp")}</p></div>}
      <section className="notes-archive panel"><h3>{t("notes.archive")}</h3><p>{t("notes.archiveHelp")}</p><button className="soft-button" onClick={()=>{setArchiveOpen(!archiveOpen);if(!archiveOpen)void archiveLoad();}}>{archiveOpen?t("notes.hide"):t("notes.open")}</button>{archiveOpen&&<div>
        {records.filter(r=>r.draft?.sourceLabel&&!r.draft.subjectId).map(r=><article className="notes-archive-row" key={r.id}><b>{r.draft!.title||t("notes.untitled")}</b><small>{t("notes.importUnclassified")} · {r.draft!.sourceLabel}</small><button onClick={()=>setSelection({kind:"edit",id:r.id})}>{t("notes.edit")}</button></article>)}
        {controller.classDrafts.map(d=><article className="notes-archive-row" key={d.id}><b>{d.title||t("notes.untitled")}</b><small>{t("notes.classDraft")}</small><button onClick={()=>void copyFromArchive(d)}>{t("notes.copyPersonal")}</button></article>)}
        <h4>{t("notes.classAuthorArchive")}</h4>{archiveStatus==="loading"&&<p>{t("notes.loading")}</p>}{archiveStatus==="error"&&<p>{t("notes.error")}</p>}{archiveStatus==="ready"&&archive.map(n=><article className="notes-archive-row" key={n.id}><b>{n.title}</b><small>{n.className} · {n.subjectName}</small><button onClick={()=>void copyFromArchive(n)}>{t("notes.copyPersonal")}</button><button className="danger-text" onClick={()=>void withdrawAuthored(n)}>{t("notes.delete")}</button></article>)}</div>}</section>
    </>}
  </section>;
}

function PersonalEditor({id,userId,record,controller,data,initialSubjectId,onDone,onCancel,onAddSubject}:{id:string;userId:string;record:PersonalRecord|null;controller:NotesController;data:SchoolData;initialSubjectId:string;onDone:()=>void;onCancel:()=>void;onAddSubject:()=>void}){
  const {t}=useI18n();const initial=record?.draft??record?.remote;
  const [subjectId,setSubjectId]=useState(initial?.subjectId??(initialSubjectId||data.subjects[0]?.id||""));
  const [title,setTitle]=useState(initial?.title??""),[content,setContent]=useState(initial?.content??""),[contentFormat,setContentFormat]=useState(initial?.contentFormat??"plain");
  const [status,setStatus]=useState<"synced"|"saving"|"device"|"error"|"conflict">(record?.draft?"device":record?.remote?"synced":"saving");
  const saved=useRef<NoteDraft|null>(record?.draft??null),baselineRevision=useRef(record?.remote?.revision??0),edited=useRef(0),committed=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),queue=useRef(Promise.resolve());
  const fields=useRef({subjectId,title,content,contentFormat});
  const saveDraft=controller.savePersonalDraft;
  useEffect(()=>{if(record?.remote&&saved.current&&record.remote.lastMutationId===saved.current.mutationId&&!record.draft&&edited.current===committed.current)setStatus("synced");},[record?.remote,record?.draft]);
  const flush=useCallback(async()=>{
    if(timer.current){clearTimeout(timer.current);timer.current=null;}
    const version=edited.current;if(version===committed.current)return queue.current;
    const task=queue.current.then(async()=>{
      const current=await readPersonal(userId,id);
      const existing=saved.current;
      const acknowledged=!!existing&&!current?.draft&&current?.remote?.lastMutationId===existing.mutationId;
      if(existing&&!acknowledged&&current?.draft?.mutationId!==existing.mutationId)throw new Error(t("notes.deviceConflict"));
      if(!existing&&current?.draft)throw new Error(t("notes.deviceConflict"));
      if(!current?.draft&&(current?.remote?.revision??0)!==baselineRevision.current&&!acknowledged)throw new Error(t("notes.deviceConflict"));
      if(current?.draft?.conflict)throw new Error(t("notes.conflict"));
      if(acknowledged)baselineRevision.current=current?.remote?.revision??baselineRevision.current;
      const value=fields.current;const subject=data.subjects.find(s=>s.id===value.subjectId);
      const draft:NoteDraft={userId:"",id,space:"personal",subjectId:value.subjectId,subjectName:subject?.name??existing?.subjectName??current?.remote?.subjectName??"",title:value.title,content:value.content,contentFormat:value.contentFormat,expectedContentFormat:current?.remote?.contentFormat??"plain",pinned:existing?.pinned??current?.remote?.pinned??false,baseRevision:current?.remote?.revision??0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
      const next=await saveDraft(draft,acknowledged?null:existing);
      saved.current=next;committed.current=version;setStatus("device");
    });
    queue.current=task.catch(()=>undefined);
    try{await task;}catch{setStatus("error");throw new Error(t("notes.saveFailed"));}
  },[data.subjects,id,saveDraft,t,userId]);
  const changed=()=>{edited.current++;setStatus("saving");if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void flush().catch(()=>undefined);},700);};
  useEffect(()=>{const editedRef=edited,committedRef=committed;const before=(event:BeforeUnloadEvent)=>{if(editedRef.current!==committedRef.current){event.preventDefault();event.returnValue="";}};const visible=()=>{if(document.visibilityState==="hidden")void flush().catch(()=>undefined);};const onFlush=(event:Event)=>{(event as CustomEvent<Promise<void>[]>).detail.push(flush());};window.addEventListener("beforeunload",before);document.addEventListener("visibilitychange",visible);window.addEventListener(NOTES_FLUSH_EVENT,onFlush);return()=>{if(timer.current)clearTimeout(timer.current);if(editedRef.current!==committedRef.current)void flush().catch(()=>undefined);window.removeEventListener("beforeunload",before);document.removeEventListener("visibilitychange",visible);window.removeEventListener(NOTES_FLUSH_EVENT,onFlush);};},[flush]);
  const finish=async()=>{try{await flush();onDone();}catch{setStatus("error");}};
  const exit=async()=>{try{await flush();onCancel();}catch{setStatus("error");}};
  const textStatus=status==="saving"?"notes.savingDevice":status==="device"?"notes.savedDevice":status==="synced"?"notes.synced":status==="conflict"?"notes.conflict":"notes.saveFailed";
  return <div className="notes-editor panel"><div className="notes-editor-top"><button className="soft-button" onClick={()=>void exit()}><ChevronLeft size={18}/>{t("notes.back")}</button><button className="primary-button" onClick={()=>void finish()}>{t("notes.done")}</button></div>
    <label>{t("notes.subject")}<select value={subjectId} onChange={e=>{fields.current.subjectId=e.target.value;setSubjectId(e.target.value);changed();}}>{!subjectId&&<option value="">{t("notes.chooseSubject")}</option>}{!data.subjects.some(s=>s.id===subjectId)&&subjectId&&<option value={subjectId}>{t("notes.missingSubject")}</option>}{data.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <button className="text-link" onClick={onAddSubject}>{t("notes.addSubject")}</button>
    <label>{t("notes.noteTitle")}<input value={title} maxLength={120} onChange={e=>{fields.current.title=e.target.value;setTitle(e.target.value);changed();}} placeholder={t("notes.untitled")}/></label>
    <div><span>{t("notes.content")}</span><Suspense fallback={<p>{t("notes.loading")}</p>}><NoteEditor value={{contentFormat,content}} onChange={value=>{fields.current.content=value.content;fields.current.contentFormat=value.contentFormat;setContent(value.content);setContentFormat(value.contentFormat);changed();}} label={t("notes.content")}/></Suspense></div>
    <div className="notes-editor-footer"><span id="notes-content-count">{[...content].length} / 20 000</span><span role="status" className={status==="error"?"notes-error":""}>{t(textStatus)}</span>{status==="error"&&<><button onClick={()=>void flush().catch(()=>undefined)}>{t("notes.retry")}</button><button onClick={()=>void navigator.clipboard.writeText(content)}>{t("notes.copyText")}</button><button onClick={()=>downloadText(title,content)}><Download size={16}/>{t("notes.downloadRecovery")}</button></>}</div>
  </div>;
}
