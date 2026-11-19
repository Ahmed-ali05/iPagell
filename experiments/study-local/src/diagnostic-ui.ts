import { generatorFile, GENERATOR } from "./generator-model";
import { Jobs } from "./jobs";
import { LabError } from "./source";
const jobs = new Jobs(), reports: unknown[] = JSON.parse(sessionStorage.getItem("synthetic-l3-diagnostic") ?? "[]");
let verifiedFile: File | undefined;
function draw() { const text=JSON.stringify(reports,null,2); document.querySelector("#report")!.textContent=text; const a=document.querySelector<HTMLAnchorElement>("#download")!; a.href=URL.createObjectURL(new Blob([text],{type:"application/json"})); a.hidden=!reports.length; }
draw();
const status = document.querySelector<HTMLPreElement>("#status")!;
let abort: AbortController | undefined;
document.querySelector<HTMLButtonElement>("#cancel")!.onclick = () => { abort?.abort(); jobs.cancel(); };
document.querySelector<HTMLButtonElement>("#run")!.onclick = async () => {
  if (jobs.busy || abort) return;
  abort = new AbortController();
  try {
    const file = verifiedFile ??= await generatorFile(abort.signal, bytes => { status.textContent = `Verifica ${bytes}/${GENERATOR.bytes}`; });
    const variant = document.querySelector<HTMLSelectElement>("#variant")!.value;
    const result = await jobs.run(() => new Worker("/runtime/diagnostic-worker.js"), { file, variant }, p => { status.textContent = String(p.stage); }, 120_000, p => p.stage === "section-start" ? 30_000 : undefined);
    reports.push({ variant, model: GENERATOR, environment: navigator.userAgent, result });
    status.textContent = "Terminato. Revisione umana non eseguita.";
  } catch (e) { reports.push({ error: e instanceof LabError ? e.code : "DIAGNOSTIC_ENVIRONMENT" }); status.textContent = "Prova interrotta; vedere codice."; }
  finally { sessionStorage.setItem("synthetic-l3-diagnostic",JSON.stringify(reports)); abort = undefined; draw(); }
};

document.querySelector<HTMLButtonElement>("#save")!.onclick=async()=>{
  const response=await fetch("/__synthetic_report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({synthetic:true,kind:"diagnostic",report:reports})});
  status.textContent=response.ok?"Report sintetico salvato nella repository locale.":"Salvataggio locale non riuscito.";
};
