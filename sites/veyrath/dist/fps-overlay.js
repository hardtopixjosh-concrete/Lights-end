// Player-facing performance overlay (Oct 15): FPS, frame time (avg / worst), dropped frames and a frame-time graph,
// so players can tell whether the game is actually dropping frames. Toggled from the Menu or with F3; preference
// persists per browser. A "drop" is a frame that took longer than 1.5x the display's normal refresh interval
// (estimated from recent frames, so 60/120/144 Hz screens are judged fairly). CPU ms = update+render JS time:
// Unmeasured interval time includes browser scheduling/rendering and is not proof of a GPU bottleneck.
// Spike recorder (stutter batch): every long frame is logged with where its time went (game update, drawing,
// post-processing, or outside the game's JS = GC / browser / GPU), always on so "Copy performance report" works
// even when the overlay is hidden.
const KEY='veyrath.fps',N=150,MAX_SPIKES=25;
function cause(s){const js=s.update+s.render+s.post;if(s.gc&&s.outside>js)return 'unattributed delay (heap drop observed)';if(s.render>=s.ms*.5)return 'drawing (image decode / heavy draw)';if(s.update>=s.ms*.5)return 'game logic';if(s.post>=s.ms*.5)return 'post-processing';return 'unattributed delay (browser / scheduling / GPU)';}
export function createFpsOverlay(){
 const box=document.createElement('div');box.id='fps-overlay';
 box.style.cssText='position:fixed;left:10px;bottom:10px;z-index:60;pointer-events:none;background:rgba(14,11,8,.78);border:1px solid rgba(233,220,198,.18);border-radius:6px;padding:6px 8px;font:12px/1.35 ui-monospace,Consolas,monospace;color:#e9dcc6;min-width:170px;max-width:300px';
 const text=document.createElement('div'),graph=document.createElement('canvas');graph.width=N;graph.height=36;graph.style.cssText='display:block;width:170px;height:36px;margin-top:4px;image-rendering:pixelated';
 box.append(text,graph);document.body.append(box);const g=graph.getContext('2d');
 const times=new Float32Array(N),cpu=new Float32Array(N);let i=0,count=0,acc=0,refresh=1/60,dropsWin=[],visible=false,spikes=[],lastHeap=0,t0=performance.now(),prevCounters=null;
 try{visible=localStorage.getItem(KEY)==='on';}catch{}
 box.style.display=visible?'block':'none';
 const median=()=>{const n=Math.min(count,N),a=Array.from(times.subarray(0,n)).sort((x,y)=>x-y);return a[n>>1]||1/60;};
 const stats=()=>{const n=Math.min(count,N),last=Math.min(n,Math.max(1,Math.round(1/refresh)));let sum=0,worst=0,c=0;for(let k=1;k<=last;k++){const j=(i-k+N)%N;sum+=times[j];worst=Math.max(worst,times[j]);c+=cpu[j];}return {fps:last/sum,avg:sum/last,worst,cpu:c/last};};
 return {
  get visible(){return visible;},
  setVisible(on){visible=!!on;box.style.display=visible?'block':'none';try{localStorage.setItem(KEY,visible?'on':'off');}catch{}},
  toggle(){this.setVisible(!visible);return visible;},
  frame(elapsed,cpuMs,level,parts){
   if(!(elapsed>0)||elapsed>1)return; // ignore the first frame and tab switches
   times[i]=elapsed;cpu[i]=cpuMs;i=(i+1)%N;count++;
   if(count%30===0)refresh=Math.min(1/30,Math.max(1/240,median()));
   const now=performance.now();if(elapsed>refresh*1.5)dropsWin.push(now);while(dropsWin.length&&now-dropsWin[0]>10000)dropsWin.shift();
   const heap=performance.memory?.usedJSHeapSize??0,gc=lastHeap>0&&heap<lastHeap-2e6;lastHeap=heap;
   if(count>60&&elapsed>Math.max(.045,refresh*2.5)){const p=parts??{update:0,render:cpuMs,post:0},ms=elapsed*1000;
    const s={at:+((now-t0)/1000).toFixed(1),ms:+ms.toFixed(0),update:+p.update.toFixed(1),render:+p.render.toFixed(1),post:+p.post.toFixed(1),outside:+Math.max(0,ms-cpuMs).toFixed(0),gc};s.cause=cause(s);s.c=p.counters;s.prev=prevCounters;spikes.push(s);if(spikes.length>MAX_SPIKES)spikes.shift();}
   prevCounters=parts?.counters??null;
   if(!visible)return;
   acc+=elapsed;if(acc>=.25){acc=0;const st=stats(),d=dropsWin.length,status=st.fps<40||d>40?['Laggy','#ff7a6a']:d>8||st.fps<Math.round(1/refresh)*.85?['Some drops','#ffc36a']:['Smooth','#8fe08a'];
    const sp=spikes[spikes.length-1],spike=sp&&now-t0-sp.at*1000<15000?`<br><span style="color:#ffc36a">last spike ${sp.ms} ms: ${sp.cause}</span><br>update ${sp.update} · draw ${sp.render} · post ${sp.post} · outside ${sp.outside}`:'';
    text.innerHTML=`<b style="color:${status[1]}">${Math.round(st.fps)} FPS</b> · ${status[0]}<br>frame ${(st.avg*1000).toFixed(1)} ms · worst ${(st.worst*1000).toFixed(0)} ms<br>drops ${d} / 10s · cpu ${st.cpu.toFixed(1)} ms<br>observed cadence ${Math.round(1/refresh)} Hz · quality ${level??'-'}${spike}${this.network?.()?'<br>'+this.network():''}`;}
   // Graph: one bar per frame, scaled so 50 ms fills the height; red = dropped frame, dashed line = refresh interval.
   g.clearRect(0,0,N,36);const n=Math.min(count,N);
   for(let k=0;k<n;k++){const j=(i-n+k+N)%N,t=times[j],h=Math.min(36,t/.05*36);g.fillStyle=t>refresh*1.5?'#ff5a4a':'#8fe08a';g.fillRect(N-n+k,36-h,1,h);}
   g.fillStyle='rgba(255,255,255,.35)';const y=36-refresh/.05*36;for(let x=0;x<N;x+=4)g.fillRect(x,y,2,1);
  },
  // Plain-text report a player can paste to the developer.
  report(extra={}){const st=stats(),nav=navigator;let gpu='?';try{const gl=document.createElement('canvas').getContext('webgl');const ext=gl.getExtension('WEBGL_debug_renderer_info');gpu=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
   const fc=c=>c?`imgs ${c.images} (${c.imageMB}MB) new ${c.firstDraws} (${c.firstMB}MB) tint+${c.tintCells} vfx ${c.vfxPrims}p/${c.vfxFlushes}f enemies ${c.enemies}${c.hurt?' HURT':''}\n        slowest: ${c.sections??'not recorded'} | ${c.api??'not recorded'}`:'-';const lines=[
   "Light's End performance report · reporter fx-96",
   'Timing: callback-start intervals paired with preceding callback work; unmeasured time is not a diagnosis. Cadence is not monitor refresh. Image MB estimates source size, not GPU memory.',
   `gpu: ${gpu}`,
   `browser: ${nav.userAgent}`,
   `screen: ${screen.width}x${screen.height} @${devicePixelRatio}x · observed cadence ~${Math.round(1/refresh)} Hz · cores ${nav.hardwareConcurrency??'?'} · memory ${nav.deviceMemory??'?'} GB`,
   `settings: ${JSON.stringify(extra)}`,
   `now: ${Math.round(st.fps)} fps · avg ${(st.avg*1000).toFixed(1)} ms · worst ${(st.worst*1000).toFixed(0)} ms · cpu ${st.cpu.toFixed(1)} ms · drops ${dropsWin.length}/10s · session ${((performance.now()-t0)/1000).toFixed(0)}s`,
   `spikes (${spikes.length}, newest last; times in ms):`,
   ...spikes.map(s=>`  t=${s.at}s ${s.ms}ms · ${s.cause} · update ${s.update} draw ${s.render} post ${s.post} outside ${s.outside}${s.gc?' · heap dropped':''}\n      interval work: ${fc(s.c)}\n      earlier work: ${fc(s.prev)}`)];
   return lines.join('\n');}
 };
}
