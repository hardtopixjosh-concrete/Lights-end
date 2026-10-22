# Oct 17: register the custom HD boss models (Colossus phases 1-3, Wyrm armoured/exposed, Hollow Prophet; rendered in
# Blender by tools/<boss>/build_<boss>.py, packed by tools/hd/compose_model.py) so a full prepare-assets.py rebuild keeps
# their proxy sheets + HD strip tables.
from pathlib import Path
from PIL import Image
import json
out=Path(__file__).parent/'dist/assets';path=out/'manifest.json';m=json.loads(path.read_text(encoding='utf-8'))
for model in ['colossus1','colossus2','colossus3','wyrm1','wyrm2','prophet']:
    f=out/model/'hd.json'
    if not f.exists():continue
    hd=json.loads(f.read_text(encoding='utf-8'));m[model+'HD']=hd
    for anim in hd['anims']:
        key=model+'-'+anim;im=Image.open(out/(key+'.webp'));cell=im.width//15
        m['sheets'][key]={'url':'assets/'+key+'.webp','cols':15,'rows':im.height//cell,'width':im.width,'height':im.height,'cellWidth':cell,'cellHeight':cell}
    print(model,'registered')
path.write_text(json.dumps(m),encoding='utf-8')
