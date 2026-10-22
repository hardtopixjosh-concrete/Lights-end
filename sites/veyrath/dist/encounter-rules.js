// A run-local ledger. All kits share the root combat's ledger through inheritance.
export function claimDefeat(c,e){
 if(e.rewardEligible===false)return false;
 const ledger=c.rewardLedger??(c.rewardLedger=new Set()),key=e.rewardKey??('enemy:'+e.id);
 if(ledger.has(key))return false;ledger.add(key);return true;
}
export function summonReward(owner){
 if(owner?.id==null)return {};
 const slot=owner.rewardSlot=(owner.rewardSlot??0)+1;
 return {rewardKey:'summon:'+owner.id+':'+slot,rewardEligible:slot<=12,encounterRoster:owner.encounterRoster};
}
export function directorWorkload(pressure,s){
 // One workload factor is split between rate and population, rather than multiplying both in full.
 const workload=Math.max(.25,(s.dayPressure??1)*(s.mods?.spawn??1)*(s.partySpawn??1)),share=Math.sqrt(workload);
 return {interval:Math.max(.12,pressure.interval/(1.5*share)),cap:Math.min(260,Math.round(pressure.cap*3*share))};
}
export const worldHealthFactor=seconds=>1+.6*Math.min(1,Math.max(0,seconds)/1800);
