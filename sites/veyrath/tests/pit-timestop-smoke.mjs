import assert from 'node:assert';
import {createCombat} from '../dist/combat.js?v=fx-104';
import {createSurvival,tickSurvival} from '../dist/survival.js?v=fx-104';
import {createRewards} from '../dist/rewards.js?v=fx-104';
import {buildArenas} from '../dist/arenas.js?v=fx-104';
import {createPits,tickPits} from '../dist/pits.js?v=fx-104';
import {WORLD} from '../dist/simulation.js?v=fx-104';
WORLD.width=6400;WORLD.height=4800;
const scene={props:[],ground:[],landmarks:[]},arenas=buildArenas(scene,{x:3200,y:2780},{x:3200,y:2350}),pits=createPits(arenas);
assert.equal(arenas.find(a=>a.id==='ravager-pit').radius,440);/* Oct 18: pits +60 */
const c=createCombat(),s=createSurvival(c);createRewards(s,c);s.clock=200;assert.equal(s.level,1);
const pit=arenas.find(a=>a.id==='ravager-pit'),p={x:pit.x,y:pit.y+pit.radius*.72+200,row:2};
tickPits(pits,s,c,p,.1);const b=c.targets.find(e=>e.bossKind==='ravager');assert(b.sleeping&&b.invulnerable);
const imp=c.targets[0];imp.x=p.x+60;imp.y=p.y;imp.emerge=0;
p.y=pit.y;tickPits(pits,s,c,p,.1);assert(!b.sleeping&&s.timeStop,'enter wakes boss + stops time');
const ix=imp.x;for(let i=0;i<30;i++)tickSurvival(s,c,p,[],{width:1600,height:900,zoom:1},1/30);assert.equal(imp.x,ix,'outside enemy frozen');assert(imp.timeStopped);
b.hp=b.maxHp*.4;b.x+=150;p.y=pit.y+pit.radius*.72+200;tickPits(pits,s,c,p,.1);assert.equal(b.hp,b.maxHp,'instant reset');assert(b.leashing&&!s.timeStop);
for(let i=0;i<40;i++)tickPits(pits,s,c,p,.05);assert(b.sleeping,'back home asleep');
console.log('pit time-stop smoke ok');
