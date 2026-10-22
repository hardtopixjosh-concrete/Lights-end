// Keep the editable local dist/ intact. The publishing checkout contains an exact
// game-source/ snapshot and ONLY the generated delivery Worker under dist/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
export const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.tmj':'application/json','.tsx':'application/xml','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
export function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Symlink in runtime: '+p);return e.isDirectory()?walk(p):e.isFile()?[p]:[];});}
function copyFile(src,dst){fs.mkdirSync(path.dirname(dst),{recursive:true});const bytes=fs.readFileSync(src);if(!fs.existsSync(dst)||digest(fs.readFileSync(dst))!==digest(bytes))fs.writeFileSync(dst,bytes);}
function clearOutput(checkout,dir){const p=path.resolve(checkout,dir);if(p!==path.join(path.resolve(checkout),dir)||!p.startsWith(path.resolve(checkout)+path.sep))throw Error('Unsafe build output');fs.rmSync(p,{recursive:true,force:true});}
export function prepare(root,checkout,{bootstrap=false,reuseSnapshot=false}={}){
 root=path.resolve(root);checkout=path.resolve(checkout);
 if(root===checkout||!fs.existsSync(path.join(checkout,'.git')))throw Error('Use a separate Sites publishing checkout');
 const project=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json'))),selected=JSON.parse(fs.readFileSync(path.join(checkout,'.openai/hosting.json')));
 if(!project.project_id||selected.project_id!==project.project_id)throw Error('Publishing checkout belongs to a different Site');
 const snapshot=path.join(checkout,'game-source'),runtime=reuseSnapshot?snapshot:path.join(root,fs.existsSync(path.join(root,'game-source'))?'game-source':'dist');
 const legacy=path.join(checkout,'.sites-runtime/bootstrap-static');
 if(bootstrap&&!fs.existsSync(legacy)){fs.mkdirSync(path.dirname(legacy),{recursive:true});fs.renameSync(path.join(checkout,'dist'),legacy);}
 const files={},objects={};fs.mkdirSync(snapshot,{recursive:true});const inputs=walk(runtime).filter(p=>!p.slice(runtime.length+1).startsWith('.openai'+path.sep)&&!p.slice(runtime.length+1).startsWith('server'+path.sep));
 for(const src of inputs){
  const rel=path.relative(runtime,src).split(path.sep).join('/');let bytes,stable=false;
  for(let i=0;i<3;i++){const before=fs.statSync(src);bytes=fs.readFileSync(src);const after=fs.statSync(src);if(before.size===after.size&&before.mtimeMs===after.mtimeMs){stable=true;break;}}
  if(!stable)throw Error('Runtime file is still changing; retry snapshot: '+rel);
  const hash=digest(bytes),dst=path.join(snapshot,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst)||digest(fs.readFileSync(dst))!==hash)fs.writeFileSync(dst,bytes);
  files[rel]={hash,bytes:bytes.length,type:TYPES[path.extname(src).toLowerCase()]??'application/octet-stream'};objects[hash]={...files[rel],path:dst};
 }
 for(const stale of walk(snapshot)){const rel=path.relative(snapshot,stale).split(path.sep).join('/');if(!Object.hasOwn(files,rel))fs.unlinkSync(stale);}
 if(!files['index.html'])throw Error('Runtime index missing');
 const manifest={schema:1,files},encoded=Buffer.from(JSON.stringify(manifest)),id=digest(encoded);
 // Snapshot source support, not original ZIPs/PDFs, credentials, saves or generated backups.
 for(const folder of ['hosting','tools','tests','docs']){
  const src=path.join(root,folder);if(!fs.existsSync(src))continue;
  for(const p of walk(src)){if(/(?:\.bak-|\.log$|__pycache__|\.pyc$)/.test(p))continue;copyFile(p,path.join(checkout,path.relative(root,p)));}
 }
 for(const name of ['package.json','AGENTS.md','GAME_REFERENCE.md','README.md','.gitignore'])if(fs.existsSync(path.join(root,name)))copyFile(path.join(root,name),path.join(checkout,name));
 let ignore=fs.readFileSync(path.join(checkout,'.gitignore'),'utf8');for(const item of ['.sites-runtime/','.openai/local/'])if(!ignore.includes(item))ignore+='\n'+item+'\n';fs.writeFileSync(path.join(checkout,'.gitignore'),ignore);
 const hosting=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json')));delete hosting.static;hosting.r2='BUCKET';hosting.d1??=null;
 fs.mkdirSync(path.join(checkout,'.openai'),{recursive:true});fs.writeFileSync(path.join(checkout,'.openai/hosting.json'),JSON.stringify(hosting,null,2)+'\n');
 clearOutput(checkout,'dist');fs.mkdirSync(path.join(checkout,'dist/server'),{recursive:true});
 const template=fs.readFileSync(path.join(root,'hosting/asset-worker.mjs'),'utf8'),workerHash=digest(template);
 const worker=template.replace("'__RELEASE__'",JSON.stringify(bootstrap?'bootstrap':id)).replace("'__WORKER_HASH__'",JSON.stringify(workerHash));fs.writeFileSync(path.join(checkout,'dist/server/index.js'),worker);
 if(bootstrap)fs.cpSync(legacy,path.join(checkout,'dist/client'),{recursive:true});
 fs.mkdirSync(path.join(checkout,'dist/.openai'),{recursive:true});fs.writeFileSync(path.join(checkout,'dist/.openai/hosting.json'),JSON.stringify(hosting,null,2)+'\n');
 const state=path.join(checkout,'.openai/local');fs.mkdirSync(state,{recursive:true});fs.writeFileSync(path.join(state,'release-manifest.json'),encoded);
 const plan={schema:1,id,workerHash,bootstrap,manifest:path.join(state,'release-manifest.json'),objects,files:Object.keys(files).length,totalBytes:Object.values(files).reduce((n,f)=>n+f.bytes,0),origin:'https://veyrath-desert-roguelite.jestudios.chatgpt.site'};
 fs.writeFileSync(path.join(state,'release-plan.json'),JSON.stringify(plan));fs.writeFileSync(path.join(checkout,'.openai/release.json'),JSON.stringify({schema:1,id,files:plan.files,totalBytes:plan.totalBytes},null,2)+'\n');
 return {id,files:plan.files,uniqueObjects:Object.keys(objects).length,totalBytes:plan.totalBytes,checkout,bootstrap};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=process.argv.indexOf('--checkout');if(index<0)throw Error('Usage: node tools/deploy/prepare.mjs --checkout ABSOLUTE_PUBLISHING_CHECKOUT [--bootstrap]');
 console.log(JSON.stringify(prepare(process.cwd(),process.argv[index+1],{bootstrap:process.argv.includes('--bootstrap'),reuseSnapshot:process.argv.includes('--reuse-snapshot')})));
}
