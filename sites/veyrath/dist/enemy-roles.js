import {summonReward} from './encounter-rules.js?v=fx-260';
// Oct 16 (#5–7): the three missing PDF enemy roles. Chargers wind up then commit to a straight
// charge; Guardians are large blockers that ward nearby demons; Summoners keep their distance and
// call capped reinforcements. Appearance reuses the demon sheets with a tint. Values are playtest seeds.
import {blocked,directionRow,steerMove,movePlayer} from './simulation.js?v=fx-260';
import {basicImp} from './demon-roster.js?v=fx-260';
import {ENEMY_SPEED,enemyHealth} from './encounter-space.js?v=fx-260';
export const ROLE_LOOKS={
 charger:{skin:'demon-rift',scale:1.6,name:'DUNE CHARGER',color:'#ffb35c',tint:'sepia(.5) saturate(2.2) hue-rotate(-10deg) brightness(1.05)'},
 guardian:{skin:'demon-melee',scale:2.35,name:'BASTION GUARDIAN',color:'#b9c7d8',tint:'grayscale(.7) brightness(.85) contrast(1.25)'},
 summoner:{skin:'demon-caster',scale:1.6,name:'HEX SUMMONER',color:'#b6f29a',tint:'sepia(.4) saturate(2) hue-rotate(60deg) brightness(1.05)'}
};
// Unlock times and live caps scale through the run.
export function rollRole(time,targets,rng=Math.random){
 const alive=role=>targets.filter(e=>e.state==='alive'&&e.role===role).length;
 if(time>=600&&alive('summoner')<(time>=1200?3:2)&&rng()<.04)return 'summoner';
 if(time>=420&&alive('guardian')<(time>=1200?4:2)&&rng()<.045)return 'guardian';
 if(time>=240&&alive('charger')<(time>=1200?8:4)&&rng()<.09)return 'charger';
 return null;
}
export function applyRole(e,role,level){
 const look=ROLE_LOOKS[role],tier={charger:'medium',guardian:'heavy',summoner:'standard'}[role],hp=Math.round(enemyHealth(tier,level)*(role==='guardian'?1.2:1));
 Object.assign(e,{role,skin:look.skin,scale:look.scale,tint:look.tint,enemyName:look.name,hpTier:tier,hp,maxHp:hp,
  speed:role==='guardian'?40:role==='charger'?ENEMY_SPEED.swarmer*.9:ENEMY_SPEED.bruiser,radius:role==='guardian'?22:12,
  xp:role==='guardian'?55:role==='summoner'?40:30,attackDamage:role==='guardian'?34:role==='charger'?18:10,
  bodyHalfWidth:role==='guardian'?28:22,bodyHeight:role==='guardian'?80:68,chargeCD:1.5+Math.random(),summonCD:2.5});
 return e;
}
function lineClear(a,b,props){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/10);for(let i=1;i<n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,props,8,true))return false;return true;}
// Returns true when the charger handled its own frame (wind-up, charge or recovery).
export function tickCharger(e,s,c,p,props,dt,hit,events){
 // Oct 18: e.chargeCfg (wave-roster.js) tunes the same charge for the Horned Juggernaut and the Sand Pouncer's leap.
 const C={wind:.8,speed:640,max:440,damage:24,rest:1.1,cd:[3.5,5],min:90,range:340,lane:44,...e.chargeCfg};
 e.chargeCD=Math.max(0,(e.chargeCD??2)-dt);const ch=e.charge,hazards=c.hazards??[];
 if(ch){ch.t+=dt;e.moving=false;
  if(ch.stage==='wind'){e.row=directionRow(Math.cos(ch.angle),Math.sin(ch.angle));if(ch.t>=C.wind){ch.stage='go';ch.t=0;}return true;}
  if(ch.stage==='go'){const step=C.speed*dt;let done=false;
   for(let k=0;k<step;k+=5){const nx=e.x+Math.cos(ch.angle)*5,ny=e.y+Math.sin(ch.angle)*5;if(blocked(nx,ny,props,12,true)||ch.travel>=ch.len){done=true;break;}e.x=nx;e.y=ny;ch.travel+=5;e.moving=true;
    if(!ch.hit&&Math.hypot(p.x-e.x,(p.y-e.y)/.65)<34){ch.hit=true;events.push(...hit(s,c,p,{...e,attackDamage:C.damage},props));const n=Math.hypot(p.x-e.x,p.y-e.y)||1;movePlayer(p,(p.x-e.x)/n*30,(p.y-e.y)/n*30,props);}}
   if(ch.lane)Object.assign(ch.lane,{x:e.x,y:e.y,len:Math.max(0,ch.len-ch.travel)});
   if(done){ch.stage='rest';ch.t=0;const i=hazards.indexOf(ch.lane);if(i>=0)hazards.splice(i,1);}return true;}
  if(ch.t>=C.rest){e.charge=null;e.chargeCD=C.cd[0]+Math.random()*(C.cd[1]-C.cd[0]);}return true;
 }
 const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
 if(e.chargeCD===0&&d>C.min&&d<C.range&&!(e.slow>0)&&lineClear(e,p,props)){const angle=Math.atan2(dy,dx),len=Math.min(C.max,d+130),lane={kind:'lane',x:e.x,y:e.y,angle,len,width:C.lane,age:0,warning:C.wind,duration:3,owner:e.id};hazards.push(lane);e.charge={stage:'wind',t:0,angle,len,travel:0,lane};e.swing=null;return true;}
 return false;
}
// Guardians ward demons near them (25% less damage, existing ward rule) and body-block.
export function applyGuardianWards(c){
 const guards=c.targets.filter(e=>e.state==='alive'&&e.role==='guardian');if(!guards.length)return;
 for(const ally of c.targets)if(ally.state==='alive'&&ally.role!=='guardian'&&ally.role!=='boss'&&guards.some(g=>Math.hypot(ally.x-g.x,ally.y-g.y)<220))ally.warded=true;
}
function minion(s,c,owner,x,y){const hp=enemyHealth('swarmer',s.clock);return {...c.target,...basicImp(),...summonReward(owner),id:++s.id,enemy:true,x,y,hpTier:'swarmer',hp,maxHp:hp,radius:12,row:2,clock:Math.random(),hurt:0,hurtDuration:.24,death:0,state:'alive',role:'swarmer',speed:ENEMY_SPEED.swarmer,xp:6,scale:1.1,age:0,enraged:false,swing:null,cooldown:.6,moving:false,emerge:.6,summonedBy:owner.id,attackDamage:12};}
export function tickSummoner(e,s,c,p,props,dt,cap){
 e.summonCD=Math.max(0,(e.summonCD??3)-dt);e.row=directionRow(p.x-e.x,p.y-e.y);
 if(e.rangedCast){const cast=e.rangedCast;cast.elapsed+=dt;e.moving=false;
  if(cast.elapsed>=1.2){const mine=c.targets.filter(t=>t.state==='alive'&&t.summonedBy===e.id).length,alive=c.targets.filter(t=>t.state==='alive').length;
   for(let i=0;i<3&&mine+i<6&&alive+i<cap;i++){const a=Math.random()*Math.PI*2,x=e.x+Math.cos(a)*60,y=e.y+Math.sin(a)*40;if(!blocked(x,y,props,13,true))c.targets.push(minion(s,c,e,x,y));}
   e.rangedCast=null;e.summonCD=7+Math.random()*2;}
  return;}
 const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;
 if(e.summonCD===0&&n<700){e.rangedCast={elapsed:0,angle:Math.atan2(dy,dx),aim:{x:e.x,y:e.y},summon:true};return;}
 const direction=n<300?-1:n>460?1:0;if(!direction){e.moving=false;return;}
 const speed=e.speed*(e.slow>0?.4:e.mageChill>0?1-(e.mageSlow??.2):1),x=e.x,y=e.y;steerMove(e,dx/n*direction*speed*dt,dy/n*direction*speed*dt,props,dt);e.moving=Math.hypot(e.x-x,e.y-y)>.05;
}
// Spawns a role enemy at a point (used by the Hollow Prophet's guardians).
export function spawnRoleAt(s,c,role,x,y,owner=null){const e=applyRole({...minion(s,c,owner??{id:null},x,y),summonedBy:owner?.id??null,pit:owner?.pit??null,emerge:.8},role,s.clock);c.targets.push(e);return e;}
export function spawnImp(s,c,x,y,owner=null){const e=minion(s,c,owner??{id:null},x,y);e.xp=4;c.targets.push(e);return e;}
