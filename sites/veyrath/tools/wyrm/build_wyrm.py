"""Procedural low-poly Dune Wyrm (Oct 17, user's 8-direction concept sheet). Four legs (user: like the image, not six).
Long, low, heavy lizard: reddish-brown faceted body with a lighter segmented throat/belly, small orange eyes, short
sprawling legs with tan claw plates, a long tapering tail ending in a big sandstone club. Tan faceted sandstone plates
cover the head (a big helmet plate), the back in overlapping rows, the shoulders/thighs and the tail.
Two looks (WYRM_VARIANT): 1 armoured (all plates), 2 exposed (back/head/tail/limb plates and the tail club popped off;
the segmented reddish-brown body shows; claws stay).
A holdout ground plane at z=0 hides anything below the sand, so Burrow really sinks into the ground and Emerge bursts
out of it. Rendered like the Butcher/Colossus: orthographic game camera (30 deg down, feet at 75% of the cell),
5 directions x 15 frames, Freestyle outline. SW/W/NW are mirrored in game.
Animations (impact frames for game sync): Idle, Run (crawl), TakeDamage1, Breath (inhale 0-5, blast 6-14 held),
Burrow (digs and sinks 0-14), Emerge (bursts up 0-6, settles 7-14), Tail (coil 0-5, sweep 6-9, impact 7), Charge
(head down + stamp 0-4, rush loop 5-14), ClawL/ClawR (raise 0-5, rake 6-7, impact 7), Spit (throat swells 0-6, spit 7),
Shed (variant 1: buckle 0-6, plates pop at 7, collapse 8-11, rise 12-14), Die1 (variant 2).
Run: blender -b --factory-startup -P tools/wyrm/build_wyrm.py -- OUT_DIR [SIZE]   (env WYRM_VARIANT)
Then: python tools/hd/compose_model.py OUT_DIR wyrmN"""
import bpy,bmesh,math,random,sys,os
from mathutils import Vector,Euler
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else os.path.join(os.path.dirname(__file__),'frames');SIZE=int(argv[1]) if len(argv)>1 else 1024
VAR=int(os.environ.get('WYRM_VARIANT','1'))
os.makedirs(OUT,exist_ok=True);random.seed(1710)
bpy.ops.wm.read_factory_settings(use_empty=True);scn=bpy.context.scene
def lin(h):h=h.lstrip('#');return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))+(1,)
def mat(name,col,emit=0,rough=.8,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=lin(col);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
    if emit:b.inputs['Emission Color'].default_value=lin(col);b.inputs['Emission Strength'].default_value=emit
    m.diffuse_color=lin(col);return m
M=dict(skin=mat('skin','7e3322',rough=.88),skind=mat('skind','5e2618',rough=.9),belly=mat('belly','b0603a',rough=.8),bellyd=mat('bellyd','944a2a',rough=.8),
       plate=mat('plate','c99a5e',rough=.78),plated=mat('plated','a87a46',rough=.82),platel=mat('platel','dcb47a',rough=.72),eye=mat('eye','ff9a10',emit=3),mouth=mat('mouth','4a120c',rough=.9),tooth=mat('tooth','f0e0c0',rough=.5))
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_mode='XYZ';return o
PARTS=[];PLATES=[]
def obj(name,bm,parent,loc,m,rot=(0,0,0),scale=(1,1,1),plate=False):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_euler=rot;o.scale=scale;me.materials.append(M[m]);PARTS.append(o)
    if plate:PLATES.append(o)
    return o
def blob(name,parent,loc,size,m='skin',rot=(0,0,0),sub=2,jit=.06,ang=30):
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1)
    if sub>=2:bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(ang),verts=bm.verts[:],edges=bm.edges[:])
    for v in bm.verts:v.co*=1+random.uniform(-jit,jit)
    bmesh.ops.triangulate(bm,faces=bm.faces[:]);return obj(name,bm,parent,loc,m,rot,size)
def plate(name,parent,loc,size,rot=(0,0,0),m=None):
    """Sandstone plate: a flattened, faceted low icosphere with a ridge (crisp planes, concept look)."""
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=1,radius=1)
    for v in bm.verts:
        v.co*=1+random.uniform(-.12,.12)
        if v.co.z<0:v.co.z*=.35  # flat underside
    m=m or random.choice(['plate','plate','plated','platel']);size=tuple(v*k for v,k in zip(size,(1.22,1.22,1.1)));return obj(name,bm,parent,loc,m,rot,size,plate=True)
def spike(name,parent,base,tip,r,m,seg=4,plate_=False):
    bm=bmesh.new();base=Vector(base);tip=Vector(tip);d=(tip-base).normalized();a=d.cross(Vector((0,0,1)) if abs(d.z)<.9 else Vector((1,0,0))).normalized();b=d.cross(a)
    ring=[bm.verts.new(base+(a*math.cos(k*2*math.pi/seg+.4)+b*math.sin(k*2*math.pi/seg+.4))*r) for k in range(seg)];t=bm.verts.new(tip)
    for k in range(seg):bm.faces.new((ring[k],ring[(k+1)%seg],t))
    bm.faces.new(list(reversed(ring)));bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:]);return obj(name,bm,parent,(0,0,0),m,plate=plate_)
# ---- rig: model faces -Y (toward camera = S); body runs along Y, tail toward +Y ----
H=.72
root=empty('root');body=empty('body',root,(0,-.5,H));chest=empty('chest',body,(0,-.62,.04));neck=empty('neck',chest,(0,-.5,.1));head=empty('head',neck,(0,-.38,.06));jaw=empty('jaw',head,(0,-.05,-.1))
hips=empty('hips',body,(0,.66,0));TAIL=[];par=hips
for i in range(6):t=empty('tail%d'%i,par,(0,.37 if i else .36,-.03 if i<3 else 0));TAIL.append(t);par=t
LEGS={}
for name,par_,y in (('F',chest,-.05),('B',hips,.05)):
    for s,sx in (('L',-1),('R',1)):
        up=empty('up'+name+s,par_,(sx*.46,y,-.06));lo=empty('lo'+name+s,up,(sx*.36,0,-.18));ft=empty('ft'+name+s,lo,(0,-.04,-.4))
        LEGS[name+s]=dict(up=up,lo=lo,ft=ft,sx=sx,front=name=='F')
# ---- body (reddish-brown, lighter segmented belly/throat) ----
blob('torso',body,(0,0,0),(.7,.66,.52))
blob('chestm',chest,(0,0,0),(.72,.56,.56))
blob('hipm',hips,(0,0,0),(.62,.52,.48))
for i,(y,z,w) in enumerate(((-.42,.1,.34),(-.36,-.08,.4),(-.24,-.24,.44),(-.06,-.34,.46),(.16,-.36,.46))):   # throat + chest belly segments
    blob('bellyseg',chest,(0,y,z),(w,.12,.11),'belly' if i%2==0 else 'bellyd',sub=1,jit=.02)
for i,y in enumerate((-.4,-.1,.2,.5)):blob('bellyseg',body,(0,y,-.36),(.46,.14,.1),'belly' if i%2 else 'bellyd',sub=1,jit=.02)
blob('neckm',neck,(0,-.05,0),(.36,.38,.34))
blob('throat',neck,(0,-.12,-.18),(.28,.26,.16),'belly',sub=1)
for k,t in enumerate(TAIL):
    r=.46*(1-k/7.2);blob('tailseg',t,(0,.1,0),(r,.34,r*.85),'skin' if k%2 else 'skind')
    blob('tailbelly',t,(0,.1,-r*.6),(r*.75,.26,r*.3),'belly',sub=1,jit=.02)
# head: long flat skull, heavy brow, jaw, orange eyes
blob('skull',head,(0,-.12,.05),(.38,.5,.27))
blob('snout',head,(0,-.52,-.02),(.27,.26,.17))
blob('jawm',jaw,(0,-.36,-.03),(.3,.42,.12),'skind')
blob('chin',jaw,(0,-.34,-.06),(.2,.24,.06),'belly',sub=1)
blob('mouthin',head,(0,-.32,-.1),(.2,.3,.06),'mouth',sub=1)
for sx in (-1,1):
    blob('eye',head,(sx*.25,-.38,.13),(.06,.04,.04),'eye',sub=1,jit=0)
    for k in range(4):spike('tooth',head,(sx*(.14-k*.02),-.5+k*.08,-.08),(sx*(.14-k*.02),-.5+k*.08,-.16),.025,'tooth',seg=3)
# ---- legs (short, sprawling, heavy) ----
for key,L in LEGS.items():
    sx=L['sx']
    blob('upper',L['up'],(sx*.18,0,-.08),(.3,.28,.26))
    blob('lower',L['lo'],(0,0,-.2),(.2,.22,.26))
    blob('foot',L['ft'],(0,-.08,-.02),(.24,.3,.1),'skind',sub=1)
    for k,dx in enumerate((-.13,0,.13)):spike('claw',L['ft'],(dx,-.22,0),(dx*1.4,-.44,-.06),.07,'plate',seg=4)
    plate('legplate',L['up'],(sx*.24,0,.05),(.24,.26,.12),rot=(0,sx*.6,0))
    plate('legplate2',L['lo'],(sx*.08,-.04,-.14),(.16,.2,.09),rot=(0,sx*.9,0))
# ---- sandstone armour (variant 1) ----
plate('helmplate',head,(0,-.16,.26),(.46,.6,.17),rot=(-.12,0,0),m='plate')
plate('helmback',head,(0,.2,.28),(.38,.3,.14),rot=(.3,0,0),m='platel')
for sx in (-1,1):plate('cheek',head,(sx*.33,-.14,.08),(.12,.24,.12),rot=(0,sx*1.0,0));plate('brow',head,(sx*.16,-.34,.14),(.12,.12,.07),rot=(0,sx*.4,0),m='platel')
plate('neckplate',neck,(0,.02,.3),(.34,.3,.12),rot=(.15,0,0))
for sx in (-1,1):plate('neckside',neck,(sx*.3,0,.14),(.18,.24,.1),rot=(0,sx*.9,0))
for y,z,sc in ((-.3,.44,1.0),(.05,.46,1.05),(.36,.44,1.0)):  # chest/back rows on the front body
    plate('back',chest,(0,y,z),(.34*sc,.26*sc,.13),rot=(.1,0,0))
    for sx in (-1,1):plate('backside',chest,(sx*.38,y+.06,z-.12),(.22*sc,.24*sc,.11),rot=(0,sx*.75,0))
for y in (-.35,0,.35):
    plate('back',body,(0,y,.44),(.36,.26,.13),rot=(.1,0,0))
    for sx in (-1,1):plate('backside',body,(sx*.42,y+.08,.26),(.22,.24,.11),rot=(0,sx*.85,0));plate('flank',body,(sx*.56,y-.08,-.02),(.14,.2,.1),rot=(0,sx*1.35,0),m='plated')
for y in (-.1,.25):
    plate('back',hips,(0,y,.4),(.32,.24,.12),rot=(.1,0,0))
    for sx in (-1,1):plate('backside',hips,(sx*.36,y+.06,.22),(.2,.22,.1),rot=(0,sx*.85,0))
for k,t in enumerate(TAIL[:6]):
    r=.46*(1-k/7.2);plate('tailplate',t,(0,.12,r*.86),(r*.82,.24,.1),rot=(.12,0,0))
    if k<4:
        for sx in (-1,1):plate('tailside',t,(sx*r*.8,.14,r*.3),(r*.45,.2,.08),rot=(0,sx*1.0,0),m='plated')
CLUB=blob('club',TAIL[-1],(0,.4,.02),(.34,.5,.3),'plate',sub=1,jit=.12);PLATES.append(CLUB)
blob('clubtop',TAIL[-1],(0,.34,.2),(.24,.34,.12),'platel',sub=1,jit=.1);PLATES.append(PARTS[-1])
TIP=blob('tailtip',TAIL[-1],(0,.3,0),(.16,.3,.14),'skind')   # exposed: plain tail tip
# ---- Oct 19 detail pass (user: boss models need real detail): dorsal spines, horns, tusks, spiked tail club,
# scale ridges along the flanks, wear cracks on the sandstone plates, glowing throat seam ----
M.update(crack=mat('crack','4a3020',rough=.95),horn2=mat('horn2','3a2a22',rough=.55),seam=mat('seam','ff8a20',emit=2.2))
for k,(par,y,z) in enumerate(((chest,-.3,.58),(chest,.05,.6),(chest,.36,.58),(body,-.35,.58),(body,0,.58),(body,.35,.58),(hips,-.1,.52),(hips,.25,.5))):
    spike('dorsal',par,(0,y,z-.08),(0,y+.12,z+.22-k*.012),.07,'horn2',seg=4)
for k,tt in enumerate(TAIL[:5]):spike('tdorsal',tt,(0,.1,.46*(1-k/7.2)*.9),(0,.22,.46*(1-k/7.2)*.9+.16),.05,'horn2',seg=4)
for sx in (-1,1):
    spike('hornw',head,(sx*.24,.02,.3),(sx*.42,.34,.52),.07,'horn2',seg=5)
    spike('hornw2',head,(sx*.3,-.06,.22),(sx*.56,.12,.3),.05,'horn2',seg=5)
    spike('tusk',jaw,(sx*.2,-.6,-.02),(sx*.26,-.74,.14),.04,'tooth',seg=4)
    for k in range(5):blob('ridge',body,(sx*.6,-.45+k*.22,-.12),(.07,.09,.05),'skind',sub=1,jit=.02)
    for k in range(4):blob('cridge',chest,(sx*.62,-.3+k*.2,-.08),(.07,.09,.05),'skind',sub=1,jit=.02)
for k in range(6):
    a=k/6*2*math.pi;spike('clubspike',TAIL[-1],(math.cos(a)*.26,.42,.02+math.sin(a)*.22),(math.cos(a)*.5,.48,.02+math.sin(a)*.42),.06,'platel',seg=4,plate_=True)
spike('clubspikeE',TAIL[-1],(0,.82,.05),(0,1.08,.08),.07,'platel',seg=4,plate_=True)
for par,y,z in ((chest,-.3,.5),(chest,.36,.5),(body,0,.5),(hips,.25,.46)):
    for a,b in (((-.12,-.04),(.02,.04)),((.04,.02),(.14,.08))):
        spike('pcrack',par,(a[0],y+a[1],z),(b[0],y+b[1],z+.005),.012,'crack',seg=3,plate_=True)
for k in range(4):spike('seam',neck,(0,-.2-k*.04,-.3+k*.03),(0,-.24-k*.04,-.26+k*.03),.015,'seam',seg=3)
def apply_variant(v):
    for o in PLATES:o.hide_render=v>=2
    TIP.hide_render=v<2
apply_variant(VAR)
# holdout ground: everything below the sand is cut out of the render (Burrow/Emerge)
bmg=bmesh.new();bmesh.ops.create_grid(bmg,x_segments=1,y_segments=1,size=20);meg=bpy.data.meshes.new('ground');bmg.to_mesh(meg);bmg.free()
GROUND=bpy.data.objects.new('ground',meg);scn.collection.objects.link(GROUND);GROUND.location=(0,0,-.002)
hm=bpy.data.materials.new('holdout');hm.use_nodes=True;nt=hm.node_tree;nt.nodes.clear();ho=nt.nodes.new('ShaderNodeHoldout');ou=nt.nodes.new('ShaderNodeOutputMaterial');nt.links.new(ho.outputs[0],ou.inputs['Surface']);meg.materials.append(hm)
GROUND.hide_render=True
# ---- camera, lights, render ----
ORTHO=8.0
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=ORTHO;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
elv=math.radians(30);co.location=(0,-30*math.cos(elv),30*math.sin(elv));co.rotation_euler=(math.radians(90)-elv,0,0);scn.camera=co
rim=bpy.data.lights.new('rim','SUN');rim.energy=2.2;rim.color=(1.0,.8,.6);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=3.5;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.62,.52,.42,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.45
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
try:scn.eevee.taa_render_samples=12
except Exception:pass
scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE';scn.render.line_thickness=1.25*SIZE/640
ls=scn.view_layers[0].freestyle_settings.linesets[0] if scn.view_layers[0].freestyle_settings.linesets else scn.view_layers[0].freestyle_settings.linesets.new('outline')
ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False;ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.16,.06,.03);ls.linestyle.thickness=1.25*SIZE/640
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
# ---- poses ----
R=math.radians
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def seg(t,a,b):return ease((t-a)/(b-a)) if b>a else float(t>=a)
def reset():
    root.location=(0,0,0);root.rotation_euler=(0,0,0);body.location=(0,-.5,H);body.rotation_euler=(0,0,0)
    for o in (chest,neck,head,jaw,hips,*TAIL):o.rotation_euler=(0,0,0)
    neck.rotation_euler.x=R(-8);head.rotation_euler.x=R(6)
    for i,t in enumerate(TAIL):t.rotation_euler.x=R(2 if i<3 else -1)
    for L in LEGS.values():
        sx=L['sx'];L['up'].rotation_euler=(0,sx*R(-28),0);L['lo'].rotation_euler=(0,sx*R(30),0);L['ft'].rotation_euler=(0,0,0)
def tailwave(t,amp=1,speed=1):
    for i,tt in enumerate(TAIL):tt.rotation_euler.z=R(7)*amp*math.sin(2*math.pi*(t*speed)-i*.7)
def step(L,ph,amp=1):
    sx=L['sx'];w=math.sin(2*math.pi*ph);lift=max(0,math.sin(2*math.pi*ph+1.57))
    L['up'].rotation_euler=(R(-30)*w*amp,sx*R(-28)-sx*R(26)*lift*amp,0);L['lo'].rotation_euler.y=sx*R(30)+sx*R(14)*lift*amp
def pose(anim,t):
    reset();s=math.sin(2*math.pi*t);F=LEGS
    if anim=='Idle':
        body.location.z=H+.02*s;neck.rotation_euler.x=R(-8)+R(3)*s;head.rotation_euler.z=R(4)*math.sin(2*math.pi*t*1);tailwave(t,.6)
    elif anim=='Run':
        # diagonal crawl gait: FL+BR together, FR+BL together; body S-curves, tail swings opposite
        step(F['FL'],t);step(F['BR'],t);step(F['FR'],t+.5);step(F['BL'],t+.5)
        body.rotation_euler.z=R(6)*s;chest.rotation_euler.z=R(-8)*s;hips.rotation_euler.z=R(-6)*s;body.location.z=H+.03*abs(math.cos(2*math.pi*t));tailwave(t,1.4)
    elif anim=='TakeDamage1':
        k=math.sin(math.pi*min(1,t*1.4));neck.rotation_euler.x=R(-8)+R(24)*k;head.rotation_euler.x=R(6)-R(18)*k;body.location.y=-.5+.12*k;chest.rotation_euler.x=R(-6)*k;jaw.rotation_euler.x=R(18)*k
    elif anim=='Breath':
        # plants the front legs, rears the head and inhales (0-5), then roars sand with the jaw wide (6-14)
        inh=seg(t,0,5/14);bl=seg(t,5/14,6.5/14);hold=math.sin(t*50)*seg(t,6/14,1)
        chest.rotation_euler.x=R(-12)*inh+R(8)*bl;neck.rotation_euler.x=R(-8)-R(22)*inh+R(30)*bl;head.rotation_euler.x=R(6)-R(10)*inh+R(4)*bl+R(1.5)*hold;jaw.rotation_euler.x=R(10)*inh+R(30)*bl
        for k in ('FL','FR'):F[k]['up'].rotation_euler.x=R(-20)*inh;F[k]['lo'].rotation_euler.y=F[k]['sx']*(R(30)+R(10)*bl)
        tailwave(t,.5)
    elif anim=='Burrow':
        # claws at the sand, noses down and sinks into the ground
        d=seg(t,2/14,1);dig=math.sin(t*40)
        root.location.z=-1.5*d;root.rotation_euler.x=R(18)*d;neck.rotation_euler.x=R(-8)+R(26)*seg(t,0,4/14);head.rotation_euler.x=R(6)+R(12)*seg(t,0,4/14)
        for k in ('FL','FR'):F[k]['up'].rotation_euler.x=R(-35)*dig*(1-d*.5)
        tailwave(t,1.5,2)
        return 'ground'
    elif anim=='Emerge':
        # bursts up out of the sand head-first, rears up (0-6), crashes down onto all fours and settles (7-14)
        up=seg(t,0,4/14);rear=seg(t,2/14,6/14)*(1-seg(t,6/14,9/14));
        root.location.z=-1.6*(1-up);chest.rotation_euler.x=R(-30)*rear;neck.rotation_euler.x=R(-8)-R(25)*rear;jaw.rotation_euler.x=R(30)*rear;head.rotation_euler.x=R(6)-R(10)*rear
        for k in ('FL','FR'):F[k]['up'].rotation_euler.x=R(30)*rear;F[k]['lo'].rotation_euler.y=F[k]['sx']*(R(30)-R(20)*rear)
        tailwave(t,1.2)
        return 'ground'
    elif anim=='Tail':
        # braces and coils the tail to one side (0-5), whips it around the body (6-9, impact 7), recovers
        coil=seg(t,0,5/14)*(1-seg(t,5/14,8/14));sw=seg(t,5/14,8/14)*(1-seg(t,10/14,1))
        body.rotation_euler.z=R(16)*coil-R(30)*sw;chest.rotation_euler.z=R(-10)*coil+R(14)*sw
        for i,tt in enumerate(TAIL):tt.rotation_euler.z=R(12)*coil-R(17)*sw*(1+i*.12)
        for L in F.values():L['lo'].rotation_euler.y=L['sx']*(R(30)+R(12)*(coil+sw))
        body.location.z=H-.08*(coil+sw)
    elif anim=='Charge':
        # head down, front feet stamping (0-4), then the crawling rush loop (5-14)
        if t<5/14:
            k=seg(t,0,3/14);st=math.sin(t*60);neck.rotation_euler.x=R(-8)+R(18)*k;head.rotation_euler.x=R(6)+R(10)*k;body.location.z=H-.06*k
            F['FL']['up'].rotation_euler.x=R(-14)*max(0,st);F['FR']['up'].rotation_euler.x=R(-14)*max(0,-st)
        else:
            ph=(t-5/14)/(9/14)*2;step(F['FL'],ph,1.3);step(F['BR'],ph,1.3);step(F['FR'],ph+.5,1.3);step(F['BL'],ph+.5,1.3)
            neck.rotation_euler.x=R(10);head.rotation_euler.x=R(14);body.rotation_euler.z=R(5)*math.sin(2*math.pi*ph);tailwave(ph,1.2)
    elif anim in ('ClawL','ClawR'):
        L=F['FL' if anim=='ClawL' else 'FR'];sx=L['sx'];up=seg(t,0,5/14)*(1-seg(t,5/14,7/14));rk=seg(t,5/14,7/14)*(1-seg(t,10/14,1))
        L['up'].rotation_euler=(R(-60)*up+R(20)*rk,sx*R(-28)-sx*R(40)*up+sx*R(10)*rk,-sx*R(30)*up+sx*R(20)*rk);L['lo'].rotation_euler.y=sx*R(30)-sx*R(30)*up
        chest.rotation_euler.z=sx*R(10)*up-sx*R(14)*rk;chest.rotation_euler.y=-sx*R(10)*up;neck.rotation_euler.z=sx*R(12)*(up+rk);jaw.rotation_euler.x=R(14)*rk
    elif anim=='Spit':
        sw=seg(t,0,6/14)*(1-seg(t,6/14,7.5/14));sp=seg(t,6/14,7.5/14)*(1-seg(t,11/14,1))
        neck.rotation_euler.x=R(-8)-R(14)*sw+R(12)*sp;head.rotation_euler.x=R(6)-R(8)*sw+R(8)*sp;jaw.rotation_euler.x=R(6)*sw+R(28)*sp;neck.scale=(1+.18*sw,1,1+.12*sw)
    elif anim=='Shed':
        bk=seg(t,0,6/14);pop=t>=7/14-1e-6;col=seg(t,7/14,11/14)*(1-seg(t,11/14,1));jit=(random.random()-.5)*R(6)*bk*(1-col)
        body.rotation_euler.z=R(12)*bk*(1-col)+jit;body.rotation_euler.y=R(10)*bk*(1-col)+R(14)*col*(1-seg(t,12/14,1));body.location.z=H-.18*bk-.32*col
        neck.rotation_euler.x=R(-8)+R(20)*col-R(20)*seg(t,12/14,1);head.rotation_euler.x=R(6)-R(14)*bk;jaw.rotation_euler.x=R(26)*bk*(1-col)
        for L in F.values():L['lo'].rotation_euler.y=L['sx']*(R(30)+R(30)*(bk+col)*.6)
        apply_variant(2 if pop else 1)
    elif anim=='Die1':
        d=seg(t,0,.6);body.rotation_euler.y=R(80)*d;body.location.z=H-.3*d;neck.rotation_euler.x=R(-8)+R(26)*d;jaw.rotation_euler.x=R(22)*d
        for i,tt in enumerate(TAIL):tt.rotation_euler.z=R(10)*d
        for L in F.values():L['up'].rotation_euler.x=R(30)*d*L['sx']
    return 0
DIRS=[90,45,0,-45,-90,-135,180,135]
COMMON=['Idle','Run','TakeDamage1','Breath','Burrow','Emerge','Tail','Charge','ClawL','ClawR','Spit']
ANIMS=COMMON+(['Shed'] if VAR==1 else ['Die1'])
LOOP=('Idle','Run')
only=os.environ.get('MODEL_ONLY');rows_only=os.environ.get('MODEL_ROWS');frames_only=os.environ.get('MODEL_FRAMES')
for anim in ANIMS:
    if only and anim not in only.split(','):continue
    for row,deg in enumerate(DIRS):
        if row in (3,4,5) or (rows_only and str(row) not in rows_only.split(',')):continue
        for f in range(15):
            if frames_only and str(f) not in frames_only.split(','):continue
            random.seed(f*17+row);neck.scale=(1,1,1)
            res=pose(anim,f/15 if anim in LOOP else f/14);root.rotation_euler.z=R(deg)
            GROUND.hide_render=res!='ground'
            if res!='ground':
                bpy.context.view_layer.update();lo=min((o.matrix_world@Vector(c)).z for o in PARTS if not o.hide_render for c in o.bound_box)
                if lo<0:root.location.z=-lo
            scn.render.filepath=os.path.join(OUT,'%s_%d_%02d.png'%(anim,row,f));bpy.ops.render.render(write_still=True)
            if anim=='Shed':apply_variant(VAR)
print('wyrm variant',VAR,'frames written to',OUT)
