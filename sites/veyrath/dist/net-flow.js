// Reliable deltas must never be dropped after encoding. Apply backpressure BEFORE encoding,
// independently per guest, so a slow receiver cannot queue seconds of obsolete snapshots.
export function createFlow(){return {pending:[],bytes:0,acked:0,skips:0};}
export function canSend(f){/* Oct 19 audit: 4 un-acked snapshots = 200 ms at 20 Hz; Steam relay round trips above that stalled the friend's view. 12 = 600 ms; the byte cap still bounds a slow guest. */if(f.pending.length>=12||f.bytes>=131072){f.skips++;return false;}return true;}
export function sent(f,n,bytes){f.pending.push({n,bytes});f.bytes+=bytes;}
export function acknowledge(f,n){if(!Number.isSafeInteger(n)||n<=f.acked||n>(f.pending.at(-1)?.n??f.acked))return false;
 f.acked=n;while(f.pending.length&&f.pending[0].n<=n)f.bytes-=f.pending.shift().bytes;return true;}

const EDGES=new Set(['lmb','rmb','lmbUp','rmbUp','Q','E','R','Eup','dash','cancel']);
export function validCommand(m){
 if(!m||!Number.isSafeInteger(m.q)||m.q<=0||!Number.isFinite(m.d)||m.d<0||m.d>.1||!Array.isArray(m.m)||m.m.length!==2||!m.m.every(Number.isFinite))return null;
 if(m.a!=null&&(!Array.isArray(m.a)||m.a.length!==2||!m.a.every(v=>Number.isFinite(v)&&Math.abs(v)<100000)))return null;
 const len=Math.hypot(...m.m),scale=len>1?1/len:1;
 return {q:m.q,d:m.d,m:m.m.map(v=>v*scale),a:m.a??null,p:Array.isArray(m.p)?m.p.filter(v=>EDGES.has(v)).slice(0,16):[]};
}
// Keep render-frame input durations/edges intact; send their batch at 30 Hz (edges flush immediately).
export function createInputBatch(){return {steps:[],elapsed:0};}
export function batchInput(b,cmd){b.steps.push(cmd);b.elapsed+=cmd.d;
 if(b.elapsed+1e-9<1/30&&!cmd.p?.length&&b.steps.length<16)return null;
 const steps=b.steps.splice(0);b.elapsed=0;return steps;}
