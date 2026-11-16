import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { hashPassword, verifyPassword } from "../lib/server/password";

// Local rehearsal only. No project ID, remote database ID, arbitrary target or SQL input.
if (process.argv.length !== 2) throw new Error("This rehearsal accepts no arguments or remote target.");
const root=fileURLToPath(new URL("../",import.meta.url));
const wrangler=path.join(root,"node_modules/wrangler/bin/wrangler.js");
const exec=promisify(execFile);
const directory=await mkdtemp(path.join(tmpdir(),"ipagell-w8a-restore-"));
const env={...process.env,CLOUDFLARE_CF_FETCH_ENABLED:"false",WRANGLER_SEND_METRICS:"false",WRANGLER_WRITE_LOGS:"false",
  WRANGLER_REGISTRY_PATH:path.join(directory,"registry"),MINIFLARE_REGISTRY_PATH:path.join(directory,"registry")};
for(const key of Object.keys(env)) if (/^(?:CLOUDFLARE_|CF_)/.test(key) && key!=="CLOUDFLARE_CF_FETCH_ENABLED") delete env[key as keyof typeof env];
let serial=0;
type Result={results:Record<string,unknown>[];success:boolean};
async function target(name:string){
  const cwd=path.join(directory,name);await mkdir(cwd);
  await writeFile(path.join(cwd,"wrangler.json"),JSON.stringify({name:"w8a-synthetic",main:"worker.mjs",compatibility_date:"2026-05-22",
    d1_databases:[{binding:"DB",database_name:"w8a-synthetic",database_id:"00000000-0000-4000-8000-000000000000"}]}));
  await writeFile(path.join(cwd,"worker.mjs"),"export default {fetch(){return new Response('Local rehearsal only',{status:503})}};");
  return cwd;
}
async function cli(cwd:string,args:string[]){
  try{return (await exec(process.execPath,[wrangler,...args,"--config",path.join(cwd,"wrangler.json"),"--local"],{cwd,env,timeout:30000,maxBuffer:16*1024*1024})).stdout;}
  catch {throw new Error("Local D1 command failed; no remote command was attempted.");}
}
async function sql(cwd:string,statement:string):Promise<Result[]>{
  const file=path.join(directory,`query-${++serial}.sql`);await writeFile(file,statement);
  const result=JSON.parse(await cli(cwd,["d1","execute","DB","--json","--file",file])) as Result[];
  assert.ok(result.every(r=>r.success));return result;
}
function canonical(value:unknown):string{
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(value!==null&&typeof value==="object")return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
const digest=(value:unknown)=>createHash("sha256").update(canonical(value)).digest("hex");
async function snapshot(cwd:string){
  const objects=(await sql(cwd,"SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' ORDER BY type,name;"))[0].results;
  const tables=objects.filter(o=>o.type==="table").map(o=>String(o.name));
  assert.ok(tables.every(n=>/^[a-z_]+$/.test(n)));
  const data=await sql(cwd,tables.map(t=>`SELECT * FROM "${t}";`).join("\n"));
  const rows=Object.fromEntries(tables.map((t,i)=>[t,data[i].results.map(canonical).sort()]));
  assert.equal((await sql(cwd,"PRAGMA foreign_key_check;"))[0].results.length,0);
  return {tables,objects,rows,hash:digest({objects,rows})};
}
async function checkpoint(source:string,name:string){
  const before=await snapshot(source),backup=path.join(directory,name+"-backup");
  await mkdir(backup);
  // Persist the actual three-part backup before opening the restore target.
  // All tables exist before child rows; original triggers are installed after data.
  const schema=before.objects.filter(o=>o.sql && o.type!=="trigger");
  schema.sort((a,b)=>Number(a.type!=="table")-Number(b.type!=="table"));
  await writeFile(path.join(backup,"schema.sql"),schema.map(o=>String(o.sql)+";").join("\n"));
  const dataFile=path.join(backup,"data.sql");
  await cli(source,["d1","export","DB","--no-schema","--output",dataFile]);
  await writeFile(dataFile,"PRAGMA defer_foreign_keys=TRUE;\n"+await readFile(dataFile,"utf8"));
  await writeFile(path.join(backup,"triggers.sql"),before.objects.filter(o=>o.type==="trigger").map(o=>String(o.sql)+";").join("\n"));
  const files=["schema.sql","data.sql","triggers.sql"];
  const hashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash("sha256").update(await readFile(path.join(backup,file))).digest("hex")])));
  const manifest={version:1,checkpoint_sha256:before.hash,files:hashes};
  await writeFile(path.join(backup,"manifest.json"),JSON.stringify(manifest));
  async function verifyBundle(){
    const recorded=JSON.parse(await readFile(path.join(backup,"manifest.json"),"utf8")) as typeof manifest;
    assert.deepEqual(recorded,manifest);
    for(const file of files)assert.equal(createHash("sha256").update(await readFile(path.join(backup,file))).digest("hex"),recorded.files[file]);
  }
  const originalData=await readFile(dataFile);
  await writeFile(dataFile,"-- corrupted synthetic backup");
  await assert.rejects(verifyBundle());
  await writeFile(dataFile,originalData);
  await verifyBundle();
  assert.equal((await snapshot(source)).hash,before.hash,"Source changed during backup acquisition");
  const destination=await target(name);
  for(const file of files)await cli(destination,["d1","execute","DB","--json","--file",path.join(backup,file)]);
  const after=await snapshot(destination);
  assert.deepEqual(after,before,"Restored schema/rows differ from checkpoint");
  const account=(await sql(destination,"SELECT password_hash FROM accounts WHERE id='synthetic-a';"))[0].results[0];
  assert.equal(await verifyPassword("Synthetic restore password 2026!",String(account.password_hash)),true);
  const sequence=Number((await sql(destination,"SELECT seq FROM personal_note_sequences WHERE user_id='synthetic-a';"))[0].results[0].seq);
  await sql(destination,"UPDATE personal_notes SET content='after restore' WHERE id='synthetic-note';");
  assert.equal(Number((await sql(destination,"SELECT seq FROM personal_note_sequences WHERE user_id='synthetic-a';"))[0].results[0].seq),sequence+1);
  if(name==="expanded-restore"){
    assert.deepEqual((await sql(destination,"SELECT schema_version,write_mode FROM auth_schema_state;"))[0].results,[{schema_version:7,write_mode:"legacy"}]);
    await sql(destination,"UPDATE auth_schema_state SET write_mode='paused' WHERE id=1;");
    await assert.rejects(sql(destination,"UPDATE accounts SET auth_version=auth_version+1 WHERE id='synthetic-a';"));
  }
  assert.equal((await snapshot(source)).hash,before.hash,"Restore modified source database");
  return {checkpoint:name,tables:before.tables.length,schema_objects:before.objects.length,content_sha256:before.hash,backup_files_sha256:hashes,backup_manifest_sha256:createHash("sha256").update(await readFile(path.join(backup,"manifest.json"))).digest("hex"),corrupted_backup_rejected:true,full_data_schema_equal:true,foreign_keys_valid:true,password_verified:true,note_trigger_verified:true,source_unchanged:true};
}
try{
  const source=await target("source");
  for(const name of (await readdir(path.join(root,"drizzle"))).filter(n=>/^000[0-6]_.*\.sql$/.test(n)).sort())await sql(source,await readFile(path.join(root,"drizzle",name),"utf8"));
  const hash=await hashPassword("Synthetic restore password 2026!");
  const quote=(v:string)=>"'"+v.replaceAll("'","''")+"'";
  await sql(source,`INSERT INTO accounts(id,username,password_hash,recovery_hash,created_at) VALUES('synthetic-a','restore_a',${quote(hash)},'synthetic-recovery-a',1),('synthetic-b','restore_b',${quote(hash)},'synthetic-recovery-b',1);
    INSERT INTO sessions VALUES('synthetic-session-a','synthetic-a',1,4102444800000);
    INSERT INTO diaries VALUES('synthetic-a','synthetic diary sentinel',1,'1','1');
    INSERT INTO classes(id,name,owner_id,created_at,updated_at) VALUES('synthetic-class','Restore class','synthetic-b',1,1);
    INSERT INTO class_members VALUES('synthetic-class','synthetic-a','member','A',1),('synthetic-class','synthetic-b','owner','B',1);
    INSERT INTO class_invites(id,class_id,secret_hash,created_by,created_at) VALUES('synthetic-invite','synthetic-class','synthetic-invite-hash','synthetic-a',1);
    INSERT INTO personal_notes(id,user_id,subject_id,subject_name,title,content,byte_size,last_mutation_id,created_at,updated_at) VALUES('synthetic-note','synthetic-a','s','S','T','restore sentinel',16,'synthetic-mutation',1,1);
    INSERT INTO class_subjects(id,class_id,name,name_key,created_at,updated_at) VALUES('synthetic-subject','synthetic-class','S','s',1,1);
    INSERT INTO class_notes(id,class_id,class_name,author_id,author_name,subject_id,subject_name,title,content,byte_size,last_mutation_id,created_at,updated_at) VALUES('synthetic-shared','synthetic-class','Restore class','synthetic-a','A','synthetic-subject','S','T','shared sentinel',15,'synthetic-shared-mutation',1,1);
    INSERT INTO class_note_pins VALUES('synthetic-shared','synthetic-a');`);
  const legacy=await checkpoint(source,"legacy-restore");
  await sql(source,await readFile(path.join(root,"operations/w8a/deferred-expansion/0007_auth_compatibility.sql"),"utf8"));
  await sql(source,await readFile(path.join(root,"operations/w8a/initialize-legacy.sql"),"utf8"));
  // Backfill is unnecessary for W8-A. Exercise its actual bounded SQL explicitly.
  const backfill=await readFile(path.join(root,"operations/w8a/backfill-legacy.sql"),"utf8");
  await sql(source,backfill.replaceAll("?1","''").replaceAll("?2","100"));
  const expanded=await checkpoint(source,"expanded-restore");
  console.log(JSON.stringify({local_only:true,managed_https_verified:false,remote_commands:0,checkpoints:[legacy,expanded],temporary_files_removed:true},null,2));
}finally{await rm(directory,{recursive:true,force:true});}
