"""
The city outside the studio's glass (look b, backdrop.ts) from the pictures in assets-src/studio/city/:

    sky-night  sky-golden  far-night  far-golden  river-night  river-golden  near-night  near-golden   (.png, .jpg or .webp)

made on a flat bright green (#00FF00) where they should be see-through. For each:
  - the green is keyed out (a soft edge, and the green spill taken off the edges' colour);
  - the empty rows above the layer's top are cropped off, so a layer is as wide (in metres, round the arc) as it can be
    without stretching; the sky is stretched to 4096 wide instead (a sky stretches without showing it);
  - the golden version is lined up on the night one (the shift and scale that best match their outlines), so the
    theme switch never moves a building;
and written to public/studio/window/city-LAYER-THEME.webp, with each layer's size and where its content stops, for
backdrop.ts, in public/studio/window/city.json. A picture that does not key cleanly (too little green, or green inside
the city) is named, with what to change in its prompt.

    python scripts/studio-city.py [--quality 80]
"""
import argparse, glob, json, os
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--quality", type=int, default=80)
args = ap.parse_args()
SRC = os.path.join("assets-src", "studio", "city")
OUT = os.path.join("public", "studio", "window")
os.makedirs(OUT, exist_ok=True)
LAYERS = ["sky", "far", "river", "near"]
THEMES = ["night", "golden"]


def find(layer, theme):
    for f in glob.glob(os.path.join(SRC, f"{layer}-{theme}.*")):
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            return f
    return None


def key(rgb):
    """Alpha from how much greener than red and blue each pixel is; the spill taken off what stays."""
    r, g, b = (rgb[..., i].astype(np.float32) for i in range(3))
    excess = g - np.maximum(r, b)
    alpha = 1 - np.clip((excess - 40) / 90, 0, 1)  # (soft between 40 and 130 levels of excess green)
    g2 = np.minimum(g, np.maximum(r, b) + 12)  # despill
    out = np.stack([r, g2, b], -1)
    return np.clip(out, 0, 255).astype(np.uint8), alpha


def report(name, rgb, alpha):
    notes = []
    share = 1 - alpha.mean()
    if share < 0.15:
        notes.append(f"only {share:.0%} of it is green: ask for the city in the lower part only, everything above it flat #00FF00")
    # Green inside the city: see-through holes well below its top edge.
    rows = np.where(alpha.max(1) > 0.5)[0]
    if len(rows):
        body = alpha[rows[0] + 2 * (rows[-1] - rows[0]) // 3 :]  # the bottom third: solid city, not the gaps between towers
        holes = (body < 0.5).mean()
        if holes > 0.12:
            notes.append(f"{holes:.0%} of the city below its skyline came out see-through: ask for no green or green-tinted glass, lights or water inside the city")
    return notes


meta = {}
problems = {}
for layer in LAYERS:
    pics = {t: find(layer, t) for t in THEMES}
    if not all(pics.values()):
        print(f"{layer}: waiting for {', '.join(t for t, f in pics.items() if not f)}")
        continue
    imgs = {t: np.asarray(Image.open(pics[t]).convert("RGB")) for t in THEMES}
    h = 1024
    if layer == "sky":
        for t in THEMES:
            im = Image.fromarray(imgs[t]).resize((4096, h), Image.LANCZOS)
            im.save(os.path.join(OUT, f"city-sky-{t}.webp"), quality=args.quality, method=6)
        meta["sky"] = {"width": 4096, "height": h}
        print("sky: stretched to 4096 x 1024")
        continue
    keyed = {}
    for t in THEMES:
        im = Image.fromarray(imgs[t]).resize((round(imgs[t].shape[1] * h / imgs[t].shape[0]), h), Image.LANCZOS)
        rgb, alpha = key(np.asarray(im))
        keyed[t] = (rgb, alpha)
        n = report(f"{layer}-{t}", rgb, alpha)
        if n:
            problems[f"{layer}-{t}"] = n
    # Line golden up on night: the scale and shift that best overlay their outlines (alpha), searched coarse to fine.
    a_n = keyed["night"][1]
    a_g = keyed["golden"][1]
    best = (1e18, 1.0, 0, 0)
    small = lambda a, s: np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((a.shape[1] // s, a.shape[0] // s), Image.BILINEAR), np.float32) / 255
    n4 = small(a_n, 4)
    for scale in np.linspace(0.92, 1.08, 17):
        g4 = small(a_g, 4)
        gs = np.asarray(Image.fromarray((g4 * 255).astype(np.uint8)).resize((round(g4.shape[1] * scale), round(g4.shape[0] * scale)), Image.BILINEAR), np.float32) / 255
        for dy in range(-12, 13, 2):
            for dx in range(-24, 25, 3):
                y0, x0 = max(0, dy), max(0, dx)
                ys, xs = max(0, -dy), max(0, -dx)
                hh = min(n4.shape[0] - y0, gs.shape[0] - ys)
                ww = min(n4.shape[1] - x0, gs.shape[1] - xs)
                if hh <= 0 or ww <= 0:
                    continue
                if hh * ww < 0.8 * n4.size:
                    continue
                # (Compared where the two overlap only: an edge left uncovered by a shift is no mismatch.)
                err = float(((gs[ys : ys + hh, xs : xs + ww] - n4[y0 : y0 + hh, x0 : x0 + ww]) ** 2).mean())
                if err < best[0]:
                    best = (err, scale, dx * 4, dy * 4)
    _, scale, dx, dy = best
    # Then to the pixel, at full size, round the coarse answer (its scale give or take a hundredth, its shift give or take 12 px).
    fine = (1e18, scale, dx, dy)
    for s2 in (scale - 0.01, scale - 0.005, scale, scale + 0.005, scale + 0.01):
      gimg = Image.fromarray((a_g * 255).astype(np.uint8))
      gfull = np.asarray(gimg.resize((round(gimg.width * s2), round(gimg.height * s2)), Image.BILINEAR), np.float32) / 255
      for ddy in range(-12, 13, 1):
        for ddx in range(-12, 13, 1):
            X, Y = dx + ddx, dy + ddy
            y0, x0, ys, xs = max(0, Y), max(0, X), max(0, -Y), max(0, -X)
            hh = min(a_n.shape[0] - y0, gfull.shape[0] - ys)
            ww = min(a_n.shape[1] - x0, gfull.shape[1] - xs)
            err = float(((gfull[ys : ys + hh, xs : xs + ww] - a_n[y0 : y0 + hh, x0 : x0 + ww]) ** 2).mean())
            if err < fine[0]:
                fine = (err, s2, X, Y)
    best = fine
    _, scale, dx, dy = fine
    rgb_g, a_gl = keyed["golden"]
    rgba = np.dstack([rgb_g, (a_gl * 255).astype(np.uint8)])
    im = Image.fromarray(rgba, "RGBA")
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    placed = Image.new("RGBA", (a_n.shape[1], a_n.shape[0]), (0, 0, 0, 0))
    placed.paste(im, (dx, dy))
    keyed["golden"] = (np.asarray(placed)[..., :3], np.asarray(placed)[..., 3].astype(np.float32) / 255)
    print(f"{layer}: golden lined up on night (scale {scale:.3f}, shift {dx}, {dy} px; mismatch {best[0]:.4f})")
    # Crop the empty rows above the layer's top (the same rows for both, so they stay lined up).
    top = min(int(np.argmax(keyed[t][1].max(1) > 0.05)) for t in THEMES)
    top = max(0, top - 8)
    for t in THEMES:
        rgb, alpha = keyed[t]
        out = np.dstack([rgb[top:], (alpha[top:] * 255).astype(np.uint8)])
        Image.fromarray(out, "RGBA").save(os.path.join(OUT, f"city-{layer}-{t}.webp"), quality=args.quality, method=6, exact=True)
    meta[layer] = {"width": a_n.shape[1], "height": h - top, "cropped": top}
    print(f"{layer}: {a_n.shape[1]} x {h - top} after cropping {top} empty rows")

json.dump(meta, open(os.path.join(OUT, "city.json"), "w"), indent=1)
total = sum(os.path.getsize(f) for f in glob.glob(os.path.join(OUT, "city-*.webp")))
print(f"written: {sorted(meta)}; {total // 1024} KB in all")
for name, notes in problems.items():
    for n in notes:
        print(f"PROBLEM {name}: {n}")
