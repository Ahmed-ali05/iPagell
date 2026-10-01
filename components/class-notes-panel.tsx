"use client";
import { lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState } from "react";
import { BookOpen,ChevronLeft,Plus,Star,Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/i18n";
import { searchKey } from "@/lib/notes/validation";
import { ClassRequestError,classRequest } from "@/lib/classes/client";
import { useNoteAutosave } from "@/hooks/use-note-autosave";
import { NoteDeviceConflict } from "@/lib/notes/storage";
import { downloadRecovery } from "@/lib/notes/recovery";
import { classWriteBody } from "@/lib/notes/request-body";
import { NoteContent } from "@/components/note-content";
import { NoteExport } from "@/components/note-export";
import { noteVisibleText } from "@/lib/notes/format";
const NoteEditor=lazy(()=>import("@/components/note-editor"));
import type { ClassDetail } from "@/types/classes";
import type { ClassNote,ClassSubject,NoteCopySeed,NoteDraft } from "@/types/notes";
import type { useNotes } from "@/hooks/use-notes";

type Controller=ReturnType<typeof useNotes>;
type Selection={kind:"read"|"edit";id:string}|null;
export function ClassNotesPanel({active,detail,userId,controller,copySeed,onCopyConsumed,onCopyPersonal}:{active:boolean;detail:ClassDetail;userId:string;controller:Controller;copySeed:NoteCopySeed|null;onCopyConsumed:()=>void;onCopyPersonal:(note:ClassNote)=>void}){
  const {t,locale}=useI18n();const [subjects,setSubjects]=useState<ClassSubject[]>([]),[notes,setNotes]=useState<ClassNote[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState("");
  const [selection,setSelection]=useState<Selection>(null),[query,setQuery]=useState(""),[filter,setFilter]=useState(""),[newSubject,setNewSubject]=useState(""),[managing,setManaging]=useState(false);
  const [copyPersonalId,setCopyPersonalId]=useState("");
  const [preparingCopy,setPreparingCopy]=useState(false);
  const generation=useRef(0);
  const copying=useRef(false);
  const request=useCallback(<T,>(path:string,init?:RequestInit)=>classRequest<T>(userId,path,init),[userId]);
  const load=useCallback(async()=>{
    const ticket=++generation.current;setLoaded(false);setError("");setNotes([]);
    try{const base=`/api/classes/${detail.id}`;
      const subjectResult=await request<{subjects:ClassSubject[]}>(`${base}/subjects`);
      let all:ClassNote[]=[],after="";
      while(true){const page=await request<{notes:ClassNote[];nextAfter:string;hasMore:boolean}>(`${base}/notes?after=${after}`);
        all=all.concat(page.notes);after=page.nextAfter;if(!page.hasMore)break;if(!page.notes.length)throw new Error("Empty notes page");}
      if(ticket===generation.current){setSubjects(subjectResult.subjects);setNotes(all);setLoaded(true);}
    }catch(e){if(ticket!==generation.current)return;setSubjects([]);setNotes([]);setLoaded(false);setError(e instanceof ClassRequestError&&e.status===426?t("notes.upgradeRequired"):e instanceof ClassRequestError&&[401,403,404].includes(e.status)?t("notes.classAccessLost"):!navigator.onLine?t("notes.classOffline"):t("notes.error"));}
  },[detail.id,request,t]);
  useEffect(()=>{const generationRef=generation;if(active)queueMicrotask(()=>{void load();});else queueMicrotask(()=>{setNotes([]);setSubjects([]);setLoaded(false);setSelection(null);});return()=>{generationRef.current++;};},[active,load]);
  const prepareCopy=async()=>{if(!copySeed||copying.current)return;copying.current=true;setPreparingCopy(true);
    const id=crypto.randomUUID();const draft:NoteDraft={userId,id,space:"class",classId:detail.id,subjectId:"",subjectName:"",title:copySeed.title,content:copySeed.content,contentFormat:copySeed.contentFormat,pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
    try{await controller.saveClassDraft(draft,null);setSelection({kind:"edit",id});onCopyConsumed();}catch{setError(t("notes.saveFailed"));}finally{copying.current=false;setPreparingCopy(false);}
  };
  const drafts=controller.classDrafts.filter(d=>d.classId===detail.id);
  const rows=useMemo(()=>notes.filter(n=>(!filter||n.subjectId===filter)&&searchKey(`${n.title} ${noteVisibleText(n.contentFormat,n.content)}`).includes(searchKey(query))).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updatedAt-a.updatedAt||a.id.localeCompare(b.id)),[notes,query,filter]);
  const selected=selection?.kind==="read"?notes.find(n=>n.id===selection.id):null;
  const editing=selection?.kind==="edit"?notes.find(n=>n.id===selection.id):null;
  const editingDraft=selection?.kind==="edit"?drafts.find(d=>d.id===selection.id):null;
  const nameOf=(id:string,fallback:string)=>subjects.find(s=>s.id===id)?.name??`${t("notes.missingSubject")} · ${fallback}`;
  const createSubject=async(name:string)=>{
    const result=await request<{subject:ClassSubject}>(`/api/classes/${detail.id}/subjects`,{method:"POST",body:JSON.stringify({name:name.trim()})});
    setSubjects(s=>[...s.filter(subject=>subject.id!==result.subject.id),result.subject]);return result.subject;
  };
  const addSubject=async()=>{if(!newSubject.trim())return;try{await createSubject(newSubject);setNewSubject("");setError("");}catch{setError(t("notes.error"));}};
  const updateSubject=async(subject:ClassSubject,patch:{name?:string;archived?:boolean})=>{
    try{const result=await request<{subject:ClassSubject}>(`/api/classes/${detail.id}/subjects/${subject.id}`,{method:"PATCH",body:JSON.stringify({...patch,baseRevision:subject.revision})});setSubjects(s=>s.map(x=>x.id===subject.id?result.subject:x));}
    catch{setError(t("notes.error"));}
  };
  const deleteSubject=async(subject:ClassSubject)=>{if(!window.confirm(t("notes.subjectDeleteConfirm")))return;
    try{await request(`/api/classes/${detail.id}/subjects/${subject.id}`,{method:"DELETE",body:JSON.stringify({baseRevision:subject.revision})});setSubjects(s=>s.filter(x=>x.id!==subject.id));}
    catch{setError(t("notes.error"));}
  };
  const deleteNote=async(note:ClassNote)=>{if(!window.confirm(t("notes.classDeleteConfirm")))return;
    try{await request(`/api/classes/${detail.id}/notes/${note.id}`,{method:"DELETE",body:JSON.stringify({expectedUserId:userId,baseRevision:note.revision,expectedContentFormat:note.contentFormat,mutationId:crypto.randomUUID()})});setSelection(null);void load();}
    catch{setError(t("notes.error"));}
  };
  const pin=async(note:ClassNote)=>{try{await request(`/api/classes/${detail.id}/notes/${note.id}/pin`,{method:note.pinned?"DELETE":"PUT",body:"{}"});setNotes(s=>s.map(n=>n.id===note.id?{...n,pinned:!n.pinned}:n));}catch{setError(t("notes.error"));}};
  const create=()=>setSelection({kind:"edit",id:crypto.randomUUID()});
  const copyPersonal=async()=>{const source=controller.records.find(r=>r.id===copyPersonalId)?.draft??controller.records.find(r=>r.id===copyPersonalId)?.remote;
    if(!source||copying.current)return;copying.current=true;setPreparingCopy(true);const id=crypto.randomUUID();const draft:NoteDraft={userId,id,space:"class",classId:detail.id,subjectId:"",subjectName:"",title:source.title,content:source.content,contentFormat:source.contentFormat,pinned:false,baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
    try{await controller.saveClassDraft(draft,null);setSelection({kind:"edit",id});}catch{setError(t("notes.saveFailed"));}finally{copying.current=false;setPreparingCopy(false);}
  };
  return <section className="panel class-notes-panel" aria-label={t("notes.classTitle")}><div className="panel-title"><div><h3>{t("notes.classTitle")}</h3><p>{t(selection?.kind==="edit"?"notes.draftHelp":"notes.visibleMembers",{name:detail.name})}</p></div>{selection?.kind==="read"&&<button className="soft-button" onClick={()=>setSelection(null)}><ChevronLeft size={18}/>{t("notes.viewAll")}</button>}</div>
    {error&&<p className="notes-banner error" role="alert">{error} <button onClick={()=>void load()}>{t("notes.retry")}</button></p>}
    {!loaded&&!error?<p role="status">{t("notes.loading")}</p>:selection?.kind==="edit"?<ClassEditor key={selection.id} id={selection.id} detail={detail} userId={userId} subjects={subjects} note={editing??null} draft={editingDraft??null} controller={controller} request={request} onDone={()=>{setSelection(null);void load();}} onBack={()=>setSelection(null)} onCopyPersonal={onCopyPersonal} onCreateSubject={createSubject}/>
    :selection?.kind==="read"&&selected?<article className="notes-reader"><div className="notes-reader-actions"><button onClick={()=>void pin(selected)} aria-label={selected.pinned?t("notes.unpin"):t("notes.pin")}><Star size={18} fill={selected.pinned?"currentColor":"none"}/></button>{selected.authorId===userId&&<button className="soft-button" onClick={()=>setSelection({kind:"edit",id:selected.id})}>{t("notes.edit")}</button>}</div><h3>{selected.title}</h3><p className="notes-meta">{nameOf(selected.subjectId,selected.subjectName)} · {t("notes.byAuthor",{name:selected.authorName})} · {formatDate(locale,new Date(selected.updatedAt),{day:"numeric",month:"short",year:"numeric"})}</p><NoteContent contentFormat={selected.contentFormat} content={selected.content}/><NoteExport note={{...selected,subjectName:nameOf(selected.subjectId,selected.subjectName)}}/><div className="notes-actions"><button className="soft-button" onClick={()=>onCopyPersonal(selected)}>{t("notes.copyPersonal")}</button>{(selected.authorId===userId||detail.role!=="member")&&<button className="soft-button danger-text" onClick={()=>void deleteNote(selected)}><Trash2 size={16}/>{selected.authorId===userId?t("notes.withdrawClass"):t("notes.moderateDelete")}</button>}</div></article>
    :<>{copySeed&&<div className="notes-banner"><p>{copySeed.title||t("notes.untitled")}</p><button className="primary-button" disabled={!loaded||preparingCopy} onClick={()=>void prepareCopy()}>{t("notes.prepareClassCopy",{name:detail.name})}</button></div>}
      <div className="notes-primary-action"><p>{t("notes.classListHelp")}</p><button className="primary-button" disabled={!loaded} onClick={create}><Plus size={17}/>{t("notes.classNew")}</button></div>
      {drafts.length>0&&<div className="notes-drafts"><h4>{t("notes.yourDrafts")}</h4><p className="notes-meta">{t("notes.draftHelp")}</p>{drafts.map(d=><div className="notes-draft-row" key={d.id}><button className="notes-row" onClick={()=>setSelection({kind:"edit",id:d.id})}><b>{d.title||t("notes.untitled")}</b><small>{t("notes.classDraftSaved")}</small></button><button className="soft-button danger-text" aria-label={t("notes.discardDraftTitle",{title:d.title||t("notes.untitled")})} onClick={()=>{if(window.confirm(t("notes.discardDraftConfirm")))void controller.deleteClassDraft(d.id,d).catch(()=>setError(t("notes.saveFailed")));}}><Trash2 size={17}/></button></div>)}</div>}
      <div className="notes-toolbar"><label className="notes-search"><span className="sr-only">{t("notes.search")}</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("notes.search")}/></label><label className="sr-only" htmlFor={`class-note-filter-${detail.id}`}>{t("notes.filter")}</label><select id={`class-note-filter-${detail.id}`} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">{t("notes.allSubjects")}</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}{s.archivedAt?` · ${t("notes.classSubjectArchived")}`:""}</option>)}</select></div>
      {!loaded?<p>{t("notes.loading")}</p>:rows.length?<div className="notes-list">{rows.map(n=><button className="notes-row" key={n.id} onClick={()=>setSelection({kind:"read",id:n.id})}><b>{n.pinned&&<Star size={15} fill="currentColor"/>}{n.title}</b><small>{nameOf(n.subjectId,n.subjectName)} · {t("notes.byAuthor",{name:n.authorName})}</small><span>{noteVisibleText(n.contentFormat,n.content).slice(0,160)}</span></button>)}</div>:<div className="notes-empty"><BookOpen size={24}/><h4>{notes.length?t("notes.noResults"):t("notes.classEmpty")}</h4><p>{notes.length?t("notes.adjustSearch"):t("notes.classEmptyHelp")}</p></div>}
      {controller.records.some(r=>r.draft?!r.draft.deleted:r.remote&&!r.remote.deletedAt)&&<details className="notes-copy-personal"><summary>{t("notes.copyFromPersonal")}</summary><label>{t("notes.my")}<select value={copyPersonalId} onChange={e=>setCopyPersonalId(e.target.value)}><option value="">{t("notes.copyFromPersonal")}</option>{controller.records.filter(r=>r.draft?!r.draft.deleted:r.remote&&!r.remote.deletedAt).map(r=><option key={r.id} value={r.id}>{(r.draft??r.remote)?.title||t("notes.untitled")}</option>)}</select></label><p>{t("notes.classCopyWarning")}</p><button className="soft-button" disabled={!copyPersonalId||!loaded||preparingCopy} onClick={()=>void copyPersonal()}>{t("notes.copyClass")}</button></details>}
      <details open={managing} onToggle={e=>setManaging(e.currentTarget.open)} className="notes-subjects"><summary>{t("notes.classManageSubjects")}</summary><div className="notes-subject-add"><label>{t("notes.classSubjectName")}<input value={newSubject} maxLength={120} onChange={e=>setNewSubject(e.target.value)}/></label><button className="soft-button" onClick={()=>void addSubject()}>{t("notes.classAddSubject")}</button></div>{subjects.map(s=><div className="notes-subject-row" key={s.id}><span>{s.name}{s.archivedAt?` · ${t("notes.classSubjectArchived")}`:""}</span>{detail.role!=="member"&&<div><button onClick={()=>{const value=window.prompt(t("notes.rename"),s.name);if(value?.trim())void updateSubject(s,{name:value.trim()});}}>{t("notes.rename")}</button><button onClick={()=>void updateSubject(s,{archived:!s.archivedAt})}>{s.archivedAt?t("notes.restoreSubject"):t("notes.archiveSubject")}</button><button onClick={()=>void deleteSubject(s)}>{t("notes.deleteSubject")}</button></div>}</div>)}</details>
    </>}
  </section>;
}

function ClassEditor({id,detail,userId,subjects,note,draft,controller,request,onDone,onBack,onCopyPersonal,onCreateSubject}:{id:string;detail:ClassDetail;userId:string;subjects:ClassSubject[];note:ClassNote|null;draft:NoteDraft|null;controller:Controller;request:<T>(path:string,init?:RequestInit)=>Promise<T>;onDone:()=>void;onBack:()=>void;onCopyPersonal:(note:ClassNote)=>void;onCreateSubject:(name:string)=>Promise<ClassSubject>}){
  const {t}=useI18n();const activeSubjects=subjects.filter(s=>!s.archivedAt);
  const [subjectId,setSubjectId]=useState(draft?.subjectId??note?.subjectId??(activeSubjects.length===1?activeSubjects[0].id:"")),[title,setTitle]=useState(draft?.title??note?.title??""),[content,setContent]=useState(draft?.content??note?.content??""),[contentFormat,setContentFormat]=useState(draft?.contentFormat??note?.contentFormat??"plain");
  const [subjectForm,setSubjectForm]=useState(!activeSubjects.length),[subjectName,setSubjectName]=useState(""),[addingSubject,setAddingSubject]=useState(false),[subjectError,setSubjectError]=useState(false);
  const adding=useRef(false);
  const [status,setStatus]=useState<"idle"|"saving"|"device"|"publishing"|"published"|"error"|"conflict">(draft?"device":note?"published":"idle"),[preview,setPreview]=useState(false),[remoteConflict,setRemoteConflict]=useState<ClassNote|null>(null);
  const persisted=useRef<NoteDraft|null>(draft),base=useRef(note),publishing=useRef(false);const fields=useRef({subjectId,title,content,contentFormat});
  const saveDraft=controller.saveClassDraft,deleteDraft=controller.deleteClassDraft;
  const [saveError,setSaveError]=useState(false);
  const persist=async()=>{
    const value={...fields.current},subject=subjects.find(s=>s.id===value.subjectId);
    const next:NoteDraft={userId,id,space:"class",classId:detail.id,subjectId:value.subjectId,subjectName:subject?.name??persisted.current?.subjectName??base.current?.subjectName??"",title:value.title,content:value.content,contentFormat:value.contentFormat,expectedContentFormat:persisted.current?.expectedContentFormat??base.current?.contentFormat??"plain",pinned:false,baseRevision:persisted.current?.baseRevision??base.current?.revision??0,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now()};
    persisted.current=await saveDraft(next,persisted.current);
  };
  const {flush,changed}=useNoteAutosave(persist,(next,error)=>{setStatus(next);setSaveError(error instanceof NoteDeviceConflict);},!!draft||!!note);
  const addSubject=async()=>{if(!subjectName.trim()||adding.current)return;adding.current=true;setAddingSubject(true);setSubjectError(false);
    try{const subject=await onCreateSubject(subjectName);fields.current.subjectId=subject.id;setSubjectId(subject.id);setSubjectName("");setSubjectForm(false);changed();}catch{setSubjectError(true);}finally{adding.current=false;setAddingSubject(false);}
  };
  const back=async()=>{try{await flush();onBack();}catch{setStatus("error");}};
  const publish=async()=>{if(publishing.current)return;publishing.current=true;try{await flush(true);const value=persisted.current;if(!value||!value.title.trim()||!value.subjectId){setStatus("error");return;}if(!navigator.onLine){setStatus("error");return;}
      setStatus("publishing");const path=`/api/classes/${detail.id}/notes${note?`/${id}`:""}`;
      const result=await request<{note:ClassNote}>(path,{method:note?"PATCH":"POST",body:JSON.stringify(classWriteBody(value,userId,!note))});
      if(result.note.id!==id||result.note.lastMutationId!==value.mutationId||result.note.content!==value.content||result.note.contentFormat!==value.contentFormat||result.note.title!==value.title.trim())throw new Error("Invalid class note confirmation");
      await deleteDraft(id,value);setStatus("published");onDone();
    }catch(error){if(error instanceof ClassRequestError&&error.status===409){try{const result=await request<{note:ClassNote}>(`/api/classes/${detail.id}/notes/${id}`);if(result.note.lastMutationId===persisted.current?.mutationId&&result.note.content===persisted.current?.content&&result.note.contentFormat===persisted.current?.contentFormat&&result.note.title===persisted.current?.title.trim()){await deleteDraft(id,persisted.current);onDone();return;}setRemoteConflict(result.note);setStatus("conflict");return;}catch{}}
      setStatus("error");}finally{publishing.current=false;}
  };
  const createConflictCopy=async()=>{const original=persisted.current;if(!original)return;const next={...original,id:crypto.randomUUID(),baseRevision:0,mutationId:crypto.randomUUID(),localVersion:0};try{await controller.saveClassDraft(next,null);onBack();}catch{setStatus("error");}};
  return <div className="notes-editor"><div className="notes-editor-top"><button className="soft-button" disabled={status==="publishing"} onClick={()=>void back()}><ChevronLeft size={18}/>{t("notes.saveDraftClose")}</button><span>{t("notes.classDraft")}</span></div>
    <label>{t("notes.subject")}<select value={subjectId} disabled={status==="publishing"||preview} onChange={e=>{if(publishing.current)return;fields.current.subjectId=e.target.value;setSubjectId(e.target.value);changed();}}>{!subjectId&&<option value="">{t("notes.chooseSubject")}</option>}{!subjects.some(s=>s.id===subjectId)&&subjectId&&<option value={subjectId}>{t("notes.missingSubject")}</option>}{subjects.filter(s=>!s.archivedAt||s.id===subjectId).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {!preview&&<><button className="text-link" onClick={()=>setSubjectForm(!subjectForm)}>{t(subjectForm?"notes.hide":"notes.addSubject")}</button>{subjectForm&&<div className="notes-subject-add"><p>{t("notes.classNoSubjects")}</p><label>{t("notes.classSubjectName")}<input value={subjectName} maxLength={120} disabled={addingSubject} onChange={e=>setSubjectName(e.target.value)}/></label><button className="soft-button" disabled={addingSubject||!subjectName.trim()} onClick={()=>void addSubject()}>{t("notes.classAddSubject")}</button>{subjectError&&<p role="alert">{t("notes.error")}</p>}</div>}</>}
    <label>{t("notes.noteTitle")}<input value={title} maxLength={120} disabled={status==="publishing"||preview} onChange={e=>{if(publishing.current)return;fields.current.title=e.target.value;setTitle(e.target.value);changed();}}/></label>{!preview&&<div><span>{t("notes.content")}</span><Suspense fallback={<p>{t("notes.loading")}</p>}><NoteEditor value={{contentFormat,content}} onChange={value=>{if(publishing.current)return;fields.current.content=value.content;fields.current.contentFormat=value.contentFormat;setContent(value.content);setContentFormat(value.contentFormat);changed();}} disabled={status==="publishing"} label={t("notes.content")}/></Suspense></div>}
    <div className="notes-editor-footer"><span>{[...content].length} / 20 000</span><span role="status">{t(status==="idle"?"notes.autoSaveHelp":status==="saving"?"notes.savingDevice":status==="device"?"notes.classDraftSaved":status==="publishing"?"notes.classPublishing":status==="published"?"notes.classPublished":status==="conflict"?"notes.classConflict":saveError?"notes.deviceConflict":"notes.classSaveFailed")}</span></div>
    {status==="error"&&<div className="notes-actions"><button className="soft-button" onClick={()=>void flush().catch(()=>undefined)}>{t("notes.retry")}</button><button className="soft-button" onClick={()=>downloadRecovery(title,content)}>{t("notes.downloadRecovery")}</button><button className="soft-button" onClick={()=>void navigator.clipboard?.writeText(content).catch(()=>undefined)}>{t("notes.copyText")}</button></div>}
    {status==="conflict"&&remoteConflict&&<div className="notes-conflict" role="alert"><h4>{t("notes.classConflict")}</h4><div className="notes-conflict-grid"><section><small>{contentFormat}</small><h5>{title}</h5><NoteContent contentFormat={contentFormat} content={content}/></section><section><small>{remoteConflict.contentFormat}</small><h5>{remoteConflict.title}</h5><NoteContent contentFormat={remoteConflict.contentFormat} content={remoteConflict.content}/></section></div><button onClick={()=>void createConflictCopy()}>{t("notes.keepCopy")}</button><button onClick={()=>onCopyPersonal({...remoteConflict,title,content,contentFormat})}>{t("notes.copyPersonal")}</button></div>}
    {preview?<div className="notes-preview" role="dialog" aria-label={t("notes.preview")}><h4>{t("notes.preview")}</h4><p>{t("notes.visibleMembers",{name:detail.name})}</p><b>{title}</b><small>{subjects.find(s=>s.id===subjectId)?.name}</small><NoteContent contentFormat={contentFormat} content={content}/><p>{t("notes.publishConfirm")}</p><div className="notes-actions"><button className="soft-button" onClick={()=>setPreview(false)}>{t("notes.back")}</button><button className="primary-button" disabled={status==="publishing"} onClick={()=>void publish()}>{t(note?"notes.updateClass":"notes.publish")}</button></div></div>
    :<><p className="notes-meta">{t(!title.trim()||!subjectId?"notes.completeToShare":"notes.draftHelp")}</p><button className="primary-button" disabled={status==="publishing"||!title.trim()||!subjectId} onClick={()=>void flush(true).then(()=>setPreview(true)).catch(()=>undefined)}>{t("notes.reviewShare")}</button></>}
  </div>;
}
