from pathlib import Path
from PIL import Image
import zipfile,io,json
# Extra supplied Knight poses for Warrior abilities (Oct 15): MeleeRun (Rush/Charge), Special2 (shouts/rage
# buffs), CastSpell (runic abilities), ShieldBlockStart (Last Bastion). Combined spritesheets are 8 direction
# rows; sheets with a different frame count (CastSpell has 16) are resampled to 15 columns.
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'))
with zipfile.ZipFile(root/'2D HD Character pack 1 V1.2.zip') as z:
 for a in ['MeleeRun','Special2','CastSpell','ShieldBlockStart']:
  im=Image.open(io.BytesIO(z.read('Spritesheets/With shadow/1Knight/'+a+'.png'))).convert('RGBA');cols=im.width//128
  assert im.height==1024,(a,im.size)
  if cols!=15:
   src=im;im=Image.new('RGBA',(1920,1024))
   for i in range(15):c=round(i*(cols-1)/14);im.paste(src.crop((c*128,0,c*128+128,1024)),(i*128,0))
  key='knight-'+a;im.save(out/(key+'.webp'),format='WEBP',lossless=True)
  manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':1920,'height':1024,'cols':15,'rows':8}
path.write_text(json.dumps(manifest),encoding='utf-8');print('Warrior poses: four extra Knight sheets.')
