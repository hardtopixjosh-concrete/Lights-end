"""Ranger weapon models (Oct 18 overnight batch; user: all Ranger weapons, lined up in the hands, rarity colours).
Ten LMB families + pistols_l (left gun) + the 3D hawk for Falconer's Glove. Same grip space, builders and material
contract as build_mage_weapons.py ('Crystal' = rarity glow, 'Rune' = colour rune, Steel/DarkSteel/Gold = rarity tint;
Wood/DarkWood/Leather/Cloth keep their colour).

  blender -b ../../tmp/warrior-src/All_Male.blend --python tools/weapons/build_ranger_weapons.py              # export
  WEAPON_PREVIEW=1 [WEAPON_ONLY=bow,...] blender -b ../../tmp/warrior-src/All_Male.blend --python tools/weapons/build_ranger_weapons.py

Grip space (Blender): +Z through the fist (thumb/index side), right grip -Y = knuckles/edge, left grip +Y = knuckles.
Bows are LEFT-hand weapons: limbs along Z, back toward the target (+Y), string on the archer side (-Y). '<id>_sa'/'<id>_sb'
mark the string ends; hero-3d.js draws the live string to the drawing hand and hides the static '<id>_string'.
Guns held like a rod (fist axis = stock, forward), so +X is down and the sights/rail sit at -X.
'<id>_tip' = VFX origin (arrow rest / muzzle / blade). Falconer: 'falconer_perch' = perched hawk, hidden while it flies.
Hawk: forward -Y, up +Z, wings 'hawk_wing_l'/'hawk_wing_r' pivot at the shoulders (hero-3d.js flaps them)."""
import bpy,math,os
from mathutils import Matrix,Vector
HERE=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE,'build_mage_weapons.py'),encoding='utf-8').read().split('X=.03  # shaft line')[0])  # materials + builders
OUT=os.path.abspath(os.path.join(HERE,'..','..','dist','assets','hero','weapons-ranger.glb'))
garc=arc  # geometry arc (build_warrior.py defines its own pose arc() in preview mode)
M.update(wood=mat('Wood',(.16,.085,.04)),dark=mat('DarkWood',(.075,.04,.02)),leather=mat('Leather',(.09,.045,.025)),
         steel=mat('Steel',(.78,.8,.84),.9,.3),dsteel=mat('DarkSteel',(.36,.37,.42),.85,.4),cloth=mat('Cloth',(.18,.32,.16)),
         string=mat('String',(.86,.82,.7),0,.8),feather=mat('Feather',(.11,.06,.03),0,.85),featherl=mat('FeatherLight',(.55,.45,.32),0,.85),
         beak=mat('Beak',(.95,.72,.2),0,.5),gloveleather=mat('GloveLeather',(.06,.03,.015),0,.8),eye=mat('Eye',(.05,.04,.03),0,.3),fletch=mat('Fletching',(.75,.15,.1),0,.8))

def mark(root,name,pos):
    e=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(e);e.parent=root;e.location=pos;return e
def group(name,parts,parent=None,loc=(0,0,0)):
    """Join parts into one named mesh (kept separate from the weapon so it can be shown/hidden or animated)."""
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();me=parts[0];me.name=name
    if parent:me.parent=parent
    return me
def mirror_y(objs):
    for o in objs:o.data.transform(Matrix.Diagonal((1,-1,1,1)));o.data.flip_normals()

# ---- bows (left hand) ----
def bow_parts(L,depth,recurve=0.,riser=.13):
    """Limb profile: y(z) toward the archer at the tips (depth), optional recurve flick forward at the very end."""
    P=[]
    def limb(sgn):
        pts=[]
        for i in range(9):
            f=i/8;z=sgn*(riser*.5+f*(L-riser*.5));y=-depth*f*f+(recurve*max(0,f-.8)/.2)
            pts.append((0,y,z))
        return pts
    for sgn in (1,-1):
        pts=limb(sgn);P.append(tube(pts,.017,M['dark'],sides=6))
        P.append(tube(pts[2:7],.019,M['steel'],sides=4))                                  # metal facing strip (rarity tint)
        tipz=pts[-1];P.append(ico(tipz,.02,M['gold'],1))                                  # nock caps
    P+=[lathe([(.024,-riser*.55),(.026,riser*.55)],M['leather'],7),                     # grip wrap
        box((0,.025,0),(.03,.03,riser*1.2),M['steel']),                                   # riser plate
        crystal(0,.018,.05,M['crystal'],segs=4,axis=Matrix.Translation((0,.05,riser*.6))@Matrix.Rotation(-math.pi/2,4,'X')),
        lathe([(.027,riser*.58),(.027,riser*.66)],M['rune'],7)]
    return P,limb(1)[-1],limb(-1)[-1]
def make_bow(wid,L,depth,recurve=0.):
    P,ta,tb=bow_parts(L,depth,recurve);root=finish(wid,P,(0,.06,.02))
    s=tube([ta,tb],.005,M['string'],sides=4);s.name=wid+'_string';s.parent=root
    mark(root,wid+'_sa',ta);mark(root,wid+'_sb',tb);return root
def bow():return make_bow('bow',.62,.15,.04)
def longbow():return make_bow('longbow',.86,.16)
def shortbow():return make_bow('shortbow',.46,.13,.06)

# ---- guns / crossbow (right hand on the stock, fist axis forward; +X down, rail at -X) ----
def crossbow():
    # Oct 18 rebuild (user: "looks horrible in his hands"): pistol grip in the fist (Z) like the pistols, stock running
    # forward over the knuckles (-Y) with the butt back toward the shoulder (+Y); wide steel prod whose tips sweep back,
    # string cocked to the nut, bolt in the groove, stirrup at the front.
    S=.075  # stock centre height above the fist
    fwd=Matrix.Rotation(math.pi/2,4,'X')  # lathe Z -> -Y (forward)
    P=[box((0,-.07,S),(.05,.5,.055),M['wood']),                                             # fore-stock
       box((0,.2,S-.01),(.045,.22,.07),M['wood']),                                          # stock wrist
       box((0,.33,S-.025),(.05,.1,.12),M['dark']),                                          # butt plate against the shoulder
       box((0,.01,-.005),(.034,.045,.13),M['wood'],Matrix.Rotation(-.12,4,'X')),            # pistol grip (in the fist)
       tube([(0,-.035,.04),(0,-.07,.0),(0,-.04,-.03),(0,.0,-.02)],.005,M['dsteel'],sides=4),   # trigger guard
       box((0,-.2,S+.033),(.022,.42,.012),M['dsteel']),                                     # flight groove rail
       box((0,-.33,S),(.07,.05,.07),M['dsteel']),                                           # prod block
       box((0,-.08,S+.035),(.03,.03,.02),M['steel'])]                                       # nut
    prod=[(x*.36,-.33+.11*x*x,S+.01) for x in (-1,-.75,-.5,-.25,0,.25,.5,.75,1)]
    P.append(tube(prod,.017,M['steel'],sides=6))                                            # prod (rarity tint)
    P.append(tube(prod[2:7],.022,M['dark'],sides=6))                                        # wrapped centre
    for e in (prod[0],prod[-1]):P.append(ico(e,.022,M['gold'],1))                           # tip caps
    P+=[tube([prod[0],(0,-.07,S+.04),prod[-1]],.004,M['string'],sides=4),                   # cocked string
        lathe([(.007,0),(.007,.36)],M['dark'],5,Matrix.Translation((0,-.07,S+.045))@fwd),   # bolt shaft
        lathe([(.016,.36),(.0,.43)],M['steel'],4,Matrix.Translation((0,-.07,S+.045))@fwd),  # bolt head
        box((0,-.1,S+.06),(.003,.05,.022),M['fletch']),
        tube(garc((0,-.45,S-.01),.04,math.pi,2*math.pi,8,'xz'),.007,M['dsteel']),          # stirrup
        crystal(0,.016,.045,M['crystal'],segs=4,axis=Matrix.Translation((.03,.15,S))@Matrix.Rotation(math.pi/2,4,'Y')),
        box((.026,.18,S),(.004,.12,.03),M['rune'])]
    return finish('crossbow',P,(0,-.52,S+.045))
def shotgun():
    P=[lathe([(.022,-.05),(.022,.52)],M['dsteel'],8,Matrix.Translation((-.035,0,0))),     # barrel
       lathe([(.016,.0),(.016,.46)],M['steel'],7,Matrix.Translation((.0,0,0))),           # magazine tube under
       box((.0,0,.32),(.06,.055,.14),M['wood']),                                           # pump fore-end (left hand)
       box((.01,0,.02),(.07,.05,.14),M['steel']),                                          # receiver
       box((.03,0,-.2),(.09,.045,.26),M['wood'],Matrix.Rotation(-.18,4,'Y')),              # stock
       box((-.06,0,.5),(.012,.008,.02),M['gold']),                                         # front sight
       box((.0,.03,.02),(.03,.004,.06),M['rune']),
       crystal(0,.014,.04,M['crystal'],segs=4,axis=Matrix.Translation((-.06,0,.05))@Matrix.Rotation(math.pi,4,'Y'))]
    return finish('shotgun',P,(-.035,0,.54))
def pistol(wid,mirror=False):
    # grip along Z in the fist; barrel over the knuckles (right grip -Y)
    P=[box((0,.0,0),(.032,.04,.12),M['wood']),                                             # grip
       box((0,-.08,.08),(.036,.2,.045),M['steel']),                                        # slide/frame
       lathe([(.011,0),(.011,.09)],M['dsteel'],7,Matrix.Translation((0,-.18,.075))@Matrix.Rotation(math.pi/2,4,'X')),  # barrel
       tube([(0,.015,.06),(0,.04,.03),(0,.02,.0)],.005,M['dsteel'],sides=4),              # trigger guard
       box((-.02,-.12,.104),(.008,.04,.008),M['gold']),
       box((.019,-.05,.08),(.004,.06,.02),M['rune']),
       crystal(0,.012,.035,M['crystal'],segs=4,axis=Matrix.Translation((0,.025,-.07))@Matrix.Rotation(math.pi,4,'X'))]
    tip=(0,-.27,.075)
    if mirror:mirror_y(P);tip=(0,.27,.075)
    return finish(wid,P,tip)
def pistols():return pistol('pistols')
def pistols_l():return pistol('pistols_l',True)

# ---- throwing weapons (right hand) ----
def shuriken():
    c=Vector((.02,-.06,.07));P=[]
    for i in range(4):
        a=i*math.pi/2;d=Vector((0,math.cos(a),math.sin(a)));n=Vector((0,-math.sin(a),math.cos(a)))
        import bmesh;bm=bmesh.new();pts=[c+n*.025,c+d*.12,c-n*.025,c+d*.02];vs=[bm.verts.new(p+Vector((t,0,0))) for t in (.005,-.005) for p in pts]
        bm.faces.new(vs[:4]);bm.faces.new(list(reversed(vs[4:])))
        for k in range(4):j=(k+1)%4;bm.faces.new((vs[k],vs[4+k],vs[4+j],vs[j]))
        bmesh.ops.recalc_face_normals(bm,faces=bm.faces);P.append(obj(bm,'star',M['steel']))
    P+=[lathe([(.03,-.006),(.03,.006)],M['dsteel'],8,Matrix.Translation(c)@Matrix.Rotation(math.pi/2,4,'Y')),
        ico(c+Vector((-.008,0,0)),.012,M['crystal'],1)]
    return finish('shuriken',P,c[:])
def kunai():
    P=[tube([(0,0,-.1),(0,0,.06)],.014,M['cloth'],sides=6),                              # wrapped handle
       tube(garc((0,0,-.15),.022,0,2*math.pi,10,'yz'),.006,M['dsteel']),                   # ring pommel
       lathe([(.03,.06),(.034,.09),(.0,.3)],M['steel'],4,twist=math.pi/4),               # leaf blade
       lathe([(.016,.07),(.016,.085)],M['gold'],6),box((.0,.0,-.04),(.03,.004,.04),M['rune']),
       crystal(.1,.01,.03,M['crystal'],segs=4,axis=Matrix.Translation((.026,0,0)))]
    return finish('kunai',P,(0,0,.3))
def chakram():
    c=(0,-.15,.02);P=[tube(garc(c,.15,0,2*math.pi,24,'xy'),.012,M['steel'],sides=5),
       tube(garc(c,.11,0,2*math.pi,20,'xy'),.009,M['dsteel'],sides=5)]
    for i in range(8):  # outward blade teeth
        a=i*math.pi/4;u=(math.cos(a),math.sin(a))
        P.append(tube([(c[0]+.15*u[0],c[1]+.15*u[1],c[2]),(c[0]+.19*math.cos(a+.25),c[1]+.19*math.sin(a+.25),c[2])],.006,M['steel'],sides=3))
    P+=[box((0,-.0,.02),(.03,.05,.03),M['leather']),ico((c[0]+.11,c[1],c[2]),.016,M['crystal'],1),ico((c[0]-.11,c[1],c[2]),.012,M['rune'],1)]
    return finish('chakram',P,c)

# ---- falconry: glove (left hand) + perched hawk, and the flying hawk ----
def egg(c,r,sx,sy,sz,m):
    o=ico((0,0,0),r,m,2);o.data.transform(Matrix.Translation(c)@Matrix.Diagonal((sx,sy,sz,1)));return o
def hawk_body(folded):
    """Hawk in its own space: forward -Y, up +Z, ~0.42 m long. Returns (body parts, wing parts by side)."""
    B=[egg((0,0,0),.06,.85,1.7,.75,M['feather']),egg((0,-.02,-.018),.05,.75,1.4,.55,M['featherl']),   # body, pale belly
       egg((0,-.11,.025),.036,.95,1.1,.95,M['feather']),                                                 # head
       lathe([(.012,0),(.0,.032)],M['beak'],4,Matrix.Translation((0,-.14,.02))@Matrix.Rotation(math.pi/2+.3,4,'X')),
       ico((.024,-.125,.04),.007,M['eye'],1),ico((-.024,-.125,.04),.007,M['eye'],1)]
    import bmesh;bm=bmesh.new();pts=[(-.025,.08,0),(.025,.08,0),(.06,.2,0),(0,.22,0),(-.06,.2,0)]           # fanned tail
    vs=[bm.verts.new((x,y,z+t)) for t in (.004,-.004) for x,y,z in pts];n=len(pts);bm.faces.new(vs[:n]);bm.faces.new(list(reversed(vs[n:])))
    for k in range(n):j=(k+1)%n;bm.faces.new((vs[k],vs[n+k],vs[n+j],vs[j]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);B.append(obj(bm,'tail',M['feather']))
    W={}
    for side,sx in (('l',1),('r',-1)):
        if folded:W[side]=[box((sx*.06,.03,.0),(.025,.16,.07),M['feather'],Matrix.Rotation(sx*.25,4,'Y'))]
        else:
            # hawk wing outline: curved leading edge (-Y), broad arm, three fingered primaries at the tip, trailing edge (+Y)
            import bmesh;bm=bmesh.new();pts=[(0,-.035,0),(sx*.1,-.062,.008),(sx*.22,-.06,.01),(sx*.32,-.035,.006),(sx*.39,-.005,0),(sx*.35,.02,0),
                (sx*.37,.04,0),(sx*.31,.045,0),(sx*.32,.068,0),(sx*.26,.066,0),(sx*.2,.085,0),(sx*.12,.09,0),(sx*.05,.075,0),(0,.05,0)]
            vs=[bm.verts.new((x,y,z+t)) for t in (.006,-.006) for x,y,z in pts];n=len(pts)
            bm.faces.new(vs[:n]);bm.faces.new(list(reversed(vs[n:])))
            for k in range(n):j=(k+1)%n;bm.faces.new((vs[k],vs[n+k],vs[n+j],vs[j]))
            bmesh.ops.recalc_face_normals(bm,faces=bm.faces);W[side]=[obj(bm,'wing',M['feather'])]
    return B,W
def falconer():
    # snug falconry gauntlet (user check: the first one was bigger than the head): cuff up the forearm (-Y), thin mitt
    P=[lathe([(.044,-.2),(.048,-.1),(.042,-.03)],M['gloveleather'],8,Matrix.Rotation(-math.pi/2,4,'X')),
       box((0,.015,.0),(.066,.07,.075),M['gloveleather']),
       box((-.036,-.1,0),(.008,.08,.05),M['steel']),box((.036,-.1,0),(.008,.08,.05),M['steel']),  # studded plates
       tube(garc((0,-.17,0),.048,0,2*math.pi,12,'xz'),.006,M['gold']),
       box((0,-.13,.046),(.024,.04,.005),M['rune']),
       crystal(0,.012,.035,M['crystal'],segs=4,axis=Matrix.Translation((-.045,-.06,0))@Matrix.Rotation(-math.pi/2,4,'Y'))]
    root=finish('falconer',P,(0,.02,.12))
    # perched hawk: upright on top of the fist (+Z), facing the knuckles (+Y), wings folded, tail hanging back over the cuff
    perch=[egg((0,0,.11),.055,.85,.9,1.35,M['feather']),egg((0,.012,.095),.045,.7,.6,1.1,M['featherl']),     # body, pale chest
           egg((0,.02,.2),.036,.95,1.05,1,M['feather']),                                                       # head
           lathe([(.012,0),(0,.03)],M['beak'],4,Matrix.Translation((0,.05,.195))@Matrix.Rotation(-math.pi/2+.35,4,'X')),
           ico((.022,.04,.212),.006,M['eye'],1),ico((-.022,.04,.212),.006,M['eye'],1),
           egg((.045,-.012,.105),.04,.35,.9,1.5,M['feather']),egg((-.045,-.012,.105),.04,.35,.9,1.5,M['feather']),  # folded wings
           box((0,-.06,.01),(.05,.03,.11),M['feather'],Matrix.Rotation(.35,4,'X')),                          # tail
           tube([(.018,.0,.06),(.018,.01,.035)],.006,M['beak'],3),tube([(-.018,.0,.06),(-.018,.01,.035)],.006,M['beak'],3)]  # talons
    for p in perch:p.matrix_world=Matrix.Translation((0,-.01,.03))@Matrix.Scale(1.25,4)@p.matrix_world
    group('falconer_perch',perch,root);return root
def hawk():
    B,W=hawk_body(False);root=bpy.data.objects.new('hawk',None);bpy.context.scene.collection.objects.link(root)
    group('hawk_body',B,root)
    for side in 'lr':
        wing=group('hawk_wing_'+side,W[side]);piv=bpy.data.objects.new('hawk_wpiv_'+side,None);bpy.context.scene.collection.objects.link(piv)
        piv.parent=root;piv.location=(.05 if side=='l' else -.05,0,.02);wing.parent=piv;wing.matrix_parent_inverse=Matrix.Translation(-piv.location)
    return root

# ---- Oct 18 new families (user list by subclass). Same grip conventions: thrown items in the right fist (+Z out of the
# thumb side), long guns / canister like the shotgun (fist axis forward = +Z, +X down, sights at -X). ----
def dagger(wid,mirror=False):
    P=[tube([(0,0,-.07),(0,0,.035)],.013,M['leather'],sides=6),                            # wrapped grip
       box((0,0,.042),(.022,.075,.012),M['gold']),                                          # crossguard
       lathe([(.02,.048),(.024,.08),(.0,.23)],M['steel'],4,twist=math.pi/4),               # blade (rarity tint)
       ico((0,0,-.08),.016,M['crystal'],1),box((.0,.0,-.02),(.026,.004,.03),M['rune'])]
    tip=(0,0,.23)
    if mirror:mirror_y(P)
    return finish(wid,P,tip)
def daggers():return dagger('daggers')
def daggers_l():return dagger('daggers_l',True)
def rifle():
    # Oct 19 (user: "make the gun look like a sniper rifle, butt in my shoulder"): long fluted barrel with a muzzle brake, big
    # scope on rings, bolt handle, cheek riser and a short skeleton stock sized so the butt pad meets the shoulder in R_rifle.
    bx=-.03;B=Matrix.Translation((bx,0,0))
    P=[lathe([(.014,-.02),(.014,1.02)],M['dsteel'],8,B),                                       # long barrel
       lathe([(.019,.36),(.017,.7)],M['dsteel'],8,B),                                         # heavy barrel section
       lathe([(.024,1.0),(.024,1.1),(.018,1.12)],M['steel'],8,B),                             # muzzle brake
       box((bx,0,1.06),(.05,.012,.02),M['dark']),                                             # brake ports
       box((.0,0,.07),(.058,.046,.24),M['steel']),                                            # receiver (rarity tint)
       box((.02,0,.4),(.05,.05,.34),M['dark']),                                               # fore-end (left hand)
       box((.045,0,-.155),(.07,.04,.23),M['wood'],Matrix.Rotation(-.1,4,'Y')),                 # skeleton stock
       box((-.005,0,-.12),(.03,.036,.12),M['wood']),                                          # cheek riser
       box((.05,0,-.28),(.1,.046,.03),M['dark'],Matrix.Rotation(-.1,4,'Y')),                   # butt pad
       box((.05,0,.03),(.045,.03,.035),M['gold']),                                            # trigger housing
       tube([(.0,.02,.13),(.0,.06,.12),(.0,.075,.1)],.007,M['steel'],sides=5),ico((.0,.078,.098),.012,M['steel'],1),  # bolt handle
       lathe([(.024,.02),(.024,.3)],M['dsteel'],10,Matrix.Translation((-.09,0,0))),           # scope tube
       lathe([(.024,-.02),(.034,.03),(.034,.06)],M['dsteel'],10,Matrix.Translation((-.09,0,0))),  # eyepiece bell
       lathe([(.024,.28),(.038,.33),(.038,.37)],M['dsteel'],10,Matrix.Translation((-.09,0,0))),   # objective bell
       ico((-.09,0,.372),.03,M['crystal'],1),                                                  # lens glint (rarity glow)
       box((-.06,0,.08),(.04,.02,.02),M['steel']),box((-.06,0,.24),(.04,.02,.02),M['steel']),  # scope rings
       box((.0,.026,.07),(.03,.004,.08),M['rune'])]
    for s in (1,-1):P.append(tube([(.035,0,.56),(.06,s*.02,.62),(.07,s*.03,.82)],.006,M['dsteel'],sides=4))  # folded bipod legs
    return finish('rifle',P,(bx,0,1.12))
def flamethrower():
    P=[lathe([(.02,-.02),(.02,.38),(.034,.46),(.03,.5)],M['steel'],8,Matrix.Translation((-.03,0,0))),  # nozzle (rarity tint)
       lathe([(.0,-.14),(.05,-.12),(.052,.2),(.0,.23)],M['dsteel'],10,Matrix.Translation((.06,0,0))),  # fuel tank under
       lathe([(.054,-.02),(.054,.02)],M['gold'],10,Matrix.Translation((.06,0,0))),lathe([(.054,.12),(.054,.16)],M['gold'],10,Matrix.Translation((.06,0,0))),
       tube([(.06,0,.21),(.03,0,.3),(-.01,0,.32)],.01,M['leather'],sides=5),                # feed hose
       box((.03,0,-.16),(.07,.04,.2),M['wood'],Matrix.Rotation(-.18,4,'Y')),               # rear grip / stock
       ico((-.03,0,.5),.018,M['crystal'],1),box((.06,.052,.04),(.03,.004,.08),M['rune'])]   # pilot light, rune plate
    return finish('flamethrower',P,(-.03,0,.52))
def canister():
    P=[lathe([(.0,-.16),(.06,-.14),(.064,.12),(.034,.17),(.0,.18)],M['dsteel'],10,Matrix.Translation((.07,0,0))),   # pressure tank
       box((.07,-.06,-.02),(.07,.014,.16),M['crystal']),                                   # glowing gauge window (rarity glow)
       tube([(.07,0,.18),(.02,0,.24),(-.02,0,.3),(-.02,0,.46)],.012,M['steel'],sides=6),   # spray wand (rarity tint)
       lathe([(.014,.44),(.026,.5)],M['gold'],8,Matrix.Translation((-.02,0,0))),            # nozzle cone
       box((.0,0,.0),(.05,.04,.12),M['leather']),                                           # grip
       box((.07,.066,.04),(.03,.004,.08),M['rune'])]
    return finish('canister',P,(-.02,0,.52))
def potion():
    P=[lathe([(.0,.0),(.05,.02),(.062,.07),(.046,.12),(.018,.15),(.018,.2),(.024,.21),(.0,.215)],M['crystal'],10),  # round flask (rarity glow)
       lathe([(.02,.2),(.02,.24)],M['wood'],6),                                             # cork
       tube([(.0,.0,.17),(.04,.0,.16),(.05,.0,.11)],.004,M['leather'],sides=4),            # tied cord
       box((.0,.06,.07),(.03,.004,.04),M['rune'])]
    return finish('potion',P,(0,0,.12))
def bombbag():
    P=[ico((0,0,.08),.07,M['dsteel'],2),                                                    # bomb (rarity tint via DarkSteel)
       lathe([(.024,.14),(.024,.17)],M['gold'],8),                                          # fuse cap
       tube([(0,0,.17),(.02,0,.2),(.01,0,.23)],.005,M['leather'],sides=4),                 # fuse
       ico((.01,0,.235),.011,M['crystal'],1),box((.0,.068,.08),(.03,.004,.04),M['rune'])]
    return finish('bombbag',P,(0,0,.16))
def barrel():
    P=[lathe([(.0,.0),(.058,.0),(.072,.08),(.058,.16),(.0,.16)],M['wood'],10),            # keg
       lathe([(.068,.025),(.068,.04)],M['dsteel'],10),lathe([(.068,.12),(.068,.135)],M['dsteel'],10),  # hoops
       lathe([(.074,.072),(.074,.088)],M['crystal'],10),                                   # glowing sludge band (rarity glow)
       lathe([(.012,.16),(.012,.19)],M['steel'],6),box((.0,.072,.08),(.03,.004,.03),M['rune'])]
    return finish('barrel',P,(0,0,.18))

MAKERS=dict(bow=bow,longbow=longbow,shortbow=shortbow,crossbow=crossbow,pistols=pistols,shotgun=shotgun,shuriken=shuriken,kunai=kunai,chakram=chakram,falconer=falconer,daggers=daggers,rifle=rifle,flamethrower=flamethrower,canister=canister,potion=potion,bombbag=bombbag,barrel=barrel)
# overall scale about the grip, like the Warrior weapons (read at the small hero size)
SCALE=dict(bow=1.25,longbow=1.25,shortbow=1.3,crossbow=1.2,pistols=1.5,pistols_l=1.5,shotgun=1.25,shuriken=1.7,kunai=1.6,chakram=1.45,falconer=1.0,hawk=1.6,daggers=1.5,daggers_l=1.5,rifle=1.15,flamethrower=1.2,canister=1.2,potion=1.35,bombbag=1.35,barrel=1.3)
def grown(make,wid):
    """Scale the whole weapon about its grip and bake it into the meshes/marker positions (root stays unscaled)."""
    def f(*a):
        r=make(*a);r.scale=(SCALE[wid],)*3;bpy.ops.object.select_all(action='DESELECT')
        for o in [r,*r.children_recursive]:o.select_set(True)
        bpy.context.view_layer.objects.active=r;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return r
    return f
MAKERS={k:grown(v,k) for k,v in MAKERS.items()};pistols_l=grown(pistols_l,'pistols_l');hawk=grown(hawk,'hawk');daggers_l=grown(daggers_l,'daggers_l')

if not PREVIEW:
    for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
    roots=[f() for f in MAKERS.values()]+[pistols_l(),daggers_l(),hawk()]
    bpy.ops.object.select_all(action='DESELECT')
    for r in roots:
        r.select_set(True)
        for c in r.children_recursive:c.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_apply=True)
    print('EXPORTED',OUT,os.path.getsize(OUT)//1024,'KB')
else:
    os.environ.update(HERO='ranger',WARRIOR_ONLY='none',WARRIOR_SIZE='384')
    exec(open(os.path.join(HERE,'..','warrior','build_warrior.py'),encoding='utf-8').read())
    PV=os.path.join(ROOT,'tmp',os.environ.get('PREVIEW_DIR','weapon-preview-ranger'));os.makedirs(PV,exist_ok=True)
    HAND=dict(bow='l',longbow='l',shortbow='l',falconer='l')
    BOTH=('bow','longbow','shortbow','crossbow','shotgun','pistols','daggers','rifle','flamethrower','canister')
    only=os.environ.get('WEAPON_ONLY');rows=[int(r) for r in os.environ.get('WEAPON_ROWS','1,0').split(',')]
    for wid,make in MAKERS.items():
        if only and wid not in only.split(','):continue
        side=HAND.get(wid,'r');objs=[(make(),side)]+([(pistols_l(),'l')] if wid=='pistols' else [])
        for w,_ in objs:w.parent=rig;w.matrix_parent_inverse=Matrix()
        shots=([('Hold_'+wid,0)] if 'Hold_'+wid in CLIPS else [])+[('R_'+wid,t) for t in (.26,.34,.62,1)]+[('R_'+wid+'_up',.26)]
        for clip,t in shots:
            cfg=CLIPS[clip];name,f=sample(clip,t);pose_at(name,f)
            if cfg.get('wpn'):weapon_pose(cfg['wpn'],t)
            for w,sd in objs:w.matrix_basis=grip_world(sd)
            for sd in (('r','l') if wid in BOTH else (side,)):curl_hand(sd,28)
            for r in rows:
                rig.rotation_euler=(0,0,math.radians(DIRS[r]));bpy.context.view_layer.update()
                for w,sd in objs:w.matrix_basis=grip_world(sd)
                scn.render.filepath=os.path.join(PV,f'{wid}_{clip}_{t:.2f}_r{r}.png');bpy.ops.render.render(write_still=True)
        for w,_ in objs:
            for c in list(w.children_recursive):bpy.data.objects.remove(c,do_unlink=True)
            bpy.data.objects.remove(w,do_unlink=True)
        print('PREVIEW',wid)
