import { test } from 'node:test';
import assert from 'node:assert/strict';
const ACCESS = 'atlandiascope_access_token';
const REFRESH = 'atlandiascope_refresh_token';
function storage() { const data = new Map(); return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}; }
let index = 0;
async function setup() {
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
  localStorage.setItem(ACCESS,'old'); localStorage.setItem(REFRESH,'refresh');
  return import('../public/session.js?test=' + index++);
}
const json = (data,status=200)=>new Response(JSON.stringify(data),{status});
const config = ()=>json({supabaseUrl:'https://example.test',supabaseAnonKey:'public'});
test('concurrent expired requests share one refresh and retry with new token',async()=>{
 const session=await setup(); let refreshes=0;
 globalThis.fetch=async(url,options)=>{
  if(url==='/supabase-config.json')return config();
  if(url.includes('grant_type')){refreshes++; await new Promise(r=>setTimeout(r,10)); return json({access_token:'new',refresh_token:'rotated'});}
  return options.headers.authorization==='Bearer new'?json({ok:true}):json({},401);
 };
 assert.deepEqual(await Promise.all([session.api('/one'),session.api('/two')]),[{ok:true},{ok:true}]);
 assert.equal(refreshes,1);assert.equal(localStorage.getItem(REFRESH),'rotated');
});
test('temporary refresh outage preserves saved credentials',async()=>{
 const session=await setup();
 globalThis.fetch=async url=>url==='/supabase-config.json'?config():url.includes('grant_type')?json({},503):json({},401);
 await assert.rejects(session.api('/one'),error=>!(error instanceof session.SessionExpired));
 assert.equal(localStorage.getItem(REFRESH),'refresh');
});
test('second unauthorized response produces a sign-in recovery error',async()=>{
 const session=await setup();
 globalThis.fetch=async url=>url==='/supabase-config.json'?config():url.includes('grant_type')?json({access_token:'new'}):json({},401);
 await assert.rejects(session.api('/one'),session.SessionExpired);
});
test('configuration failure can be retried',async()=>{
 const session=await setup();let calls=0;
 globalThis.fetch=async()=>++calls===1?json({},503):config();
 await assert.rejects(session.getConfig());assert.ok((await session.getConfig()).supabaseUrl);
});
test('legacy tab session migrates and logout clears both stores',async()=>{
 const session=await setup();localStorage.removeItem(ACCESS);sessionStorage.setItem(ACCESS,'legacy');
 session.migrateSession();assert.equal(session.tokenNow(),'legacy');assert.equal(sessionStorage.getItem(ACCESS),null);
 session.clearSession();assert.equal(session.tokenNow(),null);assert.equal(localStorage.getItem(REFRESH),null);
});
test('a refresh completing after sign-out cannot restore the session',async()=>{
 const session=await setup();
 globalThis.fetch=async url=>{
  if(url==='/supabase-config.json')return config();
  if(url.includes('grant_type')){session.clearSession();return json({access_token:'new',refresh_token:'rotated'});}
  return json({},401);
 };
 await assert.rejects(session.api('/one'),session.SessionExpired);assert.equal(session.tokenNow(),null);
});
