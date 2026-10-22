// One-time migration/regeneration of the original scene, not a build step.
// Do not rerun over hand-authored map edits unless intentionally restoring it.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createScene,PROP_BASES,DECOR_BASES,WORLD} from '../dist/simulation.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const manifest=JSON.parse(await readFile(path.join(root,'assets/manifest.json'),'utf8'));
const scene=createScene(),keys=[...new Set([...scene.ground,...scene.props].map(p=>p.key))].sort();
const prop=(name,value)=>({name,type:typeof value==='number'?'float':'string',value});
const tiles=keys.map((key,id)=>{
  const a=manifest.props[key],base=PROP_BASES[key]??DECOR_BASES[key];
  return {id,image:'../'+a.url,imagewidth:a.width,imageheight:a.height,
    properties:[prop('key',key),prop('anchorX',base?.anchor[0]??a.width/2),prop('anchorY',base?.anchor[1]??a.height/2)]};
});
const tileset={type:'tileset',version:'1.10',tiledversion:'1.11.2',name:'VEYRATH desert props',tilewidth:Math.max(...tiles.map(t=>t.imagewidth)),tileheight:Math.max(...tiles.map(t=>t.imageheight)),tilecount:tiles.length,columns:0,objectalignment:'bottomleft',grid:{orientation:'orthogonal',width:1,height:1},tiles};
let id=1;
const art=(p,kind)=>{
  const tile=tiles[keys.indexOf(p.key)],props=Object.fromEntries(tile.properties.map(p=>[p.name,p.value]));
  return {id:id++,name:p.key,type:'VEYRATHProp',gid:tile.id+1,x:p.x-props.anchorX*p.scale,y:p.y+(tile.imageheight-props.anchorY)*p.scale,width:tile.imagewidth*p.scale,height:tile.imageheight*p.scale,rotation:0,visible:true,properties:[prop('key',p.key),prop('scale',p.scale),prop('layer',p.layer??'ground'),prop('collection',kind)]};
};
const ground=scene.ground.map(p=>art(p,'ground'));
const scenery=scene.props.map(p=>art(p,'props'));
const collisions=scene.props.flatMap((p,i)=>p.footprint?[{id:id++,name:'Footprint '+p.key,type:'VEYRATHCollision',x:p.x,y:p.y,rotation:0,visible:true,polygon:p.footprint.map(v=>({x:v.x-p.x,y:v.y-p.y})),properties:[{name:'ownerId',type:'object',value:scenery[i].id}]}]:[]);
const layer=(name,objects,layerId,extra={})=>({id:layerId,name,type:'objectgroup',draworder:'topdown',opacity:1,visible:true,x:0,y:0,objects,...extra});
const eventMarkers=[['shrine-1',2000,1730],['shrine-2',780,1050],['shrine-3',2800,700],['camp-1',900,2050],['camp-2',2670,1860],['camp-3',2300,530],['rift-1',2850,2450],['merchant-1',1080,600]].map(([name,x,y])=>({id:id++,name,type:name.split('-')[0],point:true,x,y,rotation:0,visible:true}));
const map={type:'map',version:'1.10',tiledversion:'1.11.2',orientation:'orthogonal',renderorder:'right-down',infinite:false,tilewidth:32,tileheight:32,width:Math.ceil(WORLD.width/32),height:Math.ceil(WORLD.height/32),nextlayerid:5,nextobjectid:id+2,backgroundcolor:'#b59a69',properties:[{name:'veyrathSchema',type:'int',value:1},prop('worldWidth',WORLD.width),prop('worldHeight',WORLD.height)],tilesets:[{firstgid:1,source:'desert-props.tsj'}],layers:[layer('Ground',ground,1),layer('Scenery',scenery,2),layer('Collision footprints',collisions,3,{color:'#ff6655',opacity:.45}),layer('Landmarks',[{id:id++,name:'forge',type:'forge',point:true,x:1500,y:1450,rotation:0,visible:true,properties:[prop('radius',100)]},{id:id++,name:'player-spawn',type:'player-spawn',point:true,x:1800,y:1400,rotation:0,visible:true},...eventMarkers],4)]};
await mkdir(path.join(root,'maps'),{recursive:true});
for(const [name,value] of [['desert.tmj',map],['desert-props.tsj',tileset]])await writeFile(path.join(root,'maps',name),JSON.stringify(value,null,2)+'\n');
console.log(`Exported ${ground.length} ground objects, ${scenery.length} props and ${collisions.length} footprints.`);
