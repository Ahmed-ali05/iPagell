"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { activeAccountId } from "@/lib/account-storage";
import { requestJson,RequestError } from "@/lib/client-http";
import { applyPersonalPage,listClassDrafts,listPersonal,mutatePersonal,readMeta,readPersonal,removeClassDraft,saveClassDraft,NoteDeviceConflict,type PersonalRecord } from "@/lib/notes/storage";
import type { NoteDraft,PersonalNote } from "@/types/notes";
import { localDraftBytes,validateNoteBytes } from "@/lib/notes/validation";
import { personalWriteBody } from "@/lib/notes/request-body";

type Phase="loading"|"ready"|"partial"|"offline"|"error"|"expired";
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
  const channel=useRef<BroadcastChannel|null>(null);
  const assertAccount=useCallback(()=>{if(activeAccountId()!==userId)throw new RequestError(401,"Accedi di nuovo allo stesso account.");},[userId]);
  const request=useCallback(<T,>(path:string,init?:RequestInit)=>requestJson<T>(path,{...init,headers:{...init?.headers,"X-IPagell-Account":userId}}),[userId]);
  const publish=useCallback(async()=>{const [records,classDrafts]=await Promise.all([listPersonal(userId),listClassDrafts(userId)]);if(live.current)setState(s=>({...s,records,classDrafts}));},[userId]);
  const broadcast=useCallback(()=>{channel.current?.postMessage("changed");},[]);
  const fail=useCallback((error:unknown)=>{
    if(!live.current)return;
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
    assertAccount();const record=await readPersonal(userId,id),draft=record?.draft;
    if(!record||!draft||draft.conflict||!draft.title.trim()||!draft.subjectId||!validateNoteBytes(draft))return;
    if(record.remote?.deletedAt && !draft.deleted){
      await mutatePersonal(userId,id,record,current=>({...current!,draft:{...draft,conflict:record.remote}}));await publish();return;
    }
    const base={expectedUserId:userId,mutationId:draft.mutationId,baseRevision:draft.baseRevision};
    const path=`/api/notes/${encodeURIComponent(id)}`;
    try {
      const result=await request<{note:PersonalNote}>(draft.deleted?path:record.remote?path:"/api/notes",{
        method:draft.deleted?"DELETE":record.remote?"PATCH":"POST",
        body:JSON.stringify(draft.deleted?base:personalWriteBody(draft,userId,!record.remote)),
      });
      assertAccount();
      const current=await readPersonal(userId,id);
      if(!current)return;
      await mutatePersonal(userId,id,current,old=>{
        if(!old)return null;
        const still=old.draft;
        const nextDraft=still?.mutationId===draft.mutationId?null:still?{...still,baseRevision:result.note.revision}:null;
        return {...old,remote:result.note,draft:nextDraft,localVersion:old.localVersion+1};
      });
      await publish();broadcast();
    }catch(error){
      if(error instanceof RequestError&&error.status===409){
        try {const result=await request<{note:PersonalNote}>(path);assertAccount();const current=await readPersonal(userId,id);
          if(current?.draft?.mutationId===draft.mutationId){
            if(result.note.lastMutationId===draft.mutationId){
              await mutatePersonal(userId,id,current,old=>({...old!,remote:result.note,draft:null,localVersion:old!.localVersion+1}));
            }else await mutatePersonal(userId,id,current,old=>({...old!,remote:result.note,draft:{...old!.draft!,conflict:result.note},localVersion:old!.localVersion+1}));
            await publish();broadcast();
          }
          return;
        }catch(fetchError){fail(fetchError);return;}
      }
      fail(error);
    }
  },[assertAccount,broadcast,fail,publish,request,userId]);
  const sync=useCallback(()=>{
    if(syncing.current)return syncing.current;
    const task=(async()=>{try{assertAccount();if(!navigator.onLine)return;const records=await listPersonal(userId);for(const record of records)if(record.draft)await syncOne(record.id);}catch(error){fail(error);}})();
    syncing.current=task.finally(()=>{syncing.current=null;});return syncing.current;
  },[assertAccount,fail,syncOne,userId]);
  const refresh=useCallback(()=>{
    if(refreshing.current)return refreshing.current;
    const task=(async()=>{try{assertAccount();await publish();await pull();if(live.current)setState(s=>({...s,phase:"ready",error:""}));await sync();}
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
    const current=await readPersonal(userId,draft.id);
    if(!same(current?.draft??null,expected))throw new NoteDeviceConflict();
    const next={...draft,userId,space:"personal" as const,localVersion:(current?.localVersion??0)+1,localEditedAt:Date.now()};
    await checkLocalDraftSpace(userId,next);
    await mutatePersonal(userId,draft.id,current,old=>({userId,id:draft.id,remote:old?.remote??null,draft:next,localVersion:next.localVersion}));
    await publish();broadcast();queueSync();return next;
  },[assertAccount,broadcast,publish,queueSync,userId]);
  const saveClass=useCallback(async(draft:NoteDraft,expected:NoteDraft|null)=>{
    assertAccount();const next={...draft,userId,space:"class" as const,localVersion:(expected?.localVersion??0)+1,localEditedAt:Date.now()};
    await checkLocalDraftSpace(userId,next);
    await saveClassDraft(next,expected);await publish();broadcast();return next;
  },[assertAccount,broadcast,publish,userId]);
  const deleteClass=useCallback(async(id:string,expected?:NoteDraft)=>{await removeClassDraft(userId,id,expected);await publish();broadcast();},[broadcast,publish,userId]);
  const deletePersonal=useCallback(async(note:PersonalNote,expected:NoteDraft|null)=>{
    const current=await readPersonal(userId,note.id);
    if(!same(current?.draft??null,expected))throw new NoteDeviceConflict();
    const remote=current?.remote??note;
    const draft:NoteDraft={userId,id:note.id,space:"personal",subjectId:remote.subjectId,subjectName:remote.subjectName,title:remote.title,content:remote.content,pinned:remote.pinned,baseRevision:remote.revision,mutationId:crypto.randomUUID(),localVersion:0,localEditedAt:Date.now(),deleted:true};
    await savePersonalDraft(draft,expected);await syncOne(note.id);
  },[savePersonalDraft,syncOne,userId]);
  const discardPersonalDraft=useCallback(async(id:string,expected:NoteDraft|null)=>{
    const current=await readPersonal(userId,id);
    if(!same(current?.draft??null,expected))throw new NoteDeviceConflict();
    if(!current)return;
    await mutatePersonal(userId,id,current,old=>old?.remote?{...old,draft:null,localVersion:old.localVersion+1}:null);
    await publish();broadcast();
  },[broadcast,publish,userId]);
  const pending=state.records.filter(r=>r.draft).length+state.classDrafts.length;
  return {...state,pending,refresh,sync,pullForBackup:pull,savePersonalDraft,saveClassDraft:saveClass,deleteClassDraft:deleteClass,deletePersonal,discardPersonalDraft,request,assertAccount,publish};
}
