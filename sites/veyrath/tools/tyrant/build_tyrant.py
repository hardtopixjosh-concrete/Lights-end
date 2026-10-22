"""Procedural Crimson Tyrant (Oct 19 overnight audit; user: final boss needs real model detail, keep the idea of shedding armour).
Built on the Obsidian Colossus rig and animation set (tools/colossus/build_colossus.py), three looks (TYRANT_VARIANT=1/2/3):
 1  full armour: black iron plate with gold rims and rivets, horned great-helm with a burning visor slit, spiked layered
    pauldrons, chest plates with a rune-etched sigil, gauntlets with claws, plated tassets with a skull belt.
 2  helm, pauldrons and chest plates shed: horned demon head (glowing eyes, fanged jaw), molten cracks across the chest,
    keeps gauntlets, tassets and greaves.
 3  all armour shed: crimson demon body laced with molten veins, blazing core, torn wings.
Animations are the Colossus set (game mapping in game.js HD_SPECIAL.final): Idle, Run, TakeDamage1, PunchR/PunchL (sweeps),
Jump (leap), Throw (chains), Slam (smash), Stomp (nova), Overload (cataclysm/spiral/rain), Break (shed), Die1.
Run: blender -b --factory-startup -P tools/tyrant/build_tyrant.py -- OUT_DIR [SIZE]   (env TYRANT_VARIANT)
Then: python tools/hd/compose_model.py OUT_DIR tyrantN"""
import bpy,bmesh,math,random,sys,os
from mathutils import Vector,Euler
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else os.path.join(os.path.dirname(__file__),'frames');SIZE=int(argv[1]) if len(argv)>1 else 1024
VAR=int(os.environ.get('TYRANT_VARIANT','1'))
os.makedirs(OUT,exist_ok=True);random.seed(1019)
bpy.ops.wm.read_factory_settings(use_empty=True);scn=bpy.context.scene
def lin(h):h=h.lstrip('#');return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))+(1,)
def mat(name,col,emit=0,rough=.8,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=lin(col);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    if emit:b.inputs['Emission Color'].default_value=lin(col);b.inputs['Emission Strength'].default_value=emit
    m.diffuse_color=lin(col);return m
# flesh = deep crimson demon skin; armor = blackened iron; edge = dark gold rims; glow = molten orange; core = white-hot
M=dict(rock=mat('flesh','4a100e',rough=.55),rockd=mat('fleshd','260706',rough=.6),rockl=mat('fleshl','6a1a14',rough=.5),
       armor=mat('armor','1b1618',rough=.42,metal=.55),edge=mat('edge','b08428',rough=.35,metal=.85),
       glow=mat('glow','ff4a0a',emit=5.0),core=mat('core','ffb050',emit=4.5),crest=mat('horn','2a2222',rough=.55),crestd=mat('hornd','d8c9a8',rough=.6),
       rune=mat('rune','ff3a14',emit=2.2),bone=mat('bone','e2d6b8',rough=.6),eye=mat('eye','fff0a0',emit=6),wing=mat('wing','3a0c0c',rough=.8),rivet=mat('rivet','d4a640',rough=.3,metal=.9))
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_mode='XYZ';return o
PARTS=[];SETS={'A':[],'B':[],'P1':[],'P2':[],'P3':[]}   # A: shed at 66%, B: shed at 33%; P1/P2: parts only for that look
def obj(name,bm,parent,loc,mats,rot=(0,0,0),scale=(1,1,1),tag=None):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_euler=rot;o.scale=scale
    for m in ([mats] if isinstance(mats,str) else mats):me.materials.append(M[m])
    PARTS.append(o)
    if tag:SETS[tag].append(o)
    return o
def blob(name,parent,loc,size,m='rock',rot=(0,0,0),sub=2,jit=.06,tag=None):
    # chunky obsidian: low icosphere decimated to broad crisp planes, jittered so no two masses read as spheres
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1)
    if sub>=2:bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(27),verts=bm.verts[:],edges=bm.edges[:])
    for v in bm.verts:v.co*=1+random.uniform(-jit,jit)
    bmesh.ops.triangulate(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,m,rot,size,tag)
def panel(name,parent,loc,size,rot=(0,0,0),top=1.0,front=1.0,inset=.13,depth=.035,tag=None,m='armor'):
    """Armour slab: a box (optionally tapered toward the top / narrower at the front), every face inset into a dark
    plate with a raised blue-grey rim (the concept's bevelled edges)."""
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
    for v in bm.verts:
        x,y,z=v.co;k=top if z>0 else 1;kf=front if y<0 else 1;v.co=Vector((x*size[0]*k*kf,y*size[1]*k,z*size[2]))
    orig=list(bm.faces);t=min(size)*inset
    res=bmesh.ops.inset_individual(bm,faces=orig,thickness=t,depth=0,use_even_offset=True)
    border=set(res['faces'])
    for f in bm.faces:f.material_index=1 if f in border else 0
    return obj(name,bm,parent,loc,[m,'edge'],rot,(1,1,1),tag)
def cyl(name,parent,loc,r1,r2,depth,m,rot=(0,0,0),seg=10,tag=None):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r1,radius2=r2,depth=depth);return obj(name,bm,parent,loc,m,rot,(1,1,1),tag)
def box(name,parent,loc,size,m,rot=(0,0,0),tag=None):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1);return obj(name,bm,parent,loc,m,rot,size,tag)
def gem(name,parent,loc,w,h,d,m='core',rot=(0,0,0),tag=None):
    """Elongated diamond (octahedron) facing -Y."""
    bm=bmesh.new();vs=[bm.verts.new(p) for p in ((0,0,h),(w,0,0),(0,0,-h),(-w,0,0),(0,-d,0),(0,d*.4,0))]
    for a,b in ((0,1),(1,2),(2,3),(3,0)):bm.faces.new((vs[a],vs[b],vs[4]));bm.faces.new((vs[b],vs[a],vs[5]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,m,rot,(1,1,1),tag)
def spike(name,parent,base,tip,r,m,seg=4,tag=None):
    """Faceted cone from base to tip (crest flames, toe claws)."""
    bm=bmesh.new();base=Vector(base);tip=Vector(tip);d=(tip-base).normalized();a=d.cross(Vector((0,0,1)) if abs(d.z)<.9 else Vector((1,0,0))).normalized();b=d.cross(a)
    ring=[bm.verts.new(base+(a*math.cos(k*2*math.pi/seg+.4)+b*math.sin(k*2*math.pi/seg+.4))*r) for k in range(seg)];t=bm.verts.new(tip)
    for k in range(seg):bm.faces.new((ring[k],ring[(k+1)%seg],t))
    bm.faces.new(list(reversed(ring)));bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:]);return obj(name,bm,parent,(0,0,0),m,(0,0,0),(1,1,1),tag)
def rivets(name,parent,center,size,face='y',n=4,tag=None):
    """Gold rivets along the top and bottom edge of a plate face (detail that survives the downscale)."""
    cx,cy,cz=center;sx,sy,sz=size
    for i in range(n):
        u=(i+.5)/n-.5
        for v in (-.38,.38):
            if face=='y':loc=(cx+u*sx*.8,cy-sy/2-.012,cz+v*sz)
            else:loc=(cx+(sx/2+.012)*(1 if face=='x+' else -1),cy+u*sy*.8,cz+v*sz)
            blob(name,parent,loc,(.035,.035,.035),'rivet',sub=1,jit=0,tag=tag)
def vein(name,parent,pts,r=.025,tag=None,m='glow'):
    """Molten crack: chain of thin glowing segments through pts."""
    for a,b in zip(pts,pts[1:]):spike(name,parent,a,b,r,m,seg=4,tag=tag)
# ---- rig (model faces -Y = toward the camera = "S") ----
HZ=1.22
root=empty('root');hips=empty('hips',root,(0,0,HZ));spine=empty('spine',hips,(0,0,.34));chest=empty('chest',spine,(0,0,.42));neck=empty('neck',chest,(0,-.08,.56));head=empty('head',neck,(0,-.04,.1))
J={}
for s,sx in (('L',-1),('R',1)):
    sh=empty('shoulder'+s,chest,(sx*1.0,0,.36));el=empty('elbow'+s,sh,(sx*.06,0,-.72));wr=empty('wrist'+s,el,(0,0,-.66))
    hp=empty('hip'+s,hips,(sx*.42,0,-.08));kn=empty('knee'+s,hp,(0,0,-.56));an=empty('ankle'+s,kn,(0,0,-.5))
    J[s]=dict(sh=sh,el=el,wr=wr,hp=hp,kn=kn,an=an,sx=sx)
# ---- demon body (always present): sculpted crimson muscle ----
blob('pelvis',hips,(0,.02,.0),(.54,.4,.3))
blob('belly',spine,(0,0,.02),(.56,.42,.36))
for k,z in enumerate((-.14,.04,.2)):
    for sx in (-1,1):blob('abs',spine,(sx*.14,-.36,z),(.14,.08,.09),'rockl',sub=1,jit=.03)
blob('ribcage',chest,(0,.05,.08),(.88,.6,.62))
for sx in (-1,1):
    blob('pec',chest,(sx*.36,-.36,.16),(.42,.24,.34),'rock',rot=(0,0,sx*.15))
    blob('lat',chest,(sx*.64,.08,-.02),(.32,.38,.46),'rockd')
    blob('trap',chest,(sx*.44,.14,.46),(.38,.3,.2),'rock',rot=(0,sx*-.3,0))
    blob('backm',chest,(sx*.34,.5,.12),(.38,.18,.42),'rockd')
    for k in range(3):blob('rib',chest,(sx*.62,-.18+k*.06,-.18+k*.14),(.1,.16,.05),'rockl',sub=1,jit=.02)   # serratus ridges
blob('hump',chest,(0,.34,.4),(.44,.3,.26),'rock')
for k in range(5):spike('spine',chest,(0,.56,.5-k*.2),(0,.84,.6-k*.2),.07,'crest',seg=4)   # dorsal spines
glowband=lambda name,parent,loc,r,rot=(0,0,0),d=.07,tag=None:cyl(name,parent,loc,r*.86,r*.86,d,'glow',rot,seg=12,tag=tag)
glowband('waist',spine,(0,0,-.2),.48,d=.06)
# molten cracks across the chest and back (phase 2+), veins everywhere in phase 3
vein('crackA',chest,[(-.42,-.6,.42),(-.2,-.62,.24),(-.05,-.64,.3),(.12,-.63,.06),(.34,-.6,.12)],.03,tag='P2')
vein('crackB',chest,[(.3,-.6,.46),(.16,-.63,.3),(.2,-.64,.12)],.025,tag='P2')
vein('crackBack',chest,[(0,.62,.5),(-.08,.64,.24),(.06,.65,0),(-.04,.63,-.2)],.03,tag='P2')
gem('coreBig',chest,(0,-.58,.16),.15,.28,.12,'core',tag='P2')
for sx in (-1,1):
    vein('veinArm',chest,[(sx*.5,-.3,.4),(sx*.7,-.2,.3),(sx*.86,-.1,.42)],.022,tag='P3')
    vein('veinSide',chest,[(sx*.58,-.4,-.1),(sx*.5,-.46,.1),(sx*.62,-.38,.3)],.022,tag='P3')
    vein('veinBelly',spine,[(sx*.1,-.42,-.2),(sx*.24,-.4,0),(sx*.18,-.42,.22)],.02,tag='P3')
# demon head (phase 2/3): long horned skull, glowing eyes, fanged jaw
blob('skull',head,(0,-.02,.2),(.27,.3,.3),'rock',tag='P2')
blob('brow',head,(0,-.24,.3),(.26,.1,.07),'rockd',tag='P2')
blob('jaw',head,(0,-.2,.04),(.2,.18,.1),'rockd',tag='P2')
for sx in (-1,1):
    blob('cheek',head,(sx*.17,-.2,.16),(.09,.1,.08),'rockl',sub=1,tag='P2')
    box('eye',head,(sx*.1,-.3,.25),(.08,.03,.035),'eye',rot=(0,sx*-.25,0),tag='P2')
    for k in range(3):spike('fang',head,(sx*(.04+k*.05),-.3,.06),(sx*(.04+k*.05),-.32,-.04+k*.02),.022,'bone',seg=4,tag='P2')
    # curled horns: back, out and up
    vein('horn',head,[(sx*.18,-.12,.36),(sx*.42,-.04,.52),(sx*.66,.12,.6),(sx*.8,.3,.8),(sx*.76,.4,1.08),(sx*.62,.36,1.24)],.11,tag='P2',m='crest')
box('mouth',head,(0,-.31,.08),(.12,.02,.04),'glow',tag='P2')
# phase 3: torn wings and a burning crown
WING=[]
for sx in (-1,1):
    wroot=empty('wing',chest,(sx*.3,.58,.4));WING.append((wroot,sx))
    for k,(L,a) in enumerate(((2.0,-.15),(2.3,.25),(2.1,.65),(1.6,1.0))):
        tip=(sx*L*math.cos(a),.35+.12*k,L*math.sin(a)*.7+.35)
        spike('wingbone',wroot,(0,0,0),tip,.05,'crest',seg=4,tag='P3')
        bm=bmesh.new();vs=[bm.verts.new(p) for p in ((0,0,0),tip,(sx*(L*.7)*math.cos(a+.35),.4+.12*k,L*.7*math.sin(a+.35)*.7+.3))];bm.faces.new(vs)
        obj('wingskin',bm,wroot,(0,0,0),'wing',tag='P3')
for i in range(7):a=math.radians(-60+i*20);spike('crown',head,(math.sin(a)*.2,-.02+(1-math.cos(a))*.1,.42),(math.sin(a)*.3,(1-math.cos(a))*.14,.72+.08*(i%2)),.04,'glow',seg=4,tag='P3')
# ---- arms ----
for s,j in J.items():
    sx=j['sx']
    blob('delt'+s,j['sh'],(sx*.06,0,.04),(.4,.4,.38))
    blob('bicep'+s,j['sh'],(sx*.04,0,-.48),(.3,.3,.36))
    glowband('elband'+s,j['el'],(0,0,.02),.26,tag='P3')
    blob('fore'+s,j['el'],(0,0,-.32),(.34,.34,.42))
    blob('hand'+s,j['wr'],(0,-.02,-.2),(.32,.3,.28),'rock',sub=2)
    for k in range(4):spike('claw'+s,j['wr'],(sx*(-.15+k*.1),-.22,-.28),(sx*(-.16+k*.1),-.34,-.48),.035,'bone',seg=4)
    # set B: gauntlet with gold cuff, knuckle spikes and rivets
    panel('gauntlet'+s,j['el'],(0,0,-.36),(.5,.5,.6),top=.86,tag='B')
    cyl('cuff'+s,j['el'],(0,0,-.66),.29,.29,.07,'edge',seg=12,tag='B')
    for k in range(3):spike('gspike'+s,j['el'],(sx*.25,-.05+k*.1,-.2-k*.12),(sx*.42,-.05+k*.1,-.16-k*.12),.04,'edge',seg=4,tag='B')
    rivets('grivet'+s,j['el'],(0,0,-.36),(.5,.5,.6),n=3,tag='B')
    vein('grune'+s,j['el'],[(-.1,-.26,-.2),(0,-.26,-.36),(.1,-.26,-.5)],.014,tag='B',m='rune')
    # set A: layered spiked pauldron with gold rim and three horns
    panel('pauldron'+s,j['sh'],(sx*.12,0,.16),(.78,.8,.42),rot=(0,sx*.38,0),top=.7,tag='A')
    panel('pauldron2'+s,j['sh'],(sx*.3,0,-.06),(.38,.72,.34),rot=(0,sx*.6,0),top=.8,tag='A')
    for k in range(3):spike('pspike'+s,j['sh'],(sx*(.18+k*.14),-.2+k*.2,.36-k*.04),(sx*(.34+k*.18),-.24+k*.2,.82-k*.1),.07,'crest',seg=5,tag='A')
    rivets('privet'+s,j['sh'],(sx*.12,0,.16),(.6,.8,.3),face='y',n=3,tag='A')
# ---- legs ----
for s,j in J.items():
    sx=j['sx']
    blob('thigh'+s,j['hp'],(sx*.02,0,-.26),(.36,.38,.4))
    blob('shin'+s,j['kn'],(0,0,-.26),(.3,.32,.36))
    blob('hoof'+s,j['an'],(0,-.12,-.06),(.32,.44,.16),'rockd',sub=1)
    for dx in (-.14,.14):spike('talon'+s,j['an'],(dx,-.4,-.1),(dx*1.2,-.62,-.14),.06,'bone',seg=4)
    spike('heel'+s,j['an'],(0,.14,-.04),(0,.34,-.12),.05,'bone',seg=4)
    glowband('anband'+s,j['an'],(0,0,.16),.24,d=.05,tag='P3')
    panel('greave'+s,j['kn'],(0,-.02,-.26),(.5,.52,.6),top=1.08,tag='B')
    spike('kneespike'+s,j['kn'],(0,-.26,.06),(0,-.5,.16),.07,'edge',seg=4,tag='B')
    rivets('lrivet'+s,j['kn'],(0,-.02,-.26),(.5,.52,.6),n=3,tag='B')
    panel('thighplate'+s,j['hp'],(sx*.1,-.06,-.12),(.34,.48,.4),rot=(0,sx*.2,0),top=1.1,tag='B')
# waist: belt with skull, tassets (set B)
panel('belt',hips,(0,0,.16),(1.08,.84,.16),tag='B')
blob('skullbelt',hips,(0,-.46,.16),(.14,.1,.14),'bone',sub=2,tag='B')
for sx in (-1,1):box('skulleye',hips,(sx*.05,-.55,.18),(.035,.02,.03),'glow',tag='B')
for k,(x,rot) in enumerate(((-.36,-.12),(0,0),(.36,.12))):
    panel('tasset',hips,(x,-.46,-.2),(.34,.08,.46),rot=(math.radians(-10),0,rot),top=1.15,tag='B')
    vein('trune',hips,[(x-.06,-.52,-.08),(x,-.52,-.2),(x+.06,-.52,-.32)],.012,tag='B',m='rune')
for sx in (-1,1):panel('hipplate',hips,(sx*.6,-.04,-.08),(.28,.6,.5),rot=(0,sx*.28,0),top=.9,tag='B')
panel('backfauld',hips,(0,.42,-.06),(.8,.12,.5),top=1.1,tag='B')
# ---- set A: horned great-helm, chest plates (swing open in Overload) with rune sigil, back plate ----
HELM=panel('helm',head,(0,0,.24),(.66,.68,.76),top=.84,tag='A')
panel('helmBrow',head,(0,-.33,.38),(.7,.14,.14),tag='A')
box('visor',head,(0,-.36,.26),(.42,.05,.05),'glow',tag='A')
box('visorV',head,(0,-.36,.14),(.05,.05,.18),'glow',tag='A')
for sx in (-1,1):
    vein('helmhorn',head,[(sx*.3,-.05,.44),(sx*.52,.0,.6),(sx*.66,.1,.84),(sx*.6,.18,1.06)],.085,tag='A',m='crest')
    rivets('hrivet',head,(0,0,.24),(.66,.68,.6),n=3,tag='A')
spike('helmcrest',head,(0,.1,.62),(0,.42,.96),.08,'edge',seg=4,tag='A')
CPL=[];CHINGE=[]
for sx in (-1,1):
    hinge=empty('chestHinge',chest,(sx*.76,-.48,.1));CHINGE.append((hinge,sx))
    panel('chestplate',hinge,(-sx*.38,0,0),(.78,.22,.96),top=.92,tag='A')
    rivets('crivet',hinge,(-sx*.38,0,0),(.78,.22,.96),n=3,tag='A')
gem('sigil',chest,(0,-.66,.2),.1,.2,.07,'rune',tag='A')
vein('sigilring',chest,[(-.16,-.64,.2),(0,-.65,.4),(.16,-.64,.2),(0,-.65,0),(-.16,-.64,.2)],.016,tag='A',m='rune')
panel('backplate',chest,(0,.52,.08),(1.26,.2,.84),top=.82,tag='A')
# ---- look per variant ----
def apply_variant(v):
    for o in SETS['A']:o.hide_render=v>=2
    for o in SETS['B']:o.hide_render=v>=3
    for o in SETS['P2']:o.hide_render=v<2
    for o in SETS['P3']:o.hide_render=v<3
apply_variant(VAR)
# ---- camera, lights, render (Butcher framing, wider ortho for the giant + overhead slams) ----
ORTHO=7.2
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=ORTHO;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
elv=math.radians(30);co.location=(0,-30*math.cos(elv),30*math.sin(elv));co.rotation_euler=(math.radians(90)-elv,0,0);scn.camera=co
rim=bpy.data.lights.new('rim','SUN');rim.energy=2.6;rim.color=(1.0,.62,.36);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=5.2;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.55,.62,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
try:scn.eevee.taa_render_samples=12
except Exception:pass
scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE';scn.render.line_thickness=1.3*SIZE/640
ls=scn.view_layers[0].freestyle_settings.linesets[0] if scn.view_layers[0].freestyle_settings.linesets else scn.view_layers[0].freestyle_settings.linesets.new('outline')
ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False;ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.04,.03,.03);ls.linestyle.thickness=1.3*SIZE/640
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
# ---- poses ----
R=math.radians
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def seg(t,a,b):return ease((t-a)/(b-a)) if b>a else float(t>=a)
def reset():
    root.location=(0,0,0);root.rotation_euler=(0,0,0);hips.location=(0,0,HZ);hips.rotation_euler=(0,0,0)
    for o in (spine,chest,neck,head):o.rotation_euler=(0,0,0)
    spine.rotation_euler.x=R(6);chest.rotation_euler.x=R(8);neck.rotation_euler.x=R(-6);head.rotation_euler.x=R(-4)   # slight forward heft
    for hg,sx in CHINGE:hg.rotation_euler=(0,0,0)
    for j in J.values():
        sx=j['sx']
        for k in ('sh','el','wr','hp','kn','an'):j[k].rotation_euler=(0,0,0)
        j['sh'].rotation_euler=(R(-6),-sx*R(14),0);j['el'].rotation_euler=(R(-16),0,0)
        j['hp'].rotation_euler=(R(-6),-sx*R(7),0);j['kn'].rotation_euler.x=R(14);j['an'].rotation_euler=(R(-8),sx*R(7),0)
def legs(ph,amp=1):
    for j,off in ((J['L'],0),(J['R'],math.pi)):
        w=math.sin(2*math.pi*ph+off);lift=max(0,math.sin(2*math.pi*ph+off+1.4))
        j['hp'].rotation_euler.x=R(-6)-R(24)*w*amp;j['kn'].rotation_euler.x=R(14)+R(34)*lift*amp;j['an'].rotation_euler.x=R(-8)+R(12)*w*amp
def open_chest(k):
    for hg,sx in CHINGE:hg.rotation_euler.z=-sx*R(70)*k
def punch(t,j,o):
    sx=j['sx'];cock=seg(t,0,5/14)*(1-seg(t,6/14,9/14));drv=seg(t,6/14,9/14)*(1-seg(t,11/14,1))
    chest.rotation_euler.z=sx*R(24)*cock-sx*R(16)*drv;chest.rotation_euler.x=R(8)-R(6)*cock+R(36)*drv;hips.location.z=HZ-.06*cock-.3*drv;hips.rotation_euler.z=sx*R(8)*cock-sx*R(10)*drv
    j['sh'].rotation_euler=(R(-6)+R(30)*cock-R(70)*drv,-sx*R(14)-sx*R(20)*cock+sx*R(6)*drv,0);j['el'].rotation_euler.x=R(-16)-R(95)*cock+R(6)*drv
    o['sh'].rotation_euler.x=R(-6)-R(18)*cock+R(24)*drv
    j['hp'].rotation_euler.x=R(-6)-R(30)*drv;j['kn'].rotation_euler.x=R(14)+R(40)*drv;o['hp'].rotation_euler.x=R(-6)+R(14)*drv;o['kn'].rotation_euler.x=R(14)+R(30)*drv
def pose(anim,t):
    reset();L,Rr=J['L'],J['R'];s=math.sin(2*math.pi*t)
    if anim=='Idle':
        hips.location.z=HZ+.025*s;chest.rotation_euler.x=R(8)+R(2.5)*s;head.rotation_euler.x=R(-4)-R(2)*s
        for j,ph in ((L,0),(Rr,.5)):j['sh'].rotation_euler.x=R(-6)+R(3)*math.sin(2*math.pi*(t+ph));j['el'].rotation_euler.x=R(-16)-R(4)*math.sin(2*math.pi*(t+ph))
    elif anim=='Run':
        # heavy pounding stride: big shoulder roll, fists swinging, body dropping on each footfall
        hips.location.z=HZ-.05+.08*abs(math.sin(2*math.pi*t));hips.rotation_euler.z=R(6)*s;chest.rotation_euler.x=R(14);chest.rotation_euler.z=R(-8)*s
        legs(t)
        for j,sg in ((L,1),(Rr,-1)):j['sh'].rotation_euler.x=R(-6)+R(26)*sg*s;j['el'].rotation_euler.x=R(-28)-R(10)*max(0,sg*s)
    elif anim=='TakeDamage1':
        k=math.sin(math.pi*min(1,t*1.4));chest.rotation_euler.x=R(8)-R(16)*k;head.rotation_euler.x=R(-4)-R(14)*k;hips.location.y=.1*k
        for j in (L,Rr):sx=j['sx'];j['sh'].rotation_euler=(R(-6)+R(14)*k,-sx*R(14)-sx*R(16)*k,0)
    elif anim=='PunchR':punch(t,Rr,L)
    elif anim=='PunchL':punch(t,L,Rr)
    elif anim=='Jump':
        # crouch with both fists raised (0-4), airborne tuck with fists overhead (5-9), two-fist slam (10), lodged (11-14)
        cr=seg(t,0,4/14)*(1-seg(t,4/14,6/14));air=seg(t,4/14,6/14)*(1-seg(t,9/14,10/14));sl=seg(t,9/14,10/14);strain=math.sin(t*60)*seg(t,11/14,1)
        hips.location.z=HZ-.38*cr-.05*air-.5*sl;chest.rotation_euler.x=R(8)+R(18)*cr-R(14)*air+R(52)*sl+R(1.5)*strain;head.rotation_euler.x=R(-4)-R(10)*air-R(16)*sl
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(120)*cr-R(40)*air-R(-100)*sl*0-R(55)*sl,-sx*R(14)+sx*R(10)*(cr+air),0);j['el'].rotation_euler.x=R(-16)-R(40)*cr-R(20)*air+R(30)*sl
            j['hp'].rotation_euler.x=R(-6)-R(40)*cr-R(50)*air-R(40)*sl;j['kn'].rotation_euler.x=R(14)+R(70)*cr+R(60)*air+R(55)*sl;j['an'].rotation_euler.x=R(-8)-R(20)*cr+R(10)*air-R(10)*sl
        if air>0:
            for j in (L,Rr):j['sh'].rotation_euler.x=R(-6)-R(160)*air-R(120)*cr*(1-air)
    elif anim=='Throw':
        # bend and tear the boulder up (0-3), heave it overhead (3-7), hurl it forward (7-9, release 9), recover
        dig=seg(t,0,3/14)*(1-seg(t,3/14,7/14));up=seg(t,3/14,7/14)*(1-seg(t,7/14,9/14));th=seg(t,7/14,9/14)*(1-seg(t,11/14,1))
        chest.rotation_euler.x=R(8)+R(40)*dig-R(14)*up+R(30)*th;hips.location.z=HZ-.3*dig-.05*up-.12*th
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(60)*dig-R(165)*up-R(70)*th,-sx*R(14)+sx*R(18)*up+sx*R(10)*dig,0);j['el'].rotation_euler.x=R(-16)-R(10)*dig-R(40)*up-R(5)*th
            j['hp'].rotation_euler.x=R(-6)-R(30)*dig;j['kn'].rotation_euler.x=R(14)+R(40)*dig
        Rr['hp'].rotation_euler.x=R(-6)+R(16)*th;L['hp'].rotation_euler.x=R(-6)-R(22)*th;L['kn'].rotation_euler.x=R(14)+R(18)*th
    elif anim=='Slam':
        # Fault Line: both fists rise high (0-7), smash the ground (7-8), hold (8-11), straighten
        up=seg(t,0,7/14)*(1-seg(t,7/14,8/14));dn=seg(t,7/14,8/14)*(1-seg(t,11/14,1))
        chest.rotation_euler.x=R(8)-R(16)*up+R(50)*dn;hips.location.z=HZ+.05*up-.42*dn;head.rotation_euler.x=R(-4)+R(14)*up-R(14)*dn
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(168)*up-R(58)*dn,-sx*R(14)+sx*R(16)*up+sx*R(4)*dn,0);j['el'].rotation_euler.x=R(-16)-R(25)*up+R(8)*dn
            j['hp'].rotation_euler.x=R(-6)-R(36)*dn;j['kn'].rotation_euler.x=R(14)+R(55)*dn;j['an'].rotation_euler.x=R(-8)-R(14)*dn
    elif anim=='Stomp':
        # raises the right foot high, arms out for balance (0-6), stamps down (6-7), hold, settle
        up=seg(t,0,6/14)*(1-seg(t,6/14,7/14));dn=seg(t,6/14,7/14)*(1-seg(t,10/14,1))
        Rr['hp'].rotation_euler.x=R(-6)-R(72)*up-R(6)*dn;Rr['kn'].rotation_euler.x=R(14)+R(76)*up+R(8)*dn;Rr['an'].rotation_euler.x=R(-8)+R(10)*up
        L['kn'].rotation_euler.x=R(14)+R(10)*up+R(30)*dn;L['hp'].rotation_euler.x=R(-6)-R(6)*up-R(20)*dn
        chest.rotation_euler.x=R(8)-R(12)*up+R(22)*dn;chest.rotation_euler.y=R(6)*up;hips.location.z=HZ+.06*up-.22*dn;hips.location.x=-.12*up
        for j in (L,Rr):sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(20)*up+R(10)*dn,-sx*R(14)-sx*R(46)*up-sx*R(10)*dn,0);j['el'].rotation_euler.x=R(-16)-R(30)*up
    elif anim=='Overload':
        # braces wide and lifts both fists as the core flares (0-6), slams (7), drops to one knee with the chest open (8-14)
        br=seg(t,0,6/14)*(1-seg(t,6/14,7/14));sl=seg(t,6/14,7/14)*(1-seg(t,8/14,10/14));kn=seg(t,8/14,10/14);breath=math.sin((t-10/14)*14)*seg(t,10/14,1)
        chest.rotation_euler.x=R(8)-R(20)*br+R(48)*sl+R(4)*kn+R(2)*breath;head.rotation_euler.x=R(-4)+R(16)*br-R(10)*sl+R(14)*kn;hips.location.z=HZ-.18*br-.38*sl-.62*kn
        for j in (L,Rr):
            sx=j['sx'];j['hp'].rotation_euler.y=-sx*R(7)-sx*R(12)*br;j['kn'].rotation_euler.x=R(14)+R(30)*br+R(45)*sl
            j['sh'].rotation_euler=(R(-6)-R(150)*br-R(60)*sl+R(10)*kn,-sx*R(14)+sx*R(14)*br-sx*R(10)*kn,0);j['el'].rotation_euler.x=R(-16)-R(30)*br-R(20)*kn
        # one knee down: left foot planted forward, right knee on the ground
        L['hp'].rotation_euler.x=R(-6)*(1-kn)-R(78)*kn;L['kn'].rotation_euler.x=L['kn'].rotation_euler.x*(1-kn)+R(88)*kn;L['an'].rotation_euler.x=R(-8)+R(-4)*kn
        Rr['hp'].rotation_euler.x=R(-6)*(1-kn)+R(8)*kn;Rr['kn'].rotation_euler.x=Rr['kn'].rotation_euler.x*(1-kn)+R(100)*kn;Rr['an'].rotation_euler.x=R(-8)+R(30)*kn
        open_chest(kn)
    elif anim=='Break':
        # hunch and shake as the light builds (0-8), armour bursts off (9), straighten and roar (10-14)
        hu=seg(t,0,7/14)*(1-seg(t,8/14,9.5/14));bu=seg(t,8/14,9.5/14)*(1-seg(t,12/14,1));rr=seg(t,10/14,12/14)
        jit=(random.random()-.5)*R(3)*hu
        chest.rotation_euler.x=R(8)+R(36)*hu-R(26)*bu+jit;chest.rotation_euler.z=jit;hips.location.z=HZ-.26*hu+.04*bu;head.rotation_euler.x=R(-4)+R(18)*hu-R(30)*bu
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)+R(16)*hu+R(10)*bu,-sx*R(14)+sx*R(14)*hu-sx*R(70)*bu,0);j['el'].rotation_euler.x=R(-16)-R(70)*hu-R(30)*bu
            j['kn'].rotation_euler.x=R(14)+R(30)*hu;j['hp'].rotation_euler.x=R(-6)-R(16)*hu
        apply_variant(VAR+1 if t>=9/14-1e-6 else VAR)
    elif anim=='Die1':
        kn=ease(t/.45);fall=ease((t-.45)/.4)
        hips.location.z=HZ-.62*kn-.3*fall;chest.rotation_euler.x=R(8)+R(28)*kn;head.rotation_euler.x=R(-4)+R(20)*kn
        for j in (L,Rr):
            sx=j['sx'];j['hp'].rotation_euler.x=R(-6)-R(48)*kn;j['kn'].rotation_euler.x=R(14)+R(84)*kn;j['an'].rotation_euler.x=R(-8)+R(20)*kn
            j['sh'].rotation_euler=(R(-6)-R(30)*kn-R(50)*fall,-sx*R(14)-sx*R(14)*kn,0)
        return None,R(60)*fall
    return 0
DIRS=[90,45,0,-45,-90,-135,180,135]  # rows E,SE,S,SW,W,NW,N,NE (model faces the camera at 0)
COMMON=['Idle','Run','TakeDamage1','PunchR','PunchL','Jump','Throw','Slam','Stomp','Overload']
ANIMS=COMMON+(['Break'] if VAR<3 else ['Die1'])
LOOP=('Idle','Run')
only=os.environ.get('MODEL_ONLY');rows_only=os.environ.get('MODEL_ROWS');frames_only=os.environ.get('MODEL_FRAMES')
for anim in ANIMS:
    if only and anim not in only.split(','):continue
    for row,deg in enumerate(DIRS):
        if row in (3,4,5) or (rows_only and str(row) not in rows_only.split(',')):continue
        for f in range(15):
            if frames_only and str(f) not in frames_only.split(','):continue
            random.seed(f*31+row)
            res=pose(anim,f/15 if anim in LOOP else f/14);yaw=R(deg);tilt=0
            if isinstance(res,tuple):tilt=res[1]
            elif res:yaw+=res
            root.rotation_euler=(0,0,yaw)
            if tilt:hips.rotation_euler.x=tilt;hips.location.y=.25*tilt/R(60);hips.location.z-=.2*tilt/R(60)
            # ground clamp: crouches/kneels/topples never sink through the floor
            bpy.context.view_layer.update();lo=min((o.matrix_world@Vector(c)).z for o in PARTS if not o.hide_render for c in o.bound_box)
            if lo<0:root.location.z=-lo
            scn.render.filepath=os.path.join(OUT,'%s_%d_%02d.png'%(anim,row,f));bpy.ops.render.render(write_still=True)
            if anim=='Break':apply_variant(VAR)
print('tyrant variant',VAR,'frames written to',OUT)
