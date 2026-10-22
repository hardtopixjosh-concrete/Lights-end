import {blocked} from './simulation.js?v=fx-260';
export function createForgeShield(forge){return {...forge,remaining:0,armed:true,shieldRadius:180};}
export function shieldContains(shield,p,margin=0){return Math.hypot((p.x-shield.x)/(shield.shieldRadius+margin),(p.y-shield.y)/(shield.shieldRadius*.65+margin))<1;}
export function shieldProtects(shield,p){return !!shield&&shield.remaining>0&&shieldContains(shield,p);}
export function shieldBlocksAttack(shield,from,to){
  if(!shield||shield.remaining<=0)return false;
  const x=(from.x-shield.x)/shield.shieldRadius,y=(from.y-shield.y)/(shield.shieldRadius*.65),dx=(to.x-from.x)/shield.shieldRadius,dy=(to.y-from.y)/(shield.shieldRadius*.65);
  const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(x+dx*t,y+dy*t)<=1;
}
export function tickForgeMenuShield(shield,elapsed){shield.remaining=Math.max(0,shield.remaining-elapsed);}
export function shieldCollider(shield){
  if(shield.remaining<=0)return [];
  return [{forgeShield:true,footprint:Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return {x:shield.x+Math.cos(a)*shield.shieldRadius,y:shield.y+Math.sin(a)*shield.shieldRadius*.65};})}];
}
export function repelShieldEnemies(shield,targets,props){
  if(shield.remaining<=0)return;
  // Only eject actual penetration. The movement collider already holds the edge;
  // expanded-radius tests here used to teleport approaching enemies repeatedly.
  for(const e of targets)if(e.state==='alive'&&shieldContains(shield,e)){
    const angle=Math.atan2((e.y-shield.y)/.65,e.x-shield.x),extra=(e.radius??13)+25;
    for(let i=0;i<48;i++){
      const a=angle+Math.ceil(i/2)*(i%2?1:-1)*Math.PI/24;
      const x=shield.x+Math.cos(a)*(shield.shieldRadius+extra),y=shield.y+Math.sin(a)*(shield.shieldRadius*.65+extra);
      if(!blocked(x,y,props,e.radius??13)){e.x=x;e.y=y;e.swing=null;e.cooldown=Math.max(e.cooldown??0,.3);break;}
    }
  }
}
export function tickForgeShield(shield,p,targets,props,dt){
  shield.remaining=Math.max(0,shield.remaining-dt);
  const near=Math.hypot(p.x-shield.x,p.y-shield.y)<shield.radius;
  if(shield.remaining===0&&!shieldContains(shield,p,50))shield.armed=true;
  const activated=near&&shield.armed;
  if(activated){shield.remaining=20;shield.armed=false;}
  repelShieldEnemies(shield,targets,props);
  return activated;
}
export function drawForgeShield(ctx,s,time,front=false){
  if(s.remaining<=0)return;
  const r=s.shieldRadius,pulse=.85+Math.sin(time*3)*.08,fade=Math.min(1,s.remaining/1.5);
  ctx.save();ctx.translate(s.x,s.y);ctx.globalAlpha=fade;
  if(!front){ctx.fillStyle='#8ddfdb14';ctx.strokeStyle='#a7f7e7aa';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,r,r*.65,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else{
    const glow=ctx.createRadialGradient(0,-70,20,0,-70,r);glow.addColorStop(0,'#b6fff003');glow.addColorStop(.8,'#8bdded0b');glow.addColorStop(1,'#a0edee38');
    ctx.fillStyle=glow;ctx.strokeStyle=`rgba(159,235,234,${.5*pulse})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,-52,r,155,0,Math.PI,Math.PI*2);ctx.ellipse(0,0,r,r*.65,0,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(0,-25,Math.max(35,r-Math.abs(i)*65),135,0,Math.PI,Math.PI*2);ctx.stroke();}
    ctx.font='bold 15px Cinzel, Georgia, serif';ctx.textAlign='center';ctx.fillStyle='#d9fff1';ctx.shadowColor='#122f31';ctx.shadowBlur=5;ctx.fillText('FORGE SHIELD · '+Math.ceil(s.remaining)+'s',0,-220);
  }
  ctx.restore();
}
