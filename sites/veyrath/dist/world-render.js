import {worldTitle} from './world-events.js?v=fx-260';
const color=e=>e.status==='reward'?'#f4d496':e.kind==='rift'||e.kind==='anchor'?'#cf7181':e.kind==='merchant'?'#dbc99e':e.type==='azure'?'#89c5d3':e.type==='stone'?'#b8b09a':'#c49a65';
function sprite(ctx,key,x,y,size,images,manifest,time,alpha=.8,row=0){const img=images.get(key),entry=manifest.sheets[key];if(!img||!entry)return;const cw=entry.cellWidth??128,ch=entry.cellHeight??128,frame=Math.floor(time*(entry.fps??10))%entry.cols;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,frame*cw,row*ch,cw,ch,x-size/2,y-size*.8,size,size);ctx.restore();}
function footing(ctx,e,radius=30){ctx.save();ctx.strokeStyle=color(e);ctx.fillStyle='#30281e44';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(e.x,e.y,radius,radius*.55,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
// Oct 16 (user ref): shrines, camps and the trial stand as the tileset's crystal pedestals (red/blue/purple stone blocks)
// instead of a floating glyph; colour by type, with a soft pulsing glow.
const CRYSTAL={blood:'Stone-A21_E',hunted:'Stone-A21_E',glass:'Stone-A16_E',bargain:'Stone-A22_E',forsaken:'Stone-A22_E',crimson:'Stone-A21_E',azure:'Stone-A16_E',stone:'Stone-A16_E'};
const GLOW={'Stone-A21_E':'255,90,70','Stone-A16_E':'90,170,255','Stone-A22_E':'210,110,255'};
function drawCrystal(ctx,e,images,manifest,time,faded){
 const key=e.kind==='trial'?'Stone-A22_E':CRYSTAL[e.type]??'Stone-A21_E',img=images.get(key),m=manifest.props?.[key];if(!img||!m)return;const sc=1.15,[ax,ay]=m.anchor??[m.width/2,m.height];
 ctx.save();if(e.type==='stone')ctx.filter='saturate(.25)';const pulse=.5+.5*Math.sin(time*2.4+(e.x%7));
 if(!faded){const g=ctx.createRadialGradient(e.x,e.y-46,4,e.x,e.y-46,62);g.addColorStop(0,`rgba(${GLOW[key]},${.28+.18*pulse})`);g.addColorStop(1,`rgba(${GLOW[key]},0)`);ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(e.x-62,e.y-108,124,124);ctx.globalCompositeOperation='source-over';}
 ctx.globalAlpha=faded?.45:1;ctx.drawImage(img,e.x-ax*sc,e.y-ay*sc,m.width*sc,m.height*sc);ctx.restore();
}
export function drawWorldGround(ctx,e,images,manifest,time){
 if(!e.active||e.status==='spent')return;ctx.save();ctx.globalAlpha=e.status==='cooldown'?.3:.65;
 footing(ctx,e,e.kind==='rift'?62:e.kind==='camp'?37:24);
 if(e.kind==='rift'){ctx.translate(e.x,e.y);ctx.scale(1,.58);sprite(ctx,'world-rift',0,48,e.status==='active'?130:104,images,manifest,time,e.status==='active'?.75:.45);}
 if(e.kind==='camp'){ctx.strokeStyle=color(e);for(let i=0;i<4;i++){const a=i*Math.PI/2+.8,x=e.x+Math.cos(a)*37,y=e.y+Math.sin(a)*21;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.stroke();}}
 ctx.restore();
}
export function drawWorldObject(ctx,e,images,manifest,time,player=null){
 if(!e.active||e.status==='spent')return;const faded=e.status==='cooldown';
 if(e.kind!=='merchant'&&e.kind!=='rift'){drawCrystal(ctx,e,images,manifest,time,faded);}
 if(e.kind==='merchant'){const key=e.kind==='merchant'?(e.moving?'world-merchant-run':'world-merchant'):e.kind==='camp'?(e.type==='azure'?'world-camp-blue':'world-camp-red'):'world-shrine';ctx.save();if(e.type==='stone')ctx.filter='saturate(.2)';sprite(ctx,key,e.x,e.y-(e.kind==='merchant'?0:15)-Math.sin(time*2)*1.5,e.kind==='merchant'?145:e.kind==='camp'?48:44,images,manifest,time,faded?.18:e.kind==='merchant'?.95:.7,e.kind==='merchant'?e.row??2:0);ctx.restore();}
 const near=player&&Math.hypot(player.x-e.x,player.y-e.y)<240;if(!near)return;
 ctx.save();ctx.textAlign='center';ctx.font='bold 12px Georgia';ctx.lineWidth=3;ctx.strokeStyle='#241f1bd9';ctx.fillStyle=color(e);const label=e.status==='cooldown'?'Returns in '+Math.ceil(e.respawn)+'s':worldTitle(e)+(e.status==='reward'?' · REWARD':e.kind==='camp'&&e.status==='active'?' · GUARDIANS':'');const y=e.y-(e.kind==='merchant'?110:e.kind==='rift'?55:81);ctx.strokeText(label,e.x,y);ctx.fillText(label,e.x,y);ctx.restore();
}
export function drawWorldAnchor(ctx,t,images,manifest,time){if(t.state!=='alive')return;footing(ctx,{...t,kind:'anchor'},23);sprite(ctx,'world-shrine',t.x,t.y-8,43,images,manifest,time,.65);ctx.save();ctx.strokeStyle='#d58496';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(t.x,t.y-56);ctx.lineTo(t.x+8,t.y-44);ctx.lineTo(t.x,t.y-32);ctx.lineTo(t.x-8,t.y-44);ctx.closePath();ctx.stroke();ctx.fillStyle='#201c21';ctx.fillRect(t.x-25,t.y-63,50,4);ctx.fillStyle='#d58496';ctx.fillRect(t.x-25,t.y-63,50*t.hp/t.maxHp,4);ctx.textAlign='center';ctx.font='9px Georgia';ctx.fillStyle='#f2d7cd';ctx.strokeStyle='#2c2228';ctx.lineWidth=2;ctx.strokeText('ANCHOR',t.x,t.y-69);ctx.fillText('ANCHOR',t.x,t.y-69);ctx.restore();}
export function worldPrompt(e){return e?worldTitle(e)+' · F to '+(e.status==='reward'?'claim reward':e.kind==='merchant'?'trade':e.status==='active'?'inspect':'interact'):'';}
