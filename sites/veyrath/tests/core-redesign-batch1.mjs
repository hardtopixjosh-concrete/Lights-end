import assert from 'node:assert/strict';
import {makeWeapon,weaponStats,createArmory,migrateArmory,validArmory,weaponEligible,transactArmory} from '../dist/weapons.js?v=fx-210';
import {createCombat,damageEnemy,pressAttack,tickCombat} from '../dist/combat.js?v=fx-210';
import {createMage,tickMage,requestMage} from '../dist/mage.js?v=fx-210';
import {createRanger,tickRanger} from '../dist/ranger.js?v=fx-210';
import {createWarrior,handleWarriorHits} from '../dist/warrior.js?v=fx-210';
import {TALENT_NODES} from '../dist/talent-data.js?v=fx-210';
import {outputAmount,grantBarrier,refundCast} from '../dist/core-rules.js?v=fx-210';
const originalRandom=Math.random;Math.random=()=>.99;
export const foe=(x=100)=>({id:1,x,y:0,hp:1e9,maxHp:1e9,state:'alive',role:'boss',radius:20,clock:0,hurt:0,death:0});
export function item(family,level=1,quality=0){const w=makeWeapon(level,()=>.4,0,family);w.base=1;w.ceiling=30;w.quality=quality;w.affixes=[];w.affixCount=0;return w;}
const p={x:0,y:0,row:0},aim={x:150,y:0};
const arm=migrateArmory(createArmory(1234));assert(validArmory(arm));assert.deepEqual(migrateArmory(arm),arm);assert.equal(arm.gold,1234);
for(const path of ['archer','alchemist','ninja','gunslinger'])for(let n=0;n<10;n++)assert(weaponEligible(makeWeapon(8,()=>n/10,2,null,'ranger',path),'ranger',path));
assert(transactArmory(arm,'equip',arm.pathEquipped.ninja,{classId:'ranger',path:'archer'}).error);
assert(transactArmory(arm,'salvage',arm.pathEquipped.ninja,{confirmed:true}).error);
assert(Math.abs(weaponStats(item(0,30,5),30).power-1.4)<1e-10);
assert.equal(weaponStats({...item(0),ceiling:80},60).effective,60);
assert.equal(weaponStats({...item(0),ceiling:80},60,'endless').effective,60);
for(const scope of ['attack','ability','healing','barrier'])assert(outputAmount(100,weaponStats(item(5,30,5),30),scope)>outputAmount(100,weaponStats(item(5,30,0),30),scope));
assert(Math.abs(outputAmount(100,{power:2,character:3,output:{damage:.4,ability:.2}},'ability')-960)<1e-9);
assert.equal(outputAmount(100,{power:2,character:3,output:{damage:4}},'healing'),600);
assert.equal(outputAmount(100,{power:20},'ability',{basis:'preDefense'}),100);
const b={barrier:100,barrierTime:2};assert(!grantBarrier(b,60,20));assert.equal(b.barrierTime,2);assert(grantBarrier(b,120,3));
const cast={paid:20};assert.equal(refundCast(cast,100),6);assert.equal(refundCast(cast,1),0);assert.equal(refundCast({paid:0},10),0);
const fireball=[];
for(const family of [5,6]){const s={path:'pyro',classId:'mage',hp:170,maxHp:170,level:15,skills:Object.fromEntries(TALENT_NODES.filter(n=>n.path==='pyro'&&n.tier===0).map(n=>[n.id,1]))},m=createMage(s),c=createCombat();c.targets=[foe(130)];c.weapon=weaponStats(item(family),15);assert(requestMage(m,c,s,p,aim,'fireball'));let dmg=0;for(let i=0;i<90;i++)for(const e of tickMage(m,c,s,p,aim,[],1/60))if(e.type==='hit')dmg+=e.damage;fireball.push(dmg);}assert.equal(fireball[0],fireball[1]);
// Derived payloads must not reapply source power, crit, elite or reward multipliers.
{const c=createCombat(),e=foe();c.weapon={power:20,character:20,crit:1,critDamage:2.5,elite:3};c.rewardDamage=4;e.armored=true;assert.equal(damageEnemy(c,e,100,p,{basis:'preDefense'})[0].damage,50);assert.equal(damageEnemy(c,e,100,p,{basis:'final'})[0].damage,100);}
// Releasing/restarting a held beam every frame must not reset its damage cadence.
{/* Oct 19: Beam Staff (10) retired -> Freeze Gauntlets (46, cryo channel) */const s={path:'cryo',classId:'mage',hp:170,maxHp:170,level:1,skills:{}},m=createMage(s),c=createCombat();c.targets=[foe(130)];c.weapon=weaponStats(item(46),1);let hits=0;for(let i=0;i<60;i++){m.held=true;m.beam=null;hits+=tickMage(m,c,s,p,aim,[],1/60).filter(e=>e.type==='hit').length;}assert(hits<=12,'beam restart cannot mint free ticks');}
// Actual single-target resource simulation; spend every frame so the 100 cap does not hide income.
const resources=[];
for(const family of [0,1,2,3,11,13,14,16,19,20]){/* Oct 19: Bow (12) retired -> Long Bow (13) */const c=createCombat(),cls=family<12?'sword':'ranger',s={classId:cls,path:cls==='sword'?'spellblade':family===20?'gunslinger':'alchemist',skills:{},level:1,hp:250,maxHp:250,world:{}},w=cls==='sword'?createWarrior(s):null,r=cls==='ranger'?createRanger(s):null;c.targets=[foe(65)];c.weapon=weaponStats(item(family),1);c.weapon.crit=0;let resource=0,damage=0;if(w)pressAttack(c);else r.held=true;
 for(let i=0;i<1200;i++){const ev=w?tickCombat(c,p,aim,[],1/60):tickRanger(r,c,s,p,aim,[],1/60,{x:0,y:0});if(w)handleWarriorHits(w,c,s,p,ev,[]);for(const e of ev)if(e.type==='hit')damage+=e.actualDamage;resource+=w?w.rage:r.momentum;if(w)w.rage=0;else r.momentum=0;}
 assert(resource>0,'successful resource income '+family);assert(resource/20<=(cls==='sword'?12:15)+.01);resources.push({family,resourcePerSecond:+(resource/20).toFixed(2),stationaryDps:+(damage/20).toFixed(1)});
}
Math.random=originalRandom;console.log(JSON.stringify({batch:1,fireball,resources},null,2));
