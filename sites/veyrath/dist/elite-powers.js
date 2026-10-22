import {blocked,movePlayer} from './simulation.js?v=fx-260';
import {receiveHit} from './survival.js?v=fx-260';
import {shieldProtects} from './forge-shield.js?v=fx-260';
import {tickEliteFx,drawEliteHazardsFx} from './elite-fx.js?v=fx-260';
import {ELITE_MODELS} from './wave-roster.js?v=fx-260';
import {applyGuardianWards} from './enemy-roles.js?v=fx-260';
import {everyone,wasHit,markHit} from './party.js?v=fx-260';
// Oct 19 audit: hazards may carry `frac` = share of the hit player's max HP (final boss), so big hits stay lethal at any level.
const hpOf=(pl,s)=>pl?.kit?.s?.maxHp??pl?.maxHp??s.maxHp;const dmgOf=(h,pl,s,base)=>h.frac?Math.max(1,Math.round(hpOf(pl,s)*h.frac/2)):(h.damage??base);
// Oct 18 (user): Warding dropped; six powers, each tied to its own elite model (wave-roster.js ELITE_MODELS).
export const ELITE_MODIFIERS=[
 {id:'frostbound',name:'FROSTBOUND',color:'#bceeff',filter:'grayscale(1) sepia(1) saturate(2) hue-rotate(150deg) brightness(1.35)'},
 {id:'waller',name:'WALLER',color:'#b78b59',filter:'grayscale(1) sepia(1) saturate(1.5) brightness(.95)'},
 {id:'explosive',name:'EXPLOSIVE',color:'#ef594b',filter:'grayscale(1) sepia(1) saturate(5) hue-rotate(325deg) brightness(1.1)'},
 {id:'vampiric',name:'VAMPIRIC',color:'#ee829e',filter:'grayscale(1) sepia(1) saturate(3) hue-rotate(285deg)'},
 {id:'shielded',name:'SHIELDED',color:'#ddc777',filter:'grayscale(1) sepia(1) saturate(2) brightness(1.2)'},
 {id:'berserker',name:'BERSERKER',color:'#ff7775',filter:'grayscale(1) sepia(1) saturate(4) hue-rotate(325deg)'},
];
export const eliteTint=e=>ELITE_MODIFIERS.find(m=>m.id===e.modifier)?.filter??'none';
export function assignElite(leader,index){
 const m=typeof index==='string'?ELITE_MODIFIERS.find(x=>x.id===index)??ELITE_MODIFIERS[0]:ELITE_MODIFIERS[index%ELITE_MODIFIERS.length];Object.assign(leader,{modifier:m.id,eliteName:m.name,eliteColor:m.color,powerCD:1.5,barrier:0,skin:ELITE_MODELS[m.id]??leader.skin});
}
export function wallProps(r){return r.hazards.filter(h=>h.kind==='wall'&&h.solid).map(h=>({...h,key:'Wall-A1_E',scale:.55,layer:'depth',footprint:[{x:h.x-20,y:h.y-11},{x:h.x+20,y:h.y-11},{x:h.x+20,y:h.y+11},{x:h.x-20,y:h.y+11}]}));}
export function addExplosion(r,e,death=false){r.hazards.push({kind:'explosion',x:e.x,y:e.y,radius:death?130:95,age:0,warning:1,duration:.4,owner:e.id,death,fired:false});}
// Cast snapshots lead the running direction; telegraphs never follow the player afterward.
export function eliteAimAhead(p,enemy,velocity={x:0,y:0},warning=1,rng=Math.random){
 const speed=Math.hypot(velocity.x,velocity.y),fallback=Math.atan2(p.y-enemy.y,p.x-enemy.x),dx=speed>1?velocity.x/speed:Math.cos(fallback),dy=speed>1?velocity.y/speed:Math.sin(fallback);
 const predicted=speed>1?Math.max(150,Math.min(230,speed*warning)):150,roll=rng();
 const mode=roll<.25?'current':roll<.7?'ahead':'offset',lead=mode==='current'?0:mode==='ahead'?predicted*(.75+rng()*.35):predicted*(.45+rng()*.55),side=mode==='offset'?(rng()<.5?-1:1)*(40+rng()*50):0;
 return {x:p.x+dx*lead-dy*side,y:p.y+dy*lead+dx*side,dx,dy,mode};
}
export function tickElitePowers(r,s,c,p,props,dt,velocity={x:0,y:0}){
 const events=[];s.fieldSlow=0;s.fieldAtkSlow=0;for(const e of c.targets)e.warded=false;applyGuardianWards(c);
 const leaders=c.targets.filter(e=>e.state==='alive'&&e.role==='leader');
 for(const e of leaders){
   if(e.emerge>0||s.timeStop&&!e.pit)continue;e.powerCD-=dt;e.barrier=Math.max(0,(e.barrier??0)-dt);
   e.rageModifier=e.modifier==='berserker'&&e.hp<e.maxHp*.5?1.2:1;e.attackDamage=e.rageModifier>1?45:35;
   if(e.modifier==='warding')for(const ally of c.targets)if(ally!==e&&ally.state==='alive'&&Math.hypot(ally.x-e.x,ally.y-e.y)<240)ally.warded=true;
   if(e.powerCD>0||p.unseen||Math.hypot(e.x-p.x,e.y-p.y)>800)continue;
   e.powerCD=e.modifier==='frostbound'?3.5:e.modifier==='waller'?5:e.modifier==='explosive'?4:6;
   // Oct 15 user request: spells were plain straight lines. Patterns below replace them; damage/slow/timings kept.
   if(e.modifier==='frostbound'&&!shieldProtects(s.forgeShield,p)){
     // Ice-shard volley: five lobbed shards land one after another in a rotated cross around the predicted spot
     // (radius 85->70 so total frozen area stays close to the old three patches).
     const aim=eliteAimAhead(p,e,velocity,.85),rot=Math.random()*Math.PI*2,spots=[[0,0],...[0,1,2,3].map(i=>[Math.cos(rot+i*Math.PI/2)*120,Math.sin(rot+i*Math.PI/2)*120*.65])];
     spots.forEach(([ox,oy],i)=>{const x=aim.x+ox,y=aim.y+oy;if(!shieldProtects(s.forgeShield,{x,y}))r.hazards.push({kind:'frost',x,y,fromX:e.x,fromY:e.y,radius:70,age:0,warning:.85+i*.12,duration:4.5,owner:e.id});});
   }
   if(e.modifier==='waller'){
     // Wall arc: seven walls curve around the far side of the predicted spot; the opening faces the elite.
     const aim=eliteAimAhead(p,e,velocity,1),base=Math.atan2(aim.y-e.y,aim.x-e.x),group=r.wallGroup=(r.wallGroup??0)+1,n=7;
     for(let i=0;i<n;i++){const a=base+(i/(n-1)-.5)*2.6,x=aim.x+Math.cos(a)*115,y=aim.y+Math.sin(a)*115*.65;
       if(!blocked(x,y,props,26)&&!shieldProtects(s.forgeShield,{x,y}))r.hazards.push({kind:'wall',x,y,age:0,warning:1,duration:5,owner:e.id,solid:false,group,idx:i});
     }
   }
   if(e.modifier==='explosive'&&!shieldProtects(s.forgeShield,p)){
     // Cluster bomb: three 80-radius blasts in a triangle around the predicted spot, detonating .3s apart.
     const aim=eliteAimAhead(p,e,velocity,1),rot=Math.random()*Math.PI*2;
     for(let i=0;i<3;i++){const a=rot+i*Math.PI*2/3;r.hazards.push({kind:'explosion',x:aim.x+Math.cos(a)*70,y:aim.y+Math.sin(a)*70*.65,radius:80,age:0,warning:1+i*.3,duration:.4,owner:e.id,death:false,fired:false});}
   }
   if(e.modifier==='shielded')e.barrier=2;
 }
 for(let i=r.hazards.length-1;i>=0;i--){const h=r.hazards[i];h.age+=dt;
   if(h.age>h.warning+h.duration||(!h.death&&!c.targets.some(e=>e.id===h.owner&&e.state==='alive'))||shieldProtects(s.forgeShield,h)){r.hazards.splice(i,1);continue;}
   if(h.age<h.warning)continue;
   // Oct 15: frost also damages (landing hit + small tick while standing in it), not just slows.
   if(h.kind==='frost'){const ins=everyone(p).filter(pl=>!shieldProtects(s.forgeShield,pl)&&Math.hypot(pl.x-h.x,(pl.y-h.y)/.65)<h.radius);  // multiplayer: every standing player
     if(!h.fired){h.fired=true;for(const pl of ins)events.push(...receiveHit(s,c,pl,{...h,attackDamage:12,unparryable:true},props));}
     h.tick=(h.tick??.5)-dt;if(ins.includes(p))s.fieldSlow=.35;if(ins.length&&h.tick<=0){h.tick=.5;for(const pl of ins)events.push(...receiveHit(s,c,pl,{...h,attackDamage:4,unparryable:true},props));}}
   // Mini-boss hazards (rewards.js): falling boulders and gapped quake rings.
   if(h.kind==='boulder'&&!h.fired){h.fired=true;for(const pl of everyone(p)){if(Math.hypot(pl.x-h.x,(pl.y-h.y)/.65)<h.radius)events.push(...receiveHit(s,c,pl,{...h,attackDamage:h.damage??30,unparryable:true},props));}/* multiplayer: every standing player */}
   if(h.kind==='ring'){const R=(h.age-h.warning)*h.speed;h.r=R;for(const pl of everyone(p)){if(!wasHit(h,pl,'hitDone')){const dx=pl.x-h.x,dy=(pl.y-h.y)/.65,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),inGap=(h.gaps??[h.gap]).some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<h.gapHalf);if(Math.abs(d-R)<h.band&&!inGap){markHit(h,pl,'hitDone');events.push(...receiveHit(s,c,pl,{...h,attackDamage:h.damage??25,unparryable:true},props));}}}/* multiplayer: every standing player */}
   if(h.kind==='wall'){
     if(!h.fired){h.fired=true;for(const pl of everyone(p)){if(Math.hypot(pl.x-h.x,pl.y-h.y)<32){events.push(...receiveHit(s,c,pl,{...h,attackDamage:12,unparryable:true},props));const dx=pl.x-h.x,dy=pl.y-h.y,n=Math.hypot(dx,dy)||1;movePlayer(pl,dx/n*35,dy/n*35,props);}}/* multiplayer: every standing player */}
     if(!h.solid&&Math.hypot(p.x-h.x,p.y-h.y)>40&&!c.targets.some(e=>e.state==='alive'&&Math.hypot(e.x-h.x,e.y-h.y)<(e.radius??13)+28))h.solid=true;
   }
   if(h.kind==='soulmire'&&Math.hypot(p.x-h.x,(p.y-h.y)/.65)<h.radius)s.fieldAtkSlow=Math.max(s.fieldAtkSlow,h.atkSlow);  // attacks 35% slower while inside
   // Oct 17: Dune Wyrm Quicksand Spit patches slow (no damage).
   if(h.kind==='quicksand'&&Math.hypot(p.x-h.x,(p.y-h.y)/.65)<h.radius)s.fieldSlow=Math.max(s.fieldSlow??0,h.slow??.4);
   if(h.kind==='explosion'&&!h.fired&&h.echo&&h.mireR!==0)r.hazards.push({kind:'soulmire',x:h.x,y:h.y,radius:h.radius*.85,age:0,warning:0,duration:4,owner:h.owner,atkSlow:.35});  // Oct 17: Delayed Echo leaves a Soul Mire
   if(h.kind==='explosion'&&!h.fired){h.fired=true;for(const pl of everyone(p)){if(Math.hypot(pl.x-h.x,(pl.y-h.y)/.65)<h.radius)events.push(...receiveHit(s,c,pl,{...h,attackDamage:dmgOf(h,pl,s,18),unparryable:true},props));}/* multiplayer: every standing player */}
   // Oct 16 boss hazards: lingering fire patches and the final boss's closing ring of fire.
   if(h.kind==='fire'){h.tick=(h.tick??0)-dt;if(h.tick<=0){const ins=everyone(p).filter(pl=>Math.hypot(pl.x-h.x,(pl.y-h.y)/.65)<h.radius);if(ins.length){h.tick=.4;for(const pl of ins)events.push(...receiveHit(s,c,pl,{...h,attackDamage:dmgOf(h,pl,s,7),unparryable:true},props));}}/* multiplayer */}
   if(h.kind==='firering'){const life=h.age-h.warning,k=life<h.close?life/h.close:life<h.close+h.hold?1:Math.max(0,1-(life-h.close-h.hold)/h.open);h.r=h.r0+(h.r1-h.r0)*k;h.tick=(h.tick??0)-dt;
    if(h.tick<=0){const out=everyone(p).filter(pl=>Math.hypot(pl.x-h.x,(pl.y-h.y)/.72)>h.r);if(out.length){h.tick=.4;for(const pl of out)events.push(...receiveHit(s,c,pl,{...h,attackDamage:dmgOf(h,pl,s,10),unparryable:true},props));}}/* multiplayer */}
 }
 tickEliteFx(r,c,dt);
 return events;
}
export function drawEliteHazards(ctx,r,time,drawFX){drawEliteHazardsFx(ctx,r,time);}
