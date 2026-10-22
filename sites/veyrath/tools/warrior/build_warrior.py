"""Warrior player model (Oct 17): Quaternius Modular Outfits Male Knight (CC0, colour version 1, horns kept, empty hand)
bound to the Universal Animation Library 1+2 skeleton (CC0, same bone names). Renders the 14 knight-* clips the game uses,
15 frames x 8 directions (rows E,SE,S,SW,W,NW,N,NE), from the game camera (orthographic, 30 deg down, feet at 75% of the cell).

  python tools/warrior/prepare_sources.py            # once: extract the ZIPs into VEYRATH/tmp/warrior-src
  blender -b ../../tmp/warrior-src/All_Male.blend --python tools/warrior/build_warrior.py
  python tools/warrior/compose_warrior.py             # pack frames into dist/assets/knight-*.webp (+ colour-region masks)

Env: WARRIOR_ONLY=Idle,Run (clips)  WARRIOR_ROWS=2,4  WARRIOR_FRAMES=0,7  WARRIOR_PASS=color|mask  WARRIOR_SIZE=512
Frames go to VEYRATH/tmp/warrior-frames/<pass>/<clip>/r<row>_f<frame>.png."""
import bpy,math,os,re,sys
from mathutils import Euler,Matrix,Vector,Quaternion
SRC=os.path.dirname(bpy.data.filepath);ROOT=os.path.abspath(os.path.join(SRC,'..','..'))
PASS=os.environ.get('WARRIOR_PASS','color');SIZE=int(os.environ.get('WARRIOR_SIZE','512'))
OUT=os.path.join(ROOT,'tmp','warrior-frames',PASS)
def envlist(k):v=os.environ.get(k);return [x.strip() for x in v.split(',')] if v else None
# Hero presets (user decisions Oct 17): Warrior = Male Knight colour 1, horns, empty hand (All_Male.blend);
# Mage = Female Wizard colour 2 (purple + gold) -> Oct 20 (user) recoloured to three reds by tools/warrior/mage_red_texture.py with the female base head and Hair_Buns (All_Female.blend).
HERO=os.environ.get('HERO','warrior')
PRESET={'warrior':dict(outfit='Knight'),
        'mage':dict(outfit='Wizard',head='Female',hair='Hair_Buns',tex={'T_Wizard_BaseColor':'T_Wizard_Red_BaseColor.png'},
                     # Oct 18 (user): tan skin, brown hair. Texture recolour at export: prefix -> (target mean sRGB, mode)
                     recolor={'T_Superhero_Female':((.80,.60,.45),'mean'),'T_Regular_Female':((.80,.60,.45),'mean'),'T_Hair_':((.36,.22,.13),'lum')}),
        # Oct 18 (user): Ranger = male Ranger outfit, colour 1 (green). Oct 18 later (user: "there is no face on the ranger"):
        # the male base head (face, eyes, eyebrows; tan like his hands) replaces the dark hood shade; still no hair (hood).
        # Ninja (black) / Gunslinger (brown-orange) outfits are texture swaps in hero-3d.js (tools/warrior/ranger_textures.py).
        # Oct 18 (user): Alchemist takes the hood off and has grey hair -> alt_hair is exported as 'Hair_Alchemist' (plain grey material);
        # hero-3d.js shows it and hides Male_Ranger_Head_Hood only for the Alchemist path.
        'ranger':dict(outfit='Ranger',head='Male',alt_hair='Hair_SimpleParted',recolor={'T_Regular_Male':((.80,.60,.45),'mean'),'T_Superhero_Male':((.80,.60,.45),'mean')})}[HERO]

# ---- rig: UAL skeleton drives the Knight outfit meshes ----
for a in bpy.data.actions:a.name="orig_"+a.name  # the blend ships its own Idle_Loop for its control rig
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,'Unreal-Godot','UAL1_Standard.glb'))
rig=[o for o in bpy.data.objects if o not in before and o.type=='ARMATURE'][0]
bpy.ops.import_scene.gltf(filepath=os.path.join(SRC,'Unreal-Godot','UAL2_Standard.glb'))
for o in [o for o in bpy.data.objects if o not in before and o!=rig]:bpy.data.objects.remove(o,do_unlink=True)
for a in bpy.data.actions:
    a.use_fake_user=True;n=re.sub(r'_Armature(\.\d+)?$','',a.name)
    if n!=a.name and n not in bpy.data.actions:a.name=n
# Fit the animation skeleton's joints to the outfit's own rest skeleton (positions only, orientation kept, so the
# library animations mean the same thing): UAL arms are ~6 cm (male) / ~10 cm (female) longer than the outfit rigs,
# which made fingers and wrists bend around points outside the mesh (Oct 17 "hands are messed up").
def fit_rest(rig,ref):
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    for eb in rig.data.edit_bones:eb.use_connect=False
    for eb in rig.data.edit_bones:
        rb=ref.data.bones.get(eb.name)
        if not rb:continue
        m=ref.matrix_world@rb.matrix_local;d=(eb.tail-eb.head).normalized();roll=eb.roll
        eb.head=m.translation;eb.tail=eb.head+d*rb.length;eb.roll=roll
    bpy.ops.object.mode_set(mode='OBJECT')
fit_rest(rig,bpy.data.objects['Armature'])
OUTFIT=os.environ.get('HERO_OUTFIT',PRESET['outfit']);EXTRA=[n for n in os.environ.get('HERO_EXTRA','').split(',') if n]  # e.g. Wizard + a head mesh
K=list(bpy.data.collections[OUTFIT].objects)+[bpy.data.objects[n] for n in EXTRA]
for o in bpy.data.objects:
    if o.type=='MESH' and o.name not in K:o.hide_render=True
for o in K:
    o.hide_render=False
    for m in o.modifiers:
        if m.type=='ARMATURE':m.object=rig
    mw=o.matrix_world.copy();o.parent=rig;o.matrix_world=mw
# ---- optional head + hair from Universal Base Characters (CC0): HERO_HEAD=Male|Female, HERO_HAIR=Hair_Long,Hair_Beard ----
def attach(path,head_only=False):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=path);new=[o for o in bpy.data.objects if o not in before];got=[]
    for o in new:
        if o.type!='MESH' or not o.vertex_groups:continue
        if head_only and o.name.lower().startswith('superhero'):
            keep={o.vertex_groups[n].index for n in ('Head','neck_01') if n in o.vertex_groups}
            import bmesh;bm=bmesh.new();bm.from_mesh(o.data);dl=bm.verts.layers.deform.active
            bmesh.ops.delete(bm,geom=[v for v in bm.verts if sum(w for g,w in v[dl].items() if g in keep)<.5],context='VERTS');bm.to_mesh(o.data);bm.free()
        for m in o.modifiers:
            if m.type=='ARMATURE':m.object=rig
        mw=o.matrix_world.copy();o.parent=rig;o.matrix_world=mw;got.append(o)
    for o in new:
        if o not in got:bpy.data.objects.remove(o,do_unlink=True)
    return got
BASE=os.path.join(SRC,'Base Characters','Godot - UE');HAIRDIR=os.path.join(SRC,'Hairstyles','Rigged to Head Bone','glTF (Godot -Unreal)')
HEAD=os.environ.get('HERO_HEAD',PRESET.get('head',''))
if HEAD:K+=attach(os.path.join(BASE,f"Superhero_{HEAD}_FullBody.gltf"),head_only=True)
for h in [x for x in os.environ.get('HERO_HAIR',PRESET.get('hair','')).split(',') if x]:K+=attach(os.path.join(HAIRDIR,h+'.gltf'))
for o in K:o.hide_render=False
if PRESET.get('alt_hair'):
    for o in attach(os.path.join(HAIRDIR,PRESET['alt_hair']+'.gltf')):
        o.name='Hair_Alchemist';o.data.name='Hair_Alchemist';gm=bpy.data.materials.new('MI_Hair_Grey');gm.use_nodes=True
        bs=gm.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(.42,.42,.45,1);bs.inputs['Roughness'].default_value=.85
        o.data.materials.clear();o.data.materials.append(gm);o.hide_render=False;K.append(o)
if PRESET.get('shade_head'):  # hood only: a dark head-sized shape so the hood never shows the background through it
    import bmesh as _bm;hb=rig.data.bones['Head'];bm=_bm.new();_bm.ops.create_uvsphere(bm,u_segments=10,v_segments=7,radius=.105)
    _bm.ops.transform(bm,matrix=Matrix.Translation(rig.matrix_world@(hb.head_local+Vector((0,-.015,.1))))@Matrix.Diagonal((.9,1,1.12,1)),verts=bm.verts)
    me=bpy.data.meshes.new('HoodShade');bm.to_mesh(me);bm.free();sh=bpy.data.materials.new('HoodShade');sh.use_nodes=True
    bs=sh.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(.015,.012,.01,1);bs.inputs['Roughness'].default_value=1;me.materials.append(sh)
    ob=bpy.data.objects.new('HoodShade',me);scn0=bpy.context.scene;scn0.collection.objects.link(ob);vg=ob.vertex_groups.new(name='Head');vg.add(list(range(len(me.vertices))),1,'REPLACE')
    md=ob.modifiers.new('Armature','ARMATURE');md.object=rig;ob.parent=rig;K.append(ob)
for img in bpy.data.images:  # colour version of the outfit texture
    for k,v in PRESET.get('tex',{}).items():
        if img.name.startswith(k):img.filepath=os.path.join(os.path.dirname(bpy.path.abspath(img.filepath)),v);img.reload()
if not rig.animation_data:rig.animation_data_create()
rig.rotation_mode="XYZ"
for tr in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(tr)
scn=bpy.context.scene

# ---- clips: segments (action, from, to) played back to back and sampled into 15 frames ----
# Hit timing in game: Melee 6-10/15, Melee2 7-10/15, Special1 8-11/15, MeleeRun starts at frame 4.
WARRIOR_CLIPS={
 'Idle':dict(segs=[('Idle_Loop',0,60)],loop=True),
 'Run':dict(segs=[('Sprint_Loop',0,16)],loop=True),
 'Melee':dict(segs=[('Sword_Regular_A',0,10.4),('Sword_Regular_A_Rec',0,10)]),
 'Melee2':dict(segs=[('Sword_Regular_B',0,12.8),('Sword_Regular_B_Rec',0,10)]),
 'Special1':dict(segs=[('Sword_Attack',0,30)]),
 'MeleeRun':dict(segs=[('Sword_Dash',0,37.6)]),
 'MeleeSpin':dict(segs=[('Sword_Regular_B',12.8,12.8)],spin=True),
 'Pummel':dict(segs=[('Punch_Cross',0,24)]),
 'Special2':dict(segs=[('Idle_Loop',0,20)],cry=True),
 'CastSpell':dict(segs=[('Spell_Simple_Enter',0,12.8),('Spell_Simple_Shoot',0,12)]),
 'ShieldBlockStart':dict(segs=[('Sword_Block',0,14)]),
 'ShieldBlockMid':dict(segs=[('Sword_Block',10,29.6)]),
 'Rolling':dict(segs=[('Slide_Start',0,20),('Slide_Exit',0,12)]),  # Oct 18 (user): dodge-slide instead of the too-fast roll
 'Die':dict(segs=[('Death01',0,57.6)]),
 # Oct 18: per-family LMB attacks + carry poses for the held weapon (weapon_pose())
 **{f'W_longsword_{i}':dict(segs=sg,wpn=f'longsword_{i}') for i,sg in enumerate(([('Sword_Regular_A',0,10.4),('Sword_Regular_A_Rec',0,10)],[('Sword_Regular_B',0,12.8),('Sword_Regular_B_Rec',0,10)],[('Sword_Attack',0,30)]))},
 'W_greatsword_0':dict(segs=[('Sword_Regular_A',0,10.4),('Sword_Regular_A_Rec',0,10)],wpn='greatsword_0'),
 'W_greatsword_1':dict(segs=[('Sword_Regular_B',0,12.8),('Sword_Regular_B_Rec',0,10)],wpn='greatsword_1'),
 'W_greatsword_2':dict(segs=[('Sword_Attack',0,30)],wpn='greatsword_2'),
 'W_dual':dict(segs=[('Sword_Regular_A',0,10.4),('Sword_Regular_B',0,12.8)],wpn='dual'),
 'W_axe':dict(segs=[('OverhandThrow',2,26)],wpn='axe'),
 'W_warhammer_0':dict(segs=[('Sword_Attack',0,30)],wpn='warhammer_0'),
 'W_warhammer_1':dict(segs=[('Sword_Attack',0,30)],wpn='warhammer_1'),
 'W_warhammer_2':dict(segs=[('Jump_Start',4,30),('Jump_Land',0,28)],wpn='warhammer_2'),
 **{f'Hold_{w}':dict(segs=[('Idle_Loop',0,60)],loop=True,wpn='hold_'+w) for w in ('greatsword','dual','warhammer')},
}
# Mage poses (game.js drawMagePlayer): casts play frames 1-14; Blink shows FrontFlip frames 7-14 (the landing).
# RMB fireball = Attack1, Q nova = Special1, E chain = Attack2, R meteor = Special2, channels = CastSpell.
MAGE_CLIPS={
 'Idle':dict(segs=[('Idle_Loop',0,60)],loop=True),
 'Run':dict(segs=[('Jog_Fwd_Loop',0,22.4)],loop=True),
 'RunBackwards':dict(segs=[('Jog_Fwd_Loop',22.4,0)],loop=True),
 # casting slows the Mage (game.js mageMoveTarget): legs walk instead of run while slowed
 'Walk':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'WalkBackwards':dict(segs=[('Walk_Loop',32,0)],loop=True),
 'StrafeLeft':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'StrafeRight':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'TakeDamage':dict(segs=[('Hit_Chest',0,8)]),
 'Attack1':dict(segs=[('OverhandThrow',2,26)]),
 'Special1':dict(segs=[('Spell_Simple_Enter',0,12.8)],nova=True),
 'Attack2':dict(segs=[('Spell_Simple_Enter',0,12.8),('Spell_Simple_Shoot',0,12)]),
 'Special2':dict(segs=[('Sword_Attack',0,30)]),
 'CastSpell':dict(segs=[('Spell_Simple_Enter',0,12.8),('Spell_Simple_Idle_Loop',0,24)]),
 'FrontFlip':dict(segs=[('NinjaJump_Start',0,23.2),('NinjaJump_Land',0,30.4)]),
 'Die':dict(segs=[('Death01',0,57.6)]),
 # upper-body layer for constant casts (beam, drain); the game plays it over the legs (hero-3d.js). Weapon hand = right.
 'Channel':dict(segs=[('Spell_Simple_Idle_Loop',0,50.4)],loop=True,channel=True),
 # LMB attacks per weapon family (upper-body layer; projectile leaves at t=.45, mage.js); end = 'ready' pose held between shots
 **{f'Lmb_{w}':dict(segs=[('Idle_Loop',0,20)],lmb=w) for w in ('wand','staff','grimoire','spellbook','orb','gauntlet','disc','beads','rod','sigil')},
 # Oct 19 (user: casting must look real): per-weapon channel layers (drum beats, lantern raised, skull offering, globe held up)
 **{f'Channel_{w}':dict(segs=[('Spell_Simple_Idle_Loop',0,50.4)],loop=True,chan=w) for w in ('drum','lantern','skull','globe')},
 # Oct 18: weapon hold layer while idle/moving (hero-3d.js WEAPON_DEFS.hold); staff = forearm forward, staff upright
 'Hold_staff':dict(segs=[('Idle_Loop',0,60)],loop=True,hold='staff'),
}
# Ranger (Oct 18 overnight batch). Body clips + per-weapon upper-body layers (weapon_pose keys below). Weapon clips:
# R_<w> = LMB/aimed shot (draw 0-.3, release .3, recover/redraw to the aimed 'ready' pose at 1; game.js drives the time),
# R_<w>_up = the same aimed ~40 deg up (Volley etc.), Hold_<w> = carry while idle/moving.
RANGER_WEAPONS=('bow','longbow','shortbow','crossbow','pistols','shotgun','shuriken','kunai','chakram','falconer','potion','bombbag','barrel','daggers','rifle')  # Oct 19: own clips for the Alchemist throws, daggers, sniper rifle
RANGER_CLIPS={
 'Idle':dict(segs=[('Idle_Loop',0,60)],loop=True),
 'Run':dict(segs=[('Jog_Fwd_Loop',0,22.4)],loop=True),
 'RunBackwards':dict(segs=[('Jog_Fwd_Loop',22.4,0)],loop=True),
 'Walk':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'WalkBackwards':dict(segs=[('Walk_Loop',32,0)],loop=True),
 'StrafeLeft':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'StrafeRight':dict(segs=[('Walk_Loop',0,32)],loop=True),
 'TakeDamage':dict(segs=[('Hit_Chest',0,8)]),
 'Die':dict(segs=[('Death01',0,57.6)]),
 'Rolling':dict(segs=[('Roll',0,35.2)]),
 'Throw':dict(segs=[('OverhandThrow',2,26)]),            # shuriken skill, catalyst/flask throws
 'Cast':dict(segs=[('Spell_Simple_Enter',0,12.8),('Spell_Simple_Shoot',0,12)]),  # arrow type, smoke bomb, reactive flask
 'Cry':dict(segs=[('Idle_Loop',0,20)],cry=True),          # Hunter's Focus, Shadow Assault, Grand Experiment
 'Cyclone':dict(segs=[('Idle_Loop',0,20)],arms=True),     # Ninja Cyclone: arms out, the game spins the body
 **{f'R_{w}':dict(segs=[('Idle_Loop',0,20)],wpn='r_'+w) for w in RANGER_WEAPONS},
 **{f'R_{w}_up':dict(segs=[('Idle_Loop',0,20)],wpn='r_'+w+'_up') for w in RANGER_WEAPONS},
 'R_pistols_l':dict(segs=[('Idle_Loop',0,20)],wpn='r_pistols_l'),
 'R_daggers_l':dict(segs=[('Idle_Loop',0,20)],wpn='r_daggers_l'),
 **{f'Hold_{w}':dict(segs=[('Idle_Loop',0,60)],loop=True,wpn='hold_'+w) for w in ('bow','longbow','shortbow','crossbow','pistols','shotgun','falconer','rifle')},
}
CLIPS={'warrior':WARRIOR_CLIPS,'mage':MAGE_CLIPS,'ranger':RANGER_CLIPS}[HERO]
DIRS=[90,45,0,-45,-90,-135,180,135]  # rows E,SE,S,SW,W,NW,N,NE; the model faces the camera (-Y) at 0

def sample(clip,t):
    segs=CLIPS[clip]['segs'];total=sum(max(abs(b-a),1e-6) for _,a,b in segs);x=t*total
    for name,a,b in segs:
        L=max(abs(b-a),1e-6)
        if x<=L or (name,a,b)==segs[-1]:return name,(a+min(x,L) if b>=a else a-min(x,L))  # b<a plays backwards
        x-=L
def pose_at(name,f):
    rig.animation_data.action=bpy.data.actions[name];scn.frame_set(int(f),subframe=f-int(f))
    snap={pb.name:(pb.location.copy(),pb.rotation_quaternion.copy(),pb.scale.copy()) for pb in rig.pose.bones}
    rig.animation_data.action=None
    for pb in rig.pose.bones:
        l,q,s=snap[pb.name];pb.rotation_mode='QUATERNION';pb.location=l;pb.rotation_quaternion=q;pb.scale=s
    bpy.context.view_layer.update()

def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def turn(bone,axis,deg):
    """Rotate a pose bone about an armature-space axis through its head (keeps children attached)."""
    pb=rig.pose.bones[bone];h=pb.head.copy()
    R=Matrix.Translation(h)@Matrix.Rotation(math.radians(deg),4,axis)@Matrix.Translation(-h)
    pb.matrix=R@pb.matrix;bpy.context.view_layer.update()
def aim(bone,target,k):
    """Swing a pose bone about its head so it points toward target (armature space), blended by k."""
    pb=rig.pose.bones[bone];d=(pb.tail-pb.head).normalized();q=d.rotation_difference(Vector(target).normalized())
    q=Quaternion().slerp(q,k);h=pb.head.copy()
    pb.matrix=Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-h)@pb.matrix;bpy.context.view_layer.update()
def war_cry(t):
    # roar: chest out, head back, both arms flexed up and out (double bicep); peak by frame 5, hold, ease off at the end
    k=ease(t/0.33)*(1-0.35*ease((t-0.8)/0.2))
    turn('spine_02','X',-10*k);turn('spine_03','X',-8*k);turn('neck_01','X',-8*k);turn('Head','X',-16*k)
    for side,x in (('l',1),('r',-1)):  # the model faces -Y, so its left side is +X
        aim('upperarm_'+side,(x*.85,-.2,.45),k);aim('lowerarm_'+side,(x*.15,-.25,1),k)

def nova(t):
    # Q nova: gather the hands in front of the chest, then fling both arms out and down as the ring bursts
    k=ease((t-.45)/.15)*(1-.5*ease((t-.8)/.2))
    turn('spine_03','X',-8*k);turn('Head','X',-6*k)
    for side,x in (('l',1),('r',-1)):
        aim('upperarm_'+side,(x*.9,-.35,-.25),k);aim('lowerarm_'+side,(x*.95,-.3,-.1),k)

def channel_pose(t):
    # constant cast: weapon (right) arm reaches toward the target, left hand braced at the chest, torso leans in a little
    sway=math.sin(t*2*math.pi)
    turn('spine_02','X',4);turn('spine_03','Z',-6)
    aim('upperarm_r',(-.18,-1,-.12+.03*sway),1);aim('lowerarm_r',(-.04,-1,.02),1);aim('hand_r',(0,-1,0),1)
    aim('upperarm_l',(.3,-.35,-.88),1);aim('lowerarm_l',(-.65,-.7,.3),1)

# Weapon-aware LMB poses (user Oct 17: design every attack for the weapon that will be held). Model faces -Y, its right
# side is -X. Weapon hand = right (wand, staff head hand, orb); books sit in the LEFT hand and the right hand casts.
# Each pose: bone -> direction (armature space), plus torso twist (spine_03 Z) and lean (spine_02 X), degrees.
LMB_POSES={
 'wand':dict(ready=dict(upperarm_r=(-.35,-.45,-.8),lowerarm_r=(-.05,-1,.12),hand_r=(0,-1,0)),
             wind=dict(upperarm_r=(-.4,-.25,-.85),lowerarm_r=(-.1,-.25,1),hand_r=(0,.35,1),twist=6),
             hit=dict(upperarm_r=(-.2,-.75,-.6),lowerarm_r=(-.03,-1,-.12),hand_r=(0,-1,-.2),twist=-6,lean=4)),
 'staff':dict(ready=dict(upperarm_r=(-.3,-.55,-.75),lowerarm_r=(.1,-1,.3),upperarm_l=(.25,-.45,-.85),lowerarm_l=(-.65,-.75,.1)),
              wind=dict(upperarm_r=(-.45,.1,-.85),lowerarm_r=(-.1,-.6,.8),upperarm_l=(.3,-.1,-.9),lowerarm_l=(-.7,-.4,.4),twist=14),
              hit=dict(upperarm_r=(-.12,-1,-.12),lowerarm_r=(-.02,-1,.05),upperarm_l=(.1,-.85,-.5),lowerarm_l=(-.35,-.95,0),twist=-10,lean=9)),
 'grimoire':dict(ready=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.3,-.35,-.88),lowerarm_r=(.25,-1,.2)),
                 wind=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.2,-.2,-.95),lowerarm_r=(.6,-.6,.5),twist=8),
                 hit=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.15,-1,-.1),lowerarm_r=(-.05,-1,0),hand_r=(0,-1,.25),twist=-6,lean=5)),
 'spellbook':dict(ready=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.3,-.35,-.88),lowerarm_r=(.25,-1,.2)),
                  wind=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(.15,-.7,-.7),lowerarm_r=(.9,-.4,.1),twist=16),
                  hit=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.85,-.5,-.15),lowerarm_r=(-.9,-.45,0),hand_r=(-.8,-.6,0),twist=-14,lean=3)),
 # Oct 19 new Mage weapon casts. Flame Gauntlets: pull the fist back by the shoulder, then drive the open palm out (hand up = palm forward).
 'gauntlet':dict(ready=dict(upperarm_r=(-.3,-.35,-.88),lowerarm_r=(.05,-1,.25),hand_r=(0,-1,.2),upperarm_l=(.35,-.25,-.9),lowerarm_l=(-.55,-.8,.25)),
                 wind=dict(upperarm_r=(-.4,.3,-.85),lowerarm_r=(-.15,-.45,.88),hand_r=(0,-.2,1),upperarm_l=(.4,-.45,-.8),lowerarm_l=(-.3,-.9,.3),twist=16,lean=-3),
                 hit=dict(upperarm_r=(-.08,-1,-.02),lowerarm_r=(0,-1,.02),hand_r=(0,-.3,1),upperarm_l=(.45,.1,-.88),lowerarm_l=(.1,-.6,.8),twist=-14,lean=9)),
 # Sun Disc: backhand frisbee throw, disc cocked across the chest then whipped out to the right
 'disc':dict(ready=dict(upperarm_r=(-.3,-.35,-.88),lowerarm_r=(.3,-.9,.2),hand_r=(.3,-.95,0)),
             wind=dict(upperarm_r=(.15,-.6,-.78),lowerarm_r=(.95,-.25,.12),hand_r=(1,.1,0),upperarm_l=(.5,.1,-.85),twist=-22,lean=3),
             hit=dict(upperarm_r=(-.92,-.38,-.05),lowerarm_r=(-.95,-.3,.05),hand_r=(-.9,-.42,0),upperarm_l=(.4,-.3,-.85),twist=18,lean=5)),
 # Ember Beads: a quick open-hand flick, fingers spread toward the target
 'beads':dict(ready=dict(upperarm_r=(-.35,-.4,-.82),lowerarm_r=(-.05,-1,.18),hand_r=(0,-1,.1)),
              wind=dict(upperarm_r=(-.4,-.15,-.9),lowerarm_r=(-.15,-.3,.95),hand_r=(0,.2,1),twist=8),
              hit=dict(upperarm_r=(-.18,-.85,-.45),lowerarm_r=(-.03,-1,0),hand_r=(0,-.6,.8),twist=-8,lean=5)),
 # Lightning Rod: raise the rod overhead to call the strike, then drive it down toward the spot
 'rod':dict(ready=dict(upperarm_r=(-.3,-.55,-.75),lowerarm_r=(.1,-1,.3),upperarm_l=(.25,-.45,-.85),lowerarm_l=(-.65,-.75,.1)),
            wind=dict(upperarm_r=(-.3,-.15,.94),lowerarm_r=(-.05,-.1,1),hand_r=(0,-.1,1),upperarm_l=(.5,-.2,-.8),lean=-8),
            hit=dict(upperarm_r=(-.15,-.85,.5),lowerarm_r=(-.04,-.95,.3),upperarm_l=(.45,-.2,-.85),lean=6,twist=-6)),
 # Sacrificial Book: book open in the left hand, right hand sweeps up then points down at the spot on the ground
 'sigil':dict(ready=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.3,-.35,-.88),lowerarm_r=(.25,-1,.2)),
              wind=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.35,-.4,.2),lowerarm_r=(-.1,-.3,.95),hand_r=(0,-.2,1),lean=-4),
              hit=dict(upperarm_l=(.25,-.4,-.88),lowerarm_l=(-.3,-1,.15),hand_l=(-.2,-1,.4),upperarm_r=(-.15,-.9,-.4),lowerarm_r=(-.05,-.7,-.7),hand_r=(0,-.5,-.85),lean=11)),
 'orb':dict(ready=dict(upperarm_r=(-.3,-.3,-.9),lowerarm_r=(.05,-1,.2),hand_r=(0,-1,-.3),upperarm_l=(.35,-.2,-.9)),
            wind=dict(upperarm_r=(-.35,-.25,-.4),lowerarm_r=(.1,-.3,1),hand_r=(0,-.3,1),upperarm_l=(.7,-.2,-.3),lean=-6),
            hit=dict(upperarm_r=(-.15,-.8,-.55),lowerarm_r=(0,-.55,-.85),hand_r=(0,-.4,-.9),upperarm_l=(.8,-.3,-.5),lean=10)),
}
def chan_pose(w,t):
    # Oct 19 Mage channel layers (loop t 0..1; the drum's t is driven per beat by the game: 0 = strike)
    sway=math.sin(t*2*math.pi)
    if w=='drum':
        aim('upperarm_l',(.3,-.4,-.85),1);aim('lowerarm_l',(-.65,-.75,.1),1);aim('hand_l',(-.75,-.65,0),1)  # drum held at the chest
        k=1 if t<.08 else 1-ease((t-.08)/.32) if t<.4 else 0 if t<.82 else ease((t-.82)/.18)  # 1 = down on the drum
        up=(Vector((-.32,-.35,.88)),Vector((-.1,-.2,1)));dn=(Vector((-.12,-.8,-.55)),Vector((.45,-.85,-.2)))
        aim('upperarm_r',up[0].lerp(dn[0],k),1);aim('lowerarm_r',up[1].lerp(dn[1],k),1);turn('spine_02','X',4*k)
    elif w=='lantern':
        aim('upperarm_r',(-.2,-.75,.45+.04*sway),1);aim('lowerarm_r',(-.05,-.6,.8),1);aim('hand_r',(0,-.4,.9),1)
        aim('upperarm_l',(.55,-.3,-.75),1);aim('lowerarm_l',(.3,-.8,.2),1);turn('spine_02','X',-3)
    elif w=='skull':  # both hands raised toward the heart in the air, trembling a little as the blood flows in
        tr=.025*math.sin(t*2*math.pi*6)
        for side,x in (('l',1),('r',-1)):aim('upperarm_'+side,(x*.28,-.72,.55+tr),1);aim('lowerarm_'+side,(x*.06,-.75,.62),1);aim('hand_'+side,(x*.1,-.45,.88),1)
        turn('spine_02','X',-7);turn('Head','X',-10)
    elif w=='globe':
        aim('upperarm_r',(-.2,-.9,-.2),1);aim('lowerarm_r',(0,-.8,.6+.03*sway),1);aim('hand_r',(0,-.4,.9),1)
        aim('upperarm_l',(.25,-.75,-.5),1);aim('lowerarm_l',(-.35,-.8,.45),1)
def hold_pose(w,t):
    # staff carried upright: right forearm forward at the waist (the fist then points up), slight breathing sway
    sway=math.sin(t*2*math.pi)
    if w=='staff':aim('upperarm_r',(-.22,-.2,-.95),1);aim('lowerarm_r',(-.08,-1,.08+.02*sway),1);aim('hand_r',(-.05,-1,-.45),1)

def lmb_pose(w,t):
    P=LMB_POSES[w]
    # ready -> wind (0-.3), snap to hit at release (.3-.45), hold (.45-.65), settle back to ready (.65-1)
    if t<.3:a,b,k=P['ready'],P['wind'],ease(t/.3)
    elif t<.45:a,b,k=P['wind'],P['hit'],ease((t-.3)/.15)
    elif t<.65:a,b,k=P['hit'],P['hit'],1
    else:a,b,k=P['hit'],P['ready'],ease((t-.65)/.35)
    g=lambda key,d=0:a.get(key,d)*(1-k)+b.get(key,d)*k
    turn('spine_03','Z',g('twist'));turn('spine_02','X',g('lean'))
    for bone in ('upperarm_r','lowerarm_r','hand_r','upperarm_l','lowerarm_l','hand_l'):
        if bone in a or bone in b:
            va=Vector(a.get(bone,b.get(bone))).normalized();vb=Vector(b.get(bone,a.get(bone))).normalized();aim(bone,va.lerp(vb,k),1)

# ---- Oct 18: weapon-driven poses (Warrior weapons batch 2). Keys describe the WEAPON: grip point p, shaft/blade
# direction d and edge/striking-face direction e (R,F,U = model right/forward/up, rest body space, metres); the arms are
# solved to hold it (2-bone IK, hand turned so the grip frame matches; same grip maths as hero-3d.js gripFrame()).
# off = where the left hand holds a two-hander, as a distance along the shaft from the right-hand grip. Twist/lean in degrees.
GRIP_Y=.085
def V(r,f,u):return Vector((-r,-f,u))
def grip_local(side):
    B=rig.data.bones;h=lambda n:B[n+'_'+side].head_local
    H=h('hand');Fy=(h('middle_01')-H).normalized();d=h('index_01')-h('pinky_01');Fz=(d-Fy*d.dot(Fy)).normalized();Fx=Fy.cross(Fz)
    s=1 if (h('thumb_01')-H).dot(Fx)>0 else -1;m=Matrix.Identity(4)
    for i,v in enumerate((Fx*s,Fy*s,Fz)):m[0][i],m[1][i],m[2][i]=v
    m.translation=H+Fy*GRIP_Y;return B['hand_'+side].matrix_local.inverted()@m
GL={s:grip_local(s) for s in 'rl'}
def grip_world(side):return rig.pose.bones['hand_'+side].matrix@GL[side]
def curl_hand(side,deg):
    g=grip_world(side);palm=g.col[0].xyz.normalized();Fy=(rig.pose.bones['middle_01_'+side].head-rig.pose.bones['hand_'+side].head).normalized();ax=Fy.cross(palm).normalized()
    for f in ('index','middle','ring','pinky'):
        for j in ('01','02','03'):turn(f'{f}_{j}_{side}',ax,deg)
def swing(name,child,target):
    pb=rig.pose.bones[name];h=pb.head.copy();q=(rig.pose.bones[child].head-h).rotation_difference(target-h)
    pb.matrix=Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-h)@pb.matrix;bpy.context.view_layer.update()
def hold(side,D,pole):
    """Put this hand's grip frame on D (armature space): IK the arm to the wrist, then turn the hand."""
    Mh=D@GL[side].inverted();W=Mh.translation.copy();P=rig.pose.bones
    S=P['upperarm_'+side].head.copy();a=(P['lowerarm_'+side].head-S).length;b=(P['hand_'+side].head-P['lowerarm_'+side].head).length
    v=W-S;d=max(abs(a-b)+1e-3,min(a+b-1e-4,v.length));u=v.normalized();x=(a*a-b*b+d*d)/(2*d);h=math.sqrt(max(0,a*a-x*x))
    pv=Vector(pole);perp=(pv-u*pv.dot(u)).normalized()
    swing('upperarm_'+side,'lowerarm_'+side,S+u*x+perp*h);swing('lowerarm_'+side,'hand_'+side,S+u*d)
    pb=P['hand_'+side];pb.matrix=Matrix.Translation(pb.head.copy())@Mh.to_3x3().normalized().to_4x4();bpy.context.view_layer.update()
def frame_of(p,d,e,side):
    z=Vector(d).normalized();e=Vector(e);e=(e-z*e.dot(z)).normalized()
    x=z.cross(e) if side=='r' else e.cross(z)  # knuckles face the edge: right grip -Y = edge, left grip +Y = edge
    m=Matrix.Identity(4)
    for i,c in enumerate((x,z.cross(x),z)):m[0][i],m[1][i],m[2][i]=c
    m.translation=Vector(p);return m
POLE={'r':(-.5,.45,-1),'l':(.5,.45,-1)}
def wkey(r=None,l=None,tw=0,ln=0,off=None,pr=None,pl=None):return dict(r=r,l=l,tw=tw,ln=ln,off=off,pr=pr,pl=pl)  # pr/pl = elbow pole override (armature space)
def W3(p,d,e):return (V(*p),V(*d),V(*e))
# keys: [(t, wkey)], eased between neighbours
GS_READY=W3((.14,.28,1.02),(.15,.5,.85),(0,1,-.3))
DU_R=W3((.24,.22,1.02),(.1,.85,.35),(0,.3,-1));DU_L=W3((-.24,.22,1.02),(-.1,.85,.35),(0,.3,-1))
WH_READY=W3((.2,.2,1.0),(-.08,.5,.85),(0,1,-.5))
AX_READY=W3((.24,.15,1.0),(0,.55,.85),(0,1,-.6))
# Oct 18 (user, after testing fx-196): blade LMB attacks are big sideways swings with the weapon held straight out from the
# body. The grip travels a circle round the body (a = degrees, 0 = forward, +90 = the right side), the blade points
# outward (tilt = upward slope) and the edge leads. The torso turns with the blade. Warhammer/axe keep their keys (Halberd deleted Oct 18).
# Oct 18 (user): twin blades rest pointing forward and subtly UP (were forward-down).
HOLD_DU=(W3((.24,.2,.98),(.15,.75,.55),(0,-.6,-1)),W3((-.24,.2,.98),(-.15,.75,.55),(0,-.6,-1)))
DU_TUCK_R=W3((.24,.1,1.22),(.15,.1,1),(0,1,0));DU_TUCK_L=W3((-.24,.1,1.22),(-.15,.1,1),(0,1,0))
LS_READY=W3((.24,.24,1.05),(.25,.85,.3),(0,.3,-1))
def arc(a,h,r=.6,tilt=0,dirn=-1):
    x=math.radians(a);sn,cs=math.sin(x),math.cos(x)
    return W3((r*sn,r*cs,h),(sn,cs,tilt),(dirn*cs,-dirn*sn,0))
def tlerp(A,B,k):return tuple(x*(1-k)+y*k for x,y in zip(A,B))
def hand_at(t,ready,a0,a1,h0,h1,tw0,ts,te,th,tb,r=.6,tilt=(0,0),twk=.32):
    """One hand's swing: wind ready->a0 (tw0..ts), sweep a0->a1 (ts..te), hold (..th), back to ready (..tb). Returns (triple, twist)."""
    dirn=-1 if a1<a0 else 1;A0=arc(a0,h0,r,tilt[0],dirn);A1=arc(a1,h1,r,tilt[1],dirn)
    if t<tw0 or t>=tb:return ready,0
    if t<ts:k=ease((t-tw0)/(ts-tw0));return tlerp(ready,A0,k),-a0*twk*k
    if t<te:s=ease((t-ts)/(te-ts));a=a0+(a1-a0)*s;return arc(a,h0+(h1-h0)*s,r,tilt[0]+(tilt[1]-tilt[0])*s,dirn),-a*twk
    if t<th:return A1,-a1*twk
    k=ease((t-th)/(tb-th));return tlerp(A1,ready,k),-a1*twk*(1-k)
def sweep(t,ready,a0,a1,h0,h1,tc,r=.6,tilt=(0,0),off=None):
    """Whole-clip swing whose blade crosses straight ahead at tc (the hit moment game.js lines up with hitStart)."""
    ts=.28;te=2*tc-ts;R,tw=hand_at(t,ready,a0,a1,h0,h1,0,ts,te,.72,1,r,tilt)
    s=min(1,max(0,(t-ts)/(te-ts)));k=wkey(R,tw=tw,ln=7*math.sin(math.pi*s) if ts<=t<te else 0,off=off);return k,k,0
def dual_swings(t):
    """Twin Blades (Oct 18, user: no blade may sit idle): BOTH blades sweep together on each damage pulse, the weapon
    hand high and the other a little lower and behind it: right->left at 25%, back left->right at 75%."""
    HR,HL=HOLD_DU
    if t<.5:
        R,tw=hand_at(t,HR,110,-75,1.3,1.22,0,.1,.4,.46,.54);L,_=hand_at(t,HL,80,-105,1.06,1.0,0,.1,.4,.46,.54)
    else:
        L,tw=hand_at(t,HL,-110,75,1.3,1.22,.5,.6,.9,.94,1);R,_=hand_at(t,HR,-80,105,1.06,1.0,.5,.6,.9,.94,1)
    k=wkey(R,L,tw=tw);return k,k,0
WPN={
 'greatsword_0':lambda t:sweep(t,GS_READY,130,-120,1.22,1.18,.45,r=.5,off=-.2),
 'greatsword_1':lambda t:sweep(t,GS_READY,-120,125,1.05,1.1,.5,r=.5,off=-.2),
 'greatsword_2':lambda t:sweep(t,GS_READY,120,-120,1.62,.95,.55,r=.5,tilt=(.45,-.35),off=-.2),
 'longsword_0':lambda t:sweep(t,LS_READY,125,-115,1.3,1.25,.45),
 'longsword_1':lambda t:sweep(t,LS_READY,-115,120,1.1,1.15,.5),
 'longsword_2':lambda t:sweep(t,LS_READY,120,-120,1.58,.98,.55,tilt=(.4,-.35)),
 'dual':lambda t:dual_swings(t),
 'axe':[(0,wkey(AX_READY)),(.3,wkey(W3((.28,-.22,1.62),(0,-.5,.85),(0,-.85,-.5)),tw=18,ln=-10)),(.45,wkey(W3((.14,.42,1.34),(0,.92,.35),(0,.35,-.92)),tw=-10,ln=12)),
        (.65,wkey(W3((.02,.36,.98),(-.2,.6,-.6),(0,-.6,-.6)),tw=-16,ln=8)),(1,wkey(AX_READY))],
 # Oct 18 (user: thrust out further): deep pull-back, then a full lunge with both arms driving the shaft forward
 'warhammer_0':[(0,wkey(WH_READY,off=-.26)),(.32,wkey(W3((.12,-.06,1.7),(0,-.55,.8),(0,.8,.55)),ln=-10,tw=8,off=-.26)),
              (.45,wkey(W3((.04,.45,.98),(0,.7,-.7),(0,-.7,-.7)),ln=18,off=-.26)),(.64,wkey(W3((.04,.44,.96),(0,.7,-.72),(0,-.7,-.7)),ln=16,off=-.26)),(1,wkey(WH_READY,off=-.26))],
 # Oct 18 (user: "slam slam then jump forward slam"): 2nd slam comes down from over the left shoulder, 3rd is a leap slam
 'warhammer_1':[(0,wkey(WH_READY,off=-.26)),(.32,wkey(W3((-.1,-.04,1.68),(-.25,-.5,.8),(0,.8,.55)),ln=-8,tw=-14,off=-.26)),
              (.45,wkey(W3((.06,.46,.98),(.12,.7,-.7),(0,-.7,-.7)),ln=18,tw=6,off=-.26)),(.64,wkey(W3((.06,.44,.96),(.12,.7,-.72),(0,-.7,-.7)),ln=16,off=-.26)),(1,wkey(WH_READY,off=-.26))],
 'warhammer_2':[(0,wkey(WH_READY,off=-.26)),(.12,wkey(W3((.16,.1,1.2),(0,-.2,1),(0,1,.2)),ln=-4,off=-.26)),(.3,wkey(W3((.1,-.1,1.8),(0,-.6,.8),(0,.8,.6)),ln=-14,off=-.26)),
              (.45,wkey(W3((.04,.5,.95),(0,.7,-.72),(0,-.7,-.7)),ln=24,off=-.26)),(.66,wkey(W3((.04,.48,.93),(0,.7,-.72),(0,-.7,-.7)),ln=20,off=-.26)),(1,wkey(WH_READY,off=-.26))],
 # carry poses while idle/moving (upper-body layer in hero-3d.js)
 'hold_greatsword':[(0,wkey(GS_READY,off=-.2))],
 'hold_dual':[(0,wkey(W3((.24,.2,.98),(.15,.75,.55),(0,-.6,-1)),W3((-.24,.2,.98),(-.15,.75,.55),(0,-.6,-1))))],
 'hold_warhammer':[(0,wkey(W3((.22,.2,1.22),(.05,-.55,.83),(0,.8,.55))))],
}
def weapon_pose(name,t):
    K=WPN[name];loop=name.startswith('hold_')
    if name=='warhammer_2':  # jump arc: hips rise to ~0.45 m at mid-air and land on the slam (t=.45)
        pb=rig.pose.bones['pelvis'];m=pb.matrix.copy();m.translation.z+=.45*math.sin(math.pi*min(1,max(0,(t-.08)/.37)));pb.matrix=m;bpy.context.view_layer.update()
    if callable(K):a,b,k=K(t)
    elif loop:a=b=K[0][1];k=0
    else:
        i=max(j for j,(tk,_) in enumerate(K) if tk<=t);i=min(i,len(K)-2);(ta,a),(tb,b)=K[i],K[i+1];k=ease((t-ta)/max(1e-6,tb-ta))
    g=lambda key:a[key]*(1-k)+b[key]*k
    turn('spine_03','Z',g('tw'));turn('spine_02','X',g('ln'))
    B=Matrix.Translation(rig.pose.bones['pelvis'].head-rig.data.bones['pelvis'].head_local)  # rest body space, following the hips' height/step (the base clips twist the chest a lot)
    bob=Vector((0,0,.012*math.sin(t*2*math.pi))) if loop else Vector()
    def mix(A,C):
        if A is None and C is None:return None
        A=A or C;C=C or A;return (A[0].lerp(C[0],k)+bob,A[1]*(1-k)+C[1]*k,A[2]*(1-k)+C[2]*k)
    R=mix(a['r'],b['r']);L=mix(a['l'],b['l']);off=a['off'];rot=B.to_3x3()
    pole=lambda s:Vector(a.get('p'+s) or POLE[s]).lerp(Vector(b.get('p'+s) or POLE[s]),k)  # per-key elbow direction, eased
    if R:
        Dr=frame_of(B@R[0],rot@R[1],rot@R[2],'r');hold('r',Dr,pole('r'))
        if off is not None and not L:  # two-hander: left hand on the same shaft, knuckles toward the same edge
            z=Dr.col[2].xyz;hold('l',frame_of(Dr.translation+z*off,z,-Dr.col[1].xyz,'l'),POLE['l'])
    if L:hold('l',frame_of(B@L[0],rot@L[1],rot@L[2],'l'),pole('l'))

# ---- Ranger weapon keys (Oct 18 overnight batch; user: animations lined up with the weapons, weapons right in the hands).
# Same convention as WPN: W3(grip point, fist axis, knuckle/edge direction) in model right/forward/up metres.
# Bows sit in the LEFT fist (limbs along the fist axis, knuckles to the target) and the right hand draws the string to the
# cheek; left shoulder turned to the target (tw<0). Guns: crossbow/shotgun two-handed (left hand 'off' along the stock),
# pistols one per hand (grip = fist axis, barrel over the knuckles). Throwing weapons in the right hand.
def rotx(T,deg,pivot=(0,0,1.42)):
    """Pitch a W3 triple about the model's right axis through pivot (+deg = aim higher)."""
    if T is None:return None
    R=Matrix.Rotation(math.radians(-deg),3,'X');pv=V(*pivot)
    return (pv+R@(T[0]-pv),R@T[1],R@T[2])
def kick(T,deg,back=.05):
    """Recoil: barrel/limb pitched up about the hand, hand pushed back toward the body."""
    R=Matrix.Rotation(math.radians(-deg),3,'X');return (T[0]+V(0,-back,.03),R@T[1],R@T[2])
# Oct 18 fix (user: draw arm vanished, not pulled back far enough): full draw to the side of the jaw (~.7 m from the
# bow hand) with the elbow raised out behind the shoulder (pole), torso turned further side-on; it used to stop at the chin
# with the elbow folded down into the hood.
BOW_L=W3((-.06,.64,1.45),(0,0,1),(0,1,0))
STR_DRAWN=W3((.14,-.06,1.53),(0,0,1),(1,0,0));STR_NOCK=W3((-.04,.42,1.45),(0,0,1),(1,0,0));STR_REL=W3((.22,-.14,1.57),(0,.25,1),(1,0,0))
DRAW_POLE=V(.55,-1,.35)
def bow_keys(tw=-40,end_nocked=False):
    k=lambda r,t=tw,p=DRAW_POLE:wkey(r=r,l=BOW_L,tw=t,pr=p)
    # Oct 19 (user: Long Bow animation out of sync): the Long Bow draws every shot from the nock (game.js plays 0-.3 as the
    # visible draw), so its clip ends nocked instead of re-drawn; quick bows fire from the drawn pose at 1.
    return [(0,k(STR_NOCK,tw+8,None)),(.26,k(STR_DRAWN)),(.34,k(STR_REL,tw-3)),(.6,k(STR_NOCK,tw+8,None)),(1,k(STR_NOCK,tw+8,None) if end_nocked else k(STR_DRAWN))]
# Crossbow (Oct 18 rebuild): pistol grip vertical in the right fist, stock forward over the knuckles, butt in the right
# shoulder pocket; left hand under the fore-stock. Carried one-handed at the side, nose down.
CB_AIM=W3((.13,.3,1.38),(0,0,1),(0,1,0));CB_L=W3((.12,.46,1.47),(0,1,0),(-.5,0,-.85))
SG_AIM=W3((.12,.18,1.36),(0,1,0),(1,0,0))
PR_AIM=W3((.2,.5,1.38),(0,0,1),(0,1,0));PL_AIM=W3((-.2,.5,1.38),(0,0,1),(0,1,0))
# Kunai (Oct 18 fix, user: arm must extend further, blade straight like a throw): dart throw from beside the ear to a
# fully extended arm, blade pointing along the throw the whole way (fist axis = blade).
KU_READY=W3((.24,.2,1.15),(0,1,.1),(0,0,1));KU_WIND=W3((.26,-.1,1.62),(0,.75,.66),(0,-.66,.75));KU_REL=W3((.12,.92,1.44),(0,1,-.05),(0,0,1))
TH_READY=W3((.22,.02,1.5),(0,-.2,1),(0,1,.2));TH_WIND=W3((.27,-.14,1.57),(0,-.55,.84),(0,.84,.55));TH_REL=W3((.04,.62,1.36),(0,.35,.94),(0,.94,-.35))
CK_READY=W3((.26,.12,1.25),(0,0,1),(0,1,0));CK_WIND=W3((.4,-.16,1.22),(.3,-.5,.8),(.8,.5,0));CK_REL=W3((-.14,.6,1.28),(-.3,.4,.85),(-.8,.6,0))
FC_READY=W3((-.16,.3,1.3),(0,0,1),(0,1,0));FC_LAUNCH=W3((-.08,.62,1.6),(0,.35,.94),(0,.94,-.35))
# Oct 19 (user list). Instant throws are seen from the release (t=.3) on, so each clip ends (t=1) cocked for the next throw.
# Potion overhand: flask cocked high behind the head, whipped over the top, arm follows through down across the body.
PO_COCK=W3((.27,-.16,1.72),(0,-.3,.95),(0,.95,.3));PO_DEEP=W3((.29,-.26,1.8),(0,-.5,.86),(0,.86,.5));PO_REL=W3((.13,.5,1.64),(0,.7,.7),(0,.7,-.7))
PO_FOLLOW=W3((.04,.52,1.12),(0,.4,-.9),(0,-.9,-.4));PO_MID=W3((.25,.1,1.42),(0,0,1),(0,1,0));OVER_POLE=V(1,-.3,.1)
# Kunai (Oct 19, user: flick the blade better): arm snaps out, then the wrist flicks the blade down; recocks beside the ear.
KU_COCK=W3((.27,-.06,1.6),(0,.62,.78),(0,-.78,.62));KU_FLICK=W3((.1,.95,1.36),(0,.78,-.62),(0,.62,.78))
# Daggers: low side-arm flicks, alternating hands; the idle hand keeps its dagger ready at the hip
DG_COCK_R=W3((.3,.02,1.38),(.25,.6,.76),(0,-.78,.62));DG_REL_R=W3((.08,.86,1.3),(0,1,-.08),(0,0,1));DG_FLICK_R=W3((.06,.9,1.22),(0,.75,-.66),(0,.66,.75))
DG_READY_R=W3((.24,.24,1.12),(0,1,.2),(0,0,1))
def mirror(T):return None if T is None else (Vector((-T[0].x,T[0].y,T[0].z)),Vector((-T[1].x,T[1].y,T[1].z)),Vector((-T[2].x,T[2].y,T[2].z)))
# Chakram (Oct 19, user: fix the animation big time): backhand — disc cocked across the chest on the left, whipped out to the right
CK_COCK=W3((-.18,.18,1.26),(-.35,-.2,.9),(-.85,-.5,0));CK_OUT=W3((.3,.64,1.3),(.3,.4,.86),(.8,.6,0));CK_FOLLOW=W3((.46,.32,1.24),(.4,-.1,.9),(.6,-.8,0))
# Bomb Bag: underhand bowl so the bomb skips along the ground; Sludge Barrel: lean down and set the keg in front
BB_COCK=W3((.27,-.3,1.0),(0,-.2,-.98),(0,-.98,.2));BB_REL=W3((.15,.56,1.12),(0,.6,.8),(0,.8,-.6));BB_FOLLOW=W3((.1,.58,1.45),(0,.3,.95),(0,.95,-.3))
BR_HOLD=W3((.2,.3,1.18),(0,0,1),(0,1,0));BR_DOWN=W3((.15,.58,.72),(0,0,1),(0,1,0))
# Rifle (Oct 19, user: sniper with the butt in the shoulder): grip just in front of the right shoulder, barrel level, left hand far out on the fore-end
RF_AIM=W3((.13,.3,1.46),(0,1,0),(1,0,0))
RWPN={
 'r_bow':bow_keys(),'r_longbow':bow_keys(-44,True),'r_shortbow':bow_keys(-36),
 'r_crossbow':[(0,wkey(CB_AIM,CB_L,tw=-20)),(.3,wkey(CB_AIM,CB_L,tw=-20)),(.36,wkey(kick(CB_AIM,10),kick(CB_L,10),tw=-22,ln=-4)),(.7,wkey(CB_AIM,CB_L,tw=-20)),(1,wkey(CB_AIM,CB_L,tw=-20))],
 'r_shotgun':[(0,wkey(SG_AIM,off=.32,tw=-10)),(.3,wkey(SG_AIM,off=.32,tw=-10)),(.36,wkey(kick(SG_AIM,22,.09),off=.32,tw=-14,ln=-8)),
              (.55,wkey(SG_AIM,off=.2,tw=-10)),(.75,wkey(SG_AIM,off=.32,tw=-10)),(1,wkey(SG_AIM,off=.32,tw=-10))],   # recoil, then pump the fore-end
 'r_pistols':[(0,wkey(PR_AIM,PL_AIM)),(.3,wkey(PR_AIM,PL_AIM)),(.36,wkey(kick(PR_AIM,26),PL_AIM,tw=4)),(.7,wkey(PR_AIM,PL_AIM)),(1,wkey(PR_AIM,PL_AIM))],
 'r_pistols_l':[(0,wkey(PR_AIM,PL_AIM)),(.3,wkey(PR_AIM,PL_AIM)),(.36,wkey(PR_AIM,kick(PL_AIM,26),tw=-4)),(.7,wkey(PR_AIM,PL_AIM)),(1,wkey(PR_AIM,PL_AIM))],
 'r_shuriken':[(0,wkey(TH_READY,tw=6)),(.22,wkey(TH_WIND,tw=16,ln=-4)),(.3,wkey(TH_REL,tw=-14,ln=8)),(.5,wkey(TH_REL,tw=-12,ln=6)),(1,wkey(TH_READY,tw=6))],
 'r_kunai':[(0,wkey(KU_COCK,tw=18,ln=-3,pr=V(1,-.2,-.4))),(.2,wkey(KU_WIND,tw=22,ln=-5,pr=V(1,-.2,-.4))),(.3,wkey(KU_REL,tw=-18,ln=10)),(.37,wkey(KU_FLICK,tw=-20,ln=12)),(.55,wkey(KU_FLICK,tw=-16,ln=9)),
            (.78,wkey(KU_READY,tw=4)),(1,wkey(KU_COCK,tw=18,ln=-3,pr=V(1,-.2,-.4)))],
 'r_chakram':[(0,wkey(CK_COCK,tw=-30,ln=2)),(.22,wkey(CK_COCK,tw=-34,ln=3)),(.3,wkey(CK_OUT,tw=20,ln=6)),(.45,wkey(CK_FOLLOW,tw=28,ln=4)),(.7,wkey(CK_READY,tw=4)),(1,wkey(CK_COCK,tw=-30,ln=2))],
 'r_potion':[(0,wkey(PO_COCK,tw=12,ln=-3,pr=OVER_POLE)),(.22,wkey(PO_DEEP,tw=20,ln=-7,pr=OVER_POLE)),(.3,wkey(PO_REL,tw=-14,ln=8)),(.45,wkey(PO_FOLLOW,tw=-22,ln=15)),
             (.72,wkey(PO_MID,tw=0,ln=2)),(1,wkey(PO_COCK,tw=12,ln=-3,pr=OVER_POLE))],
 'r_bombbag':[(0,wkey(BB_COCK,tw=14,ln=6)),(.22,wkey(BB_COCK,tw=18,ln=8)),(.3,wkey(BB_REL,tw=-8,ln=12)),(.45,wkey(BB_FOLLOW,tw=-12,ln=4)),(.75,wkey(PO_MID)),(1,wkey(BB_COCK,tw=14,ln=6))],
 'r_barrel':[(0,wkey(BR_HOLD,mirror(BR_HOLD))),(.3,wkey(BR_DOWN,mirror(BR_DOWN),ln=28)),(.5,wkey(BR_DOWN,mirror(BR_DOWN),ln=26)),(.8,wkey(BR_HOLD,mirror(BR_HOLD),ln=4)),(1,wkey(BR_HOLD,mirror(BR_HOLD)))],
 'r_daggers':[(0,wkey(DG_COCK_R,mirror(DG_READY_R),tw=16)),(.3,wkey(DG_REL_R,mirror(DG_READY_R),tw=-16,ln=8)),(.36,wkey(DG_FLICK_R,mirror(DG_READY_R),tw=-18,ln=9)),(.6,wkey(DG_READY_R,mirror(DG_READY_R),tw=-4)),(1,wkey(DG_READY_R,mirror(DG_COCK_R),tw=-12))],
 'r_daggers_l':[(0,wkey(DG_READY_R,mirror(DG_COCK_R),tw=-16)),(.3,wkey(DG_READY_R,mirror(DG_REL_R),tw=16,ln=8)),(.36,wkey(DG_READY_R,mirror(DG_FLICK_R),tw=18,ln=9)),(.6,wkey(DG_READY_R,mirror(DG_READY_R),tw=4)),(1,wkey(DG_COCK_R,mirror(DG_READY_R),tw=12))],
 'r_rifle':[(0,wkey(RF_AIM,off=.46,tw=-14)),(.3,wkey(RF_AIM,off=.46,tw=-14)),(.35,wkey(kick(RF_AIM,9,.06),off=.46,tw=-17,ln=-6)),(.6,wkey(RF_AIM,off=.46,tw=-14)),
            (.75,wkey(RF_AIM,W3((.28,.3,1.5),(0,0,1),(0,1,0)),tw=-14)),(.9,wkey(RF_AIM,off=.46,tw=-14)),(1,wkey(RF_AIM,off=.46,tw=-14))],   # recoil into the shoulder, then work the bolt
 'hold_rifle':[(0,wkey(W3((.2,.14,1.05),(-.25,.6,.76),(1,0,0)),off=.4))],
 'r_falconer':[(0,wkey(l=FC_READY)),(.22,wkey(l=rotx(FC_READY,-12),ln=-3)),(.3,wkey(l=FC_LAUNCH,ln=6)),(.55,wkey(l=FC_LAUNCH,ln=4)),(1,wkey(l=FC_READY))],
 'hold_bow':[(0,wkey(l=W3((-.27,.14,.98),(0,.4,.92),(0,.92,-.4))))],
 'hold_longbow':[(0,wkey(l=W3((-.27,.18,1.02),(0,.5,.87),(0,.87,-.5))))],   # tilted forward so the long lower limb clears the ground
 'hold_shortbow':[(0,wkey(l=W3((-.26,.12,.95),(0,.35,.94),(0,1,-.35))))],
 'hold_crossbow':[(0,wkey(W3((.22,.14,1.0),(0,.45,.89),(0,.89,-.45))))],
 'hold_shotgun':[(0,wkey(W3((.2,.16,1.06),(-.3,.55,.78),(1,0,0)),off=.32))],
 'hold_pistols':[(0,wkey(W3((.22,.22,1.04),(0,.5,.86),(0,.86,-.5)),W3((-.22,.22,1.04),(0,.5,.86),(0,.86,-.5))))],
 'hold_falconer':[(0,wkey(l=FC_READY))],
}
for _w in RANGER_WEAPONS:  # aimed-up variants (Archer Volley etc.)
    RWPN['r_'+_w+'_up']=[(t,dict(k,r=rotx(k['r'],40),l=rotx(k['l'],40))) for t,k in RWPN['r_'+_w]]
WPN.update(RWPN)
def arms_out(t):
    # Ninja Cyclone: arms flung out level to both sides, weapons outward (the game spins the whole body)
    k=ease(t/.25)
    for side,x in (('l',1),('r',-1)):aim('upperarm_'+side,(x,-.15,.05),k);aim('lowerarm_'+side,(x,-.2,.08),k)

# ---- camera, lights, render (boss pipeline look: Eevee, Freestyle outline, transparent film) ----
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=3.4;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
el=math.radians(30);co.location=(0,-30*math.cos(el),30*math.sin(el));co.rotation_euler=(math.radians(90)-el,0,0);scn.camera=co
for l in [o for o in bpy.data.objects if o.type=='LIGHT']:l.hide_render=True
rim=bpy.data.lights.new('rim','SUN');rim.energy=2.2;rim.color=(1.0,.75,.55);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=4.8;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;bg=w.node_tree.nodes['Background'];bg.inputs['Color'].default_value=(.6,.5,.45,1);bg.inputs['Strength'].default_value=.45
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
if PASS=='color':
    scn.eevee.taa_render_samples=12
    scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE'
    fs=scn.view_layers[0].freestyle_settings;ls=fs.linesets[0] if fs.linesets else fs.linesets.new('outline')
    ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False
    ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.07,.045,.035);ls.linestyle.thickness=1.7*SIZE/512
else:
    # colour-region pass: flat emission of a region-ID texture (made by compose_warrior.py --regions), no AA, no outline
    scn.eevee.taa_render_samples=1;scn.render.filter_size=0;scn.render.use_freestyle=False;bg.inputs['Strength'].default_value=0
    ids=bpy.data.images.load(os.path.join(ROOT,'tmp','warrior-src','Textures','Knight','T_Knight_Regions.png'));ids.colorspace_settings.name='Non-Color'
    m=bpy.data.materials['MI_Knight'];nt=m.node_tree
    for n in list(nt.nodes):nt.nodes.remove(n)
    tex=nt.nodes.new('ShaderNodeTexImage');tex.image=ids;tex.interpolation='Closest'
    em=nt.nodes.new('ShaderNodeEmission');outn=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tex.outputs['Color'],em.inputs['Color']);nt.links.new(em.outputs['Emission'],outn.inputs['Surface'])

only=envlist('WARRIOR_ONLY');rows=[int(r) for r in envlist('WARRIOR_ROWS') or range(8)];frames=[int(f) for f in envlist('WARRIOR_FRAMES') or range(15)]
for clip,cfg in CLIPS.items():
    if only and clip not in only:continue
    os.makedirs(os.path.join(OUT,clip),exist_ok=True)
    for fi in frames:
        t=fi/15 if cfg.get('loop') else fi/14
        name,f=sample(clip,t);pose_at(name,f)
        if cfg.get('cry'):war_cry(t)
        if cfg.get('nova'):nova(t)
        if cfg.get('channel'):channel_pose(t)
        if cfg.get('lmb'):lmb_pose(cfg['lmb'],t)
        if cfg.get('arms'):arms_out(t)
        if cfg.get('hold'):hold_pose(cfg['hold'],t)
        if cfg.get('chan'):chan_pose(cfg['chan'],t)
        if cfg.get('wpn'):weapon_pose(cfg['wpn'],t)
        for r in rows:
            yaw=DIRS[r]+(fi/15*360 if cfg.get('spin') else 0)
            rig.rotation_euler=(0,0,math.radians(yaw));bpy.context.view_layer.update()
            scn.render.filepath=os.path.join(OUT,clip,f'r{r}_f{fi}.png');bpy.ops.render.render(write_still=True)
    print('CLIP',clip,'done')
