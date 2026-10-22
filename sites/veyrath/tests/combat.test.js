import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombat,pressAttack,releaseAttack,tickCombat,strikeConnects,STRIKES,clearAttackInput} from '../dist/combat.js';
// Close-range fixture fits all three swings after cumulative target knockback.
const player=()=>({x:1800,y:1340,row:6});
function step(c,p,seconds,aim=c.target,props=[]){const events=[];for(let t=0;t<seconds;t+=1/120)events.push(...tickCombat(c,p,aim,props,1/120));return events;}
test('without a manual attack input the demon never takes damage',()=>{
  const c=createCombat();step(c,player(),5);assert.equal(c.target.hp,225);assert.equal(c.attack,null);
});
test('strike waits for the visible contact frame and hits only once per swing',()=>{
  const c=createCombat(),p=player();pressAttack(c);tickCombat(c,p,c.target,[],1/120);releaseAttack(c);
  step(c,p,.12);assert.equal(c.target.hp,225);/* Oct 19: contact now at .175 s */
  step(c,p,.6);assert.equal(c.target.hp,125);/* flat 100 Longsword hit */assert.equal(c.hits,1);
});
test('holding LMB chains the three distinct damage seeds in order',()=>{
  const c=createCombat(),p=player();pressAttack(c);c.target.hp=c.target.maxHp=500;const hits=step(c,p,1.92).filter(e=>e.type==='hit');
  assert.deepEqual(hits.slice(0,3).map(e=>e.damage),[100,100,100]);assert.equal(c.target.hp,500-hits.reduce((a,e)=>a+e.damage,0));/* Oct 19: user-confirmed flat 100 Longsword hits replace the 90/100/130 combo */
});
test('a late buffered click continues the combo after recovery',()=>{
  const c=createCombat(),p=player();pressAttack(c);tickCombat(c,p,c.target,[],.01);releaseAttack(c);
  step(c,p,.5);pressAttack(c);releaseAttack(c);const events=step(c,p,.7);
  assert.ok(events.some(e=>e.type==='hit'&&e.damage===100));assert.equal(c.hits,2);
});
test('releasing hold stops repeating and a later click restarts hit one',()=>{
  const c=createCombat(),p=player();pressAttack(c);tickCombat(c,p,c.target,[],.01);releaseAttack(c);
  step(c,p,2);assert.equal(c.hits,1);pressAttack(c);tickCombat(c,p,c.target,[],.01);releaseAttack(c);
  assert.equal(c.attack.index,0);
});
test('precise aim, range and terrain occlusion govern sword hits',()=>{
  const p={x:300,y:300};const t={x:360,y:300,radius:12,state:'alive'};
  assert.equal(strikeConnects(p,t,Math.PI,STRIKES[0],[]),false);
  assert.equal(strikeConnects(p,{...t,x:500},0,STRIKES[0],[]),false);
  const aim=Math.PI/9,theta=aim+.8;
  assert.equal(strikeConnects(p,{...t,x:300+Math.cos(theta)*60,y:300+Math.sin(theta)*60},aim,STRIKES[0],[]),true);
  assert.equal(strikeConnects(p,t,0,STRIKES[0],[{x:330,y:300,radius:10}]),false);
});
test('death fires once, finishes its animation clock and prevents further damage',()=>{
  const c=createCombat(),p=player();pressAttack(c);const events=step(c,p,4);
  assert.equal(c.target.hp,0);assert.equal(c.target.state,'dead');assert.equal(c.kills,1);assert.equal(events.filter(e=>e.type==='death').length,1);
  assert.ok(c.target.death>.7);
});
test('pause/focus-loss input clearing cannot start a queued attack later',()=>{
  const c=createCombat();pressAttack(c);clearAttackInput(c);step(c,player(),1);assert.equal(c.attack,null);assert.equal(c.hits,0);
});
