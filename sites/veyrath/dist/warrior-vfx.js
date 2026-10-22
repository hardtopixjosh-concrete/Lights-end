// Warrior shader VFX bridge (Oct 16 revamp). Reads warrior/combat state and emits `war.*` recipes from
// vfx-recipes.js in the specialization's palette (user: Berserker orange, Vanguard pale yellow, Spellblade
// dark neon purple, Warlord red; steel before a specialization). Visual only. Returns false when WebGL2 or
// the Menu toggle is off, so the Canvas visuals in weapon-render.js / warrior-fx.js stay in charge.
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {bladeSweeps,LINE_TIP,LINE_H,HAMMER_HEAD} from './weapon-arcs.js?v=fx-260';
import {heroAnchor} from './hero-anchor.js?v=fx-260';
// Oct 17 (user: LMB VFX "way too small" on the 3D Warrior): effects sit at the model's chest/arm height and the swing
// visuals are drawn VIS x the hit reach to match the larger model. Hit ranges are unchanged (combat.js).
const TAU=Math.PI*2,CHEST=44,VIS=1.35,clamp01=v=>Math.max(0,Math.min(1,v)),sq=a=>Math.atan2(Math.sin(a)/.65,Math.cos(a));
export const WAR_PAL={
 berserker:{main:['#4a0e02','#ff6a1a','#ffd27a'],core:['#ff7a1a','#ffd6a0','#ffffff'],spark:['#ff5a14','#ffb060','#fff2c0'],smoke:['#1a0d07','#5a2a14','#b0603a'],dark:['#140602','#5a1a06','#ff6a1a']},
 vanguard:{main:['#3a3010','#f5e7a1','#ffffff'],core:['#e8d488','#fff6d0','#ffffff'],spark:['#e8c860','#fff2b0','#ffffff'],smoke:['#3a3220','#8a7a50','#e0d4a8'],dark:['#1a160a','#5a4c24','#f5e7a1']},
 spellblade:{main:['#14002a','#9b30ff','#f0d8ff'],core:['#8a20ff','#e0b8ff','#ffffff'],spark:['#6a10ff','#c070ff','#ffffff'],smoke:['#07020f','#2a0a4a','#7a3cc0'],dark:['#05010a','#2a0a4a','#9b30ff']},
 warlord:{main:['#2a0204','#e8332e','#ffc0b0'],core:['#e8332e','#ffb0a0','#ffffff'],spark:['#c01818','#ff6a4a','#ffe0c0'],smoke:['#140808','#4a2420','#9a6a5a'],dark:['#0a0202','#4a0a08','#e8332e']},
 steel:{main:['#1a2230','#9fb4cc','#ffffff'],core:['#b8c8dc','#eef4fa','#ffffff'],spark:['#8aa0c0','#dfe8f2','#ffffff'],smoke:['#1a1a1a','#606870','#c0c8d0'],dark:['#0a0c10','#3a4250','#dfe8f2']}};
export const palFor=path=>WAR_PAL[path]??WAR_PAL.steel;
/* Oct 18 Elemental Katana: each swing takes its element's colours. */
const ELEM_PAL={fire:{main:['#4a0e02','#ff6a1a','#ffd27a'],core:['#ff7a1a','#ffd6a0','#ffffff'],spark:['#ff5a14','#ffb060','#fff2c0'],smoke:['#1a0d07','#5a2a14','#b0603a'],dark:['#140602','#5a1a06','#ff6a1a']},
 frost:{main:['#0a2a4a','#7fd3f2','#eaffff'],core:['#8fe3ff','#e0f8ff','#ffffff'],spark:['#4fb0e0','#bfeeff','#ffffff'],smoke:['#0a1620','#3a5a70','#a0c8e0'],dark:['#040a10','#1a3a50','#7fd3f2']},
 poison:{main:['#0a3a06','#7dff5a','#e4ffc8'],core:['#a4ff5a','#e4ffc8','#ffffff'],spark:['#4fd02a','#b8ff7a','#ffffff'],smoke:['#0c1608','#2e4a20','#8ab870'],dark:['#060c03','#22400e','#7dff5a']},
 shock:{main:['#1a0a40','#b49cff','#f6f0ff'],core:['#c8b4ff','#f6e27a','#ffffff'],spark:['#9d7bff','#f6e27a','#ffffff'],smoke:['#0a0614','#2e2246','#7a68a0'],dark:['#06020c','#2a0e50','#b49cff']}};
const seedOf=(x,y)=>((x*7.13+y*13.7)|0)&1023;

// Hit marks are fed from game.js hit events (time = game clock, pause-safe).
const hits=[];
export function warriorHitFx(x,y,angle,crit,time){hits.push({x,y,angle,crit,born:time,seed:(Math.random()*1e4)|0});if(hits.length>48)hits.shift();}

// Shake per connecting LMB hit (user approved the feel pass: hitstop already exists in combat.js; shake + flash added).
export function warriorHitShake(w,style,index,crit){if(!w)return;const k=style==='hammer'||style==='greatsword'?2.6:index===2?2:1.1;w.shake=Math.max(w.shake??0,k+(crit?1:0));}

const ease3=x=>1-Math.pow(1-x,3);
function swing(o,pass,pal,p,s,a,dur){
 const t=a.elapsed/s.duration,ang=sq(a.angle),R=s.reach*VIS,style=s.style,idx=a.index??0,seed=a.id??1;
 /* Oct 18 (user: line the VFX up with the 3D weapons): thrust/slam/slash start where the weapon actually is (weapon-arcs.js) */
 if(s.shape==='line'){
  /* line strikes (Longsword third-line talent): glow at the weapon tip, then a short burst ahead. Halberd removed Oct 18. */
  const T=heroAnchor(o.w),c=Math.cos(a.angle),sn=Math.sin(a.angle)*.65,tx=T?T.x:p.x+c*LINE_TIP,ty=T?T.y:p.y-LINE_H+sn*LINE_TIP,now=t*dur,hit=s.hitStart*dur;
  if(now>hit-.12&&now<hit+.22)emitFx('war.thrust',{x:tx-c*55,y:ty-sn*55,x2:tx,y2:ty,age:Math.max(0,now-(hit-.12)),pal,seed},pass);
  const k=now-hit;if(k>=0&&k<.3){const L=40+Math.min(1,k/.12)*Math.max(40,Math.min(110,R-LINE_TIP));emitFx('war.thrust',{x:tx,y:ty,x2:tx+c*L,y2:ty+sn*L,age:k,pal,seed:seed+1},pass);}
  return;}
 if(style==='hammer'||style==='maul'){const k=(t-s.hitStart)*dur;if(k>=0)emitFx('war.slam',{x:p.x+Math.cos(a.angle)*HAMMER_HEAD,y:p.y+Math.sin(a.angle)*HAMMER_HEAD*.65,R:(s.impactRadius??46)*1.1*VIS,age:k,pal,seed},pass);return;}
 if(style==='axe'||style==='chainaxe'||style==='standard')return;
 for(const b of bladeSweeps(s,a)){const f=b.f;if(f<0||f>1.8)continue;
  const dir=b.dir,S=b.span,BR=b.R,cx=p.x,cy=p.y-b.h,heavy=style==='greatsword'||style==='greataxe'||style==='glaive'||style==='runeblade',fin=idx===2&&style==='sword',th=(heavy?1.6:style==='dual'||style==='gauntlets'||style==='katana'?.7:1)*(fin?1.35:1),c=sq(a.angle+b.off);
  if(f<=1)emitFx('war.slash',{x:cx,y:cy,R:BR,t:f,p:[S*dir,.1*th,.85,c],pal,seed,age:f*b.secs},pass);
  for(const fk of [.15,.3,.45,.6,.75,.9]){if(f<fk)continue;const th2=c+dir*(-S+2*S*ease3(fk));emitFx('war.swingSpark',{x:cx+Math.cos(th2)*BR,y:cy+Math.sin(th2)*BR*.65,age:(f-fk)*b.secs,pal,seed:seed*7+fk*100},pass);}
  if(f>.7){const mid=c+dir*S*.6;emitFx('war.motes',{x:cx+Math.cos(mid)*BR*.85,y:cy+Math.sin(mid)*BR*.85*.65,R:28*VIS,age:(f-.7)*b.secs,pal,seed:seed*3},pass);}
  if(fin&&f>=.5)emitFx('war.scar',/* Oct 18 (user): no ground scar line on Greatsword swings; Longsword finisher keeps it */{x:p.x+Math.cos(a.angle)*20,y:p.y+Math.sin(a.angle)*13,R:BR*(fin?1.1:.9),angle:a.angle,age:(f-.5)*b.secs,pal,seed},pass);
 }
}

const CONE={sunder:.8,guardBlast:.7,wrathCleave:1.1};
const BURST={rush:.6,charge:.9,carnage:1,stomp:1,earthbreaker:1,bastion:.8,crescent:.5,barrier:.8,rune:1,overload:.8,voidDome:1,bladestorm:.7,bloodlust:.7,wrath:.9,bloodBurst:1,dmPulse:.9,guard:.5};
function effect(o,pass,pal,e,p){const age=e.age,R=e.radius??100,sd=e.seed??seedOf(e.x,e.y);
 if(CONE[e.kind]){emitFx('war.cone',{x:e.x,y:e.y-CHEST,R,t:clamp01(age/(e.duration||.5)),p:[CONE[e.kind],.09,.8,sq(e.angle??0)],age,pal,seed:sd},pass);emitFx('war.burst',{x:e.x+Math.cos(e.angle??0)*R*.5,y:e.y+Math.sin(e.angle??0)*R*.33,R:R*.45,age,pal,seed:sd},pass);return;}
 if(e.kind==='cry'){emitFx('war.cry',{x:e.x,y:e.y,R,age,pal,seed:sd},pass);return;}
 if(e.kind==='voidChain'&&e.pts){for(let i=1;i<e.pts.length;i++)emitFx('war.chain',{x:e.pts[i-1].x,y:e.pts[i-1].y-30,x2:e.pts[i].x,y2:e.pts[i].y-30,age,pal,seed:sd+i},pass);return;}
 if(e.kind==='thornHit'){emitFx('war.hit',{x:e.x,y:e.y,angle:e.angle??0,age,pal,seed:sd},pass);return;}
 if(e.kind==='stomp'||e.kind==='earthbreaker')emitFx('war.quake',{x:e.x,y:e.y,R,age,pal,seed:sd},pass);
 if(e.kind==='carnage'&&age<.75)for(const k of [0,Math.PI])emitFx('war.spin',{x:e.x,y:e.y-CHEST*.6,R:R*.9,t:.55,p:[1.4,.07,.85,age*16+k],age,pal,seed:sd},pass);
 if(BURST[e.kind]!=null)emitFx('war.burst',{x:e.x,y:e.y,R:Math.min(R,220)*BURST[e.kind],age,pal,seed:sd},pass);
}

export function drawWarriorVfx(ctx,o,pass){
 if(!vfx.ok)return false;const {w,c,p,s,path,time}=o,pal=palFor(path);
 const a=c?.attack;if(a&&a.kind==='combo'&&p)swing(o,pass,a.element?ELEM_PAL[a.element]??pal:pal,p,a.definition,a,a.definition.duration);
 for(const b of c?.projectiles??[]){emitFx('war.axe',{x:b.x,y:b.y,R:b.chain?42:36,angle:b.angle,age:time,pal,seed:7},pass);
  /* Chain Axe: a glowing chain from the warrior's hand to the ball */
  if(b.chain&&p)emitFx('war.chain',{x:p.x,y:p.y-CHEST,x2:b.x,y2:b.y-30,age:.05,pal,seed:13},pass);}
 /* Oct 18 new Warrior effects: Maul rings, gauntlet punch waves, katana shock arcs, War Standard landing / lunge, shield wall glow */
 for(const e of c?.effects??[]){const age=e.age,sd=seedOf(e.x,e.y);
  if(e.kind==='maulRing')emitFx('war.slam',{x:e.x,y:e.y,R:(e.reach??95)*.75,age,pal,seed:sd},pass);
  else if(e.kind==='punchWave'){const ca=Math.cos(e.angle??0),sa=Math.sin(e.angle??0)*.65,k=Math.min(1,age/.18),L=(e.reach??260)*k;emitFx('war.thrust',{x:e.x+ca*30,y:e.y-CHEST+sa*30,x2:e.x+ca*L,y2:e.y-CHEST+sa*L,age,pal,seed:sd},pass);}
  else if(e.kind==='zap'&&e.pts)for(let i=0;i<e.pts.length;i++)emitFx('war.chain',{x:e.x,y:e.y-30,x2:e.pts[i].x,y2:e.pts[i].y-30,age,pal:ELEM_PAL.shock,seed:sd+i},pass);
  else if(e.kind==='standardLand'){emitFx('war.slam',{x:e.x,y:e.y,R:e.reach??110,age,pal,seed:sd},pass);emitFx('war.burst',{x:e.x,y:e.y,R:(e.reach??110)*.9,age,pal,seed:sd+1},pass);}
  else if(e.kind==='standardLunge')emitFx('war.burst',{x:e.x,y:e.y,R:e.reach??90,age,pal,seed:sd},pass);}
 if(c?.standard?.landed)emitFx('war.aura',{x:c.standard.x,y:c.standard.y,R:48,age:time,alpha:.8,pal,seed:17},pass);
 if(c?.lunge&&p)emitFx('war.trail',{x:p.x,y:p.y,age:.05,pal,seed:(time*60)|0},pass);
 if(c?.shieldWall&&p)emitFx('war.aura',{x:p.x+Math.cos(c.attack?.angle??0)*26,y:p.y+Math.sin(c.attack?.angle??0)*17,R:50,age:time,alpha:.75,pal,seed:21},pass);
 for(let i=hits.length-1;i>=0;i--){const h=hits[i],age=time-h.born;if(age>.45||age<0){if(age>.45)hits.splice(i,1);continue;}emitFx('war.hit',{x:h.x,y:h.y,angle:h.angle,scale:h.crit?1.6:1,age,pal,seed:h.seed},pass);}
 if(w&&p){
  for(let i=0;i<(w.fxTrail?.length??0);i+=2){const tr=w.fxTrail[i];emitFx('war.trail',{x:tr.x,y:tr.y,age:tr.age,pal,seed:i},pass);}
  for(const e of w.effects)effect(o,pass,pal,e,p);
  for(const b of w.projectiles??[])if(b.wave){const R=46,ca=Math.cos(b.angle),sa=Math.sin(b.angle);emitFx('war.wave',{x:b.x-ca*R*.8,y:b.y-30-sa*R*.8*.65,R,t:.62,p:[.9,.08,1,sq(b.angle)],angle:b.angle,age:time,pal,seed:3},pass);}
  const B=w.buffs??{},T=w.shakeT??time;
  for(const k of ['bloodlust','wrath','overload','conqueror'])if(B[k]>0)emitFx('war.aura',{x:p.x,y:p.y,R:k==='wrath'?85:60,age:T,alpha:Math.min(1,B[k]*2),pal,seed:k.length},pass);
  if(B.bastion>0)emitFx('war.dome',{x:p.x,y:p.y,R:170,age:T,alpha:Math.min(1,B.bastion*2),pal,seed:5},pass);
  if(path==='spellblade'&&s?.barrier>0)emitFx('war.dome',{x:p.x,y:p.y,R:62,age:T,alpha:.9,pal,seed:9},pass);
  if(B.darkmatter>0)for(let k=0;k<3;k++){const an=T*2.2+k*TAU/3;emitFx('war.orb',{x:p.x+Math.cos(an)*90,y:p.y-30+Math.sin(an)*40,R:16,age:T,pal,seed:k},pass);}
  const cast=w.cast;if(cast?.kind==='bladestorm')for(const k of [0,Math.PI*2/3,Math.PI*4/3])emitFx('war.spin',{x:p.x,y:p.y-CHEST*.6,R:(cast.radius??145)*.9,t:.55,p:[1.2,.06,.8,cast.elapsed*14+k],age:cast.elapsed,pal,seed:11},pass);
 }
 vfx.flush(ctx,pass);return true;
}
