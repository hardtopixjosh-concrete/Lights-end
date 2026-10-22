// Bridge from Mage spell state to the shader VFX engine (Oct 15, VFX Lab batch). Emits recipe instances for
// the current pass and composites them at that point of the draw order. Returns early (and the Canvas
// fallbacks in mage-spell-fx.js / mage-e-fx.js draw instead) when WebGL2 or the Menu toggle is off.
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {heroAnchor} from './hero-anchor.js?v=fx-260';
import {shotLift,shotDX} from './mage-e-fx.js?v=fx-260';
import {weaponVfx} from './mage-weapons-fx.js?v=fx-260';
const clamp01=v=>Math.max(0,Math.min(1,v)),METEOR_FROM={x:-170,y:-470},METEOR_ANGLE=Math.atan2(470,170);
const BODY=36,ROD_H=70,HOP=.045;
const seedOf=(x,y)=>((x*7.13+y*13.7)|0)&1023;
export const shaderFx=()=>vfx.ok;
export function drawMageVfx(ctx,m,pass){
 if(!vfx.ok)return false;
 for(const b of m.projectiles)if(b.kind==='fireball'&&b.element==='pyro'){const trav=(b.spec?.range??650)-b.remaining;emitFx('pyro.fireball',{x:b.x+shotDX(b),y:b.y-shotLift(b),angle:b.angle,age:Math.max(0,trav/(b.speed||500)),seed:seedOf(b.origin?.x??0,b.origin?.y??0)},pass);}
 for(const h of m.meteors){const q=clamp01(h.age/h.warning)**2,sc=h.scale??1;emitFx('pyro.meteor',{x:h.x+METEOR_FROM.x*(1-q)*sc,y:h.y+METEOR_FROM.y*(1-q)*sc-24*sc,angle:METEOR_ANGLE,age:h.age,scale:sc,seed:seedOf(h.x,h.y)},pass);}
 for(const z of m.scorches??[]){const fade=Math.min(1,z.age/.3)*(1-clamp01((z.age-z.life)/.6));if(fade>0)emitFx('pyro.scorch',{x:z.x,y:z.y,R:z.radius,age:z.age,alpha:fade,seed:seedOf(z.x,z.y)},pass);}
 for(const ip of m.icePaths??[]){if(ip.len<4)continue;const ca=Math.cos(ip.angle),sa=Math.sin(ip.angle),fade=1-clamp01((ip.age-ip.life+.6)/.6),seed=seedOf(ip.origin?.x??ip.x,ip.origin?.y??ip.y);
  emitFx('cryo.iceRoad',{x:ip.x,y:ip.y,R:ip.width/2,angle:ip.angle,age:ip.age,len:ip.len,max:ip.max,speed:ip.speed,alpha:fade,seed},pass);
  if(!ip.done)emitFx('cryo.roadHead',{x:ip.x+ca*ip.len,y:ip.y+sa*ip.len,angle:ip.angle,age:ip.age,seed},pass);}
 for(const z of m.zones)if(z.spec.element==='cryo'&&z.age>=z.warning){const life=z.age-z.warning,fade=Math.min(1,life/.3)*(1-clamp01((life-z.spec.life+.4)/.4));if(fade>0)emitFx('cryo.blizzard',{x:z.x,y:z.y,R:z.radius,age:life,alpha:fade,seed:seedOf(z.x,z.y)},pass);}
 let frozen=0;for(const e of m.fxTargets??[])if(e.state==='alive'&&!e.burn&&e.freeze>0&&frozen++<40)emitFx('cryo.frozen',{x:e.x,y:e.y,scale:e.scale??1.25,age:0,time:m.shakeT??0,seed:(e.id??frozen)*13},pass);
 for(const z of m.zones)if(z.spec.element==='storm'&&z.age>=z.warning){const life=z.age-z.warning,fade=Math.min(1,life/.4)*(1-clamp01((life-z.spec.life+.4)/.4));if(fade>0)emitFx('storm.tempest',{x:z.x,y:z.y,R:z.radius,age:life,alpha:fade,seed:seedOf(z.x,z.y)},pass);}
 // Storm E Rods (Oct 16): footing glow, arcs tip-to-tip between linked rods, zaps from a tip to each enemy.
 const tipOf=r=>ROD_H*(r.oc>0?1.3:1);
 for(const r of m.rods??[]){const a=Math.min(1,r.age/.2)*Math.min(1,(r.life-r.age)/.3);emitFx('storm.rodBase',{x:r.x,y:r.y,R:r.oc>0?95:60,age:r.age,alpha:a,seed:r.seed},pass);}
 for(const [r1,r2] of m.rodLinks??[]){const oc=r1.oc>0||r2.oc>0,t=r1.age%.2,k=Math.floor(r1.age/.2)*7+r1.seed+r2.seed;for(const [sc,dk] of [[oc?2.6:1.7,0],[oc?1.5:1,3]])emitFx('storm.arc',{x:r1.x,y:r1.y-tipOf(r1),x2:r2.x,y2:r2.y-tipOf(r2),age:t,scale:sc,seed:k+dk},pass);}
 for(const z of m.rodZaps??[]){emitFx('storm.arc',{x:z.x,y:z.y-ROD_H*(z.oc?1.3:1),x2:z.toX,y2:z.toY-BODY,age:z.age,scale:z.oc?1.6:1.1,seed:z.seed},pass);emitFx('storm.impact',{x:z.toX,y:z.toY,age:z.age,seed:z.seed},pass);}
 if(m.drain&&m.drainLine){const l=m.drainLine,H=heroAnchor(m);emitFx('blood.drain',{x:H?H.x:l.x,y:H?H.y:l.y-38,x2:l.toX,y2:l.toY-32,age:m.drain.elapsed,seed:7},pass);}
 for(const b of m.bloodBlooms??[])if(!b.done)emitFx('blood.bloomWarn',{x:b.x,y:b.y,R:b.spec.radius,age:Math.min(b.age,b.delay),seed:seedOf(b.x,b.y)},pass);
 for(const z of m.bloodZones??[]){const fade=Math.min(1,z.age/.4)*(1-clamp01((z.age-z.spec.life)/.5));if(fade>0)emitFx('blood.eclipse',{x:z.x,y:z.y,R:z.spec.radius,age:z.age,alpha:fade,seed:seedOf(z.x,z.y)},pass);}
 if(pass==='ground')for(const p of m.bloodTrail??[]){const a=Math.min(1,(1-p.age/5)*2);if(a>0)emitFx('blood.trail',{x:p.x,y:p.y,age:p.age,alpha:a,seed:seedOf(p.x,p.y)},pass);}
 for(const e of m.effects){
  if(e.kind==='chain'){const sd=e.seed??1,segs=e.lines.length?e.lines.map((l,i)=>({x1:i===0&&e.hand?e.hand.x:l.x,y1:i===0&&e.hand?e.hand.y-e.hand.z:l.y-BODY,x2:l.toX,y2:l.toY-BODY})):e.miss&&e.hand?[{x1:e.hand.x,y1:e.hand.y-e.hand.z,x2:e.miss.x,y2:e.miss.y-BODY,miss:true}]:[];
   segs.forEach((s,i)=>{const local=e.age-i*HOP;if(local<0)return;emitFx('storm.arc',{x:s.x1,y:s.y1,x2:s.x2,y2:s.y2,age:local,seed:sd+i*7},pass);if(!s.miss)emitFx('storm.impact',{x:s.x2,y:s.y2+BODY,age:local,seed:sd+i*7},pass);});continue;}
  if(e.kind==='zap'){emitFx('storm.zap',{x:e.x,y:e.y,R:e.radius??50,age:e.age,seed:e.seed??seedOf(e.x,e.y)},pass);continue;}
  if(e.kind==='skybolt'){const sd=e.seed??seedOf(e.x,e.y);emitFx('storm.arc',{x:e.fromX,y:e.fromY,x2:e.x,y2:e.y-30,age:e.age,scale:1.3,seed:sd},pass);emitFx('storm.impact',{x:e.x,y:e.y,age:e.age,seed:sd},pass);continue;}
  if(e.kind==='pulse'&&e.element==='storm'&&e.strikes){const sd=e.seed??seedOf(e.x,e.y);e.strikes.forEach((s,i)=>{const local=e.age-i*.06;if(local<0)return;const x=e.x+s.dx,y=e.y+s.dy,top=x+((sd+i*37)%60)-30;emitFx('storm.arc',{x:top,y:y-230,x2:x,y2:y,age:local,scale:1.3,seed:sd+i*5},pass);emitFx('storm.impact',{x,y,age:local,seed:sd+i*5},pass);});continue;}
  if(e.kind==='qnova'&&e.element==='storm'&&e.sfxInit){emitFx('storm.nova',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);continue;}
  if(e.kind==='bloom'){emitFx('blood.bloom',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);continue;}
  if(e.kind==='nova'&&e.element==='blood'){emitFx('blood.nova',{x:e.x,y:e.y,R:e.radius??90,age:e.age,seed:seedOf(e.x,e.y)},pass);continue;}
  if(e.kind==='hemoBurst'){emitFx('blood.hemo',{x:e.x,y:e.y,age:e.age,seed:seedOf(e.x,e.y)},pass);continue;}
  if(e.kind==='qnova'&&e.element==='cryo'&&e.sfxInit)emitFx('cryo.nova',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);
  else if(e.kind==='glacial')emitFx('cryo.glacial',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:e.seed??seedOf(e.x,e.y)},pass);
  else if(e.kind==='pulse'&&e.element==='cryo')emitFx('cryo.blizzardPulse',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);
  else if(e.kind==='qnova'&&e.element==='pyro'&&e.sfxInit)emitFx('pyro.nova',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:seedOf(e.x,e.y)},pass);
  else if(e.kind==='surge')emitFx(e.big?'pyro.meteorImpact':'pyro.explosion',{x:e.x,y:e.y,R:e.radius,age:e.age,seed:e.seed??seedOf(e.x,e.y)},pass);}
 weaponVfx(m,pass);vfx.flush(ctx,pass);return true;
}
