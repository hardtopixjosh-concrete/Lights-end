import {createArmoryUI} from './armory-ui.js?v=fx-260';
import {installOrbHUD,setOrbFill,setHudCooldown,orbValueText} from './orb-hud.js?v=fx-260';
import {installSettingsUI,renderHeight} from './settings-ui.js?v=fx-260';
import {dressLevelCard} from './cloth-cards.js?v=fx-260';
import {GAMEPLAY_RUNES,SPELL_COLORS,runRuneLoadout,createRealmSchedule,recoverAccount,saveAccountPair} from './progression.js?v=fx-260';
import {prepareVictory,claimVictory} from './weapons.js?v=fx-260';
import {loadTiledMap} from './tiled-map.js?v=fx-260';
import {DEMON_SHEETS,enemyIdentity,specialDemon} from './demon-roster.js?v=fx-260';
import {SKIN_FALLBACK,rosterSkins} from './wave-roster.js?v=fx-260';
import {drawEnemyRanged,castTime} from './enemy-ranged.js?v=fx-260';
import {createWorldEvents,tickWorldEvents,processWorldDeaths,applyWorldModifiers,nearWorldEvent,worldMarkers,worldTitle,actWorld,forceWorldEvent,safeWorldPoint,SHRINES,CAMP_TYPES,sealTrialArena} from './world-events.js?v=fx-260';
import {drawWorldObject,drawWorldGround,drawWorldAnchor,worldPrompt} from './world-render.js?v=fx-260';
import {createWarrior,requestWarrior,tickWarrior,warriorAbility,handleWarriorHits,RAGE,rageCost} from './warrior.js?v=fx-260';
import {drawWarriorEffects} from './warrior-render.js?v=fx-260';
import {createRanger,requestRanger,releaseRanger,tickRanger,rangerAbility,rangerCanCast,rangerMove,clearRangerInput,MOMENTUM,RANGER_COLORS,BOW} from './ranger.js?v=fx-260';
import {drawRangerVfx} from './ranger-vfx.js?v=fx-260';
import {drawRangerGround,drawRangerUpper,setHawkDrawer} from './ranger-render.js?v=fx-260';
import {drawWarriorVfx,warriorHitFx,warriorHitShake} from './warrior-vfx.js?v=fx-260';
import {drawButcherVfx,drawButcherCanvas} from './butcher-vfx.js?v=fx-260';
import {drawTitanVfx,drawTitanGround,drawTitanCanvas} from './titan-vfx.js?v=fx-260';
import {COL,WY} from './titans.js?v=fx-260';
import {BFX,tickBossFx,bossFxImpact,drawBossLights,drawBossParticles} from './boss-fx.js?v=fx-260';
import {drawProphetVfx,drawProphetCanvas,drawProphetGround} from './prophet-vfx.js?v=fx-260';
let warVfxOn=false;
import {stopDrain} from './blood-mage.js?v=fx-260';
import {createGroundXP,dropGroundXP,tickGroundXP,drawGroundXP} from './ground-xp.js?v=fx-260';
import {createMinimap,drawMinimap,drawBigMap} from './minimap.js?v=fx-260';
import {createBossChoices,queueBossChoices,bossOptions,claimBossChoice,tickBossBuff} from './boss-choices.js?v=fx-260';
import {PATHS,pathInfo,choosePath,refundPath,talentBonus,spellOwned,nextSpellLevel,pickKind,awardLevelPoints,awardBonusPoint,SPELL_LEVELS,cardStat,pathNodes,learn,rank} from './specializations.js?v=fx-260'
import {tip} from './ui-tip.js?v=fx-260';
import {currentOffer,chooseOffer,withCards,STAT_CARDS,banishOption,healInstead} from './level-cards.js?v=fx-260';
import {createHealing,tickHealing,drawHealing,healingMarkers} from './healing.js?v=fx-260';
import {createDirector,tickDirector,worldTint,drawWorldTint,phaseAt} from './run-director.js?v=fx-260';
import {makeBoss,tickBosses,BOSS_DEFS} from './bosses.js?v=fx-260';
import {tickRealm,REALM} from './realm.js?v=fx-260';
import {tickFinalBoss,drawFinalBossFx} from './final-boss.js?v=fx-260';
import {createPits,tickPits,pitMarkers,tickTitanBuffs,keepOutOfPits} from './pits.js?v=fx-260';
import {buildArenas,drawArenaFloor,gateWalls,inArena,atEntrance} from './arenas.js?v=fx-260';
import {TRIALS,drawTrialGround} from './world-events.js?v=fx-260';
import {createCheatMenu} from './cheats.js?v=fx-260';
import {spawnRoleAt,spawnImp} from './enemy-roles.js?v=fx-260';
import {renderBuild,renderAugmentTree} from './skill-ui.js?v=fx-260';
import {iconNode} from './ui-icons.js?v=fx-260';
import {warmUI,warmAssets} from './ui-warm.js?v=fx-260';
/* Oct 19: hosted Site only - asset cache that skips the host's per-file redirect (sw.js) */
if('serviceWorker' in navigator&&!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)&&!/[?&]debug/.test(location.search))navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
import {drawWeaponEffects} from './weapon-render.js?v=fx-260';
import {createMage,requestMage,queueMageSpell,blinkMage,tickMage,clearMageInput,MAGE_SPELLS,magePrimary,mageAbility,MAGE_CHANNELS,MAGE_CLIP_OF,MAGE_CHANNEL_CLIP} from './mage.js?v=fx-260';
import {drawMageEffects} from './mage-render.js?v=fx-260';
import {drawEHand,elementSheet,ageEFx} from './mage-e-fx.js?v=fx-260';
import {drawWarriorFront,warriorBodyFilter} from './warrior-fx.js?v=fx-260';
import {drawHero,drawHawk3D,preloadHero} from './hero-3d.js?v=fx-262';
setHawkDrawer(drawHawk3D);for(const m of ['warrior','mage','ranger'])preloadHero(m);  /* Oct 18: start loading every hero + weapons at boot so menus never flash the sprite */
import {drawStatusIcons} from './status-icons.js?v=fx-260';
import {drawDesertGround,drawPropShadows,drawSunLight,prepareTerrain,drawStaticChunks,mapSignature,renderGroundTile,createGroundTiles,GROUND_TILE} from './map-render.js?v=fx-260';
import {createAmbience,tickAmbience,drawAmbienceGround,drawAmbienceUpper} from './world-ambience.js?v=fx-260';
const ambience=createAmbience();
const ambienceOn=()=>document.getElementById('dust')?.checked!==false;
import {drawBossFx,eliteSheet,drawEliteBack,drawEliteFront,drawEliteShield,drawWardLink,drawEliteSpellsUpper} from './elite-fx.js?v=fx-260';
import {mageShake,drawBasicHand} from './mage-spell-fx.js?v=fx-260';
import {drawLootBeam} from './loot-beams.js?v=fx-260';
import {tickElitePowers,wallProps,drawEliteHazards,eliteTint} from './elite-powers.js?v=fx-260';
import {cameraScale,ENEMY_SPEED} from './encounter-space.js?v=fx-260';
import {WORLD,clamp,DEFAULT_CAMERA_ZOOM,PROP_BASES,DECOR_BASES,movementVector,updateWalkFacing,movePlayer,createScene,directionRow,slideMove,withDynamicColliders,blocked,setNavGoal} from './simulation.js?v=fx-260';
import {damageEnemy,createCombat,HEAVY_CLEAVE,attackDefinition,VERTICAL_REACH_SCALE,requestHeavy,pressAttack,releaseAttack,clearAttackInput,tickCombat,attackFrame} from './combat.js?v=fx-260';
import {createDash,startDash,tickDash,dashFrame,dashInvulnerable,DASH} from './dash.js?v=fx-260';
import {loadMeta,saveMeta,runMods,recordRun,runeFor,setRune,MODIFIERS,pathUnlocked,markFound,PATH_PRICE} from './meta.js?v=fx-260';
import {createFront} from './front-end.js?v=fx-260';
import {createTouchControls,isTouchDevice} from './touch-controls.js?v=fx-260';
import {CombatSound,ABILITY_SOUNDS} from './sound.js?v=fx-260';
import {ABILITIES,createSurvival,castAbility,tickSurvival,acceptEvents} from './survival.js?v=fx-260';
import {SandParticles} from './sand-particles.js?v=fx-260';
import {SKILLS,createRewards,buySkill,rewardEvents,tickRewards,summonBoss,summonElite} from './rewards.js?v=fx-260';
import {storeRunWeapon,endRun,RUN_BAG,ARMORY_CAPACITY,SALVAGE_AWAY} from './weapons.js?v=fx-260';
import {convertRetired,weaponEligible,selectPathWeapon,validateWeapon,RARITIES,FAMILIES,FORGE,createArmory,validArmory,weaponStats,forgeCost,transactArmory,resolveForge,storeWeapon,makeWeapon,pocketRealmReward,weaponDrops,migrateArmory,weaponClass,syncWeaponPassives,affixKind,describeAffix} from './weapons.js?v=fx-260';
import {createForgeOasis,drawOasisGround,drawOasisEmbers} from './forge-oasis.js?v=fx-260';
import {vfx} from './vfx-engine.js?v=fx-260';
import {createQuality,drawCell,drawCellHD,gfx,tintFrame,takeTintStats} from './quality.js?v=fx-260';
import {createFpsOverlay} from './fps-overlay.js?v=fx-260';
import {loadSprite,isRetainedSprite} from './sprite-cache.js?v=fx-260';
import {setFxView,fxCacheStats} from './effect-cache.js?v=fx-260';
const fpsOverlay=createFpsOverlay();
import {createForgeShield,tickForgeShield,shieldCollider,repelShieldEnemies,drawForgeShield,tickForgeMenuShield} from './forge-shield.js?v=fx-260';
import {party,PARTY,setLocal,clearAllies,addBot,addRemote,removeRemote,tickParty,standing} from './party.js?v=fx-260';
import {createNet} from './net.js?v=fx-260';
import {createFlow,canSend,sent,acknowledge,validCommand,createInputBatch,batchInput} from './net-flow.js?v=fx-260';
import {createHostSync,resetHostSync,hostEvents,hostSnapshot,createClientSync,applySnapshot,smoothArrays,sample as netSample,interpolate as netInterp,hostTimeNow,INTERP} from './net-sync.js?v=fx-260';
function savedGold(){try{const n=JSON.parse(localStorage.getItem('veyrath-wallet-v1')||'{}').gold;return Number.isSafeInteger(n)&&n>=0?n:0;}catch{return 0;}}
const sandParticles=new SandParticles();
let showPackFX=true;
const $=id=>document.getElementById(id);
const armoryUI=createArmoryUI();
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
// Draw counters for the performance report (stutter diagnosis, Oct 15): which image sources each frame drew, and
// first-ever draws (new sheets, freshly tinted elite/element sheets, new tint cells) that need a GPU upload.
const drawSeen=new WeakSet(),drawStats={sources:new Set(),first:0,firstMB:0,everCount:0,everMB:0};
{const raw=ctx.drawImage.bind(ctx);ctx.drawImage=function(img,...a){if(img&&!(typeof ImageBitmap!=='undefined'&&img instanceof ImageBitmap&&!isRetainedSprite(img))){if(!drawSeen.has(img)){drawSeen.add(img);const mb=(img.width*img.height*4)/1e6;drawStats.first++;drawStats.firstMB+=mb;drawStats.everCount++;drawStats.everMB+=mb;}drawStats.sources.add(img);}API.draws++;return raw(img,...a);};}
// Render section timer + canvas API counters (stutter diagnosis 3): a spike's report names the slowest render
// sections and how many costly canvas state changes (live filters, non-source-over blends, shadow blur,
// gradients) the frame issued. JS time inside a section also absorbs GPU back-pressure, so the section where
// the GPU stalls shows up even when the cost is on the GPU.
const RP={t:0,s:{}},API={filters:0,blends:0,shadows:0,gradients:0,draws:0};
function rpStart(){RP.t=performance.now();for(const k in RP.s)RP.s[k]=0;}
function rp(name){const n=performance.now();RP.s[name]=(RP.s[name]||0)+(n-RP.t);RP.t=n;}
function takeRenderProfile(){const top=Object.entries(RP.s).filter(([,v])=>v>=.3).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+v.toFixed(1)).join(', ');const api={...API};for(const k in API)API[k]=0;return {sections:top||'-',api:`filters ${api.filters} blends ${api.blends} shadows ${api.shadows} gradients ${api.gradients} draws ${api.draws}`};}
{const P=CanvasRenderingContext2D.prototype,hook=(prop,count)=>{const d=Object.getOwnPropertyDescriptor(P,prop);if(!d||!d.set||!d.get)return;Object.defineProperty(ctx,prop,{configurable:true,get(){return d.get.call(this);},set(v){if(count(v))API[prop==='filter'?'filters':prop==='shadowBlur'?'shadows':'blends']++;d.set.call(this,v);}});};
 hook('filter',v=>v&&v!=='none');hook('globalCompositeOperation',v=>v!=='source-over');hook('shadowBlur',v=>v>0);
 const rg=ctx.createRadialGradient.bind(ctx),lg=ctx.createLinearGradient.bind(ctx);ctx.createRadialGradient=(...a)=>{API.gradients++;return rg(...a);};ctx.createLinearGradient=(...a)=>{API.gradients++;return lg(...a);};}
function takeDrawStats(){let mb=0;for(const s of drawStats.sources)mb+=(s.width*s.height*4)/1e6;const o={images:drawStats.sources.size,imageMB:Math.round(mb),firstDraws:drawStats.first,firstMB:Math.round(drawStats.firstMB)};drawStats.sources.clear();drawStats.first=0;drawStats.firstMB=0;return o;}
const scene={props:[],ground:[]},oasis={x:FORGE.x,y:FORGE.y},mapSpawn={x:1800,y:1400};let mapStatus='Tiled map loading';let devTools=null;
let player={x:1800,y:1400,row:2,frame:0,moving:false};  // `let`: withMember() swaps in a teammate while running their class kit
// Multiplayer Phase 1 (Oct 17): the local player is party member 0; its HP/downed/dead read through to survival.
Object.defineProperties(player,{hp:{get:()=>survival.hp},maxHp:{get:()=>survival.maxHp},downed:{get:()=>!!survival.downed},dead:{get:()=>!!survival.dead}});setLocal(player);
// Local input queue (Multiplayer Phase 1): handlers queue command edges; runCommand() applies them in update().
const localInput={press:[]};
function queueInput(ev){if(localInput.press.length<32)localInput.press.push(ev);}
const camera={x:1800,y:1400,zoom:DEFAULT_CAMERA_ZOOM};
// Oct 16 (user): phones get their own extra zoom (Menu > Mobile zoom, saved); 160% by default on short screens.
let mobileZoom=(()=>{try{const v=Number(localStorage.getItem('veyrath.mobileZoom'));if(v>=.8&&v<=2.5)return v;}catch{}return innerHeight<500?1.6:1;})();
function worldZoom(){return cameraScale(camera.zoom,height)*(touch?mobileZoom:1);}
const keys=new Set();
const pointer={x:0,y:0,active:false};let touch=null;
let classId='sword',mage=null,warrior=null,ranger=null,rgrVfxOn=false;let worldEvents=createWorldEvents(scene.props,Math.random,scene.landmarks??[]),selectedEvent=null;let director=createDirector(),arenas=[],pits=[],victoryShown=false,healing=null,groundXP=createGroundXP(),minimap=createMinimap(),bossChoices=createBossChoices();
const sound=new CombatSound();let combat=createCombat();let survival=createSurvival(combat);let rewards=createRewards(survival,combat,savedGold());let armory=loadArmory(),selectedWeapon=armory.equipped,armoryMode='inventory';rewards.gold=armory.gold;const weaponLoot=[],runWeapons=[],particles=[],numbers=[],rings=[];
classId=weaponClass(armory.weapons.find(w=>w.id===armory.equipped));if(classId==='mage')mage=createMage(survival);survival.classId=classId;if(classId==='sword')warrior=createWarrior(survival);if(classId==='ranger')ranger=createRanger(survival);
const forgeShield=createForgeShield(FORGE),levelNotices=[];survival.forgeShield=combat.forgeShield=forgeShield;
function loadArmory(){recoverAccount(localStorage);const raw=localStorage.getItem('veyrath-armory-v1');if(!raw)return migrateArmory(createArmory(savedGold()));localStorage.setItem('veyrath-armory-before-progression-v7',localStorage.getItem('veyrath-armory-before-progression-v7')??raw);localStorage.setItem('veyrath-armory-before-core-v6',localStorage.getItem('veyrath-armory-before-core-v6')??raw);let a;try{a=JSON.parse(raw);stripRemovedWeapons(a);if(!validArmory(a))throw Error('Invalid collection');const next=endRun(migrateArmory(a)).next;if(!validArmory(next))throw Error('Invalid migrated collection');const normalized=JSON.stringify(next);if(normalized!==raw){next.revision=(a.revision??0)+1;localStorage.setItem('veyrath-armory-v1',JSON.stringify(next));}return next;}catch(e){throw Error('Collection could not be loaded. Original and before-core-v6 backup are preserved: '+e.message);}}
function stripRemovedWeapons(a){if(!Array.isArray(a?.weapons))return false;convertRetired(a);const n=a.weapons.length;a.weapons=a.weapons.filter(w=>!FAMILIES[w?.family]?.removed);if(a.weapons.length===n)return false;if(!a.weapons.length){const fresh=createArmory(a.gold??0);a.weapons=fresh.weapons;a.equipped=fresh.equipped;}if(!a.weapons.some(w=>w.id===a.equipped))a.equipped=a.weapons[0].id;if(a.pendingForge&&!a.weapons.some(w=>w.id===a.pendingForge.weaponId))a.pendingForge=null;return true;}
function persistArmory(next){const raw=localStorage.getItem('veyrath-armory-v1');if(raw){const current=JSON.parse(raw);if(!validArmory(current)||(current.revision??0)!==(armory.revision??0))throw Error('Stale save');}localStorage.setItem('veyrath-armory-v1',JSON.stringify(next));try{localStorage.removeItem('veyrath-wallet-v1');}catch{}noteFound(next);}
// Weapon codex (Oct 16, user): every family that reaches the inventory is recorded as found (practice starters don't count).
function noteFound(a){let next;try{next=markFound(meta,a.weapons.filter(w=>!String(w.id).startsWith('starter-affix-')).map(w=>w.family));}catch{return;}if(next)setMeta(next);}
// Gold pickups arrive in bursts; batch them into one save (performance batch, Oct 15). Flushed on hide/unload.
let goldSaveTimer=0,accountWiped=false;  /* accountWiped: Oct 19 account reset (see reset-account) */
function saveGold(){if(!goldSaveTimer)goldSaveTimer=setTimeout(flushGold,1500);}
function flushGold(){clearTimeout(goldSaveTimer);goldSaveTimer=0;if(accountWiped)return;if((armory.gold??0)===rewards.gold)return;try{const next={...armory,gold:rewards.gold,revision:(armory.revision??0)+1};persistArmory(next);armory=next;}catch{toast('Gold collected; save unavailable or changed in another tab');}}
addEventListener('pagehide',flushGold);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushGold();});
const rangerBusy=r=>!!(r?.charge||r?.fan||r?.step||r?.buffs?.barrage>0);
function applyWeapon(){if(survival.queuedEquip&&!combat.attack&&!warrior?.cast&&!mage?.cast&&!rangerBusy(ranger)){const r=transactArmory(armory,'equip',survival.queuedEquip,{classId,path:survival.path,inRun:inRun()},persistArmory);if(r.next)armory=r.next;delete survival.queuedEquip;}survival.weaponFamily=armory.weapons.find(w=>w.id===armory.equipped)?.family;combat.classId=classId;const w=armory.weapons.find(w=>w.id===armory.equipped),rune=w&&runeFor(meta,w.id);combat.runeColor=rune?.color??null;survival.runeElement=rune?.element??null;combat.weapon=withCards(weaponStats(w,survival.level,survival.endless?'endless':'normal'),survival);syncWeaponPassives(survival,mage,combat.weapon);if(classId!=='mage')$('name-lmb').textContent=w.name+(w.quality?' +'+w.quality:'');setSlotIcon('lmb',w.name,RARITIES[w.rarity]?.color);try{sendWeapon(w);}catch{}}
// UI redesign (Oct 16): slot icons go through ui-icons.js so the user's painted icons can replace the glyphs.
function setSlotIcon(slot,name,tint){const box=$('icon-'+slot);if(!box)return;box.replaceChildren(iconNode(name,classId,slot));if(tint)$('slot-'+slot).style.setProperty('--tint',tint);}
let dash=createDash();const dashTrail=[];let trailClock=0;
// Main-menu batch (Oct 16): menu/shop save, Blink/Dash charges and Ember step.
// Oct 17 (user): the lobby holds the camera on the Pyramid Ruins colonnade court at night (generator area 3).
const LOBBY_SPOT={x:7600,y:1420},LOBBY_NIGHT=960,WELCOME_EL=document.getElementById('welcome');/* Oct 18 (user): all menus at night */
let meta=loadMeta(),mv={max:1,n:1,timer:0},emberT=-1,banishArmed=false,menuDrift=0,lobbyView=false;noteFound(armory);
function setMeta(next){if(!saveMeta(next)){toast('Menu progress could not be saved or changed in another tab. Reload before making more changes.');return false;}meta=next;return true;}
function setLast(patch){setMeta({...meta,last:{...meta.last,...patch}});}
/* Oct 19 audit: images load on first use. Startup used to decode ~940 MB of sheets (hero sprite fallbacks, every boss proxy) before the title, the main cause of slow web loads and memory-pressure lag. A miss on a manifest key starts a background load and returns undefined until it lands. */const lazyPending=new Set();class LazyImages extends Map{get(k){const v=super.get(k);if(v!==undefined||!manifest||lazyPending.has(k))return v;const e=manifest.sheets?.[k]||manifest.props?.[k];if(!e)return v;lazyPending.add(k);loadSprite(e.url+(e.url.includes('?')?'':'?v=fx-260')).then(sp=>{if(e.cellScale)sp.cellScale=e.cellScale;super.set(k,sp);}).catch(()=>{}).finally(()=>lazyPending.delete(k));return v;}warm(keys){for(const k of keys)this.get(k);}}const images=new LazyImages();let width=0,height=0,dpr=1,last=0,time=0,paused=true,ready=false,showDust=true,debug=false;
// Oct 18 (user): wave and elite models load on first use (or when a run rolls them); an older model stands in until then.
const lazySkins=new Set();function warmSkin(skin){if(!skin||lazySkins.has(skin)||!SKIN_FALLBACK[skin])return;lazySkins.add(skin);for(const a of ['Idle','Run','Attack1','TakeDamage1','Die1']){const k=skin+'-'+a,entry=manifest?.sheets?.[k];if(entry&&!images.get(k))loadSprite(entry.url).then(sp=>images.set(k,sp)).catch(()=>lazySkins.delete(skin));}}
function enemySheet(key,t){const img=images.get(key);if(img||!t.skin||!SKIN_FALLBACK[t.skin])return img;warmSkin(t.skin);return images.get(SKIN_FALLBACK[t.skin]+key.slice(t.skin.length));}
const LAZY_START=/^(knight|mage|ranger|colossus\d|wyrm\d|tyrant\d|prophet|butcher|golem)-/;function heroSheets(cls){const p=cls==='mage'?'mage-':cls==='ranger'?'ranger-':'knight-';return Object.keys(manifest?.sheets??{}).filter(k=>k.startsWith(p));}function bossSheets(t){const m=hdModelFor(t),list=m?Object.keys(manifest?.sheets??{}).filter(k=>/^(colossus\d|wyrm\d|tyrant\d|prophet)-/.test(k)&&k.startsWith(t.bossKind==='colossus'?'colossus':t.bossKind==='wyrm'?'wyrm':t.bossKind==='final'?'tyrant':'prophet')):[];if(t.bossSkin)list.push(...Object.keys(manifest?.sheets??{}).filter(k=>k.startsWith(t.bossSkin+'-')));return list;}
function requiredAssets(){return [...DEMON_SHEETS.filter(k=>!LAZY_START.test(k)),'world-rift','world-shrine','world-camp-red','world-camp-blue','world-merchant','world-merchant-run','pickup-pepper','pickup-hotsauce','knight-Pummel','knight-MeleeRun','knight-Special2','knight-CastSpell','knight-ShieldBlockStart','mage-Idle','mage-Run','mage-CastSpell','mage-Attack1','mage-Attack2','mage-Special1','mage-Special2','mage-FrontFlip','mage-StrafeLeft','mage-StrafeRight','mage-RunBackwards','mage-TakeDamage','mage-Die','fx-mage-blue','fx-mage-orange','fx-elite-ice','Wall-A1_E','beast-Idle','beast-Run','beast-Attack1','beast-TakeDamage1','beast-Die1','pickup-gold','fx-storm-wind','fx-rod-orb','fx-rod-aura','fx-slam-dust','fx-parry-shield','fx-parry-spark','fx-slam-shockwave','ranger-Idle','ranger-Run','ranger-RunBackwards','ranger-StrafeLeft','ranger-StrafeRight','ranger-QuickShot','ranger-Attack1','ranger-Attack2','ranger-Special1','ranger-Special2','ranger-CastSpell','ranger-Rolling','ranger-TakeDamage','ranger-Die','knight-Idle','knight-Run','knight-Melee','knight-Melee2','knight-Special1','knight-Rolling','knight-ShieldBlockMid','knight-MeleeSpin','knight-Die','imp-Run','imp-Attack1','imp-Idle','imp-TakeDamage1','imp-Die1',...new Set([...scene.props,...scene.ground].filter(p=>p.key).map(p=>p.key))].filter(k=>!LAZY_START.test(k));}
let manifest;
const quality=createQuality((q,level)=>applyQuality(q,level));
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,quality.settings.dpr)*(quality.settings.res??1);{/* Oct 18: Display > Resolution picks the render height; it overrides the quality cap, Lowest still scales it down. */const rh=renderHeight();if(rh)dpr=Math.min(2.5,rh/height)*(quality.settings.res??1);}canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';}
addEventListener('resize',resize);resize();
async function load(){
  $('retry').hidden=true;$('load-status').textContent='Preparing the desert…';
  try{
    const res=await fetch('assets/manifest.json?v=fx-260');if(!res.ok)throw Error('Asset manifest could not be loaded');manifest=await res.json();const loaded=await loadTiledMap('maps/desert.tmj?v=fx-260',manifest);Object.assign(scene,loaded);if(loaded.width)WORLD.width=loaded.width;if(loaded.height)WORLD.height=loaded.height;const landmark=name=>loaded.landmarks?.find(e=>e.name===name);const spawn=landmark('player-spawn'),forge=landmark('forge');if(spawn){mapSpawn.x=spawn.x;mapSpawn.y=spawn.y;}if(forge){FORGE.x=forge.x;FORGE.y=forge.y;if(Number.isFinite(forge.radius)&&forge.radius>0)FORGE.radius=forge.radius;}Object.assign(oasis,createForgeOasis(scene,FORGE));player.x=camera.x=mapSpawn.x;player.y=camera.y=mapSpawn.y;Object.assign(forgeShield,createForgeShield(FORGE));arenas=buildArenas(scene,mapSpawn,FORGE);mapSig=mapSignature(scene);fetch('maps/ground.json?v='+Date.now()).then(r=>r.ok?r.json():null).then(info=>{groundTiles=info&&info.signature===mapSig?createGroundTiles(info,loadSprite):null;if(info&&!groundTiles)console.info('Ground tiles are stale for this map; using live ground rendering.');}).catch(()=>{});pits=createPits(arenas);worldEvents=createWorldEvents(scene.props,Math.random,scene.landmarks??[]);mapStatus='Tiled · desert.tmj · '+scene.props.length+' props';const required=requiredAssets();let done=0;
    let cursor=0;
    await Promise.all(Array.from({length:8},async()=>{while(cursor<required.length){
      const key=required[cursor++],entry=manifest.sheets[key]||manifest.props[key];if(!entry)throw Error('Missing asset '+key);
      const old=images.get(key);old?.close?.();const sp=await loadSprite(entry.url);if(entry.cellScale)sp.cellScale=entry.cellScale;/* Oct 17: knight-* Warrior model sheets use 256px cells; drawCell scales 128-based source rects */images.set(key,sp);$('progress').value=++done/required.length;
    }}));
    $('load-status').textContent='Preparing terrain and spell graphics…';
    await new Promise(r=>setTimeout(r,0));
    const z=worldZoom();await prepareTerrain(ctx,scene,{x0:camera.x-width/(2*z)-40,y0:camera.y-height/(2*z)-40,x1:camera.x+width/(2*z)+40,y1:camera.y+height/(2*z)+40});
    void vfx.ok; // Compile before the first playable frame, with the normal Canvas fallback.
    ready=true;setTimeout(warmUI,1200);setTimeout(()=>warmAssets(manifest,'fx-260'),1500);/* Oct 21: fetch every lazy sheet/HD strip/ground tile in the background so none waits on the network mid-fight *//* Oct 19: preload UI art in the background (ui-warm.js) */renderForgeChoice();$('loading').hidden=true;$('welcome').hidden=false;front.show('title');if(armory.pendingVictory)renderVictoryReward();requestAnimationFrame(loop);
  }catch(e){$('load-status').textContent=e.message;$('retry').hidden=false;}
}
$('retry').onclick=load;load();
function syncAudio(){sound.setState({dead:survival.dead,encounter:combat.targets.some(e=>e.state==='alive'&&['leader','boss'].includes(e.role)),paused,hidden:document.hidden||!document.hasFocus()});}
function setPaused(value){touch?.reset();localInput.press.length=0;if(value)queueInput('cancel');showBuild(false);$('levelup-panel').hidden=true;$('armory-panel').hidden=true;$('salvage-confirm').hidden=true;$('reward-panel').hidden=true;$('world-panel').hidden=true;paused=value;$('minimap-wrap').hidden=value;$('world-interact').hidden=value;keys.clear();clearMageInput(mage);clearAttackInput(combat);player.moving=false;$('menu').hidden=!value;if(survival.dead)$('gameover').hidden=value;syncAudio();}
$('enter').onclick=()=>{if(armory.pendingVictory){renderVictoryReward();return;}if(net.lobby&&net.peers.size&&!startNow&&!inRun()&&!clientRun&&!(net.role==='client'&&hostRunning)){if(net.role==='host'&&!survival.path){renderPathPicker();return;}setReady(!myReady);return;}if(net.role==='client'){net.send(net.lobby.owner,{t:'ask'});toast('Joining the run · waiting for the host to start');return;}if(survival.dead)resetEncounter();if(!survival.path){renderPathPicker();return;}if(net.role==='host'&&net.peers.size&&!startNow){hostCountdown();return;}
 startModes();applyWeapon();syncWeaponPassives(survival,mage,combat.weapon,true);survival.pathLocked=true;$('welcome').hidden=true;document.body.classList.remove('in-menu');lobbyView=false;camera.x=player.x;camera.y=player.y;/* Oct 18 (user): the run opens on your character, no pan from the menu/pyramid view */paused=false;syncAudio();sound.unlock();canvas.focus();if(awardLevelPoints(survival,[]))queueMicrotask(openLevelUp);if(net.role==='host'&&net.peers.size){hostRun++;hostPeers.clear();cardsAt=performance.now()+CARD_DELAY;for(const [from,m] of pendingJoins)hostMessage(m,from);pendingJoins.clear();resetHostSync(hostSync);net.broadcast({t:'start',run:hostRun});}};
$('resume').onclick=()=>{if(!$('welcome').hidden){closeFrontSettings();return;}setPaused(false);};
// Mode, modifiers and shop bonuses for this run (docs/main-menu-plan.md).
function startModes(){const m=runMods(meta,meta.last.mode??'normal',meta.last.mods??[]);survival.startedAt=Date.now();survival.telemetry={levels:[{level:1,world:0,real:0}],xpCollected:0,goldStart:rewards.gold,account:{slots:meta.gameplaySlots,runes:[...meta.gameplayRunes],loadout:runRuneLoadout(meta,classId),weapon:structuredClone(armory.weapons.find(w=>w.id===armory.equipped)),helpers:{reroll:m.reroll,banish:m.banish}}};survival.runId='run-'+Date.now()+'-'+Math.random().toString(36).slice(2);survival.gameplayLoadout=runRuneLoadout(meta,classId);survival.spellColor=armory.victoryUnlocked?meta.spellColor:null;survival.realm=createRealmSchedule();survival.mods=m;survival.mode=m.mode;survival.endless=m.mode==='endless';survival.helpers={reroll:m.reroll,banish:m.banish};dash.reach=m.reach;mv={max:m.charges,n:m.charges,timer:0};emberT=-1;setLast({paths:{...meta.last.paths,[classId]:survival.path}});}
installSettingsUI();
function openFrontSettings(){$('menu-title').textContent='SETTINGS';$('menu').classList.add('fe-settings-mode');$('resume').innerHTML='Close <kbd>Esc</kbd>';$('menu').hidden=false;}
function closeFrontSettings(){$('menu').hidden=true;$('menu').classList.remove('fe-settings-mode');$('resume').innerHTML='Resume <kbd>Esc</kbd>';}
// UI redesign batch 2 (Oct 16, user reference): pause menu Restart R / Menu Backspace / Abandon X. Each needs a second press within 2.5s.
const PAUSE_LABELS={restart:['restart-run','Restart <kbd>R</kbd>'],menu:['reset','Menu <kbd>Backspace</kbd>'],abandon:['abandon-run','Abandon <kbd>X</kbd>']};let pauseArmed=null,pauseArmTimer=0;
function disarmPause(){clearTimeout(pauseArmTimer);pauseArmed=null;for(const [id,label] of Object.values(PAUSE_LABELS))$(id).innerHTML=label;}
function pauseAction(kind){if(pauseArmed!==kind){disarmPause();pauseArmed=kind;$(PAUSE_LABELS[kind][0]).textContent='Press again to confirm';pauseArmTimer=setTimeout(disarmPause,2500);return;}disarmPause();
 if(kind==='restart')restartRun();else if(kind==='menu'){resetEncounter('title');sound.restart();}else if(!survival.dead){setPaused(false);survival.hp=0;survival.dead=true;survival.cast=null;clearAttackInput(combat);combat.attack=null;}}
// Same class and path, fresh run (Restart in the pause menu, Rise again / R on the death screen).
function restartRun(){const path=survival.path;resetEncounter();sound.restart();if(path&&choosePath(survival,path)){combat.skills=survival.skills;renderPathPicker();configureAbilityLabels();$('enter').onclick();}}
$('restart-run').onclick=()=>pauseAction('restart');$('abandon-run').onclick=()=>pauseAction('abandon');
$('dev-section').hidden=!new URLSearchParams(location.search).has('debug');
$('settings').onclick=()=>{if(ready&&$('welcome').hidden){$('menu-title').textContent='PAUSED';setPaused(true);}};

{const mz=$('mobile-zoom'),show=()=>{$('mobile-zoom-value').textContent=Math.round(mobileZoom*100)+'%';};mz.value=mobileZoom;show();mz.oninput=()=>{mobileZoom=Number(mz.value);try{localStorage.setItem('veyrath.mobileZoom',mobileZoom);}catch{}show();};}
$('zoom').oninput=e=>{camera.zoom=Number(e.target.value);$('zoom-value').textContent=Math.round(camera.zoom*100)+'%';};
$('debug').onchange=e=>debug=e.target.checked;
$('dust').onchange=e=>showDust=e.target.checked;
$('pack-fx').onchange=e=>showPackFX=e.target.checked;
for(const channel of ['music','background','fx']){const input=$(channel+'-volume'),output=$(channel+'-volume-value');input.value=Math.round((channel==='music'?sound.musicVolume:sound[channel])*100);output.textContent=input.value+'%';input.oninput=()=>{sound.setVolume(channel,Number(input.value)/100);output.textContent=input.value+'%';sound.unlock();};}
$('gameover-settings').onclick=()=>{setPaused(true);$('menu-title').textContent='SETTINGS';};
// Oct 16 run director hooks: bosses arrive ~450 units from the player on open ground.
function openNear(x,y,props,r=50){for(let k=0;k<10;k++)for(let i=0;i<12;i++){const a=i/12*Math.PI*2,q={x:x+Math.cos(a)*k*45,y:y+Math.sin(a)*k*45};if(q.x>80&&q.y>80&&q.x<WORLD.width-80&&q.y<WORLD.height-80&&!blocked(q.x,q.y,props,r))return q;}return {x,y};}
/* Oct 19 (user): o.final = the 29:00 Reckoning Colossus (HP x2 = the old Tyrant's 170k, PROPOSAL) */function spawnRunBoss(kind,props,o={}){const a=Math.random()*Math.PI*2,d=kind==='final'||o.final?380:470,q=openNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d*.7,props,60);const b=makeBoss(survival,combat,q.x,q.y,kind,o.final?{hpScale:2}:{});if(kind==='final'||o.final){b.emerge=2.5;b.arena={x:player.x,y:player.y};}if(o.final)b.finalBoss=true;return b;}
/* Oct 19 (user): the Crimson Tyrant's realm (realm.js). Host/solo only; friends are moved by the host like the pit exit. */function realmArena(){return arenas.find(a=>a.kind==='realm');}
function realmFrame(dt){if(clientRun)return [];const a=realmArena();return tickRealm(survival.realm,survival,combat,dt,{arena:a,players:()=>realPlayers().map(p=>({id:p.id,x:p.x,y:p.y,owner:p.local?(survival.rewardOwner??0):p.steam,ref:p})),busy:()=>!!pitExit||combat.targets.some(e=>e.role==='boss'&&e.state==='alive'&&!e.pit),place:(p,x,y)=>{const m=p.ref??p;m.x=x;m.y=y;shield(m);},spawn:a=>{const b=makeBoss(survival,combat,a.x,a.y-a.radius*.25*.72,'final',{hpScale:REALM.hp(survival.clock)});Object.assign(b,{pit:a.id,emerge:2.5,arena:{x:a.x,y:a.y},home:{x:a.x,y:a.y},homeR:a.radius});return b;}});}
/* Each PC banks its own personal red weapon when the realm Tyrant dies (host from its events, friends from the forwarded death). */function realmLoot(events){for(const e of events){if(e.type!=='death'||e.bossKind!=='final')continue;if(e.eligibleOwners&&!e.eligibleOwners.includes(String(survival.rewardOwner??0)))continue;const w=makeWeapon(survival.level,Math.random,5,null,survival.classId??classId,survival.path);const r=pocketRealmReward(armory,w,(survival.runId??clientRunId??'local')+':realm:'+e.id,{x:e.x,y:e.y});if(r.next&&!r.duplicate){try{persistArmory(r.next);armory=r.next;applyWeapon();toast('Red weapon claimed from the Tyrant · in your pocket','#ff5a5a');}catch{toast('Save failed; realm weapon not stored.');}}}}
function finalClear(){for(const t of combat.targets)if(t.state==='alive'&&t.bossKind!=='final'){t.state='dead';t.death=1.2;t.swing=null;}rewards.hazards.length=0;combat.enemyProjectiles=[];}
let pendingVictoryEvent=null;
function showVictory(e={}){
 if(victoryShown)return;
 if(e.eligibleOwners&&!e.eligibleOwners.includes(String(clientRun?net.me:0)))return;
 const id=(survival.runId??clientRunId??'run')+':final';
 try{const next=prepareVictory({...armory,gold:rewards.gold},{id,level:survival.level,classId,path:survival.path,eligible:['normal','endless'].includes(survival.mode??'normal')&&!survival.cheated&&!e.cheated});
 if(!armory.pendingVictory&&!armory.rewardClaims?.includes(id))next.gold+=1500;
 next.revision=(armory.revision??0)+1;persistArmory(next);armory=next;rewards.gold=next.gold;victoryShown=true;recordBest(true);renderVictoryReward();
 pendingVictoryEvent=null;}catch{pendingVictoryEvent=e;toast('Victory reward could not be saved. It will retry.');}}
function renderVictoryReward(){
 const pending=armory.pendingVictory;if(!pending)return;
 setPaused(true);$('menu').hidden=true;$('victory').hidden=false;$('victory-return').disabled=true;
 $('victory-summary').textContent='Victory! Your equipped weapon, safe pocket and entire run bag are banked. Choose one orange weapon.'+(pending.eligible?' This also unlocks the victory achievement and Tyrant’s Gold spell color.':' This run does not qualify for the achievement.');
 let box=$('victory-choices');if(!box){box=document.createElement('div');box.id='victory-choices';$('victory-return').before(box);}
 box.replaceChildren(...pending.offers.map((w,i)=>{const b=document.createElement('button');b.textContent=RARITIES[w.rarity].name+' '+w.name+' · '+w.affixes.map(a=>describeAffix(w,a,survival.level)).join(' · ');b.style.display='block';b.style.margin='12px 0';b.onclick=()=>{const r=claimVictory(armory,i);if(r.error){toast(r.error);return;}r.next.revision=(armory.revision??0)+1;try{persistArmory(r.next);armory=r.next;box.replaceChildren();$('victory-return').disabled=false;$('victory-summary').textContent='Reward saved.'+(armory.victoryUnlocked?' Achievement and Tyrant’s Gold spell color unlocked.':'');if(survival.endless){$('victory').hidden=true;setPaused(false);toast('Victory rewards banked. New Endless loot is now at risk.');}}catch{toast('Save failed; your choice remains available.');}};return b;}));
}
function recordBest(victory){if(survival.recorded)return false;survival.recorded=true;const w=armory.weapons.find(w=>w.id===armory.equipped),r={classId,mode:survival.mode??'normal',time:Math.floor(survival.clock),level:survival.level,kills:combat.kills,gold:rewards.runGold??0,victory:!!victory,pathName:pathInfo(survival)?.name,weapon:w?.name,modNames:(survival.mods?.modIds??[]).map(id=>MODIFIERS.find(d=>d.id===id)?.name),date:Date.now(),telemetry:{...survival.telemetry,realSeconds:Math.round((Date.now()-(survival.startedAt??Date.now()))/1000),partySize:party.players.length,blessings:survival.blessings??{},trialDevelopments:survival.bonusPointsEarned??0,cheated:!!survival.cheated,retained:endRun(armory,{victory:!!victory}).next.weapons.filter(w=>w.location!=='ground').map(w=>({id:w.id,family:w.family,rarity:w.rarity,power:w.quality,location:w.location}))}},out=recordRun(meta,r);setMeta(out.next);return out.isBest;}
// Playtest hook (Oct 16): open the game with ?debug, then in the console:
// veyrathDebug.skipTo(1790) jumps the run clock; veyrathDebug.summon('butcher'|'prophet'|'colossus'|'wyrm'|'ravager'|'final').
// Oct 16 (user): F2 test menu (cheats.js). Oct 17 (user): enabled on the published site too so testers can use it. Flags are applied each frame in update().
const CHEATS=true,cheatFlags={damage:1},cheatEvents=[];let cheatMenu=null;
if(CHEATS){const run=fn=>(...a)=>{if(!survival.path||survival.dead||!$('welcome').hidden){toast('Start a run first');return;}survival.cheated=true;fn(...a);};
 cheatMenu=createCheatMenu({flags:cheatFlags,level:()=>survival.level,
  unlock:run(all=>{const nodes=pathNodes(survival).filter(n=>all||n.tier===0).sort((a,b)=>a.tier-b.tier);let n=0;for(const node of nodes)if(!survival.skills?.[node.id]){if(!learn(survival,node.id))(survival.skills??={})[node.id]=1;n++;}if(!all){survival.pendingPicks=(survival.pendingPicks??[]).filter(p=>p.kind!=='spell');survival.offer=null;}combat.skills=survival.skills;applyWeapon();configureAbilityLabels();if(mage)updateMageHUD();toast(n+(all?' spells and augments learned':' spells learned'));}),
  levels:run(n=>{const ev=[];for(let i=0;i<n;i++){survival.xp=survival.nextXP;acceptEvents(survival,combat,ev);}ev.forEach(onCombatEvent);toast('Level '+survival.level);}),
  heal:run(()=>{survival.hp=survival.maxHp;}),
  addBot:run(cls=>{const b=addBot(cls,survival);if(b)makeKit(b);toast(b?b.name+' joined the party (test bot)':'Party is full ('+PARTY.max+')');}),
  clearBots:()=>{clearAllies();toast('Test bots removed');},downAlly:run(()=>{const b=party.players.find(q=>!q.local&&standing(q));if(b){b.hp=0;b.downed=true;b.revive=0;b.downedTime=0;}}),
  bosses:[...$('boss-spawn-kind').options].map(o=>[o.value,o.textContent]),
  boss:run(kind=>{const b=spawnRunBoss(kind,scene.props);b.emerge=1;toast(b.name+' summoned');}),
  elite:run(()=>$('summon-elite').onclick()),miniBoss:run(()=>$('summon-boss').onclick()),
  enemies:run((role,n)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,q=openNear(player.x+Math.cos(a)*280,player.y+Math.sin(a)*190,scene.props,30);if(role==='imp')spawnImp(survival,combat,q.x,q.y);else spawnRoleAt(survival,combat,role,q.x,q.y);}}),
  killAll:run(()=>{let n=0;for(const e of combat.targets)if(e.state==='alive'){e.emerge=0;e.invulnerable=0;cheatEvents.push(...damageEnemy(combat,e,e.hp*10+1e6,player,{}));n++;}toast(n+' enemies hit for a kill');}),
  clock:run(sec=>{survival.clock=sec;toast('Clock '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'));}),
  places:()=>[{label:'Forge',x:FORGE.x,y:FORGE.y},...arenas.map(a=>({label:a.id.replace(/-/g,' '),x:a.x,y:a.y})),...worldEvents.events.map(e=>({label:e.kind+' ('+e.status+')',x:e.x,y:e.y}))],
  teleport:run(p=>{const q=openNear(p.x,p.y+90,scene.props,40);player.x=camera.x=q.x;player.y=camera.y=q.y;}),
  gold:run(n=>{rewards.gold+=n;flushGold();toast('+'+n+' gold');}),
  rarities:RARITIES.map(r=>r.name),
  weapon:run(r=>{weaponLoot.push({x:player.x+50,y:player.y+30,clock:0,weapon:makeWeapon(Math.max(1,survival.level),Math.random,r,null,classId,survival.path)});toast(RARITIES[r].name+' weapon dropped')})});}
if(new URLSearchParams(location.search).has('debug'))globalThis.veyrathDebug={autopilot:(o={})=>{AP={speed:o.speed??8,revive:o.revive??true,t:0,side:1,lmb:0,cast:0,ci:0,dashCd:0,nextLog:0,log:[],deaths:[],killed:{}};return true;},apReport:()=>AP&&{log:AP.log,deaths:AP.deaths,killed:AP.killed,clock:survival.clock,level:survival.level,victory:!!survival.victory},apStop:()=>{AP=null;keys.stick=null;return true;},network:()=>networkReport(),pitExit:()=>pitExit&&{a:pitExit.a.id,bossId:pitExit.bossId,wait:[...pitExit.wait]},rewards:()=>bossChoices.pending.map(r=>r.bossId),spellSpam:(n=40)=>{for(const k in mage.cooldowns)mage.cooldowns[k]=0;mage.energy.value=mage.energy.max;const kinds=['fireball','nova','chain','meteor'];let ok=0;for(let i=0;i<n;i++){for(const k in mage.cooldowns)mage.cooldowns[k]=0;mage.energy.value=mage.energy.max;mage.cast=null;const a=Math.random()*Math.PI*2;if(queueMageSpell(mage,combat,survival,player,{x:player.x+Math.cos(a)*300,y:player.y+Math.sin(a)*200},kinds[i%4],[...scene.props]))ok++;}return ok;},kitSize:()=>{const k=kitView(player);const out={};for(const part of ['s','c','mage']){const o=k[part];if(!o)continue;for(const f in o){const s=JSON.stringify(o[f]??null);if(s&&s.length>200)out[part+'.'+f]=s.length;}}out.np=JSON.stringify(k.np??[]).length;out.hazards=JSON.stringify(rewards.hazards).length;return out;},vote:()=>({vote:voteInfo(),ok:[...arenaOk],pits:pits.map(p=>p.boss+':'+p.status),box:voteBox&&!voteBox.hidden?voteBox.querySelector('b').textContent:null,clientVote:survival.arenaVote??null}),toPit:(boss='wyrm')=>{const pit=pits.find(p=>p.boss===boss);if(!pit)return null;player.x=pit.arena.x;player.y=pit.arena.y+pit.arena.radius*.3*.72;return {x:Math.round(player.x),y:Math.round(player.y),r:pit.arena.radius};},castVote:yes=>{castVote(yes);return true;},tickInfo:()=>({loopFrames,loopErr,hostTickCalls,hostTickLast,seq:hostSync.seq}),hostTickNow:()=>{try{snapClock=0;hostTick(.06);return {seq:hostSync.seq};}catch(e){return 'THROW '+e.message+' '+String(e.stack).slice(0,400);}},netState:()=>({snapN:clientSync.n,hostSeq:hostSync.seq,online:onlineHost(),inRun:inRun(),peers:[...net.peers.keys()],owner:net.lobby?.owner,role:net.role,clientRun,classId,me:net.me,myNetId,survivalClass:survival.classId,kitObjs:[!!mage,!!warrior,!!ranger],picks:survival.pendingPicks?.length??0,offer:!!survival.offer,panel:!$('levelup-panel').hidden,hold:survival.levelPause??null,player:{x:Math.round(player.x),y:Math.round(player.y)},players:party.players.map(p=>({id:p.id,local:!!p.local,cls:p.kit?.classId??p.classId,steam:p.steam,x:Math.round(p.x),y:Math.round(p.y)}))}),online:on=>{forceOnline=!!on;return forceOnline;},hold:()=>({info:levelPauseInfo(),hostPicks:picksOf(player),friendPicks:party.players.filter(p=>p.remote).map(picksOf),panel:!$('levelup-panel').hidden,banner:levelWaitEl?.hidden===false?levelWaitEl.textContent:null,clock:survival.clock}),fieldChurn:(rounds=10)=>{const H=createHostSync(),cnt={},bytes={};const mk=()=>hostSnapshot(H,{channels:{e:combat.targets},shared:{},players:[],light:new Set(combat.targets)});mk();return new Promise(res=>{let i=0;const iv=setInterval(()=>{const s=JSON.parse(mk());for(const [,f] of s.ch.e.d)for(const k in f){cnt[k]=(cnt[k]??0)+1;bytes[k]=(bytes[k]??0)+JSON.stringify(f[k]).length;}if(++i>=rounds){clearInterval(iv);res(Object.entries(bytes).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([k,b])=>k+':'+cnt[k]+'x/'+b+'B'));}},120);});},spawnMany:n=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,q=openNear(player.x+Math.cos(a)*(200+Math.random()*500),player.y+Math.sin(a)*(150+Math.random()*350),scene.props,30);spawnImp(survival,combat,q.x,q.y);}return combat.targets.length;},netBench:(rounds=20)=>{const H=createHostSync(),C=createClientSync(),ch=()=>({e:combat.targets,h:rewards.hazards,b:combat.enemyProjectiles??[],x:groundXP.items,k:healing?.packs??[],w:worldEvents.events}),mk=()=>hostSnapshot(H,{channels:ch(),shared:{clock:survival.clock},players:party.players.map(m=>({id:m.id,rec:recView(m),kit:kitView(m)})),light:new Set([...combat.targets,...party.players])});let t0=performance.now();const full=mk();const tFull=performance.now()-t0;let tb=0,tp=0,bytes=0;for(let i=0;i<rounds;i++){for(const e of combat.targets){e.x+=1;e.frame=(e.frame??0)+1;}let a=performance.now();const s=mk();tb+=performance.now()-a;bytes+=s.length;a=performance.now();applySnapshot(C,JSON.parse(s));tp+=performance.now()-a;}const last=JSON.parse(mk());const fld={};for(const [,f] of last.ch.e.d)for(const k in f)fld[k]=(fld[k]??0)+JSON.stringify(f[k]).length+k.length+3;const parts=Object.fromEntries(Object.entries(last.ch).map(([k,v])=>[k,JSON.stringify(v).length]));parts.players=JSON.stringify(last.p).length;parts.ev=JSON.stringify(last.ev).length;return {parts,fields:Object.entries(fld).sort((a,b)=>b[1]-a[1]).slice(0,12),enemies:combat.targets.length,fullKB:Math.round(full.length/1024),fullMs:Math.round(tFull*10)/10,buildMs:Math.round(tb/rounds*10)/10,applyMs:Math.round(tp/rounds*10)/10,avgKB:Math.round(bytes/rounds/1024*10)/10};},syncFriend:()=>{const r=party.players.find(p=>p.steam==='test-steam');if(r)syncKit(r);return {level:r?.kit?.s.level,picks:r?.kit?.s.pendingPicks?.length,offer:r?.kit?.s.offer?.options?.map(o=>o.name),maxHp:r?.kit?.s.maxHp};},friendKit:()=>{const r=party.players.find(p=>p.steam==='test-steam');return {lvl:r?.kit?.lvl,rootLevel:survival.level,kitSync,players:party.players.length,downed:r?.downed,dead:r?.dead,paused};},fakeFriend:(cls='ranger')=>{hostMessage({t:'join',cls,name:'Test friend',helpers:{reroll:1,banish:1}},'test-steam');const r=party.players.find(p=>p.steam==='test-steam');return r?{id:r.id,picks:r.kit.s.pendingPicks?.length??0,offer:r.kit.s.offer?.options?.map(o=>o.name),skills:Object.keys(r.kit.s.skills)}:null;},friendAct:(op,i=0)=>{hostMessage({t:'lvl',run:hostRun,op,i},'test-steam');const r=party.players.find(p=>p.steam==='test-steam');return r?{picks:r.kit.s.pendingPicks?.length??0,offer:r.kit.s.offer?.options?.map(o=>o.name)??null,skills:Object.keys(r.kit.s.skills),helpers:r.kit.s.helpers,level:r.kit.s.level}:null;},friendSnapParticles:()=>{const r=party.players.find(p=>p.steam==='test-steam');return r?{np:kitView(r).np?.length??0,again:kitView(r).np?.length??0}:null;},testAccept:()=>{const before=survival.xp;acceptEvents(survival,combat,[{type:'xpCollected',xp:50}]);return {before,after:survival.xp,card:JSON.stringify(survival.cardStats)};},giveXp:n=>{cheatEvents.push({type:'xpCollected',xp:n});return n;},xp:()=>({worldXp:survival.world?.xp,cardXp:survival.cardStats?.xp,level:survival.level,xp:survival.xp,next:survival.nextXP,orbs:groundXP.items.length,orbValue:groundXP.value,picks:survival.pendingPicks?.length??0,alive:combat.targets.filter(e=>e.state==='alive').length,paused,levelPanel:!$('levelup-panel').hidden}),kill:()=>{let n=0;for(const e of combat.targets)if(e.state==='alive'&&e.role!=='anchor'){cheatEvents.push(...damageEnemy(combat,e,1e7,player,{}));n++;}return n;},collect:()=>{const o=groundXP.items[0];if(o){player.x=o.x;player.y=o.y;}return groundXP.items.length;},start:()=>{if(!survival.path){choosePath(survival,PATHS[classId][0].id);combat.skills=survival.skills;}$('enter').onclick();return inRun();},addBotKit:cls=>{const b=addBot(cls,survival);if(b)makeKit(b);return !!b;},netSnap:()=>{const H=createHostSync(),C=createClientSync(),t0=performance.now();const str=hostSnapshot(H,{channels:{e:combat.targets,h:rewards.hazards,b:combat.enemyProjectiles??[],x:groundXP.items,k:healing?.packs??[],w:worldEvents.events},shared:{clock:survival.clock},players:party.players.map(m=>({id:m.id,rec:recView(m),kit:kitView(m)})),light:new Set([...combat.targets,...party.players])}),ms=performance.now()-t0;const ok=applySnapshot(C,JSON.parse(str));const again=hostSnapshot(H,{channels:{e:combat.targets,h:rewards.hazards,b:combat.enemyProjectiles??[],x:groundXP.items,k:healing?.packs??[],w:worldEvents.events},shared:{clock:survival.clock},players:party.players.map(m=>({id:m.id,rec:recView(m),kit:kitView(m)})),light:new Set([...combat.targets,...party.players])});return {ok,fullBytes:str.length,deltaBytes:again.length,ms:Math.round(ms*10)/10,enemies:combat.targets.length,players:party.players.length,kitBytes:party.players.map(m=>JSON.stringify(kitView(m)??{}).length)};},skipTo:sec=>{survival.clock=sec;return sec;},summon:kind=>{const b=spawnRunBoss(kind,scene.props);b.emerge=.5;return b.name;},state:()=>({clock:survival.clock,phase:phaseAt(survival.clock).id,alive:combat.targets.filter(e=>e.state==='alive').length,hazards:rewards.hazards.length,arenas:arenas.map(a=>a.id+'@'+Math.round(a.x)+','+Math.round(a.y)),pits:pits.map(p=>p.boss+':'+p.status)}),god:()=>{survival.maxHp=survival.hp=99999;},peek:()=>({player,worldEvents,arenas,survival,combat,scene,paused,RP}),bakeGroundTiles:async()=>{const T=GROUND_TILE,cols=Math.ceil(scene.width/T),rows=Math.ceil(scene.height/T),anchorOf=k=>(PROP_BASES[k]||DECOR_BASES[k])?.anchor??manifest.props?.[k]?.anchor;let n=0;
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const cv=document.createElement('canvas');cv.width=cv.height=T;const c=cv.getContext('2d');renderGroundTile(c,scene,images,anchorOf,x,y,(n+1)*10);const blob=await new Promise(r=>cv.toBlob(r,'image/webp',.86));const res=await fetch('/__save?path=maps/ground/'+x+'_'+y+'.webp',{method:'POST',body:blob});if(!res.ok)throw Error('save failed '+x+','+y);n++;}
   const info={tile:T,cols,rows,signature:mapSig,format:'webp'};await fetch('/__save?path=maps/ground.json',{method:'POST',body:JSON.stringify(info)});return info;}};
// Oct 16 (user): a toggled-on Orb shows a ring around the mage that pulses with them (never left behind):
// soft blended glow + a wave sweeping out on each pulse; the only line is a rough, flickering outer border.
function orbRim(R,amp,phase){ctx.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,n=Math.sin(a*7+time*2.3+phase)*.45+Math.sin(a*13-time*3.7)*.3+Math.sin(a*29+time*6.1+phase*2)*.25,r=R*(1+amp*n);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();}
function orbGlow(r0,r1,stops){const g=ctx.createRadialGradient(0,0,r0,0,0,r1);for(const [o,c] of stops)g.addColorStop(o,c);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r1,0,Math.PI*2);ctx.fill();}
function drawOrbAura(){if(!mage?.orbOn||combat.weapon?.primary!=='orb')return;const R=magePrimary(combat).radius??135,last=mage.effects.filter(e=>e.kind==='apulse').reduce((m,e)=>Math.min(m,e.age),9),flare=Math.max(0,1-last/.5)**2,w=Math.min(1,last/.38),dry=false,k=dry?.45:1,br=.5+.5*Math.sin(time*2.6),rgba=(r,g,b,a)=>`rgba(${r},${g},${b},${Math.max(0,a).toFixed(3)})`;
 ctx.save();ctx.translate(player.x,player.y);ctx.scale(1,.6);ctx.globalCompositeOperation='lighter';
 // Body of the field: a faint breathing haze that thickens toward the rim, brighter for a beat after each pulse.
 orbGlow(0,R*1.08,[[0,rgba(120,80,255,0)],[.45,rgba(120,80,255,(.025+.015*br)*k)],[.82,rgba(160,120,255,(.07+.03*br+.16*flare)*k)],[.93,rgba(200,170,255,(.06+.2*flare)*k)],[1,rgba(160,120,255,0)]]);
 // Pulse wave: a soft luminous band that sweeps from the mage out to the rim, fading as it goes.
 if(w<1){const wr=R*(1-(1-w)**3),a=(1-w)*.42*k;orbGlow(Math.max(0,wr-R*.32),wr+R*.06,[[0,rgba(140,100,255,0)],[.7,rgba(190,160,255,a*.6)],[.88,rgba(235,220,255,a)],[1,rgba(190,160,255,0)]]);}
 // Inner core bloom at the mage's feet on the beat.
 if(flare>.01)orbGlow(0,R*.35,[[0,rgba(235,220,255,.3*flare*k)],[1,rgba(150,110,255,0)]]);
 // Rough outer border: a wide soft halo plus a thin bright jagged edge, both flickering.
 const rim=R*(1+.04*flare);ctx.lineJoin='round';orbRim(rim,.022+.02*flare,0);ctx.strokeStyle=rgba(170,130,255,(.1+.12*flare)*k);ctx.lineWidth=9+6*flare;ctx.stroke();
 orbRim(rim,.03+.02*flare,1.7);ctx.strokeStyle=rgba(225+30*flare,205+40*flare,255,(.32+.06*br+.45*flare)*k);ctx.lineWidth=1.6+1.6*flare;ctx.stroke();
 ctx.restore();}
function resetEncounter(screen){if(inRun()&&!survival.recorded)recordBest(false);if(net.role==='host'&&net.peers.size&&inRun())net.broadcast({t:'end',run:hostRun});clientRun=false;hostPeers.clear();for(const k in hostShrineHeals)delete hostShrineHeals[k];frameEvents=[];snapClock=0;levelHold=null;arenaVote=null;arenaOk.clear();arenaCooldown.clear();settleRun();clearAllies();player.revive=0;player.x=camera.x=mapSpawn.x;player.y=camera.y=mapSpawn.y;player.row=2;player.invulnerable=false;player.unseen=false;combat=createCombat();dash=createDash();survival=createSurvival(combat);for(const k of rosterSkins(survival.roster))warmSkin(k);survival.classId=classId;mage=classId==='mage'?createMage(survival):null;warrior=classId==='sword'?createWarrior(survival):null;ranger=classId==='ranger'?createRanger(survival):null;groundXP=createGroundXP();healing=null;director=createDirector();pits=createPits(arenas);victoryShown=false;$('victory').hidden=true;minimap=createMinimap();bossChoices=createBossChoices();worldEvents=createWorldEvents(scene.props,Math.random,scene.landmarks??[]);selectedEvent=null;Object.assign(forgeShield,createForgeShield(FORGE));survival.forgeShield=combat.forgeShield=forgeShield;levelNotices.length=0;rewards=createRewards(survival,combat,rewards.gold);weaponLoot.length=runWeapons.length=0;combat.weapon=weaponStats(armory.weapons.find(w=>w.id===armory.equipped),1);syncWeaponPassives(survival,mage,combat.weapon,true);rings.length=0;sandParticles.clear();$('gameover').hidden=true;dashTrail.length=0;particles.length=numbers.length=0;setPaused(true);$('menu').hidden=true;$('welcome').hidden=false;const lastPath=meta.last.paths?.[classId];if(lastPath&&pathUnlocked(meta,PATHS[classId],lastPath)&&choosePath(survival,lastPath)){combat.skills=survival.skills;if(classId==='ranger'||classId==='sword'||classId==='mage')selectPathWeapon(armory,lastPath);}configureClassUI();if(screen)front.show(screen);}
$('restart').onclick=()=>restartRun();$('victory-return').onclick=()=>{$('victory').hidden=true;resetEncounter('title');sound.restart();};$('gameover-menu').onclick=()=>{resetEncounter('title');sound.restart();};$('reset').onclick=()=>pauseAction('menu');

function renderPathPicker(){
 const options=PATHS[classId];if(survival.path&&!survival.pathLocked&&!pathUnlocked(meta,options,survival.path)){survival.path=null;survival.skills={};combat.skills=survival.skills;}$('path-picker').replaceChildren(...options.map(path=>{const b=document.createElement('button');b.className='path-choice';b.style.setProperty('--path-color',path.color);b.setAttribute('aria-pressed',String(survival.path===path.id));const name=document.createElement('strong');name.textContent=path.icon+' '+path.name;const text=document.createElement('small');text.textContent=path.description;b.append(name,text);const open=pathUnlocked(meta,options,path.id);if(!open){b.classList.add('locked');b.disabled=true;name.textContent='🔒 '+path.icon+' '+path.name;text.textContent='Locked · unlock in Unlocks for '+PATH_PRICE+' gold';}b.onclick=()=>{if(open&&choosePath(survival,path.id)){if(classId==='ranger'||classId==='sword'||classId==='mage'){selectPathWeapon(armory,path.id);applyWeapon();}combat.skills=survival.skills;renderPathPicker();configureAbilityLabels();}};return b;}));$('path-note').textContent=survival.path?'Chosen: '+pathInfo(survival).name+' · locks when you enter.':'Choose your path. No spells at the start: pick your first spell as the run begins.';$('enter').disabled=!survival.path;
}
function configureAbilityLabels(){const isMage=classId==='mage',tint=pathInfo(survival)?.color??(isMage?'#46d3f2':'#e6c581'),kinds=['fireball','nova','chain','meteor','blink'],keys=['RMB','Q','E','R'];
 ['cleave','parry','slam','storm','dash'].forEach((slot,i)=>{const name=isMage?mageAbility(survival,kinds[i]).name:i<4?(classId==='ranger'?rangerAbility(survival,keys[i])?.name:warriorAbility(survival,keys[i])?.name)??slot:classId==='ranger'?'Roll':'Dodge';$('name-'+slot).textContent=name;setSlotIcon(slot,name,slot==='dash'?'#d9dee8':tint);});
 const w=armory.weapons.find(w=>w.id===armory.equipped);setSlotIcon('lmb',w?.name??'Weapon',w?RARITIES[w.rarity]?.color:'#d9dee8');if(!isMage)updateClassHUD();}

$('summon-elite').onclick=()=>{const e=summonElite(rewards,survival,combat,player,scene.props,{width,height,zoom:worldZoom()});if(e){setPaused(false);toast(e.eliteName+' elite pack approaches');}else toast('Two elite packs are already alive');};
$('summon-boss').onclick=()=>{if(summonBoss(rewards,survival,combat,player,scene.props,{width,height,zoom:worldZoom()})){setPaused(false);toast('Dune Ravager is approaching');}else toast('A mini-boss is already active, or no safe spawn is available');};

function openArmory(mode){armoryMode=mode;setPaused(true);$('menu').hidden=true;$('armory-panel').hidden=false;renderArmory();}
// UI redesign batch 3 (Oct 16): Armory/Forge in the user's unlocks-list layout (sections, rows, Buy buttons, compare with equipped).
// Oct 17 (user): during a run the inventory shows only what you carry (held weapon, run bag, safe pocket); the
// front-end inventory shows the global collection plus the pocket, which you drag into the collection to empty it.
const inRun=()=>$('welcome').hidden;
function armoryGroups(){const list=armory.weapons.filter(w=>weaponClass(w)===classId),eq=list.filter(w=>w.id===armory.equipped),pocket=armory.weapons.filter(w=>w.location==='pocket'),by=w=>b=>b.rarity-w.rarity,sort=ws=>ws.sort((a,b)=>b.rarity-a.rarity||(b.favorite?1:0)-(a.favorite?1:0));
 if(inRun())return [['EQUIPPED','Kept when the run ends',eq,null],['RUN BAG','Lost on failure; all kept on victory · drag one into the safe pocket',sort(list.filter(w=>w.location==='run'&&w.id!==armory.equipped)),'unpocket'],['SAFE POCKET','Kept when the run ends · 1 slot',pocket,'pocket']];
 return [['EQUIPPED','You start the run with this',eq,null],['SAFE POCKET','Drag it into your inventory to empty the pocket',pocket,null],['INVENTORY','Your permanent collection',sort(list.filter(w=>w.location==='armory'&&w.id!==armory.equipped)),'stash'],['OVERFLOW','Kept safe until there is room',list.filter(w=>w.location==='overflow'&&w.id!==armory.equipped),'stash']];}
function armoryList(){return armoryGroups().flatMap(g=>g[2]);}
function pocketMove(kind,id){if(!kind||!id)return;const result=transactArmory({...armory,gold:rewards.gold},kind,id,{inRun:inRun()},persistArmory);if(result.error){toast(result.error);return;}armory=result.next;rewards.gold=armory.gold;selectedWeapon=id;renderArmory();}
function dropZone(node,kind){if(!kind)return;node.ondragover=e=>{e.preventDefault();node.classList.add('drop-on');};node.ondragleave=()=>node.classList.remove('drop-on');node.ondrop=e=>{e.preventDefault();node.classList.remove('drop-on');pocketMove(kind,e.dataTransfer.getData('text/plain'));};}
// Run end: drop run-bag weapons except the held one; the pocket stays (its "filled this run" mark is cleared).
function settleRun(){if(!armory.weapons.some(w=>w.location==='run'||w.pocketRun))return;const r=endRun({...armory,gold:rewards.gold},{victory:victoryShown&&!survival.endless});try{persistArmory(r.next);armory=r.next;selectedWeapon=armory.equipped;if(r.lost)toast(r.lost+' run weapon'+(r.lost>1?'s':'')+' lost');}catch{toast('Save failed while ending the run');}}
function armEl(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function renderArmory(){
  const classWeapons=armoryList(),forge=armoryMode==='forge';
  $('armory-title').textContent=forge?'THE EMBER FORGE':'ARMORY';$('armory-sub').textContent=forge?'Improve, reforge or salvage weapons. Prices are paid in gold.':inRun()?'Failure keeps equipped + pocket. Victory keeps your whole run bag.':'Your permanent collection. Empty the safe pocket into it before your next run.';$('armory-gold').textContent=rewards.gold;
  {const all=armory.weapons;$('armory-capacity').textContent=(inRun()?'Run bag '+all.filter(w=>w.location==='run').length+'/'+RUN_BAG:'Inventory '+all.filter(w=>w.location==='armory').length+'/'+ARMORY_CAPACITY)+' · Pocket '+all.filter(w=>w.location==='pocket').length+'/1';}
  if(!classWeapons.some(w=>w.id===selectedWeapon))selectedWeapon=armory.classEquipped[classId];
  const groups=armoryGroups();
  armoryUI.renderGroups({groups,selected:selectedWeapon,equipped:armory.equipped,heldInBag:armory.weapons.some(w=>w.id===armory.equipped&&w.location==='run'),runCapacity:RUN_BAG,inventoryCapacity:ARMORY_CAPACITY,inRun:inRun(),rarities:RARITIES,families:FAMILIES,weaponClass,weaponStats,iconNode,level:survival.level,mode:survival.endless?'endless':'normal',onSelect:id=>{selectedWeapon=id;renderArmory();},onMove:pocketMove,canMove:(kind,id)=>!transactArmory({...armory,gold:rewards.gold},kind,id,{inRun:inRun()}).error});
  const w=armory.weapons.find(w=>w.id===selectedWeapon),stats=weaponStats(w,survival.level,survival.endless?'endless':'normal'),equippedW=armory.weapons.find(w=>w.id===armory.equipped),equipped=weaponStats(equippedW,survival.level,survival.endless?'endless':'normal'),d=$('weapon-detail');d.replaceChildren();
  const title=armEl('h3','arm-title',w.name+(w.quality?' +'+w.quality:''));title.style.color=RARITIES[w.rarity].color;const runeSel=document.createElement('select');runeSel.append(new Option(meta.runes.length?'No rune':'No runes owned (buy in Unlocks)',''));for(const id of meta.runes)runeSel.append(new Option(id[0].toUpperCase()+id.slice(1)+' Rune',id));runeSel.value=meta.runeOn[w.id]??'';runeSel.disabled=!meta.runes.length;runeSel.onchange=()=>{setMeta(setRune(meta,w.id,runeSel.value));applyWeapon();};const runeRow=armEl('label','fe-rune');runeRow.append(armEl('span','','Colour rune'),runeSel);d.append(armEl('p','arm-meta',w.id===armory.equipped?'Protected: equipped':w.location==='pocket'?'Protected: safe pocket':w.location==='run'?'At risk: lost if this run fails':'Stored in your collection'),title,runeRow,armEl('p','arm-meta',RARITIES[w.rarity].name+' '+FAMILIES[w.family].name+' · character level '+stats.effective+' · permanent power +'+w.quality+' · power bonus now '+Math.round(w.quality*8*stats.affixScale)+'%, full strength '+(w.quality*8)+'%'),armEl('p','affix',stats.description));
  const cmp=armEl('div','arm-compare'),diff=(a,b)=>{const v=a-b;return Math.abs(v)<.005?'':(v>0?'+':'')+v.toFixed(2);};
  for(const [label,key] of [['Weapon power','power'],['Attack','damage'],['Ability','abilityOutput'],['Barrier','barrierOutput'],['Speed','speed'],...(weaponClass(w)==='mage'?[]:[['Reach','reach']])]){const cell=armEl('div'),dv=diff(stats[key],equipped[key]);cell.append(armEl('small','',label),armEl('b','','×'+stats[key].toFixed(2)));if(dv&&w.id!==armory.equipped)cell.append(armEl('em',dv.startsWith('+')?'up':'down',dv));cmp.append(cell);}
  const full=weaponStats(w,30);d.append(cmp,armEl('p','muted small','Level 30 preview · power ×'+full.power.toFixed(2)+' · attack ×'+full.damage.toFixed(2)+' · ability ×'+full.abilityOutput.toFixed(2)+' · barrier ×'+full.barrierOutput.toFixed(2)));if(w.id!==armory.equipped)d.append(armEl('p','muted small','Compared with your equipped '+equippedW.name+'.'));
  d.append(armEl('h4','arm-section','AFFIXES · SCOPE SHOWN PER EFFECT'));for(const a of w.affixes)d.append(armEl('p','affix',describeAffix(w,a,survival.level)+(w.locked===a.id?' · Locked':'')));if(!w.affixes.length)d.append(armEl('p','muted small','No affixes'));
  d.append(armEl('p','muted small',w.affixes.length+' affixes · '+w.affixes.filter(a=>affixKind(a)==='behavior').length+' / '+RARITIES[w.rarity].behaviors+' behavior slots'+(w.rarity===5?' · Ascendant signature: none yet':'')));
  $('equip-weapon').disabled=w.id===armory.equipped||w.location==='pocket'||!weaponEligible(w,classId,survival.path);$('equip-weapon').textContent=w.id===armory.equipped?'Equipped':w.location==='pocket'?'In safe pocket':weaponClass(w)!==classId?'Requires '+({mage:'Mage',ranger:'Ranger',sword:'Warrior'}[weaponClass(w)]):'Equip';$('equip-weapon').title=w.location==='pocket'?'Move this weapon out of the safe pocket before equipping it.':'';$('favorite-weapon').textContent=w.favorite?'Unfavorite':'Favorite ★';
  $('forge-actions').hidden=!forge;$('forge-note').hidden=forge;
  const price=c=>Number.isFinite(c)?'Buy · '+c:'Not available';
  $('quality-weapon').textContent=w.quality>=5?'Maxed':price(forgeCost(w,'upgrade'));$('quality-weapon').disabled=w.quality>=5||rewards.gold<forgeCost(w,'upgrade');$('promote-weapon').textContent=w.rarity>=4?'Highest craftable tier':'To '+RARITIES[w.rarity+1].name+' · '+forgeCost(w,'promote');$('promote-weapon').disabled=w.rarity>=4||rewards.gold<forgeCost(w,'promote');
  for(const [id,kind]of [['reroll-weapon','reforgeStat'],['reforge-behavior','reforgeBehavior'],['convert-affix','convert']]){const b=$(id);b.textContent=price(forgeCost(w,kind));b.disabled=!w.affixes.length||rewards.gold<forgeCost(w,kind)||(kind==='convert'&&(w.rarity<2||w.affixes.filter(a=>affixKind(a)==='behavior').length>=RARITIES[w.rarity].behaviors));}
  $('lock-weapon').textContent=price(250);$('salvage-weapon').textContent='Salvage · +'+RARITIES[w.rarity].salvage;$('salvage-weapon').disabled=classWeapons.length<=1;
  const previousAffix=$('lock-affix').value;$('lock-affix').replaceChildren(...w.affixes.map(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=affixKind(a)+' · '+a.name+(w.locked===a.id?' · Locked':'');return o;}));if(w.affixes.some(a=>a.id===previousAffix))$('lock-affix').value=previousAffix;
  const updateForgeChoices=()=>{const chosen=w.affixes.find(a=>a.id===$('lock-affix').value),kind=chosen?affixKind(chosen):null,locked=chosen?.id===w.locked;$('reroll-weapon').disabled=kind!=='stat'||locked||rewards.gold<forgeCost(w,'reforgeStat');$('reforge-behavior').disabled=kind!=='behavior'||locked||rewards.gold<forgeCost(w,'reforgeBehavior');$('convert-affix').textContent=(kind==='behavior'?'To stat':'To behavior')+' · 400';$('convert-affix').disabled=!kind||locked||(kind==='stat'&&(w.rarity<2||w.affixes.filter(a=>affixKind(a)==='behavior').length>=RARITIES[w.rarity].behaviors))||rewards.gold<400;$('lock-weapon').disabled=!!w.locked||!chosen||rewards.gold<250;};$('lock-affix').onchange=updateForgeChoices;updateForgeChoices();
  armoryUI.decorateDetails({weapon:w,stats,forge,weaponClass,iconNode,rarities:RARITIES,families:FAMILIES});
}
function armoryAction(kind,confirmed=false){
  if(survival.dead)return;
  if(kind==='equip'&&weaponClass(armory.weapons.find(w=>w.id===selectedWeapon))!==classId){toast('Choose a weapon for your current class');return;}
  if(['upgrade','promote','reforgeStat','reforgeBehavior','convert','lock','salvage'].includes(kind)&&(armoryMode!=='forge'||Math.hypot(player.x-FORGE.x,player.y-FORGE.y)>=FORGE.radius))return;
  const w=armory.weapons.find(w=>w.id===selectedWeapon);
  if(kind==='salvage'&&(w.favorite||w.id===armory.equipped)&&!confirmed){$('salvage-confirm').hidden=false;$('salvage-message').textContent='Destroy '+w.name+'? It is '+(w.favorite?'favorited':'equipped')+'.';return;}
  if(kind==='equip'&&(combat.attack||warrior?.cast||mage?.cast||rangerBusy(ranger))){survival.queuedEquip=w.id;toast('Weapon change queued after this action');return;}if(kind==='convert'&&affixKind(w.affixes.find(a=>a.id===$('lock-affix').value)??{})==='behavior')kind='convertStat';
  const input={...armory,gold:rewards.gold},result=transactArmory(input,kind,w.id,{confirmed,affix:$('lock-affix').value,classId,path:survival.path,inRun:inRun()},persistArmory);
  if(result.error){toast(result.error);return;}if(survival.telemetry)(survival.telemetry.forge??=[]).push({kind,weapon:w.id,world:survival.clock,goldChange:result.next.gold-rewards.gold});armory=result.next;rewards.gold=armory.gold;applyWeapon();$('salvage-confirm').hidden=true;renderArmory();renderForgeChoice();
}

$('armory-close').onclick=()=>{if(!$('welcome').hidden){$('armory-panel').hidden=true;front.refresh();return;}setPaused(false);};
for(const [id,kind] of [['equip-weapon','equip'],['favorite-weapon','favorite'],['quality-weapon','upgrade'],['promote-weapon','promote'],['reroll-weapon','reforgeStat'],['reforge-behavior','reforgeBehavior'],['convert-affix','convert'],['salvage-weapon','salvage'],['lock-weapon','lock']])$(id).onclick=()=>armoryAction(kind);
$('salvage-yes').onclick=()=>armoryAction('salvage',true);$('salvage-no').onclick=()=>{$('salvage-confirm').hidden=true;};
// Oct 19 (user): Settings -> Reset entire account, behind an are-you-sure popup. Deletes every account save (armory, gold
// wallet, meta/unlocks/best runs, migration backups, pending transaction) but keeps settings (audio, display, quality,
// VFX), then reloads into a fresh account. accountWiped stops the pagehide gold flush from writing the old armory back.

$('reset-account').onclick=()=>{$('reset-account-confirm').hidden=false;$('reset-account-no').focus();};
$('reset-account-no').onclick=()=>{$('reset-account-confirm').hidden=true;};
$('reset-account-yes').onclick=()=>{accountWiped=true;clearTimeout(goldSaveTimer);try{for(const k of Object.keys(localStorage))if(/^veyrath-(armory|meta|wallet|account)/.test(k))localStorage.removeItem(k);}catch{}location.reload();};
$('boss-spawn').onclick=()=>{if(survival.dead||!survival.path){toast('Start a run first');return;}const kind=$('boss-spawn-kind').value,b=spawnRunBoss(kind,scene.props);b.emerge=1;setPaused(false);toast(b.name+' summoned');};
$('drop-weapon-test').onclick=()=>{weaponLoot.push({x:player.x+50,y:player.y+30,clock:0,weapon:makeWeapon(Math.max(1,survival.level),Math.random,2,null,classId,survival.path)});setPaused(false);toast('Playtest weapon dropped nearby');};

function toast(text,color){const box=$('toast'),m=document.createElement('div');m.className='msg';if(color)m.style.borderLeftColor=color;m.textContent=text;box.prepend(m);while(box.children.length>3)box.lastChild.remove();setTimeout(()=>m.remove(),3200);}
function banner(title,sub=''){const b=$('banner');$('banner-title').textContent=title;$('banner-sub').textContent=sub;b.hidden=true;void b.offsetWidth;b.hidden=false;clearTimeout(banner.timer);banner.timer=setTimeout(()=>{b.hidden=true;},2600);}
// Oct 16 (user): M opens a full world map (game paused while it is open); M or Esc closes it.
function mapMarkers(){return [...worldMarkers(worldEvents,combat),...(healing?healingMarkers(healing):[]),...pitMarkers(pits)];}
function toggleBigMap(force){const el=$('bigmap'),open=!el.hidden;if(open||force===false){if(open){el.hidden=true;paused=false;keys.clear();}return;}if(paused||survival.dead||!survival.path)return;el.hidden=false;paused=true;keys.clear();player.moving=false;drawBigMap($('bigmap-canvas'),minimap,player,combat.targets,FORGE,mapMarkers(),scene);}
$('bigmap').onclick=()=>toggleBigMap(false);
// Blink/Dash shop upgrades (Oct 16): extra charges refill one at a time; Ember step bursts on arrival.
function moveCd(v){if(classId==='mage'){if(v!==undefined)mage.cooldowns.blink=v;return mage.cooldowns.blink;}if(v!==undefined)dash.cooldown=v;return dash.cooldown;}
function moveTry(fn){const multi=mv.max>1;let saved=0;if(multi){if(mv.n<=0)return false;saved=moveCd();moveCd(0);}const ok=fn();if(multi){if(ok){mv.n--;if(mv.timer<=0)mv.timer=3;moveCd(mv.n>0?0:mv.timer);}else moveCd(saved);}if(ok&&survival.mods?.ember)emberT=classId==='mage'?.05:DASH.duration;return ok;}
function tickMove(dt,props,events){if(mv.max>1){if(mv.n<mv.max){mv.timer-=dt*(survival.world?.dash??1);if(mv.timer<=0){mv.n++;mv.timer=mv.n<mv.max?3:0;}}moveCd(mv.n>0?0:mv.timer);}
 if(emberT<0)return;emberT-=dt;if(emberT>=0)return;for(const e of combat.targets)if(e.state==='alive'&&e.enemy&&Math.hypot(e.x-player.x,(e.y-player.y)/.65)<95)events.push(...damageEnemy(combat,e,45,player,{props,stagger:.2,push:12}));
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2,sp=120+Math.random()*90;particles.push({x:player.x,y:player.y-18,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6,life:.3+Math.random()*.2,color:i%2?'#e6c581':'#ffc94a'});}}
addEventListener('keydown',e=>{
  if(e.target.closest?.('#developer-tools')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.code==='F2'&&cheatMenu){e.preventDefault();if(!e.repeat)cheatMenu.toggle();return;}if(e.code==='F3'){e.preventDefault();const on=fpsOverlay.toggle();const t=$('fps-toggle');if(t)t.checked=on;return;}
  const key=e.key.toLowerCase();if(!$('reset-account-confirm').hidden){if(key==='escape'){e.preventDefault();$('reset-account-no').click();}return;}/* Oct 19: the reset popup swallows keys; Esc = keep account */
  if(ready&&!$('welcome').hidden){if(!$('menu').hidden){if(key==='escape'){closeFrontSettings();return;}}else if(!$('armory-panel').hidden){if(key==='escape'||key==='i'){$('armory-close').click();return;}}else if(!e.repeat&&front.key(key)){e.preventDefault();return;}}if(key==='tab'){e.preventDefault();if(!e.repeat&&ready&&$('welcome').hidden&&!paused&&!survival.dead)showBuild(true);return;}if(ready&&$('welcome').hidden&&!$('menu').hidden){if(key==='backspace')e.preventDefault();if(!e.repeat&&({r:'restart',backspace:'menu',x:'abandon'})[key]){pauseAction({r:'restart',backspace:'menu',x:'abandon'}[key]);return;}}if(key==='r'&&!e.repeat&&!$('gameover').hidden&&$('menu').hidden){restartRun();return;}if(!$('armory-panel').hidden&&$('salvage-confirm').hidden&&['arrowup','arrowdown','enter'].includes(key)){e.preventDefault();if(key==='enter'){if(!e.repeat)armoryAction('equip');return;}const list=armoryList(),k=list.findIndex(w=>w.id===selectedWeapon),n=list[Math.max(0,Math.min(list.length-1,k+(key==='arrowup'?-1:1)))];if(n){selectedWeapon=n.id;renderArmory();}return;}if(['4','5','6'].includes(key)&&!e.repeat&&!$('levelup-panel').hidden){$('levelup-helpers').children[Number(key)-4]?.click();return;}if(['1','2','3'].includes(key)&&!e.repeat){const list=!$('levelup-panel').hidden?$('levelup-choices'):!$('reward-panel').hidden?$('reward-choices'):null;if(list){list.children[Number(key)-1]?.click();return;}}if(armory.pendingForge)return;
  if(!$('bigmap').hidden&&(key==='m'||key==='escape')){e.preventDefault();toggleBigMap(false);return;}if(key==='m'&&!e.repeat){toggleBigMap();return;}
  if(['w','a','s','d',' ','escape'].includes(key)&&!['INPUT','BUTTON'].includes(document.activeElement.tagName))e.preventDefault();
  if(key==='i'&&!e.repeat&&ready&&!survival.dead){openArmory('inventory');return;}
  if(key==='f'&&!paused&&!e.repeat&&!survival.dead){const event=nearWorldEvent(worldEvents,player);if(event)openWorld(event);else if(Math.hypot(player.x-FORGE.x,player.y-FORGE.y)<FORGE.radius)openArmory('forge');else toast('Move next to a landmark or the Forge to interact.');return;}
  if(key==='escape'&&!e.repeat&&ready&&$('welcome').hidden){setPaused(!paused);return;}
  if(key==='?'&&!e.repeat&&ready&&$('welcome').hidden){setPaused(true);return;}
  if(survival.downed&&['q','e','r',' '].includes(key)){e.preventDefault();return;}  // downed: no abilities
  // Multiplayer Phase 1 (Oct 17): abilities and dash become command edges, run by runCommand() in update() — the same path teammates/network input use.
  if(['q','e','r'].includes(key)&&!paused&&!e.repeat){e.preventDefault();sound.unlock();queueInput(key.toUpperCase());return;}
  if(key===' '&&!survival.dead&&!paused&&!e.repeat&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();sound.unlock();queueInput('dash');return;}
  if(!paused)keys.add(key);
});
addEventListener('blur',()=>showBuild(false));
// UI redesign (Oct 16): hold Tab to see the current build over the running game.
function showBuild(on){const panel=$('build-panel');if(!panel)return;if(on===!panel.hidden)return;panel.hidden=!on;$('build-hint').hidden=on;if(on){const w=armory.weapons.find(w=>w.id===armory.equipped),buffs=[];if(worldEvents.curse)buffs.push({name:worldEvents.curse.name,desc:Math.ceil(worldEvents.curse.remaining)+'s left',tint:'#e8414a'});for(const [id,time]of Object.entries(worldEvents.buffs))if(time>0)buffs.push({name:CAMP_TYPES.find(x=>x.id===id)?.name??id,desc:Math.ceil(time)+'s left',tint:'#ffc94a'});for(const [boss,choice] of Object.entries(survival.blessings??{}))buffs.push({name:boss+' · '+choice,desc:'Run-long blessing'+(Object.keys(survival.blessings??{}).length===4?' · Boss Soul strengthened':''),tint:'#e6c581'});renderBuild(panel,survival,{classId,weapon:w&&{name:w.name+(w.quality?' +'+w.quality:''),color:RARITIES[w.rarity]?.color,desc:classId==='mage'?magePrimary(combat).name:combat.weapon?.description??''},spellName:slot=>classId==='mage'?mageAbility(survival,{RMB:'fireball',Q:'nova',E:'chain',R:'meteor'}[slot]).name:classId==='ranger'?rangerAbility(survival,slot)?.name:warriorAbility(survival,slot)?.name,buffs});}}
addEventListener('keyup',e=>{if(e.key==='Tab')showBuild(false);keys.delete(e.key.toLowerCase());if(e.key.toLowerCase()==='e')queueInput('Eup');});
addEventListener('blur',()=>{keys.clear();if(ready&&$('welcome').hidden)setPaused(true);else syncAudio();});
addEventListener('focus',syncAudio);
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(ready&&$('welcome').hidden)setPaused(true);}syncAudio();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function trackPointer(e){const rect=canvas.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;pointer.active=true;}
// A second mouse button pressed/released while another is held arrives as a pointermove with e.button set
// (pointer-event chording), not pointerdown/up; route those so RMB works while LMB is held (Oct 15).
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;trackPointer(e);if(e.button===0||e.button===2){if(e.buttons&(e.button===0?1:2))pressButton(e);else releaseButton(e.button);}});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')pressButton(e);});
function pressButton(e){
  if(![0,2].includes(e.button)||paused||survival.dead||survival.downed)return;e.preventDefault();trackPointer(e);canvas.focus();sound.unlock();
  if(e.button===0&&e.pointerId!==undefined)canvas.setPointerCapture(e.pointerId);
  queueInput(e.button===0?'lmb':'rmb');
}
function releaseButton(button){queueInput(button===0?'lmbUp':'rmbUp');}
addEventListener('pointerup',e=>{if(e.pointerType!=='touch')releaseButton(e.button);});
addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')queueInput('cancel');});
function mouseAim(){if(player.kit)return player.cmd?.aim??null;  // a swapped-in teammate aims with its command
  return pointer.active?{x:camera.x+(pointer.x-width/2)/worldZoom(),y:camera.y+(pointer.y-height/2)/worldZoom()}:null;}
// Touch controls (Oct 16, mobile web app): touch-controls.js drives the same handlers as mouse/keyboard.
function toScreen(x,y){const r=canvas.getBoundingClientRect(),z=worldZoom();return {x:r.left+width/2+(x-camera.x)*z,y:r.top+height/2+(y-camera.y)*z};}
const tkey=(k,type)=>{if(type!=='keyup')dispatchEvent(new KeyboardEvent('keydown',{key:k}));if(type!=='keydown')dispatchEvent(new KeyboardEvent('keyup',{key:k}));};
let touchAim={x:0,y:0};
if(isTouchDevice()){touch=createTouchControls({
  active:()=>ready&&$('welcome').hidden&&!paused&&!survival.dead,unlock:()=>sound.unlock(),
  stick:v=>{keys.stick=v||undefined;},aim:(x,y)=>{touchAim={x,y};trackPointer({clientX:x,clientY:y});},
  press:b=>pressButton({button:b,clientX:touchAim.x,clientY:touchAim.y,preventDefault(){}}),release:b=>releaseButton(b),
  key:k=>tkey(k),keyDown:k=>tkey(k,'keydown'),keyUp:k=>tkey(k,'keyup'),
  holdSlot:s=>classId==='mage'&&survival.path==='blood'&&(s==='rmb'||s==='e')||classId==='ranger'&&(survival.path==='archer'&&s==='rmb'||survival.path==='ninja'&&s==='e'),toggleBuild:()=>showBuild($('build-panel').hidden),
  playerScreen:()=>toScreen(player.x,player.y-30),aimRange:()=>Math.min(innerWidth,innerHeight)*.55,
  autoTarget:()=>{let best=null,bd=520;for(const e of combat.targets)if(e.state==='alive'&&!e.hidden&&e.role!=='anchor'){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}return best&&toScreen(best.x,best.y-20);},
  facingPoint:()=>{const a=(player.row??2)*Math.PI/4;return toScreen(player.x+Math.cos(a)*160,player.y-30+Math.sin(a)*160);}});
 $('world-interact').addEventListener('click',()=>tkey('f'));$('minimap-wrap').addEventListener('click',()=>tkey('m'));}
/* Oct 19 audit (user: "add sound to all things in the game"): event sounds. World sounds fade with distance from the camera.
 Teammate events (by!=null) only play their world-facing sounds (deaths, bosses), never another player's UI/pickup sounds. */
function playAt(kind,x,y,base=1){if(!Number.isFinite(x))return sound.play(kind,0,base);const d=Math.hypot(x-camera.x,y-camera.y);if(d>1500)return;sound.play(kind,0,base*Math.max(.15,1-d/1500),(x-camera.x)/900);/* Oct 19: pan by screen side */}
function eventSound(e){const mine=e.by==null;switch(e.type){
 case 'hit':if(mine)playAt(e.critical?'crit':'hit',e.x,e.y,e.critical?1:.55);break;
 case 'death':case 'defeat':if(e.role==='boss')playAt('boss-death',e.x,e.y);else if(e.role==='leader')playAt('elite',e.x,e.y);else playAt('enemyDeath',e.x,e.y);break;
 case 'gold':if(mine)sound.play('pickup-gold');break;
 case 'xpCollected':if(mine)sound.play('pickup-xp');break;
 case 'healPack':if(mine)sound.play('pickup-heal');break;
 case 'bossArrival':sound.play(e.realm?'tyrant-roar':'boss-roar');break;
 case 'reckoning':sound.play('tyrant-roar');break;
 case 'elite':sound.play('elite');break;
 case 'allyDowned':sound.play('downed');break;
 case 'allyRevived':sound.play('revive');break;
 case 'parry':if(mine)sound.play('parry');break;
 case 'trialComplete':case 'pitCleared':sound.play('fanfare');break;
 case 'levelPick':if(mine)sound.play('card');break;
 case 'reaction':playAt('reaction',e.x,e.y,.8);break;
 case 'worldStomp':playAt('boss-smash',e.x,e.y,.7);break;
 case 'phase':sound.play('phase');break;
}}
/* Per-frame world sound scan: weapon shots (Ranger muzzles), boss/elite explosions as they land, expanding rings, enemy shots and new loot. */
const heard=new WeakSet();let lootCount=0;
function scanSounds(){
 if(ranger)for(const m of ranger.muzzles??[])if(!heard.has(m)){heard.add(m);const w=combat.weapon?.primary;sound.play('w-'+(w&&('w-'+w) in ABILITY_SOUNDS?w:'bow'),0,.8);}
 for(const h of rewards.hazards??[]){if(heard.has(h))continue;if(h.kind==='explosion'&&h.age>=(h.warning??0)){heard.add(h);playAt('boom',h.x,h.y,h.radius>140?1:.7);}else if(h.kind==='tyring'&&h.age>=(h.warning??0)){heard.add(h);playAt('ring',h.x,h.y);}}
 for(const b of combat.enemyProjectiles??[])if(!heard.has(b)){heard.add(b);playAt('enemy-shot',b.x,b.y,.35);}
 if(weaponLoot.length>lootCount){const w=weaponLoot.at(-1)?.weapon??weaponLoot.at(-1);sound.play((w?.rarity??0)>=3?'legendary':'loot');}lootCount=weaponLoot.length;
}
function onCombatEvent(event){try{eventSound(event);}catch{}
  if(event.by!=null){if(event.type==='hit'){numbers.push({x:event.x,y:event.y-63,value:Math.ceil(event.damage),life:.6,crit:!!event.critical});return;}if(['mageHeal','healPack','mageCast','buffsChanged','whoosh','playerHit','level','levelPick'].includes(event.type))return;}  // teammate events (batch 2)
  if(event.type==='allyDowned'){toast(event.name+' is down · stand next to them to revive','#ff9a6b');return;}if(event.type==='allyRevived'){toast(event.id===0?'You are back up':event.name+' is back up','#9be37a');return;}if(event.type==='allyHit')return;  // Multiplayer Phase 1
  if(event.type==='worldNotice')toast(event.text);
  if(event.type==='healPack')numbers.push({x:player.x,y:player.y-80,value:'+'+Math.ceil(event.amount),life:.9,heal:true});
  if(event.type==='mageHeal')numbers.push({x:player.x,y:player.y-80,value:'+'+Math.ceil(event.amount),life:.9,heal:true});
  if(event.type==='spellImpact')sound.play(event.sound);
  if(event.type==='reaction')numbers.push({x:event.x,y:event.y-70,value:event.name,life:1.1,reaction:true});
  if(event.type==='mageCast'){const w=combat.weapon?.primary,k=survival.path+'-'+event.kind;sound.play(event.kind==='bolt'?(('lmb-'+w) in ABILITY_SOUNDS?'lmb-'+w:survival.path+'-bolt'):k);}
  if(event.type==='gold'){if(survival.telemetry)survival.telemetry.goldFromPickups=(survival.telemetry.goldFromPickups??0)+(event.amount??0);try{saveGold();}catch{toast('Gold collected; save unavailable or changed in another tab');}}
  if(event.type==='levelPick')queueMicrotask(openLevelUp);
  if(event.type==='elite')toast((event.name??'An elite')+' pack is approaching');
  if(event.type==='bossArrival')banner((event.name??'DUNE RAVAGER').toUpperCase(),event.final?'The final battle':event.pit?'Awakened':'Spawned');
  if(survival.telemetry){if(event.type==='level')survival.telemetry.levels.push({level:event.level,world:survival.clock,real:Math.round((Date.now()-survival.startedAt)/1000)});if(event.type==='xpCollected')survival.telemetry.xpCollected+=event.xp??0;}
  if(event.type==='trialComplete')completeTrial(event);
  if(event.type==='victory'){showVictory(event);sound.play('levelup');}
  if(event.type==='buffsChanged')applyWeapon();
  if(event.type==='cataclysm'){sound.play('rumble');rings.push({x:player.x,y:player.y,type:'bossRing',life:.8,max:.8});}
  if(event.type==='bossImpact'){bossFxImpact(combat,event);rings.push({...event,type:'bossRing',life:.6,max:.6});playAt(event.kind==='shed'?'shed':event.kind==='charge'?'boss-charge':event.kind==='sweep'?'boss-sweep':'boss-smash',event.x,event.y);const sh=mage??warrior??ranger;if(sh&&Math.hypot(event.x-player.x,event.y-player.y)<800)sh.shake=Math.max(sh.shake??0,event.kind==='smash'?5:3);}
  if(event.type==='slam'||event.type==='storm')sandParticles.emit(event.type,event);
  if(['slam','parry'].includes(event.type)){const duration=event.type==='slam'?.85:.6;rings.push({...event,life:duration,max:duration});sound.play(event.type==='slam'?'rumble':'hit',-1);}
  if(event.type==='level'){levelNotices.push({level:event.level,elapsed:0,duration:2.2});sound.play('levelup');}
  if(event.type==='playerHit'){if(survival.dead){survival.skills={};survival.points=0;combat.skills=survival.skills;groundXP=createGroundXP();bossChoices=createBossChoices();worldEvents=createWorldEvents(scene.props,Math.random,scene.landmarks??[]);survival.world={};combat.worldBasicDamage=1;combat.worldBurn=false;}sound.play('damage');numbers.push({x:player.x+(Math.random()-.5)*22,y:player.y-75,value:'−'+Math.ceil(event.damage),life:1,playerDamage:true});}
  if(event.type==='whoosh')sound.play('sword'+(event.heavy?3:event.index+1));
  if(event.type==='hit'){
    numbers.push({x:event.x,y:event.y-63,value:Math.ceil(event.damage),life:event.critical?.95:.75,crit:!!event.critical});
    if(warrior){warriorHitFx(event.x,event.y,Math.atan2(event.y-player.y,event.x-player.x),!!event.critical,time);if(event.basic&&!event.secondary)warriorHitShake(warrior,combat.weapon?.style,event.index??0,!!event.critical);}
    for(let i=0;i<(event.heavy?22:14);i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*(event.heavy?160:100);particles.push({x:event.x,y:event.y-35,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:.2+Math.random()*.2,color:i%3?(combat.runeColor??'#f7d38b'):'#c8573d'});}
  }
}
// Multiplayer batch 2 (Oct 17): one class-kit step for whoever is swapped in: the local player, or a teammate through withMember().
function stepKit(v,aim,dt,worldProps,enemyProps,events){
  const beforeX=player.x,beforeY=player.y;
  const dashing=classId==='mage'?mage.blinkTime>0:dash.remaining>0;
  const moveProps=withDynamicColliders(scene.props,[...wallProps(rewards),...combat.targets.filter(e=>e.state==='alive'&&!e.hidden&&['leader','boss','guardian'].includes(e.role)&&Math.hypot(e.x-player.x,e.y-player.y)>=e.radius+WORLD.playerRadius-1).map(e=>({x:e.x,y:e.y,radius:e.radius}))]);  // Oct 17 fix: a body you already overlap (it landed/charged onto you) doesn't block, so you can always walk out
  if(classId!=='mage')tickDash(dash,player,moveProps,dt);player.invulnerable=classId==='mage'?mage.invulnerable>0:dashInvulnerable(dash);
  if(classId==='mage'&&mage)easeMageMove(dt);if(!dashing&&combat.hitstop<=0&&!player.netWalk){const speed=walkSpeed();slideMove(player,v.x*speed*dt,v.y*speed*dt,moveProps);}
  if(dashing&&classId!=='mage'){trailClock-=dt;if(trailClock<=0){dashTrail.push({x:player.x,y:player.y,row:dash.row,frame:dashFrame(dash),life:.14});trailClock=1/30;}}
  player.moving=Math.hypot(player.x-beforeX,player.y-beforeY)>.05;
  player.frame+=dt*(player.moving?22:12);
  // Walking owns facing, even when pushing against terrain. Idle retains it.
  // Attacks use their own snapshot of mouse aim; walking/idle facing is retained.
  if(!dashing)updateWalkFacing(player,v);
  const warriorEvents=warrior?tickWarrior(warrior,combat,survival,player,aim,worldProps,dt):[];const rangerEvents=ranger?tickRanger(ranger,combat,survival,player,aim,worldProps,dt,v):[];if(ranger)player.invulnerable=player.invulnerable||ranger.invulnerable>0;
  events.push(...warriorEvents,...rangerEvents,...tickCombat(combat,player,aim,enemyProps,dt,classId==='sword'&&!dashing&&!survival.cast&&!warrior?.cast));
  if(classId==='mage'){events.push(...tickMage(mage,combat,survival,player,aim,worldProps,dt));player.invulnerable=mage.invulnerable>0;}tickMove(dt,enemyProps,events);player.rollT=player.invulnerable?.2:Math.max(0,(player.rollT??0)-dt);  // Oct 17: rolling (dash/roll/blink i-frames, +.2 s) passes through the Soul Cage
  {const ws=combat.weapon;if(ws){ws.speedBase??=ws.speed??1;ws.speed=ws.speedBase*(1-(survival.fieldAtkSlow??0));}}  // Soul Mire attack slow
}
// Multiplayer batch 2 (Oct 17): every teammate owns a full class kit. Its survival/combat objects inherit the run's shared
// state (enemies, clock, level, world modifiers) through the prototype and own every per-player field, so the existing class
// code runs unchanged with the teammate swapped into the module globals.
const KIT_OWN=['helpers','levelPicksAwarded','bonusPointsEarned','completedTrials','hp','maxHp','hurt','grace','dead','downed','downedTime','deathTime','parry','parryAngle','parryCD','slamCD','stormCD','cast','pulse','classId','path','specialization','skills','barrier','barrierTime','guard','damageReduction','staggerResist','warrior','ranger','warriorBarrierBurst','warriorGuardCounter','warriorMove','stun','runeElement','weaponFamily','gameplayLoadout','spellColor','blessings','activityRewards','statCaps','buffStats','weaponPassives','cardStats','cardHistory','banished','pendingPicks','offer','fieldSlow','fieldAtkSlow','undyingReady','points','pathLocked'];
const MAGE_KEYS={RMB:'fireball',Q:'nova',E:'chain',R:'meteor'};
function withMember(m,fn){const k=m.kit,saved=[player,classId,mage,warrior,ranger,dash,mv,survival,combat];
  player=m;classId=k.classId;mage=k.mage;warrior=k.warrior;ranger=k.ranger;dash=k.dash;mv=k.mv;survival=k.s;combat=k.c;
  try{return fn();}finally{[player,classId,mage,warrior,ranger,dash,mv,survival,combat]=saved;}}
function makeKit(m,opts={}){const cls=m.classId,root=combat,s=Object.create(survival),c=Object.create(combat);
  for(const key of KIT_OWN)s[key]=undefined;
  Object.assign(s,{hp:250,maxHp:250,hurt:0,grace:0,dead:false,downed:false,deathTime:0,parry:0,parryAngle:0,parryCD:0,slamCD:0,stormCD:0,cast:null,pulse:0,classId:cls,skills:{},buffStats:{},pendingPicks:[],barrier:0,barrierTime:0});
  const paths=PATHS[cls]??[];s.path=paths.some(p=>p.id===opts.path)?opts.path:paths[Math.floor(Math.random()*paths.length)]?.id;
  Object.assign(c,{ownerId:m.steam??m.id,classId:cls,attackSequence:0,attack:null,projectiles:[],secondary:[],effects:[],nextCombo:0,chainTimer:0,buffer:0,held:false,hitstop:0,heavyCooldown:0,hits:0,skills:s.skills,runeColor:null});
  Object.defineProperty(c,'kills',{get:()=>root.kills,set:v=>{root.kills=v;},enumerable:true});  // kills count for the whole party
  let w=opts.weapon&&validateWeapon(opts.weapon)&&weaponEligible(opts.weapon,cls,s.path)?opts.weapon:null;for(let i=0;i<12&&!w;i++){w=makeWeapon(1,Math.random,0,null,cls,s.path);if(weaponStats(w,1).primary!=='orb')break;}  // bots can't toggle the orb
  const k={classId:cls,s,c,weapon:w,lvl:0,mage:null,warrior:null,ranger:null,dash:createDash(),mv:{max:1,n:1,timer:0}};
  if(cls==='mage')k.mage=createMage(s);else if(cls==='ranger')k.ranger=createRanger(s);else k.warrior=createWarrior(s);
  Object.defineProperties(m,{hp:{get:()=>s.hp,set:v=>{s.hp=v;},configurable:true},maxHp:{get:()=>s.maxHp,set(){},configurable:true},downed:{get:()=>!!s.downed,set:v=>{s.downed=v;},configurable:true},dead:{get:()=>!!s.dead,configurable:true}});
  if(m.remote){s.gameplayLoadout=[...new Set(opts.gameplayLoadout??[])].filter(id=>GAMEPLAY_RUNES.some(r=>r.id===id&&(!r.classId||r.classId===cls))).slice(0,3);s.spellColor=opts.spellColor==='tyrant'?'tyrant':null;s.helpers={reroll:opts.helpers?.reroll|0,banish:opts.helpers?.banish|0};s.level=survival.level;}
  m.kit=k;syncKit(m);if(m.remote&&awardLevelPoints(s,[]))currentOffer(s);return k;}
// Teammates keep pace with the run: weapon stats follow the shared level, and they know as many of their path's nodes as you do.
function syncKit(m){const k=m.kit,s=k.s;if(k.queuedWeapon&&!k.c.attack&&!k.warrior?.cast&&!k.mage?.cast&&!rangerBusy(k.ranger)){k.weapon=k.queuedWeapon;k.queuedWeapon=null;}
  if(k.lvl!==survival.level){const gained=k.lvl?survival.level-k.lvl:0;if(k.lvl){s.maxHp+=10*gained;s.hp=Math.min(s.maxHp,s.hp+25);}k.lvl=survival.level;
    if(m.remote){s.level=survival.level;awardLevelPoints(s,[]);if(s.pendingPicks?.length)currentOffer(s);}  // Oct 17 (user): friends pick their own level-ups
    s.weaponFamily=k.weapon.family;k.c.weapon=withCards(weaponStats(k.weapon,survival.level,survival.endless?'endless':'normal'),s);syncWeaponPassives(s,k.mage,k.c.weapon,k.lvl===1);}
  if(m.remote)return;
  const want=Math.max(1,Object.keys(survival.skills??{}).length);if(Object.keys(s.skills).length>=want)return;
  for(const n of pathNodes(s).filter(n=>!s.skills[n.id]).sort((a,b)=>a.tier-b.tier)){if(Object.keys(s.skills).length>=want)break;if(!learn(s,n.id))s.skills[n.id]=1;}
  k.c.skills=s.skills;}
// Multiplayer Phase 1 (Oct 17): every player's input is a command {move,aim,press:[edges]} — edges 'lmb','rmb','lmbUp','rmbUp',
// 'Q','E','R','Eup','dash','cancel'. Local keys/mouse/touch only queue edges; runCommand() applies them for whoever is
// swapped in (you, a bot, later a network player). Feedback (toasts, cast sounds) is for the local player only.
function takeLocalCommand(v,aim){const cmd={move:v,aim,press:localInput.press.splice(0)};player.cmd=cmd;return cmd;}
const MAGE_CAST={Q:'nova',E:'chain',R:'meteor'};
function runCommand(cmd){if(!cmd.press?.length)return;const fb=!!player.local,aim=cmd.aim,props=[...scene.props,...wallProps(rewards)];
  for(const ev of cmd.press??[]){
    if(ev==='cancel'){clearAttackInput(combat);clearMageInput(mage);clearRangerInput(ranger);continue;}
    if(ev==='lmbUp'||ev==='rmbUp'){releaseInput(ev==='lmbUp'?0:2,aim,fb);continue;}
    if(ev==='Eup'){if(mage&&survival.path!=='blood')stopDrain(mage);if(ranger)releaseRanger(ranger,combat,survival,player,aim,'E');continue;}
    if(survival.dead||survival.downed)continue;
    if(ev==='lmb'||ev==='rmb')pressInput(ev==='lmb'?0:2,aim,props,fb);
    else if(ev==='dash')dashInput(cmd.move,fb);
    else if(['Q','E','R'].includes(ev))castInput(ev,aim,props,fb);}}
function pressInput(b,aim,props,fb){if(dash.remaining>0||survival.cast||warrior?.cast)return;
  if(classId==='mage'){if(b===2)castMage('fireball',aim);else if(combat.weapon?.primary==='orb'){mage.orbOn=!mage.orbOn;if(fb)toast('Arcane Pulse '+(mage.orbOn?'ON · free pulses; pauses while casting':'OFF'));}else{mage.held=true;mage.queued=true;}return;}
  if(classId==='ranger'){if(b===2)castRanger('RMB',aim);else ranger.held=true;return;}
  if(b===2){if(requestWarrior(warrior,combat,survival,player,aim,'RMB',props)&&fb)sound.play(survival.path+'-RMB');return;}
  pressAttack(combat);}
function releaseInput(b,aim,fb){if(ranger){if(b===0)ranger.held=false;if(b===2&&releaseRanger(ranger,combat,survival,player,aim,'RMB')&&fb)sound.play('whoosh');}if(b===2&&mage&&survival.path==='blood')stopDrain(mage);if(b===0){releaseAttack(combat);if(mage){mage.held=false;if(MAGE_CHANNELS.has(combat.weapon?.primary))mage.queued=false;}}}
function castInput(key,aim,props,fb){
  if(classId==='mage'){castMage(MAGE_CAST[key],aim);return;}
  if(dash.remaining>0)return;
  if(classId==='ranger'){castRanger(key,aim);return;}
  if(requestWarrior(warrior,combat,survival,player,aim,key,props)&&fb)sound.play(survival.path+'-'+key);}
function dashInput(move,fb){
  if(classId==='mage'){if(moveTry(()=>blinkMage(mage,combat,survival,player,move,playerMoveProps()))&&fb)sound.play('blink');return;}
  if(survival.cast||warrior?.cast)return;
  if(moveTry(()=>startDash(dash,player,move,combat))){if(fb)sound.play('whoosh');trailClock=0;}}
const IDLE_CMD={move:{x:0,y:0},aim:null,press:[]};
let kitSync=0;
function stepTeammates(dt,worldProps,enemyProps,events){if(party.players.length<2)return;
  kitSync-=dt;const sync=kitSync<=0;if(sync)kitSync=1;
  for(const m of party.players){if(m.local||!m.kit)continue;if(sync)syncKit(m);if(m.downed||m.dead||m.encounterWaiting){m.netMoves?.splice(0);continue;}const own=[];
    if(m.remote)m.cmd={move:m.netMove,aim:m.netAim,press:[]};
    withMember(m,()=>{const s=survival,cmd=m.cmd??IDLE_CMD;for(const key of ['grace','hurt','parry','barrierTime','parryCD','slamCD','stormCD'])s[key]=Math.max(0,(s[key]??0)-dt);if(!s.barrierTime)s.barrier=0;
      runCommand(cmd);const bx=player.x,by=player.y;
      if(m.remote){player.netWalk=true;const moves=m.netMoves?.splice(0)??[];for(const q of moves){runCommand({move:{x:q.m[0],y:q.m[1]},aim:q.a?{x:q.a[0],y:q.a[1]}:null,press:q.p});if(!(dash.remaining>0)&&!(mage?.blinkTime>0)&&!(combat.hitstop>0)){const sp=walkSpeed();slideMove(player,q.m[0]*sp*q.d,q.m[1]*sp*q.d,worldProps);}m.netAck=q.q;}}  /* Oct 17: exact input replay, so the friend's prediction matches */
      stepKit(cmd.move,cmd.aim,dt,worldProps,enemyProps,own);if(m.remote){const mv=Math.hypot(player.x-bx,player.y-by)>.05;if(mv)m.movedAt=performance.now();player.moving=mv||performance.now()-(m.movedAt??-1e9)<140;}/* Oct 19 fix: inputs arrive in batches (~30/s), so 'moved this frame' flickered Run/Idle on the host; hold it 140 ms */if(warrior)own.push(...handleWarriorHits(warrior,combat,survival,player,own,worldProps));});
    for(const e of own)e.by??=m.id;events.push(...own);}}
function forKits(fn){for(const m of party.players)if(!m.local&&m.kit&&visible(m.x,m.y,700))withMember(m,()=>atDrawPos(m,fn));}
/* Oct 19 fix (user: on the host the friend looks "super quick appear/disappear", flashy): measured on the host the friend
   stood still 78% of frames and jumped ~4 px when an input batch arrived (~30/s); the friend's own screen was smooth.
   The host now DRAWS remote teammates at a smoothed position (45 ms ease toward the simulated one; snaps on jumps
   over 150 px such as pit exits, the realm pull or teleports). Simulation, hits and snapshots keep the exact position. */
let smoothT=0;
function smoothRemotes(){const now=performance.now(),dt=Math.min(.1,(now-(smoothT||now))/1000);smoothT=now;const k=1-Math.exp(-dt/.045);
  for(const m of party.players){if(!m.remote||!m.kit)continue;
    /* facing: measured 46 one-or-two-frame direction flips per 30 s on the host (0 on the friend's screen); a new facing must hold 80 ms before it is drawn */
    if(m.drow==null)m.drow=m.row;if(m.row!==m.drow){if(m.rowCand!==m.row){m.rowCand=m.row;m.rowSince=now;}else if(now-m.rowSince>=80)m.drow=m.row;}else m.rowCand=null;
    if(m.rx==null||Math.hypot(m.x-m.rx,m.y-m.ry)>150){m.rx=m.x;m.ry=m.y;continue;}m.rx+=(m.x-m.rx)*k;m.ry+=(m.y-m.ry)*k;}}
function atDrawPos(m,fn){if(!m.remote||m.rx==null)return fn();const x=m.x,y=m.y,r=m.row;m.x=m.rx;m.y=m.ry;if(m.drow!=null)m.row=m.drow;try{return fn();}finally{m.x=x;m.y=y;m.row=r;}}
function kitGround(){ctx.save();ctx.spellColorFilter=SPELL_COLORS.find(c=>c.id===survival.spellColor)?.filter??'none';ctx.filter=ctx.spellColorFilter;if(mage)drawMageEffects(ctx,mage,drawPackEffect,true);if(ranger){rgrVfxOn=drawRangerVfx(ctx,{r:ranger,path:survival.path},'ground');drawRangerGround(ctx,ranger,time,player,combat.targets,rgrVfxOn);}if(warrior){drawWarriorEffects(ctx,warrior,drawPackEffect,true);warVfxOn=drawWarriorVfx(ctx,{w:warrior,c:combat,p:player,s:survival,path:survival.path,time},'ground');}ctx.spellColorFilter='none';ctx.restore();}
function kitUpper(){ctx.save();ctx.spellColorFilter=SPELL_COLORS.find(c=>c.id===survival.spellColor)?.filter??'none';ctx.filter=ctx.spellColorFilter;if(mage)drawMageEffects(ctx,mage,drawPackEffect);if(warrior)drawWarriorEffects(ctx,warrior,drawPackEffect);if(ranger){drawRangerUpper(ctx,ranger,time,player,combat.targets,drawRangerClone,rgrVfxOn);drawRangerVfx(ctx,{r:ranger,path:survival.path},'upper');}ctx.spellColorFilter='none';ctx.restore();}
function kitWeapons(){drawWeaponEffects(ctx,combat,player,time,survival.path,warVfxOn);if(warrior){ctx.save();ctx.spellColorFilter=SPELL_COLORS.find(c=>c.id===survival.spellColor)?.filter??'none';ctx.filter=ctx.spellColorFilter;drawWarriorVfx(ctx,{w:warrior,c:combat,p:player,s:survival,path:survival.path,time},'upper');ctx.spellColorFilter='none';ctx.restore();}}
function kitBody(){drawPlayer();if(warrior&&classId!=='mage')drawWarriorFront(ctx,warrior);}
function update(dt,elapsed=dt){
  if(clientRun){clientUpdate(dt);return;}if(victoryShown&&!survival.endless)return;
  if(onlineHost()&&inRun()&&!survival.dead){const held=levelPause();showLevelWait(levelPauseInfo(),picksOf(player)>0);if(held)return;}else if(levelWaitEl&&!levelWaitEl.hidden)showLevelWait(null);
  if(paused&&!(onlineHost()&&inRun())){if(armoryMode==='forge'&&!$('armory-panel').hidden)tickForgeMenuShield(forgeShield,elapsed);if(ready&&!$('welcome').hidden){if(lobbyView){camera.x=LOBBY_SPOT.x;camera.y=LOBBY_SPOT.y;}else{menuDrift+=Math.min(elapsed,.05);camera.x=mapSpawn.x+Math.sin(menuDrift*.045)*650;camera.y=mapSpawn.y+Math.sin(menuDrift*.031+1)*420;}}return;}
  if(pitExit){pitExitFrame([]);updateRewardNotice();frameEvents=[];frameTail(0,scene.props);return;}
  time+=dt;const optionalEvents=tickWorldEvents(worldEvents,survival,combat,player,scene.props,dt);for(const e of optionalEvents)if(e.type==='worldStomp')rewards.hazards.push({kind:'explosion',x:e.x,y:e.y,owner:e.owner,radius:150,age:0,warning:1,duration:.4,fired:false});applyWeapon();dash.recovery=survival.world?.dash??1;tickBossBuff(bossChoices,combat,survival,dt);combat.rewardDamage=(combat.rewardDamage??1)*(survival.mods?.damage??1);for(const q of party.players)if(!q.local&&q.kit)kitBossBuff(q.kit,dt);$('minimap-wrap').hidden=false;
  tickWeaponLoot(dt);
  if(survival.dead){$('minimap-wrap').hidden=true;tickSurvival(survival,combat,player,scene.props,{width,height,zoom:worldZoom()},dt);if(survival.deathTime>.8&&$('gameover').hidden){$('gameover').hidden=false;$('gameover-best').textContent=(recordBest(false)?'New best run for this mode! ':'')+'Gold, your equipped weapon and safe pocket are kept. Other run-bag items are lost.';$('run-summary').replaceChildren(...[[`${Math.floor(survival.clock/60)}:${String(Math.floor(survival.clock%60)).padStart(2,'0')}`,'Survived'],[survival.level,'Level'],[combat.kills,'Kills'],[rewards.runGold,'Gold']].map(([v,l])=>{const c=document.createElement('div'),b=document.createElement('b'),s=document.createElement('small');b.textContent=v;s.textContent=l;c.append(b,s);return c;}));}return;}
  const v=survival.downed?{x:0,y:0}:movementVector(keys),speed=walkSpeed();if(survival.downed){if(mage)mage.held=false;if(ranger)ranger.held=false;clearAttackInput(combat);}  // downed: no moving or attacking until revived
  combat.hazards=rewards.hazards;
  const powerEvents=tickElitePowers(rewards,survival,combat,player,scene.props,dt,{x:v.x*speed,y:v.y*speed});tickBossFx(combat,dt);
  if(survival.dead){powerEvents.forEach(onCombatEvent);syncAudio();hudSet(HUD.hpFill,'width','0%');hudSet(HUD.hpText,'text','HP 0 / '+survival.maxHp);hudFlush();return;}
  const activeWalls=wallProps(rewards),worldProps=withDynamicColliders(scene.props,activeWalls);
  if(tickForgeShield(forgeShield,player,combat.targets,scene.props,dt))toast('Forge shield · 20 seconds of protection');
  const enemyProps=withDynamicColliders(scene.props,[...activeWalls,...shieldCollider(forgeShield)]);setNavGoal(player.x,player.y,enemyProps,dt);
  if(CHEATS){if(Object.entries(cheatFlags).some(([k,v])=>k==='damage'?v!==1:!!v))survival.cheated=true;combat.cheat=cheatFlags;survival.godMode=cheatFlags.god;survival.noSpawn=cheatFlags.noSpawn;if(cheatFlags.god)survival.hp=survival.maxHp;if(cheatFlags.noCd){if(mage){for(const k in mage.cooldowns)mage.cooldowns[k]=0;mage.energy.value=mage.energy.max;}if(warrior){for(const k in warrior.cooldowns)warrior.cooldowns[k]=0;warrior.rage=RAGE.max;}if(ranger){for(const k in ranger.cooldowns)ranger.cooldowns[k]=0;ranger.momentum=MOMENTUM.max;}dash.cooldown=0;combat.heavyCooldown=0;}}
  const aim=pointer.active&&!survival.downed?{x:camera.x+(pointer.x-width/2)/worldZoom(),y:camera.y+(pointer.y-height/2)/worldZoom()}:null;
  const events=[...cheatEvents.splice(0),...optionalEvents,...powerEvents];
  runCommand(takeLocalCommand(v,aim));stepKit(v,aim,dt,worldProps,enemyProps,events);
  for(let i=dashTrail.length-1;i>=0;i--){dashTrail[i].life-=dt;if(dashTrail[i].life<=0)dashTrail.splice(i,1);}
  stepTeammates(dt,worldProps,enemyProps,events);  // Multiplayer batch 2: teammates run their own class kits
  const trialHold=arenaGate();showVote(voteInfo());events.push(...tickParty(survival,combat,worldProps,dt));events.push(...tickSurvival(survival,combat,player,enemyProps,{width,height,zoom:worldZoom()},dt));events.push(...tickRewards(rewards,survival,combat,player,enemyProps,{width,height,zoom:worldZoom()},dt));events.push(...tickDirector(director,survival,combat,dt,{spawnBoss:(kind,o)=>spawnRunBoss(kind,enemyProps,o),finalClear}),...tickBosses(survival,combat,player,enemyProps,dt),...tickFinalBoss(survival,combat,player,enemyProps,dt),...tickPits(pits,survival,combat,player,dt),...realmFrame(dt));keepOutOfPits(pits,combat);realmLoot(events);pitExitFrame(events);if(!trialHold)events.push(...sealTrialArena(worldEvents,arenas,survival,combat,player));syncTrialGate();syncPitGates();if(tickTitanBuffs(survival,dt))applyWeapon();repelShieldEnemies(forgeShield,combat.targets,scene.props);if(warrior)events.push(...handleWarriorHits(warrior,combat,survival,player,events.filter(e=>e.by==null),worldProps));processWorldDeaths(worldEvents,survival,combat,events);dropGroundXP(groundXP,events);healing??=createHealing(mapSpawn,FORGE,worldProps);events.push(...tickHealing(healing,survival,player,events,dt,Math.random,party.players.filter(q=>!q.local&&q.kit&&!q.encounterWaiting).map(q=>({p:q,s:q.kit.s,by:q.id}))));events.push(...tickGroundXP(groundXP,player,dt,1+(survival.cardStats?.pickup??0)));for(const m of party.players)if(!m.local&&standing(m))events.push(...tickGroundXP(groundXP,m,dt,1));/* shared XP: teammates pick up orbs too */queueBossChoices(bossChoices,survival,events);deliverCornerWeapons();updateRewardNotice();acceptEvents(survival,combat,events);rewardEvents(rewards,survival,events);weaponDrops(survival,events,weaponLoot);events.forEach(onCombatEvent);syncAudio();
  frameEvents=events;frameTail(dt,worldProps);
}
// Weapon drops on the ground: walk over them to collect (solo/host and online friends alike).
function tickWeaponLoot(dt){
  for(let i=weaponLoot.length-1;i>=0;i--){const d=weaponLoot[i];if(weaponClass(d.weapon)!==classId){weaponLoot.splice(i,1);continue;}d.clock+=dt;if(Math.hypot(d.x-player.x,d.y-player.y)<30){const next=JSON.parse(JSON.stringify(armory));next.gold=rewards.gold;if(!storeRunWeapon(next,d.weapon)){if(!d.bagFull){d.bagFull=true;toast('Run bag full ('+RUN_BAG+'). Salvage a weapon or use the safe pocket first.');}continue;}if(d.rewardId&&next.activityRewards?.[d.rewardId])next.activityRewards[d.rewardId].claimed=true;next.revision=(armory.revision??0)+1;try{persistArmory(next);armory=next;if(runWeapons.length<12)runWeapons.push(d.weapon.id);weaponLoot.splice(i,1);toast('Collected '+d.weapon.name);}catch{toast('Weapon remains on ground: save unavailable or changed in another tab');}}}
}
// Cosmetics, HUD, minimap and camera: shared by the host/solo update() and the online client (clientUpdate).
function frameTail(dt,worldProps){
  {const ease=1-Math.exp(-10*dt);camera.x+=(player.x-camera.x)*ease;camera.y+=(player.y-camera.y)*ease;}  // camera first (Oct 17): a failing HUD piece can't freeze the view
  for(let i=levelNotices.length-1;i>=0;i--){levelNotices[i].elapsed+=dt;if(levelNotices[i].elapsed>=levelNotices[i].duration)levelNotices.splice(i,1);}
  for(let i=rings.length-1;i>=0;i--){rings[i].life-=dt;if(rings[i].life<=0)rings.splice(i,1);}
  sandParticles.update(dt,player,survival.cast?.kind==='storm');
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;if(p.life<=0)particles.splice(i,1);}
  for(let i=numbers.length-1;i>=0;i--){numbers[i].life-=dt;numbers[i].y-=30*dt;if(numbers[i].life<=0)numbers.splice(i,1);}
  // UI redesign (Oct 16): bottom bar = HP, resource, XP bars + slot tiles; clock/kills chip; phase under the minimap.
  hudSet(orbHUD.shield,'text',survival.barrier>0?Math.ceil(survival.barrier)+' shield':'');
  hudSet(HUD.hpText,'text',`HP ${Math.ceil(survival.hp)} / ${Math.ceil(survival.maxHp)}`);hudSet(HUD.hpFill,'width',hudPct(Math.ceil(survival.hp)/Math.ceil(survival.maxHp)*100));
  hudSet($('run-time'),'text',`${Math.floor(survival.clock/60)}:${String(Math.floor(survival.clock%60)).padStart(2,'0')}`);
  hudSet($('run-stats'),'text',phaseAt(survival.clock).name);hudSet(HUD.kills,'text',combat.kills+' kills');
  hudSet(HUD.xpFill,'width',hudPct(Math.ceil(survival.xp)/Math.ceil(survival.nextXP)*100));hudSet(HUD.xpText,'text',Math.ceil(survival.xp)+' / '+Math.ceil(survival.nextXP));hudSet(HUD.lv,'text','LV '+survival.level);hudSet($('gold-status'),'text',rewards.gold+' gold');
  {const picks=survival.pendingPicks?.length??0;hudSet($('points-status'),'hidden',!picks);hudSet($('points-status'),'text',picks+(picks===1?' pick':' picks')+' waiting');}
  // Oct 16 (user): no boss bar on spawn — only once you're fighting it (it's hurt or you're within 650px); a pit boss that resets hides it again.
  for(const e of combat.targets)if(e.role==='boss'){if(e.sleeping||e.leashing)e.engaged=false;else if(e.state==='alive'&&(e.hp<e.maxHp||Math.hypot(e.x-player.x,e.y-player.y)<650))e.engaged=true;}
  const boss=combat.targets.find(e=>e.role==='boss'&&e.state==='alive'&&e.engaged);hudSet($('boss-hud'),'hidden',!boss);if(boss){hudSet(HUD.bossFill,'width',hudPct(boss.hp/boss.maxHp*100));hudSet($('boss-hp'),'text',Math.ceil(boss.hp)+' / '+boss.maxHp);hudSet($('boss-status'),'text',boss.name+'  '+['→','↘','↓','↙','←','↖','↑','↗'][((Math.round(Math.atan2(boss.y-player.y,boss.x-player.x)/(Math.PI/4))%8)+8)%8]);}
  hudSet(HUD.cds.dash,'text',cdText(dash.cooldown));hudSet(HUD.tiles.dash,'class:cooling',dash.cooldown>0);hudSet(HUD.tiles.dash,'cooldown',dash.cooldown/DASH.cooldown);
  if(classId==='mage')updateMageHUD();else updateClassHUD();
  updateWorldHUD();updatePartyHUD();
  drawMinimap($('minimap'),minimap,player,worldProps,combat.targets,FORGE,dt,mapMarkers(),scene);
}
// ---------------- Online co-op, step 2 (Oct 17, user: Steam co-op) ----------------
// Host: runs the world as always; friends become party members whose command comes from the network, and every ~50 ms
// the host broadcasts a snapshot (net-sync.js). Client: does not simulate the world. It mirrors the snapshot into the same
// globals the renderer/HUD already read (combat, survival, rewards, its own class kit, teammates), predicts its own walking,
// and sends its input as commands. Approved online rules: no pause while friends are connected; the run ends if the host leaves.
const SNAP_EVENTS=new Set(['hit','death','bossImpact','slam','storm','parry','spellImpact','reaction','worldNotice','elite','bossArrival','cataclysm','allyDowned','allyRevived','victory']);
const KIT_S=KIT_OWN.filter(k=>k!=='warrior'&&k!=='ranger');
const KIT_C=['attack','attackSequence','projectiles','secondary','effects','nextCombo','chainTimer','heavyCooldown','weapon','runeColor','hitstop'];
const REC=['id','name','color','classId','x','y','row','frame','moving','invulnerable','rollT','revive','steam','netAck','bot','remote'];
const pickKeys=(o,keys)=>{const r={};if(o)for(const k of keys)if(o[k]!==undefined)r[k]=o[k];return r;};
const hostSync=createHostSync(),hostPeers=new Map();let hostRun=0,clientRunId=null,clientHost=null,inputBatch=createInputBatch(),inputWasBlocked=false;let clientPicks=0,clientSync=createClientSync(),snapClock=0,clientRun=false,netSeq=0,myNetId=null,frameEvents=[];
/* Oct 19 (user: friend's view got choppy and froze more as the run went on, ~60 ms ping): per-second network history for the
   F3 'Copy performance report'. Friend: [updates received, longest gap ms, added delay ms] where added delay = how much later
   than the fastest-ever update one arrived (grows when updates queue up somewhere). Host: [KB sent, max in flight, throttled]. */
const netTel={c:{t:0,n:0,gap:0,lag:0,last:0,best:Infinity,hist:[]},h:{t:0,kb:0,inF:0,thr0:0,hist:[]}};
function telSnap(m){const c=netTel.c,now=performance.now();if(c.last)c.gap=Math.max(c.gap,now-c.last);c.last=now;c.n++;const d=now-(m.ht??now);if(d<c.best)c.best=d;c.lag=Math.max(c.lag,d-c.best);
  if(!c.t)c.t=now;if(now-c.t>=1000){c.hist.push([c.n,Math.round(c.gap),Math.round(c.lag)]);if(c.hist.length>120)c.hist.shift();c.t=now;c.n=0;c.gap=0;c.lag=0;}}
function telHost(bytes,flow){const h=netTel.h,now=performance.now();h.kb+=bytes/1024;h.inF=Math.max(h.inF,flow.pending.length);
  if(!h.t){h.t=now;h.thr0=flow.skips;}if(now-h.t>=1000){h.hist.push([Math.round(h.kb),h.inF,flow.skips-h.thr0]);if(h.hist.length>120)h.hist.shift();h.t=now;h.kb=0;h.inF=0;h.thr0=flow.skips;}}
function networkReport(){return {history:net.role==='client'?{per_second_received_gapMs_addedDelayMs:netTel.c.hist.map(x=>x.join('/')).join(' ')}:{per_second_sentKB_inFlight_throttled:netTel.h.hist.map(x=>x.join('/')).join(' ')},role:net.role,traffic:net.traffic(),snapshot:clientSync.n,peers:[...hostPeers].map(([id,p])=>({id,inFlight:p.flow.pending.length,queuedBytes:p.flow.bytes,throttled:p.flow.skips,buildMs:p.buildMs,lastBytes:p.lastBytes})),ping:[...net.peers.values()].map(p=>({name:p.name,ms:p.ping}))};}
const predHistory=[],mirrors=new Map(),clientRewards=[];
let forceOnline=false;  // ?debug only: act as an online host without a real friend
const onlineHost=()=>forceOnline||net.role==='host'&&net.peers.size>0;
const sentParticles=new WeakSet();
function newParticles(st,field='particles'){if(!st?.[field])return undefined;const out=[];for(const p of st[field])if(!sentParticles.has(p)){sentParticles.add(p);out.push(p);}return out.length?out.slice(-60):undefined;}  // spell spam: at most 60 new particles per update
function kitView(m){const k=m.local?{classId,s:survival,c:combat,mage,warrior,ranger,dash}:m.kit;if(!k)return null;
  return {classId:k.classId,s:pickKeys(k.s,KIT_S),c:pickKeys(k.c,KIT_C),mage:k.mage?{...k.mage,icePaths:k.mage.icePaths?.map(ip=>pickKeys(ip,['x','y','origin','angle','len','max','width','speed','age','life','done','seed']))}:null,warrior:k.warrior,ranger:k.ranger,dash:k.dash,np:newParticles(k.mage??k.warrior??k.ranger),ne:newParticles(k.mage,'efx')};}
// Same motion as each class's own particle update (mage.js / warrior.js / ranger.js).
function ageParticles(st,dt){if(st?.efx)ageEFx(st,dt);if(!st?.particles?.length)return;const r=st===ranger||st.momentum!==undefined,w=!r&&st.rage!==undefined;
  for(const v of st.particles){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;if(r){v.z=Math.max(0,(v.z??0)+(v.vz??0)*dt);v.vz=(v.vz??0)-420*dt;v.vx*=.96;v.vy*=.96;}else v.vy+=(w?110:65)*dt;}
  st.particles=st.particles.filter(v=>v.life>0);if(st.particles.length>400)st.particles.splice(0,st.particles.length-400);}
function recView(m){const r=pickKeys(m,REC);if(m.local)r.name=net.myName||'Host';  // was 'You' on the friend's screen (looked like their own character)
  r.hp=m.hp;r.maxHp=m.maxHp;r.downed=m.downed;r.dead=m.dead;r.host=!!m.local;return r;}
// Oct 17 (user): co-op level-ups pause the shared world. When the first player finishes picking, the others get a 20 s
// countdown; then their remaining picks are chosen at random and the run resumes. No countdown until someone has picked.
const LEVEL_WAIT=20;let levelHold=null;
const picksOf=p=>{const s=p.local?survival:p.kit?.s;return s&&currentOffer(s)?s.pendingPicks?.length??0:0;};
function autoPick(p){const run=()=>{const s=survival;for(let n=0;n<12&&s.pendingPicks?.length;n++){const o=currentOffer(s);if(!o?.options?.length||!chooseOffer(s,Math.floor(Math.random()*o.options.length)))break;}combat.skills=s.skills;};
  if(p.local){run();applyWeapon();configureAbilityLabels();if(mage)updateMageHUD();toast('Time is up · level-up picked for you','#e6c581');renderLevelUp();}
  else withMember(p,()=>{run();combat.weapon=withCards(weaponStats(p.kit.weapon,survival.level,survival.endless?'endless':'normal'),survival);syncWeaponPassives(survival,mage,combat.weapon);});}
function levelPause(){for(const p of party.players)if(p.remote&&p.kit&&p.kit.lvl!==survival.level)syncKit(p);  // friends get their level-up picks the same frame as the host
  const ps=party.players.filter(p=>p.local||p.remote),pending=ps.filter(p=>picksOf(p)>0);
  if(!pending.length){levelHold=null;return false;}
  const now=performance.now()/1000;if(!levelHold){for(const p of ps)if(p.remote){p.netMoves=[];p.netAck=p.netSeq;withMember(p,()=>runCommand({press:['cancel']}));}levelHold={involved:new Set(),deadline:null};if(ps.some(p=>!picksOf(p)))levelHold.deadline=now+LEVEL_WAIT;}  // someone has nothing to pick (e.g. a friend's starting pick on join): countdown at once
  for(const p of pending)levelHold.involved.add(p.id);
  if(levelHold.deadline==null&&ps.some(p=>levelHold.involved.has(p.id)&&!picksOf(p)))levelHold.deadline=now+LEVEL_WAIT;
  if(levelHold.deadline!=null&&now>=levelHold.deadline){for(const p of pending)autoPick(p);levelHold=null;return ps.some(p=>picksOf(p)>0);}
  if(picksOf(player)&&$('levelup-panel').hidden)openLevelUp();
  return true;}
const levelPauseInfo=()=>levelHold?{left:levelHold.deadline==null?null:Math.max(0,Math.ceil(levelHold.deadline-performance.now()/1000)),waiting:party.players.filter(p=>(p.local||p.remote)&&picksOf(p)>0).map(p=>({id:p.id,name:p.local?(net.myName||'Host'):p.name}))}:null;
let levelWaitEl=null;
function showLevelWait(info,mine){if(!levelWaitEl){levelWaitEl=document.createElement('div');levelWaitEl.className='lvl-wait';levelWaitEl.hidden=true;document.body.append(levelWaitEl);}
  const text=info?'LEVEL UP · game paused'+(info.waiting?.length?' · waiting for '+info.waiting.map(w=>w.id===(clientRun?myNetId:0)?'you':w.name).join(', '):'')+(info.left!=null?' · auto-pick in '+info.left+'s':'')+(mine&&info.left!=null?' (yours too)':''):'';
  if(levelWaitEl.hidden!==!info)levelWaitEl.hidden=!info;if(info&&levelWaitEl.textContent!==text)levelWaitEl.textContent=text;}  // direct writes: the HUD flush doesn't run while the world is held
// ---------------- Co-op arena vote (Oct 17, user) ----------------
// Online, stepping into a boss pit (boss there) or a colosseum trial starts a vote for everyone: all must vote yes within
// 15 s. Yes: every player is teleported in together. No / time out: nobody goes in (the one who stepped in is moved out; a
// trial is cancelled). Everyone is immune while the vote is open. Without real friends (solo, bots) there is no vote and
// bots are brought along.
const VOTE_TIME=15,arenaOk=new Set(),arenaCooldown=new Map();let arenaVote=null;
const realPlayers=()=>party.players.filter(p=>p.local||p.remote);
const inA=(a,p,pad=0)=>Math.hypot(p.x-a.x,(p.y-a.y)/.72)<a.radius-pad;
function arenaCandidates(){const list=[];
  for(const pit of pits)if(pit.status==='sleeping'||pit.status==='awake')list.push({a:pit.arena,kind:'pit',title:String(BOSS_DEFS[pit.boss]?.name??'the boss').toLowerCase().split(' ').map(w=>w?w[0].toUpperCase()+w.slice(1):w).join(' ')+"'s pit"});
  const t=worldEvents.events.find(x=>x.kind==='trial'&&x.status==='active'&&!x.sealed),ca=trialArena();if(t&&ca)list.push({a:ca,kind:'trial',title:'the colosseum trial'});
  return list;}
// Oct 18 (user): a pit with a path sends you back to just outside its entrance.
function moveOut(p,a){if(a.path){p.x=a.entranceX+a.path.dx*80;p.y=a.entranceY+a.path.dy*80;return;}const dx=p.x-a.x,dy=(p.y-a.y)/.72,d=Math.hypot(dx,dy)||1,R=a.radius+36;p.x=a.x+dx/d*R;p.y=a.y+dy/d*R*.72;}
function moveIn(list,a){list.forEach((p,i)=>{const ang=Math.atan2(p.y-a.y,p.x-a.x)+(i-(list.length-1)/2)*.35,R=a.radius*.62;p.x=a.x+Math.cos(ang)*R;p.y=a.y+Math.sin(ang)*R*.72;});}
// Oct 18 (user): after a pit kill everyone who was inside picks their own reward card; once all of them have chosen,
// everyone still in the pit is teleported out to its entrance. A pit that seals (host walked out) also moves stragglers out.
let pitExit=null;
function pitExitFrame(events){
  for(const e of events)if(e.type==='pitCleared'){const a=arenas.find(x=>x.id===e.pit);if(!a)continue;const kind=pits.find(p=>p.arena.id===a.id)?.boss;const death=events.find(x=>x.type==='death'&&x.id===e.bossId),eligible=p=>!death?.eligibleOwners||death.eligibleOwners.includes(String(p.local?(survival.rewardOwner??0):p.steam));/* Oct 18: only wait for players who actually get a reward card (late entrants get none) */const ids=realPlayers().filter(p=>inA(a,p,0)&&eligible(p)&&!(p.local?survival:p.kit?.s)?.blessings?.[kind]).map(p=>p.id);if(!ids.length)for(const p of party.players)if(inA(a,p,0))moveOut(p,a);
    if(ids.length){pitExit={a,bossId:e.bossId,wait:new Set(ids),f:0};toast('Choose your boss reward to leave the pit','#ffd27a');}}
  if(pitExit){const alive=new Set(realPlayers().map(p=>p.id));for(const id of [...pitExit.wait])if(!alive.has(id))pitExit.wait.delete(id);/* Oct 19 fix: never wait on a player with no pending reward for this boss (that froze the game forever) */if(++pitExit.f>=3)for(const p of realPlayers())if(pitExit.wait.has(p.id)&&!(p.local?bossChoices:p.kit?.bossChoices)?.pending?.some(r=>r.bossId===pitExit.bossId))pitExit.wait.delete(p.id);
    if(!pitExit.wait.size){const a=pitExit.a;pitExit=null;let n=0;for(const p of party.players)if(inA(a,p,0)){moveOut(p,a);p.x+=(n%3-1)*36;p.y+=Math.floor(n/3)*30;n++;shield(p);}if(n)toast('Rewards chosen · teleported out of the pit','#9be37a');}}
  for(const pit of pits)if(pit.status==='cooldown'&&pit.sealed&&!(pitExit&&pitExit.a===pit.arena))for(const p of party.players)if(inA(pit.arena,p,0))moveOut(p,pit.arena);}
function pitExitClaim(id,bossId){if(pitExit&&pitExit.bossId===bossId)pitExit.wait.delete(id);}
// Each teammate's own damage/defence multipliers (boss blessing + their own cards); they used to inherit the host's.
function kitBossBuff(k,dt){tickBossBuff(k.bossChoices??={buff:null},k.c,k.s,dt);k.c.rewardDamage*=(survival.mods?.damage??1);}

function shield(p){const s=p.local?survival:p.kit?.s;if(s)s.grace=Math.max(s.grace??0,.25);else p.grace=Math.max(p.grace??0,.25);}
const voteInfo=()=>arenaVote&&{id:arenaVote.id,title:arenaVote.title,by:arenaVote.byName,left:Math.max(0,Math.ceil(arenaVote.until-performance.now()/1000)),votes:Object.fromEntries(arenaVote.votes)};
// Host, every frame before pits/trial logic. Returns true while a trial vote is open (the trial must not seal/end yet).
function arenaGate(){const cands=arenaCandidates(),now=performance.now()/1000,real=realPlayers(),online=real.some(p=>p.remote);
  for(const id of [...arenaOk]){const ar=arenas.find(x=>x.id===id);if(!ar||!real.some(p=>inA(ar,p,0)))arenaOk.delete(id);}  // approval lasts while someone is inside
  if(arenaVote){const v=arenaVote;for(const p of party.players){shield(p);if(v.kind==='pit'&&inA(v.a,p,0))moveOut(p,v.a);}
    const all=real.every(p=>v.votes.get(p.id)===true),no=[...v.votes.values()].some(x=>x===false);
    if(all){arenaVote=null;arenaOk.add(v.a.id);moveIn(party.players.filter(p=>!p.downed),v.a);for(const p of party.players){const s=p.local?survival:p.kit?.s;if(s)s.grace=Math.max(s.grace??0,2);else p.grace=2;}  /* 2 s to get your bearings after the teleport */toast('Vote passed · everyone into '+v.title,'#9be37a');return false;}
    if(no||now>=v.until){arenaVote=null;arenaCooldown.set(v.a.id,now+3);for(const p of party.players)if(inA(v.a,p,0)||atEntrance(v.a,p))moveOut(p,v.a);toast((no?'Vote failed':'Vote timed out')+' · nobody enters '+v.title,'#ff9a6b');return false;}
    return v.kind==='trial';}
  for(const c of cands){if(arenaOk.has(c.a.id))continue;const who=real.find(p=>!p.downed&&(inA(c.a,p,0)||(online&&c.kind==='pit'&&atEntrance(c.a,p))));if(!who)continue;  /* online pits: the vote starts at the path entrance (Oct 18) */
    if(!online){arenaOk.add(c.a.id);moveIn(party.players.filter(p=>!p.local&&!p.downed&&!inA(c.a,p,0)),c.a);continue;}  // solo/bots: no vote, bots come along
    if((arenaCooldown.get(c.a.id)??0)>now){if(c.kind==='pit')moveOut(who,c.a);continue;}
    arenaVote={id:Math.random().toString(36).slice(2,8),a:c.a,kind:c.kind,title:c.title,byName:who.local?(net.myName||'Host'):who.name,until:now+VOTE_TIME,votes:new Map([[who.id,true]])};
    if(c.kind==='pit'&&inA(c.a,who,0))moveOut(who,c.a);return c.kind==='trial';}
  return false;}
function castVote(yes){if(clientRun){const v=survival.arenaVote;if(v)net.send(net.lobby.owner,{t:'vote',run:clientRunId,id:v.id,yes:!!yes});voteSent=v?.id;return;}if(arenaVote)arenaVote.votes.set(0,!!yes);}
let voteBox=null,voteSent=null;
function showVote(v){if(!voteBox){voteBox=document.createElement('div');voteBox.className='vote-box';voteBox.hidden=true;voteBox.innerHTML='<b></b><small></small><div class="vote-row"><button class="net-btn yes">Yes · teleport in <kbd>Y</kbd></button><button class="net-btn small no">No <kbd>N</kbd></button></div>';
    voteBox.querySelector('.yes').onclick=()=>castVote(true);voteBox.querySelector('.no').onclick=()=>castVote(false);document.body.append(voteBox);}
  if(voteBox.hidden!==!v)voteBox.hidden=!v;if(!v)return;
  const me=clientRun?myNetId:0,mine=v.votes?.[me],text=v.by+' wants to enter '+v.title+'. Teleport everyone in?',sub=(mine===true?'You voted yes · ':mine===false?'You voted no · ':'')+'everyone must vote yes · '+v.left+'s · you are immune while voting';
  const b=voteBox.querySelector('b'),s=voteBox.querySelector('small');if(b.textContent!==text)b.textContent=text;if(s.textContent!==sub)s.textContent=sub;
  const done=mine!==undefined;for(const btn of voteBox.querySelectorAll('button'))if(btn.disabled!==done)btn.disabled=done;}
addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;const v=clientRun?survival.arenaVote:voteInfo();if(!v||e.repeat)return;const k=e.key.toLowerCase();if(k==='y'||k==='n'){castVote(k==='y');e.preventDefault();}},true);
let hostTickCalls=0,hostTickLast=null;function hostTick(dt){hostTickCalls++;hostTickLast={dt,online:onlineHost(),inRun:inRun(),snapClock};if(!onlineHost()||!inRun()){frameEvents=[];return;}
  for(const p of [...party.players])if(p.remote&&!forceOnline&&!net.peers.has(p.steam)){toast(p.name+' left the run');removeRemote(p.steam);}
  for(const id of hostPeers.keys())if(!net.peers.has(id))hostPeers.delete(id);
  for(const [id,peer] of hostPeers){hostEvents(peer.H,frameEvents,SNAP_EVENTS);const member=party.players.find(p=>p.steam===id);if(member?.kit){member.kit.bossChoices??=createBossChoices();member.kit.s.rewardOwner=id;queueBossChoices(member.kit.bossChoices,member.kit.s,frameEvents);}const deaths=frameEvents.filter(e=>e.type==='death'&&(!e.eligibleOwners||e.eligibleOwners.includes(String(id)))).map(e=>pickKeys(e,['type','id','modifier','xp','x','y','role','world','bossKind','rewardAnchor']));if(deaths.length)net.send(id,{t:'rewards',run:hostRun,events:deaths});}frameEvents=[];
  snapClock-=dt;if(snapClock>0)return;snapClock=Math.max(0,snapClock+.05);
  const shared={run:hostRun,runId:survival.runId,cheated:survival.cheated,endless:survival.endless,clock:survival.clock,level:survival.level,xp:survival.xp,nextXP:survival.nextXP,dead:survival.dead,deathTime:survival.deathTime,timeStop:survival.timeStop??null,finalPhase:survival.finalPhase,dayPressure:survival.dayPressure,mode:survival.mode,kills:combat.kills,levelPause:levelPauseInfo(),arenaVote:voteInfo()};
  const readyPeers=[...hostPeers].filter(([,peer])=>canSend(peer.flow));if(!readyPeers.length)return;
  const players=party.players.map(m=>({id:m.id,rec:recView(m),kit:kitView(m)})),light=new Set([...combat.targets,...party.players]);
  for(const [id,peer] of readyPeers){const started=performance.now();
    const raw=hostSnapshot(peer.H,{channels:{e:combat.targets,h:rewards.hazards,b:combat.enemyProjectiles??[],x:groundXP.items,k:healing?.packs??[],w:worldEvents.events},shared,players,light,
      lazy:(key,o)=>key==='e'&&peer.H.seq%4!==0&&o.role!=='boss'&&party.players.every(p=>!p.remote||Math.abs(p.x-o.x)>1300||Math.abs(p.y-o.y)>900)});
    peer.buildMs=performance.now()-started;peer.lastBytes=raw.length;sent(peer.flow,peer.H.seq,raw.length);net.sendRaw(id,raw);telHost(raw.length,peer.flow);
  }}

function initOnline(){net.onMessage((m,from)=>{if(clientRun){if(from===clientHost)clientMessage(m);}else if(net.role==='host')hostMessage(m,from);else if(net.role==='client'&&from===net.lobby?.owner)clientMessage(m);});}  // called right after createNet (net is declared further down)
function hostMessage(m,from){{
    if(!net.peers.has(from)&&from!=='test-steam')return;
    if(!m||typeof m!=='object')return;
    if(['cmd','lvl','vote','ack','wpn','boss','world'].includes(m.t)&&m.run!==hostRun)return;
    if(m.t==='ack'){const peer=hostPeers.get(from);if(peer)acknowledge(peer.flow,m.n);return;}
    if(m.t==='join'&&startCount){pendingJoins.set(from,m);return;}  // countdown: kit is built when the run starts
    if(m.t==='join'&&inRun()&&!survival.dead){let r=party.players.find(p=>p.steam===from);
      if(!r){r=addRemote(from,m.cls,m.name,survival);if(!r){net.send(from,{t:'full'});return;}makeKit(r,{path:m.path,weapon:m.weapon,helpers:m.helpers,gameplayLoadout:m.gameplayLoadout,spellColor:m.spellColor});r.x=player.x+40;r.y=player.y+30;}
      let peer=hostPeers.get(from);if(!peer){peer={H:createHostSync(),flow:createFlow()};hostPeers.set(from,peer);}resetHostSync(peer.H);toast(r.name+' joined the run','#9be37a');}
    else if(m.t==='lvl'){const r=party.players.find(p=>p.steam===from);if(!r?.kit)return;
      withMember(r,()=>{const s=survival,i=m.i|0;
        if(m.op==='choose'){if(chooseOffer(s,i))combat.skills=s.skills;}
        else if(m.op==='banish'){if(s.helpers?.banish>0&&banishOption(s,i))s.helpers.banish--;}
        else if(m.op==='reroll'){if(s.offer?.kind==='stat'&&s.helpers?.reroll>0){s.helpers.reroll--;s.offer=null;}}
        else if(m.op==='heal')healInstead(s,Math.round(s.maxHp*.3));
        if(s.pendingPicks?.length)currentOffer(s);combat.weapon=withCards(weaponStats(r.kit.weapon,survival.level,survival.endless?'endless':'normal'),s);syncWeaponPassives(s,mage,combat.weapon);});}
    else if(m.t==='wpn'){const r=party.players.find(p=>p.steam===from),w=m.weapon;if(!r?.kit||!w||typeof w!=='object'||!validateWeapon(w)||!weaponEligible(w,r.kit.classId,r.kit.s.path))return;  // Oct 18 (user: "friends cant change weapons")
      if(r.kit.c.attack||r.kit.warrior?.cast||r.kit.mage?.cast||rangerBusy(r.kit.ranger)){r.kit.queuedWeapon=w;return;}r.kit.weapon=w;withMember(r,()=>{combat.weapon=withCards(weaponStats(w,survival.level,survival.endless?'endless':'normal'),survival);syncWeaponPassives(survival,mage,combat.weapon);});}
    else if(m.t==='world'&&m.action==='shrineHeal'){const p=party.players.find(p=>p.steam===from),e=worldEvents.events.find(e=>e.key===m.key&&e.kind==='shrine');if(!p?.kit||!e||Math.hypot(p.x-e.x,p.y-e.y)>260)return;const used=(hostShrineHeals[p.steam]??=new Set());if(used.has(e.key))return;used.add(e.key);const s=p.kit.s;s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.35);}
    else if(m.t==='world'){const p=party.players.find(p=>p.steam===from),e=worldEvents.events.find(e=>e.key===m.key);if(!p?.kit||!e||!['trial','rift','camp'].includes(e.kind)||!['start','accept'].includes(m.action))return;const r=actWorld(worldEvents,e,p.kit.s,combat,p,scene.props,m.action);if(r.error)net.send(from,{t:'notice',text:r.error});}
    else if(m.t==='boss'){const r=party.players.find(p=>p.steam===from),bid=m.bossId;if(!r?.kit)return;const q=r.kit.bossChoices,p=q?.pending.find(v=>v.bossId===bid);if(!p||p!==q.pending[0])return;if(claimBossChoice(q,r.kit.s,p.id,m.choice)){r.kit.lvl=0;pitExitClaim(r.id,bid);}}
    else if(m.t==='err'){const r=party.players.find(p=>p.steam===from);toast((r?.name??'Friend')+': error - '+String(m.msg).slice(0,140),'#ff6b6b');console.warn('friend error',from,m.msg);}
    else if(m.t==='vote'){const r=party.players.find(p=>p.steam===from);if(r&&arenaVote&&m.id===arenaVote.id)arenaVote.votes.set(r.id,!!m.yes);}
    else if(m.t==='ready'){m.on?readyIds.add(from):readyIds.delete(from);lobbyState();hostCheckReady();}
    else if(m.t==='ask'){if(inRun()&&!survival.dead)net.send(from,{t:'start',run:hostRun});}  // a friend pressed Start run: bring them into the running game
    else if(m.t==='cmd'){const r=party.players.find(p=>p.steam===from);if(!r)return;
      const now=performance.now();r.netCredit=Math.min(.25,(r.netCredit??.1)+(now-(r.netInputAt??now))/1000);r.netInputAt=now;
      for(const raw of (Array.isArray(m.steps)?m.steps:[]).slice(0,16)){const q=validCommand(raw);if(!q||q.q<=r.netSeq)continue;r.netSeq=q.q;
        q.d=Math.min(q.d,r.netCredit);r.netCredit-=q.d;
        if(levelHold||r.downed||survival.dead){r.netAck=q.q;r.netMoves=[];r.netMove={x:0,y:0};withMember(r,()=>runCommand({press:['cancel']}));continue;}
        r.netMove={x:q.m[0],y:q.m[1]};r.netAim=q.a?{x:q.a[0],y:q.a[1]}:null;
        (r.netMoves??=[]).push(q);if(r.netMoves.length>64){r.netAck=r.netMoves.shift().q;}}
    }
    return;}}
function clientMessage(m){
  if(m.t==='lobby'){readyIds.clear();for(const id of Array.isArray(m.ready)?m.ready:[])readyIds.add(String(id));hostRunning=!!m.running;myReady=readyIds.has(net.me);readyView();return;}
  if(m.t==='countdown'){if(m.cancel){startCount=null;showCount(null);return;}if(!clientRun)clientCountdown(m.sec|0||START_COUNT);return;}
  if(m.t==='start'){if(m.run===clientRunId&&clientRun)return;clientStart(m.run);}
  else if(m.t==='end'&&m.run===clientRunId)clientEnd('The host ended the run');
  else if(m.t==='notice')toast(String(m.text).slice(0,180));
  else if(m.t==='full')clientEnd('The run is full');
  else if(m.t==='rewards'&&clientRun&&m.run===clientRunId&&Array.isArray(m.events))clientRewards.push(...m.events);
  else if(m.t==='snap'&&clientRun&&m.s?.run===clientRunId&&applySnapshot(clientSync,m)){clientSync.fresh=true;telSnap(m);net.send(net.lobby.owner,{t:'ack',run:clientRunId,n:m.n});}}
// Oct 17 (user): online starts/restarts count down in the character lobby (friends' joins are prepared meanwhile), then
// everyone enters together; level-up cards wait 2 s after entering so every PC has loaded.
const START_COUNT=5,CARD_DELAY=2000;let startCount=null,startNow=false,cardsAt=0;const pendingJoins=new Map();
let countEl=null;
function showCount(n){if(!countEl){countEl=document.createElement('div');countEl.className='start-count';countEl.hidden=true;document.body.append(countEl);}
  const on=n!=null;if(countEl.hidden!==!on)countEl.hidden=!on;if(on){const t2='Run starts in '+n;if(countEl.textContent!==t2)countEl.textContent=t2;}}
function hostCountdown(){if(startCount)return;const until=performance.now()+START_COUNT*1000;startCount={until};net.broadcast({t:'countdown',sec:START_COUNT});
  const tick=()=>{if(!startCount)return;const left=Math.ceil((startCount.until-performance.now())/1000);
    if(left>0&&net.peers.size){showCount(left);setTimeout(tick,200);return;}
    startCount=null;showCount(null);readyIds.clear();myReady=false;startNow=true;try{$('enter').onclick();}finally{startNow=false;}lobbyState();};tick();}
function clientCountdown(sec){const until=performance.now()+sec*1000;startCount={until};sendJoin();
  const tick=()=>{if(!startCount||clientRun){showCount(null);return;}const left=Math.ceil((startCount.until-performance.now())/1000);showCount(Math.max(1,left));if(left>-5)setTimeout(tick,200);else{startCount=null;showCount(null);}};tick();}
function ensureClientPath(){if(!survival.path){const want=meta.last.paths?.[classId],first=(PATHS[classId]??[])[0]?.id;choosePath(survival,want&&pathUnlocked(meta,PATHS[classId],want)?want:first);combat.skills=survival.skills;}}
// Oct 18: a friend's equipped weapon (armory, pickups, forge) is sent to the host, which simulates their attacks with it.
let sentWeaponId=null;
function sendWeapon(w){if(!clientRun||!net.lobby||!w)return;const sig=w.id+':'+(w.quality??0)+':'+(armory.revision??0);if(sig===sentWeaponId)return;sentWeaponId=sig;net.send(net.lobby.owner,{t:'wpn',run:clientRunId,weapon:w});}
function sendJoin(){ensureClientPath();const mods=runMods(meta,meta.last.mode??'normal',meta.last.mods??[]);net.send(net.lobby.owner,{t:'join',gameplayLoadout:runRuneLoadout(meta,classId),spellColor:armory.victoryUnlocked?meta.spellColor:null,helpers:{reroll:mods.reroll,banish:mods.banish},cls:classId,path:survival.path,weapon:armory.weapons.find(w=>w.id===armory.equipped)??null,name:net.myName});}
function clientStart(run){if(clientRun||survival.dead)resetEncounter(null);clientRun=false;myReady=false;readyIds.clear();readyView();
  ensureClientPath();startCount=null;showCount(null);cardsAt=performance.now()+CARD_DELAY;
  clientRewards.length=0;bossChoices=createBossChoices();clientRunId=run;clientHost=net.lobby.owner;inputBatch=createInputBatch();inputWasBlocked=false;clientSync=createClientSync();clientPicks=0;lvlPending=false;mirrors.clear();predHistory.length=0;netSeq=0;myNetId=null;party.players.length=1;
  $('welcome').hidden=true;document.body.classList.remove('in-menu');lobbyView=false;paused=false;clientRun=true;camera.x=player.x;camera.y=player.y;syncAudio();sound.unlock();canvas.focus();
  sendJoin();joinRetryAt=performance.now()+1500;joinOk=false;joinFrames=0;joinStartedAt=performance.now();lastNetError='';}
// Oct 21 (user: "make a ready button and once everyone is ready up then we will have a countdown"): in a co-op lobby the
// Start button toggles Ready. The host keeps the ready list and shares it once a second; when every member (host included)
// is ready the shared countdown starts, and it is cancelled if anyone un-readies or a new friend joins. A friend whose host
// is already mid-run gets "JOIN RUN" instead (the old 'ask' path).
let myReady=false,hostRunning=false;const readyIds=new Set();
function readyView(){net.readyIds=readyIds;net.refresh?.();const b=$('enter'),co=!!net.lobby&&net.peers.size>0;if(!b?.firstChild)return;
  const t=!co?'START RUN':net.role==='client'&&hostRunning?'JOIN RUN':myReady?'READY ✓ · CANCEL':'READY UP';if(b.dataset.label!==t){b.dataset.label=t;b.firstChild.textContent=t+' ';}}
function lobbyState(){if(net.role!=='host'||!net.lobby)return;for(const id of [...readyIds])if(id!==net.me&&!net.peers.has(id))readyIds.delete(id);
  net.broadcast({t:'lobby',ready:[...readyIds],running:inRun()&&!survival.dead});readyView();}
function hostCheckReady(){if(inRun())return;const all=net.peers.size>0&&readyIds.has(net.me)&&[...net.peers.keys()].every(id=>readyIds.has(id));
  if(all&&!startCount)hostCountdown();else if(!all&&startCount){startCount=null;showCount(null);pendingJoins.clear();net.broadcast({t:'countdown',cancel:true});}}
function setReady(on){myReady=on;if(net.role==='host'){if(on)readyIds.add(net.me);else readyIds.delete(net.me);lobbyState();hostCheckReady();}
  else{net.send(net.lobby.owner,{t:'ready',on});if(on)readyIds.add(net.me);else readyIds.delete(net.me);readyView();}
  toast(on?'Ready · the run starts when everyone is ready':'Not ready');}
setInterval(()=>{if(!net.lobby){if(myReady||readyIds.size){myReady=false;readyIds.clear();hostRunning=false;}readyView();return;}if(net.role==='host'){lobbyState();hostCheckReady();}else readyView();},1000);
function clientEnd(reason){if(!clientRun)return;clientRun=false;mirrors.clear();party.players.length=1;resetEncounter('loadout');if(reason)toast(reason,'#ff9a6b');}
function applyMirror(){const C=clientSync;if(!C.fresh)return;C.fresh=false;const A=C.arrays;
  combat.targets=A.e??[];rewards.hazards=combat.hazards=A.h??[];combat.enemyProjectiles=A.b??[];groundXP.items=A.x??[];healing??=createHealing(mapSpawn,FORGE,scene.props);healing.packs=A.k??[];if(A.w)worldEvents.events=A.w;
  const others=[];
  for(const {r,k} of C.players){
    if(r.steam===net.me){myNetId=r.id;if(k){const pk=(mage??warrior??ranger);if(k.np&&pk)pk.particles.push(...k.np.splice(0));if(k.ne&&pk)(pk.efx??=[]).push(...k.ne.splice(0));Object.assign(survival,k.s);Object.assign(combat,k.c);if(mage&&k.mage)Object.assign(mage,k.mage);if(warrior&&k.warrior)Object.assign(warrior,k.warrior);if(ranger&&k.ranger)Object.assign(ranger,k.ranger);if(k.dash)Object.assign(dash,k.dash);}
      player.invulnerable=r.invulnerable;player.rollT=r.rollT;player.revive=r.revive;
      // Prediction: host position + my moves it hasn't processed yet; small errors ease out, big ones (dash, knockback) snap.
      while(predHistory.length&&predHistory[0].q<=r.netAck)predHistory.shift();let tx=r.x,ty=r.y;for(const h of predHistory){tx+=h.dx;ty+=h.dy;}
      const ex=tx-player.x,ey=ty-player.y;if(Math.hypot(ex,ey)>160){player.x=tx;player.y=ty;}else{player.x+=ex*.35;player.y+=ey*.35;}if(!joinOk){camera.x=player.x;camera.y=player.y;}continue;}
    let o=mirrors.get(r.id);if(!o){const c0=createCombat();delete c0.targets;delete c0.target;o={x:r.x,y:r.y,kit:{s:{hp:1,maxHp:1,cast:null},c:c0,mv:{max:1,n:1,timer:0}}};mirrors.set(r.id,o);}  // Oct 17 fix: start from real combat defaults (c.projectiles was undefined → drawWeaponEffects crashed every frame)
    const {x,y,...rest}=r;Object.assign(o,rest);o.local=false;o._tx=x;o._ty=y;netSample(o,clientSync.ht);
    if(k){const kk=o.kit;kk.classId=k.classId;Object.assign(kk.s,k.s);Object.assign(kk.c,k.c);kk.c.targets=combat.targets;kk.c.hazards=combat.hazards;
      if(k.classId==='mage'||k.mage)kk.mage=Object.assign(kk.mage??createMage({}),k.mage??{});if(k.classId==='sword'||k.warrior)kk.warrior=Object.assign(kk.warrior??createWarrior(null),k.warrior??{});if(k.classId==='ranger'||k.ranger)kk.ranger=Object.assign(kk.ranger??createRanger(null),k.ranger??{});kk.dash=Object.assign(kk.dash??createDash(),k.dash??{});const pk=kk.mage??kk.warrior??kk.ranger;if(k.np&&pk)pk.particles.push(...k.np.splice(0));if(k.ne&&pk)(pk.efx??=[]).push(...k.ne.splice(0));}
    others.push(o);}
  for(const id of [...mirrors.keys()])if(!others.some(o=>o.id===id))mirrors.delete(id);
  party.players.length=1;party.players.push(...others);
  Object.assign(survival,C.shared);for(const reward of survival.activityRewards??[])deliverActivityLoot(reward);combat.kills=C.shared.kills??combat.kills;
  for(const st of [mage,warrior,ranger,...others.flatMap(o=>[o.kit.mage,o.kit.warrior,o.kit.ranger])])if(st)st.fxTargets=combat.targets;  // status visuals read the mirrored enemies
  const picks=survival.pendingPicks?.length??0;if(lvlPending&&offerSig()!==lvlSig)lvlPending=false;  // the host answered
  if(picks&&survival.offer&&!lvlPending&&$('levelup-panel').hidden&&!survival.dead&&(picks>clientPicks||survival.levelPause))queueMicrotask(openLevelUp);
  if(!$('levelup-panel').hidden&&!lvlPending&&(picks!==clientPicks||offerSig()!==lastOfferSig||!picks))renderLevelUp();clientPicks=picks;lastOfferSig=offerSig();}
// Oct 17 (user: friends sometimes landed with no character/cards; "maybe just add a loading thing"): a joining friend sees
// "Joining <host>'s run..." until their own character has arrived and full frames ran; errors are shown and sent to the host.
let joinOk=false,joinStartedAt=0,joinFrames=0,lastNetError='';const sentErrors=new Set();let joinEl=null;
function reportNetError(msg){lastNetError=String(msg).slice(0,200);if(clientRun&&net.lobby&&!sentErrors.has(lastNetError)&&sentErrors.size<5){sentErrors.add(lastNetError);net.send(net.lobby.owner,{t:'err',msg:lastNetError});}}
function showJoining(){if(!joinEl){joinEl=document.createElement('div');joinEl.className='join-load';joinEl.hidden=true;document.body.append(joinEl);}
  const on=clientRun&&!joinOk;if(joinEl.hidden!==!on)joinEl.hidden=!on;if(!on)return;
  const slow=performance.now()-joinStartedAt>7000,host=[...mirrors.values()].find(o=>o.host)?.name??'the host';
  const text="Joining "+host+"'s run..."+(slow?(myNetId==null?'\nWaiting for the host to add you (retrying)':'\nLoading your character...')+(lastNetError?'\nError: '+lastNetError:''):'');if(joinEl.textContent!==text)joinEl.textContent=text;}
let joinRetryAt=0;
function clientUpdate(dt){time+=dt;
  showJoining();
  if(myNetId==null&&performance.now()>joinRetryAt){if(joinRetryAt)sendJoin();joinRetryAt=performance.now()+1500;}  // Oct 17 (user): friends sometimes missing at start/restart over Steam: resend the join until the host has us
  if(!net.lobby||net.lobby.owner!==clientHost||!net.peers.has(clientHost)){clientEnd('The host left the lobby');return;}
  applyMirror();smoothArrays(clientSync,dt);ageParticles(mage??warrior??ranger,dt);for(const o of mirrors.values())ageParticles(o.kit.mage??o.kit.warrior??o.kit.ranger,dt);
  {const rt=hostTimeNow(clientSync)-INTERP;for(const o of mirrors.values())netInterp(o,rt);}  /* Oct 19 audit: teammates use the same snapshot interpolation as enemies */
  const props=withDynamicColliders(scene.props,wallProps(rewards));
  const hold=survival.levelPause;showLevelWait(hold,(survival.pendingPicks?.length??0)>0);showVote(survival.arenaVote);
  const v=paused||hold||survival.downed||survival.dead?{x:0,y:0}:movementVector(keys),bx=player.x,by=player.y;
  if(!(dash.remaining>0)&&!(mage?.blinkTime>0)&&myNetId!=null){const sp=walkSpeed();slideMove(player,v.x*sp*dt,v.y*sp*dt,props);}
  predHistory.push({q:++netSeq,dx:player.x-bx,dy:player.y-by});if(predHistory.length>300)predHistory.shift();
  player.moving=Math.hypot(player.x-bx,player.y-by)>.05;player.frame+=dt*(player.moving?22:12);if(!(dash.remaining>0))updateWalkFacing(player,v);
  const aim=!paused?mouseAim():null,r2=n=>Math.round(n*100)/100;
  const edges=localInput.press.splice(0),blockedInput=paused||hold||survival.downed||survival.dead;
  const steps=batchInput(inputBatch,{q:netSeq,d:dt,m:[v.x,v.y],a:aim?[Math.round(aim.x),Math.round(aim.y)]:null,p:blockedInput?(inputWasBlocked?[]:['cancel']):edges});inputWasBlocked=!!blockedInput;
  if(steps)net.send(net.lobby.owner,{t:'cmd',run:clientRunId,steps});
  for(const e of clientRewards.splice(0)){rewardEvents(rewards,survival,[e]);weaponDrops(survival,[e],weaponLoot);queueBossChoices(bossChoices,survival,[e]);realmLoot([e]);}deliverCornerWeapons();updateRewardNotice();
  for(const e of clientSync.events.splice(0)){if(e.by===myNetId)delete e.by;else e.by??=-1;onCombatEvent(e);}
  // own gold pickups (same rules as rewards.js) and own weapon pickups (shared with solo)
  for(let i=rewards.drops.length-1;i>=0;i--){const d=rewards.drops[i];d.clock+=dt;const dx=player.x-d.x,dy=player.y-d.y,n=Math.hypot(dx,dy);if(n<90)movePlayer(d,dx/(n||1)*260*dt,dy/(n||1)*260*dt,props);
    if(Math.hypot(player.x-d.x,player.y-d.y)<22){rewards.gold+=d.amount;rewards.runGold+=d.amount;rewards.drops.splice(i,1);onCombatEvent({type:'gold',amount:d.amount});}}
  tickWeaponLoot(dt);
  dash.cooldown=Math.max(0,(dash.cooldown??0));
  frameTail(dt,props);
  if(survival.dead&&survival.deathTime>.8&&$('gameover').hidden){$('gameover').hidden=false;$('gameover-best').textContent='Everyone is down. The run is over.';$('run-summary').replaceChildren();}
  if(!joinOk&&myNetId!=null&&++joinFrames>=10){joinOk=true;showJoining();toast("Joined the host's run",'#9be37a');}}
// Mage cast slowdown eases in/out instead of stepping, so rapid basics don't stutter movement.
// Oct 17 (user): on phones attacking/casting slows walking half as much (desktop keeps the approved slows).
const touchSlow=f=>touch?(1+f)/2:f;
function mageMoveTarget(){return touchSlow(mage.channel?.kind==='drain'?Math.min(.9,.65+talentBonus(survival,'channelMove','RMB')):mage.channel?.kind==='beam'?.45:mage.cast?(mage.cast.kind==='bolt'?.65:.45):1);}
function mageMoveFactor(){return (mage.moveFactor??mageMoveTarget())*(mage.onIce?1.25:1);} // onIce: Frost Highway talent
function easeMageMove(dt){const t=mageMoveTarget(),f=mage.moveFactor??t;mage.moveFactor=f+(t-f)*(1-Math.exp(-dt*(t<f?12:5)));}
function walkSpeed(){if(classId==='mage')return (warrior?.cast&&['rush','charge'].includes(warrior.cast.kind)?0:WORLD.speed)*Math.min(1.4,(survival.weaponPassives?.move??1)*(1+(survival.buffStats?.move??0)))*(1-(survival.fieldSlow??0))*mageMoveFactor();return (warrior?.cast&&['rush','charge'].includes(warrior.cast.kind)?0:WORLD.speed)*Math.min(1.4,(survival.weaponPassives?.move??1)*(1+(survival.buffStats?.move??0)))*(1-(survival.fieldSlow??0))*touchSlow((warrior?.cast?.kind==='bladestorm'?.6:1)*(survival.cast?(survival.cast.kind==='storm'?.6:.25):combat.attack?.kind==='heavy' ? .2 : combat.attack ? .35 : 1))*(survival.warriorMove??1)*(combat.lunge?0:1)*(ranger?rangerMove(ranger,survival):1);}
function visible(x,y,r=350){return Math.abs(x-camera.x)<width/(2*worldZoom())+r&&Math.abs(y-camera.y)<height/(2*worldZoom())+r;}
// Charge: wind-up frames 0-4, then the rush loops 5-14; Throw/Pound play once over the special's duration.
// Butcher specials -> clips; each clip's impact/release frame (I) lines up with the special's windup.
const BUTCHER_SP={crossChop:'Throw',boomerang:'Throw',hook:'Hook',fissures:'Slam',mark:'Slam',storm:'Spin'},BUTCHER_HIT={crossChop:6,boomerang:6,hook:5,fissures:7.5,mark:7.5};
function butcherSpecialFrame(sp){if(sp.kind==='storm')return sp.elapsed<sp.windup?0:Math.floor((sp.elapsed-sp.windup)*9)%15;const I=BUTCHER_HIT[sp.kind]??6,w=sp.kind==='fissures'?.55:sp.kind==='mark'?.45:sp.windup;return Math.min(14,Math.floor(sp.elapsed<w?sp.elapsed/w*I:I+(sp.elapsed-w)/Math.max(.2,sp.duration-w)*(15-I)));}
function golemSpecialFrame(sp){if(sp.kind==='charge')return sp.elapsed<sp.windup?Math.min(4,Math.floor(sp.elapsed/sp.windup*5)):5+Math.floor((sp.elapsed-sp.windup)*24)%10;return Math.min(14,Math.floor(sp.elapsed/sp.duration*15));}
// Oct 16 (user: "crisp, clean"): the golem Ravager draws native-resolution strips (352px frames, cropped per animation,
// one strip per animation and rendered facing) that are lazy-loaded and LRU-capped; SW/W/NW mirror SE/E/NE. A small
// 96px proxy sheet covers the frame or two while a strip loads.
const GOLEM_ROW=[[0,0,false],[1,1,false],[2,2,false],[1,1,true],[0,0,true],[7,4,true],[6,3,false],[7,4,false]],golemStrips=new Map();
function golemStrip(anim,row,model='golem'){const k=model+'/'+anim+'_'+row;let e=golemStrips.get(k);
  if(!e){e={img:null};golemStrips.set(k,e);loadSprite('assets/'+k+'.webp?v=fx-260').then(img=>{e.img=img;}).catch(()=>{e.failed=true;});
    if(golemStrips.size>40)for(const [kk,v] of golemStrips){if(kk!==k&&v.img){v.img.close?.();golemStrips.delete(kk);break;}}}
  else{golemStrips.delete(k);golemStrips.set(k,e);}return e.img;}
// Oct 17: HD models for the Obsidian Colossus (colossus1/2/3 = phase looks; Break plays on the outgoing look),
// Dune Wyrm (wyrm1 armoured incl. Shed, wyrm2 exposed) and Hollow Prophet. hdLook() picks the model, clip and frame;
// each special's clip is time-mapped so its impact/release frame lands on the gameplay hit.
const span=(e,w,a,b)=>a+Math.min(1,Math.max(0,e/Math.max(.01,w)))*(b-a);
const HD_SPECIAL={
 // Oct 19: Crimson Tyrant clips (Colossus rig): Break = armour shed, Run = Hellfire Charge, Throw = chains, Slam = walls,
 // Stomp = Molten Nova, Jump = leap, Overload = cataclysm / spiral / rain / Last Light.
 final(sp,t){const e=sp.elapsed;
  if(sp.kind==='shed'){const b=sp.burst??1.25;return ['Break',e<b?span(e,b,0,9):span(e-b,(sp.duration??2.4)-b,9,14)];}
  if(sp.kind==='charge')return sp.cur&&!sp.cur.done&&sp.wait<=0?['Run',Math.floor(e*30)%15]:['Jump',span(sp.wait>0?.38-sp.wait:0,.38,0,4)];
  if(sp.kind==='chains')return ['Throw',e<.45?span(e,.45,0,9):span(e-.45,1.2,9,14)];
  if(sp.kind==='walls')return ['Slam',e<.55?span(e,.55,0,8):span(e-.55,.8,8,14)];
  if(sp.kind==='nova')return ['Stomp',span(e%.6,.6,0,14)];
  if(sp.kind==='leap')return ['Jump',e<(sp.air??.95)?span(e,sp.air??.95,4,10):span(e-(sp.air??.95),.4,10,14)];
  if(sp.kind==='cataclysm')return ['Overload',e<(sp.strike??1)?span(e,sp.strike??1,0,7):span(e-(sp.strike??1),.8,7,11)];
  if(sp.kind==='meteor'||sp.kind==='spiral'||sp.kind==='lastlight')return ['Overload',e<.5?span(e,.5,0,6):6+Math.floor(e*10)%5];
  return null;},
 colossus(sp,t){const e=sp.elapsed,ph=t.stage??0;
  if(sp.kind==='shed')return ['Break',e<COL.shed.burst?span(e,COL.shed.burst,0,9):span(e-COL.shed.burst,COL.shed.end-COL.shed.burst,9,14)];
  if(sp.kind==='slam'){const st=sp.steps?.[sp.i],G=COL.slam,k=sp.t??0;if(st?.k==='ground'||!st)return ['Stomp',!st?0:sp.st==='ground'?span(k,G.warn,0,7):span(k,G.gap,7,14)];}  /* Oct 19: Ground Slam; its Jump Slam uses the Pursuit finisher frames below */
  if(sp.kind==='pursuit'||sp.kind==='slam'){const st=sp.steps?.[sp.i],P=COL.punch[ph],F=COL.fin,k=sp.t??0;if(!st)return null;
   if(st.k==='punch')return [st.side?'PunchL':'PunchR',sp.st==='aim'?span(k,P.aim,0,5):sp.st==='lunge'?span(k,P.lunge,5,9):span(k,P.gap,9,14)];
   return ['Jump',sp.st==='pause'?span(k,F.pause,0,2):sp.st==='aim'?span(k,F.aim,2,4.9):sp.st==='lunge'?span(k,F.jump,5,10):span(k,F.lodge[ph],11,14)];}
  if(sp.kind==='hurl'){const h=sp.rocks?.at(-1);if(!h)return ['Throw',0];return ['Throw',h.age<h.lift?span(h.age,h.lift,0,8):span(h.age-h.lift,.5,8,14)];}
  if(sp.kind==='fault')return ['Slam',e<COL.fault.warn?span(e,COL.fault.warn,0,8):span(e-COL.fault.warn,.8,8,14)];
  if(sp.kind==='stomp')return ['Stomp',e<COL.stomp.warn?span(e,COL.stomp.warn,0,7):span(e-COL.stomp.warn,.8,7,14)];
  if(sp.kind==='overload'){const c=sp.charge;if(e<c)return ['Overload',span(e,c,0,7)];const k=e-c;return ['Overload',k<.5?span(k,.5,7,11):11+Math.floor(k*3)%4];}
  return null;},
 wyrm(sp,t){const e=sp.elapsed;
  if(sp.kind==='shed')return ['Shed',e<WY.shed.pop?span(e,WY.shed.pop,0,7):e<WY.shed.rise?span(e-WY.shed.pop,WY.shed.rise-WY.shed.pop,7,11):span(e-WY.shed.rise,WY.shed.end-WY.shed.rise,11,14)];
  if(sp.kind==='breath'){const w=WY.breath.windup;return ['Breath',e<w?span(e,w,0,6):sp.on?10+Math.floor(e*12)%5:span(e-w,.8,6,14)];}
  if(sp.kind==='burrow'){if(sp.st==='dig')return ['Burrow',span(sp.t,WY.burrow.dig,0,14)];if(sp.st==='surface'||sp.st==='recover')return ['Emerge',span(sp.t,.7,0,14)];return null;}
  if(sp.kind==='tail'){const T=WY.tail,k=sp.again?e-T.again:e;return ['Tail',k<T.windup?span(k,T.windup,0,7):span(k-T.windup,.6,7,14)];}
  if(sp.kind==='charge'){const w=WY.charge.windup;if(e<w)return ['Charge',span(e,w,0,4)];return sp.done?null:['Charge',5+Math.floor((e-w)*24)%10];}
  if(sp.kind==='claws'){const q=sp.arcs?.at(-1);if(!q)return ['ClawR',0];const k=e-q.born,w=q.at-q.born;return [q.side>0?'ClawR':'ClawL',k<w?span(k,w,0,7):span(k-w,.45,7,14)];}
  if(sp.kind==='spit'){const w=WY.spit.windup;return ['Spit',e<w?span(e,w,0,7):span(e-w,.6,7,14)];}
  return null;},
 prophet(sp){const e=sp.elapsed,w=sp.windup||.3,m={scythes:['Scythe',6],echo:['Cast',7],lances:['Cast',7],reposition:['Cast',7],cage:['Summon',7],apparitions:['Summon',7],repulse:['Thrust',9]}[sp.kind];if(!m)return null;
  return [m[0],e<w?span(e,w,0,m[1]):span(e-w,Math.max(.2,sp.duration-w),m[1],14)];}
};
function hdModelFor(t){if(t.bossKind==='final')return 'tyrant'+((t.special?.kind==='shed'?(t.phase??2)-1:(t.shed??0))+1);  /* Oct 19: Crimson Tyrant HD model, one look per armour stage */
 if(t.bossKind==='colossus')return 'colossus'+(t.special?.kind==='shed'?t.special.stage:(t.stage??0)+1);if(t.bossKind==='wyrm')return t.special?.kind==='shed'||!t.armorBroken?'wyrm1':'wyrm2';return t.bossKind==='prophet'?'prophet':null;}
function hdLook(t){let model=hdModelFor(t);if(!model||!manifest[model+'HD'])return null;let a=null,f=0;
  if(t.state==='dead'){a='Die1';f=t.death/.9*15;}
  else if(t.special&&t.role==='boss'){const r=HD_SPECIAL[t.bossKind]?.(t.special,t);if(r)[a,f]=r;}
  if(!a&&t.state!=='dead'&&t.bossKind==='final'&&t.swing){const w=t.swing;a=w.kind==='smash'?'Slam':(t.combo??0)%2?'PunchL':'PunchR';f=w.elapsed<w.windup?span(w.elapsed,w.windup,0,a==='Slam'?8:9):span(w.elapsed-w.windup,.28,a==='Slam'?8:9,14);}
  if(!a&&t.state!=='dead'&&t.swing?.kind==='cast'){a='Cast';f=span(t.swing.elapsed,t.swing.windup,0,7);}
  if(!a){a=t.hurt>0?'TakeDamage1':t.moving?'Run':'Idle';f=t.hurt>0?(t.hurtDuration-t.hurt)/t.hurtDuration*15:t.clock*(t.moving?18:10)%15;}
  if(!manifest[model+'HD'].anims[a])model=t.bossKind==='final'?'tyrant3':t.bossKind==='colossus'?'colossus3':t.bossKind==='wyrm'?'wyrm2':model;
  if(!manifest[model+'HD']?.anims[a])return null;return {model,anim:a,frame:Math.max(0,Math.min(14,Math.floor(f)))};}
// Oct 16: the Ashen Butcher uses the same HD-strip path (model 'butcher', assets/butcher/, manifest.butcherHD).
function drawGolem(t,anim,frame,proxy,model='golem'){
  const [fileRow,pi,mirror]=GOLEM_ROW[t.row??2],dw=128*t.scale,dx=t.x-dw/2,dy=t.y-96*t.scale,hd=manifest[model+'HD'],box=hd?.anims?.[anim],strip=box&&golemStrip(anim,fileRow,model);
  ctx.save();if(mirror){ctx.translate(t.x,0);ctx.scale(-1,1);ctx.translate(-t.x,0);}ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(strip){const k=dw/hd.frame;ctx.drawImage(strip,frame*box.w,0,box.w,box.h,dx+box.x*k,dy+box.y*k,box.w*k,box.h*k);}
  else if(proxy)ctx.drawImage(proxy,frame*96,pi*96,96,96,dx,dy,dw,dw);
  ctx.restore();
}
let chunkFrame=0,mapSig='',groundTiles=null;
function drawProp(p,ground=false){
  if(!p.key)return;const img=images.get(p.key);if(!img||!visible(p.x,p.y,Math.max(350,img.height*(p.scale??1))))return;
  const w=img.width*p.scale,h=img.height*p.scale;
  // Prepared map sprites carry an exact ground anchor in the manifest (Oct 15 open-desert map).
  const anchor=(PROP_BASES[p.key]||DECOR_BASES[p.key])?.anchor??manifest.props?.[p.key]?.anchor;
  const x=anchor?p.x-anchor[0]*p.scale:p.x-w/2;
  const y=anchor?p.y-anchor[1]*p.scale:ground?p.y-h/2:p.y-h+12;
  ctx.drawImage(!ground&&envTint?tintedSprite(img,envTint)??img:img,x,y,w,h);
}
/* Oct 18 (user): night/Blood Moon tint the environment only. Tall props use a cached multiply-tinted copy (alpha kept),
   rebuilt only when the quantised tint changes, at most 3 per frame (older copy or the plain sprite meanwhile). */
let envTint=null,tintBudget=0;const tintCache=new WeakMap();
function tintedSprite(img,tint){const h=tintCache.get(img);if(h?.tint===tint)return h.cv;if(tintBudget<=0)return h?.cv??null;tintBudget--;
  const cv=h?.cv??document.createElement('canvas');cv.width=img.width;cv.height=img.height;const g=cv.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='multiply';g.fillStyle=tint;g.fillRect(0,0,cv.width,cv.height);g.globalCompositeOperation='destination-in';g.drawImage(img,0,0);tintCache.set(img,{tint,cv});return cv;}
// Oct 17 (user): the Warrior is a live 3D model (hero-3d.js); the knight sprite sheets remain the fallback while it loads or without WebGL.
const KNIGHT_CLIPS=['Idle','Run','Melee','Melee2','Special1','MeleeRun','MeleeSpin','Pummel','Special2','CastSpell','ShieldBlockStart','ShieldBlockMid','Rolling','Die'];
function knightCell(img,frame,row,dx,dy,dw,dh,angle,over){const clip=over?.clip??KNIGHT_CLIPS.find(c=>images.get('knight-'+c)===img);if(clip&&drawHero(ctx,player,{model:'warrior',clip,frame:over?.frame??frame,row,angle,box:[dx,dy,dw,dh],weapon:warriorWeapon(over?.hidden),anchorFor:warrior}))return;drawCell(ctx,img,frame*128,row*128,128,dx,dy,dw,dh);}
/* Oct 18 (weapon models batch 2): the held Warrior weapon and its own LMB clip (build_warrior.py W_*); the clip's impact
   moment (tc) is remapped onto the strike's hit window so the blade lands when the hit does. Blades swing wide sideways arcs (user, Oct 18). */
const WARRIOR_WEAPON={sword:'longsword',greatsword:'greatsword',dual:'dual',axe:'axe',hammer:'warhammer',maul:'maul',greataxe:'greataxe',spearshield:'spearshield',runeblade:'runeblade',gauntlets:'gauntlets',katana:'katana',enchspear:'enchspear',standard:'standard',lance:'lance',chainaxe:'chainaxe',glaive:'glaive'};
/* Oct 18: new Warrior families borrow the closest existing W_* clips until they get their own. */
const WARRIOR_CLIP_STYLE={maul:'hammer',greataxe:'greatsword',glaive:'greatsword',enchspear:'greatsword',lance:'sword',spearshield:'sword',runeblade:'sword',katana:'sword',gauntlets:'dual',chainaxe:'axe',standard:'axe'};
function warriorWeapon(hidden){const w=combat.weapon;return {id:WARRIOR_WEAPON[w?.style??'sword'],rarity:w?.rarity,glow:RARITIES[w?.rarity]?.color,rune:combat.runeColor,hidden};}
function warriorAttackClip(attack){if(!attack||attack.kind==='heavy')return null;const d=attackDefinition(attack),st=WARRIOR_CLIP_STYLE[d.style]??d.style,i=(attack.index??0)%3,p=Math.min(1,attack.elapsed/d.duration);
  const clip=st==='greatsword'||st==='sword'?'W_'+(st==='sword'?'longsword':'greatsword')+'_'+i:st==='dual'?'W_dual':st==='axe'?'W_axe':st==='hammer'?'W_warhammer_'+i:null;if(!clip)return null;
  let t=p;if(st!=='dual'){const tc=st==='greatsword'||st==='sword'?[.45,.5,.55][i]:.45,h=Math.min(.9,Math.max(.1,d.hitStart??tc));t=p<h?p/h*tc:tc+(p-h)/(1-h)*(1-tc);}
  return {clip,frame:14*t,hidden:st==='axe'&&t>.46&&t<.92};}
function drawPlayer(){
  const attack=combat.attack;
  const dashing=classId==='mage'?mage.blinkTime>0:dash.remaining>0;
  if(classId==='mage'){drawMagePlayer();return;}
  if(classId==='ranger'){drawRangerPlayer();return;}
  if(warrior?.cast){const a=warrior.cast,img=images.get(a.sheet);if(img){ctx.save();ctx.filter=survival.hurt>0?'sepia(1) saturate(7) hue-rotate(315deg)':warriorBodyFilter(warrior);const frame=Math.min(14,(a.frameStart??0)+Math.floor(a.elapsed/a.duration*(15-(a.frameStart??0))));knightCell(img,a.spin?7:frame,a.row,player.x-76.8,player.y-115.2,153.6,153.6,a.spin?a.angle+a.elapsed*Math.PI*5:a.angle);ctx.restore();}return;}
  const cast=survival.cast;
  ctx.save();ctx.filter=survival.hurt>0&&!(survival.dead||survival.downed)?'sepia(1) saturate(7) hue-rotate(315deg) brightness(1.3)':warriorBodyFilter(warrior);
  if(cast?.kind==='storm'){
    // Hold the outward sword pose (Melee2 frame 7) and turn its eight views.
    // Rotating the flat image would tip the character over in screen space.
    const img=images.get('knight-Melee2'),angle=cast.angle+cast.elapsed*Math.PI*5;
    const row=((Math.round(angle/(Math.PI/4))%8)+8)%8,scale=1.2;
    knightCell(img,7,row,player.x-64*scale,player.y-96*scale,128*scale,128*scale,angle);
    ctx.restore();return;
  }
  const img=images.get((survival.dead||survival.downed)?'knight-Die':cast?{parry:'knight-ShieldBlockMid',slam:'knight-Special1',storm:'knight-MeleeSpin'}[cast.kind]:dashing?'knight-Rolling':attack?attackDefinition(attack).sheet:'knight-'+(player.moving?'Run':'Idle'));if(!img){ctx.restore();return;}
  const cell=128,frame=(survival.dead||survival.downed)?Math.min(14,Math.floor((survival.downed?Math.min(.9,survival.downedTime??0):survival.deathTime)/.9*15)):cast?(cast.kind==='storm'?Math.floor(cast.elapsed*22)%15:Math.min(14,Math.floor(cast.elapsed/(cast.kind==='slam'?.65:.35)*15))):dashing?dashFrame(dash):attack?attackFrame(attack):Math.floor(player.frame)%15,scale=1.2,row=cast?cast.row:dashing?dash.row:attack?attack.row:player.row;
  // Shared ground pivot is below the body, near source (64,96); stride extends
  // around it. This keeps foot collision centered under the character/shadow.
  knightCell(img,frame,row,player.x-cell*scale/2,player.y-96*scale,cell*scale,cell*scale,null,!(survival.dead||survival.downed)&&!cast&&!dashing?warriorAttackClip(attack):null);
  ctx.restore();if(attack?.kind==='heavy')drawCleaveFlair(attack);
}
function drawCleaveFlair(attack){
  // Cosmetic feedback follows the existing contact window; no new hit rules.
  const strike=attackDefinition(attack),progress=attack.elapsed/strike.duration;
  ctx.save();ctx.translate(player.x,player.y-28);ctx.globalCompositeOperation='lighter';
  if(progress<strike.hitStart){
    const charge=clamp(progress/strike.hitStart,0,1);
    const x=Math.cos(attack.angle)*19,y=Math.sin(attack.angle)*12;
    const glow=ctx.createRadialGradient(x,y,1,x,y,16+charge*17);
    glow.addColorStop(0,`rgba(255,237,183,${.12+charge*.35})`);glow.addColorStop(.4,`rgba(230,171,65,${charge*.16})`);glow.addColorStop(1,'rgba(230,171,65,0)');
    ctx.fillStyle=glow;ctx.fillRect(x-36,y-36,72,72);
    ctx.strokeStyle=`rgba(255,220,139,${.2+charge*.45})`;ctx.lineWidth=1.5;
    for(let i=0;i<3;i++){
      const theta=attack.angle-Math.PI*.6+i*Math.PI*.6+charge*.6,r=27-charge*13;
      ctx.beginPath();ctx.moveTo(x+Math.cos(theta)*r,y+Math.sin(theta)*r*.65);ctx.lineTo(x+Math.cos(theta)*(r-5),y+Math.sin(theta)*(r-5)*.65);ctx.stroke();
    }
  }else{
    const sweep=clamp((progress-strike.hitStart)/(strike.hitEnd-strike.hitStart),0,1);
    const opacity=progress<=strike.hitEnd?1:clamp(1-(progress-strike.hitEnd)/.24,0,1);
    const head=attack.angle-strike.halfArc+sweep*strike.halfArc*2;
    const tail=Math.max(attack.angle-strike.halfArc,head-1.15);
    const radius=strike.reach*(.82+.18*sweep);
    const point=(theta,r)=>{const reach=r/Math.hypot(Math.cos(theta),Math.sin(theta)/VERTICAL_REACH_SCALE);return {x:Math.cos(theta)*reach,y:Math.sin(theta)*reach};};
    const tip=point(head,radius),start=point(tail,radius);
    const glow=ctx.createLinearGradient(start.x,start.y,tip.x,tip.y);
    glow.addColorStop(0,'rgba(235,151,46,0)');glow.addColorStop(.4,`rgba(242,190,83,${opacity*.55})`);glow.addColorStop(1,`rgba(255,246,207,${opacity*.95})`);
    ctx.fillStyle=glow;ctx.beginPath();
    for(let i=0;i<=28;i++){const p=point(tail+(head-tail)*i/28,radius);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}
    for(let i=28;i>=0;i--){const theta=tail+(head-tail)*i/28,p=point(theta,radius*(.8+.1*(1-i/28)));ctx.lineTo(p.x,p.y);}
    ctx.closePath();ctx.fill();
    ctx.shadowColor='#ffd588';ctx.shadowBlur=gfx.shadows?13:0;ctx.strokeStyle=`rgba(255,242,197,${opacity*.9})`;ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<=28;i++){const p=point(tail+(head-tail)*i/28,radius);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();
    ctx.shadowBlur=gfx.shadows?0:0;ctx.strokeStyle=`rgba(255,221,142,${opacity*.8})`;ctx.lineWidth=1.5;
    for(let i=0;i<5;i++){const theta=head+.5+i*.45,r=5+(i%3)*3;ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(tip.x+Math.cos(theta)*r,tip.y+Math.sin(theta)*r*.65);ctx.stroke();}
  }
  ctx.restore();
}
/* Oct 19 audit (user: bosses not smooth): bosses turn through the 8 facings at a limited rate instead of snapping every frame (no flicker when you circle them). Display only; the simulation row is untouched. */function drawDemon(t){if((t.role==='boss'||t.role==='bossClone')&&t.state==='alive'&&Number.isFinite(t.row)){const want=t.row*Math.PI/4;if(t._fa==null||!Number.isFinite(t._fa))t._fa=want;else{const dt=Math.min(.1,Math.max(0,time-(t._ft??time))),d=Math.atan2(Math.sin(want-t._fa),Math.cos(want-t._fa)),step=12*dt;t._fa+=Math.abs(d)<=step?d:Math.sign(d)*step;}t._ft=time;const r=t.row;t.row=((Math.round(t._fa/(Math.PI/4))%8)+8)%8;try{drawDemonInner(t);}finally{t.row=r;}return;}drawDemonInner(t);}
function drawDemonInner(t){if(t.role==='anchor'){drawWorldAnchor(ctx,t,images,manifest,time);return;}if(t.hidden)return;
  if(t.state==='dead'&&t.death>2.8)return;
  if(t.emerge>0){
    ctx.save();ctx.strokeStyle='#f1ce89';ctx.fillStyle='#59402b55';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(t.x,t.y,24+Math.sin(t.emerge*24)*3,15,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+t.clock*3;ctx.fillStyle='#e8c282';ctx.fillRect(t.x+Math.cos(a)*21,t.y+Math.sin(a)*12-5,3,3);}ctx.restore();return;
  }
  if(t.role==='boss'&&t.state!=='dead'&&!t.sleeping)drawBossFx(ctx,t,time);if(t.role==='leader'&&t.modifier&&t.state!=='dead')drawEliteBack(ctx,t,time);else if(t.warded&&t.role!=='leader')drawWardLink(ctx,t,time);else if(t.role==='leader'){ctx.save();ctx.strokeStyle=t.eliteColor??'#cba6ff';ctx.lineWidth=2;ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(t.x,t.y,40,23,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  const death=t.state==='dead',prefix=t.bossSkin?t.bossSkin+'-':t.role==='boss'?'beast-':(t.skin??'imp')+'-';const SP=!death&&t.special?(t.bossSkin==='golem'?{boulders:'Throw',charge:'Charge',rings:'Pound'}:t.bossSkin==='butcher'?BUTCHER_SP:{})[t.special.kind]:null;const key=prefix+(SP??(death?'Die1':t.hurt>0?'TakeDamage1':t.swing||t.rangedCast||t.poundT!=null?'Attack1':t.moving?'Run':'Idle'));
  const img=enemySheet(key,t);if(!img&&!hdModelFor(t))return;  // Oct 17 fix: HD bosses have no Attack1 sheet; the cast pose used to hide the Prophet and every clone
  const frame=SP?(t.bossSkin==='butcher'?butcherSpecialFrame(t.special):golemSpecialFrame(t.special)):death?Math.min(14,Math.floor(t.death/.75*15)):t.hurt>0?Math.min(14,Math.floor((t.hurtDuration-t.hurt)/t.hurtDuration*15)):t.poundT!=null?Math.min(14,Math.floor(t.poundT/(t.pound.warning+.35)*15)):t.rangedCast?Math.min(14,Math.floor(t.rangedCast.elapsed/castTime(t)*15)):t.swing?Math.min(14,Math.floor(t.swing.elapsed/(t.swing.windup+.35)*15)):Math.floor(t.clock*(t.moving?22:12))%15;
  ctx.save();if(t.lift||t.special?.kind==='shed'){const jig=t.special?.kind==='shed'&&!t.special.fired?Math.sin(time*70)*3*Math.min(1,t.special.elapsed):0;ctx.translate(jig,-(t.lift??0));}  // Oct 17: Colossus jump height / armour-break shake
  if(death)ctx.globalAlpha=clamp((2.8-t.death)/1.1,0,1);else if(t.hurt>t.hurtDuration*.65)ctx.filter='brightness(1.7)';else if(t.freeze>0||t.mageChill>0)ctx.filter='sepia(.7) saturate(2) hue-rotate(150deg) brightness(1.2)';else if(t.warriorWeaken>0)ctx.filter='sepia(.6) saturate(2.6) hue-rotate(225deg) brightness(1.12)';else if(t.role==='leader')ctx.filter=t.modifier?'none':eliteTint(t);else if(t.timeStopped)ctx.filter='grayscale(1) brightness(.75)';else if(t.slow>0)ctx.filter='hue-rotate(160deg)';else if(t.enraged&&!t.tint)ctx.filter='sepia(.8) saturate(3) hue-rotate(315deg)';else if(t.tint&&!(hdModelFor(t)&&manifest[hdModelFor(t)+'HD']))ctx.filter=t.tint;
  const sprite=t.role==='leader'?eliteSheet(img,t,frame*128,t.row*128,128):img;const HDL=hdLook(t);if(HDL){const px=images.get(HDL.model+'-'+HDL.anim)??images.get(HDL.model+'-Idle');if(px||golemStrips.get(HDL.model+'/'+HDL.anim+'_'+GOLEM_ROW[t.row??2][0])?.img)drawGolem(t,HDL.anim,HDL.frame,px,HDL.model);}  /* Oct 19: lazy proxies; never vanish while a clip's proxy is still loading */else if(t.bossSkin==='golem'||t.bossSkin==='butcher')drawGolem(t,key.slice(t.bossSkin.length+1),frame,img,t.bossSkin);else if(t.role==='boss'||t.role==='bossClone'){const cs=manifest.sheets[key]?.cellWidth??128;drawCellHD(ctx,img,frame*cs,t.row*cs,cs,t.x-128*t.scale/2,t.y-96*t.scale,128*t.scale,128*t.scale);}else drawCell(ctx,sprite,sprite===img?frame*128:0,sprite===img?t.row*128:0,128,t.x-128*t.scale/2,t.y-96*t.scale,128*t.scale,128*t.scale);ctx.restore();if(t.role==='leader'&&t.modifier&&!death)drawEliteFront(ctx,t,time);if(!death)drawStatusIcons(ctx,t,time);
  if(t.barrier>0)drawEliteShield(ctx,t,time);
  if(!death){
    const identity=enemyIdentity(t),hdI=manifest[hdModelFor(t)+'HD'],top=hdI?t.y-(96-hdI.anims.Idle.y*128/hdI.frame)*t.scale-8:t.y-(t.bossSkin==='butcher'?66:t.skin?.startsWith('demon-')?78:76)*(t.scale??1.25),width=t.role==='leader'?88:t.specialKind==='rift'?76:68;
    ctx.fillStyle='#19201be8';ctx.fillRect(t.x-width/2,top,width,6);ctx.fillStyle=t.hurt>0?'#ffcc88':t.role==='leader'?'#c391ee':t.specialKind==='rift'?'#e8a058':'#ad4937';ctx.fillRect(t.x-width/2+1,top+1,(width-2)*t.hp/t.maxHp,4);if(t.armorMax&&t.armorHp>0){ctx.fillStyle='#e8892a';ctx.fillRect(t.x-width/2+1,top+1,(width-2)*t.armorHp/t.armorMax,4);}
    if(identity.name){ctx.save();ctx.textAlign='center';ctx.font=(identity.bold?'bold 13px':'10px')+' Inter, sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#251e27ee';ctx.fillStyle=identity.color;ctx.strokeText(identity.name,t.x,top-7);ctx.fillText(identity.name,t.x,top-7);ctx.restore();}
    // Oct 16 (user): every boss in its enraged phase says so above its head in bold (Butcher/Prophet/Wyrm/Ravager below 50%,
    // the Colossus in its last stage, the Tyrant in its fury phase).
    if(t.role==='boss'&&(t.phase2||t.bloodrage||(t.bossKind==='colossus'&&t.stage>=2)||(t.bossKind==='final'&&(t.phase??1)>=3))){const k=1+.06*Math.sin(time*9);ctx.save();ctx.translate(t.x,top-(identity.name?30:14));ctx.scale(k,k);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 22px Cinzel, Georgia, serif';ctx.lineJoin='round';ctx.lineWidth=6;ctx.strokeStyle='#1a0404';ctx.strokeText('ENRAGED',0,0);ctx.shadowColor='#ff2a1a';ctx.shadowBlur=12;ctx.fillStyle='#ff3a2a';ctx.fillText('ENRAGED',0,0);ctx.restore();}
  }
}
function drawAbilityEffects(){
  for(const e of combat.targets)if(e.swing&&!e.swing.fired){
    const a=e.swing,progress=clamp(a.elapsed/a.windup,0,1);ctx.save();ctx.translate(e.x,e.y);ctx.scale(1,.65);
    ctx.fillStyle=`rgba(153,38,24,${.12+progress*.2})`;if(e.role==='boss'){ctx.save();ctx.scale(1,1/.65);ctx.fillStyle='#ffe7b3';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(a.kind==='smash'?'DODGE · SMASH':'PARRY · SWEEP',0,-38);ctx.restore();}ctx.strokeStyle='#e0784b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,a.reach,a.kind==='smash'?0:a.angle-1.05,a.kind==='smash'?Math.PI*2:a.angle+1.05);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  for(const r of rings){
    const p=1-r.life/r.max;ctx.save();ctx.translate(r.x,r.y);ctx.scale(1,.65);ctx.globalAlpha=1-p;
    if(r.type==='slam'){
      drawGroundRumble(p);
      if(showPackFX)drawPackEffect('fx-slam-dust',(r.max-r.life)/.7,0,0,230,1,.85);
      if(showPackFX){const img=images.get('fx-slam-shockwave'),entry=manifest.sheets['fx-slam-shockwave'];
        const elapsed=r.max-r.life,duration=.62;
        if(img&&elapsed<duration){const frame=Math.min(entry.cols-1,Math.floor(elapsed/duration*entry.cols));ctx.globalAlpha=.82;ctx.drawImage(img,frame*entry.cellWidth,0,entry.cellWidth,entry.cellHeight,-165,-165,330,330);}
      }
    }
    else{ctx.strokeStyle=r.type==='bossRing'?'#d8693d':'#a5f4f0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,35+p*65,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
  if(classId!=='sword')return;
  if(warrior?.cast){const a=warrior.cast,img=images.get(a.sheet);if(img){ctx.save();ctx.filter=survival.hurt>0?'sepia(1) saturate(7) hue-rotate(315deg)':warriorBodyFilter(warrior);const frame=Math.min(14,(a.frameStart??0)+Math.floor(a.elapsed/a.duration*(15-(a.frameStart??0))));knightCell(img,a.spin?7:frame,a.row,player.x-76.8,player.y-115.2,153.6,153.6,a.spin?a.angle+a.elapsed*Math.PI*5:a.angle);ctx.restore();}return;}
  const cast=survival.cast;if(!cast)return;ctx.save();ctx.translate(player.x,player.y-18);ctx.scale(1,.65);
  if(cast.kind==='parry'){ctx.strokeStyle='#a5f4f0';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,42,cast.angle-1.25,cast.angle+1.25);ctx.stroke();}
  ctx.restore();
}
function drawPackEffect(key,progress,x,y,size,projection=1,opacity=1){
  if(progress<0||progress>=1)return;
  const img=images.get(key),s=manifest.sheets[key];if(!img||!s)return;
  const frame=Math.min(s.cols-1,Math.floor(progress*s.cols));ctx.save();ctx.globalAlpha=opacity;
  ctx.drawImage(img,frame*s.cellWidth,0,s.cellWidth,s.cellHeight,x-size/2,y-size*projection/2,size,size*projection);ctx.restore();
}
function drawParryPack(){
  if(!showPackFX)return;
  if(classId!=='sword')return;
  if(warrior?.cast){const a=warrior.cast,img=images.get(a.sheet);if(img){ctx.save();ctx.filter=survival.hurt>0?'sepia(1) saturate(7) hue-rotate(315deg)':warriorBodyFilter(warrior);const frame=Math.min(14,(a.frameStart??0)+Math.floor(a.elapsed/a.duration*(15-(a.frameStart??0))));knightCell(img,a.spin?7:frame,a.row,player.x-76.8,player.y-115.2,153.6,153.6,a.spin?a.angle+a.elapsed*Math.PI*5:a.angle);ctx.restore();}return;}
  const cast=survival.cast;
  if(cast?.kind==='parry'){
    const x=player.x+Math.cos(cast.angle)*22,y=player.y-48+Math.sin(cast.angle)*14;
    drawPackEffect('fx-parry-shield',cast.elapsed/.35,x,y,90,1,.85);
  }
  for(const r of rings)if(r.type==='parry')drawPackEffect('fx-parry-spark',(r.max-r.life)/.32,r.x,r.y-45,135,1,1);
}
const SAND_COLORS=['#60452f','#806042','#9d784c','#bd9561','#d7b680','#ead1a2'];
function drawGroundRumble(progress){
  // Expanding dust fronts, rough ripples, cracks and briefly lifted pebbles.
  for(let j=0;j<3;j++){
    const p=clamp(progress-j*.09,0,1);if(p<=0)continue;const radius=22+p*155;
    ctx.strokeStyle=SAND_COLORS[j+1];ctx.lineWidth=12*(1-p)+2;ctx.globalAlpha=(1-progress)*.65;
    ctx.beginPath();for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,r=radius+Math.sin(a*13+j)*3+Math.sin(a*23)*2;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.stroke();
  }
  ctx.globalAlpha=(1-progress)*.7;ctx.strokeStyle='#6b5034';ctx.lineWidth=1.5;
  for(let i=0;i<16;i++){const a=i*2.399,length=35+((i*29)%95)*Math.min(1,progress*5);ctx.beginPath();ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18);ctx.lineTo(Math.cos(a+.06)*length*.6,Math.sin(a+.06)*length*.6);ctx.lineTo(Math.cos(a-.04)*length,Math.sin(a-.04)*length);ctx.stroke();}
  for(let i=0;i<44;i++){const a=i*2.399,r=25+progress*(75+(i*17)%100),lift=Math.sin(progress*Math.PI)*(8+i%9);ctx.globalAlpha=(1-progress)*.65;ctx.fillStyle=SAND_COLORS[i%6];ctx.beginPath();ctx.ellipse(Math.cos(a)*r,Math.sin(a)*r-lift,3+i%4,2+i%3,a,0,Math.PI*2);ctx.fill();}
}
function drawSandStorm(front){
  if(classId!=='sword')return;
  if(warrior?.cast){const a=warrior.cast,img=images.get(a.sheet);if(img){ctx.save();ctx.filter=survival.hurt>0?'sepia(1) saturate(7) hue-rotate(315deg)':warriorBodyFilter(warrior);const frame=Math.min(14,(a.frameStart??0)+Math.floor(a.elapsed/a.duration*(15-(a.frameStart??0))));knightCell(img,a.spin?7:frame,a.row,player.x-76.8,player.y-115.2,153.6,153.6,a.spin?a.angle+a.elapsed*Math.PI*5:a.angle);ctx.restore();}return;}
  const cast=survival.cast;if(cast?.kind!=='storm')return;
  const strength=Math.min(1,cast.elapsed/.18,(3-cast.elapsed)/.3);
  ctx.save();ctx.translate(player.x,player.y-12);ctx.scale(1,.65);
  if(showPackFX){ctx.save();ctx.beginPath();ctx.rect(-180,front?0:-180,360,180);ctx.clip();drawPackEffect('fx-storm-wind',(cast.elapsed%1.1)/1.1,0,0,330,1,strength*.85);ctx.restore();}
  // Back and front halves surround the actor while leaving the center readable.
  for(let i=0;i<24;i++){
    const a=cast.elapsed*(3.8+(i%3)*.5)+i*2.399,r=83+(i*19)%65,y=Math.sin(a)*r;
    if((y>=0)!==front)continue;
    ctx.save();ctx.translate(Math.cos(a)*r,y-12-(i%4)*5);ctx.rotate(a+.4);
    const g=ctx.createRadialGradient(0,0,2,0,0,27);g.addColorStop(0,SAND_COLORS[i%6]+'a0');g.addColorStop(1,SAND_COLORS[i%6]+'00');ctx.globalAlpha=strength*.9;ctx.fillStyle=g;ctx.scale(1.6,.55);ctx.fillRect(-28,-28,56,56);ctx.restore();
  }
  for(let i=0;i<100;i++){
    const a=cast.elapsed*(4.5+(i%5)*.3)+i*2.399,r=65+(i*37)%90,y=Math.sin(a)*r;
    if((y>=0)!==front)continue;ctx.globalAlpha=strength*(.5+(i%4)*.14);ctx.strokeStyle=SAND_COLORS[i%6];ctx.lineWidth=1.5+i%3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,y-(i%7)*4);ctx.lineTo(Math.cos(a-.09)*r,Math.sin(a-.09)*r-(i%7)*4);ctx.stroke();
  }
  ctx.restore();
}
function drawGold(){const img=images.get('pickup-gold'),a=manifest.sheets['pickup-gold'];if(!img)return;for(const d of rewards.drops){if(!visible(d.x,d.y))continue;const frame=Math.floor(d.clock*12)%a.cols;ctx.save();ctx.shadowColor='#ffe9a1';ctx.shadowBlur=gfx.shadows?10:0;ctx.drawImage(img,frame*a.cellWidth,0,a.cellWidth,a.cellHeight,d.x-14,d.y-22+Math.sin(d.clock*4)*3,28,28);ctx.restore();}}
function drawWeaponLoot(){for(const d of weaponLoot){const color=RARITIES[d.weapon.rarity].color;drawLootBeam(ctx,d,color,height/worldZoom());ctx.save();ctx.translate(d.x,d.y-12+Math.sin(d.clock*3)*3);ctx.rotate(-.6);ctx.fillStyle=color;ctx.fillRect(-2,-20,4,30);ctx.fillRect(-9,8,18,3);ctx.fillStyle='#58432d';ctx.fillRect(-2,11,4,9);ctx.restore();}}
function render(){smoothRemotes();
  envTint=worldTint(paused&&!WELCOME_EL.hidden?LOBBY_NIGHT:survival.clock);tintBudget=3;
  const fxHW=width/(2*worldZoom())+80,fxHH=height/(2*worldZoom())+80;setFxView({x0:camera.x-fxHW,y0:camera.y-fxHH,x1:camera.x+fxHW,y1:camera.y+fxHH});
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#b09868';ctx.fillRect(0,0,width,height);
  const shake=mage?mageShake(mage):warrior?mageShake(warrior):ranger?mageShake(ranger):{x:0,y:0};ctx.save();ctx.translate(width/2+shake.x,height/2+shake.y);ctx.scale(worldZoom(),worldZoom());ctx.translate(-camera.x,-camera.y);
  // Small fixed texture marks avoid a sterile flat ground without tiling seams.
  // Oct 16: pre-rendered ground tiles when present and in sync with the map; live ground rendering otherwise.
  const groundView=(()=>{const hw=width/(2*worldZoom())+40,hh=height/(2*worldZoom())+40;return {x0:camera.x-hw,y0:camera.y-hh,x1:camera.x+hw,y1:camera.y+hh};})(),tiled=!!groundTiles&&groundTiles.ready(groundView);
  if(groundTiles)groundTiles.draw(ctx,groundView);if(tiled)drawDesertGround(ctx,scene,groundView,time,'anim');else drawDesertGround(ctx,scene,groundView,time);
  for(const p of scene.ground)drawProp(p,true);rp('ground');
  if(!tiled){const hw=width/(2*worldZoom())+60,hh=height/(2*worldZoom())+60;drawStaticChunks(ctx,scene,images,k=>(PROP_BASES[k]||DECOR_BASES[k])?.anchor??manifest.props?.[k]?.anchor,{x0:camera.x-hw,y0:camera.y-hh,x1:camera.x+hw,y1:camera.y+hh},++chunkFrame);}rp('propShadows');
  drawOasisGround(ctx,oasis,time);if(ambienceOn())drawAmbienceGround(ctx,ambience);rp('oasis+ambienceGround');drawWorldTint(ctx,width,height,envTint,dpr);
  forKits(kitGround);kitGround();drawButcherVfx(ctx,{c:combat,time},'ground');drawTitanGround(ctx,combat,time);drawProphetGround(ctx,combat,time);drawBossLights(ctx,combat,time);drawTitanVfx(ctx,{c:combat,time},'ground');drawProphetVfx(ctx,{c:combat,time},'ground');ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  drawForgeShield(ctx,forgeShield,time);rp('spellsGround+forge');
  // Passable low foliage is consistently below the actor. Tall solid scenery
  // still sorts by its ground pivot and can correctly occlude the actor.
  // (flat ground-layer props are baked into the static chunks drawn with the shadows)
  for(const a of arenas)if(visible(a.x,a.y,a.radius+(a.path?360:40)))drawArenaFloor(ctx,a,time);
  for(const e of worldEvents.events)if(visible(e.x,e.y)){drawWorldGround(ctx,e,images,manifest,time);drawTrialGround(ctx,e,time);}
  drawFinalBossFx(ctx,combat,time);drawOrbAura();
  drawEliteHazards(ctx,rewards,time,drawPackEffect);
  drawEnemyRanged(ctx,combat,drawPackEffect,time);rp('events+hazards');
  if(healing)drawHealing(ctx,healing,images.get('pickup-hotsauce'),visible);drawGroundXP(ctx,groundXP,images.get('pickup-pepper'),visible);drawGold();drawWeaponLoot();
  forKits(drawAbilityEffects);drawAbilityEffects();rp('loot+abilityFx');
  drawSandStorm(false);
  sandParticles.shadows(ctx);rp('sand');
  const trailImg=images.get(classId==='ranger'?'ranger-Rolling':'knight-Rolling');if(trailImg)for(const p of dashTrail){ctx.globalAlpha=p.life/.14*.18;const tk=128*(trailImg.cellScale||1);ctx.drawImage(trailImg,p.frame*tk,p.row*tk,tk,tk,p.x-76.8,p.y-115.2,153.6,153.6);}ctx.globalAlpha=1;
  if(ambienceOn())drawAmbienceUpper(ctx,ambience);
  rp('spellsUpper+ambience');
  // Safety net: no effect pass may leak alpha/blend/filter into the actors drawn next.
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  if(survival.barrier>0){ctx.save();ctx.strokeStyle=pathInfo(survival)?.color??'#bfe9ef';ctx.globalAlpha=.45;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(player.x,player.y-30,34,48,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  forKits(kitWeapons);kitWeapons();drawButcherCanvas(ctx,combat,time);drawButcherVfx(ctx,{c:combat,time},'upper');drawTitanCanvas(ctx,combat,time);drawTitanVfx(ctx,{c:combat,time},'upper');drawBossParticles(ctx);drawProphetCanvas(ctx,combat,time);drawProphetVfx(ctx,{c:combat,time},'upper');
  const ordered=[...scene.props,...wallProps(rewards)].filter(p=>p.layer!=='ground'&&visible(p.x,p.y,p.key?.startsWith('Pyramid')?1000:350));ordered.push(...worldEvents.events.filter(e=>e.active&&visible(e.x,e.y)).map(e=>({y:e.y,worldEvent:e})),{y:player.y,player:true},...party.players.filter(q=>!q.local&&visible(q.x,q.y)).map(q=>({y:q.y,ally:q})),...combat.targets.filter(t=>visible(t.x,t.y)).map(t=>({y:t.y,demon:t})),...sandParticles.items.map(p=>({y:p.y,sand:p})));ordered.sort((a,b)=>a.y-b.y);
  for(const p of ordered){if(p.worldEvent)drawWorldObject(ctx,p.worldEvent,images,manifest,time,player);else if(p.player){const grow=warrior?.wrathGrow??1;if(grow>1.001){ctx.save();ctx.translate(player.x,player.y);ctx.scale(grow,grow);ctx.translate(-player.x,-player.y);}drawPlayer();if(warrior&&classId!=='mage')drawWarriorFront(ctx,warrior);if(grow>1.001)ctx.restore();}else if(p.ally){if(p.ally.kit)withMember(p.ally,()=>atDrawPos(p.ally,kitBody));else drawAlly(p.ally);}else if(p.demon)drawDemon(p.demon);else if(p.sand)sandParticles.draw(ctx,p.sand);else drawProp(p);}
  /* Oct 18 (user: spells going under house): airborne spell effects draw after the depth-sorted houses and actors */ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';forKits(kitUpper);kitUpper();drawEliteSpellsUpper(ctx,rewards);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
  drawPartyOverlay();rp('actors');drawOasisEmbers(ctx,oasis,time);
  drawSandStorm(true);
  drawSunLight(ctx,width,height,time,dpr);rp('sunlight');
  drawForgeShield(ctx,forgeShield,time,true);
  for(const [i,n] of levelNotices.entries()){
    const t=n.elapsed,y=player.y-100-t*38-i*40;
    ctx.save();ctx.globalAlpha=Math.min(1,t/.35)*Math.min(1,(n.duration-t)/.6);ctx.textAlign='center';ctx.font='bold 30px Cinzel, Georgia, serif';ctx.lineWidth=5;ctx.strokeStyle='#2b2115';ctx.fillStyle='#ffe6a3';ctx.shadowColor='#ffd57a';ctx.shadowBlur=gfx.shadows?12:0;ctx.strokeText('LEVEL UP · '+n.level,player.x,y);ctx.fillText('LEVEL UP · '+n.level,player.x,y);ctx.restore();
  }
  drawParryPack();

  for(const p of particles){ctx.globalAlpha=clamp(p.life*4,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
  for(const n of numbers){ctx.globalAlpha=clamp(n.life*3,0,1);ctx.fillStyle=n.crit?'#ffd61f':n.reaction?'#ffd27a':n.heal?'#a5efbc':n.playerDamage?'#ff5148':'#fff3ce';ctx.strokeStyle=n.playerDamage?'#320d0a':n.crit?'#3a2400':'#332b1a';ctx.lineWidth=n.playerDamage||n.crit?5:3;ctx.font=n.playerDamage?'900 30px Nunito, sans-serif':n.crit?'900 27px Nunito, sans-serif':'900 19px Nunito, sans-serif';ctx.textAlign='center';ctx.strokeText(String(n.value),n.x,n.y);ctx.fillText(String(n.value),n.x,n.y);}ctx.globalAlpha=1;
  if(debug){
    for(const p of scene.props){
      if(!p.footprint||!visible(p.x,p.y))continue;
      ctx.strokeStyle='#9d2319';ctx.fillStyle='#9d231933';ctx.beginPath();
      p.footprint.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffe5a4';ctx.fillRect(p.x-2,p.y-2,4,4);
    }
    ctx.strokeStyle='#ddffe2';ctx.beginPath();ctx.arc(player.x,player.y,WORLD.playerRadius,0,Math.PI*2);ctx.stroke();
    for(const t of combat.targets){ctx.strokeStyle='#ed8368';ctx.beginPath();ctx.arc(t.x,t.y,t.radius,0,Math.PI*2);ctx.stroke();}
    if(combat.attack){
      const a=combat.attack,s=attackDefinition(a);ctx.strokeStyle='#ffeb8b';ctx.beginPath();ctx.moveTo(player.x,player.y);
      for(let i=0;i<=32;i++){
        const angle=a.angle-s.halfArc+2*s.halfArc*i/32;
        const reach=s.reach/Math.hypot(Math.cos(angle),Math.sin(angle)/VERTICAL_REACH_SCALE);
        ctx.lineTo(player.x+Math.cos(angle)*reach,player.y+Math.sin(angle)*reach);
      }
      ctx.closePath();ctx.stroke();
    }
    ctx.strokeStyle='#f8e8b3';ctx.lineWidth=2;ctx.strokeRect(0,0,WORLD.width,WORLD.height);
  }
  ctx.restore();setFxView(null);
  if(survival.hurt>0){ctx.fillStyle=`rgba(155,26,20,${survival.hurt*.65})`;ctx.fillRect(0,0,width,height);}
  if(showDust){
    ctx.save();
    for(let i=0;i<6;i++){
      const x=((i*397+time*18-camera.x*.16)%(width+500)+width+500)%(width+500)-250;
      const y=((i*233-camera.y*.15)%(height+200)+height+200)%(height+200)-100;
      const g=ctx.createRadialGradient(x,y,5,x,y,230);g.addColorStop(0,'rgba(239,224,184,.095)');g.addColorStop(1,'rgba(239,224,184,0)');ctx.fillStyle=g;ctx.fillRect(x-230,y-230,460,460);
    }
    ctx.restore();
  }
  const vignette=ctx.createRadialGradient(width/2,height/2,Math.min(width,height)*.25,width/2,height/2,Math.max(width,height)*.75);vignette.addColorStop(0,'#171e1300');vignette.addColorStop(1,'#1b21134a');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
}
let previousPerf=null,lastPerfStart=0;
// Oct 16 (mobile): a thrown frame no longer kills the loop; errors show on screen on touch devices / ?debug.
const errBox=(()=>{const el=document.createElement('div');el.id='err-box';el.hidden=true;document.body.append(el);const seen=new Set();
 return err=>{const msg=String(err?.message??err),where=(String(err?.stack??'').split('\n').find(l=>/\.js/.test(l))??'').replace(/^\s*(at\s*)?/,'').replace(/https?:\/\/[^/]+\//,'').slice(0,90);const k=msg+where;if(seen.has(k)||seen.size>4)return;seen.add(k);console.error(err);
  let online=false;try{online=clientRun;reportNetError(msg+(where?' @ '+where:''));}catch{}
  if(!(touch||/[?&]debug\b/.test(location.search)||online))return;const d=document.createElement('div');d.textContent=msg+(where?'  @ '+where:'');el.append(d);el.hidden=false;};})();
addEventListener('error',e=>errBox(e.error??e.message));addEventListener('unhandledrejection',e=>errBox(e.reason));
function loop(stamp){try{loopBody(stamp);}catch(err){loopErr=String(err?.stack??err).slice(0,500);errBox(err);try{ctx.restore();}catch{}requestAnimationFrame(loop);}}
/* Oct 19 audit: background warm-up for on-demand sheets: this hero's and teammates' fallback sheets, bosses within ~2400 px of the camera, and the timed Colossus/Tyrant a minute ahead. */function warmTick(){if(!manifest)return;const cls=new Set([classId]);for(const q of party?.players??[])if(q?.classId)cls.add(q.classId);for(const c of cls)images.warm(heroSheets(c));const clock=survival?.clock??0;for(const t of combat?.targets??[]){if(t.role!=='boss'||t.state!=='alive')continue;if(Math.hypot(t.x-camera.x,t.y-camera.y)<2400){images.warm(bossSheets(t));const m=hdModelFor(t)??(t.bossSkin==='butcher'||t.bossSkin==='golem'?t.bossSkin:null);if(m&&manifest[m+'HD']){const anims=manifest[m+'HD'].anims??{},fr=GOLEM_ROW[directionRow(player.x-t.x,player.y-t.y)]?.[0];for(const a of ['Idle','Run'])for(const r of [0,1,2,6,7])if(anims[a])golemStrip(a,r,m);if(fr!=null)for(const a in anims)golemStrip(a,fr,m);}/* Oct 19: every clip for the facing toward you, so attacks never start on the blurry proxy */}}if(clock>RUN_SOON_COLOSSUS)images.warm(Object.keys(manifest.sheets).filter(k=>/^colossus1-/.test(k)));if(survival.realm&&clock>survival.realm.at-60)images.warm(Object.keys(manifest.sheets).filter(k=>/^tyrant1-/.test(k)));}const RUN_SOON_COLOSSUS=28*60;
document.addEventListener('click',e=>{if(e.target?.closest?.('button,.fe-btn,[role=button]'))sound.play('ui-click');},true);
let loopFrames=0,loopErr=null;/* Oct 19 audit: debug-only AUTOPILOT for full-run balance measurement (veyrathDebug.autopilot({speed,revive})).
 A simple bot plays the local hero: kites the crowd at a class range, dodges telegraphs and shots, holds/releases LMB, casts RMB/Q/E/R,
 auto-picks cards; the simulation runs `speed` steps per frame. It records level/HP/kills/bosses every 10 s and deaths (revive keeps measuring). */
let AP=null;
function apTick(dt){const s=survival,c=combat;if(!AP||s.dead&&!AP.revive)return;AP.t+=dt;
 if(s.dead||s.downed){AP.deaths.push(Math.round(s.clock));s.dead=false;s.downed=false;s.hp=s.maxHp;s.recorded=true;$('gameover').hidden=true;}
 if(s.pendingPicks?.length||s.offer){try{autoPick(party.players[0]);}catch{}$('levelup-panel').hidden=true;}
 if(bossChoices?.pending?.length){try{const q=bossChoices.pending[0],o=bossOptions(bossChoices,s)[0];if(o)claimBossChoice(bossChoices,s,q.id,o.id);}catch{bossChoices.pending.shift();}}
 if(paused&&$('welcome').hidden){paused=false;$('menu').hidden=true;$('levelup-panel').hidden=true;$('reward-panel').hidden=true;$('world-panel').hidden=true;}
 const foes=c.targets.filter(e=>e.state==='alive'&&e.enemy!==false&&!e.pit&&e.role!=='anchor'&&!e.emerge&&Math.hypot(e.x-player.x,e.y-player.y)<1100);
 let near=null,nd=1e9;for(const e of foes){const d=Math.hypot(e.x-player.x,e.y-player.y)-(e.role==='boss'?30:0);if(d<nd){nd=d;near=e;}}
 const boss=foes.find(e=>e.role==='boss');const tgt=boss&&Math.hypot(boss.x-player.x,boss.y-player.y)<700?boss:near;
 const range=classId==='sword'?(tgt?.role==='boss'?150:85):tgt?.role==='boss'?330:260;let mx=0,my=0;
 for(const e of foes){const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,r=(e.radius??20)+(e.role==='boss'?140:60);if(d<r*2.2){const w=(r*2.2-d)/(r*2.2)*(e.role==='boss'?3:1);mx+=dx/d*w;my+=dy/d*w;}}
 if(tgt){const dx=tgt.x-player.x,dy=tgt.y-player.y,d=Math.hypot(dx,dy)||1;if(d>range+40){mx+=dx/d*1.2;my+=dy/d*1.2;}else if(d<range-40){mx-=dx/d*.8;my-=dy/d*.8;}mx+=-dy/d*.45*AP.side;my+=dx/d*.45*AP.side;}
 else{const dx=mapSpawn.x-player.x,dy=mapSpawn.y-player.y,d=Math.hypot(dx,dy)||1;if(d>500){mx+=dx/d;my+=dy/d;}}
 let danger=0;for(const h of c.hazards??[]){if(h.kind==='safezone'){const d=Math.hypot(player.x-h.x,(player.y-h.y)/.65);if(d>h.radius*.5){mx+=(h.x-player.x)/d*4;my+=(h.y-player.y)/d*4;}continue;}
  if(h.kind==='firering'&&h.r){const d=Math.hypot(player.x-h.x,(player.y-h.y)/.72);if(d>h.r-120){mx+=(h.x-player.x)/d*3;my+=(h.y-player.y)/d*3;}continue;}
  const rad=h.radius??(h.width?h.width/2:0);if(!rad)continue;if(h.kind==='lane'){const ca=Math.cos(h.angle),sa=Math.sin(h.angle),qx=player.x-h.x,qy=player.y-h.y,along=qx*ca+qy*sa,side=-qx*sa+qy*ca;if(along>-20&&along<h.len+20&&Math.abs(side)<h.width/2+40){mx+=-sa*Math.sign(side||1)*3;my+=ca*Math.sign(side||1)*3;danger++;}continue;}
  const d=Math.hypot(player.x-h.x,(player.y-h.y)/.65);if(d<rad+50&&h.age<(h.warning??0)+.2){mx+=(player.x-h.x)/(d||1)*3;my+=(player.y-h.y)/(d||1)*3;danger++;}}
 for(const b of c.enemyProjectiles??[]){const dx=player.x-b.x,dy=player.y-b.y,d=Math.hypot(dx,dy);if(d<140&&(b.dx*dx+b.dy*dy)>0){mx+=-b.dy*2;my+=b.dx*2;danger++;}}
 if(Math.random()<dt*.25)AP.side*=-1;
 const n=Math.hypot(mx,my);keys.stick=n>.05?{x:mx/n,y:my/n}:{x:0,y:0};
 if(tgt){const z=worldZoom(),lx=tgt.x+(tgt.vx??0)*.15,ly=tgt.y-30;pointer.active=true;pointer.x=(lx-camera.x)*z+width/2;pointer.y=(ly-camera.y)*z+height/2;}
 AP.lmb-=dt;if(tgt&&AP.lmb<=0){AP.lmb=classId==='ranger'?.9:.45;queueInput('lmbUp');queueInput('lmb');}if(!tgt&&AP.lmb<=0){AP.lmb=.5;queueInput('lmbUp');}
 AP.cast-=dt;if(tgt&&AP.cast<=0&&nd<700){AP.cast=.35;const k=['rmb','Q','E','R'][AP.ci++%4];if(k==='rmb'){queueInput('rmb');AP.rmbUp=.25;}else{queueInput(k);if(k==='E')AP.eUp=.3;}}
 if(AP.rmbUp>0&&(AP.rmbUp-=dt)<=0)queueInput('rmbUp');if(AP.eUp>0&&(AP.eUp-=dt)<=0)queueInput('Eup');
 AP.dashCd-=dt;if(danger>=2&&AP.dashCd<=0){AP.dashCd=1.2;queueInput('dash');}
 if(s.clock>=AP.nextLog){AP.nextLog+=10;const bosses=c.targets.filter(e=>e.role==='boss').map(e=>e.bossKind+':'+e.state+':'+Math.round(e.hp/e.maxHp*100));AP.log.push({t:Math.round(s.clock),lvl:s.level,hp:Math.round(s.hp),max:Math.round(s.maxHp),kills:c.kills,alive:c.targets.filter(e=>e.state==='alive').length,b:bosses.join(' ')});}
 for(const e of c.targets)if(e.role==='boss'&&e.state!=='alive'&&!AP.killed[e.id]){AP.killed[e.id]=e.bossKind+'@'+Math.round(s.clock);}
}
function loopBody(stamp){loopFrames++;if(loopFrames%30===1)try{warmTick();}catch{}if(loopFrames%300===0)retryLocalActivityLoot();if(pendingVictoryEvent&&loopFrames%300===0)showVictory(pendingVictoryEvent);const elapsed=Math.max(0,(stamp-last)/1000),dt=clamp(elapsed,0,.04),fpsStart=performance.now();last=stamp;const measure=devTools?.monitor.enabled,start=measure?performance.now():0;if(AP)apTick(dt);update(dt,elapsed);hostTick(dt);if(!paused&&ready)try{scanSounds();}catch{}if(AP&&!paused)for(let i=1;i<AP.speed&&!(survival.dead&&!AP.revive);i++){apTick(dt);update(dt,dt);hostTick(dt);}if((!paused||ready&&!$('welcome').hidden)&&ambienceOn()){const z=worldZoom();tickAmbience(ambience,dt,{x:camera.x-width/2/z,y:camera.y-height/2/z,w:width/z,h:height/z});}const split=performance.now();tintFrame();rpStart();render();rp('overlay+hud');const rDone=performance.now();postFrame(elapsed);const fEnd=performance.now();const parts={update:split-fpsStart,render:rDone-split,post:fEnd-rDone,counters:{...takeDrawStats(),...vfx.takeStats(),...takeRenderProfile(),tintCells:takeTintStats(),enemies:combat.targets.length,hurt:survival.hurt>0,ambience:ambienceOn()}};fpsOverlay.frame(lastPerfStart?(fpsStart-lastPerfStart)/1000:0,previousPerf?.cpuMs??0,previousPerf?.level??quality.level,previousPerf?.parts);lastPerfStart=fpsStart;previousPerf={cpuMs:fEnd-fpsStart,level:quality.level,parts};if(!paused&&document.visibilityState==='visible')quality.sample(elapsed);if(measure)devTools.frame({elapsed,updateMs:split-start,renderMs:performance.now()-split,counts:combat.targets.filter(e=>e.state==='alive').length+' enemies · '+((combat.projectiles?.length??0)+(mage?.projectiles?.length??0)+(combat.enemyProjectiles?.length??0))+' projectiles · '+(particles.length+sandParticles.items.length)+' particles'});requestAnimationFrame(loop);}

function playerMoveProps(){return [...scene.props,...wallProps(rewards),...combat.targets.filter(e=>e.state==='alive'&&['leader','boss'].includes(e.role)).map(e=>({x:e.x,y:e.y,radius:e.radius}))];}
function castMage(kind,aim=mouseAim()){const spec=mageAbility(survival,kind);if(!queueMageSpell(mage,combat,survival,player,aim,kind,[...scene.props,...wallProps(rewards)])&&mage.energy.value<spec.cost&&player.local)toast('Need '+Math.ceil(spec.cost)+' Arcane Energy');}
function drawMagePlayer(){
 // Pose selection. Spells use their own supplied poses (RMB Attack1, Q Special1, E Attack2, R Special2,
 // other channels CastSpell); source frame 0 is a broken rest frame, so casts play frames 1-14.
 // LMB basics and the Scepter beam have NO cast animation (user decision Oct 15). While firing and for
 // .6s after the last shot the body stays in a combat stance facing the live mouse aim (not each shot's
 // row, which flickered); walking then uses aim-relative Run / RunBackwards / StrafeLeft / StrafeRight.
 // The cast itself is shown by orbiting particles in mage-spell-fx.js. Blink plays the
 // FrontFlip landing. Baked cyan glow is retinted per element.
 const c=mage.cast,ch=mage.channel,isBasic=c?.kind==='bolt'||ch?.kind==='beam',basic=c?.kind==='bolt'||ch?.kind==='beam',hold=!c&&!ch&&!(survival.dead||survival.downed)?mage.castHold:null,aim=(basic||hold)?mouseAim():null,aimRow=basic||hold?(aim?directionRow(aim.x-player.x,aim.y+30-player.y):(c??ch??hold).row):null;
 let key,frame,row=player.row,element=null;
 if((survival.dead||survival.downed)){key='Die';frame=Math.min(14,Math.floor((survival.downed?Math.min(.9,survival.downedTime??0):survival.deathTime)/.9*15));}
 else if(aimRow!==null){row=aimRow;frame=Math.floor(player.frame)%15;if(player.moving){const rel=(player.row-aimRow+8)%8;key=rel<=1||rel===7?'Run':rel>=3&&rel<=5?'RunBackwards':rel===2?'StrafeRight':'StrafeLeft';}else key=survival.hurt>0?'TakeDamage':'Idle';}
 else if((c||ch)&&!isBasic){const a=c??ch;key=({fireball:'Attack1',nova:'Special1',chain:'Attack2',meteor:'Special2'})[c?.kind]??'CastSpell';frame=Math.min(14,1+Math.floor(a.elapsed/a.duration*14));row=a.row;element=c?c.spec?.element:ch.kind==='drain'?'blood':'arcane';}
 else if(mage.blinkTime>0){key='FrontFlip';frame=7+Math.min(7,Math.floor((1-mage.blinkTime/.2)*8));}
 else{key=survival.hurt>0?'TakeDamage':player.moving?'Run':'Idle';frame=Math.floor(player.frame)%15;}
 /* Oct 17 (user): casting slows her (mageMoveTarget), so the legs walk while slowed and run at full speed */
 if(player.moving&&(mage.moveFactor??1)<.85&&!(survival.dead||survival.downed)){if(key==='Run')key='Walk';else if(key==='RunBackwards')key='WalkBackwards';else if(key==='CastSpell'&&ch){key='Walk';frame=Math.floor(player.frame)%15;}}
 const source=images.get('mage-'+({Walk:'Run',WalkBackwards:'RunBackwards'}[key]??key));if(!source)return;const img=element?elementSheet(source,element,frame*128,row*128,128):source;
 ctx.save();if(survival.hurt>0&&!(survival.dead||survival.downed))ctx.filter='sepia(1) saturate(7) hue-rotate(315deg) brightness(1.3)';if(mage.blinkTime>0)ctx.globalAlpha=.55+.45*(1-mage.blinkTime/.2);/* Oct 17 (user): every LMB weapon has its own upper-body attack (release at 45%, mage.js); its end pose is held while castHold lasts. Scepter uses the beam Channel. */const lmbW=combat.weapon?.primary??'staff',lmbUp=ch?(MAGE_CHANNEL_CLIP[lmbW]??'Channel'):!MAGE_CHANNELS.has(lmbW)&&(c?.kind==='bolt'||hold)?'Lmb_'+(MAGE_CLIP_OF[lmbW]??lmbW):null,lmbT=c?.kind==='bolt'?c.elapsed/c.duration:ch&&lmbW==='drum'&&mage.drumBeat!=null?Math.min(1,mage.drumBeat/(magePrimary(combat).cooldown/(combat.weapon?.speed??1))):1;
 if(!drawHero(ctx,player,{model:'mage',clip:key,frame,row,weapon:{id:lmbW,rarity:combat.weapon?.rarity,glow:RARITIES[combat.weapon?.rarity]?.color,rune:combat.runeColor},/* Oct 18: weapon model in hand */upper:lmbUp,upperT:lmbUp&&(!ch||lmbW==='drum')?lmbT:null,upperBlend:lmbUp&&!ch?.08:null,/* Oct 19: the drum clip follows each beat */anchorFor:mage,angle:aim?Math.atan2(aim.y+30-player.y,aim.x-player.x):null,box:[player.x-76.8,player.y-115.2,153.6,153.6]}))/* Oct 17: live 3D Mage (hero-3d.js); sprite while loading */drawCell(ctx,img,img===source?frame*128:0,img===source?row*128:0,128,player.x-76.8,player.y-115.2,153.6,153.6);ctx.restore();
 drawEHand(ctx,mage,true);drawBasicHand(ctx,mage,true);
}
// HUD writes are batched per frame and applied only when the value actually changes (stutter fix, Oct 15):
// rewriting identical text/meters/heights every frame invalidated the HUD layer each frame and, with its
// drop-shadow, made Chrome's raster fall behind and skip whole vsyncs.
const hudPending=new Map();
function hudSet(el,key,v){if(!el)return;let m=hudPending.get(el);if(!m)hudPending.set(el,m={});m[key]=v;}
const hudPct=v=>(Math.round(Math.max(0,Math.min(100,Number.parseFloat(v)||0))*2)/2)+'%';
function hudFlush(){for(const [el,m] of hudPending)for(const k in m){const v=m[k];
 if(k==='text'){const s=orbValueText(el,v);if(el.textContent!==s)el.textContent=s;}
 else if(k==='height'){if(el.style.height!==v)el.style.height=v;}
 else if(k==='width'){if(el.style.width!==v){el.style.width=v;setOrbFill(el,v);}}
 else if(k==='cooldown'){setHudCooldown(el,v);}
 else if(k.startsWith('class:')){el.classList.toggle(k.slice(6),!!v);}
 else if(k==='value'||k==='max'){const q=Math.round(Number(v)*100)/100;if(el[k]!==q)el[k]=q;}
 else if(el[k]!==v)el[k]=v;}
 hudPending.clear();}
const orbHUD=installOrbHUD();
const HUD={hpFill:$('hp-fill'),hpText:$('hp-text'),resFill:$('res-fill'),resText:$('res-text'),resLabel:$('res-label'),xpFill:$('xp-fill'),xpText:$('xp-text'),lv:$('lv-text'),kills:$('run-kills'),bossFill:$('boss-fill'),tiles:{},names:{},cds:{}};
// Oct 18 (user): readable hover cards for the spell bar (replaces the native title tooltips).
const TIP_KEYS={lmb:'LMB',cleave:'RMB',parry:'Q',slam:'E',storm:'R',dash:'Space'},MAGE_KIND={RMB:'fireball',Q:'nova',E:'chain',R:'meteor'};
function slotTip(slot){const key=TIP_KEYS[slot],tint=pathInfo(survival)?.color;
  if(slot==='lmb'){const w=armory.weapons.find(x=>x.id===armory.equipped);if(!w)return null;const st=weaponStats(w,survival.level,survival.endless?'endless':'normal');
    return {title:w.name+(w.quality?' +'+w.quality:''),sub:'LMB · '+RARITIES[w.rarity].name+' '+FAMILIES[w.family].name,tint:RARITIES[w.rarity].color,chips:['Damage '+Math.round(st.damage),st.speed?'Speed '+(+st.speed).toFixed(2):null,classId==='mage'?'Free':null],body:st.description,listTitle:'Affixes',list:w.affixes.map(a=>['',describeAffix(w,a,survival.level)])};}
  if(slot==='dash'){const name=classId==='mage'?'Blink':classId==='ranger'?'Roll':'Dodge';return {title:name,sub:'Space · Movement',tint:'#d9dee8',chips:[(mv?.max??1)>1?mv.max+' charges':null,'Brief invulnerability'],body:classId==='mage'?'Teleport a short distance toward where you are moving. You cannot be hit during the blink.':'Dash a short distance toward where you are moving. You cannot be hit while dodging.'};}
  const nodes=pathNodes(survival),root=nodes.find(n=>n.ability===key&&n.tier===0);if(!root)return {title:key,sub:'No path chosen',body:'Choose a path to see this spell.'};
  const owned=spellOwned(survival,key);let a=null,cost=null,res='';
  if(classId==='mage'){a=mageAbility(survival,MAGE_KIND[key]);cost=a?.cost;res='Energy';}else if(classId==='ranger'){a=rangerAbility(survival,key);cost=a?.cost;res='Momentum';}else{a=warriorAbility(survival,key);cost=rageCost(key);res='Rage';}
  const behaviors=nodes.filter(n=>n.ability===key&&n.tier>0&&rank(survival,n.id)).map(n=>[n.name,n.description]);
  return {title:a?.name??root.name,sub:key+' · '+(owned?'Spell':key==='R'?'Unlocks at level '+SPELL_LEVELS.at(-1):'Locked · picked at a spell level'),tint,
    chips:[cost?Math.ceil(cost)+' '+res:'No cost',a?.cooldown?'Cooldown '+(+a.cooldown).toFixed(1)+'s':null,a?.charges?a.charges+' charges':null],body:root.description,list:behaviors};}
for(const s of Object.keys(TIP_KEYS))tip($('slot-'+s),()=>slotTip(s));
for(const s of ['lmb','cleave','parry','slam','storm','dash']){HUD.tiles[s]=$('slot-'+s);HUD.names[s]=$('name-'+s);HUD.cds[s]=$(s+'-status');}
const cdText=cd=>cd<=0?'':String(Math.ceil(cd));
function updateMageHUD(){
 const slots={cleave:'fireball',parry:'nova',slam:'chain',storm:'meteor',dash:'blink'};
 for(const [slot,kind] of Object.entries(slots)){const spec=mageAbility(survival,kind),cd=mage.cooldowns[kind],locked=slot!=='dash'&&!spellOwned(survival,{fireball:'RMB',nova:'Q',chain:'E',meteor:'R'}[kind]);hudSet(HUD.names[slot],'text',spec.name);const charged=spec.charges&&!mage.rodRefill;hudSet(HUD.cds[slot],'text',locked?(slot==='storm'?'Lv '+SPELL_LEVELS.at(-1):'Locked'):charged?'×'+(mage.rodCharges??spec.charges):cdText(cd));hudSet(HUD.tiles[slot],'class:cooling',!locked&&cd>0&&!charged);hudSet(HUD.tiles[slot],'cooldown',locked||charged?0:cd/Math.max(.001,spec.cooldown||cd));hudSet(HUD.tiles[slot],'class:short',!locked&&mage.energy.value<spec.cost);hudSet(HUD.tiles[slot],'class:locked',locked);}
 hudSet(HUD.tiles.lmb,'class:active',combat.weapon?.primary==='orb'&&mage.orbOn);
 hudSet(HUD.names.lmb,'text',magePrimary(combat).name+(combat.weapon?.primary==='orb'?(mage.orbOn?' · on':' · off'):''));
 hudSet(HUD.resFill,'width',hudPct(Math.ceil(mage.energy.value)/Math.ceil(mage.energy.max)*100));hudSet(HUD.resText,'text',Math.ceil(mage.energy.value)+' / '+Math.ceil(mage.energy.max)+(survival.barrier>0?' · '+Math.ceil(survival.barrier)+' shield':''));
hudFlush();}
function configureClassUI(){
 const isMage=classId==='mage',isRanger=classId==='ranger',labels=isMage?['Fireball','Nova','Chain','Meteor','Blink']:isRanger?['RMB','Q','E','R','Roll']:['Cleave','Parry','Slam','Storm','Dodge'];
  document.body.classList.toggle('mage-mode',isMage);
  $('pause-help').innerHTML=(isMage?'WASD move · mouse aims · LMB arcane attack · RMB / Q / E / R spells · Space Blink':isRanger?'WASD move · mouse aims · hold LMB bow · RMB / Q / E / R skills (cost Momentum, built by bow hits) · Space roll':'WASD move · mouse aims · LMB weapon · RMB / Q / E / R skills · Space dodge')+'<br>Hold Tab for your build · I inventory · F interact · M map · F3 FPS';
 ['cleave','parry','slam','storm','dash'].forEach((slot,i)=>{$('name-'+slot).textContent=labels[i];$('slot-'+slot).classList.remove('short','cooling','locked');});$('res-label').textContent=isMage?'ENERGY':isRanger?'MOMENTUM':'RAGE';
 $('class-description').textContent=isMage?'Choose Pyromancer, Cryomancer, Stormcaller or Blood Mage. Weapons change only your free arcane basic attack.':isRanger?'Choose Archer, Ninja, Alchemist or Gunslinger. Your Bow fires LMB arrows; bow hits build Momentum for your skills.':'Choose Berserker, Vanguard, Spellblade or Warlord. Weapons determine LMB; your path determines active skills.';
 $('class-sword').setAttribute('aria-pressed',String(classId==='sword'));$('class-mage').setAttribute('aria-pressed',String(isMage));$('class-ranger')?.setAttribute('aria-pressed',String(isRanger));
 $('intro-controls').textContent=isRanger?'WASD move · I weapons · hold LMB bow · RMB / Q / E / R specialization skills · Space roll':isMage?'WASD move · I weapons · LMB arcane attack · RMB / Q / E / R specialization spells · Space Blink':'WASD move · LMB weapon attack · RMB / Q / E / R specialization skills · Space dash';
 renderPathPicker();configureAbilityLabels();if(isMage)updateMageHUD();
}
function chooseClass(nextClass){try{queueMicrotask(()=>{if(net.lobby)net.broadcast({t:'look',cls:classId});});}catch{}
 if($('welcome').hidden)return;
 const id=armory.classEquipped[nextClass],result=transactArmory(armory,'equip',id,{classId:nextClass},persistArmory);if(result.error){toast(result.error);return;}
 armory=result.next;selectedWeapon=id;classId=nextClass;resetEncounter('loadout');paused=true;$('menu').hidden=true;syncAudio();
}
$('class-sword').onclick=()=>chooseClass('sword');$('class-mage').onclick=()=>chooseClass('mage');if($('class-ranger'))$('class-ranger').onclick=()=>chooseClass('ranger');
$('choose-class').onclick=()=>resetEncounter('loadout');
const front=createFront({classId:()=>classId,gold:()=>rewards.gold,meta:()=>meta,setMeta,setLast,images,toast,unlock:()=>sound.unlock(),renderPathPicker,
 purchase:r=>{if(localStorage.getItem('veyrath-account-transaction-v1')){toast('Reload to recover the interrupted purchase before spending again.');return false;}if(inRun()||rewards.gold<r.price)return false;const next={...armory,gold:rewards.gold-r.price,revision:(armory.revision??0)+1};try{const raw=localStorage.getItem('veyrath-armory-v1');if(raw&&(JSON.parse(raw).revision??0)!==(armory.revision??0))throw Error('Stale save');const nextMeta=saveAccountPair(localStorage,next,r.next);armory=next;rewards.gold=next.gold;meta=nextMeta;return true;}catch{return false;}},victoryUnlocked:()=>!!armory.victoryUnlocked,setRune:(weaponId,runeId)=>{setMeta(setRune(meta,weaponId,runeId));applyWeapon();},
 weapon:()=>{const w=armory.weapons.find(w=>w.id===armory.equipped);return w&&{id:w.id,name:w.name+(w.quality?' +'+w.quality:''),color:RARITIES[w.rarity]?.color,kind:RARITIES[w.rarity].name+' '+FAMILIES[w.family].name,desc:weaponStats(w,1).description};},
 openInventory:()=>front.show('loadout',{focus:'armory'}),openSettings:openFrontSettings,
 // Prepare Run (Oct 17, user concept): shared armory, equipped weapon and safe pocket on one screen.
 armory:()=>armory,rarities:RARITIES,chooseClass,path:()=>survival.path,lobby:on=>{lobbyView=on;},
 /* Oct 18 (user): the lobby shows the live 3D hero (Warrior/Mage) idling with the class's equipped weapon from the armory. Ranger has no 3D model yet (returns false: sprite fallback). */
 lobbyHero:(ctx,cls,box,t,key)=>{const model=cls==='mage'?'mage':cls==='sword'?'warrior':cls==='ranger'?'ranger':null;if(!model)return false;const w=armory.weapons.find(x=>x.id===armory.classEquipped?.[cls])??(cls===classId?armory.weapons.find(x=>x.id===armory.equipped):null),st=w?weaponStats(w,1):null;const id=model==='mage'?(st?.primary??'staff'):model==='ranger'?(st?.primary??'bow'):WARRIOR_WEAPON[st?.style??'sword'];return drawHero(ctx,key,{model,skin:cls==='ranger'&&cls===classId?survival.path:null,clip:'Idle',frame:t*12,row:2,angle:Math.PI/2-.12-(key.rot||0),box,maxRes:2048,snap:!key.seen,weapon:{id,glow:RARITIES[w?.rarity]?.color,rune:null}})&&(key.seen=true);},
 /* Oct 18 (user: friend's character missing in the lobby): lobby members' heroes stand beside yours with a default weapon. */
 allies:()=>net.lobby?[...net.peers.values()].filter(p=>['sword','mage','ranger'].includes(p.cls)).map(p=>({id:p.id,cls:p.cls,name:p.name})):[],
 allyHero:(ctx,cls,box,t,key)=>{const model=cls==='mage'?'mage':cls==='sword'?'warrior':'ranger';return drawHero(ctx,key,{model,clip:'Idle',frame:t*12,row:2,angle:Math.PI/2+.25,box,maxRes:1024,snap:!key.seen,weapon:{id:model==='mage'?'staff':model==='ranger'?'bow':WARRIOR_WEAPON.sword,glow:null,rune:null}})&&(key.seen=true);},
 weaponInfo:w=>{const s=weaponStats(w,1);return {id:w.id,name:w.name+(w.quality?' +'+w.quality:''),color:RARITIES[w.rarity].color,rarity:w.rarity,kind:RARITIES[w.rarity].name+' · '+FAMILIES[w.family].name,cls:weaponClass(w),desc:s.description,power:s.power,ability:s.abilityOutput,barrier:s.barrierOutput,damage:s.damage,speed:s.speed,reach:weaponClass(w)==='mage'?null:s.reach,affixes:w.affixes.map(a=>describeAffix(w,a,1)),salvage:Math.round(RARITIES[w.rarity].salvage*SALVAGE_AWAY),favorite:!!w.favorite,location:w.location};},
 act:(kind,id,opts={})=>{const r=transactArmory({...armory,gold:rewards.gold},kind,id,{classId,path:survival.path,inRun:false,...opts},persistArmory);if(r.error)return r.error;armory=r.next;rewards.gold=armory.gold;selectedWeapon=armory.equipped;if(kind==='equip')applyWeapon();return null;}});
const net=createNet({toast});net.lobbyInfo=()=>({cls:classId});initOnline();fpsOverlay.network=()=>{if(!net.lobby)return '';const t=net.traffic(),secs=Math.max(1,t.seconds),pings=[...net.peers.values()].map(p=>p.ping).filter(Number.isFinite);return 'NET '+net.role+' · '+(pings.length?Math.max(...pings)+' ms':'connecting')+' · out '+(t.sentBytes/secs/1024).toFixed(1)+' KB/s avg · pending '+[...hostPeers.values()].reduce((n,p)=>n+p.flow.pending.length,0);};  // Online co-op (Oct 17): Steam lobby + connection test inside the desktop launcher
configureClassUI();

function updateClassHUD(){if(classId==='ranger')updateRangerHUD();else updateWarriorHUD();}
function castRanger(key,aim=mouseAim()){if(!ranger)return;const why=rangerCanCast(ranger,survival,key);if(why==='momentum'){if(player.local)toast('Need '+rangerAbility(survival,key).cost+' Momentum · land bow hits to build it');return;}if(why)return;if(requestRanger(ranger,combat,survival,player,aim,key,[...scene.props,...wallProps(rewards)])&&player.local)sound.play((survival.path+'-'+key) in ABILITY_SOUNDS?survival.path+'-'+key:'whoosh');}
function updateRangerHUD(){if(!ranger)return;const slots={cleave:'RMB',parry:'Q',slam:'E',storm:'R'};for(const [slot,key] of Object.entries(slots)){const a=rangerAbility(survival,key),cd=ranger.cooldowns[key],locked=!spellOwned(survival,key);hudSet(HUD.names[slot],'text',a.name+(a.kind==='arrows'&&!locked?' · '+ranger.arrow:''));hudSet(HUD.cds[slot],'text',locked?(slot==='storm'?'Lv '+SPELL_LEVELS.at(-1):'Locked'):cdText(cd));hudSet(HUD.tiles[slot],'class:cooling',!locked&&cd>0);hudSet(HUD.tiles[slot],'cooldown',locked?0:cd/Math.max(.001,a.cooldown||cd));hudSet(HUD.tiles[slot],'class:short',!locked&&ranger.momentum<a.cost);hudSet(HUD.tiles[slot],'class:locked',locked);}hudSet(HUD.resFill,'width',hudPct(Math.ceil(ranger.momentum)/MOMENTUM.max*100));hudSet(HUD.resFill,'class:rage-full',ranger.momentum>=MOMENTUM.max-.5);hudSet(HUD.resText,'text',Math.ceil(ranger.momentum)+' / '+MOMENTUM.max+(survival.barrier>0?' · '+Math.ceil(survival.barrier)+' shield':''));hudFlush();}
// Ranger body (Oct 17): one 2Archer body for every spec; spec colour shows as a neon ground glow and in the projectiles.
// While shooting (and .6s after) the body faces the live aim and walks with aim-relative strafe/backward clips, like the Mage.
/* Oct 18: Shadow Assault clones use the 3D Ranger in the Ninja outfit (translucent via the caller's alpha); keyed per clone. */
const cloneKeys=new WeakMap();
function drawRangerClone(x,y,row,frame,key,alpha=1){const cl=ranger?.clones?.find(c=>Math.abs(c.x-x)<1&&Math.abs(c.y-y)<1);let k=cl&&cloneKeys.get(cl);if(cl&&!k){k={};cloneKeys.set(cl,k);}
  if(k&&drawHero(ctx,k,{model:'ranger',clip:key==='Rolling'?'Rolling':'Throw',frame,row,skin:'ninja',weapon:{id:combat.weapon?.primary??'bow',rarity:combat.weapon?.rarity},box:[x-76.8,y-115.2,153.6,153.6]}))return;drawRangerBody(x,y,row,frame,key,alpha);}
function drawRangerBody(x,y,row,frame,key,alpha=1){const img=images.get('ranger-'+key);if(!img)return;ctx.save();ctx.globalAlpha*=alpha;drawCell(ctx,img,frame*128,row*128,128,x-76.8,y-115.2,153.6,153.6);ctx.restore();}
/* Oct 18 (user, overnight batch): live 3D Ranger (hero-3d.js). The sprite logic above still picks the state; here it becomes
   legs (base clip) + a per-weapon upper-body layer: R_<weapon> runs draw 0-.3, release at .3, recover/redraw to the aimed
   ready pose at 1 (Long Bow draw / Power Shot charge drive 0-.3; each shot plays .3-1; holding aim shows 1). Skills get
   body motions by kind. Outfit follows the path; the perched hawk hides while the hawk hunts. Sprite = fallback. */
const RANGER_SKILL_BODY={cyclone:'Cyclone',shuriken:'Throw',bladefan:'Throw',catalyst:'Throw',volatile:'Throw',arrows:'Cast',smoke:'Cast',reactive:'Cast',focus:'Cry',shadow:'Cry',grand:'Cry',quickstep:'Rolling'};
function drawRanger3D(key,frame,row,aim,aimRow){
  const r=ranger,pr=combat.weapon?.primary??'bow',pose=r.pose,aimA=aim?Math.atan2(aim.y+30-player.y,aim.x-player.x):null,k=pose?Math.min(1,pose.t/pose.dur):0;
  const legs=()=>{if(!player.moving)return 'Idle';const slow=!!(r.charge||r.buffs.barrage>0),rel=((player.row-aimRow)%8+8)%8;return rel>=3&&rel<=5?(slow?'WalkBackwards':'RunBackwards'):rel<=1||rel===7?(slow?'Walk':'Run'):rel===2?'StrafeRight':'StrafeLeft';};
  /* Oct 18: new families borrow the closest existing upper-body clips until they get their own. */
  const CLIP_OF={flamethrower:'shotgun',canister:'shotgun'},cp=CLIP_OF[pr]??pr;/* Oct 19: potion / bomb / barrel / daggers / rifle have their own clips now */
  const wclip=up=>up?'R_'+cp+'_up':'R_'+((cp==='pistols'||cp==='daggers')&&(r.lmbCount??0)%2===0?cp+'_l':cp);
  let clip=key,upper=null,upT=null,ang=null;
  if(key==='Die'||key==='Rolling'||key==='TakeDamage'&&!r.aimHold){}
  else if(r.charge){clip=legs();upper=wclip();upT=.3*Math.min(1,r.charge.t/r.charge.spec.charge);ang=aimA;}
  else if(r.lmbDraw){clip=legs();upper=wclip();upT=.3*Math.min(1,r.lmbDraw.t/r.lmbDraw.dur);ang=aimA;}
  else if(pose){const body=RANGER_SKILL_BODY[pose.kind];
    if(body){clip=body;frame=body==='Rolling'?frame:Math.min(14,k*14);if(pose.kind==='cyclone')ang=row*Math.PI/4+k*Math.PI*3;}
    else if(pose.kind==='volley'){clip=legs();upper=wclip(true);upT=k;}
    else{clip=legs();upper=wclip();upT=.3+.7*k;ang=pose.sheet==='QuickShot'?aimA:null;}}
  else if(r.aimHold>0||r.buffs.barrage>0){clip=legs();upper=wclip();upT=1;ang=aimA;}
  if(clip!==key&&!upper&&!RANGER_SKILL_BODY[pose?.kind])frame=Math.floor(player.frame)%15;
  if(upper&&clip!==key)frame=Math.floor(player.frame)%15;
  const w=combat.weapon;
  return drawHero(ctx,player,{model:'ranger',clip,frame,row,angle:ang,upper,upperT:upT,upperBlend:upper?.08:null,skin:survival.path,anchorFor:r,
    weapon:{id:pr==='chakram'&&r.shots.some(b=>b.chakram&&!b.secondary&&!b.ghost)?null:pr/* Oct 19: the chakram leaves the hand while it flies */,rarity:w?.rarity,glow:RARITIES[w?.rarity]?.color,rune:combat.runeColor,perchHidden:!!r.hawk},box:[player.x-76.8,player.y-115.2,153.6,153.6]});
}
function drawRangerPlayer(){const r=ranger,dashing=dash.remaining>0,color=RANGER_COLORS[survival.path]??'#d9dee8';let key,frame,row=player.row;
 ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,46);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.45;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(player.x,player.y,46,30,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const aim=mouseAim(),aimRow=aim?directionRow(aim.x-player.x,aim.y+30-player.y):player.row;
 if((survival.dead||survival.downed)){key='Die';frame=Math.min(14,Math.floor((survival.downed?Math.min(.9,survival.downedTime??0):survival.deathTime)/.9*15));}
 else if(dashing){key='Rolling';frame=dashFrame(dash);row=dash.row;}
 else if(r.step){key='Rolling';frame=7;row=directionRow(Math.cos(r.step.angle),Math.sin(r.step.angle));}
 else if(r.charge){key='Attack1';frame=1+Math.min(7,Math.floor(r.charge.t/r.charge.spec.charge*7));row=aimRow;}
 else if(r.lmbDraw){key='Attack1';frame=1+Math.min(7,Math.floor(r.lmbDraw.t/r.lmbDraw.dur*7));row=aimRow;}
 else if(r.pose){key=r.pose.sheet;frame=Math.min(14,1+Math.floor(r.pose.t/r.pose.dur*14));row=r.pose.sheet==='QuickShot'?aimRow:r.pose.row;}
 else if(r.aimHold>0||r.buffs.barrage>0){row=aimRow;frame=Math.floor(player.frame)%15;if(player.moving){const rel=(player.row-aimRow+8)%8;key=rel<=1||rel===7?'Run':rel>=3&&rel<=5?'RunBackwards':rel===2?'StrafeRight':'StrafeLeft';}else key='Idle';}
 else{key=survival.hurt>0?'TakeDamage':player.moving?'Run':'Idle';frame=Math.floor(player.frame)%15;}
 ctx.save();if(survival.hurt>0&&!(survival.dead||survival.downed))ctx.filter='sepia(1) saturate(7) hue-rotate(315deg) brightness(1.3)';if(r.invulnerable>0&&survival.path==='ninja')ctx.globalAlpha=.4;if(!drawRanger3D(key,frame,row,aim,aimRow))drawRangerBody(player.x,player.y,row,frame,key);ctx.restore();}
function updateWarriorHUD(){if(!warrior)return;const slots={cleave:'RMB',parry:'Q',slam:'E',storm:'R'};for(const [slot,key] of Object.entries(slots)){const a=warriorAbility(survival,key),cd=warrior.cooldowns[key],locked=!spellOwned(survival,key);hudSet(HUD.names[slot],'text',a.name);hudSet(HUD.cds[slot],'text',locked?(slot==='storm'?'Lv '+SPELL_LEVELS.at(-1):'Locked'):cdText(cd));hudSet(HUD.tiles[slot],'class:cooling',!locked&&cd>0);hudSet(HUD.tiles[slot],'cooldown',locked?0:cd/Math.max(.001,a.cooldown||cd));hudSet(HUD.tiles[slot],'class:short',!locked&&warrior.rage<rageCost(key));hudSet(HUD.tiles[slot],'class:locked',locked);}hudSet(HUD.resFill,'width',hudPct(Math.ceil(warrior.rage)/RAGE.max*100));hudSet(HUD.resFill,'class:rage-full',warrior.rage>=RAGE.max-.5);hudSet(HUD.resText,'text',Math.ceil(warrior.rage)+' / '+RAGE.max);hudFlush();}
function renderForgeChoice(){const pending=armory.pendingForge;$('forge-choice').hidden=!pending;if(!pending)return;const w=armory.weapons.find(w=>w.id===pending.weaponId);$('forge-old').textContent=describeAffix(w,pending.before,survival.level);$('forge-new').textContent=describeAffix(w,pending.after,survival.level);$('forge-paid').textContent=pending.cost+' gold paid. Choose once; neither choice costs more.';}
function settleForge(choice){const r=resolveForge(armory,choice,armory.pendingForge?.id,persistArmory);if(r.error){toast(r.error);return;}armory=r.next;rewards.gold=armory.gold;applyWeapon();renderForgeChoice();if(!$('armory-panel').hidden)renderArmory();}
$('forge-keep').onclick=()=>settleForge('keep');$('forge-accept').onclick=()=>settleForge('accept');
function deliverCornerWeapons(){for(const r of bossChoices.pending)deliverActivityLoot({id:r.id,weapon:r.weapon,anchor:r.anchor});}
let rewardAuto=0;function updateRewardNotice(){const n=bossChoices.pending.length;$('reward-open').hidden=!n;$('reward-open').textContent='Boss blessing'+(n>1?'s':'')+' · '+n;/* Oct 19 (user): the reward panel opens by itself once no other panel is up */if(n<rewardAuto)rewardAuto=n;if(n>rewardAuto&&$('reward-panel').hidden&&!document.querySelector('.ui-veil:not([hidden])')){rewardAuto=n;$('reward-open').onclick();}}
function renderBossChoice(){const pending=bossChoices.pending[0];if(!pending){$('reward-panel').hidden=true;setPaused(false);return;}$('reward-choices').replaceChildren(...bossOptions(bossChoices,survival).map((o,idx)=>{const b=makeCard(idx,{tag:'REWARD',edge:CARD_COLORS.reward,tint:CARD_COLORS.reward,name:o.name,desc:o.description});b.onclick=()=>{if(clientRun){claimFriendReward(pending,o.id);return;}const okay=claimBossChoice(bossChoices,survival,pending.id,o.id,amount=>{const next={...armory,gold:rewards.gold+amount,revision:(armory.revision??0)+1};try{persistArmory(next);armory=next;rewards.gold=next.gold;return true;}catch{toast('Save failed; reward is still pending.');return false;}});if(okay){applyWeapon();pitExitClaim(party.players.find(p=>p.local)?.id??0,pending.bossId);updateRewardNotice();renderBossChoice();}};return b;}));}
// Online friend: gold is banked on this PC; spell insight and blessings live in the host's simulation of this player.
function claimFriendReward(pending,choice){if(!bossOptions(bossChoices,survival).some(o=>o.id===choice))return;net.send(net.lobby.owner,{t:'boss',run:clientRunId,bossId:pending.bossId,choice});claimBossChoice(bossChoices,survival,pending.id,choice);updateRewardNotice();renderBossChoice();}
// Online friend (Oct 17): the level-up panel works on the mirrored offer; every action is sent to the host, which applies it to
// this player's kit and sends the result back with the next snapshot.
let lvlPending=false,lastOfferSig='';
let lvlSig='';const offerSig=()=>JSON.stringify(survival.offer?.options?.map(o=>o.id??o.name)??null)+'|'+(survival.pendingPicks?.length??0)+'|'+JSON.stringify(survival.helpers??null);
const lvlSend=(op,i)=>{if(lvlPending)return;net.send(net.lobby.owner,{t:'lvl',run:clientRunId,op,i});lvlPending=true;lvlSig=offerSig();};
function lvlChoose(i){if(clientRun){lvlSend('choose',i);return null;}return chooseOffer(survival,i);}
function lvlBanish(i){if(clientRun){lvlSend('banish',i);banishArmed=false;return false;}return banishOption(survival,i);}
function lvlReroll(){if(survival.offer?.kind!=='stat')return;if(clientRun){lvlSend('reroll');return;}survival.helpers.reroll--;survival.offer=null;}
function lvlHeal(a){if(clientRun){lvlSend('heal');return false;}return healInstead(survival,a);}
function openLevelUp(){if(performance.now()<cardsAt)return;if(survival.dead||!$('welcome').hidden||!(clientRun?survival.offer:currentOffer(survival)))return;setPaused(true);$('menu').hidden=true;$('levelup-panel').hidden=false;renderLevelUp();}
// UI redesign batch 2 (Oct 16): level-up / reward card as in the user's reference (number key, tag, icon, pips, exact text).
const CARD_SLOT={RMB:'cleave',Q:'parry',E:'slam',R:'storm'};
/* Oct 18 (user): level-up / reward cards in vivid colours for what they are. */
const CARD_COLORS={common:'#e3eaf3',rare:'#2f9bff',epic:'#b146ff',spell:'#ffb21f',behavior:'#1fe0ff',insight:'#ff7a1a',reward:'#ffc61a'};
function makeCard(i,o){const b=document.createElement('button');b.className='lcard';b.style.setProperty('--edge',o.edge);if(o.tagColor)b.style.setProperty('--tagc',o.tagColor);const add=(cls,text)=>{const e=document.createElement('span');e.className=cls;if(text!=null)e.textContent=text;b.append(e);return e;};
 add('lnum',String(i+1));add('ltag',o.tag);const icon=add('licon');icon.style.setProperty('--tint',o.tint);icon.append(iconNode(o.name,classId,o.slot));const name=document.createElement('strong');name.textContent=o.name;b.append(name);
 if(o.pips){const p=add('lpips');for(let k=0;k<5;k++){const d=document.createElement('i');if(k<o.pips)d.className='on';p.append(d);}const l=document.createElement('em');l.textContent=o.pipLabel;p.append(l);}
 add('ldesc',o.desc);if(o.note)add('lnote',o.note);
 // Spam guard: mouse clicks are ignored for a moment after a card appears, so LMB spam in combat can't pick one by accident. Keys 1/2/3 (synthetic clicks, detail 0) still work at once.
 const born=performance.now();b.classList.add('lcard-arming');setTimeout(()=>b.classList.remove('lcard-arming'),CARD_ARM_MS);b.addEventListener('click',e=>{if(e.detail>0&&performance.now()-born<CARD_ARM_MS){e.preventDefault();e.stopImmediatePropagation();}});return b;}
const CARD_ARM_MS=650;
function renderLevelUp(){const offer=clientRun?survival.offer:currentOffer(survival);if(!offer){$('levelup-panel').hidden=true;setPaused(false);return;}const spell=offer.kind!=='stat';$('levelup-eyebrow').textContent=offer.bonus?'TRIAL BUILD INSIGHT':'LEVEL '+offer.level+(offer.kind==='spell'?' · NEW SPELL':offer.kind==='behavior'?' · BUILD DEVELOPMENT':'');$('levelup-panel').querySelector('.card-help').textContent=offer.kind==='behavior'?'Choose one available development.':'Pick a card: press 1, 2 or 3, or click.';$('levelup-title').textContent=offer.bonus?'Build Insight':offer.kind==='behavior'?'Develop your build':offer.kind==='spell'?'Choose a new spell':'Choose a stat';$('levelup-note').textContent=(survival.pendingPicks.length>1?(survival.pendingPicks.length-1)+' more pick'+(survival.pendingPicks.length>2?'s':'')+' after this. ':'')+(spell||!nextSpellLevel(survival.level)?'':'Next '+(pickKind(nextSpellLevel(survival.level))==='spell'?'spell':'build development')+' at level '+nextSpellLevel(survival.level)+'.');
 const tint=pathInfo(survival)?.color??'#e6c581';renderHelpers(offer);$('levelup-choices').classList.toggle('banishing',banishArmed);
 if(!offer.bonus&&offer.options[0]?.type==='behavior'){renderAugmentTree($('levelup-choices'),survival,offer.options,i=>{banishArmed=false;const chosen=lvlChoose(i);if(!chosen)return;combat.skills=survival.skills;applyWeapon();configureAbilityLabels();if(mage)updateMageHUD();toast(chosen.name+' learned · '+chosen.slot);renderLevelUp();},{classId});return;}
 $('levelup-choices').replaceChildren(...offer.options.map((o,i)=>{let b;if(o.type==='stat'){const taken=(survival.cardHistory??[]).filter(h=>h.id===o.id).length,def=STAT_CARDS.find(c=>c.id===o.id);b=makeCard(i,{tag:(o.rarity==='common'?'':o.rarity.toUpperCase()+' ')+'PASSIVE',tagColor:CARD_COLORS[o.rarity],edge:CARD_COLORS[o.rarity],tint:CARD_COLORS[o.rarity],name:o.name,pips:Math.min(5,taken+1),pipLabel:'Level '+(taken+1),desc:o.description,note:taken&&def?'Total after: '+def.text(cardStat(survival,o.stat)+o.value):''});}else b=makeCard(i,{tag:offer.bonus?'SPELL INSIGHT':o.type==='spell'?'NEW SPELL':'BEHAVIOR',edge:offer.bonus?CARD_COLORS.insight:CARD_COLORS[o.type],tint:offer.bonus?CARD_COLORS.insight:CARD_COLORS[o.type],name:o.name,slot:CARD_SLOT[o.slot],pips:1,pipLabel:o.type==='spell'?'New spell':'New behavior',desc:o.description,note:o.type==='spell'?'Goes on '+o.slot:'Changes '+(o.spell??o.slot)+' ('+o.slot+')'});dressLevelCard(b,o,i,1+(survival.cardHistory??[]).filter(h=>h.id===o.id).length);b.onclick=()=>{if(banishArmed){if(o.type==='spell'){toast('New spells cannot be banished');return;}if(lvlBanish(i)){survival.helpers.banish--;banishArmed=false;toast(o.name+' banished for this run','#e8414a');renderLevelUp();}return;}const chosen=lvlChoose(i);if(!chosen)return;combat.skills=survival.skills;applyWeapon();configureAbilityLabels();if(mage)updateMageHUD();if(chosen.type==='spell')toast(chosen.name+' learned · '+chosen.slot);renderLevelUp();};return b;}));}
$('levelup-close').onclick=()=>{banishArmed=false;setPaused(false);};
// Level-up helpers (Oct 16, user): Reroll / Banish charges from Unlocks, and a free "Heal instead" (30% max HP, proposal).
function renderHelpers(offer){const hp=survival.helpers??={reroll:0,banish:0},spell=offer.kind==='spell',heal=Math.round(survival.maxHp*.3),btn=(html,disabled,fn,cls)=>{const b=document.createElement('button');b.innerHTML=html;b.disabled=disabled;if(cls)b.className=cls;b.onclick=fn;return b;};
 $('levelup-helpers').replaceChildren(btn('Reroll · '+hp.reroll+' <kbd>4</kbd>',!hp.reroll||offer.kind!=='stat',()=>{banishArmed=false;lvlReroll();renderLevelUp();}),
  btn((banishArmed?'Click a card to banish':'Banish · '+hp.banish)+' <kbd>5</kbd>',!hp.banish||offer.kind!=='stat',()=>{banishArmed=!banishArmed;renderLevelUp();},banishArmed?'danger':''),
  btn('Heal instead · +'+heal+' HP <kbd>6</kbd>',spell,()=>{if(lvlHeal(heal)){banishArmed=false;toast('Healed '+heal+' HP','#7be38a');renderLevelUp();}},'heal'));
 if(spell)$('levelup-helpers').title='New spell picks cannot be banished or skipped';}
$('points-status').onclick=()=>openLevelUp();$('reward-open').onclick=()=>{setPaused(true);$('menu').hidden=true;$('reward-panel').hidden=false;renderBossChoice();};$('reward-later').onclick=()=>setPaused(false);

function deliverActivityLoot(r){
 const key=(survival.runId??clientRunId??'local')+':'+r.id;
 let saved=armory.activityRewards?.[key];
 if(!saved){const next=structuredClone(armory);next.gold=rewards.gold+(r.goldDelta??0);(next.activityRewards??={})[key]={...structuredClone(r),claimed:!r.weapon};next.revision=(armory.revision??0)+1;try{persistArmory(next);armory=next;rewards.gold=next.gold;saved=next.activityRewards[key];if(survival.telemetry)(survival.telemetry.activities??=[]).push({id:r.id,world:survival.clock,gold:r.goldDelta??0,weapon:r.weapon?.id??null});}catch{return false;}}
 if(saved.weapon&&!saved.claimed&&!weaponLoot.some(d=>d.rewardId===key)&&!armory.weapons.some(w=>w.id===saved.weapon.id))weaponLoot.push({x:saved.anchor?.x??player.x,y:saved.anchor?.y??player.y,clock:0,weapon:structuredClone(saved.weapon),rewardId:key});
 return true;
}
function retryLocalActivityLoot(){if(clientRun)return;for(const reward of survival.activityRewards??[])deliverActivityLoot(reward);}
function completeTrial(e){if(clientRun)return;for(const p of party.players){const owner=String(p.steam??p.id);if(!e.eligibleOwners.includes(owner))continue;const s=p.local?survival:p.kit?.s;if(!s)continue;const id='trial:'+e.id;if((s.completedTrials??=[]).includes(id))continue;s.completedTrials.push(id);const insight=awardBonusPoint(s);const reward={id,goldDelta:e.gold,anchor:e.anchor,weapon:insight?null:makeWeapon(s.level,Math.random,Math.random()<.8?2:3,null,s.classId??'sword',s.path)};(s.activityRewards??=[]).push(reward);if(p.local)deliverActivityLoot(reward);}}
function commitWorldLoot({goldDelta=0,weapon=null,id=null,anchor=null}){
 if(id){const key=(survival.runId??clientRunId??'local')+':'+id;if(armory.activityRewards?.[key])return false;return deliverActivityLoot({id,goldDelta,weapon,anchor});}
 if(armory.pendingForge||rewards.gold+goldDelta<0)return false;
 const next=structuredClone(armory);next.gold=rewards.gold+goldDelta;if(weapon&&!storeRunWeapon(next,structuredClone(weapon)))return false;next.revision=(armory.revision??0)+1;
 try{persistArmory(next);armory=next;rewards.gold=next.gold;return true;}catch{return false;}
}
// Oct 16 (user): walking into the colosseum asks whether to start the trial; while it runs the gate is shut.
// Oct 16 (user): a cleared pit's gate shuts once you walk out, until its boss respawns.
function syncPitGates(){for(const pit of pits){const a=pit.arena,has=scene.props.some(p=>p.pitGate===a.id);if(pit.sealed&&!has)scene.props=[...scene.props,...gateWalls(a).map(w=>({...w,trialGate:false,pitGate:a.id}))];else if(!pit.sealed&&has)scene.props=scene.props.filter(p=>p.pitGate!==a.id);}}
function trialArena(){return arenas.find(a=>a.kind==='colosseum');}
function syncTrialGate(){const a=trialArena(),e=worldEvents.events.find(x=>x.kind==='trial');if(!a||!e)return;const want=e.status==='active',has=scene.props.some(p=>p.trialGate&&!p.pitGate);if(want&&!has)scene.props=[...scene.props,...gateWalls(a)];else if(!want&&has)scene.props=scene.props.filter(p=>!p.trialGate||p.pitGate);
 if(paused||survival.dead)return;const inside=inArena(a,player,30);if(!inside){if(!inArena(a,player,0))e.entryPrompted=false;return;}if(!e.entryPrompted&&(e.status==='reward'||e.status==='ready'&&e.trial)){e.entryPrompted=true;openWorld(e);}}
const personalShrines=new Map(),hostShrineHeals={};
function openWorld(event){if(event.kind==='shrine'){const key=(survival.runId??clientRunId)+event.key;if(!personalShrines.has(key))personalShrines.set(key,{...structuredClone(event),status:'ready',loot:null});event=personalShrines.get(key);}selectedEvent=event;setPaused(true);$('menu').hidden=true;$('world-panel').hidden=false;renderWorldPanel();}
function worldDo(action){if(clientRun&&['trial','rift','camp'].includes(selectedEvent.kind)&&['start','accept'].includes(action)){net.send(net.lobby.owner,{t:'world',run:clientRunId,key:selectedEvent.key,action});setPaused(false);return;}const result=actWorld(worldEvents,selectedEvent,survival,combat,player,scene.props,action,commitWorldLoot);if(result.error){toast(result.error);return;}if(clientRun&&selectedEvent.kind==='shrine'&&action==='heal')net.send(net.lobby.owner,{t:'world',run:clientRunId,key:selectedEvent.key,action:'shrineHeal'});  /* Oct 19 audit: a friend's HP lives on the host; the local heal was overwritten by the next snapshot */if(selectedEvent.kind==='trial'&&selectedEvent.status==='active'){player.x=camera.x=selectedEvent.x;player.y=camera.y=selectedEvent.y+40;toast('The gate slams shut · finish the trial to leave');}applyWorldModifiers(worldEvents,survival,combat);applyWeapon();if(selectedEvent.kind==='merchant'||selectedEvent.kind==='shrine'&&selectedEvent.status==='reward')renderWorldPanel();else setPaused(false);}
function renderWorldPanel(){const e=selectedEvent;$('world-title').textContent=worldTitle(e);$('world-options').replaceChildren();const add=(name,description,action,disabled=false)=>{const card=document.createElement('section'),title=document.createElement('h3'),p=document.createElement('p'),button=document.createElement('button');title.textContent=name;p.textContent=description;button.textContent=disabled?(e.kind==='merchant'?'Purchased':'Unavailable'):action==='claim'?'Claim reward':e.kind==='merchant'?'Buy':e.kind==='shrine'?(e.status==='reward'?'Choose reward':'Restore shrine'):e.kind==='camp'?'Challenge guardians':e.kind==='trial'?'Yes · start the trial':'Open rift';button.disabled=disabled;button.onclick=()=>worldDo(action);card.append(title,p,button);$('world-options').append(card);};
 if(e.kind==='shrine'&&e.status==='reward'){add('Gold',e.loot.goldDelta+' permanent gold.','gold');if(survival.hp<survival.maxHp)add('Recovery','Recover 35% maximum health.','heal');add('Weapon cache','A blue weapon appears at the interaction point.','cache');return;}
 if(e.status==='reward'){add('Encounter complete',e.loot.goldDelta+' gold'+(e.loot.weapon?' and a class-appropriate weapon.':'.')+' Currency is permanent; equipment follows run-bag retention.','claim');return;}
 if(e.kind==='shrine')add('Restore the shrine','Complete the interaction, then choose gold, useful healing or a modest weapon cache.','accept');
 if(e.kind==='camp'){const spec=CAMP_TYPES.find(x=>x.id===e.type);if(e.status==='active')add('Guardians remain','Defeat every marked guardian to earn this camp’s blessing.','none',true);else add('Optional guarded camp',spec.description+' Same blessing refreshes; camp returns six minutes after clearing.','start');}
 if(e.kind==='rift'){if(e.status==='active')add(Math.ceil(e.remaining)+' seconds remaining','Destroy all three glowing anchors before time expires. Normal waves continue.','none',true);else add('Three-anchor challenge','Accept to start a 90-second encounter. Waves escalate under the 150-enemy cap. Seal all anchors for 200 gold and a 15% weapon chance. Failure loses the bonus and leaves your run intact.','start');}
 if(e.kind==='trial'){const spec=TRIALS.find(x=>x.id===e.trial);if(spec){if(e.status==='active')add(spec.name+' · '+Math.ceil(e.remaining)+'s left','Complete the trial inside the colosseum.','none',true);else add(spec.name,spec.description.split('Reward:')[0]+' Build Insights remaining: '+Math.max(0,2-(survival.bonusPointsEarned??0))+'. After two: gold and equipment. Failure never ends your run; the colosseum recharges after a few minutes.','start');}}
 if(e.kind==='merchant'){const timer=document.createElement('p');timer.textContent='Leaves in '+Math.ceil(e.remaining)+' simulation seconds. No orange or red stock. Yellow is exceptionally rare.';$('world-options').append(timer);for(const offer of e.stock??[]){const w=offer.weapon;add((offer.sealed?'Sealed offer · ':'')+RARITIES[w.rarity].name+' '+FAMILIES[w.family].name+' · '+offer.price+' gold','Stored ceiling '+w.ceiling+'. '+(offer.sealed?'Affixes are revealed after purchase.':w.affixes.map(a=>describeAffix(w,a,survival.level)).join(' · ')||'Plain weapon; no affixes.')+' Carried weapons follow run-bag retention.',offer.id,offer.bought);}}
}
// Multiplayer Phase 1 (Oct 17): teammates (F2 test bots for now, network players later). Revive ring and name tags are temporary shapes.
function drawAlly(q){const kit=PARTY.bot.kits[q.classId];let key,frame;
  if(q.downed){key='Die';frame=Math.min(14,Math.floor((q.downedTime??0)/.9*15));}else if(q.atk>0){key=kit.attack;frame=Math.min(14,Math.floor((q.atkT??0)/.35*15));}else{key=q.moving?'Run':'Idle';frame=Math.floor(q.frame)%15;}
  const img=images.get(kit.sheet+'-'+key)??images.get(kit.sheet+'-Idle');if(!img)return;ctx.save();if(q.hurt>0)ctx.globalAlpha=.55+.45*Math.abs(Math.sin(time*40));drawCell(ctx,img,frame*128,q.row*128,128,q.x-76.8,q.y-115.2,153.6,153.6);ctx.restore();}
function drawPartyOverlay(){if(party.players.length<2)return;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const b of party.shots){const g=ctx.createRadialGradient(b.x,b.y-34,0,b.x,b.y-34,10);g.addColorStop(0,'#fff');g.addColorStop(.4,b.color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y-34,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.color;ctx.globalAlpha=.5;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y-34);ctx.lineTo(b.x-b.dx*26,b.y-34-b.dy*26);ctx.stroke();ctx.globalAlpha=1;}
  ctx.globalCompositeOperation='source-over';ctx.textAlign='center';ctx.font='600 12px Inter, sans-serif';const R=PARTY.revive.range;
  for(const q of party.players){if(!visible(q.x,q.y))continue;
    if(q.downed&&!q.dead){const k=Math.min(1,(q.revive??0)/PARTY.revive.time);ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.6,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#9be37a';ctx.beginPath();ctx.ellipse(q.x,q.y,R,R*.6,0,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke();ctx.fillStyle='#ffd9a0';ctx.fillText('DOWN · stand here to revive',q.x,q.y-132);}
    if(q.local)continue;const w=46,hp=Math.max(0,q.hp/q.maxHp);ctx.fillStyle='rgba(5,10,25,.75)';ctx.fillRect(q.x-w/2,q.y-112,w,5);ctx.fillStyle=q.downed?'#777':q.color;ctx.fillRect(q.x-w/2,q.y-112,w*hp,5);ctx.fillStyle=q.color;ctx.fillText(q.name,q.x,q.y-117);}
  ctx.restore();}
let partyBox=null,wasDowned=false;
function updatePartyHUD(){const others=party.players.filter(q=>!q.local);
  if(!!survival.downed!==wasDowned){wasDowned=!!survival.downed;if(wasDowned)banner('DOWNED','A teammate can revive you');}
  if(!partyBox){partyBox=document.createElement('div');partyBox.id='party-frames';partyBox.className='party-frames';partyBox.hidden=true;document.body.append(partyBox);}
  hudSet(partyBox,'hidden',!others.length||!$('welcome').hidden);if(!others.length)return;
  while(partyBox.children.length<others.length){const r=document.createElement('div');r.className='party-row';r.innerHTML='<b></b><span class="party-bar"><i></i></span><small></small>';partyBox.append(r);}
  while(partyBox.children.length>others.length)partyBox.lastChild.remove();
  others.forEach((q,i)=>{const r=partyBox.children[i];if(r.dataset.c!==q.color){r.dataset.c=q.color;r.style.setProperty('--c',q.color);}hudSet(r.children[0],'text',q.name);hudSet(r.children[1].firstChild,'width',hudPct(q.downed?0:q.hp/q.maxHp*100));hudSet(r.children[2],'text',q.downed?'DOWN':String(Math.ceil(q.hp)));hudSet(r,'class:down',!!q.downed);});}
function updateWorldHUD(){const near=nearWorldEvent(worldEvents,player),atForge=!near&&Math.hypot(player.x-FORGE.x,player.y-FORGE.y)<FORGE.radius;hudSet($('world-interact'),'text',near?worldPrompt(near):atForge?'F · Use the forge':'');hudSet($('world-interact'),'hidden',!near&&!atForge);const parts=[];if(worldEvents.curse)parts.push([worldEvents.curse.name,worldEvents.curse.remaining,'#e8414a']);for(const [id,time]of Object.entries(worldEvents.buffs))if(time>0)parts.push([CAMP_TYPES.find(x=>x.id===id)?.name??{trialCrit:'Trial · +10% crit',trialGuard:'Trial · 12% damage reduction',hunterGold:'Trial · double elite gold'}[id]??id,time,'#ffc94a']);const r=worldEvents.events.find(e=>e.kind==='rift'&&e.status==='active');if(r)parts.push(['Rift · '+r.anchors.filter(id=>combat.targets.some(t=>t.id===id&&t.state==='alive')).length+' anchors',r.remaining,'#c06bff']);renderBuffs(parts);hudFlush();}
let buffSig='';function renderBuffs(list){const box=$('world-status'),sig=list.map(b=>b[0]).join('|');if(sig!==buffSig){buffSig=sig;box.replaceChildren(...list.map(([name,,tint])=>{const c=document.createElement('div');c.className='buff';c.style.setProperty('--tint',tint);c.append(name,document.createElement('em'));return c;}));}list.forEach((b,i)=>hudSet(box.children[i]?.lastChild,'text',Math.ceil(b[1])+'s'));}
$('world-close').onclick=()=>setPaused(false);
for(const kind of ['shrine','camp','merchant','rift'])$('preview-'+kind).onclick=()=>{if(['merchant','rift'].includes(kind))forceWorldEvent(worldEvents,kind,survival);const event=worldEvents.events.find(e=>e.kind===kind&&e.status==='ready');if(event){player.x=camera.x=event.x;player.y=camera.y=event.y;event.discovered=true;openWorld(event);}else toast('No ready '+kind+' remains.');};

$('preview-roster').onclick=()=>{
 const options=[{skin:'imp',role:'swarmer',scale:1.25},{skin:'demon-melee',role:'bruiser',scale:1.65},{skin:'demon-caster',role:'caster',scale:1.55,shotCD:3},{role:'leader',modifier:'frostbound',eliteName:'FROSTBOUND',scale:2.3},{role:'swarmer',rift:true,scale:2}];
 for(let i=0;i<options.length;i++){if(combat.targets.filter(e=>e.state==='alive').length>=150)break;const o=options[i];if(o.role==='leader'&&combat.targets.filter(e=>e.role==='leader'&&e.state==='alive').length>=2)continue;const a=Math.PI-i*Math.PI/4,q=safeWorldPoint(player.x+Math.cos(a)*220,player.y+Math.sin(a)*220,scene.props,25);if(!q)continue;const e={...combat.target,...q,...o,id:++survival.id,enemy:true,state:'alive',hp:650,maxHp:650,speed:o.role==='leader'?ENEMY_SPEED.leader:o.role==='caster'?54.9:83.7,radius:o.role==='leader'?26:12,xp:0,age:0,clock:0,emerge:0,hurt:0,death:0,cooldown:20,shotCD:20};if(o.role==='leader')specialDemon(e,{elite:true});if(o.rift)specialDemon(e,{rift:true});combat.targets.push(e);}
 setPaused(false);toast('Enemy model playtest · reset run when finished');
};

let developerOpening=false;
$('developer-open').onclick=async()=>{if(developerOpening)return;developerOpening=true;try{if(!devTools){const {createDeveloperTools}=await import('./developer-tools.js?v=fx-260');devTools=await createDeveloperTools({targets:()=>combat.targets,notice:toast,changed:()=>{survival.spawnTimer=Math.min(survival.spawnTimer,1);},mapStatus:()=>mapStatus,pause:()=>{setPaused(!paused);$('menu').hidden=true;}});}devTools.show();setPaused(false);}catch(e){toast('Developer tools: '+e.message);}finally{developerOpening=false;}};

// Optional WebGL post-processing (bloom, impact shockwaves, light grade) over the 2D canvas.
// Menu toggle persists per browser; any failure leaves the plain 2D canvas visible.
const postToggle=$('post-fx');let postFx=null,postLoading=null;
function postPreference(){try{return localStorage.getItem('veyrath-postfx')!=='off';}catch{return true;}}
async function startPostFx(){
 if(postFx){postFx.setEnabled(postToggle.checked&&quality.settings.post);return;}
 postLoading??=import('./post-fx.js?v=fx-260').then(m=>m.createPostFx(canvas)).then(fx=>{postFx=fx;fx.setEnabled(postToggle.checked&&quality.settings.post);fx.setQuality?.(quality.settings);}).catch(err=>{console.warn('Enhanced graphics unavailable',err);postToggle.checked=false;postToggle.disabled=true;});
 return postLoading;
}
postToggle.checked=postPreference();
postToggle.onchange=()=>{try{localStorage.setItem('veyrath-postfx',postToggle.checked?'on':'off');}catch{}if(postToggle.checked)startPostFx();else postFx?.setEnabled(false);};
if(postToggle.checked&&quality.settings.post)startPostFx();
function postFrame(elapsed){if(!postFx?.enabled)return;postFx.frame(Math.min(elapsed,.1),{toScreen:(x,y)=>({x:((x-camera.x)*worldZoom()+width/2)*dpr,y:((y-camera.y)*worldZoom()+height/2)*dpr}),sources:[mage,warrior,rewards?.fx,BFX].filter(Boolean),scale:worldZoom()*dpr});}


// Shader spell VFX toggle (VFX Lab batch, Oct 15); preference persists per browser.
{const t=$('shader-vfx');if(t){t.checked=vfx.enabled;t.onchange=()=>vfx.setEnabled(t.checked);}}

// Graphics quality (performance batch, Oct 15): Menu select + auto step-down; applies DPR cap, shader-VFX
// resolution, bloom quality/enable and Canvas shadows.
function applyQuality(q,level){resize();vfx.setScale(q.vfxScale);postFx?.setQuality?.(q);if(postFx)postFx.setEnabled(postToggle.checked&&q.post);else if(q.post&&postToggle.checked)startPostFx();
 const lbl=$('gfx-level');if(lbl)lbl.textContent=quality.mode==='auto'?'(auto: '+level+')':'';if(quality.mode==='auto'&&level!=='high')console.info('Graphics quality lowered to '+level);}
{const sel=$('gfx-quality');if(sel){sel.value=quality.mode;sel.onchange=()=>quality.setMode(sel.value);}vfx.setScale(quality.settings.vfxScale);const lbl=$('gfx-level');if(lbl)lbl.textContent=quality.mode==='auto'?'(auto: '+quality.level+')':'';}
{const t=$('fps-toggle');if(t){t.checked=fpsOverlay.visible;t.onchange=()=>fpsOverlay.setVisible(t.checked);}}
{const b=$('fps-report');if(b)b.onclick=async()=>{const text=fpsOverlay.report({build:net.build,network:networkReport(),effectCache:fxCacheStats(),cosmeticParticles:{density:gfx.particleDensity,capPerPool:gfx.particleCap},gameModule:import.meta.url,classId,path:survival.path,quality:quality.level,mode:quality.mode,dpr,canvas:canvas.width+'x'+canvas.height,post:!!postFx?.enabled,shaderVfx:vfx.ok,imagesEverDrawn:drawStats.everCount,imagesEverMB:Math.round(drawStats.everMB)});try{await navigator.clipboard.writeText(text);toast('Performance report copied - paste it to the developer');}catch{console.log(text);toast('Clipboard blocked - report printed to the console');}};}

if(armory.pendingVictory)renderVictoryReward();

if(globalThis.veyrathDebug)for(const name of ['skipTo','summon','god','kill','giveXp','collect','spawnMany','spellSpam','addBotKit','fakeFriend','toPit','testAccept']){const fn=veyrathDebug[name];veyrathDebug[name]=(...args)=>{survival.cheated=true;return fn(...args);};}

for(const id of ['summon-elite','summon-boss','boss-spawn','drop-weapon-test']){const button=$(id),fn=button?.onclick;if(fn)button.onclick=(...args)=>{survival.cheated=true;return fn(...args);};}
