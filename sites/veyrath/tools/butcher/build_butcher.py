"""Procedural low-poly Ashen Butcher (Oct 16, user's 8-direction concept sheet): faceted red-orange demon, huge
hunched shoulders, small forward head with yellow eyes and big dark curved horns, dark riveted bracers and shins,
digitigrade clawed legs, ragged brown loincloth, a heavy cleaver in each hand. Built from flat-shaded icospheres and
simple meshes on an empty-joint rig, posed per frame and rendered 5 directions x 15 frames from the game camera
(orthographic, 30 deg down, feet at 75% of the cell). SW/W/NW are mirrored in game.
Animations: Idle, Run, Attack1 (cleaver sweep), TakeDamage1, Die1, CrossChop, Throw (boomerang fling), Hook,
Slam (Ash Fissures), Spin (Cleaver Storm loop). Impact/release frames sit at frame 6 (Slam 7) so the game can sync.
Run: blender -b --factory-startup -P tools/butcher/build_butcher.py -- OUT_DIR [SIZE]
Then: python tools/butcher/compose_sheets.py OUT_DIR"""
import bpy,bmesh,math,random,sys,os
from mathutils import Vector,Matrix,Euler
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else os.path.join(os.path.dirname(__file__),'frames');SIZE=int(argv[1]) if len(argv)>1 else 1024
os.makedirs(OUT,exist_ok=True);random.seed(716)
bpy.ops.wm.read_factory_settings(use_empty=True);scn=bpy.context.scene
def lin(h):h=h.lstrip('#');return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))+(1,)
SKIN,SKIN_D,IRON,IRON_L,HORN,CLOTH,CLOTH_D,EDGE,EYE=lin('c9502c'),lin('a83e22'),lin('48423f'),lin('5a5450'),lin('34302e'),lin('6a4e3c'),lin('4e3a2c'),lin('c2b59c'),lin('ffb21a')
def mat(name,col,emit=0,rough=.75,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=col;b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    if emit:b.inputs['Emission Color'].default_value=col;b.inputs['Emission Strength'].default_value=emit
    m.diffuse_color=col;return m
M=dict(skin=mat('skin',SKIN,rough=.8),skind=mat('skind',SKIN_D,rough=.8),iron=mat('iron',IRON,rough=.55,metal=.3),ironl=mat('ironl',IRON_L,rough=.5,metal=.35),horn=mat('horn',HORN,rough=.6),
       cloth=mat('cloth',CLOTH,rough=.95),clothd=mat('clothd',CLOTH_D,rough=.95),edge=mat('edge',EDGE,rough=.35,metal=.5),eye=mat('eye',EYE,emit=18))
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_mode='XYZ';return o
PARTS=[]
def obj(name,bm,parent,loc,m,rot=(0,0,0),scale=(1,1,1)):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_euler=rot;o.scale=scale;me.materials.append(M[m]);PARTS.append(o);return o
def blob(name,parent,loc,size,m='skin',rot=(0,0,0),sub=2,jit=.025):
    # faceted muscle mass: a low-subdivision icosphere, decimated to crisp planes and lightly jittered (concept look)
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1)
    if sub>=2:bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(14),verts=bm.verts[:],edges=bm.edges[:])
    for v in bm.verts:v.co*=1+random.uniform(-jit,jit)
    bmesh.ops.triangulate(bm,faces=bm.faces[:])
    return obj(name,bm,parent,loc,m,rot,size)
def box(name,parent,loc,size,m,rot=(0,0,0)):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1);return obj(name,bm,parent,loc,m,rot,size)
def cyl(name,parent,loc,r1,r2,depth,m,rot=(0,0,0),seg=8):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r1,radius2=r2,depth=depth);return obj(name,bm,parent,loc,m,rot)
def tube(name,parent,pts,radii,m,seg=6):
    """Tapered faceted tube along points (horns, claws)."""
    bm=bmesh.new();rings=[]
    for i,(p,r) in enumerate(zip(pts,radii)):
        p=Vector(p);d=(Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(i-1,0)])).normalized();a=d.cross(Vector((0,1,0)) if abs(d.y)<.9 else Vector((1,0,0))).normalized();b=d.cross(a)
        rings.append([bm.verts.new(p+(a*math.cos(k*2*math.pi/seg)+b*math.sin(k*2*math.pi/seg))*max(r,.004)) for k in range(seg)])
    for r0,r1 in zip(rings,rings[1:]):
        for k in range(seg):bm.faces.new((r0[k],r0[(k+1)%seg],r1[(k+1)%seg],r1[k]))
    bm.faces.new(list(reversed(rings[0])));tip=bm.verts.new(Vector(pts[-1])+(Vector(pts[-1])-Vector(pts[-2])).normalized()*radii[-1]*1.5)
    for k in range(seg):bm.faces.new((rings[-1][k],rings[-1][(k+1)%seg],tip))
    return obj(name,bm,parent,(0,0,0),m)
def slab(name,parent,outline,thick,m,loc=(0,0,0),rot=(0,0,0)):
    """Flat extruded polygon in the XZ plane (loincloth flaps, cleaver blades)."""
    bm=bmesh.new();vs=[bm.verts.new((x,-thick/2,z)) for x,z in outline];f=bm.faces.new(vs)
    ext=bmesh.ops.extrude_face_region(bm,geom=[f]);nv=[e for e in ext['geom'] if isinstance(e,bmesh.types.BMVert)];bmesh.ops.translate(bm,verts=nv,vec=(0,thick,0))
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,m,rot)
# ---- rig (model faces -Y = toward the camera = "S") ----
HZ=1.25
root=empty('root');hips=empty('hips',root,(0,0,HZ));spine=empty('spine',hips,(0,.02,.32));chest=empty('chest',spine,(0,.04,.4));neck=empty('neck',chest,(0,-.3,.5));head=empty('head',neck,(0,-.1,.12))
J={}
for s,sx in (('L',-1),('R',1)):
    sh=empty('shoulder'+s,chest,(sx*.74,.02,.3));el=empty('elbow'+s,sh,(0,0,-.62));wr=empty('wrist'+s,el,(0,0,-.56))
    hp=empty('hip'+s,hips,(sx*.3,0,-.04));kn=empty('knee'+s,hp,(0,0,-.56));an=empty('ankle'+s,kn,(0,0,-.5))
    J[s]=dict(sh=sh,el=el,wr=wr,hp=hp,kn=kn,an=an,sx=sx)
# ---- torso ----
blob('pelvis',hips,(0,0,.02),(.4,.3,.26))
blob('belly',spine,(0,-.06,-.02),(.42,.32,.3))
blob('ribcage',chest,(0,.04,.08),(.66,.56,.52))
for sx in (-1,1):
    blob('pec',chest,(sx*.27,-.3,.12),(.3,.18,.24),rot=(0,0,sx*.2))
    blob('lat',chest,(sx*.5,.08,.0),(.24,.3,.36))
    blob('trap',chest,(sx*.36,.06,.42),(.36,.3,.22),rot=(0,sx*-.35,0))
blob('hump',chest,(0,.22,.38),(.46,.4,.32))
for k,z in enumerate((-.2,-.05,.1)):
    for sx in (-1,1):blob('abs',spine,(sx*.11,-.28,z+.05),(.11,.06,.07),'skind',sub=1,jit=.02)
# ---- head ----
blob('skull',head,(0,0,.05),(.24,.26,.24))
blob('jaw',head,(0,-.16,-.09),(.18,.16,.12),'skind')
blob('snout',head,(0,-.25,.0),(.1,.08,.08),'skind',sub=1)
blob('brow',head,(0,-.2,.12),(.2,.08,.07),'skind',sub=1,rot=(.2,0,0))
for sx in (-1,1):
    blob('eye',head,(sx*.09,-.235,.07),(.05,.022,.024),'eye',sub=1,jit=0,rot=(0,0,-sx*.35))
    e=tube('ear',head,[(sx*.17,-.02,.06),(sx*.28,.02,.11),(sx*.34,.05,.17)],[.05,.03,.01],'skin',seg=4)
    # horns: rise from the temples, sweep out and up, tips curl slightly inward and back (concept)
    pts=[(sx*.14,-.02,.2),(sx*.32,.0,.27),(sx*.5,.04,.4),(sx*.6,.08,.6),(sx*.58,.13,.82),(sx*.48,.18,.98),(sx*.38,.2,1.06)]
    tube('horn',head,pts,[.11,.1,.085,.065,.045,.028,.012],'horn',seg=7)
# ---- loincloth + belt ----
cyl('belt',hips,(0,0,.12),.43,.41,.12,'iron',seg=10)
def flap(name,y,w,h,m,back=False):
    zz=[(-w,0),(w,0)];n=7
    for i in range(n+1):
        x=w-2*w*i/n;zz.append((x*.9,-h+(.12 if i%2 else 0)+random.uniform(-.03,.03)))
    o=slab(name,hips,zz,.035,m,loc=(0,y,.06));return o
FLAPF=flap('clothF',-.33,.24,.68,'cloth');FLAPB=flap('clothB',.31,.27,.62,'clothd')
# ---- arms ----
for s,j in J.items():
    sx=j['sx']
    blob('delt'+s,j['sh'],(sx*.08,0,.02),(.3,.28,.3))
    blob('bicep'+s,j['sh'],(sx*.02,-.02,-.32),(.22,.22,.33))
    blob('fore'+s,j['el'],(0,0,-.2),(.19,.19,.28))
    cyl('bracer'+s,j['el'],(0,0,-.3),.24,.19,.44,'iron',seg=8)
    for z in (-.13,-.46):cyl('band'+s,j['el'],(0,0,z),.25,.21,.07,'ironl',seg=8)
    blob('fist'+s,j['wr'],(0,-.02,-.08),(.15,.14,.14),'skind',sub=1)
    # cleaver: handle out of the fist, heavy rectangular blade hanging below, pale bevelled edge (concept)
    cl=empty('cleaver'+s,j['wr'],(0,-.02,-.1));cl.rotation_euler=(0,sx*.3,sx*.7);j['cl']=cl
    cyl('handle'+s,cl,(0,0,-.1),.045,.045,.3,'iron',seg=6)
    blade=[(-sx*.04,-.2),(sx*.56,-.2),(sx*.6,-.98),(sx*.0,-1.02),(-sx*.06,-.9)]
    slab('blade'+s,cl,blade,.07,'iron')
    slab('edgeB'+s,cl,[(sx*.0,-.95),(sx*.6,-.91),(sx*.6,-1.03),(sx*.0,-1.07)],.05,'edge')
    slab('edgeS'+s,cl,[(sx*.56,-.2),(sx*.66,-.2),(sx*.68,-1.03),(sx*.6,-1.03)],.05,'edge')
    for rz in (-.3,-.5):cyl('rivet'+s,cl,(sx*.08,0,rz),.035,.035,.09,'ironl',rot=(math.pi/2,0,0),seg=6)
# ---- legs (digitigrade) ----
for s,j in J.items():
    sx=j['sx']
    blob('thigh'+s,j['hp'],(sx*.04,-.05,-.26),(.27,.29,.36))
    blob('knee'+s,j['kn'],(0,-.07,0),(.18,.17,.16),'iron',sub=1)
    blob('shin'+s,j['kn'],(0,0,-.25),(.19,.2,.32),'iron')
    cyl('cuff'+s,j['kn'],(0,0,-.07),.23,.21,.12,'ironl',seg=8)
    blob('foot'+s,j['an'],(0,-.15,-.02),(.18,.27,.1),'iron',sub=1)
    for k,(dx,dy) in enumerate(((-.08,-.36),(0,-.4),(.08,-.36))):tube('claw',j['an'],[(dx,dy+.1,-.02),(dx*1.2,dy,-.07),(dx*1.3,dy-.05,-.11)],[.035,.025,.008],'horn',seg=4)
    tube('spur',j['an'],[(0,.08,0),(0,.16,-.06),(0,.2,-.1)],[.03,.02,.006],'horn',seg=4)
# ---- Oct 19 detail pass (user: boss models need real detail, not smooth/blurry): ash-ember cracks, scars, fangs,
# bone spikes, spiked + riveted bracers, blood on the cleavers, belt chain with hanging skulls and a meat hook ----
M.update(ember=mat('ember',lin('ff6a14'),emit=6),bone=mat('bone',lin('dccfb2'),rough=.6),blood=mat('blood',lin('5a0a08'),rough=.4),chain=mat('chain',lin('6a6460'),rough=.4,metal=.7))
def crack(name,parent,pts,r=.016,m='ember'):tube(name,parent,pts,[r]*len(pts),m,seg=4)
crack('crackChest',chest,[(-.3,-.36,.3),(-.18,-.4,.18),(-.06,-.41,.22),(.08,-.4,.06),(.24,-.37,.1)])
crack('crackChest2',chest,[(.12,-.4,.32),(.2,-.39,.22),(.16,-.4,.12)],.012)
crack('crackBack',chest,[(-.2,.5,.5),(-.06,.56,.34),(.1,.55,.2),(0,.52,.0)])
for sx in (-1,1):
    crack('crackDelt',J['L' if sx<0 else 'R']['sh'],[(sx*.18,-.2,.2),(sx*.26,-.24,.04),(sx*.2,-.26,-.12)],.012)
    tube('scar',chest,[(sx*.1,-.42,.3),(sx*.3,-.38,.12)],[.018,.018],'skind',seg=4)
    for k in range(3):tube('fang',head,[(sx*(.03+k*.045),-.27,-.04),(sx*(.03+k*.045),-.29,-.13+k*.02)],[.016,.004],'bone',seg=4)
for k in range(5):
    a=-.6+k*.3;tube('hspike',chest,[(a*.5,.4,.62-abs(a)*.2),(a*.65,.62,.86-abs(a)*.25)],[.05,.008],'bone',seg=5)
for s,j in J.items():
    sx=j['sx']
    for k in range(3):tube('bspike'+s,j['el'],[(sx*.2,0,-.2-k*.1),(sx*.36,0,-.18-k*.1)],[.04,.006],'ironl',seg=4)
    for z in (-.2,-.38):
        for a in (0,1.6,3.2,4.8):cyl('brivet'+s,j['el'],(math.cos(a)*.235,math.sin(a)*.235,z),.022,.022,.03,'edge',rot=(math.pi/2,0,a),seg=6)
    slab('bloodA'+s,j['cl'],[(sx*.1,-.5),(sx*.42,-.46),(sx*.5,-.86),(sx*.3,-.95),(sx*.14,-.8)],.075,'blood')
    slab('bloodDrip'+s,j['cl'],[(sx*.32,-.95),(sx*.38,-.95),(sx*.36,-1.12)],.07,'blood')
# belt chain with two hanging skulls and a meat hook
for k in range(12):
    a=-1.9+k*.35;cyl('link',hips,(math.sin(a)*.45,-math.cos(a)*.42,.02+.06*math.cos(a*2)),.05,.05,.025,'chain',rot=(math.pi/2,0,a+(k%2)*1.57),seg=6)
for sx in (-1,1):
    blob('skullH',hips,(sx*.3,-.4,-.14),(.08,.07,.085),'bone',sub=2,jit=.01)
    for ex in (-.025,.025):box('socket',hips,(sx*.3+ex,-.465,-.13),(.02,.01,.02),'ember')
tube('hook',hips,[(.42,-.2,-.02),(.46,-.24,-.2),(.44,-.26,-.34),(.36,-.26,-.36),(.32,-.24,-.28)],[.022,.022,.02,.016,.006],'chain',seg=5)
# ---- camera, lights, render (same framing as the golem; wider ortho for the cleavers and overhead swings) ----
ORTHO=5.8
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=ORTHO;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
el=math.radians(30);co.location=(0,-30*math.cos(el),30*math.sin(el));co.rotation_euler=(math.radians(90)-el,0,0);scn.camera=co
rim=bpy.data.lights.new('rim','SUN');rim.energy=2.2;rim.color=(1.0,.75,.55);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=4.8;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.6,.5,.45,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
try:scn.eevee.taa_render_samples=12
except Exception:pass
try:scn.eevee.use_shadows=True
except Exception:pass
scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE';scn.render.line_thickness=1.4*SIZE/640
ls=scn.view_layers[0].freestyle_settings.linesets[0] if scn.view_layers[0].freestyle_settings.linesets else scn.view_layers[0].freestyle_settings.linesets.new('outline')
ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False;ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.14,.05,.03);ls.linestyle.thickness=1.4*SIZE/640
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
# ---- poses ----
R=math.radians
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def seg(t,a,b):return ease((t-a)/(b-a)) if b>a else float(t>=a)
def reset():
    root.location=(0,0,0);root.rotation_euler=(0,0,0);hips.location=(0,0,HZ);hips.rotation_euler=(0,0,0)
    for o in (spine,chest,neck,head):o.rotation_euler=(0,0,0)
    spine.rotation_euler.x=R(14);chest.rotation_euler.x=R(20);neck.rotation_euler.x=R(-22);head.rotation_euler.x=R(-10)  # hunched forward, head thrust out (concept side view)
    FLAPF.rotation_euler=(0,0,0);FLAPB.rotation_euler=(0,0,0)
    for j in J.values():
        sx=j['sx']
        for k in ('sh','el','wr','hp','kn','an'):j[k].rotation_euler=(0,0,0)
        j['sh'].rotation_euler=(R(-16),-sx*R(22),0);j['el'].rotation_euler=(R(-18),0,0);j['wr'].rotation_euler=(0,0,0)
        j['hp'].rotation_euler=(R(-16),-sx*R(6),0);j['kn'].rotation_euler.x=R(42);j['an'].rotation_euler.x=R(-30)
def legs(L,Rr,ph,amp=1):
    for j,sg in ((L,1),(Rr,-1)):
        w=math.sin(2*math.pi*ph+(0 if sg>0 else math.pi))
        j['hp'].rotation_euler.x=R(-16)+R(-26)*w*amp;j['kn'].rotation_euler.x=R(42)+R(26)*max(0,math.sin(2*math.pi*ph+(0 if sg>0 else math.pi)+1.3))*amp;j['an'].rotation_euler.x=R(-30)+R(10)*w*amp
def pose(anim,t):
    reset();L,Rr=J['L'],J['R'];s=math.sin(2*math.pi*t)
    if anim=='Idle':
        hips.location.z=HZ+.03*s;chest.rotation_euler.x=R(12)+R(3)*s;head.rotation_euler.x=R(-6)-R(3)*s
        for j,ph in ((L,0),(Rr,.5)):j['sh'].rotation_euler.x=R(-6)+R(4)*math.sin(2*math.pi*(t+ph));j['el'].rotation_euler.x=R(-14)-R(4)*math.sin(2*math.pi*(t+ph))
        FLAPF.rotation_euler.x=R(2)*s
    elif anim=='Run':
        # heavy lumbering stride: big hip roll, arms swinging the cleavers, loincloth flapping
        hips.location.z=HZ-.06+.09*abs(math.sin(2*math.pi*t));hips.rotation_euler.z=R(7)*s;chest.rotation_euler.x=R(20);chest.rotation_euler.z=R(-9)*s
        legs(L,Rr,t)
        for j,sg in ((L,1),(Rr,-1)):j['sh'].rotation_euler.x=R(-6)+R(30)*sg*s;j['el'].rotation_euler.x=R(-30)
        FLAPF.rotation_euler.x=R(-14)-R(8)*abs(s);FLAPB.rotation_euler.x=R(10)+R(6)*abs(s)
    elif anim=='Attack1':
        # right cleaver sweep: coil (0-6), whip across (6-8), follow-through, recover
        coil=seg(t,0,6/14);hit=seg(t,6/14,8/14);rec=seg(t,10/14,1)
        k=coil*(1-hit);f=hit*(1-rec)
        chest.rotation_euler.z=R(38)*k-R(42)*f;hips.rotation_euler.z=R(14)*k-R(16)*f;chest.rotation_euler.x=R(12)+R(10)*f
        Rr['sh'].rotation_euler=(R(-6)-R(70)*k-R(80)*f,-R(22)-R(60)*k+R(40)*f,R(30)*k-R(50)*f);Rr['el'].rotation_euler.x=R(-14)-R(70)*k+R(50)*f
        L['sh'].rotation_euler.x=R(-6)+R(20)*k-R(30)*f;L['el'].rotation_euler.x=R(-14)-R(30)*f
        L['hp'].rotation_euler.x=R(-16)-R(20)*f;L['kn'].rotation_euler.x=R(42)+R(15)*f
    elif anim=='CrossChop':
        # both cleavers raised overhead and crossed (0-6), chopped down in an X (6-7), hold the crouch, recover
        up=seg(t,0,6/14)*(1-seg(t,6/14,7/14));dn=seg(t,6/14,7/14)*(1-seg(t,10/14,1))
        chest.rotation_euler.x=R(12)-R(22)*up+R(38)*dn;hips.location.z=HZ-.18*dn;head.rotation_euler.x=R(-6)+R(10)*up-R(10)*dn
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(160)*up-R(70)*dn,-sx*R(22)+sx*R(28)*up-sx*R(18)*dn,0);j['el'].rotation_euler.x=R(-14)-R(40)*up+R(4)*dn
            j['hp'].rotation_euler.x=R(-16)-R(22)*dn;j['kn'].rotation_euler.x=R(42)+R(30)*dn
    elif anim=='Throw':
        # boomerang fling: wind both arms back and in (0-5), whip them forward and out (5-7), release, recover
        back=seg(t,0,5/14)*(1-seg(t,5/14,7/14));fl=seg(t,5/14,7/14)*(1-seg(t,10/14,1))
        chest.rotation_euler.x=R(12)-R(12)*back+R(24)*fl;hips.location.z=HZ-.08*back
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)+R(50)*back-R(85)*fl,-sx*R(22)+sx*R(10)*back-sx*R(55)*fl,sx*R(30)*back);j['el'].rotation_euler.x=R(-14)-R(80)*back+R(10)*fl
        L['hp'].rotation_euler.x=R(-16)-R(18)*fl;L['kn'].rotation_euler.x=R(42)+R(14)*fl
    elif anim=='Hook':
        # meat hook: right arm cocks back (0-4), slings forward (4-6), holds out (6-9), yanks back hard (9-12), recover
        cock=seg(t,0,4/14)*(1-seg(t,4/14,6/14));out=seg(t,4/14,6/14)*(1-seg(t,9/14,11/14));yank=seg(t,9/14,11/14)*(1-seg(t,12/14,1))
        chest.rotation_euler.z=R(28)*cock-R(18)*out+R(30)*yank;chest.rotation_euler.x=R(12)+R(14)*out-R(8)*yank
        Rr['sh'].rotation_euler=(R(-6)+R(40)*cock-R(95)*out-R(40)*yank,-R(22)-R(20)*cock+R(10)*out,0);Rr['el'].rotation_euler.x=R(-14)-R(90)*cock+R(10)*out-R(80)*yank
        L['sh'].rotation_euler.x=R(-6)-R(20)*out+R(10)*yank
        L['hp'].rotation_euler.x=R(-16)-R(16)*out;Rr['hp'].rotation_euler.x=R(-16)+R(10)*yank;Rr['kn'].rotation_euler.x=R(42)+R(16)*yank
    elif anim=='Slam':
        # Ash Fissures: heave both cleavers high (0-7), drive them into the ground (7-8), kneel in the dust, rise
        up=seg(t,0,7/14)*(1-seg(t,7/14,8/14));dn=seg(t,7/14,8/14)*(1-seg(t,11/14,1))
        chest.rotation_euler.x=R(12)-R(26)*up+R(52)*dn;hips.location.z=HZ-.04*up-.42*dn;head.rotation_euler.x=R(-6)+R(12)*up-R(18)*dn
        for j in (L,Rr):
            sx=j['sx'];j['sh'].rotation_euler=(R(-6)-R(150)*up-R(55)*dn,-sx*R(22)+sx*R(6)*up+sx*R(8)*dn,0);j['el'].rotation_euler.x=R(-14)-R(30)*up
            j['hp'].rotation_euler.x=R(-16)-R(50)*dn;j['kn'].rotation_euler.x=R(42)+R(62)*dn;j['an'].rotation_euler.x=R(-30)-R(10)*dn
    elif anim=='Spin':
        # Cleaver Storm loop: arms flung wide, cleavers out, whole body turning one full circle over the loop
        chest.rotation_euler.x=R(4);hips.location.z=HZ-.05+.03*math.sin(4*math.pi*t)
        for j in (L,Rr):sx=j['sx'];j['sh'].rotation_euler=(R(-10),-sx*R(78),0);j['el'].rotation_euler.x=R(-8)
        legs(L,Rr,t*2,amp=.5);FLAPF.rotation_euler.x=R(-30);FLAPB.rotation_euler.x=R(30)
        return R(-360)*t
    elif anim=='TakeDamage1':
        k=math.sin(math.pi*min(1,t*1.4));chest.rotation_euler.x=R(12)-R(20)*k;head.rotation_euler.x=R(-6)-R(16)*k;hips.location.y=.12*k
        for j in (L,Rr):sx=j['sx'];j['sh'].rotation_euler=(R(-6)+R(18)*k,-sx*R(22)-sx*R(18)*k,0)
    elif anim=='Die1':
        # drops to the knees (0-.45), then topples forward onto its face (.45-.8), cleavers falling loose
        kn=ease(t/.45);fall=ease((t-.45)/.35)
        hips.location.z=HZ-.62*kn-.35*fall;chest.rotation_euler.x=R(12)+R(25)*kn;head.rotation_euler.x=R(-6)+R(20)*kn
        for j in (L,Rr):
            sx=j['sx'];j['hp'].rotation_euler.x=R(-16)-R(50)*kn;j['kn'].rotation_euler.x=R(42)+R(80)*kn;j['an'].rotation_euler.x=R(-30)+R(20)*kn
            j['sh'].rotation_euler=(R(-6)-R(30)*kn-R(60)*fall,-sx*R(22)-sx*R(15)*kn,0)
        return None,R(58)*fall
    return 0
DIRS=[90,45,0,-45,-90,-135,180,135]  # rows E,SE,S,SW,W,NW,N,NE (model faces the camera at 0)
ANIMS=['Idle','Run','Attack1','TakeDamage1','Die1','CrossChop','Throw','Hook','Slam','Spin']
only=os.environ.get('BUTCHER_ONLY');rows_only=os.environ.get('BUTCHER_ROWS')
for anim in ANIMS:
    if only and anim not in only.split(','):continue
    for row,deg in enumerate(DIRS):
        if row in (3,4,5) or (rows_only and str(row) not in rows_only.split(',')):continue
        for f in range(15):
            if os.environ.get('BUTCHER_FRAMES') and str(f) not in os.environ['BUTCHER_FRAMES'].split(','):continue
            res=pose(anim,f/15 if anim in('Idle','Run','Spin') else f/14);yaw=R(deg);tilt=0
            if isinstance(res,tuple):tilt=res[1]
            elif res:yaw+=res
            root.rotation_euler=(0,0,yaw)
            if tilt:
                # face-down topple pivots around the knees: tilt the hips forward in the facing direction
                hips.rotation_euler.x=tilt;hips.location.y=.22*tilt/R(58);hips.location.z-=.2*tilt/R(58)  # pivot back so he lands in frame
            if anim in ('Die1','Slam','CrossChop'):
                # ground clamp: kneeling/toppled poses must not sink through the floor (lift so the lowest point is z=0)
                bpy.context.view_layer.update();lo=min((o.matrix_world@Vector(c)).z for o in PARTS for c in o.bound_box)
                if lo<0:root.location.z=-lo
            scn.render.filepath=os.path.join(OUT,'%s_%d_%02d.png'%(anim,row,f));bpy.ops.render.render(write_still=True)
print('butcher frames written to',OUT)
