export const SOUND_FILES={soundtrack:'desert-whispers.mp3',background:'background-quiet.mp3',encounter:'encounter-quiet.mp3',sword1:'sword-1-quiet.mp3',sword2:'sword-2-quiet.mp3',sword3:'sword-3-quiet.mp3',damage:'damage-quiet.mp3',gameover:'game-over-quiet.mp3',enemyDeath:'enemy-death-quiet.mp3'};
const SETTING_KEY='veyrath-audio-v5',OLD_SETTING_KEY='veyrath-audio-v4';
// Oct 15: sliders default to 50% for every channel (and any future one). The
// slider is a 30 dB loudness scale (50% ~ the old 15% level, 100% = .85 gain),
// fading linearly to silence over the bottom 5% so each step is audible.
export const DEFAULT_VOLUME=.5,DEFAULT_MUSIC=.15;
export const gainFor=v=>v<=0?0:.85*10**(-1.5*(1-Math.min(1,v)))*Math.min(1,v/.05);
// Synth layers are authored small; this lifts them to the sampled FX level.
const ABILITY_LEVEL=12;
const bounded=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
// Oct 15: synthesized ability sounds, keyed path-slot ('pyro-meteor' for Mage
// spell kinds, 'warlord-R' for Warrior keys). N = filtered noise sweep, T = tone
// sweep: [kind, filter/wave, from Hz, to Hz, seconds, gain, delay].
const N=(f,a,b,d,g,at=0)=>['n',f,a,b,d,g,at],T=(w,a,b,d,g,at=0)=>['t',w,a,b,d,g,at];
export const ABILITY_SOUNDS={
 'pyro-fireball':[N('bandpass',600,2500,.25,.05),T('sawtooth',90,60,.25,.012),N('lowpass',900,80,.35,.05,.35)],
 'pyro-nova':[N('lowpass',300,1500,.5,.05),T('sine',120,200,.5,.02)],
 'pyro-chain':[N('bandpass',400,3000,.45,.06),N('lowpass',2000,200,.6,.03,.1)],
 'pyro-meteor':[T('sine',1400,300,.6,.01),N('lowpass',600,40,.9,.09,.6),T('sine',70,30,.8,.06,.6)],
 'cryo-fireball':[N('highpass',3000,6000,.3,.03),T('triangle',1800,1200,.3,.01),T('triangle',2400,2200,.25,.008,.05)],
 'cryo-nova':[T('sine',2000,800,.5,.015),N('highpass',4000,2000,.5,.04),T('triangle',1320,1320,.6,.008,.05)],
 'cryo-chain':[N('lowpass',3000,300,.4,.06),T('triangle',2600,1800,.4,.012),T('triangle',3100,3000,.3,.008,.08)],
 'cryo-meteor':[N('bandpass',800,1500,1.6,.04),N('highpass',5000,4000,1.2,.015,.2)],
 'storm-fireball':[N('highpass',2000,6000,.12,.07),T('sawtooth',180,60,.15,.03),N('highpass',3000,5000,.08,.04,.12)],
 'storm-nova':[T('square',120,240,.4,.01),N('bandpass',2500,4000,.4,.03)],
 'storm-chain':[T('sawtooth',80,260,.8,.012),N('bandpass',300,1200,.8,.04)],
 'storm-meteor':[N('lowpass',400,60,1.2,.07),N('highpass',2500,5000,.1,.06,.25),N('highpass',2500,5000,.1,.05,.6)],
 'blood-fireball':[T('sine',220,140,.8,.02),N('lowpass',500,200,.8,.03)],
 'blood-nova':[T('sine',110,90,.6,.03),N('lowpass',800,300,.5,.03)],
 'blood-chain':[N('lowpass',1200,150,.35,.07),T('sine',180,50,.3,.04)],
 'blood-meteor':[T('sine',60,40,1.4,.05),T('sawtooth',55,35,1.4,.006),N('lowpass',300,100,1.2,.04)],
 blink:[T('sine',400,1600,.18,.02),N('highpass',2000,6000,.18,.03)],
 // Impact layers (Oct 16) until recorded impacts arrive.
 'cryo-chain-impact':[N('highpass',5000,2500,.35,.06),T('triangle',2800,1600,.3,.012),N('lowpass',1200,200,.4,.04)],
 'storm-fireball-impact':[N('highpass',3000,1500,.18,.06),T('square',90,50,.2,.015)],
 'blood-chain-impact':[N('lowpass',900,120,.4,.07),T('sine',140,45,.35,.04)],
 'berserker-RMB':[N('bandpass',300,2000,.3,.06),T('sawtooth',110,60,.3,.015)],
 'berserker-Q':[T('sawtooth',90,70,.6,.015),N('lowpass',600,200,.5,.04)],
 'berserker-E':[N('bandpass',800,3000,.4,.07),N('bandpass',1200,3500,.3,.05,.2)],
 'berserker-R':[T('sawtooth',70,50,1,.03),T('sawtooth',105,80,1,.015),N('lowpass',500,150,1,.05)],
 'vanguard-RMB':[N('lowpass',1500,100,.5,.08),T('sine',80,35,.5,.05,.1)],
 'vanguard-Q':[T('triangle',900,880,.5,.02),T('triangle',1350,1330,.4,.012)],
 'vanguard-E':[N('lowpass',400,40,.6,.09),T('sine',60,30,.5,.06)],
 'vanguard-R':[T('sine',220,330,1,.02),T('triangle',440,660,1,.01)],
 'spellblade-RMB':[T('sine',900,200,.35,.025),N('bandpass',1500,500,.35,.04)],
 'spellblade-Q':[T('sine',300,600,.5,.02),N('bandpass',1000,2000,.5,.02)],
 'spellblade-E':[T('sine',150,80,.8,.03),T('sine',153,82,.8,.02)],
 'spellblade-R':[T('sine',200,900,1,.025),N('highpass',1500,4000,1,.03)],
 'warlord-RMB':[N('bandpass',200,1200,.35,.07),N('lowpass',600,60,.4,.07,.3)],
 'warlord-Q':[T('sawtooth',140,100,.9,.03),T('sawtooth',210,150,.9,.015),N('bandpass',600,300,.8,.04)],
 'warlord-E':[N('lowpass',300,40,1,.1),T('sine',45,30,1,.07)],
 // Oct 19 audit (user: "add sound to all things in the game"). Layered synth recipes built the way sfxr/ZzFX-style
 // generators and impact layering guides suggest: a bright transient ("crack"), a low body and a noise texture.
 // Ranger weapon shots (w-<primary>), played when a muzzle/throw record appears.
 'w-bow':[T('triangle',260,170,.16,.02),N('bandpass',2600,700,.12,.05),N('highpass',4500,7000,.05,.03)],
 'w-shortbow':[T('triangle',380,250,.12,.018),N('bandpass',3200,900,.09,.05)],
 'w-longbow':[T('triangle',170,110,.24,.024),N('bandpass',1800,500,.18,.05),N('lowpass',600,120,.2,.03,.03)],
 'w-crossbow':[N('lowpass',1800,250,.12,.09),T('square',150,70,.09,.02),N('highpass',3000,5000,.04,.04)],
 'w-pistols':[N('highpass',1800,700,.07,.1),T('square',190,60,.07,.03),N('lowpass',700,90,.2,.05,.02)],
 'w-shotgun':[N('highpass',1200,500,.1,.11),T('square',110,40,.14,.04),N('lowpass',500,60,.4,.09,.02)],
 'w-rifle':[N('highpass',2600,900,.06,.12),T('sawtooth',260,50,.1,.025),N('lowpass',900,80,.5,.06,.03)],
 'w-flamethrower':[N('bandpass',500,900,.28,.06),N('lowpass',300,150,.3,.05)],
 'w-shuriken':[N('bandpass',4200,7000,.09,.05),T('sine',2400,3400,.06,.006)],
 'w-kunai':[N('bandpass',3000,5200,.1,.06)],'w-daggers':[N('bandpass',3600,6000,.08,.05),N('bandpass',2600,4600,.08,.04,.04)],
 'w-chakram':[N('bandpass',2000,3200,.25,.04),T('sine',900,1200,.25,.006)],
 'w-falconer':[T('sawtooth',1900,2700,.22,.006),T('sine',2600,1800,.18,.008,.05),N('bandpass',3000,1500,.2,.03)],
 'w-potion':[T('triangle',1900,2500,.07,.01),N('bandpass',1500,3000,.1,.03)],'w-bombbag':[N('lowpass',900,300,.12,.05),T('sine',300,180,.1,.015)],
 'w-barrel':[N('lowpass',500,120,.25,.07),T('sine',90,60,.2,.03)],'w-canister':[N('highpass',2500,1500,.25,.04)],
 // Mage weapon casts (lmb-<primary>), fallback <path>-bolt.
 'pyro-bolt':[N('bandpass',800,2200,.16,.05),T('sawtooth',140,80,.14,.008)],'cryo-bolt':[T('triangle',2200,1500,.12,.012),N('highpass',4000,6000,.1,.03)],
 'storm-bolt':[N('highpass',2500,6000,.08,.07),T('square',300,120,.08,.008)],'blood-bolt':[T('sine',260,150,.18,.02),N('lowpass',700,250,.18,.03)],
 'lmb-wand':[T('sine',1200,700,.1,.012),N('highpass',3000,5000,.06,.03)],'lmb-snowglobe':[T('triangle',1800,2600,.3,.01),T('triangle',2700,2600,.3,.006,.06)],
 'lmb-sundisc':[N('bandpass',1500,2600,.3,.04),T('sine',500,700,.3,.01)],'lmb-embers':[N('bandpass',1200,3000,.08,.05)],
 'lmb-flamegaunt':[N('bandpass',500,1100,.25,.06)],'lmb-lightrod':[N('highpass',2000,7000,.07,.1),T('square',160,50,.1,.02),N('lowpass',500,80,.3,.04,.05)],
 'lmb-drum':[T('sine',90,50,.25,.06),N('lowpass',400,80,.2,.05)],'lmb-tesla':[T('sawtooth',90,180,.2,.01),N('bandpass',2500,4000,.2,.03)],
 'lmb-stormstaff':[N('highpass',2500,6000,.1,.06),T('square',220,90,.1,.01)],'lmb-sigilbook':[T('sine',180,110,.3,.03),N('lowpass',500,150,.3,.03)],
 'lmb-bloodorb':[T('sine',200,120,.22,.025),N('lowpass',600,200,.2,.03)],
 // Ranger abilities (<path>-<key>).
 'archer-RMB':[T('triangle',140,80,.3,.03),N('bandpass',2000,400,.3,.07),N('highpass',5000,8000,.08,.04)],'archer-Q':[N('bandpass',1500,3000,.2,.04),T('triangle',600,900,.2,.008)],
 'archer-E':[N('bandpass',2600,800,.4,.06),N('bandpass',2400,700,.4,.05,.08),N('bandpass',2200,600,.4,.04,.16)],'archer-R':[T('sine',300,900,.6,.015),N('highpass',2000,5000,.6,.03)],
 'ninja-RMB':[N('bandpass',4000,7000,.2,.06),N('bandpass',3500,6500,.2,.05,.07)],'ninja-Q':[N('lowpass',2000,200,.5,.08),N('highpass',3000,1500,.3,.03)],
 'ninja-E':[N('bandpass',3000,6000,.12,.07),N('bandpass',3000,6000,.12,.06,.1),N('bandpass',3000,6000,.12,.05,.2)],'ninja-R':[T('sine',200,80,.6,.02),N('bandpass',1000,4000,.6,.04)],
 'alchemist-RMB':[T('triangle',1600,2200,.1,.012),N('lowpass',1200,200,.4,.07,.25)],'alchemist-Q':[N('bandpass',800,1600,.3,.05),T('sine',500,300,.3,.01)],
 'alchemist-E':[N('lowpass',700,150,.5,.07),T('sine',120,80,.4,.02)],'alchemist-R':[T('triangle',900,1500,.3,.012),N('lowpass',600,40,1,.11,.4),T('sine',60,30,.8,.06,.4)],
 'gunslinger-RMB':[N('highpass',1800,700,.06,.09),N('highpass',1800,700,.06,.08,.08),N('highpass',1800,700,.06,.07,.16),N('highpass',1800,700,.06,.07,.24)],
 'gunslinger-Q':[N('bandpass',1500,4000,.15,.05)],'gunslinger-E':[N('highpass',2600,900,.08,.12),N('lowpass',800,60,.6,.07,.03)],
 'gunslinger-R':[N('highpass',1800,800,.4,.08),T('square',140,60,.4,.02),N('lowpass',600,60,.8,.07,.1)],
 // World, loot and UI.
 'pickup-gold':[T('triangle',1800,1800,.08,.012),T('triangle',2700,2700,.12,.01,.05)],'pickup-xp':[T('sine',700,1300,.09,.012)],
 'pickup-heal':[T('sine',500,800,.25,.015),T('sine',750,1200,.25,.01,.08)],'loot':[T('triangle',900,1400,.3,.01),T('triangle',1350,2100,.3,.008,.08)],
 'legendary':[T('triangle',523,523,.6,.012),T('triangle',659,659,.6,.012,.1),T('triangle',784,784,.7,.012,.2),T('triangle',1047,1047,.9,.012,.3),N('highpass',4000,7000,.9,.02,.3)],
 'ui-click':[T('triangle',900,700,.04,.008),N('highpass',3000,4000,.03,.012)],'card':[T('triangle',660,990,.18,.012),T('sine',990,1320,.2,.008,.06)],
 'fanfare':[T('triangle',392,392,.25,.015),T('triangle',523,523,.25,.015,.15),T('triangle',659,659,.35,.015,.3),T('triangle',784,784,.7,.015,.45)],
 'downed':[T('sawtooth',300,90,.8,.012),N('lowpass',600,100,.6,.03)],'revive':[T('sine',400,900,.5,.015),T('sine',600,1350,.5,.01,.1)],
 'parry':[T('square',1400,1100,.12,.012),T('triangle',2800,2600,.25,.012),N('highpass',4000,6000,.08,.05)],
 'crit':[N('highpass',3000,1200,.07,.08),T('square',600,200,.08,.012)],'reaction':[N('bandpass',900,2600,.3,.05),T('sine',300,600,.3,.012)],
 'phase':[T('sine',220,440,.5,.015),T('sine',330,660,.5,.01,.05)],
 // Bosses.
 'boss-roar':[T('sawtooth',90,55,1.4,.03),T('sawtooth',93,57,1.4,.02),N('lowpass',700,150,1.4,.06),N('bandpass',400,200,1.2,.04,.1)],
 'tyrant-roar':[T('sawtooth',70,40,2,.035),T('sawtooth',73,42,2,.025),T('square',140,70,1.6,.01),N('lowpass',900,90,2,.08),N('bandpass',300,120,1.8,.05,.2)],
 'boss-smash':[N('lowpass',900,50,.6,.12),T('sine',70,30,.6,.07),N('highpass',2000,800,.08,.06)],'boss-charge':[N('bandpass',300,1200,.4,.08),N('lowpass',500,60,.4,.07,.3)],
 'boss-sweep':[N('bandpass',600,2200,.25,.07),T('sawtooth',120,70,.2,.012)],'boom':[N('lowpass',1200,60,.5,.09),T('sine',90,35,.45,.05),N('highpass',2500,1000,.05,.04)],
 'ring':[N('bandpass',300,1500,.6,.06),T('sine',100,60,.5,.03)],'enemy-shot':[T('square',700,350,.06,.005),N('bandpass',2000,1000,.05,.012)],
 'shed':[N('highpass',1500,4000,.5,.1),T('square',300,120,.5,.02),N('lowpass',800,60,1.2,.1,.15),T('sine',60,30,1,.06,.15)],
 'boss-death':[T('sawtooth',110,30,2.2,.035),N('lowpass',800,40,2.2,.09),T('sine',55,25,2,.06)],'elite':[T('sawtooth',160,90,.7,.02),N('lowpass',600,150,.6,.04)],
 'warlord-R':[N('bandpass',1000,2000,1.5,.05),T('sawtooth',300,320,1.5,.005)]
};
// Recorded ability sounds (prepare-ability-sounds.py). name: variant count. A
// recorded cast replaces that ability's synth recipe; impacts come from spellImpact events.
export const ABILITY_SAMPLES={'pyro-fireball-cast':1,'pyro-fireball-impact':1,'pyro-nova-cast':2,'pyro-chain-cast':1,'pyro-meteor-cast':1,'pyro-meteor-impact':3};
const SAMPLE_GAIN=.6,MUSIC_TRIM=.7;
// Oct 19 (user: "the sounds are horrible"): recorded SFX come from assets/audio/sfx/manifest.json
// ({sounds:{name:{files:[...],gain,pitch}}}), so new packs are added by tools/prepare-sfx.py without code edits.
// Every recorded play gets a random variant and a small pitch/speed change; world sounds are panned left/right by
// screen position (play(...,pan)); everything runs through one master compressor so stacked hits don't clip.
const SFX_DIR='assets/audio/sfx/',PITCH=.06;
export const COMPRESSOR={threshold:-18,knee:12,ratio:4,attack:.003,release:.25};
export class CombatSound {
  constructor(){
    if(!globalThis.Howl||!globalThis.Howler)throw new Error('Load the bundled Howler.js before the game module.');
    this.engine=globalThis.Howler;this.ctx=this.engine.ctx;this.unlocked=false;
    this.state={dead:false,encounter:false,paused:true,hidden:false};this.voices=[];this.lastFX={};this.synthBus=null;
    // v5 (Oct 16): Music defaults to 15%; Background/FX levels carry over from v4.
    let saved;try{saved=JSON.parse(localStorage.getItem(SETTING_KEY))??{...JSON.parse(localStorage.getItem(OLD_SETTING_KEY)),music:undefined};}catch{}
    this.background=bounded(saved?.background,DEFAULT_VOLUME);this.fx=bounded(saved?.fx,DEFAULT_VOLUME);this.musicVolume=bounded(saved?.music,DEFAULT_MUSIC);this.music={};this.templates={};
    for(const [name,file] of Object.entries(SOUND_FILES)){
      const loop=['soundtrack','background','encounter'].includes(name);
      const howl=new globalThis.Howl({src:['assets/audio/'+file],loop,volume:0,html5:loop,preload:!loop,pool:4});
      if(loop){
        this.music[name]={howl,id:null,version:0,finished:null};
        howl.on('load',()=>this.refreshMusic());
        howl.on('play',id=>{if(!this.musicWanted(name)){howl.volume(0,id);howl.pause(id);}});
        // A blocked HTML5 play must wait for a real browser unlock; never retry while hidden/dead.
        howl.on('playerror',()=>{howl.once('unlock',()=>{if(this.musicWanted(name))this.refreshMusic();});});
      }else{
        this.templates[name]=howl;
        for(const event of ['end','stop','playerror'])howl.on(event,id=>{this.voices=this.voices.filter(v=>v.howl!==howl||v.id!==id);});
        howl.on('play',id=>{if(this.state.hidden||(this.state.dead&&name!=='gameover')||!this.voices.some(v=>v.howl===howl&&v.id===id))howl.stop(id);});
      }
    }
    this.samples={};
    for(const [name,count] of Object.entries(ABILITY_SAMPLES))this.samples[name]=Array.from({length:count},(_,i)=>{
      const howl=new globalThis.Howl({src:['assets/audio/abilities/'+name+(i?'-'+(i+1):'')+'.mp3'],volume:0,preload:true,pool:3});
      for(const event of ['end','stop','playerror'])howl.on(event,id=>{this.voices=this.voices.filter(v=>v.howl!==howl||v.id!==id);});
      return howl;});
    this.sfx={};this.sfxDefs={};
    fetch(SFX_DIR+'manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(m=>{this.sfxDefs=m?.sounds??{};}).catch(()=>{});
    this.ctx=this.engine.ctx;
  }
  // Howls for a manifest sound are made on first use (no up-front decoding of every pack).
  sfxVariants(kind){const def=this.sfxDefs[kind];if(!def?.files?.length)return null;
    return this.sfx[kind]??=def.files.map(f=>{const howl=new globalThis.Howl({src:[SFX_DIR+f],volume:0,preload:true,pool:4});
      for(const event of ['end','stop','playerror'])howl.on(event,id=>{this.voices=this.voices.filter(v=>v.howl!==howl||v.id!==id);});return howl;});}
  // Master compressor between Howler's master gain and the speakers (samples and synth both pass through it).
  compress(){const ctx=this.ctx,m=this.engine.masterGain;if(!ctx||!m||this.comp)return;try{const c=ctx.createDynamicsCompressor();
    for(const k of ['threshold','knee','ratio','attack','release'])c[k].value=COMPRESSOR[k];m.disconnect();m.connect(c);c.connect(ctx.destination);this.comp=c;}catch{}}
  unlock(){
    this.unlocked=true;this.ctx=this.engine.ctx;
    try{if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}catch{}
    this.compress();
    if(this.ctx&&!this.synthBus){this.synthBus=this.ctx.createGain();this.synthBus.gain.value=gainFor(this.fx);this.synthBus.connect(this.engine.masterGain||this.ctx.destination);}
    // Howler's capture-phase gesture handler primes its HTML5 pool before this UI callback.
    // Loading streams at construction would allocate locked audio nodes before that gesture.
    for(const m of Object.values(this.music))if(m.howl.state()==='unloaded')m.howl.load();
    this.refreshMusic();
  }
  setVolume(channel,value){
    if(!['background','fx','music'].includes(channel))return;
    const key=channel==='music'?'musicVolume':channel;this[key]=bounded(value,this[key]);
    try{localStorage.setItem(SETTING_KEY,JSON.stringify({background:this.background,fx:this.fx,music:this.musicVolume}));}catch{}
    if(channel==='fx'){
      for(const v of this.voices)if(v.howl)v.howl.volume(gainFor(this.fx)*v.gain,v.id);
      if(this.synthBus)this.synthBus.gain.setValueAtTime(gainFor(this.fx),this.ctx.currentTime);
    }else this.refreshMusic(true);
  }
  setState(next){
    const previous=this.state;this.state={...previous,...next};
    if(this.state.dead&&!previous.dead){this.stopFX();this.play('gameover');}
    if(this.state.hidden&&!previous.hidden)this.stopFX();
    if(Object.keys(this.state).some(k=>this.state[k]!==previous[k]))this.refreshMusic();
  }
  stopVoice(v){
    this.voices=this.voices.filter(x=>x!==v);
    if(v.howl)v.howl.stop(v.id);
    for(const node of v.nodes||[])try{node.stop();}catch{}
    for(const node of v.disconnect||[])try{node.disconnect();}catch{}
  }
  stopFX(){for(const v of [...this.voices])this.stopVoice(v);}
  restart(){
    this.stopFX();this.lastFX={};
    for(const m of Object.values(this.music)){this.cancelMusicFade(m);m.howl.stop();m.id=null;m.howl.volume(0);}
    this.setState({dead:false,encounter:false,paused:false});this.unlock();
  }
  // The soundtrack (Desert Whispers) loops on its own Music volume; ambience uses Background.
  // Oct 17: Desert Whispers trimmed ~3 dB below the slider curve (user: a little quieter).
  trackVolume(name){return name==='soundtrack'?gainFor(this.musicVolume)*MUSIC_TRIM:gainFor(this.background);}
  musicWanted(name){return this.unlocked&&!this.state.hidden&&!this.state.dead&&this.trackVolume(name)>0&&(name!=='encounter'||this.state.encounter);}
  cancelMusicFade(m){m.version++;if(m.fade)clearInterval(m.fade);m.fade=null;}
  // Own fade (Oct 17): Howler's fade rounds gain to 0.01 steps, so the quiet end of
  // the slider (gains of .001-.03) stalled or snapped and the slider seemed dead.
  fadeMusic(m,from,to,ms,done){
    const id=m.id,start=performance.now();
    m.fade=setInterval(()=>{
      const k=Math.min(1,(performance.now()-start)/ms);m.howl.volume(from+(to-from)*k,id);
      if(k>=1){clearInterval(m.fade);m.fade=null;done();}
    },16);
  }
  refreshMusic(immediate=false){
    if(!this.unlocked)return;
    for(const [name,m] of Object.entries(this.music)){
      // Do not queue stale play/fade actions while streaming data is still loading.
      if(m.howl.state()!=='loaded')continue;
      this.cancelMusicFade(m);
      const target=this.musicWanted(name)?this.trackVolume(name)*(this.state.paused?.65:1):0;
      if(this.state.hidden||this.state.dead||immediate||this.trackVolume(name)===0){
        if(m.id!==null)m.howl.volume(target,m.id);
        if(target===0){if(m.id!==null)m.howl.pause(m.id);continue;}
      }
      if(target>0&&(m.id===null||!m.howl.playing(m.id))){
        // Start silent, including before async loading completes. A stable ID resumes the same loop.
        if(m.id===null){m.howl.volume(0);m.id=m.howl.play();}else m.howl.play(m.id);
      }
      if(m.id===null)continue;
      if(immediate){m.howl.volume(target,m.id);continue;}
      const version=m.version,id=m.id;
      this.fadeMusic(m,m.howl.volume(id),target,650,()=>{if(m.version===version&&!this.musicWanted(name)){m.howl.volume(0,id);m.howl.pause(id);}});
    }
  }
  reserveVoice(kind,voice){
    const similar=this.voices.filter(v=>kind.startsWith('sword')?v.kind.startsWith('sword'):v.kind===kind);
    for(const previous of similar)this.stopVoice(previous);
    while(this.voices.length>=10)this.stopVoice(this.voices[0]);  /* Oct 19: 6 -> 10, more layers can overlap now */
    this.voices.push({...voice,kind});return this.voices.at(-1);
  }
  // Oct 19: vol = 0..1 distance attenuation, pan = -1..1 screen side, both for world sounds (game.js playAt).
  play(kind,index=0,vol=1,pan=0){this.vol=Math.max(0,Math.min(1,vol));pan=Math.max(-1,Math.min(1,pan||0));
    if(!this.unlocked||this.fx===0||this.state.hidden||(this.state.dead&&kind!=='gameover'))return;
    const now=performance.now(),gap=kind==='enemyDeath'?200:kind==='damage'?110:kind==='enemy-shot'?140:kind==='boom'?90:kind==='pickup-xp'||kind==='pickup-gold'?60:this.templates[kind]?0:70;
    if(now-(this.lastFX[kind]??-Infinity)<gap)return;this.lastFX[kind]=now;
    // Recorded sounds first: manifest pack sounds, then the older pyro samples, then the bundled MP3s; synth is the fallback.
    const def=this.sfxDefs[kind],packed=this.sfxVariants(kind),recorded=packed??this.samples[kind]??this.samples[kind+'-cast'];
    if(recorded||this.templates[kind]){
      const howl=recorded?recorded[Math.floor(Math.random()*recorded.length)]:this.templates[kind];
      const gain=(packed?def.gain??SAMPLE_GAIN:recorded?SAMPLE_GAIN:kind==='enemyDeath'?.35:kind==='gameover'?.75:.7)*this.vol,spread=packed?def.pitch??PITCH:recorded?PITCH:kind==='gameover'?0:.04;
      // Configure group gain first: queued/async starts must never inherit full volume.
      howl.volume(gainFor(this.fx)*gain);
      const id=howl.play();howl.volume(gainFor(this.fx)*gain,id);if(spread&&howl.rate)howl.rate(1+(Math.random()*2-1)*spread,id);if(pan&&howl.stereo)howl.stereo(pan*.8,id);
      this.reserveVoice(kind,{howl,id,gain});return;
    }
    const ctx=this.ctx;
    if(!ctx||ctx.state!=='running'||!this.synthBus)return;
    const t=ctx.currentTime,nodes=[],disconnect=[];
    const voice=this.reserveVoice(kind,{nodes,disconnect});
    let bus=this.synthBus;if(pan&&ctx.createStereoPanner){bus=ctx.createStereoPanner();bus.pan.value=pan*.8;bus.connect(this.synthBus);disconnect.push(bus);}
    const gainNode=()=>{const g=ctx.createGain();g.connect(bus);disconnect.push(g);return g;};
    if(ABILITY_SOUNDS[kind]){
      let last=null,end=0;
      for(const [type,shape,a,b,dur,g,at] of ABILITY_SOUNDS[kind]){
        const start=t+at,stop=start+dur,out=gainNode(),peak=g*ABILITY_LEVEL*(this.vol??1);out.gain.setValueAtTime(0,start);out.gain.linearRampToValueAtTime(peak,start+Math.min(.02,dur*.2));out.gain.exponentialRampToValueAtTime(.0001,stop);
        let src;
        if(type==='t'){src=ctx.createOscillator();src.type=shape;src.frequency.setValueAtTime(a,start);src.frequency.exponentialRampToValueAtTime(b,stop);src.connect(out);}
        else{this.noise??={};let buffer=this.noise.ability;if(!buffer||buffer.sampleRate!==ctx.sampleRate){buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise.ability=buffer;}
          src=ctx.createBufferSource();src.buffer=buffer;const filter=ctx.createBiquadFilter();filter.type=shape;filter.Q.value=shape==='bandpass'?1.2:.7;filter.frequency.setValueAtTime(a,start);filter.frequency.exponentialRampToValueAtTime(b,stop);src.connect(filter);filter.connect(out);disconnect.push(filter);}
        nodes.push(src);src.start(start);src.stop(stop+.02);if(stop>=end){end=stop;last=src;}
      }
      last.onended=()=>this.stopVoice(voice);return;
    }
    if(kind==='levelup'){
      [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>{
        const o=ctx.createOscillator(),g=gainNode(),start=t+i*.09;
        o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.025,start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+.4);
        o.connect(g);nodes.push(o);o.start(start);o.stop(start+.42);
      });
    }else{
      const dur=kind==='rumble'?.55:kind==='whoosh'?.13:.1,gain=gainNode();
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime((kind==='whoosh'?.07:.13)*.2,t+.007);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
      // Noise is generated once per kind and reused (was ~5-26k random samples allocated per play).
      this.noise??={};let buffer=this.noise[kind];if(!buffer||buffer.sampleRate!==ctx.sampleRate){buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*dur),ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.noise[kind]=buffer;}
      const src=ctx.createBufferSource();src.buffer=buffer;const filter=ctx.createBiquadFilter();
      filter.type=kind==='whoosh'?'bandpass':'lowpass';filter.frequency.setValueAtTime(kind==='rumble'?180:kind==='whoosh'?1800:1200,t);filter.frequency.exponentialRampToValueAtTime(kind==='rumble'?45:kind==='whoosh'?500:180,t+dur);
      src.connect(filter);filter.connect(gain);nodes.push(src);disconnect.push(filter);src.start(t);src.stop(t+dur);
      if(kind==='hit'){
        const osc=ctx.createOscillator(),g=gainNode();osc.type='triangle';osc.frequency.setValueAtTime(150+index*20,t);osc.frequency.exponentialRampToValueAtTime(45,t+.09);
        g.gain.setValueAtTime(.13*.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+.1);osc.connect(g);nodes.push(osc);osc.start(t);osc.stop(t+.1);
      }
    }
    // Last source ends after all earlier sources (the chord's last note, or impact oscillator).
    nodes.at(-1).onended=()=>this.stopVoice(voice);
  }
}
