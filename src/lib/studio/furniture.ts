/**
 * What the room's tables stand on, built as real furniture: powder-coated steel tube legs on levelling feet, a frame
 * under the top, brackets and bolt heads where they meet, and for a workbench a lower shelf, a cable tray under the back
 * edge and a power strip. One mesh per material (the parts are merged), so a table costs three or four draws.
 *
 * Not on the low tier: there each table keeps the plain top on four posts its own file builds.
 * The top itself stays with its table (room.ts, stations.ts, build-bench.ts): its size, height and place never change.
 */
import { BoxGeometry, type BufferGeometry, CanvasTexture, CylinderGeometry, Group, type Material, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";
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
