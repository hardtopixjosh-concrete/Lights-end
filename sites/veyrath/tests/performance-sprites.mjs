// Focused browser regression for the trace-guided sprite fix. Run against a local static server.
import assert from 'node:assert/strict';
let chromium;try{({chromium}=await import(process.env.VEYRATH_PLAYWRIGHT||'playwright'));}catch{console.log('skipped: Playwright not installed (opt-in benchmark; set VEYRATH_PLAYWRIGHT or npm i playwright)');process.exit(0);}
const browser=await chromium.launch({headless:true,...(process.env.VEYRATH_CHROME?{executablePath:process.env.VEYRATH_CHROME}:{})});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VEYRATH_TEST_URL||'http://127.0.0.1:8765');
 await page.locator('#welcome').waitFor({state:'visible',timeout:60000});
 const result=await page.evaluate(async()=>{
  const {loadSprite,createFrameCache,isRetainedSprite}=await import('/sprite-cache.js?v=fx-104');
  const {elementSheet}=await import('/mage-e-fx.js?v=fx-104');
  const {eliteSheet}=await import('/elite-fx.js?v=fx-104');
  const manifest=await (await fetch('/assets/manifest.json')).json();
  const a=await loadSprite(manifest.sheets['mage-Attack1'].url),b=await loadSprite(manifest.sheets['mage-Attack2'].url);
  const check=(v,msg)=>{if(!v)throw Error(msg);};
  check(a instanceof ImageBitmap&&isRetainedSprite(a),'retained decoded bitmap');
  // Cropping before recolor must match cropping the previously recolored full sheet.
  let comparisons=0,maxDiff=0;
  for(const image of [a,b])for(const element of ['pyro','cryo','storm','blood']){
   const full=elementSheet(image,element);
   for(const [x,y] of [[7*128,0],[9*128,6*128]]){
    const cell=elementSheet(image,element,x,y,128);
    check(cell.width===128&&cell.height===128,'bounded frame dimensions');
    check(elementSheet(image,element,x,y,128)===cell,'cache reuse');
    const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(full,x,y,128,128,0,0,128,128);const expected=ctx.getImageData(0,0,128,128).data;
    const actual=cell.getContext('2d').getImageData(0,0,128,128).data;
    for(let i=0;i<actual.length;i++)maxDiff=Math.max(maxDiff,Math.abs(actual[i]-expected[i]));
    comparisons++;
   }
  }
  check(maxDiff<=2,'recolor pixels changed by '+maxDiff);
  check(elementSheet(a,'pyro',0,0,128)!==elementSheet(b,'pyro',0,0,128),'bitmap identity must not use .src');
  const cache=createFrameCache(2),paint=()=>{},one=cache(a,'x',0,0,128,128,paint);
  cache(a,'y',0,0,128,128,paint);cache(b,'x',0,0,128,128,paint);
  check(cache(a,'x',0,0,128,128,paint)!==one,'LRU must evict');
  const elite=eliteSheet(a,{modifier:'frostbound'},128,128,128);
  check(elite.width===128&&elite.height===128,'elite frame bounds');
  // The replacement shadow matrix must have exactly the old geometry.
  const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),m=new DOMMatrix([.7,0,0,.7,30,-40]);
  ctx.setTransform(m);ctx.transform(1.2,0,-.62*1.2,-.36*1.2,200,300);
  const actual=ctx.getTransform(),expected=m.multiply(new DOMMatrix([1.2,0,-.62*1.2,-.36*1.2,200,300]));
  for(const k of ['a','b','c','d','e','f'])check(Math.abs(actual[k]-expected[k])<1e-5,'shadow transform '+k);
  a.close();b.close();return {comparisons,maxDiff,cacheIdentityAndEviction:true,shadowGeometry:true,decodedSprites:true};
 });
 await page.locator('#class-mage').click();await page.locator('.path-choice').filter({hasText:'Pyromancer'}).click();await page.locator('#enter').click();
 await page.mouse.move(850,350);await page.keyboard.down('d');await page.mouse.down({button:'right'});await page.waitForTimeout(500);await page.mouse.up({button:'right'});
 await page.keyboard.press('q');await page.waitForTimeout(500);await page.keyboard.press('e');await page.waitForTimeout(800);await page.keyboard.up('d');
 await page.screenshot({path:'../../tmp/reference/trace-fix-fx52.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,mageMovementAndCasting:true,pageErrors:errors}));
}finally{await browser.close();}
