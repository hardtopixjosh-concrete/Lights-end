"""Offline preview of dist/maps/desert.tmj (no browser): sprites at their pivots, depth-sorted, with rough ground patches.
Usage: python tools/render-map-preview.py OUT.jpg [x0 y0 x1 y1] [scale]   (default: whole map at 1/6)
Used to compare generated areas against the Desert Biome reference shots; the game's renderer adds shadows and grading."""
import json,sys,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
MAP=json.loads((DIST/'maps/desert.tmj').read_text(encoding='utf-8'));MAN=json.loads((DIST/'assets/manifest.json').read_text(encoding='utf-8'))['props']
out=sys.argv[1];W,H=MAP['width']*MAP['tilewidth'],MAP['height']*MAP['tileheight']
x0,y0,x1,y1=(map(float,sys.argv[2:6]) if len(sys.argv)>=6 else (0,0,W,H));sc=float(sys.argv[6]) if len(sys.argv)>=7 else (1/6 if len(sys.argv)<6 else .5)
img=Image.new('RGB',(int((x1-x0)*sc),int((y1-y0)*sc)),(214,186,138));d=ImageDraw.Draw(img,'RGBA')
def P(x,y):return ((x-x0)*sc,(y-y0)*sc)
props=lambda o:{p['name']:p['value'] for p in o.get('properties',[])}
COL={'grass':(118,150,72,200),'meadow':(108,148,70,235),'water':(52,92,170,255),'plaza':(196,176,140,220),'rubble':(170,150,120,140),'scorch':(70,50,40,150),'crater':(150,120,90,200),'clay':(205,120,60,200),'cracks':(110,40,30,120),'path':(232,210,165,220)}
lms=[o for L in MAP['layers'] if L['name']=='Landmarks' for o in L['objects']]
for kind in ['clay','crater','grass','meadow','path','rubble','scorch','cracks','plaza','water']:
    for o in lms:
        if o['name'].split('-')[0]!=kind:continue
        pr=props(o);rx,ry=pr.get('rx',0),pr.get('ry',0)
        if not rx:continue
        a,b=P(o['x']-rx,o['y']-ry);c,e=P(o['x']+rx,o['y']+ry);d.ellipse([a,b,c,e],fill=COL[kind])
cache={}
def sprite(key,s):
    k=(key,round(s*sc,3))
    if k not in cache:
        im=Image.open(DIST/MAN[key]['url']).convert('RGBA');w,h=max(1,round(im.width*s*sc)),max(1,round(im.height*s*sc));cache[k]=im.resize((w,h),Image.LANCZOS)
    return cache[k]
objs=[]
for L in MAP['layers']:
    if L['name'] not in ('Ground','Scenery'):continue
    for o in L['objects']:
        pr=props(o);key=pr.get('key');m=MAN.get(key)
        if not m:continue
        s=pr.get('scale',1);ax,ay=m.get('anchor') or [m['width']/2,m['height']/2]
        left=o['x'];top=o['y']-m['height']*s;px,py=left+ax*s,top+ay*s
        if px<x0-400 or px>x1+400 or py<y0-400 or py>y1+600:continue
        layer=0 if pr.get('layer')=='ground' or L['name']=='Ground' else 1
        objs.append((layer,py,key,s,left,top))
for layer,py,key,s,left,top in sorted(objs,key=lambda t:(t[0],t[1])):
    im=sprite(key,s);a,b=P(left,top);img.paste(im,(int(a),int(b)),im)
for o in lms:
    n=o['name']
    if n.split('-')[0] in COL:continue
    a,b=P(o['x'],o['y']);d.ellipse([a-4,b-4,a+4,b+4],fill=(200,20,20,255));d.text((a+6,b-6),n,fill=(40,0,0))
img.save(out,quality=85);print(out,img.size,len(objs),'sprites')
