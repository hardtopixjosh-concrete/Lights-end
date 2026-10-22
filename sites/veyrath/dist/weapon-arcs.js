// Oct 18 (user: "line up all the VFX to the weapons"): where the 3D Warrior's weapon actually travels during each LMB
// clip, mirrored from tools/warrior/build_warrior.py (sweep()/dual_swings()/WPN keys) and game.js warriorAttackClip()
// (clip impact moment tc remapped onto the strike's hitStart). Visual only; hit shapes stay in combat.js.
// Distances are screen px at the hero's draw scale (~45 px per metre; heights x cos 30 deg).
export const BLADE={sword:{R:100,h:[54,47,52]},greatsword:{R:138,h:[52,45,54]},dual:{R:84,h:[56,44]}};
export const LINE_TIP=124,LINE_H=48,HAMMER_HEAD=68;
const TC=[.45,.5,.55];
const toGame=(tc,h,x)=>x<=tc?x/tc*h:h+(x-tc)/(1-tc)*(1-h);
/** Blade sweeps of an LMB swing: [{f, dir, R, h, span, off, secs}] where f runs 0..1 while the blade sweeps (may be
 *  <0 before / >1 after), dir is the screen-angle direction (-1 = the hero's right to left), span = half arc (rad),
 *  off = arc centre relative to the aim, secs = sweep duration in seconds. */
export function bladeSweeps(s,a){
  const st=s.style,B=BLADE[st];if(!B||s.shape==='line')return [];
  const p=a.elapsed/s.duration,idx=(a.index??0)%3;
  /* both blades sweep together on each pulse (weapon hand high, the other lower): two crescents per pulse */
  if(st==='dual')return [[.1,.4,-1,.3,.22],[.6,.9,1,-.3,-.22]].flatMap(([x0,x1,dir,o1,o2])=>[[o1,B.h[0],B.R],[-o2,B.h[1],B.R*.92]].map(([off,h,R])=>({f:(p-x0)/(x1-x0),dir,R,h,span:1.62,off,secs:(x1-x0)*s.duration})));
  const tc=TC[idx],hs=Math.min(.9,Math.max(.1,s.hitStart??tc)),g0=toGame(tc,hs,.28),g1=toGame(tc,hs,2*tc-.28);
  return [{f:(p-g0)/(g1-g0),dir:idx===1?1:-1,R:B.R,h:B.h[idx],span:2.1,off:0,secs:(g1-g0)*s.duration}];
}
