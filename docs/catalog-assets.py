"""Index supplied archives in place; never extract full packs into the game."""
from pathlib import Path,PurePosixPath
from collections import defaultdict,Counter
import zipfile,json,re,hashlib,struct,io
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/assets';OUT.mkdir(exist_ok=True)
COLORS={'black','blue','brown','cyan','gray','green','grey','orange','pink','purple','red','violet','white','yellow','gold','silver'}
packs=[];sequences=[];families_by_pack={};previews=[];licenses=[]
for archive in sorted(list((ROOT/'Visuals').rglob('*.zip'))+list((ROOT/'objects pickups visuals').rglob('*.zip'))):
    print('Indexing',archive.name,flush=True)
    with zipfile.ZipFile(archive) as z:
        names=[n for n in z.namelist() if not n.endswith('/')]
        groups=defaultdict(list)
        for name in names:
            if '/PNG/' not in name or not name.lower().endswith('.png'):continue
            path=PurePosixPath(name)
            key=str(path.parent) if re.match(r'frame\d+\.png$',path.name,re.I) else str(path)
            groups[key].append(name)
        fams=defaultdict(list)
        for key,frames in sorted(groups.items()):
            frames.sort();leaf=PurePosixPath(key).stem
            tokens=leaf.split('_');color=tokens[-1] if tokens[-1] in COLORS else None
            family=re.sub(r'_(large|small)(?:_[a-z]+)?$','',leaf)
            raw=z.read(frames[0]);width,height=struct.unpack('>II',raw[16:24])
            digest=hashlib.sha256()
            for name in frames:digest.update(z.read(name))
            entry={'archive':archive.relative_to(ROOT).as_posix(),'sequence':key,'family':family,'color':color,'size':'large' if '_large' in leaf else 'small' if '_small' in leaf else None,'frames':len(frames),'frame_width':width,'frame_height':height,'sha256':digest.hexdigest(),'first_frame':frames[0],'last_frame':frames[-1]}
            sequences.append(entry);fams[family].append(entry)
        license_names=[n for n in names if PurePosixPath(n).name.lower() in ['license.txt','licence.txt','readme.txt','asset_list.txt','changelog.txt']]
        metadata=[]
        for n in license_names:
            target=OUT/(archive.stem+'--'+PurePosixPath(n).name)
            target.write_bytes(z.read(n));metadata.append(target.relative_to(ROOT).as_posix())
            if 'license' in n.lower():licenses.append({'pack':archive.name,'archive_path':n,'text':z.read(n).decode('utf-8-sig',errors='replace')})
        info={'archive':archive.relative_to(ROOT).as_posix(),'bytes':archive.stat().st_size,'files':len(names),'formats':dict(Counter(PurePosixPath(n).suffix.lower() or '(no extension)' for n in names)),'png_files':sum(len(v) for v in groups.values()),'sequences':len(groups),'families':len(fams),'metadata':metadata,'other_files':[{'path':n,'bytes':z.getinfo(n).file_size} for n in names if not n.lower().endswith('.png')]}
        sheets=[]
        for n in names:
            if n.lower().endswith('.png') and '/PNG/' not in n:
                raw=z.read(n);w,h=struct.unpack('>II',raw[16:24]);sheets.append({'path':n,'width':w,'height':h,'bytes':len(raw)})
        info['bundled_sprite_sheets']=sheets
        assert info['png_files']+len(sheets)==info['formats'].get('.png',0), 'Unindexed PNG location in '+str(archive)
        packs.append(info);families_by_pack[info['archive']]=fams
        # One representative per family, selected from supplied PNG frames.
        for family,variants in fams.items():
            choices=sorted(variants,key=lambda e:(e['color'] not in ['orange','yellow','brown','red',None],e['size']!='large'))
            entry=choices[0];frames=groups[entry['sequence']]
            candidates=[Image.open(io.BytesIO(z.read(frames[i]))).convert('RGBA') for i in sorted(set([0,len(frames)//4,len(frames)//2,3*len(frames)//4]))]
            im=max(candidates,key=lambda im:sum(im.getchannel('A').histogram()[1:]))
            im.thumbnail((112,83));previews.append((archive.stem,family,im))
index={'generated':'2026-10-14','packs':packs,'sequences':sequences}
(OUT/'inventory.json').write_text(json.dumps(index,indent=2),encoding='utf-8')
(OUT/'license-notes.json').write_text(json.dumps(licenses,indent=2),encoding='utf-8')
hash_groups=defaultdict(list)
for e in sequences:hash_groups[e['sha256']].append(e)
dupes=[{'sha256':h,'locations':[{'archive':e['archive'],'sequence':e['sequence']} for e in entries]} for h,entries in hash_groups.items() if len({e['archive'] for e in entries})>1]
(OUT/'duplicates.json').write_text(json.dumps(dupes,indent=2),encoding='utf-8')
for page,start in enumerate(range(0,len(previews),60),1):
    batch=previews[start:start+60];im=Image.new('RGB',(1200,((len(batch)+7)//8)*120),'#b09868');draw=ImageDraw.Draw(im)
    for i,(pack,family,thumb) in enumerate(batch):
        x=i%8*150;y=i//8*120;im.paste(thumb,(x+(150-thumb.width)//2,y),thumb)
        label=family
        for j in range(0,min(len(label),56),25):draw.text((x+2,y+84+j//25*11),label[j:j+25],fill='#201e17')
    im.save(OUT/f'contact-{page:02}.jpg')
lines=['# VEYRATH supplied asset catalog','','Updated October 14, 2026. Indexed every PNG sequence/static PNG in all archives under `Visuals/` and `objects pickups visuals/`. Original ZIPs remain intact. This is an availability catalog, not a decision to use every asset.','','Exact source paths, frame counts, dimensions and content hashes: [inventory.json](assets/inventory.json). Exact cross-archive PNG-sequence duplicates: [duplicates.json](assets/duplicates.json). Local supplied license summaries: [license-notes.json](assets/license-notes.json). Contact sheets show one sampled frame per family; inspect the full animation when selecting it.','','## Pack overview','','| Pack | PNG sequences/static assets | Families | PNG files | Other formats |','| --- | ---: | ---: | ---: | --- |']
for p in packs:lines.append(f"| {Path(p['archive']).name} | {p['sequences']} | {p['families']} | {p['png_files']} | {', '.join(k for k in p['formats'] if k!='.png')} |")
lines+=['','## Selection and integration rules','','- Check this catalog before generating new effects, icons or pickups; prefer supplied assets that fit the selected mechanic.','- `GAME_REFERENCE.md` and PDF define mechanics; pack names do not add new gameplay requirements.','- Ship only selected assets as prepared atlases. Preserve alpha, frame canvas/pivots and source-relative dimensions; do not crop frames independently.','- Existing orange Sci-fi Pack 1 `scifx1_explosion_A_large_orange` on Ground Slam was explicitly approved by the user October 14. It is a useful style baseline.','- Pixel edges differ from the character/environment style. Evaluate at game scale, use coherent color and restrained layering. Fantasy, impact/dust, sparks and warm shockwaves are strong starting candidates; sci-fi beams/scan effects need specific art direction.','- Original license summaries request attribution to Will Tice; check the retained license for the selected pack before use. No claims about external terms beyond supplied text.','- Duplicate inventory detects exact same PNG frame bytes across archives. Similar animations with renamed/re-exported/color variants may remain distinct.','','## Suggested future uses (candidates, not implemented)','','| Need | Where to start |','| --- | --- |','| Sword impact/parry/crit | Impact FX 1/2, sparks, Effects Pack 3, Gigapack directional impacts |','| Ground Slam, dash, desert dust | Impact FX dust/ground effects, Explosion FX and Gigapack smoke/rings |','| Blade Storm and elemental weapon effects | Fantasy FX, Gigapack wind/swirl effects, appropriate sparks |','| Enemy caster/charger attacks | Projectiles 2/3/4; pair matching impact with projectile |','| Blood and enemy death feedback | Blood FX 1, Gigapack splatters; select coherent blood color |','| Boss AoE, rifts, shrines, magical events | Fantasy FX 1/2, Explosion FX, Gigapack; sci-fi portals selectively |','| Gold, XP/loot, potions and reward pickups | Item Pickups Fantasy 1 and Objects And Items |','| Chests, equipment, interactables and forge details | Objects And Items; exact named assets below |']
for p in packs:
    lines+=['',f"## {Path(p['archive']).name}",'',f"Source: `{p['archive']}`. {p['sequences']} sequences/static assets in {p['families']} families. Formats: {', '.join(p['formats'])}.",'','| Family / object | Variants | Colors | Frame count | Frame canvas |','| --- | ---: | --- | --- | --- |']
    for family,entries in families_by_pack[p['archive']].items():
        colors=sorted({e['color'] for e in entries if e['color']});counts=sorted({e['frames'] for e in entries});dims=sorted({f"{e['frame_width']}×{e['frame_height']}" for e in entries})
        lines.append(f"| `{family}` | {len(entries)} | {', '.join(colors) or 'source palette'} | {', '.join(map(str,counts))} | {', '.join(dims)} |")
lines+=['','## Visual family contact sheets','']+[f'- [Contact sheet {i:02}](assets/contact-{i:02}.jpg)' for i in range(1,(len(previews)+59)//60+1)]
lines=[line.replace('| Chests, equipment, interactables and forge details | Objects And Items; exact named assets below |','| Food, keys, potions, gems and hazards | Objects And Items; food and spikes dominate; no named chest/sword/shield equipment sprites found |') for line in lines]
lines+=['','## Notes from representative visual review','','Reviewed all 13 family contact sheets; previews are samples, not full animation playback.','',
'- The 93,593 PNG count refers to individual animation frames/static assets. Supplied prepacked spritesheet PNGs are separately indexed per pack in inventory bundled_sprite_sheets, including dimensions and source paths. Do not interpret atlas pixel dimensions as frame dimensions.',
'- **Pickups Fantasy 1:** animated coins (gold/silver/bronze and elemental colors), energy orbs, gems, hearts, keys, potions, relics and souls. Strong first choices for gold, healing and loot; a soul/orb can represent XP only if that mechanic is chosen.',
'- **Objects And Items:** sparkle animations; static food/drink, bombs/dynamite/TNT, coins/gems/hearts/keys, full/half/empty potions, spike balls, directional spike sets, springs and stars. Includes dark/light/no-outline variants and source size variants. More suitable for icons, loot and hazards than environment landmarks. No named chest, sword or shield equipment sprites were found.',
'- **Blood FX 1:** blood bursts A–C, splashes A–D and streams A–C, with color/size choices. Use red for conventional blood or choose a deliberate demon palette; contact sheet orange is merely a representative color.',
'- **Gigapack:** 175 animation types / 2,296 variants, matching its supplied asset list. Explosions, spell/stat buffs, forge/heal/death/status effects, fire, directional/symmetrical impacts, lightning, particle/coin/heart/sparkle bursts, smoke/splatters, sci-fi effects and animated UI symbols/text. The bundled local HTML guide and GIF previews are discoverable in inventory other_files. Contains exact overlaps with standalone packs; do not treat all variants as unique designs.',
'- **Effects Pack 3:** bite, brown dust trails, impact hit, lightning aura, magic spawn, smoke bomb, splatter, toon explosion/impact and warp. Dark/light brown dust trail variants are useful desert candidates.',
'- **Explosion FX 1:** epic, stylized and symmetrical explosions. Strong boss-impact candidates; some include bright fire and smoke which need scale restraint.',
'- **Fantasy FX 1:** magic bursts/puffs, power-up, skull puff and spellcast sets. Some casts provide separate front/back layers for surrounding an actor: preserve their synchronized timing.',
'- **Fantasy FX 2:** absorb, claw, cure, earth spikes, fire/ice/lightning/poison/shatter and wind spell. Brown wind is a promising Blade Storm candidate; earth spikes suit a future enemy or boss hazard. Several effects have start/loop/end and front/back components.',
'- **Impact FX 1/2:** dust, quick, cinematic, fantasy, sci-fi and toon impacts. Warm dust is a promising Slam/landing candidate; sharp quick/fantasy impacts suit sword/parry feedback.',
'- **Projectiles 2:** fireball, ground shockwave, helix beam, ice spike, kunai, lightning orb, magic missile, meteor, sci-fi missile and shuriken.',
'- **Projectiles 3:** acid, arrow impact/loop, death wave, demon-bite impact/loop, knife, light spark, magic hex/missile/orb/spike. Keep matching travel/impact segments together.',
'- **Projectiles 4:** dark matter, energy blasts/pellet, laser-beam components, plasma ball, sawblade, sci-fi bomb and scrap metal. Beam parts use origin/center/impact and start/loop/end groups; exact nested paths distinguish them in inventory.',
'- **Sci-fi FX 1:** boost, electricity, explosions, scan start/loop/stop, sparks, wormhole start/loop/stop and zaps. Orange explosion_A is already used on Slam and was approved by the user.',
'- **Sci-fi FX 2:** black-hole lifecycle, buffs/debuffs, charge-up, electric aura, hacking, hex shield, scans, tech aura front/back and warp. Portal/shield/charge effects can cross genres; hacking/scan graphics require an intentional stylistic choice.',
'','All suggestions are availability notes; selecting an asset still follows the PDF, user decisions and the established game palette.']
(ROOT/'docs/ASSET_CATALOG.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'packs':len(packs),'sequences':len(sequences),'families':len(previews),'png_files':sum(p['png_files'] for p in packs),'exact_cross_archive_duplicate_groups':len(dupes),'contact_sheets':(len(previews)+59)//60}))
