// Oct 17 (user specs "OBSIDIAN COLOSSUS — FULL ATTACK LIST" and "DUNE WYRM — FULL ATTACK LIST"): reworked kits for
// the two titans. Plugged into bosses.js SPECIALS as {start,tick} plus pick (distance/facing-aware choice, never the
// same special twice in a row), pre (per frame: phase transitions, Wyrm facing, player-velocity tracking) and post
// (Wyrm body row follows its slow-turning facing). Every target circle/lane locks before it lands; nothing tracks during
// a committed strike. Damage, cooldowns and windows are playtest seeds (user: "still need tuning").
import {blocked,directionRow,movePlayer} from './simulation.js?v=fx-260';
import {receiveHit} from './survival.js?v=fx-260';
import {everyone,wasHit,markHit} from './party.js?v=fx-260';

const TAU=Math.PI*2;
const angTo=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gd=(p,x,y)=>Math.hypot(p.x-x,(p.y-y)/.65);  // ground (ellipse) distance
const add=(c,h)=>((c.hazards??=[]).push(h),h);
function hit(s,c,p,props,b,damage,events){if(p.invulnerable)return false;events.push(...receiveHit(s,c,p,{...b,attackDamage:damage,unparryable:true},props));return true;}
function clearOwn(c,b,keep=()=>false){if(c.hazards)for(let i=c.hazards.length-1;i>=0;i--)if(c.hazards[i].owner===b.id&&!keep(c.hazards[i]))c.hazards.splice(i,1);
 if(c.enemyProjectiles)for(let i=c.enemyProjectiles.length-1;i>=0;i--)if(c.enemyProjectiles[i].owner===b.id)c.enemyProjectiles.splice(i,1);}
// Smoothed player velocity, used to aim slightly ahead of where the player is going.
function track(b,p,dt){if(dt<=0)return;const vx=(p.x-(b.pp?.x??p.x))/dt,vy=(p.y-(b.pp?.y??p.y))/dt;b.pv={x:(b.pv?.x??0)*.8+vx*.2,y:(b.pv?.y??0)*.8+vy*.2};b.pp={x:p.x,y:p.y};}
const lead=(b,p,t)=>({x:p.x+(b.pv?.x??0)*t,y:p.y+(b.pv?.y??0)*t});
function within(b,q,max){const dx=q.x-b.x,dy=q.y-b.y,d=Math.hypot(dx,dy);return d<=max?q:{x:b.x+dx/d*max,y:b.y+dy/d*max};}
// Moves the boss toward (tx,ty) in small steps, stopping at walls.
function slide(b,tx,ty,props){const dx=tx-b.x,dy=ty-b.y,n=Math.ceil(Math.hypot(dx,dy)/6);for(let i=0;i<n;i++){const nx=b.x+dx/n,ny=b.y+dy/n;if(blocked(nx,ny,props,b.radius*.6))return false;b.x=nx;b.y=ny;}return true;}
function shard(c,b,angle,{speed,damage,life,hitR=24,color='#ff8a3a',kind}){(c.enemyProjectiles??=[]).push({x:b.x,y:b.y-10,dx:Math.cos(angle),dy:Math.sin(angle),age:0,distance:0,owner:b.id,attackDamage:damage,speed,color,hitR,life,maxDist:speed*life,ghost:true,turn:0,big:true,frag:kind});}

// ======================= OBSIDIAN COLOSSUS =======================
// Phases (b.stage 0/1/2 = user's Phase 1/2/3): armour breaks at 66% and 33%. Damage taken: P1/P2 50% (armoured /
// core guarded), 100% kneeling; P3 100%, 150% kneeling (user-approved suggested value).
export const COL={
 speed:[34,44,56],cd:[1.5,1.15,.85],keep:120,
 // Pursuit Slam: quick punches (circle tracks for `aim`, locks, he lunges in `lunge`), then the jumping finisher.
 punch:[{n:2,aim:.55,lunge:.42,gap:.45},{n:3,aim:.42,lunge:.36,gap:.24},{n:3,aim:.32,lunge:.3,gap:.14}],
 punchR:95,punchReach:240,punchDmg:30,
 fin:{pause:.55,aim:.55,jump:.6,r:175,reach:380,dmg:55,lodge:[1.5,1.3,1.1]},
 // Oct 19 (user): 4 rocks per throw, 6 once enraged (phase 3); below 10% HP rocks rain down at random all over (rain).
 hurl:[{n:4,r:115,dmg:38,gap:.5,recover:.6},{n:4,r:105,dmg:36,gap:.42,recover:.7},{n:6,r:92,dmg:30,gap:.34,recover:1.1}],lift:.5,relift:.35,flight:.5,
 rain:{below:.1,every:.32,r:85,dmg:26,flight:.95,spread:520},
 // Oct 19 (user): Fault Line and Stomp a bit slower (950 -> 760, 300 -> 240), more room (fan .42 -> .62, stomp 1 -> 3 gaps),
 // drawn as black obsidian walls with spikes pointing at the player (titan-vfx.js, h.obsidian).
 fault:{warn:.6,len:680,width:64,  /* Oct 19 (user): more openings - narrower lines (76 -> 64) */speed:760,dmg:40,fan:.62,stagger:.4,recover:.5},
 stomp:{warn:.55,delay:.95,speed:240,dmg:34,gaps:4,  /* Oct 19 (user): 4 openings (was 3) */gapHalf:.42,shift:.5,recover:.4},
 // Oct 19 (user): Ground Slam (new): close players get a slam on the spot, far ones the Jump Slam onto them; co-op with one
 // close and one far = ground slam, then jump slam on the far player. Values are PROPOSALS.
 slam:{near:300,warn:.65,r:260,dmg:48,gap:.35,jumpReach:900},
 over:{charge:[1.5,1.15,.95],r:330,dmg:60,kneel:[4.2,3.2,2.4],every:[4,4,3]},
 exposedMul:[1,1,1.5],armored:[true,true,false],
 shed:{lanes:8,pieces:16,  /* Oct 19 (user): twice the armour pieces fly off (16 visible, the 8 lanes still do the damage) */warnAt:.35,burst:1.3,roar:1.75,end:2.6,speed:800,range:520,dmg:26}
};
function aimAt(b,p,h,reach,t,k){const q=within(b,lead(b,p,t),reach);h.x+=(q.x-h.x)*k;h.y+=(q.y-h.y)*k;}
function pursuit(b,s,c,p,props,dt,events,sp,ph){const P=COL.punch[ph],F=COL.fin;sp.t+=dt;
 if(sp.st==='next'){sp.i++;sp.t=0;const st=sp.steps[sp.i];
  if(st.k==='punch'){sp.st='aim';sp.h=add(c,{kind:'explosion',x:p.x,y:p.y,radius:COL.punchR,age:0,warning:P.aim+P.lunge,duration:.3,owner:b.id,death:false,fired:false,damage:COL.punchDmg,fx:'quake',punch:true,side:st.side,track:true});aimAt(b,p,sp.h,COL.punchReach,.3,1);}
  else sp.st='pause';}
 const st=sp.steps[sp.i],fin=st.k==='final';
 if(sp.st==='pause'){b.row=directionRow(p.x-b.x,p.y-b.y);if(sp.t>=F.pause){sp.st='aim';sp.t=0;sp.h=add(c,{kind:'explosion',x:p.x,y:p.y,radius:F.r,age:0,warning:F.aim+F.jump,duration:.4,owner:b.id,death:false,fired:false,damage:F.dmg,fx:'quake',punch:true,final:true,track:true});aimAt(b,p,sp.h,sp.reach??F.reach,.25,1);}return;}
 if(sp.st==='aim'){aimAt(b,p,sp.h,fin?sp.reach??F.reach:COL.punchReach,fin?.25:.3,Math.min(1,dt*14));b.row=directionRow(sp.h.x-b.x,sp.h.y-b.y);
  if(sp.t>=(fin?F.aim:P.aim)){sp.h.track=false;sp.st='lunge';sp.t=0;sp.from={x:b.x,y:b.y};  // target locks: no more tracking (user fairness rule)
   const a=angTo(b,sp.h),d=Math.hypot(sp.h.x-b.x,sp.h.y-b.y),stop=fin?0:Math.min(d,120);/* fists reach ~120 ahead of the body */sp.to={x:b.x+Math.cos(a)*(d-stop),y:b.y+Math.sin(a)*(d-stop)};}
  return;}
 if(sp.st==='lunge'){const T=fin?F.jump:P.lunge,u=Math.min(1,sp.t/T),e=fin?u:u<.45?0:1-Math.pow(1-(u-.45)/.55,2);  // punches: brief wind-up, then the lunge
  slide(b,sp.from.x+(sp.to.x-sp.from.x)*e,sp.from.y+(sp.to.y-sp.from.y)*e,props);b.moving=e>0&&e<1;b.lift=fin?Math.sin(u*Math.PI)*150:0;
  if(u>=1){b.lift=0;events.push({type:'bossImpact',x:sp.h.x,y:sp.h.y,kind:fin?'smash':'charge'});sp.t=0;sp.st=fin?'lodge':'gap';}return;}
 if(sp.st==='gap'){if(sp.t>=P.gap)sp.st='next';return;}
 if(sp.st==='lodge'&&sp.t>=F.lodge[ph])sp.duration=sp.elapsed;  // fists stuck in the ground: the combo's attack window
}
// Oct 19 (user): Ground Slam / Jump Slam by distance (see COL.slam). The jump reuses the Pursuit finisher on the far player.
function slam(b,s,c,p,props,dt,events,sp,ph){const G=COL.slam;
 if(sp.st==='next'&&sp.steps[sp.i+1]?.k==='ground'){sp.i++;sp.t=0;sp.st='ground';b.row=directionRow(p.x-b.x,p.y-b.y);add(c,{kind:'explosion',x:b.x,y:b.y,radius:G.r,age:0,warning:G.warn,duration:.4,owner:b.id,death:false,fired:false,damage:G.dmg,fx:'quake',punch:true,final:true,groundSlam:true});return;}
 if(sp.st==='ground'){sp.t+=dt;if(sp.t>=G.warn){events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});sp.st='gpost';sp.t=0;}return;}
 if(sp.st==='gpost'){sp.t+=dt;if(sp.t>=G.gap){if(sp.i+1<sp.steps.length)sp.st='next';else sp.duration=sp.elapsed;}return;}
 const who=sp.who&&everyone(p).includes(sp.who)?sp.who:p;return pursuit(b,s,c,who,props,dt,events,sp,ph);}
// Below 10% HP: rocks fall from the sky at random spots around the players and the Colossus.
function rockRain(b,c,p,dt,events){const R=COL.rain;b.rainT=(b.rainT??0)-dt;
 for(const h of b.rain??[])if(!h.thud&&h.age>=h.warning){h.thud=true;events.push({type:'bossImpact',x:h.x,y:h.y,kind:'charge'});}
 if(b.rain)b.rain=b.rain.filter(h=>!h.thud);
 if(b.rainT>0)return;b.rainT=R.every;const ps=everyone(p),o=Math.random()<.6?ps[Math.floor(Math.random()*ps.length)]:b,a=Math.random()*TAU,d=Math.sqrt(Math.random())*R.spread,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d*.72;
 (b.rain??=[]).push(add(c,{kind:'explosion',x,y,radius:R.r,age:0,warning:R.flight,duration:.35,owner:b.id,death:false,fired:false,damage:R.dmg,fx:'rock',hurl:true,lift:0,flight:R.flight,fromX:x+(Math.random()-.5)*120,fromY:y-520,small:true,rain:true}));}
function startColossusShed(b,c,stage,events){clearOwn(c,b);const a0=Math.random()*TAU;
 b.special={kind:'shed',elapsed:0,windup:0,duration:COL.shed.end,fired:false,stage,lanes:Array.from({length:COL.shed.lanes},(_,i)=>a0+i*TAU/COL.shed.lanes+(Math.random()-.5)*.12)};
 b.swing=null;b.lift=0;b.exposed=0;b.invulnerable=1;  // can't be hurt mid-transition, so it never skips a phase
 events.push({type:'worldNotice',text:stage===1?'The Colossus’s armour cracks · helm and shoulders tear loose!':'The Colossus sheds the last of its armour!'});}
export const COLOSSUS={keep:COL.keep,
 cd:b=>COL.cd[b.stage??0],
 pick(b,p,d){const ph=b.stage??0,n=b.specialCount=(b.specialCount??0)+1;if(n%COL.over.every[ph]===0&&b.lastKind!=='overload')return 'overload';
  let o=d<340?['pursuit','slam','stomp','fault']:d>520?['hurl','fault','slam','stomp']:['pursuit','hurl','fault','stomp','slam'];o=o.filter(k=>k!==b.lastKind);
  return o[Math.floor(Math.random()*o.length)]??'stomp';},
 pre(b,s,c,p,props,dt,events){track(b,p,dt);if(b.special?.kind==='shed')return;if(b.hp<b.maxHp*COL.rain.below&&!b.sleeping)rockRain(b,c,p,dt,events);
  const want=b.hp<b.maxHp/3?2:b.hp<b.maxHp*2/3?1:0;if(want>(b.stage??0))startColossusShed(b,c,(b.stage??0)+1,events);},
 start(b,s,c,p,kind){const ph=b.stage??0,sp=b.special={kind,elapsed:0,windup:0,duration:Infinity,fired:false};b.swing=null;b.lastKind=kind;b.row=directionRow(p.x-b.x,p.y-b.y);
  if(kind==='pursuit'){sp.steps=Array.from({length:COL.punch[ph].n},(_,i)=>({k:'punch',side:i%2})).concat([{k:'final'}]);sp.i=-1;sp.st='next';sp.t=0;return;}
  if(kind==='slam'){const G=COL.slam,ps=everyone(p),near=ps.filter(q=>gd(q,b.x,b.y)<G.near),far=ps.filter(q=>gd(q,b.x,b.y)>=G.near).sort((u,v)=>gd(v,b.x,b.y)-gd(u,b.x,b.y));
   sp.steps=[...(near.length?[{k:'ground'}]:[]),...(far.length?[{k:'final'}]:[])];sp.who=far[0]??null;sp.reach=G.jumpReach;sp.i=-1;sp.st='next';sp.t=0;return;}
  if(kind==='hurl'){sp.n=COL.hurl[ph].n;sp.done=0;sp.next=0;sp.rocks=[];return;}
  if(kind==='fault'){const F=COL.fault,a=angTo(b,p),list=ph===0?[[0,0],[-F.fan,0],[F.fan,0]]:ph===1?[[0,0],[-F.fan,0],[F.fan,0],[-2*F.fan,0],[2*F.fan,0]]:[[0,0],[-F.fan,F.stagger],[F.fan,F.stagger],[-2*F.fan,F.stagger*2],[2*F.fan,F.stagger*2]];  // Oct 19 (user): 2 more lines (3 / 5 / 5, was 1 / 3 / 3); P3 fans out from the centre
   sp.lanes=list.map(([o,late])=>add(c,{kind:'lane',x:b.x,y:b.y,angle:a+o,len:F.len,width:F.width,age:0,warning:F.warn+late,duration:F.len/F.speed+.25,owner:b.id,fault:true,obsidian:true,fspeed:F.speed}));
   sp.duration=F.warn+(ph===2?F.stagger:0)+F.len/F.speed+F.recover;return;}
  if(kind==='stomp'){const S=COL.stomp,n=ph+1,g0=Math.random()*TAU,sh=(Math.random()<.5?1:-1)*S.shift;  // P3: the gaps shift a little between rings
   sp.rings=Array.from({length:n},(_,i)=>add(c,{kind:'ring',x:b.x,y:b.y,age:0,warning:S.warn+i*S.delay,duration:3.3,speed:S.speed,band:18,gaps:Array.from({length:S.gaps},(_,g)=>g0+g*TAU/S.gaps+(ph===2&&i%2?sh:0)),gapHalf:S.gapHalf,owner:b.id,damage:S.dmg,stomp:true,obsidian:true}));
   sp.duration=S.warn+(n-1)*S.delay+S.recover;return;}
  if(kind==='overload'){const O=COL.over;sp.charge=O.charge[ph];sp.kneel=O.kneel[ph];sp.h=add(c,{kind:'explosion',x:b.x,y:b.y,radius:O.r,age:0,warning:sp.charge,duration:.4,owner:b.id,death:false,fired:false,damage:O.dmg,fx:'quake',overload:true});sp.duration=sp.charge+sp.kneel+.45;}},
 tick(b,s,c,p,props,dt,events,sp){const ph=b.stage??0;
  if(sp.kind==='shed'){const S=COL.shed;
   if(!sp.warned&&sp.elapsed>=S.warnAt){sp.warned=true;for(const a of sp.lanes)add(c,{kind:'lane',x:b.x,y:b.y,angle:a,len:S.range,width:58,age:0,warning:S.burst-S.warnAt,duration:.05,owner:b.id,shedLane:true});}
   if(!sp.fired&&sp.elapsed>=S.burst){sp.fired=true;sp.burstAt=sp.elapsed;for(const a of sp.lanes)shard(c,b,a,{speed:S.speed,damage:S.dmg,life:S.range/S.speed,kind:'armor'});
    b.stage=sp.stage;b.speed=COL.speed[sp.stage];b.armored=COL.armored[sp.stage];b.exposedMul=COL.exposedMul[sp.stage];b.specialCount=0;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}
   if(!sp.roared&&sp.elapsed>=S.roar){sp.roared=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});}
   if(sp.elapsed>=S.end-.02)b.invulnerable=0;return;}
  if(sp.kind==='pursuit')return pursuit(b,s,c,p,props,dt,events,sp,ph);
  if(sp.kind==='slam')return slam(b,s,c,p,props,dt,events,sp,ph);
  if(sp.kind==='hurl'){const H=COL.hurl[ph];
   while(sp.done<sp.n&&sp.elapsed>=sp.next){const lift=sp.done?COL.relift:COL.lift,q=within(b,lead(b,p,lift+COL.flight*.6),640);
    sp.rocks.push(add(c,{kind:'explosion',x:q.x,y:q.y,radius:H.r,age:0,warning:lift+COL.flight,duration:.35,owner:b.id,death:false,fired:false,damage:H.dmg,fx:'rock',hurl:true,lift,flight:COL.flight,fromX:b.x,fromY:b.y,small:ph===2}));
    sp.done++;b.row=directionRow(q.x-b.x,q.y-b.y);if(sp.done<sp.n)sp.next=sp.elapsed+H.gap;else sp.duration=sp.elapsed+lift+COL.flight+H.recover;}
   for(const h of sp.rocks)if(!h.thud&&h.age>=h.warning){h.thud=true;events.push({type:'bossImpact',x:h.x,y:h.y,kind:'charge'});}
   return;}
  if(sp.kind==='fault'){const F=COL.fault;for(const l of sp.lanes){const k=l.age-l.warning;if(k<0||l.front>=l.len)continue;
    if(!l.hidden){l.hidden=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}
    const was=l.front??0;l.front=Math.min(l.len,k*F.speed);
    for(const pl of everyone(p)){if(!wasHit(sp,pl,'hit')&&!pl.invulnerable){const dx=pl.x-l.x,dy=pl.y-l.y,along=dx*Math.cos(l.angle)+dy*Math.sin(l.angle),side=Math.abs(-dx*Math.sin(l.angle)+dy*Math.cos(l.angle));
     if(along>=was-30&&along<=l.front+12&&side<l.width/2+6){markHit(sp,pl,'hit');hit(s,c,pl,props,b,F.dmg,events);}}}/* multiplayer: every standing player */}
   return;}
  if(sp.kind==='stomp'){for(const r of sp.rings)if(!r.go&&r.age>=r.warning){r.go=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}return;}
  if(sp.kind==='overload'){if(!sp.fired&&sp.elapsed>=sp.charge){sp.fired=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'},{type:'worldNotice',text:'The Colossus’s core is exposed · strike now!'});}
   if(sp.fired)b.exposed=Math.max(0,sp.charge+sp.kneel-sp.elapsed);}}  // kneeling: chest open, core exposed
};

// ======================= DUNE WYRM =======================
// Four legs (user: like the concept sheet, not six). Armoured until its armour bar (35% of HP, no regen) breaks, then
// exposed: faster (x1.3), turns quicker and uses the expanded versions of each attack.
export const WY={turn:[2.2,3.2],keep:230,cd:[1,.7],  // Oct 17 (user): attacks a bit closer together (was 1.4 / 1)
 mouth:200,paw:90,  // mouth/front paws sit this far ahead of the body centre (HD model)
 breath:{windup:.6,range:460,  /* user: a little shorter (was 540) */half:.42,arc:1.05,  // Oct 17 (user): bigger area (was 390 / .3 / .95)
 time:[2.1,1.6],pause:.45,tick:.3,dmg:12,recover:.4},  // Oct 17 (user): sweeps slower (was 1.5 / 1.15 s)
 burrow:{dig:.5,speed:520,trackMax:[1.3,.8],near:70,lockAfter:.35,erupt:.45,r:125,dmg:40,surface:.35,recover:[1,1.3]},
 tail:{windup:.5,r:240,dmg:32,again:.8,recover:.4},
 // Oct 17 (user): the tail's expanding spike ring is replaced by random ground spots that rumble, then erupt.
 rumble:{n:[7,7],warn:.95,stagger:.35,r:72,dmg:28,min:40,max:380},  // Oct 17 (user): always 7 random spots, all around the player
 charge:{windup:.55,len:[480,620],width:110,speed:[950,1250],slide:150,dmg:44,recover:[1.1,.6]},
 claws:{windup:.38,r:205,half:.75,off:.6,dmg:34,gap:.4,recover:.5},
 // Oct 17 (user): two volleys (2 then 2 again; exposed 3 + 3), landing area bigger (r 95 -> 120)
 spit:{windup:.45,flight:.6,r:120,life:7,slow:.45,max:[4,6],n:[2,3],spread:[200,260],volleys:2,again:.7},
 shed:{pop:.8,rise:1.8,end:2.4}
};
export const mouthOf=b=>({x:b.x+Math.cos(b.face??0)*WY.mouth,y:b.y+Math.sin(b.face??0)*WY.mouth*.65});
// Longest straight run (<= len) that keeps the charge inside the Wyrm's pit (user: stops at the arena boundary).
function pitClamp(b,a,len){if(!b.home||!b.homeR)return len;for(let t=10;t<=len;t+=10){const x=b.x+Math.cos(a)*t,y=b.y+Math.sin(a)*t;if(Math.hypot(x-b.home.x,(y-b.home.y)/.72)>b.homeR-60)return Math.max(60,t-10);}return len;}
function spitVolley(b,c,p,ex){const Q=WY.spit,n=Q.n[ex],P=lead(b,p,.45),base=angTo(b,p),side=Math.random()<.5?1:-1;
 const offs=n===2?[[0,0],[base+side*Math.PI/2,Q.spread[0]]]:[[0,0],[base+1.9,Q.spread[1]],[base-1.9,Q.spread[1]]];  // leaves the routes toward and away from the Wyrm open
 const mine=(c.hazards??[]).filter(h=>h.kind==='quicksand'&&h.owner===b.id);for(const h of mine.slice(0,Math.max(0,mine.length+n-Q.max[ex])))c.hazards.splice(c.hazards.indexOf(h),1);  // cap
 const m=mouthOf(b);for(const [oa,r] of offs)add(c,{kind:'quicksand',x:P.x+Math.cos(oa)*r,y:P.y+Math.sin(oa)*r*.65,radius:Q.r,age:0,warning:Q.windup+Q.flight,duration:Q.life,owner:b.id,slow:Q.slow,fromX:m.x,fromY:m.y,flight:Q.flight});}
function tailSweep(b,c,p){const T=WY.tail,U=WY.rumble,ex=b.armorBroken?1:0;add(c,{kind:'explosion',x:b.x,y:b.y,radius:T.r,age:0,warning:T.windup,duration:.3,owner:b.id,death:false,fired:false,damage:T.dmg,fx:'sand',tail:true});
 // rumble spots: exactly n random spots around the player, kept apart so there is always room between them (spacing
 // relaxes if the area is crowded so the count never drops)
 const spots=[];for(let k=0;k<400&&spots.length<U.n[ex];k++){const a=Math.random()*TAU,r=U.min+Math.random()*(U.max-U.min),q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*.65},gap=U.r*(k<200?2.1:1.3);
  if(spots.some(s=>Math.hypot(s.x-q.x,(s.y-q.y)/.65)<gap))continue;spots.push(q);}
 for(const q of spots)add(c,{kind:'explosion',x:q.x,y:q.y,radius:U.r,age:0,warning:T.windup+U.warn*.6+Math.random()*U.stagger,duration:.8,owner:b.id,death:false,fired:false,damage:U.dmg,fx:'sand',rumble:true,seed:Math.random()*1000});}
export const WYRM={keep:WY.keep,
 cd:b=>WY.cd[b.armorBroken?1:0],
 pick(b,p,d){const off=Math.abs(wrap(angTo(b,p)-(b.face??0)));let o;
  if(off>2.1&&d<380)o=['tail','tail','spit'];             // behind it: tail
  else if(d<240&&off<1.4)o=['claws','claws','breath','tail'];  // beside its head: claws
  else if(d<450)o=['breath','spit','tail','charge'];
  else o=['charge','charge','spit'];                       // far: close the distance
  if((b.sinceBurrow??2)>=3)o.push('burrow');                // never back-to-back burrows
  o=o.filter(k=>k!==b.lastKind);return o[Math.floor(Math.random()*o.length)]??'breath';},
 pre(b,s,c,p,props,dt,events){track(b,p,dt);b.face??=angTo(b,p);
  if(!b.special){const d=wrap(angTo(b,p)-b.face),m=WY.turn[b.armorBroken?1:0]*dt;b.face=wrap(b.face+clamp(d,-m,m));}
  if(b.armorMax&&b.armorHp<=0&&!b.armorBroken){clearOwn(c,b);b.armorBroken=true;b.special={kind:'shed',elapsed:0,windup:0,duration:WY.shed.end,fired:false};b.swing=null;b.hidden=false;b.invulnerable=0;
   events.push({type:'worldNotice',text:'The Wyrm’s armour shatters!'});}},
 post(b){if(b.face!=null)b.row=directionRow(Math.cos(b.face),Math.sin(b.face));},
 start(b,s,c,p,kind){const ex=b.armorBroken?1:0,a=angTo(b,p),sp=b.special={kind,elapsed:0,windup:0,duration:Infinity,fired:false};b.swing=null;b.lastKind=kind;b.sinceBurrow=kind==='burrow'?0:(b.sinceBurrow??2)+1;
  if(kind==='breath'){const B=WY.breath;b.face=wrap(b.face+clamp(wrap(a-b.face),-.6,.6));sp.dir=Math.random()<.5?1:-1;sp.a0=b.face;sp.passes=ex?2:1;sp.beam=sp.a0-sp.dir*B.arc;sp.tickT=0;
   sp.duration=B.windup+B.time[ex]*sp.passes+(ex?B.pause:0)+B.recover;return;}
  if(kind==='burrow'){clearOwn(c,b,h=>h.kind!=='quicksand');sp.st='dig';sp.t=0;sp.n=0;sp.total=ex?2:1;return;}  // user: patches clear before Burrow Ambush
  if(kind==='tail'){tailSweep(b,c,p);sp.second=!!ex;sp.duration=WY.tail.windup+(ex?WY.tail.again:0)+WY.rumble.warn+WY.rumble.stagger+.2;return;}
  if(kind==='charge'){const C=WY.charge;b.face=a;sp.angle=a;sp.len=pitClamp(b,a,C.len[ex]);sp.travel=0;
   sp.lane=add(c,{kind:'lane',x:b.x,y:b.y,angle:a,len:sp.len,width:C.width,age:0,warning:C.windup,duration:sp.len/C.speed[ex]+1.2,owner:b.id,wyrmCharge:true});return;}
  if(kind==='claws'){sp.side=Math.sign(wrap(a-b.face))||1;sp.swipes=ex?2:1;sp.n=0;sp.next=0;sp.arcs=[];return;}
  if(kind==='spit'){spitVolley(b,c,p,ex);sp.volley=1;sp.duration=WY.spit.windup+WY.spit.again*(WY.spit.volleys-1)+WY.spit.flight+.25;return;}
  },
 tick(b,s,c,p,props,dt,events,sp){const ex=b.armorBroken?1:0;
  if(sp.kind==='shed'){const S=WY.shed;if(!sp.popped&&sp.elapsed>=S.pop){sp.popped=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}
   if(!sp.fired&&sp.elapsed>=S.rise){sp.fired=true;b.phase2=true;b.speed=(b.baseSpeed??b.speed)*1.3;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'},{type:'worldNotice',text:b.name+' is enraged!'});}
   return;}
  if(sp.kind==='breath'){const B=WY.breath;if(sp.elapsed<B.windup)return;const k=sp.elapsed-B.windup,T=B.time[ex];let on=true;
   if(k<T)sp.beam=sp.a0+sp.dir*B.arc*(-1+2*k/T);
   else if(sp.passes>1&&k<T+B.pause){sp.beam=sp.a0+sp.dir*B.arc;on=false;sp.reversing=true;}       // clear pause before the reversal
   else if(sp.passes>1&&k<2*T+B.pause)sp.beam=sp.a0+sp.dir*B.arc*(1-2*(k-T-B.pause)/T);
   else on=false;
   sp.on=on;if(on){sp.tickT-=dt;const m=mouthOf(b);if(sp.tickT<=0){let any=false;for(const pl of everyone(p))if(gd(pl,m.x,m.y)<B.range&&Math.abs(wrap(angTo(m,pl)-sp.beam))<B.half&&hit(s,c,pl,props,b,B.dmg,events))any=true;if(any)sp.tickT=B.tick;}/* multiplayer: the beam hits every player */}
   return;}
  if(sp.kind==='burrow'){const U=WY.burrow;sp.t+=dt;
   if(sp.st==='dig'){if(sp.t>=U.dig){sp.st='trail';sp.t=0;b.hidden=true;b.invulnerable=1;sp.head={x:b.x,y:b.y};sp.trail=[];}return;}
   if(sp.st==='trail'){const d=Math.hypot(p.x-sp.head.x,p.y-sp.head.y),v=Math.min(d,U.speed*dt);if(d>1){sp.head.x+=(p.x-sp.head.x)/d*v;sp.head.y+=(p.y-sp.head.y)/d*v;}
    sp.trail.push({x:sp.head.x,y:sp.head.y,t:sp.elapsed});if(sp.trail.length>90)sp.trail.shift();
    if(d<U.near||sp.t>=U.trackMax[ex]){sp.st='circle';sp.t=0;sp.h=add(c,{kind:'explosion',x:p.x,y:p.y,radius:U.r,age:0,warning:U.lockAfter+U.erupt,duration:.4,owner:b.id,death:false,fired:false,damage:U.dmg,fx:'sand',burrow:true,track:true});}return;}
   if(sp.st==='circle'){if(sp.t<U.lockAfter){const k=Math.min(1,dt*10);sp.h.x+=(p.x-sp.h.x)*k;sp.h.y+=(p.y-sp.h.y)*k;}else sp.h.track=false;
    if(sp.t>=U.lockAfter+U.erupt){sp.n++;b.hidden=false;b.invulnerable=0;if(!blocked(sp.h.x,sp.h.y,props,b.radius*.6)){b.x=sp.h.x;b.y=sp.h.y;}b.face=angTo(b,p);sp.trail=[];
     events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});sp.st=sp.n<sp.total?'surface':'recover';sp.t=0;}return;}
   if(sp.st==='surface'){if(sp.t>=U.surface){sp.st='trail';sp.t=0;b.hidden=true;b.invulnerable=1;sp.head={x:b.x,y:b.y};}return;}
   if(sp.t>=U.recover[ex])sp.duration=sp.elapsed;return;}  // stays above ground: punish window
  if(sp.kind==='spit'){while(sp.volley<WY.spit.volleys&&sp.elapsed>=WY.spit.again*sp.volley){sp.volley++;spitVolley(b,c,p,ex);}return;}
  if(sp.kind==='tail'){if(sp.second&&!sp.again&&sp.elapsed>=WY.tail.again){sp.again=true;tailSweep(b,c,p);}return;}
  if(sp.kind==='charge'){const C=WY.charge;if(sp.elapsed<C.windup||sp.done)return;
   const full=sp.len-(ex?C.slide:0),v=sp.travel<full?C.speed[ex]:Math.max(160,C.speed[ex]*(1-(sp.travel-full)/C.slide));let step=v*dt;  // exposed: braking slide inside the lane
   while(step>0){const st=Math.min(5,step);step-=st;const nx=b.x+Math.cos(sp.angle)*st,ny=b.y+Math.sin(sp.angle)*st;if(sp.travel>=sp.len||blocked(nx,ny,props,b.radius*.6)){sp.done=true;break;}b.x=nx;b.y=ny;sp.travel+=st;}
   b.moving=!sp.done;sp.sliding=sp.travel>full;
   for(const pl of everyone(p)){if(!wasHit(sp,pl,'hit')&&gd(pl,b.x+Math.cos(sp.angle)*120,b.y+Math.sin(sp.angle)*78)<110&&hit(s,c,pl,props,b,C.dmg,events)){markHit(sp,pl,'hit');const n=Math.hypot(pl.x-b.x,pl.y-b.y)||1;movePlayer(pl,(pl.x-b.x)/n*50,(pl.y-b.y)/n*50,props);}}  // multiplayer: every standing player
   Object.assign(sp.lane,{x:b.x,y:b.y,len:Math.max(1,sp.len-sp.travel)});
   if(sp.done){const i=c.hazards.indexOf(sp.lane);if(i>=0)c.hazards.splice(i,1);events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});sp.duration=sp.elapsed+C.recover[ex];}
   return;}
  if(sp.kind==='claws'){const K=WY.claws;
   while(sp.n<sp.swipes&&sp.elapsed>=sp.next){const side=sp.n%2?-sp.side:sp.side;sp.arcs.push({x:b.x+Math.cos(b.face)*WY.paw,y:b.y+Math.sin(b.face)*WY.paw*.65,angle:b.face+side*K.off,r:K.r,half:K.half,side,born:sp.elapsed,at:sp.elapsed+K.windup});sp.n++;sp.next=sp.elapsed+K.windup+K.gap;}
   for(const q of sp.arcs)if(!q.done&&sp.elapsed>=q.at){q.done=true;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'sweep'});
    for(const pl of everyone(p)){if(gd(pl,q.x,q.y)<q.r&&Math.abs(wrap(angTo(q,pl)-q.angle))<q.half)hit(s,c,pl,props,b,K.dmg,events);}/* multiplayer: every standing player */}
   if(sp.n>=sp.swipes&&sp.arcs.every(q=>q.done)&&sp.duration===Infinity)sp.duration=sp.elapsed+K.recover;
   return;}}
};
