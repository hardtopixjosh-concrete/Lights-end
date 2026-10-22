// Oct 17 (user: Steam co-op route, decisions.md). Online co-op step 1: the connection test.
// Inside the desktop launcher (launcher/ folder) the page gets window.veyrathSteam; the lobby's "Invite friend" slot then
// becomes Host / Invite / Join with a live member list and ping over Steam P2P. In a normal browser it explains the launcher.
// Game sync (commands → host, snapshots → everyone) is the next batch and will build on this module's send/receive.
const BUILD=new URL(import.meta.url).searchParams.get('v')??'dev';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};

export function createNet({toast=()=>{}}={}){
  const steam=window.veyrathSteam??null;
  const counters={sentBytes:0,receivedBytes:0,sentPackets:0,receivedPackets:0};const started=performance.now();
  const sendRaw=(to,raw,reliable=true)=>{counters.sentBytes+=raw.length;counters.sentPackets++;steam?.send(to,raw,reliable);};
  const net={available:!!steam,build:BUILD,me:null,myName:'',lobby:null,peers:new Map(),handlers:new Set(),
    get role(){return !this.lobby?'offline':this.lobby.owner===this.me?'host':'client';},
    send(to,msg,reliable=true){sendRaw(to,JSON.stringify(msg),reliable);},
    sendRaw,traffic:()=>({...counters,seconds:Math.round((performance.now()-started)/1000)}),
    broadcast(msg,reliable=true){this.broadcastRaw(JSON.stringify(msg),reliable);},
    broadcastRaw(str,reliable=true){counters.sentBytes+=str.length*this.peers.size;counters.sentPackets+=this.peers.size;steam?.broadcast(str,reliable);},
    onMessage(fn){this.handlers.add(fn);return ()=>this.handlers.delete(fn);},lobbyInfo:()=>({})};
  const slot=document.querySelector('.lb-ally');
  if(!steam){if(slot){slot.title='Online co-op runs in the VEYRATH desktop launcher (Steam)';slot.querySelector('small')?.replaceChildren('Desktop launcher (Steam)');}return net;}

  const peer=id=>{let p=net.peers.get(id);if(!p)net.peers.set(id,p={id,name:'…',build:'',ping:null});return p;};
  function setLobby(info){net.lobby=info;const ids=new Set(info?.members??[]);for(const id of [...net.peers.keys()])if(!ids.has(id))net.peers.delete(id);
    for(const id of ids)if(id!==net.me&&!net.peers.has(id)){peer(id);net.send(id,{t:'hello',name:net.myName,build:BUILD,...net.lobbyInfo()});}render();}
  steam.onLobby(setLobby);
  steam.onPacket(({from,data})=>{if(!net.lobby?.members?.includes(from)||from===net.me||typeof data!=='string'||data.length>1048576)return;let m;try{m=JSON.parse(data);}catch{return;}if(!m||typeof m!=='object'||Array.isArray(m))return;counters.receivedBytes+=data.length;counters.receivedPackets++;const p=peer(from);
    if(m.t==='hello'){const fresh=p.name==='…';p.name=String(m.name??'?').slice(0,32);p.build=String(m.build??'');if(typeof m.cls==='string')p.cls=m.cls.slice(0,12);if(fresh)net.send(from,{t:'hello',name:net.myName,build:BUILD,...net.lobbyInfo()});if(p.build!==BUILD)toast(p.name+' runs a different build ('+p.build+'). Both press F5.','#ff9a6b');render();}
    else if(m.t==='look'){if(typeof m.cls==='string')p.cls=m.cls.slice(0,12);}  // Oct 18: lobby members show each other's hero
    else if(m.t==='ping')net.send(from,{t:'pong',at:m.at},false);
    else if(m.t==='pong'){p.ping=Math.round(performance.now()-m.at);render();}
    for(const fn of net.handlers)fn(m,from);});
  steam.onInvite(()=>join(null));  // accepted a Steam invite while the launcher was open
  setInterval(()=>{if(net.lobby)for(const id of net.peers.keys())net.send(id,{t:'ping',at:performance.now()},false);},1000);

  async function host(){const r=await steam.host({max:5,build:BUILD});if(r?.error){toast(r.error,'#ff9a6b');return;}setLobby(r);toast('Lobby open · invite friends or share the code','#9be37a');}
  async function join(code){const r=await steam.join({code,build:BUILD});if(r?.error){toast(r.error,'#ff9a6b');return;}setLobby(r);toast('Joined '+(r.data?.host??'the')+"'s lobby",'#9be37a');}
  async function leave(){await steam.leave();setLobby(null);}

  // ---- UI in the character lobby's ally slot ----
  const box=el('div','net-box');if(slot){slot.classList.add('net-on');slot.title='';slot.replaceChildren(box);}
  function render(){if(!slot)return;box.replaceChildren();
    if(!net.me){box.append(el('b','net-title','CO-OP'),el('small','net-note','Steam not running · start Steam and press F5'));return;}
    box.append(el('b','net-title',net.lobby?(net.role==='host'?'YOUR LOBBY':'IN LOBBY'):'CO-OP'));
    if(!net.lobby){const h=el('button','net-btn','Host co-op');h.onclick=host;const row=el('div','net-row'),inp=el('input','net-code');inp.placeholder='Join code';inp.maxLength=20;inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')join(inp.value);};
      const j=el('button','net-btn small','Join');j.onclick=()=>join(inp.value);row.append(inp,j);box.append(h,row,el('small','net-note','or accept an invite in Steam'));return;}
    const code=el('button','net-code-show',net.lobby.code);code.title='Copy join code';code.onclick=()=>{navigator.clipboard?.writeText(net.lobby.code);toast('Join code copied');};
    const inv=el('button','net-btn','Invite via Steam');inv.onclick=()=>steam.invite();const lv=el('button','net-btn small','Leave');lv.onclick=leave;
    const list=el('ul','net-list');const rd=id=>net.readyIds?.has(id)?' · ready ✓':'';list.append(el('li','me',net.myName+(net.role==='host'?' · host':'')+rd(net.me)));
    for(const p of net.peers.values())list.append(el('li',p.build&&p.build!==BUILD?'bad':'',p.name+(net.lobby.owner===p.id?' · host':'')+(p.ping!=null?' · '+p.ping+' ms':' · connecting…')+rd(p.id)));
    box.append(code,list,inv,lv,el('small','net-note','Build '+BUILD+' · up to 5 players'));}
  steam.status().then(s=>{if(s?.ok){net.me=s.steamId;net.myName=s.name??'You';if(s.lobby)setLobby(s.lobby);if(s.pendingJoin)join(null);}else net.error=s?.error;render();});
  render();net.refresh=render;  /* Oct 21: game.js redraws the list when the ready state changes */
  return net;
}
