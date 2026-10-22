import assert from 'node:assert/strict';
import {encounterPressure,PRESSURE_STAGES,HARD_ENEMY_CAP} from '../dist/encounter-pacing.js';
import {createCombat} from '../dist/combat.js';
import {createSurvival,tickSurvival,spawn} from '../dist/survival.js';
import {createRewards,tickRewards,rewardEvents} from '../dist/rewards.js';
import {createWorldEvents,applyWorldModifiers} from '../dist/world-events.js';
import {ENEMY_SPEED} from '../dist/encounter-space.js';
import {directorWorkload} from '../dist/encounter-rules.js';
for(const stage of PRESSURE_STAGES){const p=encounterPressure(stage.at);assert.equal(p.interval,stage.interval);assert.equal(p.cap,stage.cap);}
assert.deepEqual(encounterPressure(1800),encounterPressure(6000));assert.equal(encounterPressure(60*999).cap,180);assert.equal(HARD_ENEMY_CAP,260);/* Oct 16 ramp to 30:00 (#8) */assert(encounterPressure(110).breathing);assert(encounterPressure(110).rate<encounterPressure(100).rate);assert.equal(encounterPressure(300,{optionalActive:true}).rate,.45);assert.equal(encounterPressure(300,{bossActive:true}).rate,.6);assert(encounterPressure(300,{optionalActive:true}).interval>encounterPressure(300).interval);
assert.equal(ENEMY_SPEED.swarmer,93*.9);assert.equal(ENEMY_SPEED.bruiser,61*.9);assert.equal(ENEMY_SPEED.leader,96);assert.equal(ENEMY_SPEED.boss,60);/* mini-boss walks faster (log-enemies) */
const p={x:1800,y:1400,row:0},view={width:850,height:650,zoom:1};let c=createCombat(),s=createSurvival(c);c.targets=[];const counts=Array(10).fill(0),rng=Math.random;Math.random=()=>.37;
try{
 for(let i=0;i<12000;i++){c.targets=[];const minute=Math.min(9,Math.floor(s.clock/60));tickSurvival(s,c,p,[],view,.05);counts[minute]+=c.targets.length;}
 assert(counts[0]>=15&&counts[0]<=45,counts);/* Oct 19: Oct 18 waves spawn groups - bounds widened, growth checks kept */assert(counts[2]>counts[0],counts);assert(counts[9]>counts[2],counts);assert(counts[9]<120,counts);
 c=createCombat();s=createSurvival(c);s.clock=600;s.spawnTimer=0;const full=directorWorkload(encounterPressure(600),s).cap;/* Oct 19: director cap = 3x stage cap */c.targets=Array.from({length:full},(_,id)=>({...c.target,id,enemy:true,role:'swarmer',speed:0,hurt:100,age:0,hp:400,state:'alive'}));tickSurvival(s,c,p,[],view,.01);assert.equal(c.targets.length,full);c.targets=Array.from({length:HARD_ENEMY_CAP},()=>({...c.target,state:'alive'}));assert.equal(spawn(s,c,p,[],view),undefined);assert.equal(c.targets.length,HARD_ENEMY_CAP);
 c=createCombat();s=createSurvival(c);const r=createRewards(s,c);s.clock=200;s.world={optionalActive:1};c.targets=[];r.eliteAt=0;r.bossAt=0;/* Oct 19: timed mini-bosses are off by default (bossAt Infinity); schedule one */tickRewards(r,s,c,p,[],view,.1);assert.equal(c.targets.length,0,'automatic elites/boss wait during optional fight');
 s.world={optionalActive:0};tickRewards(r,s,c,p,[],view,.1);assert.equal(c.targets.filter(e=>e.role==='boss').length,1);const boss=c.targets.find(e=>e.role==='boss');boss.state='dead';rewardEvents(r,s,[{type:'death',role:'boss',x:0,y:0}]);assert.equal(s.pressureRestUntil,215);assert(r.eliteAt>=220);
 const w=createWorldEvents([],()=>.4);s.world={optionalActive:1};s.clock=300;applyWorldModifiers(w,s,c);assert.equal(s.pressureRestUntil,312);s.spawnTimer=0;c.targets=[];tickSurvival(s,c,p,[],view,.1);assert.equal(c.targets.length,0,'recovery prevents immediate refill');
 console.log('Pacing integration passed. Regular arrivals per minute with immediate clearing:',counts.join(', '));
}finally{Math.random=rng;}
await import('./world-events.test.js');
