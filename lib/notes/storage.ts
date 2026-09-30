import type { NoteDraft, PersonalNote } from "@/types/notes";
import type { Preferences,SchoolData } from "@/types/domain";

export type PersonalRecord = { userId:string; id:string; remote:PersonalNote|null; draft:NoteDraft|null; localVersion:number };
export type NotesMeta = { cursor:number; complete:boolean };
export type ImportPlan = { userId:string; data:SchoolData; preferences:Preferences; entries:NoteDraft[]; next:number; diaryCommitted:boolean; createdAt:number };
export class NoteDeviceConflict extends Error {
  constructor(){super("L'appunto è stato cambiato in un'altra scheda.");}
}
const DB="ipagell-notes-db";
function openDb():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains("personal")) request.result.createObjectStore("personal",{keyPath:["userId","id"]}).createIndex("userId","userId");
      if(!request.result.objectStoreNames.contains("classDrafts")) request.result.createObjectStore("classDrafts",{keyPath:["userId","id"]}).createIndex("userId","userId");
      if(!request.result.objectStoreNames.contains("meta")) request.result.createObjectStore("meta");
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??new Error("Archivio appunti non disponibile."));
    request.onblocked=()=>reject(new Error("Chiudi le altre schede e riprova."));
  });
}
function txDone(tx:IDBTransaction):Promise<void>{
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new NoteDeviceConflict());});
}
async function getAll<T>(store:string,userId:string):Promise<T[]> {
  const db=await openDb();
  try {const tx=db.transaction(store); const request=tx.objectStore(store).index("userId").getAll(userId); const done=txDone(tx);
    const result=await new Promise<T[]>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result as T[]);request.onerror=()=>reject(request.error);}); await done; return result;
  } finally{db.close();}
}
export const listPersonal=(userId:string)=>getAll<PersonalRecord>("personal",userId);
export const listClassDrafts=(userId:string)=>getAll<NoteDraft>("classDrafts",userId);
export async function readPersonal(userId:string,id:string):Promise<PersonalRecord|null>{
  const db=await openDb();try {const tx=db.transaction("personal");const request=tx.objectStore("personal").get([userId,id]);const done=txDone(tx);
    const result=await new Promise<PersonalRecord|null>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error);});await done;return result;
  }finally{db.close();}
}
export async function readMeta(userId:string):Promise<NotesMeta>{
  const db=await openDb();
  try {const tx=db.transaction("meta"); const request=tx.objectStore("meta").get(userId); const done=txDone(tx);
    const result=await new Promise<NotesMeta|undefined>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); await done;return result??{cursor:0,complete:false};
  } finally{db.close();}
}
export async function readImportPlan(userId:string):Promise<ImportPlan|null>{
  const db=await openDb();try{const tx=db.transaction("meta");const request=tx.objectStore("meta").get(`import:${userId}`);const done=txDone(tx);
    const result=await new Promise<ImportPlan|null>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error);});await done;return result?.userId===userId?result:null;
  }finally{db.close();}
}
export async function writeImportPlan(plan:ImportPlan|null,userId:string){
  const db=await openDb();try{const tx=db.transaction("meta","readwrite");const store=tx.objectStore("meta");if(plan)store.put(plan,`import:${userId}`);else store.delete(`import:${userId}`);await txDone(tx);}finally{db.close();}
}
export async function mutatePersonal(userId:string,id:string,expected:PersonalRecord|null,change:(current:PersonalRecord|null)=>PersonalRecord|null):Promise<PersonalRecord|null>{
  const db=await openDb();
  try {const tx=db.transaction("personal","readwrite");const store=tx.objectStore("personal"); const read=store.get([userId,id]);let result:PersonalRecord|null=null;let conflict=false;
    read.onsuccess=()=>{const current=(read.result as PersonalRecord|undefined)??null;
      if(JSON.stringify(current)!==JSON.stringify(expected)){conflict=true;tx.abort();return;}
      result=change(current);if(result)store.put(result);else store.delete([userId,id]);};
    await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(conflict?new NoteDeviceConflict():tx.error);});
    return result;
  } finally{db.close();}
}
export async function applyPersonalPage(userId:string,notes:PersonalNote[],cursor:number,expectedCursor:number,complete:boolean){
  const db=await openDb();
  try {const tx=db.transaction(["personal","meta"],"readwrite");const store=tx.objectStore("personal");const meta=tx.objectStore("meta");const read=meta.get(userId);let conflict=false;
    read.onsuccess=()=>{const current=(read.result as NotesMeta|undefined)??{cursor:0,complete:false};
      if(current.cursor!==expectedCursor){conflict=true;tx.abort();return;}
      for(const note of notes){const item=store.get([userId,note.id]);item.onsuccess=()=>{
        const old=(item.result as PersonalRecord|undefined)??null;
        let draft=old?.draft??null;
        if(draft && note.lastMutationId===draft.mutationId) draft=null;
        else if(draft && note.revision!==draft.baseRevision && !draft.conflict) draft={...draft,conflict:note};
        store.put({userId,id:note.id,remote:note,draft,localVersion:(old?.localVersion??0)+1} satisfies PersonalRecord);
      };}
      meta.put({cursor,complete},userId);
    };
    await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(conflict?new NoteDeviceConflict():tx.error);});
  } finally{db.close();}
}
export async function saveClassDraft(draft:NoteDraft,expected:NoteDraft|null){
  const db=await openDb();
  try {const tx=db.transaction("classDrafts","readwrite");const store=tx.objectStore("classDrafts");const read=store.get([draft.userId,draft.id]);let conflict=false;
    read.onsuccess=()=>{if(JSON.stringify(read.result??null)!==JSON.stringify(expected)){conflict=true;tx.abort();return;}store.put(draft);};
    await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(conflict?new NoteDeviceConflict():tx.error);});
  } finally{db.close();}
}
export async function removeClassDraft(userId:string,id:string,expected?:NoteDraft){
  const db=await openDb();try {const tx=db.transaction("classDrafts","readwrite"),store=tx.objectStore("classDrafts");
    if(expected){const read=store.get([userId,id]);let conflict=false;read.onsuccess=()=>{if(JSON.stringify(read.result??null)!==JSON.stringify(expected)){conflict=true;tx.abort();return;}store.delete([userId,id]);};
      await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(conflict?new NoteDeviceConflict():tx.error);});}
    else{store.delete([userId,id]);await txDone(tx);}
  }finally{db.close();}
}
export async function forgetNotes(userId:string){
  const db=await openDb();try {const tx=db.transaction(["personal","classDrafts","meta"],"readwrite");
    for(const name of ["personal","classDrafts"]){const store=tx.objectStore(name),cursor=store.index("userId").openKeyCursor(userId);cursor.onsuccess=()=>{const item=cursor.result;if(item){store.delete(item.primaryKey);item.continue();}};}
    tx.objectStore("meta").delete(userId);tx.objectStore("meta").delete(`import:${userId}`);await txDone(tx);
  }finally{db.close();}
}
