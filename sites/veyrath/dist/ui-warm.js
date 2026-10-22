// Oct 19 (user: cards/panels "delayed a little and then come in" on the live Site): every UI image referenced by the
// stylesheets and page is downloaded in the background once the title screen is up, so the first level-up card,
// reward panel or menu doesn't wait on the host's per-file redirect. Skipped on localhost.
// Oct 19 fix (user: menu fps "great, then ____ of low fps, then great"): the first version decoded and kept every
// image (~150 MB of bitmaps) while the menu ran. Now it only fetches the bytes into the HTTP/service-worker cache:
// two at a time, low priority, in idle time, nothing decoded or held in memory. Display-time decode stays the browser's.
export function warmUI(){
 if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||warmUI.done)return;warmUI.done=true;
 const urls=new Set();
 const fromText=(text,base)=>{for(const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)){const v=m[1];if(v.startsWith('data:'))continue;try{const u=new URL(v,base);if(u.origin===location.origin&&/\.(png|webp|jpe?g|svg|gif)$/i.test(u.pathname))urls.add(u.href);}catch{}}};
 /* style rules carry an (often empty) nested cssRules list in current Chrome, so read their declarations and recurse separately */
 const walk=(rules,base)=>{for(const rule of rules){if(rule.cssRules?.length)walk(rule.cssRules,base);const t=rule.style?.cssText??'';if(t.includes('url('))fromText(t,base);}};
 for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules;}catch{continue;}walk(rules,sheet.href??location.href);}
 const queue=[...urls],idle=globalThis.requestIdleCallback??(f=>setTimeout(f,200));let active=0;
 const next=()=>{while(active<2&&queue.length){const src=queue.shift();active++;
  fetch(src,{priority:'low',credentials:'same-origin'}).then(r=>r.arrayBuffer()).catch(()=>{}).finally(()=>{active--;idle(next,{timeout:2000});});}};
 idle(next,{timeout:2000});return queue.length;
}
// Oct 21 (user: Site/launcher "laggy sometimes", local runs perfectly): enemy/prop sheets, boss HD strips and ground
// tiles are lazy-loaded on first use, so on the host the first sight of each one waited on a network round trip mid-fight.
// From the title screen every one of them is now fetched in the background (bytes only, into the service-worker cache,
// using the exact URLs the game requests later). Files already in that cache are skipped, so later launches download
// nothing. Decode still happens on first use (createImageBitmap is off the main thread). Skipped on localhost.
export async function warmAssets(manifest,tag){
 if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||warmAssets.done||!manifest)return;warmAssets.done=true;
 const urls=[],v=u=>u+(u.includes('?')?'':'?v='+tag);
 for(const group of [manifest.sheets,manifest.props])for(const e of Object.values(group??{}))if(e?.url)urls.push(v(e.url));
 for(const [key,hd] of Object.entries(manifest))if(key.endsWith('HD')&&hd?.anims)for(const a of Object.keys(hd.anims))for(const r of hd.rows??[])urls.push(v('assets/'+key.slice(0,-2)+'/'+a+'_'+r+'.webp'));
 try{const g=await fetch('maps/ground.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null);if(g)for(let y=0;y<g.rows;y++)for(let x=0;x<g.cols;x++)urls.push(`maps/ground/${x}_${y}.webp?s=${g.signature}`);}catch{}
 const cache=globalThis.caches?await caches.open('le-assets-v1').catch(()=>null):null;
 const PATH=/^\/(?:__releases\/[a-f0-9]+\/)?((?:assets|maps)\/.+)$/,idle=globalThis.requestIdleCallback??(f=>setTimeout(f,100));
 const cached=async href=>{if(!cache)return false;const u=new URL(href,document.baseURI),m=u.pathname.match(PATH);return !!(m&&await cache.match(location.origin+'/'+m[1]+u.search));};
 let i=0,active=0;
 const next=()=>{while(active<3&&i<urls.length){const src=urls[i++];active++;
  cached(src).then(hit=>hit?null:fetch(src,{priority:'low',credentials:'same-origin'}).then(r=>r.arrayBuffer())).catch(()=>{}).finally(()=>{active--;idle(next,{timeout:1000});});}};
 next();return urls.length;
}
