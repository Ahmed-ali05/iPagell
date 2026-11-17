import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseProposal,sectionsOf,type Candidate} from "../src/proposals";
import type {SourceDocument} from "../src/source";
import type {GenerationResult} from "../src/generation.worker";
const r=JSON.parse(await readFile(new URL("../reports/l3-corpus-v2.json",import.meta.url),"utf8"));
assert.equal(r.synthetic,true);assert.equal(r.applied,false);assert.equal(r.humanReview,"pending");
const documents=r.sources as SourceDocument[],sections=sectionsOf(documents),chunks=documents.flatMap(d=>d.chunks);
assert.equal(sections.length,43);assert.equal(r.runs.length,2);
for(let i=0;i<sections.length;i++){
  const current=documents.findIndex(d=>d.id===sections[i].chunk.documentId);
  for(const id of r.retrieval.rankings[i]){
    const source=chunks.find(c=>c.id===id);assert(source);
    assert(documents.findIndex(d=>d.id===source.documentId)<current);
  }
}
let validated=0;
for(const run of r.runs as GenerationResult[]){
  const failures=r.failures.filter((f:{mode:string})=>f.mode===run.mode);
  const ids=[...run.results.map(x=>x.sectionId),...failures.map((f:{sectionId:string})=>f.sectionId)];
  assert.equal(ids.length,43);assert.equal(new Set(ids).size,43);
  assert(ids.every(id=>sections.some(s=>s.id===id)));
  for(const result of run.results){
    if(!result.proposal)continue;
    const i=sections.findIndex(s=>s.id===result.sectionId),section=sections[i];
    const candidates:Candidate[]=run.mode==="none"?[]:r.candidates[i];
    for(const c of candidates)for(const evidence of c.evidence){
      assert(documents.findIndex(d=>d.id===evidence.documentId)<documents.findIndex(d=>d.id===section.chunk.documentId));
    }
    assert.deepEqual(parseProposal(JSON.stringify(result.proposal),section,candidates,chunks),result.proposal);validated++;
  }
}
assert.equal(validated,r.summary.reduce((n:number,s:{validSections:number})=>n+s.validSections,0));
assert(r.summary.every((s:{passed:boolean;quality:Record<string,unknown>})=>s.passed===false && s.quality.coverage===null && s.quality.supportedStatements===null));
assert(r.reviewRows.every((row:{review:{status:string}})=>row.review.status==="pending-human"));
console.log(`Verified ${validated} canonical proposals, 43 accounted sections per mode, prior-only candidates; semantic/human review pending.`);
