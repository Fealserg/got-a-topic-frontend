import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const {NextRequest}=require('next/server');
const filename=path.resolve('app/api/[...path]/route.ts');
const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));mod._compile(code,filename);
const route=mod.exports;
const context={params:Promise.resolve({path:['auth','login']})};

test('proxy uses runtime backend origin and forwards session with POST body',async()=>{
 const previous=global.fetch;let actual;
 process.env.API_BASE_URL='https://api.example.test';
 global.fetch=async(url,opts)=>{actual={url:String(url),opts};return new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json','Set-Cookie':'session=abc; HttpOnly; SameSite=Strict'}});};
 try{
  const req=new NextRequest('https://front.example.test/api/auth/login?source=web',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'pereryv','Cookie':'old=value'},body:'{"username":"anna"}'});
  const res=await route.POST(req,context);
  assert.equal(actual.url,'https://api.example.test/api/auth/login?source=web');
  assert.equal(actual.opts.headers.get('X-Requested-With'),'pereryv');
  assert.equal(actual.opts.headers.get('Cookie'),'old=value');
  assert.equal(new TextDecoder().decode(actual.opts.body),'{"username":"anna"}');
  assert.match(res.headers.get('set-cookie'),/HttpOnly/);
  assert.equal(res.headers.get('cache-control'),'no-store');
  assert.deepEqual(await res.json(),{ok:true});
 }finally{global.fetch=previous;delete process.env.API_BASE_URL;}
});

test('proxy preserves backend error status and removes stale content encoding',async()=>{
 const previous=global.fetch;
 global.fetch=async()=>new Response('{"error":{"message":"Conflict"}}',{status:409,headers:{'Content-Encoding':'gzip','Content-Length':'999'}});
 try{const res=await route.GET(new NextRequest('http://localhost/api/invitations'),{params:Promise.resolve({path:['invitations']})});assert.equal(res.status,409);assert.equal(res.headers.get('content-encoding'),null);assert.equal(res.headers.get('content-length'),null);assert.equal((await res.json()).error.message,'Conflict');}finally{global.fetch=previous;}
});

test('backend outage becomes a readable 502 instead of an unhandled exception',async()=>{
 const previous=global.fetch;global.fetch=async()=>{throw new Error('offline');};
 try{const res=await route.GET(new NextRequest('http://localhost/api/health'),{params:Promise.resolve({path:['health']})});assert.equal(res.status,502);assert.match((await res.json()).error.message,/временно недоступен/);}finally{global.fetch=previous;}
});

for(const value of ['auto-generated-stub-for-build','not-an-origin','ftp://api.example.test','https://user:secret@api.example.test','https://api.example.test/path','https://api.example.test/?token=secret']) {
 test(`invalid backend configuration returns safe 502: ${value.split(':')[0]}`,async()=>{
  const previous=global.fetch;const env=process.env.API_BASE_URL;let called=false;
  process.env.API_BASE_URL=value;global.fetch=async()=>{called=true;throw Error('must not call upstream');};
  try{const response=await route.GET(new NextRequest('https://front.example.test/api/health'),{params:Promise.resolve({path:['health']})});assert.equal(response.status,502);assert.equal(called,false);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(JSON.stringify(await response.json()).includes('secret'),false);}finally{global.fetch=previous;if(env===undefined)delete process.env.API_BASE_URL;else process.env.API_BASE_URL=env;}
 });
}
test('production without backend origin returns 502 rather than connecting to localhost',async()=>{
 const env=process.env.API_BASE_URL,nodeEnv=process.env.NODE_ENV;delete process.env.API_BASE_URL;process.env.NODE_ENV='production';
 try{const response=await route.GET(new NextRequest('https://front.example.test/api/health'),{params:Promise.resolve({path:['health']})});assert.equal(response.status,502);}finally{if(env!==undefined)process.env.API_BASE_URL=env;if(nodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=nodeEnv;}
});
