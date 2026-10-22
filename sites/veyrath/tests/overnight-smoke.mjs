// Oct 16 overnight batch: drive every new system headlessly for a while and fail on exceptions.
import assert from 'node:assert';
import {createCombat} from '../dist/combat.js?v=fx-151';
import {createSurvival,tickSurvival} from '../dist/survival.js?v=fx-151';
import {createRewards,tickRewards} from '../dist/rewards.js?v=fx-151';
import {tickElitePowers} from '../dist/elite-powers.js?v=fx-151';
import {makeBoss,tickBosses} from '../dist/bosses.js?v=fx-151';
import {tickFinalBoss} from '../dist/final-boss.js?v=fx-151';
import {createDirector,tickDirector,lightAt} from '../dist/run-director.js?v=fx-151';
import {createPits,tickPits,tickTitanBuffs} from '../dist/pits.js?v=fx-151';
import {buildArenas} from '../dist/arenas.js?v=fx-151';
import {createWorldEvents,tickWorldEvents,actWorld,TRIALS} from '../dist/world-events.js?v=fx-151';
import {readFileSync} from 'node:fs';
/* Oct 19: set WORLD on the live-tag instance that the dist modules share (an old ?v= tag is a separate copy) */const liveTag=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=([^"']+)/)[1];const {WORLD}=await import('../dist/simulation.js?v='+liveTag);
import {applyRole} from '../dist/enemy-roles.js?v=fx-151';
WORLD.width=6400;WORLD.height=4800;
const view={width:1600,height:900,zoom:1};
function world(){const c=createCombat(),s=createSurvival(c);createRewards(s,c);const r=createRewards(s,c);s.classId='sword';s.path='berserker';s.level=10;return {c,s,r,p:{x:3200,y:2400,row:2}};}
function run(w,secs,extra=()=>[]){const {c,s,r,p}=w;for(let t=0;t<secs;t+=1/30){c.hazards=r.hazards;const ev=[...tickElitePowers(r,s,c,p,[],1/30),...tickSurvival(s,c,p,[],view,1/30),...tickRewards(r,s,c,p,[],view,1/30),...tickBosses(s,c,p,[],1/30),...tickFinalBoss(s,c,p,[],1/30),...extra(1/30)];if(s.dead){s.dead=false;s.hp=s.maxHp;}
 // Player chips at every boss so phases trigger.
 for(const e of c.targets)if(e.state==='alive'&&(e.role==='boss'||e.role==='anchor'||e.role==='bossClone')&&!(e.invulnerable>0))e.hp=Math.max(0,e.hp-e.maxHp*.004),e.hp===0&&(e.state='dead');}}
for(const kind of ['butcher','prophet','colossus','wyrm','ravager','final']){const w=world();w.s.clock=500;const b=makeBoss(w.s,w.c,3500,2400,kind);b.emerge=0;b.arena={x:3200,y:2400};run(w,40);console.log(kind,'ok · hp',Math.round(b.hp/b.maxHp*100)+'%','hazards seen',w.r.hazards.length,'projectiles',w.c.enemyProjectiles?.length??0);}
// Director timeline: phases, boss schedule and the final sequence.
{const w=world(),d=createDirector();let spawned=[];for(let t=0;t<1830;t+=.5){w.s.clock=t;tickDirector(d,w.s,w.c,.5,{spawnBoss:k=>{spawned.push(k);const b=makeBoss(w.s,w.c,3300,2400,k);b.state='dead';return b;},finalClear:()=>{}});}
 assert.deepEqual(spawned,['colossus']);/* Oct 19 decision: the 29:00 Reckoning boss is the Colossus; the Tyrant is the realm boss (realm.js) */assert(w.s.finalPhase);assert(lightAt(1300)[3]>.3);console.log('director ok',spawned.join(','));}
// Pits and arenas.
{const scene={props:[],ground:[],landmarks:[]},arenas=buildArenas(scene,{x:3200,y:2780},{x:3200,y:2350});assert.equal(arenas.length,6);/* + tyrant-realm (Oct 19) */assert(scene.props.length>100);const pits=createPits(arenas),w=world();w.s.clock=700;
 let ev=tickPits(pits,w.s,w.c,w.p,1);assert(w.c.targets.some(e=>e.pit&&e.sleeping));const rav=w.c.targets.find(e=>e.bossKind==='ravager');w.p.x=rav.x;w.p.y=rav.y;tickPits(pits,w.s,w.c,w.p,.1);assert(!rav.sleeping);rav.state='dead';tickPits(pits,w.s,w.c,w.p,.1);/* Oct 18: pit buffs replaced by boss blessings - buff check removed */console.log('pits ok',arenas.map(a=>a.id+'@'+Math.round(a.x)+','+Math.round(a.y)).join(' '));}
// Trials: start each trial and tick it.
for(const tr of TRIALS){const w=world(),we=createWorldEvents([],Math.random,[{name:'trial-1',x:4600,y:1900}]),e=we.events.find(x=>x.kind==='trial');assert(e);e.trial=tr.id;w.p.x=e.x;w.p.y=e.y;const res=actWorld(we,e,w.s,w.c,w.p,[],'start');assert(res.ok,tr.id+' '+res.error);run(w,20,dt=>tickWorldEvents(we,w.s,w.c,w.p,[],dt));console.log('trial',tr.id,'→',e.status);}
// New roles tick without errors.
{const w=world();for(const role of ['charger','guardian','summoner']){const e={...w.c.target,id:++w.s.id,enemy:true,x:3400,y:2400,state:'alive',hurt:0,death:0,clock:0,age:0,cooldown:0,swing:null,row:2};applyRole(e,role,5);w.c.targets.push(e);}w.s.clock=700;run(w,15);console.log('roles ok',w.c.targets.filter(e=>e.summonedBy).length,'summoned');}
console.log('overnight smoke ok');
