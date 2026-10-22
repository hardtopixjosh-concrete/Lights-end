// Ranger shader VFX bridge (Oct 17, user's weapon VFX overhaul). Emits `rgr.*` recipes from vfx-recipes.js in the
// active subclass palette (Archer green, Ninja purple, Alchemist teal, Gunslinger gold). Archer arrow types tint only
// the sparks/core so Fire/Frost/Poison stay readable. Visual only; returns false when WebGL2 / the Menu toggle is
// off so ranger-render.js keeps drawing everything in Canvas.
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {flaskPos} from './ranger.js?v=fx-260';
import {heroAnchor} from './hero-anchor.js?v=fx-260';
/* Oct 18: the 3D Ranger shoots from weapon height; shots start ~20 px higher than their sim point and ease down to body
   height over the first 240 px (visual only). */
/* Oct 18 fix (user: projectiles didn't leave the weapon): a shot is drawn offset from its sim point to the live weapon tip
   it left (tipX/tipY, set in ranger.js shot()), easing onto its true path over the first 240 px; no tip known = 20 px lift. */
const tipFade=b=>Math.max(0,1-(b.traveled??0)/240);
export const shotLift=b=>b.ghost?0:(b.tipY!=null?-b.tipY:20)*tipFade(b);
export const shotDX=b=>b.ghost||b.tipX==null?0:b.tipX*tipFade(b);
export const RANGER_PAL={
 archer:{main:['#0f3a06','#9be15d','#eaffd0'],core:['#a8f06a','#e6ffc8','#ffffff'],spark:['#6fd030','#c8ff8a','#ffffff'],smoke:['#0c1608','#2e4a20','#8ab870'],dark:['#060c03','#22400e','#9be15d']},
 ninja:{main:['#04103e','#2f62ff','#dce6ff'],core:['#5a86ff','#d6e2ff','#ffffff'],spark:['#1f4dff','#9ab6ff','#ffffff'],smoke:['#04081a','#1a2448','#5a6a9a'],dark:['#02040c','#0a1a5a','#2f62ff']},
 /* Oct 18 (user): Alchemist purple (was teal), Ninja deep blue (was purple). */
 alchemist:{main:['#2a0646','#b35cff','#f2e0ff'],core:['#c482ff','#efdcff','#ffffff'],spark:['#9a3cff','#dab0ff','#ffffff'],smoke:['#0e0618','#33204a','#8a6aa8'],dark:['#08020e','#3a0e5a','#b35cff']},
 gunslinger:{main:['#3a2402','#ffc24a','#fff0c8'],core:['#ffd060','#fff2c8','#ffffff'],spark:['#ff9a2a','#ffd88a','#ffffff'],smoke:['#161008','#4a3a24','#a89070'],dark:['#0c0802','#4a2c06','#ffc24a']}};
/* Oct 19 (user): the outbound Chakram is much more blue */
const CHAKRAM_BLUE={main:['#0a2a8a','#3f8bff','#e0f0ff'],core:['#6ab0ff','#e0f0ff','#ffffff'],spark:['#2f6bff','#9ad0ff','#ffffff'],smoke:['#04103e','#1a3a8a','#6a9aff'],dark:['#02061a','#0a2a8a','#3f8bff']};
const ACCENT={fire:{spark:['#ff5a14','#ffb060','#fff2c0'],core:['#ff8a3d','#ffd8a8','#ffffff']},frost:{spark:['#4fb0e0','#bfeeff','#ffffff'],core:['#8fe3ff','#e0f8ff','#ffffff']},poison:{spark:['#4fd02a','#b8ff7a','#ffffff'],core:['#a4ff5a','#e4ffc8','#ffffff']}};
const accented={};
function palFor(path,el){const base=RANGER_PAL[path]??RANGER_PAL.archer;if(!el||el==='plain'||!ACCENT[el])return base;const k=path+'|'+el;return accented[k]??={...base,...ACCENT[el]};}
const LOOK={dagger:'rgr.kunai',rifle:'rgr.bullet',arrow:'rgr.arrow',longArrow:'rgr.longArrow',bolt:'rgr.bolt',star:'rgr.star',kunai:'rgr.kunai',bullet:'rgr.bullet',pellet:'rgr.pellet',chakram:'rgr.chakram'};
// Visual size (Oct 17 v3, user: between the first pass and v2): weapon shots x1.25, skill shots x1.5, skill shuriken x1.8.
export function shotScale(b){if(b.kind==='power')return .95*(b.size??1);if(b.look==='rifle')return .95;/* Oct 19 (user): thin sniper bullet (was 1.7) */if(b.look==='dagger')return 1.05;if(b.kind==='shuriken')return 1.8;if(b.basic)return b.look==='pellet'?1.2:1.25;return b.kind==='bullet'?1.3:1.5;}
function shotRecipe(b){if(b.kind==='power')return 'rgr.power';if(b.chakram)return b.returned?'rgr.chakramBack':'rgr.chakram';if(b.kind==='shuriken')return 'rgr.star';if(b.kind==='bullet')return 'rgr.bullet';return LOOK[b.look]??'rgr.arrow';}
export function drawRangerVfx(ctx,o,pass){
 if(!vfx.ok)return false;const {r,path}=o,T=r.shakeT??0;
 // Crowd guard: past ~90 projectiles every shot uses the cheap two-layer look, and impacts are capped in ranger.js.
 const crowded=r.shots.length>90;
 for(const b of r.shots){const pal=b.ghost?RANGER_PAL.ninja:b.chakram&&!b.returned?CHAKRAM_BLUE:palFor(path,b.el);emitFx(crowded&&b.kind!=='power'?'rgr.lite':shotRecipe(b),{x:b.x+shotDX(b),y:b.y-shotLift(b),angle:b.angle,age:T,pal,seed:b.seed??1,scale:shotScale(b)*(b.ghost?.75:1),alpha:b.ghost?.6:1},pass);}
 for(const h of [r.hawk,...(r.hawkFollow??[])])if(h)emitFx('rgr.hawk',{x:h.x,y:h.y,angle:h.angle??0,age:T,pal:palFor(path,h.el),seed:h.follow?5:3,scale:h.follow?.95:1.15},pass);
 const A=heroAnchor(r);for(const m of r.muzzles??[]){const age=T-m.born;if(age<0||age>.6)continue;const P=m.side==='l'&&A?.l||A,own=P&&Math.hypot(m.x-P.x,m.y-P.y)<80,mx=own?P.x+Math.cos(m.angle)*6:m.x,my=own?P.y+Math.sin(m.angle)*4:m.y;/* muzzle at the live weapon tip */emitFx(m.name,{x:mx,y:my,angle:m.angle,age,pal:palFor(path,m.el),seed:m.seed,scale:m.scale*1.4},pass);}
 for(const h of r.hitFx??[]){const age=T-h.born;if(age<0||age>.5)continue;const pal=palFor(path,h.el),sc=(1+.8*h.power)*1.3;
  emitFx(h.pierce?'rgr.pierce':'rgr.hit',{x:h.x,y:h.y,angle:h.angle,age,pal,seed:h.seed,scale:sc*(h.crit?1.3:1)},pass);if(h.crit)emitFx('rgr.crit',{x:h.x,y:h.y,angle:h.angle,age,pal,seed:h.seed+1,scale:.8+.4*h.power},pass);}
 /* Oct 18 Volley: target zone while it rains; each wave drops n arrows at seeded spots (staggered 12ms, finale wave
    bigger with a crit burst in the middle); aftermath scorch/smoke/embers when the volley ends. */
 for(const v of r.volleys??[])emitFx('rgr.volleyZone',{x:v.x,y:v.y,R:v.R,age:T-(v.born??T),pal:palFor(path,v.el),seed:v.seed??1},pass);
 for(const f of r.volleyFx??[]){const age=T-f.born,pal=palFor(path,f.el);if(age<0)continue;
  if(f.kind==='launch')emitFx('rgr.volleyLaunch',{x:f.x,y:f.y,age,pal,seed:7},pass);
  else if(f.kind==='after')emitFx('rgr.volleyAfter',{x:f.x,y:f.y,R:f.R,age,pal,seed:f.seed},pass);
  else{let s=f.seed|0;const rn=()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff),fall=Math.atan2(35,8.75);
   for(let i=0;i<f.n;i++){const a=rn()*Math.PI*2,d=Math.sqrt(rn())*f.R*.9;emitFx('rgr.volleyArrow',{x:f.x+Math.cos(a)*d,y:f.y+Math.sin(a)*d*.65,angle:fall,age:age-i*.012,pal,seed:f.seed+i,scale:f.last?1.35:1},pass);}
   if(f.last)emitFx('rgr.crit',{x:f.x,y:f.y-20,angle:0,age:age-.16,pal,seed:f.seed,scale:f.R/40},pass);}}
 /* Oct 18 new weapons: cone spray while firing, lobs in flight, barrels (idle glow / lit fuse), and impacts:
    potion splash, bomb hop puffs and the big bomb / barrel blasts (war.burst in the subclass palette, bigger with a crit burst). */
 const cf=r.coneFx;if(cf&&cf.until>T&&cf.look!=='flame')/* Oct 19: the Flamethrower is soft particles now (ranger-soft.js) */emitFx(cf.look==='flame'?'rgr.flame':'rgr.gas',{x:cf.x+Math.cos(cf.angle)*14,y:cf.y-24+Math.sin(cf.angle)*9,R:cf.range,angle:cf.angle,age:T-cf.born,pal:palFor(path,cf.look==='flame'?'fire':'poison'),seed:4},pass);
 for(const f of r.flasks??[])if(f.kind==='potion'||f.kind==='bomb'||f.kind==='grandflask'){const P=flaskPos(f);emitFx('rgr.lob',{x:P.x,y:P.y,angle:0,age:T,pal:f.kind==='bomb'?palFor(path,'fire'):f.kind==='grandflask'?palFor(path):palFor(path,f.el),seed:f.seed??2,scale:f.kind==='bomb'?1.8:f.kind==='grandflask'?2.8:1.3},pass);}
 for(const b of r.barrels??[]){emitFx('rgr.barrel',{x:b.x,y:b.y,age:T-(b.born??T),pal:palFor(path),seed:b.seed??3,scale:2},pass);if(b.fuse!=null)emitFx('rgr.fuse',{x:b.x,y:b.y-64,age:T,pal:palFor(path,'fire'),seed:b.seed??3,scale:1.6},pass);}
 for(const f of r.lobFx??[]){const age=T-f.born;if(age<0||age>1.2)continue;const big=f.kind==='bombBig'||f.kind==='barrel'||f.kind==='grand'||f.kind==='poolBlast',pal=f.kind==='potion'?palFor(path,f.el):f.kind==='poolBlast'?palFor(path,'poison'):palFor(path,f.kind==='barrel'||f.kind==='grand'?null:'fire');
  emitFx('war.burst',{x:f.x,y:f.y,R:f.R*(big?1:.8),age,pal,seed:f.seed??5},pass);if(big)emitFx('rgr.crit',{x:f.x,y:f.y-20,angle:0,age,pal,seed:(f.seed??5)+1,scale:f.R/34},pass);}
 vfx.flush(ctx,pass);return true;
}
