import test from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";

function statements(sql: string) {
  return sql.split("--> statement-breakpoint").map(s=>s.replace(/--[^\n]*/g,"").trim()).filter(Boolean);
}

test("0007 is schema-only: tables, indexes, triggers and one additive column",async()=>{
  const sql=await readFile(new URL("../drizzle/0007_auth_compatibility.sql",import.meta.url),"utf8");
  const list=statements(sql);
  assert.ok(list.length>0);
  for(const statement of list) assert.match(statement,/^(CREATE (?:TABLE|(?:UNIQUE )?INDEX|TRIGGER)|ALTER TABLE `accounts` ADD)\b/i);
  // Trigger bodies say BEFORE INSERT/UPDATE/DELETE; data writes and drops must not appear.
  assert.doesNotMatch(sql,/INSERT INTO|DROP (?:TABLE|INDEX|COLUMN)|DELETE FROM|UPDATE `?\w+`? SET/i);
});

test("0008 only initializes the auth state in legacy mode",async()=>{
  const sql=await readFile(new URL("../drizzle/0008_auth_bootstrap_legacy.sql",import.meta.url),"utf8");
  assert.deepEqual(statements(sql),["INSERT INTO auth_schema_state(id,schema_version,write_mode) VALUES(1,7,'legacy');"]);
});

test("migration files and journal match, with no contraction migration",async()=>{
  const files=(await readdir(new URL("../drizzle/",import.meta.url))).filter(n=>n.endsWith(".sql")).sort();
  const journal=JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json",import.meta.url),"utf8")) as {entries:{tag:string}[]};
  assert.deepEqual(files,journal.entries.map(e=>e.tag+".sql"));
  for(const file of files){
    const sql=await readFile(new URL("../drizzle/"+file,import.meta.url),"utf8");
    assert.doesNotMatch(sql,/DROP COLUMN/i,file);
  }
});
