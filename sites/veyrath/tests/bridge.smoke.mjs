// Oct 16: each river bridge connects both banks (16px flood fill with player radius).
import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseTiledMap} from '../dist/tiled-map.js';import {WORLD,blocked} from '../dist/simulation.js?v=fx-104';
const rd=f=>JSON.parse(fs.readFileSync(new URL('../dist/'+f,import.meta.url)));const map=rd('maps/desert.tmj'),ext={};for(const t of map.tilesets??[])if(t.source)ext[t.source]=rd('maps/'+t.source);
const scene=parseTiledMap(map,rd('assets/manifest.json'),ext);WORLD.width=scene.width;WORLD.height=scene.height;
const reach=(a,b)=>{const G=16,seen=new Set([Math.round(a.x/G)+','+Math.round(a.y/G)]),q=[[Math.round(a.x/G),Math.round(a.y/G)]];while(q.length){const [x,y]=q.pop();if(Math.hypot(x*G-b.x,y*G-b.y)<24)return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||Math.hypot(nx*G-a.x,ny*G-a.y)>800)continue;seen.add(k);if(!blocked(nx*G,ny*G,scene.props,13))q.push([nx,ny]);}}return false;};
// forest bridges (river runs east-west, crossed north-south) and dock bridges (river runs north-south, crossed east-west)
for(const [bx,by,h] of [[2980,4950,false],[2200,4937,false],[8835,3330,true],[8980,4380,true]]){const d=h?300:200,a=h?{x:bx-d,y:by-d*.5}:{x:bx,y:by-d},b=h?{x:bx+d,y:by+d*.5}:{x:bx,y:by+d};assert(!blocked(a.x,a.y,scene.props,13)&&!blocked(b.x,b.y,scene.props,13),'banks free at '+bx);assert(reach(a,b),'bridge at '+bx+','+by+' connects both banks');}
for(const [x,y] of [[3600,4960],[1900,4932],[8890,2700],[8960,4000]])assert(blocked(x,y,scene.props,13),'river blocks away from bridges at '+x+','+y);
console.log('bridges ok');
