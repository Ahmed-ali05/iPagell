import { corpus, fixtureName } from "./corpus";
import { generatorFile, GENERATOR } from "./generator-model";
import { modelCache, verifiedStream, MODEL } from "./model";
import { sectionsOf, sourceRef, GENERATION_PROMPT_VERSION, GENERATION_LIMITS, type Candidate } from "./proposals";
import { generationAnnotations, generationReviewRows, generationSummary } from "./generation-eval";
import { Jobs } from "./jobs";
import { LabError, type SourceDocument } from "./source";
import type { CorpusSources } from "./evaluate";
import type { GenerationResult, SectionResult } from "./generation.worker";
const urls=import.meta.glob<string>("../fixtures/*.{txt,pdf}",{query:"?url",import:"default",eager:true});
const jobs=new Jobs(), status=document.querySelector("#status")!;
let abort:AbortController|undefined, saveQueue=Promise.resolve();
document.querySelector<HTMLButtonElement>("#cancel")!.onclick=()=>{abort?.abort();jobs.cancel();};
function save(report:unknown) {
  if(report && typeof report==="object")Object.assign(report,{updatedAt:new Date().toISOString()});
  const body=JSON.stringify({synthetic:true,kind:"corpus",report});
  saveQueue=saveQueue.then(async()=>{const response=await fetch("/__synthetic_report",{method:"POST",headers:{"Content-Type":"application/json"},body});if(!response.ok)throw Error("LOCAL_SAVE");});return saveQueue;
}
async function evaluate(resume=false){
  if(abort)return;abort=new AbortController();
  let report:Record<string,unknown>={protocol:"study-generative-comparison-v2",synthetic:true,promptVersion:GENERATION_PROMPT_VERSION,model:GENERATOR,embeddingModel:MODEL,limits:GENERATION_LIMITS,environment:{userAgent:navigator.userAgent,threads:navigator.hardwareConcurrency},startedAt:new Date().toISOString(),applied:false,humanReview:"pending",peakMemory:"unknown",runs:[]};
  const sources:CorpusSources=[],excluded:unknown[]=[],runs:GenerationResult[]=[];
  try {
    for(const fixture of corpus){
      const response=await fetch(urls[`../fixtures/${fixtureName(fixture)}`],{signal:abort.signal,credentials:"omit"});if(!response.ok)throw Error("FIXTURE");
      const bytes=new Uint8Array(await response.arrayBuffer());
      try{ const source=await jobs.run<SourceDocument>(()=>new Worker(new URL("./source.worker.ts",import.meta.url),{type:"module"}),{bytes,title:fixture.title,filename:fixtureName(fixture)},()=>{},30_000);sources.push({fixtureId:fixture.id,source}); }
      catch(e){if(fixture.id!=="D15" || !(e instanceof LabError) || e.code!=="NO_TEXT")throw e;excluded.push({fixture:fixture.id,code:e.code});}
    }
    const documents=sources.map(s=>s.source),sections=sectionsOf(documents),chunks=documents.flatMap(d=>d.chunks);
    for(const section of sections)section.language=corpus.find(f=>f.id===sources.find(s=>s.source.id===section.chunk.documentId)!.fixtureId)!.language;
    report.sourceScope={readableDocuments:documents.length,readableSections:sections.length,excluded,excludedPages:documents.flatMap(d=>d.excludedPages.map(page=>({documentId:d.id,page})))};
    report.annotations=generationAnnotations(sources);report.sources=documents;
    if(resume){
      const previous=await (await fetch("/reports/l3-corpus-v2.json",{signal:abort.signal})).json();
      if((previous.error!=="TIMEOUT" && previous.status!=="running") || previous.synthetic!==true || previous.promptVersion!==GENERATION_PROMPT_VERSION || previous.model.sha256!==GENERATOR.sha256 || JSON.stringify(previous.sources)!==JSON.stringify(documents))throw Error("RESUME_MISMATCH");
      report={...previous,resumedAt:new Date().toISOString(),status:"running"};delete report.error;delete report.finishedAt;
      if(previous.status==="running" && previous.partial){
        const seen=new Set([...previous.partial.results.map((r:SectionResult)=>r.sectionId),...(previous.failures??[]).filter((f:{mode:string})=>f.mode===previous.partial.mode).map((f:{sectionId:string})=>f.sectionId)]);
        const interrupted=sections.find(s=>!seen.has(s.id));
        if(interrupted){report.failures=[...(previous.failures??[]),{mode:previous.partial.mode,sectionId:interrupted.id,code:"BROWSER_INTERRUPTION",budgetMs:30_000,metadata:"Page reloaded with no active job; final response and counters unavailable. Environment interruption, not a model verdict."}];}
      }
      runs.push(...previous.runs);
    }
    const failures=(report.failures??[]) as {mode:string;sectionId:string;code:string;budgetMs:number;metadata:string}[];
    report.failures=failures;report.loadAccounting="Completed worker loadMs only; aborted workers and previous interrupted startup unavailable";
    const verifyStart=performance.now(), file=await generatorFile(abort.signal,n=>{status.textContent=`Verifica pesi ${n}/${GENERATOR.bytes}`;});report.weightsVerificationMs=performance.now()-verifyStart;
    async function generate(mode:"none"|"embedding",candidates:Candidate[][]){
      if(runs.some(r=>r.mode===mode))return;
      const prior=report.partial as {mode:string;results:SectionResult[]}|undefined;
      const partial:SectionResult[]=prior?.mode===mode?[...prior.results]:[];
      // A persisted timeout consumed its section budget. Skip it, never retry it.
      if(resume && prior?.mode===mode && report.status==="running" && !failures.some(f=>f.mode===mode) && partial.length<sections.length){
        failures.push({mode,sectionId:sections[partial.length].id,code:"TIMEOUT",budgetMs:30_000,metadata:"Worker terminated; attempt/token counters unavailable"});
      }
      let loadMs=0;const requests:{method:string;url:string}[]=[];
      for(;;){
        const seen=new Set([...partial.map(r=>r.sectionId),...failures.filter(f=>f.mode===mode).map(f=>f.sectionId)]);
        const pending=sections.filter(s=>!seen.has(s.id));if(!pending.length)break;
        report.partial={mode,results:partial};await save(report);
        let activeSection:string|undefined;
        try{
          const run=await jobs.run<GenerationResult>(()=>new Worker("/runtime/generation-worker.js"),{file,sections:pending,candidates:pending.map(s=>candidates[sections.findIndex(all=>all.id===s.id)]),chunks,mode},p=>{
            status.textContent=`${mode}: ${String(p.stage)} ${partial.length}/${sections.length}`;
            if(p.stage==="section-start")activeSection=String(p.sectionId);
            if(p.stage==="section-complete"){partial.push(p.result as SectionResult);document.querySelector("#report")!.textContent=JSON.stringify({completed:partial.length,valid:partial.filter(r=>r.proposal).length,failures,last:partial.at(-1)},null,2);void save(report);}
          },120_000,p=>p.stage==="section-start"?30_000:undefined);
          loadMs+=run.loadMs;requests.push(...run.requests);
        }catch(e){
          if(!(e instanceof LabError) || e.code!=="TIMEOUT" || !activeSection)throw e;
          failures.push({mode,sectionId:activeSection,code:"TIMEOUT",budgetMs:30_000,metadata:"Worker terminated; attempt/token counters unavailable"});
          report.partial={mode,results:partial};await save(report);
          if(abort!.signal.aborted)throw new LabError("CANCELLED","Annullato");
        }
      }
      // Results contain observed complete sections only. Failed sections are explicit
      // above and remain in plannedSections/coverage denominators, with no fake counters.
      runs.push({mode,loadMs,results:partial,requests,promptVersion:GENERATION_PROMPT_VERSION});report.runs=runs;delete report.partial;await save(report);
    }
    await generate("none",sections.map(()=>[]));
    const cached=await modelCache("read",undefined,abort.signal);if(!cached)throw new LabError("EMBEDDING_REQUIRED","Pesi embedding non presenti.");
    const weights=await verifiedStream(cached.stream(),abort.signal,()=>{});
    const retrieval=await jobs.run<{rankings:string[][]}>(()=>new Worker("/runtime/embedding-worker.js"),{blob:weights,profile:"model-card",chunks,titles:Object.fromEntries(documents.map(d=>[d.id,d.title])),queries:sections.map(s=>s.chunk.text),eligibleDocumentIds:sections.map(s=>documents.slice(0,documents.findIndex(d=>d.id===s.chunk.documentId)).map(d=>d.id))},p=>{status.textContent=`Recupero 270M ${p.done??""}/${p.total??""}`;},300_000);
    report.retrieval=retrieval;
    const candidates=sections.map((_,i)=>retrieval.rankings[i].slice(0,2).map(id=>{const c=chunks.find(c=>c.id===id)!;return {id,title:documents.find(d=>d.id===c.documentId)!.title,summary:c.text,evidence:[sourceRef(c)]};}));
    report.candidates=candidates;await generate("embedding",candidates);
    report.summary=generationSummary(runs,generationAnnotations(sources).length);report.reviewRows=generationReviewRows(runs,documents);report.plannedSectionsPerMode=sections.length;report.accountedSectionsPerMode=Object.fromEntries(["none","embedding"].map(mode=>[mode,(runs.find(r=>r.mode===mode)?.results.length??0)+failures.filter(f=>f.mode===mode).length]));report.status=failures.length?"complete-with-timeouts-human-review-pending":"complete-format-only-human-review-pending";
    status.textContent="Tutti gli esiti disponibili; timeout e interruzioni separati. Revisione umana da eseguire.";
  }catch(e){report.status="incomplete";report.error=e instanceof LabError?e.code:"EVALUATION_ENVIRONMENT";status.textContent=`Prova incompleta: ${report.error}`;}
  finally{report.finishedAt=new Date().toISOString();await save(report);document.querySelector("#report")!.textContent=JSON.stringify(report,null,2);abort=undefined;}
}
document.querySelector<HTMLButtonElement>("#run")!.onclick=()=>void evaluate();
document.querySelector<HTMLButtonElement>("#resume")!.onclick=()=>void evaluate(true);
