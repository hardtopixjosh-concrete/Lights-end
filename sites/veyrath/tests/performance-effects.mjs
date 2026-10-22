// Focused repeatable Canvas workload; reported timings are local synthetic measurements, not game FPS.
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
let chromium;try{({chromium}=await import(process.env.VEYRATH_PLAYWRIGHT||'playwright'));}catch{console.log('skipped: Playwright not installed (opt-in benchmark; set VEYRATH_PLAYWRIGHT or npm i playwright)');process.exit(0);}
const tag=process.env.FX_TAG||'fx-96', output=process.env.FX_OUTPUT;
const browser=await chromium.launch({headless:true,...(process.env.VEYRATH_CHROME?{executablePath:process.env.VEYRATH_CHROME}:{})});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.FX_BASELINE)await page.route('**/*.js?v=fx-53',r=>{
  const path=new URL(r.request().url()).pathname.slice(1);
  r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','HEAD:dist/'+path],{encoding:'utf8'})});
 });
 await page.route('**/perf-bench',r=>r.fulfill({contentType:'text/html',body:'<canvas width="1280" height="800"></canvas>'}));
 await page.goto((process.env.VEYRATH_TEST_URL||'http://127.0.0.1:8765')+'/perf-bench');
 const results=await page.evaluate(async({tag,mode})=>{
  const fx=await import('/mage-e-fx.js?v='+tag),elite=await import('/elite-fx.js?v='+tag),quality=await import('/quality.js?v='+tag);
  const q=quality.createQuality();q.setMode(mode);
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
  const hazards=Array.from({length:16},(_,i)=>({kind:'frost',x:140+i%4*310,y:145+Math.floor(i/4)*180,radius:70,age:1.5,warning:.85,duration:4.5,fromX:0,fromY:0,id:i}));
  const particles={efx:[]};for(let i=0;i<300;i++)fx.emit(particles,{kind:i%3===0?'mist':i%3===1?'mote':'spark',x:(i*157)%1280,y:(i*71)%800,z:20,size:i%3===0?22:2,life:1,color:'#a8e6fb',vx:40,vy:10,vz:30,rot:1});
  for(const p of particles.efx)p.life=.5;
  let counts={};const proto=CanvasRenderingContext2D.prototype;
  for(const name of ['createRadialGradient','beginPath','drawImage']){const original=proto[name];proto[name]=function(...a){counts[name]=(counts[name]||0)+1;return original.apply(this,a);};}
  const draw=()=>{ctx.fillStyle='#b09868';ctx.fillRect(0,0,1280,800);elite.drawEliteHazardsFx(ctx,{hazards},1.5);fx.drawParticles(ctx,particles);};
  draw();counts={};const samples=[],submission=[];
  for(let i=0;i<80;i++){await new Promise(requestAnimationFrame);const t=performance.now();draw();submission.push(performance.now()-t);ctx.getImageData(0,0,1,1);samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);submission.sort((a,b)=>a-b);const result={tag,mode,particles:particles.efx.length,medianMs:samples[40],p95Ms:samples[76],submitMedianMs:submission[40],submitP95Ms:submission[76],perFrame:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v/80]))};
  if(tag!=='fx-53'){
   const {setFxView,effectVisible,fxCacheStats}=await import('/effect-cache.js?v='+tag);
   const check=(x,msg)=>{if(!x)throw Error(msg);};
   setFxView({x0:0,y0:0,x1:1280,y1:800});check(effectVisible(20,20,10)&&!effectVisible(2000,2000,20),'effect culling bounds');
   const before=fxCacheStats();for(let i=0;i<10;i++)draw();const after=fxCacheStats();check(after.builds===before.builds,'settled effects must reuse cached surfaces');
   q.setMode('lowest');const pool={};for(let i=0;i<2000;i++)fx.emit(pool,{kind:'mist',life:1});check(pool.efx.length<=quality.gfx.particleCap,'particle cap');
   q.setMode('high');result.cache=after;result.lowestParticleCount=pool.efx.length;
   const sim=await import('/simulation.js?v='+tag),staticProps=Array.from({length:100},(_,i)=>({x:100+i%10*90,y:100+Math.floor(i/10)*65,radius:12}));
   const dynamic=[{x:200,y:230,radius:33}],combined=sim.withDynamicColliders(staticProps,dynamic),plain=[...staticProps,...dynamic];
   for(const r of [3,13,48,64])for(let i=0;i<1000;i++){const x=(i*157)%1200,y=(i*71)%800;check(sim.blocked(x,y,combined,r,true)===sim.blocked(x,y,plain,r,true),'collision equivalence');}
   dynamic[0].x=700;check(sim.blocked(700,230,combined,13,true),'moving collider must update');
   result.collisionComparisons=4000;setFxView(null);
  }
  draw();return result;
 },{tag,mode:process.env.FX_QUALITY||'high'});
 if(output){await page.screenshot({path:output+'.png'});await writeFile(output+'.json',JSON.stringify(results,null,2));}
 if(process.env.FX_INTEGRATION){
  // Test-only access injected into the response; no debug API is shipped in game.js.
  await page.route('**/game.js?*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nglobalThis.__fxSmoke=()=>({survival,combat,mage,warrior,rewards,player,quality,scene});'});});
  await page.addInitScript(()=>{localStorage.setItem('veyrath.quality','lowest');localStorage.setItem('veyrath-postfx','off');localStorage.setItem('veyrath-shader-vfx','off');});
  await page.goto(process.env.VEYRATH_TEST_URL||'http://127.0.0.1:8765');await page.locator('#welcome').waitFor({state:'visible',timeout:60000});
  const warrior=process.env.FX_INTEGRATION==='warrior';
  await page.locator(warrior?'#class-sword':'#class-mage').click();await page.locator('.path-choice').filter({hasText:warrior?'Berserker':'Cryomancer'}).click();await page.locator('#enter').click();
  await page.evaluate(async()=>{
   const {survival:s,combat:c,rewards:r,player:p}=__fxSmoke();
   for(const slot of ['RMB','Q','E','R'])s.skills[s.path+'-spell-'+slot]=1;
   s.hp=s.maxHp=10000;
   const owner=c.targets[0];owner.x=p.x+220;owner.y=p.y;owner.hp=owner.maxHp=100000;owner.modifier='frostbound';owner.role='leader';owner.powerCD=0;
   for(let i=0;i<10;i++)r.hazards.push({kind:'frost',x:p.x+(i%5-2)*60,y:p.y+(Math.floor(i/5)-.5)*70,radius:70,warning:.85,duration:4.5,age:.8,fromX:owner.x,fromY:owner.y,owner:owner.id});
  });
  await page.waitForTimeout(250);
  const exposure=await page.evaluate(()=>{const {survival:s}=__fxSmoke();return {hurt:s.hurt,slow:s.fieldSlow};});
  await page.mouse.move(850,360);await page.keyboard.down('d');await page.mouse.click(850,360,{button:'right'});await page.waitForTimeout(450);
  await page.keyboard.press('q');await page.waitForTimeout(550);await page.keyboard.press('e');await page.waitForTimeout(650);await page.keyboard.up('d');
  const state=await page.evaluate(()=>{const {mage,warrior,rewards:r,survival:s}=__fxSmoke(),m=mage??warrior;return {cooldowns:m.cooldowns,hp:s.hp,hurt:s.hurt,slow:s.fieldSlow,hazards:r.hazards.length,particles:m.efx?.length??0};});
  if(!state.hazards||!exposure.hurt||!exposure.slow)throw Error('Frost hazard damage/slow was not exercised: '+JSON.stringify({state,exposure}));
  if(output)await page.screenshot({path:output+'-game.png'});results.integration={...state,exposure};
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
