/**
 * What the room's tables stand on, built as real furniture: powder-coated steel tube legs on levelling feet, a frame
 * under the top, brackets and bolt heads where they meet, and for a workbench a lower shelf, a cable tray under the back
 * edge and a power strip. One mesh per material (the parts are merged), so a table costs three or four draws.
 *
 * Not on the low tier: there each table keeps the plain top on four posts its own file builds.
 * The top itself stays with its table (room.ts, stations.ts, build-bench.ts): its size, height and place never change.
 */
import { BoxGeometry, BufferAttribute, type BufferGeometry, CanvasTexture, Color, CylinderGeometry, Group, type Material, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
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
