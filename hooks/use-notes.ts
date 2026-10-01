"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { activeAccountId } from "@/lib/account-storage";
import { requestJson,RequestError } from "@/lib/client-http";
import { acceptPersonalNote,beginPersonalWrite,rejectPersonalWrite,persistPersonalDraft,applyPersonalPage,listClassDrafts,listPersonal,mutatePersonal,readMeta,readPersonal,removeClassDraft,saveClassDraft,NoteDeviceConflict,type PersonalRecord } from "@/lib/notes/storage";
import type { NoteDraft,PersonalNote } from "@/types/notes";
import { localDraftBytes,validateNoteBytes } from "@/lib/notes/validation";
import { personalWriteBody } from "@/lib/notes/request-body";
import { persistAndNotify } from "@/lib/notes/autosave";
import { writtenMatches } from "@/lib/notes/reconcile";

type Phase="loading"|"ready"|"partial"|"offline"|"error"|"expired"|"upgrade-required";
type State={phase:Phase;records:PersonalRecord[];classDrafts:NoteDraft[];error:string};
const initial:State={phase:"loading",records:[],classDrafts:[],error:""};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
async function checkLocalDraftSpace(userId:string,next:NoteDraft){
  const [personal,classDrafts]=await Promise.all([listPersonal(userId),listClassDrafts(userId)]);
  if(localDraftBytes(personal.flatMap(record=>record.draft?[record.draft]:[]),classDrafts,next)>8*1024*1024)throw new Error("Spazio locale per bozze esaurito.");
}

export function useNotes(userId:string){
  const [state,setState]=useState<State>(initial);
  const live=useRef(true),refreshing=useRef<Promise<void>|null>(null),syncing=useRef<Promise<void>|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const upgradeRequired=useRef(false);
  const channel=useRef<BroadcastChannel|null>(null);
  const assertAccount=useCallback(()=>{if(activeAccountId()!==userId)throw new RequestError(401,"Accedi di nuovo allo stesso account.");},[userId]);
  const request=useCallback(<T,>(path:string,init?:RequestInit)=>requestJson<T>(path,{...init,headers:{...init?.headers,"X-IPagell-Account":userId,"X-IPagell-Notes-Contract":"2"}}),[userId]);
  const publish=useCallback(async()=>{const [records,classDrafts]=await Promise.all([listPersonal(userId),listClassDrafts(userId)]);if(live.current&&activeAccountId()===userId)setState(s=>({...s,records,classDrafts}));},[userId]);
  const broadcast=useCallback(()=>{try{channel.current?.postMessage("changed");}catch{/* A closed channel must not turn a durable save into failure. */}},[]);
  const fail=useCallback((error:unknown)=>{
    if(!live.current)return;
    if(error instanceof RequestError&&error.status===426){upgradeRequired.current=true;setState(s=>({...s,phase:"upgrade-required",error:error.message}));return;}
    if(error instanceof RequestError&&error.status===401){setState(s=>({...s,phase:"expired",error:""}));return;}
    if(error instanceof TypeError || (!navigator.onLine && !(error instanceof RequestError))){setState(s=>({...s,phase:"offline",error:""}));return;}
    setState(s=>({...s,phase:"error",error:error instanceof Error?error.message:"Salvataggio non riuscito."}));
  },[]);
  const pull=useCallback(async()=>{
    assertAccount();const meta=await readMeta(userId);let cursor=meta.cursor;
    while(true){
      const page=await request<{notes:PersonalNote[];nextAfter:number;hasMore:boolean}>(`/api/notes?after=${cursor}`);
      assertAccount();
      if(!Array.isArray(page.notes)||!Number.isSafeInteger(page.nextAfter)||page.nextAfter<cursor)throw new Error("Risposta appunti non valida.");
      await applyPersonalPage(userId,page.notes,page.nextAfter,cursor,!page.hasMore);
      cursor=page.nextAfter;await publish();broadcast();
      if(!page.hasMore)break;
      if(page.notes.length===0)throw new Error("Pagina appunti vuota.");
    }
  },[assertAccount,broadcast,publish,request,userId]);
  const syncOne=useCallback(async(id:string)=>{
    if(upgradeRequired.current)return;
    // The stored in-flight snapshot is replayed after a lost response. A newer
    // local draft is rebased only when that exact write is acknowledged.
    for(let writes=0;writes<8;writes++){
      assertAccount();const current=await readPersonal(userId,id),candidate=current?.inFlight??current?.draft;
      if(!candidate||current?.draft?.conflict||!candidate.title.trim()||!candidate.subjectId||!validateNoteBytes(candidate))return;
      const record=await beginPersonalWrite(userId,id),draft=record?.inFlight;
      if(!record||!draft||record.draft?.conflict)return;
      const base={expectedUserId:userId,mutationId:draft.mutationId,baseRevision:draft.baseRevision,expectedContentFormat:draft.expectedContentFormat??"plain"};
      const path=`/api/notes/${encodeURIComponent(id)}`;
      try{
        const result=await request<{note:PersonalNote}>(draft.deleted?path:draft.baseRevision?path:"/api/notes",{
          method:draft.deleted?"DELETE":draft.baseRevision?"PATCH":"POST",
          body:JSON.stringify(draft.deleted?base:personalWriteBody(draft,userId,!draft.baseRevision)),
        });
        assertAccount();
        if(result.note.id!==id||!writtenMatches(draft,result.note))throw new Error("Conferma appunto non valida.");
        await acceptPersonalNote(userId,result.note);await publish();broadcast();
        if(live.current)setState(s=>({...s,phase:"ready",error:""}));
      }catch(error){
        if(error instanceof RequestError&&error.status===409){
          try{const result=await request<{note:PersonalNote}>(path);assertAccount();if(result.note.id!==id)throw new Error("Conferma appunto non valida.");await acceptPersonalNote(userId,result.note);await publish();broadcast();}
          catch(fetchError){fail(fetchError);return;}
          continue;
        }
        if(error instanceof RequestError&&[400,413].includes(error.status)){
          assertAccount();const latest=await rejectPersonalWrite(userId,id,draft.mutationId);
          if(latest?.draft&&latest.draft.mutationId!==draft.mutationId)continue;
        }
        fail(error);return;
      }
    }
    return true;
  },[assertAccount,broadcast,fail,publish,request,userId]);
  const sync=useCallback(function runSync():Promise<void>{
    if(syncing.current)return syncing.current;
    let more=false;
    const task=(async()=>{try{assertAccount();if(!navigator.onLine||upgradeRequired.current)return;const records=await listPersonal(userId);for(const record of records){if(upgradeRequired.current)break;if(record.draft)more=!!await syncOne(record.id)||more;}}catch(error){fail(error);}})();
    syncing.current=task.finally(()=>{syncing.current=null;if(more&&live.current)timer.current=setTimeout(()=>{void runSync();},500);});return syncing.current;
  },[assertAccount,fail,syncOne,userId]);
  const refresh=useCallback(()=>{
    if(refreshing.current)return refreshing.current;
    const task=(async()=>{try{assertAccount();await publish();if(upgradeRequired.current)return;await pull();if(live.current&&!upgradeRequired.current)setState(s=>({...s,phase:"ready",error:""}));await sync();}
      catch(error){fail(error);if(error instanceof RequestError||error instanceof NoteDeviceConflict)return;const meta=await readMeta(userId).catch(()=>({cursor:0,complete:false}));if(live.current)setState(s=>({...s,phase:meta.complete?"offline":"partial"}));}})();
    refreshing.current=task.finally(()=>{refreshing.current=null;});return refreshing.current;
  },[assertAccount,fail,publish,pull,sync,userId]);
  useEffect(()=>{
    live.current=true;channel.current=typeof BroadcastChannel!=="undefined"?new BroadcastChannel(`ipagell-notes:${userId}`):null;
    channel.current?.addEventListener("message",()=>{void publish().catch(fail);});
    void refresh();
    const retry=()=>void refresh();const visible=()=>{if(document.visibilityState==="visible")void refresh();};
    window.addEventListener("online",retry);document.addEventListener("visibilitychange",visible);
    return()=>{live.current=false;channel.current?.close();channel.current=null;if(timer.current)clearTimeout(timer.current);window.removeEventListener("online",retry);document.removeEventListener("visibilitychange",visible);};
  },[userId,refresh,publish,fail]);
  const queueSync=useCallback(()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void sync();},500);},[sync]);
  const savePersonalDraft=useCallback(async(draft:NoteDraft,expected:NoteDraft|null)=>{
    assertAccount();
    const next={...draft,userId,space:"personal" as const};
    await checkLocalDraftSpace(userId,next);
    const saved=await persistAndNotify(()=>persistPersonalDraft(next,expected),publish,fail);
    // Once IndexedDB commits, optional view refresh/notification cannot make
    // the editor believe its expected draft was never written.
    broadcast();queueSync();return saved;
  },[assertAccount,broadcast,fail,publish,queueSync,userId]);
  const saveClass=useCallback(async(draft:NoteDraft,expected:NoteDraft|null)=>{
    assertAccount();const next={...draft,userId,space:"class" as const,localVersion:(expected?.localVersion??0)+1,localEditedAt:Date.now()};
    await checkLocalDraftSpace(userId,next);
    await persistAndNotify(()=>saveClassDraft(next,expected),publish,fail);broadcast();return next;
  },[assertAccount,broadcast,fail,publish,userId]);
  const deleteClass=useCallback(async(id:string,expected?:NoteDraft)=>{await removeClassDraft(userId,id,expected);await publish();broadcast();},[broadcast,publish,userId]);
  const deletePersonal=useCallback(async(note:PersonalNote,expected:NoteDraft|null)=>{
    const current=await readPersonal(userId,note.id);
    if(!same(current?.draft??null,expected))throw new NoteDeviceConflict();
    const remote=current?.remote??note;
    const draft:NoteDraft={userId,id:note.id,space:"personal",subjectId:remote.subjectId,subjectName:remote.subjectName,title:remote.title,content:remote.content,contentFormat:remote.contentFormat,expectedContentFormat:remote.contentFormat,pinned:remote.pinned,baseRevision:remote.revision,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now(),deleted:true};
    await savePersonalDraft(draft,expected);await syncOne(note.id);
  },[savePersonalDraft,syncOne,userId]);
  const discardPersonalDraft=useCallback(async(id:string,expected:NoteDraft|null)=>{
    const current=await readPersonal(userId,id);
    if(!same(current?.draft??null,expected))throw new NoteDeviceConflict();
    if(!current)return;
    await mutatePersonal(userId,id,current,old=>old?.remote?{...old,draft:null,inFlight:null,localVersion:old.localVersion+1}:null);
    await publish();broadcast();
  },[broadcast,publish,userId]);
  const pending=state.records.filter(r=>r.draft).length+state.classDrafts.length;
  return {...state,pending,refresh,sync,pullForBackup:pull,savePersonalDraft,saveClassDraft:saveClass,deleteClassDraft:deleteClass,deletePersonal,discardPersonalDraft,request,assertAccount,publish};
}
