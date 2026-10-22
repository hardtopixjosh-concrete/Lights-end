// Cosmetic geometry follows each weapon's actual contact shape and timing.
// Oct 16 (user): LMB swing colour follows the warrior specialization.
const SWING={berserker:'#ff8a2a',vanguard:'#f5e7a1',spellblade:'#9b30ff',warlord:'#e8332e'},STEEL='#dfe8f2';
import {bladeSweeps,LINE_TIP,LINE_H,HAMMER_HEAD} from './weapon-arcs.js?v=fx-260';
export function drawWeaponEffects(ctx,c,p,time,path,shader=false){const col=SWING[path]??STEEL;
 /* Oct 18 War Standard: a spear-banner dropping from the sky at the cursor; planted it sways until you lunge to it. */
 const S=c.standard;if(S){const k=Math.min(1,S.t/.35),drop=(1-k*k)*260,sway=S.landed?Math.sin(time*3)*2:0;ctx.save();ctx.translate(S.x,S.y-drop);
  if(!S.landed){ctx.globalAlpha=.35;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,drop,S.radius*k,S.radius*.65*k,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(sway,-96);ctx.stroke();ctx.fillStyle='#d8dce4';ctx.beginPath();ctx.moveTo(sway-5,-96);ctx.lineTo(sway,-112);ctx.lineTo(sway+5,-96);ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sway,-92);ctx.lineTo(sway+34,-86+Math.sin(time*5)*3);ctx.lineTo(sway+30,-70+Math.sin(time*5+1)*3);ctx.lineTo(sway,-64);ctx.closePath();ctx.fill();ctx.restore();}
 if(!shader)for(const b of c.projectiles??[])if(b.chain){ctx.save();ctx.strokeStyle='#8a8f98';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(p.x,p.y-27);ctx.lineTo(b.x,b.y-30);ctx.stroke();ctx.restore();}
 for(const b of c.projectiles??[]){ctx.save();ctx.translate(b.x,b.y-30);ctx.rotate(b.age*20);ctx.scale(1.6,1.6);axe(ctx);ctx.restore();/* Oct 18: sized like the bigger 3D axe */
   ctx.save();ctx.strokeStyle=c.runeColor??'#e9cb98';ctx.globalAlpha=.35;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y-30);ctx.lineTo(b.x-Math.cos(b.angle)*25,b.y-30-Math.sin(b.angle)*25);ctx.stroke();ctx.restore();
 }
 for(const e of c.effects??[]){ctx.save();ctx.globalAlpha=(1-e.age/.5)*.4;ctx.strokeStyle=c.runeColor??'#d2dce7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y-12,20+e.age*e.reach*2,12+e.age*e.reach*1.3,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 const a=c.attack;if(!a||a.kind!=='combo')return;const s=a.definition,t=a.elapsed/s.duration,sqa=g=>Math.atan2(Math.sin(g)/.65,Math.cos(g));
 /* Oct 18: the 3D Warrior holds the real weapon, so the old flat halberd/hammer drawings are gone; the remaining
    accents start where the 3D weapon is (weapon-arcs.js) and the slashes follow the blade's sweep direction. */
 if(s.shape==='line'){
   if(t>=s.hitStart&&t<=s.hitEnd+.15){const tip=LINE_TIP+Math.sin(Math.PI*Math.min(1,t/.8))*Math.max(0,s.reach*1.35-LINE_TIP);ctx.save();ctx.translate(p.x,p.y-LINE_H);ctx.scale(1,.65);ctx.rotate(sqa(a.angle));ctx.globalAlpha=.75;ctx.strokeStyle=col;ctx.lineWidth=3;for(const side of [-8,8]){ctx.beginPath();ctx.moveTo(LINE_TIP-30,side);ctx.lineTo(tip,side);ctx.stroke();}ctx.restore();}
 }else if(s.style==='hammer'){const f=Math.max(0,Math.min(1,(t-s.hitStart)/.25));if(t<s.hitStart)return;ctx.save();ctx.translate(p.x+Math.cos(a.angle)*HAMMER_HEAD,p.y+Math.sin(a.angle)*HAMMER_HEAD*.65);ctx.scale(1,.65);ctx.fillStyle=col;ctx.strokeStyle=col;ctx.globalAlpha=.5*(1-f);ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,s.impactRadius*(.4+f*.6),0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const g=i*Math.PI/6,r=s.impactRadius*(.3+f);ctx.fillRect(Math.cos(g)*r,Math.sin(g)*r,3,3);}ctx.restore();
 }else if(s.style!=='axe'&&!shader){
   for(const b of bladeSweeps(s,a)){ctx.save();ctx.translate(p.x,p.y-b.h);ctx.scale(1,.65);ctx.rotate(sqa(a.angle+b.off));slash(ctx,s,b,col,a.index??0);ctx.restore();}
 }
}
function axe(ctx){
 ctx.strokeStyle='#523923';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(17,0);ctx.stroke();ctx.strokeStyle='#b69562';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#d1d5cc';ctx.strokeStyle='#5b655e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(8,-3);ctx.lineTo(2,-17);ctx.quadraticCurveTo(23,-17,25,-3);ctx.lineTo(16,3);ctx.closePath();ctx.fill();ctx.stroke();
}

// Class-coloured crescent slash: windup glint -> sweeping tapered ribbon (soft glow, coloured body, additive white core) -> trailing sparks and motes. Drawn in the swing's squashed local frame (origin at chest height).
const ease=x=>1-(1-x)*(1-x);
function slash(ctx,s,b,col,index){const L=Math.max(.12,b.secs),f=b.f,heavy=s.style==='greatsword',arc=b.span,R=b.R,W=(heavy?22:14)*(index===2?1.25:1),dir=b.dir,from=-dir*arc,span=2*arc;
 if(f>-.35&&f<0){const g=1+f/.35;ctx.save();ctx.globalAlpha=g*.55;ctx.fillStyle=col;ctx.beginPath();ctx.arc(Math.cos(from)*R*.7,Math.sin(from)*R*.7,3+g*5,0,Math.PI*2);ctx.fill();ctx.restore();}
 if(f<0||f>1.7)return;const head=from+dir*span*ease(Math.min(1,f)),tailLen=span*.75*(f<1?Math.min(1,f*1.6):1),fade=f<1?1:1-(f-1)/.7;
 // ground light pool under the arc (screen blend), on the squashed ground plane below chest height
 ctx.save();ctx.globalCompositeOperation='screen';const lx=Math.cos(head)*R*.6,ly=Math.sin(head)*R*.6+40,lg=ctx.createRadialGradient(lx,ly,0,lx,ly,R*.9);lg.addColorStop(0,col+'55');lg.addColorStop(1,col+'00');ctx.globalAlpha=fade*(f<1?1:.5);ctx.fillStyle=lg;ctx.beginPath();ctx.arc(lx,ly,R*.9,0,Math.PI*2);ctx.fill();ctx.restore();
 if(f<1.15){const N=16,alpha=f<1?1:1-(f-1)/.15;ctx.save();ctx.lineCap='round';
  for(const [layer,wMul,aMul,color,comp] of [[0,2.2,.28,col,'source-over'],[1,1,.85,col,'source-over'],[2,.35,.9,'#ffffff','lighter']]){ctx.globalCompositeOperation=comp;ctx.strokeStyle=color;
   for(let k=0;k<N;k++){const q0=k/N,q1=(k+1)/N,a0=head-dir*tailLen*q0,a1=head-dir*tailLen*q1,taper=Math.pow(1-q0,1.3),rr=R+(layer===0?0:(1-q0)*3);ctx.globalAlpha=alpha*aMul*Math.pow(1-q0,layer===2?2:1);ctx.lineWidth=Math.max(.5,W*wMul*taper*(layer===2&&q0>.4?0:1));ctx.beginPath();ctx.arc(0,0,rr,Math.min(a0,a1),Math.max(a0,a1));ctx.stroke();}}
  ctx.restore();}
 // sparks thrown off the leading edge (tangent + outward, falling), then lingering motes
 ctx.save();ctx.fillStyle=col;for(let j=0;j<10;j++){const born=j/10*.9;if(f<born)continue;const age=(f-born)*L*2.2,life=.18+((j*37)%10)/40;if(age>life)continue;const a=from+dir*span*ease(born),sp=90+((j*53)%7)*25,tx=-Math.sin(a)*dir,ty=Math.cos(a)*dir,ox=Math.cos(a),oy=Math.sin(a),x=ox*R+(tx*.8+ox*.5)*sp*age,y=oy*R+(ty*.8+oy*.5)*sp*age+260*age*age,z=1-age/life;ctx.globalAlpha=z*.95*fade;ctx.fillRect(x-1.5,y-1.5,2+z*2.5,2+z*2.5);}
 for(let j=0;j<6;j++){const born=.35+j*.1;if(f<born)continue;const age=(f-born)*L,a=from+dir*span*ease(Math.min(1,born)),x=Math.cos(a)*(R+6*Math.sin(j*5)),y=Math.sin(a)*(R+6*Math.cos(j*3))-age*60;ctx.globalAlpha=Math.max(0,.6-age*2.2)*fade;ctx.beginPath();ctx.arc(x,y,1.6+j%2,0,Math.PI*2);ctx.fill();}
 ctx.restore();}
