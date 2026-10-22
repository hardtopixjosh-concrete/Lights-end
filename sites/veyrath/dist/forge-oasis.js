import {groundFootprint} from './simulation.js?v=fx-260';
export function createForgeOasis(scene,forge){
 const x=forge.x,y=forge.y;
 scene.props=scene.props.filter(p=>Math.hypot(p.x-x,p.y-y)>235);
 scene.ground=scene.ground.filter(p=>Math.hypot(p.x-x,p.y-y)>310);
 const add=(key,dx,dy,scale=1,radius=0)=>{const p={key,x:x+dx,y:y+dy,scale,radius,layer:'depth'};p.footprint=groundFootprint(p);scene.props.push(p);};
 add('Stone-A23_E',0,-52,1.35);
 add('FirePlace',0,16,1.65,27);
 add('Stone-A24_E',-102,4,.75);add('Stone-A24_E',102,4,.75);
 add('Tree-A1_E',-275,-130,1.15);add('Tree-A1_E',-105,-185,1.05);add('Tree-A1_E',210,-130,1.18);
 add('Tree-A1_E',-300,145,1.1);add('Tree-A1_E',235,145,1.05);
 for(const [dx,dy] of [[-365,-32],[-328,80],[-200,150],[-105,155],[164,-130],[240,80]]){
   const p={key:'Flora-C1_E',x:x+dx,y:y+dy,scale:.85,layer:'ground'};scene.props.push(p);
 }
 for(const [dx,dy] of [[-300,-88],[-350,115],[-130,-130],[220,-160]])scene.props.push({key:'Flora-A1_E',x:x+dx,y:y+dy,scale:.8,layer:'ground'});
 for(const [dx,dy] of [[-360,135],[-320,-100],[-85,-165],[230,-115],[260,140]])add('Stone-A1_E',dx,dy,.55);
 return {x,y};
}
export function drawOasisGround(ctx,o,time){
 const {x,y}=o;ctx.save();
 ctx.fillStyle='#a49474';ctx.beginPath();ctx.ellipse(x,y+20,170,116,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#cfbba0';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(x,y+20,164,110,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#80775e88';ctx.lineWidth=1.5;
 ctx.save();ctx.beginPath();ctx.ellipse(x,y+20,159,105,0,0,Math.PI*2);ctx.clip();
 for(let j=-2;j<=2;j++){ctx.beginPath();ctx.moveTo(x-135,y+20+j*34);ctx.lineTo(x+135,y+20+j*34);ctx.stroke();}
 for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(x+i*37,y-61);ctx.lineTo(x+i*37,y+104);ctx.stroke();}
 ctx.restore();
 const glow=ctx.createRadialGradient(x,y+6,1,x,y+6,65);glow.addColorStop(0,'#ffc57868');glow.addColorStop(1,'#ffc57800');ctx.fillStyle=glow;ctx.fillRect(x-65,y-59,130,130);
 ctx.restore();
}
export function drawOasisEmbers(ctx,o,time){
 ctx.save();for(let i=0;i<3;i++){const px=o.x+(i-1)*10,py=o.y-10,height=17+Math.sin(time*8+i)*5;ctx.fillStyle=i===1?'#ffe1a0bb':'#d78840aa';ctx.beginPath();ctx.moveTo(px-5,py);ctx.quadraticCurveTo(px-9,py-8,px+Math.sin(time*6+i)*4,py-height);ctx.quadraticCurveTo(px+8,py-7,px+5,py);ctx.fill();}for(let i=0;i<16;i++){const age=(time*.65+i/16)%1;ctx.globalAlpha=Math.sin(age*Math.PI)*.8;ctx.fillStyle=i%3?'#e6ac57':'#fff0b9';ctx.fillRect(o.x+Math.sin(i*9+time)*18,o.y+5-age*75,2,2);}ctx.restore();
}
