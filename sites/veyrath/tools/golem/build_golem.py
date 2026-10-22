"""Procedural low-poly sandstone golem for the Dune Ravager (Oct 16, user concept: rock plates over a dark core,
boulder shoulders, back spikes, glowing eyes). Builds the model from jittered icosphere rocks on an empty-joint rig,
poses it per frame (Idle, Run, Attack1 slam, TakeDamage1, Die1 crumble) and renders 8 directions x 15 frames from the
game's camera (orthographic, 30 deg down, feet at 75% of the cell, sun from the upper left).
Run: blender -b --factory-startup -P tools/golem/build_golem.py -- OUT_DIR [SIZE]
Then: python tools/golem/compose_sheets.py OUT_DIR   (writes dist/assets/golem-*.webp + manifest)."""
import bpy,bmesh,math,random,sys,os
from mathutils import Vector,Matrix,Euler
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=argv[0] if argv else os.path.join(os.path.dirname(__file__),'frames');SIZE=int(argv[1]) if len(argv)>1 else 320
os.makedirs(OUT,exist_ok=True);random.seed(1016)
bpy.ops.wm.read_factory_settings(use_empty=True);scn=bpy.context.scene
LIGHT=(0.70,0.27,0.035,1);DARK=(0.12,0.05,0.018,1);EYE=(1.0,0.75,0.05,1)  # linear: ~#D08F3F sandstone, ~#5E3E25 core
def mat(name,col,emit=0,stone=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=col;b.inputs['Roughness'].default_value=.9
    if emit:b.inputs['Emission Color'].default_value=col;b.inputs['Emission Strength'].default_value=emit
    if stone:
        # Oct 16 detail pass: sandstone strata (wave bands on object Z), soft mottling, dark crack lines (voronoi edges)
        N=nt.nodes;Lk=nt.links;tc=N.new('ShaderNodeTexCoord')
        wave=N.new('ShaderNodeTexWave');wave.bands_direction='Z';wave.inputs['Scale'].default_value=3.2;wave.inputs['Distortion'].default_value=6;wave.inputs['Detail'].default_value=2
        noise=N.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=7;noise.inputs['Detail'].default_value=4
        vor=N.new('ShaderNodeTexVoronoi');vor.feature='DISTANCE_TO_EDGE';vor.inputs['Scale'].default_value=2.6
        for t in (wave,noise,vor):Lk.new(tc.outputs['Object'],t.inputs['Vector'])
        mix=N.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs['Factor'].default_value=.55
        lo=tuple(c*.82 for c in col[:3])+(1,);hi=tuple(min(1,c*1.04) for c in col[:3])+(1,)
        ramp=N.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=lo;ramp.color_ramp.elements[1].color=hi
        add=N.new('ShaderNodeMath');add.operation='MULTIPLY_ADD';add.inputs[1].default_value=.5;Lk.new(wave.outputs['Fac'],add.inputs[0]);Lk.new(noise.outputs['Fac'],add.inputs[2])
        Lk.new(add.outputs[0],ramp.inputs['Fac'])
        crack=N.new('ShaderNodeValToRGB');crack.color_ramp.elements[0].position=.0;crack.color_ramp.elements[0].color=(.25,.16,.1,1);crack.color_ramp.elements[1].position=stone;crack.color_ramp.elements[1].color=(1,1,1,1)
        Lk.new(vor.outputs['Distance'],crack.inputs['Fac'])
        Lk.new(ramp.outputs['Color'],mix.inputs['A']);Lk.new(crack.outputs['Color'],mix.inputs['B']);Lk.new(mix.outputs['Result'],b.inputs['Base Color'])
        bump=N.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.06;Lk.new(noise.outputs['Fac'],bump.inputs['Height']);Lk.new(bump.outputs['Normal'],b.inputs['Normal'])
    m.diffuse_color=col;return m
MLIGHT,MDARK,MEYE=mat('sand',LIGHT,stone=.025),mat('core',DARK,stone=.02),mat('eye',EYE,14)
def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.rotation_mode='XYZ';return o
PARTS=[]
def rock(name,parent,loc,size,m=None,jit=.16,rot=(0,0,0),sub=1,round_=.35):
    # chunky faceted boulder: a once-subdivided cube pulled 35% toward a sphere, then jittered (concept: angular rock plates)
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.6);bmesh.ops.subdivide_edges(bm,edges=bm.edges[:],cuts=1,use_grid_fill=True)
    for v in bm.verts:
        c=v.co.lerp(v.co.normalized()*1.0,round_);v.co=Vector((c.x*(1+random.uniform(-jit,jit)),c.y*(1+random.uniform(-jit,jit)),c.z*(1+random.uniform(-jit,jit))))
    bmesh.ops.triangulate(bm,faces=bm.faces[:])
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=False
    o=bpy.data.objects.new(name,me);scn.collection.objects.link(o);o.parent=parent;o.location=loc;o.scale=size;o.rotation_euler=rot;me.materials.append(m or MLIGHT);PARTS.append(o)
    if (m or MLIGHT) is MLIGHT and max(size)>.28 and not name.startswith('chip'):
        # small embedded pebbles/chips on the larger sandstone plates for surface definition
        for k in range(2):
            d=Vector((random.uniform(-1,1),random.uniform(-1,-.2),random.uniform(-.6,1))).normalized()
            rock('chip',parent,(loc[0]+d.x*size[0]*.92,loc[1]+d.y*size[1]*.92,loc[2]+d.z*size[2]*.92),(random.uniform(.08,.12),random.uniform(.07,.1),random.uniform(.06,.1)),MLIGHT,jit=.3)
    return o
# ---- rig (model faces -Y, i.e. toward the camera = "S") ----
root=empty('root');hips=empty('hips',root,(0,0,1.17));chest=empty('chest',hips,(0,0,.55));head=empty('head',chest,(0,-.18,.78))
J={}
for s,sx in (('L',-1),('R',1)):
    sh=empty('shoulder'+s,chest,(sx*.98,0,.42));el=empty('elbow'+s,sh,(sx*.12,0,-.72));wr=empty('wrist'+s,el,(0,0,-.62))
    hp=empty('hip'+s,hips,(sx*.38,0,-.05));kn=empty('knee'+s,hp,(0,0,-.5));an=empty('ankle'+s,kn,(0,0,-.45))
    J[s]=dict(sh=sh,el=el,wr=wr,hp=hp,kn=kn,an=an,sx=sx)
# ---- body ----
rock('pelvis',hips,(0,0,0),(.55,.38,.32),MDARK);rock('belt',hips,(0,-.3,.05),(.32,.12,.22),rot=(0,0,0))
rock('core',chest,(0,0,.1),(.72,.5,.62),MDARK)
rock('plateL',chest,(-.28,-.42,.22),(.36,.14,.3),rot=(0,.2,-.25));rock('plateR',chest,(.28,-.42,.22),(.36,.14,.3),rot=(0,-.2,.25))
rock('gut',chest,(0,-.38,-.25),(.26,.12,.2))
for k,(x,z,h,lean) in enumerate([(0,.45,.75,0),(-.35,.35,.62,-.25),(.35,.35,.62,.25),(-.62,.2,.48,-.45),(.62,.2,.48,.45)]):
    rock('spike%d'%k,chest,(x,.32,z+.35),(.16,.13,h),jit=.1,rot=(.35,lean,0))
rock('skull',head,(0,0,.08),(.24,.3,.22));rock('snout',head,(0,-.26,.0),(.13,.2,.11),jit=.1);rock('crest',head,(0,.05,.32),(.12,.2,.28),jit=.1,rot=(.4,0,0))
for sx in (-1,1):e=rock('eye',head,(sx*.1,-.33,.08),(.045,.03,.03),MEYE,jit=0,sub=1)
for s,j in J.items():
    sx=j['sx'];rock('boulder'+s,j['sh'],(sx*.12,0,.12),(.58,.52,.52),jit=.2,round_=.6)
    rock('upper'+s,j['sh'],(sx*.08,0,-.38),(.28,.26,.36),MDARK)
    rock('fore'+s,j['el'],(0,0,-.3),(.38,.36,.44),jit=.15)
    rock('fist'+s,j['wr'],(0,-.04,-.1),(.26,.26,.24),MDARK)
    rock('thigh'+s,j['hp'],(0,0,-.22),(.3,.3,.32),MDARK)
    rock('shin'+s,j['kn'],(0,-.08,-.22),(.33,.3,.32),round_=.5)
    rock('foot'+s,j['an'],(0,-.16,.04),(.32,.38,.15),round_=.5)
HELD=rock('held',root,(0,-.75,2.9),(.42,.4,.38),jit=.22,round_=.55);HELD.parent=None
# ---- camera, light, render ----
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=4.9;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
el=math.radians(30);co.location=(0,-30*math.cos(el),30*math.sin(el));co.rotation_euler=(math.radians(90)-el,0,0);scn.camera=co
rim=bpy.data.lights.new('rim','SUN');rim.energy=1.8;rim.color=(.75,.85,1.0);rim.angle=math.radians(4);ro=bpy.data.objects.new('rim',rim);scn.collection.objects.link(ro);ro.rotation_euler=Euler((math.radians(-60),0,math.radians(150)))
sun=bpy.data.lights.new('sun','SUN');sun.energy=5.2;sun.angle=math.radians(8);so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.6,.5,.42,1);w.node_tree.nodes['Background'].inputs['Strength'].default_value=.2
try:scn.render.engine='BLENDER_EEVEE_NEXT'
except Exception:scn.render.engine='BLENDER_EEVEE'
try:scn.eevee.taa_render_samples=12
except Exception:pass
try:
    scn.eevee.use_raytracing=True;scn.eevee.use_shadows=True
except Exception:pass
scn.render.use_freestyle=True;scn.render.line_thickness_mode='ABSOLUTE';scn.render.line_thickness=1.1*SIZE/320
ls=scn.view_layers[0].freestyle_settings.linesets[0] if scn.view_layers[0].freestyle_settings.linesets else scn.view_layers[0].freestyle_settings.linesets.new('outline')
ls.select_by_visibility=True;ls.select_by_edge_types=True;ls.select_silhouette=True;ls.select_border=True;ls.select_crease=False;ls.linestyle=ls.linestyle or bpy.data.linestyles.new('outline');ls.linestyle.color=(.2,.11,.05);ls.linestyle.thickness=1.1*SIZE/320
scn.use_nodes=True;ct=scn.node_tree;rl=ct.nodes.get('Render Layers') or ct.nodes.new('CompositorNodeRLayers');cmp=ct.nodes.get('Composite') or ct.nodes.new('CompositorNodeComposite')
gl=ct.nodes.new('CompositorNodeGlare');gl.glare_type='FOG_GLOW';gl.threshold=1.4;gl.size=6;gl.mix=0
ct.links.new(rl.outputs['Image'],cmp.inputs['Image'])  # Oct 16: no bloom - crisp edges
scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=SIZE;scn.render.image_settings.file_format='PNG';scn.render.image_settings.color_mode='RGBA'
scn.view_settings.view_transform='Standard'
# ---- poses ----
R=math.radians
def ease(x):x=max(0,min(1,x));return x*x*(3-2*x)
def reset():
    root.location=(0,0,0);hips.location=(0,0,1.17);hips.rotation_euler=(0,0,0);chest.rotation_euler=(0,0,0);head.rotation_euler=(0,0,0)
    for j in J.values():
        for k in ('sh','el','wr','hp','kn','an'):j[k].rotation_euler=(0,0,0)
        j['sh'].rotation_euler=(0,j['sx']*R(-8),0)
def pose(anim,t):
    reset();L,Rr=J['L'],J['R'];s=math.sin(2*math.pi*t)
    if anim=='Idle':
        hips.location.z=1.17+.025*s;chest.rotation_euler.x=R(3)*s;head.rotation_euler.x=R(-3)*s
        for j,ph in ((L,0),(Rr,.5)):j['sh'].rotation_euler.x=R(4)*math.sin(2*math.pi*(t+ph));j['el'].rotation_euler.x=R(-10)
    elif anim=='Run':
        hips.location.z=1.17+.07*abs(math.sin(2*math.pi*t))-.04;chest.rotation_euler.x=R(10);chest.rotation_euler.z=R(6)*s
        for j,sg in ((L,1),(Rr,-1)):
            ph=sg*s;j['hp'].rotation_euler.x=R(-32)*ph;j['kn'].rotation_euler.x=R(38)*max(0,-ph*sg*sg) if False else R(30)*max(0,math.sin(2*math.pi*t+(0 if sg>0 else math.pi)+1.2))
            j['sh'].rotation_euler.x=R(26)*ph;j['el'].rotation_euler.x=R(-25)
    elif anim=='Attack1':
        # overhead two-handed slam: raise (0-.5), smash (.5-.66), hold, recover
        up=ease(t/.5) if t<.5 else 1-ease((t-.5)/.16) if t<.66 else 0;down=0 if t<.5 else ease((t-.5)/.16) if t<.66 else 1-ease((t-.8)/.2) if t>.8 else 1
        chest.rotation_euler.x=R(-14)*up+R(26)*down;hips.location.z=1.17-.12*down
        for j in (L,Rr):j['sh'].rotation_euler.x=R(-165)*up+R(-70)*down;j['sh'].rotation_euler.y=j['sx']*R(-8-14*up);j['el'].rotation_euler.x=R(-30)*up+R(-15)*down
        for j in (L,Rr):j['kn'].rotation_euler.x=R(20)*down;j['hp'].rotation_euler.x=R(-14)*down
    elif anim=='TakeDamage1':
        k=math.sin(math.pi*min(1,t*1.4));chest.rotation_euler.x=R(-16)*k;head.rotation_euler.x=R(-14)*k;hips.location.y=.12*k
        for j in (L,Rr):j['sh'].rotation_euler.x=R(18)*k;j['sh'].rotation_euler.y=j['sx']*R(-8-18*k)
    elif anim=='Charge':
        # frames 0-4: wind-up crouch with the shoulder dropped; 5-14: loop of a head-down rush (legs pumping, arms tucked)
        if t<5/14:
            k=ease(t/(5/14));hips.location.z=1.17-.18*k;chest.rotation_euler.x=R(32)*k;head.rotation_euler.x=R(-18)*k;hips.location.y=.15*k
            for j in (L,Rr):j['hp'].rotation_euler.x=R(-28)*k;j['kn'].rotation_euler.x=R(45)*k;j['sh'].rotation_euler.x=R(-35)*k;j['el'].rotation_euler.x=R(-60)*k
        else:
            u=(t*14-5)/10;w=math.sin(2*math.pi*u*2);hips.location.z=1.12+.06*abs(w);chest.rotation_euler.x=R(40);head.rotation_euler.x=R(-24)
            for j,sg in ((L,1),(Rr,-1)):j['hp'].rotation_euler.x=R(-45)*sg*w-R(10);j['kn'].rotation_euler.x=R(35)*max(0,sg*w)+R(10);j['sh'].rotation_euler.x=R(-40)-R(12)*sg*w;j['el'].rotation_euler.x=R(-75)
    elif anim=='Throw':
        # Boulder Rain: crouch and wrench a boulder up (0-.5), heave it overhead (.5-.6), release skyward, recover
        lift=ease(t/.5);heave=ease((t-.5)/.1) if t>=.5 else 0;rec=ease((t-.75)/.25) if t>.75 else 0
        hips.location.z=1.17-.22*(1-lift)*(t<.5)-.05;chest.rotation_euler.x=R(30)*(1-lift)-R(18)*heave*(1-rec)
        for j in (L,Rr):
            j['sh'].rotation_euler.x=(R(-60)*(1-lift)+R(-170)*lift)*(1-rec)+R(-5)*rec;j['sh'].rotation_euler.y=j['sx']*R(-8+18*lift*(1-heave))*(1-rec);j['el'].rotation_euler.x=R(-40)*(1-heave)*(1-rec)
            j['kn'].rotation_euler.x=R(40)*(1-lift);j['hp'].rotation_euler.x=R(-25)*(1-lift)
    elif anim=='Pound':
        # Quake Rings: raise both fists high (0-.55), drive them into the ground (.55-.65), hold the crouch, rise
        up=ease(t/.55) if t<.55 else 1-ease((t-.55)/.1) if t<.65 else 0;dn=0 if t<.55 else ease((t-.55)/.1) if t<.65 else 1-ease((t-.85)/.15) if t>.85 else 1
        chest.rotation_euler.x=R(-18)*up+R(48)*dn;hips.location.z=1.17-.3*dn;head.rotation_euler.x=R(-20)*dn
        for j in (L,Rr):j['sh'].rotation_euler.x=R(-170)*up+R(-40)*dn;j['sh'].rotation_euler.y=j['sx']*R(-8-6*up+10*dn);j['el'].rotation_euler.x=R(-25)*up;j['kn'].rotation_euler.x=R(60)*dn;j['hp'].rotation_euler.x=R(-45)*dn
    elif anim=='Die1':
        k=ease(t/.4);hips.location.z=1.17-.55*k;chest.rotation_euler.x=R(30)*k;head.rotation_euler.x=R(20)*k
        for j in (L,Rr):j['hp'].rotation_euler.x=R(-70)*k;j['kn'].rotation_euler.x=R(110)*k;j['sh'].rotation_euler.x=R(-20)*k;j['sh'].rotation_euler.y=j['sx']*R(-8-30*k)
def crumble(t):
    """Die1 second half: every rock drops and tumbles into a pile (applied in world space after posing)."""
    c=ease((t-.4)/.6)
    if c<=0:return
    bpy.context.view_layer.update()
    for i,o in enumerate(PARTS):
        rnd=random.Random(i*31);m=o.matrix_world.copy();loc=m.to_translation();ground=max(.12,o.scale.z*.6)
        drop=Vector((rnd.uniform(-.55,.55)*c,rnd.uniform(-.45,.45)*c,-(loc.z-ground)*c))
        rot=Euler((rnd.uniform(-1.2,1.2)*c,rnd.uniform(-1.2,1.2)*c,rnd.uniform(-.8,.8)*c)).to_matrix().to_4x4()
        o.matrix_world=Matrix.Translation(loc+drop)@rot@Matrix.Translation(-loc)@m
DIRS=[90,45,0,-45,-90,-135,180,135]  # rows E,SE,S,SW,W,NW,N,NE (model faces the camera at 0)
only=os.environ.get('GOLEM_ONLY')
for anim in ['Idle','Run','Attack1','TakeDamage1','Die1','Charge','Throw','Pound']:
    if only and anim not in only.split(','):continue
    for row,deg in enumerate(DIRS):
        if os.environ.get('GOLEM_ROWS') and str(row) not in os.environ['GOLEM_ROWS'].split(','):continue
        if row in (3,4,5):continue  # mirrored in game
        for f in range(15):
            # restore rest transforms each frame (crumble edits matrix_world directly)
            for o in PARTS:o.matrix_parent_inverse.identity()
            pose(anim,f/15 if anim in('Idle','Run') else f/14)
            root.rotation_euler=(0,0,R(deg))
            tt=f/14;HELD.hide_render=not(anim=='Throw' and tt<.6)
            if not HELD.hide_render:
                bpy.context.view_layer.update();a=J['L']['wr'].matrix_world.to_translation();b=J['R']['wr'].matrix_world.to_translation();HELD.location=(a+b)/2+Vector((0,0,.3))
            if anim=='Die1':
                saved=[(o,o.matrix_basis.copy()) for o in PARTS];crumble(f/14)
            scn.render.filepath=os.path.join(OUT,'%s_%d_%02d.png'%(anim,row,f));bpy.ops.render.render(write_still=True)
            if anim=='Die1':
                for o,mb in saved:o.matrix_basis=mb
print('golem frames written to',OUT)
