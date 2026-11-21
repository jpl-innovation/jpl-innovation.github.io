"""
A Poly Haven wall texture (1k JPGs in assets-src/room/polyhaven/) made into the studio's three WebP maps in
public/studio/tex/: NAME-diff (grey detail at a linear mean of 0.6, so the theme tints it: room.ts tint()), NAME-nor and
NAME-rough, at SIZE px and WebP QUALITY, and the set's total size printed.

    python scripts/studio-wall-texture.py NAME [--size 1024] [--quality 72]
"""
import argparse, os
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument("name"); ap.add_argument("--size", type=int, default=1024); ap.add_argument("--quality", type=int, default=72)
a = ap.parse_args()
src = os.path.join("assets-src", "room", "polyhaven", a.name + "_{}_1k.jpg")
out = os.path.join("public", "studio", "tex", a.name + "-{}.webp")
size = (a.size, a.size)
grey = np.asarray(Image.open(src.format("diff")).convert("L").resize(size, Image.LANCZOS), dtype=np.float64) / 255
linear = np.where(grey <= 0.04045, grey / 12.92, ((grey + 0.055) / 1.055) ** 2.4)
linear = np.clip(linear * (0.6 / linear.mean()), 0, 1)
srgb = np.where(linear <= 0.0031308, linear * 12.92, 1.055 * linear ** (1 / 2.4) - 0.055)
Image.fromarray((srgb * 255 + 0.5).astype(np.uint8)).convert("RGB").save(out.format("diff"), quality=a.quality, method=6)
Image.open(src.format("nor_gl")).convert("RGB").resize(size, Image.LANCZOS).save(out.format("nor"), quality=a.quality, method=6)
Image.open(src.format("rough")).convert("RGB").resize(size, Image.LANCZOS).save(out.format("rough"), quality=a.quality, method=6)
total = sum(os.path.getsize(out.format(k)) for k in ("diff", "nor", "rough"))
print(f"{a.name}: {total // 1024} KB at {a.size} px, quality {a.quality}")
