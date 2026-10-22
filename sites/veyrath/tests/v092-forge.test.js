import assert from 'node:assert/strict';
import {makeWeapon,createArmory,forgeCost,proposeForge,resolveForge,transactArmory,validArmory,migrateArmory,REFORGE_PRICES,affixKind} from '../dist/weapons.js';

for(let rarity=0;rarity<6;rarity++){
 const w=makeWeapon(8,()=>.4,rarity,0);
 for(const count of [0,19,49]){w.rerolls=count;assert.equal(forgeCost(w,'reforgeStat'),REFORGE_PRICES[rarity].stat);assert.equal(forgeCost(w,'reforgeBehavior'),REFORGE_PRICES[rarity].behavior??Infinity);assert.equal(forgeCost(w,'convert'),400);}
}
const a=createArmory(10000),w=makeWeapon(8,()=>.4,3,0);a.weapons.push(w);
const selected=w.affixes.find(x=>affixKind(x)==='stat'),before=structuredClone(w);
let saved;
const proposal=proposeForge(a,'reforgeStat',w.id,{affix:selected.id,rng:()=>.7},n=>{saved=structuredClone(n);});
assert(!proposal.error,proposal.error);const pending=proposal.next.pendingForge;
assert.equal(proposal.next.gold,9850);assert.equal(a.gold,10000);assert.deepEqual(proposal.next.weapons.find(x=>x.id===w.id).affixes,before.affixes);assert.equal(proposal.next.weapons.find(x=>x.id===w.id).rerolls,1);
assert(validArmory(proposal.next));assert(validArmory(saved));assert.deepEqual(migrateArmory(saved).pendingForge,pending);
assert(transactArmory(saved,'upgrade',w.id).error);assert(transactArmory(saved,'equip',w.id).error);assert(proposeForge(saved,'reforgeStat',w.id,{affix:selected.id}).error);
assert(resolveForge(saved,'accept','stale').error);assert(resolveForge(saved,'bad',pending.id).error);
const kept=resolveForge(saved,'keep',pending.id,n=>{saved=structuredClone(n);});assert(!kept.error,kept.error);assert.equal(kept.next.gold,9850);assert.deepEqual(kept.next.weapons.find(x=>x.id===w.id).affixes,before.affixes);assert.equal(kept.next.pendingForge,undefined);assert(resolveForge(kept.next,'accept',pending.id).error);
const second=proposeForge(kept.next,'reforgeStat',w.id,{affix:selected.id,rng:()=>.1}).next;assert.equal(second.gold,9700);const oldPending=structuredClone(second.pendingForge);
const failed=resolveForge(second,'accept',second.pendingForge.id,()=>{throw Error('storage unavailable');});assert(failed.error);assert.deepEqual(second.pendingForge,oldPending);assert.deepEqual(second.weapons.find(x=>x.id===w.id).affixes,before.affixes);
const accepted=resolveForge(second,'accept',second.pendingForge.id).next;assert.equal(accepted.gold,9700);assert.deepEqual(accepted.weapons.find(x=>x.id===w.id).affixes[oldPending.index],oldPending.after);assert.equal(accepted.weapons.find(x=>x.id===w.id).forgeHistory.length,2);assert.equal(accepted.pendingForge,undefined);assert(validArmory(accepted));
const proposalFailure=proposeForge(a,'reforgeStat',w.id,{affix:selected.id},()=>{throw Error('quota');});assert(proposalFailure.error);assert.equal(a.gold,10000);assert(!a.pendingForge);
const tampered=structuredClone(proposal.next);tampered.pendingForge.after.id='red-signature';assert(!validArmory(tampered));
const locked=structuredClone(a);locked.weapons.find(x=>x.id===w.id).locked=selected.id;assert(proposeForge(locked,'reforgeStat',w.id,{affix:selected.id}).error);
const rare=createArmory(1000),rw=makeWeapon(1,()=>0,2,0);rare.weapons.push(rw);const stat=rw.affixes.find(x=>affixKind(x)==='stat');const converted=proposeForge(rare,'convert',rw.id,{affix:stat.id,rng:()=>.4});assert(!converted.error,converted.error);assert.equal(converted.next.gold,600);assert.equal(affixKind(converted.next.pendingForge.after),'behavior');assert(validArmory(resolveForge(converted.next,'accept',converted.next.pendingForge.id).next));
console.log('V0.9.2 forge smoke passed: flat rarity prices, durable paid choices, atomic keep/accept, stale/duplicate protection, save rollback, eligibility and conversion.');
