"""Extract the Warrior model sources (CC0 Quaternius packs) from the ZIPs in Visuals/Character models
into VEYRATH/tmp/warrior-src (not shipped, not part of the Site repo). The ZIPs stay untouched.
Usage: python tools/warrior/prepare_sources.py"""
import zipfile,os,glob
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..','..'))
SRC=os.path.join(ROOT,'Visuals','Character models');OUT=os.path.join(ROOT,'tmp','warrior-src')
def grab(zipname,keep):
    z=zipfile.ZipFile(glob.glob(os.path.join(SRC,zipname))[0]);root=z.namelist()[0].split('/')[0]+'/'
    for n in z.namelist():
        r=n[len(root):]
        if r and not n.endswith('/') and keep(r):
            d=os.path.join(OUT,r);os.makedirs(os.path.dirname(d),exist_ok=True)
            if not os.path.exists(d) or os.path.getsize(d)!=z.getinfo(n).file_size:open(d,'wb').write(z.read(n))
grab('Modular Character Outfits - Fantasy*.zip',lambda r:r in ('All_Male.blend','All_Female.blend') or r.startswith(('Textures/Knight/T_','Textures/Wizard/T_','Textures/Base/T_','Textures/Ranger/T_')))
grab('Universal Animation Library[[]Standard*.zip',lambda r:r=='Unreal-Godot/UAL1_Standard.glb')
grab('Universal Animation Library 2*.zip',lambda r:r=='Unreal-Godot/UAL2_Standard.glb')
grab('Universal Base Characters*.zip',lambda r:r.startswith('Base Characters/Godot - UE/') or r.startswith('Hairstyles/Rigged to Head Bone/glTF'))
print('sources in',OUT)
