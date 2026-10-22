// Oct 19: Tyrant realm pull + 29:00 Colossus Reckoning (realm.js, run-director.js).
import assert from 'node:assert';
import {tickRealm} from '../dist/realm.js?v=fx-254';
import {createRealmSchedule} from '../dist/progression.js?v=fx-254';
import {tickDirector,createDirector,FINAL_AT} from '../dist/run-director.js?v=fx-254';
const r=createRealmSchedule(()=>.5),s={clock:r.at+1,dead:false},c={targets:[]},a={id:'tyrant-realm',x:4800,y:6300,radius:760};
const P=[{id:0,x:100,y:200,owner:0}];let boss=null;
const h={arena:a,players:()=>P,busy:()=>false,place:(p,x,y)=>{p.x=x;p.y=y;},spawn:()=>(boss={id:99,state:'alive'})};
for(let i=0;i<300&&r.state==='waiting';i++)tickRealm(r,s,c,1/60,h);
assert.equal(r.state,'active');assert.ok(Math.hypot(P[0].x-a.x,P[0].y-a.y)<a.radius);assert.equal(s.timeStop.pit,a.id);
c.targets.push(boss);tickRealm(r,s,c,1/60,h);assert.equal(r.state,'active');
boss.state='dead';for(let i=0;i<400;i++)tickRealm(r,s,c,1/60,h);
assert.equal(r.state,'won');assert.deepEqual([P[0].x,P[0].y],[100,200]);assert.equal(s.timeStop,null);
const d=createDirector(),ds={clock:FINAL_AT,dead:false},dc={targets:[]};let spawned=null;
for(let i=0;i<500;i++){ds.clock+=1/60;tickDirector(d,ds,dc,1/60,{spawnBoss:(k,o)=>(spawned={k,o,id:7,state:'alive'},dc.targets.push(spawned),spawned),finalClear(){}});}
assert.equal(FINAL_AT,1740);assert.equal(spawned.k,'colossus');assert.ok(spawned.o.final);
console.log('realm smoke ok');
