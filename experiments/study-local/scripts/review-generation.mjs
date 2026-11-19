import {readFileSync,writeFileSync} from 'node:fs';
const base=process.cwd()+'/experiments/study-local/reports/';
const r=JSON.parse(readFileSync(base+'l3-corpus-v2.json','utf8'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chunks=r.sources.flatMap(d=>d.chunks.map(c=>({...c,title:d.title}))), byId=new Map(chunks.map(c=>[c.id,c]));
const source=id=>{const c=byId.get(id);if(!c)throw Error('Unresolved source');return `<blockquote>${esc(c.text)}<footer>${esc(c.title)} · pagina ${c.page} · UTF-16 [${c.start},${c.end})<br><small>${esc(id)}</small></footer></blockquote>`};
const criteria=['Copertura dei concetti essenziali','Supporto di ogni sintesi','Supporto e direzione delle relazioni','Negazioni e incertezza','Resistenza a istruzioni ostili','Duplicati','Stabilità fra lezioni / correttezza del target'];
let html=`<!doctype html><html lang="it"><meta charset="utf-8"><title>Revisione umana L3 — da eseguire</title><style>body{font:16px/1.5 system-ui;margin:2rem auto;max-width:1200px;padding:1rem;color:#172435}article{border-top:2px solid #536577;margin-top:3rem}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #ccd4dc;padding:1rem;vertical-align:top;overflow-wrap:anywhere;text-align:left}blockquote{margin:0 0 1rem;padding:.7rem;background:#f1f5f8}footer,small{font-size:12px}textarea{width:95%;min-height:5rem}h1{line-height:1.1}@media print{article{break-before:page}textarea{border:1px solid #888}}</style><h1>Revisione umana L3: da eseguire</h1><p>Materiale sintetico. Nessuna proposta applicata alla mappa. Questa scheda affianca le risposte realmente validate alle citazioni canoniche. I controlli automatici attestano formato e riferimenti, non verità, copertura o qualità. Non contiene giudizi umani già compilati. I campi note non si salvano automaticamente: stampare la scheda compilata o conservare le annotazioni separatamente.</p><p>Prompt: ${esc(r.promptVersion)}. Stato inferenza: ${esc(r.status)}. Sezioni leggibili previste per modalità: ${chunks.length}. Le sezioni senza proposta restano nel denominatore della copertura. Fonte originale sempre disponibile anche quando il modello fallisce.</p><p>Per ogni riga segnare supportata / parziale / non supportata e motivare usando soltanto le fonti. Confrontare le due modalità, poi i concetti ripetuti fra lezioni: similarità non autorizza merge, causa o contraddizione. Gli input PDF sono gli estratti, da confrontare separatamente con le pagine originali se necessario.</p>`;
for(const mode of ['none','embedding']){
 const results=(r.runs??[]).filter(run=>run.mode===mode).flatMap(run=>run.results);
 if(r.partial?.mode===mode)results.push(...r.partial.results);
 const resultById=new Map(results.map(x=>[x.sectionId,x]));
 html+=`<h2>Modalità ${esc(mode)}</h2>`;
 for(const c of chunks){
  const x=resultById.get(c.id);const failure=(r.failures??[]).find(f=>f.mode===mode&&f.sectionId===c.id);
  html+=`<article><h3>${esc(c.title)} · p.${c.page} [${c.start},${c.end})</h3><p>${x?.proposal?'Formato valido':esc(x?.code??failure?.code??'NON ESEGUITA')} · ${x?`${Math.round(x.ms)} ms, ${x.attempts} tentativi osservati`: 'Tempi/tentativi non disponibili'}</p>${source(c.id)}`;
  for(const n of x?.proposal?.nodes??[])html+=`<table><tr><th>Concetto proposto ${esc(n.id)}</th><th>Fonti esatte</th></tr><tr><td><strong>${esc(n.title)}</strong><p>${esc(n.summary)}</p><p>Azione: ${esc(n.action)} · target: ${esc(n.target)}</p><p>Giudizio umano: ☐ supportata ☐ parziale ☐ non supportata</p></td><td>${n.sources.map(source).join('')}</td></tr></table>`;
  for(const e of x?.proposal?.edges??[])html+=`<table><tr><th>Relazione proposta</th><th>Fonti esatte</th></tr><tr><td>${esc(e.from)} → ${esc(e.to)} · ${esc(e.type)}<p>Giudizio umano: ☐ supportata ☐ parziale ☐ non supportata</p></td><td>${e.sources.map(source).join('')}</td></tr></table>`;
  html+=`<p>${criteria.map(k=>`☐ ${esc(k)}`).join(' · ')}</p><p>Motivazione e concetti mancanti:</p><textarea aria-label="Note di revisione"></textarea></article>`;
 }
}
html+='</html>';
const style=html.match(/<style>([\s\S]*?)<\/style>/);if(!style)throw Error('Review CSS missing');
writeFileSync(base+'l3-review.css',style[1]);html=html.replace(style[0],'<link rel="stylesheet" href="l3-review.css">');
writeFileSync(base+'l3-human-review.html',html);console.log(`Review packet: ${chunks.length} sections × 2 modes, all judgments pending`);
