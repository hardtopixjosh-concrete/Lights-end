import assert from 'node:assert';
import {createHealing,tickHealing,HEALING} from '../dist/healing.js?v=fx-104';
import {mageAbility} from '../dist/mage-abilities.js?v=fx-104';
const h=createHealing({x:1800,y:1400},{x:1500,y:1450},[]);
const s={hp:50,maxHp:200,hurt:0,dead:false};
tickHealing(h,s,{x:0,y:0},[],10);assert(s.hp>50&&s.hp<60,'slow regen '+s.hp);
tickHealing(h,s,{x:0,y:0},[{type:'death',role:'boss',x:5,y:5}],.01);assert.equal(h.packs.length,0,'boss pack picked up instantly');assert(s.hp>90,'pack healed '+s.hp);
let out=[];for(let i=0;i<200;i++){s.hp=20;out.push(...tickHealing(h,s,h.pool,[],.1));}
assert(out.some(e=>e.text?.includes('dry'))&&h.pool.charge===0,'pool drains');
for(let i=0;i<800;i++)tickHealing(h,s,{x:0,y:0},[],.1);assert.equal(h.pool.charge,1,'pool refills');
let need=0,x=40;for(let l=1;l<10;l++){need+=x;x=Math.round(x*1.22);}console.log('XP to level 10:',need);
console.log('fireball',mageAbility({path:'pyro',skills:{}},'fireball').cooldown,'meteor',mageAbility({path:'pyro',skills:{}},'meteor').cooldown);
console.log('healing smoke ok');
