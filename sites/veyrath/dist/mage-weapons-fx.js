// Oct 18 Mage weapons by subclass: visuals for the new LMB families (sim in mage-weapons.js). Visual only; reads state.
// Oct 19 (user): rebuilt on soft blended particles (soft-fx.js) — bloom and fog instead of hard lines, each subclass in its
// own style: Pyromancer fire and smoke, Cryomancer snow and frost haze, Stormcaller violet sparks, Blood Mage rounded,
// leaking, dripping blood in crimson / dark red / black with fog. Canvas draws run in both modes; weaponVfx adds shader extras.
import {TAU,BODY,clamp01,easeOut,radialGlow,glowStroke,boltPoints,sigil,rng,E_PALETTE} from './mage-e-fx.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {createSoft,emitSoft,burstSoft,tickSoft,drawSoft,softGlow} from './soft-fx.js?v=fx-260';
const pal=el=>E_PALETTE[el]??E_PALETTE.arcane;
const seedOf=(x,y)=>((x*7.13+y*13.7)|0)&1023,rnd=Math.random;
const HEART_H=78;
/* blood splats on the ground (decals): appear after a delay (the drip's fall), fade over life */
function splat(m,x,y,r,delay=0){const L=m.splats??=[];if(L.length<90)L.push({x,y,r,age:-delay,life:2.2+rnd(),seed:(rnd()*1e4)|0});}
function drip(P,m,x,y,h,spread=6){const dx=(rnd()-.5)*spread,dy=(rnd()-.5)*spread*.5;emitSoft(P,{x:x+dx,y:y+dy,z:h,vx:0,vy:0,vz:-10,life:Math.sqrt(2*h/600)+.05,size:2.4+rnd()*1.6,ramp:'bloodDark',blend:'normal',g:600,floor:0});splat(m,x+dx,y+dy,3+rnd()*4,Math.sqrt(2*h/600));}
function emitAll(m,dt){
 const P=m.wsoft;
 // Ember Beads: each flying ember sheds fire; a burst on impact.
 for(const b of m.projectiles){if(b.kind!=='bolt')continue;
  if(b.primary==='embers'&&rnd()<dt*70)emitSoft(P,{x:b.x,y:b.y,z:BODY,vx:-Math.cos(b.angle)*60+(rnd()-.5)*30,vy:-Math.sin(b.angle)*40,vz:20+rnd()*30,life:.3+rnd()*.2,size:5+rnd()*4,grow:10,ramp:'fire',drag:2});
  if(b.primary==='tesla'&&rnd()<dt*50)emitSoft(P,{x:b.x,y:b.y,z:BODY,vx:(rnd()-.5)*120,vy:(rnd()-.5)*80,vz:(rnd()-.5)*80,life:.18+rnd()*.12,size:3+rnd()*3,ramp:'storm',drag:3});}
 for(const d of m.discs??[])if(rnd()<dt*80)emitSoft(P,{x:d.x+(rnd()-.5)*20,y:d.y+(rnd()-.5)*10,z:BODY,vx:(rnd()-.5)*40,vy:(rnd()-.5)*30,vz:30+rnd()*40,life:.35+rnd()*.25,size:7+rnd()*6,grow:14,ramp:'fire',drag:1.5});
 // Blood Orb: drips falling to the sand and a dark fog trail.
 for(const o of m.bloodOrbs??[]){const R=o.spec.radius*.55;if(rnd()<dt*14)drip(P,m,o.x+(rnd()-.5)*R,o.y,BODY-R*.6,R*.6);
  if(rnd()<dt*26)emitSoft(P,{x:o.x+(rnd()-.5)*R,y:o.y+(rnd()-.5)*R*.4,z:BODY+(rnd()-.5)*R,vx:-Math.cos(o.angle)*20,vy:-Math.sin(o.angle)*14,vz:4,life:.8+rnd()*.5,size:R*.7,grow:18,ramp:'bloodFog',blend:'normal',alpha:.5,drag:1.2});}
 // Snow Globe: snow whirling in the storm.
 if(m.globe){const g=m.globe,R=g.R??95;for(let i=0,n=Math.ceil(dt*60);i<n;i++){const a=rnd()*TAU,d=R*Math.sqrt(rnd());emitSoft(P,{x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d*.65,z:60+rnd()*50,vx:-Math.sin(a)*90,vy:Math.cos(a)*55,vz:-50-rnd()*40,life:.7+rnd()*.4,size:2+rnd()*2.5,ramp:'frost',drag:.5});}
  if(rnd()<dt*10)emitSoft(P,{x:g.x+(rnd()-.5)*R,y:g.y+(rnd()-.5)*R*.6,z:10,vx:0,vy:0,vz:6,life:1.4,size:R*.5,grow:10,ramp:'frost',blend:'normal',alpha:.18});}
 // Crimson Lantern: blood fog curling around you, crimson embers rising, drips off the lantern.
 if(m.lantern!=null&&m.auraPos){const {x,y}=m.auraPos,R=190;for(let i=0,n=Math.ceil(dt*30);i<n;i++){const a=rnd()*TAU,d=R*(.3+.7*Math.sqrt(rnd()));emitSoft(P,{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*.65,z:4+rnd()*20,vx:-Math.sin(a)*40,vy:Math.cos(a)*26,vz:6+rnd()*8,life:1+rnd()*.6,size:14+rnd()*12,grow:14,ramp:'bloodFog',blend:'normal',alpha:.45,drag:.5});}
  if(rnd()<dt*18){const a=rnd()*TAU,d=R*Math.sqrt(rnd());emitSoft(P,{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*.65,z:4,vx:0,vy:0,vz:40+rnd()*40,life:.9+rnd()*.5,size:3+rnd()*2,ramp:'blood',drag:.4});}
  if(rnd()<dt*6)drip(P,m,x+16,y,40,4);}
 // Cursed Skull: blood flows from you into the heart orb, which drips while it grows.
 const k=m.skull;if(k&&m.auraPos){const f=Math.min(1.4,k.charge/2),r=12+24*f,hx=k.x,hy=k.y,ax=m.auraPos.x,ay=m.auraPos.y;
  for(let i=0,n=Math.ceil(dt*45);i<n;i++){const q=rnd()*.15;emitSoft(P,{x:ax+(hx-ax)*q,y:ay+(hy-ay)*q,z:44+(HEART_H-44)*q,vx:(hx-ax)*1.6,vy:(hy-ay)*1.6,vz:(HEART_H-44)*1.6+30,g:60,life:.6,size:4+rnd()*3,ramp:'blood',drag:0});}
  if(rnd()<dt*(4+10*f))drip(P,m,hx,hy,HEART_H-r*.8,r*.8);
  if(rnd()<dt*14)emitSoft(P,{x:hx+(rnd()-.5)*r,y:hy+(rnd()-.5)*r*.4,z:HEART_H+(rnd()-.5)*r,vx:(rnd()-.5)*16,vy:(rnd()-.5)*10,vz:6,life:1.1,size:r*.9,grow:12,ramp:'bloodFog',blend:'normal',alpha:.45,drag:.8});}
 // one-off bursts for new effect records
 for(const e of m.effects){if(e.wsoft)continue;
  if(e.kind==='gauntCone'){e.wsoft=true;const ox=e.x+Math.cos(e.angle)*18,oy=e.y+Math.sin(e.angle)*12;
   for(let i=0;i<70;i++){const a=e.angle+(rnd()*2-1)*e.arc*.85,life=.3+rnd()*.15,sp=e.range/life*(.8+.3*rnd());emitSoft(P,{x:ox,y:oy,z:34,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.65,vz:10+rnd()*50,life,size:4+rnd()*4,grow:60,ramp:i%4?'fire':'fireHot',drag:.6});}
   for(let i=0;i<14;i++){const a=e.angle+(rnd()*2-1)*e.arc*.7,d=e.range*(.6+.4*rnd());emitSoft(P,{x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d*.65,z:30,vx:Math.cos(a)*30,vy:Math.sin(a)*20,vz:40+rnd()*30,life:.7+rnd()*.4,size:12,grow:34,ramp:'smoke',blend:'normal',alpha:.4,drag:1});}}
  else if(e.kind==='emberBurst'){e.wsoft=true;burstSoft(P,e.x,e.y,16,{z:BODY,speed:[40,e.radius*2.4],up:[20,120],life:[.25,.5],size:[5,10],grow:16,ramp:'fire',g:120,drag:2.5});}
  else if(e.kind==='bloom'&&e.element==='blood'){e.wsoft=true;burstSoft(P,e.x,e.y,30,{z:8,speed:[60,e.radius*2.6],up:[120,320],life:[.5,.9],size:[3,6],ramp:'bloodDark',blend:'normal',g:700,drag:.6});burstSoft(P,e.x,e.y,14,{z:10,speed:[20,e.radius],up:[10,40],life:[.9,1.5],size:[18,30],grow:20,ramp:'bloodFog',blend:'normal',alpha:.5,drag:1.5});for(let i=0;i<8;i++){const a=rnd()*TAU,d=e.radius*.9*Math.sqrt(rnd());splat(m,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.65,5+rnd()*8,.15+rnd()*.3);}}
  else if(e.kind==='nova'&&e.element==='blood'&&e.radius>100){e.wsoft=true;const at={x:e.x,y:e.y};burstSoft(P,at.x,at.y,60,{z:HEART_H,speed:[e.radius*.8,e.radius*3],up:[-60,160],life:[.4,.8],size:[4,9],ramp:'blood',g:380,drag:1.4});burstSoft(P,at.x,at.y,30,{z:HEART_H*.6,speed:[30,e.radius*1.2],up:[0,40],life:[1,1.8],size:[24,44],grow:24,ramp:'bloodFog',blend:'normal',alpha:.55,drag:1.4});for(let i=0;i<14;i++){const a=rnd()*TAU,d=e.radius*Math.sqrt(rnd());splat(m,at.x+Math.cos(a)*d,at.y+Math.sin(a)*d*.65,6+rnd()*10,.2+rnd()*.4);}}
  else if(e.kind==='drumBeat'){e.wsoft=true;const o=e.follow&&m.auraPos?m.auraPos:e;for(let i=0;i<40;i++){const a=i/40*TAU;emitSoft(P,{x:o.x+Math.cos(a)*20,y:o.y+Math.sin(a)*13,z:8,vx:Math.cos(a)*e.radius*1.9,vy:Math.sin(a)*e.radius*1.2,vz:20+rnd()*30,life:.5,size:6+rnd()*5,grow:8,ramp:'storm',drag:1.8});}}
 }
 // streams (lantern drain, skull siphons): soft blobs flowing back to you
 for(const e of m.effects)if((e.kind==='lanternDrain'||e.kind==='skullStreams')&&!e.wsoftS){e.wsoftS=true;const to=m.auraPos??e;for(const f of e.from??[])for(let i=0;i<(e.kind==='skullStreams'?10:5);i++){const life=.45+i*.05+rnd()*.15,dx=to.x-f.x,dy=to.y-f.y;emitSoft(P,{x:f.x,y:f.y,z:BODY,vx:dx/life,vy:dy/life,vz:(44-BODY)/life+120,g:240*2/life,life,size:5+rnd()*4,ramp:'blood',drag:0});}}
}
// ---------- ground pass (beneath actors) ----------
export function drawWeaponGround(ctx,m){
 const B=pal('blood'),C=pal('cryo');
 for(const s of m.splats??[]){if(s.age<0)continue;const a=Math.min(1,s.age/.08)*(1-clamp01((s.age-s.life+.6)/.6));softGlow(ctx,s.x,s.y,s.r*1.6,'#2a0410',.7*a,{add:false,squash:.6});softGlow(ctx,s.x,s.y,s.r,'#7a0c26',.8*a,{add:false,squash:.6});}
 for(const g of m.sigils??[]){const k=clamp01(g.age/g.spec.delay),R=g.spec.radius;softGlow(ctx,g.x,g.y,R*1.2,'#1a0206',.6*k+.2,{add:false,squash:.65});softGlow(ctx,g.x,g.y,R*(.4+.6*k),'#7a0c26',.55*k+.15,{add:false,squash:.65});ctx.save();ctx.globalCompositeOperation='lighter';sigil(ctx,g.x,g.y,R*(.7+.3*easeOut(k*2)),k,g.age+g.seed,B);ctx.restore();softGlow(ctx,g.x,g.y,R*.5,'#ff2a55',.25+.35*k,{squash:.65});}
 if(m.globe){const g=m.globe,R=g.R??95,a=Math.min(1,g.age/.4);softGlow(ctx,g.x,g.y,R*1.15,'#3a8fb8',.35*a,{add:false,squash:.65});softGlow(ctx,g.x,g.y,R*.8,'#d6f4ff',.35*a,{squash:.65});}
 if(m.lantern!=null&&m.auraPos){const R=190,t=m.lantern,a=Math.min(1,t/.25),beat=.9+.1*Math.sin(t*6);softGlow(ctx,m.auraPos.x,m.auraPos.y,R*beat,'#1a0206',.55*a,{add:false,squash:.65});softGlow(ctx,m.auraPos.x,m.auraPos.y,R*.7*beat,'#7a0c26',.35*a,{add:false,squash:.65});softGlow(ctx,m.auraPos.x,m.auraPos.y,R*.5,'#ff2a55',.12*a,{squash:.65});}
 if(m.skull){const k=m.skull,f=Math.min(1.4,k.charge/2);softGlow(ctx,k.x,k.y,30+40*f,'#1a0206',.7,{add:false,squash:.5});softGlow(ctx,k.x,k.y,20+26*f,'#a8173a',.3,{squash:.5});}
}
// ---------- upper pass ----------
function drawEmbers(ctx,m){
 if(m.motes==null||!m.auraPos)return;const {x,y}=m.auraPos,s=m.moteSpin??0;
 for(let i=0;i<m.motes;i++){const a=s+i/5*TAU,px=x+Math.cos(a)*30,py=y-44+Math.sin(a)*12+Math.sin(s*2+i)*3,fl=.85+.15*Math.sin(s*9+i*2);softGlow(ctx,px,py,16*fl,'#d8380f',.55);softGlow(ctx,px,py,9*fl,'#ffc861',.9);softGlow(ctx,px,py-2,4,'#ffffff',.9);}
}
function drawDisc(ctx,d){
 const x=d.x,y=d.y-BODY,R=d.spec.radius;softGlow(ctx,x,y,R*2.4,'#d8380f',.55,{squash:.8});softGlow(ctx,x,y,R*1.3,'#ffc861',.75,{squash:.75});
 ctx.save();ctx.translate(x,y);ctx.scale(1,.7);ctx.rotate(d.spin);ctx.globalCompositeOperation='lighter';
 for(let i=0;i<10;i++){const a=i/10*TAU;ctx.save();ctx.rotate(a);softGlow(ctx,R*.95,0,R*.42,'#ff9a2e',.6);ctx.restore();}
 ctx.globalCompositeOperation='source-over';const g=ctx.createRadialGradient(0,0,0,0,0,R*.62);g.addColorStop(0,'#fffbe8');g.addColorStop(.5,'#ffd060');g.addColorStop(1,'#d8380f');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*.62,0,TAU);ctx.fill();ctx.restore();
}
function drawTesla(ctx,b){
 const P=pal('storm'),o=b.origin??b,tail=Math.min(160,Math.hypot(b.x-o.x,b.y-o.y)),hx=b.x,hy=b.y-BODY,tx=hx-Math.cos(b.angle)*tail,ty=hy-Math.sin(b.angle)*tail;
 const pts=boltPoints(((b.seed??1)+Math.floor((b.remaining??0)/40))|0,tx,ty,hx,hy,.22);glowStroke(ctx,pts,pts.length,.8,P,.6);
 softGlow(ctx,hx,hy,26,'#5a2fe0',.7);softGlow(ctx,hx,hy,12,'#e2d6ff',.95);
}
function drawBloodOrb(ctx,o){
 const x=o.x,y=o.y-BODY,R=o.spec.radius*.55,f=Math.min(1,o.age/.15)*Math.min(1,o.remaining/40+.2),wob=1+.06*Math.sin(o.age*9+o.seed);
 softGlow(ctx,x,y,R*2.6,'#1a0206',.75*f,{add:false});softGlow(ctx,x,y,R*1.8,'#d0284f',.35*f);
 ctx.save();ctx.globalAlpha=f;ctx.translate(x,y);ctx.scale(1/wob,wob);const g=ctx.createRadialGradient(-R*.3,-R*.35,R*.08,0,0,R);g.addColorStop(0,'#ff8aa0');g.addColorStop(.35,'#c0123c');g.addColorStop(.75,'#5a0818');g.addColorStop(1,'#14020600');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
 /* hanging drops along the bottom */ctx.fillStyle='#7a0c26';for(let i=0;i<3;i++){const dx=(i-1)*R*.45,len=R*(.35+.3*((Math.sin(o.age*3+i*2+o.seed)+1)/2));ctx.beginPath();ctx.moveTo(dx-R*.12,R*.78);ctx.quadraticCurveTo(dx,R*.78+len*1.1,dx+R*.12,R*.78);ctx.fill();ctx.beginPath();ctx.arc(dx,R*.8+len,R*.1,0,TAU);ctx.fill();}
 ctx.fillStyle='#ffd6dc';ctx.globalAlpha=.7*f;ctx.beginPath();ctx.ellipse(-R*.32,-R*.38,R*.16,R*.1,-.6,0,TAU);ctx.fill();ctx.restore();
}
function drawHeart(ctx,k){
 const f=Math.min(1.4,k.charge/2),beat=1+.12*Math.max(0,Math.sin(k.beat*TAU))**6,r=(12+24*f)*beat,x=k.x,y=k.y-HEART_H,appear=Math.min(1,(k.age??1)/.2);
 softGlow(ctx,x,y,r*2.8,'#1a0206',.8*appear,{add:false});softGlow(ctx,x,y,r*2,'#a8173a',.45*appear);
 ctx.save();ctx.globalAlpha=appear;ctx.translate(x,y);const g=ctx.createRadialGradient(-r*.3,-r*.3,r*.05,0,0,r);g.addColorStop(0,'#ff6a85');g.addColorStop(.4,'#a8173a');g.addColorStop(.8,'#3a0410');g.addColorStop(1,'#0e020400');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
 /* glowing veins pulse with the beat */ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff2a55';ctx.lineWidth=Math.max(1,r*.06);ctx.lineCap='round';const R=rng(k.seed??3);for(let i=0;i<5;i++){const a=R()*TAU,a2=a+(R()-.5)*1.2;ctx.globalAlpha=appear*(.25+.5*Math.max(0,Math.sin(k.beat*TAU))**3);ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.15,Math.sin(a)*r*.15);ctx.quadraticCurveTo(Math.cos(a2)*r*.6,Math.sin(a2)*r*.6,Math.cos(a)*r*.85,Math.sin(a)*r*.85);ctx.stroke();}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.6*appear;ctx.fillStyle='#ffd6dc';ctx.beginPath();ctx.ellipse(-r*.32,-r*.36,r*.15,r*.09,-.6,0,TAU);ctx.fill();ctx.restore();
}
function drawMarks(ctx,m){for(const e of m.fxTargets??[]){const n=e.bloodMarks?.n;if(!n||e.state!=='alive')continue;const top=e.y-(e.radius??14)*2.6-18,a=Math.min(1,e.bloodMarks.t/.5);
 for(let i=0;i<n;i++){const x=e.x+(i-(n-1)/2)*11,y=top+Math.sin((m.shakeT??0)*4+i)*1.5;softGlow(ctx,x,y,9,'#d0284f',.55*a);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#a8173a';ctx.beginPath();ctx.moveTo(x,y-6);ctx.quadraticCurveTo(x+4.5,y+1,x,y+4.5);ctx.quadraticCurveTo(x-4.5,y+1,x,y-6);ctx.fill();ctx.fillStyle='#ffd6dc';ctx.beginPath();ctx.arc(x-1.3,y+.5,1,0,TAU);ctx.fill();ctx.restore();}}}
export function drawWeaponUpper(ctx,m){
 const P=m.wsoft??=createSoft(),T=m.shakeT??0,dt=P.clock==null?0:Math.max(0,Math.min(.1,T-P.clock));tickSoft(P,T);
 for(let i=(m.splats??[]).length-1;i>=0;i--){const s=m.splats[i];s.age+=dt;if(s.age>s.life)m.splats.splice(i,1);}
 if(dt>0)emitAll(m,dt);
 drawEmbers(ctx,m);for(const d of m.discs??[])drawDisc(ctx,d);for(const o of m.bloodOrbs??[])drawBloodOrb(ctx,o);
 for(const b of m.projectiles)if(b.kind==='bolt'&&b.primary==='tesla')drawTesla(ctx,b);
 if(m.skull)drawHeart(ctx,m.skull);
 for(const e of m.effects){
  if(e.kind==='drumBeat'){const o=e.follow&&m.auraPos?m.auraPos:e,k=clamp01(e.age/e.duration),R=e.radius*easeOut(k);ctx.save();ctx.globalCompositeOperation='lighter';for(const [w,col,al] of [[16*(1-k)+4,'#5a2fe0',.3],[5,'#9d7bff',.5],[1.6,'#f6eeff',.6]]){ctx.globalAlpha=(1-k)*al;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(o.x,o.y,R,R*.65,0,0,TAU);ctx.stroke();}ctx.restore();if(k<.3)softGlow(ctx,o.x,o.y-20,70,'#9d7bff',.6*(1-k/.3),{squash:.8});}
 }
 drawSoft(ctx,P);drawMarks(ctx,m);
}
// ---------- shader extras (inside drawMageVfx, before its flush) ----------
export function weaponVfx(m,pass){
 if(m.globe){const g=m.globe;emitFx('cryo.blizzard',{x:g.x,y:g.y,R:g.R??95,age:g.age,alpha:Math.min(1,g.age/.3),seed:g.seed&1023},pass);}
 for(const e of m.effects)if(e.kind==='drumBeat'){const o=e.follow&&m.auraPos?m.auraPos:e;emitFx('storm.nova',{x:o.x,y:o.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);}
}
