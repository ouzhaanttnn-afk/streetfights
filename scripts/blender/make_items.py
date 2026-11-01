"""
Street Striker item models, built procedurally with Blender's Python API (bpy).

Outputs
  public/models/<slot>.glb          low-poly model per equipment slot (materials named Primary/Trim/Accent/Dark/Light,
                                    recoloured per rarity at runtime)
  public/items/<slot>_<rarity>.png  pre-rendered inventory icons (Cycles, transparent background)

Run (bpy installed as a Python module):  python scripts/blender/make_items.py [--only gloves,boots] [--no-icons]
"""
import math
import os
import sys

import bpy  # must be imported before bmesh/mathutils
import bmesh
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_DIR = os.path.join(ROOT, "public", "models")
ICON_DIR = os.path.join(ROOT, "public", "items")
SLOTS = ["head", "gloves", "mouth", "robe", "shorts", "boots", "belt", "weapon", "partner"]
RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]
MAX_TRIS = 9000
# Surface feel of the main (rarity-coloured) material per item: cute shapes, authentic materials
STYLE = {"gloves": "leather", "head": "leather", "boots": "leather", "belt": "leather", "weapon": "leather",
         "robe": "fabric", "shorts": "fabric", "mouth": "rubber", "partner": "plastic"}

# Rarity palette, kept in sync with src/game/itemModels.ts
PRIMARY = {
    "common": "#8b8f98", "uncommon": "#22c55e", "rare": "#2f8cf0",
    "epic": "#9d4dea", "legendary": "#f2a516", "mythic": "#e8335f",
}
TRIM = {  # (hex, metallic, roughness)
    "common": ("#e7e7ea", 0.0, 0.55), "uncommon": ("#f4f4f5", 0.0, 0.5), "rare": ("#d5dbe3", 1.0, 0.28),
    "epic": ("#e1e6ee", 1.0, 0.22), "legendary": ("#ffc93c", 1.0, 0.2), "mythic": ("#ffd34d", 1.0, 0.16),
}
ACCENT = {  # (hex, emission strength)
    "common": ("#3f3f46", 0.0), "uncommon": ("#f4f4f5", 0.0), "rare": ("#7dd3fc", 0.6),
    "epic": ("#d8b4fe", 2.5), "legendary": ("#fff1a8", 3.0), "mythic": ("#ff8fb1", 5.0),
}


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    # Principled BSDF expects linear colour
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb] + [1.0]


# ---------------------------------------------------------------- scene helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    return scene


def material(name):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


def bsdf(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def set_input(node, names, value):
    for n in names if isinstance(names, (list, tuple)) else [names]:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return


def add_grain(mat, scale, strength):
    """Fine procedural bump (leather grain / fabric weave). Only affects the Cycles icons, not the GLB."""
    nt = mat.node_tree
    if any(n.type == "BUMP" for n in nt.nodes):
        return
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 6.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf(mat).inputs["Normal"])


def apply_rarity(rarity, style="leather"):
    pm = material("Primary")
    p = bsdf(pm)
    set_input(p, "Base Color", hex_rgb(PRIMARY[rarity]))
    set_input(p, "Metallic", 0.0)
    if style == "leather":  # soft satin leather
        set_input(p, "Roughness", 0.5)
        set_input(p, ["Coat Weight", "Clearcoat"], 0.2)
        add_grain(pm, 90, 0.12)
    elif style == "fabric":  # matte cloth with a velvety sheen
        set_input(p, "Roughness", 0.85)
        set_input(p, ["Coat Weight", "Clearcoat"], 0.0)
        set_input(p, ["Sheen Weight", "Sheen"], 0.7)
        add_grain(pm, 260, 0.07)
    elif style == "rubber":
        set_input(p, "Roughness", 0.3)
        set_input(p, ["Coat Weight", "Clearcoat"], 0.35)
    else:  # plastic
        set_input(p, "Roughness", 0.32)
        set_input(p, ["Coat Weight", "Clearcoat"], 0.25)

    t = bsdf(material("Trim"))
    th, tm, tr = TRIM[rarity]
    set_input(t, "Base Color", hex_rgb(th))
    set_input(t, "Metallic", tm)
    set_input(t, "Roughness", tr)

    a = bsdf(material("Accent"))
    ah, ae = ACCENT[rarity]
    set_input(a, "Base Color", hex_rgb(ah))
    set_input(a, ["Emission Color", "Emission"], hex_rgb(ah))
    set_input(a, "Emission Strength", ae)
    set_input(a, "Roughness", 0.3)

    d = bsdf(material("Dark"))
    set_input(d, "Base Color", hex_rgb("#1b1b20"))
    set_input(d, "Roughness", 0.65)

    l = bsdf(material("Light"))
    set_input(l, "Base Color", hex_rgb("#f5f5f4"))
    set_input(l, "Roughness", 0.45)


def finish(obj, mat_name, bevel=0.0, segments=3, subsurf=0):
    obj.data.materials.clear()
    obj.data.materials.append(material(mat_name))
    if bevel > 0:
        m = obj.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = segments
        m.limit_method = "ANGLE"
    if subsurf:
        m = obj.modifiers.new("subsurf", "SUBSURF")
        m.levels = subsurf
        m.render_levels = subsurf
    return obj


def last():
    return bpy.context.active_object


def cube(size, loc, mat, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = last()
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, **kw)


def sphere(scale, loc, mat, rot=(0, 0, 0), segments=32, rings=16, **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc, rotation=rot)
    o = last()
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, **kw)


def cylinder(radius, depth, loc, mat, rot=(0, 0, 0), vertices=32, **kw):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    return finish(last(), mat, **kw)


def torus(major, minor, loc, mat, rot=(0, 0, 0), scale=(1, 1, 1), **kw):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=48, minor_segments=12,
                                     location=loc, rotation=rot)
    o = last()
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, **kw)


def outline(points, depth, mat, y=0.0, **kw):
    """Flat 2D silhouette (x, z) extruded along -y: used for apparel (jersey, shorts)."""
    mesh = bpy.data.meshes.new("outline")
    bm = bmesh.new()
    verts = [bm.verts.new((x, y + depth / 2, z)) for x, z in points]
    face = bm.faces.new(verts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y -= depth
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("outline", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return finish(obj, mat, **kw)


def text(body, size, loc, mat, rot=(math.pi / 2, 0, 0), extrude=0.02):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = last()
    o.data.body = body
    o.data.size = size
    o.data.extrude = extrude
    o.data.align_x = "CENTER"
    o.data.align_y = "CENTER"
    o.data.materials.append(material(mat))
    return o


def dash(a, b, mat="Light", radius=0.011):
    a, b = Vector(a), Vector(b)
    mid = (a + b) / 2
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=radius, depth=d.length, location=mid)
    o = last()
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    finish(o, mat)


def stitch_ring(center, rx, ry, n, plane="xy", mat="Light", arc=(0.0, 360.0)):
    """Dashed stitch line around an ellipse (or part of it); plane picks the two axes the ellipse lies in."""
    cx, cy, cz = center
    start, span = math.radians(arc[0]), math.radians(arc[1] - arc[0])
    for i in range(n):
        a0 = start + (i / n) * span
        a1 = a0 + (0.55 / n) * span
        pts = []
        for a in (a0, a1):
            u, v = rx * math.cos(a), ry * math.sin(a)
            pts.append({"xy": (cx + u, cy + v, cz), "xz": (cx + u, cy, cz + v), "yz": (cx, cy + u, cz + v)}[plane])
        dash(pts[0], pts[1], mat)


def stitch_line(a, b, n, mat="Light"):
    a, b = Vector(a), Vector(b)
    for i in range(n):
        t0, t1 = i / n, (i + 0.55) / n
        dash(a.lerp(b, t0), a.lerp(b, t1), mat)


def join_all(name):
    bpy.ops.object.select_all(action="SELECT")
    objs = list(bpy.context.selected_objects)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()
    # centre and normalise size
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0, 0, 0)
    dims = max(obj.dimensions)
    obj.scale = [1.6 / dims] * 3
    bpy.ops.object.transform_apply(location=True, scale=True)
    return obj


# ---------------------------------------------------------------- models (front faces -Y, up is +Z)
def build_gloves():
    # Chubby boxing glove: puffy mitt, knuckle roll, fat thumb, laced cuff, stitched seams
    cube((0.94, 0.78, 1.0), (0, 0, 0.36), "Primary", bevel=0.36, segments=6, subsurf=2)  # mitt
    sphere((0.42, 0.32, 0.3), (0, -0.2, 0.72), "Primary", subsurf=1)  # knuckle roll
    sphere((0.2, 0.22, 0.44), (0.53, -0.1, 0.24), "Primary", rot=(0.15, -0.3, 0), subsurf=1)  # thumb
    c = cylinder(0.38, 0.52, (0, 0.02, -0.38), "Primary", bevel=0.06, segments=3)  # cuff
    c.scale = (1, 0.88, 1)
    for z, h in ((-0.12, 0.1), (-0.63, 0.07)):  # wrist band + cuff rim
        r = cylinder(0.405, h, (0, 0.02, z), "Trim", bevel=0.025, segments=2)
        r.scale = (1, 0.88, 1)
    stitch_ring((0, 0.02, -0.05), 0.4, 0.355, 26)  # seam above the wrist band
    cube((0.56, 0.06, 0.18), (0, -0.35, -0.38), "Dark", bevel=0.04)  # velcro strap
    for i in range(4):  # laces on the palm side
        cylinder(0.02, 0.22, (0, 0.35, -0.24 - i * 0.1), "Light", rot=(0, math.pi / 2, 0), vertices=8)
    cylinder(0.19, 0.04, (0, -0.4, 0.36), "Accent", rot=(math.pi / 2, 0, 0))  # logo patch
    torus(0.2, 0.022, (0, -0.4, 0.36), "Trim", rot=(math.pi / 2, 0, 0))
    stitch_ring((0, -0.41, 0.36), 0.25, 0.25, 22, plane="xz")  # stitched around the patch


def build_boots():
    cube((0.5, 1.08, 0.14), (0, -0.06, 0.07), "Dark", bevel=0.06, subsurf=1)  # rubber sole
    cube((0.48, 0.94, 0.42), (0, -0.04, 0.33), "Primary", bevel=0.2, segments=5, subsurf=2)  # chubby foot
    cylinder(0.26, 0.7, (0, 0.2, 0.78), "Primary", subsurf=1)  # high-top shaft
    torus(0.26, 0.05, (0, 0.2, 1.13), "Trim")  # padded collar
    sphere((0.25, 0.22, 0.17), (0, -0.48, 0.28), "Trim")  # toe cap
    stitch_ring((0, -0.06, 0.17), 0.25, 0.54, 34)  # sole stitching
    for i in range(6):  # laces up the front
        t = i / 5
        cylinder(0.024, 0.28, (0, -0.33 + t * 0.3, 0.5 + t * 0.56), "Light", rot=(0, math.pi / 2, 0), vertices=10)
    for s_ in (-1, 1):
        cube((0.02, 0.08, 0.56), (s_ * 0.262, 0.2, 0.8), "Accent")  # side stripes
    cube((0.3, 0.05, 0.4), (0, -0.07, 0.74), "Primary", rot=(-0.45, 0, 0), bevel=0.02)  # tongue


def half_arch(major, minor, center, plane, mat):
    """Upper half of a torus: padded strap arching over the top of the head."""
    rot = (math.pi / 2, 0, 0) if plane == "xz" else (math.pi / 2, 0, math.pi / 2)
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=40, minor_segments=12,
                                     location=center, rotation=rot)
    o = last()
    bpy.ops.object.transform_apply(rotation=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.02], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()
    return finish(o, mat)


def build_head():
    # Amateur boxing headgear: fat padded head band, open crown with crossing straps, cheek/ear pads, piping.
    torus(0.5, 0.14, (0, 0, 0.16), "Primary", scale=(0.92, 1.05, 1.15), subsurf=1)  # padded band
    torus(0.593, 0.02, (0, 0, 0.04), "Trim", scale=(0.92, 1.05, 1))  # piping, lower edge
    torus(0.593, 0.02, (0, 0, 0.28), "Trim", scale=(0.92, 1.05, 1))  # piping, upper edge
    half_arch(0.47, 0.07, (0, 0, 0.2), "xz", "Primary")  # strap ear-to-ear
    half_arch(0.5, 0.07, (0, 0, 0.2), "yz", "Primary")  # strap front-to-back
    sphere((0.1, 0.1, 0.06), (0, 0, 0.69), "Trim")  # crown button where the straps cross
    for s_ in (-1, 1):
        sphere((0.15, 0.3, 0.34), (s_ * 0.5, -0.04, -0.06), "Primary", subsurf=1)  # cheek/ear pads
        torus(0.085, 0.025, (s_ * 0.645, 0.0, -0.02), "Trim", rot=(0, math.pi / 2, 0))  # ear hole ring
        cylinder(0.08, 0.03, (s_ * 0.635, 0.0, -0.02), "Dark", rot=(0, math.pi / 2, 0))
    cube((0.3, 0.06, 0.16), (0, -0.66, 0.16), "Accent", bevel=0.04)  # forehead logo patch
    stitch_line((-0.12, -0.7, 0.16), (0.12, -0.7, 0.16), 5)
    stitch_ring((0, 0, 0.2), 0.475, 0.475, 16, plane="xz", arc=(25, 155))  # stitches along the top strap
    torus(0.46, 0.022, (0, -0.12, -0.34), "Dark", rot=(0.35, 0, 0), scale=(1, 0.55, 1))  # chin strap


def build_mouth():
    def u_curve(radius, legs, y0, z, bevel, mat):
        pts = []
        for i in range(17):
            a = math.pi + i / 16 * math.pi
            pts.append((radius * math.cos(a), y0 + radius * math.sin(a) * 1.15, z))
        pts = [(-radius, y0 + legs, z)] + pts + [(radius, y0 + legs, z)]
        cu = bpy.data.curves.new("u", "CURVE")
        cu.dimensions = "3D"
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for p, c in zip(sp.points, pts):
            p.co = (c[0], c[1], c[2], 1)
        cu.bevel_depth = bevel
        cu.bevel_resolution = 6
        cu.use_fill_caps = True
        o = bpy.data.objects.new("u", cu)
        bpy.context.collection.objects.link(o)
        o.data.materials.append(material(mat))
        return o

    outer = u_curve(0.62, 0.3, 0.0, 0.0, 0.17, "Primary")
    outer.scale = (1, 1, 0.75)
    u_curve(0.5, 0.3, 0.03, 0.1, 0.075, "Light")  # teeth channel
    cylinder(0.1, 0.03, (0, -0.73, 0.02), "Accent", rot=(math.pi / 2, 0, 0))


JERSEY = [(-0.18, 0.62), (-0.52, 0.55), (-0.9, 0.24), (-0.74, 0.0), (-0.52, 0.18), (-0.5, -0.64), (0.5, -0.64),
          (0.52, 0.18), (0.74, 0.0), (0.9, 0.24), (0.52, 0.55), (0.18, 0.62), (0.1, 0.5), (0.0, 0.47), (-0.1, 0.5)]


def build_robe():
    outline(JERSEY, 0.2, "Primary", bevel=0.05, segments=4)
    torus(0.15, 0.035, (0, -0.06, 0.5), "Trim", rot=(math.pi / 2 - 0.25, 0, 0), scale=(1.15, 1, 0.75))  # collar
    for s in (-1, 1):
        cube((0.05, 0.02, 1.0), (s * 0.4, -0.105, -0.12), "Trim")  # side stripes
        cube((0.32, 0.02, 0.05), (s * 0.8, -0.105, 0.13), "Trim", rot=(0, s * 0.62, 0))  # sleeve bands
    text("10", 0.62, (0, -0.11, -0.08), "Accent")  # shirt number
    stitch_line((-0.44, -0.112, -0.56), (0.44, -0.112, -0.56), 14)  # bottom hem


SHORTS = [(-0.62, 0.42), (0.62, 0.42), (0.68, -0.08), (0.64, -0.52), (0.08, -0.52), (0.0, -0.2), (-0.08, -0.52),
          (-0.64, -0.52), (-0.68, -0.08)]


def build_shorts():
    outline(SHORTS, 0.26, "Primary", bevel=0.06, segments=4)
    cube((1.3, 0.3, 0.22), (0, 0, 0.34), "Trim", bevel=0.06, segments=3)  # waistband
    for s in (-1, 1):
        cube((0.05, 0.02, 0.62), (s * 0.6, -0.135, -0.18), "Trim", rot=(0, s * -0.07, 0))  # side stripes
        cube((0.56, 0.02, 0.05), (s * 0.36, -0.135, -0.47), "Trim")  # leg hems
    cylinder(0.09, 0.03, (0, -0.16, 0.34), "Accent", rot=(math.pi / 2, 0, 0))
    for s_ in (-1, 1):
        stitch_line((s_ * 0.12, -0.137, -0.42), (s_ * 0.6, -0.137, -0.42), 8)  # leg hem stitches


def build_belt():
    strap = cube((1.7, 0.08, 0.36), (0, 0.05, 0), "Primary", bevel=0.03, segments=3)  # leather strap
    bend = strap.modifiers.new("bend", "SIMPLE_DEFORM")
    bend.deform_method = "BEND"
    bend.deform_axis = "Z"
    bend.angle = math.radians(70)
    cylinder(0.55, 0.1, (0, -0.04, 0), "Trim", rot=(math.pi / 2, 0, 0), vertices=8, bevel=0.035)  # centre plate
    cylinder(0.38, 0.12, (0, -0.07, 0), "Accent", rot=(math.pi / 2, 0, 0), vertices=48, bevel=0.02)
    torus(0.38, 0.03, (0, -0.13, 0), "Trim", rot=(math.pi / 2, 0, 0))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.13, location=(0, -0.17, 0))
    finish(last(), "Trim")  # faceted gem
    torus(0.22, 0.02, (0, -0.14, 0), "Trim", rot=(math.pi / 2, 0, 0))
    for s_ in (-1, 1):
        cube((0.24, 0.08, 0.32), (s_ * 0.64, 0.12, 0), "Trim", rot=(0, 0, -s_ * 0.36), bevel=0.03)  # side plates
        cube((0.13, 0.09, 0.17), (s_ * 0.635, 0.09, 0), "Accent", rot=(0, 0, -s_ * 0.36), bevel=0.02)


def build_weapon():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.6, location=(0, 0, 0))
    finish(last(), "Light")
    phi = (1 + 5 ** 0.5) / 2
    dirs = []
    for a in (-1, 1):
        for b in (-1, 1):
            dirs += [Vector((0, a, b * phi)), Vector((a, b * phi, 0)), Vector((b * phi, 0, a))]
    for d in dirs:
        d.normalize()
        bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.2, depth=0.06, location=d * 0.585)
        o = last()
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
        finish(o, "Primary")
    torus(0.72, 0.025, (0, 0, 0), "Accent", rot=(1.1, 0.3, 0))  # speed ring


def build_partner():
    cylinder(0.32, 0.4, (0, 0, 0), "Primary", rot=(math.pi / 2, 0, 0), bevel=0.06, segments=4, subsurf=1)  # chamber
    cube((0.62, 0.34, 0.2), (0.42, 0, 0.15), "Primary", bevel=0.06, segments=3)  # mouthpiece
    cube((0.16, 0.3, 0.06), (0.12, 0, 0.3), "Dark")  # sound slot
    cube((0.12, 0.36, 0.22), (0.7, 0, 0.15), "Trim", bevel=0.03)  # mouth tip
    torus(0.11, 0.03, (-0.36, 0, 0.18), "Trim", rot=(math.pi / 2, 0, 0))  # ring
    torus(0.55, 0.03, (-0.62, 0, -0.38), "Accent", rot=(math.pi / 2, 0.2, 0), scale=(0.65, 1, 1))  # lanyard


BUILDERS = {
    "head": build_head, "gloves": build_gloves, "mouth": build_mouth, "robe": build_robe, "shorts": build_shorts,
    "boots": build_boots, "belt": build_belt, "weapon": build_weapon, "partner": build_partner,
}


# ---------------------------------------------------------------- rendering
ICON_ANGLE = {"gloves": 30, "head": 25, "belt": 0, "weapon": 0, "partner": -10, "mouth": -10, "boots": -18,
              "robe": -15, "shorts": -15}


def setup_render(scene, px, radius=1.0):
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 48
    try:
        scene.cycles.use_denoising = True
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        scene.cycles.use_denoising = False
        scene.cycles.samples = 160
    scene.render.film_transparent = True
    scene.render.resolution_x = px
    scene.render.resolution_y = px
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    try:
        scene.view_settings.view_transform = "Standard"
    except Exception:
        pass
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.14, 0.13, 0.13, 1)
    bg.inputs[1].default_value = 1.0
    scene.world = world

    def area(loc, energy, size, color=(1, 1, 1)):
        bpy.ops.object.light_add(type="AREA", location=loc)
        lamp = last()
        lamp.data.energy = energy
        lamp.data.size = size
        lamp.data.color = color
        direction = Vector((0, 0, 0)) - Vector(loc)
        lamp.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    area((3.0, -3.2, 3.6), 400, 4.5, (1.0, 0.96, 0.9))
    area((-3.4, -2.2, 1.6), 230, 4.0, (0.85, 0.9, 1.0))
    area((0.5, 3.2, 3.0), 300, 2.0, (1.0, 0.92, 0.8))

    bpy.ops.object.camera_add()
    cam = last()
    cam.data.lens = 50
    view = Vector((1.0, -1.35, 0.75)).normalized()
    dist = radius / math.sin(math.atan(18 / cam.data.lens)) * 1.08
    cam.location = view * dist
    cam.rotation_euler = (-view).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam


def sticker_outline(path, px=4, color=(0.07, 0.07, 0.09)):
    """Dark rounded outline around the icon silhouette: reads like a cute sticker on the dark UI."""
    import numpy as np
    img = bpy.data.images.load(path)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    alpha = a[..., 3]
    grown = alpha.copy()
    for dy in range(-px, px + 1):
        for dx in range(-px, px + 1):
            if dx * dx + dy * dy <= px * px:
                grown = np.maximum(grown, np.roll(np.roll(alpha, dy, 0), dx, 1))
    ring = np.clip(grown, 0, 1) * (1 - alpha)
    out = np.empty_like(a)
    for c in range(3):
        out[..., c] = a[..., c] * alpha + color[c] * ring
    out[..., 3] = np.clip(alpha + ring, 0, 1)
    # un-premultiply for straight-alpha PNG
    nz = out[..., 3] > 1e-4
    for c in range(3):
        out[..., c][nz] = out[..., c][nz] / out[..., 3][nz]
    img.pixels[:] = out.ravel()
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def main():
    args = sys.argv[1:]
    only = None
    if "--only" in args:
        only = args[args.index("--only") + 1].split(",")
    icons = "--no-icons" not in args
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(ICON_DIR, exist_ok=True)

    for slot in SLOTS:
        if only and slot not in only:
            continue
        scene = reset()
        for name in ("Primary", "Trim", "Accent", "Dark", "Light"):
            material(name)
        apply_rarity("rare", STYLE[slot])
        BUILDERS[slot]()
        obj = join_all(slot)
        if icons:
            obj.rotation_euler = (0, 0, math.radians(ICON_ANGLE.get(slot, -18)))
            bpy.context.view_layer.update()
            radius = max(0.55, 0.5 * Vector(obj.dimensions).length)
            setup_render(scene, 192, radius)
            for rarity in RARITIES:
                apply_rarity(rarity, STYLE[slot])
                path = os.path.join(ICON_DIR, f"{slot}_{rarity}.png")
                scene.render.filepath = path
                bpy.ops.render.render(write_still=True)
                sticker_outline(path)
            obj.rotation_euler = (0, 0, 0)
            apply_rarity("rare", STYLE[slot])
            print(f"[{slot}] icons rendered", flush=True)

        # Keep the runtime model light for phones
        tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        if tris > MAX_TRIS:
            dec = obj.modifiers.new("lod", "DECIMATE")
            dec.ratio = MAX_TRIS / tris
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=dec.name)
        tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)

        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        # No clearcoat in the runtime model: it would make three.js use the heavier physical shader
        set_input(bsdf(material("Primary")), ["Coat Weight", "Clearcoat"], 0.0)
        glb = os.path.join(MODEL_DIR, f"{slot}.glb")
        bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True, export_apply=True)
        print(f"[{slot}] {tris} tris -> {os.path.getsize(glb) // 1024} KB", flush=True)


if __name__ == "__main__":
    main()
