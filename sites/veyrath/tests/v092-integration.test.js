import {stopDrain} from '../dist/blood-mage.js';
import {createWarrior,handleWarriorHits} from '../dist/warrior.js';
import assert from 'node:assert/strict';
import {createCombat,pressAttack,tickCombat,STRIKES} from '../dist/combat.js';
import {createSurvival,acceptEvents,receiveHit} from '../dist/survival.js';
import {createRewards} from '../dist/rewards.js';
import {createMage,requestMage,queueMageSpell,tickMage,blinkMage} from '../dist/mage.js';
import {createGroundXP,dropGroundXP,tickGroundXP,XP_PER_KILL} from '../dist/ground-xp.js';
import {createBossChoices,queueBossChoices,bossOptions,claimBossChoice,tickBossBuff,miniBossHealth} from '../dist/boss-choices.js';
import {mapPoint,createMinimap,drawMinimap} from '../dist/minimap.js';
import {makeWeapon,weaponStats,FAMILIES} from '../dist/weapons.js';
import {TALENT_NODES} from '../dist/talent-data.js';
const p={x:1800,y:1400,row:0},aim={x:2100,y:1370};
function setup(){const c=createCombat(),s=createSurvival(c);createRewards(s,c);s.classId='mage';s.path='blood';s.skills=Object.fromEntries(TALENT_NODES.filter(n=>n.path==='blood'&&n.tier===0).map(n=>[n.id,1]));/* Oct 19: spells unlock by leveling */const m=createMage(s);s.hp=50;c.weapon=weaponStats({...makeWeapon(1,()=>0,0,50)/* Oct 19: Orb (8) retired -> Blood Orb (50) */,base:1,affixes:[],quality:0,ceiling:1},1);c.targets=[{...c.targets[0],id:1,x:p.x+150,y:p.y,hp:10000,maxHp:10000,emerge:0,hurt:0}];return {c,s,m};}
const original=Math.random;Math.random=()=>.99;
// Oct 19: trimmed - six-family reach table (incl. removed Halberd), old Spellblade overload and talent-point boss choices (blessings since Oct 18) removed.
try{
 // Exact ground XP totals: no XP from kill until collecting, pooled and bounded.
 const c=createCombat(),s=createSurvival(c),g=createGroundXP(),deaths=Array.from({length:10},(_,id)=>({type:'death',id,x:500,y:500,xp:18}));
 acceptEvents(s,c,deaths);assert.equal(s.xp,0);dropGroundXP(g,deaths);dropGroundXP(g,deaths);assert.equal(g.value,10*Math.round(18*XP_PER_KILL));/* Oct 19: XP_PER_KILL scaling; duplicates ignored */assert.equal(g.items.length,10);/* one pickup per kill; merging only at the cap */
 assert.equal(tickGroundXP(g,p,.1).length,0);const collected=tickGroundXP(g,{x:500,y:500},.1);acceptEvents(s,c,collected);assert.equal(collected.reduce((n,e)=>n+(e.xp??0),0),10*Math.round(18*XP_PER_KILL));assert(s.xp>0||s.level>1);/* Oct 19: XP_PER_KILL .5 - 10 kills no longer level up */assert.equal(g.value,0);assert.equal(g.items.length,0);
 const dense=Array.from({length:3000},(_,id)=>({type:'death',id:id+20,x:(id%80)*70,y:Math.floor(id/80)*70,xp:7}));dropGroundXP(g,dense);const denseValue=3000*Math.max(1,Math.round(7*XP_PER_KILL));assert(g.items.length<=600);/* ground XP cap 600 */assert.equal(g.value,denseValue);assert.equal(g.items.reduce((n,a)=>n+a.value,0),denseValue);
 const magnet=createGroundXP();dropGroundXP(magnet,[{type:'death',id:1,x:p.x+100,y:p.y,xp:21}]);let xp=0;for(let i=0;i<100;i++)xp+=tickGroundXP(magnet,p,.02).reduce((n,e)=>n+e.xp,0);assert.equal(xp,Math.round(21*XP_PER_KILL));
 // Base Drain: four actual damage ticks, 96 capped healing, one energy payment.
 const a=setup();assert(requestMage(a.m,a.c,a.s,p,aim,'fireball'));assert.equal(a.m.energy.value,75);let events=[];for(let i=0;i<200;i++)events.push(...tickMage(a.m,a.c,a.s,p,aim,[],.01));assert.equal(events.filter(e=>e.type==='hit').length,4);assert.equal(a.c.targets[0].hp,9520);assert(a.s.hp>50&&a.s.hp-50<=96);/* Oct 18 core: self-heal per-second budget (boundedHeal) caps drain healing */assert.equal(a.m.drain,null);assert(Math.abs(a.m.energy.value-87)<.01);/* cost 25, then 2 s at the base 6/s regen (Oct 15) */
 for(const mode of ['empty','invulnerable','wall']){const a=setup();if(mode==='empty')a.c.targets=[];if(mode==='invulnerable')a.c.targets[0].invulnerable=1;const props=mode==='wall'?[{x:p.x+75,y:p.y,radius:25}]:[];assert(requestMage(a.m,a.c,a.s,p,aim,'chain',props));for(let i=0;i<210;i++)tickMage(a.m,a.c,a.s,p,aim,props,.01);assert.equal(a.s.hp,50,mode+' cannot heal');}
 const interrupted=setup();requestMage(interrupted.m,interrupted.c,interrupted.s,p,aim,'fireball');tickMage(interrupted.m,interrupted.c,interrupted.s,p,aim,[],.5);const hpMid=interrupted.s.hp;assert(hpMid>50);/* heal budget-capped (Oct 18) */tickMage(interrupted.m,interrupted.c,interrupted.s,p,aim,[{x:p.x+75,y:p.y,radius:25}],.01);assert.equal(interrupted.m.drain,null);assert.equal(interrupted.s.hp,hpMid);
 const release=setup();requestMage(release.m,release.c,release.s,p,aim,'fireball');release.m.drainHeld=false;tickMage(release.m,release.c,release.s,p,aim,[],.1);assert.equal(release.m.drain,null);assert.equal(release.s.hp,50);
 const queued=setup();requestMage(queued.m,queued.c,queued.s,p,aim,'chain');assert(queueMageSpell(queued.m,queued.c,queued.s,p,aim,'fireball'));assert(queued.m.pending.bloodChannel);stopDrain(queued.m);for(let i=0;i<80;i++)tickMage(queued.m,queued.c,queued.s,p,aim,[],.01);assert.equal(queued.m.drain??null,null);assert.equal(queued.m.pending,null);assert.equal(queued.s.hp,50);
 const blink=setup();requestMage(blink.m,blink.c,blink.s,p,aim,'fireball');assert(blinkMage(blink.m,blink.c,blink.s,{...p},{x:-1,y:0},[]));assert.equal(blink.m.drain,null);
 const torrent=setup();torrent.s.skills={...torrent.s.skills,crimsonTorrent:1,bloodFeast:1};torrent.c.targets[0].bloodBleed={remaining:4,pulse:99,damage:20};torrent.c.targets.push({...torrent.c.targets[0],id:2,x:p.x+210,hp:10000});torrent.s.maxHp=1000;requestMage(torrent.m,torrent.c,torrent.s,p,aim,'fireball');for(let i=0;i<200;i++)tickMage(torrent.m,torrent.c,torrent.s,p,aim,[],.01);assert(torrent.s.hp-50<=180.001); /* Oct 15: blood-marked (bleeding) targets raise the drain heal cap x1.5 */assert(torrent.c.targets[1].hp<10000);
 const overkill=setup();overkill.c.targets[0].hp=10;requestMage(overkill.m,overkill.c,overkill.s,p,aim,'fireball');tickMage(overkill.m,overkill.c,overkill.s,p,aim,[],.5);assert.equal(overkill.s.hp,52,'overkill heals on actual HP removed only');
 // Oct 15: Blood RMB/E swapped; E is now Crimson Bloom (cursor AoE 220 + bleed, heals 4 per enemy hit).
 const bloom=setup();bloom.c.targets=Array.from({length:3},(_,i)=>({...bloom.c.targets[0],id:i+1,x:aim.x-30+i*30,y:aim.y,hp:1000}));assert(requestMage(bloom.m,bloom.c,bloom.s,p,aim,'chain'));for(let i=0;i<60;i++)tickMage(bloom.m,bloom.c,bloom.s,p,aim,[],.01);assert(bloom.c.targets.every(e=>e.hp===780));assert(bloom.c.targets.every(e=>e.bloodBleed));assert(bloom.s.hp>50&&bloom.s.hp<=62);/* 4 per hit, within the per-second heal budget */
 const veil=setup();assert(requestMage(veil.m,veil.c,veil.s,p,aim,'nova'));assert.equal(veil.s.barrier,50);assert.equal(veil.s.hp,50);
 const eclipse=setup();requestMage(eclipse.m,eclipse.c,eclipse.s,p,{x:p.x+150,y:p.y},'meteor');for(let i=0;i<560;i++)tickMage(eclipse.m,eclipse.c,eclipse.s,p,aim,[],.01);// Oct 15: soaked enemies also take blood-trail damage, so the eclipse total is now at least 500.
assert(eclipse.c.targets[0].hp<=9500&&eclipse.c.targets[0].hp>=9300);assert(eclipse.m.bloodTrail?.length>0);assert.equal(eclipse.s.hp,50);
 // World and minimap axes/ground pivots agree, revealed transient icons expire.
 {const mid=mapPoint(p,p),q=mapPoint({x:p.x+100,y:p.y-100},p);assert(q.x>mid.x&&q.y<mid.y);}/* Oct 19: minimap size 196 - compare to its centre */
 const texts=[],ctx=new Proxy({fillText:(x)=>texts.push(x)}, {get:(a,k)=>k in a?a[k]:()=>({addColorStop(){}}),/* gradients */set:(a,k,v)=>(a[k]=v,true)}),canvas={width:174,getContext:()=>ctx},map=createMinimap();drawMinimap(canvas,map,p,[],[],{x:1500,y:1450},.2,[{key:'m',kind:'merchant',x:p.x,y:p.y}]);assert(texts.includes('$'));assert(map.forge);texts.length=0;drawMinimap(canvas,map,p,[],[],{x:1500,y:1450},.2,[{key:'m',kind:'merchant',active:false,x:p.x,y:p.y}]);assert(!texts.includes('$'));
}finally{Math.random=original;}
console.log('V0.9.2 integration passed: ground XP, Blood kit/channel safeguards and minimap alignment/expired markers.');
