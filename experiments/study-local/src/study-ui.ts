import { GRAPH_LIMITS, changeGraph, exportArchive, importArchive, newId, remapArchive, removeSource, undoGraph, type Archive, type Evidence, type Graph, type Personal } from "./graph";
import { StudySession, type Snapshot } from "./study-store";
import { LabError, resolveChunk, type SourceDocument } from "./source";

type Bridge = { sources: () => { documents: SourceDocument[]; originals: Map<string, Blob> }; clear: () => void; download: (blob: Blob, filename: string) => void; contextChanged: () => void };
export function mountStudy(bridge: Bridge) {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(`study-${id}`) as T;
  const input = (id: string) => $<HTMLInputElement>(id);
  const select = (id: string) => $<HTMLSelectElement>(id);
  const session = new StudySession();
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("ipagell-study-lab-archive-v1") : undefined;
  let selected: string | undefined, busy = false, formDirty = false, spaceDirty = false, epoch = 0;
  let refreshPending = false;
  let exportUrl: string | undefined;
  function clearExport() { if (exportUrl) URL.revokeObjectURL(exportUrl); exportUrl = undefined; $("export-ready").hidden = true; input("export-json").value = ""; $("download").removeAttribute("href"); }
  const status = (text: string) => { $("status").textContent = text; };
  function button(text: string, action: () => void) { const el = document.createElement("button"); el.type = "button"; el.textContent = text; el.onclick = action; return el; }
  function option(value: string, text: string) { const el = document.createElement("option"); el.value = value; el.textContent = text; return el; }
  function clearEditor() { selected = undefined; formDirty = false; for (const id of ["node-title", "summary", "note"]) input(id).value = ""; select("state").value = "review"; $("editor-heading").textContent = "Nuovo concetto"; $("viewer").hidden = true; $("page").textContent = ""; $("viewer-title").textContent = ""; $("reference").textContent = ""; }
  function edit(id?: string) {
    if (formDirty && !confirm("Scartare le modifiche non salvate nel modulo?")) return;
    clearEditor(); const node = session.draft?.archive.graph.nodes.find(n => n.id === id); selected = node?.id;
    if (node) { input("node-title").value = node.title; input("summary").value = node.summary; const personal = session.draft!.archive.graph.personal.find(p => p.nodeId === id); input("note").value = personal?.note ?? ""; select("state").value = personal?.state ?? "review"; $("editor-heading").textContent = "Modifica concetto"; }
    render(); input("node-title").focus();
  }
  function lock() {
    for (const el of document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("#manual button, #manual input, #manual select, #manual textarea")) el.disabled = busy;
    $<HTMLButtonElement>("close").disabled = !session.accountId;
    if (!busy) { $<HTMLButtonElement>("undo").disabled = !session.draft?.archive.history.length || session.conflict; $<HTMLButtonElement>("save").disabled = !session.dirty || session.conflict; }
  }
  function render() {
    $("workspace").hidden = !session.draft;
    if (!session.draft) { for (const id of ["tree", "sources", "edges", "evidence", "history", "page", "chunk", "from", "to", "revision"]) $(id).replaceChildren(); lock(); return; }
    const { archive } = session.draft, graph = archive.graph;
    $("revision").textContent = `${session.accountId === "lab-a" ? "Profilo A" : "Profilo B"} · ${archive.space.title} · ${session.dirty ? "Bozza non salvata" : session.record?.archive ? "Salvato nel browser" : "Archivio vuoto, non ancora salvato"}${session.conflict ? " · Conflitto: nessuna sovrascrittura" : ""}`;
    const tree = $("tree"); tree.replaceChildren();
    const parentOf = new Map(graph.edges.filter(e => e.type === "hierarchy").map(e => [e.to, e.from]));
    function branch(parent: string | undefined, list: HTMLElement) {
      for (const node of graph.nodes.filter(n => parentOf.get(n.id) === parent)) {
        const li = document.createElement("li"), children = document.createElement("ul");
        li.append(button(node.title, () => edit(node.id)), node.evidence.length ? ` ${node.evidence.length} fonti` : " Senza fonti");
        if (node.reviewReason) li.append(" · Sintesi da rivedere: fonte rimossa");
        branch(node.id, children); if (children.children.length) li.append(children); list.append(li);
      }
    }
    branch(undefined, tree); if (!graph.nodes.length) tree.textContent = "La mappa è vuota. Crea il primo concetto.";
    for (const key of ["from", "to"]) { const old = select(key).value; select(key).replaceChildren(...graph.nodes.map(n => option(n.id, n.title))); if (graph.nodes.some(n => n.id === old)) select(key).value = old; }
    const oldChunk = select("chunk").value;
    select("chunk").replaceChildren(...archive.documents.flatMap(d => d.chunks.map(c => option(c.id, `${d.title} · p. ${c.page} · ${c.text.slice(0, 90)}`))));
    if (archive.documents.some(d => d.chunks.some(c => c.id === oldChunk))) select("chunk").value = oldChunk;
    $("sources").replaceChildren();
    for (const doc of archive.documents) {
      const li = document.createElement("li"); li.append(`${doc.title} · ${doc.chunks.length} passaggi `);
      li.append(button("Apri fonte", () => showEvidence({ documentId: doc.id, chunkId: doc.chunks[0].id, page: doc.chunks[0].page, start: doc.chunks[0].start, end: doc.chunks[0].end, unit: "utf16" })), button("Scarica originale", () => { void run(async () => { await fresh(); const original = session.draft?.originals.find(o => o.documentId === doc.id); if (original) bridge.download(original.blob, `${doc.title}.${doc.kind === "pdf" ? "pdf" : "txt"}`); }, false); }), button("Elimina fonte", () => {
        if (!confirm("Eliminare questa fonte salvata e l’intera cronologia? Le fonti alternative, le sintesi e le note correnti restano. I file già esportati non vengono cancellati.")) return;
        void run(async () => { const draft = session.draft!; await save({ archive: removeSource(draft.archive, doc.id), originals: draft.originals.filter(o => o.documentId !== doc.id) }, true); bridge.clear(); $("viewer").hidden = true; $("page").textContent = ""; $("viewer-title").textContent = ""; $("reference").textContent = ""; });
      })); $("sources").append(li);
    }
    if (!archive.documents.length) $("sources").textContent = "Nessuna fonte salvata nella mappa.";
    $("edges").replaceChildren();
    const names: Record<string, string> = { hierarchy: "contiene", related: "collegato a", prerequisite: "prerequisito di", contrast: "in contrasto con" };
    for (const edge of graph.edges) {
      const li = document.createElement("li"); li.append(`${graph.nodes.find(n => n.id === edge.from)!.title} → ${names[edge.type]} → ${graph.nodes.find(n => n.id === edge.to)!.title} `, button("Rimuovi relazione", () => { void mutate("Rimozione relazione", g => { g.edges = g.edges.filter(e => e.id !== edge.id); }); })); $("edges").append(li);
    }
    $("evidence").replaceChildren();
    for (const ref of graph.nodes.find(n => n.id === selected)?.evidence ?? []) {
      const li = document.createElement("li"); li.append(button(`${archive.documents.find(d => d.id === ref.documentId)!.title} · p. ${ref.page}`, () => showEvidence(ref)), button("Scollega", () => { void mutate("Rimozione collegamento fonte", g => { const node = g.nodes.find(n => n.id === selected)!; node.evidence = node.evidence.filter(e => e.chunkId !== ref.chunkId); }); })); $("evidence").append(li);
    }
    $("history").replaceChildren(...archive.history.map(v => { const li = document.createElement("li"); li.textContent = `${v.label} · ${new Date(v.at).toLocaleString("it-CH")} · ${v.graph.nodes.length} concetti prima della modifica`; return li; }));
    lock();
  }
  function showEvidence(ref: Evidence) {
    const documents = session.draft!.archive.documents, doc = documents.find(d => d.id === ref.documentId)!, chunk = doc.chunks.find(c => c.id === ref.chunkId)!;
    const page = resolveChunk(documents, chunk), mark = document.createElement("mark"); mark.textContent = chunk.text;
    $("viewer").hidden = false; $("viewer-title").textContent = doc.title; $("reference").textContent = `Pagina ${ref.page} · UTF-16 [${ref.start}, ${ref.end}) · SHA-256 ${doc.hash}`;
    $("page").replaceChildren(document.createTextNode(page.slice(0, ref.start)), mark, document.createTextNode(page.slice(ref.end))); $("viewer-title").focus();
  }
  async function fresh(allowConflict = false) {
    try { await session.checkFreshness(); }
    catch (error) {
      bridge.contextChanged();
      if (error instanceof LabError && error.code === "STUDY_PURGED") { clearEditor(); clearExport(); input("subject").value = ""; input("restore-title").value = "Materia ripristinata"; input("paste-backup").value = ""; input("backup").value = ""; bridge.clear(); }
      if (allowConflict && session.draft && error instanceof LabError && (error.code === "STUDY_CONFLICT" || (error.code === "STUDY_STORAGE" && !session.record))) return;
      throw error;
    }
  }
  async function run(task: () => Promise<void>, success = true) {
    if (busy) return; busy = true; const ticket = epoch; lock();
    try { await task(); if (ticket === epoch && success) status(session.dirty ? "Bozza in memoria: salvataggio da completare." : "Operazione completata. Archivio salvato in questo browser."); }
    catch (error) { if (ticket === epoch) {
      if (error instanceof LabError && error.code === "STUDY_PURGED") { clearEditor(); clearExport(); input("subject").value = ""; input("restore-title").value = "Materia ripristinata"; input("paste-backup").value = ""; input("backup").value = ""; bridge.clear(); }
      status(error instanceof LabError ? error.message : "Operazione non riuscita. Conserva la bozza o riprova.");
    } }
    finally { if (ticket === epoch) { busy = false; render(); if (refreshPending) { refreshPending = false; void changed(); } } }
  }
  async function save(snapshot: Snapshot, purge = false) {
    bridge.contextChanged(); clearExport(); await session.save(snapshot, purge); channel?.postMessage({ accountId: session.accountId });
  }
  async function mutate(label: string, recipe: (graph: Graph) => void) {
    await run(async () => { await fresh(); const draft = session.draft!; await save({ ...draft, archive: changeGraph(draft.archive, label, recipe) }); });
  }
  function close() { bridge.contextChanged(); const hadAccount = !!session.accountId; epoch++; session.close(); if (hadAccount) bridge.clear(); spaceDirty = false; clearEditor(); clearExport(); input("restore-title").value = "Materia ripristinata"; input("subject").value = ""; input("backup").value = ""; input("paste-backup").value = ""; busy = false; render(); status("Archivio chiuso. Le copie salvate restano nel browser per questo profilo."); }
  $("close").onclick = () => { if ((session.dirty || formDirty || spaceDirty) && !confirm("La bozza o il modulo contengono modifiche non salvate. Uscire e scartarle?")) return; close(); };
  $("open").onclick = () => {
    if ((session.dirty || formDirty || spaceDirty) && !confirm("Scartare le modifiche non salvate e aprire l’archivio scelto?")) return;
    const account = select("profile").value; close();
    void run(async () => { await session.open(account); input("subject").value = session.draft!.archive.space.title; select("language").value = session.draft!.archive.space.language; status("Profilo aperto. Le modifiche si salvano con i rispettivi comandi."); }, false);
  };
  $("save").onclick = () => { void run(async () => { await save(session.draft!); }); };
  $("space-form").onsubmit = event => { event.preventDefault(); void run(async () => { const draft = structuredClone(session.draft!); draft.archive.space.title = input("subject").value; draft.archive.space.language = select("language").value as Archive["space"]["language"]; await save(draft); spaceDirty = false; }); };
  $("new").onclick = () => edit();
  $("node-form").oninput = () => { formDirty = true; };
  $("space-form").oninput = () => { spaceDirty = true; };
  $("node-form").onsubmit = event => {
    event.preventDefault(); const id = selected ?? newId(), title = input("node-title").value, summary = input("summary").value, note = input("note").value, state = select("state").value as Personal["state"];
    void run(async () => {
      const draft = session.draft!, archive = changeGraph(draft.archive, selected ? "Modifica concetto" : "Nuovo concetto", g => {
        const old = g.nodes.find(n => n.id === id); if (old) { old.title = title; old.summary = summary; delete old.reviewReason; } else g.nodes.push({ id, title, summary, origin: "manual", evidence: [] });
        g.personal = g.personal.filter(p => p.nodeId !== id); g.personal.push({ nodeId: id, note, state });
      });
      selected = id; await save({ ...draft, archive }); formDirty = false; $("editor-heading").textContent = "Modifica concetto";
    });
  };
  $("delete-node").onclick = () => {
    if (!selected || !confirm("Eliminare il concetto, le sue relazioni e la nota personale? Puoi annullare dalla cronologia.")) return;
    const id = selected; void run(async () => { const draft = session.draft!; await save({ ...draft, archive: changeGraph(draft.archive, "Eliminazione concetto", g => { g.nodes = g.nodes.filter(n => n.id !== id); g.edges = g.edges.filter(e => e.from !== id && e.to !== id); g.personal = g.personal.filter(p => p.nodeId !== id); }) }); clearEditor(); });
  };
  $("evidence-form").onsubmit = event => {
    event.preventDefault(); if (!selected) { status("Salva o seleziona un concetto prima di collegare una fonte."); return; }
    const chunk = session.draft!.archive.documents.flatMap(d => d.chunks).find(c => c.id === select("chunk").value); if (!chunk) { status("Copia prima una fonte nella mappa."); return; }
    void mutate("Collegamento fonte", g => { g.nodes.find(n => n.id === selected)!.evidence.push({ documentId: chunk.documentId, chunkId: chunk.id, page: chunk.page, start: chunk.start, end: chunk.end, unit: "utf16" }); });
  };
  $("edge-form").onsubmit = event => { event.preventDefault(); const from = select("from").value, to = select("to").value, type = select("edge-type").value as Graph["edges"][number]["type"]; void mutate("Nuova relazione", g => { g.edges.push({ id: newId(), from, to, type, evidence: [] }); }); };
  $("undo").onclick = () => { if (formDirty && !confirm("Scartare il modulo non salvato e annullare l’ultima modifica della mappa?")) return; void run(async () => { const draft = session.draft!; await save({ ...draft, archive: undoGraph(draft.archive) }); clearEditor(); }); };
  $("copy").onclick = () => { void run(async () => {
    const staged = bridge.sources(), draft = structuredClone(session.draft!);
    if (!staged.documents.length) throw new LabError("NO_SOURCE", "Importa prima una fonte nella sezione qui sotto.");
    for (const doc of staged.documents) if (!draft.archive.documents.some(d => d.id === doc.id)) { const blob = staged.originals.get(doc.id); if (!blob) throw new LabError("NO_SOURCE", "Originale non disponibile."); draft.archive.documents.push(structuredClone(doc)); draft.originals.push({ documentId: doc.id, blob }); }
    await save(draft);
  }); };
  $("export").onclick = () => { void run(async () => {
    await fresh(true); const draft = structuredClone(session.draft!); const signal = session.signal;
    const text = await exportArchive(draft.archive, draft.originals); signal.throwIfAborted(); await fresh(true);
    clearExport(); exportUrl = URL.createObjectURL(new Blob([text], { type: "application/json" })); $<HTMLAnchorElement>("download").href = exportUrl; input("export-json").value = text; $("export-ready").hidden = false; status(`Backup pronto da scaricare: ${draft.archive.graph.nodes.length} concetti, ${draft.archive.documents.length} fonti e cronologia.${formDirty || spaceDirty ? " Il modulo non salvato è escluso: salva prima il concetto per includerlo." : ""}`);
  }, false); };
  $("restore").onclick = () => { void run(async () => {
    const file = input("backup").files?.[0], pasted = input("paste-backup").value; if ((!file && !pasted) || (file && pasted) || (file && file.size > GRAPH_LIMITS.backupBytes)) throw new LabError("BACKUP_INVALID", "Scegli un file oppure incolla il backup, massimo 96 MiB. Usa una sola modalità.");
    const signal = session.signal, restored = await importArchive(file ? await file.text() : pasted); signal.throwIfAborted();
    const archive = remapArchive(restored.archive, input("restore-title").value); await fresh();
    if (!confirm(`Backup verificato: ${archive.graph.nodes.length} concetti, ${archive.documents.length} fonti. Sostituire l’archivio di questo profilo con «${archive.space.title}»? Esporta prima l’archivio corrente se vuoi conservarlo.`)) { status("Ripristino annullato. Archivio invariato."); return; }
    // Replacing a workspace retains only the imported history. Source removal requires
    // a clean privacy boundary, so old history is never merged into the restored map.
    await save({ archive, originals: restored.originals }, true); bridge.clear(); clearEditor(); input("subject").value = archive.space.title; select("language").value = archive.space.language; input("backup").value = ""; input("paste-backup").value = ""; status("Ripristino completato e salvato. ID rimappati e cronologia ripristinata.");
  }, false); };
  $("erase").onclick = () => { if (!confirm("Eliminare mappa, originali, estratti e cronologia di questo profilo dal browser? I backup già scaricati restano. L’operazione non è annullabile.")) return; void run(async () => { await session.erase(); clearExport(); input("backup").value = ""; input("paste-backup").value = ""; channel?.postMessage({ accountId: session.accountId }); bridge.clear(); clearEditor(); input("subject").value = session.draft!.archive.space.title; status("Archivio locale eliminato. Il profilo è vuoto."); }, false); };
  async function changed() { if (!session.accountId) return; if (busy) { refreshPending = true; return; } await run(async () => { await fresh(); }, false); }
  if (channel) channel.onmessage = event => { if (event.data?.accountId === session.accountId) { bridge.contextChanged(); clearExport(); void changed(); } };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void changed(); });
  window.addEventListener("focus", () => { void changed(); });
  window.addEventListener("beforeunload", event => { if (session.dirty || formDirty || spaceDirty) { event.preventDefault(); event.returnValue = ""; } });
  window.addEventListener("pagehide", close);
  render();
  return { current: () => session.draft && !session.conflict ? structuredClone(session.draft.archive) : undefined };
}
