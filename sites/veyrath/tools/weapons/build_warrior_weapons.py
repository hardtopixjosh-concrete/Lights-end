"""Warrior weapon models (Oct 18, weapon models batch 2; user: Blender-scripted, Quaternius low-poly style). One per LMB family:
longsword, greatsword, dual (+ dual_l for the left hand), axe (Throwing Axe), warhammer (Halberd deleted Oct 18, user). Same grip space, materials
contract ('Crystal' = rarity glow, 'Rune' = colour rune) and builders as build_mage_weapons.py.

  blender -b ../../tmp/warrior-src/All_Male.blend --python tools/weapons/build_warrior_weapons.py              # export
  WEAPON_PREVIEW=1 [WEAPON_ONLY=greatsword,...] blender -b ../../tmp/warrior-src/All_Male.blend --python tools/weapons/build_warrior_weapons.py

Edges/striking faces point along -Y in the right-hand grip (the knuckle side); two-handed weapons mark the off-hand
position with an empty '<id>_off' (the attack/hold clips in build_warrior.py put the left hand there)."""
import bpy,math,os
from mathutils import Matrix,Vector
HERE=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE,'build_mage_weapons.py'),encoding='utf-8').read().split('X=.03  # shaft line')[0])  # materials + builders
OUT=os.path.abspath(os.path.join(HERE,'..','..','dist','assets','hero','weapons-warrior.glb'))
M.update(steel=mat('Steel',(.78,.8,.84),.9,.3),dsteel=mat('DarkSteel',(.36,.37,.42),.85,.4),red=mat('Cloth',(.55,.1,.08)))
X=.03

def blade(z0,z1,w,t,m,tip=.12,edge=-1):
    """Flat diamond-section blade along Z (width along Y, thickness along X), pointed tip."""
    import bmesh
    bm=bmesh.new();v=lambda x,y,z:bm.verts.new((x,y,z))
    sec=lambda z,hw,ht:[v(0,-hw,z),v(ht,0,z),v(0,hw,z),v(-ht,0,z)]
    a=sec(z0,w/2,t/2);b=sec(z1-tip,w/2*.85,t/2);p=v(0,0,z1)
    for i in range(4):bm.faces.new((a[i],a[(i+1)%4],b[(i+1)%4],b[i]));bm.faces.new((b[i],b[(i+1)%4],p))
    bm.faces.new(list(reversed(a)));bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return obj(bm,'blade',m)
def place(P,dx=X):
    for p in P:p.location.x+=dx
def mark(root,name,pos):
    e=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(e);e.parent=root;e.location=pos;return e

def longsword():
    P=[ico((0,0,-.15),.03,M['crystal'],1),lathe([(.024,-.13),(.02,-.115),(.018,.1),(.022,.115)],M['leather'],7),
       box((0,0,.13),(.04,.28,.035),M['gold']),box((0,0,.13),(.044,.06,.05),M['rune']),
       blade(.14,1.12,.075,.018,M['steel'])]
    place(P);return finish('longsword',P,(X,0,1.12))
def greatsword():
    P=[ico((0,0,-.33),.04,M['crystal'],1),lathe([(.026,-.31),(.022,-.29),(.022,.07),(.026,.09)],M['leather'],7),
       lathe([(.03,-.12),(.03,-.1)],M['gold'],7),
       box((0,0,.11),(.05,.42,.045),M['dsteel']),box((0,0,.11),(.056,.08,.07),M['gold']),
       box((0,.21,.13),(.05,.04,.08),M['gold']),box((0,-.21,.13),(.05,.04,.08),M['gold']),
       blade(.13,1.58,.13,.026,M['steel'],tip=.2),box((.014,0,.5),(.004,.02,.6),M['rune'])]
    place(P);r=finish('greatsword',P,(X,0,1.58));mark(r,'greatsword_off',(X,0,-.2));return r
def dual(wid='dual'):
    # Oct 18 (user: "his hands are holding it wrong"): the fist sat on the pommel end with ~15 cm of bare handle up to the
    # guard. Short handle now: guard right above the fist (grip origin = fist centre), pommel just below it. Blade length kept.
    P=[lathe([(.022,-.06),(.016,-.05),(.016,.025),(.02,.032)],M['leather'],6),ico((0,0,-.07),.022,M['crystal'],1),
       box((0,0,.045),(.035,.17,.03),M['gold']),blade(.06,.68,.06,.016,M['steel'],tip=.14),box((.008,0,.27),(.003,.014,.25),M['rune'])]
    place(P);return finish(wid,P,(X,0,.68))
def axe():
    P=[lathe([(.02,-.14),(.026,-.12),(.02,-.1),(.018,.42)],M['wood'],6),lathe([(.021,-.08),(.021,.06)],M['leather'],6),
       lathe([(.022,.3),(.022,.44)],M['dsteel'],6)]
    import bmesh  # bearded single-bit head on the -Y (edge) side
    bm=bmesh.new();pts=[(-.03,.44),(-.03,.31),(-.11,.26),(-.17,.24),(-.18,.36),(-.17,.48),(-.12,.47)]
    f=[bm.verts.new((.012,y,z)) for y,z in pts];b=[bm.verts.new((-.012,y,z)) for y,z in pts]
    bm.faces.new(f);bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):j=(i+1)%len(pts);bm.faces.new((f[i],b[i],b[j],f[j]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);P.append(obj(bm,'axehead',M['steel']))
    P+=[box((0,.04,.38),(.02,.05,.04),M['dsteel']),box((0,-.03,.38),(.03,.012,.08),M['rune']),crystal(-.17,.016,.05,M['crystal'],axis=Matrix.Rotation(math.pi,4,'X'))]
    place(P);return finish('axe',P,(X,-.15,.37))
def warhammer():
    P=[lathe([(.03,-.4),(.034,-.36),(.026,-.33)],M['dsteel'],7),lathe([(.024,-.33),(.022,.86)],M['wood'],7),
       lathe([(.027,-.06),(.027,.08)],M['leather'],7),lathe([(.027,-.3),(.027,-.16)],M['leather'],7),
       lathe([(.03,.6),(.03,.66)],M['rune'],7),
       box((0,-.04,.95),(.17,.22,.17),M['dsteel']),box((0,-.16,.95),(.2,.04,.2),M['steel']),     # head block + striking face (-Y)
       lathe([(.05,.0),(.0,.16)],M['steel'],4,Matrix.Translation((0,.07,.95))@Matrix.Rotation(-math.pi/2,4,'X')),  # back spike (+Y)
       box((0,-.04,1.05),(.18,.23,.02),M['gold']),box((0,-.04,.85),(.18,.23,.02),M['gold']),
       crystal(0,.035,.08,M['crystal'],segs=4,axis=Matrix.Translation((.09,-.04,.95))@Matrix.Rotation(math.pi/2,4,'Y'))]
    place(P);r=finish('warhammer',P,(X,-.18,.95));mark(r,'warhammer_off',(X,0,-.24));return r

# ---- Oct 18 new Warrior families (user list by subclass). Same grip space: blade/edge along Z with the edge on -Y; two-handers mark '<id>_off'.
def plate(pts,th,m,dx=0):
    """Flat polygon in the Y-Z plane (points (y,z)), th thick along X."""
    import bmesh
    bm=bmesh.new();f=[bm.verts.new((dx+th/2,y,z)) for y,z in pts];b=[bm.verts.new((dx-th/2,y,z)) for y,z in pts]
    bm.faces.new(f);bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):j=(i+1)%len(pts);bm.faces.new((f[i],b[i],b[j],f[j]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return obj(bm,'plate',m)
def maul():
    P=[lathe([(.026,-.36),(.022,-.33),(.022,.78)],M['wood'],7),lathe([(.026,-.3),(.026,-.14)],M['leather'],7),lathe([(.026,-.05),(.026,.08)],M['leather'],7),
       lathe([(.0,.74),(.11,.76),(.13,.86),(.13,1.0),(.11,1.08),(.0,1.1)],M['dsteel'],10),                    # round blunt head
       lathe([(.135,.82),(.135,.85)],M['gold'],10),lathe([(.135,1.01),(.135,1.04)],M['gold'],10),lathe([(.136,.9),(.136,.95)],M['rune'],10),
       crystal(1.1,.03,.07,M['crystal'],segs=4)]
    place(P);r=finish('maul',P,(X,0,.92));mark(r,'maul_off',(X,0,-.22));return r
def greataxe():
    P=[lathe([(.024,-.42),(.022,-.4),(.021,1.02)],M['wood'],7),lathe([(.025,-.34),(.025,-.18)],M['leather'],7),lathe([(.025,-.04),(.025,.1)],M['leather'],7),
       plate([(-.03,1.0),(-.03,.78),(-.16,.7),(-.3,.66),(-.33,.84),(-.3,1.04),(-.16,1.02)],.026,M['steel']),     # big front bit (-Y edge)
       plate([(.03,.98),(.03,.8),(.12,.76),(.18,.82),(.17,.94),(.12,.99)],.022,M['steel']),                      # smaller back bit
       box((0,0,.9),(.05,.07,.24),M['dsteel']),box((0,-.03,.9),(.03,.01,.12),M['rune']),lathe([(.0,1.02),(.03,1.04),(.0,1.14)],M['steel'],4),
       crystal(.9,.02,.05,M['crystal'],segs=4,axis=Matrix.Translation((.03,0,0))@Matrix.Rotation(math.pi/2,4,'Y'))]
    place(P);r=finish('greataxe',P,(X,-.3,.86));mark(r,'greataxe_off',(X,0,-.24));return r
def spearshield():
    P=[lathe([(.02,-.32),(.018,-.3),(.017,.92)],M['wood'],7),lathe([(.021,-.06),(.021,.08)],M['leather'],7),
       lathe([(.024,.9),(.024,.96)],M['gold'],7),lathe([(.012,.95),(.05,1.04),(.0,1.28)],M['steel'],4,twist=math.pi/4),lathe([(.023,.4),(.023,.44)],M['rune'],7),
       ico((0,0,-.33),.026,M['crystal'],1)]
    place(P);return finish('spearshield',P,(X,0,1.28))
def shield_l():
    face=Matrix.Translation((.0,.07,.04))@Matrix.Rotation(-math.pi/2,4,'X')                                 # disc normal toward the left knuckles (+Y)
    P=[lathe([(.0,.0),(.3,.0),(.3,.03),(.26,.05),(.0,.06)],M['dsteel'],16,face),                            # round hoplite-style shield
       lathe([(.302,.0),(.302,.035)],M['gold'],16,face),lathe([(.0,.055),(.07,.06),(.05,.1),(.0,.11)],M['steel'],10,face),  # rim + boss
       lathe([(.2,.05),(.22,.05),(.22,.058),(.2,.058)],M['rune'],16,face),crystal(0,.03,.06,M['crystal'],segs=4,axis=face@Matrix.Translation((0,0,.1)))]
    return finish('shield_l',P,(0,.2,.04))
def runeblade():
    P=[ico((0,0,-.16),.032,M['crystal'],1),lathe([(.024,-.14),(.02,-.12),(.018,.1),(.022,.115)],M['leather'],7),
       box((0,0,.13),(.045,.3,.04),M['dsteel']),box((0,0,.13),(.05,.07,.055),M['rune']),
       blade(.14,1.22,.085,.02,M['steel']),box((.011,0,.66),(.004,.022,.9),M['crystal'])]                       # glowing rune channel down the blade
    place(P);return finish('runeblade',P,(X,0,1.22))
def gauntlet(wid,mirror=False):
    P=[box((0,0,.0),(.1,.11,.12),M['dsteel']),box((0,-.06,.01),(.11,.02,.13),M['steel']),                     # fist shell + knuckle plate (-Y)
       lathe([(.06,-.16),(.064,-.08),(.058,-.05)],M['dsteel'],8),lathe([(.065,-.12),(.065,-.1)],M['gold'],8),   # cuff
       box((.0,.058,.0),(.06,.006,.06),M['rune']),ico((0,-.075,.03),.016,M['crystal'],1)]
    if mirror:
        for o in P:o.data.transform(Matrix.Diagonal((1,-1,1,1)));o.data.flip_normals()
    return finish(wid,P,(0,(.08 if mirror else -.08),.02))
def gauntlets():return gauntlet('gauntlets')
def gauntlets_l():return gauntlet('gauntlets_l',True)
def katana():
    P=[lathe([(.02,-.3),(.018,-.28),(.018,.08),(.02,.1)],M['leather'],7),ico((0,0,-.31),.022,M['crystal'],1),
       lathe([(.0,.1),(.07,.1),(.07,.115),(.0,.115)],M['gold'],10),box((0,0,.13),(.03,.035,.03),M['rune']),
       blade(.13,1.08,.045,.012,M['steel'],tip=.16)]
    for o in P[-1:]:o.data.transform(Matrix.Rotation(.04,4,'X'))                                              # slight curve-forward lean
    place(P);return finish('katana',P,(X,-.03,1.08))
def enchspear():
    P=[lathe([(.022,-.42),(.02,-.4),(.019,1.02)],M['wood'],7),lathe([(.023,-.3),(.023,-.16)],M['leather'],7),lathe([(.023,-.02),(.023,.12)],M['leather'],7),
       lathe([(.026,.98),(.026,1.04)],M['gold'],7),lathe([(.018,1.03),(.06,1.12),(.0,1.42)],M['crystal'],4,twist=math.pi/4),   # glowing blade
       lathe([(.024,.6),(.024,.64)],M['rune'],7),lathe([(.024,.8),(.024,.84)],M['rune'],7)]
    place(P);r=finish('enchspear',P,(X,0,1.42));mark(r,'enchspear_off',(X,0,-.22));return r
def standard():
    P=[lathe([(.022,-.4),(.02,-.38),(.019,1.2)],M['wood'],7),lathe([(.023,-.04),(.023,.1)],M['leather'],7),
       lathe([(.012,1.18),(.04,1.24),(.0,1.4)],M['steel'],4,twist=math.pi/4),lathe([(.03,1.16),(.03,1.2)],M['gold'],7),
       box((0,-.17,1.0),(.008,.32,.34),M['red']),box((0,-.17,.84),(.009,.33,.02),M['gold']),box((.006,-.17,1.0),(.004,.1,.12),M['rune']),
       box((0,-.01,1.17),(.02,.04,.02),M['gold']),crystal(1.4,.02,.04,M['crystal'],segs=4)]
    place(P);r=finish('standard',P,(X,0,1.4));mark(r,'standard_off',(X,0,-.22));return r
def lance():
    P=[lathe([(.022,-.36),(.026,-.3),(.024,-.02)],M['leather'],7),
       lathe([(.0,-.02),(.11,.0),(.06,.12),(.03,.16)],M['gold'],10),                                           # vamplate hand guard
       lathe([(.045,.14),(.034,.7),(.018,1.3),(.0,1.62)],M['steel'],8),                                       # long tapered lance
       lathe([(.047,.3),(.047,.36)],M['rune'],8),ico((0,0,-.37),.026,M['crystal'],1)]
    place(P);r=finish('lance',P,(X,0,1.62));mark(r,'lance_off',(X,0,-.24));return r
def chainaxe():
    P=[lathe([(.022,-.14),(.026,-.12),(.02,-.1),(.018,.12)],M['wood'],6),lathe([(.021,-.07),(.021,.06)],M['leather'],6)]
    for i in range(3):P.append(tube(arc((0,0,.15+i*.055),.022,0,2*math.pi,8,'xz' if i%2 else 'yz'),.006,M['dsteel']))   # chain links
    P+=[ico((0,0,.38),.07,M['dsteel'],2),lathe([(.072,.36),(.072,.4)],M['rune'],10)]
    for k in range(6):a=k*math.pi/3;d=Vector((0,math.cos(a),math.sin(a)*.0+0));P.append(lathe([(.02,0),(.0,.07)],M['steel'],4,Matrix.Translation((0,math.cos(a)*.065,.38+math.sin(a)*.065))@Matrix.Rotation(-a,4,'X')@Matrix.Rotation(-math.pi/2,4,'X')))
    P.append(crystal(.47,.016,.04,M['crystal'],segs=4))
    place(P);return finish('chainaxe',P,(X,0,.38))
def glaive():
    P=[lathe([(.023,-.44),(.021,-.42),(.02,1.0)],M['dark'] if 'dark' in M else M['wood'],7),lathe([(.024,-.32),(.024,-.18)],M['leather'],7),lathe([(.024,-.03),(.024,.11)],M['leather'],7),
       lathe([(.03,.96),(.03,1.02)],M['gold'],7),
       plate([(.02,1.0),(-.04,1.0),(-.14,1.1),(-.17,1.26),(-.12,1.42),(-.05,1.5),(-.04,1.36),(-.08,1.22),(-.02,1.1)],.022,M['steel']),   # sweeping curved blade (-Y)
       box((0,-.03,1.06),(.03,.012,.1),M['rune']),crystal(1.02,.02,.05,M['crystal'],segs=4,axis=Matrix.Translation((.025,0,0))@Matrix.Rotation(math.pi/2,4,'Y'))]
    place(P);r=finish('glaive',P,(X,-.12,1.3));mark(r,'glaive_off',(X,0,-.24));return r
# Oct 18 (user, after testing): every Warrior weapon bigger, especially the greatsword and the twin blades.
# Scales about the grip (handles stay in the palm); markers move with the geometry.
SCALE=dict(longsword=1.35,greatsword=1.55,dual=1.6,dual_l=1.6,axe=1.75,warhammer=1.35,maul=1.35,greataxe=1.45,spearshield=1.35,shield_l=1.3,runeblade=1.35,gauntlets=1.4,gauntlets_l=1.4,katana=1.35,enchspear=1.35,standard=1.3,lance=1.3,chainaxe=1.6,glaive=1.4)
def grown(make,wid):
    def f(*a):
        r=make(*a);k=SCALE[wid]
        for c in r.children:
            if c.type=='MESH':c.data.transform(Matrix.Scale(k,4))
            else:c.location=(c.location.x,c.location.y*k,c.location.z*k)
        return r
    return f
_dual=dual;dual_l=grown(lambda:_dual('dual_l'),'dual_l')
longsword,greatsword,dual,axe,warhammer=(grown(f,n) for f,n in ((longsword,'longsword'),(greatsword,'greatsword'),(dual,'dual'),(axe,'axe'),(warhammer,'warhammer')))
MAKERS=dict(longsword=longsword,greatsword=greatsword,dual=dual,axe=axe,warhammer=warhammer)
NEW_IDS=('maul','greataxe','spearshield','runeblade','gauntlets','katana','enchspear','standard','lance','chainaxe','glaive')
MAKERS.update({n:grown(globals()[n],n) for n in NEW_IDS})
shield_l=grown(shield_l,'shield_l');gauntlets_l=grown(gauntlets_l,'gauntlets_l')

if not PREVIEW:
    for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
    roots=[f() for f in MAKERS.values()]+[dual_l(),shield_l(),gauntlets_l()]
    bpy.ops.object.select_all(action='DESELECT')
    for r in roots:
        r.select_set(True)
        for c in r.children:c.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_apply=True)
    print('EXPORTED',OUT,os.path.getsize(OUT)//1024,'KB')
else:
    os.environ.update(HERO='warrior',WARRIOR_ONLY='none',WARRIOR_SIZE=os.environ.get('WEAPON_PREVIEW_SIZE','384'))
    exec(open(os.path.join(HERE,'..','warrior','build_warrior.py'),encoding='utf-8').read())
    PV=os.path.join(ROOT,'tmp','weapon-preview');os.makedirs(PV,exist_ok=True)
    # weapon -> (clips, sample times); dual also gets dual_l in the left hand; two-handers curl both hands
    SHOTS=dict(longsword=(['W_longsword_0','W_longsword_1','W_longsword_2'],[.28,.45,.6]),greatsword=(['Hold_greatsword','W_greatsword_0','W_greatsword_1','W_greatsword_2'],[.28,.48,.62]),
               dual=(['Hold_dual','W_dual'],[.1,.25,.6,.75]),Rolling=(['Rolling'],[.2,.5,.8]),axe=(['Idle','W_axe'],[.3,.45]),
               warhammer=(['W_warhammer_1','W_warhammer_2'],[.15,.3,.45]))
    only=os.environ.get('WEAPON_ONLY');rows=[int(r) for r in os.environ.get('WEAPON_ROWS','1,0').split(',')]
    for wid,(clips,ts) in SHOTS.items():
        if only and wid not in only.split(','):continue
        objs=[(MAKERS.get(wid,MAKERS['longsword'])(),'r')]+([(dual_l(),'l')] if wid=='dual' else [])
        both=wid in ('greatsword','warhammer','dual')
        for w,_ in objs:w.parent=rig;w.matrix_parent_inverse=Matrix()
        for clip in clips:
            cfg=CLIPS[clip]
            for t in ([0] if cfg.get('loop') else ts):
                name,f=sample(clip,t);pose_at(name,f)
                if cfg.get('wpn'):weapon_pose(cfg['wpn'],t)
                for w,side in objs:w.matrix_basis=grip_world(side)
                for side in (('r','l') if both else ('r',)):curl_hand(side,28)
                for r in rows:
                    rig.rotation_euler=(0,0,math.radians(DIRS[r]));bpy.context.view_layer.update()
                    scn.render.filepath=os.path.join(PV,f'{wid}_{clip}_t{int(t*100):02d}_r{r}.png');bpy.ops.render.render(write_still=True)
        for w,_ in objs:
            for c in list(w.children_recursive)+[w]:bpy.data.objects.remove(c,do_unlink=True)
        print('PREVIEW',wid)
