import {engageEncounter,party} from './party.js?v=fx-260';
import {specialDemon} from './demon-roster.js?v=fx-260';
import {WORLD,blocked,directionRow} from './simulation.js?v=fx-260';
import {makeWeapon} from './weapons.js?v=fx-260';
import {damageEnemy} from './combat.js?v=fx-260';
import {assignElite} from './elite-powers.js?v=fx-260';
import {enemyHealth,ENEMY_SPEED} from './encounter-space.js?v=fx-260';

export const SHRINES=[
 {id:'blood',name:'Blood Pact',duration:180,risk:'+30% incoming damage for 3 minutes.',reward:'Double elite gold while cursed.'},
 {id:'glass',name:'Glass Warrior',duration:120,risk:'−35% maximum HP for 2 minutes. Lost health is not refunded.',reward:'+50% basic attack damage while cursed.'},
 {id:'bargain',name:"Demon’s Bargain",duration:180,risk:'+20% enemy base movement speed for 3 minutes.',reward:'An additional 15% of weapon drops become Rare. No boost to orange/yellow/red odds.'},
 {id:'forsaken',name:'Forsaken Ground',duration:180,risk:'Healing reduced 75% for 3 minutes.',reward:'+35% XP from crystals collected while cursed.'},
 {id:'hunted',name:'Mark of the Hunted',duration:180,risk:'An empowered elite hunts you for up to 3 minutes.',reward:'Defeat the hunter before expiry for a permanent class-appropriate Rare weapon.'}
];
export const CAMP_TYPES=[
 {id:'crimson',name:'Crimson Warcamp',description:'Defeat its explosive elite and guards. Gain +15% basic damage and a small burn for 4 minutes.',modifier:2},
 {id:'azure',name:'Azure Sanctum',description:'Defeat its frost elite and guards. Gain +15% cooldown recovery and +30% Dash/Blink recovery for 4 minutes.',modifier:0},
 {id:'stone',name:"Stonewarden’s Rest",description:'Defeat its durable guardian and guards. Gain 12% damage reduction and 30% stagger resistance for 4 minutes.',modifier:4}
];
// Oct 16 (user): optional events scale with the run clock — tougher later, and their gold starts small
// (35%) and grows to 3x by 30:00 so late camps/shrines/rifts stay worth it. Playtest values.
// Oct 16 (#13): Ancient Trials in the walled colosseum. One random trial per visit; recharges after.
export const TRIALS=[
 {id:'steel',name:'Trial of Steel',time:90,description:'Defeat the arena champion within 90 seconds. Reward: gold and a 25% weapon chance.'},
 {id:'precision',name:'Trial of Precision',time:30,description:'Five marked strikes fall on you. Evade at least three by moving out or dashing through; two hits fail. Reward: gold and +10% critical chance for 3 minutes.'},
 {id:'survival',name:'Trial of Survival',time:60,description:'Hold the glowing circle for 60 seconds while waves attack. Leaving it for more than 2 seconds fails. Reward: gold and 12% damage reduction for 3 minutes.'},
 {id:'hunter',name:'Trial of the Hunter',time:45,description:'Five marked demons flee from you. Kill them all within 45 seconds. Reward: gold and double elite gold for 3 minutes.'},
 {id:'unbroken',name:'Trial of the Unbroken',time:75,description:'Defeat four waves without taking any damage. Reward: gold and a 60% Rare weapon chance.'}
];
export const TRIAL_RECHARGE=210;
export function worldScale(clock){const t=Math.min(1,Math.max(0,clock/1800));return {hp:1+2*t,damage:1+.6*t,gold:.35+2.65*t};}
// Tucked spots (shrines/camps inside enclosures, Oct 16) use a tighter probe so they stay inside their nook.
export function safeWorldPoint(x,y,props,radius=45,probe=75,step=60){
 for(let ring=0;ring<8;ring++)for(let i=0;i<(ring?12:1);i++){const a=i*Math.PI/6,d=ring*step,p={x:x+Math.cos(a)*d,y:y+Math.sin(a)*d};
  if(p.x<150||p.y<150||p.x>WORLD.width-150||p.y>WORLD.height-150)continue;
  if(!blocked(p.x,p.y,props,radius)&&[0,1,2,3,4,5,6,7].every(k=>!blocked(p.x+Math.cos(k*Math.PI/4)*probe,p.y+Math.sin(k*Math.PI/4)*probe,props,18)))return p;
 }return null;
}
export function createWorldEvents(props,rng=Math.random,landmarks=[]){
 const events=[],add=(kind,x,y,data)=>{const point=landmarks.find(e=>e.name===kind+'-'+(events.filter(e=>e.kind===kind).length+1));const tucked=point&&(kind==='shrine'||kind==='camp'),p=tucked?safeWorldPoint(point.x,point.y,props,26,40,24):safeWorldPoint(point?.x??x,point?.y??y,props);if(p)events.push({key:'world-'+kind+'-'+events.length,kind,...p,status:'ready',active:true,discovered:false,...data});};
 const start=Math.floor(rng()*5);[[2000,1730],[780,1050],[2800,700]].forEach(([x,y],i)=>add('shrine',x,y,{type:SHRINES[(start+i)%5].id}));
 [[900,2050],[2670,1860],[2300,530]].forEach(([x,y],i)=>add('camp',x,y,{type:CAMP_TYPES[i].id,guardians:[],respawn:0}));
 add('rift',2850,2450,{status:'waiting',active:false,at:360+rng()*120,remaining:0,anchors:[],wave:0,waveIn:0});
 add('trial',4600,1900,{status:'ready',trial:null,respawn:0});
 add('merchant',1080,600,{status:'waiting',active:false,at:150+rng()*90,eligible:rng()<.25,remaining:120,stock:null,homeX:1080,homeY:600,row:2,moving:false});
 return {events,rng,curse:null,buffs:{},serial:0};
}
export const worldMarkers=(w,c=null)=>w.events.filter(e=>e.active&&e.status!=='spent').flatMap(e=>[{key:e.key,kind:e.kind,x:e.x,y:e.y,status:e.status,active:true},...(e.kind==='rift'&&e.status==='active'?(e.anchorPoints??[]).flatMap((p,i)=>!c||c.targets.some(t=>t.id===e.anchors[i]&&t.state==='alive')?[{...p,key:e.key+'-anchor-'+i,kind:'anchor',active:true}]:[]):[])]);
// Oct 16 (user): the trial can be started/claimed from anywhere inside the colosseum (radius 600); other landmarks within 150.
const inReach=(e,p)=>e.kind==='trial'?Math.hypot(e.x-p.x,(e.y-p.y)/.72)<600:Math.hypot(e.x-p.x,e.y-p.y)<150;
export function nearWorldEvent(w,p){return w.events.filter(e=>e.active&&e.status!=='spent'&&e.status!=='cooldown'&&inReach(e,p)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];}
export function worldTitle(e){return e.kind==='trial'?(TRIALS.find(x=>x.id===e.trial)?.name??'Ancient Colosseum'):e.kind==='shrine'?SHRINES.find(x=>x.id===e.type).name:e.kind==='camp'?CAMP_TYPES.find(x=>x.id===e.type).name:e.kind==='merchant'?'Wandering Merchant':'Demonic Rift';}
function busy(w){return w.events.filter(e=>e.status==='active').length+(w.curse?.type==='hunted'?1:0);}
function createEnemy(w,s,c,props,center,{leader=false,modifier=0,role=null,eventId=null,heavy=false}={}){
 if(c.targets.filter(e=>e.state==='alive').length>=150||leader&&c.targets.filter(e=>e.state==='alive'&&e.role==='leader').length>=2)return null;
 const p=safeWorldPoint(center.x,center.y,props,leader?28:18);if(!p)return null;
 const scale=worldScale(s.clock),tier=leader?'elite':heavy?'heavy':'swarmer',hp=Math.round(enemyHealth(tier,s.clock)),e={...c.target,...p,id:++s.id,enemy:true,role:role??(leader?'leader':heavy?'bruiser':'swarmer'),worldEvent:eventId,worldLabel:w.events.find(e=>e.key===eventId)?.kind==='camp'?(leader?'GUARDIAN':'GUARD'):w.events.find(e=>e.key===eventId)?.kind==='shrine'?'HUNTER':null,hp,maxHp:hp,hpTier:tier,radius:leader?26:12,scale:leader?2.2:heavy?1.65:1.25,speed:leader?ENEMY_SPEED.leader:heavy?ENEMY_SPEED.bruiser:ENEMY_SPEED.swarmer,xp:leader?65:heavy?40:18,state:'alive',hurt:0,death:0,clock:0,age:0,enraged:false,swing:null,cooldown:.7,moving:false,emerge:.7,attackDamage:Math.round((leader?35:heavy?30:14)*scale.damage)};
 const trial=w.events.find(t=>t.key===eventId&&t.kind==='trial');if(trial){e.encounterRoster=trial.encounterRoster;const slot=trial.rewardSlot=(trial.rewardSlot??0)+1;e.rewardKey='trial:'+trial.key+':'+(trial.incarnation??0)+':'+slot;e.rewardEligible=slot<=40;}
 specialDemon(e,{elite:leader,rift:w.events.find(t=>t.key===eventId)?.kind==='rift'});if(leader)assignElite(e,modifier);c.targets.push(e);return e;
}
function stock(w,s){return [0,1,2].map((slot)=>{const n=w.rng(),rarity=slot===1?(n<.02?3:2):n<.65?0:n<.95?1:n<.995?2:3,weapon=makeWeapon(s.level,w.rng,rarity,null,s.classId??'sword',s.path);return {id:'offer-'+(++w.serial),weapon,sealed:slot===2,bought:false,price:Math.round([100,180,420,1800][rarity]+weapon.ceiling*25+(slot===2?75:0))};});}
export function applyWorldModifiers(w,s,c){
 const type=w.curse?.type,b=w.buffs,has=id=>(b[id]??0)>0;
 const optionalActive=busy(w);if((s.world?.optionalActive??0)>0&&optionalActive===0)s.pressureRestUntil=Math.max(s.pressureRestUntil??0,s.clock+12);
 s.world={optionalActive,incoming:(type==='blood'?1.3:1)*(has('stone')?.88:1)*(has('trialGuard')?.88:1),healing:type==='forsaken'?.25:1,maxHp:type==='glass'?.65:1,xp:type==='forsaken'?1.35:1,eliteGold:(type==='blood'?2:1)*(has('hunterGold')?2:1),enemySpeed:type==='bargain'?1.2:1,rare:type==='bargain',cooldown:has('azure')?1.15:1,dash:has('azure')?1.3:1,stagger:has('stone')?.7:1,riftActive:w.events.some(e=>e.kind==='rift'&&e.status==='active')};
 // Main-menu batch (Oct 16): run modifiers, Blink/Dash shop upgrades and the Endless ramp layer on top.
 const m=s.mods;if(m){s.world.cooldown*=m.cooldown;s.world.dash*=m.cooldown*m.dashRate;s.world.enemySpeed*=m.enemySpeed;s.world.maxHp*=m.maxHp;}if(s.endlessRamp)s.world.incoming*=s.endlessRamp;
 c.worldBasicDamage=(type==='glass'?1.5:1)*(has('crimson')?1.15:1);c.worldBurn=has('crimson');c.worldCrit=has('trialCrit')?.1:0;
 for(const e of c.targets)if(e.role!=='anchor'){e.worldBaseSpeed??=e.speed;e.speed=e.worldBaseSpeed*s.world.enemySpeed*(e.role==='boss'?1:s.daySpeed??1);}
}
export function tickWorldEvents(w,s,c,p,props,dt){const events=[];if(s.dead)return events;
 if(w.curse){w.curse.remaining-=dt;if(w.curse.remaining<=0)w.curse=null;}
 for(const id of Object.keys(w.buffs))w.buffs[id]=Math.max(0,w.buffs[id]-dt);
 for(const e of w.events){
  if(s.timeStop&&e.key!==s.timeStop.trial)continue;
  if(e.active&&Math.hypot(e.x-p.x,e.y-p.y)<500)e.discovered=true;
  if((e.kind==='camp'||e.kind==='trial')&&e.status==='cooldown'){e.respawn-=dt;if(e.respawn<=0){e.status='ready';e.active=true;}}
  if(e.kind==='trial'){if(e.status==='ready'&&!e.trial)e.trial=TRIALS[Math.floor(w.rng()*TRIALS.length)].id;if(e.status==='active')tickTrial(w,e,s,c,p,props,dt,events);}
  if(e.kind==='merchant'){
   if(e.status==='waiting'&&e.eligible&&s.clock>=e.at&&!c.targets.some(x=>x.role==='boss'&&x.state==='alive')){e.status='ready';e.active=true;e.stock=stock(w,s);e.homeX=e.x;e.homeY=e.y;}
   if(e.active){e.remaining-=dt;if(e.remaining<=0){e.active=false;e.status='gone';}else{e.moving=false;if(Math.hypot(p.x-e.x,p.y-e.y)>140){const tx=e.homeX+Math.sin(s.clock*.05)*65,ty=e.homeY+Math.cos(s.clock*.04)*45,dx=tx-e.x,dy=ty-e.y,n=Math.hypot(dx,dy);if(n>3){const x=e.x+dx/n*22*dt,y=e.y+dy/n*22*dt;if(!blocked(x,y,props,15)){e.x=x;e.y=y;e.row=directionRow(dx,dy);e.moving=true;}}}}}
  }
  if(e.kind==='rift'){
   if((e.status==='waiting'||e.status==='cooldown')&&s.clock>=e.at&&!c.targets.some(x=>x.role==='boss'&&x.state==='alive')&&busy(w)<2){e.status='ready';e.active=true;}
   if(e.status==='active'){
    e.remaining-=dt;e.waveIn-=dt;
    if(e.remaining<=0){e.status='cooldown';e.active=false;e.at=s.clock+420;c.targets=c.targets.filter(t=>t.worldEvent!==e.key||t.role!=='anchor');events.push({type:'worldNotice',text:'Rift collapsed. Its bonus was lost; the run continues.'});}
    else if(e.waveIn<=0){e.waveIn=6;e.wave++;const living=c.targets.filter(t=>t.worldEvent===e.key&&t.state==='alive'&&t.role!=='anchor').length;
     for(let i=0;i<Math.min(6,3+Math.floor(e.wave/4),24-living);i++){const a=(e.wave+i)*2.399;createEnemy(w,s,c,props,{x:e.x+Math.cos(a)*190,y:e.y+Math.sin(a)*190},{eventId:e.key,heavy:e.wave>=5&&i===0});}
    }
   }
  }
  if(e.kind==='camp'&&e.type==='stone'&&e.status==='active'){const guardian=c.targets.find(t=>t.id===e.guardians[0]&&t.state==='alive');if(guardian){guardian.stompIn=(guardian.stompIn??4)-dt;if(guardian.stompIn<=0&&Math.hypot(guardian.x-p.x,guardian.y-p.y)<220){guardian.stompIn=6;events.push({type:'worldStomp',x:guardian.x,y:guardian.y,owner:guardian.id});}}}
 }
 applyWorldModifiers(w,s,c);return events;
}
export function processWorldDeaths(w,s,c,events){
 for(const e of w.events){
  if(e.kind==='camp'&&e.status==='active'&&e.guardians.length&&e.guardians.every(id=>!c.targets.some(t=>t.id===id&&t.state==='alive'))){w.buffs[e.type]=240;e.status='cooldown';e.respawn=360;events.push({type:'worldNotice',text:worldTitle(e)+' cleared · blessing for 4 minutes.'});}
  if(e.kind==='rift'&&e.status==='active'&&e.anchors.length===3&&e.anchors.every(id=>!c.targets.some(t=>t.id===id&&t.state==='alive'))){e.status='reward';e.loot={goldDelta:Math.round(200*worldScale(s.clock).gold),weapon:w.rng()<.15?makeWeapon(s.level,w.rng,null,null,s.classId??'sword',s.path):null};events.push({type:'worldNotice',text:'Rift sealed! Return to its portal to claim the reward.'});}
 }
 if(w.curse?.type==='hunted'&&events.some(e=>e.type==='death'&&e.id===w.curse.hunterId)){const shrine=w.events.find(e=>e.key===w.curse.shrineKey);shrine.status='reward';shrine.loot={goldDelta:0,weapon:makeWeapon(s.level,w.rng,2,null,s.classId??'sword',s.path)};w.curse=null;events.push({type:'worldNotice',text:'Hunter defeated · claim your Rare weapon at the shrine.'});}
}
export function actWorld(w,e,s,c,p,props,action,commit=()=>false){
 if(s.dead||!e||!e.active||!inReach(e,p))return {error:'Move closer to the landmark.'};
 if(e.kind==='shrine'&&e.status==='reward'&&['gold','heal','cache'].includes(action)){
  if(action==='heal'&&s.hp>=s.maxHp)return {error:'You are already at full health.'};
  const loot={id:e.key+':shrine',goldDelta:action==='gold'?e.loot.goldDelta:0,weapon:action==='cache'?e.loot.weapon:null,anchor:e.rewardAnchor};
  if(!commit(loot))return {error:'Save failed; reward remains available.'};if(action==='heal')s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.35);e.status='spent';e.loot=null;return {ok:true};
 }
 if(action==='claim'&&e.status==='reward'){if(!commit(e.loot))return {error:'Save failed or inventory changed; reward remains unclaimed.'};e.loot=null;e.status=e.kind==='rift'||e.kind==='trial'?'cooldown':'spent';if(e.kind==='trial'){e.incarnation=(e.incarnation??0)+1;delete e.encounterRoster;e.respawn=TRIAL_RECHARGE;e.trial=null;}if(e.kind==='rift'){e.active=false;e.at=s.clock+420;}return {ok:true};}
 if(e.kind==='merchant'){
  const offer=e.stock?.find(o=>o.id===action);if(!offer||offer.bought||e.remaining<=0)return {error:'That offer is no longer available.'};
  if(!commit({goldDelta:-offer.price,weapon:offer.weapon}))return {error:'Not enough gold, unresolved forge choice, or save changed. Nothing purchased.'};offer.bought=true;return {ok:true};
 }
 if(!['accept','start'].includes(action))return {error:'Choose an explicit action.'};
 if(e.status!=='ready')return {error:'This encounter is already active or has been used.'};
 if(e.kind==='shrine'){e.status='reward';e.loot={goldDelta:Math.round(120*worldScale(s.clock).gold),weapon:makeWeapon(s.level,w.rng,1,null,s.classId??'sword',s.path)};e.rewardAnchor={x:p.x,y:p.y};return {ok:true};}
 if(busy(w)>=2)return {error:'Finish another optional encounter first.'};
 if(e.kind==='trial')return startTrial(w,e,s,c,p,props);
 if(e.kind==='camp'){
  const spec=CAMP_TYPES.find(x=>x.id===e.type),leader=createEnemy(w,s,c,props,e,{leader:true,modifier:spec.modifier,eventId:e.key});if(!leader)return {error:'Two elite packs are active or the battlefield is full. Try later.'};
  if(e.type==='stone'){leader.hp=Math.round(leader.hp*1.4);leader.maxHp=leader.hp;leader.scale=2.5;}e.guardians=[leader.id];
  for(const offset of [-70,70]){const guard=createEnemy(w,s,c,props,{x:e.x+offset,y:e.y+60},{eventId:e.key,heavy:true});if(guard)e.guardians.push(guard.id);}e.status='active';return {ok:true};
 }
 if(e.kind==='rift'){
  if(c.targets.filter(t=>t.state==='alive').length>147)return {error:'Too many enemies to open three anchors safely. Clear space first.'};
  const points=[];for(let i=0;i<3;i++){const a=i*Math.PI*2/3,q=safeWorldPoint(e.x+Math.cos(a)*155,e.y+Math.sin(a)*155,props,25);if(!q||points.some(x=>Math.hypot(q.x-x.x,q.y-x.y)<90))return {error:'No clear anchor positions here.'};points.push(q);}
  e.anchorPoints=points;e.anchors=points.map(q=>{const hp=Math.round(1100*(1+.6*Math.min(1,s.clock/1800))),t={...c.target,...q,id:++s.id,role:'anchor',enemy:true,noDrain:true,worldEvent:e.key,state:'alive',hp,maxHp:hp,radius:18,scale:1,speed:0,xp:0,emerge:0,hurt:0,death:0,clock:0,swing:null};c.targets.push(t);return t.id;});e.status='active';e.remaining=90;e.wave=0;e.waveIn=2;return {ok:true};
 }return {error:'Nothing to activate.'};
}
export function forceWorldEvent(w,kind,s){const e=w.events.find(x=>x.kind===kind);if(!e||['active','reward'].includes(e.status))return false;e.at=s.clock;e.active=true;e.status='ready';e.discovered=true;if(kind==='merchant'){e.eligible=true;e.remaining=120;e.stock??=stock(w,s);}return true;}

// ---------------- Ancient Trials ----------------
function trialSpawn(w,e,s,c,props,n,{heavy=false,radius=260}={}){const out=[];for(let i=0;i<n;i++){const a=w.rng()*Math.PI*2,q={x:e.x+Math.cos(a)*radius,y:e.y+Math.sin(a)*radius*.7};const m=createEnemy(w,s,c,props,q,{eventId:e.key,heavy:heavy&&i===0});if(m)out.push(m);}return out;}
function startTrial(w,e,s,c,p,props){
 const spec=TRIALS.find(x=>x.id===e.trial);if(!spec)return {error:'The colosseum is silent.'};
 engageEncounter(e);e.rewardAnchor={x:p.x,y:p.y};party.activeEncounter=e;Object.assign(e,{rewardSlot:0,sealed:false,status:'active',remaining:spec.time,progress:0,fails:0,strikeIn:1.5,strikes:0,outside:0,waveIn:0,wave:0,hitTaken:false,spawned:[],pending:null});
 if(spec.id==='steel'){const champ=createEnemy(w,s,c,props,e,{leader:true,modifier:Math.floor(w.rng()*7),eventId:e.key});if(!champ){e.status='ready';party.activeEncounter=null;return {error:'The battlefield is too crowded; try again shortly.'};}champ.hp=champ.maxHp=Math.round(champ.hp*1.6);champ.worldLabel='CHAMPION';e.spawned=[champ.id];}
 if(spec.id==='hunter')e.spawned=trialSpawn(w,e,s,c,props,5,{radius:200}).map(m=>(m.flee=true,m.worldLabel='QUARRY',m.speed*=1.15,m.worldBaseSpeed=m.speed,m.id));
 return {ok:true};
}
function trialEnd(w,e,s,c,success,events){
 if(party.activeEncounter===e)party.activeEncounter=null;const spec=TRIALS.find(x=>x.id===e.trial),g=worldScale(s.clock).gold;
 if(!success)for(const t of c.targets)if(t.worldEvent===e.key&&t.state==='alive'){t.state='dead';t.death=1.5;}
 if(!success){e.status='cooldown';e.respawn=TRIAL_RECHARGE*.6;e.trial=null;events.push({type:'worldNotice',text:spec.name+' failed · the colosseum will open again soon'});return;}
 const gold={steel:220,precision:120,survival:150,hunter:120,unbroken:200}[spec.id];
 events.push({type:'trialComplete',id:e.key+':'+(e.incarnation??0),eligibleOwners:e.encounterRoster??['0'],anchor:e.rewardAnchor??{x:e.x,y:e.y},gold:Math.round(gold*g)});e.status='cooldown';e.respawn=TRIAL_RECHARGE;e.incarnation=(e.incarnation??0)+1;e.trial=null;delete e.encounterRoster;events.push({type:'worldNotice',text:spec.name+' complete! Personal rewards granted at its entrance.'});
}
function tickTrial(w,e,s,c,p,props,dt,events){
 const spec=TRIALS.find(x=>x.id===e.trial);if(!spec)return;e.remaining-=dt;const mine=c.targets.filter(t=>t.worldEvent===e.key&&t.state==='alive');
 if((spec.id==='steel'||spec.id==='hunter')&&!mine.length)return trialEnd(w,e,s,c,true,events);
 if(spec.id==='precision'){e.strikeIn-=dt;if(e.strikeIn<=0&&e.strikes<5){e.strikeIn=4.2;e.strikes++;e.pending={x:p.x,y:p.y,t:1.4};(c.hazards??[]).push({kind:'explosion',x:p.x,y:p.y,radius:110,age:0,warning:1.4,duration:.4,owner:-1,death:true,fired:true,damage:0});}
  if(e.pending){e.pending.t-=dt;if(e.pending.t<=0){const hit=Math.hypot(p.x-e.pending.x,(p.y-e.pending.y)/.65)<110&&!p.invulnerable;if(hit){e.fails++;s.hp=Math.max(1,s.hp-Math.ceil(s.maxHp*.1));s.hurt=.4;events.push({type:'worldNotice',text:'Struck! ('+e.fails+'/2)'});}else{e.progress++;events.push({type:'worldNotice',text:'Evaded · '+e.progress+'/3'});}e.pending=null;}}
  if(e.fails>=2)return trialEnd(w,e,s,c,false,events);if(e.progress>=3)return trialEnd(w,e,s,c,true,events);}
 if(spec.id==='survival'){const inside=Math.hypot(p.x-e.x,(p.y-e.y)/.65)<150;e.outside=inside?0:e.outside+dt;if(e.outside>2)return trialEnd(w,e,s,c,false,events);
  e.waveIn-=dt;if(e.waveIn<=0){e.waveIn=5;trialSpawn(w,e,s,c,props,4,{heavy:e.remaining<30});}if(e.remaining<=0)return trialEnd(w,e,s,c,true,events);}
 if(spec.id==='unbroken'){if(s.hurt>.3)e.hitTaken=true;if(e.hitTaken)return trialEnd(w,e,s,c,false,events);
  e.waveIn-=dt;if(e.wave<4&&e.waveIn<=0&&!mine.length){e.wave++;e.waveIn=1;trialSpawn(w,e,s,c,props,5,{heavy:e.wave>=3});}
  else if(e.wave>=4&&!mine.length)return trialEnd(w,e,s,c,true,events);}
 if(e.status==='active'&&e.remaining<=0)return trialEnd(w,e,s,c,false,events);
}
// Trial ground ring (survival circle / arena marker).
export function drawTrialGround(ctx,e,time){if(e.kind!=='trial'||!e.active)return;const surv=e.status==='active'&&e.trial==='survival',R=surv?150:60;ctx.save();ctx.strokeStyle=surv?'#9dffc0':'#f0d290';ctx.lineWidth=surv?4:2;ctx.globalAlpha=.5+.3*Math.sin(time*4);ctx.beginPath();ctx.ellipse(e.x,e.y,R,R*.65,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
// Oct 16 (user): an active trial seals the colosseum like a boss pit. While you are inside, time stops outside it and
// no outside enemy may enter; trial enemies stay inside. Leaving mid-trial fails it (as leaving a pit resets its boss).
export function sealTrialArena(w,arenas,s,c,p){
 const events=[],a=arenas.find(x=>x.kind==='colosseum'),e=w.events.find(x=>x.kind==='trial'&&x.status==='active');
 if(!a||s.dead)return events;
 if(!e){for(const t of c.targets)if(t.pit===a.id)t.pit=null;return events;}
 if(Math.hypot(p.x-a.x,(p.y-a.y)/.72)>=a.radius){trialEnd(w,e,s,c,false,events);events.push({type:'worldNotice',text:'You left the colosseum'});return events;}
 if(!e.sealed){e.sealed=true;events.push({type:'worldNotice',text:'The colosseum seals · time stands still outside'});}
 const owners=new Set();
 for(const t of c.targets){if(t.state!=='alive')continue;const dx=t.x-a.x,dy=(t.y-a.y)/.72,d=Math.hypot(dx,dy)||1;
  if(t.worldEvent===e.key){t.pit=a.id;owners.add(t.id);const R=a.radius-40;if(d>R){t.x=a.x+dx/d*R;t.y=a.y+dy/d*R*.72;}}
  else if(!t.pit&&t.role!=='anchor'){const R=a.radius+16;if(d<R){t.x=a.x+dx/d*R;t.y=a.y+dy/d*R*.72;}}}
 s.timeStop={pit:a.id,trial:e.key,bossId:null,owners};return events;
}
