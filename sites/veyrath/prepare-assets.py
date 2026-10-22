from pathlib import Path
from PIL import Image, ImageDraw
import zipfile, io, json

root = Path(__file__).resolve().parents[2]
out = Path(__file__).parent / 'dist/assets'
out.mkdir(parents=True, exist_ok=True)
manifest = {'sheets': {}, 'props': {}}

def sheet(z, source, key):
    im = Image.open(io.BytesIO(z.read(source))).convert('RGBA')
    im.save(out / (key+'.webp'), format='WEBP', lossless=True)
    manifest['sheets'][key] = {'url':'assets/'+key+'.webp', 'width':im.width, 'height':im.height, 'cols':15, 'rows':8}

with zipfile.ZipFile(root/'2D HD Character pack 1 V1.2.zip') as z:
    for a in ['Idle','Run','Melee','Melee2','Special1','Rolling','ShieldBlockMid','MeleeSpin','Die']:
        original=Image.open(io.BytesIO(z.read('Spritesheets/With shadow/1Knight/'+a+'.png'))).convert('RGBA')
        for row,direction in enumerate(['E','SE','S','SW','W','NW','N','NE']):
            names=sorted(n for n in z.namelist() if n.startswith('1Knight/'+a+'/'+direction+'/') and n.endswith('.png'))
            if not names: raise ValueError('Missing labeled reference frame: '+a+'/'+direction)
            frame=Image.open(io.BytesIO(z.read(names[0]))).convert('RGBA')
            if frame.tobytes()!=original.crop((0,row*128,128,(row+1)*128)).tobytes():
                raise ValueError('Unexpected animation direction row: '+a+'/'+direction)
        sheet(z, 'Spritesheets/With shadow/1Knight/'+a+'.png', 'knight-'+a)
with zipfile.ZipFile(root/'2D Demons - TopDown assetpack v1.1.zip') as z:
    for a in ['Idle','Run','Attack 1','TakeDamage 1','Die 1']:
        sheet(z, 'Combined/Imp 1/'+a+'.png', 'imp-'+a.replace(' ',''))
with zipfile.ZipFile(root/'2D Desert Fantasy tileset v1.0.zip') as z:
    names=['Ground A'+str(i)+'_E' for i in range(1,27)] + ['Stone A'+str(i)+'_E' for i in range(1,25)] + ['Tree A1_E','Tree B1_E','Tree C1_E','Flora A1_E','Flora B1_E','Flora C1_E','Misc A1_E','Misc B1_E','Misc C1_E','FirePlace','Torch2','Wall A1_E','Wall B1_E']
    thumbnails=[]
    for name in names:
        source='2D Desert Fantasy tileset v1.0/Environment/Sprites/'+name+'.png'
        if source not in z.namelist(): continue
        im=Image.open(io.BytesIO(z.read(source))).convert('RGBA')
        bbox=im.getbbox()
        if not bbox: continue
        im=im.crop(bbox)
        key=name.replace(' ','-')
        im.save(out/(key+'.webp'),format='WEBP',lossless=True)
        manifest['props'][key]={'url':'assets/'+key+'.webp','width':im.width,'height':im.height}
        thumb=im.copy();thumb.thumbnail((95,90));thumbnails.append((name,thumb))
    contact=Image.new('RGB',(700,((len(thumbnails)+6)//7)*125),'#b39b70');d=ImageDraw.Draw(contact)
    for i,(name,thumb) in enumerate(thumbnails):
        x=i%7*100;y=i//7*125;contact.paste(thumb,(x+(100-thumb.width)//2,y+90-thumb.height),thumb);d.text((x+2,y+96),name,fill='black')
    contact.save(root/'tmp/reference/terrain-contact.jpg')
(out/'manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
print('Prepared',len(manifest['sheets']),'animation sheets and',len(manifest['props']),'terrain assets')
import runpy
for extra in ['prepare-golem.py','prepare-butcher.py','prepare-hd-models.py','prepare-fx.py','prepare-rewards.py','prepare-elite-assets.py','prepare-mage-assets.py','prepare-weapon-assets.py','prepare-warrior-assets.py','prepare-map-assets.py']:
    runpy.run_path(str(Path(__file__).parent/extra),run_name='__main__')
