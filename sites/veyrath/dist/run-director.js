// Oct 16 run director (docs/ROADMAP.md): the 30-minute timeline, day/night/Blood Moon and the
// main-boss schedule. Values are playtest seeds.
export const RUN_LENGTH=1800;
// Oct 19 (user): the Reckoning starts at 29:00 and its end boss is the Obsidian Colossus (was the Crimson Tyrant at 30:00,
// who is now the realm boss: realm.js). The 22:30 timed Colossus arrival is removed.
export const FINAL_AT=1740;
export const PHASES=[
 {id:'day',name:'Day',at:0,pressure:1,speed:1,light:null},
 {id:'night',name:'Night',at:720,pressure:1.2,speed:1,light:[60,40,150,.55],notice:'Night falls · the horde grows bolder'},
 {id:'bloodmoon',name:'Blood Moon',at:1200,pressure:1.5,speed:1.15,light:[220,40,110,.5],notice:'BLOOD MOON · demons swarm faster'},
 {id:'dusk',name:'Dusk',at:1440,pressure:1.1,speed:1.05,light:[120,70,150,.45],notice:'The Blood Moon wanes · dusk before the end'},
 {id:'final',name:'The Reckoning',at:FINAL_AT,pressure:0,speed:1,light:[180,40,60,.5],notice:null}
];
// Oct 16 (user): the Ashen Butcher and Hollow Prophet now live only in their corner pits (no timed 7:30 / 15:00 arrival). Endless cycles the remaining timed bosses.
export const MAIN_BOSSES=[];
export const ENDLESS_BOSSES=[{kind:'colossus',name:'The Obsidian Colossus'}];
export function phaseAt(clock){let p=PHASES[0];for(const q of PHASES)if(clock>=q.at)p=q;return p;}
export function createDirector(){return {phase:'day',bossIndex:0,warned:new Set(),final:null,victory:false};}
// Light tint blends over 25s at each phase boundary.
export function lightAt(clock){
 const p=phaseAt(clock),i=PHASES.indexOf(p),prev=PHASES[i-1],t=Math.min(1,(clock-p.at)/25),a=prev?.light??[0,0,0,0],b=p.light??[0,0,0,0];
 return a.map((v,k)=>v+(b[k]-v)*(prev?t:1));
}
/* Oct 18 (user): night no longer lays a dark wash + vignette over the whole screen. worldTint() gives a multiply colour
   that game.js applies only to the environment (ground pass + tall props via a tinted-sprite cache); players, enemies,
   loot and spells stay untinted. Colour is quantised so the prop cache rebuilds only a few times per 25s blend. */
export function worldTint(clock){
 const [r,g,b,a]=lightAt(clock);if(a<=.005)return null;const q=v=>Math.min(255,Math.round((255-(255-v)*a)/4)*4);
 return `rgb(${q(r)},${q(g)},${q(b)})`;
}
export function drawWorldTint(ctx,width,height,tint,dpr=1){
 if(!tint)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=1;ctx.fillStyle=tint;ctx.fillRect(0,0,width,height);ctx.restore();
}
export function drawDayNight(ctx,width,height,clock,dpr=1){drawWorldTint(ctx,width,height,worldTint(clock),dpr);}
// spawnBoss(kind) returns the boss or null (retried next frame); finalClear() removes every ordinary enemy.
export function tickDirector(d,s,c,dt,{spawnBoss,finalClear}){
 const events=[];if(s.dead)return events;
 const p=phaseAt(s.clock);s.dayPressure=p.pressure||1;s.daySpeed=p.speed;s.dayPhase=p.id;
 if(p.id!==d.phase){d.phase=p.id;if(p.notice)events.push({type:'worldNotice',text:p.notice},{type:'phase',phase:p.id});}
 const next=MAIN_BOSSES[d.bossIndex];
 if(next){
  if(s.clock>=next.at-20&&!d.warned.has(next.kind)){d.warned.add(next.kind);events.push({type:'worldNotice',text:next.name+' stirs · 20 seconds'});}
  if(s.clock>=next.at&&!c.targets.some(e=>e.role==='boss'&&e.state==='alive'&&!e.pit)){const b=spawnBoss(next.kind);if(b){d.bossIndex++;events.push({type:'bossArrival',name:next.name});}}
 }
 if(s.clock>=FINAL_AT-30&&!d.warned.has('final')){d.warned.add('final');events.push({type:'worldNotice',text:'30 seconds until the Reckoning'});}
 if(s.clock>=FINAL_AT&&!d.final){d.final={stage:'clearing',t:0};s.finalPhase=true;finalClear();events.push({type:'worldNotice',text:'THE RECKONING · the horde falls silent…'},{type:'reckoning'});}
 if(d.final){d.final.t+=dt;
  if(d.final.stage==='clearing'&&d.final.t>=6){const b=spawnBoss('colossus',{final:true});if(b){d.final.stage='fight';d.final.bossId=b.id;events.push({type:'bossArrival',name:'The Obsidian Colossus',final:true});}}
  if(d.final.stage==='fight'&&!c.targets.some(e=>e.id===d.final.bossId&&e.state==='alive')){d.final.stage='won';d.victory=true;s.victory=true;const b=c.targets.find(e=>e.id===d.final.bossId);events.push({type:'victory',x:b?.x??0,y:b?.y??0,eligibleOwners:b?.encounterRoster,cheated:!!s.cheated});}
 }
 // Main-menu batch (Oct 16, user): Endless keeps going after the Tyrant and keeps getting harder until death.
 // Ramp values are proposals: +12% enemy HP and incoming damage per minute, more spawns, a returning main boss every 150s.
 if(s.endless&&d.final?.stage==='won'){
  if(!d.endless){d.endless={since:s.clock,next:s.clock+90,i:0};s.finalPhase=false;}
  const mins=(s.clock-d.endless.since)/60;s.endlessRamp=1+.12*mins;s.dayPressure=Math.min(3,1.4+.1*mins);s.daySpeed=Math.min(1.35,1.05+.02*mins);
  if(s.clock>=d.endless.next&&!c.targets.some(e=>e.role==='boss'&&e.state==='alive'&&!e.pit)){const boss=ENDLESS_BOSSES[d.endless.i%ENDLESS_BOSSES.length],b=spawnBoss(boss.kind);if(b){b.hp=b.maxHp=Math.round(b.maxHp*s.endlessRamp);d.endless.i++;d.endless.next=s.clock+150;events.push({type:'bossArrival',name:boss.name});}}
 }
 return events;
}
