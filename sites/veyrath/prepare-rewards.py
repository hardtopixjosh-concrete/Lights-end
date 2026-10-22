from pathlib import Path
from PIL import Image
import zipfile,io,json
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent/'dist/assets'
p=out/'manifest.json';m=json.loads(p.read_text())
with zipfile.ZipFile(root/'2D Demons - TopDown assetpack v1.1.zip') as z:
 for action in ['Idle','Run','Attack 1','TakeDamage 1','Die 1']:
  im=Image.open(io.BytesIO(z.read('Combined/Demon Beast 1/'+action+'.png'))).convert('RGBA');key='beast-'+action.replace(' ','')
  assert im.size==(1920,1024)
  im.save(out/(key+'.webp'),format='WEBP',lossless=True);m['sheets'][key]={'url':'assets/'+key+'.webp','cols':15,'rows':8,'width':im.width,'height':im.height}
with zipfile.ZipFile(root/'objects pickups visuals/Super Pixel Item Pickups Fantasy Pack 1.zip') as z:
 ns=sorted(n for n in z.namelist() if '/PNG/fp1_coin_large_gold/' in n and n.endswith('.png'));frames=[Image.open(io.BytesIO(z.read(n))).convert('RGBA') for n in ns];w,h=frames[0].size
 im=Image.new('RGBA',(w*len(frames),h))
 for i,f in enumerate(frames):im.paste(f,(i*w,0))
 im.save(out/'pickup-gold.webp',format='WEBP',lossless=True);m['sheets']['pickup-gold']={'url':'assets/pickup-gold.webp','cols':len(frames),'rows':1,'cellWidth':w,'cellHeight':h,'width':im.width,'height':im.height}
 (out/'pickup-gold-license.txt').write_bytes(z.read('Super Pixel Item Pickups Fantasy Pack 1/license.txt'))
p.write_text(json.dumps(m));print('Prepared Beast 1 animations and animated gold coin')
