import { hardSources, hardQueries, HARD_PROTOCOL } from "./hard-corpus";
import { modelCache, verifiedStream, MODEL } from "./model";
import { lexicalSearch, retrievalMetrics } from "./search";
import { percentile } from "./evaluate";
import { Jobs } from "./jobs";
import { sha256, LabError } from "./source";
const jobs = new Jobs(); let abort: AbortController | undefined, reportUrl: string | undefined;
const status = document.querySelector("#status")!;
document.querySelector<HTMLButtonElement>("#cancel")!.onclick = () => { abort?.abort(); jobs.cancel(); };
document.querySelector<HTMLButtonElement>("#run")!.onclick = async () => {
  if (abort) return; abort = new AbortController();
  try {
    const sources = await hardSources(), chunks = sources.flatMap(s => s.source.chunks);
    const blob = await modelCache("read",undefined,abort.signal);
    if (!blob) throw new LabError("MODEL_REQUIRED", "Ottieni prima il 270M nel laboratorio L1.");
    const weights = await verifiedStream(blob.stream(),abort.signal,()=>{}), times: number[] = [];
    let baseline: string[][] = [];
    for (let repeat=0;repeat<5;repeat++) baseline = hardQueries.map(q => { const start=performance.now(), found=lexicalSearch(chunks,q.text).map(h=>h.chunk.id); times.push(performance.now()-start); return found; });
    const queries = Array.from({length:6},()=>hardQueries.map(q=>q.text)).flat();
    const embedding = await jobs.run<{rankings:string[][];queryMs:number[];loadMs:number;indexMs:number}>(()=>new Worker("/runtime/embedding-worker.js"),{blob:weights,chunks,titles:Object.fromEntries(sources.map(s=>[s.source.id,s.source.title])),profile:"model-card",queries},p=>{status.textContent=JSON.stringify(p);},300_000);
    const rows=hardQueries.map((q,i)=>{
      const gold=sources.find(s=>s.fixtureId===q.gold)?.source.chunks.map(c=>c.id)??[];
      function metrics(found:string[]) { return gold.length?{...retrievalMetrics(found.map(id=>({chunk:chunks.find(c=>c.id===id)!,score:0})),new Set(gold)),hitAt1:gold.includes(found[0])?1:0}:null; }
      return {...q,gold,baseline:baseline[i],embedding:embedding.rankings[i],baselineMetrics:metrics(baseline[i]),embeddingMetrics:metrics(embedding.rankings[i]),stableAcrossRepeats:Array.from({length:5},(_,j)=>JSON.stringify(embedding.rankings[(j+1)*20+i])===JSON.stringify(embedding.rankings[i])).every(Boolean)};
    });
    const summary=["baselineMetrics","embeddingMetrics"].map(method=>({method,...Object.fromEntries(["recall","reciprocalRank","hitAt1"].map(key=>[key,rows.filter(r=>r.gold.length).reduce((n,r)=>n+(r[method as "baselineMetrics"] as unknown as Record<string,number>)[key],0)/16]))}));
    const report={protocol:HARD_PROTOCOL,model:MODEL,environment:navigator.userAgent,corpusHash:await sha256(new TextEncoder().encode(JSON.stringify({sources,hardQueries}))),rows,summary,baseline:{querySamples:100,medianMs:percentile(times,.5),p95Ms:percentile(times,.95)},embedding:{...embedding,rankings:undefined,querySamples:100,medianMs:percentile(embedding.queryMs.slice(20),.5),p95Ms:percentile(embedding.queryMs.slice(20),.95)},humanReview:"pending",peakMemory:"unknown"};
    const json=JSON.stringify(report,null,2); document.querySelector("#report")!.textContent=json;
    if(reportUrl)URL.revokeObjectURL(reportUrl);reportUrl=URL.createObjectURL(new Blob([json],{type:"application/json"}));const link=document.querySelector<HTMLAnchorElement>("#download")!;link.href=reportUrl;link.hidden=false;
    await fetch("/__synthetic_report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({synthetic:true,kind:"challenge",report})});
    status.textContent="Confronto completato; annotazioni umane da verificare.";
  } catch(e) { status.textContent=e instanceof LabError?e.code:"CHALLENGE_ENVIRONMENT"; }
  finally{abort=undefined;}
};
