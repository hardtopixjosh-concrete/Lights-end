import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createFlow,canSend,sent,acknowledge,validCommand,createInputBatch,batchInput} from '../dist/net-flow.js';
import {createHostSync,hostSnapshot,createClientSync,applySnapshot} from '../dist/net-sync.js';
for(const fps of [30,60,144,240]){const b=createInputBatch();let packets=0,total=0,frames=0;
 for(let i=0;i<fps*10;i++){const steps=batchInput(b,{q:i+1,d:1/fps,m:[1,0],p:[]});if(steps){packets++;for(const s of steps){total+=s.d;frames++;}}}
 total+=b.steps.reduce((n,s)=>n+s.d,0);assert(Math.abs(total-10)<1e-9);assert(packets<=300);console.log(fps+' FPS -> '+packets+' movement packets/10 s; exact duration preserved');
 const edge=batchInput(b,{q:99999,d:1/fps,m:[0,0],p:['rmb']});assert(edge?.at(-1).p.includes('rmb'));}
assert.equal(validCommand({q:1,d:NaN,m:[1,0]}),null);assert.equal(validCommand({q:1,d:.01,m:[Infinity,0]}),null);
assert.equal(validCommand({q:1,d:.01,m:[0,0],a:[NaN,0]}),null);
const normalized=validCommand({q:1,d:.01,m:[4,4],p:['evil','dash']});assert(Math.abs(Math.hypot(...normalized.m)-1)<1e-9);assert.deepEqual(normalized.p,['dash']);
const enemies=Array.from({length:260},(_,id)=>({id,x:100+id,y:200,hp:100,maxHp:100,state:'alive',role:'swarmer'}));
const peers=Array.from({length:4},()=>({H:createHostSync(),C:createClientSync(),f:createFlow(),wire:[],count:0,bytes:0}));
let maxBuild=0;
for(let tick=0;tick<100;tick++){
 for(const e of enemies)e.x++;
 for(let j=0;j<peers.length;j++){const p=peers[j];if(!canSend(p.f))continue;
  const start=performance.now(),raw=hostSnapshot(p.H,{channels:{e:enemies},shared:{level:3},players:[],light:new Set()});maxBuild=Math.max(maxBuild,performance.now()-start);
  const msg=JSON.parse(raw);sent(p.f,msg.n,raw.length);p.wire.push(msg);p.bytes+=raw.length;p.count++;
  if(j!==3&&tick%2===1){for(const m of p.wire.splice(0))applySnapshot(p.C,m);acknowledge(p.f,p.C.n);}
 }
}
assert.equal(peers[3].count,12,'stalled guest bounded to twelve snapshots (Oct 19 window)');assert.equal(peers[0].count,100,'healthy guests unaffected');
const slow=peers[3];for(const m of slow.wire.splice(0))applySnapshot(slow.C,m);assert(acknowledge(slow.f,slow.C.n));assert(!acknowledge(slow.f,999999));
const catchup=JSON.parse(hostSnapshot(slow.H,{channels:{e:enemies},shared:{},players:[],light:new Set()}));applySnapshot(slow.C,catchup);assert.equal(slow.C.arrays.e[0]._tx,enemies[0].x,'baseline remains correct after backpressure');assert(!catchup.ch.e.o,'unchanged ID lists omitted');
console.log('4-guest/260-enemy transport fixture:',{healthySnapshots:peers[0].count,stalledSnapshots:slow.count,healthyBytes:peers[0].bytes,stalledBytes:slow.bytes,maxBuildMs:+maxBuild.toFixed(2)});
// Execute the actual game message handlers in a small simulation fixture.
const game=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const member={steam:'friend',netSeq:0,netAck:0,kit:{},netMoves:[]},calls=[];
const context={performance,hostRun:5,clientRunId:5,clientHost:'host',clientRun:false,levelHold:null,survival:{dead:false},party:{players:[member]},hostPeers:new Map([['friend',{flow:createFlow()}]]),net:{role:'host',lobby:{owner:'host'},peers:new Map([['friend',{}]]),onMessage(fn){this.handler=fn;},send(...args){calls.push(args);}},validCommand,acknowledge,startCount:null,withMember(m,fn){fn();},runCommand(cmd){calls.push(cmd);},inRun:()=>true};
vm.createContext(context);vm.runInContext(game.slice(game.indexOf('function initOnline()'),game.indexOf('// Oct 17 (user): online starts/restarts')),context);
context.hostMessage({t:'cmd',run:4,steps:[{q:1,d:.02,m:[1,0]}]},'friend');assert.equal(member.netSeq,0,'old run ignored');
context.hostMessage({t:'cmd',run:5,steps:[{q:1,d:.02,m:[1,0],p:['rmb']},{q:2,d:.02,m:[0,1],p:['rmbUp']}]},'friend');assert.equal(member.netMoves.length,2);assert.equal(member.netAck,0,'input not acknowledged until simulation');assert.equal(member.netMoves[0].p[0],'rmb');
context.hostMessage({t:'cmd',run:5,steps:[{q:2,d:.02,m:[0,1]}]},'friend');assert.equal(member.netMoves.length,2,'duplicates ignored');
context.levelHold={};context.hostMessage({t:'cmd',run:5,steps:[{q:3,d:.02,m:[1,0],p:['R']}]},'friend');assert.equal(member.netMoves.length,0);assert.equal(member.netAck,3);assert.equal(calls.at(-1).press[0],'cancel');
context.clientRun=true;context.clientMessage=m=>calls.push(m);context.initOnline();const n=calls.length;context.net.handler({t:'end'},'friend');assert.equal(calls.length,n);context.net.handler({t:'end'},'host');assert.equal(calls.length,n+1,'only original host controls client run');
console.log('Actual message-handler integration passed: run isolation, ordered edges, duplicate rejection, pause cancellation, host authority.');
// Actual teammate replay: per-frame aim/edges stay ordered, ACK follows simulated movement.
const remote={remote:true,id:1,x:0,y:0,kit:{s:{grace:0}},netMove:{x:0,y:1},netAim:{x:40,y:50},netMoves:[{q:1,d:.02,m:[1,0],a:[10,20],p:['rmb']},{q:2,d:.02,m:[0,1],a:[40,50],p:['rmbUp']}]};
const replay=[],rt={kitSync:1,party:{players:[{local:true},remote]},survival:{level:1},combat:{hitstop:0},dash:{remaining:0},mage:null,warrior:null,IDLE_CMD:{move:{x:0,y:0},press:[]},runCommand(cmd){if(cmd.press?.length)replay.push(cmd);},walkSpeed:()=>220,slideMove(p,x,y){p.x+=x;p.y+=y;},stepKit(){},withMember(m,fn){rt.player=m;rt.survival=m.kit.s;fn();}};
vm.createContext(rt);vm.runInContext(game.slice(game.indexOf('function stepTeammates('),game.indexOf('function forKits(')),rt);rt.stepTeammates(.04,[],[],[]);
assert.equal(remote.netAck,2);assert.equal(remote.x,4.4);assert.equal(remote.y,4.4);assert.equal(replay[0].aim.x,10);assert.equal(replay[1].aim.x,40);assert.equal(replay[1].press[0],'rmbUp');
console.log('Actual teammate replay passed: movement, ordered aim/press/release, ACK after application.');
