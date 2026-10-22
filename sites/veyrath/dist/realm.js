// Oct 19 (user): the Crimson Tyrant is the realm boss (no longer the 30:00 end boss). Once per run, at a random time
// between 5:00 and 25:00 (progression.js createRealmSchedule), he pulls every player into his sealed realm arena on
// this map (arenas.js 'tyrant-realm'); the world outside stays frozen. Win = everyone returns to where they stood and
// each eligible player gets a personal red weapon; dying there is a normal death. HP scaling and timings are PROPOSALS.
import {realmReady,beginRealm,finishRealm} from './progression.js?v=fx-260';
export const REALM={warn:4,back:3,hp:t=>.25+.75*Math.min(1,t/1740)};
// h: {arena, players(), busy(), place(p,x,y), spawn(arena)} — game.js supplies the world side.
export function tickRealm(r,s,c,dt,h){
 const ev=[],a=h.arena;if(!r||!a||s.dead)return ev;
 if(r.state==='waiting'){
  if(!realmReady(r,s)||h.busy())return ev;
  if(r.warn==null){r.warn=REALM.warn;ev.push({type:'worldNotice',text:'The Crimson Tyrant reaches for you…'},{type:'realmWarn'});}
  if((r.warn-=dt)>0)return ev;
  const ps=h.players();if(!beginRealm(r,s,ps.map(p=>p.owner),{x:a.x,y:a.y}))return ev;
  r.back=ps.map(p=>({id:p.id,x:p.x,y:p.y}));
  ps.forEach((p,i)=>h.place(p,a.x+(i%3-1)*60,a.y+a.radius*.5*.72+Math.floor(i/3)*40));
  const b=h.spawn(a);r.bossId=b.id;s.timeStop={pit:a.id,bossId:b.id};
  ev.push({type:'bossArrival',name:'The Crimson Tyrant',realm:true},{type:'worldNotice',text:"THE TYRANT'S REALM · there is no way out but through him"});return ev;}
 if(r.state==='active'){
  s.timeStop={pit:a.id,bossId:r.bossId};const b=c.targets.find(e=>e.id===r.bossId);
  if(!b||b.state!=='alive'){finishRealm(r,true);r.backT=REALM.back;ev.push({type:'worldNotice',text:'The Tyrant falls · his realm releases you'});}
  return ev;}
 if(r.state==='won'&&r.backT!=null){
  s.timeStop={pit:a.id,bossId:null};
  if((r.backT-=dt)<=0){r.backT=null;s.timeStop=null;for(const p of h.players()){const q=r.back.find(v=>v.id===p.id)??r.back[0];if(q)h.place(p,q.x,q.y);}ev.push({type:'realmReturn'});}}
 return ev;
}
