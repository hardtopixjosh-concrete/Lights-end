"""Prepare only selected source demon families; keep original cell canvas and alpha."""
from pathlib import Path
from PIL import Image
import zipfile, io, json
root=Path(__file__).resolve().parents[2]
out=Path(__file__).parent/'dist/assets'
manifest_path=out/'manifest.json'
families={
 'demon-melee':'Demon Spawn 4',
 'demon-caster':'Demon Spawn 8',
 'demon-elite':'Demon Elite 3',
 'demon-rift':'Demon Beast 4',
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
            original.save(target,format='WEBP',lossless=True)
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
