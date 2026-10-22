// Mage RMB/Q/R/Blink and Blood-path visuals, code-native (user decision Oct 15).
// Same contract as mage-e-fx.js: mage.js pushes effect records, tickSpellFx emits visual-only
// particles into the shared m.efx pool in simulation time, draw functions only read state.
import {handPoint,shotLift,shotDX,TAU,BODY,clamp01,easeOut,rng,emit,burst,radialGlow,boltPoints,glowStroke,tongue,sigil,drawSpikes,E_PALETTE} from './mage-e-fx.js?v=fx-260';
import {shaderFx} from './mage-vfx.js?v=fx-260';
import {heroAnchor} from './hero-anchor.js?v=fx-260';
const pal=el=>E_PALETTE[el]??E_PALETTE.arcane;
const frame=t=>Math.floor(t*40);
const METEOR_FROM={x:-170,y:-470};
function ringSpikes(radius,seed){const r=rng(seed),spikes=[],n=22;for(let i=0;i<n;i++){const a=i/n*TAU+(r()-.5)*.25,d=radius*(.72+.26*r());spikes.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65,h:16+r()*20,w:5+r()*3,lean:Math.cos(a)*(6+r()*8),delay:d/radius*.32});}return spikes.sort((a,b)=>a.dy-b.dy);}
function randomIn(radius){const a=Math.random()*TAU,d=radius*Math.sqrt(Math.random());return {dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65};}

// ---------- simulation-time particle emission ----------
const SHAKE={arcHit:0,surge:4,glacial:3.5,chain:3,zap:2,qnova:4,pulse:1.5};
const MOTES={apulse:12,surge:18,glacial:16,chain:6,zap:8,qnova:22,pulse:5,blink:8};
function motes(m,x,y,el,count,spread){const colors=pal(el).spark;for(let i=0;i<count;i++){const a=Math.random()*TAU,d=spread*Math.sqrt(Math.random());emit(m,{kind:'mote',x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*.65,z:6+Math.random()*50,vx:(Math.random()-.5)*20,vy:(Math.random()-.5)*12,vz:12+Math.random()*30,g:0,drag:.8,life:1.1+Math.random()*1.2,size:1.6+Math.random()*1.8,rot:Math.random()*TAU,vr:2+Math.random()*4,color:colors[1+(i%3)]});}}
// Camera shake is simulation-time so a paused frame stays still; game.js reads mageShake().
export function mageShake(m){const a=m.shake??0;if(a<.05)return {x:0,y:0};const t=m.shakeT??0;return {x:Math.sin(t*83)*a,y:Math.cos(t*67)*a*.7};}
export function tickSpellFx(m,dt){
 tickBasicFx(m,dt);tickBloodFx(m,dt);tickKitFx(m,dt);tickTalentFx(m,dt);
 m.shakeT=(m.shakeT??0)+dt;m.shake=Math.max(0,(m.shake??0)-dt*(10+(m.shake??0)*4));
 for(const e of m.effects){if(e.juiced)continue;e.juiced=true;const el=e.element??'arcane',big=e.big?2.2:(e.scale??1)<.6?.5:1;
  if(SHAKE[e.kind]&&!e.quiet)m.shake=Math.max(m.shake??0,SHAKE[e.kind]*big*(e.kind==='zap'&&e.radius>80?1.8:1));
  if(MOTES[e.kind]&&!e.follow){const x=e.x??e.lines?.at(-1)?.toX,y=e.y??e.lines?.at(-1)?.toY;if(x!==undefined){motes(m,x,y,el,Math.round(MOTES[e.kind]*big),(e.radius??40)*.7);if(e.kind==='chain')for(const l of e.lines)motes(m,l.toX,l.toY,el,4,20);}}}
 m.sfxClock=(m.sfxClock??0)-dt;const due=m.sfxClock<=0;if(due)m.sfxClock=.018;
 if(due){
  for(const b of m.projectiles){if(b.kind!=='fireball')continue;const back={x:b.x-Math.cos(b.angle)*10,y:b.y-Math.sin(b.angle)*10};
   if(b.element==='pyro'){burst(m,back.x,back.y,30,'pyro',2,{speed:[10,40],up:[20,70],life:[.3,.55],kind:'ember',size:[1.5,3],g:40});if(Math.random()<.35)emit(m,{kind:'smoke',x:back.x,y:back.y,z:shotLift(b),vz:25,life:.6,size:7,grow:16,color:'#4a3426'});}
   else if(b.element==='cryo')burst(m,back.x,back.y,30,'cryo',2,{speed:[10,50],up:[-10,30],life:[.3,.5],kind:'flake',size:[1,2],g:30});
   else burst(m,back.x,back.y,30,'storm',2,{speed:[40,120],up:[-30,30],life:[.1,.2],size:[1,2],g:0});}
  for(const h of m.meteors){const q=(h.age/h.warning)**2,sc=h.scale??1,x=h.x+METEOR_FROM.x*(1-q)*sc,y=h.y,z=-METEOR_FROM.y*(1-q)*sc;
   burst(m,x,y,z,'pyro',3,{speed:[10,50],up:[10,60],life:[.3,.6],kind:'ember',size:[2,3.5],g:40});emit(m,{kind:'smoke',x:x+(Math.random()-.5)*10,y,z:z+8,vx:-20,vz:10,life:.8,size:10*sc,grow:20,color:'#3a2a22'});}
  for(const z of m.zones){if(z.age<z.warning)continue;const pt=randomIn(z.radius);if(Math.random()<.5)motes(m,z.x,z.y,z.spec.element,1,z.radius*.8);
   if(z.spec.element==='cryo')for(let i=0;i<6;i++){const q=randomIn(z.radius*1.1);emit(m,{kind:'flake',x:z.x+q.dx-50,y:z.y+q.dy,z:120+Math.random()*90,vx:90+Math.random()*40,vy:10,vz:-90-Math.random()*50,life:1.3,size:1.2+Math.random()*1.6,color:Math.random()<.5?'#e2f6ff':'#c4ecfa'});}
   else burst(m,z.x+pt.dx,z.y+pt.dy,2,'storm',1,{speed:[20,60],up:[30,90],life:[.2,.4],size:[1,2],g:120});}
  if(m.ward){const w=m.ward;if(Math.random()<.4)motes(m,w.x,w.y,w.element,1,30);const a=w.age*4+Math.random()*TAU;burst(m,w.x+Math.cos(a)*28,w.y+Math.sin(a)*18,30,w.element,1,{speed:[5,25],up:[20,60],life:[.3,.5],kind:w.element==='pyro'?'ember':w.element==='cryo'?'flake':'spark',size:[1.2,2.4],g:w.element==='storm'?0:30});}
  for(const b of m.bloodProjectiles??[])emit(m,{kind:'drop',x:b.x-Math.cos(b.angle)*14,y:b.y-Math.sin(b.angle)*14,z:30,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*20,vz:20,g:300,life:.5,size:1.4+Math.random()*1.4,color:E_PALETTE.blood.spark[1+(Math.random()*3|0)]});
  if(m.bloodVeil){const v=m.bloodVeil,a=Math.random()*TAU;emit(m,{kind:'drop',x:v.x+Math.cos(a)*30,y:v.y+Math.sin(a)*20,z:20+Math.random()*40,vz:30,g:120,life:.5,size:1.5,color:'#8e1030'});}
  if(m.drain&&m.drainLine){const l=m.drainLine,f=Math.random(),x=l.toX+(l.x-l.toX)*f,y=l.toY+(l.y-l.toY)*f,dx=l.x-l.toX,dy=l.y-l.toY,n=Math.hypot(dx,dy)||1;emit(m,{kind:'drop',x,y,z:32,vx:dx/n*260,vy:dy/n*260,g:0,life:Math.min(.45,(1-f)*n/260),size:1.6+Math.random()*1.4,color:E_PALETTE.blood.spark[Math.random()*4|0]});}
  for(const z of m.bloodZones??[]){const q=randomIn(z.spec.radius);emit(m,{kind:'drop',x:z.x+q.dx,y:z.y+q.dy,z:2,vz:50+Math.random()*60,g:-10,life:.8,size:1.5+Math.random()*1.5,color:E_PALETTE.blood.spark[Math.random()*4|0]});}
 }
 for(const z of m.bloodZones??[])if(z.fxTicks!==z.ticks){z.fxTicks=z.ticks;z.fxPulse=0;burst(m,z.x,z.y,4,'blood',14,{speed:[40,160],up:[60,180],life:[.3,.6],kind:'drop',spread:z.spec.radius*.6,g:320});}
 for(const z of m.bloodZones??[])z.fxPulse=(z.fxPulse??1)+dt;
 for(const e of m.effects){if(e.sfxInit)continue;
  const el=e.element??'arcane';
  if(e.kind==='zap'){e.sfxInit=true;e.seed=(Math.random()*1e9)|0;burst(m,e.x,e.y,BODY,'storm',e.radius>80?30:16,{speed:[90,300],up:[-30,150],life:[.15,.4],size:[1.2,2.6],spread:e.radius>80?e.radius*.4:0});}
  else if(e.kind==='qnova'){e.sfxInit=true;e.seed=(Math.random()*1e9)|0;if(el==='cryo')e.spikes=ringSpikes(e.radius,e.seed);
   const n=el==='pyro'?60:el==='cryo'?50:50;for(let i=0;i<n;i++){const a=i/n*TAU,s=e.radius*1.6*(.8+.4*Math.random());emit(m,{kind:el==='pyro'?'ember':el==='cryo'?'flake':'spark',x:e.x,y:e.y,z:10+Math.random()*30,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.65,vz:el==='pyro'?60+Math.random()*90:Math.random()*60,g:el==='storm'?0:60,drag:2.4,life:.45+Math.random()*.35,size:1.4+Math.random()*2.2,color:pal(el).spark[i%4]});}
   if(el==='cryo')for(let i=0;i<12;i++){const a=i/12*TAU;emit(m,{kind:'mist',x:e.x,y:e.y,z:6,vx:Math.cos(a)*e.radius*1.5,vy:Math.sin(a)*e.radius,drag:3,life:.8,size:16,grow:26,color:'#eafbff'});}}
  else if(e.kind==='pulse'){e.sfxInit=true;e.seed=(Math.random()*1e9)|0;
   if(el==='storm'){e.strikes=Array.from({length:2},()=>randomIn(e.radius*.85));for(const s of e.strikes){burst(m,e.x+s.dx,e.y+s.dy,4,'storm',14,{speed:[80,240],up:[40,180],life:[.15,.4]});}}
   else{m.shake=Math.max(m.shake??0,1.6);for(let i=0;i<8;i++){const q=randomIn(e.radius*.85);emit(m,{kind:'icicle',x:e.x+q.dx,y:e.y+q.dy,z:240+Math.random()*120,vz:-860,g:0,life:1,size:4+Math.random()*3});}burst(m,e.x,e.y,20,'cryo',18,{speed:[120,320],up:[10,80],life:[.3,.6],kind:'flake',spread:e.radius*.6,g:20});}}
  else if(e.kind==='blink'){e.sfxInit=true;
   if(e.role==='from')for(let i=0;i<18;i++){const a=Math.random()*TAU,d=30+Math.random()*16,life=.22;emit(m,{kind:'spark',x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d*.65,z:30+Math.sin(a)*20,vx:-Math.cos(a)*d/life,vy:-Math.sin(a)*d*.65/life,life,size:1.4+Math.random()*1.4,color:pal(el).spark[i%4]});}
   else burst(m,e.x,e.y,30,el,22,{speed:[60,220],up:[0,140],life:[.2,.45],size:[1.2,2.6]});}
  else if(e.kind==='nova'&&el==='blood'){e.sfxInit=true;burst(m,e.x,e.y,20,'blood',26,{speed:[60,200],up:[60,200],life:[.4,.7],kind:'drop',spread:(e.radius??90)*.3,g:340});}
  else if(e.kind==='surge'&&e.big){e.sfxInit=true;for(let i=0;i<16;i++){const a=Math.random()*TAU,v=120+Math.random()*220;emit(m,{kind:'shard',x:e.x,y:e.y,z:10,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.65,vz:160+Math.random()*220,g:620,drag:.5,life:.8+Math.random()*.5,size:3+Math.random()*4,rot:Math.random()*TAU,vr:(Math.random()-.5)*14,color:i%3?'#5a3a24':'#2e1d12'});}}
 }
}

// Blizzard (Oct 15 revision): bigger and violent - dark storm core, fast thick wind bands, driving snow
// streaks, an edge of jagged ice spikes and frost cracks; ordinary enemies inside stay frozen.
function drawBlizzardGround(ctx,z,life,fade){const R=z.radius,seed=((z.x*3+z.y*11)|0);
 if(shaderFx()){light(ctx,z.x,z.y,R*1.1,'cryo',.4*fade);return;}
 radialGlow(ctx,z.x,z.y,R*1.05,[[0,'#1a3a5acc'],[.45,'#2a5a80aa'],[.85,'#4a90b866'],[1,'#4a90b800']],fade,.65);
 ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.65);ctx.lineCap='round';
 for(let i=0;i<7;i++){const r=R*(.2+.12*i),rot=life*(4.5-i*.35)+i*1.3;ctx.globalAlpha=fade*(.75-.07*i);ctx.strokeStyle=i%2?'#e8f8ff':'#9fd0e4';ctx.lineWidth=5-.5*i;ctx.beginPath();ctx.arc(0,0,r,rot,rot+1.9);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r,rot+Math.PI,rot+Math.PI+1.2);ctx.stroke();}
 ctx.globalAlpha=fade*.7;ctx.strokeStyle='#d8f2fb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
 const r=rng(seed);ctx.globalAlpha=fade*.45;ctx.lineWidth=1.3;for(let i=0;i<14;i++){const a=r()*TAU,l=R*(.3+.6*r());ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*l*.5+(r()-.5)*20,Math.sin(a)*l*.5+(r()-.5)*20);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);ctx.stroke();}
 ctx.restore();
 z.fxEdge??=(()=>{const rr=rng(seed+5),list=[];const n=Math.round(R/9);for(let i=0;i<n;i++){const a=i/n*TAU+rr()*.2,d=R*(.92+rr()*.12);list.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65,h:14+rr()*22,w:5+rr()*4,lean:Math.cos(a)*(6+rr()*8),delay:rr()*.25});}return list.sort((x,y)=>x.dy-y.dy);})();
 ctx.save();ctx.globalAlpha=fade;drawSpikes(ctx,z.x,z.y,z.fxEdge,life,z.spec.life+.2);ctx.restore();
 const fr=Math.floor(life*30),rr=rng(fr*7+seed);ctx.save();ctx.strokeStyle='#ffffff';ctx.lineCap='round';for(let i=0;i<26;i++){const q=randomIn(R*.95),x=z.x+q.dx,y=z.y+q.dy-rr()*90,len=16+rr()*22;ctx.globalAlpha=fade*(.35+.4*rr());ctx.lineWidth=1+rr()*1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len,y+len*.45);ctx.stroke();}ctx.restore();
 light(ctx,z.x,z.y,R*1.1,'cryo',.4*fade);}
// ---------- ground layer ----------
const LIGHT={pyro:'#ff8a2a',cryo:'#7fd3f2',storm:'#9d7bff',blood:'#d0284f',arcane:'#9fb4ff'};
function light(ctx,x,y,r,el,a){if(a<=.01)return;ctx.save();ctx.globalCompositeOperation='screen';radialGlow(ctx,x,y,r,[[0,LIGHT[el]??LIGHT.arcane],[1,(LIGHT[el]??LIGHT.arcane)+'00']],a,.6);ctx.restore();}
function drawLights(ctx,m){
 for(const b of m.projectiles)if(b.kind==='fireball')light(ctx,b.x,b.y,60,b.element,.55);
 for(const h of m.meteors){const t=clamp01(h.age/h.warning);light(ctx,h.x,h.y,h.radius*(.5+.8*t),'pyro',.25+.5*t*t);}
 for(const e of m.effects){const el=e.element??'arcane',t=e.age;
  if(e.kind==='surge'||e.kind==='glacial')light(ctx,e.x,e.y,(e.radius??80)*1.5,el,.75*(1-clamp01(t/.7)));
  else if(e.kind==='qnova')light(ctx,e.x,e.y,e.radius*1.1*easeOut(t/.4),el,.6*(1-clamp01(t/.8)));
  else if(e.kind==='zap')light(ctx,e.x,e.y,(e.radius??50)*1.6,el,.7*(1-clamp01(t/.35)));
  else if(e.kind==='chain')for(const [i,l] of e.lines.entries())light(ctx,l.toX,l.toY,70,el,.7*(1-clamp01((t-i*.045)/.45))*(t>=i*.045?1:0));
  else if(e.kind==='pulse'&&e.strikes)for(const s of e.strikes)light(ctx,e.x+s.dx,e.y+s.dy,90,el,.8*(1-clamp01(t/.35)));
  else if(e.kind==='blink')light(ctx,e.x,e.y,60,el,.5*(1-clamp01(t/e.duration)));}
 for(const z of m.zones)if(z.age>=z.warning)light(ctx,z.x,z.y,z.radius*1.1,z.spec.element,.22);
 if(m.ward)light(ctx,m.ward.x,m.ward.y,55,m.ward.element,.35);
 const c=m.cast;if(c&&c.kind!=='bolt'&&m.castOrigin&&c.spec?.element)light(ctx,m.castOrigin.x,m.castOrigin.y+38,50,c.spec.element,.4*clamp01(c.elapsed/(c.duration*.45)));
 for(const z of m.bloodZones??[])light(ctx,z.x,z.y,z.spec.radius,'blood',.25);
 for(const b of m.bloodProjectiles??[])light(ctx,b.x,b.y,50,'blood',.45);
}
export function drawSpellGround(ctx,m){
 drawLights(ctx,m);drawBasicLights(ctx,m);for(const r of m.rods??[]){const oc=r.oc>0;light(ctx,r.x,r.y-20,oc?170:100,'storm',(oc?.75:.45)*Math.min(1,r.age/.2,(r.life-r.age)/.3)*(.85+.15*Math.sin(r.age*23)));}for(const z of m.scorches??[])drawScorchGround(ctx,z);for(const ip of m.icePaths??[])drawIcePath(ctx,ip);drawBloodTrail(ctx,m);for(const b of m.bloodBlooms??[])if(!b.done)drawBloomPre(ctx,b);for(const e of m.effects)if(e.kind==='bloom')drawBloomGround(ctx,e);
 for(const h of m.meteors){const t=clamp01(h.age/h.warning),p=pal('pyro');
  radialGlow(ctx,h.x,h.y,h.radius*(.25+.6*t),[[0,'#1a0c06aa'],[1,'#1a0c0600']],.3+.5*t,.65);
  ctx.save();ctx.strokeStyle=p.glow;ctx.lineWidth=2.5;ctx.globalAlpha=.4+.4*Math.sin(h.age*18)**2;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius,h.radius*.65,0,0,TAU);ctx.stroke();
  ctx.globalAlpha=.85;ctx.strokeStyle=p.mid;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius*(1-t)+4,(h.radius*(1-t)+4)*.65,0,0,TAU);ctx.stroke();ctx.restore();}
 for(const z of m.zones){const p=pal(z.spec.element);
  if(z.age<z.warning){sigil(ctx,z.x,z.y,z.radius,clamp01(z.age/z.warning),z.age,p);continue;}
  const life=z.age-z.warning,fade=Math.min(1,life/.3)*(1-clamp01((life-z.spec.life+.4)/.4));
  if(z.spec.element==='cryo'){drawBlizzardGround(ctx,z,life,fade);continue;}if(shaderFx())continue;
  radialGlow(ctx,z.x,z.y,z.radius,z.spec.element==='cryo'?[[0,'#9fd0e466'],[.8,'#6cc0e044'],[1,'#6cc0e000']]:[[0,'#1e0f3a88'],[.8,'#2a165055'],[1,'#2a165000']],fade,.65);
  ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.65);ctx.rotate(life*(z.spec.element==='cryo'?1.6:-2.2));ctx.strokeStyle=z.spec.element==='cryo'?'#ffffff':p.mid;ctx.lineCap='round';
  for(let i=0;i<4;i++){const r=z.radius*(.35+.17*i);ctx.globalAlpha=fade*(.55-.08*i);ctx.lineWidth=2.5-.4*i;ctx.beginPath();ctx.arc(0,0,r,i*1.7,i*1.7+1.6);ctx.stroke();}
  ctx.globalAlpha=fade*.6;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,z.radius,0,TAU);ctx.stroke();ctx.restore();}
 for(const e of m.effects){const t=e.age,el=e.element??'arcane',p=pal(el);
  if(e.kind==='qnova'&&e.sfxInit){const R=e.radius*easeOut(t/.45),fade=1-clamp01((t-.5)/.5);
   if(el==='pyro'){if(!shaderFx())radialGlow(ctx,e.x,e.y,R,[[0,'#1d0d0600'],[.7,'#2a120844'],[.95,'#ff6a2066'],[1,'#ff6a2000']],fade,.65);}
   else if(el==='cryo'){if(!shaderFx())radialGlow(ctx,e.x,e.y,R,[[0,'#9fd0e455'],[.8,'#6cc0e044'],[1,'#6cc0e000']],fade,.65);}
   else if(!shaderFx())radialGlow(ctx,e.x,e.y,R,[[0,'#5a2fe000'],[.85,'#5a2fe033'],[1,'#5a2fe000']],fade,.65);}
  if(e.kind==='zap'&&e.sfxInit&&!shaderFx()){const k=clamp01(t/e.duration),R=(e.radius??50)*easeOut(k);ctx.save();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=p.mid;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.5,0,0,TAU);ctx.stroke();ctx.restore();}
  if(e.kind==='pulse'&&el==='storm'&&e.strikes&&!shaderFx()){const k=clamp01(t/.35);for(const s of e.strikes){radialGlow(ctx,e.x+s.dx,e.y+s.dy,14+30*k,[[0,'#ffffffcc'],[.4,'#9d7bff88'],[1,'#5a2fe000']],1-k,.5);}}
  if(e.kind==='blink'){const k=clamp01(t/e.duration),R=e.role==='from'?30*(1-k)+4:10+44*easeOut(k);ctx.save();ctx.globalAlpha=(1-k)*.85;ctx.strokeStyle=p.mid;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.5,0,0,TAU);ctx.stroke();ctx.restore();}
 }
 drawBloodGround(ctx,m);
}

// ---------- upper layer ----------
function drawProjectile(ctx,b){
 const x=b.x+shotDX(b),y=b.y-shotLift(b),c=Math.cos(b.angle),s=Math.sin(b.angle),el=b.element,p=pal(el);
 if(el==='pyro'){if(shaderFx())return;
  ctx.save();const tx=x-c*52,ty=y-s*52,g=ctx.createLinearGradient(x,y,tx,ty);g.addColorStop(0,p.core);g.addColorStop(.25,p.mid);g.addColorStop(.7,p.glow+'99');g.addColorStop(1,p.glow+'00');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x+s*11,y-c*11);ctx.quadraticCurveTo(x-c*22+s*8,y-s*22-c*8,tx,ty);ctx.quadraticCurveTo(x-c*22-s*8,y-s*22+c*8,x-s*11,y+c*11);ctx.closePath();ctx.fill();ctx.restore();
  radialGlow(ctx,x,y,17,[[0,'#fff6d8'],[.35,p.mid],[.7,p.glow+'88'],[1,p.glow+'00']],1);
  ctx.save();ctx.globalCompositeOperation='lighter';radialGlow(ctx,x,y,7,[[0,'#ffffff'],[1,'#ffcf6a00']],.9);ctx.restore();}
 else if(el==='cryo'){
  ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);ctx.globalAlpha=.5;const g=ctx.createLinearGradient(0,0,-60,0);g.addColorStop(0,'#c4f1ffcc');g.addColorStop(1,'#c4f1ff00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(-60,0);ctx.lineTo(0,3);ctx.fill();
  ctx.globalAlpha=1;ctx.fillStyle='#b4dcea';ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(0,-5);ctx.lineTo(-18,0);ctx.closePath();ctx.fill();ctx.fillStyle='#86cdea';ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(-18,0);ctx.lineTo(0,5);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(0,-5);ctx.lineTo(26,0);ctx.lineTo(0,5);ctx.closePath();ctx.stroke();ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';radialGlow(ctx,x+c*14,y+s*14,12,[[0,'#ffffff99'],[1,'#58c4ef00']],.8);ctx.restore();}
 else{
  const f=frame(b.remaining/400),seed=(b.remaining*7)|0;ctx.save();ctx.lineCap='round';
  glowStroke(ctx,boltPoints(seed,x,y,x-c*40,y-s*40,.3),33,.8,p,.5);
  for(let i=0;i<3;i++){const r=rng(seed+i*31+f),a=r()*TAU,d=10+r()*10;glowStroke(ctx,boltPoints(seed+i*91,x,y,x+Math.cos(a)*d,y+Math.sin(a)*d,.4),33,.85,p,.35);}
  radialGlow(ctx,x,y,14,[[0,'#ffffff'],[.35,p.mid+'dd'],[1,p.glow+'00']],1);ctx.restore();}
}
function drawWard(ctx,w){
 const p=pal(w.element),t=w.age,fade=Math.min(1,t/.2)*Math.min(1,w.remaining/.3);
 ctx.save();ctx.globalAlpha=fade*.5;ctx.strokeStyle=p.mid;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(w.x,w.y,32,13,0,0,TAU);ctx.stroke();ctx.restore();
 const n=w.element==='cryo'?4:3;
 for(let i=0;i<n;i++){const a=t*(w.element==='storm'?5:2.6)+i/n*TAU,x=w.x+Math.cos(a)*30,y=w.y-34+Math.sin(a)*13+Math.sin(t*5+i)*4;
  if(w.element==='pyro'){ctx.save();tongue(ctx,x,y+8,5,18+4*Math.sin(t*20+i),.85*fade,p);ctx.restore();radialGlow(ctx,x,y,9,[[0,p.core+'cc'],[1,p.glow+'00']],fade);}
  else if(w.element==='cryo'){ctx.save();ctx.globalAlpha=fade;ctx.translate(x,y);ctx.rotate(Math.sin(t*3+i)*.4);ctx.fillStyle='#b4dcea';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(4,0);ctx.lineTo(0,9);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#58b8e0';ctx.lineWidth=1;ctx.stroke();ctx.restore();radialGlow(ctx,x,y,10,[[0,'#c4f1ff88'],[1,'#58c4ef00']],fade);}
  else radialGlow(ctx,x,y,7,[[0,'#ffffff'],[.4,p.mid],[1,p.glow+'00']],fade);
 }
 if(w.element==='storm'){const f=Math.floor(t*12),r=rng(f*13+5);if(r()<.7){const a=r()*TAU,d=22+r()*14;ctx.save();ctx.lineCap='round';glowStroke(ctx,boltPoints(f*29,w.x,w.y-36,w.x+Math.cos(a)*d,w.y-36+Math.sin(a)*d*1.2,.4),33,fade*.9,p,.45);ctx.restore();}}
}
function drawQNova(ctx,e){
 const el=e.element,p=pal(el),t=e.age,R=e.radius*easeOut(t/.45),k=clamp01(t/.45),fade=1-clamp01((t-.35)/.4);
 if(t<.15)radialGlow(ctx,e.x,e.y-20,50+80*t/.15,[[0,'#ffffffcc'],[.3,p.mid+'aa'],[1,p.glow+'00']],(1-t/.15)*.9,.8);
 if(el==='pyro'){if(shaderFx())return;
  ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle=p.glow;ctx.lineWidth=10*(1-k)+3;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.strokeStyle=p.mid;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,e.y,R*.97,R*.63,0,0,TAU);ctx.stroke();ctx.restore();
  const r=rng(e.seed);for(let i=0;i<24;i++){const a=i/24*TAU+(r()-.5)*.2,h=(22+r()*24)*(1-k*.6),x=e.x+Math.cos(a)*R,y=e.y+Math.sin(a)*R*.65;tongue(ctx,x,y,6+r()*3,h*(1+.15*Math.sin(t*40+i)),fade*.9,p);}}
 else if(el==='cryo'){if(shaderFx())return;
  ctx.save();ctx.globalAlpha=fade*.9;ctx.strokeStyle='#58b8e0';ctx.lineWidth=5*(1-k)+1.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.strokeStyle='#d8f2fb';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R*.97,R*.63,0,0,TAU);ctx.stroke();ctx.restore();
  if(e.spikes){drawSpikes(ctx,e.x,e.y,e.spikes,t,.8);if(t>=.8&&!e.shattered)e.shattered=true;}}
 else{if(shaderFx())return;
  const f=frame(t),r=rng(e.seed+f*17),pts=[];for(let i=0;i<=56;i++){const a=i/56*TAU,j=i===56?pts[0]:null;if(j){pts.push(j);break;}const rr=R+(r()-.5)*14;pts.push([e.x+Math.cos(a)*rr,e.y-6+Math.sin(a)*rr*.65]);}
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';glowStroke(ctx,pts,pts.length,fade,p,.8);
  for(let i=0;i<6&&t<.4;i++){const a=r()*TAU;glowStroke(ctx,boltPoints(e.seed+f*7+i,e.x,e.y-BODY,e.x+Math.cos(a)*R,e.y-6+Math.sin(a)*R*.65,.25),33,(1-t/.4)*.8,p,.55);}ctx.restore();}
}
function drawMeteor(ctx,h){if(shaderFx())return;
 const q=clamp01(h.age/h.warning)**2,sc=h.scale??1,x=h.x+METEOR_FROM.x*(1-q)*sc,y=h.y+METEOR_FROM.y*(1-q)*sc-24*sc,p=pal('pyro'),dx=-METEOR_FROM.x,dy=-METEOR_FROM.y,n=Math.hypot(dx,dy),c=dx/n,s=dy/n,len=150*sc,w=20*sc;
 ctx.save();const tx=x-c*len,ty=y-s*len,g=ctx.createLinearGradient(x,y,tx,ty);g.addColorStop(0,p.core);g.addColorStop(.2,p.mid);g.addColorStop(.6,p.glow+'99');g.addColorStop(1,p.glow+'00');
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x+s*w,y-c*w);ctx.quadraticCurveTo(x-c*len*.4+s*w*.7,y-s*len*.4-c*w*.7,tx,ty);ctx.quadraticCurveTo(x-c*len*.4-s*w*.7,y-s*len*.4+c*w*.7,x-s*w,y+c*w);ctx.closePath();ctx.fill();ctx.restore();
 radialGlow(ctx,x,y,34*sc,[[0,'#ffe9a0cc'],[.4,'#ff9a2e88'],[1,'#d8380f00']],1);
 ctx.save();ctx.fillStyle='#3a2216';ctx.beginPath();ctx.arc(x,y,13*sc,0,TAU);ctx.fill();ctx.strokeStyle='#ffb347';ctx.lineWidth=2.2*sc;ctx.beginPath();ctx.arc(x,y,13*sc,-.6,2.2);ctx.stroke();
 ctx.strokeStyle='#ffcf6a';ctx.lineWidth=1.2*sc;ctx.beginPath();ctx.moveTo(x-6*sc,y-3*sc);ctx.lineTo(x+1*sc,y+1*sc);ctx.lineTo(x+5*sc,y-5*sc);ctx.moveTo(x+1*sc,y+1*sc);ctx.lineTo(x-1*sc,y+7*sc);ctx.stroke();ctx.restore();
}
function drawZoneUpper(ctx,z){
 if(z.age<z.warning||z.spec.element!=='storm'||shaderFx())return;
 const life=z.age-z.warning,fade=Math.min(1,life/.4)*(1-clamp01((life-z.spec.life+.4)/.4)),r=rng(7);
 for(let i=0;i<9;i++){const a=i/9*TAU+life*.25,d=z.radius*(.25+.5*r()),x=z.x+Math.cos(a)*d,y=z.y-210+Math.sin(a)*d*.35;radialGlow(ctx,x,y,46+r()*30,[[0,'#2a2140aa'],[.6,'#2a214055'],[1,'#2a214000']],fade*.75,.6);}
}
function drawPulse(ctx,e){if(shaderFx())return;
 if(e.element!=='storm'||!e.strikes)return;const p=pal('storm'),t=e.age;if(t>.3)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const [i,s] of e.strikes.entries()){const local=t-i*.06;if(local<0)continue;const x=e.x+s.dx,y=e.y+s.dy,grow=clamp01(local/.05),alpha=1-clamp01((local-.05)/.22),pts=boltPoints(e.seed+i*53+frame(t)*11,x+(rng(e.seed+i)()-.5)*60,y-230,x,y,.22);
  glowStroke(ctx,pts,Math.max(2,Math.ceil(pts.length*grow)),alpha,p,1.1);if(grow>=1)radialGlow(ctx,x,y-6,26,[[0,'#ffffff'],[.3,'#d9ccffcc'],[1,'#5a2fe000']],alpha);}
 ctx.restore();
}
function drawZap(ctx,e){if(shaderFx())return;
 const p=pal('storm'),t=e.age,k=clamp01(t/e.duration),big=(e.radius??50)>80,cy=e.y-(big?20:BODY);
 radialGlow(ctx,e.x,cy,(big?40:18)+(big?50:20)*k,[[0,'#ffffffee'],[.3,'#b9a0ffcc'],[1,'#5a2fe000']],(1-k)*.9);
 if(t>.25)return;const f=frame(t),r=rng(e.seed+f*19);ctx.save();ctx.lineCap='round';
 for(let i=0;i<(big?8:5);i++){const a=r()*TAU,d=(big?e.radius*.8:22)+r()*(big?20:20);glowStroke(ctx,boltPoints(e.seed+f*5+i,e.x,cy,e.x+Math.cos(a)*d,cy+Math.sin(a)*d*(big?.65:1),.35),33,1-t/.25,p,big?.6:.4);}
 ctx.restore();
}
function drawBlink(ctx,e){
 const p=pal(e.element),k=clamp01(e.age/e.duration);
 if(e.role==='from'){radialGlow(ctx,e.x,e.y-34,28*(1-k)+6,[[0,'#ffffffaa'],[.4,p.mid+'88'],[1,p.glow+'00']],1-k,1.4);}
 else{radialGlow(ctx,e.x,e.y-34,20+30*k,[[0,'#ffffffee'],[.3,p.mid+'cc'],[1,p.glow+'00']],(1-k),1.3);
  ctx.save();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=p.mid;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.y-34-60*(1-k));ctx.lineTo(e.x,e.y-34+30);ctx.stroke();ctx.restore();}
}
// ---------- Blood Mage (richer pass, Oct 15: user found the kit lacklustre) ----------
const BL=E_PALETTE.blood;
function tickBloodFx(m,dt){
 for(const b of m.bloodProjectiles??[]){const tr=b.fxTrail??=[];tr.push([b.x,b.y]);while(tr.length>10)tr.shift();if(Math.random()<.5)emit(m,{kind:'smoke',x:b.x,y:b.y,z:30,vx:(Math.random()-.5)*20,vz:10,life:.5,size:6,grow:14,color:'#5a0a1c'});}
 for(const e of m.effects){if(e.element!=='blood'||e.bloodInit)continue;e.bloodInit=true;
  if(e.kind==='bolt'){burst(m,e.x,e.y,30,'blood',14,{speed:[80,220],up:[40,160],life:[.35,.6],kind:'drop',g:420});m.bloodSplats=[...(m.bloodSplats??[]).slice(-14),{x:e.x,y:e.y,age:0,r:12+Math.random()*10,seed:(Math.random()*1e9)|0}];}
  if(e.kind==='nova'){for(let i=0;i<10;i++){const a=Math.random()*TAU;emit(m,{kind:'smoke',x:e.x+Math.cos(a)*20,y:e.y+Math.sin(a)*12,z:10,vx:Math.cos(a)*60,vy:Math.sin(a)*35,vz:20,drag:2,life:.8,size:12,grow:24,color:'#6e0b22'});}}}
 for(const sp of m.bloodSplats??[])sp.age+=dt;if(m.bloodSplats)m.bloodSplats=m.bloodSplats.filter(sp=>sp.age<2.5);
 // Eclipse: blood rain falls from the hovering eclipse into the pool.
 for(const z of m.bloodZones??[])if(Math.random()<.7){const q=randomIn(z.spec.radius*.9);emit(m,{kind:'drop',x:z.x+q.dx,y:z.y+q.dy,z:170+Math.random()*40,vz:-420,g:200,life:.6,size:1.6+Math.random()*1.2,color:BL.spark[1+(Math.random()*3|0)]});}
 // Drain: glowing blood is ripped from the target and flows to the caster.
 if(m.drain&&m.drainLine&&Math.random()<.6){const l=m.drainLine,a=Math.random()*TAU;emit(m,{kind:'mote',x:l.toX+Math.cos(a)*14,y:l.toY+Math.sin(a)*8,z:30+Math.random()*16,vx:(l.x-l.toX)/.8,vy:(l.y-l.toY)/.8,g:0,life:.8,size:2,rot:0,vr:4,color:'#e2475f'});}
 if(m.bloodVeil&&Math.random()<.35){const v=m.bloodVeil,a=Math.PI*(.15+.7*Math.random());emit(m,{kind:'drop',x:v.x+Math.cos(a)*40,y:v.y+Math.sin(a)*10,z:20+Math.random()*20,vz:-10,g:300,life:.5,size:1.8+Math.random(),color:'#8e1030'});}
}
function drawBloodGround(ctx,m){
 for(const sp of m.bloodSplats??[]){const f=1-clamp01((sp.age-1.5)/1),r=rng(sp.seed);ctx.save();ctx.globalAlpha=.55*f;ctx.fillStyle='#5a0a1c';ctx.beginPath();ctx.ellipse(sp.x,sp.y,sp.r,sp.r*.55,0,0,TAU);ctx.fill();for(let i=0;i<5;i++){const a=r()*TAU,d=sp.r*(1+r()*.8),q=2+r()*3;ctx.beginPath();ctx.ellipse(sp.x+Math.cos(a)*d,sp.y+Math.sin(a)*d*.55,q,q*.55,0,0,TAU);ctx.fill();}ctx.restore();}
 for(const z of m.bloodZones??[])drawBloodPool(ctx,z);
}
function drawEclipse(ctx,z){if(shaderFx())return;const fade=Math.min(1,z.age/.4)*(1-clamp01((z.age-z.spec.life)/.5)),x=z.x,y=z.y-190,t=z.age,R=34;
 const g=ctx.createLinearGradient(x,y,x,z.y);g.addColorStop(0,'#d0284f55');g.addColorStop(1,'#d0284f00');ctx.save();ctx.globalAlpha=fade*.5;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-R*.6,y);ctx.lineTo(x+R*.6,y);ctx.lineTo(x+z.spec.radius*.5,z.y);ctx.lineTo(x-z.spec.radius*.5,z.y);ctx.closePath();ctx.fill();ctx.restore();
 radialGlow(ctx,x,y,R*3,[[0,'#ff3a5a00'],[.35,'#d0284f88'],[.6,'#7a0c2644'],[1,'#7a0c2600']],fade);
 ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#ff6a80';ctx.lineWidth=2;ctx.lineCap='round';for(let i=0;i<12;i++){const a=i/12*TAU+t*.5,l=R*(1.3+.3*Math.sin(t*4+i));ctx.beginPath();ctx.moveTo(x+Math.cos(a)*R*1.08,y+Math.sin(a)*R*1.08);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}
 ctx.fillStyle='#0c0206';ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.fill();ctx.strokeStyle='#ff8a9a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.stroke();ctx.restore();}
function drawBloodNova(ctx,e){if(shaderFx())return;
 const k=clamp01(e.age/e.duration),R=(e.radius??90)*easeOut(k);
 radialGlow(ctx,e.x,e.y-24,40+40*k,[[0,'#ffd6dccc'],[.35,'#d0284f99'],[1,'#7a0c2600']],(1-k)*.9,.9);
 ctx.save();for(const [w,c,al] of [[12*(1-k)+3,'#6e0b22',.8],[5*(1-k)+2,'#d0284f',1],[1.5,'#ff8a9a',1]]){ctx.globalAlpha=(1-k)*al;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();}ctx.restore();
}
function drawBloodLance(ctx,b){
 const L=shotLift(b),x=b.x+shotDX(b),y=b.y-L,tr=b.fxTrail??[],q=b.remaining??0;
 ctx.save();ctx.lineCap='round';for(let i=1;i<tr.length;i++){const f=i/tr.length,[x1,y1]=tr[i-1],[x2,y2]=tr[i];ctx.globalAlpha=f*.8;ctx.strokeStyle=f>.5?'#d0284f':'#6e0b22';ctx.lineWidth=12*f;ctx.beginPath();ctx.moveTo(x1,y1-L);ctx.lineTo(x2,y2-L);ctx.stroke();}ctx.restore();
 radialGlow(ctx,x,y,30,[[0,'#ffd6dccc'],[.35,'#d0284f99'],[1,'#7a0c2600']],1);
 ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);
 for(let i=0;i<2;i++){ctx.strokeStyle=i?'#e2475f':'#ff8a9a';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(0,0);for(let j=1;j<=8;j++)ctx.lineTo(-j*7,Math.sin(j*.9+q*.1+i*Math.PI)*6);ctx.stroke();}
 ctx.globalAlpha=1;ctx.fillStyle='#ffe0e6';ctx.beginPath();ctx.moveTo(38,0);ctx.lineTo(-4,-8);ctx.lineTo(2,0);ctx.lineTo(-4,8);ctx.closePath();ctx.fill();
 ctx.fillStyle='#a8173a';ctx.beginPath();ctx.moveTo(38,0);ctx.lineTo(2,0);ctx.lineTo(-4,8);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#5a0a1c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(38,0);ctx.lineTo(-4,-8);ctx.lineTo(2,0);ctx.lineTo(-4,8);ctx.closePath();ctx.stroke();ctx.restore();
}
// Veil (Oct 15 rework): a wobbling bubble of blood around the caster. Far half: liquid fill, inner currents
// and pooled blood at the feet; near half (after the body): thin film, glossy highlight, rim and drips.
function veilPath(ctx,cx,cy,rx,ry,t){ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,w=1+.045*Math.sin(3*a+t*4)+.03*Math.sin(5*a-t*3),x=cx+Math.cos(a)*rx*w,y=cy+Math.sin(a)*ry*w;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
function drawVeilHalf(ctx,v,front){const t=v.remaining,cx=v.x,cy=v.y-40,rx=46,ry=60,pulse=.9+.1*Math.sin(t*6);
 ctx.save();
 if(!front){
  radialGlow(ctx,cx,cy,ry*1.15,[[0,'#7a0c2600'],[.75,'#c0123c33'],[1,'#c0123c00']],pulse,rx/ry*1.3);
  const g=ctx.createRadialGradient(cx-10,cy-14,6,cx,cy,ry);g.addColorStop(0,'#5a0a1c22');g.addColorStop(.7,'#8e10304d');g.addColorStop(.93,'#c0123caa');g.addColorStop(1,'#ff4a6acc');
  ctx.fillStyle=g;veilPath(ctx,cx,cy,rx,ry,t);ctx.fill();
  ctx.lineCap='round';for(let i=0;i<3;i++){const a=t*(1.4+i*.3)+i*2.1;ctx.globalAlpha=.45;ctx.strokeStyle=i%2?'#6e0b22':'#a8173a';ctx.lineWidth=5-i;ctx.beginPath();ctx.ellipse(cx,cy+6,rx*(.55+i*.12),ry*(.35+i*.1),i*.6,a,a+1.6);ctx.stroke();}
  ctx.globalAlpha=.75;ctx.fillStyle='#5a0a1c';ctx.beginPath();ctx.ellipse(cx,v.y-2,rx*.9,rx*.32,0,0,TAU);ctx.fill();ctx.globalAlpha=.6;ctx.strokeStyle='#d0284f';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,v.y-2,rx*.9*(.6+.4*((t*1.5)%1)),rx*.32*(.6+.4*((t*1.5)%1)),0,0,TAU);ctx.stroke();
 }else{
  ctx.fillStyle='#c0123c1c';veilPath(ctx,cx,cy,rx,ry,t);ctx.fill();
  ctx.globalAlpha=.9*pulse;ctx.strokeStyle='#ff4a6a';ctx.lineWidth=3;veilPath(ctx,cx,cy,rx,ry,t);ctx.stroke();ctx.globalAlpha=.35;ctx.strokeStyle='#7a0c26';ctx.lineWidth=7;veilPath(ctx,cx,cy,rx+3,ry+3,t);ctx.stroke();
  ctx.globalAlpha=.7;ctx.strokeStyle='#ffd6e0';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(cx,cy,rx*.78,ry*.82,0,-2.55,-1.75);ctx.stroke();ctx.globalAlpha=.45;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(cx,cy,rx*.66,ry*.72,0,-2.4,-2.05);ctx.stroke();
  for(let i=0;i<4;i++){const q=(t*.45+i*.25)%1,a=-.9+i*.6,x=cx+Math.cos(a)*rx*.85,y=cy-ry*.55+q*ry*1.35;ctx.globalAlpha=Math.sin(q*Math.PI)*.85;ctx.fillStyle='#a8173a';ctx.beginPath();ctx.ellipse(x,y,2.4,3.6,0,0,TAU);ctx.fill();}
 }
 ctx.restore();}
// Drain (Oct 15 rework): a thick neon blood beam - wide halo, saturated tube, hot additive core, energy pulses
// flowing target->caster, twisting strands and bright end caps. Visual only; the hit width is unchanged.
function drawDrainFx(ctx,m){const l=m.drainLine;if(!m.drain||!l)return;const H=heroAnchor(m),t=m.drain.elapsed,sx=H?H.x:l.x,sy=H?H.y:l.y-38,ex=l.toX,ey=l.toY-32,len=Math.hypot(ex-sx,ey-sy)||1,nx=-(ey-sy)/len,ny=(ex-sx)/len,pw=1+.12*Math.sin(t*22);
 light(ctx,(sx+ex)/2,(sy+ey)/2+34,len*.6,'blood',.45);if(shaderFx())return;
 ctx.save();ctx.lineCap='round';
 for(const [w,c,a] of [[50,'#7a0c26',.2],[32,'#c0123c',.32],[19,'#ff2a55',.78],[10,'#ff7a95',.95]]){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w*pw;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();}
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85;ctx.strokeStyle='#ffd6e0';ctx.lineWidth=4*pw;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalCompositeOperation='source-over';
 for(let k=0;k<2;k++){ctx.strokeStyle=k?'#ffb0c0':'#6e0b22';ctx.lineWidth=2.5;ctx.globalAlpha=.8;ctx.beginPath();for(let i=0;i<=30;i++){const f=i/30,o=Math.sin(f*len*.05-t*16+k*Math.PI)*15*Math.sin(f*Math.PI),x=sx+(ex-sx)*f+nx*o,y=sy+(ey-sy)*f+ny*o;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 ctx.restore();
 for(let i=0;i<6;i++){const q=(t*1.6+i/6)%1,x=ex+(sx-ex)*q,y=ey+(sy-ey)*q;radialGlow(ctx,x,y,15,[[0,'#ffffff'],[.35,'#ff7a95cc'],[1,'#c0123c00']],Math.sin(q*Math.PI));}
 radialGlow(ctx,sx,sy,40+6*Math.sin(t*12),[[0,'#ffe0e8ee'],[.3,'#ff4a6aaa'],[1,'#7a0c2600']],1);
 radialGlow(ctx,ex,ey,34,[[0,'#ffd6e0cc'],[.35,'#ff2a5588'],[1,'#7a0c2600']],1);
 ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle='#ff4a6a';ctx.lineWidth=2;const q=(t*2)%1;ctx.beginPath();ctx.ellipse(ex,ey,10+24*q,(10+24*q)*.6,0,0,TAU);ctx.globalAlpha=(1-q)*.8;ctx.stroke();ctx.restore();}

// ---------- LMB basics (all six weapon patterns) ----------
// Coloured by the chosen path (user decision Oct 15); arcane only without a path. Visual only.
let BASIC='arcane';
const BOLT_LOOK={staff:{head:12,trail:10,len:1},wand:{head:5,trail:3,len:1.4},spellbook:{head:7,trail:5,len:.8},grimoire:{head:8,trail:5,len:1.2},embers:{head:8,trail:6,len:1.1}};
function drawBolt(ctx,b){
 const look=BOLT_LOOK[b.primary]??BOLT_LOOK.staff,p=pal(BASIC),a=b.secondary?.65:1,L=shotLift(b),x=b.x+shotDX(b),y=b.y-L,trail=b.fxTrail??[];
 ctx.save();ctx.lineCap='round';
 for(let i=1;i<trail.length;i++){const f=i/trail.length,[x1,y1]=trail[i-1],[x2,y2]=trail[i];ctx.globalAlpha=a*f*.75;ctx.strokeStyle=f>.6?p.mid:p.glow;ctx.lineWidth=look.trail*f;ctx.beginPath();ctx.moveTo(x1,y1-L);ctx.lineTo(x2,y2-L);ctx.stroke();}
 if(trail.length){const [lx,ly]=trail.at(-1);ctx.globalAlpha=a*.85;ctx.strokeStyle=p.mid;ctx.lineWidth=look.trail;ctx.beginPath();ctx.moveTo(lx,ly-L);ctx.lineTo(x,y);ctx.stroke();}
 ctx.restore();
 radialGlow(ctx,x,y,look.head*2.2,[[0,'#ffffff'],[.3,p.mid+'cc'],[.7,p.glow+'55'],[1,p.glow+'00']],a);
 ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);ctx.globalAlpha=a;
 if(b.primary==='spellbook'){ctx.rotate((b.remaining??0)*.04);ctx.fillStyle='#efe9ff';ctx.strokeStyle=p.glow;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(look.head,0);ctx.lineTo(0,-look.head*.6);ctx.lineTo(-look.head,0);ctx.lineTo(0,look.head*.6);ctx.closePath();ctx.fill();ctx.stroke();}
 else{ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(0,0,look.head*look.len,look.head*.42,0,0,TAU);ctx.fill();}
 ctx.restore();
 if(b.primary==='grimoire'||b.primary==='staff'||b.primary==='icestaff'||b.primary==='stormstaff'){const t=(b.remaining??0)*.05,r=look.head*1.3;for(let i=0;i<2;i++){const q=t+i*Math.PI;radialGlow(ctx,x+Math.cos(q)*r,y+Math.sin(q)*r*.6,3.5,[[0,'#ffffff'],[1,p.mid+'00']],a);}}
}
function drawArcHit(ctx,e){
 const p=pal(BASIC),k=clamp01(e.age/e.duration),s=(e.small?.6:(BOLT_LOOK[e.primary]??BOLT_LOOK.staff).head/9)*(e.crit?1.6:1);
 if(e.crit){ctx.save();ctx.globalAlpha=(1-k);ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5*(1-k)+.5;for(const a of [.785,-.785]){const L=(10+30*easeOut(k))*s;ctx.beginPath();ctx.moveTo(e.x-Math.cos(a)*L,e.y-30-Math.sin(a)*L);ctx.lineTo(e.x+Math.cos(a)*L,e.y-30+Math.sin(a)*L);ctx.stroke();}ctx.restore();}
 radialGlow(ctx,e.x,e.y-30,(14+16*k)*s,[[0,'#ffffffee'],[.35,p.mid+'aa'],[1,p.glow+'00']],(1-k));
 ctx.save();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=p.mid;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-30,(6+26*easeOut(k))*s,(6+26*easeOut(k))*s*.8,0,0,TAU);ctx.stroke();ctx.restore();
}
function drawArcanePulse(ctx,e){
 const p=pal(BASIC),t=e.age,k=clamp01(t/.32),R=e.radius*easeOut(k),fade=1-clamp01((t-.2)/(e.duration-.2));
 if(t<.12)radialGlow(ctx,e.x,e.y-26,40+50*t/.12,[[0,'#ffffffcc'],[.35,p.mid+'99'],[1,p.glow+'00']],(1-t/.12),.9);
 ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle=p.glow;ctx.lineWidth=8*(1-k)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();
 ctx.strokeStyle='#efe9ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R*.97,R*.63,0,0,TAU);ctx.stroke();ctx.restore();
 if(R>10)sigil(ctx,e.x,e.y,R*.8,fade,t*1.5,p);
}
function drawBeam(ctx,m){
 const beam=m.beam;if(!beam)return;const p=pal(BASIC),t=beam.age??0,w=(beam.width??6)/6;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const [li,l] of (beam.lines??[beam]).entries()){
  const H=heroAnchor(m),sx=H?H.x:l.x,sy=H?H.y:l.y-30,ex=l.toX,ey=l.toY-30,/* Oct 17: starts at the 3D Mage's weapon hand */len=Math.hypot(ex-sx,ey-sy)||1,nx=-(ey-sy)/len,ny=(ex-sx)/len,n=Math.max(6,Math.ceil(len/14)),pts=[];
  for(let i=0;i<=n;i++){const f=i/n,o=Math.sin(f*len*.08-t*38+li)*3*Math.sin(f*Math.PI)*w;pts.push([sx+(ex-sx)*f+nx*o,sy+(ey-sy)*f+ny*o]);}
  glowStroke(ctx,pts,pts.length,.95,p,w*1.1);
  for(let i=0;i<5;i++){const f=((t*2.4+i/5)%1),x=sx+(ex-sx)*f,y=sy+(ey-sy)*f;radialGlow(ctx,x,y,6*w,[[0,'#ffffff'],[1,p.mid+'00']],.9);}
  radialGlow(ctx,ex,ey,(16+4*Math.sin(t*40))*w,[[0,'#ffffff'],[.35,p.mid+'cc'],[1,p.glow+'00']],1);
  radialGlow(ctx,sx,sy,11*w,[[0,'#ffffff'],[1,p.mid+'00']],.9);
 }
 ctx.restore();
}
// LMB casts have no body animation. Each cast instead releases a few glowing particles that spiral
// around the body (stored relative to the Mage so they follow him) and fade within ~.5s, so they only
// show while he is actually casting. No hard flashes/rings: at Wand rates those strobed.
const ORBIT_CAP=48;
function spawnOrbit(m,count){const list=m.orbitFx??=[],colors=pal(BASIC).spark;for(let i=0;i<count&&list.length<ORBIT_CAP;i++){const life=.35+Math.random()*.25;list.push({a:Math.random()*TAU,r:16+Math.random()*10,z:14+Math.random()*30,va:(Math.random()<.5?-1:1)*(7+Math.random()*4),vz:30+Math.random()*40,vr:-12,life,max:life,size:1.4+Math.random()*1.2,color:colors[1+(i%3)]});}}
function tickOrbit(m,dt){
 for(const e of m.effects)if(e.kind==='lmbCast'&&!e.lmbInit){e.lmbInit=true;const busy=(m.orbitFx?.length??0)>24;spawnOrbit(m,busy?3:6);}
 if(m.beam){m.beamOrbit=(m.beamOrbit??0)-dt;if(m.beamOrbit<=0){m.beamOrbit=.09;spawnOrbit(m,1);}}
 const list=m.orbitFx??[];for(let i=list.length-1;i>=0;i--){const o=list[i];o.life-=dt;if(o.life<=0){list.splice(i,1);continue;}o.a+=o.va*dt;o.z+=o.vz*dt;o.r=Math.max(6,o.r+o.vr*dt);}
}
function drawOrbit(ctx,m,front){
 const list=m.orbitFx;if(!list?.length||!m.auraPos)return;const {x,y}=m.auraPos,p=pal(BASIC);ctx.save();ctx.lineCap='round';
 for(const o of list){if((Math.sin(o.a)>=0)!==front)continue;const f=o.life/o.max,alpha=Math.min(1,f*2.5)*Math.min(1,(1-f)*8),px=x+Math.cos(o.a)*o.r,py=y-o.z+Math.sin(o.a)*o.r*.4;
  const back=o.a-Math.sign(o.va)*.5,bx=x+Math.cos(back)*o.r,by=y-o.z+3+Math.sin(back)*o.r*.4;
  ctx.globalAlpha=alpha*.55;ctx.strokeStyle=o.color;ctx.lineWidth=o.size;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(px,py);ctx.stroke();
  radialGlow(ctx,px,py,o.size*3,[[0,'#ffffff'],[.35,p.mid+'cc'],[1,p.glow+'00']],alpha);}
 ctx.restore();
}
// Front pass (after the body) draws the near half of the orbit; the upper pass draws the far half.
export function drawBasicHand(ctx,m,front=true){drawOrbit(ctx,m,front);if(m.bloodVeil)drawVeilHalf(ctx,m.bloodVeil,front);}
export function tickBasicFx(m,dt){
 BASIC=m.basicElement??'arcane';
 tickOrbit(m,dt);
 // Slight body glow while casting basics: eases in fast, fades out over ~.4s after the last shot.
 const glowTarget=m.cast?.kind==='bolt'||m.beam?1:0,g=m.castGlow??0;m.castGlow=g+(glowTarget-g)*(1-Math.exp(-dt*(glowTarget>g?14:4)));
 for(const b of m.projectiles){if(b.kind!=='bolt')continue;const tr=b.fxTrail??=[];tr.push([b.x,b.y]);const max=Math.round(8*(BOLT_LOOK[b.primary]??BOLT_LOOK.staff).len);while(tr.length>max)tr.shift();}
 for(const e of m.effects){if(e.basicInit)continue;
  if(e.kind==='arcHit'){e.basicInit=true;if(e.crit)m.shake=Math.max(m.shake??0,1.4);burst(m,e.x,e.y,30,BASIC,e.small?3:e.crit?16:7,{speed:[60,200],up:[-20,100],life:[.15,.35],size:[1,2.2],g:100});}
  else if(e.kind==='apulse'){e.basicInit=true;if(!e.follow)for(let i=0;i<36;i++){const a=i/36*TAU,s=e.radius*1.8*(.8+.4*Math.random());emit(m,{kind:'spark',x:e.x,y:e.y,z:12+Math.random()*24,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.65,vz:Math.random()*40,g:0,drag:2.6,life:.35+Math.random()*.25,size:1.2+Math.random()*1.6,color:pal(BASIC).spark[i%4]});}}}
 if(m.beam&&Math.random()<.4){const l=m.beam,f=.15+Math.random()*.85;burst(m,l.x+(l.toX-l.x)*f,l.y+(l.toY-l.y)*f,30,BASIC,1,{speed:[20,70],up:[10,60],life:[.2,.4],size:[1,2],g:40});}
}
export function drawBasicUpper(ctx,m){
 BASIC=m.basicElement??'arcane';
 if(m.bloodVeil)drawVeilHalf(ctx,m.bloodVeil,false);
 if((m.castGlow??0)>.02&&m.auraPos){const p=pal(BASIC);radialGlow(ctx,m.auraPos.x,m.auraPos.y-36,40,[[0,p.mid+'00'],[.6,p.mid+'40'],[1,p.glow+'00']],m.castGlow*.9,1.35);}
 drawOrbit(ctx,m,false);
 for(const e of m.effects){if(e.kind==='apulse'&&!e.follow)drawArcanePulse(ctx,e);else if(e.kind==='arcHit')drawArcHit(ctx,e);}
 for(const b of m.projectiles)if(b.kind==='bolt'&&b.primary!=='tesla')drawBolt(ctx,b);
 drawBeam(ctx,m);
}
export function drawBasicLights(ctx,m){
 BASIC=m.basicElement??'arcane';
 if((m.castGlow??0)>.02&&m.auraPos)light(ctx,m.auraPos.x,m.auraPos.y,48,BASIC,.28*m.castGlow);
 for(const b of m.projectiles)if(b.kind==='bolt')light(ctx,b.x,b.y,(BOLT_LOOK[b.primary]??BOLT_LOOK.staff).head*4,BASIC,.4);
 for(const e of m.effects){if(e.kind==='arcHit')light(ctx,e.x,e.y,e.small?30:50,BASIC,.5*(1-clamp01(e.age/e.duration)));else if(e.kind==='apulse'){const o=e.follow&&m.auraPos?m.auraPos:e;light(ctx,o.x,o.y,e.radius*easeOut(e.age/.3),BASIC,.5*(1-clamp01(e.age/e.duration)));}}
 if(m.beam)for(const l of m.beam.lines??[m.beam])light(ctx,l.toX,l.toY,55,BASIC,.55);
}

// ---------- Oct 15 kit mechanics: ice road, meteor scorch, burning/frozen enemies, Crimson Bloom, blood trails ----------
// Ice Road look (Oct 15 revision): soft overlapping frost blooms instead of a hard-edged strip, faint cracks,
// sparse small crystals and drifting mist, so the ice blends into the sand.
function iceShards(ip){const r=rng(ip.seed),list=[],ca=Math.cos(ip.angle),sa=Math.sin(ip.angle);for(let d=24;d<ip.max;d+=40){const side=r()<.5?-1:1,w=ip.width/2*(.35+.5*r());list.push({d,dx:ca*d-sa*w*side,dy:(sa*d+ca*w*side)*.85,h:6+r()*9,w:3+r()*2.5,lean:-sa*side*3,delay:d/ip.speed});}return list.sort((a,b)=>a.dy-b.dy);}
function drawIcePath(ctx,ip){if(ip.len<4||shaderFx())return;ip.seed??=(Math.random()*1e9)|0;ip.shards??=iceShards(ip);const fade=1-clamp01((ip.age-ip.life+.6)/.6),w=ip.width/2,L=ip.len,ca=Math.cos(ip.angle),sa=Math.sin(ip.angle),r=rng(ip.seed);
 for(let d=0;d<=L;d+=20){const j=(r()-.5)*w*.5,x=ip.x+ca*d-sa*j,y=ip.y+sa*d+ca*j,rad=w*(.8+.35*r())*(d<24?.65:1);radialGlow(ctx,x,y,rad,[[0,'#d4f0fa55'],[.5,'#8fd3ee30'],[1,'#4aa8d800']],fade,.62);}
 ctx.save();ctx.strokeStyle='#e8f8ff';ctx.lineWidth=1;ctx.globalAlpha=.22*fade;for(let i=0;i<Math.floor(L/30);i++){const d=i*30+r()*15,o=(r()-.5)*w*1.1,x=ip.x+ca*d-sa*o,y=ip.y+sa*d+ca*o,a2=ip.angle+(r()-.5)*1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a2)*14,y+Math.sin(a2)*9);ctx.stroke();}ctx.restore();
 if(!ip.done)radialGlow(ctx,ip.x+ca*L,ip.y+sa*L,w*.9,[[0,'#e2f6ff99'],[.4,'#7fd3f255'],[1,'#4aa8d800']],1,.7);
 const visible=ip.shards.filter(sh=>sh.d<=L);if(!ip.fxVisibleShards||visible.length!==ip.fxVisibleShards.length||visible.some((s,i)=>s!==ip.fxVisibleShards[i]))ip.fxVisibleShards=visible;
 ctx.save();ctx.globalAlpha=.85*fade;drawSpikes(ctx,ip.x,ip.y,ip.fxVisibleShards,ip.age,ip.life-.3);ctx.restore();}
function drawScorchGround(ctx,z){const fade=1-clamp01((z.age-z.life)/.6),r=rng(((z.x*31+z.y*17)|0)),R=z.radius;
 if(shaderFx()){light(ctx,z.x,z.y,R*1.1,'pyro',.4*fade*(z.age<z.life?1:0));return;}
 radialGlow(ctx,z.x,z.y,R,[[0,'#140804dd'],[.6,'#2a120899'],[.9,'#3a1a0c55'],[1,'#3a1a0c00']],fade,.65);
 ctx.save();ctx.strokeStyle='#ff7a2a';ctx.lineCap='round';for(let i=0;i<10;i++){const a=i/10*TAU+r()*.5,len=R*(.4+.5*r());let x=z.x,y=z.y;ctx.globalAlpha=fade*(.55+.45*Math.sin(z.age*7+i*1.3));ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(x,y);for(let j=1;j<=4;j++){const d=len*j/4,aa=a+(r()-.5)*.5;x=z.x+Math.cos(aa)*d;y=z.y+Math.sin(aa)*d*.65;ctx.lineTo(x,y);}ctx.stroke();}ctx.restore();
 light(ctx,z.x,z.y,R*1.1,'pyro',.4*fade*(z.age<z.life?1:0));}
function drawScorchFlames(ctx,z){if(z.age>z.life)return;const r=rng(((z.x*13+z.y*7)|0)),fade=Math.min(1,z.age/.3)*Math.min(1,(z.life-z.age)/.5),pal=E_PALETTE.pyro;
 for(let i=0;i<9;i++){const a=r()*TAU,d=z.radius*Math.sqrt(r())*.85,x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d*.65;tongue(ctx,x,y,6+r()*4,(18+r()*16)*(.8+.3*Math.sin(z.age*12+i*2)),.8*fade,pal);}}
function drawStatusBack(ctx,m){let n=0;const t=m.shakeT??0;for(const e of m.fxTargets??[]){if(e.state!=='alive'||n>40)continue;const s=e.scale??1.25;
 if(e.burn){n++;const pal=E_PALETTE.pyro;for(let i=0;i<4;i++){const a=i/4*TAU+t*2,x=e.x+Math.cos(a)*12*s,y=e.y+Math.sin(a)*5*s;tongue(ctx,x,y,5*s,(16+8*Math.sin(t*14+i*2+(e.id??0)))*s,.75,pal);}tongue(ctx,e.x,e.y-8*s,7*s,(34+8*Math.sin(t*10+(e.id??0)))*s,.55,pal);}
 else if(e.freeze>0&&!shaderFx()){n++;for(let i=0;i<3;i++){const a=i/3*TAU+(e.id??0),x=e.x+Math.cos(a)*14*s,y=e.y+Math.sin(a)*6*s;ctx.save();ctx.fillStyle='#b4dcea';ctx.strokeStyle='#e2f6ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-5*s,y);ctx.lineTo(x+Math.cos(a)*3,y-22*s);ctx.lineTo(x+5*s,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}radialGlow(ctx,e.x,e.y-30*s,36*s,[[0,'#9fd0e455'],[1,'#4aa8d800']],1,1.3);}}}
function drawBloomPre(ctx,b){const k=clamp01(b.age/b.delay),R=b.spec.radius;if(shaderFx())return;radialGlow(ctx,b.x,b.y,R*(.3+.7*k),[[0,'#3c0a1ccc'],[.7,'#7a0c2677'],[1,'#7a0c2600']],1,.65);sigil(ctx,b.x,b.y,R,k,b.age*4,E_PALETTE.blood);ctx.save();ctx.strokeStyle='#ff4a6a';ctx.lineWidth=2.5;ctx.globalAlpha=.9;ctx.beginPath();ctx.ellipse(b.x,b.y,R*(1-k)+6,(R*(1-k)+6)*.65,0,0,TAU);ctx.stroke();ctx.restore();}
function drawBloomGround(ctx,e){const k=clamp01(e.age/e.duration),R=e.radius;if(shaderFx()){light(ctx,e.x,e.y,R*1.2,'blood',.6*(1-k));return;}radialGlow(ctx,e.x,e.y,R,[[0,'#3c0a1cdd'],[.6,'#6e0b2299'],[1,'#7a0c2600']],1-k*k,.65);light(ctx,e.x,e.y,R*1.2,'blood',.6*(1-k));}
function drawBloomSpikes(ctx,e){if(shaderFx())return;const t=e.age,R=e.radius,r=rng(((e.x*7+e.y*3)|0)),pal={core:'#ffd6e0',mid:'#d0284f',glow:'#5a0a1c'};
 if(t<.2)radialGlow(ctx,e.x,e.y-20,R*(.5+t*2),[[0,'#ffd6e0cc'],[.3,'#ff2a5599'],[1,'#7a0c2600']],1-t/.2,.8);
 for(let i=0;i<16;i++){const a=r()*TAU,d=R*Math.sqrt(r())*.9,delay=d/R*.12,q=(t-delay)/.45;if(q<=0||q>=1)continue;const h=(30+r()*34)*Math.sin(Math.PI*Math.min(1,q*1.6))*(1-q*.3);tongue(ctx,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.65,5+r()*4,h,.95,pal);}
 const q=clamp01(t/.5);if(q<1){ctx.save();ctx.globalAlpha=1-q;ctx.strokeStyle='#d0284f';ctx.lineWidth=10*(1-q)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R*easeOut(q),R*easeOut(q)*.65,0,0,TAU);ctx.stroke();ctx.restore();}}
// Blood Eclipse pool (Oct 15 revision): an irregular, wobbling pool of liquid blood - dark depths, glossy
// surface highlights, rolling ripples, rain splash rings and popping bubbles - instead of a flat disc + sigil.
function poolPath(ctx,x,y,R,t,seed){const r=rng(seed),k=[r()*TAU,r()*TAU,r()*TAU];ctx.beginPath();for(let i=0;i<=56;i++){const a=i/56*TAU,w=1+.07*Math.sin(3*a+k[0]+t*.8)+.05*Math.sin(5*a+k[1]-t*1.1)+.035*Math.sin(9*a+k[2]+t*1.7),px=x+Math.cos(a)*R*w,py=y+Math.sin(a)*R*w*.62;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawBloodPool(ctx,z){const R=z.spec.radius,grow=easeOut(Math.min(1,z.age/.5)),fade=1-clamp01((z.age-z.spec.life)/.5),t=z.age,seed=((z.x*7+z.y*13)|0),Rg=R*grow;if(fade<=0)return;if(shaderFx()){light(ctx,z.x,z.y,R*1.1,'blood',.3*fade);return;}
 ctx.save();ctx.globalAlpha=fade;
 ctx.fillStyle='#3a0612';poolPath(ctx,z.x,z.y+4,Rg*1.04,t,seed);ctx.fill();
 const g=ctx.createRadialGradient(z.x-Rg*.2,z.y-Rg*.12,Rg*.1,z.x,z.y,Rg);g.addColorStop(0,'#7a0c26');g.addColorStop(.55,'#5a0a1c');g.addColorStop(.9,'#3c0612');g.addColorStop(1,'#2a040c');ctx.fillStyle=g;poolPath(ctx,z.x,z.y,Rg,t,seed);ctx.fill();
 ctx.lineWidth=2.5;ctx.strokeStyle='#a8173a';ctx.globalAlpha=fade*.8;poolPath(ctx,z.x,z.y,Rg,t,seed);ctx.stroke();
 ctx.strokeStyle='#d0284f';ctx.lineWidth=1.6;for(let i=0;i<3;i++){const q=(t*.55+i/3)%1;ctx.globalAlpha=fade*(1-q)*.55;ctx.beginPath();ctx.ellipse(z.x,z.y,Rg*q,Rg*q*.62,0,0,TAU);ctx.stroke();}
 ctx.strokeStyle='#ffb0c0';ctx.lineCap='round';ctx.globalAlpha=fade*.5;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(z.x-Rg*.15,z.y-Rg*.1,Rg*.55,Rg*.55*.62,0,-2.6,-1.9);ctx.stroke();ctx.lineWidth=1.6;ctx.globalAlpha=fade*.35;ctx.beginPath();ctx.ellipse(z.x+Rg*.2,z.y+Rg*.05,Rg*.35,Rg*.35*.62,0,-.9,-.4);ctx.stroke();
 const r=rng(seed+Math.floor(t*3));for(let i=0;i<5;i++){const a=r()*TAU,d=Rg*Math.sqrt(r())*.85,x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d*.62,q=((t*2.2+i*.37)%1);ctx.globalAlpha=fade*(1-q)*.8;ctx.strokeStyle='#ff6a80';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,2+q*12,(2+q*12)*.5,0,0,TAU);ctx.stroke();}
 for(let i=0;i<4;i++){const q=((t*.8+i*.25)%1),a=rng(seed+i*31)()*TAU,d=Rg*.6*rng(seed+i*17)(),x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d*.62;ctx.globalAlpha=fade*Math.sin(q*Math.PI)*.85;ctx.fillStyle='#8e1030';ctx.beginPath();ctx.arc(x,y-q*3,2+q*3,0,TAU);ctx.fill();ctx.fillStyle='#ffb0c0';ctx.beginPath();ctx.arc(x-1,y-q*3-1,.8+q,0,TAU);ctx.fill();}
 ctx.restore();
 const k=clamp01((z.fxPulse??1)/.35);if(k<1)radialGlow(ctx,z.x,z.y,R,[[0,'#d0284f00'],[.7,'#d0284f55'],[1,'#d0284f00']],(1-k)*fade,.62);
 light(ctx,z.x,z.y,R*1.1,'blood',.3*fade);}
// Blood trail (Oct 15 revision): thick connected smears per enemy, plus splatter dots, fading over 5s.
function drawBloodTrail(ctx,m){const list=m.bloodTrail;if(!list?.length||shaderFx())return;const by=new Map();for(const t of list){if(!by.has(t.id))by.set(t.id,[]);by.get(t.id).push(t);}
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const pts of by.values()){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(Math.hypot(b.x-a.x,b.y-a.y)>60)continue;const f=1-b.age/5,al=Math.min(1,f*2);
   ctx.globalAlpha=.6*al;ctx.strokeStyle='#3a0612';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(a.x,a.y+2);ctx.lineTo(b.x,b.y+2);ctx.stroke();
   ctx.globalAlpha=.75*al;ctx.strokeStyle='#5a0a1c';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   ctx.globalAlpha=.45*al;ctx.strokeStyle='#a8173a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(a.x-2,a.y-2);ctx.lineTo(b.x-2,b.y-2);ctx.stroke();}
  for(let i=0;i<pts.length;i+=3){const t=pts[i],f=1-t.age/5,r=rng(((t.x*5+t.y*3)|0));ctx.globalAlpha=.6*Math.min(1,f*2);ctx.fillStyle='#5a0a1c';for(let j=0;j<2;j++){const a=r()*TAU,d=14+r()*10;ctx.beginPath();ctx.ellipse(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d*.5,2+r()*3,1.4+r()*2,0,0,TAU);ctx.fill();}}}
 ctx.restore();}
function tickKitFx(m,dt){
 m.kitClock=(m.kitClock??0)-dt;const due=m.kitClock<=0;if(due)m.kitClock=.05;
 for(const ip of m.icePaths??[]){const ca=Math.cos(ip.angle),sa=Math.sin(ip.angle);if(!ip.done)burst(m,ip.x+ca*ip.len,ip.y+sa*ip.len,6,'cryo',3,{speed:[40,180],up:[30,120],life:[.4,.8],kind:'flake',size:[1.2,2.6],spread:ip.width*.3,g:120});
  if(ip.age<ip.life-.4&&Math.random()<.6){const d=Math.random()*ip.len,o=(Math.random()-.5)*ip.width;emit(m,{kind:'mist',x:ip.x+ca*d-sa*o,y:ip.y+sa*d+ca*o,z:4,vx:(Math.random()-.5)*20,vz:12,drag:1,life:1.1,size:16+Math.random()*12,grow:18,color:'#e6f6ff'});burst(m,ip.x+ca*d-sa*o,ip.y+sa*d+ca*o,2,'cryo',1,{speed:[5,20],up:[20,50],life:[.6,1],kind:'flake',g:10});}}
 if(!due)return;
 for(const z of m.scorches??[])if(z.age<z.life){const q=randomIn(z.radius*.8);if(Math.random()<.6)emit(m,{kind:'smoke',x:z.x+q.dx,y:z.y+q.dy,z:10,vz:30,life:1,size:10,grow:20,color:'#2a1a12'});burst(m,z.x+q.dx,z.y+q.dy,4,'pyro',1,{speed:[5,20],up:[50,120],life:[.4,.8],kind:'ember',g:30});}
 let n=0;for(const e of m.fxTargets??[]){if(e.state!=='alive'||n>40)continue;if(e.burn){n++;burst(m,e.x,e.y,20+Math.random()*30,'pyro',1,{speed:[5,20],up:[40,90],life:[.3,.6],kind:'ember',g:20});}if(e.bloodSoaked>0&&Math.random()<.5)emit(m,{kind:'drop',x:e.x+(Math.random()-.5)*12,y:e.y,z:25,vz:0,g:380,life:.4,size:1.8,color:'#8e1030'});}
 for(const e of m.effects)if(e.kind==='bloom'&&!e.kitInit){e.kitInit=true;burst(m,e.x,e.y,10,'blood',30,{speed:[80,260],up:[120,300],life:[.5,.9],kind:'drop',spread:e.radius*.5,g:480});}
}

// ---------- Storm Vortex (Oct 15): tornado funnel that pulls enemies in and holds them ----------
function vortexFade(v){return Math.min(1,v.age/.3)*(1-clamp01((v.age-v.spec.life)/.5));}
function drawVortexGround(ctx,v){if(shaderFx())return;const f=vortexFade(v),R=v.radius;light(ctx,v.x,v.y,R*1.2,'storm',.45*f);
 radialGlow(ctx,v.x,v.y,R,[[0,'#2a214099'],[.7,'#3a2a5a44'],[1,'#3a2a5a00']],f,.6);
 ctx.save();ctx.translate(v.x,v.y);ctx.scale(1,.55);ctx.rotate(-v.age*5);ctx.lineCap='round';for(let i=0;i<6;i++){const r=R*(.2+i*.15);ctx.globalAlpha=f*(.6-i*.07);ctx.strokeStyle=i%2?'#c9a46a':'#9d7bff';ctx.lineWidth=3.5-i*.4;ctx.beginPath();ctx.arc(0,0,r,i*1.1,i*1.1+2.4);ctx.stroke();}ctx.restore();}
function drawVortexFunnel(ctx,v){if(shaderFx())return;const f=vortexFade(v),t=v.age,pal=E_PALETTE.storm;if(f<=0)return;
 ctx.save();ctx.lineCap='round';
 for(let i=0;i<10;i++){const q=i/9,y=v.y-8-q*210,rw=16+q*q*70+Math.sin(t*3+i)*4,sway=Math.sin(t*2.2+q*3)*10*q,rot=-t*(9-q*4)+i*.7;
  for(let k=0;k<2;k++){const a=rot+k*Math.PI;ctx.globalAlpha=f*(.55-q*.25);ctx.strokeStyle=k?'#cfc4ea':'#8a78b8';ctx.lineWidth=4-q*1.5;ctx.beginPath();ctx.ellipse(v.x+sway,y,rw,rw*.32,0,a,a+2.2);ctx.stroke();}}
 const g=ctx.createLinearGradient(v.x,v.y,v.x,v.y-220);g.addColorStop(0,'#5a4a8a55');g.addColorStop(1,'#5a4a8a00');ctx.globalAlpha=f;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(v.x-16,v.y-6);ctx.quadraticCurveTo(v.x-30,v.y-120,v.x-86,v.y-220);ctx.lineTo(v.x+86,v.y-220);ctx.quadraticCurveTo(v.x+30,v.y-120,v.x+16,v.y-6);ctx.closePath();ctx.fill();
 const fr=Math.floor(t*14),r=rng(fr*29+((v.x*3)|0));if(r()<.7){const y0=v.y-40-r()*140,y1=y0+30+r()*40;glowStroke(ctx,boltPoints(fr*13+7,v.x+(r()-.5)*40,y0,v.x+(r()-.5)*30,y1,.4),33,f*.9,pal,.6);}
 ctx.restore();}
function tickVortexFx(m,dt){for(const v of m.vortices??[]){if(v.age>v.spec.life)continue;for(let i=0;i<3;i++){const a=Math.random()*TAU,d=v.radius*(.3+.9*Math.random()),sp=160+Math.random()*120;emit(m,{kind:i?'smoke':'spark',x:v.x+Math.cos(a)*d,y:v.y+Math.sin(a)*d*.6,z:i?4:10+Math.random()*80,vx:-Math.sin(a)*sp-Math.cos(a)*60,vy:(Math.cos(a)*sp-Math.sin(a)*60)*.6,vz:i?40+Math.random()*60:80,g:i?-20:0,drag:1.4,life:i?.7:.35,size:i?9+Math.random()*7:1.6,grow:i?14:0,color:i?'#b8a888':'#cfc4ea'});}}}

// ---------- Talent feedback (Oct 15): Frozen Heart, Supercell/Storm Chaser strikes, Hemorrhage, Frost Highway ----------
function drawSkybolt(ctx,e){if(shaderFx())return;const k=clamp01(e.age/e.duration),f=Math.floor(e.age*40),pal=E_PALETTE.storm,pts=boltPoints(((e.x*7+e.y)|0)+f*13,e.fromX,e.fromY,e.x,e.y-30,.28);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';glowStroke(ctx,pts,pts.length,1-k,pal,.9);ctx.restore();radialGlow(ctx,e.fromX,e.fromY,26,[[0,'#ffffffaa'],[.4,'#b9a0ff66'],[1,'#5a2fe000']],1-k);}
function drawEnergyRefund(ctx,e,m){const k=clamp01(e.age/e.duration),to=m.auraPos??e;for(const src of e.sources??[]){const q=easeOut(k),x=src.x+(to.x-src.x)*q,y=src.y-30+(to.y-36-(src.y-30))*q-Math.sin(q*Math.PI)*40;radialGlow(ctx,x,y,9,[[0,'#ffffff'],[.4,'#7fd3f2cc'],[1,'#4ab4e000']],1-k*.5);}
 if(k>.55){const q=(k-.55)/.45;radialGlow(ctx,to.x,to.y-36,22+30*q,[[0,'#e8f8ffcc'],[.4,'#9fdcf088'],[1,'#4ab4e000']],1-q,1.2);}}
function drawHemoBurst(ctx,e){if(shaderFx())return;const k=clamp01(e.age/e.duration);radialGlow(ctx,e.x,e.y-30,18+30*k,[[0,'#ff8a9acc'],[.4,'#d0284f99'],[1,'#7a0c2600']],1-k,1);ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle='#ff4a6a';ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.ellipse(e.x,e.y,14+34*easeOut(k),(14+34*easeOut(k))*.6,0,0,TAU);ctx.stroke();ctx.restore();}
function tickTalentFx(m,dt){
 for(const e of m.effects){if(e.talentInit)continue;
  if(e.kind==='hemoBurst'){e.talentInit=true;burst(m,e.x,e.y,30,'blood',18,{speed:[80,220],up:[120,260],life:[.4,.7],kind:'drop',g:460});}
  else if(e.kind==='skybolt'){e.talentInit=true;burst(m,e.x,e.y,6,'storm',12,{speed:[80,240],up:[40,180],life:[.15,.35]});}
  else if(e.kind==='energyRefund'){e.talentInit=true;}}
 // Frost Highway: frost sparkles kick up from your feet while you ride the Ice Road.
 if(m.onIce&&m.auraPos&&Math.random()<.7)burst(m,m.auraPos.x+(Math.random()-.5)*20,m.auraPos.y,4,'cryo',2,{speed:[20,70],up:[20,70],life:[.3,.6],kind:'flake',g:60});
}
export function drawSpellUpper(ctx,m){
 drawBasicUpper(ctx,m);for(const e of m.effects){if(e.kind==='skybolt')drawSkybolt(ctx,e);else if(e.kind==='energyRefund')drawEnergyRefund(ctx,e,m);else if(e.kind==='hemoBurst')drawHemoBurst(ctx,e);}
 if(m.onIce&&m.auraPos)radialGlow(ctx,m.auraPos.x,m.auraPos.y,34,[[0,'#c4ecfa66'],[1,'#7fd3f200']],.9,.5);drawStatusBack(ctx,m);for(const z of m.scorches??[])drawScorchFlames(ctx,z);for(const e of m.effects)if(e.kind==='bloom')drawBloomSpikes(ctx,e);
 for(const b of m.projectiles)if(b.kind==='fireball')drawProjectile(ctx,b);
 for(const z of m.zones)drawZoneUpper(ctx,z);
 for(const h of m.meteors)drawMeteor(ctx,h);
 for(const e of m.effects){if(e.kind==='qnova'&&e.sfxInit)drawQNova(ctx,e);else if(e.kind==='pulse'&&e.sfxInit)drawPulse(ctx,e);else if(e.kind==='zap'&&e.sfxInit)drawZap(ctx,e);else if(e.kind==='blink')drawBlink(ctx,e);else if(e.kind==='nova'&&e.element==='blood')drawBloodNova(ctx,e);
  else if(e.kind==='surge'&&e.big){const k=clamp01(e.age/.5);if(k<1){ctx.save();ctx.globalAlpha=(1-k)*.55;ctx.strokeStyle='#c9a46a';ctx.lineWidth=16*(1-k)+4;const R=e.radius*(.5+.9*easeOut(k));ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();}}}
 if(m.ward)drawWard(ctx,m.ward);
 for(const z of m.bloodZones??[])drawEclipse(ctx,z);
 drawDrainFx(ctx,m);
 for(const b of m.bloodProjectiles??[])drawBloodLance(ctx,b);
}
