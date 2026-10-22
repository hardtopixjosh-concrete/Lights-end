"""Oct 18 wave roster: per-run tank/ranged/fast/attack-speed variants and six elite models (lazy-loaded, not preloaded)."""
from pathlib import Path
from PIL import Image
import zipfile, io, json
root=Path(__file__).resolve().parents[2]
out=Path(__file__).parent/'dist/assets'
manifest_path=out/'manifest.json'
families={
 # Oct 18 (user's annotated sheet): keys name the source model so roles can be remapped in wave-roster.js only.
 'dm-imp5':'Imp 5','dm-imp9':'Imp 9',
 'dm-spawn10':'Demon Spawn 10','dm-spawn11':'Demon Spawn 11','dm-spawn7':'Demon Spawn 7',
 'dm-spawn13':'Demon Spawn 13','dm-spawn12':'Demon Spawn 12','dm-beast3':'Demon Beast 3',
 'dm-beast1':'Demon Beast 1','dm-beast2':'Demon Beast 2','dm-spawn5':'Demon Spawn 5',
 'dm-spawn3':'Demon Spawn 3','dm-spawn9':'Demon Spawn 9',
 'dm-elite1':'Demon Elite 1','dm-elite2':'Demon Elite 2','dm-elite4':'Demon Elite 4','dm-elite5':'Demon Elite 5','dm-elite6':'Demon Elite 6',
}
actions=['Idle','Run','Attack 1','TakeDamage 1','Die 1']
with zipfile.ZipFile(root/'2D Demons - TopDown assetpack v1.1.zip') as archive:
    additions={}
    for prefix,family in families.items():
        for action in actions:
            source='Combined/'+family+'/'+action+'.png'
            if action=='Idle' and source not in archive.namelist():
                source=next(n for n in archive.namelist() if n.startswith('Combined/'+family+'/Idle') and n.endswith('.png'))
            original=Image.open(io.BytesIO(archive.read(source))).convert('RGBA')
            assert original.size==(1920,1024),source
            key=prefix+'-'+action.replace(' ','')
            target=out/(key+'.webp')
            original.save(target,format='WEBP',lossless=True,exact=True)
            with Image.open(target) as prepared:
                assert prepared.size==original.size
                assert prepared.convert('RGBA').tobytes()==original.tobytes(),key
            additions[key]={'url':'assets/'+key+'.webp','width':1920,'height':1024,
                'cols':15,'rows':8,'cellWidth':128,'cellHeight':128,
                'source':source,'pack':'2D Demons - TopDown assetpack v1.1.zip',
                'directionRows':['E','SE','S','SW','W','NW','N','NE'],
                'pivotX':64,'pivotY':96}
    # Merge late, preserving other prepared asset entries.
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['sheets'].update(additions)
    manifest_path.write_text(json.dumps(manifest),encoding='utf-8')
print('Prepared and pixel-verified',len(additions),'selected animation sheets; bytes',sum((out/(k+'.webp')).stat().st_size for k in additions))
