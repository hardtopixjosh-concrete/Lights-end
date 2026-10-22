// Screen-aligned movement in a world illustrated with isometric assets.
// No DOM or rendering dependencies: later combat can reuse these functions.
/* Oct 18 (user): base player speed 220 -> 195, felt too fast next to the enemies. Oct 19 (user: make them slower): 195 -> 166 (-15%, all classes). */
export const WORLD = {width:3600,height:2800,playerRadius:13,speed:166};
export const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
export const DEFAULT_CAMERA_ZOOM = 1.05;

// Source-pixel ground pivots and contact areas, inspected against the cropped
// artwork. Shadows/canopies/tall upper bodies are deliberately not solid.
export const PROP_BASES = {
  'Stone-A1_E': {anchor:[45,61],ellipse:[35,12]},
  'Stone-A2_E': {anchor:[64,95],ellipse:[47,15]},
  'Stone-A3_E': {anchor:[38,47],polygon:[[8,42],[48,22],[71,42],[67,58],[26,61],[7,52]]},
  'Stone-A4_E': {anchor:[33,67],ellipse:[22,10]},
  'Stone-A5_E': {anchor:[24,59],ellipse:[19,10]},
  'Stone-A9_E': {anchor:[48,60],polygon:[[8,73],[72,35],[89,43],[22,80]]},
  'Stone-A10_E': {anchor:[53,80],polygon:[[12,90],[68,50],[96,58],[37,105]]},
  'Stone-A11_E': {anchor:[49,55],polygon:[[8,66],[77,33],[91,40],[22,76]]},
  'Stone-A12_E': {anchor:[43,49],ellipse:[35,12]},
  'Stone-A13_E': {anchor:[27,54],ellipse:[19,10]},
  'Stone-A14_E': {anchor:[63,206],ellipse:[39,20]},
  'Stone-A15_E': {anchor:[42,103],ellipse:[19,10]},
  'Stone-A23_E': {anchor:[77,211],ellipse:[57,23]},
  'Stone-A6_E': {anchor:[83,82],ellipse:[67,25]},
  'Misc-C1_E': {anchor:[44,136],ellipse:[26,13]},
  'Stone-A24_E': {anchor:[32,199],ellipse:[29,14]},
  'Tree-A1_E': {anchor:[72,194],ellipse:[7,5]},
};
// Passable, low foliage stays below the actor instead of abruptly occluding it
// as the actor crosses a single sprite sorting point. These are not colliders.
export const DECOR_BASES = {
  'Flora-B1_E': {anchor:[79,80]},
  'Tree-B1_E': {anchor:[33,52]},
  'Flora-C1_E': {anchor:[26,50]},
};
export function groundFootprint(prop) {
  const base=PROP_BASES[prop.key];if(!base)return null;
  const scale=prop.scale??1;
  const points=base.polygon??Array.from({length:16},(_,i)=>{
    const angle=i*Math.PI/8;
    return [base.anchor[0]+Math.cos(angle)*base.ellipse[0],base.anchor[1]+Math.sin(angle)*base.ellipse[1]];
  });
  return points.map(([x,y])=>({x:prop.x+(x-base.anchor[0])*scale,y:prop.y+(y-base.anchor[1])*scale}));
}
export function circleTouchesPolygon(x,y,r,points) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[j],b=points[i];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    if((x-a.x-t*dx)**2+(y-a.y-t*dy)**2<r*r)return true;
  }
  return inside;
}
export function directionRow(dx,dy) {
  // Verified by matching sheets to the pack's labeled individual frames:
  // E, SE, S, SW, W, NW, N, NE. Screen Y increases downward.
  return ((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
}
export function movementVector(keys) {
  if(keys.stick)return keys.stick;// touch joystick: analog unit direction (touch-controls.js)
  let x=Number(keys.has('d'))-Number(keys.has('a'));
  let y=Number(keys.has('s'))-Number(keys.has('w'));
  const n=Math.hypot(x,y)||1; return {x:x/n,y:y/n};
}
export function updateWalkFacing(player,vector) {
  if(vector.x||vector.y)player.row=directionRow(vector.x,vector.y);
}
// Spatial index (Oct 15 open-desert map has hundreds of colliders): each props array gets a lazily built
// 128px bucket grid (rebuilt if its length changes); queries only test props whose padded bounds touch the cell.
const GRID=128,PAD=48,grids=new WeakMap();
// Keep static terrain's index across frames; walls, actors and shield circles remain live queries.
// Return an ordinary array for existing line-of-sight/iteration consumers.
const colliderLayers=new WeakMap();
export function withDynamicColliders(staticProps,dynamicProps=[]){
 if(!dynamicProps.length)return staticProps;
 const combined=[...staticProps,...dynamicProps];colliderLayers.set(combined,{staticProps,dynamicProps});return combined;
}
function propBounds(p){if(p.footprint){let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const q of p.footprint){if(q.x<a)a=q.x;if(q.y<b)b=q.y;if(q.x>c)c=q.x;if(q.y>d)d=q.y;}return [a,b,c,d];}if(p.radius>0)return [p.x-p.radius,p.y-p.radius,p.x+p.radius,p.y+p.radius];return null;}
function gridFor(props){let g=grids.get(props);if(g&&g.n===props.length)return g;g={n:props.length,cells:new Map()};
  for(const p of props){const bb=propBounds(p);if(!bb)continue;const x0=Math.floor((bb[0]-PAD)/GRID),x1=Math.floor((bb[2]+PAD)/GRID),y0=Math.floor((bb[1]-PAD)/GRID),y1=Math.floor((bb[3]+PAD)/GRID);
    for(let gx=x0;gx<=x1;gx++)for(let gy=y0;gy<=y1;gy++){const k=gx*65536+gy;let list=g.cells.get(k);if(!list)g.cells.set(k,list=[]);list.push(p);}}
  grids.set(props,g);return g;}
function hits(p,x,y,r){if(p.footprint)return circleTouchesPolygon(x,y,r,p.footprint);return p.radius>0&&Math.hypot(x-p.x,y-p.y)<r+p.radius;}
export function blocked(x,y,props,r=WORLD.playerRadius,enemy=false) {
  if(!enemy&&(x<r||y<r||x>WORLD.width-r||y>WORLD.height-r))return true;
  const layers=colliderLayers.get(props);
  if(layers)return blocked(x,y,layers.staticProps,r,true)||layers.dynamicProps.some(p=>hits(p,x,y,r));
  if(props.length>24&&r<=PAD){const list=gridFor(props).cells.get(Math.floor(x/GRID)*65536+Math.floor(y/GRID));return !!list&&list.some(p=>hits(p,x,y,r));}
  return props.some(p=>{
    if(p.footprint)return circleTouchesPolygon(x,y,r,p.footprint);
    // Keep explicit circular colliders available for later actors/tests.
    return p.radius>0&&Math.hypot(x-p.x,y-p.y)<r+p.radius;
  });
}
export function movePlayer(player,dx,dy,props) {
  // Subdivide movement to prevent tunneling; independent axes allow wall sliding.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
  for(let i=0;i<steps;i++) {
    if(!blocked(player.x+dx/steps,player.y,props,WORLD.playerRadius,player.enemy))player.x+=dx/steps;
    if(!blocked(player.x,player.y+dy/steps,props,WORLD.playerRadius,player.enemy))player.y+=dy/steps;
  }
}
// Obstacle steering for enemies and bosses (Oct 15: bosses got stuck on props). Take the direct step; if most
// of it is blocked, try angled detours (preferring the side already chosen) and keep that side briefly, so
// actors walk around rocks and concave corners instead of sticking or jittering. Returns distance moved.
// Player movement around obstacles (Oct 15: "don't hard stop me"): take the input step; if it is mostly
// blocked, glide along the obstacle using the smallest deflection (up to ~95 degrees) that still makes
// progress in the pressed direction, keeping the last successful side to avoid flicker. Never auto-paths:
// a fresh input direction is always tried first.
export function slideMove(e,dx,dy,props){
  const want=Math.hypot(dx,dy);if(want<1e-6)return 0;
  const ox=e.x,oy=e.y;movePlayer(e,dx,dy,props);const moved=Math.hypot(e.x-ox,e.y-oy);if(moved>want*.9)return moved;
  const sx=e.x,sy=e.y,base=Math.atan2(dy,dx),pref=e.slideSide??1;
  // Head-on against a round obstacle the way around is briefly sideways, so near-perpendicular steps count
  // as long as they never move backward.
  for(const off of [.35,.7,1.05,1.45,1.65])for(const sd of [pref,-pref]){e.x=ox;e.y=oy;const a=base+sd*off;movePlayer(e,Math.cos(a)*want,Math.sin(a)*want,props);
    const mv=Math.hypot(e.x-ox,e.y-oy),along=((e.x-ox)*dx+(e.y-oy)*dy)/want;if(mv>want*.45&&along>-want*.05&&mv>moved*1.1){e.slideSide=sd;return mv;}}
  e.x=sx;e.y=sy;return moved;
}
// Oct 16 (user): enemies stuck on scenery path around it. A BFS flow field (32px cells, 3072px window) around the
// player is rebuilt at most every .5s; an enemy that stops making progress follows it for ~2s, even if that means
// running away from the player first to get around a wall.
const NAV={cell:32,half:48,goal:null,dist:null,ox:0,oy:0,age:9,props:null};
export function setNavGoal(x,y,props,dt=0){
  NAV.age+=dt;if(NAV.goal&&NAV.age<.5&&Math.hypot(x-NAV.goal.x,y-NAV.goal.y)<48)return;
  const C=NAV.cell,N=NAV.half*2,ox=Math.floor(x/C)-NAV.half,oy=Math.floor(y/C)-NAV.half,dist=new Int16Array(N*N).fill(-1),walk=new Int8Array(N*N);
  const free=i=>{if(!walk[i]){const cx=(ox+i%N)*C+C/2,cy=(oy+((i/N)|0))*C+C/2;walk[i]=cx<0||cy<0||cx>WORLD.width||cy>WORLD.height||blocked(cx,cy,props,16,true)?2:1;}return walk[i]===1;};
  const start=NAV.half*N+NAV.half,q=new Int32Array(N*N);let h=0,t=0;dist[start]=0;q[t++]=start;
  while(h<t){const i=q[h++],cx=i%N,cy=(i/N)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(dist[j]>=0||!free(j))continue;dist[j]=dist[i]+1;q[t++]=j;}}
  Object.assign(NAV,{goal:{x,y},dist,ox,oy,age:0,props,walk});
}
function clearLine(a,b,props){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/24);for(let i=1;i<n;i++){const f=i/n;if(blocked(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,props,12,true))return false;}return true;}
function navDir(e){
  if(!NAV.dist)return null;const C=NAV.cell,N=NAV.half*2,cx=Math.floor(e.x/C)-NAV.ox,cy=Math.floor(e.y/C)-NAV.oy;if(cx<1||cy<1||cx>=N-1||cy>=N-1)return null;
  const d=(x,y)=>NAV.dist[y*N+x];let here=d(cx,cy);if(here<0)here=1e4;let best=null,bv=here;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const v=d(cx+dx,cy+dy);if(v<0)continue;if(dx&&dy&&(d(cx+dx,cy)<0||d(cx,cy+dy)<0))continue;const w=v+(dx&&dy?.4:0);if(w<bv){bv=w;best=[dx,dy];}}
  if(!best)return null;const tx=(NAV.ox+cx+best[0])*C+C/2,ty=(NAV.oy+cy+best[1])*C+C/2;return Math.atan2(ty-e.y,tx-e.x);
}
export function steerMove(e,dx,dy,props,dt=1/60){
  const want=Math.hypot(dx,dy);if(want<1e-6)return 0;
  // Stuck → follow the flow field (only when heading toward the player, not fleeing).
  if(NAV.goal&&(e.navT??0)>0){e.navT-=dt;if((e.navCheck=(e.navCheck??0)-dt)<=0){e.navCheck=.3;if(clearLine(e,NAV.goal,props))e.navT=0;}if(e.navT<=0){e.navBest=1e9;e.stuckT=0;}else{const toward=(NAV.goal.x-e.x)*dx+(NAV.goal.y-e.y)*dy>0,a=toward?navDir(e):null;
    if(a!=null){const sd=e.steerDir;e.steerDir=null;const m=steerCore(e,Math.cos(a)*want,Math.sin(a)*want,props,want);e.steerDir=sd;return m;}}}
  const moved0=steerCore(e,dx,dy,props,want);
  // Stuck = heading at the player but no closer for .8s (sliding along a wall counts as stuck).
  if(NAV.goal&&(NAV.goal.x-e.x)*dx+(NAV.goal.y-e.y)*dy>0){const d=Math.hypot(NAV.goal.x-e.x,NAV.goal.y-e.y);
    if(d<(e.navBest??1e9)-6){e.navBest=d;e.stuckT=0;}else if((e.stuckT=(e.stuckT??0)+dt)>.8){e.stuckT=0;e.navBest=1e9;e.navT=6;e.navCheck=.6;e.steerDir=null;}}
  return moved0;
}
function steerCore(e,dx,dy,props,want){
  const base=Math.atan2(dy,dx),step=(a,len)=>{const ox=e.x,oy=e.y;movePlayer(e,Math.cos(a)*len,Math.sin(a)*len,props);return Math.hypot(e.x-ox,e.y-oy);};
  // While committed to a detour, keep walking that world direction until the straight line frees up.
  if(e.steerDir!=null){const ox=e.x,oy=e.y,direct=step(base,want);if(direct>want*.85){e.steerDir=null;return direct;}e.x=ox;e.y=oy;
    const along=step(e.steerDir,want);if(along>want*.4)return along;e.steerDir=null;}
  const moved=step(base,want);if(moved>want*.6)return moved;
  const side=e.steerSide??((e.id??0)%2?1:-1),left=want-moved;
  for(const off of [.35,.7,1.1,1.6,2.2])for(const sd of [side,-side]){const a=base+sd*off,m2=step(a,left);if(m2>left*.5){e.steerSide=sd;e.steerDir=a;return moved+m2;}}
  return moved;
}
export function createScene() {
  const props=[];const ground=[];
  const prop=(key,x,y,scale=1)=>{
    const p={key,x,y,scale,layer:DECOR_BASES[key]?'ground':'depth'};
    p.footprint=groundFootprint(p);props.push(p);
  };
  // Deliberately placed landmarks and open walking routes; no generated maze.
  prop('Stone-A24_E',1880,1420,.9);
  prop('Stone-A9_E',1470,1130,.85);prop('Stone-A1_E',2130,1300,.8);
  prop('Stone-A2_E',1370,1560,.75);prop('Stone-A12_E',2010,1700,.9);
  prop('Tree-A1_E',1180,1380,1.05);prop('Tree-A1_E',2420,1770,.85);
  prop('Tree-A1_E',2410,1020,1);prop('Stone-A4_E',1650,1890,1.1);
  prop('Stone-A14_E',2330,1460,.85);prop('Stone-A5_E',1750,1030,.9);
  prop('Stone-A3_E',1100,1870,.85);prop('Stone-A13_E',2520,1370,.9);
  prop('Stone-A2_E',1660,1240,.8);prop('Stone-A1_E',2180,1530,.9);
  prop('Stone-A9_E',1220,1170,.85);prop('Stone-A12_E',1600,1730,.8);
  prop('Stone-A10_E',2670,1910,.9);prop('Stone-A11_E',1010,1050,.9);
  prop('Stone-A15_E',2960,1340,1);prop('Stone-A4_E',710,1640,1.1);
  prop('Tree-A1_E',2740,620,1);prop('Tree-A1_E',660,730,1);
  prop('Stone-A1_E',1850,580,.85);prop('Stone-A2_E',2220,2260,.9);
  prop('Tree-A1_E',1110,2370,1);prop('Stone-A24_E',3120,2250,1.1);
  prop('Stone-A9_E',650,2360,1.05);prop('Stone-A12_E',3180,740,.9);
  let seed=84026;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<410;i++){
    const x=100+rng()*3400,y=100+rng()*2600;
    ground.push({key:['Ground-A10_E','Ground-A11_E','Ground-A12_E','Ground-A13_E','Ground-A25_E','Ground-A26_E','Ground-A7_E','Ground-A19_E'][Math.floor(rng()*8)],x,y,scale:.65+rng()*.5});
    if(i%4===0&&Math.hypot(x-1800,y-1400)>150)prop(['Tree-B1_E','Flora-B1_E','Flora-C1_E'][i%3],x,y,.55+rng()*.45);
  }
  return {props,ground};
}
