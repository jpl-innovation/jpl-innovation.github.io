/**
 * The room's real models: CC0 scans and models (their sources: assets-src/studio/README.md), made small by
 * scripts/studio-model.py into public/studio/models/NAME.glb. Not on the low tier, which keeps the shapes built in code.
 */
import { Box3, Group, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const files = new Map<string, Promise<Group>>();

/**
 * A copy of the model (its geometry and materials shared with the other copies), its foot on y = 0, centred on x and z.
 * `lay`: turned first (x, y, z, radians), for a thing that lies on its side.
 */
export async function model(name: string, lay?: [number, number, number]): Promise<Group> {
	let file = files.get(name);
	if (!file) files.set(name, (file = loader.loadAsync(`/studio/models/${name}.glb`).then((gltf) => gltf.scene)));
	const copy = (await file).clone();
	if (lay) copy.rotation.set(...lay);
	const box = new Box3().setFromObject(copy);
	const middle = box.getCenter(new Vector3());
	copy.position.sub(middle.setY(box.min.y));
	const holder = new Group();
	holder.add(copy);
	return holder;
}
