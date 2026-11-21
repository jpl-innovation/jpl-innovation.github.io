"""
The robot's print for the studio's gallery wall (walls.ts): our own CAD render (public/showcase/robot/overview.webp) as
an engineer's line drawing, its edges in cream on the site's navy, with a faint grid, into
public/studio/prints/robot-lines.webp.

    python scripts/studio-prints.py
"""
import numpy as np
from PIL import Image, ImageFilter

src = Image.open("public/showcase/robot/overview.webp").convert("L")
src = src.resize((1200, round(1200 * src.height / src.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.1))
a = np.asarray(src, np.float32) / 255
gx = np.zeros_like(a); gy = np.zeros_like(a)
gx[:, 1:-1] = a[:, 2:] - a[:, :-2]
gy[1:-1, :] = a[2:, :] - a[:-2, :]
edge = np.clip((np.hypot(gx, gy) - 0.035) * 9, 0, 1)
navy = np.array([27, 45, 110], np.float32)
ink = np.array([242, 238, 223], np.float32)
h, w = a.shape
grid = np.zeros((h, w), np.float32)
grid[::40, :] = 0.08
grid[:, ::40] = 0.08
k = np.maximum(edge * 0.92, grid)[..., None]
out = navy * (1 - k) + ink * k
Image.fromarray(out.astype(np.uint8)).save("public/studio/prints/robot-lines.webp", quality=72, method=6)
print(w, h)
