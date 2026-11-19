# The studio's real models: where they came from

All CC0 (public domain). `scripts/studio-model.py` makes each one small for the site (`public/studio/models/`).

| Folder | Model | Source | Shipped |
|---|---|---|---|
| `office-chair/` | Office Chair, by nisu (3dmodelscc0.com) | https://opengameart.org/content/office-chair-1 | `office-chair.glb`: 4,674 triangles, 281 KB (1024 px WebP) |
| `potted-plant-04/` | Potted Plant 04, Poly Haven | https://polyhaven.com/a/potted_plant_04 | `potted-plant.glb`: 8,929 triangles, 347 KB (512 px WebP) |
| `wall-clock/` | Wall Clock, Poly Haven | https://polyhaven.com/a/wall_clock | `wall-clock.glb`: 3,658 triangles, 190 KB (512 px WebP) |
| `screwdriver/` | Screwdriver, Poly Haven | https://polyhaven.com/a/screwdriver | `screwdriver.glb`: 3,412 triangles, 140 KB (512 px WebP) |
| `pliers/` | Pliers, Poly Haven | https://polyhaven.com/a/pliers | `pliers.glb`: 4,540 triangles, 227 KB (512 px WebP) |
| `measuring-tape/` | Measuring Tape 01, Poly Haven | https://polyhaven.com/a/measuring_tape_01 | `measuring-tape.glb`: 2,868 triangles, 150 KB (512 px WebP) |
| `drill/` | Drill 01, Poly Haven | https://polyhaven.com/a/Drill_01 | `drill.glb`: 2,926 triangles, 158 KB (512 px WebP) |
| `multimeter/` | Retro Multimeter, Poly Haven | https://polyhaven.com/a/retro_multimeter | `multimeter.glb`: 8,948 triangles, 314 KB (512 px WebP) |

    blender -b --python scripts/studio-model.py -- assets-src/studio/office-chair/Office_Chair.fbx public/studio/models/office-chair.glb --size 1024
    blender -b --python scripts/studio-model.py -- assets-src/studio/potted-plant-04/potted_plant_04.gltf public/studio/models/potted-plant.glb --size 512

The tools and the clock: the same command, `--size 512`, from each folder's `.gltf`.

The makers' names are painted out of the tape, clock, screwdriver and pliers textures first (`python -I scripts/studio-unbrand.py`, already run on the copies here): the room shows no real brand.
