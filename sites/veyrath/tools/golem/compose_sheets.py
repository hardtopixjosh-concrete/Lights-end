"""Pack rendered golem frames (build_golem.py) for the game. Oct 16 crisp pass:
- HD strips: one image per animation per rendered direction (E,SE,S,N,NE; SW/W/NW are mirrored in game), 15 frames
  side by side, each frame cropped to the animation's union bounding box and Lanczos-downsampled to a FRAME px frame
  (render 2x -> crisp). Lazy-loaded by the game, so only the strips in use sit in memory.
- Proxy sheets: small 96px full-frame cells (15 x 5 rows) loaded up front, drawn for the frame or two a strip is loading.
Usage: python tools/golem/compose_sheets.py FRAMES_DIR [FRAME=352]"""
import sys,json
from pathlib import Path
from PIL import Image
src=Path(sys.argv[1]);FRAME=int(sys.argv[2]) if len(sys.argv)>2 else 352;PROXY=96
ANIMS=['Idle','Run','Attack1','TakeDamage1','Die1','Charge','Throw','Pound'];ROWS=[0,1,2,6,7]
dist=Path(__file__).resolve().parents[2]/'dist';out=dist/'assets/golem';out.mkdir(parents=True,exist_ok=True)
man_path=dist/'assets/manifest.json';man=json.loads(man_path.read_text(encoding='utf-8'));hd={'frame':FRAME,'rows':ROWS,'anims':{}}
for anim in ANIMS:
    frames={(r,f):Image.open(src/f'{anim}_{r}_{f:02d}.png').convert('RGBA') for r in ROWS for f in range(15)}
    R=next(iter(frames.values())).width;k=FRAME/R;x0=y0=10**9;x1=y1=0
    for im in frames.values():
        b=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
        if b:x0,y0,x1,y1=min(x0,b[0]),min(y0,b[1]),max(x1,b[2]),max(y1,b[3])
    pad=6;x0,y0,x1,y1=max(0,x0-pad),max(0,y0-pad),min(R,x1+pad),min(R,y1+pad)
    cw,ch=round((x1-x0)*k),round((y1-y0)*k)
    for r in ROWS:
        strip=Image.new('RGBA',(cw*15,ch),(0,0,0,0))
        for f in range(15):strip.alpha_composite(frames[(r,f)].crop((x0,y0,x1,y1)).resize((cw,ch),Image.LANCZOS),(f*cw,0))
        strip.save(out/f'{anim}_{r}.webp',format='WEBP',quality=92,method=6)
    hd['anims'][anim]={'x':round(x0*k,2),'y':round(y0*k,2),'w':cw,'h':ch}
    proxy=Image.new('RGBA',(PROXY*15,PROXY*len(ROWS)),(0,0,0,0))
    for i,r in enumerate(ROWS):
        for f in range(15):proxy.alpha_composite(frames[(r,f)].resize((PROXY,PROXY),Image.LANCZOS),(f*PROXY,i*PROXY))
    key='golem-'+anim;proxy.save(dist/'assets'/(key+'.webp'),format='WEBP',quality=88,method=6)
    man['sheets'][key]={'url':'assets/'+key+'.webp','cols':15,'rows':len(ROWS),'width':proxy.width,'height':proxy.height,'cellWidth':PROXY,'cellHeight':PROXY}
    print(anim,'crop',cw,'x',ch,'strip',cw*15,'x',ch)
man['golemHD']=hd;man_path.write_text(json.dumps(man),encoding='utf-8')
(dist/'assets/golem/hd.json').write_text(json.dumps(hd),encoding='utf-8')
