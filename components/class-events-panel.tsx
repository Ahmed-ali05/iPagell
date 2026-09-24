"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { MessageKey } from "@/lib/i18n";
import { CalendarDays, Check, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ClassDetail } from "@/types/classes";
import type { SchoolData } from "@/types/domain";
import type { ClassAgendaController } from "@/hooks/use-class-agenda";
import { classRequest } from "@/lib/classes/client";
import { eventFields, type ClassEvent, type ClassSubscription, type EventFields } from "@/lib/classes/events";
import { LanguageSelect, useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/i18n";

const localDate = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
};
export function EventInputs({event,subjects=[]}: {event?:EventFields;subjects?:string[]}) {
  const {t}=useI18n();
  return <>
    <label className="full">{t("classEvents.titleLabel")}<input name="title" required maxLength={160} defaultValue={event?.title}/></label>
    <label>{t("classEvents.sharedSubject")}<input name="subject" list="class-subject-labels" required maxLength={80} defaultValue={event?.subject}/><datalist id="class-subject-labels">{subjects.map(s=><option key={s} value={s}/>)}</datalist></label>
    <label>{t("entry.kind")}<NativeSelect name="kind" defaultValue={event?.kind??"task"}><NativeSelectOption value="task">{t("entry.task")}</NativeSelectOption><NativeSelectOption value="test">{t("entry.test")}</NativeSelectOption></NativeSelect></label>
    <label className="full">{t("classEvents.dateTime")}<input type="datetime-local" name="dueAt" required defaultValue={event ? localDate(event.dueAt) : undefined}/></label>
    <label className="full">{t("classes.description")}<textarea name="description" rows={3} maxLength={2000} defaultValue={event?.description}/></label>
    <label>{t("classEvents.status")}<NativeSelect name="status" defaultValue={event?.status??"active"}><NativeSelectOption value="active">{t("classEvents.active")}</NativeSelectOption><NativeSelectOption value="cancelled">{t("classEvents.cancelled")}</NativeSelectOption></NativeSelect></label>
  </>;
}
function eventFromForm(form:HTMLFormElement):EventFields {
  const fields=new FormData(form);
  return eventFields.parse(Object.fromEntries(["title","subject","kind","description","status"].map(k=>[k,fields.get(k)]).concat([["dueAt",new Date(String(fields.get("dueAt"))).toISOString()]])));
}
function PersonalInputs({data,semesterId,subjectId="",reminder=false}: {data:SchoolData;semesterId:string;subjectId?:string;reminder?:boolean}) {
  const {t}=useI18n();
  return <>
    <label>{t("classEvents.personalSemester")}<NativeSelect name="semesterId" defaultValue={data.semesters.some(s=>s.id===semesterId)?semesterId:data.semesters[0]?.id}>{data.semesters.map(s=><NativeSelectOption key={s.id} value={s.id}>{s.name}</NativeSelectOption>)}</NativeSelect></label>
    <label>{t("classEvents.mySubject")}<NativeSelect name="subjectId" defaultValue={data.subjects.some(s=>s.id===subjectId)?subjectId:""}><NativeSelectOption value="">{t("classEvents.useClassLabel")}</NativeSelectOption>{data.subjects.map(s=><NativeSelectOption key={s.id} value={s.id}>{s.name}</NativeSelectOption>)}</NativeSelect></label>
    <label className="full personal-checkbox"><input type="checkbox" name="reminder" defaultChecked={reminder}/> {t("classEvents.reminder")}</label>
    <p className="full class-muted">{t("classEvents.privateChoices")}</p>
  </>;
}

export function PersonalEventDialog({item,data,controller,onClose}: {item:ClassSubscription;data:SchoolData;controller:ClassAgendaController;onClose:()=>void}) {
  const {t}=useI18n();
  const [busy,setBusy]=useState(false);
  const [detachConfirm,setDetachConfirm]=useState(false);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=e.currentTarget, f=new FormData(form); setBusy(true);
    try {
      await controller.update(item,{semesterId:String(f.get("semesterId")),subjectId:String(f.get("subjectId")),reminder:f.has("reminder"),...(item.detachedAt ? {personalEvent:eventFromForm(form)} : {})});
      toast.success(t("classEvents.preferencesSaved")); onClose();
    } catch { toast.error(t("classes.operationFailed")); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open=>{if(!open&&!busy) onClose();}}><DialogContent className="entry-dialog shared-event-dialog"><DialogHeader><LanguageSelect className="language-select"/><DialogTitle>{item.detachedAt?t("classEvents.personalActivity"):t("classEvents.inAgenda")}</DialogTitle><DialogDescription>{item.detachedAt?t("classEvents.detachedDescription"):`${item.event.title} · ${item.event.className}. ${t("classEvents.classUpdates")}`}</DialogDescription></DialogHeader>
    <form onSubmit={save}><fieldset className="form-grid" disabled={busy}>{item.detachedAt && <EventInputs event={item.event}/>}<PersonalInputs data={data} semesterId={item.semesterId} subjectId={item.subjectId} reminder={item.reminder}/></fieldset>
    <DialogFooter><button className="primary-button" disabled={busy}>{busy?t("common.saving"):t("classEvents.saveForMe")}</button></DialogFooter></form>
    {!item.detachedAt && <div className="detach-action">{detachConfirm ? <><p>{t("classEvents.detachWarning")}</p><button className="soft-button" disabled={busy} onClick={()=>{setBusy(true); void controller.update(item,{detach:true}).then(()=>{toast.success(t("classEvents.detached"));onClose();}).catch(()=>toast.error(t("classes.operationFailed"))).finally(()=>setBusy(false));}}>{t("classEvents.detach")}</button><button className="soft-button" onClick={()=>setDetachConfirm(false)}>{t("classes.cancel")}</button></> : <button className="soft-button" onClick={()=>setDetachConfirm(true)}>{t("classEvents.detach")}</button>}</div>}
  </DialogContent></Dialog>;
}

export function ClassEventsPanel({detail,userId,data,semesterId,controller}: {detail:ClassDetail;userId:string;data:SchoolData;semesterId:string;controller:ClassAgendaController}) {
  const {t,locale}=useI18n();
  const [events,setEvents]=useState<ClassEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<MessageKey|null>(null);
  const [busy,setBusy]=useState(false);
  const [editor,setEditor]=useState<ClassEvent|"new"|null>(null);
  const [adding,setAdding]=useState<ClassEvent|null>(null);
  const [deleting,setDeleting]=useState<ClassEvent|null>(null);
  const [scope,setScope]=useState("upcoming");
  const [search,setSearch]=useState("");
  const seq=useRef(0);
  const alive=useRef(true);
  const load=useCallback(async()=>{
    const ticket=++seq.current;
    try { const r=await classRequest<{events:ClassEvent[]}>(userId,`/api/classes/${detail.id}/events`); if(alive.current && ticket===seq.current) {setEvents(r.events);setError(null);} }
    catch {if(alive.current && ticket===seq.current) { setEvents([]);setError("classEvents.unavailable"); }}
    finally {if(alive.current && ticket===seq.current) setLoading(false);}
  },[detail.id,userId]);
  useEffect(()=>{alive.current=true;queueMicrotask(()=>{if(alive.current)void load();}); const timer=setInterval(()=>{if(document.visibilityState==="visible") void load();},30000);return()=>{alive.current=false;clearInterval(timer);};},[load]);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    try {
      const fields=eventFromForm(e.currentTarget), editing=editor!=="new"?editor:null;
      await classRequest(userId,`/api/classes/${detail.id}/events${editing?`/${editing.id}`:""}`,{method:editing?"PATCH":"POST",body:JSON.stringify({...fields,...(editing?{revision:editing.revision}:{})})});
      setEditor(null); await load(); await controller.refresh(); toast.success(t("classEvents.saved"));
    } catch { toast.error(t("classes.operationFailed")); await load(); } finally {setBusy(false);}
  }
  async function subscribe(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!adding) return; const f=new FormData(e.currentTarget); setBusy(true);
    try {await controller.subscribe(adding.id,String(f.get("semesterId")),String(f.get("subjectId")),f.has("reminder"));setAdding(null);toast.success(t("classEvents.added"));} catch {toast.error(t("classes.operationFailed"));} finally {setBusy(false);}
  }
  const visible=events.filter(e=>(scope==="all" || (e.status==="active" && e.dueAt>=new Date().toISOString().slice(0,10))) && `${e.title} ${e.subject}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
  return <section className="panel class-events-panel">
    <div className="panel-title"><div><h3>{t("classEvents.title")}</h3></div><button className="primary-button" onClick={()=>setEditor("new")}><Plus/> {t("entry.newActivity")}</button></div>
    <p className="class-muted">{t("classEvents.intro")}</p>
    <div className="class-event-filters"><input aria-label={t("classEvents.searchLabel")} placeholder={t("classEvents.searchPlaceholder")} value={search} onChange={e=>setSearch(e.target.value)}/><NativeSelect aria-label={t("classEvents.period")} value={scope} onChange={e=>setScope(e.target.value)}><NativeSelectOption value="upcoming">{t("classEvents.upcoming")}</NativeSelectOption><NativeSelectOption value="all">{t("classEvents.allIncludingCancelled")}</NativeSelectOption></NativeSelect><button className="icon-button" aria-label={t("classEvents.refresh")} onClick={()=>void load()}><RefreshCw size={18}/></button></div>
    {loading && <p role="status">{t("classEvents.loading")}</p>}{error && <p role="alert">{t(error)}</p>}
    {!loading && !error && !visible.length && <div className="class-events-empty"><CalendarDays/><h4>{search?t("classEvents.noResults"):t("classEvents.nonePlanned")}</h4><p>{search?t("classEvents.tryOther"):t("classEvents.shareNext")}</p></div>}
    <div className="class-event-list">{visible.map(event=>{
      const subscription=controller.items.find(s=>s.event.id===event.id);
      const canEdit=detail.role!=="member"||event.authorId===userId;
      return <article key={event.id} className={event.status==="cancelled"?"cancelled":""}>
        <div className="shared-event-date"><b>{new Date(event.dueAt).getDate()}</b><small>{formatDate(locale,event.dueAt,{month:"short"})}</small></div>
        <div className="class-event-copy"><span className="eyebrow">{event.subject} · {t(event.kind==="test"?"entry.test":"entry.task")}</span><h4>{event.title}</h4><small>{formatDate(locale,event.dueAt,{weekday:"short",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}{event.status==="cancelled"?` · ${t("classEvents.cancelled")}`:""}</small>{event.description && <p>{event.description}</p>}<small>{t("classEvents.byAuthor",{name:event.authorName})}</small></div>
        <div className="class-event-actions"><button className="soft-button compact" disabled={!!subscription||event.status==="cancelled"} onClick={()=>setAdding(event)}>{subscription?<Check/>:<Plus/>}{subscription?(subscription.detachedAt?t("classEvents.personalCopy"):t("classEvents.inAgenda")):t("classEvents.addToAgenda")}</button>{canEdit && <><button className="icon-button" aria-label={t("classEvents.editEvent",{title:event.title})} onClick={()=>setEditor(event)}><Pencil size={17}/></button><button className="icon-button danger" aria-label={t("classEvents.deleteEvent",{title:event.title})} onClick={()=>setDeleting(event)}><Trash2 size={17}/></button></>}</div>
      </article>;
    })}</div>
    <Dialog open={!!editor} onOpenChange={open=>{if(!open&&!busy)setEditor(null);}}><DialogContent className="entry-dialog shared-event-dialog"><DialogHeader><LanguageSelect className="language-select"/><DialogTitle>{editor==="new"?t("classEvents.newTitle"):t("classEvents.editTitle")}</DialogTitle><DialogDescription>{t("classEvents.visibleTo",{name:detail.name})}</DialogDescription></DialogHeader><form onSubmit={save}><fieldset disabled={busy} className="form-grid"><EventInputs key={editor==="new"?"new":editor?.id} event={editor&&editor!=="new"?editor:undefined} subjects={[...new Set(events.map(e=>e.subject))]}/></fieldset><DialogFooter><button className="primary-button" disabled={busy}>{busy?t("common.saving"):t("classEvents.saveToClass")}</button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!adding} onOpenChange={open=>{if(!open&&!busy)setAdding(null);}}><DialogContent className="entry-dialog"><DialogHeader><LanguageSelect className="language-select"/><DialogTitle>{t("classEvents.addToAgenda")}</DialogTitle><DialogDescription>{adding?.title} · {detail.name}. {t("classEvents.classUpdates")}</DialogDescription></DialogHeader><form onSubmit={subscribe}><fieldset className="form-grid" disabled={busy}><PersonalInputs data={data} semesterId={semesterId}/></fieldset><DialogFooter><button className="primary-button" disabled={busy}>{busy?t("classEvents.adding"):t("classEvents.addToAgenda")}</button></DialogFooter></form></DialogContent></Dialog>
    <AlertDialog open={!!deleting} onOpenChange={open=>{if(!open&&!busy)setDeleting(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("classEvents.deleteConfirm")}</AlertDialogTitle><AlertDialogDescription>{t("classEvents.deleteWarning")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>{t("classes.cancel")}</AlertDialogCancel><AlertDialogAction disabled={busy} variant="destructive" onClick={e=>{e.preventDefault();if(!deleting)return;setBusy(true);void classRequest(userId,`/api/classes/${detail.id}/events/${deleting.id}`,{method:"DELETE",body:JSON.stringify({revision:deleting.revision})}).then(async()=>{setDeleting(null);await load();await controller.refresh();toast.success(t("classEvents.deleted"));}).catch(()=>toast.error(t("classes.operationFailed"))).finally(()=>setBusy(false));}}>{t("classEvents.delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
