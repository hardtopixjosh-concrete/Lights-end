// Oct 18 (user): builds wave enemies from wave-roster.js data and runs the extra tank behaviour (Sand Behemoth pound).
// Ranged shot kinds live in enemy-ranged.js, charge/pounce params in enemy-roles.js tickCharger, combos/frenzy in survival.js.
import {WAVE_TYPES,typeOf,waveCategory} from './wave-roster.js?v=fx-260';
import {applyRole} from './enemy-roles.js?v=fx-260';
import {ENEMY_SPEED,enemyHealth} from './encounter-space.js?v=fx-260';
const STATS=['scale','speed','xp','attackDamage','radius','bodyHalfWidth','bodyHeight','windup','recover','combo','comboWindup','reach','frenzy','pound','mech','shot','swingTail'];
export function aliveByCategory(targets){const n={};for(const e of targets)if(e.state==='alive'&&e.waveCat)n[e.waveCat]=(n[e.waveCat]??0)+1;return n;}
export function pickWaveType(s,targets,rng=Math.random){const cat=waveCategory(s.clock,aliveByCategory(targets),rng);return {cat,type:typeOf(cat,s.roster?.[cat]??WAVE_TYPES[cat][0].id)};}
export function makeWaveEnemy(s,cat,type,x,y,base={}){
 const e={...base,id:++s.id,enemy:true,x,y,radius:12,row:2,clock:Math.random(),hurt:0,hurtDuration:.24,death:0,state:'alive',role:'swarmer',speed:ENEMY_SPEED.swarmer,xp:18,scale:1.25,age:0,enraged:false,swing:null,cooldown:.35+Math.random()*.4,moving:false,
  skin:type.skin,enemyName:type.name,bodyHalfWidth:20,bodyHeight:70,waveCat:cat,waveType:type.id};
 let tier=type.hp??'standard';
 if(cat==='imp')tier=Math.random()<.35?'swarmer':'standard';
 else if(cat==='ranged')Object.assign(e,{role:'caster',speed:54.9,shotCD:2.2,bodyHalfWidth:22,bodyHeight:65});
 else if(type.base==='guardian'||type.base==='charger'){applyRole(e,type.base,s.clock);Object.assign(e,{skin:type.skin,enemyName:type.name,tint:null});}
 else if(type.base==='bruiser')Object.assign(e,{role:'bruiser',speed:ENEMY_SPEED.bruiser,xp:40,scale:1.65});
 for(const k of STATS)if(type[k]!==undefined)e[k]=type[k];
 if(type.charge)e.chargeCfg=type.charge;
 if(cat==='speed')e.swingTail??=.15;
 e.hpTier=tier;e.hp=e.maxHp=Math.round(enemyHealth(tier,s.clock)*(type.hpMul??1)*(s.endlessRamp??1));
 return e;
}
// Sand Behemoth: plants its feet and slams the ground; the elite explosion hazard draws the warning ring and hits every player.
export function tickPound(e,s,p,dt){
 const P=e.pound;e.poundCD=Math.max(0,(e.poundCD??1.5)-dt);
 if(e.poundT!=null){e.poundT+=dt;e.moving=false;if(e.poundT>=P.warning+.35){e.poundT=null;e.poundCD=P.cd;}return true;}
 if(e.poundCD===0&&s.hazards&&Math.hypot(p.x-e.x,(p.y-e.y)/.65)<P.range){
  s.hazards.push({kind:'explosion',x:e.x,y:e.y,radius:P.radius,age:0,warning:P.warning,duration:.4,owner:e.id,death:false,fired:false,damage:P.damage});
  e.poundT=0;e.swing=null;e.moving=false;return true;}
 return false;
}
