/**
 * One of the 3D models from the ADDC website (/work/addc/): the walnut coffee table from its interiors page, as the
 * site itself shows it. public/work/addc/coffee-table.glb is that site's noi-that-ban-tra.glb, unchanged (2 MB).
 * It turns slowly; drag to turn it yourself.
 */
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { contactShadow, type Model, type StageContext, type StageView } from "../stage";

// A plain root path: a build served from a sub-address gets its prefix from scripts/prefix-paths.mjs, like every other.
const FILE = "/work/addc/coffee-table.glb";

export const view: StageView = {
	camera: [1.6, 1.15, 2.1],
	target: [0, 0.32, 0],
	fov: 32,
	spin: 0.25,
	minPolar: 0.35,
	maxPolar: 1.45,
	fitWidth: 1.8,
};

export default async function createTable(ctx: StageContext): Promise<Model> {
	const gltf = await new GLTFLoader().loadAsync(FILE);
	const table = gltf.scene;
	// Stand it on the floor at the origin, about 1.1 units across (its real width in metres).
	const box = new Box3().setFromObject(table);
	const size = box.getSize(new Vector3());
	const k = 1.1 / Math.max(size.x, size.z);
	table.scale.setScalar(k);
	const centre = box.getCenter(new Vector3());
	table.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);
	table.traverse((o) => {
		if ("isMesh" in o && o.isMesh) o.castShadow = o.receiveShadow = true;
	});
	ctx.root.add(table, contactShadow(0.75, 0.32));
	return {};
}
