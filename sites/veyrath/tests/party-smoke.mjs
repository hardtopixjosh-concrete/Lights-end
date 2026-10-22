// Oct 17 multiplayer Phase 1 smoke: enemies pick their own target, bots fight, downed/revive works, the run ends only when everyone is down.
import assert from 'node:assert';
import {readFileSync} from 'node:fs';
/* Oct 19: use the live cache tag so party.js is the same instance survival.js etc. import (old tags are separate copies) */const V='?v='+readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=([^"']+)/)[1];
const {party,PARTY,setLocal,clearAllies,addBot,tickParty,targetFor,nextBossTarget}=await import('../dist/party.js'+V);
const {createCombat}=await import('../dist/combat.js'+V);
const {createSurvival,tickSurvival,receiveHit}=await import('../dist/survival.js'+V);
const {tickElitePowers}=await import('../dist/elite-powers.js'+V);
const {tickBosses}=await import('../dist/bosses.js'+V);
const c=createCombat(),s=createSurvival(c);s.noSpawn=true;s.maxHp=s.hp=200;
const local={x:1000,y:1000,row:2,frame:0,moving:false};
Object.defineProperties(local,{hp:{get:()=>s.hp},maxHp:{get:()=>s.maxHp},downed:{get:()=>!!s.downed},dead:{get:()=>!!s.dead}});setLocal(local);
const view={width:1280,height:720,zoom:1},props=[];
const imp=(id,x,y,hp=400)=>({id,x:x+1000,y:y+1000,hp,maxHp:hp,radius:14,state:'alive',role:'swarmer',speed:90,cooldown:0,age:0,attackDamage:14,hurt:0,scale:1,row:0,frame:0});
const step=(sec,f=()=>{})=>{for(let t=0;t<sec;t+=1/60){tickParty(s,c,props,1/60);tickSurvival(s,c,local,props,view,1/60);f();}};

// Positions are offset to (1000,1000), away from the world edge.
// 1. Solo: no-op targeting and no HP scaling.
c.targets=[imp(1,300,0)];step(.1);assert.equal(c.targets[0].maxHp,400,'solo: no scaling');assert.equal(targetFor(c.targets[0],local),local);

// 2. Two bots: enemy HP scales, an enemy next to a bot targets the bot, bots deal damage and shots fly.
const a=addBot('sword',s),b=addBot('ranger',s);assert(a&&b&&party.players.length===3);
a.x=1300;a.y=1000;b.x=1000;b.y=1200;c.targets=[imp(2,360,0,4000)];step(.05);
assert.equal(c.targets[0].maxHp,Math.round(4000*(1+PARTY.hpPerExtra.normal*2)),'HP scales with party size');
assert.equal(targetFor(c.targets[0],local).id,a.id,'enemy targets the nearest player (the bot)');
const before=c.targets[0].hp;step(2);assert(c.targets[0].hp<before,'bots damage enemies');

// 3. A bot goes down from enemy hits and is revived by a teammate standing next to it.
c.targets=[];a.x=1000;a.y=1000;a.hp=10;a.grace=0;receiveHit(s,c,a,imp(3,10,0),props);assert(a.downed,'bot downed at 0 HP');
step(PARTY.revive.time+.3);assert(!a.downed&&a.hp>0,'bot revived by nearby teammates');

// 4. Local player goes down (not dead) while teammates stand, and gets revived.
s.hp=5;s.grace=0;receiveHit(s,c,local,imp(4,10,0),props);assert(s.downed&&!s.dead,'local downed, run continues');
assert.notEqual(targetFor(imp(5,5,0),local),local,'enemies ignore a downed player');
step(PARTY.revive.time+.3);assert(!s.downed&&s.hp>0,'local revived');

// 5. Everyone down → run over.
for(const q of party.players)if(!q.local){q.hp=0;q.downed=true;}
s.hp=1;s.grace=0;receiveHit(s,c,local,imp(6,10,0),props);step(.1);assert(s.dead,'run ends when nobody stands');

// 6. Batch 2: a teammate with its own kit state takes hits on that state (not the local HUD), goes down, gets revived, and the bot AI issues ability casts.
clearAllies();s.dead=false;s.downed=false;s.hp=s.maxHp;s.grace=0;
const k=addBot('mage',s),ks=Object.create(s),kc=Object.create(c);Object.assign(ks,{hp:170,maxHp:170,grace:0,hurt:0,dead:false,downed:false,parry:0,cast:null,barrier:0,skills:{}});
Object.defineProperties(k,{hp:{get:()=>ks.hp,set:v=>{ks.hp=v;},configurable:true},maxHp:{get:()=>ks.maxHp,configurable:true},downed:{get:()=>!!ks.downed,set:v=>{ks.downed=v;},configurable:true},dead:{get:()=>!!ks.dead,configurable:true}});k.kit={s:ks,c:kc};
k.x=1000;k.y=1000;const hpLocal=s.hp,ev=receiveHit(s,c,k,imp(7,10,0),props);
assert(ks.hp<170&&s.hp===hpLocal,'kit teammate takes the hit on its own state');assert(ev.some(e=>e.type==='allyHit')&&!ev.some(e=>e.type==='playerHit'),'no playerHit for teammates');
ks.hp=1;ks.grace=0;const ev2=receiveHit(s,c,k,imp(8,10,0),props);assert(k.downed&&!s.dead&&ev2.some(e=>e.type==='allyDowned'),'kit teammate downed');
step(PARTY.revive.time+.3);assert(!k.downed&&ks.hp>0,'kit teammate revived by the local player');
c.targets=[imp(9,200,0,1e6)];k.castT=0;step(.05);assert(k.cmd&&k.cmd.attack&&k.cmd.aim,'kit bot gets an attack command');
let casts=0;for(let i=0;i<300;i++){step(1/60);if(k.cmd?.cast)casts++;}assert(casts>0,'kit bot casts abilities');
// 7. Finish Phase 1: an area attack hits every standing player inside it, not only the enemy's target; bot commands use the shared edge format.
assert(Array.isArray(k.cmd.press),'bot command has press edges');
s.grace=0;ks.grace=0;s.hp=s.maxHp;ks.hp=ks.maxHp;k.x=1030;k.y=1000;const r={hazards:[{kind:'explosion',x:1000,y:1000,radius:150,age:0,warning:0,duration:.4,owner:1,death:true,fired:false}],elites:[]};
c.targets=[];const evA=tickElitePowers(r,s,c,local,props,1/60);assert(s.hp<s.maxHp&&ks.hp<ks.maxHp,'explosion hits you and the teammate');assert(evA.some(e=>e.type==='allyHit'),'teammate hit reported');
// 8. User Oct 17 (after reverting per-player copies): bosses don't focus — every attack goes to a random player, never the same one twice in a row.
{const b2=addBot('sword',s);b2.x=1150;b2.y=1100;k.x=850;k.y=1100;s.dead=false;s.downed=false;s.hp=s.maxHp;
 const boss={id:500,role:'boss',bossKind:'butcher',name:'Butcher',state:'alive',x:1000,y:800,hp:5000,maxHp:5000,radius:40,speed:60,scale:1,cooldown:0,specialCD:0,specialIndex:0,row:2,chainNext:'hook'};
 c.targets=[boss];c.hazards=[];tickBosses(s,c,local,props,1/60);
 assert.equal(boss.special?.kind,'hook','boss attacks');assert(boss.bossTgt!=null,'attack has a chosen target');assert(!boss.extra,'no per-player copies');
 assert.equal(c.hazards.filter(h=>h.kind==='lane').length,1,'one hook only');
 const seen=new Set();let last=boss.bossTgt;for(let i=0;i<60;i++){const q=nextBossTarget(boss,local);assert.notEqual(q.id,last,'never the same player twice in a row');last=q.id;seen.add(q.id);}
 assert.equal(seen.size,3,'every player gets attacked');}
clearAllies();assert.equal(party.players.length,1);
console.log('party smoke OK');
