import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {CombatSound,SOUND_FILES,gainFor} from '../dist/sound.js';
const saved=new Map(),instances=[];let serial=1000,clock=1000;
const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.peak=v;},exponentialRampToValueAtTime(){}});
const master={name:'Howler master'},nodes=[];
const node=()=>{const n={gain:param(),frequency:param(),connect(to){this.output=to;},disconnect(){this.disconnected=true;},start(){},stop(){this.stopped=true;}};nodes.push(n);return n;};
const ctx={state:'running',currentTime:0,sampleRate:100,createGain:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,createBuffer:(n,size)=>({getChannelData:()=>new Float32Array(size)})};
class MockHowl{
 constructor(options){this.options=options;this.events=[];this.sounds=new Map();this.groupVolume=options.volume;this.loaded=options.preload===false?null:true;this.loadCalls=0;this.plays=0;this.fadeCalls=[];instances.push(this);}
 on(event,fn,id){this.events.push({event,fn,id});return this;}
 once(event,fn,id){this.events.push({event,fn,id,once:true});return this;}
 off(event,fn,id){this.events=this.events.filter(x=>!(x.event===event&&x.fn===fn&&x.id===id));return this;}
 emit(event,id){for(const x of [...this.events])if(x.event===event&&(x.id===undefined||x.id===id)){if(x.once)this.off(event,x.fn,x.id);x.fn(id);} }
 state(){return this.loaded===null?'unloaded':this.loaded?'loaded':'loading';}
 load(){this.loadCalls++;this.loaded=true;this.emit('load');return this;}
 play(id){id??=++serial;const s=this.sounds.get(id)||{volume:this.groupVolume};s.playing=true;this.sounds.set(id,s);this.plays++;queueMicrotask(()=>this.emit('play',id));return id;}
 playing(id){return this.sounds.get(id)?.playing??false;}
 pause(id){if(this.sounds.has(id))this.sounds.get(id).playing=false;return this;}
 stop(id){for(const [key,s] of this.sounds)if(id===undefined||id===key){s.playing=false;this.emit('stop',key);}return this;}
 volume(value,id){if(value===undefined)return this.groupVolume;if(arguments.length===1&&value>1)return this.sounds.get(value)?.volume??this.groupVolume;
 if(id!==undefined){this.sounds.get(id).volume=value;this.sounds.get(id).fade=null;}else{this.groupVolume=value;for(const s of this.sounds.values())s.volume=value;}return this;}
 fade(from,to,ms,id){assert.equal(ms,650);assert(from>=0&&from<=1);assert(to>=0&&to<=1);this.fadeCalls.push({from,to,ms,id});this.sounds.get(id).fade={from,to};return this;}
 rate(){return this;}stereo(){return this;}  /* Oct 19: pitch variation + panning */
 finishFade(id){const s=this.sounds.get(id);if(!s.fade)return;s.volume=s.fade.to;s.fade=null;this.emit('fade',id);}
}
globalThis.Howl=MockHowl;globalThis.Howler={ctx,masterGain:master};
globalThis.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
/* Oct 19: sound.js runs its own music fades on setInterval (Oct 17); fake timers so fades finish and the test exits */const timers=new Map();let timerId=0;globalThis.setInterval=fn=>{timers.set(++timerId,fn);return timerId;};globalThis.clearInterval=id=>timers.delete(id);
const flush=()=>Promise.resolve();
const fades=()=>{clock+=1000;for(const fn of [...timers.values()])fn();};

test('Howler audio retains quiet mix, independent volumes, async gating, bounded voices and lifecycle',async()=>{
 for(const file of Object.values(SOUND_FILES))assert(fs.statSync(new URL('../dist/assets/audio/'+file,import.meta.url)).size>1000);
 saved.set('veyrath-audio-v2',JSON.stringify({background:.9,fx:.9}));
 const audio=new CombatSound();assert.equal(audio.background,.5);assert.equal(audio.fx,.5);assert(instances.every(h=>h.plays===0));
 assert(instances.every(h=>h.options.volume===0&&h.options.src[0].startsWith('assets/audio/')));
 assert(Object.values(audio.music).every(m=>m.howl.options.preload===false&&m.howl.loadCalls===0));
 audio.setState({paused:false});audio.unlock();await flush();fades(audio);
 assert(Object.values(audio.music).every(m=>m.howl.loadCalls===1),'stream loading begins only on unlock');
 const bg=audio.music.background,enc=audio.music.encounter;
 assert.equal(bg.howl.volume(bg.id),gainFor(.5));assert(bg.howl.playing(bg.id));assert.equal(enc.id,null);
 audio.setState({encounter:true});await flush();fades(audio);
 assert(bg.howl.playing(bg.id)&&enc.howl.playing(enc.id));assert.equal(bg.howl.plays,1);assert.equal(enc.howl.volume(enc.id),gainFor(.5));
 audio.setState({encounter:false});audio.setState({encounter:true});fades(audio);assert(enc.howl.playing(enc.id),'stale fade must not pause renewed encounter');
 audio.setVolume('background',.03);assert.equal(bg.howl.volume(bg.id),gainFor(.03));assert.equal(enc.howl.volume(enc.id),gainFor(.03));
 audio.setState({paused:true});fades(audio);assert.equal(bg.howl.volume(bg.id),gainFor(.03)*.65);
 for(let i=1;i<=3;i++)audio.play('sword'+i);await flush();assert.equal(audio.voices.length,1,'all sword cues share one voice');assert.equal(audio.voices[0].kind,'sword3');
 audio.play('damage');audio.play('damage');assert.equal(audio.templates.damage.plays,1,'damage throttle');
 audio.play('enemyDeath');audio.play('gameover');audio.play('rumble');await flush();assert.equal(audio.voices.length,5);/* sword3, damage, enemyDeath, gameover, rumble (cap 10 since Oct 19) */
 assert(audio.voices.filter(v=>v.howl).every(v=>v.howl.volume(v.id)<=gainFor(.5)+1e-9));
 audio.setVolume('fx',.05);assert(audio.voices.filter(v=>v.howl).every(v=>v.howl.volume(v.id)<=gainFor(.05)*.75+1e-9));assert.equal(audio.synthBus.output,master);assert.equal(audio.synthBus.gain.value,gainFor(.05));
 audio.setState({hidden:true});await flush();assert.equal(audio.voices.length,0);assert(!bg.howl.playing(bg.id)&&!enc.howl.playing(enc.id));assert.equal(bg.howl.volume(bg.id),0);
 audio.setState({hidden:false,paused:false});await flush();fades(audio);assert(bg.howl.playing(bg.id));
 const deaths=audio.templates.gameover.plays;audio.setState({dead:true});audio.setState({dead:true});await flush();assert.equal(audio.templates.gameover.plays,deaths+1);assert(!bg.howl.playing(bg.id));
 audio.play('sword1');assert.equal(audio.voices.length,1);audio.restart();await flush();fades(audio);assert(!audio.state.dead);assert(bg.howl.playing(bg.id));
 audio.setVolume('background',0);assert(!bg.howl.playing(bg.id));audio.setVolume('fx',0);audio.play('damage');assert.equal(audio.voices.length,0);
 const restored=new CombatSound();assert.equal(restored.background,0);assert.equal(restored.fx,0);
});

test('music loading cannot replay stale active/fade instructions after hide or death',async()=>{
 saved.clear();const audio=new CombatSound();for(const m of Object.values(audio.music))m.howl.loaded=false;
 audio.unlock();audio.setState({encounter:true});audio.setState({hidden:true,dead:true});
 for(const m of Object.values(audio.music)){assert.equal(m.id,null);m.howl.loaded=true;m.howl.emit('load');assert.equal(m.howl.plays,0);}
 audio.setState({dead:false,hidden:false,encounter:false,paused:false});await flush();fades(audio);
 assert(audio.music.background.howl.playing(audio.music.background.id));assert.equal(audio.music.encounter.id,null);
 // A queued FX play callback arriving after hide is stopped, not revived.
 clock+=300;audio.play('damage');const id=audio.templates.damage.sounds.keys().next().value;
 audio.setState({hidden:true});await flush();assert(!audio.templates.damage.playing(id));
});

