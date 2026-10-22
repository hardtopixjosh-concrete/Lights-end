import assert from 'node:assert/strict';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,receiveHit,spawn,tickSurvival} from '../dist/survival.js';
import {WORLD} from '../dist/simulation.js';
import {createRewards,tickRewards,summonElite} from '../dist/rewards.js';
import {HARD_ENEMY_CAP} from '../dist/encounter-pacing.js';
import {enemyHealth} from '../dist/combat-balance.js';
const p={x:1800,y:1400},view={width:1200,height:720,zoom:.9};
const c=createCombat(),s=createSurvival(c);assert(c.targets[0].speed<WORLD.speed);/* Oct 19: player 166 vs swarmer 83.7 after the recorded speed cuts */
const enemy=c.targets[0];enemy.x=p.x+10;enemy.y=p.y;enemy.hp=500;enemy.maxHp=500;
{const keep=Math.random;Math.random=()=>.99;assert.equal(damageEnemy(c,enemy,45,p,{props:[]})[0].damage,45);Math.random=keep;}/* default weapon 1x now */
assert.equal(receiveHit(s,c,p,enemy,[])[0].damage,28);assert.equal(s.hp,222);assert.equal(s.grace,.12);
assert.equal(receiveHit(s,c,p,enemy,[]).length,0);s.grace=0;assert.equal(receiveHit(s,c,p,enemy,[])[0].damage,28);
p.invulnerable=true;assert.equal(receiveHit(s,c,p,enemy,[]).length,0);p.invulnerable=false;
s.spawnTimer=0;tickSurvival(s,c,p,[],view,.01);assert(s.spawnTimer>0&&s.spawnTimer<3);/* Oct 19: first-minute interval ~1.7 s (encounter-pacing + director) */
const rng=Math.random;Math.random=()=>.3;
for(let i=0;i<HARD_ENEMY_CAP+40;i++)spawn(s,c,p,[],view);assert.equal(c.targets.filter(e=>e.state==='alive').length,HARD_ENEMY_CAP);/* cap 260 since Oct 16 */
const c2=createCombat(),s2=createSurvival(c2),r=createRewards(s2,c2);s2.clock=60;const leader=summonElite(r,s2,c2,p,[],view);/* random elite timing since Oct 18 */assert.equal(leader.hp,enemyHealth('elite',s2.clock));assert(leader.scale>2);/* elite models set their own scale (Oct 18 roster) */assert.equal(leader.attackDamage,35);assert.equal(receiveHit(s2,c2,p,{...leader,x:p.x+10,y:p.y},[])[0].damage,70);
Math.random=rng;console.log('Pressure integration passed: 1x weapon damage, short hit protection, dash immunity, spawn cadence, hard cap, slower-than-player swarmers and elites.');
