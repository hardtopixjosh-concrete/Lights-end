import {eliteBag,nextEliteGap} from './wave-roster.js?v=fx-260';
import {specialDemon,basicImp} from './demon-roster.js?v=fx-260';
import {miniBossHealth} from './boss-choices.js?v=fx-260';
import {learn,rank} from './specializations.js?v=fx-260';
import {blocked,movePlayer,directionRow,steerMove} from './simulation.js?v=fx-260';
import {spawn,receiveHit} from './survival.js?v=fx-260';
import {ENEMY_ATTACK_SPEED,ENEMY_SPEED,enemyHealth} from './encounter-space.js?v=fx-260';
import {assignElite,addExplosion} from './elite-powers.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {worldScale} from './world-events.js?v=fx-260';
import {everyone,wasHit,markHit,bossTarget,nextBossTarget} from './party.js?v=fx-260';
export {PATH_NODES as SKILLS} from './specializations.js?v=fx-260';
export function createRewards(s,c,gold=0){
 s.skills={};s.points=0;s.levelPointsEarned=0;s.levelPicksAwarded=0;s.pendingPicks=[];s.offer=null;s.cardStats={};s.cardHistory=[];s.bonusPointsEarned=0;s.path=null;s.pathLocked=false;s.guard=0;c.skills=s.skills;
 // Oct 16: the Ravager no longer arrives every 3 minutes; it lives in its pit (pits.js). Main bosses come from run-director.js.
 // Oct 18 (user): elites roll at random gaps through the whole run; s.hazards lets wave enemies (pound/lob) use the elite hazard system.
 const hazards=[];s.hazards=hazards;
 return {gold,runGold:0,drops:[],eliteAt:30+Math.random()*60,eliteIndex:0,eliteBag:eliteBag(),hazards,bossAt:Infinity,bossesKilled:0};
}
export const buySkill=learn;
export function rewardEvents(r,s,events){
 for(const e of [...events])if(e.type==='death'&&e.role!=='anchor'){
   if(e.modifier==='explosive')addExplosion(r,e,true);
   const base=e.role==='boss'?120:e.role==='leader'?60:Math.random()<.18?2+Math.floor(Math.random()*4):0,amount=Math.round(base*(e.role==='leader'?s.world?.eliteGold??1:1)*(['boss','leader'].includes(e.role)?s.weaponPassives?.gold??1:1)*(e.world?worldScale(s.clock).gold:1));
   if(amount)r.drops.push({x:e.x,y:e.y,amount,clock:0});
   if(e.role==='boss'){r.bossesKilled++;s.pressureRestUntil=Math.max(s.pressureRestUntil??0,s.clock+15);r.eliteAt=Math.max(r.eliteAt,s.clock+20);}
 }
}
export function summonBoss(r,s,c,p,props,view){
 if(c.targets.some(e=>e.role==='boss'&&e.state==='alive'))return false;
 const b=spawn(s,c,p,props,view,true);if(!b)return false;
 Object.assign(b,{role:'boss',bossSkin:'golem',bodyHalfWidth:29,bodyHeight:82,rangedCast:null,name:'DUNE RAVAGER',hpTier:'miniboss',hp:miniBossHealth(s.clock),maxHp:miniBossHealth(s.clock),radius:28,speed:ENEMY_SPEED.boss,scale:2.35,xp:160,age:0,cooldown:.6,pattern:0,attackDamage:38,unparryable:false,special:null,specialCD:3,specialIndex:-1});return true;
}
export function summonElite(r,s,c,p,props,view){
 if(c.targets.filter(e=>e.role==='leader'&&e.state==='alive').length>=1)return false;// Oct 16 (user): one roaming elite at a time (was 2).
 const leader=spawn(s,c,p,props,view,true);if(!leader)return false;
 Object.assign(leader,{role:'leader',hpTier:'elite',hp:enemyHealth('elite',s.clock),maxHp:enemyHealth('elite',s.clock),scale:2.2,speed:ENEMY_SPEED.leader,xp:65,radius:26,attackDamage:35});specialDemon(leader,{elite:true});if(!r.eliteBag?.length)r.eliteBag=eliteBag();r.eliteIndex++;assignElite(leader,r.eliteBag.pop());
 for(let i=0;i<3;i++){const a=i*2.094,x=leader.x+Math.cos(a)*50,y=leader.y+Math.sin(a)*50;if(!blocked(x,y,props,13,true)&&c.targets.filter(e=>e.state==='alive').length<150)c.targets.push({...leader,id:++s.id,x,y,role:'swarmer',...basicImp(),specialKind:null,rangedCast:null,modifier:null,eliteName:null,eliteColor:null,hpTier:'swarmer',hp:enemyHealth('swarmer',s.clock),maxHp:enemyHealth('swarmer',s.clock),radius:12,scale:1.25,speed:ENEMY_SPEED.swarmer,xp:18,attackDamage:14});}
 r.eliteAt=s.clock+nextEliteGap();return leader;
}
export function tickRewards(r,s,c,p,props,view,dt){
 if(s.dead)return [];
 const events=[];s.guard=Math.max(0,s.guard-dt);
 for(let i=r.drops.length-1;i>=0;i--){const d=r.drops[i];d.clock+=dt;const dx=p.x-d.x,dy=p.y-d.y,n=Math.hypot(dx,dy);
   if(n<90)movePlayer(d,dx/(n||1)*260*dt,dy/(n||1)*260*dt,props.filter(p=>!p.forgeShield));
   if(Math.hypot(p.x-d.x,p.y-d.y)<22){r.gold+=d.amount;r.runGold+=d.amount;r.drops.splice(i,1);events.push({type:'gold',amount:d.amount});}
 }
 if(!s.finalPhase&&!s.timeStop&&s.clock>=(s.pressureRestUntil??0)&&!(s.world?.optionalActive>0)&&!c.targets.some(e=>e.role==='boss'&&e.state==='alive'&&!e.pit)&&s.clock<r.bossAt-15&&s.clock>=r.eliteAt&&c.targets.filter(e=>e.role==='leader'&&e.state==='alive').length<1){
   const leader=summonElite(r,s,c,p,props,view);if(leader)events.push({type:'elite',name:leader.eliteName});
 }
 if(!(s.world?.optionalActive>0)&&s.clock>=r.bossAt&&!c.targets.some(e=>e.role==='boss'&&e.state==='alive'))if(summonBoss(r,s,c,p,props,view)){r.bossAt=s.clock+180;events.push({type:'bossArrival'});}
 if(s.cast?.kind==='storm'&&s.skills.pull)for(const e of c.targets)if(e.state==='alive'&&e.role!=='boss'){
   if(shieldBlocksAttack(s.forgeShield,p,e))continue;
   const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy/.65);if(n>35&&n<220)movePlayer(e,dx/(n||1)*(60+20*rank(s,'pull'))*dt,dy/(n||1)*(60+20*rank(s,'pull'))*dt,props);
 }
 const pLocal=p;for(const b of c.targets)if(b.role==='boss'&&b.state==='alive'&&(!b.bossKind||b.bossKind==='ravager')&&!b.sleeping&&!b.leashing){let p=bossTarget(b,pLocal);const lost=!!p.unseen;if(lost)p=p.lastSeen??p;  /* Oct 18: hidden target (Smoke Bomb) */  // Multiplayer (Oct 17, user): no focus; a random player per attack
   // Oct 16 (user: ENRAGED on every boss): the Ravager enrages below 50% like the others: +30% speed, specials every 2.6s.
   if(!b.phase2&&b.hp<b.maxHp*.5){b.phase2=true;b.speed*=1.3;events.push({type:'worldNotice',text:b.name+' is enraged!'},{type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}
   if(b.emerge>0){b.emerge=Math.max(0,b.emerge-dt);b.moving=false;continue;}
   b.slow=Math.max(0,(b.slow??0)-dt);
   b.cooldown=Math.max(0,b.cooldown-dt);const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);
   // Oct 16 (user): all telegraphs .38s just before the hit (was .55-.9s).
   // Oct 15 (faster pass): specials every 3.4s (first at 3s), melee windups .55/.75s with .75s recovery, walk 60. Earlier harder pass: charge 1250/s homing at 2.4 rad/s up to 640; 8 boulders; 4 rings .6s apart at 220/s with three safe gaps each (slowed Oct 15).
   // Oct 15 user request: extra avoidable mechanics on a rotation between swings (playtest values):
   // Boulder Rain (6 staggered falling boulders around the player), Ravager Charge (telegraphed lane, then a
   // fast charge with knockback) and Quake Rings (three expanding shockwave rings, each with a safe gap).
   b.specialCD=(b.specialCD??3)-dt;
   if(b.special){const sp=b.special;sp.elapsed+=dt;b.moving=false;
     if(sp.kind==='charge'){
       // Oct 15 (user): straight double charge. Each leg aims at the player when its wind-up starts and never turns;
       // after the first leg he pauses briefly (the second wind-up, .6s with a fresh telegraph) and charges again.
       if(sp.elapsed>=sp.windup){const step=1250*dt;for(let t=0;t<step;t+=5){const nx=b.x+Math.cos(sp.angle)*5,ny=b.y+Math.sin(sp.angle)*5;if(blocked(nx,ny,props,b.radius)||(sp.travel??0)>=sp.len){sp.done=true;break;}b.x=nx;b.y=ny;sp.travel=(sp.travel??0)+5;b.moving=true;
         for(const pl of everyone(p)){if(!wasHit(sp,pl,'hit')&&Math.hypot(pl.x-b.x,(pl.y-b.y)/.65)<62){markHit(sp,pl,'hit');events.push(...receiveHit(s,c,pl,{...b,attackDamage:45,unparryable:true},props));const n=Math.hypot(pl.x-b.x,pl.y-b.y)||1;movePlayer(pl,(pl.x-b.x)/n*40,(pl.y-b.y)/n*40,props);}}/* multiplayer: every standing player */}
         if(sp.lane)Object.assign(sp.lane,{x:b.x,y:b.y,len:Math.max(0,sp.len-(sp.travel??0))});
         if(sp.done){if(sp.lane){const li=r.hazards.indexOf(sp.lane);if(li>=0)r.hazards.splice(li,1);}events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});
           if((sp.legs=(sp.legs??2)-1)>0){const ex=p.x-b.x,ey=p.y-b.y;Object.assign(sp,{elapsed:0,windup:.38,angle:Math.atan2(ey,ex),len:Math.min(640,Math.hypot(ex,ey)+260),travel:0,hit:false,done:false});b.row=directionRow(ex,ey);sp.lane={kind:'lane',x:b.x,y:b.y,angle:sp.angle,len:sp.len,width:62,age:0,warning:.38,duration:3,owner:b.id};r.hazards.push(sp.lane);}
           else{b.special=null;b.cooldown=.6;}}}
     }else{
       if(!sp.fired&&sp.elapsed>=sp.windup){sp.fired=true;
         if(sp.kind==='boulders')for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,dist=i?60+Math.random()*170:0;r.hazards.push({kind:'boulder',x:p.x+Math.cos(a)*dist,y:p.y+Math.sin(a)*dist*.65,radius:62,age:0,warning:.38+i*.14,duration:.5,owner:b.id,fired:false});}
         if(sp.kind==='rings'){for(let i=0;i<4;i++){const g0=Math.random()*Math.PI*2;r.hazards.push({kind:'ring',x:b.x,y:b.y,age:0,warning:i*.6,duration:2.4,speed:220,band:18,gaps:[g0,g0+Math.PI*2/3,g0+Math.PI*4/3],gapHalf:.42,owner:b.id});}events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}}
       if(sp.elapsed>=sp.duration){b.special=null;b.cooldown=.5;}
     }
     continue;
   }
   if(lost){b.moving=false;b.swing=null;continue;}
   if(!b.swing&&b.hurt<=0&&b.specialCD<=0&&d<620){const kind=['boulders','charge','rings'][(b.specialIndex=(b.specialIndex??-1)+1)%3];p=nextBossTarget(b,pLocal);const angle=Math.atan2(p.y-b.y,p.x-b.x);b.specialCD=b.phase2?2.6:3.4;b.row=directionRow(Math.cos(angle),Math.sin(angle));
     b.special={kind,elapsed:0,windup:.38,duration:kind==='boulders'?1.1:1.3,angle};
     if(kind==='charge'){b.special.len=Math.min(640,d+260);const lane={kind:'lane',x:b.x,y:b.y,angle,len:b.special.len,width:62,age:0,warning:.38,duration:3,owner:b.id};r.hazards.push(lane);b.special.lane=lane;}
     continue;}
   if(b.swing){const a=b.swing;a.elapsed+=dt;
     const lockTime=a.windup-(a.kind==='smash'?.3:.18);
     const tracking=!a.fired&&a.elapsed<lockTime;
     if(tracking){a.angle=Math.atan2(dy,dx);b.row=directionRow(dx,dy);}
     const speed=(a.fired?b.speed:tracking?ENEMY_SPEED.swarmer:a.kind==='sweep'?156:0)*ENEMY_ATTACK_SPEED;
     const travel=Math.min(Math.max(0,d-48),speed*(b.slow>0?.4:b.mageChill>0?1-(b.mageSlow??.2):1)*dt);
     if(travel>0){const ox=b.x,oy=b.y;steerMove(b,(tracking||a.fired?dx/(d||1):Math.cos(a.angle))*travel,(tracking||a.fired?dy/(d||1):Math.sin(a.angle))*travel,props,dt);b.moving=Math.hypot(b.x-ox,b.y-oy)>.05;}
     const hx=p.x-b.x,hy=p.y-b.y,hitDistance=Math.hypot(hx,hy);
     if(!a.fired&&a.elapsed>=a.windup){a.fired=true;b.unparryable=a.kind==='smash';b.attackDamage=a.kind==='smash'?55:38;
       for(const pl of everyone(p)){const hx=pl.x-b.x,hy=pl.y-b.y,hitDistance=Math.hypot(hx,hy);  // multiplayer: everyone in the swing
       const delta=Math.atan2(Math.sin(Math.atan2(hy,hx)-a.angle),Math.cos(Math.atan2(hy,hx)-a.angle));
       if(Math.hypot(hx,hy/.65)<a.reach+13&&(a.kind==='smash'||Math.abs(delta)<1.25)){
         let clear=true;const n=Math.ceil(hitDistance/5);for(let i=1;i<n;i++)if(blocked(b.x+hx*i/n,b.y+hy*i/n,props,0,true)){clear=false;break;}
         if(clear)events.push(...receiveHit(s,c,pl,b,props));
       }}
       events.push({type:'bossImpact',x:b.x,y:b.y,kind:a.kind});
     }
     if(b.swing&&a.elapsed>a.windup+.45){b.swing=null;b.cooldown=.75;b.unparryable=false;}
   }else if(d<160&&b.cooldown<=0){const kind=b.pattern++%2?'smash':'sweep';b.row=directionRow(dx,dy);b.swing={kind,elapsed:0,windup:kind==='smash'?.45:.35,angle:Math.atan2(dy,dx),reach:kind==='smash'?155:115,fired:false};}
   else if(b.hurt<=0){const travel=Math.min(Math.max(0,d-48),b.speed*(b.slow>0?.4:b.mageChill>0?1-(b.mageSlow??.2):1)*dt);steerMove(b,dx/(d||1)*travel,dy/(d||1)*travel,props,dt);b.row=directionRow(dx,dy);b.moving=travel>0;}
 }
 return events;
}
