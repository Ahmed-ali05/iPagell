"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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

const localDate = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
};
const fail = (e:unknown) => toast.error(e instanceof Error ? e.message : "Operazione non riuscita.");
export function EventInputs({event,subjects=[]}: {event?:EventFields;subjects?:string[]}) {
  return <>
    <label className="full">Titolo<input name="title" required maxLength={160} defaultValue={event?.title}/></label>
    <label>Materia condivisa<input name="subject" list="class-subject-labels" required maxLength={80} defaultValue={event?.subject}/><datalist id="class-subject-labels">{subjects.map(s=><option key={s} value={s}/>)}</datalist></label>
    <label>Tipo<NativeSelect name="kind" defaultValue={event?.kind??"task"}><NativeSelectOption value="task">Compito</NativeSelectOption><NativeSelectOption value="test">Verifica</NativeSelectOption></NativeSelect></label>
    <label className="full">Data e ora<input type="datetime-local" name="dueAt" required defaultValue={event ? localDate(event.dueAt) : undefined}/></label>
    <label className="full">Descrizione<textarea name="description" rows={3} maxLength={2000} defaultValue={event?.description}/></label>
    <label>Stato<NativeSelect name="status" defaultValue={event?.status??"active"}><NativeSelectOption value="active">Attivo</NativeSelectOption><NativeSelectOption value="cancelled">Annullato</NativeSelectOption></NativeSelect></label>
  </>;
}
function eventFromForm(form:HTMLFormElement):EventFields {
  const fields=new FormData(form);
  return eventFields.parse(Object.fromEntries(["title","subject","kind","description","status"].map(k=>[k,fields.get(k)]).concat([["dueAt",new Date(String(fields.get("dueAt"))).toISOString()]])));
}
function PersonalInputs({data,semesterId,subjectId="",reminder=false}: {data:SchoolData;semesterId:string;subjectId?:string;reminder?:boolean}) {
  return <>
    <label>Periodo personale<NativeSelect name="semesterId" defaultValue={data.semesters.some(s=>s.id===semesterId)?semesterId:data.semesters[0]?.id}>{data.semesters.map(s=><NativeSelectOption key={s.id} value={s.id}>{s.name}</NativeSelectOption>)}</NativeSelect></label>
    <label>La mia materia<NativeSelect name="subjectId" defaultValue={data.subjects.some(s=>s.id===subjectId)?subjectId:""}><NativeSelectOption value="">Usa l’etichetta della classe</NativeSelectOption>{data.subjects.map(s=><NativeSelectOption key={s.id} value={s.id}>{s.name}</NativeSelectOption>)}</NativeSelect></label>
    <label className="full personal-checkbox"><input type="checkbox" name="reminder" defaultChecked={reminder}/> Avvisami ad app aperta nelle 12 ore precedenti</label>
    <p className="full class-muted">Queste scelte e il completamento sono visibili solo a te. Nessun voto o assenza viene condiviso.</p>
  </>;
}

export function PersonalEventDialog({item,data,controller,onClose}: {item:ClassSubscription;data:SchoolData;controller:ClassAgendaController;onClose:()=>void}) {
  const [busy,setBusy]=useState(false);
  const [detachConfirm,setDetachConfirm]=useState(false);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=e.currentTarget, f=new FormData(form); setBusy(true);
    try {
      await controller.update(item,{semesterId:String(f.get("semesterId")),subjectId:String(f.get("subjectId")),reminder:f.has("reminder"),...(item.detachedAt ? {personalEvent:eventFromForm(form)} : {})});
      toast.success("Preferenze personali salvate"); onClose();
    } catch(e) { fail(e); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open=>{if(!open&&!busy) onClose();}}><DialogContent className="entry-dialog shared-event-dialog"><DialogHeader><DialogTitle>{item.detachedAt?"Attività personale":"Nella tua agenda"}</DialogTitle><DialogDescription>{item.detachedAt?"Copia personale, non più sincronizzata con la classe.":`${item.event.title} · ${item.event.className}. Titolo e data seguono gli aggiornamenti della classe.`}</DialogDescription></DialogHeader>
    <form onSubmit={save}><fieldset className="form-grid" disabled={busy}>{item.detachedAt && <EventInputs event={item.event}/>}<PersonalInputs data={data} semesterId={item.semesterId} subjectId={item.subjectId} reminder={item.reminder}/></fieldset>
    <DialogFooter><button className="primary-button" disabled={busy}>{busy?"Salvataggio…":"Salva solo per me"}</button></DialogFooter></form>
    {!item.detachedAt && <div className="detach-action">{detachConfirm ? <><p>La copia resterà nell’agenda, ma non seguirà più le modifiche della classe.</p><button className="soft-button" disabled={busy} onClick={()=>{setBusy(true); void controller.update(item,{detach:true}).then(()=>{toast.success("L’attività ora è personale");onClose();}).catch(fail).finally(()=>setBusy(false));}}>Conferma: rendi personale</button><button className="soft-button" onClick={()=>setDetachConfirm(false)}>Annulla</button></> : <button className="soft-button" onClick={()=>setDetachConfirm(true)}>Rendi personale</button>}</div>}
  </DialogContent></Dialog>;
}

export function ClassEventsPanel({detail,userId,data,semesterId,controller}: {detail:ClassDetail;userId:string;data:SchoolData;semesterId:string;controller:ClassAgendaController}) {
  const [events,setEvents]=useState<ClassEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
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
    try { const r=await classRequest<{events:ClassEvent[]}>(userId,`/api/classes/${detail.id}/events`); if(alive.current && ticket===seq.current) {setEvents(r.events);setError("");} }
    catch(e) {if(alive.current && ticket===seq.current) { setEvents([]);setError(e instanceof Error?e.message:"Eventi non disponibili"); }}
    finally {if(alive.current && ticket===seq.current) setLoading(false);}
  },[detail.id,userId]);
  useEffect(()=>{alive.current=true;queueMicrotask(()=>{if(alive.current)void load();}); const timer=setInterval(()=>{if(document.visibilityState==="visible") void load();},30000);return()=>{alive.current=false;clearInterval(timer);};},[load]);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    try {
      const fields=eventFromForm(e.currentTarget), editing=editor!=="new"?editor:null;
      await classRequest(userId,`/api/classes/${detail.id}/events${editing?`/${editing.id}`:""}`,{method:editing?"PATCH":"POST",body:JSON.stringify({...fields,...(editing?{revision:editing.revision}:{})})});
      setEditor(null); await load(); await controller.refresh(); toast.success("Evento condiviso con la classe");
    } catch(e) { fail(e); await load(); } finally {setBusy(false);}
  }
  async function subscribe(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!adding) return; const f=new FormData(e.currentTarget); setBusy(true);
    try {await controller.subscribe(adding.id,String(f.get("semesterId")),String(f.get("subjectId")),f.has("reminder"));setAdding(null);toast.success("Aggiunto alla tua agenda");} catch(e) {fail(e);} finally {setBusy(false);}
  }
  const visible=events.filter(e=>(scope==="all" || (e.status==="active" && e.dueAt>=new Date().toISOString().slice(0,10))) && `${e.title} ${e.subject}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
  return <section className="panel class-events-panel">
    <div className="panel-title"><div><span className="eyebrow">Agenda condivisa</span><h3>Eventi della classe</h3></div><button className="primary-button" onClick={()=>setEditor("new")}><Plus/> Nuovo evento</button></div>
    <p className="class-muted">Tutti possono contribuire. Aggiungi alla tua agenda solo le attività che ti servono.</p>
    <div className="class-event-filters"><input aria-label="Cerca eventi di classe" placeholder="Cerca evento o materia" value={search} onChange={e=>setSearch(e.target.value)}/><NativeSelect aria-label="Periodo eventi" value={scope} onChange={e=>setScope(e.target.value)}><NativeSelectOption value="upcoming">Prossimi eventi</NativeSelectOption><NativeSelectOption value="all">Tutti, inclusi annullati</NativeSelectOption></NativeSelect><button className="icon-button" aria-label="Aggiorna eventi" onClick={()=>void load()}><RefreshCw size={18}/></button></div>
    {loading && <p role="status">Caricamento eventi…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && !visible.length && <div className="class-events-empty"><CalendarDays/><h4>{search?"Nessun risultato":"Nessun evento in programma"}</h4><p>{search?"Prova un altro titolo o materia.":"Condividi il prossimo compito o la prossima verifica."}</p></div>}
    <div className="class-event-list">{visible.map(event=>{
      const subscription=controller.items.find(s=>s.event.id===event.id);
      const canEdit=detail.role!=="member"||event.authorId===userId;
      return <article key={event.id} className={event.status==="cancelled"?"cancelled":""}>
        <div className="shared-event-date"><b>{new Date(event.dueAt).getDate()}</b><small>{new Intl.DateTimeFormat("it-CH",{month:"short"}).format(new Date(event.dueAt))}</small></div>
        <div className="class-event-copy"><span className="eyebrow">{event.subject} · {event.kind==="test"?"Verifica":"Compito"}</span><h4>{event.title}</h4><small>{new Intl.DateTimeFormat("it-CH",{weekday:"short",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(event.dueAt))}{event.status==="cancelled"?" · Annullato":""}</small>{event.description && <p>{event.description}</p>}<small>Da {event.authorName} · revisione {event.revision}</small></div>
        <div className="class-event-actions"><button className="soft-button compact" disabled={!!subscription||event.status==="cancelled"} onClick={()=>setAdding(event)}>{subscription?<Check/>:<Plus/>}{subscription?(subscription.detachedAt?"Copia personale":"Nella tua agenda"):"Alla mia agenda"}</button>{canEdit && <><button className="icon-button" aria-label={`Modifica ${event.title}`} onClick={()=>setEditor(event)}><Pencil size={17}/></button><button className="icon-button danger" aria-label={`Elimina ${event.title}`} onClick={()=>setDeleting(event)}><Trash2 size={17}/></button></>}</div>
      </article>;
    })}</div>
    <Dialog open={!!editor} onOpenChange={open=>{if(!open&&!busy)setEditor(null);}}><DialogContent className="entry-dialog shared-event-dialog"><DialogHeader><DialogTitle>{editor==="new"?"Nuovo evento di classe":"Modifica evento di classe"}</DialogTitle><DialogDescription>Visibile ai membri di {detail.name}. Le modifiche aggiornano le agende collegate, mai i dati personali.</DialogDescription></DialogHeader><form onSubmit={save}><fieldset disabled={busy} className="form-grid"><EventInputs key={editor==="new"?"new":editor?.id} event={editor&&editor!=="new"?editor:undefined} subjects={[...new Set(events.map(e=>e.subject))]}/></fieldset><DialogFooter><button className="primary-button" disabled={busy}>{busy?"Salvataggio…":"Salva nella classe"}</button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!adding} onOpenChange={open=>{if(!open&&!busy)setAdding(null);}}><DialogContent className="entry-dialog"><DialogHeader><DialogTitle>Aggiungi alla tua agenda</DialogTitle><DialogDescription>{adding?.title} · {detail.name}. Titolo e data si aggiorneranno insieme alla classe.</DialogDescription></DialogHeader><form onSubmit={subscribe}><fieldset className="form-grid" disabled={busy}><PersonalInputs data={data} semesterId={semesterId}/></fieldset><DialogFooter><button className="primary-button" disabled={busy}>{busy?"Aggiunta…":"Aggiungi solo per me"}</button></DialogFooter></form></DialogContent></Dialog>
    <AlertDialog open={!!deleting} onOpenChange={open=>{if(!open&&!busy)setDeleting(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminare questo evento?</AlertDialogTitle><AlertDialogDescription>Scomparirà dalla classe. Le copie già aggiunte alle agende rimarranno personali, con stato annullato. Puoi invece modificarne lo stato per annullarlo mantenendolo nella classe.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Annulla</AlertDialogCancel><AlertDialogAction disabled={busy} variant="destructive" onClick={e=>{e.preventDefault();if(!deleting)return;setBusy(true);void classRequest(userId,`/api/classes/${detail.id}/events/${deleting.id}`,{method:"DELETE",body:JSON.stringify({revision:deleting.revision})}).then(async()=>{setDeleting(null);await load();await controller.refresh();toast.success("Evento eliminato");}).catch(fail).finally(()=>setBusy(false));}}>Elimina evento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
