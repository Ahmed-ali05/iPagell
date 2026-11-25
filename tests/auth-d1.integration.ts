import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { AuthRepository } from "../lib/server/auth-repository";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../lib/server/password";
import { LAST_SEEN_INTERVAL_MS, MAX_SESSIONS, publicSessionId, SessionRepository } from "../lib/server/session-repository";

// Real local D1 via the Worker binding. Avoid Miniflare 5's blocking Node proxy.
// No persistence, remote database, application listener or user data.
async function fixture(expand = true, bootstrap = false, metadata = false) {
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
    const sql = await readFile(new URL(`../drizzle/${name}`, import.meta.url), "utf8");
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
    if (bootstrap) await migrate("0008_auth_bootstrap_legacy.sql");
    // Tests that apply 0009 must name session columns: positional inserts expect four.
    if (metadata) await migrate("0009_session_metadata.sql");
    return { db, auth, migrate, dispose: () => mf.dispose() };
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

test("W8-B Cloudflare: drizzle 0007+0008 open legacy mode with existing data intact",async t=>{
  const {db,auth,migrate,dispose}=await fixture(true,true);
  try {
    await t.test("bootstrap migration selects legacy and keeps existing hashes and data",async()=>{
      assert.equal(await auth.mode(),"legacy");
      assert.equal((await auth.find("legacy","legacy"))?.password_hash,DUMMY_HASH);
      assert.equal(await db.prepare("SELECT account_id FROM account_credentials").first(),null);
      assert.equal((await db.prepare("SELECT payload FROM diaries WHERE user_id='a'").first<{payload:string}>())?.payload,"synthetic diary");
      assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results,[]);
    });
    await t.test("register, password change and delete work after the migration run",async()=>{
      assert.equal(await auth.register("w8b","w8b",DUMMY_HASH,"recovery-w8b","legacy"),true);
      assert.equal(await auth.register("w8b-dup","w8b",DUMMY_HASH,"x","legacy"),false);
      const a=(await auth.find("legacy","legacy"))!;
      assert.equal(await auth.replacePassword(a,DUMMY_HASH,"recovery-w8b-a","legacy","session-a"),true);
      const updated=(await auth.find("legacy","legacy"))!;
      await db.prepare("INSERT INTO sessions VALUES('current-w8b','a',?,?)").bind(updated.auth_version,Date.now()+60000).run();
      assert.equal(await auth.deleteAccount(updated,"legacy","current-w8b"),true);
      assert.equal(await db.prepare("SELECT id FROM accounts WHERE id='a'").first(),null);
      assert.ok(await db.prepare("SELECT id FROM accounts WHERE id='b'").first());
    });
    await t.test("re-running the bootstrap fails instead of reopening another state",async()=>{
      await db.prepare("UPDATE auth_schema_state SET write_mode='paused'").run();
      await assert.rejects(migrate("0008_auth_bootstrap_legacy.sql"));
      await assert.rejects(auth.mode());
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

test("Google sign-in: single-winner transactions, passwordless accounts and identity reuse",async t=>{
  const {db,auth,dispose}=await fixture(true,true,true);
  const issuer="https://accounts.google.com";
  const tx=async(id:string,binding="bind-1",ttl=60000)=>auth.createOAuthTransaction({id,stateHash:`state-${id}`,bindingHash:binding,
    nonce:`nonce-${id}`,redirectUri:"https://ipagell.website/api/auth/oauth/google/callback",expiresAt:Date.now()+ttl},"legacy");
  const finish=(transactionId:string,subject:string,session:string,newId:string,username:string)=>auth.finishGoogleLogin({transactionId,issuer,subject,
    sessionHash:session,sessionExpiresAt:Date.now()+60000,client:"chrome.android",newAccount:{id:newId,username}},"legacy");
  try{
    await t.test("Google needs the expanded legacy schema",async()=>{
      await assert.rejects(auth.createOAuthTransaction({id:"x",stateHash:"x",bindingHash:"x",nonce:"x",redirectUri:"x",expiresAt:1},"legacy-unexpanded"));
      assert.equal(await auth.claimOAuthTransaction("x","x","credentials"),null);
    });
    await t.test("a transaction is claimed once, only by its browser and before expiry",async()=>{
      assert.equal(await tx("t1"),true);
      assert.equal(await auth.claimOAuthTransaction("state-t1","bind-other","legacy"),null,"other browser");
      const claimed=await auth.claimOAuthTransaction("state-t1","bind-1","legacy");
      assert.deepEqual([claimed?.id,claimed?.nonce],["t1","nonce-t1"]);
      assert.equal(await auth.claimOAuthTransaction("state-t1","bind-1","legacy"),null,"replayed state");
      assert.equal(await tx("t-old","bind-1",-1),true);
      assert.equal(await auth.claimOAuthTransaction("state-t-old","bind-1","legacy"),null,"expired");
    });
    await t.test("at most three pending transactions per browser",async()=>{
      assert.equal(await tx("p1","bind-2"),true);assert.equal(await tx("p2","bind-2"),true);assert.equal(await tx("p3","bind-2"),true);
      assert.equal(await tx("p4","bind-2"),false);
      assert.equal(await tx("q1","bind-3"),true,"other browsers are unaffected");
    });
    await t.test("first sign-in creates account, identity and session atomically",async()=>{
      const result=await finish("t1","sub-1","g-session-1","g1","u_aaaaaaaaaaaaaaaaaaaaaaaaaa");
      assert.deepEqual(result,{userId:"g1",created:true});
      const row=await db.prepare("SELECT username,password_hash,recovery_hash,auth_version FROM accounts WHERE id='g1'").first();
      assert.deepEqual(row,{username:"u_aaaaaaaaaaaaaaaaaaaaaaaaaa",password_hash:"none$google",recovery_hash:"none$google",auth_version:1});
      assert.ok(await db.prepare("SELECT 1 FROM account_identities WHERE account_id='g1' AND issuer=? AND subject='sub-1' AND status='active'").bind(issuer).first());
      assert.ok(await db.prepare("SELECT 1 FROM sessions WHERE token_hash='g-session-1' AND user_id='g1'").first());
      const meta=await db.prepare("SELECT method,client,created_at=last_seen_at AS same,created_at>0 AS stamped FROM sessions WHERE token_hash='g-session-1'").first();
      assert.deepEqual(meta,{method:"google",client:"chrome.android",same:1,stamped:1});
      assert.equal((await db.prepare("SELECT status FROM auth_transactions WHERE id='t1'").first<{status:string}>())?.status,"consumed");
      assert.equal(await auth.find("u_aaaaaaaaaaaaaaaaaaaaaaaaaa","legacy").then(a=>verifyPassword("none$google",a!.password_hash!)),false,"no password login");
    });
    await t.test("a consumed transaction cannot finish twice",async()=>{
      assert.equal(await finish("t1","sub-1","g-session-dup","g-dup","u_dupdupdupdupdupdupdupdupdu"),null);
      assert.equal(await db.prepare("SELECT 1 FROM sessions WHERE token_hash='g-session-dup'").first(),null);
      assert.equal(await db.prepare("SELECT 1 FROM accounts WHERE id='g-dup'").first(),null);
    });
    await t.test("the same subject signs in to the same account without a new one",async()=>{
      await auth.claimOAuthTransaction("state-p1","bind-2","legacy");
      assert.deepEqual(await finish("p1","sub-1","g-session-2","g-new","u_bbbbbbbbbbbbbbbbbbbbbbbbbb"),{userId:"g1",created:false});
      assert.equal(await db.prepare("SELECT 1 FROM accounts WHERE id='g-new'").first(),null);
      assert.equal((await db.prepare("SELECT count(*) AS n FROM account_identities").first<{n:number}>())?.n,1);
    });
    await t.test("a handle collision creates nothing and no session",async()=>{
      await auth.claimOAuthTransaction("state-p2","bind-2","legacy");
      assert.equal(await finish("p2","sub-2","g-session-3","g2","legacy"),null);
      assert.equal(await db.prepare("SELECT 1 FROM account_identities WHERE subject='sub-2'").first(),null);
      assert.equal(await db.prepare("SELECT 1 FROM sessions WHERE token_hash='g-session-3'").first(),null);
    });
    await t.test("a disabled identity gets no session and no replacement account",async()=>{
      await db.prepare("UPDATE account_identities SET status='disabled' WHERE subject='sub-1'").run();
      await auth.claimOAuthTransaction("state-p3","bind-2","legacy");
      assert.equal(await finish("p3","sub-1","g-session-4","g3","u_cccccccccccccccccccccccccc"),null);
      assert.equal(await db.prepare("SELECT 1 FROM accounts WHERE id='g3'").first(),null);
      await db.prepare("UPDATE account_identities SET status='active' WHERE subject='sub-1'").run();
    });
    await t.test("deleting a Google account removes its identity, so the subject can start over",async()=>{
      const account=(await auth.find("u_aaaaaaaaaaaaaaaaaaaaaaaaaa","legacy"))!;
      assert.equal(await auth.deleteAccount(account,"legacy","g-session-1"),true);
      assert.equal(await db.prepare("SELECT 1 FROM account_identities WHERE subject='sub-1'").first(),null);
      assert.equal(await db.prepare("SELECT 1 FROM sessions WHERE user_id='g1'").first(),null);
      assert.ok(await db.prepare("SELECT 1 FROM accounts WHERE id='a'").first(),"legacy accounts untouched");
      assert.deepEqual((await db.prepare("PRAGMA foreign_key_check").all()).results,[]);
    });
  }finally{await dispose();}
});

test("Phase A: session metadata, device list, cap and revocation on real D1",async t=>{
  const {db,auth,dispose}=await fixture(true,true,true);
  const sessions=new SessionRepository(db);
  const later=()=>Date.now()+60000;
  const insert=(hash:string,user="a",version=1,expires=later(),created:number|null=Date.now(),seen:number|null=null,method:string|null="password",client:string|null=null)=>
    db.prepare("INSERT INTO sessions(token_hash,user_id,auth_version,expires_at,created_at,last_seen_at,method,client) VALUES(?,?,?,?,?,?,?,?)")
      .bind(hash,user,version,expires,created,seen,method,client).run();
  const hashes=async(user:string)=>(await db.prepare("SELECT token_hash FROM sessions WHERE user_id=? ORDER BY token_hash").bind(user).all<{token_hash:string}>()).results.map(r=>r.token_hash);
  try{
    await t.test("0009 backfills sessions open before it: exact start, method, no device",async()=>{
      const rows=(await db.prepare("SELECT token_hash,expires_at-created_at AS ttl,method,client,last_seen_at FROM sessions ORDER BY token_hash").all()).results;
      assert.deepEqual(rows.map(r=>({...r})),[
        {token_hash:"session-a",ttl:1209600000,method:"password",client:null,last_seen_at:null},
        {token_hash:"session-b",ttl:1209600000,method:"password",client:null,last_seen_at:null},
      ]);
    });
    await t.test("the pre-0009 four-column INSERT still works (rollout and rollback)",async()=>{
      await db.prepare("INSERT INTO sessions (token_hash,user_id,auth_version,expires_at) VALUES('old-code','a',1,?)").bind(later()).run();
      assert.deepEqual({...await db.prepare("SELECT created_at,method,client FROM sessions WHERE token_hash='old-code'").first()},{created_at:null,method:null,client:null});
    });
    await t.test("insert records method and device and respects version and gate",async()=>{
      assert.equal(await sessions.insert({hash:"new-a",userId:"a",version:1,expiresAt:later(),method:"password",client:"safari.ios",gate:"1"}),1);
      assert.deepEqual({...await db.prepare("SELECT method,client,created_at=last_seen_at AS same FROM sessions WHERE token_hash='new-a'").first()},{method:"password",client:"safari.ios",same:1});
      assert.equal(await sessions.insert({hash:"stale",userId:"a",version:9,expiresAt:later(),method:"password",client:null,gate:"1"}),0);
      assert.equal(await sessions.insert({hash:"closed",userId:"a",version:1,expiresAt:later(),method:"password",client:null,gate:"0"}),0);
    });
    await t.test("resolve accepts only valid sessions and writes last_seen_at at most every 15 minutes",async()=>{
      const now=Date.now();
      await db.prepare("UPDATE sessions SET expires_at=? WHERE token_hash='session-a'").bind(now+3600000).run();
      assert.deepEqual(await sessions.resolve("session-a",now),{id:"a",username:"legacy",method:"password"});
      const seen=async()=>(await db.prepare("SELECT last_seen_at FROM sessions WHERE token_hash='session-a'").first<{last_seen_at:number}>())!.last_seen_at;
      assert.equal(await seen(),now);
      await sessions.resolve("session-a",now+LAST_SEEN_INTERVAL_MS-1);
      assert.equal(await seen(),now,"no write inside the window");
      await sessions.resolve("session-a",now+LAST_SEEN_INTERVAL_MS);
      assert.equal(await seen(),now+LAST_SEEN_INTERVAL_MS);
      await insert("expired-a","a",1,now-1);
      assert.equal(await sessions.resolve("expired-a",now),null);
      await insert("old-version","a",0);
      assert.equal(await sessions.resolve("old-version"),null);
    });
    await t.test("a failing activity write never blocks identity",async()=>{
      const failing={prepare:(sql:string)=>{if(sql.startsWith("UPDATE"))throw new Error("synthetic write failure");return db.prepare(sql);},batch:db.batch} as unknown as D1Database;
      await insert("untouched","a");
      assert.deepEqual(await new SessionRepository(failing).resolve("untouched"),{id:"a",username:"legacy",method:"password"});
    });
    await t.test("list: current first, only the owner's valid sessions, no token hash; cleans dead rows",async()=>{
      await insert("other-user","b",1,later(),Date.now(),Date.now(),"password","chrome.windows");
      await insert("google-like","a",1,later(),Date.now()-5000,Date.now()-1000,"google","chrome.android");
      const list=await sessions.list("a","session-a");
      assert.equal(list[0].id,publicSessionId("session-a"));
      assert.equal(list[0].current,true);
      assert.equal(list.filter(s=>s.current).length,1);
      const ids=new Set(list.map(s=>s.id));
      for(const hash of ["session-a","old-code","new-a","untouched","google-like"]) assert.ok(ids.has(publicSessionId(hash)),hash);
      for(const hash of ["other-user","session-b","expired-a","old-version"]) assert.equal(ids.has(publicSessionId(hash)),false,hash);
      assert.equal(JSON.stringify(list).includes("session-a"),false,"token hashes never leave the server");
      assert.deepEqual(list.find(s=>s.id===publicSessionId("google-like"))&&{method:list.find(s=>s.id===publicSessionId("google-like"))!.method,client:list.find(s=>s.id===publicSessionId("google-like"))!.client},{method:"google",client:"chrome.android"});
      assert.equal(await db.prepare("SELECT 1 FROM sessions WHERE token_hash IN ('expired-a','old-version')").first(),null,"targeted cleanup");
      assert.ok(await db.prepare("SELECT 1 FROM sessions WHERE token_hash='other-user'").first(),"other accounts untouched");
    });
    await t.test("revoke: one other session, never the current one, never another account's (IDOR), idempotent",async()=>{
      assert.equal(await sessions.revoke("a","session-a",publicSessionId("other-user")),0,"another account's id does not exist for a");
      assert.ok(await db.prepare("SELECT 1 FROM sessions WHERE token_hash='other-user'").first());
      assert.equal(await sessions.revoke("a","session-a",publicSessionId("session-a")),0,"current session survives");
      assert.equal(await sessions.revoke("a","session-a",publicSessionId("new-a")),1);
      assert.equal(await sessions.revoke("a","session-a",publicSessionId("new-a")),0,"retry after a lost response");
      assert.equal(await sessions.revoke("a","session-a","0".repeat(32)),0);
      assert.equal(await sessions.resolve("new-a"),null,"a revoked session no longer authenticates");
    });
    await t.test("revoke-others closes every other usable session of the owner only",async()=>{
      await insert("expired-b","a",1,Date.now()-1);
      assert.equal(await sessions.revokeOthers("a","session-a"),3,"old-code, untouched and google-like; the expired row is not counted");
      assert.deepEqual(await hashes("a"),["session-a"]);
      assert.deepEqual(await hashes("b"),["other-user","session-b"]);
      assert.ok(await sessions.resolve("session-a"));
    });
    await t.test("the cap keeps the newest sessions and drops invalidated ones",async()=>{
      const base=Date.now()+60000;
      for(let i=0;i<MAX_SESSIONS+4;i++) await insert(`cap-${String(i).padStart(2,"0")}`,"b",1,base+i*1000);
      await insert("cap-stale","b",0,base+999999);
      await sessions.prune("b");
      const left=await hashes("b");
      assert.equal(left.length,MAX_SESSIONS);
      // 26 valid rows (24 cap rows, session-b, other-user): the six closest to expiry go.
      for(const gone of ["cap-stale","session-b","other-user","cap-00","cap-01","cap-02","cap-03"]) assert.equal(left.includes(gone),false,gone);
      for(const kept of ["cap-04",`cap-${MAX_SESSIONS+3}`]) assert.ok(left.includes(kept),kept);
      assert.deepEqual(await hashes("a"),["session-a"],"another account's sessions are not touched");
    });
    await t.test("deleting the account still cascades to its sessions",async()=>{
      const account=(await auth.find("other","legacy"))!;
      await db.prepare("DELETE FROM classes WHERE owner_id='b'").run();
      assert.equal(await auth.deleteAccount(account,"legacy",`cap-${MAX_SESSIONS+3}`),true);
      assert.deepEqual(await hashes("b"),[]);
    });
  }finally{await dispose();}
});
