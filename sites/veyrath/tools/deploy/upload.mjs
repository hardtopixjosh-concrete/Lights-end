// Upload exact bytes only when their SHA-256 is not already in the asset store.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {digest} from './prepare.mjs';
async function mapLimit(items,n,fn){let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<items.length){const at=i++;await fn(items[at],at);}}));}
export function readToken(root){
 if(process.env.VEYRATH_ASSET_UPLOAD_TOKEN)return process.env.VEYRATH_ASSET_UPLOAD_TOKEN;
 const filename=path.resolve(root,'.openai/local/asset-upload-token.dpapi');
 if(process.platform!=='win32'||!fs.existsSync(filename))throw Error('Asset upload credential unavailable. Follow docs/ASSET_DELIVERY.md; do not put a token in source or command arguments.');
 const env={...process.env,VEYRATH_TOKEN_FILE:filename};delete env.PSModulePath;
 return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$s=ConvertTo-SecureString ((Get-Content -Raw -LiteralPath $env:VEYRATH_TOKEN_FILE).Trim()); (New-Object System.Management.Automation.PSCredential('asset-upload',$s)).GetNetworkCredential().Password"],{env,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']}).trim();
}
export async function upload(plan,token,{log=console.log,fetcher=fetch}={}){
 const origin=new URL(plan.origin);if(origin.protocol!=='https:')throw Error('HTTPS required');
 async function call(route,options={}){
  for(let attempt=0;attempt<5;attempt++){
   let response;try{response=await fetcher(new URL('/__asset-admin/'+route,origin),{...options,redirect:'error',headers:{Authorization:'Bearer '+token,...options.headers}});}catch(e){if(attempt===4)throw Error('Asset upload network failure');await new Promise(r=>setTimeout(r,500*2**attempt));continue;}
   if(response.ok)return response;
   if((response.status===429||response.status>=500)&&attempt<4){await new Promise(r=>setTimeout(r,750*2**attempt));continue;}
   throw Error('Asset store '+response.status+': '+(await response.text()).slice(0,220));
  }
 }
 const status=await (await call('status')).json();let known=new Set();
 if(status.release===plan.id){const receipt={release:plan.id,workerHash:plan.workerHash,unchanged:!!plan.workerHash&&status.workerHash===plan.workerHash,uploadedObjects:0,uploadedBytes:0,reusedObjects:Object.keys(plan.objects).length,files:plan.files,totalBytes:plan.totalBytes};log(JSON.stringify(receipt));return receipt;}
 if(/^[a-f0-9]{64}$/.test(status.release)){const baseline=await (await call('releases/'+status.release)).json();known=new Set(Object.values(baseline.files).map(f=>f.hash));}
 const candidate=Object.keys(plan.objects).filter(h=>!known.has(h)),missing=[];
 if(candidate.length)log(JSON.stringify({checkingNewHashes:candidate.length,reusedFromLiveRelease:known.size}));
 for(let i=0;i<candidate.length;i+=40){const group=candidate.slice(i,i+40),result=await (await call('check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hashes:group})})).json();missing.push(...group.filter(h=>!result.present[h]));}
 let uploadedBytes=0,done=0;log(JSON.stringify({release:plan.id,files:plan.files,reusedObjects:Object.keys(plan.objects).length-missing.length,uploadObjects:missing.length,uploadBytes:missing.reduce((n,h)=>n+plan.objects[h].bytes,0)}));
 await mapLimit(missing,6,async hash=>{const item=plan.objects[hash],bytes=fs.readFileSync(item.path);if(digest(bytes)!==hash)throw Error('Snapshot changed; prepare again before upload');await call('objects/'+hash,{method:'PUT',headers:{'Content-Type':item.type},body:bytes});uploadedBytes+=bytes.length;done++;if(done%100===0||done===missing.length)log(JSON.stringify({uploaded:done,total:missing.length,bytes:uploadedBytes}));});
 const encoded=fs.readFileSync(plan.manifest);if(digest(encoded)!==plan.id)throw Error('Manifest changed after preparation');
 await call('releases/'+plan.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:encoded});
 const receipt={release:plan.id,workerHash:plan.workerHash,unchanged:false,uploadedObjects:done,uploadedBytes,reusedObjects:Object.keys(plan.objects).length-done,files:plan.files,totalBytes:plan.totalBytes};log(JSON.stringify(receipt));return receipt;
}
if(process.argv[1]&&path.basename(process.argv[1])==='upload.mjs'){
 const index=process.argv.indexOf('--checkout');if(index<0)throw Error('Usage: node tools/deploy/upload.mjs --checkout ABSOLUTE_PUBLISHING_CHECKOUT');
 const checkout=path.resolve(process.argv[index+1]),plan=JSON.parse(fs.readFileSync(path.join(checkout,'.openai/local/release-plan.json')));const receipt=await upload(plan,readToken(process.cwd()));fs.writeFileSync(path.join(checkout,'.openai/local/upload-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
}
