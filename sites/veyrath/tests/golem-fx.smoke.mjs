// Oct 16: golem Ravager particles spawn for grit, footsteps, smash, pound, throw, charge (each leg) and death.
import assert from 'node:assert/strict';
import {tickEliteFx} from '../dist/elite-fx.js?v=fx-104';
const r={hazards:[],fx:{effects:[],efx:[]}},b={id:1,bossSkin:'golem',scale:2.35,x:1000,y:1000,state:'alive',row:2},c={targets:[b]};
const run=(sec,f=()=>{})=>{const n0=r.fx.efx.length,e0=r.fx.effects.length;for(let t=0;t<sec;t+=1/60){f(t);tickEliteFx(r,c,1/60);}return {parts:r.fx.efx.length-n0,effects:r.fx.effects.length-e0};};
const clear=()=>{r.fx.efx.length=0;r.fx.effects.length=0;};
const res={};
clear();res.idle=run(1);
clear();b.moving=true;res.walk=run(1);b.moving=false;
clear();b.swing={kind:'smash',angle:0,fired:true};res.smash=run(.1);b.swing=null;
clear();b.special={kind:'rings',elapsed:.9,windup:.8,fired:true};res.pound=run(.1);b.special=null;
clear();b.special={kind:'boulders',elapsed:0,windup:.6,fired:false};res.throw=run(.7,t=>{b.special.elapsed=t;if(t>.6)b.special.fired=true;});b.special=null;
clear();b.special={kind:'charge',elapsed:1,windup:.9,done:false,angle:0};res.charge=run(.5,t=>{if(t>.3)b.special.done=true;});b.special=null;res.chargeEnd=run(.05);
clear();b.state='dead';res.death=run(.1);
console.log(JSON.stringify(res));
for(const k of ['idle','walk','smash','pound','throw','charge','death'])assert(res[k].parts>0,k+' spawns particles');
assert(res.smash.effects>0&&res.pound.effects>=3,'ground cracks on smash/pound');assert(res.chargeEnd.parts>0,'skid burst when the charge ends');
console.log('golem fx ok');
