const COLORS=['#61432d','#84603d','#a37a4e','#c19a64','#d9ba87','#efdbb4'];
export class SandParticles{
  constructor(){this.items=[];this.limit=200;}
  clear(){this.items.length=0;}
  emit(kind,origin){
    const storm=kind==='storm',count=storm?22:104;
    for(let i=0;i<count&&this.items.length<this.limit;i++){
      const angle=Math.random()*Math.PI*2,radius=storm?65+Math.random()*80:12+Math.random()*45;
      const dust=i%3===0,life=storm?.75+Math.random()*.55:.6+Math.random()*.6;
      this.items.push({x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius*.65,
        z:storm?15+Math.random()*45:2,vx:Math.cos(angle)*(45+Math.random()*95),vy:Math.sin(angle)*(30+Math.random()*65),
        vz:storm?25+Math.random()*35:85+Math.random()*125,angle,radius,orbit:storm,speed:4+Math.random()*3,
        life,max:life,dust,size:dust?11+Math.random()*14:2.5+Math.random()*5,color:COLORS[i%COLORS.length],spin:Math.random()*6});
    }
  }
  update(dt,player,stormActive){
    for(let i=this.items.length-1;i>=0;i--){
      const p=this.items[i];p.life-=dt;p.spin+=dt*4;
      if(p.orbit&&stormActive){p.angle+=p.speed*dt;p.radius+=dt*12;p.x=player.x+Math.cos(p.angle)*p.radius;p.y=player.y+Math.sin(p.angle)*p.radius*.65;p.z+=p.vz*dt;}
      else{p.orbit=false;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=dt*(p.dust?100:330);if(p.z<0){p.z=0;p.vz=0;p.vx*=.8;p.vy*=.8;}}
      if(p.life<=0)this.items.splice(i,1);
    }
  }
  shadows(ctx){
    for(const p of this.items)if(!p.dust){ctx.globalAlpha=Math.min(1,p.life/.25)*.16;ctx.fillStyle='#513d2b';ctx.beginPath();ctx.ellipse(p.x,p.y,p.size*1.3,p.size*.55,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }
  draw(ctx,p){
    const fade=Math.min(1,p.life/.3,(p.max-p.life)/.06);ctx.save();ctx.translate(p.x,p.y-p.z);ctx.globalAlpha=fade*(p.dust?.72:1);
    if(p.dust){const size=p.size*(1+(1-p.life/p.max)*1.6),g=ctx.createRadialGradient(0,0,0,0,0,size);g.addColorStop(0,p.color+'e8');g.addColorStop(.35,p.color+'98');g.addColorStop(1,p.color+'00');ctx.fillStyle=g;ctx.fillRect(-size,-size,size*2,size*2);}
    else{ctx.rotate(p.spin);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.7);ctx.fillStyle='#f2dfb780';ctx.fillRect(-p.size/2,-p.size/2,p.size,.8);}
    ctx.restore();
  }
}
