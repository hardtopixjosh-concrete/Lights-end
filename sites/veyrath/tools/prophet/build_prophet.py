"""Procedural low-poly Hollow Prophet (Oct 17, user's 8-direction concept sheet). Tall, gaunt horned demon caster: two
dark curved horns, grey gaunt face with glowing magenta eyes, tall stiff purple collar with lavender lining, a dark
pointed shoulder mantle, a magenta diamond gem on the chest and another on the dark belt, a long purple robe flaring to
a ragged hem with lavender trim, a lavender stripe down the back, wide bell sleeves with lavender cuffs, long grey
clawed hands and dark pointed boots.
Rendered like the Butcher/Colossus/Wyrm: orthographic game camera (30 deg down, feet at 75% of the cell), 5 directions
x 15 frames, Freestyle outline. SW/W/NW are mirrored in game.
Animations (release frames for game sync): Idle, Run (gliding stride), TakeDamage1, Die1, Cast (hands rise and flare,
release 7), Summon (arms spread wide, release 7: Soul Cage / False Apparitions), Thrust (Repulse: palms shoved
forward, release 9), Scythe (sweeping two-handed fling, release 6).
Run: blender -b --factory-startup -P tools/prophet/build_prophet.py -- OUT_DIR [SIZE]
Then: python tools/hd/compose_model.py OUT_DIR prophet"""
import bpy,bmesh,math,random,sys,os
from mathutils import Vector,Euler
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else os.path.join(os.path.dirname(__file__),'frames');SIZE=int(argv[1]) if len(argv)>1 else 1024
os.makedirs(OUT,exist_ok=True);random.seed(1017)
bpy.ops.wm.read_factory_settings(use_empty=True);scn=bpy.context.scene
def lin(h):h=h.lstrip('#');return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))+(1,)
def mat(name,col,emit=0,rough=.8,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=lin(col);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    if emit:b.inputs['Emission Color'].default_value=lin(col);b.inputs['Emission Strength'].default_value=emit
    m.diffuse_color=lin(col);return m
M=dict(robe=mat('robe','40244c',rough=.88),robed=mat('robed','2c1a34',rough=.9),trim=mat('trim','9a82bc',rough=.72),mantle=mat('mantle','2c2630',rough=.85),
       skin=mat('skin','a6a2ac',rough=.75),skind=mat('skind','86828e',rough=.8),horn=mat('horn','2a2630',rough=.55),gem=mat('gem','d838ff',emit=3.2,rough=.3),
       eye=mat('eye','ff4cff',emit=4),boot=mat('boot','1e1a22',rough=.6),belt=mat('belt','26222c',rough=.6))
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_mode='XYZ';return o
PARTS=[]
def obj(name,bm,parent,loc,m,rot=(0,0,0),scale=(1,1,1)):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_euler=rot;o.scale=scale
    for mm in ([m] if isinstance(m,str) else m):me.materials.append(M[mm])
    PARTS.append(o);return o
def blob(name,parent,loc,size,m='skin',rot=(0,0,0),sub=2,jit=.03,ang=22):
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1)
    if sub>=2:bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(ang),verts=bm.verts[:],edges=bm.edges[:])
    for v in bm.verts:v.co*=1+random.uniform(-jit,jit)
    bmesh.ops.triangulate(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,m,rot,size)
def tube(name,parent,pts,radii,m,seg=6,loc=(0,0,0)):
    bm=bmesh.new();rings=[]
    for i,(p,r) in enumerate(zip(pts,radii)):
        p=Vector(p);d=(Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(i-1,0)])).normalized();a=d.cross(Vector((0,1,0)) if abs(d.y)<.9 else Vector((1,0,0))).normalized();b=d.cross(a)
        rings.append([bm.verts.new(p+(a*math.cos(k*2*math.pi/seg)+b*math.sin(k*2*math.pi/seg))*max(r,.003)) for k in range(seg)])
    for r0,r1 in zip(rings,rings[1:]):
        for k in range(seg):bm.faces.new((r0[k],r0[(k+1)%seg],r1[(k+1)%seg],r1[k]))
    bm.faces.new(list(reversed(rings[0])));tip=bm.verts.new(Vector(pts[-1])+(Vector(pts[-1])-Vector(pts[-2])).normalized()*radii[-1]*1.6)
    for k in range(seg):bm.faces.new((rings[-1][k],rings[-1][(k+1)%seg],tip))
    return obj(name,bm,parent,loc,m)
def skirt(name,parent,loc,z0,z1,r0,r1,m,seg=14,gap=None,ragged=0,yscale=1,m2=None,trim_w=0):
    """Open cone shell (robe skirt / bell sleeve / collar). gap=(a0,a1) radians leaves the front open; ragged zig-zags
    the bottom edge; trim_w adds a lavender band (material 1) along the bottom rim."""
    bm=bmesh.new();A=[];
    for k in range(seg+1):
        a=-math.pi/2+k*2*math.pi/seg
        if gap and (gap[0]<((a+math.pi/2+math.pi)%(2*math.pi))-math.pi<gap[1]):A.append(None);continue
        A.append(a)
    rings=[];levels=[(z0,r0,0),(z1+trim_w,r1-(r1-r0)*trim_w/(z0-z1) if z0!=z1 else r1,1 if trim_w else 0),(z1,r1,1)] if trim_w else [(z0,r0,0),(z1,r1,0)]
    for li,(z,r,_) in enumerate(levels):
        ring=[]
        for k,a in enumerate(A):
            if a is None:ring.append(None);continue
            zz=z+((ragged*(.6 if k%2 else -.4)+random.uniform(-.02,.02)) if li==len(levels)-1 and ragged else 0)
            ring.append(bm.verts.new((math.cos(a)*r,math.sin(a)*r*yscale,zz)))
        rings.append(ring)
    for li in range(len(rings)-1):
        for k in range(len(A)-1):
            q=(rings[li][k],rings[li][k+1],rings[li+1][k+1],rings[li+1][k])
            if None in q:continue
            f=bm.faces.new(q);f.material_index=1 if (trim_w and li==len(rings)-2) else 0
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
    bmesh.ops.solidify(bm,geom=bm.faces[:],thickness=.025) if hasattr(bmesh.ops,'solidify') else None
    return obj(name,bm,parent,loc,[m,m2 or 'trim'])
def gem(name,parent,loc,w,h,d,rot=(0,0,0)):
    bm=bmesh.new();vs=[bm.verts.new(p) for p in ((0,0,h),(w,0,0),(0,0,-h),(-w,0,0),(0,-d,0),(0,d*.4,0))]
    for a,b in ((0,1),(1,2),(2,3),(3,0)):bm.faces.new((vs[a],vs[b],vs[4]));bm.faces.new((vs[b],vs[a],vs[5]))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,'gem',rot)
# ---- rig (faces -Y) ----
HZ=1.32
root=empty('root');hips=empty('hips',root,(0,0,HZ));spine=empty('spine',hips,(0,0,.28));chest=empty('chest',spine,(0,0,.34));neck=empty('neck',chest,(0,-.02,.36));head=empty('head',neck,(0,-.02,.14))
J={}
for s,sx in (('L',-1),('R',1)):
    sh=empty('shoulder'+s,chest,(sx*.34,0,.24));el=empty('elbow'+s,sh,(0,0,-.46));wr=empty('wrist'+s,el,(0,0,-.46))
    hp=empty('hip'+s,hips,(sx*.14,0,-.04));kn=empty('knee'+s,hp,(0,0,-.62));an=empty('ankle'+s,kn,(0,0,-.6))
    J[s]=dict(sh=sh,el=el,wr=wr,hp=hp,kn=kn,an=an,sx=sx)
# ---- body under the robe ----
blob('torso',chest,(0,0,.02),(.3,.2,.34),'robe')
blob('waist',spine,(0,0,0),(.22,.16,.24),'robe')
cyl=lambda name,parent,loc,r1,r2,d,m,rot=(0,0,0),seg=10:obj(name,(lambda bm:(bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r1,radius2=r2,depth=d),bm)[1])(bmesh.new()),parent,loc,m,rot)
cyl('belt',hips,(0,0,.18),.24,.23,.09,'belt')
gem('beltgem',hips,(0,-.24,.18),.055,.08,.05)
gem('chestgem',chest,(0,-.22,.12),.07,.11,.06)
for sx in (-1,1):
    tube('chestTrim',chest,[(sx*.05,-.2,.36),(sx*.1,-.21,.1),(sx*.06,-.2,-.14)],[.02,.02,.02],'trim',seg=4)
# robe: front skirt (open in front, showing the dark under-robe) + under-robe + back stripe
ROBE=skirt('robe',hips,(0,0,.14),0,-1.42,.24,.62,'robe',seg=16,gap=(-.38+math.pi*0,.38),ragged=.09,yscale=.85,trim_w=.12)
skirt('underrobe',hips,(0,-.02,.1),0,-1.34,.2,.42,'robed',seg=10,ragged=.05,yscale=.8)
tube('backstripe',hips,[(0,.22,.1),(0,.38,-.6),(0,.52,-1.24)],[.06,.1,.13],'trim',seg=4)
for sx in (-1,1):tube('frontTrim',hips,[(sx*.1,-.22,.1),(sx*.2,-.36,-.6),(sx*.26,-.5,-1.24)],[.035,.035,.035],'trim',seg=4)
for s,j in J.items():
    tube('leg'+s,j['kn'],[(0,0,.3),(0,0,-.5)],[.07,.06],'robed',seg=6)
    blob('boot'+s,j['an'],(0,-.08,-.04),(.08,.18,.07),'boot',sub=1)
    tube('toe'+s,j['an'],[(0,-.18,-.05),(0,-.32,-.04)],[.05,.02],'boot',seg=5)
# ---- mantle + collar ----
blob('mantle',chest,(0,.02,.28),(.5,.36,.14),'mantle',sub=1,jit=.05)
for sx in (-1,1):
    tube('mantlePoint',chest,[(sx*.3,0,.3),(sx*.52,.0,.26),(sx*.66,.02,.14)],[.13,.08,.02],'mantle',seg=5)
    blob('mantleFold',chest,(sx*.4,.12,.22),(.22,.24,.1),'mantle',sub=1,jit=.06,rot=(0,sx*.3,0))
COLLAR=skirt('collar',chest,(0,.05,.34),0,.28,.17,.36,'robe',seg=12,gap=(-.75,.75),yscale=.9,trim_w=0)
skirt('collarIn',chest,(0,.045,.34),0,.26,.16,.34,'trim',seg=12,gap=(-.75,.75),yscale=.88)
# ---- arms: bell sleeves + long clawed hands ----
for s,j in J.items():
    sx=j['sx']
    blob('shoulderm'+s,j['sh'],(sx*.02,0,-.02),(.13,.13,.13),'robe',sub=1)
    tube('upper'+s,j['sh'],[(0,0,0),(0,0,-.46)],[.09,.08],'robe',seg=7)
    sl=empty('sleeve'+s,j['el'],(0,0,0))
    skirt('sleeve'+s,sl,(0,0,.04),0,-.5,.09,.24,'robe',seg=10,ragged=.04,trim_w=.08)
    blob('palm'+s,j['wr'],(0,-.01,-.06),(.06,.045,.08),'skin',sub=1)
    for k in range(4):
        x=(k-1.5)*.03;tube('finger'+s,j['wr'],[(x,-.02,-.12),(x*1.4,-.03,-.24),(x*1.7,-.06,-.34),(x*1.8,-.1,-.4)],[.016,.013,.009,.004],'skind',seg=4)
    tube('thumb'+s,j['wr'],[(-sx*.05,-.04,-.08),(-sx*.1,-.08,-.16),(-sx*.12,-.12,-.22)],[.015,.011,.004],'skind',seg=4)
# ---- head: gaunt grey face, magenta eyes, curved horns ----
blob('skull',head,(0,0,.1),(.13,.15,.17))
blob('face',head,(0,-.08,.03),(.1,.09,.13),'skin',sub=1)
blob('jaw',head,(0,-.07,-.06),(.07,.07,.06),'skind',sub=1)
for sx in (-1,1):
    blob('cheek',head,(sx*.07,-.1,.03),(.035,.03,.05),'skind',sub=1)
    blob('eye',head,(sx*.05,-.15,.08),(.032,.012,.013),'eye',sub=1,jit=0,rot=(0,0,sx*.35))
    tube('ear',head,[(sx*.11,-.0,.08),(sx*.19,.04,.12),(sx*.24,.07,.16)],[.025,.015,.004],'skin',seg=4)
    pts=[(sx*.08,-.03,.21),(sx*.17,.0,.31),(sx*.24,.05,.45),(sx*.25,.12,.6),(sx*.21,.2,.72),(sx*.15,.26,.8),(sx*.11,.26,.86)]
    tube('horn',head,pts,[.055,.05,.04,.03,.02,.011,.004],'horn',seg=6)
blob('brow',head,(0,-.13,.13),(.11,.04,.03),'skind',sub=1)
blob('backhead',head,(0,.05,.1),(.135,.12,.165),'skind',sub=2)   # darker back of the skull (read from behind)
# ---- Oct 19 detail pass (user: boss models need real detail): glowing rune glyphs down the robe and around the hem,
# skull-bead necklace, ridged horns, cuff gems, a torn second hem layer and mantle spikes ----
M.update(rune=mat('rune','e8a0ff',emit=5),bone=mat('bone','d8d0c0',rough=.6),gold=mat('gold','a88a4a',rough=.35,metal=.8))
for sx in (-1,1):
    for k in range(6):
        u=k/5;x=sx*(.12+.13*u);y=-.25-.24*u;z=.0-1.15*u
        obj('glyph',(lambda bm:(bmesh.ops.create_cube(bm,size=1),bm)[1])(bmesh.new()),hips,(x,y,z),'rune',(0,0,sx*.3),(.035,.01,.05 if k%2 else .03))
for k in range(18):
    a=-math.pi/2+(k+.5)*2*math.pi/18
    if abs(((a+math.pi/2+math.pi)%(2*math.pi))-math.pi)<.42:continue
    obj('hemrune',(lambda bm:(bmesh.ops.create_cube(bm,size=1),bm)[1])(bmesh.new()),hips,(math.cos(a)*.6,math.sin(a)*.6*.85,-1.18),'rune',(0,0,a),(.012,.04,.03))
skirt('tornhem',hips,(0,0,-.9),0,-.6,.5,.66,'robed',seg=18,gap=(-.5,.5),ragged=.14,yscale=.86)
for k in range(9):
    a=math.radians(-110+k*27.5);blob('bead',chest,(math.sin(a)*.2,-math.cos(a)*.16-.02,.3-.04*abs(math.cos(a))),(.03,.03,.032),'bone' if k%2 else 'gold',sub=1,jit=0)
blob('skullbead',chest,(0,-.22,.22),(.045,.04,.048),'bone',sub=2,jit=0)
for sx in (-1,1):
    for k,(z,r) in enumerate(((.3,.052),(.4,.045),(.5,.038),(.6,.03))):
        cyl('hornring',head,(sx*(.17+.03*k),.0+.04*k,z),r,r,.018,'gold' if k==0 else 'horn',seg=8)
    for k in range(3):tube('mspike',chest,[(sx*(.3+k*.12),.04,.32-k*.03),(sx*(.36+k*.14),.08,.5-k*.05)],[.03,.004],'horn',seg=4)
for s,j in J.items():
    gem('cuffgem'+s,j['el'],(0,-.24,-.4),.035,.05,.03)
    obj('palmrune'+s,(lambda bm:(bmesh.ops.create_cube(bm,size=1),bm)[1])(bmesh.new()),j['wr'],(0,-.05,-.07),'rune',(0,0,0),(.03,.008,.03))
# ---- camera, lights, render ----
ORTHO=5.0
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=ORTHO;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
elv=math.radians(30);co.location=(0,-30*math.cos(elv),30*math.sin(elv));co.rotation_euler=(math.radians(90)-elv,0,0);scn.camera=co
rim=bpy.data.lights.new('rim','SUN');rim.energy=2.6;rim.color=(.85,.7,1.0);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=3.4;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.5,.6,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
try:scn.eevee.taa_render_samples=12
except Exception:pass
scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE';scn.render.line_thickness=1.2*SIZE/640
ls=scn.view_layers[0].freestyle_settings.linesets[0] if scn.view_layers[0].freestyle_settings.linesets else scn.view_layers[0].freestyle_settings.linesets.new('outline')
ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False;ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.08,.04,.1);ls.linestyle.thickness=1.2*SIZE/640
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
# ---- poses ----
R=math.radians
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def seg(t,a,b):return ease((t-a)/(b-a)) if b>a else float(t>=a)
def reset():
    root.location=(0,0,0);root.rotation_euler=(0,0,0);hips.location=(0,0,HZ);hips.rotation_euler=(0,0,0)
    for o in (spine,chest,neck,head):o.rotation_euler=(0,0,0)
    chest.rotation_euler.x=R(4);neck.rotation_euler.x=R(10);head.rotation_euler.x=R(-6)   # slight predatory stoop
    for j in J.values():
        sx=j['sx']
        for k in ('sh','el','wr','hp','kn','an'):j[k].rotation_euler=(0,0,0)
        j['sh'].rotation_euler=(R(-4),-sx*R(26),0);j['el'].rotation_euler=(R(-14),0,0);j['wr'].rotation_euler=(R(-10),0,sx*R(10))  # claws held out from the body (concept)
        j['hp'].rotation_euler=(0,-sx*R(3),0)
def pose(anim,t):
    reset();L,Rr=J['L'],J['R'];s=math.sin(2*math.pi*t)
    if anim=='Idle':
        hips.location.z=HZ+.02*s;chest.rotation_euler.x=R(4)+R(2)*s
        for j,ph in ((L,0),(Rr,.5)):sx=j['sx'];j['wr'].rotation_euler.x=R(-10)+R(8)*math.sin(2*math.pi*(t+ph));j['el'].rotation_euler.x=R(-14)-R(5)*math.sin(2*math.pi*(t+ph))
        ROBE.rotation_euler.z=R(2)*s
    elif anim=='Run':
        # gliding stride: long steps hidden under the robe, robe swaying, claws trailing
        hips.location.z=HZ-.02+.03*abs(s);hips.rotation_euler.z=R(6)*s;chest.rotation_euler.x=R(12);chest.rotation_euler.z=R(-6)*s
        for j,off in ((L,0),(Rr,math.pi)):w=math.sin(2*math.pi*t+off);j['hp'].rotation_euler.x=R(-26)*w;j['kn'].rotation_euler.x=R(30)*max(0,math.sin(2*math.pi*t+off+1.3))
        for j,sg in ((L,1),(Rr,-1)):j['sh'].rotation_euler.x=R(10)+R(14)*sg*s;j['el'].rotation_euler.x=R(-24)
        ROBE.rotation_euler.x=R(-6);ROBE.rotation_euler.z=R(5)*s
    elif anim=='TakeDamage1':
        k=math.sin(math.pi*min(1,t*1.4));chest.rotation_euler.x=R(4)-R(18)*k;head.rotation_euler.x=R(-6)-R(16)*k;hips.location.y=.1*k
        for j in (L,Rr):sx=j['sx'];j['sh'].rotation_euler=(R(-4)+R(16)*k,-sx*R(26)-sx*R(18)*k,0)
    elif anim=='Die1':
        kn=ease(t/.45);fall=ease((t-.45)/.4)
        hips.location.z=HZ-.7*kn-.3*fall;chest.rotation_euler.x=R(4)+R(30)*kn;head.rotation_euler.x=R(-6)+R(20)*kn
        for j in (L,Rr):sx=j['sx'];j['hp'].rotation_euler.x=R(-50)*kn;j['kn'].rotation_euler.x=R(95)*kn;j['sh'].rotation_euler=(R(-4)-R(30)*kn-R(40)*fall,-sx*R(26)-sx*R(10)*kn,0)
        return None,R(65)*fall
    elif anim=='Cast':
        # hands rise in front, claws flaring (0-6), thrust up and outward on release (7), recover
        up=seg(t,0,6/14)*(1-seg(t,6/14,8/14));rel=seg(t,6/14,8/14)*(1-seg(t,11/14,1))
        chest.rotation_euler.x=R(4)-R(10)*up+R(6)*rel;head.rotation_euler.x=R(-6)-R(8)*up
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-4)-R(80)*up-R(120)*rel,-sx*R(26)+sx*R(12)*up-sx*R(16)*rel,0);j['el'].rotation_euler.x=R(-14)-R(60)*up+R(30)*rel;j['wr'].rotation_euler=(R(-10)+R(30)*up-R(20)*rel,0,sx*R(10))
    elif anim=='Summon':
        # arms sweep wide and high, palms up (0-6), slam open on release (7), hold the spell, recover
        up=seg(t,0,6/14)*(1-seg(t,6/14,8/14));rel=seg(t,6/14,8/14)*(1-seg(t,11/14,1))
        chest.rotation_euler.x=R(4)-R(14)*(up+rel);head.rotation_euler.x=R(-6)-R(14)*rel;hips.location.z=HZ+.06*rel
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-4)-R(30)*up-R(40)*rel,-sx*R(26)-sx*R(50)*up-sx*R(64)*rel,0);j['el'].rotation_euler.x=R(-14)-R(40)*up+R(10)*rel;j['wr'].rotation_euler=(R(-10)-R(30)*rel,0,sx*R(10))
    elif anim=='Thrust':
        # Repulse: draws both hands back to the chest (0-8), shoves them forward palms out (9), hold, recover
        dr=seg(t,0,8/14)*(1-seg(t,8/14,9.5/14));sh_=seg(t,8/14,9.5/14)*(1-seg(t,12/14,1))
        chest.rotation_euler.x=R(4)-R(10)*dr+R(18)*sh_;hips.location.y=.06*dr-.06*sh_
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-4)-R(40)*dr-R(85)*sh_,-sx*R(26)+sx*R(16)*dr+sx*R(18)*sh_,0);j['el'].rotation_euler.x=R(-14)-R(100)*dr-R(5)*sh_;j['wr'].rotation_euler=(R(-10)-R(50)*sh_,0,sx*R(10))
        L['hp'].rotation_euler.x=R(-18)*sh_;Rr['hp'].rotation_euler.x=R(14)*sh_
    elif anim=='Scythe':
        # Spectral Scythes: winds both arms across to one side (0-5), flings them out (6), follow through, recover
        wd=seg(t,0,5/14)*(1-seg(t,5/14,7/14));fl=seg(t,5/14,7/14)*(1-seg(t,10/14,1))
        chest.rotation_euler.z=R(34)*wd-R(36)*fl;hips.rotation_euler.z=R(10)*wd-R(10)*fl;chest.rotation_euler.x=R(4)+R(10)*fl
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-4)-R(70)*wd-R(80)*fl,-sx*R(26)+R(40)*wd-R(50)*fl,0);j['el'].rotation_euler.x=R(-14)-R(40)*wd+R(10)*fl
    return 0
DIRS=[90,45,0,-45,-90,-135,180,135]
ANIMS=['Idle','Run','TakeDamage1','Die1','Cast','Summon','Thrust','Scythe']
LOOP=('Idle','Run')
only=os.environ.get('MODEL_ONLY');rows_only=os.environ.get('MODEL_ROWS');frames_only=os.environ.get('MODEL_FRAMES')
for anim in ANIMS:
    if only and anim not in only.split(','):continue
    for row,deg in enumerate(DIRS):
        if row in (3,4,5) or (rows_only and str(row) not in rows_only.split(',')):continue
        for f in range(15):
            if frames_only and str(f) not in frames_only.split(','):continue
            ROBE.rotation_euler=(0,0,0)
            res=pose(anim,f/15 if anim in LOOP else f/14);yaw=R(deg);tilt=0
            if isinstance(res,tuple):tilt=res[1]
            root.rotation_euler=(0,0,yaw)
            if tilt:hips.rotation_euler.x=tilt;hips.location.y=.25*tilt/R(65);hips.location.z-=.25*tilt/R(65)
            bpy.context.view_layer.update();lo=min((o.matrix_world@Vector(c)).z for o in PARTS for c in o.bound_box)
            if lo<0:root.location.z=-lo
            scn.render.filepath=os.path.join(OUT,'%s_%d_%02d.png'%(anim,row,f));bpy.ops.render.render(write_still=True)
print('prophet frames written to',OUT)
