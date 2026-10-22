// Oct 18 (user list): Mage weapons by subclass. Simulation for the new LMB families; the staves and the Wand stay in mage.js.
// mage.js passes its helpers in (H = {hit,area,living,distance,clearMagePath,magePrimary}) so this module never imports it back.
// Cast weapons fire through the normal LMB cast (mage.js castWeapon at 45%); channel weapons tick while LMB is held.
import {beginAction,actor,boundedHeal} from './core-rules.js?v=fx-260';
import {directionRow,blocked} from './simulation.js?v=fx-260';
const STAFF={contactRadius:13,duration:.5,speed:600,range:700,pierce:6,size:48};
export const MAGE_WEAPON_PRIMARIES={
 icestaff:{name:'Ice Lance',...STAFF},
 stormstaff:{name:'Storm Lance',...STAFF},
 embers:{name:'Ember',contactRadius:8,duration:.16,speed:640,range:560,pierce:1,size:26,homing:true,motes:5,regrow:.5,emptyRegrow:1,splash:70},
 sundisc:{name:'Sun Disc',duration:.3,speed:480,range:380,radius:34,burn:true},
 flamegaunt:{name:'Flame Burst',duration:.24,range:185,arc:.55,burn:true},
 lightrod:{name:'Lightning Strike',duration:.3,range:620,radius:70},
 tesla:{name:'Tesla Line',contactRadius:10,duration:.22,speed:1500,range:620,pierce:12,size:20},
 bloodorb:{name:'Blood Orb',duration:.4,speed:170,range:420,radius:64,rehit:.3,max:2,drag:.4},
 sigilbook:{name:'Blood Sigil',duration:.35,range:600,radius:85,delay:.6,marks:3,markTime:5},
 snowglobe:{name:'Snow Globe',range:480,radius:95,follow:70,chill:.35,form:.45,recast:1},
 frostbeam:{name:'Freeze Beam',duration:.2,range:520,contactRadius:7,beamPierce:3,freezeAfter:1.5},
 drum:{name:'Thunder Drum',radius:260},
 lantern:{name:'Crimson Lantern',radius:190},
 // Cursed Skull (user, Oct 19): press = a heart orb in the air at the cursor (it stays there); hold drains 8% max HP/s until 1 HP and it keeps growing;
 // release bursts it, siphons heal 80% of the damage. damage = the pulse after 2 s of charge (scales on with longer charges).
 skull:{name:'Cursed Skull',radius:110,maxRadius:260,charge:2,drain:.08,heal:.8,range:520}
};
export const MAGE_CHANNELS=new Set(['scepter','snowglobe','frostbeam','drum','lantern','skull']);
export const MAGE_CASTS=new Set(['embers','sundisc','flamegaunt','lightrod','tesla','bloodorb','sigilbook']);
/* body clip for each weapon's LMB (build_warrior.py has Lmb_wand/staff/orb/grimoire/spellbook) */
export const MAGE_CLIP_OF={icestaff:'staff',stormstaff:'staff',lightrod:'rod',embers:'beads',tesla:'wand',sundisc:'disc',flamegaunt:'gauntlet',bloodorb:'orb',sigilbook:'sigil'};
/* Oct 19: channel weapons have their own upper-body loops (build_warrior.py chan_pose) */
export const MAGE_CHANNEL_CLIP={drum:'Channel_drum',lantern:'Channel_lantern',skull:'Channel_skull',snowglobe:'Channel_globe'};
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const dealt=ev=>ev.reduce((n,x)=>n+(x.type==='hit'?(x.actualDamage??x.damage??0):0),0);
const hitIds=ev=>new Set(ev.filter(x=>x.type==='hit').map(x=>x.targetId));
export function canCastWeapon(m,primary,spec){
 if(primary==='embers')return (m.motes??spec.motes)>=1;
 if(primary==='sundisc')return !(m.discs?.length);
 if(primary==='bloodorb')return (m.bloodOrbs?.length??0)<(spec.max??2);
 return true;
}
function nearest(H,c,from,max,props,pred=()=>true){let best=null,d=Infinity;for(const e of H.living(c)){const k=H.distance(e,from);if(k<max+(e.radius??12)&&k<d&&pred(e)&&H.clearMagePath(from,e,props,c.forgeShield)){best=e;d=k;}}return best;}
function bolt(m,a,p,spec,angle,extra={}){if(m.projectiles.length>=72)return;m.projectiles.push({kind:'bolt',attackId:a.attackId,volley:null,primary:a.primary,element:'arcane',secondary:!!a.secondary,ricochets:0,spec,contactRadius:spec.contactRadius,weapon:a.weapon,x:p.x,y:p.y,origin:{x:p.x,y:p.y},angle,speed:spec.speed,remaining:spec.range,damage:spec.damage,hitTargets:new Set(),seed:(Math.random()*1e4)|0,...extra});}
export function castWeapon(m,c,s,p,a,props,H){
 const spec=a.spec,events=[],base={basic:true,attackId:a.attackId,secondary:!!a.secondary,weapon:a.weapon};
 switch(a.primary){
  case 'embers':{if(!a.secondary)m.motes=Math.max(0,(m.motes??spec.motes)-1);const t=nearest(H,c,p,spec.range,props);bolt(m,a,p,{...spec,turn:spec.turn*4},t?Math.atan2(t.y-p.y,t.x-p.x):a.angle,{targetId:t?.id,moteFrom:(m.moteSpin??0)});break;}
  case 'tesla':bolt(m,a,p,spec,a.angle);break;
  case 'sundisc':(m.discs??=[]).push({x:p.x,y:p.y,angle:a.angle,out:true,travel:0,age:0,spin:0,hit:new Set(),spec,weapon:a.weapon,attackId:a.attackId});break;
  case 'bloodorb':(m.bloodOrbs??=[]).push({x:p.x,y:p.y,angle:a.angle,remaining:spec.range,age:0,hitAt:new Map(),spec,weapon:a.weapon,attackId:a.attackId,seed:(Math.random()*1e4)|0});break;
  case 'flamegaunt':{for(const e of H.living(c)){if(H.distance(e,p)>spec.range+(e.radius??12)||angleDiff(Math.atan2(e.y-p.y,e.x-p.x),a.angle)>spec.arc||!H.clearMagePath(p,e,props,c.forgeShield))continue;events.push(...H.hit(m,c,s,e,spec.damage,p,props,{...base,burn:true,burnDamage:spec.damage*.12,stagger:.06}));}
   if(m.effects.length<90)m.effects.push({kind:'gauntCone',x:p.x,y:p.y,angle:a.angle,range:spec.range,arc:spec.arc,age:0,duration:.34,seed:(Math.random()*1e4)|0});break;}
  case 'lightrod':{const at={...a.target};/* Oct 19 (user): no auto-target, strikes where you cast */events.push(...H.area(m,c,s,at,at,spec.radius,spec.damage,props,{...base,stagger:.12}));
   if(m.effects.length<90)m.effects.push({kind:'skybolt',element:'storm',x:at.x,y:at.y,fromX:at.x+((Math.random()*60)|0)-30,fromY:at.y-260,age:0,duration:.3},{kind:'zap',element:'storm',x:at.x,y:at.y,radius:spec.radius,age:0,duration:.35});break;}
  /* Oct 19 (user): the sigil goes exactly on the cursor (no auto-target); its eruption leaves a blood mark (stacks to 3). */
  case 'sigilbook':if((m.sigils??=[]).length<12)m.sigils.push({...a.target,targetId:null,age:0,spec,weapon:a.weapon,attackId:a.attackId,seed:(Math.random()*1e4)|0});break;
 }
 return events;
}
export function tickWeapons(m,c,s,p,aim,props,dt,H){
 const events=[],w=c.weapon??{},prim=w.primary,speed=w.speed??1,time=actor(c).time;
 // Ember Beads: the motes regrow one at a time while the beads are in hand.
 if(prim==='embers'){const sp=H.magePrimary(c);m.motes??=sp.motes;m.moteSpin=(m.moteSpin??0)+dt*3.2;if(m.motes<sp.motes){m.moteClock=(m.moteClock??0)+dt*speed;const need=()=>m.motes===0?sp.emptyRegrow:sp.regrow;/* Oct 19 (user): slower once the beads run out */while(m.moteClock>=need()&&m.motes<sp.motes){m.moteClock-=need();m.motes++;}}else m.moteClock=0;}else m.motes=null;
 // Sun Disc: flies out through enemies, turns at full range (or a wall) and homes back to the caster, hitting again.
 for(let i=(m.discs??[]).length-1;i>=0;i--){const d=m.discs[i],sp=d.spec;d.age+=dt;d.spin+=dt*14;
  if(d.out){const step=Math.min(sp.speed*dt,sp.range-d.travel),nx=d.x+Math.cos(d.angle)*step,ny=d.y+Math.sin(d.angle)*step;if(blocked(nx,ny,props,0,true)||d.travel+step>=sp.range-1e-6){d.out=false;d.hit.clear();}else{d.x=nx;d.y=ny;d.travel+=step;}}
  else{const dx=p.x-d.x,dy=p.y-d.y,n=Math.hypot(dx,dy);if(n<24||d.age>5){m.discs.splice(i,1);continue;}const step=Math.min(n,sp.speed*1.15*dt);d.x+=dx/n*step;d.y+=dy/n*step;}
  for(const e of H.living(c))if(!d.hit.has(e)&&H.distance(e,d)<sp.radius+(e.radius??12)){d.hit.add(e);events.push(...H.hit(m,c,s,e,sp.damage,d,props,{basic:true,attackId:d.attackId,secondary:!d.out,weapon:d.weapon,burn:true,burnDamage:sp.damage*.08,stagger:.06}));if(m.effects.length<90)m.effects.push({kind:'arcHit',element:'pyro',x:e.x,y:e.y,age:0,duration:.3});}}
 // Blood Orb: a slow sphere that drifts through enemies, hurting each one it overlaps every .4 s.
 for(let i=(m.bloodOrbs??[]).length-1;i>=0;i--){const o=m.bloodOrbs[i],sp=o.spec;o.age+=dt;const inside=H.living(c).some(e=>H.distance(e,o)<sp.radius+(e.radius??12)),step=Math.min(o.remaining,sp.speed*(inside?sp.drag:1)*dt),nx=o.x+Math.cos(o.angle)*step,ny=o.y+Math.sin(o.angle)*step;
  if(blocked(nx,ny,props,0,true)||o.remaining<=0){m.bloodOrbs.splice(i,1);if(m.effects.length<90)m.effects.push({kind:'hemoBurst',element:'blood',x:o.x,y:o.y,age:0,duration:.6});continue;}o.x=nx;o.y=ny;o.remaining-=step;
  for(const e of H.living(c)){if(H.distance(e,o)>=sp.radius+(e.radius??12))continue;const last=o.hitAt.get(e.id);if(last!=null&&o.age-last<sp.rehit/speed)continue;o.hitAt.set(e.id,o.age);events.push(...H.hit(m,c,s,e,sp.damage,o,props,{basic:true,attackId:o.attackId,secondary:last!=null,weapon:o.weapon,stagger:.04}));if(m.effects.length<90)m.effects.push({kind:'arcHit',element:'blood',small:true,x:e.x,y:e.y,age:0,duration:.25});}}
 for(const e of c.targets)if(e.bloodMarks){e.bloodMarks.t-=dt;if(e.bloodMarks.t<=0||e.state!=='alive')e.bloodMarks=null;}
 m.globeCD=Math.max(0,(m.globeCD??0)-dt);
 // Sacrificial Book: each sigil erupts after its delay.
 for(let i=(m.sigils??[]).length-1;i>=0;i--){const g=m.sigils[i],sp=g.spec;g.age+=dt;const t=g.targetId!=null&&H.living(c).find(e=>e.id===g.targetId);if(t&&g.age<sp.delay*.8){g.x=t.x;g.y=t.y;}
  if(g.age>=sp.delay){const ev=H.area(m,c,s,g,g,sp.radius,sp.damage,props,{basic:true,attackId:g.attackId,weapon:g.weapon,stagger:.15,targetCap:1});events.push(...ev);const ids=hitIds(ev);for(const e of H.living(c))if(ids.has(e.id))e.bloodMarks={n:Math.min(sp.marks,(e.bloodMarks?.n??0)+1),t:sp.markTime};if(m.effects.length<90)m.effects.push({kind:'bloom',element:'blood',x:g.x,y:g.y,radius:sp.radius,age:0,duration:1});m.sigils.splice(i,1);}}
 return events;
}
function chanDue(m,c,interval){const time=actor(c).time;if(time<(m.channelReadyAt??0)-1e-6)return null;m.channelReadyAt=time+interval;return beginAction(c,interval);}
// Held LMB for Snow Globe / Thunder Drum / Crimson Lantern / Cursed Skull (Freeze Gauntlets use mage.js tickBeam).
export function tickChannel(m,c,s,p,aim,props,dt,H){
 const w=c.weapon??{},prim=w.primary,sp=H.magePrimary(c),speed=w.speed??1,interval=sp.cooldown/speed,events=[],angle=aim?Math.atan2(aim.y+30-p.y,aim.x-p.x):p.row*Math.PI/4;
 m.chanAge=(m.chanAge??0)+dt;m.channel={row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:m.chanAge%1,duration:1,kind:'beam'};
 if(prim==='snowglobe'){const want=aim?{x:aim.x,y:aim.y}:{x:p.x+Math.cos(angle)*200,y:p.y+Math.sin(angle)*200},dx=want.x-p.x,dy=want.y-p.y,n=Math.hypot(dx,dy)||1,k=Math.min(1,sp.range/n),tx=p.x+dx*k,ty=p.y+dy*k;
  if(!m.globe&&m.globeCD>0)return events;/* Oct 19 (user): no cast-cast-cast: 1 s before a new globe */
  const g=m.globe??={x:tx,y:ty,age:0,seed:(Math.random()*1e4)|0};g.age+=dt;g.R=sp.radius;const gx=tx-g.x,gy=ty-g.y,gn=Math.hypot(gx,gy);if(gn>1){const st=Math.min(gn,sp.follow*dt);g.x+=gx/gn*st;g.y+=gy/gn*st;}
  if(g.age<sp.form)return events;/* forms first */const a=chanDue(m,c,interval);if(a)events.push(...H.area(m,c,s,g,g,sp.radius,sp.damage,props,{basic:true,attackId:a.id,chill:sp.chill,chillTime:.8,stagger:.03}));}
 else if(prim==='drum'){const a=chanDue(m,c,interval);if(a){m.drumBeat=0;events.push(...H.area(m,c,s,p,p,sp.radius,sp.damage,props,{basic:true,attackId:a.id,stagger:.2,push:14}));if(m.effects.length<90)m.effects.push({kind:'drumBeat',x:p.x,y:p.y,radius:sp.radius,age:0,duration:.55,follow:true});events.push({type:'spellImpact',sound:'storm-fireball-impact',x:p.x,y:p.y});}m.drumBeat=(m.drumBeat??0)+dt;}
 else if(prim==='lantern'){m.lantern=(m.lantern??0)+dt;const a=chanDue(m,c,interval);if(a){const ev=H.area(m,c,s,p,p,sp.radius,sp.damage,props,{basic:true,attackId:a.id,stagger:.02});events.push(...ev);const ids=hitIds(ev);
   if(ids.size){boundedHeal(c,s,Math.min(.02,.005*ids.size)*s.maxHp);if(m.effects.length<90)m.effects.push({kind:'lanternDrain',x:p.x,y:p.y,from:H.living(c).filter(e=>ids.has(e.id)).slice(0,8).map(e=>({x:e.x,y:e.y})),age:0,duration:.45});}}}
 else if(prim==='skull'){let k=m.skull;if(!k){const want=aim??{x:p.x+Math.cos(angle)*200,y:p.y+Math.sin(angle)*200},dx=want.x-p.x,dy=want.y-p.y,n=Math.hypot(dx,dy)||1,q=Math.min(1,sp.range/n);k=m.skull={charge:0,beat:0,age:0,x:p.x+dx*q,y:p.y+dy*q,seed:(Math.random()*1e4)|0};}
   k.age+=dt;if(s.hp>1){k.charge+=dt*speed;s.hp=Math.max(1,s.hp-sp.drain*s.maxHp*dt*speed);}k.beat+=dt*(2+4*Math.min(1,k.charge/sp.charge));}
 return events;
}
// LMB up: the Cursed Skull releases its pulse; channel visuals clear.
export function releaseChannel(m,c,s,p,props,H){
 const events=[];if(m.globe&&!m.held)m.globeCD=H.magePrimary(c).recast??1;m.globe=null;m.chanAge=0;m.lantern=null;
 const k=m.skull;if(!k||m.held)return events;m.skull=null;if(k.charge<=0)return events;
 const sp=H.magePrimary(c),f=k.charge/sp.charge,R=sp.radius+(sp.maxRadius*(sp.radius/MAGE_WEAPON_PRIMARIES.skull.radius)-sp.radius)*Math.min(1.25,f),at={x:k.x??p.x,y:k.y??p.y},a=beginAction(c,.25);
 const ev=H.area(m,c,s,at,at,R,sp.damage*(.25+.75*f),props,{basic:true,attackId:a.id,stagger:.25,push:10});events.push(...ev);
 const healed=dealt(ev)*sp.heal;if(healed>0)boundedHeal(c,s,healed);const ids=hitIds(ev);
 if(m.effects.length<90)m.effects.push({kind:'nova',element:'blood',x:at.x,y:at.y,radius:R,age:0,duration:.8},{kind:'skullStreams',x:p.x,y:p.y,from:H.living(c).filter(e=>ids.has(e.id)).slice(0,10).map(e=>({x:e.x,y:e.y})),age:0,duration:1});
 return events;
}
