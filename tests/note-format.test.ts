import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument } from "pdf-lib";
import { escapePlain, noteVisibleText, parseNote, serializeNote, visibleText } from "../lib/notes/format";
import { NoteContent } from "../components/note-content";
import { generateNotePdf } from "../lib/notes/pdf";
import { formattedContent } from "../lib/notes/validation";

const samples=["","\n","Fine\n","A\n\nB","## intestazione\n- punto\n1. numero","**testo**", "\\\n", "  spazi finali  \n", "<script>alert(1)</script>", "[link](javascript:alert(1))", "🧪 é العربية", "\\\\\\\nsegue"];
test("plain notes preserve exact visible code points until formatting is requested",()=>{
  for(const plain of samples){
    const converted=escapePlain(plain);
    assert.notEqual(converted,null,JSON.stringify(plain));
    assert.equal(visibleText(parseNote("md-lite-v1",converted!)),plain);
    assert.equal(serializeNote(parseNote("md-lite-v1",converted!)),converted);
  }
  assert.equal(escapePlain("CRLF\r\nlegacy"),null);
  assert.equal(noteVisibleText("unknown-future-format","## raw"),"## raw");
  const alphabet=["a","*","#","-","1",".","\\","\n"," ","é","🧪","ع"];
  let seed=0x12345;
  for(let sample=0;sample<500;sample++){
    let plain="";
    for(let index=0;index<75;index++){seed=(seed*1664525+1013904223)>>>0;plain+=alphabet[seed%alphabet.length];}
    const source=escapePlain(plain);
    assert.notEqual(source,null);
    assert.equal(visibleText(parseNote("md-lite-v1",source!)),plain);
    assert.equal(serializeNote(parseNote("md-lite-v1",source!)),source);
  }
});
test("canonical limited Markdown round trips and malformed syntax stays visible",()=>{
  const canonical=["Il Sole è una **stella**","## Sezione\nUn paragrafo","- Mercurio\n- Venere","1. primo\n2. secondo","a\\\nb","**a\\*b**","\\## letterale\n\\- letterale","<script>\njavascript:alert(1)"];
  for(const source of canonical){assert.equal(serializeNote(parseNote("md-lite-v1",source)),source);assert.equal(formattedContent.safeParse({contentFormat:"md-lite-v1",content:source}).success,true);}
  assert.equal(formattedContent.safeParse({contentFormat:"md-lite-v1",content:"3. skipped"}).success,false);
  assert.equal(formattedContent.safeParse({contentFormat:"md-lite-v1",content:"x".repeat(20_001)}).success,false);
  assert.equal(noteVisibleText("md-lite-v1","## Sezione\nIl **Sole**"),"Sezione\nIl Sole");
});
test("reader escapes hostile content and never creates links, images or scripts",()=>{
  for(const format of ["plain","md-lite-v1"]){
    const source=format==="plain"?"<script>x()</script>\n<img src=x onerror=x()>\n[site](javascript:x())":"## Titolo\n<script>x()</script>\n<img src=x onerror=x()>\n[site](javascript:x())";
    const html=renderToStaticMarkup(React.createElement(NoteContent,{contentFormat:format,content:source}));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!/<script|<img|<a\s/iu.test(html));
  }
});
test("short and long PDF use the validated AST and preserve title metadata",async()=>{
  const load=async(path:string)=>new Uint8Array(await readFile(new URL(`../public/fonts/${path}`,import.meta.url)));
  const short=await generateNotePdf({title:"Pianeti é 🧪",subjectName:"Scienze",content:"## Il Sole\nÈ una **stella**.\n- Mercurio\n- Venere\n<script>\nالعربية",contentFormat:"md-lite-v1",updatedAt:Date.UTC(2026,8,30)},load);
  const one=await PDFDocument.load(short);assert.equal(one.getPageCount(),1);assert.equal(one.getTitle(),"Pianeti é 🧪");assert.equal(one.getSubject(),"Scienze");
  const content=`## Sezione\n${"Lunga nota con accenti é, sicurezza <img>, e ultime parole. ".repeat(160)}\nULTIMO ARGOMENTO`;
  const long=await generateNotePdf({title:"Testo lungo",subjectName:"Storia",content,contentFormat:"md-lite-v1",updatedAt:Date.UTC(2026,8,30)},load);
  const many=await PDFDocument.load(long);assert.ok(many.getPageCount()>1);
  assert.ok(long.byteLength>short.byteLength);
});
