from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,io,json
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'))
thumbs=[]
with zipfile.ZipFile(root/'2D HD Character pack 1 V1.2.zip') as z:
 for action in ['Idle','Run','CastSpell','Attack1','Attack2','Special1','Special2','FrontFlip','StrafeLeft','StrafeRight','RunBackwards','TakeDamage','Die']:
  im=Image.new('RGBA',(1920,1024))
  for row,direction in enumerate(['E','SE','S','SW','W','NW','N','NE']):
   names=sorted(n for n in z.namelist() if n.startswith('6Mage/'+action+'/'+direction+'/') and n.endswith('.png'))
   # Run includes angle-named and direction-named exports with different shadows.
   # Build from labeled directions, selecting one complete 15-frame sequence.
   groups=sorted({n.rsplit('_',1)[0] for n in names})
   group=next((g for g in groups if g.endswith('_'+direction)),groups[0])
   names=[n for n in names if n.rsplit('_',1)[0]==group]
   assert len(names)>=12,(action,direction,len(names))  # QuickShot exports 14; resampled to 15 below
   if len(names)!=15:names=[names[round(i*(len(names)-1)/14)] for i in range(15)]
   for col,name in enumerate(names):
    frame=Image.open(io.BytesIO(z.read(name))).convert('RGBA');assert frame.size==(128,128)
    im.paste(frame,(col*128,row*128))
  key='mage-'+action;im.save(out/(key+'.webp'),format='WEBP',lossless=True)
  manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':1920,'height':1024,'cols':15,'rows':8}
  thumbs.append((action,im.crop((7*128,2*128,8*128,3*128))))
contact=Image.new('RGB',(640,160),'#b39b70');d=ImageDraw.Draw(contact)
for i,(name,frame) in enumerate(thumbs):contact.paste(frame,(i*128,0),frame);d.text((i*128+8,140),name,fill='black')
contact.save(root/'tmp/reference/mage-animations.png')
with zipfile.ZipFile(root/'Visuals/Super Pixel Projectiles Pack 3.zip') as z:
 for color in ['blue','orange']:
  source='pj3_magic_orb_large_'+color;key='fx-mage-'+color
  names=sorted(n for n in z.namelist() if '/PNG/'+source+'/' in n and n.endswith('.png'))
  frames=[Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in names];w,h=frames[0].size;atlas=Image.new('RGBA',(w*len(frames),h))
  for i,frame in enumerate(frames):atlas.paste(frame,(i*w,0))
  atlas.save(out/(key+'.webp'),format='WEBP',lossless=True)
  manifest['sheets'][key]={'url':'assets/'+key+'.webp','width':w*len(frames),'height':h,'cols':len(frames),'rows':1,'cellWidth':w,'cellHeight':h,'source':source,'credit':'Will Tice / Untied Games'}
  (out/(key+'-license.txt')).write_bytes(z.read(next(n for n in z.namelist() if n.endswith('/license.txt'))))
path.write_text(json.dumps(manifest),encoding='utf-8');print('Mage animations: five sheets built from eight labeled direction sequences,15 frames each.')
