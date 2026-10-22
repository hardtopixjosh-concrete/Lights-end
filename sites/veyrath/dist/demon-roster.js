// Appearance is separate from HP, rewards, pressure and weapon interactions.
export const HD_MODEL_ANIMS={tyrant1:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Break'],tyrant2:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Break'],tyrant3:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Die1'],colossus1:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Break'],colossus2:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Break'],colossus3:[...['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload'],'Die1'],wyrm1:[...['Idle','Run','TakeDamage1','Breath','Burrow','Emerge','Tail','Charge','ClawL','ClawR','Spit'],'Shed'],wyrm2:[...['Idle','Run','TakeDamage1','Breath','Burrow','Emerge','Tail','Charge','ClawL','ClawR','Spit'],'Die1'],prophet:['Idle','Run','TakeDamage1','Die1','Cast','Summon','Thrust','Scythe']};
export const DEMON_SHEETS=['demon-melee','demon-caster','demon-elite','demon-rift','demon-imp2','demon-imp3','demon-imp4','golem'].flatMap(p=>['Idle','Run','Attack1','TakeDamage1','Die1'].map(a=>p+'-'+a)).concat(['golem-Charge','golem-Throw','golem-Pound'],['Idle','Run','Attack1','TakeDamage1','Die1','CrossChop','Throw','Hook','Slam','Spin'].map(a=>'butcher-'+a),
 // Oct 17: custom HD models for the Obsidian Colossus (one per phase), Dune Wyrm (armoured/exposed) and Hollow Prophet.
 ...Object.entries(HD_MODEL_ANIMS).flatMap(([m,list])=>list.map(a=>m+'-'+a)));
// Oct 18 (user): one imp model per run (wave-roster.js rollRoster); an explicit rng still picks at random.
let runImp=null;export function setRunImp(skin){runImp=skin;}
export function basicImp(rng){if(!rng&&runImp)return {skin:runImp,enemyName:'Dune Imp',bodyHalfWidth:20,bodyHeight:70};rng??=Math.random;const skins=['imp','demon-imp2','demon-imp3','demon-imp4'];return {skin:skins[Math.min(3,Math.max(0,Math.floor(rng()*4)))],enemyName:'Dune Imp',bodyHalfWidth:20,bodyHeight:70};}
export function regularDemon(time,targets,rng=Math.random){
 if(time>=180&&targets.filter(e=>e.state==='alive'&&e.role==='caster').length<(time>=360?4:2)&&rng()<.15)return {role:'caster',skin:'demon-caster',bodyHalfWidth:22,bodyHeight:65,enemyName:'Ash Hexer',scale:1.55,speed:54.9,attackDamage:10,shotCD:2.2};
 return basicImp(rng);
}
export function specialDemon(e,{rift=false,elite=false}={}){
 if(elite)Object.assign(e,{skin:'demon-elite',bodyHalfWidth:25,bodyHeight:72,scale:2.3,specialKind:'elite'});
 else if(rift)Object.assign(e,{skin:'demon-rift',bodyHalfWidth:25,bodyHeight:75,scale:e.role==='bruiser'?2.3:2,specialKind:'rift',enemyName:e.role==='bruiser'?'Rift Brute':'Rift Ravager'});
 else if(e.role==='bruiser')Object.assign(e,{skin:'demon-melee',bodyHalfWidth:24,bodyHeight:72,enemyName:'Ashbound Brute'});
 return e;
}
const WAVE_NAME_COLOR={tank:'#b9c7d8',ranged:'#b4d9d9',fast:'#ffd27a',speed:'#ff9a7a'};
export function enemyIdentity(e){
 if(e.role==='boss')return {name:e.name??'DUNE RAVAGER',color:'#f4b96e',bold:true};
 if(e.role==='leader')return {name:((e.eliteName??'ELITE')+' '+(e.worldLabel??'CHAMPION')).toUpperCase(),color:'#d6a0ff',bold:true};
 if(e.specialKind==='rift')return {name:e.enemyName.toUpperCase(),color:'#ffae55',bold:true};
 if(e.worldLabel)return {name:e.worldLabel.toUpperCase(),color:'#e7cf9c',bold:true};
 if(e.waveCat&&e.waveCat!=='imp')return {name:e.enraged?'ENRAGED '+e.enemyName.toUpperCase():e.enemyName.toUpperCase(),color:WAVE_NAME_COLOR[e.waveCat],bold:e.waveCat==='tank'||e.waveCat==='ranged'};
 if(e.role==='caster')return {name:'ASH HEXER',color:'#b4d9d9',bold:true};
 if(['charger','guardian','summoner'].includes(e.role))return {name:e.enemyName,color:{charger:'#ffb35c',guardian:'#b9c7d8',summoner:'#b6f29a'}[e.role],bold:true};
 return {name:e.enraged?'ENRAGED':e.role==='bruiser'?'ASHBOUND BRUTE':'',color:'#e7c9a0',bold:false};
}
