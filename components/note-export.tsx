"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { escapePlain, noteVisibleText } from "@/lib/notes/format";
import type { PdfNote } from "@/lib/notes/pdf";

function filename(title:string,extension:string){
  return `${title.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g,"_").slice(0,80)||"appunto"}.${extension}`;
}
function download(name:string,body:Blob){
  const url=URL.createObjectURL(body),link=document.createElement("a");link.href=url;link.download=name;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
export function NoteExport({note}:{note:PdfNote}){
  const {t}=useI18n();
  const [file,setFile]=useState<File|null>(null),[url,setUrl]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const link=useRef<HTMLAnchorElement>(null);
  useEffect(()=>()=>{if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60_000);},[url]);
  const makePdf=async()=>{
    if(busy)return;
    setBusy(true);setError("");
    try{
      const {generateNotePdf}=await import("@/lib/notes/pdf");
      const bytes=await generateNotePdf(note);
      const pdf=new File([new Uint8Array(bytes)],filename(note.title,"pdf"),{type:"application/pdf"});
      const nextUrl=URL.createObjectURL(pdf);
      if(url)window.setTimeout(()=>URL.revokeObjectURL(url),60_000);
      setFile(pdf);setUrl(nextUrl);
    }catch{setError(t("notes.pdfFailed"));}finally{setBusy(false);}
  };
  const share=async()=>{
    if(!file)return;
    try{await navigator.share({files:[file],title:note.title});}
    catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;setError(t("notes.pdfShareFailed"));}
  };
  const markdown=note.contentFormat==="md-lite-v1"?note.content:note.contentFormat==="plain"?escapePlain(note.content):null;
  return <div className="notes-export">
    <button className="soft-button" type="button" disabled={busy} onClick={()=>void makePdf()}><Download size={16}/>{busy?t("notes.pdfPreparing"):t("notes.exportPdf")}</button>
    {file&&url&&<div className="notes-export-ready" role="status"><a ref={link} className="soft-button" href={url} download={file.name}>{t("notes.savePdf")}</a><a className="soft-button" href={url} target="_blank" rel="noopener noreferrer">{t("notes.openPdf")}</a>{typeof navigator!=="undefined"&&typeof navigator.share==="function"&&typeof navigator.canShare==="function"&&navigator.canShare({files:[file]})&&<button className="soft-button" type="button" onClick={()=>void share()}>{t("notes.sharePdf")}</button>}</div>}
    {error&&<p role="alert" className="notes-error">{error}</p>}
    <details><summary>{t("notes.otherFormats")}</summary><div className="notes-actions">
      {markdown!==null&&<button className="soft-button" type="button" onClick={()=>download(filename(note.title,"md"),new Blob([markdown],{type:"text/markdown;charset=utf-8"}))}>{t("notes.exportMarkdown")}</button>}
      {note.contentFormat==="plain"&&<button className="soft-button" type="button" onClick={()=>download(filename(note.title,"txt"),new Blob([note.content],{type:"text/plain;charset=utf-8"}))}>{t("notes.downloadRecovery")}</button>}
      <button className="soft-button" type="button" onClick={()=>void navigator.clipboard.writeText(noteVisibleText(note.contentFormat,note.content)).catch(()=>setError(t("notes.copyFailed")))}>{t("notes.copyText")}</button>
    </div></details>
  </div>;
}
