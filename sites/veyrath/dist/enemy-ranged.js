import {blocked,movePlayer,directionRow,steerMove} from './simulation.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {party} from './party.js?v=fx-260';
function lineClear(a,b,props){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/8);for(let i=1;i<n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,props,3,true))return false;return true;}
// Oct 18 (user): four ranged types, one per run. bolt = Ash Hexer, lob = Cinder Lobber (lands on a ground circle),
// fan = Void Fanner (three-bolt spread), snipe = Imp Sniper (long locked warning line, fast hard bolt). Seeds.
export const SHOTS={bolt:{cast:.9,min:110,max:490,near:210,far:330},lob:{cast:.9,min:140,max:520,near:240,far:380,radius:80,warning:1},
 fan:{cast:.9,min:110,max:460,near:200,far:320,spread:.28,speed:190,color:'#b07cff'},snipe:{cast:1.4,min:200,max:720,near:380,far:540,speed:560,color:'#ffb347'}};
export const castTime=e=>SHOTS[e.shot??'bolt'].cast;
function fire(e,s,c,cast,props){
 const kind=e.shot??'bolt',S=SHOTS[kind],dmg=e.attackDamage??10,shot=(a,extra={})=>c.enemyProjectiles.push({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),age:0,distance:0,owner:e.id,attackDamage:dmg,...extra});
 if(kind==='lob'){if(s.hazards&&!shieldBlocksAttack(s.forgeShield,e,cast.aim))s.hazards.push({kind:'explosion',x:cast.aim.x,y:cast.aim.y,radius:S.radius,age:0,warning:S.warning,duration:.4,owner:e.id,death:false,fired:false,damage:dmg});return;}
 if(c.enemyProjectiles.length>=24||!lineClear(e,cast.aim,props)||shieldBlocksAttack(s.forgeShield,e,cast.aim))return;
 if(kind==='fan'){for(const k of [-1,0,1])shot(cast.angle+k*S.spread,{speed:S.speed,color:S.color});return;}
 if(kind==='snipe'){shot(cast.angle,{speed:S.speed,maxDist:820,life:2,color:S.color,hitR:14});return;}
 shot(cast.angle);
}
export function tickCaster(e,s,c,p,props,dt){const S=SHOTS[e.shot??'bolt'];
 c.enemyProjectiles??=[];e.shotCD=Math.max(0,(e.shotCD??2.2)-dt);e.row=directionRow(p.x-e.x,p.y-e.y);
 if(e.rangedCast){const cast=e.rangedCast;cast.elapsed+=dt;
  if(cast.elapsed>=S.cast){fire(e,s,c,cast,props);e.rangedCast=null;e.shotCD=3.8+(e.id%3)*.2;}return;
 }
 const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1,clear=lineClear(e,p,props);
 const canShoot=n<S.max&&n>S.min&&(clear||e.shot==='lob')&&!shieldBlocksAttack(s.forgeShield,e,p);
 if(e.shotCD===0&&canShoot&&c.targets.filter(t=>t.state==='alive'&&t.rangedCast).length<3){e.rangedCast={elapsed:0,angle:Math.atan2(dy,dx),aim:{x:p.x,y:p.y}};return;}
 const direction=n<S.near?-1:n>S.far||!clear?1:0;if(!direction)return;
 const speed=e.speed*(e.enraged?1.1:1)*(e.slow>0?.4:e.mageChill>0?1-(e.mageSlow??.2):1),x=e.x,y=e.y;steerMove(e,dx/n*direction*speed*dt,dy/n*direction*speed*dt,props,dt);e.moving=Math.hypot(e.x-x,e.y-y)>.05;
}
export function tickEnemyProjectiles(s,c,p,props,dt,receive){const events=[];c.enemyProjectiles??=[];
 for(let i=c.enemyProjectiles.length-1;i>=0;i--){const b=c.enemyProjectiles[i];if(s.timeStop&&b.owner!==s.timeStop.bossId&&!s.timeStop.owners?.has(b.owner))continue;b.age+=dt;if(b.turn){const r=b.turn*dt,cx=Math.cos(r),sx=Math.sin(r),ndx=b.dx*cx-b.dy*sx;b.dy=b.dx*sx+b.dy*cx;b.dx=ndx;}let gone=b.age>(b.life??4)||b.distance>(b.maxDist??650);
  const distance=(b.speed??165)*dt,steps=Math.max(1,Math.ceil(distance/4));for(let k=0;k<steps&&!gone;k++){const from={x:b.x,y:b.y};b.x+=b.dx*distance/steps;b.y+=b.dy*distance/steps;b.distance+=distance/steps;
   if((!b.ghost&&blocked(b.x,b.y,props,5,true))||shieldBlocksAttack(s.forgeShield,from,b)){gone=true;break;}
   for(const q of party.players.length>1?party.players:[p])if(!q.downed&&Math.hypot(b.x-q.x,(b.y-q.y)/.65)<(b.hitR??17)){events.push(...receive(s,c,q,{...b,state:'projectile',unparryable:false},props));gone=true;break;}  // Multiplayer: hits any standing player
  }if(gone)c.enemyProjectiles.splice(i,1);
 }return events;}
export function drawEnemyRanged(ctx,c,drawFX,time){
 for(const e of c.targets)if(e.state==='alive'&&e.rangedCast&&!(e.freeze>0)&&!(e.hurt>0)){
  const a=e.rangedCast;if(a.summon){const k=Math.min(1,a.elapsed/1.2);ctx.save();ctx.strokeStyle='#9cf07a';ctx.lineWidth=2.5;ctx.globalAlpha=.4+.5*k;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(e.x,e.y,(40+i*22)*(.4+.6*k),(40+i*22)*(.4+.6*k)*.6,time*(i?-2:2),0,Math.PI*2);ctx.stroke();}ctx.restore();drawFX('fx-mage-orange',k,e.x,e.y-50,40,1,.5);continue;}
  const ct=castTime(e),k=Math.min(1,a.elapsed/ct);ctx.save();if(e.shot==='snipe'){ctx.strokeStyle='#ff5a3a';ctx.globalAlpha=.3+.6*k;ctx.lineWidth=1+2.5*k;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a.angle)*820,e.y+Math.sin(a.angle)*820);ctx.stroke();}else if(e.shot==='lob'){ctx.strokeStyle='#ff9a4a';ctx.globalAlpha=.3+.5*k;ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.ellipse(a.aim.x,a.aim.y,SHOTS.lob.radius*k,SHOTS.lob.radius*.65*k,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}else{ctx.strokeStyle=e.shot==='fan'?'#b98cff':'#efa865';ctx.globalAlpha=.25+.3*k;ctx.lineWidth=1.5;ctx.setLineDash([7,7]);for(const d of e.shot==='fan'?[-SHOTS.fan.spread,0,SHOTS.fan.spread]:[0]){ctx.beginPath();ctx.moveTo(e.x,e.y);const L=e.shot==='fan'?300:Math.hypot(a.aim.x-e.x,a.aim.y-e.y);ctx.lineTo(e.x+Math.cos(a.angle+d)*L,e.y+Math.sin(a.angle+d)*L);ctx.stroke();}ctx.setLineDash([]);}ctx.restore();drawFX('fx-mage-orange',k,e.x,e.y-40,48,1,.65);
 }
 for(const b of c.enemyProjectiles??[]){if(b.color&&!b.big){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y-30,1,b.x,b.y-30,(b.hitR??17)*1.3);g.addColorStop(0,'#fff6e0');g.addColorStop(.35,b.color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y-30,(b.hitR??17)*1.3,0,Math.PI*2);ctx.fill();ctx.restore();continue;}drawFX('fx-mage-orange',(b.age*1.5)%1,b.x,b.y-30,36,1,.85);ctx.save();ctx.fillStyle='#e9ae74';ctx.globalAlpha=.55;for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(b.x-b.dx*i*8,b.y-30-b.dy*i*8,Math.max(1,3-i*.6),0,Math.PI*2);ctx.fill();}ctx.restore();}
}
