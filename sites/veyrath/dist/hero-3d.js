// Oct 17 (user): live 3D player heroes. The map, enemies and VFX stay 2D; each hero is rendered by three.js into a
// small shared WebGL canvas with the old sprite camera (orthographic, 30 deg down, feet 75% down the box) and drawn
// straight into the 2D canvas at the sprite position, so depth sorting, the wrath grow and co-op members work as before.
// Pose = the same clip + frame the sprite path used; facing = exact angle, eased per hero. Model: assets/hero/warrior.glb
// (tools/warrior/export_warrior_glb.py). Cast shadow follows the map's prop-shadow sun (map-render.js SUN).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {setHeroAnchor} from './hero-anchor.js?v=fx-260';

// PAD (Oct 18, user: big weapons were cut off "like it's in a box"): the model renders into a frame PAD x the sprite box
// (same scale, feet at the same point), so greatswords/long weapons at full reach stay inside the image.
const BOX=3.4,PAD=1.8,SUN={x:-.62,y:-.36},SHADOW_ALPHA=.26;
const LOOP=new Set(['Idle','Run','RunBackwards','Walk','WalkBackwards','StrafeLeft','StrafeRight','Channel']);
// Upper-body layer (Oct 17, user: a held pose for constant casts): these bones take the upper clip, the rest keep the base clip.
const UPPER=/^(spine_02|spine_03|neck_01|Head|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/;
const BLEND=.15,_v=new THREE.Vector3(),_q=new THREE.Quaternion();
// Oct 18 (user: arms frozen while running): weapon carry poses only own the holding arm(s); spine and the free arm keep the run/walk swing
const ARMS=new Map(),armRe=s=>{let r=ARMS.get(s);if(!r){r=new RegExp('^(clavicle|upperarm|lowerarm|hand|(index|middle|ring|pinky|thumb)_[0-9]+)_['+s+']$');ARMS.set(s,r);}return r;};
function part(clip,upper,re=UPPER){const tracks=clip.tracks.filter(t=>re.test(t.name.split('.')[0])===upper);return new THREE.AnimationClip(clip.name+(upper?'@upper':'@lower'),clip.duration,tracks);}
// metal/rough per hero (the exporter keeps only base colour). Mage: female Wizard, purple robe, buns (Oct 17).
const MODELS={warrior:{url:'assets/hero/warrior.glb?v=h9',metal:.45,rough:.55},mage:{url:'assets/hero/mage.glb?v=m9',metal:0,rough:.8},
  // Oct 18 (user): male Ranger, hood only; outfit per path: Archer/Alchemist green (in the GLB), Ninja black, Gunslinger brown-orange
  ranger:{url:'assets/hero/ranger.glb?v=r6',metal:.05,rough:.8,skinMat:'MI_Ranger',skins:{ninja:'assets/hero/ranger-ninja.webp?v=2',gunslinger:'assets/hero/ranger-gunslinger.webp?v=1',alchemist:'assets/hero/ranger-alchemist.webp?v=1'},
   /* Oct 18 (user): the Alchemist has no hood and grey hair (Hair_Alchemist); every other path keeps the hood. */
   parts:{alchemist:{show:['Hair_Alchemist'],hide:['Male_Ranger_Head_Hood']},default:{show:['Male_Ranger_Head_Hood'],hide:['Hair_Alchemist']}}}};
// Oct 18 (user): weapons in the hand. One GLB per hero (tools/weapons/build_mage_weapons.py), a root node per LMB family
// authored in grip space; attached to the hand bone through gripFrame(). hand = which hand holds it; curl = finger closure
// per joint (rad); hold = upper-body clip while idle/moving; cast = books: spells (beam/drain anchor) leave the other hand.
const WEAPON_URL={mage:'assets/hero/weapons-mage.glb?v=w2',warrior:'assets/hero/weapons-warrior.glb?v=w6',ranger:'assets/hero/weapons-ranger.glb?v=r6'},GRIP_Y=.085;
const WEAPON_DEFS={wand:{hand:'r',curl:.49},staff:{hand:'r',curl:.49,hold:'Hold_staff'},scepter:{hand:'r',curl:.49},orb:{hand:'r',curl:.17},
  grimoire:{hand:'l',curl:.24,cast:true},spellbook:{hand:'l',curl:.24,cast:true},
  /* Oct 18 Mage weapons by subclass (build_mage_weapons.py): staves and the rod ride the staff hold; books/drum sit in the left hand */
  icestaff:{hand:'r',curl:.49,hold:'Hold_staff'},stormstaff:{hand:'r',curl:.49,hold:'Hold_staff'},lightrod:{hand:'r',curl:.49,hold:'Hold_staff'},
  embers:{hand:'r',curl:.3},sundisc:{hand:'r',curl:.3},flamegaunt:{hand:'r',curl:.49},frostbeam:{hand:'r',curl:.49},tesla:{hand:'r',curl:.49},lantern:{hand:'r',curl:.49},
  snowglobe:{hand:'r',curl:.17},bloodorb:{hand:'r',curl:.17},skull:{hand:'r',curl:.17},drum:{hand:'l',curl:.24,cast:true},sigilbook:{hand:'l',curl:.24,cast:true},
  // Warrior (Oct 18 batch 2): both = the other hand also closes (two-handers grip the shaft in their clips); off = second model for the left hand
  longsword:{hand:'r',curl:.49},axe:{hand:'r',curl:.49},greatsword:{hand:'r',curl:.49,both:true,hold:'Hold_greatsword'},
  dual:{hand:'r',curl:.49,both:true,hold:'Hold_dual',off:'dual_l'},
  warhammer:{hand:'r',curl:.49,both:true,hold:'Hold_warhammer'},
  /* Oct 18 new Warrior families: two-handers ride the greatsword / warhammer holds; Spear and Shield and the Gauntlets add a left-hand model */
  maul:{hand:'r',curl:.49,both:true,hold:'Hold_warhammer'},greataxe:{hand:'r',curl:.49,both:true,hold:'Hold_greatsword'},glaive:{hand:'r',curl:.49,both:true,hold:'Hold_greatsword'},
  enchspear:{hand:'r',curl:.49,both:true,hold:'Hold_greatsword'},lance:{hand:'r',curl:.49,both:true,hold:'Hold_greatsword'},standard:{hand:'r',curl:.49,both:true,hold:'Hold_warhammer'},
  spearshield:{hand:'r',curl:.49,both:true,off:'shield_l'},runeblade:{hand:'r',curl:.49},katana:{hand:'r',curl:.49},gauntlets:{hand:'r',curl:.62,both:true,off:'gauntlets_l'},chainaxe:{hand:'r',curl:.49},
  // Ranger (Oct 18 overnight batch): bows in the LEFT fist with a live string to the right hand; guns two-handed or paired
  bow:{hand:'l',curl:.49,both:true,hold:'Hold_bow',holdArms:'l',string:true},longbow:{hand:'l',curl:.49,both:true,hold:'Hold_longbow',holdArms:'l',string:true},
  shortbow:{hand:'l',curl:.49,both:true,hold:'Hold_shortbow',holdArms:'l',string:true},crossbow:{hand:'r',curl:.49,both:true,hold:'Hold_crossbow',holdArms:'r'},
  shotgun:{hand:'r',curl:.49,both:true,hold:'Hold_shotgun'},pistols:{hand:'r',curl:.52,both:true,hold:'Hold_pistols',off:'pistols_l'},
  shuriken:{hand:'r',curl:.3},kunai:{hand:'r',curl:.49},chakram:{hand:'r',curl:.36},falconer:{hand:'l',curl:.45,hold:'Hold_falconer',perch:true},
  /* Oct 18 new Ranger families: paired daggers; long guns and the canister ride the shotgun hold; thrown satchel/bomb/barrel in the right fist. */
  daggers:{hand:'r',curl:.49,both:true,off:'daggers_l'},rifle:{hand:'r',curl:.49,both:true,hold:'Hold_rifle'},flamethrower:{hand:'r',curl:.49,both:true,hold:'Hold_shotgun'},
  canister:{hand:'r',curl:.49,both:true,hold:'Hold_shotgun'},potion:{hand:'r',curl:.36},bombbag:{hand:'r',curl:.3},barrel:{hand:'r',curl:.3}};
// Oct 18 (user): every weapon takes its rarity colour, vibrant. Punchier than the UI swatches (weapons only), by rarity
// index Common..Ascendant. TINT = which named materials recolour and how (handles: Wood/Leather/Cloth/Paper keep theirs).
const VIVID=['#eef2f8','#1f8bff','#a22cff','#ffd000','#ff6f0f','#ff1f35'];
const TINT={Steel:{metal:.3,rough:.35,glow:.22,light:.12},DarkSteel:{metal:.3,rough:.45,glow:.12,dark:.55},Iron:{metal:.3,rough:.45,glow:.1,dark:.5},
  Gold:{metal:.35,rough:.35,glow:.25,light:.38},Violet:{metal:0,rough:.7,glow:.1,dark:.62},Teal:{metal:0,rough:.7,glow:.1,dark:.62}};
const weaponSrc=new Map(),hulls=new WeakMap();
let renderer=null,scene=null,camera=null,failed=false,size=0,cap=0,silo=null,sctx=null;
/* Oct 19 fix (user: lobby menu drops to ~30 fps for seconds at a time, every few seconds): measured 480 WebGL buffer
   resizes per second - the lobby portrait (1344 px) and the world/ally hero (288 px) share this renderer and each draw
   resized it. The buffer now only grows (cap); a smaller render uses its top-left want x want corner via viewport +
   scissor, and every read of the canvas/silo takes just that corner. */
function fit(want){if(want>cap){cap=want;renderer.setSize(cap,cap,false);silo.width=silo.height=cap;}size=want;const y=cap-want;renderer.setViewport(0,y,want,want);renderer.setScissor(0,y,want,want);renderer.setScissorTest(true);}
const sources=new Map(),instances=new WeakMap();

function setup(){
  try{
    const canvas=document.createElement('canvas');
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:true});
    renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  }catch(e){failed=true;console.warn('hero-3d: WebGL unavailable, keeping sprites',e);return false;}
  scene=new THREE.Scene();
  // Blender camera: 30 deg elevation from the front (-Y in Blender = +Z here), ortho width 3.4, shift_y .25
  const B=BOX*PAD;camera=new THREE.OrthographicCamera(-B/2,B/2,B/2+B/4,-B/2+B/4,1,80);
  const el=Math.PI/6;camera.position.set(0,30*Math.sin(el),30*Math.cos(el));camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xfff1dc,0x6b5442,1.35));
  const sun=new THREE.DirectionalLight(0xfff4e6,2.4);sun.position.set(-4.4,6.4,6.3);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xffbf8c,1.5);rim.position.set(4,5,-6);scene.add(rim);
  silo=document.createElement('canvas');sctx=silo.getContext('2d');
  return true;
}

// Outline: back faces pushed out along the (skinned) normal, drawn dark behind the armour.
function outlineMaterial(){
  const m=new THREE.MeshBasicMaterial({color:0x120b08,side:THREE.BackSide});
  m.userData.width={value:.012};
  m.onBeforeCompile=s=>{s.uniforms.uOutline=m.userData.width;s.vertexShader='uniform float uOutline;\n'+s.vertexShader.replace('#include <skinning_vertex>','#include <skinning_vertex>\ntransformed+=normalize(objectNormal)*uOutline;');};
  return m;
}

// static-mesh outline: same look as the skinned one, pushed along smooth (merged) normals so flat-shaded edges don't crack
function outlineStatic(width){
  const m=new THREE.MeshBasicMaterial({color:0x120b08,side:THREE.BackSide});
  m.onBeforeCompile=s=>{s.uniforms.uOutline=width;s.vertexShader='uniform float uOutline;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*uOutline;');};
  return m;
}
function hullGeometry(g){let h=hulls.get(g);if(!h){h=g.clone();for(const k of Object.keys(h.attributes))if(k!=='position')h.deleteAttribute(k);h=mergeVertices(h);h.computeVertexNormals();hulls.set(g,h);}return h;}
function loadWeapons(model){
  if(weaponSrc.has(model)||!WEAPON_URL[model])return;weaponSrc.set(model,null);
  new GLTFLoader().load(WEAPON_URL[model],g=>{const lib=new Map();for(const o of g.scene.children)lib.set(o.name,o);weaponSrc.set(model,lib);},
    undefined,e=>{weaponSrc.set(model,false);console.warn('hero-3d: weapons failed to load',e);});
}
/** Grip frame for one hand in the rest pose (same maths as build_mage_weapons.py frame()): origin GRIP_Y along the fingers,
 *  weapon X = palm normal (thumb side), Y = through the fist toward the index finger (glTF Y = Blender Z), Z = -(Blender Y). */
function gripFrame(root,side){
  const b=n=>root.getObjectByName(n+'_'+side),P=n=>b(n).getWorldPosition(new THREE.Vector3()),hand=b('hand');
  if(!hand||!b('middle_01')||!b('index_01')||!b('pinky_01')||!b('thumb_01'))return null;
  const h=P('hand'),Fy=P('middle_01').sub(h).normalize(),d=P('index_01').sub(P('pinky_01')),Fz=d.addScaledVector(Fy,-d.dot(Fy)).normalize();
  const Fx=new THREE.Vector3().crossVectors(Fy,Fz),s=P('thumb_01').sub(h).dot(Fx)>0?1:-1,palm=Fx.clone().multiplyScalar(s);
  const W=new THREE.Matrix4().makeBasis(palm,Fz,Fy.clone().multiplyScalar(-s)).setPosition(h.clone().addScaledVector(Fy,GRIP_Y));
  // finger curl: each joint turns toward the palm about Fy x palm, expressed in that joint's own frame
  const axis=new THREE.Vector3().crossVectors(Fy,palm).normalize(),fingers=[];
  for(const f of ['index','middle','ring','pinky'])for(const j of ['01','02','03']){const bone=b(f+'_'+j);if(bone)fingers.push([bone,axis.clone().applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert())]);}
  return {hand,grip:hand.matrixWorld.clone().invert().multiply(W),fingers};
}
function attach(it,src,g){
  const holder=new THREE.Group(),o=src.clone(true);holder.matrixAutoUpdate=false;holder.matrix.copy(g.grip);holder.add(o);
  const line=outlineStatic(it.outline.userData.width),meshes=[];o.traverse(m=>{if(m.isMesh)meshes.push(m);});
  for(const m of meshes){
    m.frustumCulled=false;m.material=m.material.clone();
    const nm=m.material.name;if(nm==='Crystal')it.glow.push(m.material);if(nm==='Rune'){it.rune.push(m.material);it.runeBase??=m.material.color.clone();}
    if(TINT[nm])it.tint.push([m.material,TINT[nm]]);
    const hull=new THREE.Mesh(hullGeometry(m.geometry),line);hull.frustumCulled=false;m.add(hull);
  }
  g.hand.add(holder);it.weapons.push(holder);return o;
}
// Bows: the static string is hidden and two thin segments run tip -> nock -> tip every frame; the nock follows the
// right hand while it is drawing (behind the string, within reach), else rests on the line. An arrow sits on the string
// while it is pulled back.
const STR_MAT=new THREE.MeshStandardMaterial({color:0xe8dfc8,roughness:.8}),ARROW_MAT=new THREE.MeshStandardMaterial({color:0x6b4423,roughness:.7}),
  HEAD_MAT=new THREE.MeshStandardMaterial({color:0xcfd6df,metalness:.6,roughness:.35}),FLETCH_MAT=new THREE.MeshStandardMaterial({color:0xb02418,roughness:.8});
function makeString(it,o,id){
  const sa=o.getObjectByName(id+'_sa'),sb=o.getObjectByName(id+'_sb'),stat=o.getObjectByName(id+'_string');if(!sa||!sb)return null;if(stat)stat.visible=false;
  const seg=()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1,4),STR_MAT);m.frustumCulled=false;it.weapon.add(m);return m;};
  const arrow=new THREE.Group(),shaft=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1,5),ARROW_MAT),head=new THREE.Mesh(new THREE.ConeGeometry(.02,.07,4),HEAD_MAT),fl=new THREE.Mesh(new THREE.BoxGeometry(.05,.1,.004),FLETCH_MAT);
  for(const m of [shaft,head,fl])m.frustumCulled=false;arrow.add(shaft,head,fl);it.weapon.add(arrow);
  return {sa,sb,a:seg(),b:seg(),arrow,shaft,head,fl};
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_n=new THREE.Vector3(),_m=new THREE.Vector3(),_d=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0),_inv=new THREE.Matrix4();
function span(mesh,A,B,len){_d.subVectors(B,A);const L=len??_d.length();mesh.position.copy(A).addScaledVector(_d,.5);mesh.quaternion.setFromUnitVectors(_up,_d.normalize());mesh.scale.set(1,L,1);}
function updateString(it){
  const S=it.bowString;if(!S)return;it.root.updateMatrixWorld(true);_inv.copy(it.weapon.matrixWorld).invert();
  S.sa.getWorldPosition(_a).applyMatrix4(_inv);S.sb.getWorldPosition(_b).applyMatrix4(_inv);_m.addVectors(_a,_b).multiplyScalar(.5);
  const g=it.grips.r;let pull=0;
  if(g&&it.drawing){_n.setFromMatrixPosition(g.hand.matrixWorld.clone().multiply(g.grip)).applyMatrix4(_inv);  /* right-hand grip point in bow space */
    const back=_n.z-_m.z,reach=Math.max(1,_a.distanceTo(_b)*.8);if(back>-.02&&_n.distanceTo(_m)<reach){pull=Math.max(0,back);}else _n.copy(_m);}  /* bow space (glTF): limbs along Y, archer side = +Z */
  else _n.copy(_m);
  span(S.a,_a,_n);span(S.b,_n,_b);
  const show=pull>.08;S.arrow.visible=show;if(show){_d.subVectors(_m,_n).normalize();const L=Math.max(.5,pull+.28);
    span(S.shaft,_n,_n.clone().addScaledVector(_d,L));S.head.position.copy(_n).addScaledVector(_d,L+.03);S.head.quaternion.setFromUnitVectors(_up,_d);
    S.fl.position.copy(_n).addScaledVector(_d,.07);S.fl.quaternion.setFromUnitVectors(_up,_d);}
}
const skinTex=new Map();
function setSkin(it,model,skin){
  const cfg=MODELS[model];if(!cfg.skins)return;
  if(cfg.parts&&it.root&&it.partsFor!==(skin??'')){it.partsFor=skin??'';const P=cfg.parts[skin]??cfg.parts.default;it.root?.traverse?.(o=>{if(P.show.some(n=>o.name.startsWith(n)))o.visible=true;else if(P.hide.some(n=>o.name.startsWith(n)))o.visible=false;});}const url=cfg.skins[skin]??null;if(it.skinUrl===url)return;it.skinUrl=url;
  let tex=null;if(url){tex=skinTex.get(url);if(!tex){tex=new THREE.TextureLoader().load(url);tex.flipY=false;tex.colorSpace=THREE.SRGBColorSpace;skinTex.set(url,tex);}}
  for(const m of it.mats)if(m.name.startsWith(cfg.skinMat)){m.userData.baseMap??=m.map;m.map=tex??m.userData.baseMap;m.needsUpdate=true;}
}
function equip(it,model,w){
  const id=w&&WEAPON_DEFS[w.id]&&WEAPON_URL[model]?w.id:null;
  if(it.weaponId!==id){for(const h of it.weapons)h.removeFromParent();it.weapons=[];it.weapon=it.tip=it.tipL=null;it.weaponId=id;}
  if(!id)return null;
  const def=WEAPON_DEFS[id],other=def.hand==='r'?'l':'r';
  if(!it.weapon){
    loadWeapons(model);const lib=weaponSrc.get(model),src=lib&&lib.get(id),g=it.grips[def.hand],off=def.off&&lib&&lib.get(def.off);
    if(!src||!g||def.off&&!off)return null;
    it.glow=[];it.rune=[];it.runeBase=null;it.tint=[];it.tintKey=null;
    const o=attach(it,src,g),o2=off&&it.grips[other]?attach(it,off,it.grips[other]):null;it.tipL=o2?.getObjectByName(def.off+'_tip')??null;
    it.weapon=it.weapons[0];it.tip=o.getObjectByName(id+'_tip');it.fingers=def.both&&it.grips[other]?[...g.fingers,...it.grips[other].fingers]:g.fingers;
    it.bowString=def.string?makeString(it,o,id):null;it.perch=def.perch?o.getObjectByName('falconer_perch'):null;
  }
  if(it.perch)it.perch.visible=!w.perchHidden;  /* perched hawk hides while it is out hunting */
  for(const h of it.weapons)h.visible=!w.hidden;  /* e.g. the Throwing Axe while it is in flight */
  // rarity colour on blade/head/trim/gems/covers (Oct 18, user: vibrant), handles stay; colour rune on the inlay; visual only
  const t=performance.now()/1000,c=new THREE.Color(VIVID[w.rarity]??w.glow??'#9fd8ff'),key=c.getHex();
  if(it.tintKey!==key){it.tintKey=key;const white=new THREE.Color(1,1,1);
    for(const [m,k] of it.tint){m.color.copy(c).multiplyScalar(k.dark??1).lerp(white,k.light??0);m.metalness=k.metal;m.roughness=k.rough;m.emissive.copy(c).multiplyScalar(k.glow);}}
  for(const m of it.glow){m.color.copy(c).lerp(new THREE.Color(1,1,1),.45);m.emissive.copy(c).multiplyScalar(.55+.2*Math.sin(t*2.6));}
  for(const m of it.rune){if(w.rune)m.color.set(w.rune);else m.color.copy(it.runeBase);m.emissive.set(w.rune||0).multiplyScalar(w.rune?.35:0);}
  return def;
}

function load(model){
  if(sources.has(model))return;
  sources.set(model,null);
  if(!renderer&&!failed&&!setup())return;
  const cfg=MODELS[model];new GLTFLoader().load(cfg.url,gltf=>{
    const clips={};for(const c of gltf.animations)clips[c.name]=c;
    gltf.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material){o.material.metalness=cfg.metal;o.material.roughness=cfg.rough;o.material.emissive=new THREE.Color(0);}}});
    sources.set(model,{root:gltf.scene,clips});
  },undefined,e=>{failed=true;console.warn('hero-3d: model failed to load, keeping sprites',e);});
}

function instance(key,model){
  let it=instances.get(key);if(it&&it.model===model)return it;
  const src=sources.get(model);if(!src)return null;
  const root=cloneSkinned(src.root),outline=outlineMaterial(),mats=[];
  const meshes=[];root.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
  for(const o of meshes){
    o.material=o.material.clone();mats.push(o.material);
    const hull=new THREE.SkinnedMesh(o.geometry,outline);hull.name=o.name+'_outline';/* Oct 19 fix: named after its mesh so parts show/hide (Alchemist hood) hides its outline shell too */hull.bind(o.skeleton,o.bindMatrix);hull.frustumCulled=false;o.parent.add(hull);
  }
  const mixer=new THREE.AnimationMixer(root);
  let hand=null;root.traverse(o=>{if(o.isBone&&o.name==='middle_01_r')hand=o;});
  root.updateMatrixWorld(true);const grips={r:gripFrame(root,'r'),l:gripFrame(root,'l')};  // rest pose, before any clip plays
  it={model,root,mixer,mats,outline,clips:src.clips,parts:new Map(),active:new Set(),upperK:0,upperClock:0,last:performance.now(),yaw:null,hand,grips,weapon:null,weapons:[],weaponId:null};instances.set(key,it);return it;
}

function tintFromFilter(f){
  if(!f||f==='none')return null;
  if(f.includes('saturate(7)'))return[1,.18,.12,.75];        // hurt flash
  if(f.includes('-28deg'))return[1,.42,.18,.32];             // Bloodlust
  if(f.includes('-32deg'))return[1,.26,.12,.42];             // Wrath
  return null;
}

/** Draw a hero pose. opts: model, clip (knight sheet name without 'knight-'), frame (sprite frame 0-14, may be fractional),
 *  angle (radians, screen space, 0 = east) or row (0-7), box [dx,dy,dw,dh] = the sprite's destination rect.
 *  Returns false while the model is loading or unavailable, so the caller can draw the sprite instead. */
export function drawHero(ctx,key,opts){
  if(failed)return false;
  load(opts.model);if(!renderer)return false;
  const it=instance(key,opts.model);if(!it)return false;
  const clip=it.clips[opts.clip];if(!clip)return false;
  const now=performance.now(),dt=Math.min(.1,(now-it.last)/1000);it.last=now;
  const def=equip(it,opts.model,opts.weapon);
  let upper=opts.upper;if(!upper&&def?.hold&&LOOP.has(opts.clip)&&it.clips[def.hold])upper=def.hold;  /* weapon carry pose while idle/moving */
  const t=LOOP.has(opts.clip)?((opts.frame%15)+15)%15/15:Math.min(1,Math.max(0,opts.frame/14));
  // upper-body layer: blend in/out over BLEND s; legs keep the base clip
  const up=upper&&it.clips[upper];it.upperK=Math.max(0,Math.min(1,it.upperK+(up?1:-1)*dt/(opts.upperBlend??BLEND)));
  if(up){it.upperClip=up;it.upperClock+=dt;it.upperArms=opts.upper?null:def.holdArms??(def.both?'lr':def.hand);}else if(it.upperK<=0)it.upperClock=0;
  /* carry pose: only the holding arm(s); while moving 25% of the run swing still shows through it as sway */
  const arms=it.upperArms,k=it.upperK*(arms&&opts.clip!=='Idle'?.75:1),list=[[clip,t*clip.duration,1-k]];
  if(k>0&&it.upperClip){const re=arms?armRe(arms):UPPER,P=c=>{const id=c.uuid+(arms??'');let x=it.parts.get(id);if(!x){x=[part(c,false,re),part(c,true,re)];it.parts.set(id,x);}return x;};
    const ut=opts.upperT!=null&&up?Math.min(1,Math.max(0,opts.upperT))*it.upperClip.duration*.999:it.upperClock%it.upperClip.duration;/* upperT: one-shot clips driven by the game (LMB) */
    list.push([P(clip)[0],t*clip.duration,k],[P(it.upperClip)[1],ut,k]);}
  const used=new Set();
  for(const [c,time,w] of list){if(w<=.001)continue;const a=it.mixer.clipAction(c);if(!a.isRunning())a.play();a.enabled=true;a.setEffectiveWeight(w);a.time=time;used.add(a);}
  for(const a of it.active)if(!used.has(a))a.stop();it.active=used;
  /* Oct 18 fix (lobby: "fingers so glitchy"): clips that don't key the fingers left the grip curl below to pile up every frame; reset fingers to rest first. */
  if(it.fingers)for(const [bone] of it.fingers)bone.quaternion.copy(bone.userData.restQ??=bone.quaternion.clone());
  it.mixer.update(0);
  if(it.weapon)for(const [bone,ax] of it.fingers)bone.quaternion.multiply(_q.setFromAxisAngle(ax,def.curl));  /* close the fingers round the grip */
  setSkin(it,opts.model,opts.skin);
  // facing: screen angle -> model yaw (south = 0, east = +90 deg), eased so turns are smooth
  const ang=opts.angle??(opts.row??2)*Math.PI/4,target=Math.PI/2-ang;
  if(it.yaw==null||opts.snap)it.yaw=target;else{let d=target-it.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));it.yaw+=d*Math.min(1,.35);}
  it.root.rotation.y=it.yaw;
  const tint=tintFromFilter(ctx.filter);
  for(const m of it.mats){if(tint){m.emissive.setRGB(tint[0]*tint[3],tint[1]*tint[3],tint[2]*tint[3]);}else m.emissive.setRGB(0,0,0);}
  const fx=opts.box[0]+opts.box[2]/2,fy=opts.box[1]+opts.box[3]*.75,dw=opts.box[2]*PAD,dh=opts.box[3]*PAD,dx=fx-dw/2,dy=fy-dh*.75,tr=ctx.getTransform(),s=Math.hypot(tr.a,tr.b)||1;
  const want=Math.max(96,Math.min(opts.maxRes??896,Math.ceil(dw*s/32)*32));/* maxRes: the lobby asks for an HD render (Oct 18) */
  fit(want);
  it.outline.userData.width.value=1.25*BOX*PAD/size;
  /* Oct 18 fix (user: idle right hand looked like it still held the string): the string only follows the hand in a shot clip's draw/aim phases, not idle or just after release */
  it.drawing=!!(up&&/^R_(bow|longbow|shortbow)/.test(upper)&&opts.upperT!=null&&!(opts.upperT>.3&&opts.upperT<.58));
  if(it.bowString){it.root.rotation.y=it.yaw;updateString(it);}
  scene.add(it.root);renderer.render(scene,camera);scene.remove(it.root);
  const img=renderer.domElement,f=ctx.filter;ctx.filter='none';
  // shadow: silhouette sheared onto the ground like map props (map-render.js), pivot = feet at 75% of the box
  sctx.globalCompositeOperation='copy';sctx.drawImage(img,0,0,size,size,0,0,size,size);sctx.globalCompositeOperation='source-in';sctx.fillStyle='#000';sctx.fillRect(0,0,size,size);
  const px=dx+dw/2,py=dy+dh*.75;ctx.save();ctx.globalAlpha*=SHADOW_ALPHA;ctx.translate(px,py);ctx.transform(1,0,SUN.x,SUN.y,0,0);ctx.drawImage(silo,0,0,size,size,dx-px,dy-py,dw,dh);ctx.restore();
  ctx.drawImage(img,0,0,size,size,dx,dy,dw,dh);ctx.filter=f;
  // where the weapon hand is on screen, in world coords (beam/drain visuals start here; later the weapon tip)
  const ap=it.tip&&!def?.cast?it.tip:it.hand;  /* weapon tip (wand/staff/scepter/orb); books cast from the free hand */
  if(opts.anchorFor&&ap){const scr=o=>(o.getWorldPosition(_v).project(camera),{x:dx+(_v.x+1)/2*dw,y:dy+(1-_v.y)/2*dh}),L=it.tipL&&scr(it.tipL),A=scr(ap);setHeroAnchor(opts.anchorFor,A.x,A.y,fx,fy,L);}
  return true;
}
export function heroModelReady(model){return !!sources.get(model);}
export function preloadHero(model){load(model);loadWeapons(model);}
// Oct 18 (user): Falconer's Glove hawk as a 3D model. Rendered like a hero (same camera/scale) at the hawk's screen point
// (x,y already include its flight height); wings flap on their shoulder pivots; no silhouette shadow (ranger-render.js
// draws the ground shadow). key = the hawk's sim object so each hawk keeps its own eased heading.
const hawks=new WeakMap();
export function drawHawk3D(ctx,key,o){
  if(failed)return false;if(!renderer&&!setup())return false;
  loadWeapons('ranger');const lib=weaponSrc.get('ranger'),src=lib&&lib.get('hawk');if(!src)return false;
  let h=hawks.get(key);
  if(!h){const root=src.clone(true),width={value:.012},line=outlineStatic(width);
    const meshes=[];root.traverse(m=>{if(m.isMesh)meshes.push(m);});  /* collect first: adding hulls during traverse would outline the outlines forever */
    for(const m of meshes){m.frustumCulled=false;const hull=new THREE.Mesh(hullGeometry(m.geometry),line);hull.frustumCulled=false;m.add(hull);}
    h={root,width,wl:root.getObjectByName('hawk_wpiv_l'),wr:root.getObjectByName('hawk_wpiv_r'),yaw:null};hawks.set(key,h);}
  const target=Math.PI/2-(o.angle??0);if(h.yaw==null)h.yaw=target;else{let d=target-h.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));h.yaw+=d*.3;}
  h.root.rotation.set(0,h.yaw,0);h.root.scale.setScalar(o.scale??1);
  const f=Math.sin((o.t??0)*14+(o.phase??0));if(h.wl)h.wl.rotation.z=.25+.75*f;if(h.wr)h.wr.rotation.z=-.25-.75*f;
  const bw=(o.box??153.6),dw=bw*PAD,dh=dw,dx=o.x-dw/2,dy=o.y-dh*.75,tr=ctx.getTransform(),sc=Math.hypot(tr.a,tr.b)||1;
  const want=Math.max(96,Math.min(896,Math.ceil(dw*sc/32)*32));fit(want);
  h.width.value=1.25*BOX*PAD/size;
  scene.add(h.root);renderer.render(scene,camera);scene.remove(h.root);
  const fl=ctx.filter;ctx.filter='none';ctx.drawImage(renderer.domElement,0,0,size,size,dx,dy,dw,dh);ctx.filter=fl;return true;
}
export {heroAnchor} from './hero-anchor.js?v=fx-260';
