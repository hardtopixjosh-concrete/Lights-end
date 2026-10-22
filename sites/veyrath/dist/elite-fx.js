// Elite leader look and elite spell visuals (Oct 15 user request: elites should read as elites, coloured
// by type, smoother look, and much better spell art). Code-native; reuses the shared FX helpers. Visual
// state lives in r.fx ({effects,efx}), ticked in simulation time from tickElitePowers.
import {TAU,clamp01,easeOut,rng,emit,burst,radialGlow,tongue,sigil,makeSpikes,drawSpikes,tickEFx,drawEGround,drawEUpper,E_PALETTE} from './mage-e-fx.js?v=fx-260';
import {createFrameCache} from './sprite-cache.js?v=fx-260';
import {cachedSurface,effectVisible} from './effect-cache.js?v=fx-260';

// Per-modifier colour (core/mid/glow) and the shared particle palette used for its bursts.
export const ELITE_LOOK={
 frostbound:{core:'#e8f8ff',mid:'#7fd3f2',glow:'#2a7ab0',fx:'cryo'},
 waller:{core:'#f3d9a0',mid:'#c99a62',glow:'#5a3a24',fx:'earth'},
 explosive:{core:'#fff1b0',mid:'#ff7a2a',glow:'#b0200e',fx:'pyro'},
 vampiric:{core:'#ffd6dc',mid:'#e2475f',glow:'#6e0b22',fx:'blood'},
 shielded:{core:'#fffbe8',mid:'#ffd77a',glow:'#b8862a',fx:'steel'},
 berserker:{core:'#ffd0b0',mid:'#ff4a3a',glow:'#7a0a0a',fx:'rage'},
 warding:{core:'#efe9ff',mid:'#b48cff',glow:'#5d2ab0',fx:'arcane'}
};
const look=t=>ELITE_LOOK[t.modifier]??ELITE_LOOK.warding;

// ---------- smooth type tint ----------
// The old CSS filter chain started with grayscale(1), flattening the sprite. Instead each sheet is
// tinted per visible frame/modifier with the canvas 'color' blend; bounded cache keeps its light/shade.
const tinted=createFrameCache();
export function eliteSheet(img,t,sx=0,sy=0,size){
 if(!img||typeof document==='undefined'||!t.modifier)return img;
 return tinted(img,t.modifier,sx,sy,size??img.width,size??img.height,(g,w,h)=>{
 g.globalCompositeOperation='color';g.globalAlpha=.78;g.fillStyle=look(t).mid;g.fillRect(0,0,w,h);
 g.globalAlpha=.18;g.globalCompositeOperation='soft-light';g.fillRect(0,0,w,h);
 g.globalAlpha=1;g.globalCompositeOperation='destination-in';g.drawImage(img,sx,sy,w,h,0,0,w,h);
 });
}

// ---------- Oct 16 (user): golem Dune Ravager particles ----------
// Depth checklist: particles carry height (z) with gravity/bounce and soft drifting smoke; impacts get anticipation (the
// clip's wind-up), an impact burst (cracked ground, flying chunks, dust ring) and a lingering follow-through (settling grit).
const SAND=['#e3b878','#c98f4c','#a8733c','#7a5230'],DUST='#c9a77a';
const rnd=(a,b)=>a+Math.random()*(b-a);
function puff(fx,x,y,z,vx,vy,size,life,color=DUST){emit(fx,{kind:'smoke',x,y,z,vx,vy,vz:rnd(8,26),drag:2.2,life,size,grow:size*1.6,color});}
function chunks(fx,x,y,z,n,sp,up,sz=[2.5,6]){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rnd(sp[0],sp[1]);emit(fx,{kind:'shard',x,y,z,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,vz:rnd(up[0],up[1]),g:720,life:rnd(.8,1.3),size:rnd(sz[0],sz[1]),rot:Math.random()*TAU,vr:rnd(-9,9),color:SAND[i%4]});}}
function dustRing(fx,x,y,n,r,v,size){for(let i=0;i<n;i++){const a=i/n*TAU+Math.random()*.3;puff(fx,x+Math.cos(a)*r,y+Math.sin(a)*r*.6,4,Math.cos(a)*v,Math.sin(a)*v*.6,size,rnd(.9,1.4));}}
function slam(fx,x,y,k){fx.effects.push({kind:'boulder',x,y,age:0,duration:.6});chunks(fx,x,y,8,Math.round(14*k),[90,260*k],[160,320*k]);dustRing(fx,x,y,Math.round(10*k),20,110*k,16*k);puff(fx,x,y,10,0,0,26*k,1.1);}
function golemFx(fx,b,dt,chance){
 if(b.sleeping)return;const s=(b.scale??2.35)/2.1;
 if(b.state==='dead'){if(!b.fxDeath){b.fxDeath=true;chunks(fx,b.x,b.y,90*s,30,[60,220],[60,260],[3,7]);for(let i=0;i<14;i++)puff(fx,b.x+rnd(-50,50)*s,b.y+rnd(-20,20),rnd(10,90)*s,rnd(-40,40),rnd(-20,20),rnd(18,30)*s,rnd(1.2,1.8));}return;}
 if(b.state!=='alive')return;
 // body grit: sand and pebbles trickle off the rock plates and settle
 if(chance(.22))emit(fx,{kind:'shard',x:b.x+rnd(-42,42)*s,y:b.y+rnd(-4,6),z:rnd(60,150)*s,vx:rnd(-12,12),vy:0,vz:rnd(-10,20),g:520,life:rnd(.9,1.4),size:rnd(1.2,2.6),rot:Math.random()*TAU,vr:rnd(-6,6),color:SAND[Math.random()*4|0]});
 const sp=b.special,sw=b.swing;
 // footsteps
 if(b.moving&&!sp){b.fxStep=(b.fxStep??0)-dt;if(b.fxStep<=0){b.fxStep=.34;b.fxFoot=-(b.fxFoot??1);puff(fx,b.x+b.fxFoot*18*s,b.y+4,3,rnd(-15,15),rnd(-6,6),11*s,.8);if(Math.random()<.5)chunks(fx,b.x+b.fxFoot*18*s,b.y+4,3,2,[20,60],[60,120],[1.5,3]);}}
 // melee: Sweep = dust arc in front, Smash = cracked ground + chunks + dust ring
 if(sw?.fired&&!sw.fxDone){sw.fxDone=true;const x=b.x+Math.cos(sw.angle)*60*s,y=b.y+Math.sin(sw.angle)*40*s;
  if(sw.kind==='smash')slam(fx,x,y,1.1);else for(let i=0;i<7;i++){const a=sw.angle+(i/6-.5)*2.2;puff(fx,b.x+Math.cos(a)*80*s,b.y+Math.sin(a)*52*s,8,Math.cos(a)*70,Math.sin(a)*45,13*s,.9);}}
 if(sp){
  if(sp.kind==='rings'&&sp.fired&&!sp.fxDone){sp.fxDone=true;slam(fx,b.x,b.y+6,1.6);fx.effects.push({kind:'boulder',x:b.x-40*s,y:b.y+10,age:0,duration:.6},{kind:'boulder',x:b.x+40*s,y:b.y+10,age:0,duration:.6});}
  if(sp.kind==='boulders'){if(!sp.fired&&sp.elapsed>sp.windup*.4&&chance(.5))emit(fx,{kind:'shard',x:b.x+rnd(-26,26)*s,y:b.y+rnd(-6,6),z:rnd(150,190)*s,vx:rnd(-30,30),vy:rnd(-10,10),vz:rnd(0,40),g:700,life:1.1,size:rnd(1.8,3.6),rot:0,vr:rnd(-8,8),color:SAND[Math.random()*4|0]});
   if(sp.fired&&!sp.fxDone){sp.fxDone=true;chunks(fx,b.x,b.y,175*s,10,[30,120],[80,220]);for(let i=0;i<5;i++)puff(fx,b.x+rnd(-30,30)*s,b.y,rnd(150,190)*s,rnd(-30,30),0,14*s,1);puff(fx,b.x,b.y+4,3,0,0,20*s,1);}}
  if(sp.kind==='charge'){const rushing=sp.elapsed>=sp.windup&&!sp.done;
   if(!rushing&&chance(.35))puff(fx,b.x+rnd(-20,20)*s,b.y+4,3,rnd(-20,20),rnd(-8,8),9*s,.7);
   if(rushing&&chance(1)){const bx=b.x-Math.cos(sp.angle)*30*s,by=b.y-Math.sin(sp.angle)*18*s;puff(fx,bx+rnd(-14,14),by+rnd(-6,6),4,-Math.cos(sp.angle)*60+rnd(-20,20),-Math.sin(sp.angle)*36,14*s,.9);if(chance(.6))chunks(fx,bx,by,4,1,[40,120],[80,180],[1.5,3.5]);}
   b.fxCharge=true;if(sp.done&&!sp.fxSkid){sp.fxSkid=true;slam(fx,b.x,b.y,.8);}if(!sp.done)sp.fxSkid=false;}
 }
 if(b.fxCharge&&sp?.kind!=='charge'){b.fxCharge=false;slam(fx,b.x,b.y,.8);}
}
// ---------- simulation-time particles ----------
export function tickEliteFx(r,c,dt){
 const fx=r.fx??={effects:[],efx:[]};fx.clock=(fx.clock??0)+dt;
 const chance=p=>Math.random()<Math.min(1,p*dt*60);
 for(const b of c.targets)if(b.bossSkin==='golem')golemFx(fx,b,dt,chance);
 for(const h of r.hazards){
  if(!h.fxLanded&&h.age>=h.warning){h.fxLanded=true;
   if(h.kind==='frost')fx.effects.push({kind:'glacial',element:'cryo',x:h.x,y:h.y,radius:h.radius*.7,scale:.4,age:0,duration:.9});
   if(h.kind==='explosion'&&h.fx==='rock'){fx.effects.push({kind:'boulder',x:h.x,y:h.y,age:0,duration:.6});burst(fx,h.x,h.y,8,'earth',16,{speed:[90,280],up:[140,320],life:[.6,1.1],kind:'shard',size:[3,8],g:620});}
   // Oct 17: titan hazards: fx 'rock' (Boulder Hurl), 'sand' (Wyrm), 'quake' (Colossus slams) skip the fire surge; their own VFX modules draw the impact.
   if(h.kind==='explosion'&&(h.fx==='sand'||h.fx==='quake'))for(let i=0;i<10;i++){const q=Math.random()*TAU;emit(fx,{kind:'smoke',x:h.x+Math.cos(q)*h.radius*.4,y:h.y+Math.sin(q)*h.radius*.26,z:4,vx:Math.cos(q)*110,vy:Math.sin(q)*55,vz:30,drag:2,life:1,size:18,grow:30,color:h.fx==='sand'?'#c9a674':'#4a4038'});}
   if(h.kind==='explosion'&&!h.fx)fx.effects.push({kind:'surge',element:'pyro',x:h.x,y:h.y,radius:h.radius,scale:h.death?1.3:.85,big:h.death,age:0,duration:1.2});
   if(h.kind==='boulder'){fx.effects.push({kind:'boulder',x:h.x,y:h.y,age:0,duration:.6});burst(fx,h.x,h.y,6,'earth',14,{speed:[80,240],up:[120,280],life:[.6,1],kind:'shard',size:[3,7],g:620});for(let i=0;i<8;i++){const q=Math.random()*TAU;emit(fx,{kind:'smoke',x:h.x+Math.cos(q)*20,y:h.y+Math.sin(q)*12,z:4,vx:Math.cos(q)*90,vy:Math.sin(q)*45,vz:20,drag:2,life:1,size:16,grow:28,color:'#b89868'});}}
   if(h.kind==='wall'){burst(fx,h.x,h.y,4,'earth',8,{speed:[60,180],up:[120,260],life:[.5,.9],kind:'shard',size:[3,6],g:620});for(let i=0;i<4;i++)emit(fx,{kind:'smoke',x:h.x+(Math.random()-.5)*30,y:h.y,z:4,vx:(Math.random()-.5)*60,vz:30,life:.9,size:14,grow:26,color:'#b89868'});}}
  if(h.kind==='explosion'&&!h.fx&&h.age<h.warning&&chance(.4))burst(fx,h.x+(Math.random()-.5)*h.radius,h.y+(Math.random()-.5)*h.radius*.6,2,'pyro',1,{speed:[5,20],up:[30,80],life:[.3,.5],kind:'ember',g:20});
  if(h.kind==='frost'&&h.age>=h.warning&&chance(.25))burst(fx,h.x+(Math.random()-.5)*h.radius,h.y+(Math.random()-.5)*h.radius*.6,4,'cryo',1,{speed:[5,20],up:[20,50],life:[.6,1],kind:'flake',g:10});
  if(h.kind==='wall'&&!h.fxCrumble&&h.age>h.warning+h.duration-.08){h.fxCrumble=true;burst(fx,h.x,h.y,10,'earth',6,{speed:[40,120],up:[40,120],life:[.4,.7],kind:'shard',size:[3,5],g:500});emit(fx,{kind:'smoke',x:h.x,y:h.y,z:6,vz:20,life:.8,size:16,grow:24,color:'#b89868'});}
 }
 for(const b of c.targets)if(b.role==='boss'&&b.special?.kind==='charge'&&b.special.elapsed>=b.special.windup&&b.moving){b.fxDustCredit=(b.fxDustCredit??0)+dt*120;const n=Math.floor(b.fxDustCredit);b.fxDustCredit-=n;for(let i=0;i<n;i++)emit(fx,{kind:'smoke',x:b.x+(Math.random()-.5)*40,y:b.y,z:4,vx:-Math.cos(b.special.angle)*60,vy:-Math.sin(b.special.angle)*30,vz:20,life:.8,size:18,grow:26,color:'#b89868'});}
 for(const h of r.hazards)if(h.kind==='ring'&&h.r>8&&chance(.8)){const g=Math.random()*TAU;emit(fx,{kind:'smoke',x:h.x+Math.cos(g)*h.r,y:h.y+Math.sin(g)*h.r*.65,z:6,vx:Math.cos(g)*40,vy:Math.sin(g)*20,vz:30,drag:2,life:.8,size:12,grow:22,color:'#c9a674'});}
 for(const t of c.targets){if(t.role!=='leader'||t.state!=='alive'||t.emerge>0)continue;const L=look(t),s=t.scale??2.3,a=Math.random()*TAU,x=t.x+Math.cos(a)*22*s,y=t.y+Math.sin(a)*10*s;
  if(!chance(.45))continue;
  if(t.modifier==='frostbound')burst(fx,x,y,10+Math.random()*60*s/2.3,'cryo',1,{speed:[5,20],up:[10,40],life:[.8,1.2],kind:'flake',g:5});
  else if(t.modifier==='waller')emit(fx,{kind:'smoke',x,y,z:2,vz:15,life:.7,size:8,grow:14,color:'#b89868'});
  else if(t.modifier==='explosive'||t.modifier==='berserker')burst(fx,x,y,6,L.fx,1,{speed:[5,25],up:[60,140],life:[.4,.8],kind:'ember',g:20});
  else if(t.modifier==='vampiric')emit(fx,{kind:'drop',x,y,z:30+Math.random()*40,vz:10,g:300,life:.5,size:1.8,color:'#a8173a'});
  else burst(fx,x,y,10+Math.random()*60,L.fx,1,{speed:[5,15],up:[20,50],life:[.7,1.1],kind:'mote',g:0});
 }
 for(const e of fx.effects)e.age+=dt;fx.effects=fx.effects.filter(e=>e.age<e.duration);
 tickEFx(fx,dt);
}

// ---------- elite body: behind (ground sigil, rim glow, far orbiters) and in front (near orbiters) ----------
function orbiters(ctx,t,time,front){
 const L=look(t),s=(t.scale??2.3)/2.3,cx=t.x,cy=t.y-42*s,n=t.modifier==='warding'?5:4,raging=t.modifier==='berserker'&&t.rageModifier>1;
 for(let i=0;i<n;i++){const a=time*(t.modifier==='waller'?.9:1.8)+i/n*TAU;if((Math.sin(a)>=0)!==front)continue;const x=cx+Math.cos(a)*44*s,y=cy+Math.sin(a)*16*s+Math.sin(time*3+i)*6*s;ctx.save();ctx.translate(x,y);
  if(t.modifier==='frostbound'){ctx.rotate(Math.sin(time*2+i)*.5);ctx.fillStyle='#b4dcea';ctx.strokeStyle='#e8f8ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-9*s);ctx.lineTo(4*s,0);ctx.lineTo(0,9*s);ctx.lineTo(-4*s,0);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(t.modifier==='waller'){ctx.rotate(a);ctx.fillStyle=i%2?'#7a5a3a':'#9c6b3a';ctx.beginPath();ctx.moveTo(-6*s,-3*s);ctx.lineTo(-1*s,-7*s);ctx.lineTo(6*s,-2*s);ctx.lineTo(4*s,5*s);ctx.lineTo(-4*s,5*s);ctx.closePath();ctx.fill();}
  else if(t.modifier==='vampiric'){ctx.fillStyle='#a8173a';ctx.beginPath();ctx.arc(0,0,3.5*s,0,TAU);ctx.fill();ctx.fillStyle='#ffd6dc';ctx.beginPath();ctx.arc(-1,-1,1.2*s,0,TAU);ctx.fill();}
  else if(t.modifier==='shielded'){ctx.rotate(a);ctx.fillStyle='#fff3c8';ctx.strokeStyle='#b8862a';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<6;j++){const q=j/6*TAU;j?ctx.lineTo(Math.cos(q)*6*s,Math.sin(q)*6*s):ctx.moveTo(6*s,0);}ctx.closePath();ctx.fill();ctx.stroke();}
  else if(t.modifier==='warding'){ctx.strokeStyle=L.mid;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-7*s);ctx.lineTo(5*s,4*s);ctx.lineTo(-5*s,4*s);ctx.closePath();ctx.stroke();}
  ctx.restore();
  if(t.modifier!=='explosive'&&t.modifier!=='berserker')radialGlow(ctx,x,y,12*s,[[0,L.mid+'88'],[1,L.glow+'00']],1);}
 // Explosive and berserker burn instead of orbiting: flame tongues ring the feet.
 if(t.modifier==='explosive'||t.modifier==='berserker'){const m=raging?1.5:1;for(let i=0;i<7;i++){const a=i/7*TAU+time*.7;if((Math.sin(a)>=0)!==front)continue;tongue(ctx,t.x+Math.cos(a)*26*s,t.y+Math.sin(a)*10*s,7*s,(26+10*Math.sin(time*13+i*2))*s*m,front?.55:.75,{core:L.core,mid:L.mid,glow:L.glow});}}
}
export function drawEliteBack(ctx,t,time){
 const L=look(t),s=(t.scale??2.3)/2.3,pulse=.85+.15*Math.sin(time*3+(t.id??0));
 // Ground sigil: two counter-rotating rings with rune ticks in the type colour.
 radialGlow(ctx,t.x,t.y,58*s,[[0,L.mid+'55'],[1,L.mid+'00']],pulse,.5);
 ctx.save();ctx.translate(t.x,t.y);ctx.scale(1,.48);ctx.strokeStyle=L.mid;ctx.lineCap='round';
 ctx.rotate(time*.8);ctx.globalAlpha=.75;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,50*s,0,TAU);ctx.stroke();ctx.lineWidth=3.2;for(let i=0;i<8;i++){const a=i/8*TAU;ctx.beginPath();ctx.arc(0,0,43*s,a,a+.35);ctx.stroke();}
 ctx.rotate(-time*2);ctx.globalAlpha=.5;ctx.lineWidth=1.6;ctx.strokeStyle=L.core;ctx.beginPath();for(let i=0;i<=6;i++){const a=i/6*TAU;i?ctx.lineTo(Math.cos(a)*34*s,Math.sin(a)*34*s):ctx.moveTo(34*s,0);}ctx.stroke();ctx.restore();
 // Rim glow behind the sprite so the silhouette reads as empowered.
 radialGlow(ctx,t.x,t.y-44*s,64*s,[[0,L.mid+'00'],[.55,L.mid+'38'],[.85,L.mid+'22'],[1,L.mid+'00']],pulse,1.25);
 if(t.modifier==='warding'){const q=(time*.5+(t.id??0)*.13)%1;ctx.save();ctx.globalAlpha=(1-q)*.35;ctx.strokeStyle=L.mid;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(t.x,t.y,240*q,240*q*.6,0,0,TAU);ctx.stroke();ctx.restore();}
 orbiters(ctx,t,time,false);
}
export function drawEliteFront(ctx,t,time){orbiters(ctx,t,time,true);}
// Shielded barrier: a golden dome over the elite (replaces the pack parry sprite).
export function drawEliteShield(ctx,t,time){
 const s=(t.scale??2.3)/2.3,cx=t.x,cy=t.y-46*s,rx=50*s,ry=64*s,p=.8+.2*Math.sin(time*8);
 radialGlow(ctx,cx,cy,ry,[[0,'#ffd77a00'],[.7,'#ffd77a33'],[.92,'#fff3c877'],[1,'#ffd77a00']],p,rx/ry*1.3);
 ctx.save();ctx.globalAlpha=.8*p;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,TAU);ctx.stroke();ctx.globalAlpha=.3;ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(cx,cy,Math.max(2,rx*Math.cos(i*.4+time*.5)),ry,0,0,TAU);ctx.stroke();}ctx.restore();
}
export function drawWardLink(ctx,t,time){ctx.save();ctx.globalAlpha=.4+.15*Math.sin(time*4);ctx.strokeStyle='#b48cff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(t.x,t.y,38,21,0,0,TAU);ctx.stroke();ctx.restore();radialGlow(ctx,t.x,t.y-30,40,[[0,'#b48cff00'],[.6,'#b48cff2a'],[1,'#b48cff00']],1,1.3);}

// ---------- mini-boss (Dune Ravager) ----------
function drawRock(ctx,x,y,r,rot,alpha){if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle='#7a5a3a';ctx.beginPath();const pts=[[1,0],[.7,.65],[0,1],[-.75,.7],[-1,.05],[-.6,-.7],[.1,-1],[.75,-.6]];pts.forEach(([a,b],i)=>i?ctx.lineTo(a*r,b*r):ctx.moveTo(a*r,b*r));ctx.closePath();ctx.fill();ctx.fillStyle='#5a3a24';ctx.beginPath();ctx.moveTo(.7*r,.65*r);ctx.lineTo(0,r);ctx.lineTo(-.75*r,.7*r);ctx.lineTo(-.2*r,.2*r);ctx.closePath();ctx.fill();ctx.strokeStyle='#c9a46a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-.6*r,-.7*r);ctx.lineTo(.1*r,-r);ctx.lineTo(.75*r,-.6*r);ctx.stroke();ctx.restore();}
// Ominous presence sigil plus wind-up tells for the Ravager's special attacks (drawn behind its sprite).
export function drawBossFx(ctx,b,time){const sp=b.special,s=(b.scale??2.1)/2.1;
 if(b.bossSkin==='golem'&&!sp&&!b.swing&&![5,6,7].includes(b.row??2)){const k=.7+.3*Math.sin(time*7+b.id)*Math.sin(time*3.1),ex=b.x+([.13,.1,0,-.1,-.13][b.row??2]??0)*128*b.scale*.3,ey=b.y-142*s*1.12;ctx.save();ctx.globalCompositeOperation='lighter';radialGlow(ctx,ex,ey,18*s,[[0,'#ffd76a88'],[.4,'#ffb03a44'],[1,'#ff8a2a00']],k,1);ctx.restore();}
 radialGlow(ctx,b.x,b.y,84*s,[[0,'#5a0a0a66'],[1,'#5a0a0a00']],1,.5);
 ctx.save();ctx.translate(b.x,b.y);ctx.scale(1,.48);ctx.rotate(time*.5);ctx.strokeStyle='#c0402a';ctx.globalAlpha=.6;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,72*s,0,TAU);ctx.stroke();ctx.lineWidth=3.5;for(let i=0;i<10;i++){const a=i/10*TAU;ctx.beginPath();ctx.arc(0,0,62*s,a,a+.3);ctx.stroke();}ctx.restore();
 if(!sp)return;const k=clamp01(sp.elapsed/sp.windup);
 if(sp.kind==='boulders'&&k<1)for(let i=0;i<3;i++){const q=(k*2+i/3)%1;ctx.save();ctx.globalAlpha=(1-q)*.7;ctx.strokeStyle='#ff5a3a';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(b.x,b.y-50*s,30+90*q,(30+90*q)*.7,0,0,TAU);ctx.stroke();ctx.restore();}
 if(sp.kind==='rings'&&k<1){const R=160*(1-k)+20;ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='#ffd27a';ctx.lineWidth=3+6*k;ctx.beginPath();ctx.ellipse(b.x,b.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.restore();radialGlow(ctx,b.x,b.y-30,60*k+20,[[0,'#ffd27a88'],[1,'#ff7a2a00']],k);}
 if(sp.kind==='charge')radialGlow(ctx,b.x,b.y-40*s,70*s,[[0,'#ff3a2a66'],[1,'#ff3a2a00']],k>=1?1:k*.6,1);
}

// ---------- elite spells ----------
function crack(ctx,x1,y1,x2,y2,seed,grow,width,color,alpha){const r=rng(seed),n=6;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);for(let i=1;i<=n*grow;i++){const f=i/n,o=i<n?(r()-.5)*10:0;ctx.lineTo(x1+(x2-x1)*f-(y2-y1)/Math.hypot(x2-x1,y2-y1||1)*o,y1+(y2-y1)*f+(x2-x1)/Math.hypot(x2-x1,y2-y1||1)*o);}ctx.stroke();ctx.restore();}
// Stone spike: lit left face, shaded right face, dark outline and a contact shadow (sun upper-left).
function spike(ctx,x,y,w,h,j,a){if(h<2)return;const tip=x+(j-.5)*w*.6;ctx.globalAlpha=.35*a;ctx.fillStyle='#24140a';ctx.beginPath();ctx.ellipse(x+3,y+1,w*1.1,w*.45,0,0,TAU);ctx.fill();ctx.globalAlpha=a;
 ctx.fillStyle='#c9a26c';ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(tip,y-h);ctx.lineTo(x+w*.15,y+1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#6e4a2c';ctx.beginPath();ctx.moveTo(x+w*.15,y+1);ctx.lineTo(tip,y-h);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#2a180c';ctx.lineWidth=1.2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(tip,y-h);ctx.lineTo(x+w,y);ctx.stroke();
 ctx.strokeStyle='rgba(255,236,190,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-w*.55,y-h*.15);ctx.lineTo(tip-.5,y-h*.9);ctx.stroke();}
function drawFrostGround(ctx,h,fade=1){
 const rr=rng(h.id??Math.floor(h.x*7+h.y));
 radialGlow(ctx,0,0,h.radius,[[0,'#9fd0e488'],[.6,'#6cc0e055'],[.92,'#4aa8d855'],[1,'#4aa8d800']],fade,.65);
 ctx.save();ctx.globalAlpha=.6*fade;ctx.strokeStyle='#d8f2fb';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,0,h.radius*.97,h.radius*.63,0,0,TAU);ctx.stroke();
 for(let i=0;i<7;i++){const a=i/7*TAU+rr()*.5,len=h.radius*(.5+.4*rr());ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len*.65);ctx.stroke();}ctx.restore();
}
export function drawEliteHazardsFx(ctx,r,time){
 const fx=r.fx;
 if(fx)drawEGround(ctx,fx);
 const walls=r.hazards.filter(h=>h.kind==='wall');
 for(const h of r.hazards){const warn=h.age<h.warning,k=clamp01(h.age/h.warning);
  if(h.kind==='frost'){
   if(warn){const L=ELITE_LOOK.frostbound;radialGlow(ctx,h.x,h.y,h.radius*(.3+.7*k),[[0,'#2a7ab055'],[1,'#2a7ab000']],.4+.6*k,.65);sigil(ctx,h.x,h.y,h.radius,k,h.age*3,{mid:L.mid,glow:L.glow});
    const sx=h.fromX+(h.x-h.fromX)*k,sy=h.fromY+(h.y-h.fromY)*k,z=Math.sin(k*Math.PI)*120+30;
    radialGlow(ctx,sx,sy,10,[[0,'#00000044'],[1,'#00000000']],1,.5);
    for(let g=3;g>=0;g--){const q=Math.max(0,k-g*.04),gx=h.fromX+(h.x-h.fromX)*q,gy=h.fromY+(h.y-h.fromY)*q-(Math.sin(q*Math.PI)*120+30);radialGlow(ctx,gx,gy,(10-g*2),[[0,'#e8f8ff'],[.4,'#7fd3f2cc'],[1,'#2a7ab000']],g?.5/g:1);}
    ctx.save();ctx.translate(sx,sy-z);ctx.rotate(h.age*9);ctx.fillStyle='#b4dcea';ctx.strokeStyle='#e8f8ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(5,0);ctx.lineTo(0,11);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
   else{const life=h.age-h.warning,fade=Math.min(1,life/.2)*(1-clamp01((life-h.duration+.5)/.5));
    if(!effectVisible(h.x,h.y-25,h.radius+50,h.radius*.65+75))continue;
    const ground=cachedSurface(h,'frost-ground',[-h.radius,-h.radius*.65,h.radius,h.radius*.65],g=>drawFrostGround(g,h));
    if(ground){ctx.save();ctx.globalAlpha=fade;ctx.drawImage(ground.canvas,h.x+ground.x,h.y+ground.y);ctx.restore();}
    else{ctx.save();ctx.translate(h.x,h.y);drawFrostGround(ctx,h,fade);ctx.restore();}
    h.fxSpikes??=makeSpikes(h.radius*.75,(h.x*13+h.y*7)|0,.32);drawSpikes(ctx,h.x,h.y,h.fxSpikes,life,h.duration-.15);}}
  if(h.kind==='wall'){const L=ELITE_LOOK.waller,mates=walls.filter(o=>o.group!=null&&o.group===h.group&&o.idx===h.idx+1);
   if(warn){for(const o of mates)crack(ctx,h.x,h.y,o.x,o.y,(h.idx??0)*17+3,k,3,'#2a180c',.8),crack(ctx,h.x,h.y,o.x,o.y,(h.idx??0)*17+3,k,1.6,'#ffb347',.9*k);
    radialGlow(ctx,h.x,h.y,26,[[0,'#ffb34766'],[1,'#ff7a2a00']],.4+.6*k*(.7+.3*Math.sin(time*20)),.6);ctx.save();ctx.globalAlpha=.8;ctx.strokeStyle=L.mid;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(h.x,h.y,24*k,14*k,0,0,TAU);ctx.stroke();ctx.restore();}
   else if(!h.solid){ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=L.mid;ctx.setLineDash([4,4]);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(h.x,h.y,24,14,0,0,TAU);ctx.stroke();ctx.restore();}
   else{radialGlow(ctx,h.x,h.y,30,[[0,'#2a180c55'],[1,'#2a180c00']],1,.55);}}
  if(h.kind==='explosion'&&warn&&!h.fx){const L=ELITE_LOOK.explosive,beat=.6+.4*Math.sin(time*(10+k*20));
   radialGlow(ctx,h.x,h.y,h.radius*k,[[0,'#ff7a2a66'],[.8,'#b0200e44'],[1,'#b0200e00']],.5+.5*k,.65);
   sigil(ctx,h.x,h.y,h.radius,k,h.age*(2+k*4),{mid:L.mid,glow:L.glow});
   ctx.save();ctx.globalAlpha=.9*beat;ctx.strokeStyle='#ffd27a';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius*(1-k)+6,(h.radius*(1-k)+6)*.65,0,0,TAU);ctx.stroke();ctx.restore();}
  if(h.kind==='boulder'){
   if(warn){const z=520*(1-k)*(1-k);radialGlow(ctx,h.x,h.y,h.radius*(.3+.7*k),[[0,'#1a0c06aa'],[1,'#1a0c0600']],.3+.6*k,.6);
    ctx.save();ctx.strokeStyle='#ff6a3a';ctx.globalAlpha=.5+.4*Math.sin(time*18);ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius,h.radius*.65,0,0,TAU);ctx.stroke();ctx.globalAlpha=.9;ctx.strokeStyle='#ffd27a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius*(1-k)+4,(h.radius*(1-k)+4)*.65,0,0,TAU);ctx.stroke();ctx.restore();
    if(k>.2){const y=h.y-z-20;ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle='#c9a46a';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(h.x,y-70);ctx.lineTo(h.x,y);ctx.stroke();ctx.restore();drawRock(ctx,h.x,y,20,h.age*4,1);}}
   else drawRock(ctx,h.x,h.y-10,20,0,1-clamp01((h.age-h.warning)/h.duration));}
  if(h.kind==='ring'&&!warn&&h.r>4&&!h.obsidian){
   // Earth-spike wave (Oct 15, user): stone spikes burst up along the expanding front; rows behind it sink back into a crack.
   const fade=1-clamp01((h.age-h.warning-h.duration*.8)/(h.duration*.2)),gaps=[...(h.gaps??[h.gap])].sort((x,y)=>x-y),R=h.r;
   ctx.save();
   gaps.forEach((g,i)=>{const a0=g+h.gapHalf,a1=(gaps[i+1]??gaps[0]+TAU)-h.gapHalf;
    // Ground crack and churned dirt trailing the front.
    ctx.lineCap='round';for(const [rr,lw,col,al] of [[R-20,h.band*2.4,'#5a3a22',.35],[R-6,5,'#2a180c',.8],[R-6,1.5,'#ffb070',.35]]){if(rr<4)continue;ctx.globalAlpha=al*fade;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.ellipse(h.x,h.y,rr,rr*.65,0,a0,a1);ctx.stroke();}
    // Rows from back to front so nearer spikes overlap: [radius offset, height scale].
    for(const [off,hs] of [[-54,.28],[-34,.6],[-14,1],[0,.55]]){const rr=R+off;if(rr<6)continue;const n=Math.max(1,Math.floor((a1-a0)*rr/24));
     for(let k=0;k<n;k++){const seed=Math.sin((k+1)*12.9898+off*78.233+i*37.7)*43758.5453,j=seed-Math.floor(seed),a=a0+(k+.3+.4*j)/n*(a1-a0),x=h.x+Math.cos(a)*rr,y=h.y+Math.sin(a)*rr*.65;
      // The front row is still punching up; it rises over the first frames it exists.
      const rise=off===0?.35+.65*clamp01(Math.sin(time*30+k)*.5+.5):1,H=(26+22*j)*hs*rise,W=7+5*j*hs+3*hs;spike(ctx,x,y,W,H,j,fade);}}
    // Dust kicked up at the front.
    const m=Math.max(1,Math.floor((a1-a0)*R/60));for(let k=0;k<m;k++){const a=a0+(k+.5)/m*(a1-a0),x=h.x+Math.cos(a)*(R+4),y=h.y+Math.sin(a)*(R+4)*.65;radialGlow(ctx,x,y-6,22,[[0,'#d8b88488'],[1,'#d8b88400']],.7*fade,.55);}});
   ctx.restore();
   }
  // Oct 16 boss hazards.
  if(h.kind==='fire'){const life=h.age-h.warning,fade=Math.min(1,life/.15)*Math.max(0,1-(life-h.duration+.6)/.6);radialGlow(ctx,h.x,h.y,h.radius*1.2,[[0,'#ffd27acc'],[.45,'#ff5a1aaa'],[1,'#7a100000']],fade*(.75+.25*Math.sin(time*14+h.x)),.6);
   ctx.save();ctx.globalAlpha=fade*.9;ctx.fillStyle='#ffb347';for(let i=0;i<3;i++){const q=((time*1.6+i/3+h.x*.01)%1),fx=h.x+Math.sin(i*2.1+h.y)*h.radius*.5;ctx.globalAlpha=fade*(1-q);ctx.beginPath();ctx.ellipse(fx,h.y-q*34,4*(1-q)+1,9*(1-q)+2,0,0,TAU);ctx.fill();}ctx.restore();}
  if(h.kind==='safezone'){const pulse=.6+.4*Math.sin(time*8);radialGlow(ctx,h.x,h.y,h.radius,[[0,'#7fffb055'],[1,'#7fffb000']],1,.65);ctx.save();ctx.strokeStyle='#9dffc0';ctx.lineWidth=4;ctx.globalAlpha=pulse;ctx.beginPath();ctx.ellipse(h.x,h.y,h.radius,h.radius*.65,0,0,TAU);ctx.stroke();ctx.font='bold 13px Inter, sans-serif';ctx.textAlign='center';ctx.fillStyle='#d8ffe6';ctx.globalAlpha=1;ctx.fillText('SAFE',h.x,h.y+5);ctx.restore();}
  if(h.kind==='cataclysm'){const k=clamp01(h.age/h.warning);if(warn){ctx.save();ctx.globalAlpha=.08+.22*k*(.7+.3*Math.sin(time*(6+k*20)));ctx.fillStyle='#ff2a1a';ctx.fillRect(h.x-2600,h.y-2000,5200,4000);ctx.restore();}else radialGlow(ctx,h.x,h.y,1400,[[0,'#ffe0b0ee'],[.3,'#ff3a1acc'],[1,'#5a000000']],1-clamp01((h.age-h.warning)/h.duration),.7);}
  if(h.kind==='firering'&&h.r){const fade=h.age<h.warning?.4+.6*clamp01(h.age/h.warning):1;ctx.save();ctx.globalAlpha=.18*fade;ctx.fillStyle='#ff3a1a';ctx.beginPath();ctx.rect(h.x-2600,h.y-2000,5200,4000);ctx.ellipse(h.x,h.y,h.r,h.r*.72,0,0,TAU,true);ctx.fill('evenodd');ctx.restore();
   const n=Math.ceil(h.r*TAU/40);ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const a=i/n*TAU,x=h.x+Math.cos(a)*h.r,y=h.y+Math.sin(a)*h.r*.72,q=(time*2+i*.37)%1;ctx.globalAlpha=fade*(.7-.5*q);ctx.fillStyle=i%2?'#ff7a2a':'#ffcf5a';ctx.beginPath();ctx.ellipse(x,y-q*40,9*(1-q)+3,18*(1-q)+4,0,0,TAU);ctx.fill();}ctx.restore();}
  if(h.kind==='lane'&&!h.hidden){const L=h.len,W=h.width;ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.angle);const g=ctx.createLinearGradient(0,0,L,0);g.addColorStop(0,'#ff3a2a66');g.addColorStop(1,'#ff3a2a22');ctx.fillStyle=g;ctx.fillRect(0,-W/2,L,W);ctx.fillStyle='#ff6a3a55';ctx.fillRect(0,-W/2,L*k,W);
   ctx.strokeStyle='#ff8a5a';ctx.lineWidth=2.5;ctx.globalAlpha=.6+.4*Math.sin(time*20);ctx.strokeRect(0,-W/2,L,W);ctx.lineWidth=3;for(let i=1;i<7;i++){const x=L*i/7;ctx.globalAlpha=.9*((((time*3-i*.15)%1)+1)%1);ctx.beginPath();ctx.moveTo(x-10,-14);ctx.lineTo(x+5,0);ctx.lineTo(x-10,14);ctx.stroke();}ctx.restore();}
 }
}
export function drawEliteSpellsUpper(ctx,r){if(r.fx)drawEUpper(ctx,r.fx);}
export {E_PALETTE};
