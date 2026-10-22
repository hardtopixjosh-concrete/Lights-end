import assert from 'node:assert';
import {createWarrior,tickWarrior,handleWarriorHits,requestWarrior,warriorAbility,RAGE} from '../dist/warrior.js?v=fx-104';
const s={classId:'sword',path:'berserker',specialization:'berserker',skills:{'berserker-spell-RMB':1},hp:200,maxHp:250,dead:false,level:1};
const w=createWarrior(s),c={targets:[],weapon:{},skills:s.skills},p={x:0,y:0,row:0};
assert.equal(w.rage,0);
assert(!requestWarrior(w,c,s,p,{x:10,y:0},'RMB'),'no rage, no cast');
handleWarriorHits(w,c,s,p,[1,2,3,4,5].map(i=>({type:'hit',basic:true,attackId:i,target:{id:i,x:5,y:0,hp:100,state:'alive'},x:5,y:0,damage:10,resource:RAGE.perHit/* Oct 18: rage comes from the hit's resource field */})));
assert.equal(w.rage,5*RAGE.perHit);
tickWarrior(w,c,s,p,null,[],.016);assert.equal(w.rage,20);/* Oct 19: rage from damage taken now lives in survival.receiveHit (hpLost*.5, max 8 per window) */
assert(requestWarrior(w,c,s,p,{x:10,y:0},'RMB'),'casts with rage');assert.equal(w.rage,20-RAGE.cost.RMB);
assert.equal(warriorAbility(s,'RMB').cooldown,1);
w.cast=null;s.cast=null;for(let i=0;i<100;i++)tickWarrior(w,c,s,p,null,[],.1);assert.equal(w.rage,0,'decays out of combat');
console.log('rage smoke ok');
