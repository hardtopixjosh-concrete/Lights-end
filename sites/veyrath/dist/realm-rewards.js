import {makeWeapon,pocketRealmReward,RUN_BAG} from './weapons.js?v=fx-260';
// Called only by a future implemented realm boss. The live schedule remains disabled.
// Freeze generated rewards on the encounter; duplicate completion/reconnect never rerolls them.
export function realmEntitlements(realm,participants,rng=Math.random){
 if(realm.state!=='won')return [];
 if(realm.rewards)return realm.rewards;
 realm.rewards=(realm.roster??[]).flatMap(owner=>{const p=participants.find(p=>String(p.owner)===owner);return p?[{owner,id:realm.id+':'+owner,anchor:{...realm.anchor},weapon:makeWeapon(p.level,rng,5,null,p.classId,p.path)}]:[];});
 return realm.rewards;
}
export function settleRealmReward(armory,reward,owner){if(reward.owner!==String(owner))return {error:'Not your realm reward'};return pocketRealmReward(armory,reward.weapon,reward.id,reward.anchor);}
export function collectDisplacedWeapon(armory,weaponId){
 const next=structuredClone(armory),w=next.weapons.find(w=>w.id===weaponId&&w.location==='ground');
 if(!w||!next.personalPickups?.some(p=>p.weaponId===weaponId))return {error:'Pickup unavailable'};
 if(next.weapons.filter(w=>w.location==='run').length>=RUN_BAG)return {error:'Run bag full'};
 w.location='run';next.personalPickups=next.personalPickups.filter(p=>p.weaponId!==weaponId);return {next};
}
