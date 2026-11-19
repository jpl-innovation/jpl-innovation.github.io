"""
A downloaded model (CC0: Poly Haven's .gltf, or an .fbx with its PBR pictures beside it) made small for the studio
(src/lib/studio/): one .glb with WebP textures no bigger than --size, and its triangle count printed. Run by Blender,
on this computer only; nothing of it ships.

    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --python scripts/studio-model.py -- \
        assets-src/studio/office-chair/Office_Chair.fbx public/studio/models/office-chair.glb --size 1024

--triangles N reduces a heavy scan to about N triangles; --quality is the WebP quality (default 80).

An .fbx brings no pictures of its own: those beside it named *Base_Color*, *Normal*, *Roughness* and *Metallic* are put
on its material (the height map is left out: the normal map already carries it).
"""
import argparse
import glob
import os
import sys

import bpy

parser = argparse.ArgumentParser()
parser.add_argument("source")
parser.add_argument("target")
parser.add_argument("--size", type=int, default=1024)
parser.add_argument("--quality", type=int, default=80)
parser.add_argument("--triangles", type=int, default=0, help="reduce the model to about this many (0: as it is)")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])

bpy.ops.wm.read_factory_settings(use_empty=True)
if args.source.lower().endswith(".fbx"):
    bpy.ops.import_scene.fbx(filepath=args.source)
    folder = os.path.dirname(args.source)
    find = lambda word: next(iter(glob.glob(os.path.join(folder, f"*{word}*"))), None)
    for material in bpy.data.materials:
        material.use_nodes = True
        nodes, links = material.node_tree.nodes, material.node_tree.links
        shader = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")

        def picture(word, colour):
            path = find(word)
            if not path:
                return None
            node = nodes.new("ShaderNodeTexImage")
            node.image = bpy.data.images.load(path)
            node.image.colorspace_settings.name = "sRGB" if colour else "Non-Color"
            return node

        for word, socket, colour in (("Base_Color", "Base Color", True), ("Roughness", "Roughness", False), ("Metallic", "Metallic", False)):
            node = picture(word, colour)
            if node:
                links.new(node.outputs["Color"], shader.inputs[socket])
        normal = picture("Normal", False)
        if normal:
            bump = nodes.new("ShaderNodeNormalMap")
            links.new(normal.outputs["Color"], bump.inputs["Color"])
            links.new(bump.outputs["Normal"], shader.inputs["Normal"])
else:
    bpy.ops.import_scene.gltf(filepath=args.source)

for image in bpy.data.images:
    if image.size[0] > args.size or image.size[1] > args.size:
        scale = args.size / max(image.size)
        image.scale(max(1, round(image.size[0] * scale)), max(1, round(image.size[1] * scale)))

if args.triangles:
    # Every mesh by the same share (collapse: it keeps the texture coordinates, so leaves stay leaves).
    depsgraph = bpy.context.evaluated_depsgraph_get()
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    now = sum(len(o.data.polygons) for o in meshes)  # (the downloads are triangles already)
    for obj in meshes:
        modifier = obj.modifiers.new("reduce", "DECIMATE")
        modifier.ratio = min(1, args.triangles / max(now, 1))

triangles = 0
lo, hi = [1e9] * 3, [-1e9] * 3
depsgraph = bpy.context.evaluated_depsgraph_get()
for obj in bpy.data.objects:
    if obj.type != "MESH":
        continue
    mesh = obj.evaluated_get(depsgraph).to_mesh()
    mesh.calc_loop_triangles()
    triangles += len(mesh.loop_triangles)
    for vertex in mesh.vertices:
        world = obj.matrix_world @ vertex.co
        for i in range(3):
            lo[i], hi[i] = min(lo[i], world[i]), max(hi[i], world[i])

os.makedirs(os.path.dirname(args.target) or ".", exist_ok=True)
bpy.ops.export_scene.gltf(filepath=args.target, export_format="GLB", export_image_format="WEBP", export_image_quality=args.quality, export_apply=True, export_animations=False, export_cameras=False, export_lights=False)
print(f"MODEL {args.target}: {triangles} triangles, {os.path.getsize(args.target) / 1024:.0f} KB, size (x, y, z up) {[round(hi[i] - lo[i], 3) for i in range(3)]} m, textures up to {args.size} px")
