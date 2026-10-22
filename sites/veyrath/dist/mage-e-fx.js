// Mage E visuals: Chain Lightning (storm), Flame Surge (pyro), Glacial Burst (cryo).
// Code-native art (user decision Oct 15: FX need not come from packs).
// mage.js pushes effect records; tickEFx owns visual-only particles so they pause with the
// simulation; draw functions only read state. Blood E (Sanguine Drain) stays in blood-mage.js.
import {shaderFx} from './mage-vfx.js?v=fx-260';
import {createFrameCache} from './sprite-cache.js?v=fx-260';
import {gfx} from './quality.js?v=fx-260';
import {tipNear} from './hero-anchor.js?v=fx-260';
import {cachedGlow,cachedSurface,effectVisible} from './effect-cache.js?v=fx-260';
export const TAU=Math.PI*2,BODY=36;const HOP=.045,GROW=.05,SHATTER=.62,MAX_PARTICLES=900,FX_DENSITY=1.5;
export const clamp01=v=>Math.max(0,Math.min(1,v)),easeOut=t=>1-Math.pow(1-clamp01(t),3);
export function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
export const E_PALETTE={
 gold:{core:'#fff6d6',mid:'#ffc94a',glow:'#c78a12',spark:['#fffbe8','#ffe08a','#ffc94a','#e8a325']},
 verdant:{core:'#effff0',mid:'#7be38a',glow:'#1f9a4a',spark:['#f2fff3','#b8f5c0','#7be38a','#38b862']},
 storm:{core:'#ffffff',mid:'#9d7bff',glow:'#5a2fe0',spark:['#ffffff','#e2d6ff','#a98bff','#a6d4ff']},
 pyro:{core:'#ffe9a0',mid:'#ff9a2e',glow:'#d8380f',spark:['#fff1b0','#ffc861','#ff8a2a','#ff5a1f']},
 cryo:{core:'#e8f8ff',mid:'#9fdcf0',glow:'#4ab4e0',spark:['#e2f6ff','#c4ecfa','#a8e6fb','#7fd3f2']},
 blood:{core:'#ffd6dc',mid:'#d0284f',glow:'#7a0c26',spark:['#ffc2cc','#e2475f','#a8173a','#6e0b22']},
 arcane:{core:'#ffffff',mid:'#b49cff',glow:'#5d47d6',spark:['#ffffff','#d8ccff','#9fd8ff','#b49cff']},
 void:{core:'#f3e8ff',mid:'#9b5cff',glow:'#2a0a4a',spark:['#ffffff','#c9a0ff','#7a3cff','#3a0f6a']},
 // Warrior path palettes (warrior-fx.js): Berserker rage, Vanguard steel/gold, Warlord earth/amber.
 rage:{core:'#ffe0c8',mid:'#ff5a3a',glow:'#8e1414',spark:['#ffd0b0','#ff7a4a','#e0301e','#8e1414']},
 steel:{core:'#fffbe8',mid:'#ffd77a',glow:'#b8862a',spark:['#ffffff','#ffe9a8','#e8c060','#cfd8e6']},
 earth:{core:'#ffe9b8',mid:'#e0a050',glow:'#6b4220',spark:['#f3d9a0','#d8a35a','#9c6b3a','#5a3a24']}
};
const HUE={pyro:28,storm:266,cryo:194,blood:346,arcane:244};
// Oct 17: the 3D Mage casts from hand height. Shots leave at ~48 px above their ground point and ease to enemy body
// height (34) over the first 260 px so they still meet the hit effects. Visual only.
/* Oct 18 (user: line effects up with the weapons): a shot is drawn leaving the 3D Mage's weapon tip (captured on its first
   draw from the hero that fired it) and eases onto its sim path / enemy body height (34 px) over the first 260 px. Visual only. */
function shotTip(b){if(b.tipD===undefined){const o=b.origin,A=o&&tipNear(o.x,o.y);b.tipD=A?{x:A.x-o.x,y:o.y-A.y}:null;}return b.tipD;}
const shotK=b=>{const o=b.origin;return 1-Math.min(1,(o?Math.hypot(b.x-o.x,b.y-o.y):999)/260);};
export function shotLift(b){const T=shotTip(b),k=shotK(b);return T?T.y*k+34*(1-k):48-14*(1-k);}
export function shotDX(b){const T=shotTip(b);return T?T.x*shotK(b):0;}
export function handPoint(p,angle){return {x:p.x+Math.cos(angle)*20,y:p.y+Math.sin(angle)*12,z:46};}
function castHand(m){const a=m.cast;if(!a||!m.castOrigin)return null;return handPoint({x:m.castOrigin.x,y:m.castOrigin.y+38},a.angle);}
// Any elemental cast (not the free arcane basic) gets hand gather/glow.
const eCast=m=>m.cast&&m.cast.kind!=='bolt'&&E_PALETTE[m.cast.spec?.element]?m.cast:null;

// ---------- particles (simulation-time, visual only) ----------
export function emit(m,p){
 const list=m.efx??=[];if(list.length>=Math.min(MAX_PARTICLES,gfx.particleCap))return;
 // Fractional accumulator gives stable thinning without flickering existing particles or random tests.
 m.fxCredit=(m.fxCredit??0)+gfx.particleDensity;if(m.fxCredit<1)return;m.fxCredit-=1;
 list.push({vx:0,vy:0,vz:0,g:0,drag:0,grow:0,rot:0,vr:0,...p,max:p.life});
}
export function burst(m,x,y,z,element,count,{speed=[60,220],up=[20,140],life=[.25,.6],size=[1.5,3.5],kind='spark',spread=0,g=220}={}){
 const colors=E_PALETTE[element].spark,n=Math.round(count*FX_DENSITY);
 for(let i=0;i<n;i++){const a=Math.random()*TAU,s=speed[0]+Math.random()*(speed[1]-speed[0]),r=spread*Math.sqrt(Math.random());
  emit(m,{kind,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.65,vz:up[0]+Math.random()*(up[1]-up[0]),g,drag:2.2,life:life[0]+Math.random()*(life[1]-life[0]),size:size[0]+Math.random()*(size[1]-size[0]),color:colors[i%colors.length],rot:Math.random()*TAU,vr:(Math.random()-.5)*14});}
}
export function makeSpikes(radius,seed,scale=1){
 const r=rng(seed),spikes=[];
 for(let i=0;i<5;i++){const a=r()*TAU,d=radius*(.05+.3*r());spikes.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65,h:(52+r()*30)*scale,w:(9+r()*5)*scale,lean:Math.cos(a)*(6+r()*10),delay:d/radius*.1});}
 const ring=13;for(let i=0;i<ring;i++){const a=i/ring*TAU+(r()-.5)*.4,d=radius*(.5+.38*r());spikes.push({dx:Math.cos(a)*d,dy:Math.sin(a)*d*.65,h:(24+r()*26)*scale,w:(6+r()*4)*scale,lean:Math.cos(a)*(10+r()*12),delay:.03+d/radius*.1});}
 return spikes.sort((a,b)=>a.dy-b.dy);
}
export function tickEFx(m,dt){
 const cast=eCast(m);
 if(cast&&!cast.fired){const h=castHand(m),el=cast.spec.element,colors=E_PALETTE[el].spark;
  // Energy gathers inward to the casting hand during the windup.
  m.efxGather=(m.efxGather??0)-dt;if(h&&m.efxGather<=0){m.efxGather=.016;for(let i=0;i<2;i++){const a=Math.random()*TAU,d=24+Math.random()*16,life=.16+Math.random()*.08;emit(m,{kind:'spark',x:h.x+Math.cos(a)*d,y:h.y+Math.sin(a)*d*.65,z:h.z+Math.sin(a*2)*10,vx:-Math.cos(a)*d/life,vy:-Math.sin(a)*d*.65/life,vz:0,life,size:1.2+Math.random()*1.6,color:colors[i%colors.length]});}}
 }
 for(const e of m.effects){const pal=E_PALETTE[e.element];if(!pal)continue;
  if(e.kind==='chain'){
   if(!e.efxInit){e.efxInit=true;e.seed=(Math.random()*1e9)|0;e.landed=0;if(e.hand)burst(m,e.hand.x,e.hand.y,e.hand.z,'storm',14,{speed:[40,160],up:[-20,60],life:[.15,.35],g:60});}
   while(e.landed<e.lines.length&&e.age>=e.landed*HOP+GROW){const l=e.lines[e.landed++];burst(m,l.toX,l.toY,BODY,'storm',16,{speed:[90,280],up:[-40,160],life:[.18,.45],size:[1.2,2.8]});burst(m,l.toX,l.toY,4,'storm',6,{speed:[30,90],up:[60,160],life:[.3,.6],kind:'ember',size:[1.5,2.5],g:260});}
  }
  if(e.kind==='surge'){
   if(!e.efxInit){e.efxInit=true;e.seed=(Math.random()*1e9)|0;
    const sc=e.scale??1;burst(m,e.x,e.y,6,'pyro',Math.round(36*Math.min(1.6,sc)),{speed:[40,200],up:[120,330],life:[.5,1.1],kind:'ember',size:[1.8,4],spread:e.radius*.35,g:140});
    burst(m,e.x,e.y,10,'pyro',Math.round(24*Math.min(1.6,sc)),{speed:[180,420],up:[40,220],life:[.2,.45],size:[1.4,3]});}
   if(e.age<.45){e.emberClock=(e.emberClock??0)-dt;if(e.emberClock<=0){e.emberClock=.03;const a=Math.random()*TAU,d=e.radius*(.3+.6*easeOut(e.age/.3));burst(m,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.65,4,'pyro',2,{speed:[10,50],up:[90,220],life:[.5,.9],kind:'ember',size:[1.5,3.2],g:60});}}
   if(e.age>.1&&!e.smoked){e.smoked=true;for(let i=0;i<Math.round(8*Math.min(1.6,e.scale??1));i++){const a=Math.random()*TAU,d=e.radius*.55*Math.random();emit(m,{kind:'smoke',x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d*.65,z:20+Math.random()*50,vx:Math.cos(a)*18,vy:Math.sin(a)*10,vz:30+Math.random()*30,life:.9+Math.random()*.6,size:14+Math.random()*12,grow:28,color:'#3b2a20'});}}
  }
  if(e.kind==='glacial'){
   if(!e.efxInit){e.efxInit=true;e.seed=(Math.random()*1e9)|0;e.spikes=makeSpikes(e.radius,e.seed,e.scale??1);
    burst(m,e.x,e.y,8,'cryo',Math.round(30*(e.scale??1)),{speed:[80,260],up:[40,200],life:[.4,.9],kind:'flake',size:[1.2,2.6],spread:e.radius*.4,g:90});
    for(let i=0;i<(e.scale<1?6:14);i++){const a=i/14*TAU;emit(m,{kind:'mist',x:e.x+Math.cos(a)*e.radius*.3,y:e.y+Math.sin(a)*e.radius*.2,z:6,vx:Math.cos(a)*e.radius*1.2,vy:Math.sin(a)*e.radius*.75,drag:3.2,life:.7+Math.random()*.3,size:16+Math.random()*10,grow:30,color:'#eafbff'});}}
   if(e.age>=SHATTER&&!e.shattered){e.shattered=true;for(const s of e.spikes){const x=e.x+s.dx,y=e.y+s.dy,n=s.h>45?5:s.h>25?3:2;for(let i=0;i<n;i++){const a=Math.random()*TAU,v=50+Math.random()*130;emit(m,{kind:'shard',x,y,z:s.h*(.2+.6*Math.random()),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.65,vz:60+Math.random()*140,g:520,drag:.6,life:.45+Math.random()*.35,size:3+Math.random()*4,rot:Math.random()*TAU,vr:(Math.random()-.5)*18,color:'#dff7ff'});}}
    burst(m,e.x,e.y,20,'cryo',26,{speed:[60,200],up:[30,150],life:[.35,.7],kind:'flake',spread:e.radius*.7,g:120});}
  }
 }
 ageEFx(m,dt);
}
// Shared particle-only step: guests never run spell simulation or emit entire effects again.
export function ageEFx(m,dt){
 const list=m.efx??[];for(let i=list.length-1;i>=0;i--){const p=list[i];p.life-=dt;if(p.life<=0){list.splice(i,1);continue;}
  const k=Math.exp(-p.drag*dt);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=p.g*dt;p.size=Math.max(.2,p.size+p.grow*dt);p.rot+=p.vr*dt;
  if(p.z<0&&p.kind==='icicle'){list.splice(i,1);burst(m,p.x,p.y,2,'cryo',8,{speed:[40,140],up:[40,120],life:[.25,.5],kind:'flake',g:200});burst(m,p.x,p.y,4,'cryo',3,{speed:[40,110],up:[80,160],life:[.3,.5],kind:'shard',size:[2,4],g:500});continue;}
  if(p.z<0){p.z=0;if(p.kind==='shard'||p.kind==='ember'||p.kind==='drop'){p.vz*=-.25;p.vx*=.4;p.vy*=.4;p.vr*=.5;}else p.vz=0;}
 }
}

// ---------- drawing helpers ----------
export function boltPoints(seed,x1,y1,x2,y2,rough=.3){
 const r=rng(seed),len=Math.hypot(x2-x1,y2-y1),nx=-(y2-y1)/(len||1),ny=(x2-x1)/(len||1);let pts=[[x1,y1],[x2,y2]],disp=len*rough;
 for(let level=0;level<5;level++){const next=[pts[0]];for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],o=(r()-.5)*disp;next.push([(ax+bx)/2+nx*o,(ay+by)/2+ny*o],[bx,by]);}pts=next;disp*=.5;}
 return pts;
}
export function strokePts(ctx,pts,upto=pts.length){if(upto<2)return;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<upto;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();}
// Bright sand washes additive colour out to white, so the coloured layers use normal
// blending and only the hot core is additive.
export function glowStroke(ctx,pts,upto,alpha,pal,scale=1){
 const op=ctx.globalCompositeOperation,prev=ctx.globalAlpha;
 for(const [w,a,c,add] of [[15,.2,pal.glow,false],[6,.85,pal.mid,false],[2.2,1,pal.core,true]]){ctx.globalCompositeOperation=add?'lighter':'source-over';ctx.globalAlpha=alpha*a;ctx.strokeStyle=c;ctx.lineWidth=w*scale;strokePts(ctx,pts,upto);}
 ctx.globalCompositeOperation=op;ctx.globalAlpha=prev;
}
export function radialGlow(ctx,x,y,r,stops,alpha=1,squash=1){
 cachedGlow(ctx,x,y,r,stops,alpha,squash);
}
export function sigil(ctx,x,y,radius,progress,time,pal){
 ctx.save();ctx.translate(x,y);ctx.scale(1,.65);ctx.strokeStyle=pal.glow;ctx.lineWidth=2;
 ctx.globalAlpha=.18+.5*progress;ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
 ctx.globalAlpha=.12+.4*progress;ctx.beginPath();ctx.arc(0,0,radius*(1-.55*progress),0,TAU);ctx.stroke();
 ctx.rotate(time*2.6);ctx.lineWidth=3;ctx.globalAlpha=.25+.55*progress;for(let i=0;i<8;i++){const a=i/8*TAU;ctx.beginPath();ctx.arc(0,0,radius*.86,a,a+.32);ctx.stroke();}
 ctx.restore();
}

// ---------- ground layer (beneath actors) ----------
export function drawEGround(ctx,m){
 const cast=eCast(m);
 if(cast&&!cast.fired&&cast.target&&(cast.kind==='meteor'||cast.kind==='chain'&&cast.spec.element!=='storm')){const p=clamp01(cast.elapsed/(cast.duration*.45));sigil(ctx,cast.target.x,cast.target.y,cast.spec.radius,p,cast.elapsed,E_PALETTE[cast.spec.element]);}
 for(const e of m.effects){const t=e.age;
  if(e.kind==='chain'&&e.efxInit&&!shaderFx()){ctx.save();for(let i=0;i<e.landed;i++){const l=e.lines[i],k=clamp01((t-i*HOP-GROW)/.4);radialGlow(ctx,l.toX,l.toY,16+34*easeOut(k),[[0,'#5a2fe066'],[.6,'#5a2fe022'],[1,'#5a2fe000']],(1-k),.5);ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle='#9d7bff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(l.toX,l.toY,10+34*easeOut(k),(10+34*easeOut(k))*.5,0,0,TAU);ctx.stroke();}ctx.restore();}
  if(e.kind==='surge'&&e.efxInit&&!shaderFx()){
   const fade=1-clamp01((t-.55)/.75),r=rng(e.seed+1);
   radialGlow(ctx,e.x,e.y,e.radius*.95,[[0,'#1d0d06cc'],[.55,'#3a1a0c66'],[1,'#3a1a0c00']],.55*fade*easeOut(t/.08),.65);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff7a2a';ctx.lineCap='round';
   for(let i=0;i<8;i++){const a=i/8*TAU+r()*.5,len=e.radius*(.45+.4*r());let x=e.x,y=e.y;ctx.globalAlpha=.85*fade*(.6+.4*Math.sin(t*25+i));ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);for(let j=1;j<=4;j++){const d=len*j/4,aa=a+(r()-.5)*.5;x=e.x+Math.cos(aa)*d;y=e.y+Math.sin(aa)*d*.65;ctx.lineTo(x,y);}ctx.stroke();}
   radialGlow(ctx,e.x,e.y,e.radius*.6,[[0,'#ff9a2e88'],[1,'#d8380f00']],.6*(1-clamp01(t/.5)),.65);
   ctx.restore();
  }
  if(e.kind==='glacial'&&e.efxInit&&!shaderFx()){
   const fade=1-clamp01((t-.6)/.6),grow=easeOut(t/.12),r=rng(e.seed+2),R=e.radius*grow;
   radialGlow(ctx,e.x,e.y,R,[[0,'#9fd0e477'],[.55,'#6cc0e044'],[.9,'#4aa8d844'],[1,'#4aa8d800']],fade,.65);
   ctx.save();ctx.globalAlpha=.55*fade;ctx.strokeStyle='#d8f2fb';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R*.96,R*.96*.65,0,0,TAU);ctx.stroke();
   ctx.lineWidth=1.2;for(let i=0;i<10;i++){const a=i/10*TAU+r()*.4,len=R*(.55+.4*r());let x=e.x,y=e.y;ctx.beginPath();ctx.moveTo(x,y);for(let j=1;j<=3;j++){const d=len*j/3,aa=a+(r()-.5)*.6;x=e.x+Math.cos(aa)*d;y=e.y+Math.sin(aa)*d*.65;ctx.lineTo(x,y);}ctx.stroke();}
   ctx.restore();
  }
 }
}

// ---------- upper layer (spell pass, behind actors per earlier user request) ----------
function drawChain(ctx,e){
 const pal=E_PALETTE.storm,t=e.age,frame=Math.floor(t*40);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const segs=e.lines.length?e.lines.map((l,i)=>({x1:i===0&&e.hand?e.hand.x:l.x,y1:i===0&&e.hand?e.hand.y-e.hand.z:l.y-BODY,x2:l.toX,y2:l.toY-BODY,start:i*HOP})):e.miss&&e.hand?[{x1:e.hand.x,y1:e.hand.y-e.hand.z,x2:e.miss.x,y2:e.miss.y-BODY,start:0,miss:true}]:[];
 for(const [i,s] of segs.entries()){
  const local=t-s.start;if(local<0)continue;const grow=clamp01(local/GROW),after=local-GROW,r=rng(e.seed+i*977+frame*31);
  const life=after<0?1:Math.max(0,1-after/(s.miss?.18:.4)),flicker=after>.06&&r()<.3?.35:1,alpha=life*flicker*(s.miss?.6:1);if(alpha<=0)continue;
  const pts=boltPoints(e.seed+i*977+frame*31,s.x1,s.y1,s.x2,s.y2,.26),upto=Math.max(2,Math.ceil(pts.length*grow));
  glowStroke(ctx,pts,upto,alpha,pal);
  // Restrike: a second, offset arc doubles up briefly right after contact.
  if(after>0&&after<.12){const alt=boltPoints(e.seed+i*577+frame*13,s.x1,s.y1,s.x2,s.y2,.32);glowStroke(ctx,alt,alt.length,alpha*.45,pal,.6);}
  for(let b=0;b<3&&grow>=1;b++){const idx=2+Math.floor(r()*(pts.length-4)),[bx,by]=pts[idx],ang=Math.atan2(s.y2-s.y1,s.x2-s.x1)+(r()<.5?-1:1)*(.5+r()*.6),len=14+r()*30;glowStroke(ctx,boltPoints(e.seed+b*131+frame,bx,by,bx+Math.cos(ang)*len,by+Math.sin(ang)*len,.35),33,alpha*.6,pal,.45);}
  if(grow<1){const [hx,hy]=pts[upto-1];radialGlow(ctx,hx,hy,11,[[0,'#ffffff'],[.45,'#9d7bffcc'],[1,'#5a2fe000']],.95);}
  else if(!s.miss){const k=clamp01(after/.25);radialGlow(ctx,s.x2,s.y2,16+22*k,[[0,'#ffffffee'],[.25,'#b9a0ffcc'],[.6,'#6a3cff55'],[1,'#5a2fe000']],(1-k)*.9);}
 }
 ctx.restore();
}
export function tongue(ctx,x,y,w,h,alpha,pal){
 if(h<2||alpha<=0)return;const g=ctx.createLinearGradient(x,y,x,y-h);g.addColorStop(0,pal.core);g.addColorStop(.3,pal.mid);g.addColorStop(.75,(pal.glow??pal.mid)+'aa');g.addColorStop(1,(pal.glow??pal.mid)+'00');
 // Restore alpha afterwards: callers draw many tongues without save/restore, and a leaked alpha made
 // every later draw (characters included) semi-transparent (Oct 15 bug: Flame Ward, Bloodlust).
 const prev=ctx.globalAlpha;ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*.9,y-h*.55,x,y-h);ctx.quadraticCurveTo(x+w*.9,y-h*.55,x+w,y);ctx.closePath();ctx.fill();ctx.globalAlpha=prev;
}
function drawSurge(ctx,e){
 const pal=E_PALETTE.pyro,t=e.age,r=rng(e.seed);
 ctx.save();
 if(t<.16){const k=t/.16;radialGlow(ctx,e.x,e.y-6,e.radius*(.4+.6*k),[[0,'#fff3c0'],[.25,'#ffb347dd'],[.6,'#e8521a77'],[1,'#d8380f00']],(1-k)*.9,.65);}
 if(t<.5){const k=t/.5,R=e.radius*(.25+.85*easeOut(k));ctx.globalAlpha=1-k;ctx.strokeStyle=pal.glow;ctx.lineWidth=12*(1-k)+2;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();ctx.strokeStyle=pal.mid;ctx.lineWidth=3;ctx.globalAlpha=(1-k)*.9;ctx.beginPath();ctx.ellipse(e.x,e.y,R*.96,R*.62,0,0,TAU);ctx.stroke();}
 // Ring of flame tongues licking up as the wave passes.
 for(let i=0;i<14;i++){const a=i/14*TAU+(r()-.5)*.35,delay=r()*.08,life=.32+r()*.25,h=(34+r()*36)*Math.sqrt(e.scale??1),w=(7+r()*6)*Math.sqrt(e.scale??1),k=(t-delay)/life;if(k<0||k>1)continue;const d=e.radius*(.35+.5*easeOut((t-delay)/.3));tongue(ctx,e.x+Math.cos(a)*d,e.y+Math.sin(a)*d*.65,w*(1-k*.5),h*Math.sin(Math.PI*k)*(1+.12*Math.sin(t*50+i)),.9,pal);}
 // Central eruption column.
 if(t<.6){const k=t/.6,h=120*(e.scale??1)*easeOut(t/.11)*(1-.35*k),w=22*(1-k*.75)*(1+.1*Math.sin(t*70));tongue(ctx,e.x,e.y,w*1.7,h*.8,(1-k)*.6,pal);tongue(ctx,e.x,e.y,w,h,(1-k)*.95,pal);ctx.globalCompositeOperation='lighter';tongue(ctx,e.x,e.y,w*.4,h*.7,(1-k)*.8,{core:'#fff6d8',mid:'#ffcf6a',glow:'#ff8a2a'});ctx.globalCompositeOperation='source-over';}
 ctx.restore();
}
function drawGlacial(ctx,e){
 const t=e.age;
 ctx.save();
 if(t<.14){const k=t/.14;radialGlow(ctx,e.x,e.y-10,e.radius*(.35+.5*k),[[0,'#d8f2fbbb'],[.35,'#7fcfee88'],[1,'#4ab4e000']],(1-k)*.7,.65);}
 if(t<.42){const k=t/.42,R=e.radius*(.2+.9*easeOut(k));ctx.globalAlpha=(1-k)*.85;ctx.strokeStyle='#58b8e0';ctx.lineWidth=6*(1-k)+1.5;ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,TAU);ctx.stroke();}
 ctx.restore();
 if(t>=SHATTER||!e.spikes)return;
 drawSpikes(ctx,e.x,e.y,e.spikes,t,SHATTER);
}
export function drawSpikes(ctx,x0,y0,spikes,t,shatterAt){
 if(t>=shatterAt||!spikes.length)return;
 const bounds=spikeBounds.get(spikes)??rememberSpikeBounds(spikes);
 if(!effectVisible(x0+(bounds[0]+bounds[2])/2,y0+(bounds[1]+bounds[3])/2,(bounds[2]-bounds[0])/2,(bounds[3]-bounds[1])/2))return;
 const settled=spikes.every(s=>t>=s.delay+.09);
 if(settled&&t<shatterAt-.1){
  const body=cachedSurface(spikes,'body',bounds,g=>drawSpikesRaw(g,0,0,spikes,1,Infinity,'body'));
  const glow=cachedSurface(spikes,'glow',bounds,g=>drawSpikesRaw(g,0,0,spikes,1,Infinity,'glow'));
  if(body&&glow){ctx.save();ctx.globalAlpha=1;ctx.drawImage(body.canvas,x0+body.x,y0+body.y);ctx.globalCompositeOperation='lighter';ctx.drawImage(glow.canvas,x0+glow.x,y0+glow.y);ctx.restore();return;}
 }
 drawSpikesRaw(ctx,x0,y0,spikes,t,shatterAt);
}
const spikeBounds=new WeakMap();
function rememberSpikeBounds(spikes){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const s of spikes){const r=s.h*.45;x0=Math.min(x0,s.dx-s.w,s.dx+s.lean,s.dx-r);x1=Math.max(x1,s.dx+s.w,s.dx+s.lean,s.dx+r);y0=Math.min(y0,s.dy-s.h,s.dy-s.h*.4-r);y1=Math.max(y1,s.dy+s.w*.3,s.dy-s.h*.4+r);}
 const b=[x0,y0,x1,y1];spikeBounds.set(spikes,b);return b;
}
function drawSpikesRaw(ctx,x0,y0,spikes,t,shatterAt,layer='both'){
 ctx.save();ctx.lineJoin='round';
 if(layer!=='glow')for(const s of spikes){const g=easeOut((t-s.delay)/.09);if(g<=0||t>=shatterAt)continue;const bx=x0+s.dx,by=y0+s.dy,tipX=bx+s.lean*g,tipY=by-s.h*g,midX=bx+s.w*.15,midY=by+s.w*.3;
  ctx.globalAlpha=.92;ctx.fillStyle='#b4dcea';ctx.beginPath();ctx.moveTo(bx-s.w,by);ctx.lineTo(tipX,tipY);ctx.lineTo(midX,midY);ctx.closePath();ctx.fill();
  ctx.fillStyle='#86cdea';ctx.beginPath();ctx.moveTo(midX,midY);ctx.lineTo(tipX,tipY);ctx.lineTo(bx+s.w,by);ctx.closePath();ctx.fill();
  ctx.globalAlpha=.6;ctx.strokeStyle='#e8f8ff';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(bx-s.w,by);ctx.lineTo(tipX,tipY);ctx.lineTo(bx+s.w,by);ctx.stroke();ctx.globalAlpha=.6;ctx.strokeStyle='#5aaed0';ctx.beginPath();ctx.moveTo(midX,midY);ctx.lineTo(tipX,tipY);ctx.stroke();
  // Hairline cracks glint just before the shatter.
  if(t>shatterAt-.1&&t<shatterAt){ctx.globalAlpha=(t-(shatterAt-.1))/.1;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(bx-s.w*.4,by-s.h*g*.3);ctx.lineTo(bx+s.w*.2,by-s.h*g*.5);ctx.lineTo(bx-s.w*.1,by-s.h*g*.7);ctx.stroke();}
 }
 if(layer!=='body'){ctx.globalCompositeOperation='lighter';for(const s of spikes){const g=easeOut((t-s.delay)/.09);if(g>0&&t<shatterAt)radialGlow(ctx,x0+s.dx,y0+s.dy-s.h*g*.4,s.h*.45,[[0,'#c4f1ff55'],[1,'#58c4ef00']],.4);}}
 ctx.restore();
}
export function drawParticles(ctx,m){
 const list=m.efx??[];if(!list.length)return;ctx.save();
 for(const p of list){const f=p.life/p.max,y=p.y-p.z;
  const margin=Math.max(p.size*3,Math.abs(p.vx)*.03+Math.abs(p.vy-p.vz)*.03);if(!effectVisible(p.x,y,margin))continue;
  if(p.kind==='smoke'||p.kind==='mist'){ctx.globalCompositeOperation='source-over';radialGlow(ctx,p.x,y,p.size,[[0,p.color+'ff'],[.55,p.color+'99'],[1,p.color+'00']],(p.kind==='smoke'?.2:.2)*Math.min(1,f*1.6)*Math.min(1,(1-f)*6),.75);continue;}
  if(p.kind==='icicle'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.95;ctx.fillStyle='#e8fbff';ctx.strokeStyle='#5aaed0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,y+p.size*2.2);ctx.lineTo(p.x-p.size*.5,y-p.size*2);ctx.lineTo(p.x+p.size*.5,y-p.size*2);ctx.closePath();ctx.fill();ctx.stroke();continue;}
  if(p.kind==='shard'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,f*2.5)*.9;ctx.save();ctx.translate(p.x,y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.strokeStyle='#ffffff';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size*.55,p.size*.6);ctx.lineTo(-p.size*.55,p.size*.4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();continue;}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,f*1.8);
  if(p.kind==='spark'){ctx.strokeStyle=p.color;ctx.lineWidth=p.size*.7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,y);ctx.lineTo(p.x-p.vx*.03,y-(p.vy-p.vz)*.03);ctx.stroke();}
  else if(p.kind==='mote'){ctx.globalCompositeOperation='lighter';const tw=.6+.4*Math.sin(p.rot*3);radialGlow(ctx,p.x,y,p.size*3,[[0,p.color],[.3,p.color+'88'],[1,p.color+'00']],Math.min(1,f*2)*Math.min(1,(1-f)*5)*tw);}
  else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,y,p.size*(p.kind==='ember'?.4+.6*f:1),0,TAU);ctx.fill();}
 }
 ctx.restore();
}
export function drawEUpper(ctx,m){
 // Shared particle pool also carries RMB/Q/R/Blink/Blood particles from mage-spell-fx.js.
 for(const e of m.effects){if(!e.efxInit)continue;if(e.kind==='chain'){if(!shaderFx())drawChain(ctx,e);}else if(e.kind==='surge'&&!shaderFx())drawSurge(ctx,e);else if(e.kind==='glacial'&&!shaderFx())drawGlacial(ctx,e);}
 drawParticles(ctx,m);
 drawEHand(ctx,m,false);
}
// Hand glow: drawn after the body when the hand faces the camera, otherwise in the upper pass.
export function drawEHand(ctx,m,front){
 const cast=eCast(m),h=castHand(m);if(!cast||!h)return;if((Math.sin(cast.angle)>=-.3)!==front)return;
 const pal=E_PALETTE[cast.spec.element],fire=cast.duration*.45,x=h.x,y=h.y-h.z;
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(!cast.fired||cast.elapsed<fire){const k=clamp01(cast.elapsed/fire);radialGlow(ctx,x,y,6+11*k,[[0,'#ffffff'],[.35,pal.mid+'dd'],[1,pal.glow+'00']],.55+.45*k);
  if(cast.spec.element==='storm'){const frame=Math.floor(cast.elapsed*40),r=rng(frame*7+3);ctx.lineCap='round';for(let i=0;i<2;i++){const a=r()*TAU,d=12+r()*12;glowStroke(ctx,boltPoints(frame*13+i,x,y,x+Math.cos(a)*d,y+Math.sin(a)*d,.4),33,.8,pal,.4);}}}
 else{const k=clamp01((cast.elapsed-fire)/.12);if(k<1)radialGlow(ctx,x,y,14+20*k,[[0,'#ffffff'],[.35,pal.mid+'cc'],[1,pal.glow+'00']],1-k);}
 ctx.restore();
}

// ---------- body sheet recolor ----------
// The supplied Mage cast/attack sheets bake a cyan spell glow into every frame. Bright,
// saturated blue-cyan pixels are the glow; the robe shares the hue but is dark (value<.4),
// so a brightness-weighted hue swap retints only the glow.
const tinted=createFrameCache();
export function elementSheet(img,element,sx=0,sy=0,size){
 const hue=HUE[element];if(hue===undefined||!img||typeof document==='undefined')return img;
 return tinted(img,element,sx,sy,size??img.width,size??img.height,(c,w,h)=>{
 const data=c.getImageData(0,0,w,h),d=data.data,step=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
 const satBoost=element==='cryo'?.75:1.1,valBoost=element==='pyro'?1.08:element==='cryo'?1.12:1;
 for(let i=0;i<d.length;i+=4){if(d[i+3]<8)continue;const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),v=max,s=max?(max-min)/max:0;if(v<.36||s<.15)continue;
  let h;const delta=max-min;if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h*=60;if(h<0)h+=360;if(h<160||h>255)continue;
  const w=step((v-.36)/.14)*step((s-.15)/.15),ns=Math.min(1,s*satBoost),nv=Math.min(1,v*valBoost),C=nv*ns,X=C*(1-Math.abs((hue/60)%2-1)),M=nv-C,seg=Math.floor(hue/60);
  const [rr,gg,bb]=[[C,X,0],[X,C,0],[0,C,X],[0,X,C],[X,0,C],[C,0,X]][seg];
  d[i]=Math.round((r+(rr+M-r)*w)*255);d[i+1]=Math.round((g+(gg+M-g)*w)*255);d[i+2]=Math.round((b+(bb+M-b)*w)*255);}
 c.putImageData(data,0,0);
 },true);
}
