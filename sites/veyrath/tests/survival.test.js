import assert from 'node:assert/strict';
import {createCombat,tickCombat,pressAttack} from '../dist/combat.js';
import {createSurvival,castAbility,tickSurvival,acceptEvents,receiveHit} from '../dist/survival.js';
const view={width:1200,height:800,zoom:.9};
const p={x:1800,y:1400,row:6};
const c=createCombat(),s=createSurvival(c),e=c.targets[0];
const step=dt=>{const events=[...tickCombat(c,p,null,[],dt,!s.cast),...tickSurvival(s,c,p,[],view,dt)];acceptEvents(s,c,events);return events;};
for(let i=0;i<220;i++)step(.02);
assert(s.hp<250,'enemy pursuit and telegraphed strike damage player');
p.invulnerable=true;const hp=s.hp;receiveHit(s,c,p,e,[]);assert.equal(s.hp,hp);p.invulnerable=false;
s.grace=0;s.parry=.22;s.parryAngle=Math.atan2(e.y-p.y,e.x-p.x);
assert(receiveHit(s,c,p,e,[]).some(x=>x.type==='parry'));assert.equal(s.hp,hp);
c.hitstop=0;e.x=p.x;e.y=p.y-25;e.hp=75;e.state='alive';
assert(castAbility(s,c,p,null,'slam'));for(let i=0;i<35;i++)step(.02);assert.equal(e.state,'dead');assert(c.kills>0);/* Oct 19: XP comes from collected pickups, not the kill event */
assert(castAbility(s,c,p,null,'storm'));for(let i=0;i<160;i++)step(.02);assert.equal(s.cast,null);assert(!castAbility(s,c,p,null,'storm'));
acceptEvents(s,c,[{type:'xpCollected',xp:300}]);assert(s.level>1&&s.maxHp>250&&c.damageMultiplier>1);
s.hp=1;s.grace=0;s.parry=0;receiveHit(s,c,p,{role:'bruiser',x:p.x+5,y:p.y},[]);assert(s.dead);assert(!castAbility(s,c,p,null,'parry'));
console.log('Survival integration passed: enemy pressure, damage, evade, parry, AoE, XP, cooldowns and death.');
