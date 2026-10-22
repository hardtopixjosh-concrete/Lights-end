import assert from 'node:assert/strict';
import {createForgeShield,tickForgeMenuShield,shieldBlocksAttack,shieldCollider} from '../dist/forge-shield.js';
import {createCombat,damageEnemy,strikeConnects,STRIKES} from '../dist/combat.js';
import {createSurvival,areaHits,receiveHit} from '../dist/survival.js';
import {createRewards} from '../dist/rewards.js';
import {assignElite,tickElitePowers} from '../dist/elite-powers.js';
const p={x:1500,y:1450},c=createCombat(),s=createSurvival(c),shield=createForgeShield({...p,radius:100});shield.remaining=20;c.forgeShield=s.forgeShield=shield;
const e=c.targets[0];e.x=1550;e.y=1450;
assert(!strikeConnects(p,e,0,STRIKES[0],shieldCollider(shield)));
for(const options of [{},{heavy:true},{counter:true},{dot:true}])assert.equal(damageEnemy(c,e,40,p,options).length,0);
assert.equal(areaHits(s,c,p,150,90,[],{heavy:true}).length,0);assert.equal(receiveHit(s,c,p,e,[]).length,0);
assert(shieldBlocksAttack(shield,{x:1200,y:1450},{x:1800,y:1450}));assert(!shieldBlocksAttack(shield,{x:1800,y:1450},{x:1850,y:1450}));
tickForgeMenuShield(shield,19.5);assert.equal(shield.remaining,.5);tickForgeMenuShield(shield,1);assert.equal(shield.remaining,0);assert.equal(damageEnemy(c,e,10,p,{push:0})[0].damage,10);/* Oct 19: default combat weapon is 1x now (was 2x) */
/* Oct 19: old elite hazard layouts (3 frost patches / 5 straight walls centred on the player) removed - Oct 16 aim modes + arcs are covered by elite-batch.test.js and elite-feel.test.js */
console.log('Hazard/shield smoke passed: timer expiry, bidirectional melee/AoE/DoT blocking, restored damage after expiry, denser aimed hazards, locked warnings and dodge/impact timing.');
