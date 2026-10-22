// VEYRATH VFX recipes (Oct 15). Data-driven effects for vfx-engine.js, tuned live in vfx-lab.html.
// emitFx is stateless: every layer instance is computed from the effect's age and seed, so effects pause
// with the simulation, scrub cleanly in the lab, and need no per-effect particle state.
// Units: sizes/distances/offsets are in R (the caller's effect radius, world px); speeds R/s; gravity R/s².
// Layer fields: mat, layer 'ground'|'upper', count, delay [min,max] s, life [min,max] s, loop (continuous
// stream), static (always drawn, t=0), place 'center'|'ring'|'burst'|'trail', size or w/h curves
// (number | [from,to] | [a,b,c]), ease 'out'|'lin'|'in', dist curve (ring/trail), off [x,y], back (along
// -angle), anchor 'base' (bottom of quad on the point), speed/up/g (burst), rise, orient (caller angle),
// rotOff, rotJit, spin, orientVel, grow (life fraction to reach full size), tFrom (life fraction where
// dissolve/shatter starts), vel [x,y] R/s, place 'disc' (random in disc of radius dist) and 'road' (surface:
// quad along o.len; otherwise count spread along o.max, born as o.speed reaches them, alternating sides), fade [in,outStart], opacity, add, colors [c0,c1,c2], params [4], jitter,
// dissolve:false (keep t=0). Ground layers squash height by .65 unless squash is set.
import {vfx} from './vfx-engine.js?v=fx-260';
const TAU=Math.PI*2,KEY='veyrath.vfx.recipes';
const ICE=['#1d4f7a','#7fcde8','#f2fdff'],FROST=['#24597f','#86c6de','#e6f8ff'],MIST=['#6f9fbd','#e3f6ff','#bfefff'],COLD=['#1a5a8a','#5fb8dc','#cfefff'],SNOW=['#8fc8e0','#d8f0fa','#eefaff'],SPIKE=[1.1,-.1,4,.5];
const BOLT=['#3a1a8a','#a88cff','#ffffff'],HALO=['#1a0c40','#5a2fe0','#9d7bff'],SDECAL=['#140c22','#6a3cff','#c9b4ff'],SPARKV=['#6a3cff','#c9b4ff','#ffffff'],CLOUD=['#17122a','#3a2c5a','#9d7bff'],DUST=['#5a4a34','#a08a62','#d8c49a'],FUNNEL=['#1a1230','#5a4a8a','#c9b4ff'];
const BLOOD=['#22030a','#7a0c26','#ff9aac'],BSPIKE=['#3a0612','#a8173a','#ffb0c0'],POOL=['#1a0206','#5a0a1c','#ff8a9a'],WET=[.5,24,2,0];
const FIRE=['#5a1206','#ff6a1a','#fff2b0'],SMOKE=['#1e1410','#5a4636','#ff7a2a'],CHAR=['#1a0d07','#ff5a14','#ffd27a'],FLASH=['#ff8a2a','#ffd27a','#ffffff'];

export const RECIPES={
 'pyro.fireball':{R:16,duration:2,loop:true,projectile:true,note:'Pyro RMB projectile (pass angle).',layers:[
  {name:'smokeTrail',mat:'smoke',place:'trail',loop:true,count:7,life:[.55,.55],dist:[.6,4.6],ease:'lin',size:[.7,1.7],fade:[.1,.45],rise:.6,spread:.6,opacity:.6,colors:SMOKE,params:[0,.6,3,.7]},
  {name:'tail',mat:'tail',orient:true,back:2,w:5,h:1.8,loop:true,life:[.4,.4],colors:FIRE,add:.3,params:[4,.7,4,.8],dissolve:false},
  {name:'licks',mat:'flame',orient:true,rotOff:-1.5708,rotJit:.5,back:.6,anchor:'base',loop:true,count:3,life:[.25,.32],w:[1.1,.8],h:[2.4,1.4],fade:[.2,.6],colors:FIRE,add:.2,params:[3,.8,4,.04]},
  {name:'embers',mat:'spark',place:'trail',loop:true,count:6,life:[.35,.45],dist:[.5,4.2],ease:'lin',w:[.9,.4],h:[.22,.12],orient:true,spread:1.2,fade:[0,.5],colors:FIRE,add:1},
  {name:'halo',mat:'glow',size:3.4,loop:true,life:[1,1],colors:['#ff3a0a','#ff8a2a','#ffd27a'],add:1,opacity:.55,params:[2.2,0,0,0],dissolve:false},
  {name:'core',mat:'orb',size:2.4,loop:true,life:[1,1],colors:FIRE,params:[.5,0,4,2.5],dissolve:false}]},
 'pyro.explosion':{R:60,duration:1.6,note:'Fireball blast / Flame Surge (R = blast radius).',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:2.1,life:[1.6,1.6],fade:[.02,.55],opacity:.85,colors:CHAR,params:[6,1,.8,.8]},
  {name:'groundRing',mat:'ring',layer:'ground',size:[.6,2.6],life:[.45,.45],colors:FIRE,add:.6,params:[.8,.12,3,.8]},
  {name:'flash',mat:'glow',off:[0,-.3],size:[1.6,2.6],life:[.16,.16],fade:[0,.2],colors:FLASH,add:1,params:[1.6,0,0,0]},
  {name:'cloud',mat:'burst',off:[0,-.45],size:2,life:[.85,.85],colors:['#2a1610','#ff6a1a','#fff2b0'],add:.15,params:[.35,1.6,4,.9]},
  {name:'tongues',mat:'flame',place:'ring',anchor:'base',count:9,dist:[.35,.85],w:[.35,.2],h:[.95,.35],delay:[0,.08],life:[.3,.5],fade:[.15,.5],colors:FIRE,add:.25,params:[3,.8,4,.04]},
  {name:'smoke',mat:'smoke',place:'burst',count:6,speed:[.2,.6],up:[.6,1],delay:[.18,.32],life:[.8,1.2],size:[.6,1.3],fade:[.15,.4],rise:.3,opacity:.85,colors:SMOKE,params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:18,speed:[2.5,5.5],up:[1.5,3],g:9,life:[.3,.65],w:[.45,.15],h:[.09,.05],fade:[0,.5],colors:FIRE,add:1}]},
 'pyro.nova':{R:220,duration:1.2,note:'Pyro Q nova (R = spell radius).',layers:[
  {name:'heat',mat:'decal',layer:'ground',size:[.6,2.1],life:[1.1,1.1],fade:[.02,.5],opacity:.6,colors:CHAR,params:[9,.6,0,.5]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.25],life:[.55,.55],colors:FIRE,add:.7,params:[.88,.1,3,1]},
  {name:'ring2',mat:'ring',layer:'ground',delay:[.07,.07],size:[.25,2],life:[.5,.5],opacity:.7,colors:['#3a0c04','#c8380c','#ff9a3a'],add:.4,params:[.88,.08,3,1]},
  {name:'flash',mat:'glow',off:[0,-.15],size:[.5,.9],life:[.18,.18],fade:[0,.2],colors:FLASH,add:1,params:[1.6,0,0,0]},
  {name:'flameWall',mat:'flame',place:'ring',anchor:'base',count:28,dist:[.12,1],w:[.13,.08],h:[.36,.12],delay:[0,.04],life:[.45,.6],fade:[.1,.55],colors:FIRE,add:.25,params:[3,.8,4,.04]},
  {name:'smoke',mat:'smoke',place:'ring',count:10,dist:[.6,1.05],delay:[.25,.35],life:[.7,1],size:[.25,.45],rise:.15,fade:[.15,.4],opacity:.7,colors:SMOKE,params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:22,speed:[.9,1.6],up:[.2,.5],g:1.5,life:[.3,.55],w:[.12,.04],h:[.025,.015],fade:[0,.5],colors:FIRE,add:1}]},
 'pyro.meteor':{R:22,duration:2,loop:true,projectile:true,note:'Pyro R falling meteor (pass angle of travel).',layers:[
  {name:'smokeTrail',mat:'smoke',place:'trail',loop:true,count:10,life:[.6,.6],dist:[1,8],ease:'lin',size:[1,2.6],fade:[.1,.45],rise:.4,spread:.8,opacity:.7,colors:SMOKE,params:[0,.7,3,.7]},
  {name:'tail',mat:'tail',orient:true,back:3.1,w:7.5,h:2.4,loop:true,life:[.4,.4],colors:FIRE,add:.3,params:[5,.8,4,.7],dissolve:false},
  {name:'licks',mat:'flame',orient:true,rotOff:-1.5708,rotJit:.6,back:.7,anchor:'base',loop:true,count:4,life:[.22,.3],w:[1.2,.8],h:[2.8,1.6],fade:[.2,.6],colors:FIRE,add:.2,params:[3.5,.8,4,.04]},
  {name:'embers',mat:'spark',place:'trail',loop:true,count:8,life:[.35,.5],dist:[.6,6],ease:'lin',w:[1,.4],h:[.2,.1],orient:true,spread:1.6,fade:[0,.5],colors:FIRE,add:1},
  {name:'halo',mat:'glow',size:4.6,loop:true,life:[1,1],colors:['#ff3a0a','#ff8a2a','#ffd27a'],add:1,opacity:.6,params:[2,0,0,0],dissolve:false},
  {name:'rock',mat:'orb',size:2.2,loop:true,life:[1,1],colors:['#4a2a1c','#ff7a1a','#ffe08a'],params:[.55,1,3,.6],dissolve:false}]},
 'pyro.meteorImpact':{R:150,duration:2.2,note:'Pyro R impact (R = impact radius).',layers:[
  {name:'crater',mat:'decal',layer:'ground',size:2.3,life:[2,2],fade:[.01,.7],opacity:.9,colors:CHAR,params:[7,1,1,.95]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.8],life:[.6,.6],colors:FIRE,add:.7,params:[.85,.09,3,1]},
  {name:'ring2',mat:'ring',layer:'ground',delay:[.1,.1],size:[.2,2.3],life:[.7,.7],opacity:.6,colors:['#3a0c04','#c8380c','#ff9a3a'],add:.4,params:[.85,.08,3,1]},
  {name:'flash',mat:'glow',off:[0,-.3],size:[1.2,2.4],life:[.2,.2],fade:[0,.2],colors:FLASH,add:1,params:[1.6,0,0,0]},
  {name:'column',mat:'flame',anchor:'base',w:[.55,.3],h:[2.2,1],life:[.7,.7],fade:[.05,.5],colors:FIRE,add:.3,params:[4,.5,4,.05]},
  {name:'cloud',mat:'burst',off:[0,-.6],size:1.9,life:[1.2,1.2],colors:['#2a1610','#ff6a1a','#fff2b0'],add:.15,params:[.3,1.4,4,1]},
  {name:'cap',mat:'burst',off:[0,-1.5],delay:[.1,.1],size:1.3,life:[1.1,1.1],colors:['#2a1610','#ff6a1a','#fff2b0'],add:.1,params:[.25,1.8,4,1]},
  {name:'tongues',mat:'flame',place:'ring',anchor:'base',count:16,dist:[.3,.95],w:[.18,.1],h:[.55,.2],delay:[0,.1],life:[.35,.6],fade:[.15,.5],colors:FIRE,add:.25,params:[3,.8,4,.04]},
  {name:'smoke',mat:'smoke',place:'burst',count:12,speed:[.15,.45],up:[.4,.8],delay:[.25,.5],life:[1.1,1.6],size:[.5,1.1],fade:[.15,.4],rise:.25,opacity:.85,colors:SMOKE,params:[0,.5,3,.8]},
  {name:'debris',mat:'spark',place:'burst',orientVel:true,count:30,speed:[1.2,2.6],up:[1.2,2.2],g:4,life:[.5,1],w:[.18,.06],h:[.04,.02],fade:[0,.5],colors:FIRE,add:1}]},
 'pyro.scorch':{R:120,duration:5,loop:true,note:'Lingering scorched ground (pass alpha for the fade-out).',layers:[
  {name:'burn',mat:'decal',layer:'ground',static:true,size:2.1,colors:CHAR,opacity:.85,params:[6,1,.7,.85]}]},
 'cryo.iceRoad':{R:59,duration:3,loop:true,note:'Cryo RMB Ice Road (R = half width; pass angle, len, max, speed, alpha).',layers:[
  {name:'surface',mat:'frost',layer:'ground',place:'road',surface:true,static:true,squash:false,w:.3,h:2.1,opacity:.95,colors:FROST,params:[5,.8,.55,.36]},
  {name:'edgeCrystals',mat:'crystal',place:'road',count:18,spread:.85,lean:.35,life:[.12,.12],grow:1,anchor:'base',w:.26,h:.5,jitter:.4,colors:ICE,params:SPIKE,dissolve:false},
  {name:'smallCrystals',mat:'crystal',place:'road',count:30,spread:.5,lean:.5,life:[.1,.1],grow:1,anchor:'base',w:.13,h:.26,jitter:.4,colors:ICE,params:SPIKE,dissolve:false}]},
 'cryo.roadHead':{R:40,duration:1,loop:true,projectile:true,note:'Racing head of the Ice Road (pass angle).',layers:[
  {name:'mist',mat:'smoke',place:'trail',loop:true,count:6,life:[.4,.4],dist:[0,1.5],ease:'lin',size:[.6,1.3],fade:[.1,.4],rise:.5,spread:.8,opacity:.7,colors:MIST,params:[0,0,3,.8]},
  {name:'glow',mat:'glow',size:2.2,loop:true,life:[1,1],colors:COLD,add:.6,opacity:.4,params:[2,0,0,0],dissolve:false},
  {name:'spray',mat:'spark',place:'burst',loop:true,orientVel:true,count:10,life:[.25,.35],speed:[2,4],up:[1,2],g:6,w:.4,h:.08,fade:[0,.5],colors:SNOW,add:1}]},
 'cryo.nova':{R:225,duration:1.6,note:'Cryo Q Frost Nova (R = spell radius); spikes shatter at ~.8s.',layers:[
  {name:'frost',mat:'frost',layer:'ground',size:[.5,2.1],life:[1.6,1.6],fade:[0,.6],colors:FROST,params:[6,.8,.6,.26]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.2],life:[.5,.5],colors:COLD,add:.3,opacity:.75,params:[.88,.08,3,1]},
  {name:'flash',mat:'glow',off:[0,-.12],size:[.4,.8],life:[.2,.2],fade:[0,.2],opacity:.4,colors:COLD,add:.6,params:[2.2,0,0,0]},
  {name:'mist',mat:'smoke',place:'ring',count:12,dist:[.7,1],delay:[.1,.3],life:[.9,1.3],size:[.2,.35],rise:.08,fade:[.15,.4],opacity:.55,colors:MIST,params:[0,0,3,.8]},
  {name:'innerSpikes',mat:'crystal',place:'ring',anchor:'base',count:10,dist:.45,w:.06,h:.12,jitter:.35,rotJit:.35,delay:[.05,.12],life:[.75,.8],grow:.12,tFrom:.75,colors:ICE,params:SPIKE},
  {name:'spikes',mat:'crystal',place:'ring',anchor:'base',count:22,dist:.85,w:.07,h:.16,jitter:.35,rotJit:.35,delay:[.12,.22],life:[.6,.66],grow:.15,tFrom:.75,colors:ICE,params:SPIKE},
  {name:'shards',mat:'crystal',place:'ring',count:26,dist:[.85,1.15],delay:[.8,.85],life:[.4,.5],w:.03,h:.05,spin:8,rise:.25,fade:[0,.4],colors:ICE,params:SPIKE,dissolve:false},
  {name:'glints',mat:'spark',place:'burst',orientVel:true,count:20,delay:[.8,.85],speed:[.5,1],up:[.3,.6],g:2,life:[.35,.6],w:.06,h:.015,fade:[0,.5],colors:SNOW,add:.5,opacity:.8}]},
 'cryo.glacial':{R:140,duration:1.35,note:'Cryo E Glacial Burst (R = radius); crystals shatter at ~.62s.',layers:[
  {name:'frost',mat:'frost',layer:'ground',size:[.5,2.1],life:[1.35,1.35],fade:[0,.6],colors:FROST,params:[5,.8,.6,.28]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.3],life:[.42,.42],colors:COLD,add:.3,opacity:.75,params:[.88,.09,3,1]},
  {name:'flash',mat:'glow',off:[0,-.2],size:[.6,1.2],life:[.16,.16],fade:[0,.2],opacity:.4,colors:COLD,add:.6,params:[2.2,0,0,0]},
  {name:'ringSpikes',mat:'crystal',place:'ring',anchor:'base',count:14,dist:.7,w:.12,h:.32,jitter:.4,rotJit:.35,delay:[.04,.12],life:[.5,.56],grow:.15,tFrom:.78,colors:ICE,params:SPIKE},
  {name:'core',mat:'crystal',place:'disc',dist:.18,anchor:'base',count:5,w:.22,h:.75,jitter:.35,rotJit:.5,delay:[0,.05],life:[.6,.62],grow:.12,tFrom:.8,colors:ICE,params:SPIKE},
  {name:'mist',mat:'smoke',place:'burst',count:8,speed:[.2,.5],up:[.2,.4],delay:[.55,.65],life:[.7,1],size:[.4,.7],fade:[.15,.4],opacity:.6,colors:MIST,params:[0,0,3,.8]},
  {name:'shards',mat:'crystal',place:'burst',count:24,delay:[.6,.62],speed:[1.2,2.4],up:[.8,1.5],g:5,life:[.4,.7],w:.06,h:.1,spin:10,fade:[0,.5],colors:ICE,params:SPIKE,dissolve:false},
  {name:'glints',mat:'spark',place:'burst',orientVel:true,count:16,delay:[.6,.62],speed:[1.5,3],up:[.5,1],g:4,life:[.3,.5],w:.12,h:.025,fade:[0,.5],colors:SNOW,add:.5,opacity:.8}]},
 'cryo.blizzard':{R:240,duration:6,loop:true,note:'Cryo R Blizzard zone (pass alpha for fade in/out).',layers:[
  {name:'frost',mat:'frost',layer:'ground',static:true,size:2.15,colors:FROST,params:[5,.8,.55,.3]},
  {name:'vortex',mat:'swirl',layer:'ground',static:true,size:2.1,opacity:.75,colors:['#1d4f7a','#7fb8d4','#d8f0fa'],params:[3.5,2.2,.22,4]},
  {name:'vortexInner',mat:'swirl',layer:'ground',static:true,size:1.4,opacity:.4,colors:['#1d4f7a','#8cc4dc','#cfeaf5'],params:[4.5,3.2,.35,3]},
  {name:'edgeSpikes',mat:'crystal',place:'ring',anchor:'base',count:28,dist:.97,w:.06,h:.13,jitter:.4,rotJit:.3,delay:[0,.3],life:[99,99],grow:.004,colors:ICE,params:SPIKE,dissolve:false},
  {name:'mist',mat:'smoke',place:'disc',loop:true,count:10,dist:.85,life:[1.2,1.6],size:[.25,.4],vel:[.1,0],rise:.05,fade:[.2,.6],opacity:.45,colors:MIST,params:[0,0,3,.8]},
  {name:'snow',mat:'spark',place:'disc',loop:true,count:60,dist:1,life:[.45,.6],off:[.3,-.6],vel:[-.6,1.2],rotOff:2.034,w:.09,h:.012,fade:[.1,.8],opacity:.7,colors:SNOW,add:.4}]},
 'cryo.blizzardPulse':{R:240,duration:.5,note:'Blizzard damage pulse (every .7s).',layers:[
  {name:'ring',mat:'ring',layer:'ground',size:[.4,2.1],life:[.45,.45],opacity:.7,colors:COLD,add:.5,params:[.88,.06,3,1]}]},
 'cryo.frozen':{R:18,duration:1,loop:true,note:'Frozen enemy: crystals around the feet (scale = enemy scale).',layers:[
  {name:'frost',mat:'frost',layer:'ground',static:true,size:2.6,opacity:.8,colors:FROST,params:[4,.8,.55,.32]},
  {name:'crystals',mat:'crystal',place:'ring',static:true,anchor:'base',count:4,dist:.8,w:.55,h:1.3,jitter:.3,rotJit:.4,colors:ICE,params:SPIKE}]},
 'storm.arc':{R:20,duration:.5,note:'One lightning arc (pass x,y -> x2,y2). Chain Lightning segments, sky strikes.',layers:[
  {name:'bolt',mat:'bolt',place:'segment',span:true,w:.1,h:2.4,life:[.45,.45],fade:[0,.35],colors:BOLT,add:.9,params:[5,28,.7,.1]},
  {name:'restrike',mat:'bolt',place:'segment',span:true,w:.1,h:2.8,delay:[.05,.05],life:[.12,.12],opacity:.6,colors:BOLT,add:.9,params:[5.5,40,.4,.08]},
  {name:'startGlow',mat:'glow',place:'segment',dist:0,size:1.6,life:[.4,.4],fade:[0,.2],colors:HALO,add:.8,opacity:.6,params:[2,0,0,0]},
  {name:'endGlow',mat:'glow',place:'segment',dist:1,size:2.2,life:[.4,.4],fade:[0,.2],colors:HALO,add:.8,opacity:.7,params:[2,0,0,0]}]},
 'storm.impact':{R:22,duration:.6,note:'Lightning hit on an enemy/ground point.',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:1.7,life:[.6,.6],fade:[0,.5],colors:SDECAL,params:[7,.8,.3,.5]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.6],life:[.3,.3],colors:HALO,add:.6,params:[.85,.1,3,.8]},
  {name:'flash',mat:'glow',off:[0,-1.6],size:[1.4,2.6],life:[.22,.22],fade:[0,.2],colors:SPARKV,add:.8,opacity:.7,params:[2,0,0,0]},
  {name:'arcs',mat:'bolt',place:'ring',radial:true,off:[0,-1.6],count:4,dist:[.8,1.6],h:.7,life:[.12,.18],colors:BOLT,add:.9,params:[4,30,0,.12]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,off:[0,-1.6],count:10,speed:[3,6],up:[1,2.5],g:10,life:[.15,.3],w:.5,h:.08,fade:[0,.5],colors:SPARKV,add:1}]},
 'storm.zap':{R:50,duration:.45,note:'Storm zap burst (Vortex placement, Blink, small hits).',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:1.6,life:[.45,.45],fade:[0,.5],colors:SDECAL,params:[7,.8,.3,.45]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.2],life:[.35,.35],colors:HALO,add:.5,params:[.85,.1,3,.8]},
  {name:'flash',mat:'glow',off:[0,-.5],size:[.8,1.4],life:[.2,.2],fade:[0,.2],colors:SPARKV,add:.8,opacity:.7,params:[2,0,0,0]},
  {name:'spokes',mat:'bolt',place:'ring',radial:true,off:[0,-.3],count:6,dist:[.5,.95],h:.3,life:[.18,.25],colors:BOLT,add:.9,params:[4,30,.3,.12]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,off:[0,-.4],count:12,speed:[2,4],up:[.5,1.5],g:6,life:[.15,.3],w:.25,h:.04,fade:[0,.5],colors:SPARKV,add:1}]},
 'storm.nova':{R:180,duration:.7,note:'Storm Q Static Guard burst (R = radius).',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:[.6,2.1],life:[.7,.7],fade:[0,.5],colors:SDECAL,params:[9,.6,.2,.35]},
  {name:'ring',mat:'ring',layer:'ground',size:[.2,2.15],life:[.45,.45],colors:HALO,add:.6,params:[.88,.08,3,1]},
  {name:'ring2',mat:'ring',layer:'ground',delay:[.06,.06],size:[.2,1.9],life:[.4,.4],opacity:.6,colors:HALO,add:.4,params:[.88,.06,3,1]},
  {name:'flash',mat:'glow',off:[0,-.15],size:[.4,.7],life:[.2,.2],fade:[0,.2],colors:SPARKV,add:.8,opacity:.6,params:[2,0,0,0]},
  {name:'spokes',mat:'bolt',place:'ring',radial:true,off:[0,-.05],count:10,dist:[.3,1],h:.14,life:[.3,.4],colors:BOLT,add:.9,params:[5,30,.5,.12]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:20,speed:[1,1.8],up:[.2,.5],g:1.5,life:[.25,.45],w:.1,h:.015,fade:[0,.5],colors:SPARKV,add:1}]},
 'storm.tempest':{R:180,duration:6,loop:true,note:'Storm R Tempest storm cloud (pass alpha). Strikes are storm.arc + storm.impact.',layers:[
  {name:'shadow',mat:'decal',layer:'ground',static:true,size:2.2,opacity:.8,colors:['#0c0816','#3a2c5a','#9d7bff'],params:[5,0,0,.3]},
  {name:'clouds',mat:'smoke',place:'disc',loop:true,count:14,dist:.75,off:[0,-1.17],size:[.45,.6],life:[2,3],fade:[.2,.7],opacity:.9,colors:CLOUD,params:[0,.5,3,.8]},
  {name:'cloudFlash',mat:'glow',place:'disc',loop:true,count:3,dist:.6,off:[0,-1.17],size:.7,life:[.12,.5],fade:[0,.25],opacity:.55,colors:HALO,add:.8,params:[2,0,0,0]},
  {name:'cloudArcs',mat:'bolt',place:'disc',loop:true,count:2,dist:.6,off:[0,-1.17],w:.6,h:.2,rotJit:1.6,life:[.1,.6],fade:[0,.3],opacity:.8,colors:BOLT,add:.9,params:[4,30,.4,.12]}]},
 'storm.vortex':{R:150,duration:5,loop:true,note:'Storm E Vortex tornado (pass alpha).',layers:[
  {name:'groundSwirl',mat:'swirl',layer:'ground',static:true,size:2.1,opacity:.7,colors:['#140c26','#4a3a7a','#b9a0ff'],params:[4,3,.1,4]},
  {name:'dust',mat:'smoke',layer:'ground',place:'ring',loop:true,count:12,dist:[1,.35],life:[1,1.4],size:[.12,.25],rise:.2,fade:[.2,.6],opacity:.6,colors:DUST,params:[0,0,3,.8]},
  {name:'funnel1',mat:'swirl',static:true,off:[0,-.25],w:1,h:.3,opacity:.6,colors:FUNNEL,params:[5,4,.25,3]},
  {name:'funnel2',mat:'swirl',static:true,off:[0,-.7],w:1.35,h:.36,opacity:.55,colors:FUNNEL,params:[5,4.5,.25,3]},
  {name:'funnel3',mat:'swirl',static:true,off:[0,-1.2],w:1.75,h:.42,opacity:.5,colors:FUNNEL,params:[5,5,.25,3]},
  {name:'funnel4',mat:'swirl',static:true,off:[0,-1.75],w:2.2,h:.5,opacity:.45,colors:FUNNEL,params:[5,5.5,.25,3]},
  {name:'arcs',mat:'bolt',place:'disc',loop:true,count:3,dist:.3,off:[0,-1],w:.9,h:.3,rotJit:1.6,life:[.1,.35],fade:[0,.3],colors:BOLT,add:.9,params:[4,30,.3,.12]},
  {name:'debris',mat:'spark',place:'ring',loop:true,count:16,dist:[.9,.3],rise:1.4,life:[.8,1.2],w:.1,h:.03,rotJit:3,opacity:.8,colors:DUST}]},
 'storm.rodBase':{R:60,duration:2,loop:true,note:'Storm E rod footing (pass alpha; R grows when overcharged): scorch, glow, ground crackle.',layers:[
  {name:'scorch',mat:'decal',layer:'ground',static:true,size:1.3,opacity:.75,colors:SDECAL,params:[6,.8,.4,.6]},
  {name:'glow',mat:'glow',layer:'ground',static:true,size:2.2,opacity:.4,colors:HALO,add:.7,params:[2,0,0,0]},
  {name:'ring',mat:'ring',layer:'ground',loop:true,count:1,size:[.4,2],life:[.8,.8],opacity:.45,colors:HALO,add:.5,params:[.88,.06,3,1]},
  {name:'crackle',mat:'bolt',place:'disc',loop:true,count:3,dist:.9,off:[0,-.05],w:.6,h:.14,rotJit:3,life:[.06,.25],colors:BOLT,add:.9,opacity:.75,params:[4,30,.4,.12]}]},
 // ---------- Warrior (Oct 16 revamp). Colours are palette keys resolved per specialization: main / core / spark / smoke / dark. ----------
 /* Oct 17: every mat:'slash' layer w/h ×1.29 to match the shader's arc moving from .8 to .62 of the quad (no edge clipping) */
 'war.slash':{R:110,duration:.3,note:'Warrior LMB neon crescent (pass p=[halfSpan*dir,thick,trail,centreAngle], t = sweep progress, R = reach).',layers:[
  /* Oct 17 (user: "more dense, they're hard to see"): dark underlay for contrast on bright sand, stronger glow, less additive body */
  {name:'shade',mat:'slash',static:true,dyn:true,tOverride:true,w:2.77,h:1.83,opacity:.6,colors:'dark',add:0,params:[1,.2,.85,0]},
  {name:'glow',mat:'slash',static:true,dyn:true,tOverride:true,w:2.97,h:1.94,opacity:.8,colors:'main',add:.6,params:[1,.16,.8,0]},
  {name:'body',mat:'slash',static:true,dyn:true,tOverride:true,w:2.58,h:1.68,opacity:1,colors:'core',add:.35,params:[1,.07,.7,0]}]},
 'war.swingSpark':{R:30,duration:.5,note:'Sparks thrown off a swing at one point along the arc.',layers:[
  {name:'flash',mat:'glow',size:[.9,.2],life:[.12,.12],colors:'core',add:1,opacity:.7,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:10,speed:[3,7],up:[1,3],g:14,life:[.18,.4],w:[.6,.18],h:.08,fade:[0,.4],colors:'spark',add:.7}]},
 'war.motes':{R:40,duration:1.1,note:'Lingering motes/embers after a swing or spell.',layers:[
  {name:'motes',mat:'glow',place:'disc',count:11,dist:1,delay:[0,.25],life:[.6,.9],size:[.15,.05],rise:.9,opacity:1,colors:'spark',add:.7,params:[2,0,0,0]},
  {name:'smoke',mat:'smoke',place:'disc',count:3,dist:.7,delay:[0,.15],life:[.7,1.1],size:[.35,.8],rise:.4,fade:[.15,.4],opacity:.35,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.hit':{R:26,duration:.45,note:'Warrior hit on an enemy (angle = slash direction). scale 1.6 for crits.',layers:[
  {name:'flash',mat:'glow',off:[0,-1.3],size:[2.6,.6],life:[.14,.14],colors:'core',add:1,opacity:.85,params:[1.6,0,0,0]},
  {name:'mark',mat:'beam',off:[0,-1.3],orient:true,rotOff:.6,w:[.4,2.6],h:.32,life:[.22,.22],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'ring',mat:'ring',layer:'ground',size:[.4,2],life:[.25,.25],colors:'main',add:.7,opacity:.7,params:[.85,.1,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,off:[0,-1.3],count:10,speed:[3,7],up:[1,3],g:12,life:[.15,.35],w:[.6,.15],h:.07,fade:[0,.5],colors:'spark',add:1}]},
 'war.scar':{R:60,duration:1.1,note:'Glowing ground scar line (greatsword / finisher). angle = direction; x,y = start.',layers:[
  {name:'scar',mat:'beam',layer:'ground',orient:true,back:-.5,w:1,h:.12,squash:false,life:[1.1,1.1],fade:[0,.45],colors:'main',add:.8,params:[.25,1.5,2,5]},
  {name:'dust',mat:'smoke',layer:'ground',place:'trail',dist:[-1,-.1],spread:.25,count:5,life:[.6,1],size:[.25,.6],rise:.3,fade:[.1,.5],opacity:.45,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.thrust':{R:30,duration:.3,note:'Line-strike neon thrust beam (x,y -> x2,y2); Longsword third-line talent.',layers:[
  {name:'shade',mat:'beam',place:'segment',span:true,w:.1,h:1.6,life:[.28,.28],fade:[0,.4],opacity:.55,colors:'dark',add:0,params:[.2,-4,3,5]},
  {name:'beam',mat:'beam',place:'segment',span:true,w:.1,h:1.1,life:[.28,.28],fade:[0,.4],colors:'core',add:.5,params:[.28,-4,3,5]},
  {name:'glow',mat:'beam',place:'segment',span:true,w:.1,h:2,life:[.28,.28],fade:[0,.35],opacity:.5,colors:'main',add:.8,params:[.12,-4,2,3]},
  {name:'tip',mat:'glow',at:'end',size:[.6,1.6],life:[.25,.25],colors:'core',add:1,params:[2,0,0,0]},
  {name:'rings',mat:'ring',place:'segment',dist:[.3,1],count:3,size:[.2,1.1],delay:[0,.1],life:[.2,.2],colors:'main',add:.8,opacity:.8,params:[.85,.12,3,.6]}]},
 'war.slam':{R:60,duration:1.2,note:'Warhammer / heavy impact: crater, shock rings, dust, sparks (R = impact radius).',layers:[
  {name:'crater',mat:'decal',layer:'ground',size:1.6,life:[1.2,1.2],fade:[.02,.6],opacity:.8,colors:'dark',params:[7,1,.6,.8]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.4],life:[.35,.35],colors:'main',add:.8,params:[.85,.1,3,1]},
  {name:'ring2',mat:'ring',layer:'ground',delay:[.07,.07],size:[.2,1.9],life:[.4,.4],opacity:.6,colors:'main',add:.5,params:[.88,.07,3,1]},
  {name:'flash',mat:'glow',off:[0,-.3],size:[1.6,.4],life:[.18,.18],colors:'core',add:1,params:[1.6,0,0,0]},
  {name:'dust',mat:'smoke',place:'burst',count:8,speed:[.4,1],up:[.2,.5],life:[.6,1],size:[.4,.9],fade:[.1,.4],rise:.15,opacity:.55,colors:'smoke',params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:16,speed:[1.5,3.2],up:[1,2.2],g:5,life:[.3,.6],w:[.3,.08],h:.04,fade:[0,.5],colors:'spark',add:1}]},
 'war.axe':{R:24,duration:1,loop:true,projectile:true,note:'Thrown axe glow + neon trail (angle = travel).',layers:[
  {name:'glow',mat:'glow',off:[0,-1.25],size:1.6,opacity:.6,static:true,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'trail',mat:'tail',off:[0,-1.25],orient:true,back:1.2,w:2.6,h:.5,static:true,opacity:.75,colors:'main',add:.9,params:[3,2,3,.5]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:6,dist:[0,2.4],spread:.5,off:[0,-1.25],life:[.15,.3],w:.4,h:.06,orient:true,colors:'spark',add:1}]},
 'war.trail':{R:30,duration:.35,note:'Dash/charge trail puff (one per trail point).',layers:[
  {name:'glow',mat:'glow',off:[0,-.9],size:[1.4,.6],life:[.3,.3],opacity:.55,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'smoke',mat:'smoke',size:[.7,1.4],life:[.35,.35],rise:.6,fade:[.1,.4],opacity:.45,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.burst':{R:120,duration:.8,note:'Generic spell blast (R = radius): rings, flash, smoke, sparks.',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:[.6,2],life:[.8,.8],fade:[0,.5],opacity:.7,colors:'dark',params:[8,.7,.3,.5]},
  {name:'ring',mat:'ring',layer:'ground',size:[.2,2.15],life:[.45,.45],colors:'main',add:.75,params:[.88,.08,3,1]},
  {name:'ring2',mat:'ring',layer:'ground',delay:[.08,.08],size:[.2,1.8],life:[.45,.45],opacity:.55,colors:'main',add:.5,params:[.88,.06,3,1]},
  {name:'flash',mat:'glow',off:[0,-.2],size:[.5,.9],life:[.2,.2],colors:'core',add:1,opacity:.75,params:[2,0,0,0]},
  {name:'smoke',mat:'smoke',place:'burst',count:10,speed:[.25,.6],up:[.1,.3],delay:[.05,.2],life:[.7,1.1],size:[.25,.55],fade:[.1,.4],rise:.15,opacity:.5,colors:'smoke',params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:24,speed:[.8,1.8],up:[.3,.9],g:2,life:[.3,.55],w:[.12,.04],h:.02,fade:[0,.5],colors:'spark',add:1}]},
 'war.cone':{R:200,duration:.6,note:'Frontal cone spell (Sundering Cleave, Guard blast, Wrath cleave): big slash + smoke (pass p like war.slash).',layers:[
  {name:'glow',mat:'slash',static:true,dyn:true,tOverride:true,w:2.84,h:1.84,opacity:.6,colors:'main',add:.85,params:[.8,.2,.9,0]},
  {name:'body',mat:'slash',static:true,dyn:true,tOverride:true,w:2.58,h:1.68,colors:'core',add:.7,params:[.8,.09,.8,0]},
  {name:'smoke',mat:'smoke',place:'disc',count:6,dist:.8,delay:[.05,.2],life:[.6,.9],size:[.12,.25],rise:.2,fade:[.1,.4],opacity:.45,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.aura':{R:60,duration:2,loop:true,note:'Buff aura around the warrior (pass alpha): ground glow, ring, rising embers, smoke wisps.',layers:[
  {name:'glow',mat:'glow',layer:'ground',static:true,size:2,opacity:.45,colors:'main',add:.7,params:[2,0,0,0]},
  {name:'ring',mat:'ring',layer:'ground',loop:true,count:2,size:[.5,1.6],life:[1,1],opacity:.5,colors:'main',add:.6,params:[.88,.05,3,1]},
  {name:'embers',mat:'glow',place:'disc',loop:true,count:10,dist:.8,life:[.6,1],size:[.08,.03],rise:1.6,opacity:.9,colors:'spark',add:1,params:[2,0,0,0]},
  {name:'wisps',mat:'smoke',place:'disc',loop:true,count:4,dist:.6,life:[1,1.4],size:[.3,.6],rise:.6,fade:[.2,.5],opacity:.3,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.dome':{R:170,duration:2,loop:true,note:'Bastion Dome / Void Barrier shell (pass alpha).',layers:[
  {name:'floor',mat:'glow',layer:'ground',static:true,size:2,opacity:.35,colors:'main',add:.6,params:[1.5,0,0,0]},
  {name:'edge',mat:'ring',layer:'ground',static:true,size:2,opacity:.75,colors:'main',add:.7,params:[.93,.05,3,1]},
  {name:'shell',mat:'ring',static:true,off:[0,-.35],w:2,h:1.7,opacity:.35,colors:'core',add:.8,params:[.93,.06,3,1]},
  {name:'pulse',mat:'ring',layer:'ground',loop:true,count:2,size:[.2,2],life:[1.2,1.2],opacity:.4,colors:'main',add:.5,params:[.9,.04,3,1]},
  {name:'motes',mat:'glow',place:'disc',loop:true,count:12,dist:.95,life:[.8,1.3],size:[.04,.015],rise:.8,colors:'spark',add:1,params:[2,0,0,0]}]},
 'war.orb':{R:16,duration:1,loop:true,note:'Dark Matter orb.',layers:[
  {name:'halo',mat:'glow',static:true,size:2.6,opacity:.6,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'orb',mat:'orb',static:true,size:1.1,colors:['#05010a','#2a0a4a','#d8b0ff'],params:[.6,0,3,.4]},
  {name:'motes',mat:'spark',place:'ring',loop:true,count:5,dist:1.4,life:[.2,.4],w:.6,h:.08,rotJit:3,colors:'spark',add:1}]},
 'war.wave':{R:46,duration:1,loop:true,projectile:true,note:'Spellblade Void Wave crescent in flight (pass p=[span,thick,trail,angle], t=1 hold).',layers:[
  {name:'glow',mat:'slash',static:true,dyn:true,tOverride:true,w:3.1,h:2.06,opacity:.6,colors:'main',add:.9,params:[.9,.2,1,0]},
  {name:'body',mat:'slash',static:true,dyn:true,tOverride:true,w:2.58,h:1.68,colors:'core',add:.8,params:[.9,.08,1,0]},
  {name:'smoke',mat:'smoke',place:'trail',loop:true,count:5,dist:[.4,2],spread:.8,life:[.3,.5],size:[.3,.6],fade:[.1,.4],opacity:.4,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.chain':{R:20,duration:.35,note:'Void chain / link segment (x,y -> x2,y2).',layers:[
  {name:'beam',mat:'beam',place:'segment',span:true,w:.1,h:1.4,life:[.3,.3],fade:[0,.35],colors:'core',add:1,params:[.25,6,3,5]},
  {name:'end',mat:'glow',at:'end',size:[1.2,2.4],life:[.3,.3],colors:'main',add:1,params:[2,0,0,0]}]},
 'war.cry':{R:300,duration:.9,note:'War Cry sound-wave rings (R = radius).',layers:[
  {name:'ring',mat:'ring',layer:'ground',count:3,delay:[0,.3],size:[.1,2],life:[.55,.55],colors:'main',add:.8,params:[.9,.05,3,1]},
  {name:'air',mat:'ring',count:3,delay:[0,.3],off:[0,-.18],w:[.1,1.4],h:[.06,.8],life:[.5,.5],opacity:.5,colors:'core',add:.8,params:[.9,.04,3,1]},
  {name:'flash',mat:'glow',off:[0,-.15],size:[.3,.5],life:[.25,.25],colors:'core',add:1,params:[2,0,0,0]}]},
 'war.quake':{R:200,duration:1,note:'Earthquake wave (R = radius): glowing crack spokes, ring, dust.',layers:[
  {name:'cracks',mat:'bolt',layer:'ground',place:'ring',radial:true,count:9,dist:[.3,1],h:.08,life:[.8,.8],fade:[0,.4],colors:'main',add:.9,params:[4,8,.2,.12]},
  {name:'ring',mat:'ring',layer:'ground',size:[.6,2.05],life:[.5,.5],colors:'main',add:.7,params:[.9,.07,3,1]},
  {name:'dust',mat:'smoke',place:'ring',count:12,dist:1,life:[.7,1.1],size:[.12,.25],rise:.15,fade:[.1,.4],opacity:.5,colors:'smoke',params:[0,.5,3,.8]}]},
 'war.spin':{R:150,duration:1,loop:true,note:'Bladestorm / Carnage spinning blade ring (pass p angle each frame).',layers:[
  {name:'a',mat:'slash',static:true,dyn:true,tOverride:true,w:2.58,h:1.68,opacity:.9,colors:'core',add:.8,params:[1.4,.07,.85,0]},
  {name:'aglow',mat:'slash',static:true,dyn:true,tOverride:true,w:2.84,h:1.84,opacity:.5,colors:'main',add:.9,params:[1.4,.18,.9,0]},
  {name:'floor',mat:'glow',layer:'ground',static:true,size:2,opacity:.35,colors:'main',add:.6,params:[1.6,0,0,0]},
  {name:'dust',mat:'smoke',place:'ring',loop:true,count:10,dist:[1,.6],life:[.5,.8],size:[.12,.24],rise:.2,fade:[.1,.5],opacity:.45,colors:'smoke',params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'ring',loop:true,count:10,dist:.85,life:[.12,.25],w:.25,h:.03,rotJit:3,colors:'spark',add:1}]},
 // ---------- Ashen Butcher (Oct 16). Palette keys like war.* (main/core/spark/smoke/dark). ----------
 'butcher.mark':{R:105,duration:1,loop:true,note:"Butcher's Mark brand following the player (pass alpha; pal turns red when it locks).",layers:[
  {name:'floor',mat:'glow',layer:'ground',static:true,size:2,opacity:.35,colors:'main',add:.6,params:[1.6,0,0,0]},
  {name:'edge',mat:'ring',layer:'ground',static:true,size:2,opacity:.85,colors:'main',add:.8,params:[.92,.05,3,1]},
  {name:'closing',mat:'ring',layer:'ground',loop:true,count:2,size:[2.2,.3],life:[.6,.6],opacity:.6,colors:'core',add:.7,params:[.9,.05,3,1]},
  {name:'brand',mat:'bolt',layer:'ground',place:'ring',radial:true,static:true,count:6,dist:[.1,.85],h:.07,opacity:.65,colors:'main',add:.8,params:[4,8,.2,.12]},
  {name:'embers',mat:'glow',place:'disc',loop:true,count:8,dist:.9,life:[.5,.8],size:[.06,.02],rise:1.2,colors:'spark',add:1,params:[2,0,0,0]}]},
 'blood.drain':{R:18,duration:2,loop:true,note:'Blood RMB Sanguine Drain: thick neon blood beam, blood flowing around it toward the caster, soft gradient falloff (pass x,y caster hand -> x2,y2 target).',layers:[
  {name:'haze',mat:'beam',place:'segment',span:true,static:true,w:.4,h:7,opacity:.7,colors:['#2a0008','#8a0a22','#ff3a5a'],add:.7,params:[.02,2.5,3,1.8]},
  {name:'bloodFlow',mat:'stream',place:'segment',span:true,static:true,w:.3,h:4.4,opacity:.95,colors:['#1a0206','#6a0a1e','#ff8a9a'],params:[-3,.9,4,.9]},
  {name:'bloodFlow2',mat:'stream',place:'segment',span:true,static:true,w:.3,h:3.4,opacity:.8,colors:['#2a040c','#8e1030','#ffb0c0'],params:[-4.5,1.3,3,.8]},
  {name:'neonGlow',mat:'beam',place:'segment',span:true,static:true,w:.2,h:3.6,opacity:.9,colors:['#5a0016','#ff2a50','#ff9aac'],add:1,params:[.14,4,5,3]},
  {name:'neonCore',mat:'beam',place:'segment',span:true,static:true,w:.2,h:1.5,colors:['#ff2a50','#ff6a86','#fff2f5'],add:1,params:[.42,5,7,5]},
  {name:'drops',mat:'liquid',place:'segment',loop:true,count:10,dist:[1,0],ease:'lin',life:[.45,.6],size:[.5,.3],spread:2.4,colors:['#22030a','#8e1030','#ffb0c0'],params:[.5,24,2,0]},
  {name:'motes',mat:'spark',place:'segment',loop:true,count:14,dist:[1,0],ease:'lin',life:[.35,.5],w:.6,h:.1,spread:3.2,orient:true,rotOff:3.1416,fade:[.1,.6],colors:['#ff2a50','#ff8a9a','#ffffff'],add:1},
  {name:'casterGlow',mat:'glow',size:3.2,static:true,opacity:.55,colors:['#3a0612','#ff2a50','#ffd0d8'],add:.8,params:[2,0,0,0]},
  {name:'targetGlow',mat:'glow',at:'end',size:4,static:true,opacity:.6,colors:['#3a0612','#d0284f','#ff9aac'],add:.7,params:[2,0,0,0]},
  {name:'targetSplash',mat:'liquid',place:'burst',at:'end',loop:true,count:8,life:[.3,.45],speed:[2,5],up:[2,4],g:18,size:[.4,.18],colors:BLOOD,params:WET}]},
 'blood.bloomWarn':{R:140,duration:.35,note:'Crimson Bloom warning: pool forming, ring closing (.35s).',layers:[
  {name:'pool',mat:'liquid',layer:'ground',size:[.3,1.9],life:[.35,.35],opacity:.9,colors:BLOOD,params:[.6,20,1.5,.3],dissolve:false},
  {name:'ring',mat:'ring',layer:'ground',size:[2.3,.4],life:[.35,.35],opacity:.8,colors:BSPIKE,params:[.85,.07,3,.6],dissolve:false}]},
 'blood.bloom':{R:140,duration:1,note:'Blood E Crimson Bloom: a blood pool surges open with ripples, a splash wave, rising bubbles, swirling blood motes and mist (no spikes).',layers:[
  {name:'pool',mat:'liquid',layer:'ground',size:[1.2,2.1],life:[1,1],fade:[0,.75],tFrom:.55,colors:POOL,params:[.55,26,1.8,.15]},
  {name:'surge',mat:'ring',layer:'ground',size:[.4,2.5],life:[.4,.4],opacity:.85,colors:['#2a040c','#a8173a','#ff6a80'],params:[.85,.12,3,.8]},
  {name:'ripples',mat:'ring',layer:'ground',count:3,delay:[.1,.45],size:[.2,1.8],ease:'lin',life:[.5,.6],fade:[.1,.5],opacity:.6,colors:['#2a040c','#a8173a','#ff6a80'],params:[.85,.05,3,.5]},
  {name:'glow',mat:'glow',off:[0,-.1],size:[1.2,2],life:[.5,.5],fade:[0,.3],opacity:.55,colors:['#3a0612','#d0284f','#ff9aac'],add:.6,params:[1.8,0,0,0]},
  {name:'splash',mat:'liquid',place:'burst',count:22,delay:[0,.04],speed:[.8,1.8],up:[1,2.2],g:6,life:[.35,.6],size:[.07,.04],colors:BLOOD,params:WET},
  {name:'bubbles',mat:'liquid',place:'disc',count:16,dist:.75,delay:[.08,.6],life:[.25,.4],size:[.03,.06],rise:.25,fade:[0,.7],colors:['#3a0612','#a8173a','#ffc0cc'],params:[.3,30,2,0]},
  {name:'swirl',mat:'spark',place:'ring',count:20,dist:[1.15,.35],delay:[0,.2],life:[.55,.75],w:.1,h:.02,rotJit:3,rise:.15,fade:[.1,.6],colors:['#ff2a50','#ff8a9a','#ffffff'],add:1},
  {name:'mist',mat:'smoke',place:'ring',count:10,dist:[.6,.9],delay:[.15,.3],life:[.6,.8],size:[.18,.32],rise:.2,fade:[.15,.4],opacity:.55,colors:['#2a040c','#6a0a1e','#d0284f'],params:[0,.4,3,.8]}]},
 'blood.nova':{R:90,duration:.65,note:'Blood cast burst (Crimson Veil / Eclipse cast).',layers:[
  {name:'splat',mat:'liquid',layer:'ground',size:[.4,1.2],life:[.65,.65],tFrom:.3,opacity:.8,colors:BLOOD,params:[.7,20,1.5,.2]},
  {name:'ring',mat:'ring',layer:'ground',size:[.3,2.2],life:[.5,.5],opacity:.85,colors:BSPIKE,params:[.85,.1,3,.8]},
  {name:'droplets',mat:'liquid',place:'burst',count:16,speed:[1.5,3],up:[1,2],g:8,life:[.35,.6],size:[.12,.06],colors:BLOOD,params:WET}]},
 'blood.hemo':{R:30,duration:.6,note:'Hemo burst on a drained/marked enemy.',layers:[
  {name:'splat',mat:'liquid',layer:'ground',size:[.5,1.4],life:[.6,.6],tFrom:.4,fade:[0,.6],colors:BLOOD,params:[.7,20,1.5,.2]},
  {name:'droplets',mat:'liquid',place:'burst',off:[0,-1],count:12,speed:[1.5,3],up:[1.5,2.5],g:10,life:[.3,.55],size:[.2,.1],colors:BLOOD,params:WET}]},
 'blood.eclipse':{R:220,duration:6,loop:true,note:'Blood R Eclipse: liquid pool, hovering eclipse, blood rain (pass alpha).',layers:[
  {name:'pool',mat:'liquid',layer:'ground',size:2.05,life:[99,99],grow:.005,colors:POOL,params:[.35,30,.6,.2],dissolve:false},
  {name:'ripples',mat:'ring',layer:'ground',loop:true,count:3,size:[.1,1.9],ease:'lin',life:[1.8,1.8],fade:[.1,.5],opacity:.6,colors:['#2a040c','#a8173a','#ff6a80'],params:[.85,.04,3,.5],dissolve:false},
  {name:'rainSplash',mat:'ring',layer:'ground',place:'disc',loop:true,count:8,dist:.85,size:[.03,.12],life:[.35,.45],opacity:.8,colors:['#2a040c','#a8173a','#ff6a80'],params:[.8,.12,3,.5]},
  {name:'cone',mat:'glow',static:true,off:[0,-.45],w:1.1,h:1.7,opacity:.3,colors:['#3a0612','#7a0c26','#d0284f'],add:.3,params:[1.2,0,0,0]},
  {name:'halo',mat:'glow',static:true,off:[0,-.86],size:.9,opacity:.6,colors:['#3a0612','#a8173a','#ff6a80'],add:.5,params:[2,0,0,0]},
  {name:'corona',mat:'ring',static:true,off:[0,-.86],size:.5,colors:['#3a0612','#d0284f','#ff8a9a'],add:.5,params:[.62,.18,3,1]},
  {name:'eclipse',mat:'orb',static:true,off:[0,-.86],size:.48,colors:['#050102','#1a0206','#ff6a80'],params:[.62,0,3,.4]},
  {name:'rain',mat:'spark',place:'disc',loop:true,count:30,dist:.9,off:[0,-.75],vel:[0,1.6],rotOff:1.5708,life:[.4,.5],w:.06,h:.012,opacity:.85,colors:BLOOD}]},
 'blood.trail':{R:14,duration:5,loop:true,note:'One blood trail point (soaked enemy), pass alpha.',layers:[
  {name:'smear',mat:'liquid',layer:'ground',static:true,size:2,jitter:.3,opacity:.9,colors:['#1a0206','#5a0a1c','#d06070'],params:[.6,18,.4,.3]},
  {name:'splat',mat:'liquid',layer:'ground',place:'disc',static:true,dist:1.4,size:.45,opacity:.85,colors:['#1a0206','#5a0a1c','#d06070'],params:[.6,18,.4,.3]}]},
 // Oct 17 Ranger weapon VFX (user overhaul; v2 same day: user said it was barely visible -> bigger halos, brighter
 // cores, more sparks, lingering embers and smoke). Colours come from the caller's pal (subclass palette, Archer
 // arrow type as spark/core accent). Projectile recipes loop around the projectile (already at body height); the
 // 'light' layer drops a coloured pool on the ground ~24px below. ranger-vfx.js scales them up further.
 'rgr.arrow':{R:14,duration:1,loop:true,projectile:true,note:'Ranger bow arrow: hot head, wide halo, coloured tail, trailing sparks and motes.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.7],size:3.2,static:true,opacity:.45,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3,static:true,opacity:.5,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:2,w:4.4,h:.5,static:true,opacity:1,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'core',mat:'tail',orient:true,back:1,w:2.2,h:.16,static:true,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.5,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:6,dist:[0,3.6],spread:.6,life:[.15,.3],w:.55,h:.08,orient:true,colors:'spark',add:1},
  {name:'motes',mat:'glow',place:'trail',loop:true,count:4,dist:[.5,4.5],spread:.7,life:[.25,.4],size:[.3,.06],colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.longArrow':{R:16,duration:1,loop:true,projectile:true,note:'Long Bow arrow: long double tail, wide halo and a wake of motes.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.5],size:3.6,static:true,opacity:.5,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3.2,static:true,opacity:.55,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:3,w:6.4,h:.55,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'core',mat:'tail',orient:true,back:1.5,w:3,h:.18,static:true,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.7,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:6,dist:[0,5],spread:.5,life:[.15,.3],w:.6,h:.08,orient:true,colors:'spark',add:1},
  {name:'motes',mat:'glow',place:'trail',loop:true,count:7,dist:[.5,6.5],spread:.6,life:[.3,.5],size:[.32,.06],colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.bolt':{R:18,duration:1,loop:true,projectile:true,note:'Crossbow bolt: heavy thick tail, pulsing pierce rings, shed sparks.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.35],size:3.6,static:true,opacity:.5,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3,static:true,opacity:.55,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:2.2,w:5.2,h:.8,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'core',mat:'tail',orient:true,back:1.1,w:2.6,h:.26,static:true,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:2,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'ring',mat:'ring',loop:true,count:2,life:[.24,.24],size:[.5,2.2],opacity:.85,colors:'core',add:1,params:[.85,.1,3,.8]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:10,dist:[0,4],spread:.9,life:[.18,.35],w:.7,h:.09,orient:true,colors:'spark',add:1}]},
 'rgr.star':{R:12,duration:1,loop:true,projectile:true,note:'Shuriken: big spinning glint blades round a hot core, swirling sparks and motes.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,2],size:3.4,static:true,opacity:.45,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3.4,static:true,opacity:.6,colors:'main',add:1,params:[2,0,0,0]},
  {name:'blades',mat:'spark',place:'ring',loop:true,count:4,dist:.8,life:[.16,.16],w:1.8,h:.24,spin:24,colors:'core',add:1},
  {name:'blades2',mat:'spark',place:'ring',loop:true,count:4,dist:1.1,life:[.16,.16],w:1.2,h:.14,spin:-18,opacity:.8,colors:'spark',add:1},
  {name:'core',mat:'glow',size:1.2,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'wake',mat:'tail',orient:true,back:1.6,w:3.6,h:1.2,static:true,opacity:.5,colors:'main',add:.9,params:[3,2,3,.5]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:8,dist:[0,3.4],spread:1.2,life:[.15,.3],w:.5,h:.08,orient:true,colors:'spark',add:1},
  {name:'motes',mat:'glow',place:'trail',loop:true,count:5,dist:[.4,4],spread:1,life:[.25,.45],size:[.35,.06],colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.kunai':{R:12,duration:1,loop:true,projectile:true,note:'Kunai: sharp streak, halo and a flickering cutting glint.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,2],size:2.8,static:true,opacity:.4,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:2.4,static:true,opacity:.5,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:2.2,w:4.8,h:.32,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.2,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'glint',mat:'beam',orient:true,rotOff:1.5708,loop:true,life:[.15,.15],w:[.3,2],h:.16,colors:'core',add:1,params:[.3,0,1,4]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:5,dist:[0,3.2],spread:.5,life:[.12,.25],w:.5,h:.07,orient:true,colors:'spark',add:1}]},
 'rgr.bullet':{R:10,duration:1,loop:true,projectile:true,note:'Bullet: long white-hot tracer, coloured halo and sparks.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,2.4],size:3,static:true,opacity:.4,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'tail',orient:true,back:2,w:5,h:1,static:true,opacity:.6,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'tail',mat:'tail',orient:true,back:3,w:6.4,h:.3,static:true,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.8,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:4,dist:[0,4],spread:.4,life:[.1,.2],w:.5,h:.06,orient:true,colors:'spark',add:1}]},
 'rgr.pellet':{R:7,duration:1,loop:true,projectile:true,note:'Shotgun pellet: hot slug with a fiery halo.',layers:[
  {name:'halo',mat:'glow',size:3,static:true,opacity:.55,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:2.4,w:5,h:.6,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.6,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:3,dist:[0,4],spread:.8,life:[.1,.2],w:.8,h:.12,orient:true,colors:'spark',add:1}]},
 'rgr.chakram':{R:16,duration:1,loop:true,projectile:true,note:'Chakram outbound: spinning ring of blades with sparks flung off the rim.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.5],size:3.4,static:true,opacity:.45,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3,static:true,opacity:.5,colors:'main',add:1,params:[2,0,0,0]},
  {name:'ring',mat:'ring',size:1.9,static:true,colors:'main',add:1,params:[.8,.14,3,1]},
  {name:'blades',mat:'spark',place:'ring',loop:true,count:6,dist:.95,life:[.2,.2],w:1.2,h:.2,spin:18,colors:'core',add:1},
  {name:'fling',mat:'spark',place:'burst',orientVel:true,loop:true,count:6,speed:[3,6],life:[.15,.3],w:.5,h:.07,colors:'spark',add:1}]},
 'rgr.chakramBack':{R:16,duration:1,loop:true,projectile:true,note:'Chakram returning: white-hot ring with a homing streak behind it.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.5],size:3.6,static:true,opacity:.5,colors:'core',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3.2,static:true,opacity:.55,colors:'core',add:1,params:[2,0,0,0]},
  {name:'streak',mat:'tail',orient:true,back:2,w:5,h:1,static:true,opacity:.75,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'ring',mat:'ring',size:2,static:true,colors:'core',add:1,params:[.8,.14,3,1]},
  {name:'blades',mat:'spark',place:'ring',loop:true,count:6,dist:1,life:[.2,.2],w:1.2,h:.2,spin:-18,colors:'core',add:1},
  {name:'fling',mat:'spark',place:'burst',orientVel:true,loop:true,count:6,speed:[3,6],life:[.15,.3],w:.5,h:.07,colors:'spark',add:1}]},
 'rgr.power':{R:26,duration:1,loop:true,projectile:true,note:'Archer Power Shot: big pierce-all arrow with pulsing rings and a storm of sparks (scale = draw).',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1],size:3.6,static:true,opacity:.55,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'halo',mat:'glow',size:3,static:true,opacity:.6,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:2.6,w:6,h:.65,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'core',mat:'tail',orient:true,back:1.4,w:3,h:.22,static:true,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:2,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'rings',mat:'ring',loop:true,count:3,life:[.3,.3],size:[.4,2],opacity:.75,colors:'main',add:1,params:[.85,.08,3,.8]},
  {name:'sparks',mat:'spark',place:'trail',loop:true,count:14,dist:[0,5],spread:1.1,life:[.2,.4],w:.6,h:.08,orient:true,colors:'spark',add:1},
  {name:'motes',mat:'glow',place:'trail',loop:true,count:6,dist:[.5,6],spread:1,life:[.3,.5],size:[.3,.05],colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.hawk':{R:20,duration:1,loop:true,projectile:true,note:'Hunting hawk aura, wake and feather sparks (body drawn in Canvas).',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[0,1.7],size:2.8,static:true,opacity:.4,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'aura',mat:'glow',size:2.6,static:true,opacity:.6,colors:'main',add:1,params:[2,0,0,0]},
  {name:'wake',mat:'tail',orient:true,back:1.8,w:4,h:.8,static:true,opacity:.7,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'feathers',mat:'spark',place:'trail',loop:true,count:8,dist:[.3,3.4],spread:1.2,life:[.25,.45],w:.6,h:.14,orient:true,colors:'spark',add:1}]},
 'rgr.lite':{R:12,duration:1,loop:true,projectile:true,note:'Cheap projectile look used when the screen is crowded.',layers:[
  {name:'halo',mat:'glow',size:2.4,static:true,opacity:.45,colors:'main',add:1,params:[2,0,0,0]},
  {name:'tail',mat:'tail',orient:true,back:1.8,w:4,h:.4,static:true,colors:'main',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',size:1.3,static:true,colors:'core',add:1,params:[2,0,0,0]}]},
 'rgr.muzzle':{R:18,duration:.35,note:'Gun muzzle flash: forward flare, flash, sparks and a smoke wisp.',layers:[
  {name:'flash',mat:'glow',size:[2,.4],life:[.12,.12],colors:'core',add:1,params:[2,0,0,0]},
  {name:'flare',mat:'beam',orient:true,back:-1.1,w:[.6,2.8],h:.8,life:[.12,.12],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'sparks',mat:'spark',place:'trail',count:9,dist:[0,-3.4],spread:1.6,life:[.1,.22],w:.6,h:.08,orient:true,colors:'spark',add:1},
  {name:'smoke',mat:'smoke',place:'trail',count:2,dist:[0,-1],spread:.5,life:[.3,.35],size:[.4,.8],rise:.5,fade:[.1,.4],opacity:.35,colors:'smoke',params:[0,.5,3,.8]}]},
 'rgr.snap':{R:14,duration:.3,note:'Bow string snap / throw release: flash, ring and a few sparks.',layers:[
  {name:'flash',mat:'glow',size:[1.6,.3],life:[.12,.12],colors:'core',add:1,params:[2,0,0,0]},
  {name:'ring',mat:'ring',size:[.3,1.8],life:[.18,.18],opacity:.8,colors:'main',add:1,params:[.85,.1,3,.8]},
  {name:'sparks',mat:'spark',place:'trail',count:5,dist:[0,-2.6],spread:1.4,life:[.1,.2],w:.5,h:.07,orient:true,colors:'spark',add:1}]},
 'rgr.blast':{R:26,duration:.7,note:'Shotgun blast at the muzzle: big flare, smoke puff and a cone of sparks.',layers:[
  {name:'flash',mat:'glow',size:[2.2,.5],life:[.14,.14],colors:'core',add:1,params:[2,0,0,0]},
  {name:'flare',mat:'beam',orient:true,back:-1.2,w:[.8,3.4],h:1.4,life:[.14,.14],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'smoke',mat:'smoke',place:'trail',count:7,dist:[0,-2],spread:1.2,life:[.45,.7],size:[.5,1.1],rise:.4,fade:[.1,.4],opacity:.5,colors:'smoke',params:[0,.5,3,.8]},
  {name:'sparks',mat:'spark',place:'trail',count:18,dist:[0,-4],spread:2,life:[.12,.3],w:.6,h:.08,orient:true,colors:'spark',add:1}]},
 'rgr.hit':{R:22,duration:.8,note:'Ranger impact: flash, directional mark, spark spray along the shot, ring and lingering embers (scale = power).',layers:[
  {name:'flash',mat:'glow',size:[2.2,.5],life:[.15,.15],colors:'core',add:1,params:[1.6,0,0,0]},
  {name:'bloom',mat:'glow',size:[1,2.6],life:[.25,.25],opacity:.5,colors:'main',add:1,params:[2,0,0,0]},
  {name:'mark',mat:'beam',orient:true,w:[.5,2.8],h:.34,life:[.2,.2],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'ring',mat:'ring',layer:'ground',off:[0,1],size:[.3,2],life:[.26,.26],colors:'main',add:.9,opacity:.75,params:[.85,.1,3,.8]},
  {name:'sparks',mat:'spark',place:'trail',count:14,dist:[0,-3.4],spread:2,life:[.15,.35],w:[.7,.15],h:.08,orient:true,fade:[0,.5],colors:'spark',add:1},
  {name:'embers',mat:'glow',place:'disc',count:6,dist:1.1,delay:[0,.1],life:[.4,.7],size:[.22,.05],rise:1,colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.crit':{R:30,duration:.8,note:'Critical hit: star flash, double ring, full spark burst and a shower of embers.',layers:[
  {name:'flash',mat:'glow',size:[.8,3],life:[.18,.18],colors:'core',add:1,params:[1.6,0,0,0]},
  {name:'x1',mat:'beam',orient:true,rotOff:.785,w:[.4,3.2],h:.24,life:[.22,.22],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'x2',mat:'beam',orient:true,rotOff:-.785,w:[.4,3.2],h:.24,life:[.22,.22],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'ring',mat:'ring',size:[.3,2.8],life:[.3,.3],colors:'core',add:1,params:[.85,.08,3,.8]},
  {name:'ring2',mat:'ring',layer:'ground',off:[0,.8],delay:[.05,.05],size:[.3,2.6],life:[.32,.32],colors:'main',add:.9,opacity:.75,params:[.85,.08,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,count:24,speed:[3,8],up:[1,3],g:10,life:[.2,.45],w:[.7,.15],h:.08,fade:[0,.5],colors:'spark',add:1},
  {name:'embers',mat:'glow',place:'disc',count:10,dist:1.3,delay:[0,.12],life:[.5,.8],size:[.2,.05],rise:1.2,colors:'spark',add:1,params:[2,0,0,0]}]},
 // Oct 18 Archer Volley (user: "the VFX on the Volley are horrible, make them look cool"). Three phases in the
 // Archer palette (arrow type accents spark/core): launch flare + target zone telegraph, per-arrow rain with
 // impacts, then a scorched, smoking, ember-lit patch. ranger-vfx.js places each falling arrow.
 'rgr.volleyLaunch':{R:30,duration:.6,note:'Volley release at the archer: skyward flare beam, flash and rising sparks.',layers:[
  {name:'flash',mat:'glow',off:[0,-1.2],size:[1.8,.4],life:[.16,.16],colors:'core',add:1,params:[2,0,0,0]},
  {name:'beam',mat:'beam',off:[0,-3.2],rotOff:-1.5708,w:[.4,4.4],h:.3,life:[.22,.22],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'halo',mat:'glow',off:[0,-2.4],size:[.6,2.4],life:[.3,.3],opacity:.55,colors:'main',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,off:[0,-1.4],count:14,speed:[1,3],up:[5,9],g:6,life:[.25,.45],w:[.5,.12],h:.05,fade:[0,.5],colors:'spark',add:1}]},
 'rgr.volleyZone':{R:150,duration:1,loop:true,note:'Volley target zone while it rains (R = radius): glowing disc, bright edge, sweeping ring, reticle ticks, haze, motes.',layers:[
  {name:'disc',mat:'glow',layer:'ground',size:2.2,static:true,opacity:.28,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'edge',mat:'ring',layer:'ground',size:2.05,static:true,opacity:.85,colors:'main',add:1,params:[.92,.05,3,1]},
  {name:'inner',mat:'ring',layer:'ground',size:1.2,static:true,opacity:.35,colors:'core',add:1,params:[.92,.04,3,1]},
  {name:'sweep',mat:'ring',layer:'ground',loop:true,count:2,life:[.7,.7],size:[2.1,.3],ease:'in',opacity:.6,colors:'core',add:1,params:[.9,.06,3,1]},
  {name:'ticks',mat:'spark',layer:'ground',place:'ring',loop:true,count:12,dist:1,life:[1.2,1.2],w:.1,h:.025,spin:.8,opacity:.8,colors:'core',add:1},
  {name:'haze',mat:'smoke',layer:'ground',place:'disc',loop:true,count:5,dist:.7,life:[1.4,1.4],size:[.35,.55],opacity:.22,colors:'smoke',params:[0,.5,3,.8]},
  {name:'motes',mat:'glow',place:'disc',loop:true,count:8,dist:.9,life:[.7,1],size:[.035,.01],rise:.6,colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.volleyArrow':{R:20,duration:.9,note:'One Volley arrow (x,y = landing point, angle = fall direction): glowing streak falling from the sky, then flash, ring, sparks, light pool and a stuck shaft.',layers:[
  {name:'fall',mat:'tail',orient:true,off:[-1.4,-5.6],vel:[8.75,35],w:3.4,h:.28,life:[.16,.16],colors:'main',add:1,params:[3,2,3,.5]},
  {name:'head',mat:'glow',off:[-1.4,-5.6],vel:[8.75,35],size:1.2,life:[.16,.16],colors:'core',add:1,params:[2,0,0,0]},
  {name:'light',mat:'glow',layer:'ground',delay:[.16,.16],size:[1.2,2.6],life:[.35,.35],opacity:.55,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'flash',mat:'glow',off:[0,-.4],delay:[.16,.16],size:[2,.4],life:[.12,.12],colors:'core',add:1,params:[2,0,0,0]},
  {name:'ring',mat:'ring',layer:'ground',delay:[.16,.16],size:[.3,2.4],life:[.24,.24],opacity:.8,colors:'main',add:1,params:[.86,.1,3,.8]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,off:[0,-.3],delay:[.16,.16],count:7,speed:[3,7],up:[2,5],g:16,life:[.15,.32],w:[.6,.15],h:.07,fade:[0,.5],colors:'spark',add:1},
  {name:'shaft',mat:'tail',orient:true,off:[-.25,-.9],delay:[.16,.16],w:1.9,h:.16,life:[.6,.6],fade:[0,.35],opacity:.9,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'puff',mat:'smoke',delay:[.17,.17],size:[.6,1.4],life:[.45,.45],rise:.6,fade:[.1,.4],opacity:.35,colors:'smoke',params:[0,.5,3,.8]}]},
 'rgr.volleyAfter':{R:150,duration:1.6,note:'Volley aftermath (R = radius): scorched patch, drifting smoke and rising embers.',layers:[
  {name:'scorch',mat:'decal',layer:'ground',size:[1.7,2],life:[1.6,1.6],fade:[0,.45],opacity:.55,colors:'dark',params:[8,.7,.3,.5]},
  {name:'glow',mat:'glow',layer:'ground',size:2,life:[.8,.8],opacity:.3,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'smoke',mat:'smoke',place:'disc',count:7,dist:.8,delay:[0,.25],life:[.9,1.4],size:[.18,.36],rise:.25,fade:[.1,.4],opacity:.4,colors:'smoke',params:[0,.5,3,.8]},
  {name:'embers',mat:'glow',place:'disc',count:14,dist:.95,delay:[0,.4],life:[.6,1.1],size:[.03,.008],rise:.55,colors:'spark',add:1,params:[2,0,0,0]}]},
 // Oct 18 new Ranger weapons (user list). Cones (x,y = nozzle at body height, angle = aim, R = cone length): flame jet /
 // toxic gas streaming outward; lobs = potion / bomb glow and trail; barrel = idle charge glow and its lit fuse.
 'rgr.flame':{R:220,duration:1,loop:true,note:'Flamethrower cone: licking flames and hot core streaming out to R, embers and smoke at the end.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[.45,.12],size:1.1,static:true,opacity:.35,colors:'main',add:.9,params:[2,0,0,0]},
  {name:'core',mat:'tail',orient:true,back:-.5,w:1,h:.09,static:true,opacity:.8,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'flames',mat:'flame',place:'trail',orient:true,rotOff:1.5708,loop:true,count:14,dist:[-.08,-1],ease:'lin',spread:.5,life:[.26,.32],size:[.06,.26],fade:[.1,.6],colors:'main',add:.9,params:[3,.8,4,.04]},
  {name:'hot',mat:'glow',place:'trail',loop:true,count:8,dist:[-.05,-.7],ease:'lin',spread:.25,life:[.18,.22],size:[.08,.16],colors:'core',add:1,params:[2,0,0,0]},
  {name:'embers',mat:'spark',place:'trail',loop:true,count:8,dist:[-.3,-1.15],spread:.8,life:[.25,.4],w:.03,h:.008,orient:true,colors:'spark',add:1},
  {name:'smoke',mat:'smoke',place:'trail',loop:true,count:4,dist:[-.75,-1.2],spread:.7,life:[.5,.6],size:[.12,.24],rise:.15,opacity:.3,colors:'smoke',params:[0,.5,3,.8]}]},
 'rgr.gas':{R:200,duration:1,loop:true,note:'Toxic Canister cone: billowing poison gas streaming out to R with bubbling motes.',layers:[
  {name:'light',mat:'glow',layer:'ground',off:[.45,.12],size:1.1,static:true,opacity:.3,colors:'main',add:.8,params:[2,0,0,0]},
  {name:'jet',mat:'tail',orient:true,back:-.35,w:.7,h:.12,static:true,opacity:.6,colors:'core',add:1,params:[3,2,3,.5]},
  {name:'gas',mat:'smoke',place:'trail',loop:true,count:12,dist:[-.06,-1],ease:'out',spread:.7,life:[.45,.55],size:[.06,.3],fade:[.1,.5],opacity:.6,colors:'main',params:[0,.5,3,.8]},
  {name:'motes',mat:'glow',place:'trail',loop:true,count:8,dist:[-.1,-1.05],spread:.8,life:[.3,.45],size:[.025,.008],colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.lob':{R:14,duration:1,loop:true,projectile:true,note:'Potion / bomb in flight: coloured halo and a trail of drips or fuse sparks.',layers:[
  {name:'halo',mat:'glow',size:2.8,static:true,opacity:.5,colors:'main',add:1,params:[2,0,0,0]},
  {name:'core',mat:'glow',size:1,static:true,colors:'core',add:1,params:[2,0,0,0]},
  {name:'trail',mat:'spark',place:'burst',orientVel:true,loop:true,count:6,speed:[.5,1.5],up:[-1,1],g:8,life:[.2,.35],w:.5,h:.12,colors:'spark',add:1}]},
 'rgr.barrel':{R:30,duration:1,loop:true,note:'Placed Sludge Barrel: soft charged glow and rising bubbles (x,y = ground under the keg).',layers:[
  {name:'light',mat:'glow',layer:'ground',size:2.2,static:true,opacity:.35,colors:'main',add:.8,params:[2,0,0,0]},
  {name:'band',mat:'glow',off:[0,-.5],size:1.2,loop:true,life:[.9,.9],opacity:.4,colors:'core',add:1,params:[2,0,0,0]},
  {name:'bubbles',mat:'glow',place:'disc',loop:true,count:4,dist:.4,off:[0,-.9],life:[.6,.9],size:[.1,.03],rise:1.2,colors:'spark',add:1,params:[2,0,0,0]}]},
 'rgr.fuse':{R:18,duration:1,loop:true,note:'Lit barrel fuse: hot flicker and sparks spraying upward.',layers:[
  {name:'flash',mat:'glow',size:1.6,loop:true,life:[.08,.08],colors:'core',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'burst',orientVel:true,loop:true,count:8,speed:[2,5],up:[3,7],g:14,life:[.15,.3],w:.5,h:.08,colors:'spark',add:1}]},
 'rgr.pierce':{R:18,duration:.5,note:'A piercing shot passing through an enemy: a long streak straight through, flash and a forward spray.',layers:[
  {name:'streak',mat:'beam',orient:true,w:[.8,4.2],h:.18,life:[.2,.2],fade:[0,.3],colors:'core',add:1,params:[.3,0,1,4]},
  {name:'flash',mat:'glow',size:[1.6,.4],life:[.12,.12],colors:'main',add:1,params:[2,0,0,0]},
  {name:'sparks',mat:'spark',place:'trail',count:9,dist:[0,-4],spread:.8,life:[.12,.28],w:.6,h:.07,orient:true,colors:'spark',add:1},
  {name:'embers',mat:'glow',place:'disc',count:4,dist:.8,life:[.3,.5],size:[.2,.05],rise:.8,colors:'spark',add:1,params:[2,0,0,0]}]}
};

let overrides={};try{overrides=JSON.parse(localStorage.getItem(KEY)??'{}')||{};}catch{overrides={};}
export const recipe=name=>overrides[name]??RECIPES[name];
export const hasOverride=name=>!!overrides[name];
export function saveOverride(name,rec){overrides[name]=rec;try{localStorage.setItem(KEY,JSON.stringify(overrides));}catch{}}
export function clearOverride(name){delete overrides[name];try{localStorage.setItem(KEY,JSON.stringify(overrides));}catch{}}

function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
let RS=1;const seedR=s=>{RS=(s>>>0)||1;},RN=()=>{RS^=RS<<13;RS^=RS>>>17;RS^=RS<<5;return((RS>>>0)%100000)/100000;},PRIM={};
const ease=(k,e)=>e==='lin'?k:e==='in'?k*k:1-Math.pow(1-k,3);
function curve(v,k,e){if(v==null)return null;if(typeof v==='number')return v;if(v.length===1)return v[0];const q=ease(k,e);if(v.length===2)return v[0]+(v[1]-v[0])*q;return q<.5?v[0]+(v[1]-v[0])*q*2:v[1]+(v[2]-v[1])*(q*2-1);}
const span=(v,r,def)=>v==null?def:typeof v==='number'?v:v[0]+(v[1]-v[0])*r;

// o: {x,y,R?,scale?,age,angle?,seed?,alpha?,time?, len/max/speed for place 'road'}. pass: 'ground'|'upper'.
export function emitFx(name,o,pass='upper',sink=vfx){
 const rec=typeof name==='string'?recipe(name):name;if(!rec)return false;
 const R=(o.R??rec.R??40)*(o.scale??1),age=o.age??0,ang=o.angle??0,dc=Math.cos(ang),ds=Math.sin(ang),base=(o.seed??1)|0,gA=o.alpha??1,time=o.time??age;
 rec.layers.forEach((L,li)=>{
  if(L.disabled||(L.layer??'upper')!==pass)return;const n=L.count??1,ground=pass==='ground',pl=L.place??'center',road=pl==='road'&&!L.surface;
  for(let i=0;i<n;i++){seedR(base*977+li*131+i*31+7);RN();
   const delay=span(L.delay,RN(),0),life=Math.max(.01,span(L.life,RN(),rec.duration??1));let local,k,rd=0;
   if(road){rd=(i+.5)/n*(o.max??o.len??R);if(rd>(o.len??R))continue;local=age-delay-rd/(o.speed??1e9);if(local<0)continue;k=Math.min(1,local/life);}
   else{if(L.static)local=0;else if(L.loop)local=((age+i*life/n)%life+life)%life;else{local=age-delay;if(local<0||local>life)continue;}k=L.static?0:local/life;}
   const e=L.ease,jit=1+(RN()-.5)*2*(L.jitter??0),gr=L.grow&&!L.static?1-Math.pow(1-Math.min(1,k/L.grow),3):1;
   let w=(curve(L.w,k,e)??curve(L.size,k,e)??1)*R*jit*gr,h=(curve(L.h,k,e)??curve(L.size,k,e)??1)*R*jit*gr;
   if(ground&&L.squash!==false)h*=L.squash??.65;
   const end=L.at==='end'&&o.x2!=null;let x=(end?o.x2:o.x)+(L.off?.[0]??0)*R,y=(end?o.y2:o.y)+(L.off?.[1]??0)*R,rot=0;
   if(L.back){x-=dc*L.back*R;y-=ds*L.back*R;}
   const ra=RN(),rb=RN(),rc=RN();
   if(pl==='ring'){const a=i/n*TAU+(ra-.5)*.4,d=(curve(L.dist,k,e)??1)*R;if(L.radial){const ex=Math.cos(a)*d,ey=Math.sin(a)*d*.65;x+=ex/2;y+=ey/2;rot=Math.atan2(ey,ex);w=Math.hypot(ex,ey)*(L.lenScale??1);}else{x+=Math.cos(a)*d;y+=Math.sin(a)*d*.65;}}
   else if(pl==='segment'&&o.x2!=null){const sx=o.x2-o.x,sy=o.y2-o.y,len=Math.hypot(sx,sy)||1,sa=Math.atan2(sy,sx);if(L.span){x+=sx/2;y+=sy/2;w+=len;rot=sa;}else{const u=curve(L.dist,k,e)??.5,s=(ra-.5)*(L.spread??0)*R;x+=sx*u-Math.sin(sa)*s;y+=sy*u+Math.cos(sa)*s;}}
   else if(pl==='disc'){const a=ra*TAU,d=Math.sqrt(rb)*(curve(L.dist,k,e)??1)*R;x+=Math.cos(a)*d;y+=Math.sin(a)*d*.65;}
   else if(pl==='burst'){const a=ra*TAU,sp=span(L.speed,rb,1)*R,up=span(L.up,rc,0)*R,g=(L.g??0)*R,vx=Math.cos(a)*sp,vy=Math.sin(a)*sp*.65-up;x+=vx*local;y+=vy*local+.5*g*local*local;if(L.orientVel)rot=Math.atan2(vy+g*local,vx);}
   else if(pl==='trail'){const d=(curve(L.dist,k,e)??1)*R,sd=(ra-.5)*(L.spread??0)*R;x+=-dc*d-ds*sd;y+=-ds*d+dc*sd;}
   else if(pl==='road'){const len=o.len??R;if(L.surface){x+=dc*len/2;y+=ds*len/2;w+=len;rot=ang;}
    else{const side=i%2?1:-1,off=(L.spread??.8)*R*side*(.55+.45*ra);x+=dc*rd-ds*off;y+=ds*rd+dc*off;rot=side*(L.lean??.3)*(.5+rc);}}
   if(L.vel){x+=L.vel[0]*R*local;y+=L.vel[1]*R*local;}
   if(L.rise)y-=L.rise*R*local;
   if(L.orient)rot=ang;rot+=(L.rotOff??0)+(rb-.5)*2*(L.rotJit??0)+(L.spin??0)*local;
   if(L.anchor==='base'){x+=Math.sin(rot)*h*.5;y-=Math.cos(rot)*h*.5;}
   const f=L.fade??[0,1];let a=(L.opacity??1)*gA;if(f[0]>0&&k<f[0])a*=k/f[0];if(f[1]<1&&k>f[1])a*=1-(k-f[1])/(1-f[1]);if(a<=.003||w<.5||h<.5)continue;
   const tf=L.tFrom??0,tt=L.dissolve===false?0:tf>0?Math.max(0,(k-tf)/(1-tf)):k;
   const q=PRIM;q.mat=L.mat;q.x=x;q.y=y;q.w=w;q.h=h;q.rot=rot;q.t=L.tOverride&&o.t!=null?o.t:tt;q.time=time+i*.37+li;q.seed=RN()*9;q.alpha=a;q.add=L.add??0;q.params=L.dyn&&o.p?L.params.map((v,j)=>o.p[j]??v):L.params;q.colors=typeof L.colors==='string'?(o.pal?.[L.colors]??['#202020','#a0a0a0','#ffffff']):L.colors;sink.add(pass,q);
  }});
 return true;
}
