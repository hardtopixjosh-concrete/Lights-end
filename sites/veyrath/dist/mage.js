import {ownStatuses,fieldContact} from './status-ownership.js?v=fx-260';
import {advanceActor,beginAction,outputAmount,grantBarrier,actor,refundCast} from './core-rules.js?v=fx-260';
import {requestBlood,tickBlood,stopDrain} from './blood-mage.js?v=fx-260';
import {blocked,directionRow,movePlayer} from './simulation.js?v=fx-260';
import {damageEnemy} from './combat.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {projectileHitsBody} from './projectile-contact.js?v=fx-260';
import {mageAbility} from './mage-abilities.js?v=fx-260';
import {rank,spellOwned} from './specializations.js?v=fx-260';
import {tickEFx,handPoint} from './mage-e-fx.js?v=fx-260';
import {tickSpellFx} from './mage-spell-fx.js?v=fx-260';
import {MAGE_WEAPON_PRIMARIES,MAGE_CHANNELS,MAGE_CLIP_OF,MAGE_CHANNEL_CLIP,MAGE_CASTS,canCastWeapon,castWeapon,tickWeapons,tickChannel,releaseChannel} from './mage-weapons.js?v=fx-260';
export {MAGE_CHANNELS,MAGE_CLIP_OF,MAGE_CHANNEL_CLIP};
export {projectileHitsBody,mageAbility};
// Input/cooldown IDs stay stable; specialization supplies active spell behavior.
export const SHOCK_ZAP={interval:.5,radius:110,damage:6,targets:2};
export const MAGE_SPELLS={bolt:{name:'Arcane attack',cost:0,cooldown:.6,duration:.48},fireball:{cost:18,cooldown:.5},nova:{cost:30,cooldown:2.5,radius:225},chain:{cost:28,cooldown:.8,targets:10},meteor:{cost:60,cooldown:8},blink:{cost:0,cooldown:3}};
import {BASIC_ATTACKS} from './combat-balance.js?v=fx-260';
export const MAGE_PRIMARIES={
 staff:{name:'Arcane Pierce',contactRadius:13,duration:.5,speed:600,range:700,pierce:6,size:48},
 wand:{name:'Arcane Dart',contactRadius:4,duration:.18,speed:760,range:650,pierce:1,size:21},
 spellbook:{name:'Arcane Fan',contactRadius:5,duration:.45,speed:600,range:470,pierce:1,count:5,spread:.55,size:24},
 orb:{name:'Arcane Pulse',duration:.48,radius:135},
 scepter:{name:'Arcane Beam',duration:.2,range:560},
 grimoire:{name:'Seeking Twins',contactRadius:7,duration:.4,speed:500,range:650,pierce:1,count:2,spread:.12,homing:true,size:29},
 ...MAGE_WEAPON_PRIMARIES
};
for(const [family,spec] of Object.entries(MAGE_PRIMARIES)){const b=BASIC_ATTACKS[family];spec.damage=b.damage;spec.cooldown=b.interval;}
// Oct 16 (user): while toggled on, the Orb drains energy faster than base regen can refill it
// (max base regen is 15/s), so you slowly run dry. Pulses themselves are free but need 2 energy.
export const ORB_PULSE_COST=0,ORB_DRAIN=0;
export function magePrimary(c){
 const base=MAGE_PRIMARIES[c.weapon?.primary]??MAGE_PRIMARIES.staff,w=c.weapon??{},mods=w.mods??{},count=Math.min(10,(base.count??1)+(mods.extra??0));
 return {...base,count,spread:(base.spread??(count>1?.1:0))*(mods.spread??1),speed:(base.speed??0)*(w.projectile??1),range:(base.range??0)*(w.reach??1),radius:(base.radius??0)*(w.reach??1)*(w.aoe??1),contactRadius:(base.contactRadius??6)*(mods.contact??1),size:(base.size??32)*(mods.contact??1),pierce:Math.min(12,(base.pierce??1)+(mods.pierce??0)),homing:base.homing||mods.homing,turn:1.8*(mods.turn??1),damage:base.damage*(mods.projectileFactor??1),ricochet:mods.ricochet??0,echo:mods.echo??0,beams:mods.beams??1,beamPierce:(base.beamPierce??1)-1+(mods.beamPierce??1),splash:base.splash??0,push:mods.push??0};
}
export function createEnergy(){return {value:100,max:100,since:2.5};}
export function tickEnergy(e,dt){let remaining=dt;while(remaining>0){const a=.6*(e.delay??1),b=1.5*(e.delay??1),next=e.since<a?a:e.since<b?b:Infinity,rate=(e.since<a?6:e.since<b?10:15)*(e.regen??1),step=Math.min(remaining,next-e.since);e.value=Math.min(e.max,e.value+rate*step);e.since+=step;remaining-=step;}}
export function createMage(s){s.hp=s.maxHp=170;s.classId='mage';return {energy:createEnergy(),cooldowns:Object.fromEntries(Object.keys(MAGE_SPELLS).map(k=>[k,0])),cast:null,held:false,queued:false,projectiles:[],echoes:[],effects:[],particles:[],particleClock:0,meteors:[],zones:[],invulnerable:0,blinkTime:0,beam:null,channel:null};}
export function clearMageInput(m){if(m){m.held=false;m.queued=false;m.pending=null;m.beam=null;m.channel=null;stopDrain(m);}}
export function queueMageSpell(m,c,s,p,aim,kind,props=[]){if(m.drain)return false;if(requestMage(m,c,s,p,aim,kind,props))return true;const spec=mageAbility(s,kind);if(!s.dead&&m.cast&&m.cooldowns[kind]===0&&m.energy.value>=spec.cost){m.pending={kind,aim:aim?{...aim}:null,remaining:.7,bloodChannel:s.path==='blood'&&kind==='fireball'};return true;}return false;}
export function clearMagePath(from,to,props,shield){if(shieldBlocksAttack(shield,from,to))return false;const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/4));for(let i=1;i<=n;i++)if(blocked(from.x+(to.x-from.x)*i/n,from.y+(to.y-from.y)*i/n,props,0,true))return false;return true;}
function requestMageOwned(m,c,s,p,aim,kind,props=[]){
 const slot={fireball:'RMB',nova:'Q',chain:'E',meteor:'R'}[kind];if(slot&&!spellOwned(s,slot))return false;
 if(s.path==='blood'&&kind!=='bolt')return requestBlood(m,c,s,p,aim,kind,props);
 if(m.drain)return false;
 // A toggled Orb pulse never blocks a real spell: the spell cuts the pulse short.
 const interruptOrb=kind!=='bolt'&&m.cast?.kind==='bolt'&&m.cast.primary==='orb';
 // Oct 16 (user): the Orb's pulse is a toggle (LMB on/off) that costs a little energy per pulse.
 const spec=kind==='bolt'?{...MAGE_SPELLS.bolt,...magePrimary(c),...(c.weapon?.primary==='orb'?{cost:ORB_PULSE_COST,minEnergy:0}:{})}:mageAbility(s,kind);if(!MAGE_SPELLS[kind]||s.dead||(m.cast&&!interruptOrb)||m.blinkTime>0||c.hitstop>0||m.cooldowns[kind]>0||m.energy.value<Math.max(spec.cost,spec.minEnergy??0))return false;
 if(interruptOrb)m.cast=null;
 if(kind==='bolt'&&MAGE_CHANNELS.has(c.weapon?.primary)){m.held=true;return true;}
 if(kind==='bolt'&&MAGE_CASTS.has(c.weapon?.primary)&&!canCastWeapon(m,c.weapon.primary,spec))return false;
 const aimY=aim?aim.y+(['bolt','fireball'].includes(kind)?30:0):0,angle=aim?Math.atan2(aimY-p.y,aim.x-p.x):p.row*Math.PI/4,distance=aim?Math.min(spec.range??560,Math.hypot(aim.x-p.x,aimY-p.y)):300;
 spec.weapon={...c.weapon};spec.paid=spec.cost;if(spec.cost){m.energy.value-=spec.cost;if(kind!=='bolt')m.energy.since=0;}
 m.cooldowns[kind]=spec.cooldown/(kind==='bolt'?(c.weapon?.speed??1):1);if(spec.charges){m.rodCharges=(m.rodCharges??spec.charges)-1;if(m.rodCharges>0)m.cooldowns[kind]=.25;else m.rodRefill=true;}m.beam=null;m.channel=null;m.castOrigin={x:p.x,y:p.y-38};
 const action=beginAction(c,spec.cooldown/(kind==='bolt'?(c.weapon?.speed??1):1),{...c.weapon},kind==='bolt'?'attack':'ability');
 m.cast={attackId:action.id,kind,spec,primary:c.weapon?.primary??'staff',weapon:{...c.weapon},angle,row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:0,duration:spec.duration/(kind==='bolt'?(c.weapon?.speed??1):1),fired:false,target:{x:p.x+Math.cos(angle)*distance,y:p.y+Math.sin(angle)*distance}};return true;
}
export function blinkMage(m,c,s,p,vector,props){
 if(m.drain)stopDrain(m);
 if(s.dead||m.cooldowns.blink>0||m.blinkTime>0||c.hitstop>0||m.cast&&m.cast.elapsed<m.cast.duration*.65)return false;
 const n=Math.hypot(vector.x,vector.y),a=n?Math.atan2(vector.y,vector.x):p.row*Math.PI/4,from={x:p.x,y:p.y};
 for(let i=0,n=Math.round(43*(s.mods?.reach??1));i<n;i++){const x=p.x+Math.cos(a)*4,y=p.y+Math.sin(a)*4;if(blocked(x,y,props))break;p.x=x;p.y=y;}
 if(Math.hypot(p.x-from.x,p.y-from.y)<1)return false;m.cast=null;clearMageInput(m);m.invulnerable=.18;m.blinkTime=.2;m.cooldowns.blink=3;
 const element=s.path??'arcane';m.effects.push({kind:'blink',role:'from',element,x:from.x,y:from.y,age:0,duration:.35},{kind:'blink',role:'to',element,x:p.x,y:p.y,age:0,duration:.4});
 if(rank(s,'escape'))m.blinkBurst={x:p.x,y:p.y,damage:24*rank(s,'escape'),origin:from};return true;
}
const living=c=>c.targets.filter(e=>e.state==='alive'&&!e.timeStopped&&!(e.emerge>0));
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)/.65);
function hit(m,c,s,e,damage,p,props,options={}){
 if(options.fieldGroup&&!fieldContact(c,e,options.fieldGroup,actor(c).time,.5))return [];
 const wasBurning=e.burn,bonus=(e.shock>0?1+.05*rank(s,'static'):1)*(s.path==='blood'&&e.bloodMarks?1+.15*e.bloodMarks.n:1)/* Oct 19 blood marks */,events=damageEnemy(c,e,damage*bonus,p,{props,weapon:m.outputWeapon??c.weapon,stagger:.08,push:0,...options});
 if(events.some(x=>x.type==='hit')){
   if(options.burn&&e.state==='alive')e.burn={remaining:3,pulse:.5,damage:(options.burnDamage??10)*(1+.12*rank(s,'kindling')),weapon:options.weapon??m.outputWeapon??c.weapon};
   if(options.shock)e.shock=3;
   if(options.chill){e.mageChill=options.chillTime??2;e.mageSlow=Math.min(['leader','boss'].includes(e.role)?.3:.6,options.chill);}
   if(options.freeze&&e.state==='alive'){if(['leader','boss'].includes(e.role)){e.mageChill=options.chillTime??2;e.mageSlow=options.chill??.2;}else{e.freeze=options.freeze;e.swing=null;}}
 }
 if(wasBurning&&events.some(x=>x.type==='death')&&rank(s,'wildfire')&&!wasBurning.spread){const target=living(c).find(t=>!t.burn&&distance(t,e)<135&&clearMagePath(p,t,props,c.forgeShield));if(target){target.burn={remaining:2,pulse:.5,damage:wasBurning.damage*.5,weapon:wasBurning.weapon,spread:true};m.effects.push({kind:'surge',element:'pyro',x:target.x,y:target.y,age:0,duration:.9,radius:55,scale:.4});}}
 // Combustion (talent): burning enemies explode on death; the blast itself never triggers another.
 if(wasBurning&&!options.combustion&&events.some(x=>x.type==='death')&&rank(s,'combustion')){m.effects.push({kind:'surge',element:'pyro',x:e.x,y:e.y,age:0,duration:.9,radius:80,scale:.5});events.push(...area(m,c,s,e,e,80,120,props,{burn:true,burnDamage:16,combustion:true,stagger:.1}));}
 return events;
}
// Oct 16 fix: blasts check line of sight from their own centre, not the caster (ground-targeted AoE
// used to miss enemies the caster couldn't see). A centre inside a prop skips the wall test.
function blastReaches(center,e,props,shield){return blocked(center.x,center.y,props,0,true)?!shieldBlocksAttack(shield,center,e):clearMagePath(center,e,props,shield);}
function area(m,c,s,p,center,radius,damage,props,options={}){const events=[];for(const e of living(c))if(distance(e,center)<radius+e.radius&&blastReaches(center,e,props,c.forgeShield))events.push(...hit(m,c,s,e,typeof damage==='function'?damage(e):damage,p,props,options));return events;}
const H={hit,area,living,distance,clearMagePath,magePrimary};
function spawnPrimary(m,c,p,a,props=[]){
 const spec=a.spec;if(a.primary==='orb')return false;
 const candidates=spec.homing?living(c).filter(e=>distance(e,a.target)<240&&clearMagePath(p,e,props,c.forgeShield)).sort((x,y)=>distance(x,a.target)-distance(y,a.target)):[];
 for(let i=0;i<(spec.count??1)&&m.projectiles.length<72;i++){const angle=a.angle+(spec.count>1?((i/(spec.count-1))*2-1)*spec.spread:0);m.projectiles.push({kind:'bolt',attackId:a.attackId,volley:a.volley??(a.volley=new Map()),primary:a.primary,element:'arcane',secondary:!!a.secondary,ricochets:spec.ricochet??0,spec,contactRadius:spec.contactRadius,weapon:a.weapon,x:p.x,y:p.y,origin:{x:p.x,y:p.y},angle,speed:spec.speed,remaining:spec.range,damage:spec.damage,hitTargets:new Set(),targetId:candidates[i%candidates.length]?.id});}return true;
}
function tickMageOwned(m,c,s,p,aim,props,dt){
 if(s.dead){m.beam=null;m.channel=null;stopDrain(m);return [];}
 c.classId='mage';advanceActor(c,dt);m.outputWeapon=null;const events=[];m.basicElement=s.runeElement??s.path??'arcane';tickEnergy(m.energy,dt);if(m.orbOn&&c.weapon?.primary==='orb'&&!s.dead)m.energy.value=Math.max(0,m.energy.value-ORB_DRAIN*dt);
 events.push(...tickBlood(m,c,s,p,aim,props,dt));m.invulnerable=Math.max(0,m.invulnerable-dt);m.blinkTime=Math.max(0,m.blinkTime-dt);
 for(const k of Object.keys(m.cooldowns))m.cooldowns[k]=Math.max(0,m.cooldowns[k]-dt*(k==='blink'?(s.world?.dash??1):1));
 for(const e of c.targets){if(e.timeStopped)continue;e.shock=Math.max(0,(e.shock??0)-dt);if(e.burn&&e.state==='alive'){e.burn.remaining-=dt;e.burn.pulse-=dt;if(e.burn.pulse<=0){e.burn.pulse+=.5;if(!shieldBlocksAttack(c.forgeShield,e,e))events.push(...hit(m,c,s,e,e.burn.damage??10,p,props,{dot:true,weapon:e.burn.weapon,stagger:0}));}if(e.burn?.remaining<=0)e.burn=null;}
   // Oct 16 (user): electrified (shocked) enemies zap up to 2 neighbours within 110 for a little damage every .5s.
   if(e.shock>0&&e.state==='alive'&&(e.shockZap=(e.shockZap??0)-dt)<=0){e.shockZap=SHOCK_ZAP.interval;for(const t of living(c).filter(t=>t!==e&&distance(t,e)<SHOCK_ZAP.radius).sort((a,b)=>distance(a,e)-distance(b,e)).slice(0,SHOCK_ZAP.targets)){events.push(...hit(m,c,s,t,SHOCK_ZAP.damage,p,props,{dot:true,stagger:0}));m.effects.push({kind:'zap',element:'storm',x:t.x,y:t.y,radius:22,age:0,duration:.22,scale:.35,quiet:true});}}}
 if(m.blinkBurst){const b=m.blinkBurst;events.push(...area(m,c,s,b.origin,b,115,b.damage,props,{shock:true}));m.effects.push({kind:'zap',element:'storm',x:b.x,y:b.y,radius:115,age:0,duration:.45});m.blinkBurst=null;}
 if(m.pending){m.pending.remaining-=dt;if(m.pending.remaining<=0)m.pending=null;else if(requestMage(m,c,s,p,m.pending.aim,m.pending.kind,props))m.pending=null;}
 const prim=c.weapon?.primary,chan=MAGE_CHANNELS.has(prim),beamHeld=!m.drain&&chan&&m.held&&!m.cast&&!m.pending&&m.blinkTime<=0;
 if(beamHeld){m.queued=false;events.push(...(prim==='scepter'||prim==='frostbeam'?tickBeam(m,c,s,p,aim,props,dt):tickChannel(m,c,s,p,aim,props,dt,H)));}else{m.beam=null;if(!m.drain)m.channel=null;events.push(...releaseChannel(m,c,s,p,props,H));if(!m.drain&&!chan&&!m.pending&&(m.held||m.queued||m.orbOn&&c.weapon?.primary==='orb')&&requestMage(m,c,s,p,aim,'bolt'))m.queued=false;}
 if(m.cast){const a=m.cast,spec=a.spec;m.outputWeapon=a.weapon;a.elapsed+=dt;
   if(!a.fired&&a.elapsed>=a.duration*.45){a.fired=true;events.push({type:'mageCast',kind:a.kind,x:p.x,y:p.y});
     if(a.kind==='bolt'){m.effects.push({kind:'lmbCast',element:m.basicElement??'arcane',primary:a.primary,x:p.x,y:p.y,angle:a.angle,age:0,duration:.35});
       if(a.primary==='orb'){events.push(...area(m,c,s,p,p,spec.radius,spec.damage,props,{basic:true,attackId:a.attackId,weapon:a.weapon,push:spec.push}));m.effects.push({kind:'apulse',element:m.basicElement??'arcane',x:p.x,y:p.y,age:0,duration:.55,radius:spec.radius,follow:true});}
       else if(MAGE_CASTS.has(a.primary))events.push(...castWeapon(m,c,s,p,a,props,H));
       else spawnPrimary(m,c,p,a,props);
       if(spec.echo&&m.echoes.length<12)m.echoes.push({delay:.22,origin:{...p},action:{...a,secondary:true,spec:{...spec,damage:spec.damage*spec.echo,echo:0}}});
     }
     // Oct 15 user decision: Cryo RMB is a wide ice road that races out, damaging and chilling everything on it.
     if(a.kind==='fireball'&&spec.element==='cryo')(m.icePaths??=[]).push({x:p.x,y:p.y,origin:{x:p.x,y:p.y},angle:a.angle,len:0,max:Math.min(spec.range??600,340),width:118,speed:900,age:0,life:3+2*rank(s,'frostHighway'),spec,weapon:a.weapon,hit:new Set()});
     else if(a.kind==='fireball'&&spec.spell!=='chain'&&m.projectiles.length<72)m.projectiles.push({kind:'fireball',bounces:spec.element==='pyro'?3+2*rank(s,'chainReaction'):0,element:spec.element,spec,contactRadius:spec.contactRadius,weapon:a.weapon,x:p.x,y:p.y,origin:{x:p.x,y:p.y},angle:a.angle,speed:spec.speed??500,remaining:spec.range??650,damage:spec.damage,hitTargets:new Set()});
     if(a.kind==='nova'){
       if(spec.barrier&&grantBarrier(s,outputAmount(spec.barrier,a.weapon,'barrier'),spec.wardTime)){m.ward={weapon:a.weapon,element:spec.element,remaining:spec.wardTime,age:0,x:p.x,y:p.y};}
       const wasFrozen=new Set(living(c).filter(t=>t.freeze>0));
       events.push(...area(m,c,s,p,p,spec.radius,spec.damage,props,{burn:spec.element==='pyro',shock:spec.element==='storm',freeze:spec.element==='cryo'?spec.freeze:0,chill:spec.element==='cryo'?spec.chill:0}));
       if(spec.element==='cryo'&&rank(s,'frozenHeart')){const n=living(c).filter(t=>t.freeze>0&&!wasFrozen.has(t)).length;m.energy.value=Math.min(m.energy.max,m.energy.value+refundCast(spec,8*n));if(n)m.effects.push({kind:'energyRefund',element:'cryo',x:p.x,y:p.y,sources:living(c).filter(t=>t.freeze>0&&!wasFrozen.has(t)).slice(0,8).map(t=>({x:t.x,y:t.y})),age:0,duration:.8});}m.effects.push({kind:'qnova',element:spec.element,x:p.x,y:p.y,age:0,duration:1,radius:spec.radius});
     }
     if(a.kind==='chain'&&spec.spell==='rod'){const R=spec.range??560,dx=a.target.x-p.x,dy=a.target.y-p.y,n=Math.hypot(dx,dy)||1,d=Math.min(R,n);(m.rods??=[]).push({x:p.x+dx/n*d,y:p.y+dy/n*d,age:0,life:spec.life,spec,zap:.15,oc:0,seed:(Math.random()*1e4)|0});m.effects.push({kind:'zap',element:'storm',x:p.x+dx/n*d,y:p.y+dy/n*d,radius:50,age:0,duration:.35});}
     if((a.kind==='chain'&&spec.spell!=='rod')||spec.spell==='chain'){
       if(spec.element==='storm'){let from=p;const visited=new Set(),lines=[];for(let i=0;i<spec.targets;i++){const choices=living(c).filter(e=>!visited.has(e)&&distance(e,from)<(i?220*(spec.range/560):spec.range)&&clearMagePath(from,e,props,c.forgeShield)).sort((x,y)=>distance(x,i?from:a.target)-distance(y,i?from:a.target));const e=choices[0];if(!e)break;visited.add(e);lines.push({x:from.x,y:from.y,toX:e.x,toY:e.y});events.push(...hit(m,c,s,e,spec.damage,from,props,{shock:true}));from=e;}
       // Oct 16 (user): Chain Lightning overcharges a Storm Rod it is aimed at or passes (Supercharger: every rod). Reaction label OVERLOAD.
       {const near=(r,l)=>{const vx=l.toX-l.x,vy=l.toY-l.y,q=Math.max(0,Math.min(1,((r.x-l.x)*vx+(r.y-l.y)*vy)/(vx*vx+vy*vy||1)));return Math.hypot(l.x+vx*q-r.x,l.y+vy*q-r.y)<45;};const hitRods=(m.rods??[]).filter(r=>r.age<r.life&&(Math.hypot(r.x-a.target.x,r.y-a.target.y)<90&&distance(r,p)<=spec.range+90||lines.some(l=>near(r,l)))).sort((x,y)=>distance(x,p)-distance(y,p)),boost=rank(s,'supercell'),ocs=boost?hitRods:hitRods.slice(0,1);for(const r of ocs){r.oc=4+2*boost;if(!lines.some(l=>near(r,l)))lines.push({x:lines.length?lines.at(-1).toX:p.x,y:lines.length?lines.at(-1).toY:p.y,toX:r.x,toY:r.y,rod:true});events.push({type:'reaction',name:'OVERLOAD',x:r.x,y:r.y-60});}}
       if(lines.length)events.push({type:'spellImpact',sound:'storm-fireball-impact',x:lines[0].toX,y:lines[0].toY});if(rank(s,'arcFlash')&&lines.length){const last=lines.at(-1),at={x:last.toX,y:last.toY};events.push(...area(m,c,s,at,at,90,120,props,{shock:true,stagger:.1}));m.effects.push({kind:'zap',element:'storm',x:at.x,y:at.y,radius:90,age:0,duration:.45});}const effect={kind:'chain',element:'storm',lines,hand:handPoint(p,a.angle),age:0,duration:.62};if(!lines.length){const reach=Math.min(140,Math.hypot(a.target.x-p.x,a.target.y-p.y));effect.miss={x:p.x+Math.cos(a.angle)*reach,y:p.y+Math.sin(a.angle)*reach};}m.effects.push(effect);}
       else{if(spec.element==='cryo')events.push({type:'spellImpact',sound:'cryo-chain-impact',x:a.target.x,y:a.target.y});const frozen=spec.element==='cryo'?living(c).filter(e=>(e.freeze>0||e.role==='boss'&&e.mageChill>0)&&distance(e,a.target)<spec.radius+(e.radius??12)):[];
       // Reaction (Oct 16): SHATTER — frozen enemies caught by Glacial Burst burst into shards (60% to neighbours).
       for(const f of frozen){f.freeze=0;if(f.role==='boss')f.mageChill=0;events.push({type:'reaction',name:'SHATTER',x:f.x,y:f.y});m.effects.push({kind:'glacial',element:'cryo',x:f.x,y:f.y,age:0,duration:.8,radius:90,scale:.6});for(const e of living(c))if(e!==f&&distance(e,f)<90+(e.radius??12)&&fieldContact(c,e,'shatter',actor(c).time,.25))events.push(...hit(m,c,s,e,spec.damage*.6,f,props,{chill:spec.chill,chillTime:2}));}
       events.push(...area(m,c,s,p,a.target,spec.radius,e=>spec.damage*(frozen.includes(e)||e.freeze>0||e.mageChill>0?spec.frozenBonus??1:1),props,{burn:spec.element==='pyro',burnDamage:20,freeze:spec.element==='cryo'?spec.freeze:0,chill:spec.element==='cryo'?spec.chill:0,chillTime:spec.chillTime}));if(spec.element==='pyro'&&rank(s,'firePool'))(m.scorches??=[]).push({x:a.target.x,y:a.target.y,origin:{x:p.x,y:p.y},weapon:a.weapon,radius:spec.radius*.8,age:0,life:3,tick:.5,scale:.6});
       m.effects.push({kind:spec.element==='pyro'?'surge':'glacial',element:spec.element,x:a.target.x,y:a.target.y,age:0,duration:spec.element==='pyro'?1.3:1.35,radius:spec.radius});
       if(spec.element==='cryo'&&rank(s,'glacialShards'))for(let k=0;k<6;k++){const ang=k*Math.PI/3+a.angle,ca=Math.cos(ang),sa=Math.sin(ang);for(const e of living(c)){const dx=e.x-a.target.x,dy=e.y-a.target.y,along=dx*ca+dy*sa,side=Math.abs(-dx*sa+dy*ca);if(along>spec.radius*.5&&along<spec.radius+240&&side<26+(e.radius??12)){events.push(...hit(m,c,s,e,spec.damage*.5,a.target,props,{chill:spec.chill,chillTime:2}));m.effects.push({kind:'glacial',element:'cryo',x:e.x,y:e.y,age:0,duration:.6,radius:40,scale:.35});}}}}
     }
     if(a.kind==='meteor'){
       if(spec.element==='pyro'){const count=spec.stars?3:1;for(let i=0;i<count;i++){const angle=i*Math.PI*2/3,offset=count===1?0:70;m.meteors.push({x:a.target.x+Math.cos(angle)*offset,y:a.target.y+Math.sin(angle)*offset*.65,origin:{...p},age:0,warning:.85+i*.18,radius:spec.stars?110:spec.radius,spec,scale:spec.stars?.5:1});}}
       else m.zones.push({x:a.target.x,y:a.target.y,origin:{...p},age:0,warning:.65,spec,pulse:0,radius:spec.radius});
     }
   }if(a.elapsed>=a.duration){if(a.kind==='bolt')m.castHold={row:a.row,remaining:.6};m.cast=null;}
 }
 // After a basic, the idle body keeps facing the aim briefly (no cast animation on LMB).
 m.auraPos={x:p.x,y:p.y};if(m.castHold){m.castHold.remaining-=dt;if(m.castHold.remaining<=0||m.blinkTime>0)m.castHold=null;}
 for(let i=m.echoes.length-1;i>=0;i--){const e=m.echoes[i];e.delay-=dt;if(e.delay>0)continue;const a=e.action;if(a.primary==='orb'){events.push(...area(m,c,s,e.origin,e.origin,a.spec.radius,a.spec.damage,props,{basic:true,secondary:true,weapon:a.weapon,push:0}));m.effects.push({kind:'apulse',element:m.basicElement??'arcane',x:e.origin.x,y:e.origin.y,age:0,duration:.5,radius:a.spec.radius});}else if(MAGE_CASTS.has(a.primary))events.push(...castWeapon(m,c,s,e.origin,a,props,H));else spawnPrimary(m,c,e.origin,a,props);m.echoes.splice(i,1);}
 tickProjectiles(m,c,s,p,props,dt,events);events.push(...tickWeapons(m,c,s,p,aim,props,dt,H));m.fxTargets=c.targets;
 m.onIce=false;
 for(let i=(m.icePaths??[]).length-1;i>=0;i--){const ip=m.icePaths[i],ca=Math.cos(ip.angle),sa=Math.sin(ip.angle);ip.age+=dt;
   if(!ip.done){const step=Math.min(ip.max-ip.len,ip.speed*dt);for(let t=0;t<step;t+=6){const from={x:ip.x+ca*ip.len,y:ip.y+sa*ip.len},to={x:from.x+ca*6,y:from.y+sa*6};if(!clearMagePath(from,to,props,c.forgeShield)){ip.done=true;break;}ip.len+=6;}if(ip.len>=ip.max)ip.done=true;}
   for(const e of living(c)){const dx=e.x-ip.x,dy=e.y-ip.y,along=dx*ca+dy*sa,side=Math.abs(-dx*sa+dy*ca);if(along<0||along>ip.len||side>ip.width/2+(e.radius??12))continue;
     if(!ip.hit.has(e)){ip.hit.add(e);events.push(...hit(m,c,s,e,ip.spec.damage,ip.origin,props,{weapon:ip.weapon,chill:Math.max(.35,ip.spec.chill??.2),chillTime:2,freeze:rank(s,'glacierCharge')?1:0}));}
     else if(ip.age<ip.life-.3){e.mageChill=Math.max(e.mageChill??0,.4);e.mageSlow=Math.max(e.mageSlow??0,['leader','boss'].includes(e.role)?.3:.5);}}
   if(rank(s,'frostHighway')&&ip.age<ip.life){const px=p.x-ip.x,py=p.y-ip.y,al=px*ca+py*sa;if(al>=0&&al<=ip.len&&Math.abs(-px*sa+py*ca)<ip.width/2)m.onIce=true;}
   if(ip.age>ip.life)m.icePaths.splice(i,1);}
 // Storm Rods (Oct 16, user; replaces Vortex/Thunderstrike): each rod zaps up to 10 enemies near it every .5s; every pair of rods within link range is joined by an arc that electrocutes anything crossing it. Overcharged (Chain Lightning) rods are bigger, faster and hit harder for 4s.
 const rods=m.rods??=[];for(let i=rods.length-1;i>=0;i--){const r=rods[i];m.outputWeapon=r.spec.weapon;r.age+=dt;r.oc=Math.max(0,r.oc-dt);if(r.age>=r.life){rods.splice(i,1);continue;}
   const sp=r.spec,oc=r.oc>0,R=sp.radius*(1+.25*rank(s,'vortexFling'))*(oc?1.5:1);r.zap-=dt;
   if(r.zap<=0){r.zap+=oc?sp.interval/2:sp.interval;const tip={x:r.x,y:r.y};const ts=living(c).filter(e=>Math.hypot(e.x-r.x,(e.y-r.y)/.65)<R+e.radius&&clearMagePath(tip,e,props,c.forgeShield)).sort((x,y)=>distance(x,r)-distance(y,r)).slice(0,sp.maxTargets);
     for(const e of ts){if(!fieldContact(c,e,'rods',actor(c).time,.25))continue;events.push(...hit(m,c,s,e,sp.damage*(oc?1.5:1),tip,props,{shock:true,stagger:.05}));(m.rodZaps??=[]).push({x:r.x,y:r.y,toX:e.x,toY:e.y,age:0,oc,seed:(Math.random()*1e4)|0});}}}
 m.rodLinks=[];for(let i=0;i<rods.length;i++)for(let j=i+1;j<rods.length;j++)if(distance(rods[i],rods[j])<=rods[i].spec.linkRange)m.rodLinks.push([rods[i],rods[j]]);
 m.rodArcTick=(m.rodArcTick??0)-dt;if(m.rodArcTick<=0&&m.rodLinks.length){m.rodArcTick+=.25;const wire=rank(s,'vortexChase'),done=new Set();for(const [r1,r2] of m.rodLinks){const vx=r2.x-r1.x,vy=r2.y-r1.y,L=vx*vx+vy*vy||1,mult=(r1.oc>0||r2.oc>0?1.5:1)*(wire?1.5:1);for(const e of living(c)){if(done.has(e))continue;const q=Math.max(0,Math.min(1,((e.x-r1.x)*vx+(e.y-r1.y)*vy)/L));if(Math.hypot(r1.x+vx*q-e.x,r1.y+vy*q-e.y)>22+(e.radius??12))continue;done.add(e);if(!fieldContact(c,e,'rods',actor(c).time,.25))continue;events.push(...hit(m,c,s,e,r1.spec.arcDamage*mult,{x:r1.x+vx*q,y:r1.y+vy*q},props,{weapon:r1.spec.weapon,shock:true,stagger:.05,...(wire?{chill:.4,chillTime:1}:{})}));}}}
 for(let i=(m.rodZaps??[]).length-1;i>=0;i--){m.rodZaps[i].age+=dt;if(m.rodZaps[i].age>.3)m.rodZaps.splice(i,1);}
 if(m.rodRefill&&!(m.cooldowns.chain>0)){m.rodRefill=false;m.rodCharges=null;}
 // Pyro meteor scorch: the burnt ground keeps setting anything standing in it on fire for 5s.
 for(let i=(m.scorches??[]).length-1;i>=0;i--){const z=m.scorches[i];m.outputWeapon=z.weapon;z.age+=dt;z.tick-=dt;if(z.tick<=0&&z.age<z.life){z.tick+=.5;events.push(...area(m,c,s,z.origin,z,z.radius,24*z.scale,props,{burn:true,burnDamage:16,stagger:0,fieldGroup:'scorch'}));}if(z.age>z.life+.6)m.scorches.splice(i,1);}
 for(let i=m.meteors.length-1;i>=0;i--){const h=m.meteors[i];m.outputWeapon=h.spec.weapon;h.age+=dt;if(h.age>=h.warning){events.push({type:'spellImpact',sound:'pyro-meteor-impact',x:h.x,y:h.y});
   // Reaction (Oct 16): DETONATE — Meteor instantly burns out every burn it lands on at 150%.
   for(const e of living(c))if(e.burn&&distance(e,h)<h.radius+(e.radius??12)){const burst=(e.burn.damage??10)*Math.max(1,Math.ceil(e.burn.remaining/.5))*1.5;e.burn=null;events.push(...hit(m,c,s,e,burst,h,props,{dot:true,stagger:.2}),{type:'reaction',name:'DETONATE',x:e.x,y:e.y});m.effects.push({kind:'surge',element:'pyro',x:e.x,y:e.y,age:0,duration:.8,radius:55,scale:.4});}events.push(...area(m,c,s,h.origin,h,h.radius,e=>(distance(e,h)<65?h.spec.damage:h.spec.outerDamage??250)*h.scale,props,{burn:true}));m.effects.push({kind:'surge',element:'pyro',big:true,x:h.x,y:h.y,age:0,duration:1.6,radius:h.radius,scale:1.5*h.scale});(m.scorches??=[]).push({x:h.x,y:h.y,origin:h.origin,weapon:h.spec.weapon,radius:h.radius*(1+.3*rank(s,'burningEarth')),age:0,life:5+3*rank(s,'burningEarth'),tick:.5,scale:h.scale});if(rank(s,'meteorAftershock')&&!h.aftershock)m.meteors.push({...h,age:0,warning:1.5,aftershock:true,scale:h.scale*.4});m.meteors.splice(i,1);}}
 for(let i=m.zones.length-1;i>=0;i--){const z=m.zones[i];m.outputWeapon=z.spec.weapon;z.age+=dt;
   // Oct 15: Tempest drifts after the caster at 75/s (well below run speed) while it keeps striking.
   if((z.spec.element==='storm'||z.spec.element==='cryo'&&rank(s,'blizzardFollow'))&&z.age>=z.warning){const dx=p.x-z.x,dy=p.y-z.y,n=Math.hypot(dx,dy);if(n>4){const step=Math.min(n,75*(1+rank(s,'stormChaser'))*dt);z.x+=dx/n*step;z.y+=dy/n*step;}}if(z.age<z.warning)continue;z.pulse-=dt;if(z.pulse<=0){z.pulse+=z.spec.interval;const ice=z.spec.element==='cryo';events.push(...area(m,c,s,z.origin,z,z.radius,z.spec.damage,props,{freeze:ice?z.spec.interval+.35:0,chill:ice?.25:0,shock:!ice}));
     if(!ice&&rank(s,'stormChaser')){const t=living(c).filter(e=>Math.hypot(e.x-z.x,(e.y-z.y)/.65)<z.radius).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(t){events.push(...hit(m,c,s,t,z.spec.damage,z,props,{shock:true}));m.effects.push({kind:'skybolt',element:'storm',x:t.x,y:t.y,fromX:z.x,fromY:z.y-230,age:0,duration:.3},{kind:'zap',element:'storm',x:t.x,y:t.y,radius:60,age:0,duration:.35});}}m.effects.push({kind:'pulse',element:z.spec.element,x:z.x,y:z.y,age:0,duration:.45,radius:z.radius});}if(z.age>z.warning+z.spec.life){if(z.spec.iceage)events.push(...area(m,c,s,z.origin,z,z.radius,70,props,{freeze:1.2,chill:.25}));m.zones.splice(i,1);}}
 for(let i=m.effects.length-1;i>=0;i--){m.effects[i].age+=dt;if(m.effects[i].age>=m.effects[i].duration)m.effects.splice(i,1);}
 if(m.ward){m.outputWeapon=m.ward.weapon;m.ward.age+=dt;m.ward.remaining-=dt;m.ward.x=p.x;m.ward.y=p.y;if(m.ward.remaining<=0||!(s.barrier>0)){if(m.ward.element==='pyro'&&rank(s,'wardNova')){events.push(...area(m,c,s,p,p,210,140,props,{burn:true,burnDamage:20,stagger:.3}));m.effects.push({kind:'qnova',element:'pyro',x:p.x,y:p.y,age:0,duration:.9,radius:210});}m.ward=null;}}
 if(m.cast)m.castOrigin={x:p.x,y:p.y-38};tickMageParticles(m,dt);tickEFx(m,dt);tickSpellFx(m,dt);return events;
}
function tickProjectiles(m,c,s,p,props,dt,events){
 for(let i=m.projectiles.length-1;i>=0;i--){const b=m.projectiles[i];
   if(b.spec.homing){const target=living(c).find(e=>e.id===b.targetId);if(target&&clearMagePath(b,target,props,c.forgeShield)){const desired=Math.atan2(target.y-b.y,target.x-b.x),delta=Math.atan2(Math.sin(desired-b.angle),Math.cos(desired-b.angle));b.angle+=Math.max(-(b.spec.turn??1.8)*dt,Math.min((b.spec.turn??1.8)*dt,delta));}}
   const travel=Math.min(b.remaining,b.speed*dt),steps=Math.max(1,Math.ceil(travel/4));let stopped=false;
   for(let j=0;j<steps;j++){const next={x:b.x+Math.cos(b.angle)*travel/steps,y:b.y+Math.sin(b.angle)*travel/steps};if(!clearMagePath(b,next,props,c.forgeShield)){stopped=true;break;}b.x=next.x;b.y=next.y;
     const e=living(c).find(e=>!b.hitTargets.has(e)&&projectileHitsBody(b,e)&&clearMagePath(b.origin,e,props,c.forgeShield));if(!e)continue;
     if(b.primary==='spellbook'&&b.volley){const n=b.volley.get(e.id)??0;if(n>=2){b.hitTargets.add(e);continue;}b.volley.set(e.id,n+1);}
     if(b.kind==='fireball'&&b.element==='pyro'&&rank(s,'sunfire'))(m.scorches??=[]).push({x:e.x,y:e.y,origin:{x:b.x,y:b.y},weapon:b.weapon,radius:50,age:0,life:2,tick:.25,scale:.4});
     // Oct 16 (user): Fireball keeps its explosion (area damage) but never ignites on its own. Only a lit hit ignites
     // (target already burning from E/R/spread, or the fireball carries fire bounced off one); that target ignites and the fire bounces on.
     const lit=b.kind==='fireball'&&b.element==='pyro'&&(!!e.burn||!!b.carriesFire);
     if(b.kind==='fireball'&&b.element==='pyro'){events.push({type:'spellImpact',sound:'pyro-fireball-impact',x:e.x,y:e.y});
       events.push(...area(m,c,s,b.origin,e,b.spec.radius,t=>b.damage*(['leader','boss'].includes(t.role)?b.spec.elite:1)*(t.burn?1.6:1),props,{weapon:b.weapon}));
       if(lit&&e.state==='alive')e.burn={remaining:3,pulse:.5,damage:16*(1+.12*rank(s,'kindling')),weapon:b.weapon};}
     else{const ev=hit(m,c,s,e,b.damage,b.origin,props,{basic:b.kind==='bolt',attackId:b.attackId,secondary:b.secondary,push:b.kind==='bolt'?b.spec.push:0,weapon:b.weapon,chill:b.kind==='fireball'&&b.element==='cryo'?b.spec.chill:0,shock:b.kind==='fireball'&&b.element==='storm'||b.primary==='stormstaff'});events.push(...ev);b.lastCrit=ev.some(v=>v.critical);
       /* Oct 18 Ember Beads: each ember bursts, hitting the enemies around its target (not the target again) */
       if(b.spec.splash){for(const t of living(c))if(t!==e&&distance(t,e)<b.spec.splash+(t.radius??12)&&blastReaches(e,t,props,c.forgeShield))events.push(...hit(m,c,s,t,b.damage,e,props,{basic:true,attackId:b.attackId,secondary:true,weapon:b.weapon}));if(m.effects.length<90)m.effects.push({kind:'emberBurst',element:'pyro',x:e.x,y:e.y,radius:b.spec.splash,age:0,duration:.4});}}
     if(b.kind==='bolt'&&b.ricochets>0){const other=living(c).filter(t=>t!==e&&!b.hitTargets.has(t)&&distance(t,e)<180&&clearMagePath(e,t,props,c.forgeShield)).sort((x,y)=>distance(x,e)-distance(y,e))[0];if(other){b.ricochets--;b.angle=Math.atan2(other.y-b.y,other.x-b.x);b.damage*=.6;b.spec={...b.spec,pierce:Math.max(2,b.spec.pierce)};}}
     m.effects.push(b.kind!=='fireball'?{kind:'arcHit',element:m.basicElement??'arcane',primary:b.primary,crit:!!b.lastCrit,x:b.x,y:b.y,age:0,duration:b.lastCrit?.42:.3}:b.element==='pyro'?{kind:'surge',element:'pyro',x:e.x,y:e.y,age:0,duration:lit?1:.7,radius:b.spec.radius,scale:lit?.55:.45}:b.element==='cryo'?{kind:'glacial',element:'cryo',x:e.x,y:e.y,age:0,duration:.9,radius:45,scale:.45}:{kind:'zap',element:'storm',x:e.x,y:e.y,age:0,duration:.4,radius:50});b.hitTargets.add(e);
     // Spreading fire (Oct 16, replaces Oct 15 always-bounce): only a lit hit bounces (up to 3) to the nearest unhit target within 260, 50% damage (Oct 18 balance, was 80%), carrying fire to ignite it.
     if(lit&&(b.bounces??0)>0){const next=living(c).filter(t=>!b.hitTargets.has(t)&&distance(t,e)<260&&clearMagePath(e,t,props,c.forgeShield)).sort((x,y)=>distance(x,e)-distance(y,e))[0];if(next){b.bounces--;b.carriesFire=true;b.angle=Math.atan2(next.y-b.y,next.x-b.x);b.damage*=.5;b.remaining=Math.max(b.remaining,320);b.origin={x:b.x,y:b.y};continue;}}
     if(b.hitTargets.size>=(b.spec.pierce??1)){stopped=true;break;}
   }b.remaining-=travel;if(stopped||b.remaining<=0)m.projectiles.splice(i,1);
 }
}
function tickBeam(m,c,s,p,aim,props,dt){
 const spec=magePrimary(c),angle=aim?Math.atan2(aim.y+30-p.y,aim.x-p.x):p.row*Math.PI/4,beam=m.beam??{pulse:0,age:0};beam.age+=dt;beam.pulse-=dt;const lines=[],events=[],due=actor(c).time>=(m.channelReadyAt??0)-1e-6;const action=due?beginAction(c,spec.cooldown/(c.weapon?.speed??1)):null;
 for(let i=0;i<spec.beams;i++){
   const a=angle+(spec.beams>1?(i===0?-.1:.1):0),targets=new Set();let end={x:p.x,y:p.y};
   for(let d=0;d<=spec.range;d+=4){const next={x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d};if(!clearMagePath(end,next,props,c.forgeShield))break;end=next;
     const target=living(c).find(e=>!targets.has(e)&&projectileHitsBody({...next,contactRadius:spec.contactRadius},e));
     if(target){targets.add(target);if(due&&clearMagePath(p,target,props,c.forgeShield)){const fb=c.weapon?.primary==='frostbeam',now=actor(c).time;let freeze=0;if(fb){target.fbT=(now-(target.fbLast??-9)<.45?target.fbT??0:0)+spec.cooldown/(c.weapon?.speed??1);target.fbLast=now;if(target.fbT>=spec.freezeAfter){target.fbT=0;freeze=1;}}events.push(...hit(m,c,s,target,spec.damage,p,props,{basic:true,attackId:action?.id,...(fb?{chill:.35,chillTime:.6,freeze}:{})}));m.effects.push({kind:'arcHit',element:m.basicElement??'arcane',small:true,x:target.x,y:target.y,age:0,duration:.2});}if(targets.size>=spec.beamPierce)break;}
   }lines.push({x:p.x,y:p.y,toX:end.x,toY:end.y});
 }
 if(due){beam.pulse=spec.cooldown/(c.weapon?.speed??1);m.channelReadyAt=actor(c).time+beam.pulse;}Object.assign(beam,{...lines[0],lines,width:spec.contactRadius});m.beam=beam;m.channel={row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:beam.age%1,duration:1,kind:'beam'};return events;
}
const PARTICLE_COLORS={blood:['#e7a1b4','#ad375b','#f4c0cb'],pyro:['#ffd59d','#de8c45','#bc7157'],cryo:['#e6faff','#8cd8f5','#b7dce0'],storm:['#cfb6ff','#a4cbff','#f6eeff'],arcane:['#ceb9ff','#9adfff','#f4dcff']};
function sparks(m,x,y,kind,count=18,spread=0){const colors=PARTICLE_COLORS[kind]??PARTICLE_COLORS.arcane;for(let i=0;i<count&&m.particles.length<640;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*135,life=.35+Math.random()*.5,r=spread*(.75+Math.random()*.25);m.particles.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.65-35,life,max:life,size:1.5+Math.random()*3.5,color:colors[i%colors.length],streak:i%4===0});}}
function tickMageParticles(m,dt){
 // Elemental spell effects seed their own particles in mage-e-fx.js / mage-spell-fx.js.
 for(const e of m.effects)if(!e.seeded){e.seeded=true;if(['chain','surge','glacial','qnova','pulse','zap','blink','arcHit','apulse','lmbCast','bloom','vortexFx','energyRefund','skybolt','hemoBurst','gauntCone','drumBeat','lanternDrain','skullStreams'].includes(e.kind)||e.kind==='nova'&&e.element==='blood')continue;else if(e.kind==='nova'){sparks(m,e.x,e.y-15,e.element,35);sparks(m,e.x,e.y-8,e.element,85,e.radius*.65);}else sparks(m,e.x,e.y-20,e.element,e.kind==='meteor'?95:32);}
 m.particleClock-=dt;if(m.particleClock<=0){m.particleClock=.04;for(const b of m.projectiles)if(b.kind==='bolt')sparks(m,b.x,b.y-30,m.basicElement??'arcane',3);if(m.beam)for(let i=0;i<8;i++)sparks(m,m.beam.x+(m.beam.toX-m.beam.x)*i/8,m.beam.y+(m.beam.toY-m.beam.y)*i/8-30,'arcane',1);if(m.cast&&m.castOrigin){const a=m.cast,theta=a.elapsed*15;/* basic casts: orbiting particles in mage-spell-fx.js */}}
 for(let i=m.particles.length-1;i>=0;i--){const p=m.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;if(p.life<=0)m.particles.splice(i,1);}
}

export function tickMage(m,c,s,p,aim,props,dt){return ownStatuses(c,["burn", "shock", "shockZap", "bloodBleed", "bloodSoaked"],()=>tickMageOwned(m,c,s,p,aim,props,dt));}

export function requestMage(m,c,s,p,aim,kind,props=[]){return ownStatuses(c,["burn", "shock", "shockZap", "bloodBleed", "bloodSoaked"],()=>requestMageOwned(m,c,s,p,aim,kind,props));}
