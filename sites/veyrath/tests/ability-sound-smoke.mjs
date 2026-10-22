// Plays every ability recipe through a fake WebAudio context to catch bad node use.
import assert from 'node:assert';
const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param(),Q:param()});
const ctx={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,createBuffer:(c,n)=>({sampleRate:8000,getChannelData:()=>new Float32Array(n)}),resume:async()=>{}};
globalThis.Howl=class{constructor(o){this.src=o?.src?.[0]}on(){}once(){}state(){return 'loaded'}volume(){return 0}play(){return 1}rate(){}playing(){return false}fade(){}pause(){}stop(){}load(){}};globalThis.Howler={ctx};
globalThis.localStorage={getItem:()=>null,setItem(){}};
const {CombatSound,ABILITY_SOUNDS,ABILITY_SAMPLES,gainFor}=await import('../dist/sound.js?v=fx-104');
const s=new CombatSound();s.unlock();
assert.equal(s.fx,.5);assert.equal(s.musicVolume,.15);assert.equal(s.background,.5);assert(Math.abs(gainFor(.5)-.151)<.01&&gainFor(1)===.85&&gainFor(0)===0);
const paths={mage:['pyro','cryo','storm','blood'],sword:['berserker','vanguard','spellblade','warlord']};
for(const p of paths.mage)for(const k of ['fireball','nova','chain','meteor'])assert(ABILITY_SOUNDS[p+'-'+k],p+'-'+k);
for(const p of paths.sword)for(const k of ['RMB','Q','E','R'])assert(ABILITY_SOUNDS[p+'-'+k],p+'-'+k);
for(const name of Object.keys(ABILITY_SOUNDS)){s.lastFX={};s.play(name);}
assert(s.voices.length>0&&s.voices.length<=10);  // Oct 19: voice cap 6 -> 10
import {existsSync} from 'node:fs';
for(const [name,count] of Object.entries(ABILITY_SAMPLES))for(let i=0;i<count;i++){const f=new URL('../dist/assets/audio/abilities/'+name+(i?'-'+(i+1):'')+'.mp3',import.meta.url);assert(existsSync(f),f.pathname);}
s.voices=[];s.lastFX={};s.play('pyro-fireball');assert(s.voices[0]?.howl?.src?.includes('pyro-fireball-cast'),'recorded cast used');
s.lastFX={};s.play('pyro-meteor-impact');assert(s.voices.some(v=>v.howl?.src?.includes('pyro-meteor-impact')),'impact sample');
console.log('ability sounds ok:',Object.keys(ABILITY_SOUNDS).length);
