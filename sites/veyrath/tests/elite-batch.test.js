import assert from 'node:assert/strict';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {createSurvival,spawn,acceptEvents,receiveHit} from '../dist/survival.js';
import {ENEMY_SPEED} from '../dist/encounter-space.js';
import {createRewards,rewardEvents} from '../dist/rewards.js';
import {assignElite,tickElitePowers,wallProps} from '../dist/elite-powers.js';
import {blocked,movePlayer,WORLD} from '../dist/simulation.js';
import {createForgeShield} from '../dist/forge-shield.js';
const view={width:1152,height:850,zoom:.9};
const rng=Math.random;Math.random=()=>.5;
for(const p of [{x:35,y:35},{x:WORLD.width-35,y:35},{x:35,y:WORLD.height-35},{x:WORLD.width-35,y:WORLD.height-35}]){
 const c=createCombat(),s=createSurvival(c);c.targets=[];const points=[];
 for(let i=0;i<8;i++)points.push(spawn(s,c,p,[],view));
 assert(points.every(e=>e?.enemy&&e.emerge===.9));assert(points.some(e=>e.x<p.x));assert(points.some(e=>e.x>p.x));assert(points.some(e=>e.y<p.y));assert(points.some(e=>e.y>p.y));
 const e={x:-100,y:35,enemy:true};movePlayer(e,120,0,[]);assert.equal(e.x,20);
}
Math.random=rng;
assert(blocked(-20,35,[]));assert(!blocked(-20,35,[],13,true));
const cp=createCombat(),sp=createSurvival(cp);assert.equal(cp.targets[0].speed,ENEMY_SPEED.swarmer);const levels=[];acceptEvents(sp,cp,Array.from({length:40},()=>({type:'xpCollected',xp:18})));/* Oct 19: XP arrives via collected pickups now */assert.equal(sp.level,4);assert.equal(sp.nextXP,272);/* Oct 15 faster early leveling */
const keepRandom=Math.random;Math.random=()=>.1;/* Oct 19: pin elite aim mode to current (elites lead/offset at random since Oct 16) */
function fixture(index){const c=createCombat(),s=createSurvival(c),r=createRewards(s,c),p={x:1800,y:1400},e={...c.targets[0],id:42,role:'leader',x:1650,y:1400,hp:3000,maxHp:3000,attackDamage:35};assignElite(e,index);e.powerCD=0;c.targets=[e];return {c,s,r,p,e};}
const frost=fixture(0);tickElitePowers(frost.r,frost.s,frost.c,frost.p,[],.01);/* Oct 19: pin aim mode 'current' (elites lead/offset at random) */assert.equal(frost.r.hazards[0].kind,'frost');assert.equal(frost.s.fieldSlow,0);tickElitePowers(frost.r,frost.s,frost.c,frost.p,[],.9);assert.equal(frost.s.fieldSlow,.35);
frost.s.forgeShield=createForgeShield({...frost.p,radius:100});frost.s.forgeShield.remaining=20;tickElitePowers(frost.r,frost.s,frost.c,frost.p,[],.01);assert.equal(frost.s.fieldSlow,0);
const wall=fixture(1);tickElitePowers(wall.r,wall.s,wall.c,wall.p,[],.01);assert.equal(wallProps(wall.r).length,0);wall.p.x+=150;tickElitePowers(wall.r,wall.s,wall.c,wall.p,[],1.1);assert(wallProps(wall.r).length>=5);/* Waller: up to seven walls on an arc (log-enemies); ones that would land on blocked ground are skipped */assert(blocked(wall.r.hazards[0].x,wall.r.hazards[0].y,wallProps(wall.r)));wall.e.powerCD=1e9;/* no recast */tickElitePowers(wall.r,wall.s,wall.c,wall.p,[],5.1);assert.equal(wallProps(wall.r).length,0);
const boom=fixture(2);tickElitePowers(boom.r,boom.s,boom.c,boom.p,[],.01);assert.equal(tickElitePowers(boom.r,boom.s,boom.c,boom.p,[],1.1)[0].damage,36);assert.equal(tickElitePowers(boom.r,boom.s,boom.c,boom.p,[],.01).length,0);rewardEvents(boom.r,boom.s,damageEnemy(boom.c,boom.e,5000,boom.p,{props:[]}));assert(boom.r.hazards.some(h=>h.death));
const vampire=fixture(3);vampire.e.hp=1000;receiveHit(vampire.s,vampire.c,vampire.p,vampire.e,[]);assert.equal(vampire.e.hp,1053);
const shielded=fixture(4);tickElitePowers(shielded.r,shielded.s,shielded.c,shielded.p,[],.01);assert(shielded.e.barrier>0);assert.equal(damageEnemy(shielded.c,shielded.e,45,shielded.p,{push:0})[0].damage,Math.round(45*.8*.35));/* elite .8 x barrier .35 (combat.js) */damageEnemy(shielded.c,shielded.e,110,shielded.p,{heavy:true,push:0});assert.equal(shielded.e.barrier,0);
const rage=fixture(5);rage.e.hp=1000;tickElitePowers(rage.r,rage.s,rage.c,rage.p,[],.01);assert.equal(rage.e.rageModifier,1.2);assert.equal(rage.e.attackDamage,45);
/* Oct 19: Warding elite modifier removed from ELITE_MODIFIERS (warding now comes from the Guardian enemy) */
Math.random=keepRandom;
console.log('Elite batch passed: 360° corner arrivals across boundary, slower chase, 40 kills yield level3, Frostbound/forge protection, temporary blocking walls, explosive tells/death nova, lifesteal, breakable shield, berserker and warding.');
