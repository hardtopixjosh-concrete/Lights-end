"""Pack the Warrior frames rendered by build_warrior.py into game sheets.

  python tools/warrior/compose_warrior.py --regions   # before the mask pass: region-ID texture from the Knight base colour
  python tools/warrior/compose_warrior.py             # color frames -> dist/assets/knight-<Clip>.webp (256px cells, 15x8)
                                                      # mask frames (if rendered) -> VEYRATH/outputs/warrior-model/masks/
Colour regions (mask pass, flat ID colours; not used in game yet, all players share one look):
  metal (255,0,0)  red accent (0,255,0)  gold trim (0,0,255)  leather (255,255,0)  dark cloth (255,0,255)  light cloth (0,255,255)"""
import os,sys,json
from PIL import Image,ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__));SITE=os.path.abspath(os.path.join(HERE,'..','..'));ROOT=os.path.abspath(os.path.join(SITE,'..','..'))
FRAMES=os.path.join(ROOT,'tmp','warrior-frames');ASSETS=os.path.join(SITE,'dist','assets');MASKS=os.path.join(ROOT,'outputs','warrior-model','masks')
CELL=256;VER='wm1'  # bump when re-rendering so browsers drop the old sheets
CLIPS=['Idle','Run','Melee','Melee2','Special1','MeleeRun','MeleeSpin','Pummel','Special2','CastSpell','ShieldBlockStart','ShieldBlockMid','Rolling','Die']

def regions():
    src=os.path.join(ROOT,'tmp','warrior-src','Textures','Knight');base=Image.open(os.path.join(src,'T_Knight_BaseColor.png')).convert('RGB').resize((2048,2048),Image.BOX)
    hsv=base.convert('HSV');out=[];n={}
    for (H,S,V) in hsv.getdata():
        h,s,v=H/255*360,S/255,V/255
        if v<=.16:c,k=(255,0,255),'dark'
        elif ((h<15)or(h>340))and s>.45 and v>.2:c,k=(0,255,0),'red'
        elif 25<=h<55 and s>.5 and v>.55:c,k=(0,0,255),'gold'
        elif 10<=h<45 and s>.3 and v<=.55:c,k=(255,255,0),'leather'
        elif s<.12 and v>.78:c,k=(0,255,255),'light'
        else:c,k=(255,0,0),'metal'
        out.append(c);n[k]=n.get(k,0)+1
    im=Image.new('RGB',base.size);im.putdata(out);im.save(os.path.join(src,'T_Knight_Regions.png'));print('regions texture written',n)

GROUND=CELL*3//4+6  # sole line: the game pivot is 75% down the cell, soles sit a few px below it
def with_shadow(im,length=.28,lean=.5,alpha=.42):
    """Cast shadow like the old pack sprites: the silhouette flattened onto the ground, falling down-left, soft."""
    a=im.getchannel('A');k=lean/length
    sh=a.transform(im.size,Image.AFFINE,(1,k,-k*GROUND,0,-1/length,GROUND*(1+1/length)),resample=Image.BILINEAR)
    sh=sh.filter(ImageFilter.GaussianBlur(1.6)).point(lambda v:int(v*alpha))
    out=Image.new('RGBA',im.size,(12,8,6,0));out.putalpha(sh);out.alpha_composite(im);return out

def pack(kind,clip,dst,lossless):
    d=os.path.join(FRAMES,kind,clip)
    if not os.path.isdir(d):return False
    sheet=Image.new('RGBA',(15*CELL,8*CELL))
    for r in range(8):
        for f in range(15):
            p=os.path.join(d,f'r{r}_f{f}.png')
            if not os.path.exists(p):raise SystemExit(f'missing {p}')
            im=Image.open(p).convert('RGBA')
            im=im.resize((CELL,CELL),Image.NEAREST if kind=='mask' else Image.LANCZOS)
            if kind=='color':im=with_shadow(im)
            sheet.paste(im,(f*CELL,r*CELL))
    sheet.save(dst,'WEBP',lossless=lossless,quality=92 if not lossless else 100,method=6);return True

if __name__=='__main__':
    if '--regions' in sys.argv:regions();sys.exit()
    os.makedirs(MASKS,exist_ok=True);man_path=os.path.join(ASSETS,'manifest.json');man=json.load(open(man_path,encoding='utf-8'));sheets=man['sheets']
    for clip in CLIPS:
        name='knight-'+clip
        if pack('color',clip,os.path.join(ASSETS,name+'.webp'),False):
            sheets[name]={'url':f'assets/{name}.webp?v={VER}','width':15*CELL,'height':8*CELL,'cols':15,'rows':8,'cellScale':CELL//128}  # game.js sets img.cellScale; drawCell keeps 128-based rects
            print(name,os.path.getsize(os.path.join(ASSETS,name+'.webp'))//1024,'KB')
        if pack('mask',clip,os.path.join(MASKS,name+'-mask.webp'),True):print(name,'mask')
    json.dump(man,open(man_path,'w',encoding='utf-8'))
