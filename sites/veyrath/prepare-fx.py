from pathlib import Path
from PIL import Image
import zipfile,io,json
root=Path(__file__).resolve().parents[2]
out=Path(__file__).parent/'dist/assets'
manifest_path=out/'manifest.json'
manifest=json.loads(manifest_path.read_text())
selected=[
 ('Super Pixel Sci-fi FX Pack 1.zip','scifx1_explosion_A_large_orange','fx-slam-shockwave'),
 ('Super Pixel Fantasy FX Pack 2 v1_1.zip','fanfx2_wind_spell_large_brown','fx-storm-wind'),
 ('Super Pixel Projectiles Pack 2.zip','pj2_lightning_orb_large_violet','fx-rod-orb'),
 ('Super Pixel Effects Pack 3.zip','fx3_lightning_aura_large_violet','fx-rod-aura'),
 ('Super Pixel Impact FX Pack 2.zip','impfx2_dust_impact_A_large_orange','fx-slam-dust'),
 ('Super Pixel Sci-fi FX Pack 2.zip','scifx2_hex_shield_large_orange','fx-parry-shield'),
 ('Super Pixel Impact FX Pack 1.zip','impfx1_quick_impact_A_large_yellow','fx-parry-spark'),
]
for pack,source,key in selected:
    with zipfile.ZipFile(root/'Visuals'/pack) as z:
        names=sorted(n for n in z.namelist() if '/PNG/'+source+'/' in n and n.endswith('.png'))
        assert names,source
        frames=[Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in names]
        w,h=frames[0].size
        atlas=Image.new('RGBA',(w*len(frames),h))
        for i,frame in enumerate(frames):atlas.paste(frame,(i*w,0))
        atlas.save(out/(key+'.webp'),format='WEBP',lossless=True)
        license_name=next(n for n in z.namelist() if n.endswith('/license.txt'))
        (out/(key+'-license.txt')).write_bytes(z.read(license_name))
    manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':w*len(frames),'height':h,'cols':len(frames),'rows':1,'cellWidth':w,'cellHeight':h,'source':source,'pack':pack,'credit':'Will Tice / Untied Games'}
    print(key,len(frames),'frames')
manifest_path.write_text(json.dumps(manifest),encoding='utf-8')
