// Oct 16: an enemy pinned in a U-shaped pocket (open side away from the player) must path out and reach the player.
import assert from 'node:assert/strict';
import {WORLD,steerMove,setNavGoal} from '../dist/simulation.js?v=fx-104';
WORLD.width=6400;WORLD.height=4800;
const wall=(x,y)=>({key:'Wall-A1_E',x,y,scale:.55,layer:'depth',footprint:[{x:x-14,y:y-12},{x:x+14,y:y-12},{x:x+14,y:y+12},{x:x-14,y:y+12}]});
const props=[];for(let x=900;x<=1300;x+=24)props.push(wall(x,1300));for(let y=1000;y<=1300;y+=20){props.push(wall(900,y),wall(1300,y));}
const p={x:1100,y:1700},e={id:1,x:1100,y:1200,radius:12};let t=0;
for(;t<40;t+=1/60){setNavGoal(p.x,p.y,props,1/60);const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy);if(n<40)break;steerMove(e,dx/n*84/60,dy/n*84/60,props,1/60);}
console.log('reached in',t.toFixed(1)+'s at',Math.round(e.x),Math.round(e.y));assert(t<40,'enemy escaped the pocket and reached the player');
