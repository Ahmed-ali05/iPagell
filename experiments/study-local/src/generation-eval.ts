import { LabError } from "./source";
import type { GenerationResult } from "./generation.worker";
import type { CorpusSources } from "./evaluate";
import { corpus } from "./corpus";

// Authored review checklist: no model grades its own semantic support. Each anchor
// is resolved on the real L1 extraction before the benchmark is admitted.
const essential: Record<string, string[]> = {
  D01: ["DNS e cache", "TCP ordinato e affidabile; UDP senza garanzie", "Indirizzi privati e NAT"],
  D02: ["TLS non certifica la verità", "Congestione e finestra TCP", "TTL della cache DNS"],
  D03: ["Membrana e scambi", "Nucleo cellulare distinto da atomico", "Mitocondri: ATP, non fotosintesi"],
  D04: ["Fotosintesi nei cloroplasti", "Glicolisi e prerequisito glucosio", "Correlazione non implica causa"],
  D05: ["Pendenza e intercetta", "Coppie della tabella", "Zero escluso da 1/x"],
  D06: ["Probabilità: estremi e intervallo", "Indipendenza diversa da incompatibilità", "Frequenza relativa 12/40"],
  D07: ["Spannung in Volt", "Ohmsches Gesetz"], D08: ["Sicherung: begrenzter Schutz", "Reihe und parallel"],
  D09: ["Vitesse moyenne", "Accélération; rectiligne non constant"], D10: ["Énergie cinétique et vitesse au carré", "Conservation et frottement"],
  D11: ["Atomicity", "Isolation and serializability"], D12: ["Index read/write tradeoff", "Foreign and primary keys"],
  D13: ["Campione longitudinale", "Mediana e valori estremi", "Intervallo di confidenza", "Confondente"],
  D14: ["Istruzioni ostili trattate come dati", "Markup ostile da mostrare come testo", "Verifica delle fonti"],
  D16: ["Evaporazione", "Condensazione", "Limite OCR"],
};
export function generationAnnotations(sources: CorpusSources) {
  return sources.flatMap(({ fixtureId, source }) => {
    const fixture = corpus.find(f => f.id === fixtureId)!;
    if (!fixture || essential[fixtureId]?.length !== fixture.passages.length) throw new LabError("ANNOTATION_INVALID", "Checklist generativa incompleta.");
    return fixture.passages.map(([text], i) => {
      const anchor = text.slice(0, 24), chunks = source.chunks.filter(c => c.text.includes(anchor));
      if (!chunks.length) throw new LabError("ANNOTATION_INVALID", "Un concetto annotato non è risolvibile sul testo estratto.");
      return { id: `${fixtureId}-C${i + 1}`, fixtureId, essential: essential[fixtureId][i], sourceChunkIds: chunks.map(c => c.id),
        reference: text, supportedRelations: "Only relations explicitly justified by reference; human review required", forbidden: /non |not |nicht |ne |pas /i.test(text) ? "Preserve negation; do not reverse into a confident positive claim" : "Do not invent causal, hierarchical or prerequisite relations" };
    });
  });
}
// Numeric quality results require a complete human review of ALL outputs. Empty
// sections remain in the coverage denominator; invalid answers are counted apart.
export function generationSummary(runs: GenerationResult[], essentialCount: number) {
  return runs.map(run => ({ mode: run.mode, sections: run.results.length, validSections: run.results.filter(r => r.proposal).length,
    emptySections: run.results.filter(r => !r.proposal?.nodes.length).length,
    invalidOutputs: run.results.reduce((n, r) => n + r.invalidOutputs, 0),
    proposedConcepts: run.results.reduce((n, r) => n + (r.proposal?.nodes.length ?? 0), 0),
    proposedRelations: run.results.reduce((n, r) => n + (r.proposal?.edges.length ?? 0), 0), essentialCount,
    quality: { coverage: null, supportedStatements: null, supportedRelations: null, duplicates: null, stableConcepts: null, seriousContradictions: null, status: "human-review-required" },
    maxSectionMs: run.results.length ? Math.max(...run.results.map(r => r.ms)) : null, loadMs: run.loadMs,
    passed: false }));
}

// Review packets include every section, not a selection of successful examples.
// Only the explicit local report exports this text; it is never sent to a service.
export function generationReviewRows(runs: GenerationResult[], documents: import("./source").SourceDocument[]) {
  const chunks=new Map(documents.flatMap(d=>d.chunks.map(c=>[c.id,{...c,title:d.title}] as const)));
  function sources(ids:string[]) { return ids.map(id=>{const chunk=chunks.get(id);if(!chunk)throw new LabError("SOURCE_REFERENCE","Fonte della revisione non disponibile.");return {chunkId:id,document:chunk.title,page:chunk.page,start:chunk.start,end:chunk.end,text:chunk.text};}); }
  return runs.flatMap(run=>run.results.map(result=>({mode:run.mode,sectionId:result.sectionId,code:result.code??null,
    concepts:result.proposal?.nodes.map(n=>({...n,evidence:sources(n.sources)}))??[],
    relations:result.proposal?.edges.map(e=>({...e,evidence:sources(e.sources)}))??[],
    review:{coverage:null,supportedStatements:null,supportedRelations:null,negations:null,hostileInstructions:null,duplicates:null,stabilityAcrossLessons:null,status:"pending-human"}})));
}
