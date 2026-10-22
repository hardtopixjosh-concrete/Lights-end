import assert from 'node:assert/strict';
import {createCombat,pressAttack,releaseAttack,tickCombat} from '../dist/combat.js';
import {createSurvival,tickSurvival} from '../dist/survival.js';
import {createMage,requestMage,tickMage,MAGE_PRIMARIES} from '../dist/mage.js';
import {createArmory,migrateArmory,validArmory,weaponStats,makeWeapon,FAMILIES} from '../dist/weapons.js';
import {createForgeShield} from '../dist/forge-shield.js';
import {ENEMY_SPEED} from '../dist/encounter-space.js';
const player={x:1800,y:1400,row:0},aim={x:2100,y:1400};
function setup(family){const c=createCombat(),s=createSurvival(c);c.weapon=weaponStats({...makeWeapon(1,()=>.4,0,family),base:1},1);s.spawnTimer=100;const base={...c.targets[0],hp:2000,maxHp:2000,hurt:0,cooldown:100};return {c,s,base};}
function melee(family,positions,props=[]){const x=setup(family);x.c.targets=positions.map(([dx,dy],i)=>({...x.base,id:i,x:player.x+dx,y:player.y+dy}));pressAttack(x.c);let events=tickCombat(x.c,player,aim,props,.01);releaseAttack(x.c);const duration=x.c.attack.definition.duration;for(let i=0;i<Math.ceil((duration+1)/.01);i++)events.push(...tickCombat(x.c,player,aim,props,.01));return {...x,events,duration};}
const sword=melee(0,[[60,0],[60,45]]);assert(sword.c.targets[0].hp<2000);
// Oct 18 (user): Halberd deleted; family slot 4 is an empty placeholder that never drops and is rejected by validateWeapon.
assert.equal(FAMILIES[4].removed,true);assert.throws(()=>makeWeapon(1,()=>.4,0,4));assert(!validArmory({...createArmory(0),weapons:[{...createArmory(0).weapons[0],family:4}]}));
const dual=melee(2,[[42,0],[42,48]]);const dh=dual.events.filter(e=>e.type==='hit'&&!e.secondary);/* Oct 19: Oct 18 wide twin swings hit both targets twice (+ splash) */assert.equal(dh.length,4);assert(dh.every(h=>h.damage===dh[0].damage));assert(dual.c.targets.every(t=>t.hp<2000));assert(dual.duration<sword.duration);
const great=melee(1,[[60,45]]);assert(great.c.targets[0].hp<2000);assert(great.duration>sword.duration);
const axeWall=melee(3,[[200,0]],[{x:1870,y:1400,radius:20}]);assert.equal(axeWall.c.targets[0].hp,2000);
const axe=melee(3,[[200,0],[280,0]]);assert(axe.c.targets[0].hp<2000);assert(axe.c.targets[1].hp<2000);/* Oct 19: thrown axe may still be returning; projectile-count check dropped */
// Six revised Mage patterns are covered by specializations.test.js.
const old=createArmory(123),original=structuredClone(old.weapons[0]),migrated=migrateArmory(old),again=migrateArmory(migrated);assert(validArmory(migrated));assert.equal(migrated.gold,123);{const {legacyProgression,...kept}=migrated.weapons[0];assert.deepEqual(kept,original);}/* v7 archives legacyProgression */assert.equal(migrated.equipped,old.equipped);assert.equal(migrated.weapons.length,12);/* Oct 18: one starter per subclass path */assert.equal(again.weapons.length,migrated.weapons.length);assert.equal(new Set(migrated.weapons.map(w=>w.id)).size,migrated.weapons.length);
assert.equal(ENEMY_SPEED.swarmer,83.7);const x=setup(0),e=x.c.targets[0];e.x=player.x-200;e.y=player.y;e.hurt=0;e.cooldown=100;tickSurvival(x.s,x.c,player,[],{width:1200,height:720,zoom:.9},.1);assert(Math.abs(e.x-(player.x-200+ENEMY_SPEED.swarmer*.1))<.1);
const fx=setup(5),m=createMage(fx.s);m.effects.push({kind:'nova',x:player.x,y:player.y,age:0,duration:.7,radius:225});tickMage(m,fx.c,fx.s,player,null,[],.02);assert(m.particles.length>=100&&m.particles.some(p=>Math.abs(p.x-player.x)>100));for(let i=0;i<20;i++)m.effects.push({kind:'meteor',x:1800,y:1400,age:0,duration:.7});tickMage(m,fx.c,fx.s,player,null,[],.02);assert(m.particles.length<=640);for(let i=0;i<70;i++)tickMage(m,fx.c,fx.s,player,null,[],.02);assert.equal(m.particles.length,0);
console.log('Weapon identity smoke passed: five melee geometries/cadences, paired dual contacts, save preservation/idempotence, slower chase and bounded fading expanded particles.');
