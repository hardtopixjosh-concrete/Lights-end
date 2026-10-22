import {gfx} from './quality.js?v=fx-260';
import {drawBlood} from './blood-mage.js?v=fx-260';
import {drawEGround,drawEUpper} from './mage-e-fx.js?v=fx-260';
import {drawSpellGround,drawSpellUpper} from './mage-spell-fx.js?v=fx-260';
import {drawMageVfx} from './mage-vfx.js?v=fx-260';
import {drawWeaponGround,drawWeaponUpper} from './mage-weapons-fx.js?v=fx-260';
const color=element=>({pyro:'#ffc17e',cryo:'#bceaff',storm:'#cbb4ff',arcane:'#d4b9ff',blood:'#f0a2b8'}[element]??'#bceaff');
export function drawMageEffects(ctx,m,drawFX,ground=false){
 drawBlood(ctx,m,ground);
 if(ground){drawEGround(ctx,m);drawSpellGround(ctx,m);drawWeaponGround(ctx,m);drawMageVfx(ctx,m,'ground');
   return;
 }
  drawSpellUpper(ctx,m);drawWeaponUpper(ctx,m);drawMageVfx(ctx,m,'upper');
 // Scepter beam is drawn in mage-spell-fx.js (drawBasicUpper).

 for(const e of m.effects){const t=e.age/e.duration;
   if(e.kind==='nova'&&e.element!=='blood'){ctx.save();ctx.globalAlpha=(1-t)*.65;ctx.strokeStyle=color(e.element);ctx.shadowColor=color(e.element);ctx.shadowBlur=gfx.shadows?8:0;ctx.lineWidth=5*(1-t)+1;for(let i=0;i<2;i++){const r=(e.radius??225)*Math.max(0,t-i*.13);ctx.beginPath();ctx.ellipse(e.x,e.y-8,r,r*.65,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
   if(e.kind==='bolt'){ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle=color(e.element);ctx.shadowColor='#a6ddff';ctx.shadowBlur=gfx.shadows?16:0;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,e.y-25,15+t*40,20+t*25,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 }
 drawEUpper(ctx,m);
 // Storm E rods (Oct 16): drawn iron rod with copper coils; tip = Projectiles 2 violet lightning orb turned upright; overcharge adds the Effects 3 lightning aura.
 for(const r of m.rods??[]){const oc=r.oc>0,k=oc?1.3:1,H=70*k,a=Math.min(1,r.age/.2,(r.life-r.age)/.3),rise=Math.min(1,r.age/.15);ctx.save();ctx.globalAlpha=a;ctx.translate(r.x,r.y);
  ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(0,0,10*k,4*k,0,0,Math.PI*2);ctx.fill();
  const g=ctx.createLinearGradient(-4*k,0,4*k,0);g.addColorStop(0,'#2a2533');g.addColorStop(.45,'#8d86a0');g.addColorStop(1,'#1c1824');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-5*k,0);ctx.lineTo(-2.5*k,-H*rise);ctx.lineTo(2.5*k,-H*rise);ctx.lineTo(5*k,0);ctx.closePath();ctx.fill();
  for(let i=0;i<3;i++){const y=-H*rise*(.3+i*.2);ctx.strokeStyle=oc?'#e9d9ff':'#c58a4a';ctx.lineWidth=2*k;ctx.beginPath();ctx.ellipse(0,y,(5-i)*k,1.6*k,0,0,Math.PI*2);ctx.stroke();}
  ctx.translate(0,-H*rise);ctx.save();ctx.rotate(-Math.PI/2);drawFX('fx-rod-orb',(r.age*(oc?14:9)/8)%1,-6*k,0,(oc?62:44),1,1);ctx.restore();
  if(oc){ctx.globalCompositeOperation='lighter';drawFX('fx-rod-aura',(r.age*16/22)%1,0,10,150,1,.9);}
  ctx.restore();}
 for(const p of m.particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life/p.max)*.75;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=gfx.shadows?6:0;if(p.streak){ctx.strokeStyle=p.color;ctx.lineWidth=p.size*.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.stroke();}else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*.55,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
