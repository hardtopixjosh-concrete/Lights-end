// One-time Windows DPAPI storage; token arrives on hidden stdin, never argv/source.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
if(process.platform!=='win32')throw Error('On other platforms supply VEYRATH_ASSET_UPLOAD_TOKEN through a secret manager.');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');process.stdout.write('Ready for hidden credential JSON.\n');
let input='';process.stdin.on('data',part=>{input+=part;if(!/[\r\n]/.test(input))return;
 try{const {token}=JSON.parse(input.trim());if(typeof token!=='string'||token.length<40)throw Error('Invalid credential');const filename=path.resolve('.openai/local/asset-upload-token.dpapi');fs.mkdirSync(path.dirname(filename),{recursive:true});const env={...process.env,VEYRATH_TOKEN_FILE:filename};delete env.PSModulePath;execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$plain=[Console]::In.ReadToEnd(); $secure=ConvertTo-SecureString $plain -AsPlainText -Force; ConvertFrom-SecureString $secure | Set-Content -LiteralPath $env:VEYRATH_TOKEN_FILE"],{input:token,env,windowsHide:true,stdio:['pipe','pipe','pipe']});process.stdout.write('Encrypted local upload credential stored.\n');process.exit(0);}catch{process.stderr.write('Could not protect upload credential.\n');process.exit(1);}
});
