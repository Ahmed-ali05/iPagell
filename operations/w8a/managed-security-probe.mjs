import {createInterface} from 'node:readline';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

const allowed='https://ipagell-w8a-private-20261017.produc-ch.chatgpt.site';
const lines=createInterface({input:process.stdin,terminal:false});
let base,service,a,diaryHash,noteId;
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
async function call(path,method='GET',body,cookie=a?.cookie){
  const response=await fetch(base+path,{method,redirect:'manual',headers:{'OAI-Sites-Authorization':'Bearer '+service,Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(a?{'X-IPagell-Account':a.id}:{}),...(path.includes('/notes')?{'X-IPagell-Notes-Contract':'2'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  let data;try{data=await response.json();}catch{throw new Error('Non-JSON response from private test API, HTTP '+response.status);}
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
}
function status(r,n){if(r.status!==n)throw new Error('Private test API expected HTTP '+n+', received '+r.status+' ('+(r.data?.code??'no code')+')');}
async function verify(label){
  const login=await call('/api/auth/login','POST',{username:a.username,password:a.password},null);status(login,200);a.cookie=login.cookie;
  assert.ok(a.cookie?.startsWith('__Host-ipagell-session='));
  assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/Secure/);assert.match(login.headers.get('set-cookie'),/SameSite=Lax/);
  const account=await call('/api/account');status(account,200);assert.equal(account.data.user.id,a.id);assert.equal(hash(account.data.diary),diaryHash);
  const notes=await call('/api/notes');status(notes,200);
  assert.equal(notes.data.notes.find(n=>n.id===noteId)?.content,'Synthetic managed rollback sentinel');
  console.log(JSON.stringify({phase:label,https:true,login:true,secure_cookie:true,account_id_preserved:true,diary_sha256:diaryHash,note_preserved:true}));
}
console.log('Ready for private synthetic rehearsal JSON on stdin (input is hidden).');
for await(const line of lines){
  let phase='parse';
  try{
    const x=JSON.parse(line);phase=x.phase;
    if(x.phase==='configure'){
      assert.equal(x.base,allowed);base=x.base;service=x.service;assert.ok(service);
      const denied=await fetch(base+'/api/account',{redirect:'manual',signal:AbortSignal.timeout(20000)});
      assert.ok([302,303,401,403].includes(denied.status));
      console.log(JSON.stringify({phase:'configure',target_restricted_to_private_site:true,anonymous_private_access_denied:true,status:denied.status}));
    }else if(x.phase==='seed'){
      assert.ok(base&&!a);const username='w8a_'+randomUUID().slice(0,8),password='Synthetic managed password 2026!';
      const signup=await call('/api/auth/register','POST',{username,password},null);status(signup,201);
      a={username,password,id:signup.data.user.id,recovery:signup.data.recoveryCode,cookie:signup.cookie};
      const profile=await call('/api/account','POST',{name:'Synthetic rollback sentinel',school:'QA only',semester:'S1',schoolYear:'2026/27',startDate:'2026-08-24',endDate:'2027-01-31',preset:'basic'});status(profile,201);
      const persisted=await call('/api/account');status(persisted,200);diaryHash=hash(persisted.data.diary);const subject=persisted.data.diary.data.subjects[0];noteId=randomUUID();
      status(await call('/api/notes','POST',{id:noteId,expectedUserId:a.id,mutationId:randomUUID(),baseRevision:0,subjectId:subject.id,subjectName:subject.name,title:'Synthetic sentinel',content:'Synthetic managed rollback sentinel',contentFormat:'plain',pinned:false}),201);
      await verify('baseline_seed');
    }else if(x.phase==='candidate'){
      await verify('candidate_existing_data');
      const before=a.cookie,newPassword=a.password+' changed';
      status(await call('/api/auth/security','POST',{operation:'password',expectedUserId:a.id,currentPassword:a.password,newPassword}),200);
      status(await call('/api/account','GET',undefined,before),401);a.password=newPassword;
      await verify('candidate_password_changed');
      const beforeRecovery=a.cookie;
      const recovered=await call('/api/auth/recover','POST',{username:a.username,recoveryCode:a.recovery,password:a.password+' recovered'},null);status(recovered,200);
      status(await call('/api/account','GET',undefined,beforeRecovery),401);
      a.password+=' recovered';a.recovery=recovered.data.recoveryCode;a.cookie=recovered.cookie;
      await verify('candidate_recovered');
    }else if(x.phase==='rollback'||x.phase==='reapply'){
      await verify(x.phase);
    }else if(x.phase==='cleanup'){
      status(await call('/api/auth/security','POST',{operation:'delete',expectedUserId:a.id,currentPassword:a.password,confirmation:a.username}),200);
      status(await call('/api/account'),401);a=null;service=null;
      console.log(JSON.stringify({phase:'cleanup',synthetic_account_deleted:true,session_revoked:true}));lines.close();break;
    }else throw new Error('Unknown phase');
  }catch{process.exitCode=1;console.log(JSON.stringify({phase:'failure',check:phase}));}
}
