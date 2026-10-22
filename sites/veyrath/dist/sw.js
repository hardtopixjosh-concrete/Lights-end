// Oct 19 (user: the live Site feels "a tad delayed", local is smooth): on the host every binary asset is a 307 redirect
// to content storage, and each publish moves the page to a new /__releases/<id>/ base, so after every update each
// image/model/sound pays a ~0.1 s round trip again, and anything shown for the first time waits on the network.
// This worker keeps those files in Cache Storage keyed by their path WITHOUT the release prefix and answers from there
// (stale-while-revalidate: the cached copy is used at once and refreshed in the background, so changed art still
// arrives on the next load). JSON (manifests) and ranged/streamed audio always go to the network.
// Registered by game.js as /sw.js (scope /) only on the hosted Site, never on localhost.
const CACHE='le-assets-v1',PATH=/^\/(?:__releases\/[a-f0-9]+\/)?((?:assets|maps)\/.+)$/;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||r.headers.has('range')||r.destination==='audio'||r.destination==='video')return;
 const u=new URL(r.url),m=u.origin===location.origin&&u.pathname.match(PATH);if(!m||/\.json$/i.test(m[1]))return;
 const key=location.origin+'/'+m[1]+u.search;
 e.respondWith(caches.open(CACHE).then(async c=>{
  const hit=await c.match(key);
  const net=fetch(r.url).then(res=>{if(res.ok)c.put(key,res.clone()).catch(()=>{});return res;});
  if(hit){e.waitUntil(net.catch(()=>{}));return hit;}
  return net;}));
});
