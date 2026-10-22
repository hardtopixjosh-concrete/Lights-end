from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,io,json
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'));thumbs=[]
with zipfile.ZipFile(root/'2D HD Character pack 1 V1.2.zip') as z:
 im=Image.open(io.BytesIO(z.read('Spritesheets/With shadow/1Knight/Pummel.png'))).convert('RGBA');im.save(out/'knight-Pummel.webp',format='WEBP',lossless=True)
 manifest['sheets']['knight-Pummel']={'url':'assets/knight-Pummel.webp','width':im.width,'height':im.height,'cols':15,'rows':8}
 thumbs.append(('thrust / throw pose',im.crop((7*128,2*128,8*128,3*128))))
path.write_text(json.dumps(manifest),encoding='utf-8')
contact=Image.new('RGB',(640,185),'#b39b70');d=ImageDraw.Draw(contact)
for i,(name,frame) in enumerate(thumbs):contact.paste(frame,(i*160,0),frame);d.text((i*160,165),name,fill='black')
contact.save(root/'tmp/reference/weapon-identity-assets.png');print('Prepared shared thrust/throw pose.')
