import {claimDefeat} from './encounter-rules.js?v=fx-260';
import {outputAmount,beginAction,advanceActor,resourceCredit,attackReady,actor,boundedBurst} from './core-rules.js?v=fx-260';
import {projectileHitsBody} from './projectile-contact.js?v=fx-260';
import {blocked,clamp,directionRow,movePlayer} from './simulation.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';

// Contact windows are taken from inspection of the supplied 15-frame sheets.
import {BASIC_ATTACKS,BASE_CRIT_CHANCE,BASE_CRIT_DAMAGE} from './combat-balance.js?v=fx-260';
// LMB uses absolute family balance; active Cleave retains its separate damage.
export const STRIKES = [
  // Oct 16 (user): LMB reach +40% (was 84/88/94).
  {sheet:'knight-Melee',duration:.58,hitStart:6/15,hitEnd:10/15,damage:45,reach:118,halfArc:.85},
  {sheet:'knight-Melee2',duration:.56,hitStart:7/15,hitEnd:10/15,damage:50,reach:123,halfArc:.9},
  {sheet:'knight-Special1',duration:.68,hitStart:8/15,hitEnd:11/15,damage:65,reach:132,halfArc:1},
];
// Screen-space ground projection: keep the approved horizontal reach while
// compressing north/south reach. Diagonals interpolate along the same ellipse.
export const VERTICAL_REACH_SCALE = .65;
export const DAMAGE_SCALE=2;
export const HAMMER_LEAP=90;
export const HEAVY_CLEAVE={sheet:'knight-Melee',duration:.86,hitStart:6/15,hitEnd:10/15,damage:110,reach:108,halfArc:1.45,cooldown:2.5};
export function attackDefinition(attack){return attack.definition??(attack.kind==='heavy'?HEAVY_CLEAVE:STRIKES[attack.index]);}
function snapshotStrike(c,base,primary=false,index=0){
 const w=c.weapon,mods=primary?(w?.mods??{}):{},style=primary?(w?.style??'sword'):'sword';
 const profile=BASIC_ATTACKS[style]??BASIC_ATTACKS.sword;
 return {...base,...(primary?{damage:profile.damage}:{}),duration:(primary?profile.interval*(profile.contacts??1):base.duration)/(primary?boundedBurst(c,'attackSpeed',(w?.speed??1)*(c.warriorBasicSpeed??1),2.5,3.5):(w?.castSpeed??1)),reach:(base.reach*(primary?1.1:1)*(primary?(w?.reach??1):1)+(primary?w?.meleeReach??0:0))*(index===2&&mods.thirdLine?1.4:1)*(primary&&style==='lance'?1.2:1),halfArc:base.halfArc*(primary?(w?.arc??1):1)*(index===2?(mods.thirdArc??1):1),style,mods,
   ...((index===2&&mods.thirdLine)?{shape:'line',halfWidth:14*(mods.width??1),sheet:'knight-Pummel'}:{}),
   ...(style==='hammer'?{shape:'impact',impactRadius:78*(w?.aoe??1),sheet:'knight-Special1'}:{}),
   ...(style==='dual'?{pulses:[.25,.75],hitStart:.25,hitEnd:.89}:{}),
   ...(style==='axe'?{projectile:true,range:390*1.1*(w?.reach??1),sheet:'knight-Pummel'}:{}),
   /* Oct 18 new Warrior families (user list). shock = staggering ring at the impact point; shockLine = punch wave; lunge = step during the windup;
      bleed = stacks added per hit (max 5); element = Elemental Katana cycle; standard = War Standard throw / lunge; chain = Chain Axe hook. */
   ...(style==='maul'?{shape:'impact',impactRadius:38*(w?.aoe??1),shock:{radius:150*(w?.aoe??1),factor:1.3},sheet:'knight-Special1'}:{}),
   ...(style==='greataxe'?{bleed:2}:{}),...(style==='dual'?{bleed:1,splash:{radius:150,factor:.6,minStacks:3}}:{}),
   ...(style==='spearshield'?{shape:'line',halfWidth:24,push:28,sheet:'knight-Pummel'}:{}),
   ...(style==='lance'?{shape:'line',halfWidth:46,splash:{radius:120,factor:.5},lunge:55,push:14,sheet:'knight-Pummel'}:{}),
   ...(style==='gauntlets'?{shockLine:{reach:300*(w?.reach??1),halfWidth:44,factor:1.4}}:{}),
   ...(style==='katana'?{element:true,splash:{radius:150,factor:.55}}:{}),...(style==='runeblade'?{ghost:.9}:{}),
   ...(style==='standard'?{standard:true,shape:'none'}:{}),
   ...(style==='chainaxe'?{projectile:true,chain:true,range:380*1.1*(w?.reach??1),sheet:'knight-Pummel'}:{})};
}
export function createCombat() {
  return {rewardLedger:new Set(),attackSequence:0,attack:null,projectiles:[],secondary:[],effects:[],nextCombo:0,chainTimer:0,buffer:0,held:false,hitstop:0,heavyCooldown:0,
    target:{x:1800,y:1300,hp:225,maxHp:225,radius:12,row:2,clock:0,hurt:0,hurtDuration:.24,death:0,state:'alive'},hits:0,kills:0};
}
export function pressAttack(c){c.buffer=.22;c.held=true;c.pressN=(c.pressN??0)+1;}
export function releaseAttack(c){c.held=false;}
export function clearAttackInput(c){c.held=false;c.buffer=0;}
export function requestHeavy(c,player,aim){
  if(c.attack||c.hitstop>0||c.heavyCooldown>0)return false;
  const angle=aim?Math.atan2(aim.y-player.y,aim.x-player.x):player.row*Math.PI/4;
  clearAttackInput(c);c.nextCombo=0;c.chainTimer=0;c.heavyCooldown=HEAVY_CLEAVE.cooldown;
  c.attack={kind:'heavy',index:0,definition:snapshotStrike(c,HEAVY_CLEAVE),angle,row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:0,connected:false,sounded:false};
  return true;
}
export function strikeConnects(player,target,angle,strike,props) {
  if(target.state!=='alive'||target.emerge>0)return false;
  const dx=target.x-player.x,dy=target.y-player.y,distance=Math.hypot(dx,dy);
  if(strike.shape==='none')return false;
  if(strike.shape==='impact'){const n=Math.hypot(Math.cos(angle),Math.sin(angle)/.65),x=player.x+Math.cos(angle)*strike.reach*.6/n,y=player.y+Math.sin(angle)*strike.reach*.6/n;if(Math.hypot(target.x-x,(target.y-y)/.65)>strike.impactRadius+target.radius)return false;
  }else if(strike.shape==='line'){
    const px=dx,py=dy/VERTICAL_REACH_SCALE,ax=Math.cos(angle),ay=Math.sin(angle)/VERTICAL_REACH_SCALE,n=Math.hypot(ax,ay),along=(px*ax+py*ay)/n,side=Math.abs(px*ay-py*ax)/n;
    if(along < -target.radius||along>strike.reach+target.radius||side>(strike.halfWidth??14)+target.radius)return false;
  }else{
  const horizontalReach=strike.reach+target.radius;
  const verticalReach=strike.reach*VERTICAL_REACH_SCALE+target.radius;
  if(Math.hypot(dx/horizontalReach,dy/verticalReach)>1)return false;
  if(distance>target.radius){
    const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
    if(Math.abs(delta)>strike.halfArc+Math.asin(clamp(target.radius/distance,0,1)))return false;
  }
  }
  // Ground footprints occlude attacks. Test along the ray, not the sprite box.
  const steps=Math.max(1,Math.ceil(distance/4));
  for(let i=1;i<steps;i++)if(blocked(player.x+dx*i/steps,player.y+dy*i/steps,props,0,true))return false;
  return true;
}
// Oct 17 (user rule): weapon/projectile hitboxes cover the enemy's whole drawn body, not just its feet.
// Sprites draw 128*scale cells with feet at e.y; the body spans ~72*scale up and ~24*scale to each side.
// (x,y) is the projectile's on-screen position (including its height), pad its own size.
export function bodyHit(e,x,y,pad=0){const sc=e.scale??1,hw=Math.max(e.radius??14,24*sc)+pad,h=(e.hitH??72*sc)+pad;
  // Oct 17: long bodies (Dune Wyrm) use a capsule along their facing: test against the nearest point of the spine.
  if(e.hitLen){const fx=Math.cos(e.face??0),fy=Math.sin(e.face??0)*.65,u=Math.max(-e.hitLen,Math.min(e.hitLen,(x-e.x)*fx+(y-e.y)*fy)),cx=e.x+fx*u,cy=e.y+fy*u;return Math.abs(x-cx)<e.radius*.8+pad&&y>cy-h&&y<cy+pad+30;}
  return Math.abs(x-e.x)<hw&&y>e.y-h&&y<e.y+pad+8;}
export function damageEnemy(c,target,amount,origin,options={}){
  if(target.encounterRoster&&!target.encounterRoster.includes(String(c.ownerId??0)))return [];
  if(target.state!=='alive'||target.timeStopped||target.emerge>0||target.invulnerable>0||shieldBlocksAttack(c.forgeShield,origin,target))return [];
  if(c.cheat){if(c.cheat.oneHit)amount=Math.max(amount,target.hp*2+1000);else amount*=c.cheat.damage||1;}// F2 test menu (localhost only)
  if(options.targetCap&&options.attackId){const action=actor(c).actions.get(options.attackId);if(action){const key=String(target.id)+':'+(options.pass??0),n=action.targets.get(key)??0;if(n>=options.targetCap)return [];action.targets.set(key,n+1);}}
  const weapon=options.weapon??c.weapon;
  const execute=options.cleave&&c.skills?.execution&&target.hp/target.maxHp<=.3;
  const derived=options.basis==='final'||options.basis==='preDefense';
  const critical=!derived&&!options.dot&&Math.random()<boundedBurst(c,'crit',(weapon?.crit??BASE_CRIT_CHANCE)+(c.worldCrit??0)+(c.rangerCrit??0),.6,c.rangerCrit>0?.75:.6);
  const elite=['leader','boss'].includes(target.role)?(weapon?.elite??1):1;
  if(options.heavy||options.counter)target.barrier=0;
  // Oct 16: Colossus armour halves damage outside its exposed windows; exposed bosses take +75% (Oct 17: or exposedMul,
  // the Colossus's per-phase value: 100% kneeling in phases 1-2, 150% in phase 3).
  const resistance=(target.role==='leader'?.8:1)*(target.barrier>0?.35:1)*(target.warded?.75:1)*(target.armored&&!(target.exposed>0)?.5:1)*(target.exposed>0?(target.exposedMul??1.75):1)*(target.armorMul??1);  /* Oct 19: Crimson Tyrant armour stages */
  const raw=derived?amount*(options.basis==='preDefense'?resistance:1):outputAmount(amount,weapon,options.basic?'attack':'ability',options)*(c.rewardDamage??1)*(options.basic?(c.warriorBasicDamage??1)*(c.worldBasicDamage??1):1)*elite*resistance*(critical?Math.min(2.5,weapon?.critDamage??BASE_CRIT_DAMAGE):1)*(execute?1+.2*Number(c.skills.execution):1)*(options.cleave?1+.12*Number(c.skills?.cleaveforce??0):1);
  // Oct 16 (user): every damage number is a whole number, always rounded up.
  const damage=Math.ceil(raw-1e-6);
  const actualDamage=Math.min(damage,target.armorHp>0?target.armorHp:target.hp);
  // Shadow clones pop on any hit; the Wyrm's armour plating absorbs damage before its health.
  if(target.role==='bossClone')target.hp=0;else if(target.armorHp>0)target.armorHp=Math.max(0,target.armorHp-damage);else target.hp=Math.max(0,target.hp-damage);target.hurtDuration=(options.stagger??.24)*(weapon?.stagger??1)+(weapon?.mods?.staggerAdd??0);target.hurt=target.hurtDuration;
  if(!options.dot&&(target.role==='boss'?options.counter&&!(target.warriorStaggerCD>0):target.role==='leader'?options.counter||options.heavy:true)){target.swing=null;if(target.role==='boss')target.warriorStaggerCD=3;}
  if(target.role==='leader'&&!options.counter&&!options.heavy)target.hurt=Math.min(target.hurt,.08);
  if(target.role==='boss'&&!options.counter)target.hurt=Math.min(target.hurt,.1);
  if(c.skills?.bleed&&options.cleave&&!options.dot)target.bleed=2+Number(c.skills.bleed);
  if(options.basic&&!options.secondary&&weapon?.mods?.bleed)(target.weaponBleeds??={})[String(c.ownerId??0)]={remaining:2,pulse:.5,weapon:{...weapon},origin:{...origin}};
  if(options.basic&&!options.secondary&&c.worldBurn&&target.state==='alive'&&target.role!=='anchor')(target.worldBurns??={})[String(c.ownerId??0)]={remaining:3,pulse:.5,weapon};
  const action=options.attackId?actor(c).actions.get(options.attackId):null,statusKey='status:'+target.id;const statusCredit=!options.dot&&!options.secondary&&(!action||!action.targets.has(statusKey));if(action&&statusCredit)action.targets.set(statusKey,1);
  c.hits++;
  const dx=target.x-origin.x,dy=target.y-origin.y,n=Math.hypot(dx,dy)||1;
  if(target.role!=='anchor')movePlayer(target,dx/n*(options.push??5),dy/n*(options.push??5),options.props??[]);
  const events=[{type:'hit',damage,actualDamage,critical,statusCredit,ownerId:c.ownerId??'local',component:options.basic?'attack':'ability',depth:options.depth??0,resource:actualDamage>0&&target.role!=='anchor'?resourceCredit(c,options.attackId,c.classId??'sword',!options.basic||options.secondary):0,attackId:options.attackId,targetId:target.id,basic:!!options.basic,secondary:!!options.secondary,source:options.source??null,index:options.index??0,heavy:!!options.heavy,x:target.x,y:target.y}];
  if(target.hp===0){target.state='dead';target.death=0;target.swing=null;c.kills++;events.push({type:claimDefeat(c,target)?'death':'defeat',eligibleOwners:target.encounterRoster,rewardAnchor:target.rewardAnchor,id:target.id,modifier:target.modifier,xp:target.xp??18,x:target.x,y:target.y,role:target.role,world:!!target.worldEvent,bossKind:target.bossKind??null});}
  return events;
}
export function tickCombat(c,player,aim,props,dt,canAttack=true) {
  if(!c.classId||c.classId==='sword')advanceActor(c,dt);
  const events=[...tickThrownWeapons(c,props,dt),...tickSecondary(c,props,dt)];
  for(let i=c.effects.length-1;i>=0;i--){c.effects[i].age+=dt;if(c.effects[i].age>.5)c.effects.splice(i,1);}
  c.heavyCooldown=Math.max(0,c.heavyCooldown-dt);
  if(c.hitstop>0){c.hitstop=Math.max(0,c.hitstop-dt);if(c.attack?.kind!=='combo')return events;} // Cosmetic LMB hitstop must not extend its attack interval.
  c.chainTimer=Math.max(0,c.chainTimer-dt);
  const targets=c.targets??[c.target];
  for(const target of targets){
    if(target.timeStopped)continue;
    const owner=String(c.ownerId??0);if(target.weaponBleeds?.[owner]&&target.state==='alive'){const bleed=target.weaponBleeds[owner];bleed.remaining-=dt;bleed.pulse-=dt;if(bleed.pulse<=0){bleed.pulse+=.5;events.push(...damageEnemy(c,target,2,player,{props,basic:true,secondary:true,dot:true,push:0,stagger:0,weapon:bleed.weapon}));}if(bleed.remaining<=0)delete target.weaponBleeds[owner];}
    for(const k of ['bleed','burn','poison']){const d=target.wDots?.[owner+':'+k];if(!d)continue;if(target.state!=='alive'){delete target.wDots[owner+':'+k];continue;}d.remaining-=dt;d.pulse-=dt;if(d.pulse<=0){d.pulse+=.5;events.push(...damageEnemy(c,target,DOT[k]*(d.stacks??1),player,{props,basic:true,secondary:true,dot:true,push:0,stagger:0,weapon:d.weapon}));}if(d.remaining<=0)delete target.wDots[owner+':'+k];}
    const burn=target.worldBurns?.[owner];if(burn&&target.state==='alive'){burn.remaining-=dt;burn.pulse-=dt;if(burn.pulse<=0){burn.pulse+=.5;events.push(...damageEnemy(c,target,3,player,{weapon:burn.weapon,dot:true,secondary:true,push:0,props,source:'campBurn'}));}if(burn.remaining<=0)delete target.worldBurns[owner];}
    target.clock+=dt;target.hurt=Math.max(0,target.hurt-dt);
    if(target.state==='dead')target.death+=dt;
    else if(!target.swing)target.row=directionRow(player.x-target.x,player.y-target.y);
  }
  tickWarStandard(c,player,props,dt,events);
  c.guardT=Math.max(0,(c.guardT??0)-dt);c.shieldWall=c.weapon?.style==='spearshield'&&c.held&&canAttack;c.weaponGuard=Math.max(c.shieldWall?.3:0,c.guardT>0?.5:0);
  if(canAttack&&!c.lunge&&attackReady(c)&&!c.attack&&(c.held||c.buffer>0)&&standardReady(c)){
    const index=c.chainTimer>0?c.nextCombo:0;
    const angle=aim?Math.atan2(aim.y+(c.weapon?.style==='axe'||c.weapon?.style==='chainaxe'?30:0)-player.y,aim.x-player.x):player.row*Math.PI/4;
    const action=beginAction(c,snapshotStrike(c,STRIKES[index],true,index).duration);
    c.attack={kind:'combo',weapon:action.weapon,id:action.id,index,definition:snapshotStrike(c,STRIKES[index],true,index),angle,row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:0,connected:false,sounded:false,aimPt:aim?{x:aim.x,y:aim.y}:null};
    if(c.weapon?.style==='katana')c.attack.element=KATANA[(c.katanaN=(c.katanaN??-1)+1)%4];
    c.buffer=0;events.push({type:'swing',index});
  }
  c.buffer=Math.max(0,c.buffer-dt);
  const a=c.attack;if(!a)return events;
  const strike=attackDefinition(a);const heavy=a.kind==='heavy';const before=a.elapsed;a.elapsed+=dt;
  const start=strike.duration*strike.hitStart,end=strike.duration*strike.hitEnd;
  /* Oct 18 (user: hammer "slam slam then jump forward slam"): the 3rd Warhammer hit leaps HAMMER_LEAP px along the aim between
     12% of the swing and the impact (walls stop it), so the slam lands where he lands. */
  if(!heavy&&strike.style==='hammer'&&a.index===2&&before<start){const l0=strike.duration*.12,q=x=>clamp((x-l0)/Math.max(.01,start-l0),0,1),d=HAMMER_LEAP*(q(a.elapsed)-q(before));if(d>0)movePlayer(player,Math.cos(a.angle)*d,Math.sin(a.angle)*d,props);}
  if(!heavy&&strike.lunge&&before<start){const l0=strike.duration*.1,q=x=>clamp((x-l0)/Math.max(.01,start-l0),0,1),d=strike.lunge*(q(a.elapsed)-q(before));if(d>0)movePlayer(player,Math.cos(a.angle)*d,Math.sin(a.angle)*d,props);}
  if(!a.sounded&&a.elapsed>=start){a.sounded=true;events.push({type:'whoosh',index:a.index,heavy});
    /* at the strike moment: Maul ring, gauntlet punch wave, War Standard throw / lunge */
    if(!heavy&&strike.shock){const n=Math.hypot(Math.cos(a.angle),Math.sin(a.angle)/.65),pt={x:player.x+Math.cos(a.angle)*strike.reach*.6/n,y:player.y+Math.sin(a.angle)*strike.reach*.6/n};if(c.secondary.length<16)c.secondary.push({delay:.06,origin:pt,angle:a.angle,strike:{reach:strike.shock.radius,halfArc:Math.PI,damage:strike.damage*strike.shock.factor},weapon:a.weapon,attackId:a.id,stagger:.5,push:10,fx:'maulRing',skip:a.pulseTargets?.[0]});}
    if(!heavy&&strike.ghost&&c.secondary.length<16)c.secondary.push({delay:.14,origin:{x:player.x,y:player.y},angle:a.angle,strike:{reach:strike.reach*1.15,halfArc:strike.halfArc*1.15,damage:strike.damage*strike.ghost},weapon:a.weapon,attackId:a.id,stagger:.2,push:6,fx:'ghostSwing',skip:a.pulseTargets?.[0]});
    if(!heavy&&strike.shockLine&&c.secondary.length<16)c.secondary.push({delay:.06,origin:{x:player.x,y:player.y},angle:a.angle,strike:{shape:'line',reach:strike.shockLine.reach,halfWidth:strike.shockLine.halfWidth,damage:strike.damage*strike.shockLine.factor},weapon:a.weapon,attackId:a.id,stagger:.25,push:10,fx:'punchWave',skip:a.pulseTargets?.[0]});
    if(!heavy&&strike.standard){if(c.standard?.landed)startLunge(c,player,a,strike);else if(!c.standard)throwStandard(c,player,a,strike);}}
  if(strike.projectile){
    if(!a.launched&&a.elapsed>=start){a.launched=true;const mods=strike.mods,count=Math.min(3,1+(mods.extra??0));for(let i=0;i<count&&c.projectiles.length<24;i++)c.projectiles.push({kind:'axe',attackId:a.id,x:player.x,y:player.y,origin:{x:player.x,y:player.y},angle:a.angle+(count>1?(i/(count-1)*2-1)*.12:0),remaining:strike.range,age:0,damage:strike.damage*(mods.projectileFactor??1),index:a.index,weapon:a.weapon,hitTargets:new Set(),pierce:(strike.chain?5:3)+(mods.pierce??0),ricochets:mods.ricochet??0,returning:!!mods.returning||strike.style==='axe'||!!strike.chain,chain:!!strike.chain});}

  }else{
    const pulses=strike.pulses??[strike.hitStart];a.pulseTargets??=pulses.map(()=>new Set());
    for(const [pulse,phase] of pulses.entries()){
      const from=strike.duration*phase,to=strike.pulses?from+strike.duration*.14:end;
      for(const target of targets)if(!a.pulseTargets[pulse].has(target)&&before<=to&&a.elapsed>=from&&strikeConnects(player,target,a.angle,strike,props)){
        a.connected=true;a.pulseTargets[pulse].add(target);c.hitstop=heavy?.07:strike.style==='dual'?.012:a.index===2?.055:.035;
        const hitEv=damageEnemy(c,target,strike.damage,player,{attackId:a.id,weapon:a.weapon,stagger:heavy?.42:strike.style==='greatsword'||strike.style==='maul'||strike.style==='greataxe'?.36:.18,basic:!heavy,push:heavy?10:strike.push??(c.weapon?.mods?.pull?-c.weapon.mods.pull:c.weapon?.mods?.push??5),cleave:heavy,heavy,index:a.index,props});events.push(...hitEv);
        if(!heavy&&hitEv.some(v=>v.type==='hit'))events.push(...weaponOnHit(c,target,strike,a,player,props));
      }
    }
  }
  if(!heavy&&!a.echoQueued&&a.elapsed>=start&&strike.mods.echo&&(!strike.mods.finisherEcho||a.index===2)){a.echoQueued=true;if(c.secondary.length<16)c.secondary.push({delay:.22,origin:{...player},angle:a.angle,strike:{...strike,damage:strike.damage*strike.mods.echo},weapon:a.weapon});}
  if(a.elapsed>=strike.duration){c.attack=null;c.nextCombo=heavy?0:(a.index+1)%3;c.chainTimer=heavy?0:.4;}
  return events;
}
export function attackFrame(attack) {
  return Math.min(14,Math.floor(attack.elapsed/attackDefinition(attack).duration*15));
}

function tickThrownWeapons(c,props,dt){
 const events=[];
 for(let i=c.projectiles.length-1;i>=0;i--){const b=c.projectiles[i],travel=Math.min(b.remaining,560*(b.weapon?.projectile??1)*dt),steps=Math.max(1,Math.ceil(travel/4));b.age+=dt;let stopped=false;
   for(let j=0;j<steps;j++){
     const next={x:b.x+Math.cos(b.angle)*travel/steps,y:b.y+Math.sin(b.angle)*travel/steps};
     if(blocked(next.x,next.y,props,0,true)||shieldBlocksAttack(c.forgeShield,b,next)){stopped=true;break;}b.x=next.x;b.y=next.y;
     if(b.returned&&Math.hypot(b.x-b.origin.x,b.y-b.origin.y)<18){stopped=true;break;}
     const target=(c.targets??[c.target]).find(e=>e.state==='alive'&&!(e.emerge>0)&&!b.hitTargets.has(e)&&projectileHitsBody(b,e));
     if(target){events.push(...damageEnemy(c,target,b.damage,b.origin,{props,basic:true,attackId:b.attackId,secondary:!!b.returned,index:b.index,weapon:b.weapon,push:12}));b.hitTargets.add(target);
       if(b.chain&&!b.returned&&target.role!=='boss'&&target.role!=='anchor')(b.hooked??=[]).push(target);
       if(b.ricochets>0){const other=(c.targets??[]).find(e=>e.state==='alive'&&!b.hitTargets.has(e)&&Math.hypot(e.x-b.x,e.y-b.y)<180);if(other){b.ricochets--;b.angle=Math.atan2(other.y-b.y,other.x-b.x);b.damage*=.6;}}
       if(b.hitTargets.size>=b.pierce){if(b.returning&&!b.returned)turnBack(b);else stopped=true;break;}
     }
   }if(b.returned&&b.hooked)for(const h of b.hooked)if(h.state==='alive'){const dx=b.x-h.x,dy=b.y-h.y,n=Math.hypot(dx,dy);if(n>4)movePlayer(h,dx/n*Math.min(n,620*dt),dy/n*Math.min(n,620*dt),props);}
   b.remaining-=travel;if(!stopped&&b.remaining<=0&&b.returning&&!b.returned)turnBack(b);
   if(b.chain&&b.returned&&(stopped||b.remaining<=0)&&!b.slammed){b.slammed=true;for(const e of b.hooked??[])if(e.state==='alive'&&Math.hypot(e.x-b.origin.x,(e.y-b.origin.y)/.65)<160+(e.radius??14))events.push(...damageEnemy(c,e,b.damage/.55*1.5,b.origin,{props,basic:true,secondary:true,attackId:b.attackId,weapon:b.weapon,heavy:true,stagger:.4,push:8}));if(c.effects.length<24)c.effects.push({kind:'maulRing',x:b.origin.x,y:b.origin.y,reach:110,age:0});}if(stopped||b.remaining<=0)c.projectiles.splice(i,1);
 }return events;
}
function turnBack(b){b.returned=true;b.angle=Math.atan2(b.origin.y-b.y,b.origin.x-b.x);b.remaining=Math.hypot(b.origin.x-b.x,b.origin.y-b.y)+10;b.hitTargets=new Set();b.damage*=.55;b.ricochets=0;}
function tickSecondary(c,props,dt){
 const events=[];for(let i=c.secondary.length-1;i>=0;i--){const e=c.secondary[i];e.delay-=dt;if(e.delay>0)continue;
   for(const target of c.targets??[c.target])if(!e.skip?.has(target)&&strikeConnects(e.origin,target,e.angle,e.strike,props))events.push(...damageEnemy(c,target,e.strike.damage,e.origin,{props,basic:true,secondary:true,weapon:e.weapon,attackId:e.attackId,push:e.push??0,stagger:e.stagger??.08}));
   if(c.effects.length<24)c.effects.push({x:e.origin.x,y:e.origin.y,reach:e.strike.reach,age:0,kind:e.fx??'echo',angle:e.angle});c.secondary.splice(i,1);
 }return events;
}

/* Oct 18 Warrior families: on-hit extras, the War Standard and weapon DoTs. Values are balance-band proposals. */
const KATANA=['fire','frost','poison','shock'],DOT={bleed:6,burn:10,poison:5},STANDARD={range:420,fall:.35,life:1.65,cd:2,radius:175,lungeSpeed:1500,lungeWidth:80,guard:.5};
function addDot(c,target,kind,stacks,max,dur,weapon){const key=String(c.ownerId??0)+':'+kind,d=((target.wDots??={})[key]??={kind,stacks:0,pulse:.5});d.stacks=Math.min(max,d.stacks+stacks);d.remaining=dur;d.weapon={...weapon};}
export const weaponDot=(e,kind)=>Math.max(0,...Object.values(e.wDots??{}).filter(d=>d.kind===kind).map(d=>d.remaining));
function weaponOnHit(c,target,strike,a,player,props){const out=[];if(target.state!=='alive')return out;
 if(strike.bleed){addDot(c,target,'bleed',strike.bleed,5,3,a.weapon);const d=target.wDots[String(c.ownerId??0)+':bleed'];if(strike.style==='dual'&&d.stacks>=3)for(const e of c.targets??[])if(e!==target&&e.state==='alive'&&Math.hypot(e.x-target.x,e.y-target.y)<190)addDot(c,e,'bleed',3,5,3,a.weapon);}
 /* Oct 18 AoE pass (user: crowd ~8K+): splash around the struck enemy (it is not hit again), once per swing. */
 const sp=strike.splash;if(sp&&!a.splashed&&(!sp.minStacks||(target.wDots?.[String(c.ownerId??0)+':bleed']?.stacks??0)>=sp.minStacks)){a.splashed=true;for(const e of c.targets??[])if(e!==target&&e.state==='alive'&&Math.hypot(e.x-target.x,(e.y-target.y)/.65)<sp.radius+(e.radius??14))out.push(...damageEnemy(c,e,strike.damage*sp.factor,target,{props,basic:true,secondary:true,weapon:a.weapon,attackId:a.id,push:6,stagger:.15}));if(c.effects.length<24)c.effects.push({kind:'splash',x:target.x,y:target.y,reach:sp.radius,age:0,el:a.element});}
 const el=a.element;if(el==='fire'){addDot(c,target,'burn',1,1,3,a.weapon);for(const e of c.targets??[])if(e!==target&&e.state==='alive'&&Math.hypot(e.x-target.x,e.y-target.y)<180)addDot(c,e,'burn',1,1,3,a.weapon);}else if(el==='poison'){addDot(c,target,'poison',2,5,4,a.weapon);for(const e of c.targets??[])if(e!==target&&e.state==='alive'&&Math.hypot(e.x-target.x,e.y-target.y)<160)addDot(c,e,'poison',2,5,4,a.weapon);}else if(el==='frost')target.slow=Math.max(target.slow??0,1.5);
 else if(el==='shock'&&!a.zapped){a.zapped=true;target.shock=Math.max(target.shock??0,2);const near=(c.targets??[]).filter(e=>e!==target&&e.state==='alive'&&Math.hypot(e.x-target.x,e.y-target.y)<190).slice(0,4);
  for(const e of near){out.push(...damageEnemy(c,e,strike.damage*.6,target,{props,basic:true,secondary:true,weapon:a.weapon,attackId:a.id,push:0,stagger:.1}));e.shock=Math.max(e.shock??0,2);}if(c.effects.length<24)c.effects.push({kind:'zap',x:target.x,y:target.y,pts:near.map(e=>({x:e.x,y:e.y})),age:0,reach:0});}
 return out;}
function throwStandard(c,player,a,strike){const t=a.aimPt??{x:player.x+Math.cos(a.angle)*300,y:player.y+Math.sin(a.angle)*300},dx=t.x-player.x,dy=t.y-player.y,d=Math.hypot(dx,dy)||1,R=Math.min(d,STANDARD.range*(a.weapon?.reach??1));
 c.standardCD=STANDARD.cd;c.standard={pressN:c.pressN??0,x:player.x+dx/d*R,y:player.y+dy/d*R,t:0,landed:false,damage:strike.damage*1.4,attackId:a.id,weapon:a.weapon,radius:STANDARD.radius*(a.weapon?.aoe??1)};}
function startLunge(c,player,a,strike){const s=c.standard,d=Math.hypot(s.x-player.x,s.y-player.y);c.lunge={x0:player.x,y0:player.y,tx:s.x,ty:s.y,t:0,dur:Math.max(.08,d/STANDARD.lungeSpeed),hit:new Set(),damage:strike.damage,attackId:a.id,weapon:a.weapon};}
/* Oct 18 fix (user): 2 s from the throw to recast and lunge back to it (then it is gone); no new throw until that 2 s cooldown ends;
   the lunge needs a fresh click (holding LMB no longer lunges at once); throws reach 420 at most. */
function standardReady(c){if(c.weapon?.style!=='standard')return true;if(c.standard)return c.standard.landed&&(c.pressN??0)>c.standard.pressN;return !(c.standardCD>0);}
function tickWarStandard(c,player,props,dt,events){c.standardCD=Math.max(0,(c.standardCD??0)-dt);const s=c.standard,L=c.lunge,targets=c.targets??[c.target];
 if(s){s.t+=dt;if(!s.landed&&s.t>=STANDARD.fall){s.landed=true;s.landT=s.t;for(const e of targets)if(strikeConnects(s,e,0,{reach:s.radius,halfArc:Math.PI},props))events.push(...damageEnemy(c,e,s.damage,s,{props,basic:true,attackId:s.attackId,weapon:s.weapon,heavy:true,stagger:.4,push:14}));if(c.effects.length<24)c.effects.push({kind:'standardLand',x:s.x,y:s.y,reach:s.radius,age:0});}
  if(s.landed&&!L&&s.t>STANDARD.fall+STANDARD.life)c.standard=null;}
 if(L){const before=Math.min(1,L.t/L.dur);L.t+=dt;const k=Math.min(1,L.t/L.dur),x=L.x0+(L.tx-L.x0)*k,y=L.y0+(L.ty-L.y0)*k;movePlayer(player,x-player.x,y-player.y,props);
  for(const e of targets)if(e.state==='alive'&&!L.hit.has(e)&&Math.hypot(e.x-player.x,(e.y-player.y)/.65)<STANDARD.lungeWidth+(e.radius??14)){L.hit.add(e);events.push(...damageEnemy(c,e,L.damage,player,{props,basic:true,attackId:L.attackId,weapon:L.weapon,heavy:true,stagger:.5,push:24}));}
  if(k>=1){c.lunge=null;c.standard=null;c.guardT=STANDARD.guard;if(c.effects.length<24)c.effects.push({kind:'standardLunge',x:player.x,y:player.y,reach:90,age:0});}}}
