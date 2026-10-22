import {awardLevelPoints,spellOwned,talentBonus,awardBonusPoint,PATHS,pickKind} from '../dist/specializations.js?v=fx-151';
import {currentOffer,chooseOffer,withCards} from '../dist/level-cards.js?v=fx-151';
import {TALENT_NODES} from '../dist/talent-data.js?v=fx-151';
import assert from 'node:assert';
import {createSurvival,acceptEvents} from '../dist/survival.js?v=fx-151';
import {createRewards} from '../dist/rewards.js?v=fx-151';
// Follow real fresh-run/reset initialization before collecting ground XP.
for(const [classId,paths] of Object.entries(PATHS))for(const path of paths){
 const c={target:{}},s=createSurvival(c);createRewards(s,c);s.classId=classId;s.path=path.id;
 // Oct 16 rule: runs start at level 1 and the first spell is picked as the run begins.
 assert.equal(s.level,1);const events=[];awardLevelPoints(s,events);
 assert(events.some(e=>e.type==='levelPick'),'first spell must be offered at run start');
 acceptEvents(s,c,[{type:'xpCollected',xp:18*8}]);assert.equal(s.level,1,'about 7 small mobs per level');
 const offer=currentOffer(s);assert.equal(offer.kind,'spell');assert.deepEqual(offer.options.map(o=>o.slot).sort(),['E','Q','RMB']);
}
assert.equal(TALENT_NODES.length,12*4*5);
assert.equal(new Set(TALENT_NODES.map(n=>n.id)).size,TALENT_NODES.length,'unique ids');
assert.deepEqual([1,5,10,15,7,11,14,18,22,26,30,34].map(pickKind),['spell','spell','spell','spell','behavior','behavior','behavior','behavior','behavior','behavior','behavior','behavior']);
assert.deepEqual([2,6,12,16,20,24].map(pickKind),Array(6).fill('stat'));
let seed=1;const rng=()=>(seed=(seed*16807)%2147483647)/2147483647;
for(const [classId,paths] of Object.entries(PATHS))for(const p of paths){
 const s={classId,path:p.id,level:0,skills:{},dead:false};
 let behaviors=0;
 for(let lvl=1;lvl<=30;lvl++){s.level=lvl;awardLevelPoints(s,[]);
  while(s.pendingPicks.length){const o=currentOffer(s,rng);
   if(o.kind==='spell'){assert(o.options.every(x=>x.type==='spell'));if(lvl<15)assert(o.options.every(x=>x.slot!=='R'),'no R before 15');assert.equal(o.options.length,{1:3,5:2,10:1,15:1}[lvl]);}
   else if(o.kind==='behavior')assert(o.options.every(x=>x.type==='behavior'));
   else assert(o.options.length===3&&o.options.every(x=>x.type==='stat'));
   const c=chooseOffer(s,0);assert(c);if(c.type==='behavior')behaviors++;}
  if(lvl===10)assert(['RMB','Q','E'].every(k=>spellOwned(s,k))&&!spellOwned(s,'R'));
 }
 assert(spellOwned(s,'R'));assert.equal(behaviors,7);
 for(let i=0;i<6;i++)awardBonusPoint(s);assert.equal(s.pendingPicks.length,2);/* Oct 18 progression handoff: five Insights replaced by up to two trial developments (BONUS_PICK_CAP) */
 while(s.pendingPicks.length){currentOffer(s,rng);chooseOffer(s,0);}
}
console.log('level-cards smoke ok');
