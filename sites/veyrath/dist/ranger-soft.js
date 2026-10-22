// Oct 19 (user): Ranger weapon particles — soft, blended, blooming (soft-fx.js). Visual only; driven by the Ranger's own
// clock (r.shakeT) so pauses freeze it. Flamethrower fire + smoke out to its real reach, toxic trail vapour, potion/bomb/
// barrel/Grand Flask bursts, blue Chakram trail, Ninja smoke.
import {createSoft,emitSoft,burstSoft,tickSoft,drawSoft,softGlow} from './soft-fx.js?v=fx-260';
const rnd=Math.random;
function onceBursts(r,P){for(const f of r.lobFx??[]){if(f.soft)continue;f.soft=true;const R=f.R??60;
 if(f.kind==='potion'){const ramp=f.el==='fire'?'fire':f.el==='frost'?'frost':f.el==='poison'?'toxic':'purple';burstSoft(P,f.x,f.y,26,{z:6,speed:[60,R*3],up:[40,160],life:[.3,.7],size:[5,12],grow:10,ramp,g:260,drag:2.5});burstSoft(P,f.x,f.y,10,{z:4,speed:[10,R*.8],up:[10,40],life:[.6,1.1],size:[14,26],grow:30,ramp:ramp==='fire'?'smoke':'toxicFog',blend:'normal',alpha:.45,drag:2});}
 else if(f.kind==='bombHop')burstSoft(P,f.x,f.y,12,{z:4,speed:[30,140],up:[20,80],life:[.3,.6],size:[8,16],grow:24,ramp:'smoke',blend:'normal',alpha:.5,drag:3});
 else if(f.kind==='bombBig'||f.kind==='barrel'||f.kind==='grand'||f.kind==='poolBlast'){const big=f.kind==='grand',ramp=f.kind==='barrel'?'gold':f.kind==='poolBlast'?'toxic':f.kind==='grand'?'purple':'fire';
  burstSoft(P,f.x,f.y,big?70:40,{z:10,speed:[R*.8,R*4],up:[60,260],life:[.35,.85],size:[8,20],grow:30,ramp:big?'purple':ramp,g:200,drag:2.4});
  burstSoft(P,f.x,f.y,big?40:22,{z:6,speed:[20,R*1.4],up:[20,90],life:[.8,1.6],size:[20,44],grow:40,ramp:f.kind==='poolBlast'||big?'toxicFog':'smoke',blend:'normal',alpha:.5,drag:1.6});
  if(big)burstSoft(P,f.x,f.y,30,{z:8,speed:[R,R*3],up:[80,220],life:[.4,.9],size:[6,14],ramp:'toxic',g:240,drag:2});}}}
export function rangerSoftUpper(ctx,r,player){
 if(!r)return;const P=r.soft??=createSoft(),T=r.shakeT??0,dt=P.clock==null?0:Math.max(0,Math.min(.1,T-P.clock));tickSoft(P,T);onceBursts(r,P);
 if(dt>0){
  // Flamethrower: fire streaming out to the cone's real reach, hot near the nozzle, smoke rolling off the end.
  const cf=r.coneFx;if(cf&&cf.until>T&&cf.look==='flame'){const ca=Math.cos(cf.angle),sa=Math.sin(cf.angle),ox=cf.x+ca*18,oy=cf.y+sa*12;
   for(let i=0,n=Math.ceil(dt*170);i<n;i++){const a=cf.angle+(rnd()*2-1)*cf.half*.8,life=.34+rnd()*.12,sp=cf.range/life*(.95+.2*rnd());emitSoft(P,{x:ox,y:oy,z:24,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.65,vz:10+rnd()*40,life,size:3+rnd()*3,grow:62,ramp:i%5?'fire':'fireHot',drag:.25});}
   for(let i=0,n=Math.ceil(dt*36);i<n;i++){const d=cf.range*(.75+.3*rnd()),a=cf.angle+(rnd()*2-1)*cf.half*.7;emitSoft(P,{x:cf.x+Math.cos(a)*d,y:cf.y+Math.sin(a)*d*.65,z:28,vx:Math.cos(a)*30,vy:Math.sin(a)*20,vz:40+rnd()*40,life:.8+rnd()*.5,size:12,grow:38,ramp:'smoke',blend:'normal',alpha:.42,drag:1});}
   if(rnd()<dt*30){const d=cf.range*(.4+.6*rnd());emitSoft(P,{x:cf.x+ca*d,y:cf.y+sa*d*.65,z:20,vx:(rnd()-.5)*60,vy:(rnd()-.5)*40,vz:80+rnd()*80,life:.5+rnd()*.4,size:2,ramp:'fireHot',g:120});}}
  // Toxic Canister trail pools: green vapour curling up off each pool.
  for(const q of r.pools)if(q.kind==='toxictrail'||q.kind==='toxic'){const k=q.kind==='toxic'?1.4:1;if(rnd()<dt*7*k){const a=rnd()*Math.PI*2,d=q.R*.7*Math.sqrt(rnd());emitSoft(P,{x:q.x+Math.cos(a)*d,y:q.y+Math.sin(a)*d*.65,z:2,vx:(rnd()-.5)*10,vy:(rnd()-.5)*6,vz:18+rnd()*20,life:1+rnd()*.6,size:8+rnd()*6,grow:14,ramp:'toxicFog',blend:'normal',alpha:.35,drag:.8});}}
  // Bombs: fuse sparks; Grand Flask: bubbling purple drips in flight.
  for(const f of r.flasks){const t=Math.min(1,f.t/f.dur);if(f.kind==='bomb'&&rnd()<dt*40)emitSoft(P,{x:f.x0+(f.x-f.x0)*t,y:f.y0+(f.y-f.y0)*t,z:Math.sin(Math.PI*t)*(f.hop?58:f.height??95)+22,vx:(rnd()-.5)*80,vy:(rnd()-.5)*50,vz:40+rnd()*80,life:.25+rnd()*.2,size:2+rnd()*2,ramp:'fireHot',g:300});
   if(f.kind==='grandflask'&&rnd()<dt*50)emitSoft(P,{x:f.x0+(f.x-f.x0)*t,y:f.y0+(f.y-f.y0)*t,z:Math.sin(Math.PI*t)*(f.height??220)-10,vx:(rnd()-.5)*30,vy:(rnd()-.5)*20,vz:-20,life:.6,size:6+rnd()*5,ramp:'purple',g:300});}
  // Chakram: deep blue streaming trail on the way out, white-hot on the way back.
  for(const b of r.shots)if(b.chakram&&rnd()<dt*60)emitSoft(P,{x:b.x+(rnd()-.5)*10,y:b.y+(rnd()-.5)*6,z:0,vx:-Math.cos(b.angle)*40,vy:-Math.sin(b.angle)*30,vz:(rnd()-.5)*20,life:.35+rnd()*.2,size:9+rnd()*6,grow:-8,ramp:b.returned?'gold':'blue',drag:2});
  // Ninja smoke: deep blue-grey billows.
  for(const sm of r.smokes)if(rnd()<dt*22){const a=rnd()*Math.PI*2,d=sm.R*.8*Math.sqrt(rnd());emitSoft(P,{x:sm.x+Math.cos(a)*d,y:sm.y+Math.sin(a)*d*.65,z:6+rnd()*30,vx:Math.cos(a)*14,vy:Math.sin(a)*9,vz:8+rnd()*14,life:1.4+rnd()*.8,size:sm.R*.32,grow:16,ramp:'shadow',blend:'normal',alpha:.55,drag:.6});}
 }
 drawSoft(ctx,P);
}
/* Ground: the Flamethrower's reach glows on the sand (shows how far it fires); pools get a soft bed. */
export function rangerSoftGround(ctx,r){
 if(!r)return;const T=r.shakeT??0,cf=r.coneFx;
 if(cf&&cf.until>T&&cf.look==='flame'){const ca=Math.cos(cf.angle),sa=Math.sin(cf.angle),fl=.85+.15*Math.sin(T*40);
  for(let i=1;i<=5;i++){const d=cf.range*i/5;softGlow(ctx,cf.x+ca*d,cf.y+sa*d*.65,18+d*.22,i===5?'#ff5a14':'#ff8a2a',(i===5?.5:.22)*fl,{squash:.55});}softGlow(ctx,cf.x+ca*cf.range,cf.y+sa*cf.range*.65,40,'#ffd060',.35*fl,{squash:.5});}
}
