import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { AuthRepository } from "../lib/server/auth-repository";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../lib/server/password";

// Real local D1 via the Worker binding. Avoid Miniflare 5's blocking Node proxy.
// No persistence, remote database, application listener or user data.
async function fixture(expand = true) {
  const options = convertV4MiniflareOptions({ name: "auth-test", modules: true, cf: false,
    compatibilityDate: "2026-09-16", d1Databases: { DB: "auth-synthetic" },
    script: `export default {async fetch(request,env) {
      try {const {statements}=await request.json();
        const results=await env.DB.batch(statements.map(s=>env.DB.prepare(s.sql).bind(...s.args)));
        return Response.json({results});
      } catch {return Response.json({error:"D1 statement failed"},{status:400});}
    }}`,
  });
  options.workers![0].dev!.unsafeRegisterWorker = false;
  const mf = new Miniflare(options);
  const url = await mf.ready;
  type Statement = { sql: string; args: unknown[] };
  async function batch(statements: Statement[]) {
    const response = await fetch(url, { method: "POST", body: JSON.stringify({ statements }), signal: AbortSignal.timeout(10000) });
    const body = await response.json() as { results: D1Result[] };
    if (!response.ok) throw new Error("D1 statement failed");
    return body.results;
  }
  function prepare(sql: string, args: unknown[] = []) {
    return { sql, args, bind: (...values: unknown[]) => prepare(sql, values),
      all: async () => (await batch([{ sql, args }]))[0],
      run: async () => (await batch([{ sql, args }]))[0],
      first: async () => (await batch([{ sql, args }]))[0].results[0] ?? null };
  }
  const db = { prepare, batch } as unknown as D1Database;
  const auth = new AuthRepository(db);
  async function migrate(name: string) {
    const sql = await readFile(new URL(`../${name.startsWith("0007_") ? "operations/w8a/deferred-expansion" : "drizzle"}/${name}`, import.meta.url), "utf8");
    await batch(sql.split("--> statement-breakpoint").map(sql => ({ sql: sql.trim(), args: [] })).filter(s => s.sql));
  }
  try {
    for (const name of (await readdir(new URL("../drizzle/", import.meta.url))).filter(n => /^000[0-6]_.*\.sql$/.test(n)).sort()) await migrate(name);
    await db.prepare("INSERT INTO accounts(id,username,password_hash,recovery_hash,created_at) VALUES('a','legacy',?,?,1),('b','other',?,?,1)")
      .bind(DUMMY_HASH, "recovery-old", DUMMY_HASH, "recovery-b").run();
    await db.prepare("INSERT INTO sessions VALUES('session-a','a',1,?),('session-b','b',1,?)").bind(Date.now()+60000,Date.now()+60000).run();
    await db.prepare("INSERT INTO diaries VALUES('a','synthetic diary',1,'1','1')").run();
    await db.prepare("INSERT INTO classes(id,name,owner_id,created_at,updated_at) VALUES('class','Synthetic class','b',1,1)").run();
    await db.prepare("INSERT INTO class_members VALUES('class','a','member','A',1),('class','b','owner','B',1)").run();
    await db.prepare("INSERT INTO class_invites(id,class_id,secret_hash,created_by,created_at) VALUES('invite','class','invite-digest','a',1)").run();
    await db.prepare("INSERT INTO personal_notes(id,user_id,subject_id,subject_name,title,content,byte_size,last_mutation_id,created_at,updated_at) VALUES('note','a','s','S','T','synthetic',9,'mutation',1,1)").run();
    if (expand) await migrate("0007_auth_compatibility.sql");
    return { db, auth, dispose: () => mf.dispose() };
  } catch (error) { await mf.dispose(); throw error; }
}

test("W8-A real D1: expansion, authority, fences, CAS and compatible contracted schema", async t => {
  const {db,auth,dispose}=await fixture();
  try {
    await t.test("schema-only expansion stays fenced until explicit initialization; legacy works without backfill", async()=>{
      assert.equal(await db.prepare("SELECT id FROM auth_schema_state").first(),null);
      assert.equal(await db.prepare("SELECT account_id FROM account_credentials").first(),null);
      await assert.rejects(auth.mode());
      await assert.rejects(db.prepare("INSERT INTO accounts(id,username,password_hash,recovery_hash,created_at) VALUES('early','early','x','x',1)").run());
      const sql=await readFile(new URL("../operations/w8a/initialize-legacy.sql",import.meta.url),"utf8");
      await db.prepare(sql).run();
      assert.equal(await auth.mode(),"legacy");
      assert.equal((await auth.find("legacy","legacy"))?.password_hash,DUMMY_HASH);
      await assert.rejects(db.prepare(sql).run());
      await db.prepare("UPDATE auth_schema_state SET write_mode='paused'").run();
      await assert.rejects(db.prepare(sql).run());
      await assert.rejects(auth.mode());
      await db.prepare("UPDATE auth_schema_state SET write_mode='legacy'").run();
    });
    await t.test("bounded shadow backfill is explicit, replay-safe and inactive outside legacy",async()=>{
      const sql=await readFile(new URL("../operations/w8a/backfill-legacy.sql",import.meta.url),"utf8");
      assert.equal((await db.prepare(sql).bind("",101).all()).results.length,0);
      assert.equal((await db.prepare(sql).bind("",1).all()).results.length,1);
      assert.equal((await db.prepare(sql).bind("a",100).all()).results.length,1);
      assert.equal((await db.prepare(sql).bind("",100).all()).results.length,0);
      await db.prepare("UPDATE auth_schema_state SET write_mode='paused'").run();
      assert.equal((await db.prepare(sql).bind("",100).all()).results.length,0);
      await db.prepare("UPDATE auth_schema_state SET write_mode='legacy'").run();
    });
    await t.test("expansion preserves hashes, session, diary, relationships and note triggers", async()=>{
      assert.equal(await auth.mode(),"legacy");
      assert.deepEqual(await db.prepare("SELECT password_hash,recovery_hash FROM account_credentials WHERE account_id='a'").first(),{password_hash:DUMMY_HASH,recovery_hash:"recovery-old"});
      for(const table of ["accounts","sessions","class_members"]) assert.equal((await db.prepare(`SELECT count(*) n FROM ${table}`).first<{n:number}>())?.n,2);
      assert.equal((await db.prepare("SELECT payload FROM diaries WHERE user_id='a'").first<{payload:string}>())?.payload,"synthetic diary");
      assert.equal((await db.prepare("SELECT seq FROM personal_note_sequences WHERE user_id='a'").first<{seq:number}>())?.seq,1);
      await db.prepare("UPDATE personal_notes SET content='still works' WHERE user_id='a'").run();
      assert.equal((await db.prepare("SELECT seq FROM personal_note_sequences WHERE user_id='a'").first<{seq:number}>())?.seq,2);
      assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results,[]);
    });
    await t.test("legacy ignores a stale backfill through password changes and recovery",async()=>{
      const a=(await auth.find("legacy","legacy"))!;
      const hash=await hashPassword("Synthetic new password 2026!");
      assert.equal(await auth.replacePassword(a,hash,a.recovery_hash,"legacy","session-a"),true);
      const updated=(await auth.find("legacy","legacy"))!;
      assert.equal(await verifyPassword("Synthetic new password 2026!",updated.password_hash!),true);
      assert.equal(updated.auth_version,2);
      const backfill=await readFile(new URL("../operations/w8a/backfill-legacy.sql",import.meta.url),"utf8");
      assert.equal((await db.prepare(backfill).bind("",100).all()).results.length,0);
      assert.equal((await db.prepare("SELECT password_hash FROM account_credentials WHERE account_id='a'").first<{password_hash:string}>())?.password_hash,DUMMY_HASH);
      assert.equal(await auth.replacePassword(updated,DUMMY_HASH,"recovery-new","legacy"),true);
      assert.equal((await auth.find("legacy","legacy"))?.recovery_hash,"recovery-new");
      assert.equal((await db.prepare("SELECT recovery_hash FROM account_credentials WHERE account_id='a'").first<{recovery_hash:string}>())?.recovery_hash,"recovery-old");
      assert.equal(await auth.replacePassword(updated,hash,"replay","legacy"),false);
    });
    await t.test("stale version or revoked/expired session has zero deletion side effects",async()=>{
      const a=(await auth.find("legacy","legacy"))!;
      assert.equal(await auth.deleteAccount({...a,auth_version:1},"legacy","session-a"),false);
      assert.equal(await auth.deleteAccount(a,"legacy","session-a"),false);
      await db.prepare("INSERT INTO sessions VALUES('revoked','a',3,?)").bind(Date.now()+60000).run();
      await db.prepare("DELETE FROM sessions WHERE token_hash='revoked'").run();
      assert.equal(await auth.deleteAccount(a,"legacy","revoked"),false);
      await db.prepare("INSERT INTO sessions VALUES('expired','a',3,1)").run();
      assert.equal(await auth.deleteAccount(a,"legacy","expired"),false);
      for(const table of ["accounts","diaries","class_invites","personal_notes"]) assert.ok((await db.prepare(`SELECT count(*) n FROM ${table}`).first<{n:number}>())!.n>0);
    });
    await t.test("paused mode fences old in-flight SQL and rolls back an earlier side effect",async()=>{
      const a=(await auth.find("legacy","legacy"))!;
      await db.prepare("UPDATE auth_schema_state SET write_mode='paused'").run();
      await assert.rejects(auth.mode());
      assert.equal(await auth.register("paused","paused",DUMMY_HASH,"x","legacy"),false);
      assert.equal(await auth.replacePassword(a,DUMMY_HASH,"x","legacy"),false);
      for(const sql of ["UPDATE accounts SET password_hash='stale' WHERE id='a'","DELETE FROM class_invites WHERE created_by='a'","INSERT INTO sessions VALUES('late','a',3,9999999999999)"])
        await assert.rejects(db.prepare(sql).run());
      await assert.rejects(db.batch([db.prepare("UPDATE diaries SET payload='should rollback' WHERE user_id='a'"),db.prepare("DELETE FROM accounts WHERE id='a'")]));
      assert.equal((await db.prepare("SELECT payload FROM diaries WHERE user_id='a'").first<{payload:string}>())?.payload,"synthetic diary");
      await db.prepare("UPDATE auth_schema_state SET write_mode='legacy'").run();
    });
    await t.test("unknown or missing schema state fails closed",async()=>{
      await db.prepare("UPDATE auth_schema_state SET schema_version=999").run();
      await assert.rejects(auth.mode());
      await assert.rejects(db.prepare("UPDATE accounts SET auth_version=auth_version+1 WHERE id='a'").run());
      await db.prepare("DELETE FROM auth_schema_state").run();
      await assert.rejects(auth.mode());
      await assert.rejects(db.prepare("DELETE FROM accounts WHERE id='a'").run());
      await db.prepare("INSERT INTO auth_schema_state VALUES(1,7,'legacy')").run();
    });
    await t.test("credential mode is tested only on a synthetic contraction fixture, with columns physically absent",async()=>{
      // NOT a deployable W8-B migration. Its operational cutover gates remain open.
      await db.batch([
        db.prepare("UPDATE account_credentials SET password_hash=(SELECT password_hash FROM accounts WHERE id=account_id),recovery_hash=(SELECT recovery_hash FROM accounts WHERE id=account_id)"),
        db.prepare("ALTER TABLE accounts DROP COLUMN password_hash"),
        db.prepare("ALTER TABLE accounts DROP COLUMN recovery_hash"),
        db.prepare("UPDATE auth_schema_state SET schema_version=8,write_mode='credentials'"),
      ]);
      assert.equal(await auth.mode(),"credentials");
      const a=(await auth.find("legacy","credentials"))!;
      assert.equal(a.recovery_hash,"recovery-new");
      const results=await Promise.all([auth.replacePassword(a,DUMMY_HASH,"one","credentials"),auth.replacePassword(a,DUMMY_HASH,"two","credentials")]);
      assert.equal(results.filter(Boolean).length,1);
      assert.equal((await auth.find("legacy","credentials"))?.auth_version,4);
      assert.equal(await auth.register("new","new",DUMMY_HASH,"real-recovery-digest","credentials"),true);
      assert.equal(await auth.register("collision","new",DUMMY_HASH,"x","credentials"),false);
      assert.equal(await db.prepare("SELECT id FROM accounts WHERE id='collision'").first(),null);
      // Absent credential must never turn into a legacy or dummy password record.
      await db.prepare("INSERT INTO accounts(id,username,created_at) VALUES('social','social',1)").run();
      const social=(await auth.find("social","credentials"))!;
      assert.equal(social.password_hash,null);
      assert.equal(await auth.replacePassword(social,DUMMY_HASH,null,"credentials"),false);
      assert.equal((await auth.find("social","credentials"))?.auth_version,1);
      await assert.rejects(auth.find("legacy","legacy"));
    });
    await t.test("FK ownership race rolls the entire delete batch back; a valid delete removes only A",async()=>{
      const a=(await auth.find("legacy","credentials"))!;
      await db.prepare("INSERT INTO sessions VALUES('current','a',4,?)").bind(Date.now()+60000).run();
      await db.prepare("UPDATE classes SET owner_id='a' WHERE id='class'").run();
      await assert.rejects(auth.deleteAccount(a,"credentials","current"));
      assert.ok(await db.prepare("SELECT id FROM class_invites WHERE id='invite'").first());
      assert.ok(await db.prepare("SELECT user_id FROM diaries WHERE user_id='a'").first());
      await db.prepare("UPDATE classes SET owner_id='b' WHERE id='class'").run();
      assert.equal(await auth.deleteAccount(a,"credentials","current"),true);
      for(const sql of ["SELECT id FROM accounts WHERE id='a'","SELECT user_id FROM diaries WHERE user_id='a'","SELECT id FROM personal_notes WHERE user_id='a'","SELECT id FROM class_invites WHERE created_by='a'","SELECT account_id FROM account_credentials WHERE account_id='a'"])
        assert.equal(await db.prepare(sql).first(),null);
      assert.ok(await db.prepare("SELECT id FROM accounts WHERE id='b'").first());
      assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results,[]);
    });
  } finally {await dispose();}
});

test("W8-A security release supports the unchanged Sites 39 schema without bootstrap",async t=>{
  const {db,auth,dispose}=await fixture(false);
  try {
    await t.test("register and login on schema 6 preserve the existing account",async()=>{
      assert.equal(await auth.mode(),"legacy-unexpanded");
      assert.equal((await auth.find("legacy","legacy-unexpanded"))?.password_hash,DUMMY_HASH);
      assert.equal(await auth.register("new6","new6",DUMMY_HASH,"recovery6","legacy-unexpanded"),true);
      assert.equal(await auth.register("collision6","new6",DUMMY_HASH,"x","legacy-unexpanded"),false);
      assert.equal(await db.prepare("SELECT id FROM accounts WHERE id='collision6'").first(),null);
    });
    await t.test("password CAS, session revocation and deletion retain their guards",async()=>{
      const a=(await auth.find("legacy","legacy-unexpanded"))!;
      assert.equal(await auth.replacePassword(a,DUMMY_HASH,"new-recovery","legacy-unexpanded","revoked"),false);
      assert.equal(await auth.deleteAccount(a,"legacy-unexpanded","revoked"),false);
      assert.ok(await db.prepare("SELECT user_id FROM diaries WHERE user_id='a'").first());
      assert.equal(await auth.replacePassword(a,DUMMY_HASH,"new-recovery","legacy-unexpanded","session-a"),true);
      assert.equal(await auth.replacePassword(a,DUMMY_HASH,"stale","legacy-unexpanded","session-a"),false);
      const updated=(await auth.find("legacy","legacy-unexpanded"))!;
      assert.equal(updated.recovery_hash,"new-recovery");
      assert.equal(await auth.deleteAccount(updated,"legacy-unexpanded","session-a"),false);
      await db.prepare("INSERT INTO sessions VALUES('current6','a',2,?)").bind(Date.now()+60000).run();
      assert.equal(await auth.deleteAccount(updated,"legacy-unexpanded","current6"),true);
      assert.equal(await db.prepare("SELECT user_id FROM diaries WHERE user_id='a'").first(),null);
      assert.ok(await db.prepare("SELECT id FROM accounts WHERE id='b'").first());
      assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results,[]);
    });
    await t.test("an expansion starting after mode selection fences stale schema-6 writes",async()=>{
      await db.prepare("CREATE TABLE account_credentials(account_id TEXT PRIMARY KEY,password_hash TEXT)").run();
      await assert.rejects(auth.mode());
      assert.equal(await auth.register("late6","late6",DUMMY_HASH,"x","legacy-unexpanded"),false);
      assert.equal(await db.prepare("SELECT id FROM accounts WHERE id='late6'").first(),null);
      await db.prepare("DROP TABLE account_credentials").run();
      assert.equal(await auth.mode(),"legacy-unexpanded");
    });
    await t.test("a residual expansion column without state is not mistaken for schema 6",async()=>{
      await db.prepare("ALTER TABLE accounts ADD auth_operation_id TEXT").run();
      await assert.rejects(auth.mode());
      assert.equal(await auth.register("partial6","partial6",DUMMY_HASH,"x","legacy-unexpanded"),false);
    });
  }finally{await dispose();}
});
