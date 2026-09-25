"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { eventFields, subscriptionUpdate, type ClassSubscription } from "@/lib/classes/events";
import { classCacheKey, classRequest, ClassRequestError } from "@/lib/classes/client";
import { ClassAgendaCoordinator } from "@/lib/classes/agenda-coordinator";
import { activeAccountId } from "@/lib/account-storage";

const cacheSchema = z.array(z.object({
  id: z.string(), event: eventFields.extend({id:z.string(),classId:z.string(),className:z.string(),authorId:z.string().nullable(),authorName:z.string(),revision:z.number(),updatedAt:z.number()}),
  semesterId:z.string(), subjectId:z.string(), completed:z.boolean(), reminder:z.boolean(), revision:z.number(), detachedAt:z.number().nullable(),
})).max(500);
export function useClassAgenda(userId: string) {
  const [items, setItems] = useState<ClassSubscription[]>([]);
  const [status, setStatus] = useState<"loading" | "expired" | "stale" | "">("loading");
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set());
  const itemsRef = useRef<ClassSubscription[]>([]);
  const alive = useRef(true);
  const save = useCallback((next: ClassSubscription[]) => {
    if (!alive.current || activeAccountId() !== userId) return;
    itemsRef.current = next;
    setItems(next); setStatus("");
    try { localStorage.setItem(classCacheKey(userId), JSON.stringify(next)); } catch { /* Online use remains available. */ }
  }, [userId]);
  const [coordinator] = useState(() => new ClassAgendaCoordinator({
    read: () => classRequest<{subscriptions:ClassSubscription[]}>(userId, "/api/class-agenda"),
    write: (path, method, body) => classRequest<{subscriptions:ClassSubscription[]}>(userId,path,{method,body:JSON.stringify(body)}),
    current: () => [],
    publish: () => undefined,
    readError: () => undefined,
    pendingChanged: () => undefined,
  }));
  useEffect(() => coordinator.connect({
    current: () => itemsRef.current,
    publish: save,
    readError: (error) => {
      if (!alive.current) return;
      if(error instanceof ClassRequestError && [401,404].includes(error.status)) {
        itemsRef.current = [];
        setItems([]);
        try { localStorage.removeItem(classCacheKey(userId)); } catch { /* No cache. */ }
      }
      setStatus(error instanceof ClassRequestError && error.status===401 ? "expired" : "stale");
    },
    pendingChanged: (keys) => { if (alive.current) setPendingKeys(keys); },
  }), [coordinator,save,userId]);
  const refresh = useCallback(() => coordinator.refresh(), [coordinator]);
  useEffect(() => {
    alive.current = true;
    queueMicrotask(() => {
      if(!alive.current) return;
      try {
        const parsed = cacheSchema.safeParse(JSON.parse(localStorage.getItem(classCacheKey(userId)) ?? "null"));
        if(parsed.success && activeAccountId()===userId) { itemsRef.current = parsed.data; setItems(parsed.data); }
      } catch { /* Invalid caches are ignored. */ }
      void refresh();
    });
    const tick=()=> { if(document.visibilityState==="visible") void refresh(); };
    const invalidate=(e:Event)=> { if((e as CustomEvent).detail===userId) { coordinator.invalidate(); itemsRef.current=[]; setItems([]); setStatus("expired"); } };
    const timer=setInterval(tick,30000);
    window.addEventListener("online",tick); document.addEventListener("visibilitychange",tick);
    window.addEventListener("ipagell-class-session-ended",invalidate);
    return ()=> { alive.current=false; coordinator.invalidate(); clearInterval(timer); window.removeEventListener("online",tick); document.removeEventListener("visibilitychange",tick); window.removeEventListener("ipagell-class-session-ended",invalidate); };
  },[coordinator,refresh,userId]);
  return { items,status,refresh,
    pendingSubscription:(id:string)=>pendingKeys.has(`subscription:${id}`),
    pendingEvent:(id:string)=>pendingKeys.has(`event:${id}`),
    blockedSubscription:(id:string)=>coordinator.isBlocked(`subscription:${id}`),
    blockedEvent:(id:string)=>coordinator.isBlocked(`event:${id}`),
    subscribe:(eventId:string,semesterId:string,subjectId:string,reminder:boolean)=>coordinator.run(`event:${eventId}`,{kind:"event",id:eventId},`/api/class-events/${eventId}/subscription`,"POST",{semesterId,subjectId,reminder}),
    update:(item:ClassSubscription,input:Omit<z.infer<typeof subscriptionUpdate>,"revision">)=>coordinator.run(`subscription:${item.id}`,{kind:"subscription",id:item.id},`/api/class-agenda/${item.id}`,"PATCH",{...input,revision:item.revision}),
    remove:(item:ClassSubscription)=>coordinator.run(`subscription:${item.id}`,{kind:"subscription",id:item.id},`/api/class-agenda/${item.id}`,"DELETE",{revision:item.revision}),
  };
}
export type ClassAgendaController = ReturnType<typeof useClassAgenda>;
