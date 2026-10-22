# Blender probe: bind the Knight outfit to the UAL skeleton and render candidate animations as small contact strips.
# blender -b tmp/warrior-src/All_Male.blend --python tools/warrior/probe_actions.py -- OUTDIR ACTION[,ACTION...]
import bpy,math,sys,os
from mathutils import Euler
args=sys.argv[sys.argv.index('--')+1:];out=args[0];want=args[1].split(',') if len(args)>1 else []
src=os.path.dirname(bpy.data.filepath)
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(src,'Unreal-Godot','UAL1_Standard.glb'))
rig=[o for o in bpy.data.objects if o not in before and o.type=='ARMATURE'][0]
mid=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(src,'Unreal-Godot','UAL2_Standard.glb'))
for o in [o for o in bpy.data.objects if o not in before and o!=rig]:bpy.data.objects.remove(o,do_unlink=True)
import re
for a in bpy.data.actions:
    a.use_fake_user=True;n=re.sub(r'_Armature(\.\d+)?$','',a.name)
    if n!=a.name and n not in bpy.data.actions:a.name=n
K=bpy.data.collections['Knight'].objects
for o in bpy.data.objects:
    if o.type=='MESH' and o.name not in K:o.hide_render=True
for o in K:
    for m in o.modifiers:
        if m.type=='ARMATURE':m.object=rig
    mw=o.matrix_world.copy();o.parent=rig;o.matrix_world=mw
print('RIG',rig.name,rig.scale[:],rig.rotation_euler[:],rig.location[:])
for a in sorted(bpy.data.actions,key=lambda a:a.name):print('ACT',a.name,tuple(a.frame_range))
scn=bpy.context.scene;S=int(args[3]) if len(args)>3 else 192
cam=bpy.data.cameras.new('cam');cam.type='ORTHO';cam.ortho_scale=3.0;cam.shift_y=.25;co=bpy.data.objects.new('cam',cam);scn.collection.objects.link(co)
el=math.radians(30);co.location=(0,-30*math.cos(el),30*math.sin(el));co.rotation_euler=(math.radians(90)-el,0,0);scn.camera=co
for l in [o for o in bpy.data.objects if o.type=='LIGHT']:l.hide_render=True
sun=bpy.data.lights.new('sun','SUN');sun.energy=4.8;so=bpy.data.objects.new('sun',sun);scn.collection.objects.link(so);so.rotation_euler=Euler((math.radians(50),0,math.radians(-35)))
w=bpy.data.worlds.new('w');scn.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Strength'].default_value=.6
scn.render.engine='BLENDER_EEVEE_NEXT';scn.eevee.taa_render_samples=4;scn.render.film_transparent=True;scn.render.resolution_x=scn.render.resolution_y=S;scn.view_settings.view_transform='Standard'
rig.rotation_euler=(rig.rotation_euler[0],0,math.radians(float(args[2]) if len(args)>2 else 45))
if not rig.animation_data:rig.animation_data_create()
for name in want:
    act=bpy.data.actions[name];rig.animation_data.action=act;f0,f1=act.frame_range
    for i in range(8):
        f=f0+(f1-f0)*i/7;scn.frame_set(int(f),subframe=f-int(f));scn.render.filepath=os.path.join(out,f'{name}_{i}.png');bpy.ops.render.render(write_still=True)
