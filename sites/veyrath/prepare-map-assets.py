from pathlib import Path
from PIL import Image
import zipfile,io,json
# Oct 15 open-desert map: prepare only the tileset sprites the generated map uses (ZIP preserved, not shipped).
# Every sprite is cropped to its alpha bounds and given a manifest `anchor` (ground pivot, in cropped pixels)
# so tiles and wall segments snap to the pack's shared 128x64 isometric diamond grid (tile centre 128,208 in
# the 256px source canvas). `solid` + `foot` describe collision for the map generator.
root=Path(__file__).resolve().parents[1].parent;out=Path(__file__).parent/'dist/assets';path=out/'manifest.json'
manifest=json.loads(path.read_text(encoding='utf-8'));SRC='2D Desert Fantasy tileset v1.0/Environment/Sprites/'
TILE_CENTER=(128,208);EDGE={'E':(160,224),'S':(96,224),'N':(160,192),'W':(96,192)}
def key(name):return name.replace(' ','-')
WALLS=['Wall B1','Wall B2','Wall B3','Wall B4','Wall B7','Wall B8','Wall A1','Wall A7','Wall A9','Wall A3','Door A1',
 # Oct 16 reference-area pass: adobe city (H), plaster (G), stone house (D), log cabin (C), timber-stone (F), fences, gates.
 'Wall G1','Wall G2','Wall G4','Wall G6','Wall G7','Wall G8','Wall G9','Wall H1','Wall H2','Wall H3','Wall H8','Wall H9','Wall H13','Wall H14','Wall H15','Wall H21','Wall H22',
 'Wall D1','Wall D3','Wall D7','Wall D8','Wall D9','Wall D16','Wall C1','Wall C4','Wall C8','Wall C9','Wall F1','Wall F7','Wall F8','Wall F9','Wall F16','Wall E15','Door C1','Door C3','Door C9']
# Oct 16: whole-cell blocks (pyramids, cubes, columns, ruins) and raised slabs/stairs sit on the tile centre; vines hug a wall edge.
BLOCKS={'Wall J1':1,'Wall J2':1,'Wall J3':1,'Wall J4':1,'Wall J6':1,'Wall J8':1,'Wall J9':1,'Wall J10':1,'Wall J11':1,'Wall J12':1,'Wall J16':1,'Wall J17':1,'Wall J18':1,
 'Wall J13':0,'Wall J14':0,'Wall J15':0,'Wall J19':0,'Wall J20':0,'Wall J5':0,'Wall G16':1,'Wall G18':1,'Wall G17':1,'Wall G14':0,'Wall G15':0,'Wall H7':0,'Wall H10':0,'Wall H16':0}
VINES=['WallFlora A1','WallFlora A2','WallFlora A3','WallFlora A6','WallFlora A7','WallFlora A9','WallFlora A11','WallFlora A12','WallFlora A13','WallFlora A5','WallFlora A14']
TILES=['Ground W4','Ground H1','Ground H2','Ground H4','Ground D1','Ground K4','Ground K5','Ground K6','Ground I1','Ground I2','Ground I3','Ground I4','Ground I5','Ground I6','Ground B1','Ground B2','Ground B3','Ground B4','Ground C4','Ground C5','Ground C6']
DECALS=['Ground J1','Ground J3','Ground J5','Ground J9','Ground E1','Ground E5','Ground E7','Ground E9','Ground E11','Ground A5','Ground A9','Ground A13','Ground G7']
# name: (solid, footprint half-width as a fraction of sprite width)
PROPS={'Misc A1':(1,.36),'Misc A2':(1,.3),'Misc A3':(1,.36),'Misc A4':(1,.36),'Misc A5':(1,.34),'Misc A6':(1,.34),'Misc A8':(1,.3),'Misc A9':(1,.36),
 'Misc B1':(1,.34),'Misc B2':(1,.36),'Misc B3':(1,.36),'Misc B5':(1,.36),'Misc B6':(1,.36),'Misc B7':(1,.32),'Misc B8':(1,.34),'Misc B9':(0,0),'Misc B10':(1,.36),'Misc B11':(1,.34),'Misc B12':(1,.36),'Misc B14':(1,.36),'Misc B15':(1,.18),'Misc B16':(1,.22),'Misc B17':(1,.36),'Misc B18':(1,.36),'Misc B19':(1,.36),'Misc B20':(1,.3),
 'Misc B21':(1,.32),'Misc B24':(0,0),'Misc B25':(1,.34),'Misc B26':(1,.32),'Misc B27':(1,.34),'Misc B28':(1,.3),'Misc B29':(1,.26),'Misc B41':(1,.36),'Misc B42':(1,.34),'Misc B43':(1,.3),'Misc B44':(0,0),'Misc B45':(0,0),'Misc B46':(1,.36),'Misc B47':(1,.36),'Misc B48':(1,.3),
 'Misc B49':(1,.36),'Misc B50':(1,.36),'Misc B51':(1,.3),'Misc B52':(0,0),'Misc B53':(1,.3),'Misc B54':(1,.26),'Misc B55':(1,.3),'Misc B56':(1,.3),'Misc B57':(1,.16),'Misc B58':(1,.36),'Misc B63':(1,.34),'Misc B64':(1,.34),'Misc B65':(1,.34),'Misc B66':(1,.34),
 'Misc C1':(1,.24),'Misc C2':(1,.26),'Misc C3':(1,.3),'Misc C4':(1,.32),'Misc C5':(1,.26),'Misc C6':(1,.22),'Misc C7':(1,.24),'Misc C8':(1,.26),'Misc C9':(1,.34),'Misc C10':(1,.24),'Misc C11':(1,.24),'Misc C12':(1,.26),'Misc C13':(1,.26),'Misc C14':(1,.12),
 'Misc D1':(1,.3),'Misc D2':(1,.34),'Misc D3':(1,.34),'Misc D4':(1,.34),'Misc D5':(1,.34),'Misc D6':(0,0),'Misc D7':(0,0),'Misc D8':(0,0),
 'Misc E1':(0,0),'Misc E2':(0,0),'Misc E3':(0,0),'Misc E5':(0,0),'Misc E7':(0,0),'Misc E9':(0,0),'Misc E11':(0,0),
 'Chest A1':(1,.3),'Chest B1':(1,.3),'Tree A1':(1,.06),'Tree A5':(1,.06),'Tree C1':(1,.1),'Tree D1':(1,.08),'Tree D5':(1,.08),'Tree E1':(1,.08),'Tree E5':(1,.08),'Tree B5':(0,0),
 'Tree A2':(1,.06),'Tree A3':(1,.08),'Tree A4':(1,.06),'Tree E2':(1,.08),'Tree E3':(1,.3),'Tree E4':(1,.3),'Tree E6':(1,.06),'Tree B1':(1,.3),'Tree B2':(1,.36),'Tree B3':(1,.36),'Tree D2':(1,.08),'Tree D3':(1,.08),
 'Flora A1':(0,0),'Flora A2':(0,0),'Flora A3':(0,0),'Flora A4':(0,0),'Flora A5':(0,0),'Flora A6':(0,0),'Flora A7':(0,0),'Flora B1':(0,0),'Flora B2':(0,0),'Flora B3':(0,0),'Flora B4':(0,0),'Flora B5':(0,0),'Flora B6':(0,0),'Flora C1':(0,0),'Flora C2':(0,0),'Flora C3':(0,0),'Flora C4':(0,0),'Flora C6':(0,0),
 'Stone B2':(0,0),'Stone B4':(1,.3),'Stone B6':(0,0),'Stone B8':(1,.3),'Stone B10':(0,0),'Stone B11':(0,0),'Misc B13':(1,.34),'Misc B19':(1,.36),'Misc B22':(1,.3),'Misc B23':(1,.34),'Misc B37':(1,.3),'Misc B38':(1,.3),'Misc B39':(0,0),'Misc B40':(0,0),'Misc B59':(1,.1),'Misc B60':(1,.3),'Misc B61':(1,.3),'Misc B62':(1,.34),'Misc B4':(1,.36),
 'Stone A23':(1,.3),'Stone A24':(1,.12),'Stone A6':(1,.34),'Stone A21':(1,.3),'Stone A22':(1,.3),'Stone A14':(1,.2),'Stone A4':(1,.2),'Stone A5':(1,.16),'Stone A9':(1,.3),'Stone A10':(1,.3),'Stone A13':(1,.2),'Stone A2':(1,.34),'Stone A3':(1,.3),'Stone A12':(1,.3),'Misc E4':(0,0),'Misc E6':(0,0),'Misc E8':(0,0),'Misc E10':(0,0),
 'Stone B1':(1,.34),'Stone B3':(1,.34),'Stone B5':(1,.34),'Stone B7':(1,.34),'Stone B9':(1,.34),'Stone A7':(1,.34),'Stone A8':(1,.34),'Stone A16':(1,.34),'Stone A18':(1,.34),'Stone A20':(1,.34),'Wall A6':(1,.2),'Wall A8':(0,0),'FirePlace':(0,0),'Torch2':(1,.12)}
# Roof pieces: lift above the cell by dz (wall height) and push the sort pivot `sort` px forward so the roof draws
# after the house's front walls. anchor.y = tile centre + dz + sort; place the roof at the cell centre + sort*scale.
ROOFS={'Wall H5':(116,40),'Roof A9':(90,40),'Roof A1':(125,72),'Roof E1':(125,72),'Roof E6':(90,40),'Roof F1':(125,72),'Roof F6':(90,40)}
def save(img,k,anchor,extra):
 bb=img.getchannel('A').getbbox();img=img.crop(bb);img.save(out/(k+'.webp'),format='WEBP',lossless=True)
 manifest['props'][k]={'url':'assets/'+k+'.webp','width':img.width,'height':img.height,'anchor':[round(anchor[0]-bb[0],2),round(anchor[1]-bb[1],2)],**extra}
count=0;skipped=[]
with zipfile.ZipFile(root/'2D Desert Fantasy tileset v1.0.zip') as z:
 names=set(z.namelist())
 def load(n):return Image.open(io.BytesIO(z.read(SRC+n+'.png'))).convert('RGBA')
 for w in WALLS:
  for d in 'ENSW':save(load(w+'_'+d),key(w)+'_'+d,EDGE[d] if not w.endswith(('A6','A8')) else TILE_CENTER,{'kind':'wall','solid':1,'edge':d});count+=1
 for b,solid in BLOCKS.items():
  for d in 'ES':save(load(b+'_'+d),key(b)+'_'+d,TILE_CENTER,{'kind':'block','solid':solid});count+=1
 for v in VINES:
  for d in 'ENSW':save(load(v+'_'+d),key(v)+'_'+d,EDGE[d],{'kind':'vine','solid':0,'edge':d});count+=1
 for t in TILES+DECALS:save(load(t+'_E'),key(t)+'_E',TILE_CENTER,{'kind':'tile' if t in TILES else 'decal','solid':0});count+=1
 for r,(dz,sort) in ROOFS.items():
  for d in 'ES':save(load(r+'_'+d),key(r)+'_'+d,(TILE_CENTER[0],TILE_CENTER[1]+dz+sort),{'kind':'roof','solid':0,'sort':sort});count+=1
 for p,(solid,foot) in PROPS.items():
  dirs=[d for d in 'ES' if SRC+p+'_'+d+'.png' in names] or ([''] if SRC+p+'.png' in names else [])
  if not dirs:skipped.append(p)
  for d in dirs:
   n=p+('_'+d if d else '');src=n
   img=load(src);a=img.getchannel('A');bb=a.getbbox();px=a.load();cx=(bb[0]+bb[2])/2
   bottom=max(y for y in range(bb[1],bb[3]) for x in range(bb[0],bb[2],3) if px[x,y]>100)
   rx=(bb[2]-bb[0])*foot;ry=rx*.48
   save(img,key(n) if d else key(p),(cx,bottom-ry if solid else bottom-4),{'kind':'prop','solid':solid,'foot':[round(rx,1),round(ry,1)]});count+=1
# Oct 16 (user: "make the pyramids look better/detailed"): stepped pyramids composed from the pack's own half-height
# J8 blocks (one cell inset and 62px up per layer), J6 capstone, a carved J12 entrance flanked by J10 columns.
 def pyramid(name,n,draw=1.0):
  # Oct 16 (user): shadows on and around the pyramid + stone texture, all baked into the one sprite (and one flat ground
  # shadow decal) at build time; smooth (blurred/Lanczos), never per-pixel noise. Sun matches map-render.js: shadows fall
  # down-right, (+.62h, +.36h) for height h.
  from PIL import ImageDraw,ImageFilter,ImageChops,ImageEnhance
  import random as R
  R.seed(n*7)
  blk=load('Wall J1_E');cap=load('Wall J3_E');carved=load('Wall J12_E');col=load('Wall J10_E');H=124;SX,SY=.62,.36
  layers=(n+1)//2;items=[]
  for L in range(layers):
   for i in range(L,n-L):
    for j in range(L,n-L):items.append((L,i+j,i,j,cap if n-2*L==1 else ImageEnhance.Brightness(blk).enhance(R.uniform(.94,1.05))))
  mid=(n-1)//2
  for i in (mid-1,mid,mid+1):items.append((0,2*n+i,i,n,carved if i==mid else blk))
  items.append((1,2*n+mid,mid,n,load('Wall J6_E')))
  for i in (mid-2,mid+2):items.append((0,2*n+i+1,i,n+1,col))
  pos=lambda i,j,L:((i-j)*64,(i+j)*32-L*H)
  xs=[pos(i,j,L)[0] for L,_,i,j,_ in items];ys=[pos(i,j,L)[1] for L,_,i,j,_ in items]
  W=int(max(xs)-min(xs)+256);Hh=int(max(ys)-min(ys)+256);ox,oy=-min(xs),-min(ys);img=Image.new('RGBA',(W,Hh),(0,0,0,0))
  cc=lambda i,j,z:(ox+128+(i-j)*64,oy+208+(i+j)*32-z)
  def diamond(L,z):a,b=L,n-1-L;return [(cc(a,a,z)[0],cc(a,a,z)[1]-32),(cc(b,a,z)[0]+64,cc(b,a,z)[1]),(cc(b,b,z)[0],cc(b,b,z)[1]+32),(cc(a,b,z)[0]-64,cc(a,b,z)[1])]
  def hull(pts):
   pts=sorted(set((round(x,2),round(y,2)) for x,y in pts))
   def half(ps):
    h=[]
    for p in ps:
     while len(h)>=2 and (h[-1][0]-h[-2][0])*(p[1]-h[-2][1])-(h[-1][1]-h[-2][1])*(p[0]-h[-2][0])<=0:h.pop()
     h.append(p)
    return h
   lo=half(pts);up=half(pts[::-1]);return lo[:-1]+up[:-1]
  for L in range(layers):
   if L>0 and n-2*L>1:
    # step shadow: layer L's block silhouette cast down-right onto the terrace of layer L-1, soft-edged
    z=L*H;top=diamond(L,z);sh=hull(top+[(x+SX*H*.55,y+SY*H*.55) for x,y in top])
    m=Image.new('L',(W,Hh),0);ImageDraw.Draw(m).polygon(sh,fill=150);m=m.filter(ImageFilter.GaussianBlur(7))
    clip=Image.new('L',(W,Hh),0);ImageDraw.Draw(clip).polygon(diamond(L-1,z),fill=255);m=ImageChops.multiply(m,clip)
    shade=Image.new('RGBA',(W,Hh),(46,30,14,0));shade.putalpha(ImageChops.multiply(m,img.getchannel('A')));img.alpha_composite(shade)
   for Lk,_,i,j,im in sorted([t for t in items if t[0]==L],key=lambda t:t[1]):
    x,y=pos(i,j,Lk);img.alpha_composite(im,(int(x+ox),int(y+oy)))
  # dark doorway on the front (south) face of the carved entrance block
  x,y=pos(mid,n,0);bx,by=x+ox+128,y+oy+208;L0=(bx-64,by);B0=(bx,by+32)
  lerp=lambda a,b,t:(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);p1,p2=lerp(L0,B0,.3),lerp(L0,B0,.7)
  ImageDraw.Draw(img).polygon([p1,p2,(p2[0],p2[1]-78),(p1[0],p1[1]-78)],fill=(58,42,28,255))
  # weathered sandstone: smooth large mottling + fine soft grain, multiplied in (darkens by at most ~14%)
  a=img.getchannel('A');mott=Image.effect_noise((max(2,W//28),max(2,Hh//28)),60).resize((W,Hh),Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))
  grain=Image.effect_noise((W,Hh),30).filter(ImageFilter.GaussianBlur(1.1))
  tex=ImageChops.multiply(mott.point(lambda v:int(222+33*min(1,max(0,v/255)))),grain.point(lambda v:int(238+17*min(1,max(0,v/255)))))
  rgb=ImageChops.multiply(img.convert('RGB'),Image.merge('RGB',(tex,tex,tex)));img=Image.merge('RGBA',(*rgb.split(),a))
  # ground shadow decal (drawn flat, baked into the ground tiles): base footprint + the top cast down-right
  base=diamond(0,0);topL=layers-1;tz=(topL+1)*H;topd=diamond(topL,topL*H)
  gs=hull(base+[(x+SX*tz,y+SY*tz+topL*H) for x,y in topd])
  pad=40;gx0=min(x for x,_ in gs)-pad;gy0=min(y for _,y in gs)-pad;gw=int(max(x for x,_ in gs)-gx0+pad);gh=int(max(y for _,y in gs)-gy0+pad)
  gm=Image.new('L',(gw,gh),0);d=ImageDraw.Draw(gm);d.polygon([(x-gx0,y-gy0) for x,y in gs],fill=120);d.polygon([(x-gx0+(x-cc(mid,mid,0)[0])*.05,y-gy0+(y-cc(mid,mid,0)[1])*.05) for x,y in base],fill=165)
  gm=gm.filter(ImageFilter.GaussianBlur(16));shadow=Image.new('RGBA',(gw,gh),(46,28,12,0));shadow.putalpha(gm)
  ax,ay=ox+128+0,oy+(n-1)*32+208
  shadow=shadow.resize((round(gw*draw),round(gh*draw)),Image.LANCZOS)
  save(shadow,name.replace('_E','-Shadow_E'),((ax-gx0)*draw,(ay-gy0)*draw),{'kind':'decal','solid':0})
  # bake at the in-game draw scale so the GPU never holds/filters more pixels than it shows (Oct 16 perf)
  img=img.resize((round(img.width*draw),round(img.height*draw)),Image.LANCZOS)
  save(img,name,(ax*draw,ay*draw),{'kind':'block','solid':1,'cells':n,'baked':draw})
 pyramid('Pyramid-Big_E',11,.85);pyramid('Pyramid-Small_E',7,.8);count+=4
path.write_text(json.dumps(manifest),encoding='utf-8');print('Map assets:',count,'skipped',skipped,'sprites prepared from 2D Desert Fantasy tileset.')
