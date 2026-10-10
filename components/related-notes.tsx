"use client";
import { useEffect,useId,useRef } from "react";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/i18n";

export type RelatedNote={id:string;title:string;updatedAt:number};

export function RelatedNotes({notes,subjectName,onOpen,headingLevel=3}:{notes:RelatedNote[];subjectName:string;onOpen:(id:string)=>void;headingLevel?:3|4}){
  const {t,locale}=useI18n(),headingId=useId();
  const Heading=headingLevel===4?"h4":"h3";
  if(!notes.length)return null;
  return <section className="related-notes" aria-labelledby={headingId}>
    <Heading id={headingId}>{t("notes.relatedSubject",{name:subjectName})}</Heading>
    <ul>{notes.map(note=><li key={note.id}><button className="related-note" onClick={()=>onOpen(note.id)}>
      <span>{note.title||t("notes.untitled")}</span>
      <time dateTime={new Date(note.updatedAt).toISOString()}>{formatDate(locale,new Date(note.updatedAt),{day:"numeric",month:"short",year:"numeric"})}</time>
    </button></li>)}</ul>
  </section>;
}

// Only an explicit related-note click moves focus or scrolls the reader.
export function useReadingNavigation(selectedId:string|undefined){
  const readerRef=useRef<HTMLElement>(null),pendingId=useRef<string|null>(null);
  useEffect(()=>{
    if(!selectedId||pendingId.current!==selectedId||!readerRef.current)return;
    pendingId.current=null;
    const reader=readerRef.current;
    reader.querySelector<HTMLElement>(".notes-reader-actions > h2, .notes-reader-actions > h3")?.focus({preventScroll:true});
    if(reader.getBoundingClientRect().top<0){
      const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches||!!reader.closest('[data-reduce-motion="true"]');
      reader.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"});
    }
  },[selectedId]);
  return {readerRef,prepareSwitch:(id:string)=>{pendingId.current=id;}};
}
