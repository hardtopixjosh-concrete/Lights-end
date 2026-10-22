import assert from 'node:assert/strict';
import './chase.test.js';
import {createCombat} from '../dist/combat.js';
import {createSurvival,tickSurvival} from '../dist/survival.js';
import {createMage,requestMage,tickMage,MAGE_SPELLS} from '../dist/mage.js';
import {TALENT_NODES} from '../dist/talent-data.js';
import {mageAbility} from '../dist/mage-abilities.js';
const p={x:1800,y:1400,row:0},c=createCombat(),s=createSurvival(c),m=createMage(s),base={...c.targets[0],hp:2000,maxHp:2000};
s.path='cryo';s.classId='mage';s.skills=Object.fromEntries(TALENT_NODES.filter(n=>n.path==='cryo'&&n.tier===0).map(n=>[n.id,1]));/* Oct 19: spells unlock by leveling */c.targets=Array.from({length:12},(_,i)=>({...base,id:i,x:p.x+Math.cos(i*Math.PI/6)*205,y:p.y+Math.sin(i*Math.PI/6)*205*.65,swing:{elapsed:0}}));
c.targets.push({...base,id:12,x:p.x+270,y:p.y},{...base,id:13,role:'leader',x:p.x,y:p.y+100});
assert(requestMage(m,c,s,p,p,'nova'));tickMage(m,c,s,p,p,[],.21);
assert(c.targets.slice(0,12).every(e=>e.freeze===1.2&&e.swing===null),'entire fringe crowd frozen');
assert(!c.targets[12].freeze,'outside radius unaffected');assert.equal(c.targets[13].mageChill,2);assert(!c.targets[13].freeze);
{const spec=mageAbility(s,'nova');/* Oct 19: visual kind 'qnova'; cost/cooldown from data (Oct 15 short cooldowns) */assert.equal(m.effects.find(e=>e.kind==='qnova').radius,spec.radius);assert.equal(MAGE_SPELLS.nova.cooldown,spec.cooldown);assert(m.energy.value>=100-spec.cost&&m.energy.value<100-spec.cost+2);}
const movingCombat=createCombat(),movingSurvival=createSurvival(movingCombat),e=movingCombat.targets[0];movingSurvival.spawnTimer=100;e.x=p.x-70;e.y=p.y;e.hurt=0;e.swing={elapsed:0,windup:.45,reach:46,angle:0,fired:false};
tickSurvival(movingSurvival,movingCombat,p,[],{width:1200,height:720,zoom:.9},.1);assert(e.x>p.x-70&&e.x<p.x-59,'attack movement substantially below chase speed');
console.log('Pressure relief smoke passed: retreat opening, moving attack slowdown, 12 fringe freezes, outer exclusion, boss chill and matching Nova visual radius/cost/cooldown.');
