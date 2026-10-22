// Warrior ability visuals, code-native (user decision Oct 15: FX need not come from packs).
// warrior.js pushes flair records (kind,x,y,radius,angle) and exposes w.fx state; tickWarriorFx emits
// visual-only particles in simulation time (pause-safe); draw functions only read state. Effects that wrap
// the body are split: the far half draws in the spell pass (behind actors), the near half in
// drawWarriorFront after the body. The approved orange Ground Slam shockwave stays under Seismic Stomp.
import {TAU,clamp01,easeOut,rng,emit,burst,radialGlow,boltPoints,glowStroke,tongue,sigil,drawParticles,E_PALETTE} from './mage-e-fx.js?v=fx-260';
import {mageShake} from './mage-spell-fx.js?v=fx-260';
export {mageShake as warriorShake};
const KIND_EL={rush:'rage',bloodlust:'rage',carnage:'rage',wrath:'rage',sunder:'steel',guard:'steel',stomp:'steel',bastion:'steel',crescent:'void',barrier:'void',rune:'void',overload:'void',overloadHit:'void',thornHit:'rage',retribution:'steel',charge:'earth',cry:'earth',earthbreaker:'earth',bladestorm:'earth',bloodBurst:'rage',wrathCleave:'rage',darkmatter:'void',dmPulse:'void',voidDome:'void',voidChain:'void',guardBlast:'steel'};
const SHAKE={bloodBurst:3,wrathCleave:2,voidDome:7,dmPulse:1.2,voidChain:1.5,guardBlast:5,rush:1.5,charge:4,carnage:3,sunder:4,guard:3,stomp:7,earthbreaker:7,cry:3,barrier:3.5,rune:5,overload:4,overloadHit:1,wrath:2,bladestorm:.8};
const BUFFS=['bloodlust','wrath','bastion','overload'];
// Oct 16 revamp: Warlord's 'earth' strokes use the user's Warlord red (dust particles stay sand-coloured).
const WARLORD_RED={core:'#ffd0c0',mid:'#e8332e',glow:'#5a0a08',spark:['#ffe0c0','#ff6a4a','#c01818','#4a0a08']};
const pal=el=>el==='earth'?WARLORD_RED:E_PALETTE[el]??E_PALETTE.arcane;
const elOf=e=>KIND_EL[e.kind]??'steel';
const BODY=36,SAND='#d8b87a',STEEL={core:'#ffffff',mid:'#cfd8e6',glow:'#6a7a90'},THORN={core:'#ff9a9a',mid:'#c02040',glow:'#4a0810'},VIOLET='#b48cff';

// Rock spikes along a fissure (Earthbreaker), two staggered rows erupting in a travelling wave.
function lineRocks(range,angle,seed){const r=rng(seed),rocks=[],n=Math.round(range/16);for(let i=0;i<n;i++){const d=16+i/n*range,side=(r()-.5)*52;rocks.push({dx:Math.cos(angle)*d-Math.sin(angle)*side,dy:(Math.sin(angle)*d+Math.cos(angle)*side)*.65,h:24+r()*36*(1-i/n*.35),w:8+r()*7,lean:(r()-.5)*12,delay:i/n*.24});}return rocks.sort((a,b)=>a.dy-b.dy);}
// Rings of rock spikes bursting outward from the stomp centre (Seismic Stomp).
function ringRocks(radius,seed){const r=rng(seed),rocks=[];for(let ring=0;ring<4;ring++){const d0=radius*(.28+ring*.24),n=8+ring*5;for(let i=0;i<n;i++){const a=i/n*TAU+r()*.3,d=d0*(.9+r()*.2);rocks.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65,h:(30-ring*4)+r()*22,w:8+r()*6-ring,lean:Math.cos(a)*(8+r()*8),delay:d/radius*.3});}}return rocks.sort((a,b)=>a.dy-b.dy);}

// ---------- simulation-time state and particles ----------
export function tickWarriorFx(w,dt){
 w.shakeT=(w.shakeT??0)+dt;w.wrathGrow=(w.wrathGrow??1)+(((w.buffs.wrath>0)?1.2:1)-(w.wrathGrow??1))*Math.min(1,dt*6);w.shake=Math.max(0,(w.shake??0)-dt*(10+(w.shake??0)*4));
 const p=w.position,cast=w.cast;
 if(cast&&['rush','charge'].includes(cast.kind)&&p){(w.fxTrail??=[]).push({x:p.x,y:p.y,age:0,el:KIND_EL[cast.kind]});
  if(Math.random()<.8)burst(w,p.x,p.y,4,cast.kind==='charge'?'earth':'rage',2,{speed:[20,80],up:[30,90],life:[.3,.6],kind:cast.kind==='charge'?'smoke':'ember',size:cast.kind==='charge'?[8,12]:[1.5,3],g:cast.kind==='charge'?-20:60});}
 for(const tr of w.fxTrail??[])tr.age+=dt;if(w.fxTrail)w.fxTrail=w.fxTrail.filter(tr=>tr.age<.3);
 // Sandstorm talent: streams of dust pour inward from the drag radius toward the spinning Warlord.
 if(w.fx?.sandstorm&&p)for(let i=0;i<3;i++){const a=Math.random()*TAU,d=180+Math.random()*50,life=.55;emit(w,{kind:i?'smoke':'spark',x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.65,z:i?6:20+Math.random()*30,vx:-Math.cos(a)*d/life+Math.sin(a)*60,vy:(-Math.sin(a)*d/life-Math.cos(a)*60)*.65,vz:0,g:0,drag:0,life,size:i?9:1.8,grow:i?6:0,color:i?'#c9a46a':'#f3d9a0'});}
 if(cast?.kind==='bladestorm'&&p){w.shake=Math.max(w.shake,.7);
  for(let i=0;i<3;i++){const a=Math.random()*TAU,d=40+Math.random()*(cast.radius??145),v=180+Math.random()*120;emit(w,{kind:i?'smoke':'spark',x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.65,z:i?4+Math.random()*30:10+Math.random()*50,vx:-Math.sin(a)*v+Math.cos(a)*40,vy:(Math.cos(a)*v+Math.sin(a)*40)*.65,vz:i?15:40,g:i?-10:120,drag:1.2,life:i?.6+Math.random()*.4:.3,size:i?10+Math.random()*8:1.6,grow:i?18:0,color:i?'#c9a46a':'#f3d9a0'});}}
 // Perfect Guard shield lingers visually for a moment after the window so it reads.
 if(w.fx?.parry!=null){if(!w.fxGuard?.open)w.fxGuard={angle:w.fx.parry,age:0,open:true};else{w.fxGuard.angle=w.fx.parry;w.fxGuard.age+=dt;}}
 else if(w.fxGuard){if(w.fxGuard.open){w.fxGuard.open=false;w.fxGuard.age=0;}w.fxGuard.age+=dt;if(w.fxGuard.age>.3)w.fxGuard=null;}
 for(const e of w.effects){if(e.fxInit)continue;e.fxInit=true;e.seed=(Math.random()*1e9)|0;const el=elOf(e);
  e.activation=BUFFS.includes(e.kind)&&cast?.kind===e.kind&&cast.elapsed<.05;
  w.shake=Math.max(w.shake??0,e.activation?(e.kind==='wrath'?7:3.5):SHAKE[e.kind]??0);
  if(e.kind==='earthbreaker')e.rocks=lineRocks(e.radius,e.angle,e.seed);
  if(e.kind==='stomp')e.rocks=ringRocks(e.radius,e.seed);
  if(e.activation){burst(w,e.x,e.y,6,el,e.kind==='wrath'?50:30,{speed:[80,260],up:[80,260],life:[.5,1],kind:el==='rage'?'ember':'spark',spread:40,g:140});burst(w,e.x,e.y,20,el,16,{speed:[10,40],up:[30,80],life:[1,1.6],kind:'mote',spread:60,g:0});if(e.kind==='wrath')burst(w,e.x,e.y,30,'rage',30,{speed:[120,300],up:[60,200],life:[.4,.7],kind:'drop',g:420});}
  else if(e.kind==='carnage')burst(w,e.x,e.y,30,'rage',22,{speed:[180,360],up:[20,120],life:[.25,.5],kind:'drop',g:420});
  else if(e.kind==='stomp'||e.kind==='earthbreaker'||e.kind==='sunder'){const line=e.kind!=='stomp',n=e.kind==='sunder'?12:26;
   for(let i=0;i<n;i++){const a=line?e.angle+(Math.random()-.5)*.8:Math.random()*TAU,d=line?Math.random()*e.radius:e.radius*Math.random()*.8,v=120+Math.random()*240;emit(w,{kind:'shard',x:e.x+(line?Math.cos(e.angle)*d:Math.cos(a)*d),y:e.y+(line?Math.sin(e.angle)*d:Math.sin(a)*d)*.65,z:6,vx:Math.cos(a)*v*(line?.35:1),vy:Math.sin(a)*v*.65*(line?.35:1),vz:180+Math.random()*260,g:620,drag:.5,life:.8+Math.random()*.5,size:3+Math.random()*5,rot:Math.random()*TAU,vr:(Math.random()-.5)*14,color:i%3?'#7a5a3a':'#4a3420'});}
   for(let i=0;i<(line?18:20);i++){const a=Math.random()*TAU,d=line?Math.random()*e.radius:e.radius*(.3+.7*Math.random());emit(w,{kind:'smoke',x:e.x+(line?Math.cos(e.angle)*d:Math.cos(a)*d),y:e.y+(line?Math.sin(e.angle)*d:Math.sin(a)*d)*.65,z:6,vx:Math.cos(a)*50,vy:Math.sin(a)*25,vz:25+Math.random()*35,life:1+Math.random()*.6,size:16+Math.random()*12,grow:30,color:'#b89868'});}
   if(e.kind==='earthbreaker')for(let i=0;i<24;i++){const d=Math.random()*e.radius;burst(w,e.x+Math.cos(e.angle)*d,e.y+Math.sin(e.angle)*d*.65,2,'earth',1,{speed:[10,60],up:[80,200],life:[.5,1],kind:'ember',g:60});}}
  else if(e.kind==='bloodBurst'){burst(w,e.x,e.y,30,'rage',10+e.stacks*6,{speed:[80,260],up:[60,240],life:[.4,.8],kind:'drop',g:420});burst(w,e.x,e.y,30,'rage',8,{speed:[40,140],up:[20,100],life:[.3,.5]});}
  else if(e.kind==='wrathCleave'){for(let i=0;i<10;i++){const a=e.angle+(Math.random()-.5)*1.6,dd=e.radius*(.5+Math.random()*.5);burst(w,e.x+Math.cos(a)*dd,e.y+Math.sin(a)*dd*.65,25,'rage',1,{speed:[60,180],up:[30,120],life:[.2,.4],kind:'drop',g:420});}}
  else if(e.kind==='voidDome'){burst(w,e.x,e.y,30,'void',50,{speed:[160,420],up:[40,260],life:[.4,.9],spread:30});burst(w,e.x,e.y,10,'void',14,{speed:[40,120],up:[20,80],life:[.8,1.2],kind:'smoke',size:[10,16],g:-10});}
  else if(e.kind==='dmPulse')burst(w,e.x,e.y,20,'void',8,{speed:[60,160],up:[10,60],life:[.25,.45],spread:e.radius*.6});
  else if(e.kind==='voidChain')for(const q of e.pts)burst(w,q.x,q.y,30,'void',6,{speed:[60,180],up:[20,120],life:[.2,.4]});
  else if(e.kind==='guardBlast'){for(let i=0;i<26;i++){const a=e.angle+(Math.random()-.5)*1.4,d=Math.random()*e.radius;burst(w,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.65,20,'steel',1,{speed:[60,200],up:[30,160],life:[.25,.5]});}}
  else if(e.kind==='rune')burst(w,e.x,e.y,20,'arcane',60,{speed:[80,300],up:[60,280],life:[.4,.9],spread:e.radius*.35});
  else if(e.kind==='overload'){burst(w,e.x,e.y,30,'arcane',50,{speed:[120,320],up:[20,200],life:[.3,.6]});burst(w,e.x,e.y,10,'arcane',20,{speed:[20,60],up:[30,80],life:[1,1.5],kind:'mote',spread:e.radius*.6,g:0});}
  else if(e.kind==='overloadHit')burst(w,e.x,e.y,30,'arcane',12,{speed:[80,200],up:[0,120],life:[.2,.4]});
  else if(e.kind==='barrier')burst(w,e.x,e.y,20,'arcane',30,{speed:[80,260],up:[40,220],life:[.3,.7],spread:e.radius*.3});
  else if(e.kind==='guard')burst(w,e.x,e.y,BODY,'steel',30,{speed:[140,320],up:[0,180],life:[.25,.5]});
  else if(e.kind==='cry')burst(w,e.x,e.y,6,'earth',18,{speed:[100,240],up:[20,80],life:[.4,.7],kind:'smoke',size:[8,12],g:-10});
  else if(e.kind==='wrath')burst(w,e.x,e.y,BODY,'rage',14,{speed:[100,260],up:[0,120],life:[.2,.4]});
  else if(e.kind==='bladestorm')burst(w,e.x,e.y,30,'earth',4,{speed:[150,300],up:[0,80],life:[.15,.3]});
  else if(e.kind==='thornHit')burst(w,e.x,e.y,30,'rage',10,{speed:[80,220],up:[40,160],life:[.3,.5],kind:'drop',g:420});
  else if(e.kind==='retribution')burst(w,e.x,e.y,34,'steel',18,{speed:[120,300],up:[20,160],life:[.2,.4]});
  else burst(w,e.x,e.y,BODY,el,16,{speed:[80,240],up:[20,140],life:[.25,.5]});
 }
 w.fxClock=(w.fxClock??0)-dt;if(w.fxClock<=0&&p){w.fxClock=.03;
  if(w.buffs.bloodlust>0)burst(w,p.x+(Math.random()-.5)*36,p.y,10+Math.random()*40,'rage',1,{speed:[5,20],up:[50,110],life:[.4,.7],kind:'ember',g:20});
  if(w.buffs.wrath>0){const a=Math.random()*TAU;burst(w,p.x+Math.cos(a)*24,p.y+Math.sin(a)*10,4,'rage',2,{speed:[5,30],up:[50,120],life:[.5,.9],kind:'ember',g:20});burst(w,p.x,p.y,20,'rage',1,{speed:[5,20],up:[30,70],life:[.6,1],kind:'mote',spread:40,g:0});}
  if(w.buffs.bastion>0)burst(w,p.x+(Math.random()-.5)*60,p.y,10+Math.random()*60,'steel',1,{speed:[5,15],up:[20,50],life:[.6,1],kind:'mote',g:0});
  if(w.buffs.darkmatter>0){const a=(w.shakeT??0)*2.2+Math.floor(Math.random()*3)*TAU/3;burst(w,p.x+Math.cos(a)*90,p.y+Math.sin(a)*40,30,'void',1,{speed:[5,25],up:[10,40],life:[.4,.7],kind:'mote',g:0});}
  if(w.buffs.wrath>0&&Math.random()<.5)burst(w,p.x,p.y,10+Math.random()*50,'rage',1,{speed:[20,60],up:[60,160],life:[.3,.6],kind:'drop',g:200});
  if(w.buffs.overload>0){const a=Math.random()*TAU;burst(w,p.x+Math.cos(a)*58,p.y+Math.sin(a)*26,2,'arcane',2,{speed:[5,15],up:[60,140],life:[.5,.8],kind:'mote',g:0});burst(w,p.x,p.y,36,'arcane',1,{speed:[60,140],up:[-40,40],life:[.12,.25],g:0});}
  if(w.fx?.barrier){const a=Math.random()*TAU;burst(w,p.x+Math.cos(a)*40,p.y+Math.sin(a)*18,20+Math.random()*50,'arcane',1,{speed:[5,20],up:[10,40],life:[.5,.8],kind:'mote',g:0});}
  if(w.fxGuard?.open){const a=w.fxGuard.angle+(Math.random()-.5)*2.2;burst(w,p.x+Math.cos(a)*56,p.y+Math.sin(a)*30,BODY,'steel',2,{speed:[40,120],up:[0,80],life:[.15,.3]});}
  for(const r of w.runes){burst(w,r.x+(Math.random()-.5)*r.spec.radius,r.y+(Math.random()-.5)*r.spec.radius*.6,2,'arcane',2,{speed:[5,15],up:[60,160],life:[.4,.7],kind:'mote',g:0});burst(w,r.x,r.y,4,'arcane',1,{speed:[r.spec.radius*.8,r.spec.radius*1.1],up:[10,40],life:[.2,.3],g:0});}
  for(const b of w.projectiles){burst(w,b.x,b.y,25,'void',4,{speed:[30,110],up:[-30,40],life:[.25,.45],g:0});burst(w,b.x,b.y,25,'arcane',1,{speed:[5,20],up:[10,30],life:[.6,1],kind:'mote',g:0});}
  for(const e of w.fxTargets??[]){if(e.state!=='alive')continue;if(e.warriorBleed&&Math.random()<.25)emit(w,{kind:'drop',x:e.x+(Math.random()-.5)*14,y:e.y,z:30+Math.random()*20,vz:0,g:380,life:.5,size:1.6+Math.random(),color:'#a8173a'});if(e.warriorWeaken>0&&Math.random()<.2)emit(w,{kind:'mote',x:e.x+(Math.random()-.5)*24,y:e.y,z:10+Math.random()*50,vz:30,g:0,life:.7,size:1.8,rot:0,vr:3,color:VIOLET});}}
}

// ---------- ground layer ----------
function light(ctx,x,y,r,el,a){if(a<=.01)return;const c=pal(el).mid;ctx.save();ctx.globalCompositeOperation='screen';radialGlow(ctx,x,y,r,[[0,c],[1,c+'00']],a,.6);ctx.restore();}
function jagged(ctx,seed,x,y,angle,len,grow,width,color,alpha){const r=rng(seed),n=10;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x,y);for(let i=1;i<=n*grow;i++){const d=len*i/n,o=(r()-.5)*14;ctx.lineTo(x+Math.cos(angle)*d-Math.sin(angle)*o,y+(Math.sin(angle)*d+Math.cos(angle)*o)*.65);}ctx.stroke();ctx.restore();}
function groundRing(ctx,x,y,R,color,alpha,spin,ticks=6){ctx.save();ctx.translate(x,y);ctx.scale(1,.5);ctx.rotate(spin);ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();ctx.lineWidth=3;for(let i=0;i<ticks;i++){const a=i/ticks*TAU;ctx.beginPath();ctx.arc(0,0,R*.86,a,a+.4);ctx.stroke();}ctx.restore();}
export function drawWarriorGround(ctx,w,drawFX){
 const p=w.position,t=w.shakeT??0;
 if(p){
  if(w.buffs.bloodlust>0){light(ctx,p.x,p.y,70,'rage',.4);groundRing(ctx,p.x,p.y,44,pal('rage').mid,.55,t*1.4);}
  if(w.buffs.wrath>0){light(ctx,p.x,p.y,140,'rage',.6);radialGlow(ctx,p.x,p.y,90,[[0,'#ff3a2a55'],[.6,'#8e141444'],[1,'#4a081000']],.85+.15*Math.sin(t*9),.6);}
  if(w.buffs.bastion>0){const R=w.bastionRadius??170;light(ctx,p.x,p.y,R,'steel',.5);groundRing(ctx,p.x,p.y,R*.97,'#ffe9a8',.75,t*.4,12);groundRing(ctx,p.x,p.y,R*.6,pal('steel').mid,.35,-t*.7,8);}
  if(w.buffs.darkmatter>0){light(ctx,p.x,p.y,150,'void',.45);radialGlow(ctx,p.x,p.y,150,[[0,'#12031f66'],[.75,'#2a0a4a44'],[1,'#2a0a4a00']],1,.55);groundRing(ctx,p.x,p.y,90,'#9b5cff',.5,t*2.2,3);}
  if(w.buffs.overload>0){light(ctx,p.x,p.y,110,'void',.6);sigil(ctx,p.x,p.y,62,1,t*1.2,pal('void'));groundRing(ctx,p.x,p.y,40,'#efe9ff',.5,-t*2.2,6);}
  if(w.cast?.kind==='bladestorm'){const R=w.cast.radius??145;light(ctx,p.x,p.y,R,'earth',.35);radialGlow(ctx,p.x,p.y,R,[[0,'#6b422066'],[.8,'#6b422033'],[1,'#6b422000']],1,.6);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.55);ctx.rotate(-t*6);ctx.strokeStyle=SAND;ctx.lineCap='round';for(let i=0;i<5;i++){const r=R*(.3+i*.16);ctx.globalAlpha=.5-i*.06;ctx.lineWidth=4-i*.5;ctx.beginPath();ctx.arc(0,0,r,i*1.3,i*1.3+2.2);ctx.stroke();}ctx.restore();}
 }
 for(const r of w.runes){const k=clamp01(r.age/r.delay);sigil(ctx,r.x,r.y,r.spec.radius,k,r.age*2,E_PALETTE.arcane);groundRing(ctx,r.x,r.y,r.spec.radius*.55,'#efe9ff',.3+.5*k,-r.age*4,5);radialGlow(ctx,r.x,r.y,r.spec.radius*(.3+.6*k),[[0,'#b49cff66'],[1,'#5d47d600']],.4+.6*k,.65);light(ctx,r.x,r.y,r.spec.radius,'arcane',.3+.4*k);}
 for(const tr of w.fxTrail??[]){const k=tr.age/.3;radialGlow(ctx,tr.x,tr.y,22,[[0,tr.el==='earth'?'#6b422066':'#8e141455'],[1,'#00000000']],(1-k)*.8,.5);}
 for(const e of w.effects){if(!e.fxInit)continue;const tt=e.age,k=clamp01(tt/e.duration),el=elOf(e),c=pal(el);
  light(ctx,e.x,e.y,Math.min(280,e.radius*1.2),el,(e.kind==='bladestorm'?.2:.6)*(1-k));
  if(e.kind==='stomp'){drawFX('fx-slam-shockwave',k,e.x,e.y-8,Math.min(360,e.radius*2.1),.65,.5);const r=rng(e.seed);for(let i=0;i<12;i++){const a=i/12*TAU+r()*.4;jagged(ctx,e.seed+i,e.x,e.y,a,e.radius*(.6+.4*r()),easeOut(tt/.25),2.5,c.mid,(1-k)*.9);}
   ctx.save();ctx.globalAlpha=(1-k)*.6;ctx.strokeStyle='#c9a46a';ctx.lineWidth=18*(1-k)+3;const R=e.radius*(.3+.85*easeOut(clamp01(tt/.35)));ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();}
  if(e.kind==='sunder'||e.kind==='earthbreaker'){const big=e.kind==='earthbreaker',grow=easeOut(tt/(big?.25:.1));radialGlow(ctx,e.x+Math.cos(e.angle)*e.radius*.5,e.y+Math.sin(e.angle)*e.radius*.33,e.radius*.6,[[0,'#2a180c88'],[1,'#2a180c00']],(1-k)*.8,.4);
   jagged(ctx,e.seed,e.x,e.y,e.angle,e.radius,grow,big?11:7,'#2a180c',(1-k)*.8);jagged(ctx,e.seed,e.x,e.y,e.angle,e.radius,grow,big?4:2.5,big?'#ff8a2a':c.mid,(1-k));}
  if(e.kind==='sunder'){const grow=easeOut(clamp01(tt/.12));ctx.save();ctx.translate(e.x,e.y);ctx.scale(1,.65);const g=ctx.createRadialGradient(0,0,10,0,0,Math.max(11,e.radius*grow));g.addColorStop(0,'#ffffff88');g.addColorStop(.7,'#cfd8e655');g.addColorStop(1,'#6a7a9000');ctx.globalAlpha=(1-k)*.9;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,e.radius*grow,e.angle-.8,e.angle+.8);ctx.closePath();ctx.fill();ctx.restore();
   for(const off of [-.5,.5])jagged(ctx,e.seed+(off>0?7:3),e.x,e.y,e.angle+off,e.radius*.9,grow,6,'#2a180c',(1-k)*.8);}
  if(['cry','carnage','rune','barrier','overload','guard'].includes(e.kind)){ctx.save();ctx.globalAlpha=(1-k)*.6;ctx.strokeStyle=c.mid;ctx.lineWidth=3;const R=e.radius*easeOut(k);ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();}
  if(e.activation){for(let i=0;i<2;i++){const q=clamp01((tt-i*.1)/.5);if(q<=0||q>=1)continue;const R=(e.kind==='wrath'?150:110)*easeOut(q);ctx.save();ctx.globalAlpha=(1-q)*.8;ctx.strokeStyle=i?c.mid:c.core;ctx.lineWidth=10*(1-q)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();}}
 }
}

// ---------- shared shapes ----------
function drawTrail(ctx,w){const tr=w.fxTrail;if(!tr||tr.length<2)return;ctx.save();ctx.lineCap='round';for(let i=1;i<tr.length;i++){const a=tr[i-1],b=tr[i],k=1-b.age/.3,c=pal(b.el);ctx.globalAlpha=k*.55;ctx.strokeStyle=c.glow;ctx.lineWidth=26*k;ctx.beginPath();ctx.moveTo(a.x,a.y-34);ctx.lineTo(b.x,b.y-34);ctx.stroke();ctx.globalAlpha=k*.8;ctx.strokeStyle=c.mid;ctx.lineWidth=8*k;ctx.stroke();}
 const last=tr.at(-1),r=rng(Math.floor((w.shakeT??0)*30));ctx.strokeStyle=pal(last.el).core;ctx.lineWidth=1.5;for(let i=0;i<4;i++){const s=tr[Math.floor(r()*tr.length)],o=(r()-.5)*40;ctx.globalAlpha=.6*(1-s.age/.3);ctx.beginPath();ctx.moveTo(s.x,s.y-34+o);ctx.lineTo(s.x+(last.x-s.x)*.5,s.y-34+o+(last.y-s.y)*.5);ctx.stroke();}ctx.restore();}
function drawCrescent(ctx,b){const c=E_PALETTE.void,x=b.x,y=b.y-25;
 for(let g=4;g>=0;g--){const bx=x-Math.cos(b.angle)*g*14,by=y-Math.sin(b.angle)*g*14,a=g?.32/g:1;ctx.save();ctx.translate(bx,by);ctx.rotate(b.angle);ctx.globalAlpha=a;
  const grad=ctx.createLinearGradient(-10,0,22,0);grad.addColorStop(0,c.glow+'00');grad.addColorStop(.6,c.mid);grad.addColorStop(1,'#ffffff');ctx.fillStyle=grad;
  ctx.beginPath();ctx.arc(-14,0,34+g*2,-1.15,1.15);ctx.arc(-24,0,30+g*2,1.05,-1.05,true);ctx.closePath();ctx.fill();
  if(!g){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(-14,0,34,-1.1,1.1);ctx.stroke();for(let i=0;i<3;i++){const q=-1+i;radialGlow(ctx,-14+Math.cos(q)*34,Math.sin(q)*34,6,[[0,'#ffffff'],[1,c.mid+'00']],.9);}}ctx.restore();}
 radialGlow(ctx,x,y,44,[[0,'#c9a0ff66'],[.5,'#7a3cff44'],[1,'#12031f00']],1);}
function drawRocks(ctx,e,sinkAt){const tt=e.age;if(!e.rocks||tt>sinkAt+.15)return;const fade=1-clamp01((tt-sinkAt)/.15);ctx.save();ctx.globalAlpha=fade;
 for(const s of e.rocks){const g=easeOut((tt-s.delay)/.08);if(g<=0)continue;const bx=e.x+s.dx,by=e.y+s.dy,tx=bx+s.lean*g,ty=by-s.h*g;
  ctx.fillStyle='#9c6b3a';ctx.beginPath();ctx.moveTo(bx-s.w,by);ctx.lineTo(tx,ty);ctx.lineTo(bx+s.w*.2,by+s.w*.3);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5a3a24';ctx.beginPath();ctx.moveTo(bx+s.w*.2,by+s.w*.3);ctx.lineTo(tx,ty);ctx.lineTo(bx+s.w,by);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e0a050';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx-s.w,by);ctx.lineTo(tx,ty);ctx.stroke();
  if(tt-s.delay<.12)radialGlow(ctx,bx,by-4,s.w*2.4,[[0,'#c9a46a99'],[1,'#c9a46a00']],1-(tt-s.delay)/.12,.6);}
 ctx.restore();}
function drawSweep(ctx,x,y,R,a0,span,width,c,alpha){ctx.save();ctx.lineCap='round';for(let i=0;i<8;i++){const f=i/8,a=a0-span*f;ctx.globalAlpha=alpha*(1-f);ctx.strokeStyle=i<2?c.core:c.mid;ctx.lineWidth=width*(1-f*.7);ctx.beginPath();ctx.ellipse(x,y,R,R*.65,0,a-span/8,a);ctx.stroke();}ctx.restore();}
// Curved thorn rising from the ground ring, pointing outward.
function drawThorn(ctx,x,y,out,h,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);const lean=out*h*.45;ctx.fillStyle=THORN.glow;ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-3+lean*.2,-h*.6,lean,-h);ctx.quadraticCurveTo(4+lean*.4,-h*.5,6,0);ctx.closePath();ctx.fill();ctx.strokeStyle=THORN.mid;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-3+lean*.2,-h*.6,lean,-h);ctx.stroke();ctx.restore();}
const half=(a,front)=>(Math.sin(a)>=0)===front;

// ---------- body-wrapping auras (front = after the body) ----------
function drawAuraHalf(ctx,w,front){
 const p=w.position;if(!p)return;const t=w.shakeT??0;
 if(w.buffs.bloodlust>0){const c=pal('rage');if(!front)for(let i=0;i<6;i++){const a=i/6*TAU+t*.8;tongue(ctx,p.x+Math.cos(a)*22,p.y-6+Math.sin(a)*8,6,22+6*Math.sin(t*14+i*2),.45,c);}
  // Rage shards orbiting until the buff ends.
  for(let i=0;i<5;i++){const a=t*3+i/5*TAU;if(!half(a,front))continue;const x=p.x+Math.cos(a)*32,y=p.y-34+Math.sin(a)*12+Math.sin(t*6+i)*6;ctx.save();ctx.translate(x,y);ctx.rotate(a*2);ctx.fillStyle='#ff5a3a';ctx.strokeStyle='#ffd0b0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(3,0);ctx.lineTo(0,7);ctx.lineTo(-3,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();radialGlow(ctx,x,y,9,[[0,'#ff7a4a88'],[1,'#8e141400']],1);}}
 // Unchained Wrath (Oct 15, user): just an enraged red glow; the thorn ring was removed.
 if(w.buffs.wrath>0){const pulse=.8+.2*Math.sin(t*9);
  if(!front){radialGlow(ctx,p.x,p.y-40,84,[[0,'#ff3a2a00'],[.45,'#d0202060'],[.8,'#8e141438'],[1,'#4a081000']],pulse,1.4);radialGlow(ctx,p.x,p.y-8,64,[[0,'#ff5a3a50'],[1,'#8e141400']],pulse,.6);}
  else{ctx.save();ctx.globalCompositeOperation='screen';radialGlow(ctx,p.x,p.y-44,48,[[0,'#ff6a4a38'],[.6,'#d0202024'],[1,'#8e141400']],pulse,1.5);ctx.restore();}}
 // Bastion Dome (Oct 15): a giant golden orb around the warrior; back shell behind the body, front rim after it.
 if(w.buffs.bastion>0){const R=w.bastionRadius??170,cy=p.y-R*.32,pulse=.85+.15*Math.sin(t*3);
  if(!front){radialGlow(ctx,p.x,cy,R,[[0,'#ffd77a08'],[.7,'#ffd77a1c'],[.93,'#fff3c877'],[1,'#ffd77a00']],pulse,1);
   ctx.save();ctx.globalAlpha=.18*pulse;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=1;for(let i=1;i<5;i++){const yy=cy-R+i*R*.4;const hw=Math.sqrt(Math.max(0,R*R-(yy-cy)**2));ctx.beginPath();ctx.ellipse(p.x,yy,hw,hw*.25,0,Math.PI,TAU);ctx.stroke();}ctx.restore();}
  else{ctx.save();ctx.globalAlpha=.55*pulse;ctx.strokeStyle='#fff3c8';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x,cy,R,0,TAU);ctx.stroke();ctx.globalAlpha=.8;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;const sh=t*1.3;ctx.beginPath();ctx.arc(p.x,cy,R*.96,sh,sh+.5);ctx.stroke();
   ctx.globalAlpha=.5;ctx.strokeStyle='#ffd77a';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(p.x,p.y,R,R*.5,0,0,Math.PI);ctx.stroke();ctx.restore();}}
 // Dark Matter: three void orbs with trailing wisps circle at the ground plane.
 if(w.buffs.darkmatter>0){const VP=E_PALETTE.void;for(let i=0;i<3;i++){for(let tr=4;tr>=0;tr--){const a=t*2.2+i*TAU/3-tr*.12;if(!half(a,front))continue;const x=p.x+Math.cos(a)*90,y=p.y-28+Math.sin(a)*40+Math.sin(t*4+i)*5,r=(tr?9-tr*1.4:11);
   if(tr){radialGlow(ctx,x,y,r*1.8,[[0,VP.mid+'66'],[1,VP.glow+'00']],.7-tr*.12,1);continue;}
   radialGlow(ctx,x,y,30,[[0,'#c9a0ffaa'],[.5,'#7a3cff55'],[1,'#2a0a4a00']],1,1);ctx.save();ctx.fillStyle='#0a0212';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.strokeStyle='#c9a0ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}}}
 if(w.buffs.overload>0){const c=pal('void');if(!front){radialGlow(ctx,p.x,p.y-40,50,[[0,'#5d47d600'],[.6,'#b49cff33'],[1,'#5d47d600']],1,1.5);const g=ctx.createLinearGradient(p.x,p.y,p.x,p.y-120);g.addColorStop(0,'#b49cff44');g.addColorStop(1,'#b49cff00');ctx.save();ctx.fillStyle=g;ctx.fillRect(p.x-34,p.y-120,68,120);ctx.restore();}
  const f=Math.floor(t*14),r=rng(f*31+7);if(front&&r()<.8){ctx.save();ctx.lineCap='round';const a=r()*TAU,d=24+r()*14;glowStroke(ctx,boltPoints(f*17,p.x,p.y-38,p.x+Math.cos(a)*d,p.y-38+Math.sin(a)*d*1.2,.4),33,.85,c,.45);ctx.restore();}
  for(let i=0;i<5;i++){const a=t*3+i/5*TAU;if(!half(a,front))continue;radialGlow(ctx,p.x+Math.cos(a)*34,p.y-30+Math.sin(a)*13,6,[[0,'#ffffff'],[.4,c.mid],[1,c.glow+'00']],.95);}}
 if(w.cast?.kind==='bladestorm'){const a0=w.cast.angle+w.cast.elapsed*Math.PI*5,R=w.cast.radius??145;
  // Spinning steel slashes at blade reach plus wind arcs out to the hit radius.
  for(let k=0;k<2;k++){const a=a0+k*Math.PI;if(!half(a,front))continue;drawSweep(ctx,p.x,p.y-30,58,a,2.4,9,STEEL,.9);}
  ctx.save();ctx.lineCap='round';for(let i=0;i<4;i++){const r=R*(.45+i*.18),spin=-t*(7-i)+i*1.7;for(let s=0;s<2;s++){const a=spin+s*Math.PI;if(!half(a+.6,front))continue;ctx.globalAlpha=.45-i*.07;ctx.strokeStyle=i%2?SAND:'#f3d9a0';ctx.lineWidth=3.5-i*.5;ctx.beginPath();ctx.ellipse(p.x,p.y-14-i*4,r,r*.42,0,a,a+1.2);ctx.stroke();}}ctx.restore();}
 const g=w.fxGuard;if(g&&(Math.sin(g.angle)>=-.3)===front){const c=pal('steel'),a=g.angle,grow=g.open?easeOut(g.age/.06):1,fade=g.open?1:1-g.age/.3,cx=p.x,cy=p.y-36,R1=58*grow,R2=44*grow,span=1.15;
  ctx.save();ctx.globalAlpha=.6*fade;const grad=ctx.createRadialGradient(cx,cy,Math.max(1,R2*.8),cx,cy,Math.max(2,R1));grad.addColorStop(0,'#ffd77a22');grad.addColorStop(.7,'#ffd77a77');grad.addColorStop(1,'#fff3c8aa');ctx.fillStyle=grad;
  ctx.beginPath();ctx.ellipse(cx,cy,R1,R1*.78,0,a-span,a+span);ctx.ellipse(cx,cy,R2,R2*.78,0,a+span,a-span,true);ctx.closePath();ctx.fill();
  for(const [lw,col,al] of [[10,c.glow,.35],[4,c.mid,.9],[1.6,'#ffffff',1]]){ctx.globalAlpha=al*fade;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.ellipse(cx,cy,R1,R1*.78,0,a-span,a+span);ctx.stroke();}
  const sh=a-span+((g.age*4)%1)*span*2;ctx.globalAlpha=.9*fade;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+Math.cos(sh)*R2,cy+Math.sin(sh)*R2*.78);ctx.lineTo(cx+Math.cos(sh)*R1,cy+Math.sin(sh)*R1*.78);ctx.stroke();
  const ex=cx+Math.cos(a)*(R1+R2)/2,ey=cy+Math.sin(a)*(R1+R2)/2*.78;ctx.fillStyle='#fffbe8';ctx.beginPath();ctx.moveTo(ex,ey-7);ctx.lineTo(ex+5,ey);ctx.lineTo(ex,ey+7);ctx.lineTo(ex-5,ey);ctx.closePath();ctx.fill();ctx.restore();
  radialGlow(ctx,ex,ey,30,[[0,'#fff3c8aa'],[1,'#ffd77a00']],fade);}
 if(w.fx?.barrier){const c=pal('void'),cx=p.x,cy=p.y-38,pulse=.5+.5*Math.sin(t*7);
  if(!front){radialGlow(ctx,cx,cy,56,[[0,'#b49cff00'],[.55,'#9a7cff40'],[.85,'#d8ccff77'],[1,'#b49cff00']],.85+.15*pulse,1.3);radialGlow(ctx,cx,cy,30+10*pulse,[[0,'#b49cff55'],[1,'#5d47d600']],1,1.3);}
  else{ctx.save();ctx.translate(cx,cy);ctx.scale(1,1.3);ctx.globalAlpha=.55+.3*pulse;ctx.strokeStyle=c.mid;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,42,0,TAU);ctx.stroke();ctx.rotate(t*.8);ctx.globalAlpha=.35+.25*pulse;ctx.lineWidth=1.4;ctx.beginPath();for(let i=0;i<=6;i++){const a=i/6*TAU;i?ctx.lineTo(Math.cos(a)*38,Math.sin(a)*38):ctx.moveTo(38,0);}ctx.stroke();
   const q=(t*1.4)%1;ctx.globalAlpha=(1-q)*.7;ctx.strokeStyle='#efe9ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,Math.max(.5,42*q),0,TAU);ctx.stroke();ctx.restore();}}
}
function drawEffect(ctx,e){
 const tt=e.age,k=clamp01(tt/e.duration),el=elOf(e),c=pal(el);
 if(e.activation){if(tt<.3)radialGlow(ctx,e.x,e.y-30,50+40*tt/.3,[[0,c.core+'aa'],[.4,c.mid+'66'],[1,c.glow+'00']],(1-tt/.3)*.8,.9);return;}
// Oct 15 redesign visuals: void dome burst, dark-matter pulse, chaining void, parry blast.
 const VP=E_PALETTE.void;
 if(e.kind==='bloodBurst'){const R=e.radius*easeOut(clamp01(tt/.18));radialGlow(ctx,e.x,e.y-30,R,[[0,'#ffd0c0dd'],[.3,'#d0203099'],[1,'#4a081000']],(1-k),1);ctx.save();ctx.globalAlpha=(1-k);ctx.strokeStyle='#8e1414';ctx.lineWidth=8*(1-k)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R*1.2,R*.6,0,0,TAU);ctx.stroke();ctx.restore();return;}
 if(e.kind==='wrathCleave'){const grow=easeOut(clamp01(tt/.12));drawSweep(ctx,e.x,e.y-28,e.radius*.8*grow,e.angle+.9,1.8,22*(1-k)+4,THORN,(1-k));drawSweep(ctx,e.x,e.y-28,e.radius*.6*grow,e.angle+.8,1.6,10*(1-k)+2,{core:'#ffffff',mid:'#ff9a9a',glow:'#c02040'},(1-k)*.8);return;}
 if(e.kind==='voidDome'){const R=e.radius*easeOut(clamp01(tt/.22)),cy=e.y-R*.3;radialGlow(ctx,e.x,cy,R,[[0,'#12031fcc'],[.6,'#3a0f6a88'],[.92,'#c9a0ffcc'],[1,'#9b5cff00']],(1-k),1);
  ctx.save();ctx.globalAlpha=(1-k);ctx.strokeStyle=VP.mid;ctx.lineWidth=14*(1-k)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R*1.05,R*.55,0,0,TAU);ctx.stroke();ctx.strokeStyle='#f3e8ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,cy,R,Math.PI*1.05,Math.PI*1.95);ctx.stroke();ctx.restore();
  if(tt<.15)radialGlow(ctx,e.x,e.y-30,60+120*tt/.15,[[0,'#ffffffee'],[.3,'#c9a0ffaa'],[1,'#2a0a4a00']],1-tt/.15,1);return;}
 if(e.kind==='dmPulse'){const R=e.radius*easeOut(k);ctx.save();ctx.globalAlpha=(1-k)*.85;for(const [lw,col] of [[10,VP.glow],[4,VP.mid],[1.5,'#f3e8ff']]){ctx.strokeStyle=col;ctx.lineWidth=lw*(1-k)+1;ctx.beginPath();ctx.ellipse(e.x,e.y-6,R,R*.5,0,0,TAU);ctx.stroke();}ctx.restore();return;}
 if(e.kind==='voidChain'){ctx.save();ctx.lineCap='round';for(let i=1;i<e.pts.length;i++){const a=e.pts[i-1],b=e.pts[i];glowStroke(ctx,boltPoints(e.seed+i*13+Math.floor(tt*30),a.x,a.y-34,b.x,b.y-34,.35),33,(1-k),VP,.6);radialGlow(ctx,b.x,b.y-34,26,[[0,'#ffffffcc'],[.4,VP.mid+'aa'],[1,VP.glow+'00']],(1-k),1);}ctx.restore();return;}
 if(e.kind==='guardBlast'){const R=e.radius*easeOut(clamp01(tt/.15));ctx.save();ctx.translate(e.x,e.y-20);ctx.scale(1,.65);const g=ctx.createRadialGradient(0,0,8,0,0,Math.max(9,R));g.addColorStop(0,'#ffffffee');g.addColorStop(.5,'#ffe9a8aa');g.addColorStop(1,'#ffd77a00');ctx.globalAlpha=(1-k);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,e.angle-.7,e.angle+.7);ctx.closePath();ctx.fill();ctx.strokeStyle='#fffbe8';ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.arc(0,0,R,e.angle-.7,e.angle+.7);ctx.stroke();ctx.restore();return;}
 if(e.kind==='carnage'){const a0=tt*26;drawSweep(ctx,e.x,e.y-26,e.radius*.75,a0,2.6,16*(1-k)+3,c,(1-k));drawSweep(ctx,e.x,e.y-26,e.radius*.75,a0+Math.PI,2.6,16*(1-k)+3,c,(1-k)*.8);}
 else if(e.kind==='wrath'){const r=rng(e.seed);for(let i=0;i<3;i++){const a=r()*TAU,cx=e.x+Math.cos(a)*e.radius*.45,cy=e.y-30+Math.sin(a)*e.radius*.3,sa=r()*TAU;drawSweep(ctx,cx,cy,30+r()*20,sa+tt*18,2,7*(1-k)+2,THORN,(1-k)*.9);}}
 else if(e.kind==='sunder'){const tip={x:e.x+Math.cos(e.angle)*e.radius,y:e.y+Math.sin(e.angle)*e.radius*.65};if(tt<.25)radialGlow(ctx,tip.x,tip.y-10,30+40*tt/.25,[[0,'#ffffffdd'],[.3,c.mid+'aa'],[1,c.glow+'00']],1-tt/.25,.8);drawSweep(ctx,e.x,e.y-30,46,e.angle+.9,1.8,10*(1-k)+2,c,(1-k));}
 else if(e.kind==='earthbreaker'){drawRocks(ctx,e,.5);if(tt<.3)for(let i=0;i<4;i++){const d=e.radius*(i+.5)/4;if(tt>i*.06)radialGlow(ctx,e.x+Math.cos(e.angle)*d,e.y+Math.sin(e.angle)*d*.65-6,26,[[0,'#ff8a2a88'],[1,'#d8380f00']],1-tt/.3,.6);}}
 else if(e.kind==='stomp'){drawRocks(ctx,e,.55);if(tt<.15)radialGlow(ctx,e.x,e.y-10,e.radius*.6*(tt/.15+.3),[[0,'#ffffffbb'],[.3,c.mid+'99'],[1,c.glow+'00']],1-tt/.15,.65);}
 else if(e.kind==='cry'){for(let i=0;i<3;i++){const q=clamp01((tt-i*.08)/.45);if(q<=0||q>=1)continue;const R=e.radius*easeOut(q);ctx.save();ctx.globalAlpha=(1-q)*.75;ctx.strokeStyle=i?c.mid:c.core;ctx.lineWidth=10*(1-q)+2;ctx.beginPath();ctx.ellipse(e.x,e.y-30,R,R*.5,0,0,TAU);ctx.stroke();ctx.restore();}}
 else if(e.kind==='rune'){if(tt<.5){const q=tt/.5;tongue(ctx,e.x,e.y,30*(1-q*.5),190*easeOut(tt/.08)*(1-q*.3),(1-q),{core:'#ffffff',mid:'#b49cff',glow:'#5d47d6'});}for(let i=0;i<2;i++){const q=clamp01((tt-i*.1)/e.duration),R=e.radius*easeOut(q)*(1+i*.2);ctx.save();ctx.globalAlpha=(1-q);ctx.strokeStyle=i?'#efe9ff':c.mid;ctx.lineWidth=8*(1-q)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();}}
 else if(e.kind==='overload'||e.kind==='barrier'||e.kind==='overloadHit'){const R=e.radius*easeOut(k);ctx.save();ctx.globalAlpha=(1-k);ctx.strokeStyle=c.mid;ctx.lineWidth=(e.kind==='overload'?12:6)*(1-k)+2;ctx.beginPath();ctx.ellipse(e.x,e.y-6,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();
  if(e.kind==='overloadHit')radialGlow(ctx,e.x,e.y-36,26*(1-k)+10,[[0,'#ffffffcc'],[.4,c.mid+'99'],[1,c.glow+'00']],(1-k),1);
  if(e.kind==='overload'){radialGlow(ctx,e.x,e.y-36,70*(1-k)+20,[[0,'#ffffffdd'],[.35,c.mid+'aa'],[1,c.glow+'00']],(1-k),1);if(tt<.3){const f=Math.floor(tt*40),r=rng(e.seed+f);ctx.save();ctx.lineCap='round';for(let i=0;i<8;i++){const a=r()*TAU;glowStroke(ctx,boltPoints(e.seed+f*7+i,e.x,e.y-36,e.x+Math.cos(a)*R,e.y-6+Math.sin(a)*R*.65,.3),33,1-tt/.3,c,.55);}ctx.restore();}}}
 else if(e.kind==='thornHit'){ctx.save();ctx.lineCap='round';for(let i=-1;i<=1;i+=2){const a=e.angle+i*.7,l=26*(1-k*.3);ctx.globalAlpha=(1-k);ctx.strokeStyle='#4a0810';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(e.x-Math.cos(a)*l,e.y-36-Math.sin(a)*l);ctx.lineTo(e.x+Math.cos(a)*l,e.y-36+Math.sin(a)*l);ctx.stroke();ctx.strokeStyle='#ff5a3a';ctx.lineWidth=2.5;ctx.stroke();}ctx.restore();radialGlow(ctx,e.x,e.y-36,24,[[0,'#ff7a4a99'],[1,'#8e141400']],1-k);}
 else if(e.kind==='retribution'){radialGlow(ctx,e.x,e.y-36,22+28*k,[[0,'#fffbe8ee'],[.35,'#ffd77aaa'],[1,'#b8862a00']],1-k,1);ctx.save();ctx.globalAlpha=1-k;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i/6*TAU+e.age*4,r0=10+20*k,r1=r0+14;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*r0,e.y-36+Math.sin(a)*r0);ctx.lineTo(e.x+Math.cos(a)*r1,e.y-36+Math.sin(a)*r1);ctx.stroke();}ctx.restore();}
 else if(e.kind==='guard')radialGlow(ctx,e.x,e.y-36,40+50*k,[[0,'#ffffffee'],[.3,c.mid+'cc'],[1,c.glow+'00']],(1-k),1);
 else if(e.kind==='rush'||e.kind==='charge'){if(tt<.2)radialGlow(ctx,e.x,e.y-30,30+30*tt/.2,[[0,c.core+'cc'],[.4,c.mid+'88'],[1,c.glow+'00']],1-tt/.2,1);}
}
// War Cry: weakened enemies glow purple (aura behind their sprite) with violet down-chevrons.
function drawDebuffs(ctx,w){const t=w.shakeT??0;for(const e of w.fxTargets??[]){if(e.state==='alive'&&e.bloodStacks>0){const s=e.scale??1,n=e.bloodStacks,y=e.y-86*s;for(let i=0;i<n;i++){const x=e.x+(i-(n-1)/2)*11,b=Math.sin(t*6+i)*1.5;ctx.save();ctx.fillStyle='#2a0408';ctx.beginPath();ctx.moveTo(x,y-9+b);ctx.quadraticCurveTo(x+6,y+b,x,y+4+b);ctx.quadraticCurveTo(x-6,y+b,x,y-9+b);ctx.fill();ctx.fillStyle=n>=5?'#ff3a3a':'#c01828';ctx.beginPath();ctx.moveTo(x,y-7+b);ctx.quadraticCurveTo(x+4.5,y+b,x,y+2.5+b);ctx.quadraticCurveTo(x-4.5,y+b,x,y-7+b);ctx.fill();ctx.restore();}if(n>=5)radialGlow(ctx,e.x,e.y-34*s,40*s,[[0,'#ff3a3a55'],[1,'#8e141400']],.7+.3*Math.sin(t*10),1.3);}
  if(e.state!=='alive'||!(e.warriorWeaken>0))continue;const s=e.scale??1,y=e.y-80*s-6,b=Math.sin(t*6)*2;
 radialGlow(ctx,e.x,e.y-34*s,46*s,[[0,'#b48cff66'],[.6,'#7a4ad044'],[1,'#5d2ab000']],.8+.2*Math.sin(t*5+(e.id??0)),1.3);
}}
export function drawWarriorUpper(ctx,w){
 drawTrail(ctx,w);
 drawDebuffs(ctx,w);
 for(const e of w.effects)if(e.fxInit)drawEffect(ctx,e);
 for(const b of w.projectiles)drawCrescent(ctx,b);
 drawAuraHalf(ctx,w,false);
 drawParticles(ctx,w);
}
export function drawWarriorFront(ctx,w){if(w)drawAuraHalf(ctx,w,true);}
// Bloodlust tints the body red (replaces the washed-out look from glow behind the body); Wrath darkens it.
export function warriorBodyFilter(w){return w?.buffs?.bloodlust>0?'sepia(.45) saturate(2.4) hue-rotate(-28deg) brightness(1.03)':w?.buffs?.wrath>0?'sepia(.5) saturate(2.6) hue-rotate(-32deg) brightness(.95) contrast(1.1)':'none';}
export function drawWarriorLights(ctx,w){for(const b of w.projectiles)light(ctx,b.x,b.y,80,'void',.55);}
