import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const require=createRequire(import.meta.url);
const braces=require("braces");
const projectRoot=fileURLToPath(new URL("../",import.meta.url));
const guarded=(action:()=>unknown)=>assert.throws(action,error=>error instanceof SyntaxError&&error.message.includes("maximum nesting depth"));

test("all consumers resolve the private, depth-bounded braces patch",()=>{
  const expected=realpathSync(fileURLToPath(new URL("../vendor/braces/index.js",import.meta.url)));
  assert.equal(realpathSync(require.resolve("braces")),expected);
  assert.equal(require("braces/package.json").name,"@ipagell/braces");
  for(const consumer of ["@next/eslint-plugin-next","vite-plugin-dynamic-import"]){
    const consumerRequire=createRequire(require.resolve(consumer));
    const globRequire=createRequire(consumerRequire.resolve("fast-glob"));
    const matcherRequire=createRequire(globRequire.resolve("micromatch"));
    assert.equal(realpathSync(matcherRequire.resolve("braces")),expected,consumer);
  }
});

test("deep brace, parentheses and unfinished patterns are rejected before stack exhaustion",()=>{
  for(const [open,close] of [["{","}"],["(",")"]]){
    for(const pattern of [open.repeat(4000)+"x"+close.repeat(4000),open.repeat(4000)+"x"]){
      for(const action of [braces,braces.parse,braces.compile,braces.expand,braces.stringify]){
        guarded(()=>action(pattern,{maxLength:Infinity,maxDepth:Infinity}));
      }
    }
  }
});

test("direct and cyclic AST input cannot bypass traversal bounds",()=>{
  const root={type:"root",nodes:[] as object[]};
  let parent=root;
  for(let i=0;i<1000;i++){
    const child={type:"paren",parent,nodes:[] as object[]};
    parent.nodes.push(child);parent=child;
  }
  parent.nodes.push({type:"text",value:"x"});
  for(const action of [braces.compile,braces.expand,braces.stringify])guarded(()=>action(root));
  const cycle={type:"root",nodes:[] as object[]};cycle.nodes.push(cycle);
  for(const action of [braces.compile,braces.expand,braces.stringify])guarded(()=>action(cycle));
});

test("ordinary expansion, escapes, quoted literals and flat input remain compatible",()=>{
  assert.deepEqual(braces.expand("src/{a,b}/{1..3}.tsx"),["src/a/1.tsx","src/a/2.tsx","src/a/3.tsx","src/b/1.tsx","src/b/2.tsx","src/b/3.tsx"]);
  assert.deepEqual(braces("src/{a,b}.tsx"),["src/(a|b).tsx"]);
  assert.deepEqual(braces.expand("{03..01}"),["03","02","01"]);
  assert.deepEqual(braces.expand("a\\{b,c\\}"),["a{b,c}"]);
  const quoted='"'+"{".repeat(4000)+'"';
  assert.equal(braces.compile(quoted),"{".repeat(4000));
  assert.equal(braces.compile("x".repeat(8000)),"x".repeat(8000));
  const bounded="{".repeat(126)+"x"+"}".repeat(126);
  assert.equal(braces.stringify(braces.parse(bounded)),bounded);
});

test("actual lint and dynamic-import glob consumers still find the reader files",async()=>{
  const expected=["components/class-notes-panel.tsx","components/notes-view.tsx","components/related-notes.tsx"];
  const pattern="components/{notes-view,class-notes-panel,related-notes}.tsx";
  for(const consumer of ["@next/eslint-plugin-next","vite-plugin-dynamic-import"]){
    const glob=createRequire(require.resolve(consumer))("fast-glob");
    assert.deepEqual(glob.sync(pattern,{cwd:projectRoot}).sort(),expected,consumer);
    assert.deepEqual((await glob(pattern,{cwd:projectRoot})).sort(),expected,consumer);
  }
});

test("source-map-js huge indexed offset completes within a process deadline",()=>{
  assert.equal(require("source-map-js/package.json").version,"1.2.2");
  const source=`const assert=require('node:assert/strict');
    const {SourceMapConsumer,SourceNode}=require('source-map-js');
    const section=line=>({version:3,sections:[{offset:{line,column:0},map:{version:3,sources:['a.js'],sourcesContent:['x'],names:[],mappings:'AAAA'}}]});
    assert.throws(()=>new SourceMapConsumer(section(1e12)),/Section offset line must not exceed/);
    const consumer=new SourceMapConsumer(section(1e6));
    assert.equal(SourceNode.fromStringWithSourceMap('x',consumer).toString(),'x');`;
  const child=spawnSync(process.execPath,["-e",source],{cwd:projectRoot,timeout:2000,encoding:"utf8"});
  assert.equal(child.error,undefined,child.error?.message);
  assert.equal(child.status,0,child.stderr);
});

test("every sharp copy uses the patched version and its native decoder loads",async()=>{
  for(const consumer of ["next","miniflare"]){
    const consumerRequire=createRequire(require.resolve(consumer));
    const sharp=consumerRequire("sharp");
    assert.equal(sharp.versions.sharp,"0.35.5",consumer);
    const png=await sharp({create:{width:2,height:2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
    const metadata=await sharp(png).metadata();assert.equal(metadata.width,2);assert.equal(metadata.height,2);
  }
});
