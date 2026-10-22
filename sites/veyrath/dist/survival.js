import {tickEnemyConditions} from './status-ownership.js?v=fx-260';
import {directorWorkload} from './encounter-rules.js?v=fx-260';
import {damageReduction,actor} from './core-rules.js?v=fx-260';
import {regularDemon,specialDemon,basicImp,setRunImp} from './demon-roster.js?v=fx-260';
import {rollRoster,typeOf} from './wave-roster.js?v=fx-260';
import {pickWaveType,makeWaveEnemy,tickPound} from './wave-mechanics.js?v=fx-260';
import {tickCaster,tickEnemyProjectiles} from './enemy-ranged.js?v=fx-260';
import {encounterPressure,HARD_ENEMY_CAP} from './encounter-pacing.js?v=fx-260';
import {awardLevelPoints,rank} from './specializations.js?v=fx-260';
import {rollRole,applyRole,tickCharger,tickSummoner} from './enemy-roles.js?v=fx-260';
import {WORLD,blocked,clamp,directionRow,movePlayer,steerMove} from './simulation.js?v=fx-260';
import {attackDefinition,clearAttackInput,damageEnemy,DAMAGE_SCALE} from './combat.js?v=fx-260';
import {shieldProtects,shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {targetFor,hurtAlly,othersStanding} from './party.js?v=fx-260';
import {edgeSpawn,ELITE_MELEE,ENEMY_ATTACK_SPEED,ENEMY_SPEED,ENEMY_HP,enemyHealth} from './encounter-space.js?v=fx-260';
export const ABILITIES={parry:{cooldown:2,window:.28},slam:{cooldown:6,damage:90,radius:150},storm:{cooldown:35,duration:3,damage:32,radius:145}};
export function createSurvival(c){
  const roster=rollRoster();setRunImp(typeOf('imp',roster.imp).skin);// Oct 18 (user): one variant per category each run
  c.targets=[{...c.target,...basicImp(),id:0,enemy:true,hpTier:'swarmer',hp:ENEMY_HP.swarmer,maxHp:ENEMY_HP.swarmer,role:'swarmer',speed:ENEMY_SPEED.swarmer,xp:18,scale:1.25,age:0,enraged:false,swing:null,cooldown:.5,moving:false}];c.damageMultiplier=1;
  return {roster,hp:250,maxHp:250,hurt:0,grace:0,clock:0,spawnTimer:3,id:0,level:1,xp:0,nextXP:150,dead:false,deathTime:0,parry:0,parryAngle:0,parryCD:0,slamCD:0,stormCD:0,cast:null,pulse:0};
}
export function canCast(s,c){
  if(s.dead||s.cast||c.hitstop>0)return false;
  return !c.attack||c.attack.elapsed>=attackDefinition(c.attack).duration*attackDefinition(c.attack).hitEnd;
}
export function castAbility(s,c,player,aim,kind){
  if(!canCast(s,c)||s[kind+'CD']>0)return false;
  clearAttackInput(c);c.attack=null;c.chainTimer=0;c.nextCombo=0;
  const angle=aim?Math.atan2(aim.y-player.y,aim.x-player.x):player.row*Math.PI/4;
  s.cast={kind,elapsed:0,angle,row:directionRow(Math.cos(angle),Math.sin(angle)),fired:false};
  s[kind+'CD']=ABILITIES[kind].cooldown;
  if(kind==='parry'){s.parry=ABILITIES.parry.window+.04*rank(s,'parrytime');s.parryAngle=angle;}
  if(kind==='storm')s.pulse=0;
  return true;
}
export function acceptEvents(s,c,events){
  for(const e of events)if(e.type==='xpCollected')s.xp=Math.round((s.xp+(e.xp??0)*(s.world?.xp??1)*(1+(s.cardStats?.xp??0)))*100)/100;
  while(s.xp>=s.nextXP){s.xp-=s.nextXP;s.level++;s.nextXP=Math.round(s.nextXP*(s.level<10?1.22:1.28));s.maxHp+=10;s.hp=Math.min(s.maxHp,s.hp+25*(s.world?.healing??1));c.damageMultiplier=1+Math.max(0,s.level-1)*.03;events.push({type:'level',level:s.level});awardLevelPoints(s,events);}
}
export function areaHits(s,c,player,radius,damage,props,options={}){
  c.forgeShield=s.forgeShield;
  props=props.filter(p=>!p.forgeShield);
  const events=[];
  for(const e of c.targets)if(e.state==='alive'&&Math.hypot(e.x-player.x,(e.y-player.y)/.65)<=radius+e.radius){
    const dx=e.x-player.x,dy=e.y-player.y,n=Math.ceil(Math.hypot(dx,dy)/5);let clear=true;
    for(let i=1;i<n;i++)if(blocked(player.x+dx*i/n,player.y+dy*i/n,props,0,true)){clear=false;break;}
    if(clear&&!shieldBlocksAttack(s.forgeShield,player,e)){if(options.heavy&&s.skills?.frost)e.slow=1+rank(s,'frost');events.push(...damageEnemy(c,e,damage,player,{props,...options}));}
  }
  return events;
}
export function receiveHit(s,c,player,enemy,props,routed=false){
  // Teammates with a full class kit take the hit on their own state (parry, barrier, buffs); playerHit becomes allyHit so it never touches the local HUD.
  if(player.kit&&!routed){if(s.dead)return [];const was=player.downed,out=receiveHit(player.kit.s,player.kit.c,player,enemy,props,true).map(e=>e.type==='playerHit'?{...e,type:'allyHit'}:e);if(player.downed&&!was)out.push({type:'allyDowned',id:player.id,name:player.name,x:player.x,y:player.y});return out;}
  if(player.ally&&!routed){if(s.dead)return [];return hurtAlly(player,Math.ceil(-1e-6+(s.world?.incoming??1)*(1-(s.rewardReduction??0))*DAMAGE_SCALE*(enemy.attackDamage??(enemy.role==='bruiser'?30:14))*(enemy.warriorWeaken>0?1-(enemy.warriorWeakenFactor??.2):1)));}  // Multiplayer Phase 1: teammates take the base hit (no parry/barrier kit yet)
  if(s.dead||s.downed||player.invulnerable||shieldBlocksAttack(s.forgeShield,enemy,player))return [];
  const angle=Math.atan2(enemy.y-player.y,enemy.x-player.x),difference=Math.atan2(Math.sin(angle-s.parryAngle),Math.cos(angle-s.parryAngle));
  if(s.parry>0&&!enemy.unparryable&&Math.abs(difference)<1.5){
    if(s.warriorGuardCounter){const counter=s.warriorGuardCounter;s.warriorGuardCounter=null;s.parry=0;c.hitstop=.06;return [{type:'parry',x:player.x,y:player.y},...counter(enemy)];}
    s.parry=0;c.hitstop=.06;
    if(s.skills?.healing)s.hp=Math.min(s.maxHp,s.hp+10*rank(s,'healing')*(s.world?.healing??1));
    if(s.skills?.guard)s.guard=2;
    return [{type:'parry',x:player.x,y:player.y},...damageEnemy(c,enemy,40,player,{props,stagger:.8,push:18,counter:true})];
  }
  if(s.grace>0)return [];
  let damage=Math.ceil(-1e-6+(s.world?.incoming??1)*(1-damageReduction([s.rewardReduction,s.buffStats?.reduction,s.damageReduction,s.weaponGuard,s.guard>0?Math.min(.6,.15*rank(s,'guard')):0],s.warrior?.buffs?.bastion>0))*DAMAGE_SCALE*(enemy.attackDamage??(enemy.role==='bruiser'?30:14))*(enemy.warriorWeaken>0?1-(enemy.warriorWeakenFactor??.2):1));const oldBarrier=s.barrier??0,absorbed=Math.min(oldBarrier,damage);s.barrier=Math.max(0,oldBarrier-absorbed);damage=Math.ceil(damage-absorbed-1e-6);
  if(damage>=s.hp&&s.skills?.undyingBlood&&s.clock>=(s.undyingReady??0)){damage=Math.max(0,s.hp-1);s.barrier=50;s.barrierTime=3;s.undyingReady=s.clock+90;}
  const hpLost=Math.min(s.hp,damage);s.hp=Math.max(0,s.hp-damage);if(hpLost>0&&s.warrior){const w=s.warrior;w.hurtRageWindow??={time:actor(c).time,value:0};if(actor(c).time-w.hurtRageWindow.time>=1)w.hurtRageWindow={time:actor(c).time,value:0};const gain=Math.min(hpLost*.5,Math.max(0,8-w.hurtRageWindow.value));w.rage=Math.min(100,w.rage+gain);w.hurtRageWindow.value+=gain;w.rageIdle=0;}s.hurt=.4*(1-(s.staggerResist??0))*(s.world?.stagger??1);s.grace=.12;
  const barrierEvents=[];if(oldBarrier>0&&s.barrier===0&&s.warriorBarrierBurst){const burst=s.warriorBarrierBurst;s.warriorBarrierBurst=null;barrierEvents.push(...burst());}
  if(s.hp===0&&s.godMode)s.hp=s.maxHp;// F2 test menu god mode
  if(s.hp===0&&othersStanding(player)){s.downed=true;s.downedTime=0;s.cast=null;clearAttackInput(c);c.attack=null;}  // Multiplayer: downed, not dead, while a teammate stands
  else if(s.hp===0){s.dead=true;s.cast=null;clearAttackInput(c);c.attack=null;}
  if(enemy.modifier==='vampiric')enemy.hp=Math.min(enemy.maxHp,enemy.hp+Math.round(damage*.75));
  // Retribution (Vanguard talent): attackers take 50 damage while Bastion Dome is active.
  if(damage>0&&s.warrior?.buffs?.bastion>0&&rank(s,'retribution')&&enemy.state==='alive'&&enemy.maxHp){barrierEvents.push(...damageEnemy(c,enemy,50,player,{absolute:true,props,stagger:.1,push:6,secondary:true}));s.warrior.effects?.push({kind:'retribution',x:enemy.x,y:enemy.y,radius:40,angle:Math.atan2(enemy.y-player.y,enemy.x-player.x),age:0,duration:.45});}
  return [{type:'playerHit',damage,x:player.x,y:player.y},...barrierEvents];
}
// Oct 18 (user): the three overlapping tiers are replaced by the five-category schedule in wave-roster.js.
export function spawn(s,c,player,props,view,plain=false){if(s.noSpawn)return null;// F2 test menu
  if(c.targets.filter(e=>e.state==='alive').length>=HARD_ENEMY_CAP)return;
  for(let attempt=0;attempt<24;attempt++){
    const a=Math.random()*Math.PI*2,r=Math.max(view.width/2/ view.zoom,view.height/2/view.zoom)+160;
    const edge=edgeSpawn(player,s.id+1),x=edge?.x??player.x+Math.cos(a)*r,y=edge?.y??player.y+Math.sin(a)*r;
    if((!edge&&(x<30||y<30||x>WORLD.width-30||y>WORLD.height-30))||blocked(x,y,props,20,!!edge))continue;
    if(edge?Math.hypot(x-player.x,y-player.y)<210:Math.abs(x-player.x)<view.width/2/view.zoom+80&&Math.abs(y-player.y)<view.height/2/view.zoom+80)continue;
    // plain: elites/bosses start from a plain imp and override everything (rewards.js).
    const {cat,type}=plain?{cat:'imp',type:typeOf('imp',s.roster?.imp??'imp1')}:pickWaveType(s,c.targets);
    const enemy=makeWaveEnemy(s,cat,type,x,y);c.targets.push(enemy);
    enemy.emerge=edge?.9:0;return enemy;
  }
}
// Oct 16 (user): the longer a mob lives the faster it moves, so circling never outruns everything. After 15s alive:
// +0.8% speed per second, capped at x2.5 (reached ~3.4 min). Playtest values.
// Oct 18: Frenzied Lancer swings faster with each consecutive attack (stacks reset after a pause).
const frenzyMul=e=>e.frenzy?1-e.frenzy.per*(e.frenzyStacks??0):1;
export const ageSpeed=e=>1+Math.min(1.5,Math.max(0,(e.age??0)-15)*.008);
export function tickSurvival(s,c,player,props,view,dt){
  const barrierEvents=[];s.barrierTime=Math.max(0,(s.barrierTime??0)-dt);if(s.barrierTime===0){s.barrier=0;if(s.warriorBarrierBurst){const burst=s.warriorBarrierBurst;s.warriorBarrierBurst=null;barrierEvents.push(...burst());}}
  if(s.dead){s.deathTime+=dt;return [];}
  const events=[...barrierEvents,...tickEnemyProjectiles(s,c,player,props,dt,receiveHit)];if(s.dead)return events;if(!s.timeStop)s.clock+=dt;// Oct 16 (user): the run clock (boss/elite/spawn schedules, day cycle) pauses during a pit or trial time stop, so nothing bursts in afterwards.
  s.grace=Math.max(0,s.grace-dt);s.hurt=Math.max(0,s.hurt-dt);s.parry=Math.max(0,s.parry-dt);if(s.parry===0)s.warriorGuardCounter=null;
  for(const key of ['parryCD','slamCD','stormCD'])s[key]=Math.max(0,s[key]-dt);
  c.targets=c.targets.filter(e=>e.state!=='dead'||e.death<2.8);
  const alive=c.targets.filter(e=>e.state==='alive');
  s.spawnTimer-=dt;
  if(s.spawnTimer<=0){const pressure=encounterPressure(s.clock,{optionalActive:survivalOptional(s),bossActive:alive.some(e=>e.role==='boss'&&!e.pit)}),workload=directorWorkload(pressure,s);s.spawnTimer=workload.interval;if(!s.finalPhase&&!s.timeStop&&s.clock>=(s.pressureRestUntil??0)&&alive.length<Math.min(HARD_ENEMY_CAP-5,workload.cap)){const first=spawn(s,c,player,props,view);
    // Oct 16 (user): twice as many small mobs, but never in packs — the extra one is its own single spawn from another random direction.
    }}
  if(s.cast){
    const cast=s.cast;cast.elapsed+=dt;
    if(cast.kind==='slam'&&!cast.fired&&cast.elapsed>=.34){cast.fired=true;if(rank(s,'slamguard')){s.barrier=15*rank(s,'slamguard');s.barrierTime=3;}events.push({type:'slam',x:player.x,y:player.y},...areaHits(s,c,player,150,90*(c.weapon?.slam??1)*(1+.15*rank(s,'slamforce')),props,{stagger:.65,push:22,heavy:true}));}
    if(cast.kind==='storm'){
      s.pulse-=dt;if(s.pulse<=0){s.pulse=.28;events.push({type:'storm',x:player.x,y:player.y},...areaHits(s,c,player,145*(1+.1*rank(s,'stormreach')),32*(1+.12*rank(s,'stormforce')),props,{stagger:.12,push:2}));}
    }
    if(cast.elapsed>=(cast.kind==='storm'?3:cast.kind==='slam'?.65:.35))s.cast=null;
  }
  let attackSlots=Math.max(0,4-alive.filter(e=>e.swing&&e.role!=='boss').length);
  // Oct 18 (user: 12 FPS with big crowds): crowd separation looks up neighbours in a 28 px grid instead of testing every pair.
  const SEP=28,sepGrid=new Map();for(const o of alive){const k=Math.floor(o.x/SEP)*65536+Math.floor(o.y/SEP);let b=sepGrid.get(k);if(!b)sepGrid.set(k,b=[]);b.push(o);}
  for(const e of alive){const tp=targetFor(e,player);  // Multiplayer Phase 1: each enemy chases and hits its own target
    if(e.state!=='alive')continue;
    // Pit time-stop (Oct 16): everything outside the boss pit freezes in place. Set first so no early-continue leaves a stale grey freeze.
    e.timeStopped=!!s.timeStop&&(s.timeStop.trial?e.worldEvent!==s.timeStop.trial:e.pit!==s.timeStop.pit);if(e.timeStopped){e.moving=false;continue;}tickEnemyConditions(e,dt);
    if(e.freeze>0){e.freeze=Math.max(0,e.freeze-dt);e.moving=false;continue;}
    if(e.emerge>0){if(e.role!=='boss')e.emerge=Math.max(0,e.emerge-dt);e.moving=false;continue;}
    if(e.bleed>0){e.bleed-=dt;e.bleedPulse=(e.bleedPulse??0)-dt;if(e.bleedPulse<=0){e.bleedPulse=.5;events.push(...damageEnemy(c,e,7,tp,{props,dot:true,push:0,stagger:0}));}}
    if(e.timeStopped){e.moving=false;continue;}
    if(e.state!=='alive'||['boss','anchor','bossClone'].includes(e.role))continue;
    e.slow=Math.max(0,(e.slow??0)-dt);
    e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);e.moving=false;
    if(!e.enraged&&e.age>90){e.enraged=true;e.hp=Math.round(e.hp*1.35);e.maxHp=Math.round(e.maxHp*1.35);e.scale*=1.15;}
    if(e.hurt>0){e.rangedCast=null;continue;}
    /* Oct 18 (user): a target hidden in Smoke Bomb can't be seen: unfired swings and casts drop and the enemy stands still; committed charges/pounds finish. */
    /* Oct 19 (user): no freezing: with nobody visible they lose you and wander confused around their spot (party targetFor already sends them to visible teammates). */
    if(tp.unseen&&!e.charge&&e.poundT==null){e.swing=null;e.rangedCast=null;e.wanderT=(e.wanderT??0)-dt;if(e.wanderT<=0||e.wanderA==null){e.wanderT=.6+Math.random()*.9;e.wanderA=Math.random()*Math.PI*2;e.wanderHome??={x:e.x,y:e.y};const hx=e.wanderHome.x-e.x,hy=e.wanderHome.y-e.y;if(Math.hypot(hx,hy)>90)e.wanderA=Math.atan2(hy,hx)+(Math.random()-.5);}const ox=e.x,oy=e.y,sp=e.speed*.45*(e.slow>0?.4:1);steerMove(e,Math.cos(e.wanderA)*sp*dt,Math.sin(e.wanderA)*sp*dt,props,dt);e.moving=Math.hypot(e.x-ox,e.y-oy)>.05;if(e.moving)e.row=directionRow(Math.cos(e.wanderA),Math.sin(e.wanderA));continue;}
    e.wanderHome=null;
    if(e.mech==='pound'&&!e.swing&&tickPound(e,s,tp,dt))continue;
    if(e.role==='caster'){tickCaster(e,s,c,tp,props,dt);continue;}
    if(e.role==='summoner'){tickSummoner(e,s,c,tp,props,dt,HARD_ENEMY_CAP);continue;}
    if(e.role==='charger'&&!e.swing&&tickCharger(e,s,c,tp,props,dt,receiveHit,events))continue;
    const dx=tp.x-e.x,dy=tp.y-e.y,distance=Math.hypot(dx,dy),n=distance||1;
    // Trial of the Hunter quarry runs away instead of fighting.
    if(e.feared>0)e.feared=Math.max(0,e.feared-dt);
    if(e.flee||e.feared>0){const ox=e.x,oy=e.y;steerMove(e,-dx/n*e.speed*dt,-dy/n*e.speed*dt,props,dt);e.moving=Math.hypot(e.x-ox,e.y-oy)>.05;e.row=directionRow(-dx,-dy);continue;}
    if(e.swing){
      const swing=e.swing;swing.elapsed+=dt;
      const tracking=!swing.fired&&swing.elapsed<swing.windup-.14;
      if(tracking){swing.angle=Math.atan2(dy,dx);e.row=directionRow(dx,dy);}
      const approach=e.speed*ageSpeed(e)*(e.enraged?1.1:1)*(e.rageModifier??1)*(e.slow>0?.4:e.mageChill>0?1-(e.mageSlow??.2):1);
      const stepSpeed=(swing.fired?e.speed:approach*(tracking?1.05:1.6))*ENEMY_ATTACK_SPEED;
      const travel=Math.min(Math.max(0,distance-(e.role==='leader'?43:18)),stepSpeed*dt);
      if(travel>0){const ox=e.x,oy=e.y;movePlayer(e,(tracking||swing.fired?dx/n:Math.cos(swing.angle))*travel,(tracking||swing.fired?dy/n:Math.sin(swing.angle))*travel,props);e.moving=Math.hypot(e.x-ox,e.y-oy)>.05;}
      const hx=tp.x-e.x,hy=tp.y-e.y,hitDistance=Math.hypot(hx,hy);
      if(!swing.fired&&swing.elapsed>=swing.windup){
        swing.fired=true;const angle=Math.atan2(hy,hx),delta=Math.atan2(Math.sin(angle-swing.angle),Math.cos(angle-swing.angle));
        if(Math.abs(delta)<1.05&&Math.hypot(hx,hy/.65)<swing.reach+13){
          let clear=true;for(let k=1;k<hitDistance/5;k++)if(blocked(e.x+hx*k/(hitDistance/5),e.y+hy*k/(hitDistance/5),props,0,true)){clear=false;break;}
          if(clear)events.push(...receiveHit(s,c,tp,e,props));
        }
      }
      if(e.swing&&swing.elapsed>swing.windup+(e.swingTail??.25)){e.swing=null;// Oct 16 (user): imps attack faster once they reach you.
        if(e.comboLeft>0){e.comboLeft--;e.swing={elapsed:0,windup:e.comboWindup??.16,reach:swing.reach,angle:Math.atan2(dy,dx),fired:false};continue;}/* Oct 18: Claw Fiend flurry */
        if(e.recover!=null){e.cooldown=e.recover*frenzyMul(e)+Math.random()*.1;continue;}
        e.cooldown=e.role==='leader'?ELITE_MELEE.recovery+Math.random()*ELITE_MELEE.recoveryJitter:e.role==='swarmer'?.35+Math.random()*.2:.65+Math.random()*.25;}
      continue;
    }
    const heavy=e.role==='bruiser'||e.role==='guardian',reach=e.reach??(e.role==='leader'?ELITE_MELEE.reach:e.role==='guardian'?80:heavy?68:46);
    if(Math.hypot(dx,dy/.65)<reach+7&&e.cooldown===0&&attackSlots>0){
      attackSlots--;e.row=directionRow(dx,dy);if(e.frenzy){const F=e.frenzy;e.frenzyStacks=s.clock-(e.frenzyAt??-99)>F.decay?0:Math.min(F.max,(e.frenzyStacks??0)+1);e.frenzyAt=s.clock;}e.comboLeft=(e.combo??1)-1;e.swing={elapsed:0,windup:frenzyMul(e)*(e.windup??(heavy?.7:e.role==='leader'?ELITE_MELEE.windup:e.role==='swarmer'?.3:.45)),reach,angle:Math.atan2(dy,dx),fired:false};continue;
    }
    let vx=dx/n,vy=dy/n;
    if(Math.hypot(dx,dy/.65)<reach*.72){const side=e.id%2?1:-1;vx=-dy/n*side;vy=dx/n*side;}
    {const gx=Math.floor(e.x/SEP),gy=Math.floor(e.y/SEP);for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const b=sepGrid.get(ix*65536+iy);if(b)for(const other of b)if(other!==e){const ox=e.x-other.x,oy=e.y-other.y,d=Math.hypot(ox,oy);if(d>0&&d<28){vx+=ox/d*(28-d)/28*.7;vy+=oy/d*(28-d)/28*.7;}}}}
    const length=Math.hypot(vx,vy)||1,speed=e.speed*ageSpeed(e)*(e.enraged?1.1:1)*(e.rageModifier??1)*(e.slow>0?.4:e.mageChill>0?1-(e.mageSlow??.2):1),oldX=e.x,oldY=e.y;
    steerMove(e,vx/length*speed*dt,vy/length*speed*dt,props,dt);
    e.moving=Math.hypot(e.x-oldX,e.y-oldY)>.1;e.row=directionRow(tp.x-e.x,tp.y-e.y);
  }
  return events;
}

function survivalOptional(s){return (s.world?.optionalActive??0)>0;}
