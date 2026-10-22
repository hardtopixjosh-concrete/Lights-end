import {WORLD,clamp} from './simulation.js?v=fx-260';
export const ENEMY_ATTACK_SPEED=.45;
// Oct 16 (user): elites swing slower (longer wind-up and recovery).
export const ELITE_MELEE={reach:145,windup:.7,recovery:.95,recoveryJitter:.25};
export const ENEMY_SPEED={swarmer:83.7,bruiser:54.9,leader:96,boss:60};
import {ENEMY_HEALTH} from './combat-balance.js?v=fx-260';
export {enemyHealth} from './combat-balance.js?v=fx-260';
export const ENEMY_HP={...ENEMY_HEALTH,bruiser:ENEMY_HEALTH.medium,leader:ENEMY_HEALTH.elite,boss:ENEMY_HEALTH.miniboss};
// Preserve the approved close view at the 850px-high reference viewport.
export function cameraScale(setting,height){return setting*Math.max(1,height)/850;}
export function edgeSpawn(player,id,random=Math.random){
  const vertical=player.x<180||player.x>WORLD.width-180,horizontal=player.y<180||player.y>WORLD.height-180;
  if(!vertical&&!horizontal)return null;
  const angle=(id%8)*Math.PI/4+(random()-.5)*.3,radius=260+random()*100;
  // Enemies can approach across the arena boundary; it only confines the player.
  return {x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius};
}
