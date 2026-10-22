// Coefficients below absorb the former Mage-only x2; shared output has no class exception.
import {bloodAbility} from './blood-mage.js?v=fx-260';
import {rank,talentBonus} from './specializations.js?v=fx-260';
function baseMageAbility(s,kind){
 const path=s.path??'pyro',r=id=>rank(s,id),spec={kind,cost:0,cooldown:0,duration:.45,element:path};
 if(kind==='fireball')return {...spec,name:path==='pyro'?'Fireball':path==='cryo'?'Ice Road':'Lightning Bolt',cost:18,cooldown:.5,duration:.44,damage:path==='pyro'?170:path==='cryo'?170:130,radius:85*(1+.15*r('searing')),pierce:path==='cryo'?(r('spear')?4:1):1,elite:1+.15*r('molten'),chill:.2*(1+.15*r('cold'))};
 if(kind==='nova')return {...spec,name:path==='pyro'?'Flame Ward':path==='cryo'?'Frost Nova':'Static Guard',cost:30,cooldown:2.5,radius:path==='cryo'?225*(1+.15*r('glacial')):180,damage:50,barrier:path==='pyro'?35+15*r('ward'):path==='cryo'?20*r('armor'):30+15*r('stormward'),wardTime:3+r('wardtime'),freeze:1.2,chill:.2*(1+.15*r('cold'))};
 if(kind==='chain')return {...spec,name:path==='pyro'?'Flame Surge':path==='cryo'?'Glacial Burst':'Chain Lightning',cost:28,cooldown:.8,duration:.4,damage:path==='pyro'?110:path==='cryo'?150:90*(1+.12*r('overcurrent')),radius:path==='cryo'?140:125,targets:10+2*r('conductivity'),freeze:.7*(1+.2*r('permafrost')),chill:.2*(1+.15*r('cold')),chillTime:2*(1+.2*r('permafrost')),frozenBonus:1+.15*r('shatter')};
 if(kind==='meteor')return {...spec,name:path==='pyro'?(r('stars')?'Falling Stars':'Meteor'):path==='cryo'?'Blizzard':'Tempest',cost:60,cooldown:8,duration:.6,damage:path==='pyro'?800*(1+.2*r('infernal')):path==='cryo'?140:64*(1+.15*r('tempest')),radius:path==='pyro'?160:path==='cryo'?240*(1+.15*r('winter')):180,life:5+(path==='cryo'&&r('iceage')||path==='storm'&&r('thunder')?2:0),interval:path==='cryo'?.7:.5,stars:!!r('stars'),iceage:!!r('iceage')};
 return {...spec,name:'Blink',cooldown:3,duration:.2};
}

// Oct 15 user decision: Stormcaller casts Chain Lightning from RMB and a new Vortex from E (Lightning Bolt removed).
// Oct 16 (user): E is Storm Rod — 2 charges (user, Oct 16; more via talents later); after the last one an 8s cooldown refills both; rods last 8s, zap up to 10 nearby, arcs link rods.
const STORM_VORTEX={kind:'chain',spell:'rod',name:'Storm Rod',cost:15,cooldown:8,duration:.25,element:'storm',damage:28,radius:120,maxTargets:10,interval:.5,life:8,charges:2,linkRange:500,arcDamage:24};
export function mageAbility(s,kind){
 if(s.path==='blood')return bloodAbility(s,kind);
 const storm=s.path==='storm',a=storm&&kind==='fireball'?{...baseMageAbility(s,'chain'),kind:'fireball',spell:'chain'}:storm&&kind==='chain'?{...STORM_VORTEX,life:STORM_VORTEX.life+4*rank(s,'maelstrom')}:baseMageAbility(s,kind),key={fireball:'RMB',nova:'Q',chain:'E',meteor:'R',blink:'SPACE'}[kind],b=stat=>talentBonus(s,stat,key);
 return {...a,outerDamage:(kind==='meteor'&&a.element==='pyro'?400:250)*(1+b('damage')),damage:(a.damage??0)*(1+b('damage')),cost:(a.cost??0)*Math.max(.6,1-b('cost')),cooldown:a.cooldown*Math.max(.6,1-b('cooldown')),radius:(a.radius??0)*(1+b('radius')),range:(kind==='fireball'?650:560)*(1+b('range'))+(kind==='blink'?0:s.weaponPassives?.spellRange??0),speed:500*(1+b('speed')),contactRadius:10*(1+b('radius')),pierce:(a.pierce??1)+b('pierce'),targets:(a.targets??1)+b('targets'),freeze:(a.freeze??0)*(1+b('duration')),life:(a.life??0)*(1+b('duration')),wardTime:(a.wardTime??0)*(1+b('duration')),barrier:(a.barrier??0)*(1+b('barrier'))};
}
