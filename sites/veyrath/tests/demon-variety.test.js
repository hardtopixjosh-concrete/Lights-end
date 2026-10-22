import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEMON_SHEETS,regularDemon,specialDemon,enemyIdentity} from '../dist/demon-roster.js';
import {tickCaster,tickEnemyProjectiles} from '../dist/enemy-ranged.js';
import {createCombat} from '../dist/combat.js';
import {createSurvival,receiveHit,tickSurvival} from '../dist/survival.js';
import {createRewards,summonElite} from '../dist/rewards.js';
import {createWorldEvents,forceWorldEvent,actWorld,tickWorldEvents} from '../dist/world-events.js';
import {projectileHitsBody} from '../dist/projectile-contact.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/manifest.json',import.meta.url)));for(const key of DEMON_SHEETS){const e=manifest.sheets[key];assert(e,key);assert.equal(e.cols,15);assert([8,5].includes(e.rows),key+' rows');/* Oct 19: boss/HD proxy sheets use 5 mirrored direction rows */assert(fs.existsSync(new URL('../dist/'+e.url,import.meta.url)));}
assert.equal(regularDemon(0,[],()=>0).skin,'imp');assert.equal(regularDemon(60,[],()=>0).skin,'imp');assert.equal(regularDemon(180,[],()=>0).role,'caster');assert.notEqual(regularDemon(180,[{state:'alive',role:'caster'},{state:'alive',role:'caster'}],()=>0).role,'caster');assert.equal(regularDemon(360,[{state:'alive',role:'caster'},{state:'alive',role:'caster'}],()=>0).role,'caster');
const elite=specialDemon({role:'leader'},{elite:true}),rift=specialDemon({role:'swarmer'},{rift:true});assert.notEqual(elite.skin,rift.skin);assert(elite.scale>2.2);assert(rift.scale>1.25);assert.equal(enemyIdentity(elite).color,'#d6a0ff');assert.equal(enemyIdentity(rift).color,'#ffae55');assert(enemyIdentity(rift).bold);
let c=createCombat(),s=createSurvival(c);createRewards(s,c);c.targets=[];const p={x:1800,y:1400},e={...c.target,id:1,x:1500,y:1400,state:'alive',role:'caster',speed:54.9,shotCD:0,attackDamage:10};c.targets=[e];tickCaster(e,s,c,p,[],.01);assert(e.rangedCast);tickCaster(e,s,c,{x:1800,y:1600},[],.9);assert.equal(c.enemyProjectiles.length,1);assert.equal(c.enemyProjectiles[0].dy,0,'locked aim does not chase dodge');let events=[];for(let i=0;i<130;i++)events.push(...tickEnemyProjectiles(s,c,p,[],.02,receiveHit));assert.equal(events.filter(e=>e.type==='playerHit').length,1);assert.equal(s.hp,230);
for(const mode of ['wall','shield','parry','invulnerable']){c.enemyProjectiles=[{x:1500,y:1400,dx:1,dy:0,age:0,distance:0,attackDamage:10}];s.hp=250;s.grace=0;s.parry=mode==='parry'?1:0;s.parryAngle=Math.PI;s.forgeShield=mode==='shield'?{x:1650,y:1400,remaining:20,shieldRadius:60}:null;const props=mode==='wall'?[{x:1650,y:1400,radius:20}]:[];for(let i=0;i<130;i++)tickEnemyProjectiles(s,c,{...p,invulnerable:mode==='invulnerable'},props,.02,receiveHit);assert.equal(s.hp,250,mode);assert.equal(c.enemyProjectiles.length,0);}
s.forgeShield=null;s.parry=0;s.clock=200;s.spawnTimer=999;e.freeze=1;e.rangedCast=null;e.shotCD=0;e.hurt=0;tickSurvival(s,c,p,[],{width:850,height:650,zoom:1},.2);assert.equal(e.rangedCast,null);assert.equal(c.enemyProjectiles.length,0);
const w=createWorldEvents([],()=>.4);forceWorldEvent(w,'rift',s);const r=w.events.find(e=>e.kind==='rift');c.targets=[];assert(actWorld(w,r,s,c,r,[],'accept').ok);tickWorldEvents(w,s,c,r,[],2.1);const adds=c.targets.filter(e=>e.role!=='anchor');assert.equal(adds.length,3);assert(adds.every(e=>e.skin==='demon-rift'&&e.scale>=2));
const target={...elite,x:0,y:0};assert(projectileHitsBody({x:0,y:-100,contactRadius:6},target));assert(!projectileHitsBody({x:400,y:0,contactRadius:6},target));
console.log('Demon variety smoke passed:20 sheets, progressive roster/caster caps, distinct larger special models/colors, locked cast, damage once, terrain/dome/parry/dodge protection, freeze, actual rift waves, scaled body contact.');
await import('./pacing.test.js');
