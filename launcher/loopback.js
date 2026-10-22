// Dev-only (Oct 17): two-player co-op on one PC without Steam. VEYRATH_LOOPBACK=1 opens a HOST and a FRIEND window, each with its
// own storage, and a fake Steam bridge (same IPC channels as main.js) that relays lobby and P2P messages between them.
// VEYRATH_LOOP_EVAL='[[delayMs,"h"|"c","js"],...]' runs debug steps in order (h = host window, c = friend window) and prints
// each result; "$PREV" in a step is replaced with the previous result as JSON. Then the app quits.
module.exports=function loopback({app,BrowserWindow,ipcMain,path,SITE,show,offscreen}){
  const log=require('./loopback-log')(process.stdout,()=>app.quit());
  const ORIGIN=new URL(SITE).origin,players=[{id:'7656100000000001',name:'Host (test)'},{id:'7656100000000002',name:'Friend (test)'}],wins=[];let lobby=null;
  const who=e=>wins.findIndex(w=>w.webContents===e.sender);
  const info=()=>lobby&&{id:lobby.id,code:lobby.code,owner:lobby.owner,members:[...lobby.members],data:{...lobby.data}};
  const push=()=>{for(const w of wins)if(!w.isDestroyed())w.webContents.send('steam:lobby',lobby&&lobby.members.has(players[wins.indexOf(w)].id)?info():null);};
  ipcMain.handle('steam:status',e=>{const i=who(e);return {ok:true,appId:0,launcher:'loopback',steamId:players[i].id,name:players[i].name,lobby:lobby?.members.has(players[i].id)?info():null,pendingJoin:null};});
  ipcMain.handle('steam:host',(e,{build=''}={})=>{const i=who(e);lobby={id:'109775240000000001',code:'TEST1',owner:players[i].id,members:new Set([players[i].id]),data:{game:'veyrath',build:String(build),host:players[i].name}};push();return info();});
  ipcMain.handle('steam:join',(e,{code,build=''}={})=>{const i=who(e);if(!lobby||String(code).toUpperCase()!==lobby.code)return {error:'Could not join that lobby'};if(build&&lobby.data.build!==String(build))return {error:'Different game version (host: '+lobby.data.build+', you: '+build+')'};lobby.members.add(players[i].id);push();return info();});
  ipcMain.handle('steam:leave',e=>{const i=who(e);if(lobby){lobby.members.delete(players[i].id);if(!lobby.members.size||lobby.owner===players[i].id)lobby=null;}push();return true;});
  ipcMain.handle('steam:invite',()=>true);ipcMain.handle('steam:lobby',e=>info());
  const pending=[],batchMs=Number(process.env.VEYRATH_LOOP_BATCH_MS)||0;
  const flush=()=>{for(const [j,packet] of pending.splice(0))if(wins[j]&&!wins[j].isDestroyed())wins[j].webContents.send('steam:packet',packet);};
  if(batchMs)setInterval(flush,batchMs);
  // Oct 19: VEYRATH_LOOP_DELAY_MS adds one-way latency (+/- VEYRATH_LOOP_JITTER_MS) per packet, in order, to mimic a real connection.
  const delayMs=Number(process.env.VEYRATH_LOOP_DELAY_MS)||0,jitterMs=Number(process.env.VEYRATH_LOOP_JITTER_MS)||0,lastAt=[0,0];
  const deliverNow=(j,packet)=>{if(wins[j]&&!wins[j].isDestroyed())wins[j].webContents.send('steam:packet',packet);};
  const deliver=(from,to,msg)=>{const j=players.findIndex(p=>p.id===String(to));if(j>=0&&wins[j]&&!wins[j].isDestroyed()){const packet={from,data:String(msg)};if(batchMs)pending.push([j,packet]);
    else if(delayMs){const at=Math.max(lastAt[j],Date.now()+delayMs+(Math.random()*2-1)*jitterMs);lastAt[j]=at;setTimeout(()=>deliverNow(j,packet),at-Date.now());}else deliverNow(j,packet);}};
  // Oct 19: VEYRATH_LOOP_NETSTATS=1 breaks snapshots down by channel and field (bytes), printed when the app quits.
  const NS=process.env.VEYRATH_LOOP_NETSTATS?{n:0,bytes:0,ch:{},keys:{},other:0}:null;
  const NS_AFTER=Date.now()+(Number(process.env.VEYRATH_LOOP_NETSTATS_AFTER)||0);const tally=msg=>{if(!NS||Date.now()<NS_AFTER)return;const s=String(msg);if(!s.startsWith('{"t":"snap"')){NS.other+=s.length;return;}NS.n++;NS.bytes+=s.length;try{const m=JSON.parse(s);
    for(const [c,v] of Object.entries(m.ch||{})){NS.ch[c]=(NS.ch[c]||0)+JSON.stringify(v).length;for(const [,f] of v.d||[])for(const [k,x] of Object.entries(f)){const id=c+'.'+k;NS.keys[id]=(NS.keys[id]||0)+k.length+JSON.stringify(x).length+4;}}
    for(const k of ['s','p','ev'])NS.ch[k]=(NS.ch[k]||0)+JSON.stringify(m[k]).length;
    for(const pl of m.p||[]){NS.keys['p.r']=(NS.keys['p.r']||0)+JSON.stringify(pl.r).length;for(const [part,v] of Object.entries(pl.k||{})){if(v&&typeof v==='object'&&!Array.isArray(v))for(const [k,x] of Object.entries(v)){const id='p.'+part+'.'+k;NS.keys[id]=(NS.keys[id]||0)+k.length+JSON.stringify(x).length+4;}else{const id='p.'+part;NS.keys[id]=(NS.keys[id]||0)+JSON.stringify(v).length;}}}}catch{}};
  if(NS)app.on('before-quit',()=>{const top=Object.entries(NS.keys).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+'='+Math.round(v/NS.n));console.log('NETSTATS snaps='+NS.n+' avgBytes='+Math.round(NS.bytes/Math.max(1,NS.n))+' perChannelAvg='+JSON.stringify(Object.fromEntries(Object.entries(NS.ch).map(([k,v])=>[k,Math.round(v/NS.n)])))+' otherBytes='+NS.other);console.log('NETSTATS topFieldsAvgBytesPerSnap '+top.join(' '));});
  ipcMain.on('steam:send',(e,to,msg)=>{tally(msg);const i=who(e);if(lobby?.members.has(String(to)))deliver(players[i].id,to,msg);});
  ipcMain.on('steam:broadcast',(e,msg)=>{tally(msg);const i=who(e);if(!lobby)return;for(const id of lobby.members)if(id!==players[i].id)deliver(players[i].id,id,msg);});
  ipcMain.on('app:reload',e=>e.sender.reloadIgnoringCache());
  const errors=[[],[]];
  app.whenReady().then(()=>{
    // offscreen: Electron off-screen rendering (no window on screen, but a live 60 fps frame loop).
    for(let i=0;i<2;i++){const w=new BrowserWindow({show:show&&!offscreen,x:i*820,y:40,width:+(process.env.VEYRATH_LOOP_SIZE||'800x600').split('x')[0],height:+(process.env.VEYRATH_LOOP_SIZE||'800x600').split('x')[1],title:i?'FRIEND (test)':'HOST (test)',
      webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:true,backgroundThrottling:false,offscreen:!!offscreen,partition:'persist:loop'+i}});
      if(offscreen)w.webContents.setFrameRate(60);
      w.webContents.on('console-message',(ev,level,msg)=>{if((ev.level??level)==='error'||level===3)errors[i].push(String(ev.message??msg).slice(0,300));});
      w.webContents.session.clearCache().finally(()=>w.loadURL(SITE));wins.push(w);}  // always the files on disk (same ?v tag while developing)
    const steps=JSON.parse(process.env.VEYRATH_LOOP_EVAL||'[]');if(!steps.length)return;
    let ready=0;for(const w of wins)w.webContents.once('did-finish-load',async()=>{if(++ready<2)return;await new Promise(r=>setTimeout(r,4000));let prev=null;
      for(const [ms,side,js] of steps){await new Promise(r=>setTimeout(r,ms));const w2=wins[side==='c'?1:0];const code=js.split('$PREV').join(JSON.stringify(prev));
        if(js.startsWith('SHOT:')){const img=await w2.webContents.capturePage();const file=path.join(process.env.VEYRATH_SHOT_DIR||__dirname,js.slice(5)+'.png');require('fs').writeFileSync(file,img.toPNG());prev=file;log('LOOP '+side+' shot => '+file);continue;}  // screenshot of a test window
        if(js.startsWith('PROFILE:')){const ms=Number(js.slice(8))||3000,d=w2.webContents.debugger;try{d.attach('1.3');}catch{}await d.sendCommand('Profiler.enable');await d.sendCommand('Profiler.setSamplingInterval',{interval:200});await d.sendCommand('Profiler.start');await new Promise(r=>setTimeout(r,ms));const {profile}=await d.sendCommand('Profiler.stop');  // Oct 18: self-time per function (dev perf check)
          const self=new Map(),byId=new Map(profile.nodes.map(n=>[n.id,n]));const dts=profile.timeDeltas;profile.samples.forEach((id,i)=>{const n=byId.get(id),cf=n.callFrame,k=(cf.functionName||'(anon)')+' '+cf.url.split('/').pop().split('?')[0]+':'+cf.lineNumber;self.set(k,(self.get(k)??0)+(dts[i]??0));});
          const tot=[...self.values()].reduce((a,b)=>a+b,0);prev=[...self].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,v])=>(v/tot*100).toFixed(1)+'% '+k).join(String.fromCharCode(10));log('LOOP '+side+' profile '+ms+'ms'+String.fromCharCode(10)+prev);continue;}
        prev=await w2.webContents.executeJavaScript(code).catch(err=>'ERR '+err);log('LOOP '+side+' '+js.slice(0,50)+' => '+JSON.stringify(prev));}
      log('LOOP errors host='+JSON.stringify(errors[0].slice(0,6))+' friend='+JSON.stringify(errors[1].slice(0,6)));app.quit();});
  });
  app.on('window-all-closed',()=>app.quit());
};
