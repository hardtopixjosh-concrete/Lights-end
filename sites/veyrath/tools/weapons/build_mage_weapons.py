"""Mage weapon models (Oct 18, user: script the weapons in Blender, Quaternius low-poly style). Six LMB families:
wand, staff, orb, scepter (right hand) and grimoire, spellbook (left hand; the right hand casts).

  blender -b ../../tmp/warrior-src/All_Female.blend --python tools/weapons/build_mage_weapons.py           # export
  WEAPON_PREVIEW=1 blender -b ../../tmp/warrior-src/All_Female.blend --python tools/weapons/build_mage_weapons.py   # test renders

Export: dist/assets/hero/weapons-mage.glb, one root node per family id with a child empty 'tip' (VFX origin).
Grip space (authoring coords, metres, shared with hero-3d.js gripFrame()): origin = hand head + 0.085 m along the
fingers; +X = palm normal, +Z = through the fist out of the thumb/index side (shafts point this way), +Y = X cross Z.
Material names matter to the game: 'Crystal' glows in the weapon's rarity colour, 'Rune' takes the colour rune.
Sizes are ~1.25x real so the weapons read at the game's small hero size."""
import bpy,bmesh,math,os
from mathutils import Matrix,Vector
PREVIEW=os.environ.get('WEAPON_PREVIEW')=='1'
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.abspath(os.path.join(HERE,'..','..','dist','assets','hero','weapons-mage.glb'))
GRIP_Y=.085  # grip origin along the fingers from the wrist (hero-3d.js uses the same)

# ---- materials (base colour + metal/rough survive the glTF export) ----
def mat(name,rgb,metal=0,rough=.75):
    m=bpy.data.materials.get('W_'+name) or bpy.data.materials.new('W_'+name);m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
    m.name=name;return m
M=dict(wood=mat('Wood',(.42,.26,.14)),dark=mat('DarkWood',(.22,.13,.08)),gold=mat('Gold',(.95,.7,.28),.85,.35),iron=mat('Iron',(.32,.33,.38),.75,.45),
       leather=mat('Leather',(.3,.17,.1)),violet=mat('Violet',(.28,.1,.36)),teal=mat('Teal',(.08,.32,.38)),paper=mat('Paper',(.93,.86,.68)),
       crystal=mat('Crystal',(.62,.86,1),.1,.2),rune=mat('Rune',(.95,.7,.28),.6,.4),
       # Oct 18 Mage weapons by subclass
       icewood=mat('IceWood',(.55,.68,.78)),ice=mat('Ice',(.75,.92,1),.05,.15),copper=mat('Copper',(.85,.45,.25),.8,.35),ember=mat('Ember',(1,.45,.1),0,.4),
       bone=mat('Bone',(.88,.84,.72)),bloodglass=mat('BloodGlass',(.6,.04,.1),.1,.2),crimson=mat('Crimson',(.32,.05,.07)),steel=mat('Steel',(.7,.72,.78),.8,.35),
       frost=mat('FrostSteel',(.6,.75,.88),.7,.3),glass=mat('Glass',(.85,.95,1),0,.08),amber=mat('Amber',(.95,.55,.12),.1,.3),skin=mat('DrumSkin',(.86,.76,.58)))

# ---- low-poly builders: each returns a mesh object in grip space with one material ----
def obj(bm,name,m):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free();me.materials.append(m)
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);return o
def lathe(prof,m,segs=8,axis=Matrix(),name='lathe',twist=0):
    """prof = [(radius,z),...] swept around Z; radius 0 makes a point. axis = matrix applied afterwards."""
    bm=bmesh.new();rings=[]
    for r,z in prof:
        if r<=1e-6:rings.append([bm.verts.new((0,0,z))]);continue
        rings.append([bm.verts.new((r*math.cos(2*math.pi*i/segs+twist),r*math.sin(2*math.pi*i/segs+twist),z)) for i in range(segs)])
    for a,b in zip(rings,rings[1:]):
        if len(a)==1 and len(b)==1:continue
        if len(a)==1:
            for i in range(segs):bm.faces.new((a[0],b[i],b[(i+1)%segs]))
        elif len(b)==1:
            for i in range(segs):bm.faces.new((a[(i+1)%segs],a[i],b[0]))
        else:
            for i in range(segs):bm.faces.new((a[i],a[(i+1)%segs],b[(i+1)%segs],b[i]))
    if len(rings[0])>1:bm.faces.new(list(reversed(rings[0])))
    if len(rings[-1])>1:bm.faces.new(rings[-1])
    bmesh.ops.transform(bm,matrix=axis,verts=bm.verts);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return obj(bm,name,m)
def crystal(z,r,l,m,segs=6,axis=Matrix()):
    return lathe([(0,z-l*.35),(r,z),(r*.7,z+l*.25),(0,z+l*.65)],m,segs,axis,'crystal',twist=.3)
def box(c,s,m,rot=Matrix()):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    bmesh.ops.transform(bm,matrix=Matrix.Translation(c)@rot@Matrix.Diagonal((*s,1)),verts=bm.verts);return obj(bm,'box',m)
def ico(c,r,m,sub=1):
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=r);bmesh.ops.translate(bm,vec=c,verts=bm.verts);return obj(bm,'ico',m)
def tube(pts,r,m,sides=5):
    """Swept polygon along a polyline (prongs, rings)."""
    bm=bmesh.new();rings=[]
    for i,p in enumerate(pts):
        p=Vector(p);t=(Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(i-1,0)])).normalized()
        u=t.orthogonal().normalized();v=t.cross(u)
        rings.append([bm.verts.new(p+(u*math.cos(2*math.pi*k/sides)+v*math.sin(2*math.pi*k/sides))*r) for k in range(sides)])
    for a,b in zip(rings,rings[1:]):
        for k in range(sides):bm.faces.new((a[k],a[(k+1)%sides],b[(k+1)%sides],b[k]))
    bm.faces.new(list(reversed(rings[0])));bm.faces.new(rings[-1]);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);return obj(bm,'tube',m)
def arc(c,rad,a0,a1,n,plane='xz'):
    out=[]
    for i in range(n+1):
        a=a0+(a1-a0)*i/n;x,y=rad*math.cos(a),rad*math.sin(a)
        out.append((c[0]+x,c[1],c[2]+y) if plane=='xz' else (c[0],c[1]+x,c[2]+y) if plane=='yz' else (c[0]+x,c[1]+y,c[2]))
    return out

def finish(wid,parts,tip):
    """Join the parts into one mesh under an empty named after the family; 'tip' child marks the VFX origin."""
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();me=parts[0];me.name=wid+'_mesh'
    root=bpy.data.objects.new(wid,None);bpy.context.scene.collection.objects.link(root);me.parent=root
    t=bpy.data.objects.new(wid+'_tip',None);bpy.context.scene.collection.objects.link(t);t.parent=root;t.location=tip
    return root

X=.03  # shaft line sits in the palm, 3 cm off the bone toward the palm
def wand():
    P=[lathe([(0,-.1),(.02,-.095),(.024,-.075),(.016,-.062)],M['gold'],8),                         # pommel
       lathe([(.017,-.064),(.017,.062)],M['leather'],7),                                           # wrapped grip
       lathe([(.021,.058),(.021,.078),(.015,.082)],M['gold'],8),                                  # collar
       lathe([(.015,.08),(.011,.25),(.008,.37)],M['wood'],7),                                     # tapered shaft
       lathe([(.013,.2),(.013,.215)],M['rune'],7),                                                # rune band
       lathe([(.009,.36),(.02,.385),(.014,.395)],M['gold'],6),                                    # tip cup
       crystal(.42,.026,.11,M['crystal'])]
    # held like a pointer: tilted 55 deg from the fist axis toward the fingers (right-hand grip frame: fingers = -Y)
    R=Matrix.Translation((X,0,0))@Matrix.Rotation(math.radians(55),4,'X')
    for p in P:p.matrix_world=R@p.matrix_world
    return finish('wand',P,(R@Vector((0,0,.5)))[:])
def staff():
    P=[lathe([(0,-.94),(.03,-.92),(.03,-.88),(.024,-.86)],M['gold'],8),
       lathe([(.024,-.86),(.022,.0),(.024,.72)],M['wood'],7),
       lathe([(.027,-.1),(.027,.1)],M['leather'],7),
       lathe([(.03,-.52),(.03,-.49)],M['gold'],8),lathe([(.03,.38),(.03,.41)],M['rune'],8),
       lathe([(.026,.7),(.042,.74),(.036,.79)],M['gold'],8)]
    for s in (1,-1):  # two curled prongs cradling the crystal
        pts=[(.0,0,.78)]+[(s*(.07*math.sin(a)),0,.78+.12*(1-math.cos(a))+.09*a) for a in [i*.35 for i in range(1,8)]]
        P.append(tube(pts,.011,M['gold']))
    P.append(tube(arc((0,0,.93),.085,-.3,math.pi+.3,10,'yz'),.008,M['gold']))
    P.append(crystal(.9,.05,.17,M['crystal']))
    for p in P:p.location.x=X
    return finish('staff',P,(X,0,1.0))
def scepter():
    P=[crystal(-.11,.016,.05,M['crystal'],axis=Matrix.Rotation(math.pi,4,'X')),
       lathe([(.02,-.085),(.018,-.07),(.016,.06),(.022,.075)],M['gold'],8),
       lathe([(.016,-.06),(.016,.05)],M['violet'],7),
       lathe([(.013,.07),(.011,.36)],M['gold'],8),
       lathe([(.014,.2),(.014,.22)],M['rune'],8),
       lathe([(.012,.35),(.045,.4),(.03,.43),(.05,.46),(.02,.48)],M['gold'],8)]
    P.append(tube(arc((0,0,.56),.07,0,2*math.pi,14,'yz'),.009,M['gold']))      # halo ring around the crystal
    P.append(tube(arc((0,0,.56),.07,0,2*math.pi,14,'xz'),.007,M['gold']))
    P.append(crystal(.54,.035,.12,M['crystal']))
    for p in P:p.location.x=X
    return finish('scepter',P,(X,0,.62))
def orb():
    c=.13  # sphere centre out from the palm
    P=[ico((c,0,0),.105,M['crystal'],2),
       tube(arc((c-.055,0,0),.088,0,2*math.pi,14,'yz'),.01,M['gold'])]                     # cradle band under the orb
    for a in (0,2.1,4.2):  # three claws from the band up the sides
        y,z=math.cos(a),math.sin(a);P.append(tube([(c-.055,.088*y,.088*z),(c-.01,.11*y,.11*z),(c+.04,.085*y,.085*z)],.008,M['gold']))
    P.append(ico((c-.075,0,0),.022,M['rune'],1))
    return finish('orb',P,(c,0,0))
def grimoire():
    x0,T,W,H=.02,.075,.26,.32  # back cover against the palm; thickness along X, width Y, height Z
    P=[box((x0+.006,0,0),(.012,W,H),M['violet']),box((x0+T-.006,0,0),(.012,W,H),M['violet']),
       box((x0+T/2,-W/2+.008,0),(T,.016,H+.004),M['violet']),                                   # spine
       box((x0+T/2,.008,0),(T-.024,W-.03,H-.03),M['paper'])]
    for sy in (1,-1):
        for sz in (1,-1):P.append(box((x0+T+.002,sy*(W/2-.025),sz*(H/2-.025)),(.008,.05,.05),M['gold']))
    P.append(box((x0+T/2,W/2-.004,0),(T+.012,.012,.06),M['iron']))                               # clasp
    P.append(box((x0+T+.004,0,0),(.006,.1,.1),M['rune'],Matrix.Rotation(math.pi/4,4,'X')))
    P.append(crystal(0,.032,.07,M['crystal'],segs=4,axis=Matrix.Translation((x0+T+.012,0,0))@Matrix.Rotation(math.pi/2,4,'Y')))
    return finish('grimoire',P,(x0+T+.04,0,0))
def spellbook():
    x0,L,Wd=.02,.26,.19  # open book lying on the palm: spine along Y, pages face away from the palm (+X)
    P=[]
    for s in (1,-1):
        R=Matrix.Rotation(-s*math.radians(14),4,'Y')
        P.append(box(R@Vector((x0+.005,0,s*Wd/2)),(.01,L,Wd),M['teal'],R))
        P.append(box(R@Vector((x0+.018,0,s*(Wd/2-.006))),(.018,L-.02,Wd-.016),M['paper'],R))
        P.append(box(R@Vector((x0+.002,0,s*(Wd-.004))),(.012,L+.004,.012),M['gold'],R))
    for i in range(3):  # pages fanning up off the right half (the "fan sweep")
        R=Matrix.Rotation(-math.radians(30+22*i),4,'Y');P.append(box(R@Vector((x0+.03,0,Wd*.45)),(.003,L-.03,Wd*.9),M['paper'],R))
    P.append(box((x0+.006,0,0),(.016,L+.01,.02),M['gold']))
    P.append(crystal(0,.022,.06,M['crystal'],segs=4,axis=Matrix.Translation((x0+.02,L/2+.03,0))@Matrix.Rotation(-math.pi/2,4,'X')))
    return finish('spellbook',P,(x0+.12,0,0))

# ---- Oct 18 (user list): Mage weapons by subclass. Same grip space as above (right hand: fingers = -Y, wrist at +Y). ----
def _staff(wid,shaft,metal,head):
    P=[lathe([(0,-.94),(.03,-.92),(.03,-.88),(.024,-.86)],M[metal],8),lathe([(.024,-.86),(.022,.0),(.024,.72)],M[shaft],7),
       lathe([(.027,-.1),(.027,.1)],M['leather'],7),lathe([(.03,-.52),(.03,-.49)],M[metal],8),lathe([(.03,.38),(.03,.41)],M['rune'],8),
       lathe([(.026,.7),(.042,.74),(.036,.79)],M[metal],8)]+head()
    for p in P:p.location.x+=X
    return finish(wid,P,(X,0,1.0))
def icestaff():
    def head():
        P=[crystal(.92,.055,.2,M['crystal'])]
        for i in range(5):  # jagged ice shards fanning round the crystal
            a=i/5*2*math.pi;R=Matrix.Translation((.05*math.cos(a),.05*math.sin(a),.8))@Matrix.Rotation(.45,4,Vector((-math.sin(a),math.cos(a),0)))
            P.append(crystal(0,.02,.16+.04*(i%2),M['ice'],segs=4,axis=R))
        return P
    return _staff('icestaff','icewood','steel',head)
def stormstaff():
    def head():
        P=[crystal(.93,.045,.16,M['crystal'])]
        for z in (.55,.6,.65):P.append(lathe([(.034,z),(.034,z+.018)],M['copper'],8))
        for s in (1,-1):  # forked lightning prongs
            P.append(tube([(0,0,.78),(s*.05,0,.86),(s*.02,0,.92),(s*.075,0,1.02)],.01,M['iron']))
        return P
    return _staff('stormstaff','dark','iron',head)
def lightrod():
    P=[lathe([(0,-.5),(.022,-.48),(.02,.62)],M['iron'],7),lathe([(.026,-.1),(.026,.1)],M['leather'],7)]
    for z in (.3,.38,.46):P.append(lathe([(.03,z),(.03,z+.02)],M['copper'],8))
    P+=[lathe([(.02,.62),(.035,.66),(0,.86)],M['steel'],6),crystal(.66,.03,.08,M['crystal'])]
    for a in (0,2.1,4.2):P.append(tube([(0,0,.68),(.06*math.cos(a),.06*math.sin(a),.74),(.07*math.cos(a),.07*math.sin(a),.82)],.007,M['steel']))
    for p in P:p.location.x+=X
    return finish('lightrod',P,(X,0,.88))
def embers():
    P=[]
    for i in range(10):  # a loop of amber prayer beads round the knuckles, one big ember bead
        a=i/10*2*math.pi;P.append(ico((.025+.06*math.cos(a),-.01,.065*math.sin(a)),.016 if i else .026,M['crystal'] if i==0 else M['amber'],1))
    P.append(tube(arc((.025,-.01,0),.065,0,2*math.pi,14,'xz'),.004,M['dark']))
    P.append(tube([(.085,-.01,0),(.1,-.03,-.05),(.105,-.04,-.09)],.004,M['dark']));P.append(ico((.105,-.04,-.1),.012,M['ember'],1))
    return finish('embers',P,(.09,-.01,0))
def sundisc():
    c=(X,0,.15);R=Matrix.Translation(c)@Matrix.Rotation(math.pi/2,4,'Y')  # disc plane = Y-Z, rim in the fist
    P=[lathe([(0,-.012),(.13,-.012),(.135,0),(.13,.012),(0,.012)],M['gold'],16,R),lathe([(0,-.016),(.06,-.016),(.06,.016),(0,.016)],M['ember'],12,R)]
    for i in range(8):
        a=i/8*2*math.pi;P.append(lathe([(.012,0),(0,.05)],M['gold'],3,Matrix.Translation((X,math.cos(a)*.14,.15+math.sin(a)*.14))@Matrix.Rotation(-a+math.pi/2,4,'X')))
    P.append(crystal(0,.03,.05,M['crystal'],segs=6,axis=Matrix.Translation(c)@Matrix.Rotation(math.pi/2,4,'Y')))
    return finish('sundisc',P,c)
def _gauntlet(wid,shell,trim,gem):
    up=Matrix.Rotation(-math.pi/2,4,'X')  # lathe Z -> +Y (toward the wrist)
    P=[box((-.005,.03,0),(.085,.16,.095),M[shell]),box((-.05,.02,0),(.02,.1,.07),M[trim]),
       lathe([(.05,.1),(.066,.15),(.06,.17)],M[shell],8,up),lathe([(.068,.15),(.068,.162)],M[trim],8,up)]
    for i in range(4):P.append(box((.0,-.05,-.03+.02*i),(.07,.025,.016),M[trim]))  # knuckle plates
    P.append(crystal(0,.022,.05,M['crystal'],segs=5,axis=Matrix.Translation((-.06,.03,0))@Matrix.Rotation(-math.pi/2,4,'Y')))
    P.append(crystal(0,.012,.04,M[gem],segs=4,axis=Matrix.Translation((-.05,.1,.035))@Matrix.Rotation(-math.pi/2,4,'Y')))
    return finish(wid,P,(.06,-.06,0))
def flamegaunt():return _gauntlet('flamegaunt','iron','gold','ember')
def frostbeam():return _gauntlet('frostbeam','frost','steel','ice')
def snowglobe():
    c=.13
    P=[lathe([(0,0),(.07,0),(.075,.03),(.06,.05),(0,.05)],M['wood'],10,Matrix.Translation((c-.12,0,0))@Matrix.Rotation(math.pi/2,4,'Y')),
       ico((c,0,0),.09,M['glass'],2),crystal(0,.03,.07,M['crystal'],segs=6,axis=Matrix.Translation((c-.02,0,0))@Matrix.Rotation(math.pi/2,4,'Y')),
       tube(arc((c-.07,0,0),.07,0,2*math.pi,14,'yz'),.008,M['gold'])]
    return finish('snowglobe',P,(c,0,0))
def drum():
    c=(.03,0,.15);R=Matrix.Translation(c)@Matrix.Rotation(math.pi/2,4,'Y')  # frame drum held by its rim, face out of the palm
    P=[lathe([(.15,-.035),(.15,.035)],M['dark'],14,R),lathe([(0,.036),(.147,.036)],M['skin'],14,R),lathe([(0,-.036),(.147,-.036)],M['skin'],14,R)]
    for i in range(6):
        a=i/6*2*math.pi;P.append(box((c[0],math.cos(a)*.152,c[2]+math.sin(a)*.152),(.08,.012,.012),M['copper']))
    P.append(box((c[0]+.038,0,c[2]),(.004,.07,.07),M['rune'],Matrix.Rotation(math.pi/4,4,'X')))
    P.append(crystal(0,.02,.045,M['crystal'],segs=4,axis=Matrix.Translation((c[0]+.04,0,c[2]))@Matrix.Rotation(math.pi/2,4,'Y')))
    return finish('drum',P,(c[0]+.05,0,c[2]))
def tesla():
    P=[lathe([(.02,-.09),(.018,-.07),(.016,.06),(.022,.075)],M['copper'],8),lathe([(.016,-.06),(.016,.05)],M['dark'],7),lathe([(.012,.07),(.01,.34)],M['copper'],8)]
    for i,z in enumerate((.2,.25,.3)):P.append(tube(arc((0,0,z),.035-.006*i,0,2*math.pi,12,'xy'),.007,M['steel']))
    P+=[lathe([(.01,.34),(.03,.37),(.02,.4)],M['steel'],8),ico((0,0,.45),.045,M['crystal'],2)]
    for p in P:p.location.x+=X
    return finish('tesla',P,(X,0,.48))
def bloodorb():
    c=.13
    P=[ico((c,0,0),.1,M['bloodglass'],2),tube(arc((c-.055,0,0),.088,0,2*math.pi,14,'yz'),.01,M['iron']),ico((c,0,0),.045,M['crystal'],1)]
    for a in (0,1.25,2.5,3.75,5):
        y,z=math.cos(a),math.sin(a);P.append(tube([(c-.055,.088*y,.088*z),(c-.01,.115*y,.115*z),(c+.06,.09*y,.09*z)],.007,M['iron']))
    return finish('bloodorb',P,(c,0,0))
def sigilbook():
    x0,T,W,H=.02,.07,.25,.31
    P=[box((x0+.006,0,0),(.012,W,H),M['crimson']),box((x0+T-.006,0,0),(.012,W,H),M['crimson']),box((x0+T/2,-W/2+.008,0),(T,.016,H+.004),M['crimson']),
       box((x0+T/2,.008,0),(T-.024,W-.03,H-.03),M['paper'])]
    for sy in (1,-1):
        for sz in (1,-1):P.append(box((x0+T+.002,sy*(W/2-.025),sz*(H/2-.025)),(.008,.04,.04),M['bone']))
    P.append(tube(arc((x0+T+.004,0,0),.07,0,2*math.pi,10,'yz'),.006,M['rune']))
    for i in range(5):  # pentagram strokes
        a,b=i/5*2*math.pi+math.pi/2,(i+2)/5*2*math.pi+math.pi/2;P.append(tube([(x0+T+.004,.065*math.cos(a),.065*math.sin(a)),(x0+T+.004,.065*math.cos(b),.065*math.sin(b))],.004,M['rune']))
    P.append(box((x0+T/2,W/2-.004,0),(T+.012,.012,.06),M['bone']))
    P.append(crystal(0,.026,.06,M['crystal'],segs=4,axis=Matrix.Translation((x0+T+.012,0,0))@Matrix.Rotation(math.pi/2,4,'Y')))
    return finish('sigilbook',P,(x0+T+.04,0,0))
def lantern():
    P=[lathe([(.016,-.08),(.016,.3)],M['dark'],7),lathe([(.02,-.06),(.02,.06)],M['leather'],7),tube([(0,0,.3),(.03,0,.36),(.08,0,.36),(.09,0,.32)],.007,M['iron'])]
    L=(.09,0,.2)  # lantern hangs under the hook
    P+=[lathe([(0,.075),(.045,.06),(.05,.05)],M['iron'],6,Matrix.Translation(L)),lathe([(.05,-.06),(.045,-.07),(0,-.08)],M['iron'],6,Matrix.Translation(L)),
        crystal(0,.03,.1,M['crystal'],segs=6,axis=Matrix.Translation((L[0],0,L[2]-.03))),lathe([(.04,-.055),(.04,.045)],M['bloodglass'],6,Matrix.Translation(L))]
    for a in (0,1.57,3.14,4.71):P.append(tube([(L[0]+.048*math.cos(a),.048*math.sin(a),L[2]-.06),(L[0]+.048*math.cos(a),.048*math.sin(a),L[2]+.05)],.005,M['iron']))
    for p in P:p.location.x+=X
    return finish('lantern',P,(X+L[0],0,L[2]))
def skull():
    c=.12
    P=[ico((c,0,.01),.075,M['bone'],2),box((c+.03,0,-.055),(.06,.07,.035),M['bone']),
       ico((c+.06,.03,.015),.02,M['crimson'],1),ico((c+.06,-.03,.015),.02,M['crimson'],1),ico((c+.075,0,-.01),.01,M['dark'],1),
       ico((c+.055,.03,.015),.012,M['crystal'],1),ico((c+.055,-.03,.015),.012,M['crystal'],1)]
    for s in (1,-1):P.append(tube([(c-.02,s*.06,.05),(c-.03,s*.1,.1),(c+.0,s*.11,.15)],.008,M['bone']))  # horns
    return finish('skull',P,(c,0,.12))
NEW_MAKERS=(icestaff,stormstaff,lightrod,embers,sundisc,flamegaunt,frostbeam,snowglobe,drum,tesla,bloodorb,sigilbook,lantern,skull)

if not PREVIEW:
    for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
    roots=[f() for f in (wand,staff,scepter,orb,grimoire,spellbook)+NEW_MAKERS]
    bpy.ops.object.select_all(action='DESELECT')
    for r in roots:
        r.select_set(True)
        for c in r.children:c.select_set(True)
    os.makedirs(os.path.dirname(OUT),exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_apply=True)
    print('EXPORTED',OUT,os.path.getsize(OUT)//1024,'KB')
else:
    # ---- preview: the real Mage rig (build_warrior.py) holding each weapon in its own LMB pose ----
    os.environ.update(HERO='mage',WARRIOR_ONLY='none',WARRIOR_SIZE='384')
    exec(open(os.path.join(HERE,'..','warrior','build_warrior.py'),encoding='utf-8').read())
    PV=os.path.join(ROOT,'tmp','weapon-preview');os.makedirs(PV,exist_ok=True)
    def frame(side):
        """Grip frame in armature space, same maths as hero-3d.js gripFrame()."""
        pb=lambda n:rig.pose.bones[n+'_'+side].head
        h=pb('hand');Fy=(pb('middle_01')-h).normalized();d=pb('index_01')-pb('pinky_01');Fz=(d-Fy*d.dot(Fy)).normalized();Fx=Fy.cross(Fz)
        s=1 if (pb('thumb_01')-h).dot(Fx)>0 else -1  # palm = the thumb's side of the knuckle plane
        m=Matrix.Identity(4)
        for i,v in enumerate((Fx*s,Fy*s,Fz)):m[0][i],m[1][i],m[2][i]=v
        m.translation=h+Fy*GRIP_Y;return m,Fx*s,Fy
    def curl(side,palm,Fy,deg):
        ax=Fy.cross(palm).normalized()
        for f in ('index','middle','ring','pinky'):
            for j in ('01','02','03'):turn(f'{f}_{j}_{side}',ax,deg)
    SHOTS=[('wand','r',[('Idle',0),('Lmb_wand',.5)],28),('staff','r',[('Hold_staff',0),('Lmb_staff',.5)],28),('scepter','r',[('Idle',0),('Channel',.3)],28),
           ('orb','r',[('Idle',0),('Lmb_orb',.0)],10),('grimoire','l',[('Idle',0),('Lmb_grimoire',.5)],14),('spellbook','l',[('Idle',0),('Lmb_spellbook',.5)],14)]
    makers=dict(wand=wand,staff=staff,scepter=scepter,orb=orb,grimoire=grimoire,spellbook=spellbook)
    makers.update({f.__name__:f for f in NEW_MAKERS})
    only=os.environ.get('WEAPON_ONLY')
    for wid,side,poses,deg in SHOTS:
        if only and wid not in only.split(','):continue
        w=makers[wid]();w.parent=rig;w.matrix_parent_inverse=Matrix()
        for clip,t in poses:
            cfg=CLIPS[clip];name,f=sample(clip,t);pose_at(name,f)
            if cfg.get('channel'):channel_pose(t)
            if cfg.get('lmb'):lmb_pose(cfg['lmb'],t)
            if cfg.get('hold'):hold_pose(cfg['hold'],t)
            m,palm,Fy=frame(side);curl(side,palm,Fy,deg);w.matrix_basis=m
            for r in (2,1,0):
                rig.rotation_euler=(0,0,math.radians(DIRS[r]));bpy.context.view_layer.update()
                scn.render.filepath=os.path.join(PV,f'{wid}_{clip}_r{r}.png');bpy.ops.render.render(write_still=True)
        for c in list(w.children_recursive)+[w]:bpy.data.objects.remove(c,do_unlink=True)
        print('PREVIEW',wid)
