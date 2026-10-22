// Byte-preserving, append-only asset delivery. Never deletes prior releases.
const RELEASE = '__RELEASE__';
const WORKER_HASH = '__WORKER_HASH__';
const HASH=/^[a-f0-9]{64}$/;
const encoder=new TextEncoder();
const memo=new Map();
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function authorized(request,env){
 const supplied=request.headers.get('Authorization')??'',expected='Bearer '+(env.ASSET_UPLOAD_TOKEN??'');
 if(!env.ASSET_UPLOAD_TOKEN)return false;
 const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(supplied)),crypto.subtle.digest('SHA-256',encoder.encode(expected))]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
async function manifest(env,id){
 if(!HASH.test(id))return null;
 if(memo.has(id))return memo.get(id);
 const obj=await env.BUCKET.get('releases/'+id+'.json');if(!obj)return null;
 const value=await obj.json();memo.set(id,value);if(memo.size>8)memo.delete(memo.keys().next().value);return value;
}
function validManifest(m){
 return m?.schema===1&&m.files&&typeof m.files==='object'&&Object.hasOwn(m.files,'index.html')&&Object.keys(m.files).length<=100000&&Object.entries(m.files).every(([p,v])=>p&&!p.startsWith('/')&&!p.split('/').some(s=>s==='..'||s==='.'||!s)&&!p.includes('\\')&&HASH.test(v.hash)&&Number.isSafeInteger(v.bytes)&&v.bytes>=0&&typeof v.type==='string'&&v.type.length<150);
}
async function admin(request,env,url){
 if(!await authorized(request,env))return json({error:'Unauthorized'},401);
 if(!env.BUCKET)return json({error:'Asset storage unavailable'},503);
 if(url.pathname==='/__asset-admin/status'&&request.method==='GET')return json({schema:1,release:RELEASE,workerHash:WORKER_HASH,storage:true});
 if(url.pathname==='/__asset-admin/check'&&request.method==='POST'){
  const body=await request.json();if(!Array.isArray(body.hashes)||body.hashes.length>40||!body.hashes.every(h=>HASH.test(h)))return json({error:'Invalid hash batch'},400);
  const entries=await Promise.all(body.hashes.map(async h=>[h,!!await env.BUCKET.head('objects/'+h)]));return json({present:Object.fromEntries(entries)});
 }
 const object=url.pathname.match(/^\/__asset-admin\/objects\/([a-f0-9]{64})$/);
 const release=url.pathname.match(/^\/__asset-admin\/releases\/([a-f0-9]{64})$/);
 if(object&&request.method==='PUT'){
  const length=Number(request.headers.get('Content-Length'));if(!Number.isSafeInteger(length)||length<0||length>96*1024*1024)return json({error:'Invalid object size; split large source files into delivery chunks without altering quality'},413);
  const digest=Uint8Array.from(object[1].match(/../g),n=>parseInt(n,16));
  try{await env.BUCKET.put('objects/'+object[1],request.body,{sha256:digest.buffer,onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:request.headers.get('Content-Type')??'application/octet-stream'},customMetadata:{sha256:object[1]}});return json({stored:object[1],bytes:length});}
  catch{return json({error:'Object checksum or storage write failed'},400);}
 }
 if(release){
  if(request.method==='GET'){const m=await manifest(env,release[1]);return m?json(m):json({error:'Unknown release'},404);}
  if(request.method==='PUT'){
   const bytes=await request.arrayBuffer();if(bytes.byteLength>16*1024*1024)return json({error:'Manifest too large'},413);
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(digest!==release[1])return json({error:'Manifest checksum mismatch'},400);
   let m;try{m=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid JSON'},400);}
   if(!validManifest(m))return json({error:'Invalid release manifest'},400);
   await env.BUCKET.put('releases/'+digest+'.json',bytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});return json({stored:digest,files:Object.keys(m.files).length});
  }
 }
 return json({error:'Unknown deployment operation'},404);
}
async function objectResponse(request,env,ctx,hash,type){
 const url=new URL(request.url);url.pathname='/__content/'+hash;url.search='';
 const key=new Request(url,{method:'GET'});let cache;
 // Workers for Platforms denies caches.default; named caches are optional.
 // A hosting cache restriction must never prevent source-byte delivery.
 try{cache=await globalThis.caches?.open('veyrath-content-v1');}catch{}
 if(!request.headers.has('Range')&&cache){try{const hit=await cache.match(key);if(hit)return request.method==='HEAD'?new Response(null,hit):hit;}catch{cache=null;}}
 const object=await env.BUCKET.get('objects/'+hash,request.headers.has('Range')?{range:request.headers}:undefined);
 if(!object)return new Response('Release asset unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
 const headers=new Headers({'Content-Type':type??object.httpMetadata?.contentType??'application/octet-stream','Cache-Control':'public,max-age=31536000,immutable','ETag':'"'+hash+'"','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'});
 if(request.headers.get('If-None-Match')===headers.get('ETag'))return new Response(null,{status:304,headers});
 let status=200;if(request.headers.has('Range')&&object.range){const {offset,length}=object.range;headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${object.size}`);headers.set('Content-Length',String(length));status=206;}else headers.set('Content-Length',String(object.size));
 const response=new Response(request.method==='HEAD'?null:object.body,{status,headers});
 if(status===200&&request.method==='GET'&&cache)ctx.waitUntil(cache.put(key,response.clone()).catch(()=>{}));return response;
}
export default {async fetch(request,env,ctx){
 try{
  const url=new URL(request.url);
  if(url.pathname.startsWith('/__asset-admin/'))return admin(request,env,url);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(url.pathname==='/__release')return json({release:RELEASE,workerHash:WORKER_HASH,storage:'content-addressed',quality:'source-bytes'});
  const direct=url.pathname.match(/^\/__objects\/([a-f0-9]{64})\/[^/]+$/);
  if(direct)return await objectResponse(request,env,ctx,direct[1]);
  // Initial storage provisioning keeps the last static game available if the platform provides its assets binding.
  if(RELEASE==='bootstrap')return env.ASSETS?.fetch(request)??new Response('Preparing the game update. Please refresh shortly.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'15'}});
  const route=url.pathname.match(/^\/__releases\/([a-f0-9]{64})\/(.*)$/);
  const id=route?route[1]:RELEASE;let path=decodeURIComponent(route?route[2]:url.pathname.slice(1));if(!path)path='index.html';
  const m=await manifest(env,id),entry=m&&Object.hasOwn(m.files,path)?m.files[path]:null;if(!entry)return new Response('Not found',{status:404});
  if(path.endsWith('.html')){
   const obj=await env.BUCKET.get('objects/'+entry.hash);if(!obj)return new Response('Release unavailable',{status:503});
   const html=(await obj.text()).replace(/<head(?:\s[^>]*)?>/i,s=>s+`<base href="/__releases/${id}/">`);
   return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':route?'public,max-age=31536000,immutable':'no-cache','X-Veyrath-Release':id}});
  }
  // Root aliases remain compatible with absolute runtime paths. Binary requests share an immutable content URL across releases.
  if(url.pathname.startsWith('/__content/'))return new Response('Not found',{status:404});
  const target=new URL('/__objects/'+entry.hash+'/'+encodeURIComponent(path.split('/').at(-1)),url);
  if(!url.pathname.startsWith('/__objects/')&&!/\.(?:js|mjs|css|json|tmj|tsx|txt|svg|woff2?|ttf|html)$/.test(path))return new Response(null,{status:307,headers:{Location:target.href,'Cache-Control':route?'public,max-age=31536000,immutable':'no-cache'}});
  return await objectResponse(request,env,ctx,entry.hash,entry.type);
 }catch(error){console.error('Asset delivery failed',error?.message);return new Response('Asset service unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}};
