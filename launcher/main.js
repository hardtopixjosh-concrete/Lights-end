// VEYRATH alpha launcher (Oct 17, user: Steam co-op route, see docs/reference/decisions.md).
// Loads the live Sites build in a desktop window (publish → "Reload latest build" keeps the fast loop) and gives the game a
// small Steam API through preload.js: lobbies, invites and P2P messages. Steam runs only in this main process.
// App ID: Valve's Spacewar test app (480) until VEYRATH has its own; override with STEAM_APP_ID.
const {app,BrowserWindow,ipcMain,shell,Menu}=require('electron');
const path=require('path');

const SITE=process.env.VEYRATH_URL||'https://veyrath-desert-roguelite.jestudios.chatgpt.site/';
const ORIGIN=new URL(SITE).origin;
const APP_ID=Number(process.env.STEAM_APP_ID||480);
const LAUNCHER_VERSION=require('./package.json').version;

// Dev-only local two-player test without Steam (see loopback.js).
if(process.env.VEYRATH_LOOPBACK){require('./loopback.js')({app,BrowserWindow,ipcMain,path,SITE,show:process.env.VEYRATH_LOOPBACK!=='1',offscreen:process.env.VEYRATH_LOOPBACK==='offscreen'});return;}
let steamworks=null,client=null,steamError=null;
try{steamworks=require('steamworks.js');client=steamworks.init(APP_ID);steamworks.electronEnableSteamOverlay();}
catch(e){steamError=String(e?.message||e);}  // Steam not running / not logged in: the game still runs, co-op is off

let win=null,lobby=null,pendingJoin=null;
const S=id=>String(id);                        // Steam IDs are 64-bit: always cross IPC as strings
const fromOwnSite=e=>{try{return new URL(e.senderFrame.url).origin===ORIGIN;}catch{return false;}};
const send=(ch,v)=>{if(win&&!win.isDestroyed())win.webContents.send(ch,v);};
const me=()=>client?S(client.localplayer.getSteamId().steamId64):null;
const members=()=>lobby?lobby.getMembers().map(m=>S(m.steamId64)):[];
function lobbyInfo(){if(!lobby)return null;return {id:S(lobby.id),code:lobby.id.toString(36).toUpperCase(),owner:S(lobby.getOwner().steamId64),members:members(),data:lobby.getFullData()};}
function codeToId(code){const c=String(code).trim().toLowerCase();if(/^\d{15,20}$/.test(c))return BigInt(c);let n=0n;for(const ch of c){const d=parseInt(ch,36);if(Number.isNaN(d))throw new Error('Bad join code');n=n*36n+BigInt(d);}return n;}

const latest=()=>{const u=new URL(SITE);u.searchParams.set('launch',Date.now().toString(36));return u.toString();};
function loadLatest(){win.loadURL(latest());}
function createWindow(){
  win=new BrowserWindow({show:!process.env.VEYRATH_SELFTEST,width:1600,height:900,backgroundColor:'#05070f',title:"Light's End (alpha)",autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  // Stay on the game's own site; other links open in the normal browser.
  win.webContents.on('will-navigate',(e,url)=>{if(new URL(url).origin!==ORIGIN){e.preventDefault();if(url.startsWith('https:'))shell.openExternal(url);}});
  win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https:'))shell.openExternal(url);return {action:'deny'};});
  // A reload (F5) starts a fresh page: leave the old lobby, which still carries the previous build tag (user hit this: host on fx-166
  // after reloading to fx-167). Also add a cache-buster so Sites' servers hand out the newest page right after a publish.
  win.webContents.on('did-start-navigation',(e,url,inPlace,mainFrame)=>{if((e.isMainFrame??mainFrame)&&!(e.isSameDocument??inPlace))leaveLobby();});
  loadLatest();
  // VEYRATH_SELFTEST=1: hidden boot check (page loads, Steam bridge present, co-op slot rendered), then quit.
  const errors=[];if(process.env.VEYRATH_SELFTEST)win.webContents.on('console-message',(e,level,msg)=>{if((e.level??level)==='error'||level===3)errors.push(String(e.message??msg).slice(0,300));});
  // VEYRATH_SELFTEST=run (needs ?debug): start a run, add a mage bot, let it play, then measure a real snapshot.
  // VEYRATH_SELFTEST=eval with VEYRATH_EVAL='[[delayMs,"js"],...]': run debug steps in order and print each result.
  if(process.env.VEYRATH_SELFTEST==='eval')win.webContents.on('did-finish-load',()=>setTimeout(async()=>{for(const [ms,js] of JSON.parse(process.env.VEYRATH_EVAL||'[]')){await new Promise(r=>setTimeout(r,ms));console.log('EVAL '+js.slice(0,40)+' => '+JSON.stringify(await win.webContents.executeJavaScript(js).catch(e=>'ERR '+e)));}console.log('EVAL errors='+JSON.stringify(errors.slice(0,8)));app.quit();},4000));
  else   if(process.env.VEYRATH_SELFTEST==='run')win.webContents.on('did-finish-load',()=>setTimeout(async()=>{const js=s=>win.webContents.executeJavaScript(s).catch(e=>'ERR '+e);
    console.log('RUN start='+await js('veyrathDebug.start()'));await new Promise(r=>setTimeout(r,2000));console.log('RUN bot='+await js("veyrathDebug.addBotKit('mage')"));
    await js('veyrathDebug.skipTo(300)');await new Promise(r=>setTimeout(r,12000));console.log('RUN snap='+JSON.stringify(await js('veyrathDebug.netSnap()')));console.log('RUN errors='+JSON.stringify(errors.slice(0,8)));app.quit();},5000));
  else   if(process.env.VEYRATH_SELFTEST)win.webContents.on('did-finish-load',()=>setTimeout(async()=>{
    const page=await win.webContents.executeJavaScript("JSON.stringify({bridge:typeof window.veyrathSteam,slot:!!document.querySelector('.net-box'),title:document.title})").catch(e=>String(e));
    console.log('SELFTEST steam='+(client?'ok':'off ('+steamError+')')+' page='+page+' errors='+JSON.stringify(errors.slice(0,5)));app.quit();},4000));
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Game',submenu:[
    {label:'Reload latest build',accelerator:'F5',click:()=>{loadLatest();}},
    {label:'Reload latest build',accelerator:'CmdOrCtrl+R',visible:false,click:()=>{loadLatest();}},
    {label:'Toggle full screen',accelerator:'F11',click:()=>win.setFullScreen(!win.isFullScreen())},
    {label:'Developer tools',accelerator:'CmdOrCtrl+Shift+I',click:()=>win.webContents.toggleDevTools()},
    {type:'separator'},{role:'quit'}]}]));
}

// ---- Steam bridge (each handler checks the request comes from the game's own site) ----
ipcMain.handle('steam:status',e=>{if(!fromOwnSite(e))return null;
  return {ok:!!client,error:steamError,appId:APP_ID,launcher:LAUNCHER_VERSION,steamId:me(),name:client?client.localplayer.getName():null,lobby:lobbyInfo(),pendingJoin:pendingJoin?S(pendingJoin):null};});
ipcMain.handle('steam:host',async(e,{max=5,build=''}={})=>{if(!fromOwnSite(e)||!client)return {error:steamError||'Steam is not available'};
  leaveLobby();lobby=await client.matchmaking.createLobby(1/*FriendsOnly*/,Math.max(2,Math.min(5,max|0)));
  lobby.mergeFullData({game:'veyrath',build:String(build),host:client.localplayer.getName()});
  return lobbyInfo();});
ipcMain.handle('steam:join',async(e,{code,build=''}={})=>{if(!fromOwnSite(e)||!client)return {error:steamError||'Steam is not available'};
  let id;try{id=code?codeToId(code):pendingJoin;}catch(err){return {error:err.message};}if(!id)return {error:'No join code'};
  leaveLobby();try{lobby=await client.matchmaking.joinLobby(id);}catch(err){return {error:'Could not join that lobby'};}pendingJoin=null;
  const d=lobby.getFullData();
  if(d.game!=='veyrath'){leaveLobby();return {error:'That is not a VEYRATH lobby'};}
  if(build&&d.build&&d.build!==String(build)){const theirs=d.build;leaveLobby();return {error:'Different game version (host: '+theirs+', you: '+build+'). Both press F5 to reload the latest build.'};}
  return lobbyInfo();});
ipcMain.handle('steam:leave',e=>{if(fromOwnSite(e))leaveLobby();return true;});
ipcMain.handle('steam:invite',e=>{if(!fromOwnSite(e)||!lobby)return false;try{client.overlay.activateInviteDialog(lobby.id);}catch{lobby.openInviteDialog();}return true;});
ipcMain.handle('steam:lobby',e=>fromOwnSite(e)?lobbyInfo():null);
// P2P messages: strings (JSON) for now. Reliable for events, unreliable (<1200 bytes) for fast state.
function sendTo(id,msg,reliable){try{return client.networking.sendP2PPacket(BigInt(id),reliable===false?1:2,Buffer.from(String(msg)));}catch{return false;}}
ipcMain.on('steam:send',(e,to,msg,reliable)=>{if(fromOwnSite(e)&&client&&lobby&&members().includes(String(to)))sendTo(to,msg,reliable);});
ipcMain.on('steam:broadcast',(e,msg,reliable)=>{if(!fromOwnSite(e)||!client||!lobby)return;const self=me();for(const id of members())if(id!==self)sendTo(id,msg,reliable);});
ipcMain.on('app:reload',e=>{if(fromOwnSite(e))loadLatest();});

function leaveLobby(){if(lobby){try{lobby.leave();}catch{}lobby=null;send('steam:lobby',null);}}

if(client){
  const {SteamCallback}=steamworks;
  // Oct 21 (friend froze on run start, "No packet available"): a session request can arrive before Steam's lobby member list
  // has the sender, and an unaccepted session leaves its packet stuck at the head of the queue (reported available, never
  // readable), blocking every later packet. Accept any request while in a lobby; the pump still drops non-members' packets.
  // Members' sessions are also accepted whenever the lobby changes and whenever a read fails. Problems go to net-log.txt.
  const netLog=(...a)=>{try{require('fs').appendFileSync(path.join(app.getPath('userData'),'net-log.txt'),new Date().toISOString()+' '+a.join(' ')+'\n');}catch{}};
  const acceptAll=()=>{const self=me();for(const id of members())if(id!==self)try{client.networking.acceptP2PSession(BigInt(id));}catch{}};
  client.callback.register(SteamCallback.P2PSessionRequest,({remote})=>{netLog('session-request',S(remote),lobby?'accepted':'ignored (no lobby)');if(lobby)client.networking.acceptP2PSession(remote);});
  client.callback.register(SteamCallback.P2PSessionConnectFail,({remote,error})=>netLog('connect-fail',S(remote),'error',error));
  client.callback.register(SteamCallback.LobbyChatUpdate,({lobby:l})=>{if(lobby&&S(l)===S(lobby.id)){acceptAll();send('steam:lobby',lobbyInfo());}});
  client.callback.register(SteamCallback.LobbyDataUpdate,({lobby:l})=>{if(lobby&&S(l)===S(lobby.id))send('steam:lobby',lobbyInfo());});
  // Accepting a Steam invite (friends list / overlay) while the launcher runs.
  client.callback.register(SteamCallback.GameLobbyJoinRequested,({lobby_steam_id})=>{pendingJoin=lobby_steam_id;send('steam:invite',{lobby:S(lobby_steam_id)});});
  // Packet pump: forward incoming messages to the game.
  let readFails=0;
  setInterval(()=>{try{if(!lobby)return;const allowed=new Set(members()),until=performance.now()+3;let n,count=0;while(count++<128&&performance.now()<until&&(n=client.networking.isP2PPacketAvailable())>0){let p;try{p=client.networking.readP2PPacket(n);}catch(e){readFails++;if(readFails===1||readFails%250===0)netLog('read-fail',n,'bytes x'+readFails,e&&e.message);acceptAll();break;}if(readFails){netLog('read-recovered after',readFails);readFails=0;}if(!p)break;const from=S(p.steamId.steamId64);if(allowed.has(from))send('steam:packet',{from,data:p.data.toString()});}}catch(e){console.warn('p2p poll',e&&e.message);}},4);
}
// Started from a Steam invite while closed: "+connect_lobby <id>".
{const i=process.argv.indexOf('+connect_lobby');if(i>=0&&process.argv[i+1])try{pendingJoin=BigInt(process.argv[i+1]);}catch{}}

app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{leaveLobby();app.quit();});
