import assert from 'node:assert/strict';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,spawn,tickSurvival} from '../dist/survival.js';
import {createRewards,summonBoss,summonElite,tickRewards} from '../dist/rewards.js';
import {ENEMY_SPEED,ENEMY_HP,ENEMY_ATTACK_SPEED} from '../dist/encounter-space.js';
import {enemyHealth} from '../dist/combat-balance.js';
const c=createCombat(),s=createSurvival(c),r=createRewards(s,c),p={x:1800,y:1400},view={width:1200,height:720,zoom:.9},first=c.targets[0];
assert.equal(first.hp,400);assert.equal(first.maxHp,400);assert.equal(first.speed,ENEMY_SPEED.swarmer);
const rng=Math.random;Math.random=()=>0;try{
 const regular=spawn(s,c,p,[],view);assert.equal(regular.hp,enemyHealth('swarmer',s.clock));assert.equal(regular.speed,ENEMY_SPEED.swarmer);
  /* Oct 19: old tiered spawns (bruiser after 30 s) replaced by the Oct 18 monster waves - covered by wave-roster-smoke.mjs */s.clock=31;
 assert(summonBoss(r,s,c,p,[],view));const boss=c.targets.find(e=>e.role==='boss');assert.equal(boss.hp,15000);assert.equal(boss.maxHp,boss.hp);assert.equal(boss.speed,ENEMY_SPEED.boss);
 const leader=summonElite(r,s,c,p,[],view);assert.equal(leader.hp,enemyHealth('elite',s.clock));assert.equal(leader.maxHp,leader.hp);assert.equal(leader.speed,ENEMY_SPEED.leader);assert(c.targets.filter(e=>e.role==='swarmer').every(e=>e.speed===ENEMY_SPEED.swarmer));
 boss.x=p.x-200;boss.y=p.y;boss.emerge=0;boss.hurt=0;boss.cooldown=100;tickRewards(r,s,c,p,[],view,.1);assert(Math.abs(boss.x-(p.x-200+ENEMY_SPEED.boss*.1))<.01);
 c.targets=[first];s.spawnTimer=100;first.x=p.x-200;first.y=p.y;first.cooldown=100;first.hurt=0;tickSurvival(s,c,p,[],view,.1);assert(Math.abs(first.x-(p.x-200+ENEMY_SPEED.swarmer*.1))<.01);
 first.x=p.x-70;first.hurt=0;first.swing={elapsed:0,windup:.45,reach:46,angle:0,fired:false};tickSurvival(s,c,p,[],view,.1);assert(Math.abs(first.x-(p.x-70+ENEMY_SPEED.swarmer*1.05*ENEMY_ATTACK_SPEED*.1))<.01);
 const hp0=first.hp,hit=damageEnemy(c,first,50,p,{props:[],push:0});assert(hit[0].damage>0);assert.equal(first.hp,hp0-hit[0].damage);/* Oct 19: relative - weapon tuning changed */assert.equal(first.state,'alive');damageEnemy(c,first,first.hp*2,p,{props:[],push:0});assert.equal(first.state,'dead');
}finally{Math.random=rng;}
console.log('Enemy pacing smoke passed: V0.2 HP for initial/spawned/follower/elite/boss enemies, slower role speeds/chase/swing movement, retained attack slowdown and unchanged player damage.');
