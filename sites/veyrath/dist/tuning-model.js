import {ENEMY_SPEED,ELITE_MELEE} from './encounter-space.js?v=fx-260';
import {PRESSURE_TUNING} from './encounter-pacing.js?v=fx-260';
import {BASIC_ATTACKS} from './combat-balance.js?v=fx-260';
export const TUNING_BOUNDS={swarmer:[20,160],bruiser:[20,140],leader:[30,180],boss:[15,100],eliteReach:[70,220],eliteWindup:[.25,1.2],eliteRecovery:[.25,1.5],spawnRate:[.25,2],population:[.25,2],swordDamage:[10,500],orbDamage:[10,500]};
export function readTuning(){return {...ENEMY_SPEED,eliteReach:ELITE_MELEE.reach,eliteWindup:ELITE_MELEE.windup,eliteRecovery:ELITE_MELEE.recovery,spawnRate:PRESSURE_TUNING.rate,population:PRESSURE_TUNING.population,swordDamage:BASIC_ATTACKS.sword.damage,orbDamage:BASIC_ATTACKS.orb.damage};}
export function validateTuning(value){if(!value||value.schema!==1||!value.values||typeof value.values!=='object')throw Error('Expected VEYRATH tuning schema 1');const next={};for(const [key,[min,max]] of Object.entries(TUNING_BOUNDS)){const n=value.values[key];if(!Number.isFinite(n)||n<min||n>max)throw Error('Invalid '+key+' ('+min+'–'+max+')');next[key]=n;}return next;}
export function applyTuning(value,targets=[]){const next=validateTuning({schema:1,values:value});for(const key of ['swarmer','bruiser','leader','boss'])ENEMY_SPEED[key]=next[key];Object.assign(ELITE_MELEE,{reach:next.eliteReach,windup:next.eliteWindup,recovery:next.eliteRecovery});Object.assign(PRESSURE_TUNING,{rate:next.spawnRate,population:next.population});BASIC_ATTACKS.sword.damage=next.swordDamage;BASIC_ATTACKS.orb.damage=next.orbDamage;
 for(const e of targets){const speed=ENEMY_SPEED[e.role];if(e.state==='alive'&&speed!==undefined){const multiplier=e.worldBaseSpeed?e.speed/e.worldBaseSpeed:1;e.worldBaseSpeed=speed;e.speed=speed*multiplier;}}
 return next;
}
