import assert from 'node:assert/strict';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,tickSurvival} from '../dist/survival.js';
import {createRewards,tickRewards,summonElite} from '../dist/rewards.js';
import {ENEMY_SPEED} from '../dist/encounter-space.js';
import {enemyHealth} from '../dist/combat-balance.js';
const view={width:1200,height:720,zoom:.9};
const p={x:1800,y:1400},c=createCombat(),s=createSurvival(c),r=createRewards(s,c);
s.clock=60;const elite=summonElite(r,s,c,p,[],view);/* Oct 19: elite timing is random per run since the Oct 18 waves - summon directly */
assert.equal(elite.hp,enemyHealth('elite',s.clock));assert.equal(elite.speed,ENEMY_SPEED.leader);/* Oct 19: HP scales with the clock; speeds from data */
elite.swing={elapsed:0};
assert.equal(damageEnemy(c,elite,45,p,{props:[],push:0})[0].damage,45*.8);/* Oct 19: elites take 80% (combat.js resistance) */
assert(elite.swing);assert(elite.hurt<=.08);
assert.equal(damageEnemy(c,elite,110,p,{props:[],push:0,heavy:true})[0].damage,110*.8);
assert.equal(elite.swing,null);
elite.swing={elapsed:0};damageEnemy(c,elite,40,p,{props:[],push:0,counter:true});assert.equal(elite.swing,null);
function encounter(){
 const p={x:1800,y:1400},c=createCombat(),s=createSurvival(c),e=c.targets[0];
 s.spawnTimer=100;e.x=p.x-50;e.y=p.y;e.hurt=0;e.swing={elapsed:0,windup:.45,reach:46,angle:0,fired:false};
 return {p,c,s,e};
}
const chase=encounter();let hits=0;
for(let i=0;i<35;i++){
 chase.p.x+=220*.02;
 hits+=tickSurvival(chase.s,chase.c,chase.p,[],view,.02).filter(e=>e.type==='playerHit').length;
}
assert.equal(hits,0);assert.equal(chase.s.hp,250);assert(chase.e.x>1750);
const dodge=encounter();
for(let i=0;i<16;i++)tickSurvival(dodge.s,dodge.c,dodge.p,[],view,.02);
const committed=dodge.e.swing.angle;dodge.p.y+=100;
for(let i=0;i<8;i++)tickSurvival(dodge.s,dodge.c,dodge.p,[],view,.02);
assert.equal(dodge.e.swing.angle,committed);assert.equal(dodge.s.hp,250);
const immune=encounter();immune.p.invulnerable=true;
for(let i=0;i<24;i++)tickSurvival(immune.s,immune.c,immune.p,[],view,.02);
assert.equal(immune.s.hp,250);
console.log('Chase integration passed: durable elites, deliberate interrupts, slower moving strikes allow a fleeing player to escape, committed direction remains dodgeable, dash immunity retained.');
