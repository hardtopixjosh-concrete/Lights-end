// Deliberately small Tiled JSON adapter for VEYRATH's screen-space desert.
const fail=message=>{throw Error('Tiled map: '+message);};
const finite=(value,label)=>typeof value==='number'&&Number.isFinite(value)?value:fail(label+' must be a finite number');
const properties=object=>Object.fromEntries((object.properties??[]).map(p=>[p.name,p.value]));
export function parseTiledMap(map,manifest,externalTilesets={}){
  if(!manifest?.props||typeof manifest.props!=='object')fail('prepared asset manifest is required');
  if(map?.type!=='map'||map.orientation!=='orthogonal'||map.infinite)fail('expected a finite orthogonal JSON map');
  const settings=properties(map);
  if(settings.veyrathSchema!==1)fail('unsupported or missing veyrathSchema (expected 1)');
  const width=finite(settings.worldWidth,'worldWidth'),height=finite(settings.worldHeight,'worldHeight');
  if(width<320||height<320||width>20000||height>20000)fail('world dimensions must be between 320 and 20000 pixels');
  if(!Array.isArray(map.layers)||!Array.isArray(map.tilesets))fail('layers and tilesets are required');
  const tiles=new Map(),props=[],ground=[],landmarks=[],objects=new Map(),colliders=[];
  for(const reference of map.tilesets){
    const set=reference.source?externalTilesets[reference.source]:reference;
    if(!set||set.type!=='tileset'||set.objectalignment!=='bottomleft')fail('missing bottom-left image collection tileset '+(reference.source??''));
    for(const tile of set.tiles??[]){
      const p=properties(tile),gid=reference.firstgid+tile.id;
      if(!p.key||!(tile.imagewidth>0)||!(tile.imageheight>0))fail('tiles require key and image dimensions');
      tiles.set(gid,{...p,width:tile.imagewidth,height:tile.imageheight});
    }
  }
  for(const layer of map.layers){
    if(layer.type!=='objectgroup')fail('only object layers are supported: '+layer.name);
    if(layer.offsetx||layer.offsety||layer.x||layer.y)fail('layer offsets are unsupported: '+layer.name);
    for(const object of layer.objects??[]){
      const p=properties(object);
      if(objects.has(object.id))fail('duplicate object ID '+object.id);
      objects.set(object.id,null);
      if(object.rotation)fail('rotated objects are unsupported: '+object.id);
      if(object.gid!==undefined){
        if(object.gid>=0x10000000)fail('flipped tiles are unsupported: '+object.id);
        const tile=tiles.get(object.gid);if(!tile)fail('unknown tile '+object.gid);
        if(p.key!==tile.key)fail('tile/key mismatch on '+object.id);
        if(manifest&&!manifest.props?.[p.key])fail('asset not prepared: '+p.key);
        const scale=finite(object.width,'object width')/tile.width;
        if(scale<=0||Math.abs(finite(object.height,'object height')/tile.height-scale)>1e-8)fail('tiles must use positive uniform scaling: '+object.id);
        if(!['ground','depth'].includes(p.layer)||!['ground','props'].includes(p.collection))fail('invalid layer/collection on '+object.id);
        const value={key:p.key,x:finite(object.x,'object x')+finite(tile.anchorX,'anchorX')*scale,y:finite(object.y,'object y')-(tile.height-finite(tile.anchorY,'anchorY'))*scale,scale};
        if(p.collection==='props'){value.layer=p.layer;value.footprint=null;props.push(value);}else ground.push(value);
        objects.set(object.id,value);
      }else if(object.type==='VEYRATHCollision'||object.class==='VEYRATHCollision'){
        if(!Array.isArray(object.polygon)||object.polygon.length<3)fail('collider requires a polygon: '+object.id);
        colliders.push({ownerId:p.ownerId,polygon:object.polygon.map(point=>({x:finite(object.x,'collider x')+finite(point.x,'polygon x'),y:finite(object.y,'collider y')+finite(point.y,'polygon y')}))});
      }else if(object.point){
        landmarks.push({name:object.name,type:object.class||object.type||'landmark',x:finite(object.x,'landmark x'),y:finite(object.y,'landmark y'),radius:p.radius??0,properties:p});
      }else fail('unsupported object '+object.id);
    }
  }
  for(const collider of colliders){
    const owner=objects.get(collider.ownerId);
    if(!owner||!props.includes(owner))fail('collision owner is not a scenery prop: '+collider.ownerId);
    if(owner.footprint)fail('duplicate footprint on '+collider.ownerId);
    owner.footprint=collider.polygon;
  }
  return {props,ground,landmarks,width,height};
}
export async function loadTiledMap(url,manifest,{fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=='function')fail('fetch is unavailable');
  const absolute=new URL(url,globalThis.location?.href??import.meta.url);
  async function json(address){
    let response;try{response=await fetchImpl(address);}catch(error){fail('could not fetch '+address+': '+error.message);}
    if(!response.ok)fail('could not load '+address+' (HTTP '+response.status+')');
    try{return await response.json();}catch{fail('invalid JSON in '+address);}
  }
  const map=await json(absolute),external={};
  await Promise.all((map.tilesets??[]).filter(t=>t.source).map(async t=>{
    const address=new URL(t.source,absolute);if(address.origin!==absolute.origin)fail('tilesets must be same-origin');
    // Retain the map version key for external tileset cache invalidation.
    if(absolute.search&&!address.search)address.search=absolute.search;
    external[t.source]=await json(address);
  }));
  return parseTiledMap(map,manifest,external);
}
