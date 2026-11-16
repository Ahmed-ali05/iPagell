import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Deferred 0007 is schema-only and excluded from the active release journal",async()=>{
  const sql=await readFile(new URL("../operations/w8a/deferred-expansion/0007_auth_compatibility.sql",import.meta.url),"utf8");
  const statements=sql.split("--> statement-breakpoint").map(s=>s.replace(/--[^\n]*/g,"").trim()).filter(Boolean);
  assert.ok(statements.length>0);
  for(const statement of statements) assert.match(statement,/^(CREATE (?:TABLE|(?:UNIQUE )?INDEX|TRIGGER)|ALTER TABLE)\b/i);
  assert.doesNotMatch(sql,/INSERT INTO (?:account_credentials|auth_schema_state)/i);
});

test("security release keeps exactly the Sites 39 schema and migration journal",async()=>{
  const {createHash}=await import("node:crypto");
  const {readdir}=await import("node:fs/promises");
  const baseline={"db/schema.ts":"800c50bc7de8b70c47f49507554b819cf4b81444acc60a5c67efb5486f099194","drizzle/meta/_journal.json":"a71cd13f70403a2837c5f8757838760f1d8c40a0534bfb9de95a812d9652fcd6"};
  for(const [file,hash] of Object.entries(baseline)){
    assert.equal(createHash("sha256").update(await readFile(new URL("../"+file,import.meta.url))).digest("hex"),hash);
  }
  assert.deepEqual((await readdir(new URL("../drizzle/",import.meta.url))).filter(n=>n.endsWith(".sql")).sort(),JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json",import.meta.url),"utf8")).entries.map((e:{tag:string})=>e.tag+".sql"));
});
