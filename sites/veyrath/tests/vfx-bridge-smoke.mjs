// Scratch-style smoke check for the shader VFX bridge (Oct 15): drives every Mage path's spells through the real
// simulation and feeds the live records to drawMageVfx with a counting sink, verifying every kit emits finite
// primitives. Run: node tests/vfx-bridge-smoke.mjs
import {createCombat} from '../dist/combat.js';
import {createSurvival} from '../dist/survival.js';
import {createRewards} from '../dist/rewards.js';
import {createMage,requestMage,tickMage} from '../dist/mage.js?v=fx-104';
import {makeWeapon,weaponStats} from '../dist/weapons.js';
import {vfx} from '../dist/vfx-engine.js?v=fx-104';
import {drawMageVfx} from '../dist/mage-vfx.js?v=fx-104';
const counts={},bad=new Set();let cur='';
Object.defineProperty(vfx,'ok',{get:()=>true});
vfx.add=(pass,p)=>{counts[cur]=(counts[cur]??0)+1;for(const k of ['x','y','w','h','rot','alpha'])if(!Number.isFinite(p[k]))bad.add(cur+':'+k);};vfx.flush=()=>{};
const p={x:1800,y:1400,row:0},aim={x:2100,y:1370};
for(const path of ['pyro','cryo','storm','blood'])for(const kind of ['fireball','nova','chain','meteor']){
 const c=createCombat(),s=createSurvival(c);createRewards(s,c);s.classId='mage';s.path=path;const m=createMage(s);s.hp=200;
 c.weapon=weaponStats({...makeWeapon(1,()=>0,0,5)/* Oct 19: Orb (8) retired; any staff works for spell VFX */,base:1,affixes:[],quality:0,ceiling:1},1);
 c.targets=Array.from({length:4},(_,i)=>({...c.targets[0],id:i+1,x:p.x+120+i*40,y:p.y+(i%2?20:-20),hp:1e5,maxHp:1e5,emerge:0,hurt:0}));
 m.energy.value=100;cur=path+'.'+kind;if(!requestMage(m,c,s,p,aim,kind)){counts[cur]='not cast';continue;}
 for(let i=0;i<400;i++){tickMage(m,c,s,p,aim,[],.01);m.fxTargets=c.targets;if(i%5===0){drawMageVfx({},m,'ground');drawMageVfx({},m,'upper');}}
}
console.log(counts);console.log(bad.size?'BAD '+[...bad]:'all finite');
