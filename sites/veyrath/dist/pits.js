import {engageEncounter} from './party.js?v=fx-260';
// Oct 16 (user): Dune Ravager and Dune Wyrm live in walled pits on the outskirts (like Dragon/Baron).
// Optional: they sleep until you walk in, stay leashed to their pit (walk home and heal if you leave),
// respawn after a kill and grant a run buff. Values are playtest seeds.
import {makeBoss,BOSS_DEFS} from './bosses.js?v=fx-260';
import {inArena} from './arenas.js?v=fx-260';
export const PIT_RULES={
 ravager:{unlockAt:0,respawn:240,buff:'fury',buffTime:240,hp:t=>1+t/900,notice:"Ravager's Fury · +12% damage for 4 minutes"},
 wyrm:{unlockAt:0,respawn:360,buff:'heart',buffTime:300,hp:t=>1+t/1500,notice:"Wyrm's Heart · +20% max HP and regeneration for 5 minutes"},
 // Oct 17 (user): all four corner bosses are in their pits from the start (unlockAt 0; was 2:00/6:00/10:00/15:00).
 // Oct 16 (user): corner bosses 3 and 4 reuse main bosses, each with its own buff. Unlock times, HP and buffs are PROPOSALS.
 butcher:{unlockAt:0,respawn:300,buff:'hunger',buffTime:240,hp:t=>.6+t/1500,notice:"Butcher's Hunger · +12% move speed for 4 minutes"},
 prophet:{unlockAt:0,respawn:360,buff:'ward',buffTime:300,hp:t=>.5+t/2000,notice:"Prophet's Ward · take 15% less damage for 5 minutes"}
};
// Oct 16 (user): killing all four corner bosses in one run grants the Soul, a big buff for the rest of the run.
// Values are PROPOSALS: +20% damage, +20% max HP, +2 HP/s regeneration.
export const SOUL={notice:'BOSS SOUL · all four chosen corner blessings strengthened'};
export function createPits(arenas){return arenas.filter(a=>a.kind==='pit').map(a=>({arena:a,boss:a.boss,status:'dormant',respawnAt:PIT_RULES[a.boss].unlockAt,bossId:null}));}
export function tickPits(pits,s,c,p,dt){
 const events=[];s.timeStop=null;if(s.dead)return events;
 for(const pit of pits){const rule=PIT_RULES[pit.boss],a=pit.arena;
  if(pit.status!=='awake'&&pit.status!=='sleeping'){
   // Oct 16 (user, corrected): after the kill, time outside stays stopped while you remain in the pit. Once you
   // walk out the pit's gate shuts (pit.sealed) until its boss respawns.
   if(pit.status==='cooldown'&&!pit.sealed){if(inArena(a,p,0)){s.timeStop={pit:a.id,bossId:null};continue;}pit.sealed=true;events.push({type:'worldNotice',text:'The pit seals until its boss returns'});}
   if(!s.finalPhase&&s.clock>=pit.respawnAt){const b=makeBoss(s,c,a.x,a.y,pit.boss,{hpScale:rule.hp(s.clock)});Object.assign(b,{pit:a.id,sleeping:true,invulnerable:1,emerge:0,home:{x:a.x,y:a.y},homeR:a.radius,xp:Math.round(b.xp*rule.hp(s.clock))});pit.bossId=b.id;pit.status='sleeping';pit.sealed=false;if(pit.respawnAt>rule.unlockAt&&s.clock>2)events.push({type:'worldNotice',text:b.name.toUpperCase()+' SPAWNED'});}
   continue;}
  const b=c.targets.find(t=>t.id===pit.bossId);
  if(!b||b.state!=='alive'){pit.status='cooldown';pit.sealed=false;if(inArena(a,p,0))s.timeStop={pit:a.id,bossId:null};events.push({type:'pitCleared',pit:a.id,bossId:pit.bossId});pit.respawnAt=s.clock+rule.respawn;continue;}
  // Oct 16 (user): stepping into the pit starts the fight at once and stops time outside it;
  // stepping out instantly resets the boss (full health) and it runs back to the middle.
  const playerIn=inArena(a,p,0);
  if(playerIn&&!b.leashing){if(b.sleeping){engageEncounter(b);b.rewardAnchor={x:a.entranceX??p.x,y:a.entranceY??p.y};b.sleeping=false;b.invulnerable=0;b.cooldown=0;b.specialCD=1.2;pit.status='awake';events.push({type:'bossArrival',name:b.name,pit:true},{type:'worldNotice',text:'Time stands still outside the pit'});}s.timeStop={pit:a.id,bossId:b.id};continue;}
  if(!playerIn&&!b.sleeping&&!b.leashing){b.leashing=true;b.swing=null;b.special=null;b.hidden=false;b.invulnerable=0;b.exposed=0;b.hp=b.maxHp;if(b.armorMax){b.armorHp=b.armorMax;b.armorBroken=false;}
   // Oct 17 fix: a full reset also drops the enrage (it used to keep phase-2 speed/Bloodrage after leaving the pit).
   Object.assign(b,{rewardSlot:0,phase2:false,bloodrage:false,speed:b.baseSpeed??b.speed,tint:BOSS_DEFS[b.bossKind]?.tint??b.tint,lastKind:null,lift:0,chain:false,chainNext:null});
   if(c.hazards)for(let i=c.hazards.length-1;i>=0;i--)if(c.hazards[i].owner===b.id)c.hazards.splice(i,1);if(c.enemyProjectiles)c.enemyProjectiles=c.enemyProjectiles.filter(q=>q.owner!==b.id);}
  if(b.leashing){const dx=b.home.x-b.x,dy=b.home.y-b.y,d=Math.hypot(dx,dy);b.row=0;
   if(d>6){b.x+=dx/d*Math.min(d,600*dt);b.y+=dy/d*Math.min(d,600*dt);b.moving=true;}else{b.moving=false;b.leashing=false;b.sleeping=true;pit.status='sleeping';}}
  // A sleeping or retreating pit boss can't be chipped from outside.
  b.invulnerable=b.sleeping||b.leashing?1:b.invulnerable;
 }
 return events;
}
export const pitMarkers=pits=>pits.map(pit=>({key:'pit-'+pit.arena.id,kind:'boss',x:pit.arena.x,y:pit.arena.y,status:pit.status==='cooldown'||pit.status==='dormant'?'cooldown':'ready',active:true}));
// Titan buffs: fury (+12% damage), heart (+20% max HP, 2 HP/s), hunger (+12% move), ward (-15% damage taken),
// dominion (+10% damage, rest of run), soul (all four corner bosses: see SOUL).
export function tickTitanBuffs(s,dt){const b=s.titanBuffs??={};s.buffStats={damage:b.dominion?.10:0,maxHp:0,regen:0,move:0,reduction:0};return false;}
// Oct 16 (user): nothing but the pit's own boss may ever enter a pit; intruders are pushed back out.
export function keepOutOfPits(pits,c){
 for(const t of c.targets){if(t.state!=='alive'||t.pit||t.role==='anchor')continue;
  for(const pit of pits){const a=pit.arena,dx=t.x-a.x,dy=(t.y-a.y)/.72,d=Math.hypot(dx,dy),R=a.radius+16;if(d<R){const n=d||1;t.x=a.x+dx/n*R;t.y=a.y+dy/n*R*.72;}}}
}
