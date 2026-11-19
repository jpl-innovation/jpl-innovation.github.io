"""
Paints the makers' names out of the downloaded models' textures (assets-src/studio/, CC0), in place, before
scripts/studio-model.py makes them small: the room shows no real brand. Run once per download.

    python -I scripts/studio-unbrand.py

In each rectangle (x0, y0, x1, y1 on the 1k picture) the pixels that differ from the rectangle's usual colour (the
lettering) take that usual colour, softened at the edges; the same rectangle of the normal map is flattened where it is embossed.
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets-src", "studio")
MARKS = {
    "measuring-tape/textures/measuring_tape_01": [(566, 334, 716, 416)],  # P-TECH, QC-PASSED (the "3m" above stays)
    "wall-clock/textures/wall_clock": [(245, 612, 315, 664)],  # URBAN quartz
    "screwdriver/textures/screwdriver": [(170, 630, 395, 685)],  # LANSTEY
    "pliers/textures/pliers": [(143, 530, 192, 770)],  # the VDE and GS marks
}
for name, rects in MARKS.items():
    for kind in ("diff", "nor_gl"):
        path = os.path.join(ROOT, f"{name}_{kind}_1k.jpg")
        image = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
        mask = np.zeros(image.shape[:2], np.float32)
        flat = image.copy()
        for x0, y0, x1, y1 in rects:
            part = image[y0:y1, x0:x1]
            usual = np.median(part.reshape(-1, 3), axis=0)
            mask[y0:y1, x0:x1] = np.abs(part - usual).sum(axis=2) > (60 if kind == "diff" else 24)
            flat[y0:y1, x0:x1] = usual
        # The lettering and 3 pixels around it, with a soft edge.
        soft = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)[..., None] / 255
        Image.fromarray((image * (1 - soft) + flat * soft).round().astype(np.uint8)).save(path, quality=95)
        print(path, int(mask.sum()), "pixels of lettering")
