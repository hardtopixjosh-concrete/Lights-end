// Oct 16 (user): every kill drops its own orb, each worth half the old XP. Orbs only merge
// once the 600-orb cap is reached.
const CELL=64,CAP=600;export const XP_PER_KILL=.5;
const key=(x,y)=>Math.floor(x/CELL)+','+Math.floor(y/CELL);
export function createGroundXP(){return {items:[],pool:[],buckets:new Map(),seen:new Set(),value:0};}
function index(g){g.buckets.clear();for(const a of g.items){const k=key(a.x,a.y);if(!g.buckets.has(k))g.buckets.set(k,[]);g.buckets.get(k).push(a);}}
export function dropGroundXP(g,events){
 for(const e of events)if(e.type==='death'&&(e.xp??18)>0){
  if(e.id!==undefined&&g.seen.has(e.id))continue;if(e.id!==undefined)g.seen.add(e.id);
  const value=Math.max(1,Math.round((e.xp??18)*XP_PER_KILL));let nearby=null;
  if(!nearby&&g.items.length>=CAP)nearby=g.items.reduce((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(b.x-e.x,b.y-e.y)?a:b);
  if(nearby)nearby.value+=value;
  else {const a=g.pool.pop()??{};Object.assign(a,{x:e.x+(Math.random()-.5)*14,y:e.y+(Math.random()-.5)*10,value,speed:0,magnet:false,age:0});g.items.push(a);const k=key(a.x,a.y);if(!g.buckets.has(k))g.buckets.set(k,[]);g.buckets.get(k).push(a);}
  g.value+=value;
 }
}
export function tickGroundXP(g,p,dt,pickup=1){let collected=0;
 for(let i=g.items.length-1;i>=0;i--){const a=g.items[i],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);a.age+=dt;
  if(d<=65){collected+=a.value;g.value-=a.value;g.pool.push(a);g.items.splice(i,1);continue;}
  if(d<=110*pickup)a.magnet=true;
  if(a.magnet){a.speed=Math.min(950,a.speed+1000*dt);const step=Math.min(d,a.speed*dt);a.x+=dx/d*step;a.y+=dy/d*step;}
 }index(g);return collected?[{type:'xpCollected',xp:collected}]:[];
}
export function drawGroundXP(ctx,g,image,visible){
 for(const a of g.items){if(!visible(a.x,a.y,40))continue;const size=20+Math.min(12,Math.log2(1+a.value/18)*3);ctx.save();ctx.globalAlpha=.9;ctx.shadowColor='#c08aff';ctx.shadowBlur=a.magnet?12:5;
  if(image){const cell=image.height,frames=image.width/cell,frame=Math.floor(a.age*10)%frames;ctx.drawImage(image,frame*cell,0,cell,cell,a.x-size/2,a.y-size+3,size,size);}
  ctx.restore();
 }
}
