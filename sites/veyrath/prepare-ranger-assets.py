# Ranger (Oct 17): one archer body (2Archer) for all four specs; spec colour is a tint/glow in game.
from pathlib import Path
from PIL import Image
import zipfile,io,json
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'))
ACTIONS=['Idle','Run','RunBackwards','StrafeLeft','StrafeRight','QuickShot','Attack1','Attack2','Special1','Special2','CastSpell','Rolling','TakeDamage','Die']
with zipfile.ZipFile(root/'2D HD Character pack 1 V1.2.zip') as z:
 allnames=z.namelist()
 for action in ACTIONS:
  im=Image.new('RGBA',(1920,1024))
  for row,direction in enumerate(['E','SE','S','SW','W','NW','N','NE']):
   names=sorted(n for n in allnames if n.startswith('2Archer/'+action+'/'+direction+'/') and n.endswith('.png'))
   groups=sorted({n.rsplit('_',1)[0] for n in names});group=next((g for g in groups if g.endswith('_'+direction)),groups[0])
   names=[n for n in names if n.rsplit('_',1)[0]==group]
   assert len(names)>=12,(action,direction,len(names))
   if len(names)!=15:names=[names[round(i*(len(names)-1)/14)] for i in range(15)]
   for col,name in enumerate(names):
    frame=Image.open(io.BytesIO(z.read(name))).convert('RGBA');assert frame.size==(128,128),frame.size
    im.paste(frame,(col*128,row*128))
  key='ranger-'+action;im.save(out/(key+'.webp'),format='WEBP',lossless=True)
  manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':1920,'height':1024,'cols':15,'rows':8}
path.write_text(json.dumps(manifest),encoding='utf-8');print('Ranger:',len(ACTIONS),'sheets')
