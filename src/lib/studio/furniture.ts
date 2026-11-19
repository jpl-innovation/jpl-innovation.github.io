/**
 * What the room's tables stand on, built as real furniture: powder-coated steel tube legs on levelling feet, a frame
 * under the top, brackets and bolt heads where they meet, and for a workbench a lower shelf, a cable tray under the back
 * edge and a power strip. One mesh per material (the parts are merged), so a table costs three or four draws.
 *
 * Not on the low tier: there each table keeps the plain top on four posts its own file builds.
 * The top itself stays with its table (room.ts, stations.ts, build-bench.ts): its size, height and place never change.
 */
import { BoxGeometry, BufferAttribute, type BufferGeometry, CanvasTexture, Color, CylinderGeometry, Group, LatheGeometry, type Material, Mesh, MeshStandardMaterial, PlaneGeometry, Quaternion, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { hardware } from "../three/finish";

export interface TableSpec {
	/** The middle of the table on the floor, its width (x) and depth (z), and the height of its top surface. */
	x: number;
	z: number;
	w: number;
	d: number;
	top: number;
	/** How thick the top is (the frame starts under it), default 3 cm. */
	thick?: number;
	/** What the feet stand on (a rug), default the floor. */
	floor?: number;
	/** How far the legs' middles are in from the top's edges, default 6 cm. */
	inset?: number;
	/** false: no rail under the front edge (+z), for knees and a chair's arms. */
	frontRail?: boolean;
	/** A lower shelf at this height. */
	shelf?: number;
	/** A workbench: a cable tray under the back edge and a power strip on the back rail. */
	bench?: boolean;
}

let shared: { coat: Material; foot: Material; bolt: Material; pale: Material; wear: Material } | undefined;
/** The furniture's own materials, one set for the whole room (the room's finishes: no new kind of shader). */
function materials() {
	if (shared) return shared;
	// Where hands and sleeves rest, the top is rubbed a little smoother and paler: a soft patch, lit as the top is.
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 64;
	const g = canvas.getContext("2d")!;
	g.fillStyle = "#000";
	g.fillRect(0, 0, 256, 64); // (an alpha map is read from the green channel: black is none)
	for (const [cx, rx] of [[78, 70], [178, 70], [128, 110]]) {
		const patch = g.createRadialGradient(cx, 64, 0, cx, 64, rx);
		patch.addColorStop(0, "rgba(255,255,255,0.5)");
		patch.addColorStop(1, "rgba(255,255,255,0)");
		g.fillStyle = patch;
		g.fillRect(0, 0, 256, 64);
	}
	return (shared = {
		coat: hardware({ color: 0x262c3a, roughness: 0.55, metalness: 0.1 }, "plastic"), // graphite powder coat
		foot: hardware({ color: 0x101216, roughness: 0.9 }, "rubber"),
		bolt: hardware({ color: 0xb8c0cc, roughness: 0.3, metalness: 0.9 }, "metal"),
		pale: hardware({ color: 0xe9e4d6, roughness: 0.5 }, "plastic"),
		wear: new MeshStandardMaterial({ color: 0xffffff, alphaMap: new CanvasTexture(canvas), transparent: true, opacity: 0.11, roughness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
	});
}

/** The frame, feet and fittings of one table, standing at (x, z). Returns its group. */
export function tableFrame(parent: Group, spec: TableSpec) {
	const { x, z, w, d, top, thick = 0.03, floor = 0, inset = 0.06, frontRail = true, shelf, bench } = spec;
	const mats = materials();
	const parts: Record<"coat" | "foot" | "bolt" | "pale", BufferGeometry[]> = { coat: [], foot: [], bolt: [], pale: [] };
	const put = (list: BufferGeometry[], geometry: BufferGeometry, px: number, py: number, pz: number) => {
		const g = geometry.index ? geometry.toNonIndexed() : geometry;
		g.translate(px, py, pz);
		list.push(g);
	};
	const box = (list: BufferGeometry[], bw: number, bh: number, bd: number, px: number, py: number, pz: number, radius = 0) =>
		put(list, radius ? new RoundedBoxGeometry(bw, bh, bd, 1, radius) : new BoxGeometry(bw, bh, bd), px, py, pz);

	const leg = 0.04; // square tube
	const under = top - thick; // the underside of the top
	const lx = w / 2 - inset;
	const lz = d / 2 - inset;
	const footH = 0.028;
	for (const sx of [-1, 1])
		for (const sz of [-1, 1]) {
			// A leg, and under it a levelling foot: a threaded stem into the tube and a rubber pad on the floor.
			box(parts.coat, leg, under - floor - footH, leg, sx * lx, floor + footH + (under - floor - footH) / 2, sz * lz, 0.004);
			put(parts.bolt, new CylinderGeometry(0.006, 0.006, footH, 8), sx * lx, floor + footH / 2 + 0.006, sz * lz);
			put(parts.foot, new CylinderGeometry(0.019, 0.022, 0.012, 16), sx * lx, floor + 0.006, sz * lz);
			// A bracket plate on the leg's outer side where the frame meets it, with two bolt heads.
			box(parts.coat, 0.003, 0.07, leg + 0.03, sx * (lx + leg / 2 + 0.0015), under - 0.04, sz * (lz - 0.015));
			for (const by of [0.022, 0.058]) put(parts.bolt, new CylinderGeometry(0.0055, 0.0055, 0.004, 6).rotateZ(Math.PI / 2), sx * (lx + leg / 2 + 0.004), under - by, sz * lz);
		}
	// The frame under the top: a rail along each side and the back (and the front, unless knees go there).
	const rail = 0.045;
	for (const sx of [-1, 1]) box(parts.coat, 0.02, rail, 2 * lz - leg, sx * lx, under - rail / 2, 0);
	for (const sz of frontRail ? [-1, 1] : [-1]) box(parts.coat, 2 * lx - leg, rail, 0.02, 0, under - rail / 2, sz * lz);
	if (shelf) {
		// A lower shelf on its own rails.
		box(parts.coat, 2 * lx - leg, 0.018, 2 * lz + leg, 0, shelf, 0, 0.004);
		for (const sz of [-1, 1]) box(parts.coat, 2 * lx - leg, 0.03, 0.02, 0, shelf - 0.024, sz * lz);
	} else {
		// A stretcher low between each pair of side legs, and one across the back.
		for (const sx of [-1, 1]) box(parts.coat, 0.02, 0.03, 2 * lz - leg, sx * lx, floor + 0.16, 0);
		box(parts.coat, 2 * lx - leg, 0.03, 0.02, 0, floor + 0.3, -lz);
	}
	if (bench) {
		// The cable tray: a steel channel hung under the back edge.
		const long = 2 * lx - 0.3;
		const tz = -lz + 0.085;
		box(parts.coat, long, 0.003, 0.1, 0, under - 0.115, tz);
		for (const sz of [-1, 1]) box(parts.coat, long, 0.035, 0.003, 0, under - 0.099, tz + sz * 0.05);
		for (const sx of [-1, 1]) box(parts.coat, 0.02, 0.115, 0.003, sx * (long / 2 - 0.05), under - 0.0575, tz - 0.05);
		// The power strip on the back rail, facing the room: its sockets, its switch, and its lead down the back leg.
		const sxAt = lx - 0.32;
		const sz = -lz + 0.01 + 0.02;
		box(parts.pale, 0.34, 0.042, 0.03, sxAt, under - 0.07, sz, 0.006);
		for (let i = 0; i < 4; i++) put(parts.foot, new CylinderGeometry(0.014, 0.014, 0.003, 14).rotateX(Math.PI / 2), sxAt - 0.12 + i * 0.062, under - 0.07, sz + 0.016);
		box(parts.foot, 0.018, 0.014, 0.004, sxAt + 0.145, under - 0.07, sz + 0.016);
		box(parts.foot, 0.007, under - 0.09 - floor, 0.007, lx - leg / 2 - 0.006, floor + (under - 0.09 - floor) / 2, -lz + leg / 2 + 0.006);
	}

	const group = new Group();
	group.position.set(x, 0, z);
	for (const key of Object.keys(parts) as (keyof typeof parts)[]) if (parts[key].length) group.add(new Mesh(mergeGeometries(parts[key], false)!, mats[key]));
	// Wear on the top, along the front edge.
	const wear = new Mesh(new PlaneGeometry(Math.min(0.9, w * 0.6), 0.2), mats.wear);
	wear.rotation.x = -Math.PI / 2;
	wear.position.set(0, top + 0.0003, d / 2 - 0.1);
	wear.userData.shadow = false;
	group.add(wear);
	parent.add(group);
	return group;
}

/**
 * Many small coloured parts as one mesh: each keeps its own colour (in its vertices), and the lot is drawn once. The
 * parts are given in the room's coordinates; the mesh stands at `origin` (the room finds what the desk lamp reaches by that).
 */
export class Batch {
	private list: BufferGeometry[] = [];
	constructor(private origin: [number, number, number]) {}
	add(geometry: BufferGeometry, color: number, x: number, y: number, z: number) {
		const g = geometry.index ? geometry.toNonIndexed() : geometry;
		g.translate(x - this.origin[0], y - this.origin[1], z - this.origin[2]);
		const c = new Color(color);
		const count = g.getAttribute("position").count;
		const colors = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3);
		g.setAttribute("color", new BufferAttribute(colors, 3));
		this.list.push(g);
		return this;
	}
	box(w: number, h: number, d: number, x: number, y: number, z: number, color: number, radius = 0) {
		return this.add(radius ? new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w / 2, h / 2, d / 2)) : new BoxGeometry(w, h, d), color, x, y, z);
	}
	/** Puts the lot in the room as one mesh (`material`: default the room's coloured plastic). */
	mesh(parent: Group, material: Material = painted()) {
		const mesh = new Mesh(mergeGeometries(this.list, false)!, material);
		mesh.position.set(...this.origin);
		parent.add(mesh);
		return mesh;
	}
}

let paint: Material | undefined;
/** Moulded or painted parts that take their colour from a Batch: one material for all of them. */
export const painted = () => (paint ??= hardware({ color: 0xffffff, roughness: 0.5, vertexColors: true }, "plastic"));

const GRAPHITE = 0x262c3a;
const STEEL = 0xaab2c0;
const PAPER = 0xf1ecdf;

/**
 * A lever-arch binder standing on a shelf at (x, y, z): its covers and spine, the paper between them, a label in its
 * holder and a finger ring on the spine, a steel edge at the foot. `face` +1: the spine toward +z; `lean`: tipped over (radians).
 */
export function binder(batch: Batch, x: number, y: number, z: number, color: number, face: 1 | -1 = 1, lean = 0, w = 0.07, h = 0.3, d = 0.24) {
	const part = (geometry: BufferGeometry, c: number, px: number, py: number, pz: number) => {
		geometry.translate(px, py + h / 2, pz * face);
		if (lean) geometry.rotateZ(lean);
		batch.add(geometry, c, x, y, z);
	};
	const spine = d / 2;
	part(new RoundedBoxGeometry(w, h, 0.005, 1, 0.002), color, 0, 0, spine - 0.0025);
	for (const s of [-1, 1]) part(new BoxGeometry(0.003, h, d - 0.004), color, s * (w / 2 - 0.0015), 0, -0.002);
	part(new BoxGeometry(w - 0.014, h - 0.024, d - 0.03), PAPER, 0, -0.004, -0.012);
	part(new BoxGeometry(w * 0.62, h * 0.3, 0.0012), PAPER, 0, h * 0.2, spine + 0.0004);
	part(new CylinderGeometry(0.013, 0.013, 0.0016, 18).rotateX(Math.PI / 2), STEEL, 0, -h * 0.3, spine + 0.0004);
	part(new CylinderGeometry(0.0095, 0.0095, 0.002, 18).rotateX(Math.PI / 2), 0x0b0e16, 0, -h * 0.3, spine + 0.0006);
	part(new BoxGeometry(w, 0.007, 0.0014), STEEL, 0, -h / 2 + 0.0035, spine + 0.0004);
}

/** A storage bin (x, y its foot, z; w wide, h tall, d deep): moulded plastic, wider at its rim, with a label in a holder on its front (+z). */
export function bin(batch: Batch, x: number, y: number, z: number, w: number, h: number, d: number, color: number) {
	const body = new RoundedBoxGeometry(w, h, d, 1, 0.012);
	const position = body.getAttribute("position");
	for (let i = 0; i < position.count; i++) {
		const taper = 0.9 + 0.1 * (position.getY(i) / h + 0.5); // narrower at the foot
		position.setX(i, position.getX(i) * taper);
		position.setZ(i, position.getZ(i) * taper);
	}
	body.computeVertexNormals();
	batch.add(body, color, x, y + h / 2, z);
	batch.box(w + 0.012, 0.014, d + 0.012, x, y + h - 0.007, z, color, 0.005); // the rim
	batch.box(w - 0.012, 0.002, d - 0.012, x, y + h + 0.0006, z, 0x0d1118); // the dark inside, seen from above
	batch.box(w * 0.42, h * 0.3, 0.002, x, y + h * 0.5, z + d / 2 - 0.004, PAPER); // the label
	batch.box(w * 0.48, 0.006, 0.004, x, y + h * 0.34, z + d / 2 - 0.003, color);
}

let kraft: Material | undefined;
/** Plain cardboard: kraft brown with its fibres and the faint lines of the flutes under the liner. */
export function cardboard() {
	if (kraft) return kraft;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 256;
	const g = canvas.getContext("2d")!;
	g.fillStyle = "#b9925f";
	g.fillRect(0, 0, 256, 256);
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	for (let i = 0; i < 2600; i++) {
		g.fillStyle = random() > 0.5 ? "rgba(255,240,210,0.07)" : "rgba(70,45,20,0.07)";
		g.fillRect(random() * 256, random() * 256, 1 + random() * 7, 1);
	}
	g.fillStyle = "rgba(60,40,20,0.035)";
	for (let y = 0; y < 256; y += 4) g.fillRect(0, y, 256, 1);
	const map = new CanvasTexture(canvas);
	map.colorSpace = SRGBColorSpace;
	map.anisotropy = 8;
	return (kraft = hardware({ color: 0xffffff, roughness: 0.85, map }, "printed"));
}

/**
 * A clean cardboard box (x, y its foot, z): crisp edges, its two top flaps meeting in a seam, and a strip of tape along
 * the seam and a little way down each end. `card` takes the cardboard, `tape` the tape (a Batch each, for one draw each).
 */
export function cardboardBox(card: Batch, tape: Batch, x: number, y: number, z: number, w: number, h: number, d: number) {
	card.box(w, h - 0.003, d, x, y + (h - 0.003) / 2, z, 0xffffff, 0.0015);
	for (const s of [-1, 1]) card.box(w / 2 - 0.0008, 0.003, d - 0.001, x + s * (w / 4 + 0.0004), y + h - 0.0015, z, 0xffffff); // the flaps
	const TAPE = 0xcdb083;
	tape.box(0.05, 0.0012, d + 0.002, x, y + h + 0.0004, z, TAPE);
	for (const s of [-1, 1]) tape.box(0.05, 0.055, 0.0012, x, y + h - 0.0275, z + s * (d / 2 + 0.0005), TAPE);
}

/**
 * A steel shelving frame (its boards are the room's own wood): four angle posts on feet with a bolt at every board, and
 * a brace under each board's ends. `x`, `z` its middle; `boards` the heights of the boards' middles.
 */
export function shelvingFrame(batch: Batch, x: number, z: number, width: number, depth: number, boards: number[]) {
	const height = boards[boards.length - 1] + 0.12;
	for (const sx of [-1, 1])
		for (const sz of [-1, 1]) {
			const px = x + sx * (width / 2 - 0.002);
			const pz = z + sz * (depth / 2 - 0.002);
			// An angle post: two flanges.
			batch.box(0.036, height, 0.003, px - sx * 0.018, height / 2, pz, GRAPHITE);
			batch.box(0.003, height, 0.036, px, height / 2, pz - sz * 0.018, GRAPHITE);
			batch.add(new CylinderGeometry(0.02, 0.022, 0.008, 12), 0x0d1016, px - sx * 0.012, 0.004, pz - sz * 0.012);
			for (const y of boards) {
				if (sz > 0) batch.add(new CylinderGeometry(0.005, 0.005, 0.004, 6).rotateX(Math.PI / 2), STEEL, px - sx * 0.018, y, pz + 0.003);
				batch.add(new CylinderGeometry(0.005, 0.005, 0.004, 6).rotateZ(Math.PI / 2), STEEL, px + sx * 0.003, y, pz - sz * 0.018);
			}
		}
	for (const y of boards) for (const sx of [-1, 1]) batch.box(0.003, 0.03, depth - 0.04, x + sx * (width / 2 - 0.006), y - 0.03, z, GRAPHITE);
}

/** A spun lamp shade: a closed neck, a bell and a rolled rim. It opens toward -y, its neck at the origin; `rim` its radius, `length` its depth. */
export function lampShade(rim: number, length: number) {
	const profile = [
		[0.001, 0.012], [rim * 0.3, 0.012], [rim * 0.34, 0], [rim * 0.36, -length * 0.18], [rim * 0.62, -length * 0.55], [rim * 0.94, -length * 0.93], [rim, -length], [rim * 1.03, -length * 1.01], [rim * 1.03, -length * 1.04], [rim * 0.99, -length * 1.04],
	];
	return new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 28);
}

/** A round bar from `a` to `b`. */
export function barGeometry(a: Vector3, b: Vector3, radius: number, sides = 10) {
	const d = b.clone().sub(a);
	const g = new CylinderGeometry(radius, radius, d.length(), sides);
	g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize()));
	g.translate(a.x + d.x / 2, a.y + d.y / 2, a.z + d.z / 2);
	return g;
}

/**
 * A desk lamp's body into `batch` (painted steel): a weighted base with a lip and a rocker switch, a two-bar arm from
 * `base` over `elbow` to `head`, and a knuckle with a wing nut at each joint. The shade and the bulb are the caller's.
 */
export function lampBody(batch: Batch, base: Vector3, elbow: Vector3, head: Vector3, baseRadius = 0.065) {
	batch.add(new CylinderGeometry(baseRadius * 0.93, baseRadius, 0.016, 28), GRAPHITE, base.x, base.y + 0.008, base.z);
	batch.add(new CylinderGeometry(baseRadius * 0.55, baseRadius * 0.9, 0.012, 28), GRAPHITE, base.x, base.y + 0.022, base.z);
	batch.box(0.016, 0.006, 0.01, base.x + baseRadius * 0.55, base.y + 0.027, base.z + baseRadius * 0.3, 0xe9e4d6, 0.002);
	const foot = new Vector3(base.x, base.y + 0.03, base.z);
	// Two thin bars side by side on each run of the arm, as a sprung lamp has.
	const side = new Vector3().crossVectors(elbow.clone().sub(foot), new Vector3(0, 1, 0.3)).normalize().multiplyScalar(0.009);
	for (const [a, b] of [[foot, elbow], [elbow, head]])
		for (const s of [-1, 1]) batch.add(barGeometry(a.clone().addScaledVector(side, s), b.clone().addScaledVector(side, s), 0.0045, 8), GRAPHITE, 0, 0, 0);
	for (const joint of [foot, elbow, head]) {
		batch.add(new SphereGeometry(0.014, 12, 8), GRAPHITE, joint.x, joint.y, joint.z);
		batch.add(barGeometry(joint.clone().addScaledVector(side, -2.2), joint.clone().addScaledVector(side, 2.2), 0.006, 6), STEEL, 0, 0, 0);
	}
}

const decks = new Map<boolean, Material>();
/**
 * The top of a keyboard, lying flat (w by d, its front toward +z): rows of key caps, and for a laptop the palm rest and
 * its trackpad. A picture drawn here, lit as the case is; one material for each kind in the whole room.
 */
export function keyDeck(w: number, d: number, laptop: boolean) {
	let material = decks.get(laptop);
	if (!material) {
		const canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = laptop ? 384 : 160;
		const g = canvas.getContext("2d")!;
		g.fillStyle = laptop ? "#aeb6c4" : "#161a24";
		g.fillRect(0, 0, canvas.width, canvas.height);
		const rows = 5;
		const keysTop = laptop ? 26 : 10;
		const keysH = laptop ? 190 : 140;
		if (laptop) {
			g.fillStyle = "#11141b"; // the well the keys sit in
			g.fillRect(22, keysTop - 6, 468, keysH + 12);
		}
		for (let row = 0; row < rows; row++) {
			const y = keysTop + (row * keysH) / rows;
			const h = keysH / rows - 5;
			let x = 28;
			const widths = row === 4 ? [34, 34, 34, 190, 34, 34, 34] : Array.from({ length: 14 }, (_, i) => (i === 0 ? 28 + row * 7 : i === 13 ? 50 - row * 7 : 28.6));
			for (const kw of widths) {
				g.fillStyle = "#2b303c";
				g.fillRect(x, y, kw - 4, h);
				g.fillStyle = "rgba(255,255,255,0.05)"; // the cap's top edge catching the light
				g.fillRect(x, y, kw - 4, 2);
				x += kw + (row === 4 ? 2.5 : 4.2);
			}
		}
		if (laptop) {
			g.strokeStyle = "rgba(40,48,62,0.5)";
			g.lineWidth = 2;
			g.strokeRect(176, 246, 160, 112);
			g.fillStyle = "rgba(255,255,255,0.08)";
			g.fillRect(177, 247, 158, 110);
		}
		const map = new CanvasTexture(canvas);
		map.colorSpace = SRGBColorSpace;
		map.anisotropy = 8;
		decks.set(laptop, (material = new MeshStandardMaterial({ map, roughness: 0.55, metalness: laptop ? 0.4 : 0 })));
	}
	const mesh = new Mesh(new PlaneGeometry(w, d), material);
	mesh.rotation.x = -Math.PI / 2;
	return mesh;
}

/** A mug standing at (x, y, z): thrown walls with a rim and an inside, a handle (turned by `turn`), and what is left of the coffee. */
export function mug(batch: Batch, x: number, y: number, z: number, color: number, turn = 0) {
	const wall = [[0, 0], [0.034, 0], [0.037, 0.004], [0.04, 0.096], [0.0385, 0.1], [0.0365, 0.097], [0.0335, 0.012], [0, 0.01]];
	batch.add(new LatheGeometry(wall.map(([r, h]) => new Vector2(r, h)), 24), color, x, y, z);
	batch.add(new TorusGeometry(0.026, 0.006, 8, 16, Math.PI).rotateZ(-Math.PI / 2).translate(0.039, 0.05, 0).rotateY(turn), color, x, y, z);
	batch.add(new CylinderGeometry(0.0345, 0.0345, 0.002, 20), 0x2a1a10, x, y + 0.07, z);
}

/** A notebook lying at (x, y, z), turned by `turn`: a cover a little larger than its block of pages, an elastic band and a ribbon. */
export function notebook(batch: Batch, x: number, y: number, z: number, w: number, d: number, color: number, turn = 0) {
	const part = (geometry: BufferGeometry, c: number) => batch.add(geometry.rotateY(turn), c, x, y, z);
	part(new RoundedBoxGeometry(w, 0.002, d, 1, 0.001).translate(0, 0.001, 0), color);
	part(new BoxGeometry(w - 0.006, 0.01, d - 0.006).translate(0.001, 0.007, 0), PAPER);
	part(new RoundedBoxGeometry(w, 0.002, d, 1, 0.001).translate(0, 0.013, 0), color);
	part(new BoxGeometry(0.007, 0.0164, d + 0.001).translate(w / 2 - 0.022, 0.0072, 0), 0x12151c); // the elastic band
	part(new BoxGeometry(0.005, 0.0006, 0.03).translate(-w * 0.2, 0.0005, d / 2 + 0.012), 0xf5d042); // the ribbon
}

const YELLOW = 0xf5d042;
const NAVY = 0x1b2d6e;

/** A steel toolbox on the floor at (x, z), w by h by d with its lid: a ribbed body, a lid with a carrying handle on two posts, two latches and their catches. */
export function toolbox(batch: Batch, x: number, z: number, w = 0.52, h = 0.22, d = 0.26) {
	batch.box(w, h, d, x, h / 2, z, YELLOW, 0.012);
	for (const y of [0.3, 0.55, 0.8]) batch.box(w + 0.004, 0.008, d + 0.004, x, h * y, z, YELLOW, 0.003); // pressed ribs
	batch.box(w + 0.006, 0.05, d + 0.006, x, h + 0.025, z, GRAPHITE, 0.012); // the lid
	batch.box(w * 0.5, 0.004, d * 0.4, x, h + 0.051, z, 0x1a1f2b, 0.002); // the handle's well
	for (const s of [-1, 1]) batch.box(0.012, 0.03, 0.012, x + s * 0.09, h + 0.064, z, STEEL, 0.003);
	batch.add(new CylinderGeometry(0.009, 0.009, 0.2, 12).rotateZ(Math.PI / 2), 0x12151c, x, h + 0.08, z);
	for (const s of [-1, 1]) {
		batch.box(0.036, 0.05, 0.006, x + s * w * 0.3, h - 0.005, z + d / 2 + 0.004, STEEL, 0.002); // a latch
		batch.box(0.026, 0.008, 0.01, x + s * w * 0.3, h + 0.012, z + d / 2 + 0.006, STEEL, 0.002);
		batch.box(0.05, 0.02, 0.006, x + s * w * 0.3, h - 0.004, z - d / 2 - 0.003, STEEL); // a hinge
	}
}

/** A robot wheel lying flat, its foot at (x, y, z): a rubber tyre with rounded shoulders on a hub with a bolt circle. */
export function wheel(batch: Batch, x: number, y: number, z: number, radius = 0.1, width = 0.05) {
	const half = width / 2;
	const tyre = [[radius * 0.62, 0], [radius * 0.93, 0], [radius, half * 0.35], [radius, half * 1.65], [radius * 0.93, width], [radius * 0.62, width]];
	batch.add(new LatheGeometry(tyre.map(([r, h]) => new Vector2(r, h)), 28), 0x14171f, x, y, z);
	for (let i = 0; i < 28; i++) {
		// The tread: blocks round the edge.
		const a = (i / 28) * Math.PI * 2;
		batch.add(new BoxGeometry(0.008, width * 0.8, 0.012).rotateY(-a), 0x0c0e13, x + Math.cos(a) * radius, y + half, z + Math.sin(a) * radius);
	}
	batch.add(new CylinderGeometry(radius * 0.64, radius * 0.64, width * 0.86, 24), 0xd8dde6, x, y + half, z);
	batch.add(new CylinderGeometry(radius * 0.2, radius * 0.2, width * 0.9, 12), 0x2a2f3a, x, y + half, z);
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2;
		batch.add(new CylinderGeometry(0.006, 0.006, width * 0.9, 6), 0x40464f, x + Math.cos(a) * radius * 0.42, y + half, z + Math.sin(a) * radius * 0.42);
	}
}

/** A cable spool standing on one flange at (x, z): two flanges, a core, and the cable wound between them. */
export function spool(batch: Batch, x: number, z: number, radius = 0.11, height = 0.12) {
	for (const y of [0.006, height - 0.006]) {
		batch.add(new CylinderGeometry(radius, radius, 0.012, 28), NAVY, x, y, z);
		batch.add(new CylinderGeometry(radius * 0.3, radius * 0.3, 0.014, 16), 0x10131a, x, y, z);
	}
	batch.add(new CylinderGeometry(radius * 0.42, radius * 0.42, height, 16), 0x2a2f3a, x, height / 2, z);
	const turns = 6;
	for (let i = 0; i < turns; i++) batch.add(new TorusGeometry(radius * 0.72, (height - 0.024) / turns / 2, 6, 28).rotateX(Math.PI / 2), YELLOW, x, 0.012 + ((i + 0.5) * (height - 0.024)) / turns, z);
}

/** A steel bracket under a wall shelf at (x, y the shelf's underside, z the wall): an arm out from the wall, a leg down it, a strut between, and two screws. */
export function wallBracket(batch: Batch, x: number, y: number, wall: number, reach: number, out: 1 | -1 = 1) {
	batch.box(0.022, 0.004, reach, x, y - 0.002, wall + (out * reach) / 2, GRAPHITE);
	batch.box(0.022, reach * 0.7, 0.004, x, y - reach * 0.35, wall + out * 0.002, GRAPHITE);
	batch.add(barGeometry(new Vector3(x, y - 0.006, wall + out * reach * 0.8), new Vector3(x, y - reach * 0.62, wall + out * 0.006), 0.004, 6), GRAPHITE, 0, 0, 0);
	for (const dy of [0.2, 0.5]) batch.add(new CylinderGeometry(0.004, 0.004, 0.003, 6).rotateX(Math.PI / 2), STEEL, x, y - reach * dy, wall + out * 0.005);
}

/**
 * A hand tool hanging on a pegboard, its top at (x, y) and the board at z: a screwdriver (a turned handle and a blade)
 * or a spanner (a flat bar with a jaw at each end), on a steel hook.
 */
export function hungTool(batch: Batch, x: number, y: number, z: number, length: number, color: number, spanner: boolean) {
	batch.add(barGeometry(new Vector3(x, y + 0.012, z), new Vector3(x, y + 0.012, z + 0.03), 0.003, 6), STEEL, 0, 0, 0); // the hook
	batch.add(barGeometry(new Vector3(x, y + 0.012, z + 0.03), new Vector3(x, y + 0.026, z + 0.03), 0.003, 6), STEEL, 0, 0, 0);
	if (spanner) {
		batch.box(0.016, length, 0.005, x, y - length / 2, z + 0.02, STEEL, 0.002);
		for (const s of [0, 1]) batch.add(new TorusGeometry(0.016, 0.005, 6, 14, Math.PI * 1.5).rotateZ(s ? Math.PI * 0.75 : -Math.PI * 0.25), STEEL, x, y - s * length, z + 0.02);
		return;
	}
	const grip = length * 0.42;
	batch.add(new CylinderGeometry(0.011, 0.014, grip, 12), color, x, y - grip / 2, z + 0.02);
	batch.add(new SphereGeometry(0.0115, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), color, x, y, z + 0.02);
	batch.add(new CylinderGeometry(0.0085, 0.006, 0.014, 10), 0x12151c, x, y - grip - 0.007, z + 0.02);
	batch.add(new CylinderGeometry(0.0035, 0.0035, length - grip, 8), STEEL, x, y - grip - (length - grip) / 2, z + 0.02);
}

/** A LiPo pack lying at (x, y, z): its wrapped cells, a label, and its lead with a plug. */
export function lipo(batch: Batch, x: number, y: number, z: number) {
	batch.box(0.14, 0.036, 0.046, x, y + 0.018, z, 0x161a24, 0.008);
	batch.box(0.08, 0.001, 0.03, x - 0.01, y + 0.0365, z, YELLOW);
	batch.add(barGeometry(new Vector3(x + 0.07, y + 0.02, z), new Vector3(x + 0.1, y + 0.008, z + 0.012), 0.003, 6), 0x0c0e13, 0, 0, 0);
	batch.box(0.016, 0.01, 0.012, x + 0.106, y + 0.006, z + 0.014, YELLOW, 0.002);
}
