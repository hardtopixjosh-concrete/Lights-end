"""Generate the Oct 15 open-desert map (6400x4800) as an editable Tiled map.

Writes dist/maps/desert.tmj + desert-props.tsj in the existing VEYRATH Tiled subset (image-collection tile
objects, polygon collision footprints owned by scenery, point landmarks). Layout follows the approved sketch
(Desert Biome/layout-sketch.png): open sand everywhere (no roads) with landmark zones built from the
2D Desert Fantasy tileset - palisade Trial Arena with a ruined temple approach, Forge Sanctuary grove, Crimson
Warcamp, Oasis Lake, Market Village, Fallen Temple Ruins, Bone Wastes, Sunken Pit and three shrines.
Walls and ground tiles snap to the pack's isometric 128x64 diamond grid (see prepare-map-assets.py anchors).
Re-running overwrites hand edits; after the first generation, edit the map in Tiled instead.
"""
import json,math,random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';MAPS=DIST/'maps'
MAN=json.loads((DIST/'assets/manifest.json').read_text(encoding='utf-8'))['props']
import re
# Keys with code-defined PROP_BASES draw from those anchors, so the map must use the same pivot/footprint.
BASES={k:(float(ax),float(ay),float(rx),float(ry)) for k,ax,ay,rx,ry in re.findall(r"'([A-Za-z]+-[A-Z0-9]+_E)': \{anchor:\[(\d+),(\d+)\],ellipse:\[(\d+),(\d+)\]",(DIST/'simulation.js').read_text(encoding='utf-8'))}
W,H=9600,7200;S=.75;random.seed(1016)
tiles={};ground=[];scenery=[];colliders=[];landmarks=[];nid=[1]
def oid():
    i=nid[0];nid[0]+=1;return i
def tile_id(key):
    if key not in MAN:raise SystemExit('asset not prepared: '+key)
    if key not in tiles:tiles[key]=len(tiles)
    return tiles[key]
def anchor(key):
    if key in BASES:return list(BASES[key][:2])
    m=MAN[key];return m.get('anchor') or [m['width']/2,m['height']/2]
def ellipse(cx,cy,rx,ry,n=14):return [(cx+math.cos(i/n*2*math.pi)*rx,cy+math.sin(i/n*2*math.pi)*ry) for i in range(n)]
def collider(owner,points,name):
    x0,y0=points[0];colliders.append({'id':oid(),'name':'Footprint '+name,'type':'VEYRATHCollision','x':round(x0,2),'y':round(y0,2),'rotation':0,'visible':True,
        'polygon':[{'x':round(x-x0,2),'y':round(y-y0,2)} for x,y in points],'properties':[{'name':'ownerId','type':'object','value':owner}]})
def place(key,x,y,scale=1.0,collection='props',layer=None,solid=None,foot=None):
    """Place a sprite with its ground pivot at (x,y). Returns the object id."""
    m=MAN[key];w,h=m['width'],m['height'];ax,ay=anchor(key);i=oid()
    # Oct 16: only flat pieces (ground tiles, decals, low tufts) stay on the ground layer; tall non-solid props are depth-sorted.
    layer=layer or ('ground' if collection=='ground' or (not m.get('solid',1) and h*scale<38) else 'depth')
    obj={'id':i,'name':key,'type':'VEYRATHProp','gid':1+tile_id(key),'x':round(x-ax*scale,2),'y':round(y+(h-ay)*scale,2),'width':w*scale,'height':h*scale,
         'rotation':0,'visible':True,'properties':[{'name':'key','type':'string','value':key},{'name':'scale','type':'float','value':scale},{'name':'layer','type':'string','value':layer},{'name':'collection','type':'string','value':collection}]}
    (ground if collection=='ground' else scenery).append(obj);PIVOT[i]=(x,y,key)
    if collection=='props' and (solid if solid is not None else (m.get('solid') or key in BASES)):
        if foot:collider(i,foot,key)
        elif m.get('kind')=='wall':
            d=m.get('edge','E');hx,hy=(32*scale,-16*scale) if d in 'EW' else (32*scale,16*scale);t=7*scale+3
            collider(i,[(x-hx,y-hy-t),(x+hx,y+hy-t),(x+hx,y+hy+t),(x-hx,y-hy+t)],key)
        elif key in BASES:collider(i,ellipse(x,y,BASES[key][2]*scale,BASES[key][3]*scale),key)
        elif m.get('foot'):rx,ry=m['foot'];collider(i,ellipse(x,y,max(6,rx*scale),max(4,ry*scale)),key)
    return i
def lm(name,x,y,**props):
    landmarks.append({'id':oid(),'name':name,'type':name.split('-')[0],'point':True,'x':round(x),'y':round(y),'rotation':0,'visible':True,
        **({'properties':[{'name':k,'type':'float','value':v} for k,v in props.items()]} if props else {})})
rnd=random.uniform;pick=random.choice
def two(key):return key+'_'+pick('ES') if key+'_S' in MAN else key+'_E' if key+'_E' in MAN else key
# ---- isometric grid helpers (cell centre spacing 64*S x 32*S) ----
def grid_origin(cx,cy,A,B):ci,cj=(A-1)/2,(B-1)/2;return cx-(ci-cj)*64*S,cy-(ci+cj)*32*S
def cell(o,i,j):return o[0]+(i-j)*64*S,o[1]+(i+j)*32*S
def enclosure(cx,cy,A,B,families,gates={},corner=None,ruined=0.0):
    """Walls round an A x B iso cell block. gates: {'N'|'S'|'E'|'W': (start,count)} openings."""
    o=grid_origin(cx,cy,A,B);off={'N':(32*S,-16*S),'S':(-32*S,16*S),'W':(-32*S,-16*S),'E':(32*S,16*S)};placed=[]
    sides={'N':[(i,0) for i in range(A)],'S':[(i,B-1) for i in range(A)],'W':[(0,j) for j in range(B)],'E':[(A-1,j) for j in range(B)]}
    for side,cells in sides.items():
        g=gates.get(side)
        for k,(i,j) in enumerate(cells):
            if g and g[0]<=k<g[0]+g[1]:continue
            if ruined and random.random()<ruined:continue
            x,y=cell(o,i,j);fam=pick(families);place(fam+'_'+side,x+off[side][0],y+off[side][1],S);placed.append((x,y))
    vert={'top':cell(o,0,0),'right':cell(o,A-1,0),'bottom':cell(o,A-1,B-1),'left':cell(o,0,B-1)}
    vert={'top':(vert['top'][0],vert['top'][1]-32*S),'right':(vert['right'][0]+64*S,vert['right'][1]),'bottom':(vert['bottom'][0],vert['bottom'][1]+32*S),'left':(vert['left'][0]-64*S,vert['left'][1])}
    if corner:
        for name,(x,y) in vert.items():place(corner if isinstance(corner,str) else pick(corner),x,y,.8)
    return o,vert
def gate_point(o,A,B,side,start,count):
    k=start+(count-1)/2
    if side=='S':x,y=cell(o,k,B-1);return x-32*S,y+16*S
    if side=='E':x,y=cell(o,A-1,k);return x+32*S,y+16*S
    if side=='N':x,y=cell(o,k,0);return x+32*S,y-16*S
    x,y=cell(o,0,k);return x-32*S,y-16*S
def house(cx,cy,n=2,sc=1.1,walls=('Wall-A1','Wall-A7')):
    """Closed stone house (n x n cells, n=1|2) with a door on the front-left wall and a thatched roof (Desert Biome refs)."""
    def c(i,j):return cx+(i-j-(0 if n==1 else 0))*64*sc,cy+(i+j-(n-1))*32*sc
    off={'N':(32,-16),'S':(-32,16),'W':(-32,-16),'E':(32,16)}
    for side,cells in {'N':[(i,0) for i in range(n)],'W':[(0,j) for j in range(n)],'E':[(n-1,j) for j in range(n)],'S':[(i,n-1) for i in range(n)]}.items():
        for i,j in cells:
            x,y=c(i,j);fam='Door-A1' if side=='S' and i==0 else pick(walls);place(fam+'_'+side,x+off[side][0]*sc,y+off[side][1]*sc,sc)
    roof=[('Roof-A9_E',0,0)] if n==1 else [('Roof-A1_E',1,0),('Roof-A1_E',1,1),('Roof-A1_S',0,1),('Roof-A1_S',1,1)]
    for k,i,j in roof:x,y=c(i,j);place(k,x,y+MAN[k]['sort']*sc,sc,layer='depth',solid=False)
    zone(cx,cy,70*n*sc)
def tiles_in(cx,cy,rx,ry,key,jitter=0.0,keep=None):
    """Fill iso cells whose centres fall inside an ellipse with ground tiles (sorted for correct overlap)."""
    out=[];n=int(max(rx,ry)/(32*S))+3;o=(cx,cy)
    for i in range(-n,n+1):
        for j in range(-n,n+1):
            x,y=cell(o,i,j)
            if ((x-cx)/rx)**2+((y-cy)/ry)**2<=1+random.uniform(-jitter,jitter) and (keep is None or keep(x,y)):out.append((y,x))
    for y,x in sorted(out):place(key if isinstance(key,str) else pick(key),x,y,S,collection='ground')
    return len(out)
PATCHES={}
def patch(kind,x,y,rx,ry):
    """Organic ground patch drawn by map-render.js (grass/rubble/scorch/...), stored as a point landmark kind-N."""
    PATCHES[kind]=PATCHES.get(kind,0)+1;lm('%s-%d'%(kind,PATCHES[kind]),x,y,rx=round(rx,1),ry=round(ry,1),seed=round(rnd(0,6.28),3))
PIVOT={};BUILDINGS=[]  # pivots of placed objects; iso diamonds of buildings/pyramids (for the final cleanup)
zones=[]  # keep-out circles for the open-desert scatter
SHRINE_SPOTS=[]
def zone(x,y,r):zones.append((x,y,r))
def scatter_free(x,y,pad=0):return 150<x<W-150 and 150<y<H-150 and all(math.hypot((x-zx),(y-zy)*1.3)>zr+pad for zx,zy,zr in zones)
# ================= Oct 16 (user): bigger 9600x7200 map, one area per Desert Biome reference shot =================
# Every area is composed only from 2D Desert Fantasy tileset pieces. Gameplay landmarks: forge, player-spawn,
# camp-1..3, shrine-1..3, merchant-1, rift-1, plus arena-* hints that arenas.js uses for the pits and colosseum.
def block(key,x,y,sc=S,solid=True):
    """Whole-cell kit block (pyramids, cubes, columns) with a diamond collider scaled to the sprite."""
    i=place(key,x,y,sc,solid=False,layer='depth')
    if solid and MAN[key].get('solid'):hw,hh=56*sc,28*sc;collider(i,[(x-hw,y),(x,y-hh),(x+hw,y),(x,y+hh)],key)
    return i
def vine(x,y,side,sc=S):place('WallFlora-A%d_%s'%(pick([1,2,3,6,9,11,12,13]),side),x,y+1,sc,layer='depth',solid=False)
def roofed(cx,cy,n=2,sc=1.1,walls=('Wall-A1','Wall-A7'),roof='A',vines=0.0,door='Door-A1'):
    """Closed house like house() but with a chosen wall family, roof family (A thatch, E dark wood, F green) and optional red vines."""
    def c(i,j):return cx+(i-j)*64*sc,cy+(i+j-(n-1))*32*sc
    off={'N':(32,-16),'S':(-32,16),'W':(-32,-16),'E':(32,16)}
    for side,cells in {'N':[(i,0) for i in range(n)],'W':[(0,j) for j in range(n)],'E':[(n-1,j) for j in range(n)],'S':[(i,n-1) for i in range(n)]}.items():
        for i,j in cells:
            x,y=c(i,j);fam=door if side=='S' and i==0 else pick(walls);place(fam+'_'+side,x+off[side][0]*sc,y+off[side][1]*sc,sc)
            if vines and side in 'SE' and random.random()<vines:vine(x+off[side][0]*sc,y+off[side][1]*sc,side,sc)
    big={'A':'Roof-A1','E':'Roof-E1','F':'Roof-F1'}[roof];small={'A':'Roof-A9','E':'Roof-E6','F':'Roof-F6'}[roof]
    parts=[(small+'_E',0,0)] if n==1 else [(big+'_E',1,0),(big+'_E',1,1),(big+'_S',0,1),(big+'_S',1,1)]
    for k,i,j in parts:x,y=c(i,j);place(k,x,y+MAN[k]['sort']*sc,sc,layer='depth',solid=False)
    BUILDINGS.append((cx,cy,n*64*sc+20,n*32*sc+14))
    zone(cx,cy,70*n*sc)
def flat_house(cx,cy,A,B,sc=S,walls=('Wall-H1','Wall-H3','Wall-H9'),door='Wall-H21',windows=('Wall-H22','Wall-H13'),gate='S',vines=0.0):
    """Adobe/plaster block building (w7TV_K, 5mmn+c): walls on all four sides of an A x B cell block, one door, some windows."""
    o=grid_origin(cx,cy,A,B);off={'N':(32*S,-16*S),'S':(-32*S,16*S),'W':(-32*S,-16*S),'E':(32*S,16*S)}
    sides={'N':[(i,0) for i in range(A)],'S':[(i,B-1) for i in range(A)],'W':[(0,j) for j in range(B)],'E':[(A-1,j) for j in range(B)]}
    for side,cells in sides.items():
        for k,(i,j) in enumerate(cells):
            x,y=cell(o,i,j);fam=door if side==gate and k==len(cells)//2 else pick(windows) if side in 'SE' and random.random()<.3 else pick(walls)
            place(fam+'_'+side,x+off[side][0],y+off[side][1],S)
            if vines and side in 'SE' and random.random()<vines:vine(x+off[side][0],y+off[side][1],side)
    for i in range(A):
        for j in range(B):x,y=cell(o,i,j);k='Wall-H5_E';place(k,x,y+MAN[k]['sort']*S,S,layer='depth',solid=False)
    BUILDINGS.append((cx,cy,(A+B)*32*S+20,(A+B)*16*S+14))
    zone(cx,cy,(A+B)*26)
    return o
def ring_of(keys,cx,cy,rx,ry,n,sc=(.9,1.2),gaps=(),jit=.08,solid=None):
    for k in range(n):
        a=k/n*2*math.pi
        if any(abs(((a-g+math.pi)%(2*math.pi))-math.pi)<w for g,w in gaps):continue
        r=1+rnd(-jit,jit);place(pick(keys),cx+math.cos(a)*rx*r,cy+math.sin(a)*ry*r,rnd(*sc),solid=solid)
def cluster(keys,cx,cy,rx,ry,n,sc=(.85,1.15),keep=None):
    for _ in range(n):
        a,d=rnd(0,2*math.pi),math.sqrt(random.random());x,y=cx+math.cos(a)*rx*d,cy+math.sin(a)*ry*d
        if keep is None or keep(x,y):place(pick(keys),x,y,rnd(*sc))
def water(x,y,rx,ry,seed,collide=True):
    """Organic water body drawn by map-render.js; collider follows the same outline, inset."""
    WATER[0]+=1;lm('water-%d'%WATER[0],x,y,rx=rx,ry=ry,seed=seed)
    if collide:
        owner=place('Misc-B24_E',x,y,.01,solid=False,layer='ground')
        collider(owner,[(x+math.cos(a)*rx*.9*shapeR(a,seed),y+math.sin(a)*ry*.9*shapeR(a,seed)) for a in (i/28*2*math.pi for i in range(28))],'Water %d'%WATER[0])
    zone(x,y,max(rx,ry)+60)
WATER=[0]
def shapeR(a,seed):return 1+.09*math.sin(3*a+seed)+.05*math.sin(5*a+2*seed)+.035*math.sin(8*a+3*seed)
def river(points,r,seed0,bridges=()):
    """One river body (map-render merges the overlapping members); colliders skipped at each bridge so it can be crossed."""
    for k,(x,y) in enumerate(points):
        near=any(math.hypot(x-bx,y-by)<r*1.7 for bx,by,_ in bridges)
        water(x,y,r*rnd(.97,1.04),r*.62*rnd(.97,1.04),seed0+k*.37,collide=not near)
    for bx,by,horizontal in bridges:bridge(bx,by,r,horizontal)
CAUSE=[0]
def bridge(x,y,r,across_h):
    """Raised stone causeway across the river along the down-right iso axis (user ref), obelisks at one end, a torch at
    the other, loose flagstones and rubble around both ends, and a sand path beyond."""
    ux,uy=.894,.447;vx,vy=-ux,uy;L=(r*2.0)/(uy if not across_h else ux)+220;Wd=118
    CAUSE[0]+=1;lm('causeway-%d'%CAUSE[0],x,y,len=round(L),wid=Wd,ux=ux,uy=uy,rx=round(L/2+Wd),ry=round(L*uy/2+Wd),seed=CAUSE[0]*1.3)
    end=lambda sd,b:(x+ux*sd*L/2+vx*b,y+uy*sd*L/2+vy*b)
    for b in (-Wd/2-34,Wd/2+34):px,py=end(-1,b);place('Stone-A24_E',px+ux*20,py+uy*20,.85)
    px,py=end(1,Wd/2+30);place('Torch2',px-ux*20,py-uy*20,1.0)
    for sd in (-1,1):
        px,py=end(sd,0);lm('plaza-%d'%(60+CAUSE[0]*2+(sd>0)),px+ux*sd*70,py+uy*sd*70,rx=rnd(110,150),ry=rnd(55,75),seed=7+CAUSE[0]+sd)
        for _ in range(3):patch('rubble',px+ux*sd*rnd(60,180)+rnd(-50,50),py+uy*sd*rnd(60,180)+rnd(-25,25),rnd(25,45),rnd(12,22))
        for _ in range(2):place(pick(['Stone-B4_E','Misc-A2_E','Stone-A3_E']),px+ux*sd*rnd(90,170)+vx*rnd(-90,90),py+uy*sd*rnd(90,170)+vy*rnd(-90,90),rnd(.7,.9))
        for k in range(1,5):
            d=L/2+150+k*62;patch('path',x+ux*sd*d+rnd(-12,12),y+uy*sd*d+rnd(-8,8),rnd(60,85),rnd(30,42))
def along(p,q,step):
    n=max(1,int(math.hypot(q[0]-p[0],q[1]-p[1])/step));return [(p[0]+(q[0]-p[0])*t/n,p[1]+(q[1]-p[1])*t/n) for t in range(n+1)]
GREEN=['Tree-E1_E','Tree-E1_S','Tree-E2_E','Tree-E2_S','Tree-E3_E','Tree-C1_E','Tree-C1_S']
PALMS=['Tree-A1_E','Tree-A1_S','Tree-A2_E','Tree-A3_E','Tree-A4_E','Tree-A4_S']
TEAL=['Flora-A%d_E'%i for i in range(1,8)];ORANGE=['Flora-B%d_E'%i for i in range(1,7)];TUFTS=['Flora-C1_E','Flora-C2_E','Flora-C3_E','Flora-C4_E','Flora-C6_E']
THORNS=['Misc-B62_E','Misc-B63_E','Misc-B64_E','Misc-B65_E','Misc-B66_S','Misc-B63_S']
CACTI=['Tree-D1_E','Tree-D2_E','Tree-D3_E','Tree-D1_S']

# ---- 1. Forge Sanctuary: statue clearing inside a green grove (ebInh6) ----
FX,FY=4800,3500;lm('forge',FX,FY,radius=100);lm('player-spawn',FX,FY+560);zone(FX,FY,760)
patch('meadow',FX,FY-20,700,400)
lm('plaza-1',FX,FY-120,rx=330,ry=170,seed=2.1)
place('Stone-A23_E',FX,FY-150,1.25)
for k,(dx,dy) in zip(('Stone-A21_E','Stone-A16_E','Stone-A22_E'),[(-190,-150),(190,-150),(150,-40)]):place(k,FX+dx,FY+dy,1.0)
for dx,dy in [(-60,-110),(70,-105),(-40,-80),(50,-85),(90,-120)]:place(pick(['Misc-A2_E','Misc-A3_E','Misc-A4_E']),FX+dx,FY+dy,.8)
place('Chest-B1_E',FX-300,FY+20,.9)
ring_of(GREEN,FX,FY-20,620,380,44,sc=(1.0,1.35),gaps=((0,.3),(math.pi/2,.32),(math.pi,.3),(3*math.pi/2,.3)))
ring_of(GREEN,FX,FY-20,720,450,40,sc=(1.0,1.4),gaps=((math.pi/2,.25),))
cluster(['Tree-E3_E','Stone-A2_E','Stone-A20_E','Stone-A17_E'],FX,FY-20,660,400,10)
cluster(TUFTS,FX,FY,560,330,40)

# ---- 2. Raider Stockade (qvUETa) with the ruined colonnade approach (Settings ref) ----
AX,AY,A,B=4800,1150,14,10;zone(AX,AY,760)
o,v=enclosure(AX,AY,A,B,['Wall-B1','Wall-B2','Wall-B3','Wall-B4'],gates={'S':(5,4)})
for name,(x,y) in v.items():place(pick(['Misc-B55_E','Misc-B56_E']),x,y,.85)
gx,gy=gate_point(o,A,B,'S',5,4);lm('camp-2',AX-40,AY+60)
place('Misc-D4_E',AX+120,AY-30,1.2);place('Misc-A1_E',AX+250,AY-40,1.1);lm('plaza-2',AX+180,AY-20,rx=120,ry=60,seed=8.1)
for dx,dy,k in [(-240,-40,'Misc-B57_E'),(-180,60,'Misc-B57_S'),(250,90,'Misc-B15_E'),(-60,140,'Misc-D3_E'),(-330,90,'Misc-B9_E'),(-260,-90,'Chest-A1_E'),(200,-110,'Misc-B1_E')]:place(k,AX+dx,AY+dy,.85)
for _ in range(9):x,y=cell(o,rnd(2,A-3),rnd(2,B-3));place(pick(['Misc-D1_E','Misc-D6_E','Misc-D7_S','Misc-B8_E']),x,y,.85)
for _ in range(6):x,y=cell(o,rnd(2,A-3),rnd(2,B-3));patch('scorch',x,y,rnd(40,75),rnd(22,38))
for sd in (-1,1):place('Torch2',gx+sd*2.7*64*S,gy+sd*2.7*32*S+14,1.0)
roofed(v['right'][0]+150,v['right'][1]+260,2,1.1,roof='A')
cluster(CACTI,AX,AY,900,500,10,keep=lambda x,y:math.hypot(x-AX,(y-AY)*1.4)>720)
# colonnade approach: two rows of round columns, long broken block wall, statues, orange brush (Settings, mTEb+y)
CX0,CY0=gx-40,gy+260;lm('plaza-3',CX0-60,CY0+260,rx=260,ry=110,seed=3.3)
for step in range(7):
    for side in (-1,1):
        x,y=CX0-step*70+side*110,CY0+step*70*.5+side*55
        if random.random()<.85:block('Wall-J10_E',x,y,.55)
        else:block('Wall-J11_E',x,y,.75)
for k in range(9):x,y=CX0+250-k*60,CY0+40+k*30;(block if random.random()<.75 else (lambda key,x,y,sc:place('Wall-J19_E',x,y,.8)))(pick(['Wall-J1_E','Wall-J12_E','Wall-J8_E','Wall-J9_E']),x,y,.6)
for dx,dy,k in [(-250,40,'Misc-C5_E'),(-330,90,'Misc-C6_E'),(120,330,'Misc-C6_S'),(-420,260,'Misc-C5_S')]:place(k,CX0+dx,CY0+dy,.9)
for _ in range(10):x,y=CX0+rnd(-500,300),CY0+rnd(60,520);patch('clay',x,y,rnd(50,110),rnd(25,55));cluster(ORANGE,x,y,60,30,2)
cluster(['Wall-J19_E','Wall-J20_E','Wall-J13_E','Wall-J14_E'],CX0-100,CY0+260,380,200,14)
zone(CX0-100,CY0+260,420)

# ---- 3. Pyramid Ruins (mTEb+y): two pyramids, colonnade court, statues, orange brush; shrine-1 in the court ----
PX,PY=7600,1250;zone(PX,PY,1000)
def pyramid_at(key,x,y,sc):
    place(key.replace('_E','-Shadow_E'),x,y,sc,solid=False,layer='ground')  # baked soft ground shadow (Oct 16)
    i=place(key,x,y,sc,solid=False,layer='depth');n=MAN[key]['cells'];b=MAN[key].get('baked',1);hw,hh=n*64*sc*b*.98,n*32*sc*b*.98;BUILDINGS.append((x,y,hw+30,hh+20));collider(i,[(x-hw,y),(x,y-hh),(x+hw,y),(x,y+hh)],key)
pyramid_at('Pyramid-Big_E',PX-250,PY-180,1.0);pyramid_at('Pyramid-Small_E',PX-1000,PY+260,1.0)  # sprites are pre-scaled (.85/.8)
lm('plaza-4',PX+250,PY+260,rx=420,ry=180,seed=4.4)
for step in range(6):
    for side in (-1,1):block('Wall-J10_E',PX+120+step*80+side*120,PY+180+step*40-side*60,.55)
for k in range(12):x,y=PX+380+k*64,PY+40+k*32;block(pick(['Wall-J1_E','Wall-J12_E','Wall-J1_E','Wall-J4_E']),x,y,.62)
for k in range(5):x,y=PX+420+k*64,PY+280+k*32;block(pick(['Wall-J16_E','Wall-J9_E','Wall-J17_E']),x,y,.6)
place('Stone-A23_S',PX-520,PY+330,1.15);place('Stone-A24_E',PX+330,PY-60,.9);place('Stone-A24_E',PX-40,PY+430,.9)
for k in range(4):place('Misc-C6_E',PX-700+k*70,PY+560+k*35,.85)
for dx,dy in [(-80,120),(60,60)]:place('Misc-C5_E',PX+dx,PY+dy,.9)
for _ in range(14):x,y=PX+rnd(-200,800),PY+rnd(300,700);patch('clay',x,y,rnd(40,90),rnd(20,45));cluster(ORANGE,x,y,50,25,2)
cluster(['Wall-J19_E','Wall-J20_E','Wall-J18_E','Misc-A3_E','Misc-A9_E','Chest-A1_E'],PX+300,PY+520,420,160,16)
SHRINE_SPOTS.append((PX+300,PY+330))

# ---- 4. Red-vine plaster town (5mmn+c): plaster houses with dark roofs and vines, stairs, gallows cage, well; shrine-3 ----
RX,RY=2900,2150;zone(RX,RY,820)
lm('plaza-5',RX,RY+40,rx=380,ry=180,seed=5.5);patch('clay',RX+260,RY-80,180,80)
for hx,hy,n in [(RX-430,RY-300,2),(RX+420,RY-330,2),(RX-520,RY+280,2),(RX+470,RY+330,2),(RX-60,RY-460,1),(RX+60,RY+470,1)]:roofed(hx,hy,n,1.15,walls=('Wall-G2','Wall-G1','Wall-G6'),roof='E',vines=.8,door='Wall-G4')
place('Misc-B29_E',RX-120,RY+40,.9);place('Misc-B42_E',RX+170,RY-10,.9);place('Stone-A14_E',RX+40,RY-140,.9);place('Misc-B41_E',RX-260,RY+110,.85)
for k in range(5):place(pick(['Tree-B2_E','Tree-B3_E','Tree-B2_S']),RX-120+k*70,RY-230+k*35,.85)
cluster(['Misc-A9_E','Misc-A3_E','Misc-B1_E','Misc-B2_S','Chest-A1_E','Misc-B8_E'],RX,RY+40,330,150,10)
SHRINE_SPOTS.append((RX+90,RY+110))

# ---- 5. Raider Outpost on a peninsula (EK74Ge): palisade, watchtowers, banners, teepees, yurt, thatched hut; camp-1 ----
OX,OY=1500,1250;zone(OX,OY,800)
# Oct 18 (user): the top-left Butcher pit sat in this lake; lakes 1, 2 and 4 are now dry ground (DRY_LAKES, dressed at the
# end so the earlier random layout is unchanged). Their zones stay so the scatter is identical; only lake 3 keeps water.
DRY_LAKES=[]
for k,(dx,dy,rx,ry) in enumerate([(-820,-300,330,300),(-760,120,300,320),(-900,480,280,260),(-560,-560,300,200)]):
    if k==2:water(OX+dx,OY+dy,rx,ry,1.7+k)
    else:WATER[0]+=1;zone(OX+dx,OY+dy,max(rx,ry)+60);DRY_LAKES.append((OX+dx,OY+dy,rx,ry))
patch('clay',OX+120,OY+40,190,90)
for k in range(10):
    x,y=OX-380+k*80,OY+260+k*12
    if k in (4,5):continue
    place(pick(['Wall-B7_S','Wall-B8_S']),x,y,S)
    if k%3==0:place(pick(['Misc-B44_E','Misc-B45_E']),x+10,y+30,.85)
for x,y in [(OX-300,OY+300),(OX+20,OY+330),(OX+330,OY+360)]:place(pick(['Misc-B55_E','Misc-B56_E']),x,y,.85)
roofed(OX-60,OY-160,2,1.1,roof='A');place('Misc-D8_E',OX-40,OY-60,.9)
for x,y in [(OX+200,OY-120),(OX+290,OY+10),(OX+120,OY+110)]:place(pick(['Misc-B43_E','Misc-B51_E']),x,y,.95)
place('Misc-B46_E',OX-300,OY-40,.95);place('Misc-B47_E',OX+330,OY+180,.85);place('FirePlace',OX-120,OY+120,1.0)
place('Misc-C14_E',OX-60,OY-520,1.3);cluster(PALMS,OX+40,OY-460,260,120,5);cluster(TUFTS+['Misc-E1_E'],OX,OY,420,240,14)
lm('camp-1',OX-40,OY+70)

# ---- 6. Oasis Island (2j48s2): lake around a palm island, boat, dock house on stilts, thorns and rock arches ----
LX,LY=1350,3600;zone(LX,LY,950)
for k,(dx,dy,rx,ry) in enumerate([(-420,-120,360,300),(-160,-390,380,220),(260,-330,330,220),(420,40,280,300),(220,380,380,220),(-220,400,360,220),(-470,220,260,240)]):water(LX+dx,LY+dy,rx,ry,1.1+k)
lm('plaza-6',LX,LY,rx=200,ry=110,seed=6.1);patch('meadow',LX-20,LY+10,150,80)
cluster(PALMS,LX,LY,150,80,7,sc=(.9,1.2));place('Chest-A1_E',LX+80,LY+40,.85);place('Stone-A2_E',LX-60,LY+50,.8);place('Tree-E3_E',LX+40,LY+60,.8)
place('Misc-B49_E',LX+250,LY+230,.95,solid=False)
HX,HY=LX+780,LY+80;roofed(HX,HY,2,1.05,walls=('Wall-D1','Wall-D7','Wall-D3'),roof='E')
for k in range(6):place('Misc-B13_E',HX-140-k*30,HY+110+k*15,1.05,solid=False,layer='ground')
cluster(PALMS,HX+120,HY-260,220,120,6);cluster(THORNS,LX+1000,LY-300,250,140,6);place('Misc-C14_E',LX+1050,LY+260,1.2);place('Stone-B8_E',LX+1150,LY-80,1.1)
cluster(['Misc-D8_E','Misc-D7_E','Tree-E4_E','Tree-E5_E'],LX+900,LY,300,200,6)

# ---- 7. Bone-teepee camp under adobe cliffs (ijQ5jp); camp-3 ----
BX,BY=1800,5900;zone(BX,BY,850)
for _ in range(5):patch('clay',BX+rnd(-350,350),BY+rnd(-200,200),rnd(160,260),rnd(80,130))
flat_house(BX+560,BY-520,13,3,gate='X',windows=('Wall-H2','Wall-H8'),walls=('Wall-H1','Wall-H3','Wall-H9','Wall-H2'))  # raised adobe mesa the camp shelters under
place('Misc-C14_E',BX+420,BY-330,1.3);place('Misc-D8_E',BX+430,BY-470,1.0)
for x,y in [(BX-120,BY-60),(BX+100,BY+20),(BX+260,BY+140),(BX-40,BY+190),(BX+330,BY-100)]:place(pick(['Misc-B43_E','Misc-B51_E','Misc-B47_E']),x,y,.95)
place('Misc-B6_E',BX-40,BY-160,.95);place('Chest-B1_E',BX-140,BY+70,.85);place('FirePlace',BX+130,BY+110,1.0);place('Misc-B21_E',BX-200,BY+200,.85)
for x,y in [(BX+280,BY-260),(BX+300,BY+260)]:place(pick(['Misc-B44_E','Misc-B45_E']),x,y,.9)
for k,(dx,dy) in enumerate([(-520,40),(-430,260),(-300,-280),(-560,-200),(-200,420),(120,480)]):place(pick(['Misc-D3_E','Misc-D4_E','Misc-D5_E','Misc-D2_E']),BX+dx,BY+dy,rnd(1.0,1.25))
place('Misc-A1_E',BX-620,BY+330,1.3);place('Stone-A6_E',BX-700,BY-260,1.0)
cluster(CACTI,BX,BY,780,460,16,keep=lambda x,y:math.hypot(x-BX,(y-BY)*1.5)>360)
cluster(['Misc-D1_E','Misc-D6_E','Misc-D7_S','Tree-E4_E','Tree-E5_E'],BX,BY,700,420,12)
lm('camp-3',BX+40,BY+40)

# ---- 8. Thorn Wastes (l2E8YR): cracked ground ringed by thorn vines, rock pillars, ribcages, blood pit; shrine-2 ----
TX,TY=6100,6250;zone(TX,TY,820)
patch('cracks',TX,TY,620,330)
ring_of(THORNS,TX,TY,700,380,34,sc=(1.0,1.35),gaps=((math.pi*1.5,.35),(0,.25)))
ring_of(THORNS,TX,TY,800,440,30,sc=(1.0,1.4))
for dx,dy in [(-300,-120),(260,-180),(180,190),(-200,210),(420,40)]:place(pick(['Stone-B1_E','Stone-B3_E','Stone-B8_E']),TX+dx,TY+dy,rnd(1.0,1.3))
cluster(THORNS,TX,TY,420,220,7,sc=(.8,1.0),keep=lambda x,y:math.hypot(x-TX,(y-TY)*1.8)>170)
for dx,dy in [(-420,60),(340,250),(-80,-250)]:place(pick(['Misc-D1_E','Misc-D2_E','Misc-D3_E']),TX+dx,TY+dy,.95)
place('Stone-A8_E',TX-160,TY+40,1.0);cluster(TUFTS+TEAL[:2],TX,TY,520,280,16)
SHRINE_SPOTS.append((TX+60,TY-20))

# ---- 9. Market Town (w7TV_K): adobe blocks with flat roofs, central thatched hall, awning stalls, carts, well; merchant-1 ----
MX,MY=7700,3600;zone(MX,MY,980)
lm('plaza-7',MX,MY+40,rx=520,ry=260,seed=7.7);lm('merchant-1',MX-60,MY+180)
roofed(MX+40,MY-60,2,1.6,walls=('Wall-H1','Wall-H3'),roof='A',door='Wall-H21')
for hx,hy,a,b in [(MX-620,MY-420,4,3),(MX+600,MY-460,4,3),(MX-700,MY+380,3,3),(MX+700,MY+420,4,3),(MX-120,MY-720,5,2),(MX+80,MY+760,4,2)]:flat_house(hx,hy,a,b)
for k,(dx,dy) in enumerate([(-330,-150),(-260,-60),(-380,60),(330,-170),(390,-40),(300,120),(-200,240),(160,300),(-60,-300)]):place(pick(['Misc-B10_E','Misc-B12_E','Misc-B14_E','Misc-B17_E','Misc-B18_E','Misc-B19_E','Misc-B37_E','Misc-B38_E']),MX+dx,MY+dy,.9)
place('Misc-B6_E',MX+470,MY+80,.95);place('Misc-B11_E',MX-450,MY-260,.9);place('Misc-B42_E',MX+250,MY+260,.9);place('Misc-B29_E',MX-300,MY+350,.85)
for x,y in [(MX-180,MY-200),(MX+200,MY-210),(MX-240,MY+180),(MX+260,MY+170)]:place('Torch2',x,y,.9)
cluster(['Misc-B1_E','Misc-B2_S','Misc-B3_E','Misc-A9_E','Misc-A3_E','Misc-B20_E','Misc-B9_E','Misc-B39_E','Misc-B40_E'],MX,MY,560,300,26,keep=lambda x,y:math.hypot(x-MX-40,(y-MY+60)*1.4)>260)

# ---- 10. River docks (xf1isu): river on the east edge, plank docks with stalls, boats, paved quay, torches, obelisks ----
DX=8950;river(along((DX,2300),(DX-120,3300),80)+along((DX-120,3300),(DX+60,4700),80)[1:],190,2.0,bridges=[(DX-115,3330,True),(DX+30,4380,True)])
for k in range(8):place('Misc-B13_E',DX-330+k*8,2650+k*90,1.0,solid=False,layer='ground')
for x,y in [(DX-120,2900),(DX-90,3500),(DX+20,4100)]:place(pick(['Misc-B49_E','Misc-B50_E']),x,y,.95,solid=False)
flat_house(DX-650,2750,4,2,gate='E')
for k,(dx,dy) in enumerate([(-420,-130),(-360,-40),(-300,50)]):place(pick(['Misc-B17_E','Misc-B19_E','Misc-B10_E']),DX+dx,3000+dy,.9)
lm('plaza-8',DX-480,3800,rx=260,ry=130,seed=8.8)
for y in (3640,3960):place('Torch2',DX-320,y,1.0)
place('Stone-A24_E',DX-260,3500,.95);place('Stone-A24_E',DX-260,4150,.95);cluster(GREEN,DX+260,3500,120,900,14)

# ---- 11. Stepped pit temple (exUXU1): paved platform, sunken stair pit, four pillars, two braziers, stairs; rift-1 ----
QX,QY=7600,5800;zone(QX,QY,640)
lm('plaza-9',QX,QY,rx=360,ry=190,seed=9.9);lm('crater-1',QX,QY,rx=170,ry=95,seed=4.2);lm('rift-1',QX,QY)
for k in range(28):
    a=k/28*2*math.pi
    if abs(((a-2.4+math.pi)%(2*math.pi))-math.pi)<.3:continue
    x,y=QX+math.cos(a)*420,QY+math.sin(a)*220;block(pick(['Wall-J8_E','Wall-J1_E']),x,y,.42)
for a in (0.6,2.2,3.9,5.5):place('Misc-C7_E',QX+math.cos(a)*300,QY+math.sin(a)*160,1.0)
block('Wall-G16_S',QX+math.cos(2.4)*440,QY+math.sin(2.4)*230,.9)
for dx,dy in [(-560,60),(150,320)]:place('Misc-C8_E',QX+dx,QY+dy,1.0)
cluster(['Wall-J19_E','Wall-J20_E','Stone-A9_E','Stone-A10_E'],QX,QY,700,380,10,keep=lambda x,y:math.hypot(x-QX,(y-QY)*1.9)>470)

# ---- 12. Ruined bazaar quarter (osKs+F): orange brush, crumbled low walls, broken paving, pillars, pots, chests ----
ZX,ZY=4300,6150;zone(ZX,ZY,900)
for k in range(5):lm('plaza-%d'%(10+k),ZX+rnd(-600,600),ZY+rnd(-300,300),rx=rnd(150,260),ry=rnd(70,120),seed=10+k)
for _ in range(14):x,y=ZX+rnd(-750,750),ZY+rnd(-380,380);patch('clay',x,y,rnd(80,170),rnd(40,80));cluster(ORANGE,x,y,90,45,4)
for _ in range(9):
    x,y=ZX+rnd(-650,650),ZY+rnd(-330,330);side=pick('ES')
    for k in range(random.randint(2,5)):place(pick(['Wall-A3','Wall-A9'])+'_'+side,x+(k*48 if side=='E' else -k*48),y+(k*24),S)
cluster(['Wall-J13_E','Wall-J14_E','Wall-J15_E','Wall-J19_E','Wall-J20_E'],ZX,ZY,760,380,22)
for dx,dy in [(-400,-160),(250,80),(520,-200),(-120,240)]:place('Misc-C7_E',ZX+dx,ZY+dy,1.0)
cluster(['Misc-A2_E','Misc-A3_E','Misc-A9_E','Chest-A1_E','Misc-B11_E','Misc-B27_E','Misc-C6_E'],ZX,ZY,700,360,18)

# ---- 13. Green forest (yQsaVI) with a river crossing (yWgidJ) and a woodland cottage (nd+OKF) ----
GX,GY=2900,4500;zone(GX,GY,1100)
for k in range(9):patch('meadow',GX+rnd(-800,800),GY+rnd(-450,450),rnd(380,620),rnd(200,320))
for _ in range(30):
    x,y=GX+rnd(-1000,1000),GY+rnd(-560,560)
    if math.hypot(x-GX-500,(y-GY+200)*1.5)<360 or abs(y-(GY+440))<170 or math.hypot(x-GX,(y-GY)*1.6)<160:continue
    cluster(GREEN,x,y,190,100,random.randint(8,13),sc=(1.0,1.4));cluster(TEAL,x,y+30,170,80,5);cluster(['Tree-E3_E','Tree-B1_E'],x,y,200,100,2)
cluster(ORANGE,GX,GY,900,500,14);cluster(['Stone-A1_E','Stone-A12_E','Stone-B4_E'],GX,GY,900,500,8)
river(along((GX-1100,GY+430),(GX+1050,GY+470),80),150,5.0,bridges=[(GX+80,GY+450,False),(GX-700,GY+437,False)]);place('Tree-E5_E',GX-700,GY+300,1.0)
CX2,CY2=GX+500,GY-200;roofed(CX2,CY2,2,1.15,walls=('Wall-D1','Wall-D7','Wall-D1'),roof='F')
for k in range(7):place('Wall-E15_S',CX2-330+k*44,CY2+150+k*22,S)
for dx,dy,k in [(120,110,'Misc-A3_E'),(200,90,'Chest-A1_E'),(260,140,'Misc-B9_E'),(300,60,'Misc-B20_E'),(-140,180,'Tree-E5_E')]:place(k,CX2+dx,CY2+dy,.9)

for name,x,y,r in [('arena-ravager-pit',3000,6750,380),('arena-wyrm-pit',8700,6650,430),('arena-colosseum',6250,4600,600)]:zone(x,y,r+120)
# ---- 14. Open desert between the areas: rock outcrops, cacti, dead trees, bones, brush, rubble ----
def scatter(n,keys,scale,collection='props',pad=0,cluster_n=1,spread=60):
    done=0;tries=0
    while done<n and tries<n*60:
        tries+=1;x,y=rnd(150,W-150),rnd(150,H-150)
        if not scatter_free(x,y,pad):continue
        for _ in range(cluster_n):
            px,py=x+rnd(-spread,spread),y+rnd(-spread/2,spread/2)
            if scatter_free(px,py):place(pick(keys),px,py,rnd(*scale),collection=collection)
        done+=1
scatter(110,['Stone-A1_E','Stone-A2_E','Stone-A3_E','Stone-A12_E','Stone-A18_E','Stone-A20_E','Stone-B1_E','Stone-B3_E'],(.75,1.2),cluster_n=2,spread=90,pad=60)
scatter(70,CACTI,(.85,1.2),pad=40);scatter(50,['Tree-E1_E','Tree-E6_E','Tree-E6_S'],(.9,1.25),pad=40)
scatter(30,['Misc-D1_E','Misc-D2_E','Misc-D6_S','Misc-D7_E','Misc-D8_S'],(.8,1.05),pad=60)
scatter(28,THORNS,(.8,1.05),cluster_n=2,spread=70,pad=60)
scatter(320,['Misc-E1_E','Misc-E2_E','Misc-E3_E','Misc-E5_E','Misc-E7_E','Misc-E9_E','Misc-E11_E']+ORANGE[:3]+TUFTS,(.7,1.05))
n=0
while n<200:
    x,y=rnd(150,W-150),rnd(150,H-150)
    if scatter_free(x,y):patch('rubble',x,y,rnd(30,65),rnd(15,32));n+=1
n=0
while n<40:
    x,y=rnd(250,W-250),rnd(250,H-250)
    if scatter_free(x,y,pad=120):patch('clay',x,y,rnd(120,260),rnd(60,120));n+=1
n=0
while n<55:
    x,y=rnd(250,W-250),rnd(250,H-250)
    if not scatter_free(x,y,pad=120):continue
    for _ in range(random.randint(2,4)):rx=rnd(110,250);patch('grass',x+rnd(-170,170),y+rnd(-90,90),rx,rx*rnd(.48,.6))
    n+=1

# Oct 18: the dried lake beds by the Butcher pit: cracked clay, rubble and a few rocks (sand/rock ground, not water).
for x,y,rx,ry in DRY_LAKES:
    patch('clay',x,y,rx*.85,ry*.6)
    for _ in range(4):patch('rubble',x+rnd(-rx*.6,rx*.6),y+rnd(-ry*.4,ry*.4),rnd(40,80),rnd(20,38))
    for _ in range(3):
        a=rnd(0,2*math.pi);place(pick(['Stone-A1_E','Stone-A12_E','Stone-B4_E']),x+math.cos(a)*rx*.75,y+math.sin(a)*ry*.55,rnd(.8,1.1))
# ---- 15. Code-placed arenas (arenas.js reads these hints): pits on the outskirts, colosseum between forge and market ----
# Oct 18: Butcher and Prophet pits pinned where they used to land, so drying the lake doesn't move them.
for name,x,y,r in [('arena-ravager-pit',3000,6750,380),('arena-wyrm-pit',8700,6650,430),('arena-colosseum',6250,4600,600),('arena-butcher-pit',832,832,460),('arena-prophet-pit',8768,1152,460)]:lm(name,x,y)
for k,(x,y) in enumerate(SHRINE_SPOTS):lm('shrine-%d'%(k+1),x,y)

# ---- Oct 16 (user: "stuff floating / not set up correctly"): drop loose decor that ended up in water or inside a building ----
WATERS=[(o['x'],o['y'],{q['name']:q['value'] for q in o['properties']}) for o in landmarks if o['name'].startswith('water-')]
def in_water(x,y):return any(math.hypot((x-wx)/pr['rx'],(y-wy)/pr['ry'])<1.02*shapeR(math.atan2((y-wy)/pr['ry'],(x-wx)/pr['rx']),pr['seed']) for wx,wy,pr in WATERS)
def in_building(x,y):return any(abs(x-bx)/hw+abs(y-by)/hh<1 for bx,by,hw,hh in BUILDINGS)
WATER_OK=('Misc-B13','Misc-B49','Misc-B50','Misc-B24','Wall-E15','Torch2')
STRUCT=('wall','roof','block','vine')
drop=set()
for o in scenery:
    x,y,key=PIVOT[o['id']];kind=MAN[key].get('kind')
    if kind in STRUCT or key.startswith(('Pyramid','Door','Wall')):continue
    if (in_water(x,y) and not key.startswith(WATER_OK)) or in_building(x,y):drop.add(o['id'])
scenery[:]=[o for o in scenery if o['id'] not in drop]
colliders[:]=[c for c in colliders if c['properties'][0]['value'] not in drop]
print('cleanup: removed',len(drop),'loose props in water or buildings')
# ================= write Tiled files =================
ground.sort(key=lambda o:(0 if MAN[o['name']].get('kind')=='tile' else 1,o['y']))
layers=[('Ground',ground),('Scenery',scenery),('Collision footprints',colliders),('Landmarks',landmarks)]
tmj={'type':'map','version':'1.10','tiledversion':'1.11.2','orientation':'orthogonal','renderorder':'right-down','infinite':False,'tilewidth':32,'tileheight':32,
     'width':W//32,'height':H//32,'nextlayerid':5,'nextobjectid':nid[0],'backgroundcolor':'#b59a69',
     'properties':[{'name':'veyrathSchema','type':'int','value':1},{'name':'worldWidth','type':'float','value':W},{'name':'worldHeight','type':'float','value':H}],
     'layers':[{'id':k+1,'name':name,'type':'objectgroup','draworder':'topdown','opacity':1,'visible':True,'x':0,'y':0,'objects':objs} for k,(name,objs) in enumerate(layers)],
     'tilesets':[{'firstgid':1,'source':'desert-props.tsj'}]}
tsj={'type':'tileset','version':'1.10','tiledversion':'1.11.2','name':'VEYRATH desert props','tilewidth':max(MAN[k]['width'] for k in tiles),'tileheight':max(MAN[k]['height'] for k in tiles),
     'tilecount':len(tiles),'columns':0,'objectalignment':'bottomleft','grid':{'orientation':'orthogonal','width':1,'height':1},
     'tiles':[{'id':i,'image':'../assets/'+k+'.webp','imagewidth':MAN[k]['width'],'imageheight':MAN[k]['height'],'properties':[{'name':'key','type':'string','value':k},{'name':'anchorX','type':'float','value':anchor(k)[0]},{'name':'anchorY','type':'float','value':anchor(k)[1]}]} for k,i in sorted(tiles.items(),key=lambda kv:kv[1])]}
(MAPS/'desert.tmj').write_text(json.dumps(tmj),encoding='utf-8');(MAPS/'desert-props.tsj').write_text(json.dumps(tsj,indent=1),encoding='utf-8')
print('map %dx%d: %d ground, %d scenery, %d colliders, %d landmarks, %d tile types'%(W,H,len(ground),len(scenery),len(colliders),len(landmarks),len(tiles)))
