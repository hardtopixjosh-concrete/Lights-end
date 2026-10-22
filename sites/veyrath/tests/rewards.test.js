import assert from 'node:assert/strict';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,receiveHit,areaHits} from '../dist/survival.js';
import {createRewards,rewardEvents,tickRewards,buySkill,summonBoss} from '../dist/rewards.js';
const p={x:1800,y:1400},view={width:1200,height:720,zoom:.9};
const c=createCombat(),s=createSurvival(c),r=createRewards(s,c,10);
const rng=Math.random;Math.random=()=>.3;
assert(summonBoss(r,s,c,p,[],view));assert(!summonBoss(r,s,c,p,[],view));
const b=c.targets.find(e=>e.role==='boss');assert(Math.hypot(b.x-p.x,b.y-p.y)>600);
b.x=p.x+49;b.y=p.y;b.cooldown=10;tickRewards(r,s,c,p,[],view,.1);assert(Math.hypot(b.x-p.x,b.y-p.y)>=48,'boss preserves body spacing');
b.x=p.x+90;b.y=p.y;b.cooldown=0;tickRewards(r,s,c,p,[],view,.01);assert.equal(b.swing.kind,'sweep');
for(let i=0;i<43&&b.swing;i++){s.parry=.28;s.parryAngle=0;tickRewards(r,s,c,p,[],view,.02);}/* Oct 19: hold the parry window through the longer wind-up */assert.equal(s.hp,250);assert(!b.swing,'parry interrupts sweep');
b.cooldown=0;tickRewards(r,s,c,p,[],view,.01);assert.equal(b.swing.kind,'smash');s.parry=.28;s.parryAngle=0;s.grace=0;
for(let i=0;i<56;i++){s.parry=.28;s.parryAngle=0;tickRewards(r,s,c,p,[],view,.02);}assert.equal(s.hp,140,'smash bypasses parry');
/* Oct 19: removed mini-boss coin drop and skill-point buys (replaced by boss blessings Oct 18 and spell leveling Oct 15) */
const target={x:p.x+30,y:p.y,hp:200,maxHp:200,radius:12,state:'alive'};c.targets=[target];
s.clock=60;r.eliteAt=60;tickRewards(r,s,c,p,[],view,.01);assert(c.targets.some(e=>e.role==='leader'));assert(c.targets.filter(e=>e.role==='swarmer').length>=3);
const r2=createRewards(createSurvival(createCombat()),createCombat(),r.gold);assert.equal(r2.gold,r.gold);assert.equal(r2.runGold,0);
Math.random=rng;console.log('Rewards integration passed: boss telegraphs/parry/smash, elite pack and carried gold.');
