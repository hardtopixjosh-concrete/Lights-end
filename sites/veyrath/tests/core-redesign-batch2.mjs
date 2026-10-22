import assert from 'node:assert/strict';
import {createArmory,migrateArmory,makeWeapon,weaponStats,transactArmory,resolveForge,validArmory,FAMILIES} from '../dist/weapons.js?v=fx-210';
import {eligibleAffixes} from '../dist/affix-data.js?v=fx-210';
import {PATHS,pathNodes,learn,canLearn,pickKind} from '../dist/specializations.js?v=fx-210';
import {withCards,rollOffer} from '../dist/level-cards.js?v=fx-210';
import {ATTACK_DEVELOPMENTS} from '../dist/developments.js?v=fx-210';
import {outputAmount,RANGER_FAMILIES} from '../dist/core-rules.js?v=fx-210';
const a=migrateArmory(createArmory(5000)),w=makeWeapon(20,()=>.5,1,14,'ranger','archer')/* Oct 19: Bow (12) retired -> Short Bow (14) */;w.affixes=[{id:'rangerReach14',kind:'behavior',name:'Far-reaching Bow',value:1,unit:''}];w.affixCount=1;a.weapons.push(w);
const proposed=transactArmory(a,'convertStat',w.id,{affix:'rangerReach14',rng:()=>.5});assert(!proposed.error);assert.equal(proposed.next.gold,4600);assert(validArmory(proposed.next));assert.deepEqual(migrateArmory(proposed.next).pendingForge,proposed.next.pendingForge);
const accepted=resolveForge(JSON.parse(JSON.stringify(proposed.next)),'accept',proposed.next.pendingForge.id);assert(!accepted.error);const changed=accepted.next.weapons.find(i=>i.id===w.id);assert.equal(changed.id,w.id);assert.equal(changed.affixes.length,1);assert.equal(changed.affixes[0].kind,'stat');assert.equal(accepted.next.gold,4600);assert(resolveForge(accepted.next,'accept',proposed.next.pendingForge.id).error);
const locked=structuredClone(a);locked.weapons.at(-1).locked='rangerReach14';assert(transactArmory(locked,'convertStat',w.id,{affix:'rangerReach14'}).error);
let mappings=0;const missingDev=new Set();/* Oct 19: collect families without Attack developments, report them all at the end */
for(const [cls,paths] of Object.entries(PATHS))for(const path of paths){const s={classId:cls,path:path.id,skills:{},cardStats:{},level:7};assert.equal(pathNodes(s).filter(n=>n.category==='Attack').length,6);assert(!canLearn(s,path.id+'-attack-focus2'));assert(learn(s,path.id+'-attack-focus1'));assert(learn(s,path.id+'-attack-focus2'));assert(rollOffer(s,{kind:'behavior'},()=>.1).some(o=>o.slot==='HYBRID'));
 for(const [family,f]of FAMILIES.entries()){if(f.removed||(f.classId??'sword')!==cls||cls==='ranger'&&!RANGER_FAMILIES[path.id].includes(family))continue;if(!ATTACK_DEVELOPMENTS[family]){missingDev.add(family+' '+f.name);continue;}const weapon=makeWeapon(20,()=>.4,0,family),base=weaponStats(weapon,20),invested=withCards(base,s);assert(outputAmount(100,invested,'attack')>outputAmount(100,base,'attack'));assert.equal(outputAmount(100,invested,'ability'),outputAmount(100,base,'ability'));mappings++;}}
assert.deepEqual([...missingDev],[],'families without ATTACK_DEVELOPMENTS: '+[...missingDev].join(', '));assert.equal(pickKind(34),'behavior');assert.equal(pickKind(38),'behavior');for(let family=13;family<=21;family++)assert(eligibleAffixes(family,'behavior').length>=2);
console.log(JSON.stringify({batch:2,mappings,reverseConversion:'Magic behavior -> paid persistent stat candidate',paths:12}));
