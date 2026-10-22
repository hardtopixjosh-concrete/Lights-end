// Oct 16: Pyro Fireball explodes but only ignites/bounces off enemies already burning.
import assert from 'node:assert/strict';
import {createMage,tickMage,requestMage} from '../dist/mage.js';
import {createCombat} from '../dist/combat.js';
import {createSurvival} from '../dist/survival.js';
import {spellId} from '../dist/talent-data.js';
function run(burnFirst){const c=createCombat(),s=createSurvival(c);s.path='pyro';s.skills={...(s.skills??{}),[spellId('pyro','RMB')]:1};c.skills=s.skills;const m=createMage(s),p={x:1700,y:1400,row:0};m.energy.value=m.energy.max;
 c.targets=Array.from({length:4},(_,i)=>({...c.targets[0],id:i,x:1900+i*45,y:1400+(i%2)*30,hp:5000,maxHp:5000}));if(burnFirst)c.targets[0].burn={remaining:3,pulse:.5,damage:5};
 assert(requestMage(m,c,s,p,{x:1900,y:1400},'fireball'),'cast');for(let i=0;i<120;i++)tickMage(m,c,s,p,{x:1900,y:1400},[],.02);
 return c.targets.map(t=>({hurt:t.hp<5000,burn:!!t.burn}));}
const cold=run(false);assert(cold.filter(t=>t.hurt).length>=2,'fresh pack: explosion splashes');assert(cold.every(t=>!t.burn),'fresh pack: nothing ignited');
const hot=run(true);assert(hot.filter(t=>t.hurt).length>=3,'burning target: fire spreads by bouncing');assert(hot.filter(t=>t.burn).length>=3,'spread targets ignite');
console.log('pyro rmb ok',JSON.stringify({cold,hot}));
