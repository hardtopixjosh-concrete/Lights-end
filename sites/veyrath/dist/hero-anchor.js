// Oct 17: where a live 3D hero's weapon hand was last drawn (world coords), per owner object (e.g. the mage state).
// Kept separate from hero-3d.js so effect modules (and Node tests) don't pull in three.js. Visual only.
// Oct 18: the point is the weapon tip when a weapon is held; the hero's feet are kept too so projectiles can find
// the tip of the hero that fired them (tipNear).
const anchors=new WeakMap(),recent=[];
export function setHeroAnchor(owner,x,y,fx=x,fy=y,l=null){const a={x,y,fx,fy,l,t:performance.now()};/* l = off-hand weapon tip {x,y} (Gunslinger left pistol) */anchors.set(owner,a);const i=recent.findIndex(r=>r.owner===owner);if(i>=0)recent[i].a=a;else{recent.push({owner,a});if(recent.length>8)recent.shift();}}
/** Last weapon point for this owner, or null if stale (>250 ms) or absent. */
export function heroAnchor(owner){const a=owner&&anchors.get(owner);return a&&performance.now()-a.t<250?a:null;}
/** Fresh weapon point of the hero standing within r px of (x,y) (feet), or null. */
export function tipNear(x,y,r=60){const now=performance.now();let best=null,bd=r*r;for(const {a} of recent){if(now-a.t>250)continue;const d=(a.fx-x)**2+(a.fy-y)**2;if(d<bd){bd=d;best=a;}}return best;}
