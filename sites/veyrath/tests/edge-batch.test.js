import assert from 'node:assert/strict';
import {cameraScale,ENEMY_ATTACK_SPEED,ENEMY_SPEED} from '../dist/encounter-space.js';
import {WORLD} from '../dist/simulation.js';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,spawn,tickSurvival} from '../dist/survival.js';
import {createForgeShield,tickForgeShield,shieldCollider,shieldContains} from '../dist/forge-shield.js';
import {FORGE} from '../dist/weapons.js';
const view={width:1152,height:850,zoom:.9};
for(const height of [650,850,1080,1440])assert.equal(Math.round(height/cameraScale(.9,height)),Math.round(850/.9));
const originalRandom=Math.random;Math.random=()=>.5;
for(const p of [{x:35,y:35},{x:WORLD.width-35,y:35},{x:35,y:WORLD.height-35},{x:WORLD.width-35,y:WORLD.height-35}]){
 const c=createCombat(),s=createSurvival(c);c.targets=[];const spawned=[];
 for(let i=0;i<6;i++)spawned.push(spawn(s,c,p,[],view));
 assert(spawned.every(e=>e&&e.emerge===.9&&Math.hypot(e.x-p.x,e.y-p.y)>=210));
 assert(spawned.some(e=>Math.abs(e.x-p.x)<100));assert(spawned.some(e=>Math.abs(e.y-p.y)<100));
 const e=spawned[0];assert.equal(damageEnemy(c,e,100,p,{props:[]}).length,0);
}
Math.random=originalRandom;
const c=createCombat(),s=createSurvival(c),p={x:FORGE.x+50,y:FORGE.y},shield=createForgeShield(FORGE),e=c.targets[0];s.forgeShield=shield;s.spawnTimer=100;e.x=FORGE.x;e.y=FORGE.y;e.hurt=0;
tickForgeShield(shield,p,c.targets,[],0);
for(let i=0;i<200;i++){const x=e.x,y=e.y;tickForgeShield(shield,p,c.targets,[],.02);tickSurvival(s,c,p,shieldCollider(shield),view,.02);assert(Math.hypot(e.x-x,e.y-y)<=5);assert(!shieldContains(shield,e));}
assert.equal(s.hp,250);
const c2=createCombat(),s2=createSurvival(c2),p2={x:1800,y:1400},e2=c2.targets[0];s2.spawnTimer=100;e2.x=1700;e2.y=1400;e2.hurt=0;e2.swing={elapsed:0,windup:.45,reach:46,angle:0,fired:false};tickSurvival(s2,c2,p2,[],view,.02);
assert(Math.abs(e2.x-1700-ENEMY_SPEED.swarmer*1.05*ENEMY_ATTACK_SPEED*.02)<.001);/* speed from data */
console.log('Edge batch smoke passed: equal vertical camera framing, two-edge corner pressure with safe emergence, smooth shield boundary, 12% attack movement reduction.');
