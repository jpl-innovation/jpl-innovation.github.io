"""
The city outside the studio's glass (look b, backdrop.ts) from the pictures in assets-src/studio/city/:

    sky-, skyline-, river-, near-  each -night.png and -golden.png

made on a flat bright green (#00FF00) where the layers behind should show (the sky has none). For each:
  - the green is keyed out: each pixel's coverage from how much greener than red and blue it is, then its own colour
    un-mixed from the green behind it (so a bridge cable or a tower's edge keeps its own colour, with no green fringe),
    and any green left in the half-covered edge taken off;
  - the empty rows above the layer's top are cropped off (the same rows for both versions), so a layer is as wide round
    the arc as it can be without stretching a building; backdrop.ts sizes each layer's arc from its proportions;
  - the golden version is lined up on the night one (the scale and shift that best overlay their outlines);
  - written at WIDTH px wide to public/studio/window/city-LAYER-THEME.webp, with each layer's size in city.json.
A picture that does not key cleanly (too little green, or see-through holes inside the city) is named, with what to
change in its prompt.

    python scripts/studio-city.py [--width 2048] [--quality 78]
"""
import argparse, json, os
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--width", type=int, default=2048)
ap.add_argument("--quality", type=int, default=78)
args = ap.parse_args()
SRC = os.path.join("assets-src", "studio", "city")
OUT = os.path.join("public", "studio", "window")
os.makedirs(OUT, exist_ok=True)
LAYERS = ["sky", "skyline", "river", "near"]
THEMES = ["night", "golden"]
E0, E1 = 0.2, 0.7  # excess green (share of 255) at which a pixel starts to go see-through, and is wholly so


def load(layer, theme):
    im = Image.open(os.path.join(SRC, f"{layer}-{theme}.png")).convert("RGB")
    h = round(im.height * args.width / im.width)
    return np.asarray(im.resize((args.width, h), Image.LANCZOS), np.float32) / 255


def key(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = g - np.maximum(r, b)
    alpha = 1 - np.clip((excess - E0) / (E1 - E0), 0, 1)
    # Un-mix: pixel = alpha * colour + (1 - alpha) * green, so colour = (pixel - (1 - alpha) * green) / alpha.
    a = np.maximum(alpha, 1e-3)[..., None]
    green = np.array([0, 1, 0], np.float32)
    colour = np.clip((rgb - (1 - a) * green) / a, 0, 1)
    # Where it is only partly covered, no green may be left over red and blue (a fringe); solid pixels keep their own
    # (the trees on the banks are green).
    edge = alpha < 0.98
    cap = np.maximum(colour[..., 0], colour[..., 2]) * 0.96
    colour[..., 1] = np.where(edge, np.minimum(colour[..., 1], cap), colour[..., 1])
    alpha = np.where(alpha < 0.02, 0, alpha)
    return colour, alpha


def problems(alpha):
    notes = []
    if (1 - alpha).mean() < 0.15:
        notes.append(f"only {(1 - alpha).mean():.0%} is green: ask for the layer in the lower part only, all above it flat #00FF00")
    rows = np.where(alpha.max(1) > 0.5)[0]
    if len(rows):
        body = alpha[rows[0] + 2 * (rows[-1] - rows[0]) // 3 :]
        holes = (body < 0.5).mean()
        if holes > 0.12:
            notes.append(f"{holes:.0%} of its lower third came out see-through: ask for no green (glass, signs, trees, water) inside it")
    return notes


def shift_err(a, b, s, X, Y):
    """How far b, scaled by s and shifted by (X, Y), is from a, where they overlap."""
    bs = np.asarray(Image.fromarray((b * 255).astype(np.uint8)).resize((round(b.shape[1] * s), round(b.shape[0] * s)), Image.BILINEAR), np.float32) / 255
    y0, x0, ys, xs = max(0, Y), max(0, X), max(0, -Y), max(0, -X)
    hh = min(a.shape[0] - y0, bs.shape[0] - ys)
    ww = min(a.shape[1] - x0, bs.shape[1] - xs)
    if hh * ww < 0.8 * a.size:
        return 1e18
    return float(((bs[ys : ys + hh, xs : xs + ww] - a[y0 : y0 + hh, x0 : x0 + ww]) ** 2).mean())


def line_up(a_n, a_g):
    """The scale and shift that best overlay the golden outline on the night one: coarse at a quarter size, then to the pixel."""
    small = lambda a: np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((a.shape[1] // 4, a.shape[0] // 4), Image.BILINEAR), np.float32) / 255
    n4, g4 = small(a_n), small(a_g)
    _, s0, dx0, dy0 = min((shift_err(n4, g4, s, dx, dy), s, dx * 4, dy * 4) for s in np.linspace(0.94, 1.06, 13) for dy in range(-8, 9, 2) for dx in range(-16, 17, 2))
    _, s1, dx1, dy1 = min((shift_err(a_n, a_g, s, dx0 + ddx, dy0 + ddy), s, dx0 + ddx, dy0 + ddy) for s in (s0 - 0.005, s0, s0 + 0.005) for ddy in range(-8, 9, 2) for ddx in range(-8, 9, 2))
    return min((shift_err(a_n, a_g, s1, dx1 + ddx, dy1 + ddy), s1, dx1 + ddx, dy1 + ddy) for ddy in (-1, 0, 1) for ddx in (-1, 0, 1))


meta, issues = {}, {}
for layer in LAYERS:
    pics = {t: load(layer, t) for t in THEMES}
    if layer == "sky":
        for t in THEMES:
            Image.fromarray((pics[t] * 255).astype(np.uint8)).save(os.path.join(OUT, f"city-sky-{t}.webp"), quality=args.quality - 6, method=6)
        meta["sky"] = {"width": args.width, "height": pics["night"].shape[0]}
        continue
    keyed = {t: key(pics[t]) for t in THEMES}
    for t in THEMES:
        n = problems(keyed[t][1])
        if n:
            issues[f"{layer}-{t}"] = n
    err, s, dx, dy = line_up(keyed["night"][1], keyed["golden"][1])
    colour, alpha = keyed["golden"]
    rgba = Image.fromarray(np.dstack([colour * 255, alpha * 255]).astype(np.uint8), "RGBA")
    rgba = rgba.resize((round(rgba.width * s), round(rgba.height * s)), Image.LANCZOS)
    placed = Image.new("RGBA", (args.width, pics["night"].shape[0]), (0, 0, 0, 0))
    placed.paste(rgba, (dx, dy))
    arr = np.asarray(placed, np.float32) / 255
    keyed["golden"] = (arr[..., :3], arr[..., 3])
    print(f"{layer}: golden lined up on night: scale {s:.3f}, shift {dx}, {dy} px (mismatch {err:.4f})")
    top = max(0, min(int(np.argmax(keyed[t][1].max(1) > 0.05)) for t in THEMES) - 6)
    for t in THEMES:
        colour, alpha = keyed[t]
        out = np.dstack([colour[top:] * 255, alpha[top:] * 255]).astype(np.uint8)
        Image.fromarray(out, "RGBA").save(os.path.join(OUT, f"city-{layer}-{t}.webp"), quality=args.quality, alpha_quality=90, method=6)
    meta[layer] = {"width": args.width, "height": pics["night"].shape[0] - top}

json.dump(meta, open(os.path.join(OUT, "city.json"), "w"), indent=1)
for layer in LAYERS:
    size = sum(os.path.getsize(os.path.join(OUT, f"city-{layer}-{t}.webp")) for t in THEMES)
    print(f"{layer}: {meta[layer]['width']} x {meta[layer]['height']} px, {size // 1024} KB for both")
for name, notes in issues.items():
    for n in notes:
        print(f"PROBLEM {name}: {n}")
