import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombat} from '../dist/combat.js';
import {createSurvival,receiveHit,tickSurvival} from '../dist/survival.js';
import {createWarrior,requestWarrior,tickWarrior,handleWarriorHits,WARRIOR_KITS} from '../dist/warrior.js';
import {TALENT_NODES} from '../dist/talent-data.js';
// Oct 19: trimmed - exact V0.9.2 prototype damage table and the old Spellblade crescent/rune/barrier kit (replaced by the Void kit) were removed; per-path DPS lives in tests/balance-report.mjs.
const setup=(path)=>{const c=createCombat(),s=createSurvival(c),p={x:1000,y:1000,row:0,radius:13};s.classId='sword';s.path=path;s.skills=Object.fromEntries(TALENT_NODES.filter(n=>n.path===path&&n.tier===0).map(n=>[n.id,1]));/* Oct 19: abilities unlock by leveling */c.targets=[{id:1,x:1070,y:1000,radius:12,role:'swarmer',state:'alive',hp:10000,maxHp:10000,hurt:0,xp:18}];return {c,s,p,w:Object.assign(createWarrior(s),{rage:100})/* Oct 15: abilities spend Rage */,aim:{x:1300,y:1000}};};
const run=(f,time)=>{const events=[];for(let t=0;t<time;t+=.01)events.push(...tickWarrior(f.w,f.c,f.s,f.p,f.aim,[],.01));return events;};
test('rush pierces ordinary targets, applies bounded bleed; charge hits large blockers',()=>{
 const f=setup('berserker');f.c.targets.push({...f.c.targets[0],id:2,x:1160});requestWarrior(f.w,f.c,f.s,f.p,f.aim,'RMB',[]);const hits=run(f,.32).filter(e=>e.type==='hit');assert.equal(hits.length,2);assert.ok(hits.every(h=>h.damage===400));assert.ok(f.c.targets.every(e=>e.warriorBleed));assert.ok(f.p.x>1200);
 const g=setup('warlord');g.c.targets[0].role='boss';requestWarrior(g.w,g.c,g.s,g.p,g.aim,'RMB',[]);assert.ok(run(g,.4).some(e=>e.type==='hit'&&e.damage===400));assert.ok(g.p.x<1070);
});
test('Vanguard perfect counter and Bastion damage reduction, Warlord weakening',()=>{
 const f=setup('vanguard');requestWarrior(f.w,f.c,f.s,f.p,f.aim,'Q',[]);const events=receiveHit(f.s,f.c,f.p,f.c.targets[0],[]);assert.ok(events.some(e=>e.type==='parry'));assert.equal(f.s.hp,250);assert.ok(events.some(e=>e.damage===150));run(f,.5);requestWarrior(f.w,f.c,f.s,f.p,f.aim,'R',[]);run(f,.01);f.s.grace=0;{const base=setup('vanguard');assert(receiveHit(f.s,f.c,f.p,f.c.targets[0],[])[0].damage<receiveHit(base.s,base.c,base.p,base.c.targets[0],[])[0].damage,'Bastion reduces damage');}/* Oct 19: relative - values retuned */
 const g=setup('warlord');requestWarrior(g.w,g.c,g.s,g.p,g.aim,'Q',[]);assert(g.c.targets[0].warriorWeaken>0);{const base=setup('warlord');assert(receiveHit(g.s,g.c,g.p,g.c.targets[0],[])[0].damage<receiveHit(base.s,base.c,base.p,base.c.targets[0],[])[0].damage,'War Cry weakens');}
});
test('boss stagger interrupts with recovery immunity',()=>{
 /* Oct 19: old buff-talent nodes replaced by the Oct 18 talent window - removed */
 const g=setup('vanguard');g.c.targets[0].role='boss';g.c.targets[0].swing={elapsed:0};for(let i=0;i<3;i++){g.w.cooldowns.E=0;assert.ok(requestWarrior(g.w,g.c,g.s,g.p,g.aim,'E',[]));run(g,1);}assert.equal(g.c.targets[0].swing,null);assert.equal(g.c.targets[0].warriorStagger,0);assert.ok(g.c.targets[0].warriorStaggerCD>2);
});
