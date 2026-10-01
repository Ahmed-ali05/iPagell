import test from 'node:test';
import assert from 'node:assert/strict';
import { DraftAutosaver, persistAndNotify } from '../lib/notes/autosave';
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>{resolve=r;});return {promise,resolve};};

test('overlapping autosave, visibility and Done drain the latest edit once',async()=>{
  const gate=deferred(),started=deferred();let text='first';const stored:string[]=[];
  const saver=new DraftAutosaver(async()=>{const snapshot=text;started.resolve();await gate.promise;stored.push(snapshot);});
  saver.changed();const a=saver.flush();await started.promise;
  text='latest';saver.changed();const b=saver.flush(),c=saver.flush();
  assert.equal(a,b);assert.equal(b,c);assert.equal(saver.dirty,true);
  gate.resolve();await Promise.all([a,b,c]);
  assert.deepEqual(stored,['first','latest']);assert.equal(saver.dirty,false);
  await saver.flush();assert.equal(stored.length,2);
});

test('a rejected local write remains dirty and Retry does not poison subsequent saves',async()=>{
  let fail=true;let writes=0;const saver=new DraftAutosaver(async()=>{if(fail)throw new Error('quota');writes++;});
  saver.changed();await assert.rejects(saver.flush(),/quota/);assert.equal(saver.dirty,true);
  fail=false;await saver.flush();assert.equal(writes,1);assert.equal(saver.dirty,false);
  saver.changed();await saver.flush();assert.equal(writes,2);
});

test('opening and closing a blank editor does not save; forced preview saves only once',async()=>{
  let writes=0;const saver=new DraftAutosaver(async()=>{writes++;});
  await saver.flush();assert.equal(writes,0);
  await Promise.all([saver.flush(true),saver.flush(true)]);assert.equal(writes,1);
  await saver.flush(true);assert.equal(writes,1);
});

test('a committed draft survives a failed refresh; storage failure is still rejected',async()=>{
  const saved={mutationId:'committed'};const failures:unknown[]=[];
  assert.equal(await persistAndNotify(async()=>saved,async()=>{throw new Error('refresh');},error=>failures.push(error)),saved);
  assert.equal(failures.length,1);
  let notified=false;
  await assert.rejects(persistAndNotify(async()=>{throw new Error('quota');},async()=>{notified=true;},()=>{}),/quota/);
  assert.equal(notified,false);
});
