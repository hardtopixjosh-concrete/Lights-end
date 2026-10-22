"""Export a live-3D hero (Oct 17; HERO=warrior|mage, see build_warrior.py presets): Knight outfit on the UAL skeleton with the 14 game clips baked as named actions
(same clip list, segments and war cry as build_warrior.py), base-colour texture shrunk to 1024 px.
  blender -b ../../tmp/warrior-src/All_Male.blend --python tools/warrior/export_warrior_glb.py
Writes dist/assets/hero/warrior.glb. Clip time is driven by the game as 0..1, so source frame rates do not matter."""
import bpy,os
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,'build_warrior.py'),encoding='utf-8').read()
exec(src.split('# ---- camera')[0])  # rig setup, CLIPS, sample(), pose_at(), war_cry()
OUT=os.path.abspath(os.path.join(HERE,'..','..','dist','assets','hero',HERO+'.glb'));os.makedirs(os.path.dirname(OUT),exist_ok=True)
if 'MeleeSpin' in CLIPS:CLIPS['MeleeSpin']['spin']=False  # the game turns the hero while it holds this pose

source=set(bpy.data.actions);baked=[]
for clip,cfg in CLIPS.items():
    total=sum(abs(b-a) for _,a,b in cfg['segs']);n=max(2,min(40,round(total)))
    act=bpy.data.actions.new(clip);act.use_fake_user=True;baked.append(act)
    for i in range(n+1):
        t=i/n;name,f=sample(clip,t if not cfg.get('loop') else t%1.0);pose_at(name,f)
        if cfg.get('cry'):war_cry(t)
        if cfg.get('nova'):nova(t)
        if cfg.get('channel'):channel_pose(t)
        if cfg.get('lmb'):lmb_pose(cfg['lmb'],t)
        if cfg.get('arms'):arms_out(t)
        if cfg.get('hold'):hold_pose(cfg['hold'],t)
        if cfg.get('chan'):chan_pose(cfg['chan'],t)
        if cfg.get('wpn'):weapon_pose(cfg['wpn'],t)
        rig.animation_data.action=act
        for pb in rig.pose.bones:
            pb.keyframe_insert('rotation_quaternion',frame=i)
            if pb.name in ('root','pelvis'):pb.keyframe_insert('location',frame=i)
        rig.animation_data.action=None
    print('BAKED',clip,n+1,'keys')
for a in list(bpy.data.actions):
    if a not in baked:bpy.data.actions.remove(a)
rig.animation_data.action=bpy.data.actions['Idle'];scn.frame_set(0)

# lean materials: base colour only, at most 1024 px; metal/rough are set per hero in hero-3d.js
mats={sl.material for o in K for sl in o.material_slots if sl.material}
for m in mats:
    if not m.use_nodes:continue
    nt=m.node_tree;bsdf=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if not bsdf:continue
    base=next((l.from_node for l in nt.links if l.to_node==bsdf and l.to_socket.name=='Base Color'),None)
    if base is not None and base.type!='TEX_IMAGE':  # glTF-imported heads/eyebrows: texture -> MIX (factor) -> Base Color; wire the texture straight in
        tex=next((l.from_node for l in nt.links if l.to_node==base and l.from_node.type=='TEX_IMAGE'),None)
        if tex:nt.nodes.remove(base);nt.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        base=tex
    for n in list(nt.nodes):
        if n.type in ('TEX_IMAGE','NORMAL_MAP','SEPARATE_COLOR','SEPARATE_RGB') and n!=base:nt.nodes.remove(n)
    if base and base.image and max(base.image.size)>1024:base.image.scale(1024,1024)
    bsdf.inputs['Metallic'].default_value=.5 if HERO=='warrior' else 0;bsdf.inputs['Roughness'].default_value=.5 if HERO=='warrior' else .8

# texture recolour per preset (skin tone / hair colour): 'mean' shifts the texture's average colour to the target and
# keeps its shading; 'lum' paints the target colour by brightness (grey hair -> coloured hair with the same highlights)
import numpy as np
done=set()
for m in mats:
    if not m.use_nodes:continue
    for n in m.node_tree.nodes:
        img=getattr(n,'image',None)
        if n.type!='TEX_IMAGE' or not img or img.name in done:continue
        for pre,(tgt,mode) in PRESET.get('recolor',{}).items():
            if not img.name.startswith(pre):continue
            px=np.empty(len(img.pixels),np.float32);img.pixels.foreach_get(px);px=px.reshape(-1,4);sel=px[:,3]>.5
            if mode=='mean':mean=px[sel,:3].mean(0);px[:,:3]*=np.array(tgt)/np.maximum(mean,1e-3)
            else:lum=px[:,:3]@np.array([.3,.59,.11]);px[:,:3]=np.outer(lum/max(lum[sel].mean(),1e-3),tgt)
            px[:,:3]=np.clip(px[:,:3],0,1);img.pixels.foreach_set(px.ravel());img.update();done.add(img.name);print('RECOLOR',img.name,mode)
bpy.ops.object.select_all(action='DESELECT')
for o in list(K)+[rig]:o.hide_set(False);o.hide_viewport=False;o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',
    export_force_sampling=True,export_skins=True,export_morph=False,export_image_format='WEBP',export_yup=True,export_apply=True)  # apply the Mirror modifiers (arms, pauldrons); the Armature modifier stays as skinning
print('EXPORTED',OUT,os.path.getsize(OUT)//1024,'KB')
