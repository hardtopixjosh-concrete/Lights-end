import {blessingStats} from './boss-choices.js?v=fx-260';
import {applyGameplayRunes} from './progression.js?v=fx-260';
import {outputAmount} from './core-rules.js?v=fx-260';
import {developmentStats} from './developments.js?v=fx-260';
import {pathNodes,rank,canLearn,learn,nodeById,cardStat} from './specializations.js?v=fx-260';
// Oct 15 card leveling. Stat cards every level, spell cards every fifth level.
// Values are playtest seeds; rarity multiplies the base value.
export const STAT_CARDS=[
 {id:'attackPower',name:'Attack Power',stat:'attack',value:.08,text:v=>'+'+pct(v)+' attack damage'},
 {id:'abilityPower',name:'Ability Power',stat:'ability',value:.08,text:v=>'+'+pct(v)+' ability damage'},
 {id:'power',name:'Power',stat:'damage',value:.04,text:v=>'+'+pct(v)+' damage'},
 {id:'haste',name:'Haste',stat:'attackSpeed',value:.08,cap:1.5,text:v=>'+'+pct(v)+' attack speed'},
 {id:'swift',name:'Swiftness',stat:'move',value:.06,cap:.4,text:v=>'+'+pct(v)+' movement speed'},
 {id:'magnet',name:'Magnetism',stat:'pickup',value:.25,text:v=>'+'+pct(v)+' XP orb pickup range'},
 {id:'vigor',name:'Vigor',stat:'maxHp',value:.08,text:v=>'+'+pct(v)+' maximum health'},
 {id:'focus',name:'Focus',stat:'cooldown',value:.05,cap:.40,text:v=>'-'+pct(v)+' spell cooldowns'},
 {id:'reach',name:'Reach',stat:'area',value:.08,text:v=>'+'+pct(v)+' spell and attack area'},
 {id:'precision',name:'Precision',stat:'crit',value:.05,cap:.35,text:v=>'+'+pct(v)+' critical chance'},
 {id:'brutality',name:'Brutality',stat:'critDamage',value:.2,cap:.75,text:v=>'+'+pct(v)+' critical damage'},
 {id:'wisdom',name:'Wisdom',stat:'xp',value:.08,text:v=>'+'+pct(v)+' XP gained'},
 {id:'greed',name:'Greed',stat:'gold',value:.10,text:v=>'+'+pct(v)+' gold found'},
 {id:'wellspring',name:'Wellspring',stat:'energyMax',value:.10,mage:true,text:v=>'+'+pct(v)+' maximum energy'},
 {id:'flow',name:'Arcane Flow',stat:'energyRegen',value:.20,mage:true,text:v=>'+'+pct(v)+' energy regeneration'}
];
export const RARITIES=[{id:'common',name:'Common',mult:1,weight:70},{id:'rare',name:'Rare',mult:1.5,weight:24},{id:'epic',name:'Epic',mult:2,weight:6}];
const pct=v=>Math.round(v*100)+'%';
const pick=(list,rng)=>list.splice(Math.floor(rng()*list.length),1)[0];
function rollRarity(rng,min=0){let r=rng()*100,i=0;for(;i<RARITIES.length-1;i++){if(r<RARITIES[i].weight)break;r-=RARITIES[i].weight;}return RARITIES[Math.max(min,i)];}
function statOption(s,card,rng,minRarity=0){const cap=Math.min(card.cap??Infinity,s.statCaps?.[card.stat]??Infinity),rarity=rollRarity(rng,minRarity),value=card.value*rarity.mult,room=!Number.isFinite(cap)?value:Math.max(0,Math.min(value,cap-cardStat(s,card.stat)));return {type:'stat',id:card.id,name:card.name,rarity:rarity.id,stat:card.stat,value:room,description:card.text(room)};}
const nodeOption=n=>({type:n.tier===0?'spell':'behavior',id:n.id,slot:n.ability,name:n.name,description:n.description,spell:n.tier?nodeById(n.root)?.name:null,tier:n.tier});
function statPool(s){return STAT_CARDS.filter(c=>!(s.banished??[]).includes(c.id)&&(!c.mage||s.classId==='mage')&&(cardStat(s,c.stat)<Math.min(c.cap??Infinity,s.statCaps?.[c.stat]??Infinity)-1e-6));}
export const unownedSpells=s=>pathNodes(s).filter(n=>n.tier===0&&!rank(s,n.id));
export const learnableBehaviors=s=>pathNodes(s).filter(n=>!(s.banished??[]).includes(n.id)&&n.tier>0&&!rank(s,n.id)&&canLearn(s,n.id));
// Spell picks offer only the remaining spells (R only once RMB/Q/E are owned).
// Behavior picks offer behaviors for owned spells. Others are stat cards.
export const offerableSpells=s=>{const left=unownedSpells(s),basic=left.filter(n=>n.ability!=='R');return basic.length?basic:left;};
export function rollOffer(s,pickInfo,rng=Math.random){
 const options=[],stats=statPool(s);
 if(pickInfo.kind==='spell'){const spells=offerableSpells(s);if(spells.length){while(options.length<3&&spells.length)options.push(nodeOption(pick(spells,rng)));return options;}}
 // Augment picks (Oct 16, user): the whole talent tree is shown; every learnable augment is an option.
 if(pickInfo.kind!=='stat'){const pool=learnableBehaviors(s);if(pool.length){if(pickInfo.bonus){while(options.length<3&&pool.length)options.push(nodeOption(pick(pool,rng)));return options;}return pool.map(nodeOption);}if(pickInfo.bonus)return [];while(options.length<3&&stats.length)options.push(statOption(s,pick(stats,rng),rng,1));return options;}
 while(options.length<3&&stats.length)options.push(statOption(s,pick(stats,rng),rng));
 return options;
}
export function currentOffer(s,rng=Math.random){if(s.pendingPicks?.[0]?.bonus&&!learnableBehaviors(s).length){const i=s.pendingPicks.findIndex(p=>!p.bonus);if(i<0)return null;s.pendingPicks.unshift(s.pendingPicks.splice(i,1)[0]);s.offer=null;}const next=s.pendingPicks?.[0];if(!next||s.dead)return null;if(!s.offer||s.offer.level!==next.level||s.offer.kind!==next.kind)s.offer={level:next.level,kind:next.kind,bonus:!!next.bonus,options:rollOffer(s,next,rng)};return s.offer;}
export function chooseOffer(s,index){const offer=s.offer,option=offer?.options?.[index];if(!option||s.dead)return false;
 if(option.type==='stat'){(s.cardStats??={})[option.stat]=cardStat(s,option.stat)+option.value;(s.cardHistory??=[]).push({id:option.id,rarity:option.rarity,value:option.value});}
 else if(!learn(s,option.id))return false;
 s.pendingPicks.shift();s.offer=null;return option;}
// Banish removes only that card for the run; remaining offers keep their exact rolls. Heal skips the pick.
export function banishOption(s,i){
 const offer=s.offer,o=offer?.options?.[i];if(!Number.isInteger(i)||!o||o.type!=='stat'||offer.kind!=='stat'||s.dead)return false;
 (s.banished??=[]).push(o.id);offer.options.splice(i,1);
 // If every card was deliberately banished, finish this pick without granting a stat.
 if(!offer.options.length){s.pendingPicks.shift();s.offer=null;}
 return o;
}
export function healInstead(s,amount){if(!s.pendingPicks?.length||s.dead||s.offer?.kind==='spell')return false;s.pendingPicks.shift();s.offer=null;s.hp=Math.min(s.maxHp,s.hp+amount);return true;}
export function cardSummary(s){return STAT_CARDS.filter(c=>cardStat(s,c.stat)>0).map(c=>({name:c.name,description:c.text(cardStat(s,c.stat))}));}
// Card stats layered onto the equipped weapon's derived stats.
export function withCards(w,s){if(!w)return w;w=developmentStats(applyGameplayRunes(w,s),s);const blessing=blessingStats(s);w={...w,health:(w.health??1)+blessing.maxHp,output:{...w.output,damage:(w.output?.damage??0)+blessing.damage,healing:(w.output?.healing??0)+blessing.support,barrier:(w.output?.barrier??0)+blessing.support}};s.statCaps={attackSpeed:Math.max(0,2.5/w.speed-1),crit:Math.max(0,.6-w.crit),critDamage:Math.max(0,2.5-w.critDamage),move:Math.max(0,.4-(w.move-1))};const result={...w,output:{...w.output,damage:(w.output?.damage??0)+cardStat(s,'damage'),attack:(w.output?.attack??0)+cardStat(s,'attack'),ability:(w.output?.ability??0)+cardStat(s,'ability')},speed:Math.min(2.5,(w.speed??1)*(1+cardStat(s,'attackSpeed'))),crit:Math.min(.6,(w.crit??0)+cardStat(s,'crit')),critDamage:Math.min(2.5,(w.critDamage??1.5)+cardStat(s,'critDamage')),aoe:(w.aoe??1)*(1+cardStat(s,'area')),gold:(w.gold??1)*(1+cardStat(s,'gold'))};return {...result,damage:outputAmount(1,result,'attack'),abilityOutput:outputAmount(1,result,'ability'),barrierOutput:outputAmount(1,result,'barrier')};}
