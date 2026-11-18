"""
The studio's light from all around (src/lib/studio/room.ts): a Poly Haven HDRI (CC0), shrunk to what lighting needs.

    python -I scripts/studio-env.py assets-src/room/polyhaven/blender_institute_1k.hdr public/studio/tex/studio-env.hdr

The room never shows it, it only lights and reflects, so 256 x 128 is enough (about 130 KB). The brightest lamps in it
are capped, so a glossy surface never sparkles; half its colour is taken out and its average brightness is set to 1.
"""
import re
import sys

import numpy as np

WIDTH, HEIGHT, CAP = 256, 128, 24.0


def read(path):
    data = open(path, "rb").read()
    head = data.index(b"\n\n") + 2
    line = data.index(b"\n", head)
    h, w = map(int, re.match(rb"-Y (\d+) \+X (\d+)", data[head:line]).groups())
    raw = np.frombuffer(data, np.uint8, offset=line + 1)
    out = np.empty((h, w, 4), np.uint8)
    p = 0
    for y in range(h):  # each row: a 4-byte mark, then the four channels one after another, run-length coded
        assert raw[p] == 2 and raw[p + 1] == 2, "not a run-length coded .hdr"
        p += 4
        for c in range(4):
            x = 0
            while x < w:
                n = int(raw[p])
                if n > 128:
                    out[y, x : x + n - 128, c] = raw[p + 1]
                    x += n - 128
                    p += 2
                else:
                    out[y, x : x + n, c] = raw[p + 1 : p + 1 + n]
                    x += n
                    p += 1 + n
    return out[..., :3].astype(np.float32) * np.ldexp(1.0, out[..., 3:].astype(np.int32) - 136) * (out[..., 3:] > 0)


def write(path, rgb):
    peak = np.maximum(rgb.max(axis=2), 1e-32)
    mantissa, exponent = np.frexp(peak)
    scale = mantissa * 256 / peak
    rgbe = np.concatenate([np.clip(rgb * scale[..., None], 0, 255), (exponent + 128)[..., None]], axis=2).astype(np.uint8)
    rgbe[peak <= 1e-32] = 0
    with open(path, "wb") as f:
        f.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y %d +X %d\n" % rgb.shape[:2])
        f.write(rgbe.tobytes())


source, target = sys.argv[1:3]
image = read(source)
h, w, _ = image.shape
small = np.minimum(image, CAP).reshape(HEIGHT, h // HEIGHT, WIDTH, w // WIDTH, 3).mean(axis=(1, 3))
# Half its colour (the room's own colours are the site's, and a warm wooden interior would tint the walls), and an
# average brightness of 1, so the room's intensity settings mean the same whichever HDRI this is.
grey = small @ np.array([0.2126, 0.7152, 0.0722], np.float32)
small = grey[..., None] + (small - grey[..., None]) * 0.5
small = (small / small.mean()).astype(np.float32)
write(target, small)
print(target, small.shape, "mean", small.mean().round(3), "max", small.max().round(1))
