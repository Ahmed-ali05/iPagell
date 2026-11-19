"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Download, FileText, LockKeyhole, Plus, Tag } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { PublicFooter, PublicHeader, PublicLink } from "@/components/public-header";
import NoteEditor from "@/components/note-editor";
import { NoteContent } from "@/components/note-content";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNoteAutosave } from "@/hooks/use-note-autosave";
import { emptyPublicNote, PublicNoteConflict, publicNoteFilename, publicNoteMarkdown, readPublicNote, savePublicNote, type PublicNote } from "@/lib/public-notes";
import { publicDiaryPaths } from "@/lib/i18n/public-routes";
import styles from "@/app/public-space.module.css";

export function PublicNotes() {
  const { t, locale } = useI18n();
  const [loaded, setLoaded] = useState<{ note: PublicNote; memory: boolean; id: number } | null>(null);
  const [failed, setFailed] = useState(false);
  async function load() {
    setFailed(false);
    try { const note = await readPublicNote(); setLoaded({ note, memory: false, id: Date.now() }); }
    catch { setFailed(true); }
  }
  useEffect(() => { let active = true; void readPublicNote().then(note => { if (active) setLoaded({ note, memory: false, id: Date.now() }); }, () => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  return <div className={styles.page}><PublicHeader current="notes" /><main className={styles.main}>
    <div className={styles.intro}><div><p className={styles.eyebrow}>{t("public.noAccount")}</p><h1>{t("public.notesTitle")}</h1><p>{t("public.notesDescription")}</p></div></div>
    {loaded ? <NotesWorkspace key={loaded.id} initial={loaded.note} memory={loaded.memory} onReload={load} onReset={note => setLoaded({ note, memory: loaded.memory, id: Date.now() })} /> : failed ? <div className={styles.notice} role="alert"><div><p>{t("public.loadError")}</p><div className={styles.dialogActions}><button className={styles.secondaryButton} onClick={() => void load()}>{t("public.retry")}</button><button className={styles.secondaryButton} onClick={() => setLoaded({ note: emptyPublicNote(), memory: true, id: Date.now() })}>{t("public.memoryAction")}</button></div></div></div> : <p role="status">{t("public.loading")}</p>}
    <div className={styles.underNote}><div><h2>{t("public.localTitle")}</h2><p>{t("public.localText")}</p></div><div><h2>{t("public.connectedTitle")}</h2><p>{t("public.connectedText")}</p><PublicLink href={publicDiaryPaths[locale]}>{t("public.discover")}<ArrowUpRight size={16} aria-hidden="true" /></PublicLink></div></div>
  </main><PublicFooter /></div>;
}

function NotesWorkspace({ initial, memory, onReload, onReset }: { initial: PublicNote; memory: boolean; onReload: () => Promise<void>; onReset: (note: PublicNote) => void }) {
  const { t, locale } = useI18n();
  const [note, setNote] = useState(initial);
  const latest = useRef(initial);
  const revision = useRef(initial.revision);
  const [status, setStatus] = useState<"saving" | "device" | "error">("device");
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState<"new" | "reload" | null>(null);
  const [confirmationOrigin, setConfirmationOrigin] = useState<"new" | "reload">("new");
  function openConfirmation(action: "new" | "reload") { setConfirmationOrigin(action); setConfirm(action); }
  const [resetting, setResetting] = useState(false);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const reloadTrigger = useRef<HTMLButtonElement>(null);
  const autosave = useNoteAutosave(async () => {
    if (memory) throw new Error("MEMORY_ONLY");
    const committed = await savePublicNote(latest.current, revision.current);
    revision.current = committed.revision;
  }, (next, error) => { setStatus(next); if (next === "error") setConflict(error instanceof PublicNoteConflict); }, true);
  function change(patch: Partial<PublicNote>) {
    const next = { ...latest.current, ...patch, updatedAt: Date.now() };
    latest.current = next; setNote(next); autosave.changed();
  }
  async function reset() {
    if (resetting) return;
    setResetting(true);
    try {
      if (confirm === "reload") { await onReload(); setConfirm(null); return; }
      if (!memory) await autosave.flush();
      const blank = { ...emptyPublicNote(), updatedAt: Date.now() };
      onReset(memory ? blank : await savePublicNote(blank, revision.current));
      setConfirm(null);
    } catch { setStatus("error"); setConfirm(null); }
    finally { setResetting(false); }
  }
  return <>
    {memory && <div className={styles.notice}><LockKeyhole size={18} aria-hidden="true" /><p>{t("public.memoryText")}</p></div>}
    <section className={styles.workspace} aria-label={t("public.editorLabel")}>
      <div className={styles.workbar}><div className={styles.modeSwitch} aria-label={t("public.viewMode")}><button aria-pressed={!preview} onClick={() => setPreview(false)}>{t("public.write")}</button><button aria-pressed={preview} onClick={() => setPreview(true)}>{t("public.preview")}</button></div><ExportActions note={note} /></div>
      {status === "error" && !memory && <div className={styles.error} role="alert">{t(conflict ? "public.conflict" : "public.saveError")} <button ref={reloadTrigger} className={styles.secondaryButton} onClick={() => conflict ? openConfirmation("reload") : void autosave.flush(true).catch(() => undefined)}>{t(conflict ? "public.reload" : "public.retry")}</button></div>}
      <fieldset disabled={resetting} className={styles.paper} style={{ border: 0, width: "100%", minWidth: 0 }}>
        {preview ? <h2 className={styles.previewTitle}>{note.title.trim() || t("public.untitled")}</h2> : <input className={styles.titleInput} aria-label={t("public.titleLabel")} placeholder={t("public.titlePlaceholder")} value={note.title} maxLength={120} onChange={event => change({ title: event.target.value })} />}
        {preview ? note.subjectName && <p className={styles.subjectField}><Tag size={15} aria-hidden="true" />{note.subjectName}</p> : <label className={styles.subjectField}><Tag size={15} aria-hidden="true" /><span className="sr-only">{t("public.subjectLabel")}</span><input value={note.subjectName} maxLength={120} placeholder={t("public.subjectLabel")} onChange={event => change({ subjectName: event.target.value })} /></label>}
        <div hidden={preview}><NoteEditor value={note} onChange={value => change({ content: value.content })} label={t("public.editorLabel")} placeholder={t("public.bodyPlaceholder")} disabled={resetting} /></div>
        {preview && <div className={styles.preview}>{note.content ? <NoteContent contentFormat={note.contentFormat} content={note.content} /> : <p className={styles.emptyPreview}>{t("public.previewEmpty")}</p>}</div>}
      </fieldset>
      <div className={styles.workFooter}><span className={styles.saveStatus} role="status">{status === "device" && !memory && <Check size={14} aria-hidden="true" />}{t(memory ? "public.memoryStatus" : status === "saving" ? "public.saving" : status === "error" ? "public.unsaved" : "public.saved")}</span><span>{[...note.content].length.toLocaleString(locale)} / {(20_000).toLocaleString(locale)}</span><button ref={newTrigger} className={styles.newNote} onClick={() => openConfirmation("new")}><Plus size={14} aria-hidden="true" />{t("public.new")}</button></div>
    </section>
    <Dialog open={confirm !== null} onOpenChange={open => { if (!resetting && !open) setConfirm(null); }}><DialogContent fallbackFocusRef={confirmationOrigin === "reload" ? reloadTrigger : newTrigger}><DialogTitle>{t(confirm === "reload" ? "public.reload" : "public.new")}</DialogTitle><DialogDescription>{t(confirm === "reload" ? "public.reloadConfirm" : "public.newConfirm")}</DialogDescription><div className={styles.dialogActions}><button disabled={resetting} className={styles.secondaryButton} onClick={() => setConfirm(null)}>{t("common.cancel")}</button><button disabled={resetting} className={styles.primaryButton} onClick={() => void reset()}>{t(confirm === "reload" ? "public.reload" : "public.new")}</button></div></DialogContent></Dialog>
  </>;
}

function ExportActions({ note }: { note: PublicNote }) {
  const { t, locale } = useI18n();
  const fingerprint = JSON.stringify([note.title, note.subjectName, note.content, note.updatedAt, locale]);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [pdf, setPdf] = useState<{ url: string; fingerprint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);
  const hasContent = Boolean(note.title.trim() || note.content.trim());
  const ready = pdf?.fingerprint === fingerprint ? pdf : null;
  async function makePdf() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(false);
    try {
      const { generateNotePdf } = await import("@/lib/notes/pdf");
      const bytes = await generateNotePdf({ ...note, title: note.title.trim() || t("public.untitled"), updatedAt: note.updatedAt || Date.now(), locale });
      if (!mounted.current) return;
      setPdf({ url: URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" })), fingerprint });
    } catch { setError(true); }
    finally { setBusy(false); busyRef.current = false; }
  }
  function markdown() {
    const url = URL.createObjectURL(new Blob([publicNoteMarkdown(note, t("public.untitled"))], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = publicNoteFilename(note.title, "md"); anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return <div className={styles.exportActions}>
    <button className={styles.secondaryButton} disabled={!hasContent} onClick={markdown}><Download size={16} aria-hidden="true" />{t("public.downloadMarkdown")}</button>
    {ready ? <a className={styles.primaryButton} href={ready.url} download={publicNoteFilename(note.title, "pdf")}><Download size={16} aria-hidden="true" />{t("public.downloadPdf")}</a> : <button className={styles.primaryButton} disabled={!hasContent || busy} onClick={() => void makePdf()}><FileText size={16} aria-hidden="true" />{t(busy ? "public.preparing" : "public.exportPdf")}</button>}
    <span className="sr-only" role="status">{ready ? t("public.pdfReady") : busy ? t("public.preparing") : ""}</span>
    {error && <span role="alert">{t("public.exportError")}</span>}
  </div>;
}
