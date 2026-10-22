// Optional WebGL post-processing (user-approved Oct 15, "Option 1"). The game still renders everything
// to the 2D #world canvas; each frame that canvas is uploaded as a texture and drawn by PixiJS through
// GPU filters onto an overlay canvas: threshold bloom (only near-white hot cores/sparks/flashes glow; the
// sand stays below threshold), screen-space shockwave distortion on heavy impacts, and a light colour
// grade. Loaded lazily from game.js; if WebGL or loading fails the 2D canvas is simply left visible.
// 'pixi.js' resolves through the import map in index.html so pixi-filters shares the same Pixi instance.
import * as PIXI from 'pixi.js';
import {AdvancedBloomFilter,ShockwaveFilter,AdjustmentFilter} from './vendor/pixi-filters-6.1.4.mjs';

// Impact kinds (mage + warrior effect records) that ripple the screen. amp in device px at 1x.
const SHOCK={bloom:{amp:12,radius:260},boulder:{amp:10,radius:220},surge:{amp:14,radius:300},glacial:{amp:12,radius:260},qnova:{amp:12,radius:320},zap:{amp:8,radius:200},
 stomp:{amp:28,radius:460},earthbreaker:{amp:20,radius:420},rune:{amp:20,radius:360},charge:{amp:14,radius:300},cry:{amp:16,radius:420},sunder:{amp:12,radius:260},barrier:{amp:12,radius:280},overload:{amp:10,radius:300},carnage:{amp:6,radius:220}};
const MAX_WAVES=4;
export const POST_DEFAULTS={threshold:.84,bloomScale:.68,brightness:1,blur:6,saturation:1.08,contrast:1.04};

function shockFor(e){if(['bloodlust','wrath','bastion','overload'].includes(e.kind)&&e.activation)return e.kind==='wrath'?{amp:26,radius:520}:{amp:16,radius:380};
 const s=SHOCK[e.kind];if(!s)return null;
 if(e.kind==='surge')return e.big?{amp:34,radius:620}:(e.scale??1)<.6?{amp:6,radius:160}:s;
 if(e.kind==='glacial'&&(e.scale??1)<.6)return {amp:5,radius:140};
 if(e.kind==='zap'&&(e.radius??0)<80)return {amp:4,radius:110};
 return s;}

export async function createPostFx(source){
 const app=new PIXI.Application();
 await app.init({width:source.width,height:source.height,resolution:1,antialias:false,autoStart:false,preference:'webgl',backgroundColor:0x000000,powerPreference:'high-performance'});
 const view=app.canvas;view.className='post-fx';Object.assign(view.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100dvh',pointerEvents:'none'});
 source.after(view);
 let texture=PIXI.Texture.from(source),sprite=new PIXI.Sprite(texture);app.stage.addChild(sprite);
 const bloom=new AdvancedBloomFilter({threshold:POST_DEFAULTS.threshold,bloomScale:POST_DEFAULTS.bloomScale,brightness:POST_DEFAULTS.brightness,blur:POST_DEFAULTS.blur,quality:5});
 const grade=new AdjustmentFilter({saturation:POST_DEFAULTS.saturation,contrast:POST_DEFAULTS.contrast});
 const waves=[];let enabled=false,size=[source.width,source.height];
 function rebuildTexture(){texture.destroy(true);texture=PIXI.Texture.from(source);sprite.texture=texture;app.renderer.resize(source.width,source.height);size=[source.width,source.height];}
 function applyFilters(){sprite.filters=[...waves.map(w=>w.filter),bloom,grade];}
 applyFilters();
 return {
  get enabled(){return enabled;},
  setEnabled(on){enabled=!!on;view.style.display=enabled?'block':'none';},
  setQuality(q){try{bloom.quality=q.bloomQuality;bloom.blur=q.blur;}catch{}},
  tune(o){for(const k of ['threshold','bloomScale','brightness','blur'])if(o[k]!=null)bloom[k]=o[k];if(o.saturation!=null)grade.saturation=o.saturation;if(o.contrast!=null)grade.contrast=o.contrast;},
  frame(dt,{toScreen,sources=[],scale=1}={}){
   if(!enabled)return;
   if(source.width!==size[0]||source.height!==size[1])rebuildTexture();
   // New heavy impacts spawn a shockwave once; centre is the impact's screen position.
   for(const s of sources)for(const e of s.effects??[]){if(e.postShock||e.age>.1)continue;e.postShock=true;const cfg=shockFor(e);if(!cfg||e.x==null||!toScreen)continue;
    if(waves.length>=MAX_WAVES){waves.shift().filter.destroy();}
    const c=toScreen(e.x,e.y-10),filter=new ShockwaveFilter({center:{x:c.x,y:c.y},amplitude:cfg.amp*scale,wavelength:110*scale,speed:900*scale,brightness:1.12,radius:cfg.radius*scale,time:0});
    waves.push({filter,life:cfg.radius/900+.15});applyFilters();}
   let changed=false;for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.filter.time+=dt;if(w.filter.time>=w.life){w.filter.destroy();waves.splice(i,1);changed=true;}}
   if(changed)applyFilters();
   texture.source.update();app.render();
  }
 };
}
