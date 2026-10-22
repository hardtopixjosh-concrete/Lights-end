from pathlib import Path
from PIL import Image
import zipfile,io,json
root=Path(__file__).resolve().parents[2]
out=Path(__file__).parent/'dist/assets'
path=out/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'))
source='fanfx2_ice_spell_large_blue';key='fx-elite-ice'
with zipfile.ZipFile(root/'Visuals/Super Pixel Fantasy FX Pack 2 v1_1.zip') as z:
    names=sorted(n for n in z.namelist() if '/PNG/'+source+'/' in n and n.endswith('.png'))
    frames=[Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in names]
    w,h=frames[0].size;atlas=Image.new('RGBA',(w*len(frames),h))
    for i,frame in enumerate(frames):atlas.paste(frame,(i*w,0))
    atlas.save(out/(key+'.webp'),format='WEBP',lossless=True)
    license_name=next(n for n in z.namelist() if n.endswith('/license.txt'))
    (out/(key+'-license.txt')).write_bytes(z.read(license_name))
manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':w*len(frames),'height':h,'cols':len(frames),'rows':1,'cellWidth':w,'cellHeight':h,'source':source,'pack':'Super Pixel Fantasy FX Pack 2 v1_1.zip','credit':'Will Tice / Untied Games'}
path.write_text(json.dumps(manifest),encoding='utf-8')
print('Prepared ice spell:',len(frames),'frames')
