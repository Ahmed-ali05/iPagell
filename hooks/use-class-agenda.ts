"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { eventFields, subscriptionUpdate, type ClassSubscription } from "@/lib/classes/events";
import { classCacheKey, classRequest, ClassRequestError } from "@/lib/classes/client";
import { activeAccountId } from "@/lib/account-storage";

const cacheSchema = z.array(z.object({
  id: z.string(), event: eventFields.extend({id:z.string(),classId:z.string(),className:z.string(),authorId:z.string().nullable(),authorName:z.string(),revision:z.number(),updatedAt:z.number()}),
  semesterId:z.string(), subjectId:z.string(), completed:z.boolean(), reminder:z.boolean(), revision:z.number(), detachedAt:z.number().nullable(),
})).max(500);
export function useClassAgenda(userId: string) {
  const [items, setItems] = useState<ClassSubscription[]>([]);
  const [status, setStatus] = useState("Caricamento agenda di classe…");
  const sequence = useRef(0);
  const alive = useRef(true);
  const save = useCallback((next: ClassSubscription[]) => {
    if (!alive.current || activeAccountId() !== userId) return;
    setItems(next); setStatus("");
    try { localStorage.setItem(classCacheKey(userId), JSON.stringify(next)); } catch { /* Online use remains available. */ }
  }, [userId]);
  const refresh = useCallback(async () => {
    const ticket = ++sequence.current;
    try {
      const result = await classRequest<{subscriptions:ClassSubscription[]}>(userId, "/api/class-agenda");
      if(ticket === sequence.current) save(result.subscriptions);
    } catch(e) {
      if(!alive.current || ticket !== sequence.current) return;
      if(e instanceof ClassRequestError && [401,404].includes(e.status)) {
        setItems([]);
        try { localStorage.removeItem(classCacheKey(userId)); } catch { /* No cache. */ }
      }
      setStatus(e instanceof ClassRequestError && e.status===401 ? "Sessione scaduta: accedi di nuovo." : "Agenda di classe non aggiornata · ultima copia disponibile. Le modifiche richiedono una connessione.");
    }
  }, [save,userId]);
  useEffect(() => {
    alive.current = true;
    queueMicrotask(() => {
      if(!alive.current) return;
      try {
        const parsed = cacheSchema.safeParse(JSON.parse(localStorage.getItem(classCacheKey(userId)) ?? "null"));
        if(parsed.success && activeAccountId()===userId) setItems(parsed.data);
      } catch { /* Invalid caches are ignored. */ }
      void refresh();
    });
    const tick=()=> { if(document.visibilityState==="visible") void refresh(); };
    const invalidate=(e:Event)=> { if((e as CustomEvent).detail===userId) { ++sequence.current; setItems([]); setStatus("Sessione scaduta: accedi di nuovo."); } };
    const timer=setInterval(tick,30000);
    window.addEventListener("online",tick); document.addEventListener("visibilitychange",tick);
    window.addEventListener("ipagell-class-session-ended",invalidate);
    return ()=> { alive.current=false; clearInterval(timer); window.removeEventListener("online",tick); document.removeEventListener("visibilitychange",tick); window.removeEventListener("ipagell-class-session-ended",invalidate); };
  },[refresh,userId]);
  const mutate = useCallback(async (path:string, method:string, body:unknown) => {
    ++sequence.current;
    try {
      const result=await classRequest<{subscriptions:ClassSubscription[]}>(userId,path,{method,body:JSON.stringify(body)});
      ++sequence.current; save(result.subscriptions);
    } catch(e) { await refresh(); throw e; }
  },[refresh,save,userId]);
  return { items,status,refresh,
    subscribe:(eventId:string,semesterId:string,subjectId:string,reminder:boolean)=>mutate(`/api/class-events/${eventId}/subscription`,"POST",{semesterId,subjectId,reminder}),
    update:(item:ClassSubscription,input:Omit<z.infer<typeof subscriptionUpdate>,"revision">)=>mutate(`/api/class-agenda/${item.id}`,"PATCH",{...input,revision:item.revision}),
    remove:(item:ClassSubscription)=>mutate(`/api/class-agenda/${item.id}`,"DELETE",{revision:item.revision}),
  };
}
export type ClassAgendaController = ReturnType<typeof useClassAgenda>;
