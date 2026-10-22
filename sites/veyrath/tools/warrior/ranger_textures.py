"""Ranger path outfit textures (Oct 18, user: Ninja all black, Gunslinger brown-orange, Archer/Alchemist green = the GLB's own).
  python tools/warrior/ranger_textures.py      (after prepare_sources.py)
Ninja = the pack's colour version 2 (black). Gunslinger = colour version 1 with the green cloth hue-shifted to a warm
brown-orange; leather/metal (non-green pixels) are untouched. Same UVs, 1024 px WebP, swapped in by hero-3d.js per path."""
import os
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..'))
SRC=os.path.join(ROOT,'tmp','warrior-src','Textures','Ranger');OUT=os.path.join(HERE,'..','..','dist','assets','hero')
def save(im,name):im.convert('RGB').resize((1024,1024),Image.LANCZOS).save(os.path.join(OUT,name),'WEBP',quality=90,method=6);print(name)
im=Image.open(os.path.join(SRC,'T_Ranger_BaseColor.png')).convert('RGB').resize((1024,1024),Image.LANCZOS)
h,s,v=im.convert('HSV').split();H,S,V=h.load(),s.load(),v.load()
for y in range(im.height):
    for x in range(im.width):
        hh=H[x,y]*360/255
        if 55<=hh<=175 and S[x,y]>40:            # green cloth -> brown-orange (hue ~24 deg), a touch brighter
            H[x,y]=int(24/360*255);S[x,y]=min(255,int(S[x,y]*1.05));V[x,y]=min(255,int(V[x,y]*1.12+6))
save(Image.merge('HSV',(h,s,v)).convert('RGB'),'ranger-gunslinger.webp')
# Oct 18 (user): "change his color to purple and the ninja to be deep blue" -> Alchemist purple, Ninja deep blue (replaces the black version 2).
def rehue(hue,sat=1.0,val=1.0,add=0):
    base=Image.open(os.path.join(SRC,'T_Ranger_BaseColor.png')).convert('RGB').resize((1024,1024),Image.LANCZOS)
    h,s,v=base.convert('HSV').split();H,S,V=h.load(),s.load(),v.load()
    for y in range(base.height):
        for x in range(base.width):
            if 55<=H[x,y]*360/255<=175 and S[x,y]>40:H[x,y]=int(hue/360*255);S[x,y]=min(255,int(S[x,y]*sat));V[x,y]=max(0,min(255,int(V[x,y]*val+add)))
    return Image.merge('HSV',(h,s,v)).convert('RGB')
save(rehue(278,1.05,1.05,4),'ranger-alchemist.webp')
save(rehue(226,1.15,.72),'ranger-ninja.webp')
