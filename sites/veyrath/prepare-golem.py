# Oct 16: register the custom golem Dune Ravager assets (rendered by tools/golem/build_golem.py in Blender, packed by
# tools/golem/compose_sheets.py) so a full prepare-assets.py rebuild keeps them: small proxy sheets + the HD strip table.
from pathlib import Path
from PIL import Image
import json
out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';m=json.loads(path.read_text(encoding='utf-8'))
hd=json.loads((out/'golem/hd.json').read_text(encoding='utf-8'));m['golemHD']=hd
for anim in hd['anims']:
    key='golem-'+anim;im=Image.open(out/(key+'.webp'));cell=im.width//15
    m['sheets'][key]={'url':'assets/'+key+'.webp','cols':15,'rows':im.height//cell,'width':im.width,'height':im.height,'cellWidth':cell,'cellHeight':cell}
path.write_text(json.dumps(m),encoding='utf-8');print('Golem Ravager proxy sheets + HD strips registered')
