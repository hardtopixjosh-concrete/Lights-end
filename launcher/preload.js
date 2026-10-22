// The only bridge between the game page and the launcher: a small Steam API on window.veyrathSteam.
// No Node or file access reaches the page; main.js also checks every request comes from the game's own site.
const {contextBridge,ipcRenderer}=require('electron');
const on=(ch,fn)=>{const h=(_e,v)=>fn(v);ipcRenderer.on(ch,h);return ()=>ipcRenderer.removeListener(ch,h);};
contextBridge.exposeInMainWorld('veyrathSteam',{
  status:()=>ipcRenderer.invoke('steam:status'),
  host:opts=>ipcRenderer.invoke('steam:host',opts),
  join:opts=>ipcRenderer.invoke('steam:join',opts),
  leave:()=>ipcRenderer.invoke('steam:leave'),
  invite:()=>ipcRenderer.invoke('steam:invite'),
  lobby:()=>ipcRenderer.invoke('steam:lobby'),
  send:(to,msg,reliable=true)=>ipcRenderer.send('steam:send',to,msg,reliable),
  broadcast:(msg,reliable=true)=>ipcRenderer.send('steam:broadcast',msg,reliable),
  onPacket:fn=>on('steam:packet',fn),
  onLobby:fn=>on('steam:lobby',fn),
  onInvite:fn=>on('steam:invite',fn),
  reload:()=>ipcRenderer.send('app:reload'),
});
