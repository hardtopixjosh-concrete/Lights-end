// Multiplayer Phase 1 (Oct 17, user: online co-op, up to 5 players; plan docs/multiplayer-plan.md).
// The party. players[0] is always the local player (game.js `player`, whose HP still lives in survival through getters).
// Every other member is a plain record driven by one command per tick ({move,aim,attack}). Today the command comes from
// the F2 test-bot AI; in Phase 3 it comes from the network (host-authoritative). Simulation only: drawing lives in game.js.
import {WORLD,slideMove,directionRow,blocked} from './simulation.js?v=fx-260';
import {damageEnemy} from './combat.js?v=fx-260';

export const PARTY={
 max:5,
 revive:{time:3,range:70,hp:.35,decay:.5},   // approved default: stand ~3 s next to a downed teammate; revived at 35% HP
 retarget:.6,stick:120,                      // enemies re-pick the nearest standing player every ~.6 s; their current target counts 120px closer
 hpPerExtra:{normal:.35,elite:.5,boss:.6},   // implementation defaults, to tune: enemy HP +x per extra player
 spawnPerExtra:.25,                          // implementation default, to tune: spawn rate +25% per extra player
 bot:{castEvery:[1.4,3.2],dashBelow:.35,dashCd:4,hp:260,speed:.95,leash:240,catchUp:1300,aggro:480,reviveSeek:650,
  kits:{
   sword:{range:64,kitRange:58,cd:.55,dmg:26,arc:1.1,sheet:'knight',attack:'Melee'},
   ranger:{range:380,kitRange:520,cd:.5,dmg:18,shot:820,sheet:'ranger',attack:'QuickShot',color:'#f2d27a'},
   mage:{range:340,kitRange:420,cd:.62,dmg:21,shot:600,sheet:'mage',attack:'Attack1',color:'#8fd4ff'}}},
 names:['You','Brann','Seren','Kael','Ysolde'],
 colors:['#f0c75e','#7fd1ff','#9be37a','#e98bff','#ff9a6b'],
};
export const party={players:[],clock:0,shots:[]};

export const standing=p=>!!p&&!p.downed&&!p.dead&&!p.encounterWaiting;
export const memberIdentity=p=>String(p.steam??p.id);
export function engageEncounter(e){if(!e.encounterRoster)e.encounterRoster=party.players.filter(p=>!p.dead).map(memberIdentity);if(!e.encounterRoster.length)e.encounterRoster=['0'];return e.encounterRoster;}
export function encounterEligible(p,targets){return !(party.activeEncounter?.status==='active'&&!party.activeEncounter.encounterRoster.includes(memberIdentity(p)))&&!targets.some(e=>e.state==='alive'&&!e.sleeping&&!e.leashing&&e.encounterRoster&&!e.encounterRoster.includes(memberIdentity(p)));}
export const playerById=id=>party.players.find(p=>p.id===id);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const unit=(dx,dy)=>{const d=Math.hypot(dx,dy);return d>1e-6?{x:dx/d,y:dy/d}:{x:0,y:0};};
const tier=e=>e.role==='boss'?'boss':e.role==='leader'||e.miniBoss?'elite':'normal';

export function setLocal(p){p.local=true;p.revive=0;p.id=0;p.name=PARTY.names[0];p.color=PARTY.colors[0];party.players[0]=p;}
export function clearAllies(){party.activeEncounter=null;party.players.length=Math.min(1,party.players.length);party.shots.length=0;}
export function allies(){return party.players.filter(p=>!p.local);}

// Online co-op (Oct 17): a real player joining the host's run. Same record as a bot, but its command comes from the network.
export function addRemote(steam,classId,name,s){const p=addBot(classId,s);if(!p)return null;p.bot=false;p.remote=true;p.steam=String(steam);p.name=String(name||'Friend').slice(0,24);p.netPress=[];p.netMove={x:0,y:0};p.netAim=null;p.netSeq=0;p.netAck=0;return p;}
export function removeRemote(steam){const i=party.players.findIndex(p=>p.remote&&p.steam===String(steam));if(i>0)party.players.splice(i,1);}
export function addBot(classId,s){
 const local=party.players[0];if(!local||party.players.length>=PARTY.max)return null;
 const ids=new Set(party.players.map(p=>p.id));let id=1;while(ids.has(id))id++;
 const kits=PARTY.bot.kits,cls=kits[classId]?classId:'sword',a=id*2.1,maxHp=Math.max(PARTY.bot.hp,Math.round(s?.maxHp??0));
 const p={id,ally:true,bot:true,name:PARTY.names[id]??('Ally '+id),color:PARTY.colors[id]??'#ffffff',classId:cls,x:local.x+Math.cos(a)*60,y:local.y+Math.sin(a)*45,row:2,frame:0,moving:false,
  hp:maxHp,maxHp,downed:false,revive:0,grace:0,hurt:0,cd:0,atk:0,invulnerable:false,cmd:null};
 party.players.push(p);return p;
}

// Enemies call this instead of reading "the player". With one player it is a no-op.
export function targetFor(e,fallback){
 const ps=party.players;if(ps.length<2)return fallback;
 const cur=e.tgtId!=null?playerById(e.tgtId):null;
 if(standing(cur)&&!cur.unseen&&party.clock<(e.tgtAt??0))return cur;
 let best=null,bd=1e9;for(const p of ps){if(!standing(p)||p.unseen)continue;let d=dist(p,e);if(p===cur)d-=PARTY.stick;if(d<bd){bd=d;best=p;}}
 best??=fallback;e.tgtId=best.id;e.tgtAt=party.clock+PARTY.retarget*(.8+Math.random()*.4);return best;
}
export const othersStanding=p=>party.players.some(q=>q!==p&&standing(q));
// Area attacks hit every standing player (the target `p` alone when solo or when nobody else stands).
export const everyone=p=>{if(party.players.length<2)return [p];const l=party.players.filter(standing);return l.length?l:[p];};
// Per-player "already hit" flags for one-shot hazards; the local player keeps the original boolean the visuals read.
export const wasHit=(o,p,key='hit')=>p.local?!!o[key]:!!o[key+'Ids']?.has(p.id);
// Oct 17 (user): bosses don't focus one player. Every new attack picks a random standing player (someone other than the
// last target when possible) and the boss chases that player until its next attack. Solo: always the local player.
/* Oct 18: players hidden in Smoke Bomb (p.unseen) are skipped; if nobody is visible the caller gets the fallback and checks .unseen itself. */
export function nextBossTarget(b,fallback){if(party.players.length<2)return fallback;const l=party.players.filter(p=>standing(p)&&!p.unseen);if(!l.length)return fallback;
 const pool=l.length>1?l.filter(p=>p.id!==b.bossTgt):l,q=pool[Math.floor(Math.random()*pool.length)];b.bossTgt=q.id;return q;}
export function bossTarget(b,fallback){if(party.players.length<2)return fallback;const cur=b.bossTgt!=null?playerById(b.bossTgt):null;return standing(cur)&&!cur.unseen?cur:nextBossTarget(b,fallback);}
export function markHit(o,p,key='hit'){if(p.local)o[key]=true;else (o[key+'Ids']??=new Set()).add(p.id);}

// Damage to a non-local member (survival.receiveHit computes the amount and calls this).
export function hurtAlly(p,damage){
 if(!standing(p)||p.grace>0)return [];
 p.hp=Math.max(0,p.hp-damage);p.grace=.12;p.hurt=.3;
 if(p.hp===0){p.downed=true;p.revive=0;p.downedTime=0;p.moving=false;return [{type:'allyHit',damage,x:p.x,y:p.y},{type:'allyDowned',id:p.id,name:p.name,x:p.x,y:p.y}];}
 return [{type:'allyHit',damage,x:p.x,y:p.y}];
}

function botCommand(p,c,leader){
 const B=PARTY.bot,kit=B.kits[p.classId],range=p.kit?kit.kitRange:kit.range,ps=party.players,idle={move:{x:0,y:0},aim:null,attack:false,cast:null,dash:false};
 // 1. Revive the nearest downed teammate.
 let down=null,dd=B.reviveSeek;for(const q of ps)if(q!==p&&q.downed&&!q.dead){const d=dist(p,q);if(d<dd){dd=d;down=q;}}
 if(down)return dd>PARTY.revive.range*.5?{...idle,move:unit(down.x-p.x,down.y-p.y)}:idle;
 // 2. Fight the nearest enemy while staying near the leader.
 const dl=dist(p,leader);let foe=null,fd=B.aggro;
 for(const e of c.targets){if(e.state!=='alive'||e.hidden||e.emerge>0||e.role==='anchor'||e.apparition)continue;const d=dist(p,e);if(d<fd){fd=d;foe=e;}}
 if(foe&&dl<B.leash*2.2){const reach=range+(foe.radius??14),want=kit.shot?range*.7:range*.7+(foe.radius??14);
  let move=fd>want?unit(foe.x-p.x,foe.y-p.y):kit.shot&&fd<want*.5?unit(p.x-foe.x,p.y-foe.y):{x:0,y:0},cast=null,dash=false;
  // Full class kits (batch 2): an ability every 1.4–3.2 s while in range; dodge out when low and an enemy is close.
  if(p.kit&&fd<=reach*1.2&&(p.castT??0)<=0){cast=['RMB','Q','E','R'][Math.floor(Math.random()*4)];p.castT=B.castEvery[0]+Math.random()*(B.castEvery[1]-B.castEvery[0]);}
  if(p.kit&&p.hp<p.maxHp*B.dashBelow&&fd<90&&(p.dashT??0)<=0){move=unit(p.x-foe.x,p.y-foe.y);dash=true;p.dashT=B.dashCd;}
  return {move,aim:{x:foe.x,y:foe.y},attack:fd<=reach,cast,dash};}
 // 3. Follow the leader in a loose formation.
 const a=p.id*2.1,fx=leader.x+Math.cos(a)*80,fy=leader.y+Math.sin(a)*55;
 return Math.hypot(fx-p.x,fy-p.y)>30?{...idle,move:unit(fx-p.x,fy-p.y)}:idle;
}

// Bot intent → the shared command format {move,aim,press:[edges]} that local input and network players use (game.js runCommand).
function toEdges(p,cmd){const press=[];if(cmd.attack&&!p.lmbHeld)press.push('lmb');if(!cmd.attack&&p.lmbHeld)press.push('lmbUp');p.lmbHeld=!!cmd.attack;
 if(cmd.cast==='RMB')press.push('rmb','rmbUp');else if(cmd.cast)press.push(cmd.cast);if(cmd.dash)press.push('dash');return {move:cmd.move,aim:cmd.aim,press,attack:cmd.attack,cast:cmd.cast};}
function applyCommand(p,cmd,s,c,props,dt,events){
 const kit=PARTY.bot.kits[p.classId],step=WORLD.speed*PARTY.bot.speed*(p.atk>0&&!kit.shot?.4:1)*dt;
 if(cmd.move.x||cmd.move.y){const ox=p.x,oy=p.y;slideMove(p,cmd.move.x*step,cmd.move.y*step,props);p.moving=Math.hypot(p.x-ox,p.y-oy)>.05;if(p.atk<=0)p.row=directionRow(cmd.move.x,cmd.move.y);}else p.moving=false;
 p.frame+=dt*(p.moving?22:12);
 if(!cmd.attack||!cmd.aim||p.cd>0)return;
 const ang=Math.atan2(cmd.aim.y-p.y,cmd.aim.x-p.x),dmg=kit.dmg*(1+.08*((s.level??1)-1));p.cd=kit.cd;p.atk=.35;p.atkT=0;p.row=directionRow(Math.cos(ang),Math.sin(ang));
 if(kit.shot){party.shots.push({x:p.x,y:p.y,dx:Math.cos(ang),dy:Math.sin(ang),speed:kit.shot,range:kit.range+80,dist:0,dmg,owner:p.id,color:kit.color,age:0});return;}
 for(const e of c.targets){if(e.state!=='alive'||e.hidden)continue;const d=dist(p,e),da=Math.atan2(e.y-p.y,e.x-p.x)-ang;
  if(d<=kit.range+(e.radius??14)&&Math.abs(Math.atan2(Math.sin(da),Math.cos(da)))<=kit.arc)events.push(...damageEnemy(c,e,dmg,p,{props,stagger:.25,push:8}));}
}

function tickShots(c,props,dt,events){
 for(let i=party.shots.length-1;i>=0;i--){const b=party.shots[i],owner=playerById(b.owner);b.age+=dt;const d=b.speed*dt,n=Math.max(1,Math.ceil(d/8));let gone=!owner;
  for(let k=0;k<n&&!gone;k++){b.x+=b.dx*d/n;b.y+=b.dy*d/n;b.dist+=d/n;if(b.dist>b.range||blocked(b.x,b.y,props,4,true)){gone=true;break;}
   for(const e of c.targets)if(e.state==='alive'&&!e.hidden&&Math.hypot(e.x-b.x,(e.y-b.y)/.8)<(e.radius??14)+6){events.push(...damageEnemy(c,e,b.dmg,owner,{props,stagger:.12,push:4}));gone=true;break;}}
  if(gone)party.shots.splice(i,1);}
}

// Called once per frame after the local player moved. `s` = survival (run state + local player's HP).
export function tickParty(s,c,props,dt){
 const events=[],ps=party.players,local=ps[0];party.clock+=dt;if(!local)return events;
 for(const p of ps)p.encounterWaiting=!encounterEligible(p,c.targets);const n=ps.filter(p=>!p.encounterWaiting).length;s.partySpawn=1+PARTY.spawnPerExtra*(n-1);
 // Enemy HP scales with party size; rescales live when someone joins or leaves.
 for(const e of c.targets){if(e.state!=='alive'||!e.maxHp||e.role==='anchor')continue;if(e.role==='boss'&&!e.sleeping&&!e.leashing)engageEncounter(e);const count=e.encounterRoster?.length??Math.max(e.partyCount??1,n);e.partyCount=count;const f=1+PARTY.hpPerExtra[tier(e)]*(count-1),old=e.partyHp??1;if(Math.abs(f-old)>1e-6){e.maxHp=Math.round(e.maxHp*f/old);e.hp=Math.min(e.maxHp,e.hp*f/old);e.partyHp=f;}}
 if(n<2)return events;
 // Local player downed: stays at 0 HP until revived; the run ends when nobody is standing.
 if(s.downed){s.hp=0;s.downedTime=(s.downedTime??0)+dt;if(!othersStanding(local)){s.downed=false;s.dead=true;s.deathTime=Math.max(s.deathTime??0,.9);return events;}}
 for(const p of ps){if(p.local||p.encounterWaiting)continue;const st=p.kit?.s;  // st = the member's own survival-like state when it runs a full class kit
  if(!st){p.grace=Math.max(0,p.grace-dt);p.hurt=Math.max(0,p.hurt-dt);p.cd=Math.max(0,p.cd-dt);p.atk=Math.max(0,p.atk-dt);if(p.atk>0)p.atkT=(p.atkT??0)+dt;p.invulnerable=p.downed;}
  if(p.downed){p.moving=false;p.cmd=null;p.lmbHeld=false;if(st)st.downedTime=(st.downedTime??0)+dt;else p.downedTime=(p.downedTime??0)+dt;continue;}
  if(!p.remote&&dist(p,local)>PARTY.bot.catchUp){const a=p.id*2.1,x=local.x+Math.cos(a)*70,y=local.y+Math.sin(a)*50;if(!blocked(x,y,props)){p.x=x;p.y=y;}}
  // Kit members only get a command here; game.js runs their class kit (stepTeammates). Network players will fill p.cmd instead of the bot AI.
  if(st){p.castT=(p.castT??1)-dt;p.dashT=Math.max(0,(p.dashT??0)-dt);if(p.bot)p.cmd=toEdges(p,botCommand(p,c,local));continue;}
  p.cmd=botCommand(p,c,local);applyCommand(p,p.cmd,s,c,props,dt,events);}
 tickShots(c,props,dt,events);
 // Revives: any standing teammate within range fills the bar; it drains slowly when nobody is there.
 for(const p of ps){if(!p.downed||p.dead)continue;const helping=ps.some(q=>q!==p&&standing(q)&&dist(p,q)<=PARTY.revive.range);
  p.revive=helping?(p.revive||0)+dt:Math.max(0,(p.revive||0)-dt*PARTY.revive.decay);
  if(p.revive>=PARTY.revive.time){p.revive=0;const st=p.local?s:p.kit?.s;if(st){st.downed=false;st.downedTime=0;st.deathTime=0;st.hp=Math.round(st.maxHp*PARTY.revive.hp);st.grace=1.5;}else{p.downed=false;p.hp=Math.round(p.maxHp*PARTY.revive.hp);p.grace=1.5;}
   events.push({type:'allyRevived',id:p.id,name:p.name,x:p.x,y:p.y});}}
 return events;
}
