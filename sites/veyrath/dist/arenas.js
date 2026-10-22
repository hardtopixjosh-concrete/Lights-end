// Oct 16: walled arenas placed in code at map load (the Tiled map is never regenerated). Two
// outskirts pits (Dune Ravager, Dune Wyrm) and the Ancient Trials colosseum. Each is a ring of
// existing wall sprites with one opening that faces the map centre. Scenery inside is cleared at
// runtime only.
import {WORLD} from './simulation.js?v=fx-260';
const WALL_KEYS=['Wall-A1_E','Wall-A1_S','Wall-A3_E','Wall-A3_S'];
// Oct 18 (user): boss pits a little bigger (+60: ravager 380->440, wyrm 430->490, butcher/prophet 400->460) and entered
// along a walled path (PIT_PATH) instead of a bare gap; the co-op "enter the pit?" vote starts at the path's entrance.
export const PIT_PATH={length:280,gap:.17,entranceR:70};
export const ARENA_SPECS=[
 {id:'ravager-pit',kind:'pit',boss:'ravager',name:"Ravager's Pit",prefer:[.12,.82],radius:440},
 {id:'wyrm-pit',kind:'pit',boss:'wyrm',name:"Wyrm's Hollow",prefer:[.88,.16],radius:490},
 {id:'colosseum',kind:'colosseum',name:'Ancient Colosseum',prefer:[.72,.42],radius:600},
 // Oct 16 (user): a boss in all four corners. The other two corners reuse the Ashen Butcher and Hollow Prophet.
 {id:'butcher-pit',kind:'pit',boss:'butcher',name:"Butcher's Yard",prefer:[.12,.16],radius:460},
 {id:'prophet-pit',kind:'pit',boss:'prophet',name:"Prophet's Sanctum",prefer:[.88,.16],radius:460},
 // Oct 19 (user): the Crimson Tyrant's realm, a fully sealed ring (no gate) players are only pulled into (realm.js).
 {id:'tyrant-realm',kind:'realm',name:"Tyrant's Realm",prefer:[.5,.88],radius:760}
];
function inside(p,c,r){const b=p.footprint?p.footprint.reduce((a,q)=>({x:a.x+q.x/p.footprint.length,y:a.y+q.y/p.footprint.length}),{x:0,y:0}):p;return Math.hypot(b.x-c.x,b.y-c.y)<r;}
function bestCentre(spec,props,avoid){
 const W=WORLD.width,H=WORLD.height,px=spec.prefer[0]*W,py=spec.prefer[1]*H,R=spec.radius;let best=null,score=Infinity;
 for(let gx=-4;gx<=4;gx++)for(let gy=-4;gy<=4;gy++){const c={x:px+gx*160,y:py+gy*160};
  if(c.x<R+120||c.y<R+120||c.x>W-R-120||c.y>H-R-120||avoid.some(a=>Math.hypot(a.x-c.x,a.y-c.y)<a.r+R+150))continue;
  const n=props.filter(p=>(p.footprint||p.radius)&&inside(p,c,R+60)).length+Math.hypot(gx,gy)*.6;if(n<score){score=n;best=c;}}
 return best??{x:px,y:py};
}
const wallAt=(key,x,y,id)=>({key,x,y,scale:.55,layer:'depth',arena:id,footprint:[{x:x-14,y:y-12},{x:x+14,y:y-12},{x:x+14,y:y+12},{x:x-14,y:y+12}]});
function ring(c,R,gateAngle,id,gap=.3){
 const walls=[],n=Math.ceil(Math.PI*2*R/36);
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2,d=Math.atan2(Math.sin(a-gateAngle),Math.cos(a-gateAngle));if(Math.abs(d)<gap)continue;
  const x=c.x+Math.cos(a)*R,y=c.y+Math.sin(a)*R*.72;
  walls.push(wallAt(WALL_KEYS[(i+(Math.abs(Math.cos(a))>.7?0:1))%2+(i%5===0?2:0)],x,y,id));}
 return walls;
}
// Pit path geometry: the two gap ends on the ring run straight out toward the map centre for PIT_PATH.length.
function pathOf(c,R,g,gap){const P=s=>({x:c.x+Math.cos(g+s*gap)*R,y:c.y+Math.sin(g+s*gap)*R*.72}),a=P(-1),b=P(1),dx=Math.cos(g),dy=Math.sin(g),L=PIT_PATH.length;
 return {a,b,dx,dy,L,ex:(a.x+b.x)/2+dx*L,ey:(a.y+b.y)/2+dy*L,width:Math.abs((b.x-a.x)*-dy+(b.y-a.y)*dx)};}
function pathWalls(path,id){const walls=[],n=Math.ceil(path.L/30);
 for(const e of [path.a,path.b])for(let i=1;i<=n;i++){const k=i/n,x=e.x+path.dx*path.L*k,y=e.y+path.dy*path.L*k;walls.push(wallAt(WALL_KEYS[(i%2)+(i===n?2:0)],x,y,id));}
 return walls;}
// Distance-based test along the corridor (with a margin), used to clear scenery out of the path.
function inPath(p,path,pad){const b=p.footprint?p.footprint.reduce((a,q)=>({x:a.x+q.x/p.footprint.length,y:a.y+q.y/p.footprint.length}),{x:0,y:0}):p,mx=(path.a.x+path.b.x)/2,my=(path.a.y+path.b.y)/2,ox=b.x-mx,oy=b.y-my,along=ox*path.dx+oy*path.dy,side=Math.abs(-ox*path.dy+oy*path.dx);
 return along>-20&&along<path.L+130&&side<path.width/2+pad;}
// Returns arena records and mutates scene.props (new array) and scene.landmarks.
export function buildArenas(scene,spawn,forge){
 const avoid=[{x:spawn.x,y:spawn.y,r:500},{x:forge.x,y:forge.y,r:500}],arenas=[];let props=scene.props;
 for(const spec of ARENA_SPECS){const hint=(scene.landmarks??[]).find(l=>l.name==='arena-'+spec.id),c=hint?{x:hint.x,y:hint.y}:bestCentre(spec,props,avoid),gate=Math.atan2(WORLD.height/2-c.y,WORLD.width/2-c.x),R=spec.radius;
  const gap=spec.kind==='pit'?PIT_PATH.gap:spec.kind==='realm'?0:.3,path=spec.kind==='pit'?pathOf(c,R,gate,gap):null;
  props=props.filter(p=>!inside(p,c,R+30)&&!(path&&inPath(p,path,50)));const walls=[...ring(c,R,gate,spec.id,gap),...(path?pathWalls(path,spec.id):[])];props=[...props,...walls];
  avoid.push({x:c.x,y:c.y,r:R});arenas.push({...spec,x:c.x,y:c.y,gate,gap,path,gateX:c.x+Math.cos(gate)*R,gateY:c.y+Math.sin(gate)*R*.72,entranceX:path?.ex,entranceY:path?.ey});}
 scene.props=props;scene.ground=(scene.ground??[]).filter(g=>!arenas.some(a=>Math.hypot(g.x-a.x,(g.y-a.y)/.72)<a.radius-20)||!g.key?.startsWith('Tree'));
 const col=arenas.find(a=>a.kind==='colosseum');if(col){scene.landmarks=(scene.landmarks??[]).filter(l=>l.name!=='trial-1');scene.landmarks.push({name:'trial-1',x:col.x,y:col.y});}
 return arenas;
}
// Inside test matching the ellipse the walls follow.
export const inArena=(a,p,pad=0)=>Math.hypot(p.x-a.x,(p.y-a.y)/.72)<a.radius-pad;
// Standing on a pit path's entrance (where the co-op enter-the-pit vote starts).
export const atEntrance=(a,p)=>a.path?Math.hypot(p.x-a.entranceX,p.y-a.entranceY)<PIT_PATH.entranceR:false;
export function drawArenaFloor(ctx,a,time){
 ctx.save();ctx.translate(a.x,a.y);ctx.scale(1,.72);
 const g=ctx.createRadialGradient(0,0,a.radius*.2,0,0,a.radius);g.addColorStop(0,a.kind==='colosseum'?'rgba(210,180,120,.18)':a.kind==='realm'?'rgba(150,10,20,.5)':'rgba(90,30,20,.22)');g.addColorStop(1,'rgba(40,20,10,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,a.radius,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=a.kind==='colosseum'?'rgba(240,210,150,.35)':'rgba(200,80,50,.3)';ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.beginPath();ctx.arc(0,0,a.radius*.55,time*.05,time*.05+Math.PI*2);ctx.stroke();ctx.restore();
 const pt=a.path;if(!pt)return;
 // Worn path floor from the gate out to the entrance, and a glowing entrance marker at its start.
 ctx.save();ctx.fillStyle='rgba(70,35,20,.2)';ctx.beginPath();ctx.moveTo(pt.a.x,pt.a.y);ctx.lineTo(pt.b.x,pt.b.y);ctx.lineTo(pt.b.x+pt.dx*pt.L,pt.b.y+pt.dy*pt.L);ctx.lineTo(pt.a.x+pt.dx*pt.L,pt.a.y+pt.dy*pt.L);ctx.closePath();ctx.fill();
 ctx.translate(pt.ex,pt.ey);ctx.scale(1,.55);const pulse=.55+.25*Math.sin(time*3);ctx.strokeStyle=`rgba(230,110,60,${pulse})`;ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(0,0,PIT_PATH.entranceR*.8,-time*.4,-time*.4+Math.PI*2);ctx.stroke();ctx.restore();
}
// Oct 16 (user): the colosseum gate shuts while a trial runs. Walls filling the ring's opening, same look as the ring.
export function gateWalls(a){
 const R=a.radius,n=Math.ceil(Math.PI*2*R/36),walls=[];
 for(let i=0;i<n;i++){const ang=i/n*Math.PI*2,d=Math.atan2(Math.sin(ang-a.gate),Math.cos(ang-a.gate));if(Math.abs(d)>=(a.gap??.3))continue;
  const x=a.x+Math.cos(ang)*R,y=a.y+Math.sin(ang)*R*.72;
  walls.push({...wallAt(WALL_KEYS[i%2],x,y,a.id),trialGate:true});}
 return walls;
}
