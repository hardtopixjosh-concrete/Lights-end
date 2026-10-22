// Oct 19: trimmed to the combat rules that still hold after the Oct 18 core redesign. The old Oct 15 time-to-kill
// snapshot (per-family hit counts, retired families 4/7-10, discovery-ceiling caps, tiered spawns, timed mini-boss HP)
// was removed; per-path DPS is now checked by tests/balance-report.mjs (balance band).
import assert from 'node:assert/strict';
import {ENEMY_HEALTH,enemyHealth} from '../dist/combat-balance.js';
import {createCombat,damageEnemy} from '../dist/combat.js';
import {makeWeapon,weaponStats} from '../dist/weapons.js';
const p={x:1800,y:1400};
assert.deepEqual(ENEMY_HEALTH,{swarmer:400,standard:650,medium:1000,heavy:2000,elite:4500,miniboss:15000});
for(const [tier,hp] of Object.entries(ENEMY_HEALTH)){assert.equal(enemyHealth(tier,0),hp);assert(enemyHealth(tier,1800)>enemyHealth(tier,600)&&enemyHealth(tier,600)>hp,tier+' HP grows with the run clock');}
// 5% crits for 1.75x on a plain weapon.
const original=Math.random;
try{
 const c=createCombat();c.weapon=weaponStats({...makeWeapon(1,()=>.4,0,0),base:1,quality:0,affixes:[],affixCount:0},1);assert.equal(c.weapon.crit,.05);assert.equal(c.weapon.critDamage,1.75);
 const e=()=>({...c.target,hp:1e4,maxHp:1e4,emerge:0,state:'alive'});
 Math.random=()=>.049;assert.equal(damageEnemy(c,e(),100,p,{basic:true,push:0})[0].damage,175);
 Math.random=()=>.05;assert.equal(damageEnemy(c,e(),100,p,{basic:true,push:0})[0].damage,100);
}finally{Math.random=original;}
// Drop rarity odds (stratified); red never drops from ordinary loot (Oct 18: red only from the final/realm boss).
const counts=Array(6).fill(0);for(let i=0;i<10000;i++)counts[makeWeapon(1,()=>(i+.5)/10000,null,0).rarity]++;
assert.deepEqual(counts,[5500,3000,1375,100,25,0]);
console.log('Combat balance rules passed: enemy HP table + clock growth, 5%/1.75x crits, drop rarity odds without red.');
