/**
 * The walls' own looks (preview: ?walls=a|b|c), each zone of the room its own treatment, over the plain painted shell
 * (room.ts), on the medium and high tiers only; phones and the low tier keep the plain walls.
 *
 *   a  Navy studio      the desk's wall deep navy, matt; the workshop painted brick; services along the top
 *   b  Oak & blueprint  the desk's wall oak slats on a dark ground; the workshop formed concrete, an F450 drawn on it
 *   c  Concrete & felt  board-formed concrete; navy and yellow felt panels, where a workshop needs them
 *
 * Every look: a skirting board all round, a shadow gap under the ceiling, the logo standing off the wall with its
 * shadow, a lower band and a dado rail by the door. The surfaces are real (Poly Haven, CC0) and use the walls' own kind
 * of material (a colour map, bumps and shine), so they add textures but no shader.
 */
import { BoxGeometry, CanvasTexture, CylinderGeometry, type Group, type Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Batch } from "./furniture";
import { hardware } from "../three/finish";
import { loadImage, metreUv, ROOM, surface, tiled, tint, woodMaterial } from "./room";

export type WallLook = "a" | "b" | "c";
let brassMat: Material | undefined;
/** Brass, a few touches of it (look b): the picture light, the plate's edge, the desk lamp, the tray's brackets, the coat pegs, the door handle. */
export const brass = () => (brassMat ??= hardware({ color: 0xc09a5b, roughness: 0.32, metalness: 1 }, "metal"));
export function wallLook(): WallLook | undefined {
	const v = new URLSearchParams(location.search).get("walls");
	return v === "a" || v === "b" || v === "c" ? v : undefined;
}

/** Where the front wall's zones meet (x, m): the desk's wall, the workshop, then the project wall (left as it is). */
const DESK_END = -4.72;
const SHOP_END = 3.7;
const DOOR = { a: -6.3, b: -4.2, gap0: -6.12, gap1: -5.08 }; // the pier round the door, and its opening
const RAIL = 1.0; // the dado rail's height by the door

type Tinted = { mat: MeshStandardMaterial; light: number; dark: number };

export function buildWalls(group: Group, look: WallLook, logo: Mesh, slogan: Mesh, logoOnDark: (yes: boolean) => void) {
	const { x0, x1, z0, z1, h } = ROOM;
	const tinted: Tinted[] = [];
	const paint = (name: string, light: number, dark: number, normal = 0.6, roughness = 0.95) => {
		const mat = new MeshStandardMaterial({ ...surface(name, normal), roughness });
		tinted.push({ mat, light, dark });
		return mat;
	};
	/** A flat panel of `mat` on the front (z0) or back (z1) wall, from xa to xb and ya to yb, its surface tiling every `tile` m. */
	const panel = (mat: Material, xa: number, xb: number, ya: number, yb: number, tile: number, back = false, lift = 0.004) => {
		const mesh = new Mesh(tiled(new PlaneGeometry(xb - xa, yb - ya), tile), mat);
		mesh.position.set((xa + xb) / 2, (ya + yb) / 2, back ? z1 - lift : z0 + lift);
		if (back) mesh.rotation.y = Math.PI;
		mesh.receiveShadow = true;
		group.add(mesh);
		return mesh;
	};
	const trim = new Batch([0, 0, 0]);
	const brassy = new Batch([0, 0, 0]); // (look b's brass touches: one mesh)

	/* ---------- Every look: skirting, the shadow gap under the ceiling ---------- */
	const SKIRT = 0.12;
	const runs: [number, number, number, number][] = [
		// [from, to, the wall's z, which way it faces]: the front, the back on either side of the door
		[x0, x1, z0, 1],
		[x0, DOOR.gap0, z1, -1],
		[DOOR.gap1, x1, z1, -1],
	];
	for (const [a, b, z, f] of runs) {
		trim.box(b - a, SKIRT, 0.018, (a + b) / 2, SKIRT / 2, z + f * 0.009, 0x262c3a, 0.003);
		trim.box(b - a, 0.008, 0.022, (a + b) / 2, SKIRT - 0.004, z + f * 0.011, 0x343b4b, 0.003); // its rounded top
	}
	trim.box(x1 - x0, 0.022, 0.006, 0, h - 0.011, z0 + 0.003, 0x05070b); // the shadow gap, front
	for (const x of [x0, x1]) {
		const f = x < 0 ? 1 : -1;
		trim.box(0.018, SKIRT, z1 - z0, x + f * 0.009, SKIRT / 2, (z0 + z1) / 2, 0x262c3a, 0.003);
		trim.box(0.006, 0.022, z1 - z0, x + f * 0.003, h - 0.011, (z0 + z1) / 2, 0x05070b);
	}

	/* ---------- Every look: the door's pier, a lower band and a dado rail to take the knocks ---------- */
	const bandLight = look === "b" ? 0x262c3a : 0x1b2d6e;
	const bandDark = look === "b" ? 0x1b2029 : 0x111c4c;
	const band = paint("painted_plaster_wall", bandLight, bandDark, 0.5, 0.9);
	panel(band, DOOR.a, DOOR.gap0, SKIRT, RAIL, 2.4, true, 0.003);
	panel(band, DOOR.gap1, DOOR.b, SKIRT, RAIL, 2.4, true, 0.003);
	const sill = look === "b" ? 0.3 : 0.85; // (look b's glass comes down to a low ledge: room.ts)
	panel(band, x0, DOOR.a, SKIRT, sill, 2.4, true, 0.0025); // under the sill, the rest of the back wall
	panel(band, DOOR.b, x1, SKIRT, sill, 2.4, true, 0.0025);
	const railMat = look === "c" ? new MeshStandardMaterial({ color: 0x262c3a, roughness: 0.6 }) : woodMaterial("oak_veneer_01");
	group.add(new Mesh(railGeometry([[DOOR.a, DOOR.gap0 - 0.06], [DOOR.gap1 + 0.06, DOOR.b]], RAIL, z1), railMat));

	/* ---------- Every look: the logo stands off the wall on pins, its shadow on the wall behind ---------- */
	logo.position.z = z0 + 0.045;
	const shadowMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
	const shadow = new Mesh(new PlaneGeometry(1.66 * (512 / 480), 0.6 * (186 / 173)), shadowMat);
	shadow.position.set(logo.position.x + 0.014, logo.position.y - 0.024, z0 + 0.006);
	shadow.userData.shadow = false;
	group.add(shadow);
	void loadImage("/assets/jpl-logo-light-480.webp").then((image) => {
		const c = document.createElement("canvas");
		c.width = 512;
		c.height = 186;
		const g = c.getContext("2d")!;
		g.filter = "blur(5px)";
		g.drawImage(image, 16, 6, 480, 173);
		g.filter = "none";
		g.globalCompositeOperation = "source-in";
		g.fillStyle = "#000";
		g.fillRect(0, 0, 512, 186);
		const map = new CanvasTexture(c);
		map.colorSpace = SRGBColorSpace;
		shadowMat.map = map;
		shadowMat.opacity = 0.42;
		shadowMat.needsUpdate = true;
	});

	/* ---------- The workshop's services ---------- */
	const services = () => {
		// Along the top of the workshop's wall a steel cable tray on brackets, a conduit under it on saddle clips, dropping
		// to a double socket and a switch over each bench.
		const y = 2.78;
		const run = SHOP_END - 0.05 - DESK_END;
		trim.box(run, 0.004, 0.16, (DESK_END + SHOP_END) / 2, y, z0 + 0.1, 0x8a93a3);
		for (const s of [0, 1]) trim.box(run, 0.05, 0.003, (DESK_END + SHOP_END) / 2, y + 0.025, z0 + 0.02 + s * 0.16, 0x8a93a3);
		const brackets = look === "b" ? brassy : trim;
		for (let x = DESK_END + 0.3; x < SHOP_END; x += 1.2) {
			brackets.box(0.03, 0.12, 0.004, x, y - 0.04, z0 + 0.004, 0x5d6577);
			brackets.box(0.03, 0.004, 0.18, x, y - 0.004, z0 + 0.09, 0x5d6577);
		}
		const pipe = (xa: number, ya: number, xb: number, yb: number) => {
			const g = new CylinderGeometry(0.011, 0.011, Math.hypot(xb - xa, yb - ya), 10);
			if (ya === yb) g.rotateZ(Math.PI / 2);
			trim.add(g, 0xaab2c0, (xa + xb) / 2, (ya + yb) / 2, z0 + 0.016);
		};
		const cy = 2.62;
		pipe(DESK_END + 0.1, cy, SHOP_END - 0.15, cy);
		for (let x = DESK_END + 0.4; x < SHOP_END - 0.2; x += 0.8) trim.box(0.018, 0.03, 0.03, x, cy, z0 + 0.016, 0x8a93a3, 0.004);
		for (const x of [-3.38, -1.72, 0.42, 2.22]) {
			pipe(x, 1.12, x, cy);
			trim.box(0.09, 0.14, 0.04, x + 0.075, 1.07, z0 + 0.02, 0xe9e4d6, 0.006); // the socket box
			for (const dy of [-0.033, 0.033]) {
				trim.box(0.05, 0.05, 0.004, x + 0.075, 1.07 + dy, z0 + 0.041, 0xf2eedf, 0.006);
				for (const dx of [-0.009, 0.009]) trim.box(0.004, 0.009, 0.002, x + 0.075 + dx, 1.07 + dy + 0.004, z0 + 0.0435, 0x07090d);
			}
			trim.box(0.07, 0.07, 0.03, x - 0.07, 1.07, z0 + 0.015, 0xe9e4d6, 0.006); // its switch
			trim.box(0.022, 0.034, 0.006, x - 0.07, 1.07, z0 + 0.032, 0xf2eedf, 0.003);
		}
	};

	/* ---------- The looks ---------- */
	const logoDark = true;
	if (look === "a") {
		// The desk's wall in deep navy, matt; the logo's light version on it in both themes.
		panel(paint("painted_plaster_wall", 0x14235e, 0x0f1a48, 0.6, 1), x0, DESK_END, 0, h, 2.4);
		panel(paint("painted_brick", 0xe6e1d2, 0x2a3044, 0.9, 1), DESK_END, SHOP_END, 0, h, 1.8);
		trim.box(0.03, h - 0.02, 0.02, DESK_END, h / 2, z0 + 0.01, 0x262c3a, 0.004); // a steel edge where the two meet
		services();
	} else if (look === "b") {
		// Oak slats on a dark ground behind the desk; the workshop's formed concrete, an F450 drawn large on it.
		const RETURN = 0.6; // (m: how far the slats turn the corner; 1 m reached the opening words)
		const darkGround = paint("painted_plaster_wall", 0x0b1230, 0x070c22, 0.3, 1);
		panel(darkGround, x0, DESK_END, 0, h, 2.4);
		const slats: BoxGeometry[] = [];
		// (Round the corkboard (room.ts, desk-sheets.ts) the slats stop, so the board sits inset in the panel.)
		const CORK = { x0: -7.55, x1: -6.83, y0: 1.27, y1: 2.35 };
		const slat = (x: number, y0: number, y1: number) => {
			const g = new BoxGeometry(0.046, y1 - y0, 0.022);
			metreUv(g, [0.046, y1 - y0, 0.022], (x * 7.31) % 1);
			slats.push(g.translate(x, (y0 + y1) / 2, z0 + 0.012) as BoxGeometry);
		};
		for (let x = x0 + 0.04; x < DESK_END - 0.03; x += 0.064) {
			if (x > CORK.x0 && x < CORK.x1) {
				slat(x, 0.015, CORK.y0);
				slat(x, CORK.y1, h - 0.035);
			} else slat(x, 0.015, h - 0.035);
		}
		// The left wall by the shelves: the slats turn the corner for a short return on their dark ground, ending on a brass
		// edge, so the panel reads as wrapping the corner; beyond, the door's lower band and oak rail all along that wall,
		// plaster above. (The page's opening words lie over the rest of this wall at the title: slats behind them were
		// hard to read in the light theme, so the return stays short.)
		const WRAP = z0 + RETURN;
		for (let z = z0 + 0.04; z < WRAP - 0.02; z += 0.064) {
			const g = new BoxGeometry(0.022, h - 0.05, 0.046);
			metreUv(g, [0.022, h - 0.05, 0.046], (z * 5.17) % 1);
			slats.push(g.translate(x0 + 0.012, h / 2 - 0.01, z) as BoxGeometry);
		}
		const returnGround = new Mesh(tiled(new PlaneGeometry(RETURN, h), 2.4), darkGround);
		returnGround.rotation.y = Math.PI / 2;
		returnGround.position.set(x0 + 0.002, h / 2, z0 + RETURN / 2);
		group.add(returnGround);
		brassy.box(0.03, h - 0.05, 0.012, x0 + 0.015, h / 2 - 0.01, WRAP + 0.006, 0xc09a5b);
		const SIDE = 0.78; // (lower than the door's: clear of the opening words at the title)
		const side = new Mesh(tiled(new PlaneGeometry(z1 - WRAP, SIDE - SKIRT), 2.4), band);
		side.rotation.y = Math.PI / 2;
		side.position.set(x0 + 0.003, (SKIRT + SIDE) / 2, (WRAP + z1) / 2);
		side.receiveShadow = true;
		group.add(side);
		const sideRail = new BoxGeometry(0.022, 0.045, z1 - WRAP - 0.02);
		metreUv(sideRail, [0.022, 0.045, z1 - WRAP], 0.4);
		group.add(new Mesh(sideRail.translate(x0 + 0.011, SIDE, (WRAP + z1) / 2), woodMaterial("oak_veneer_01")));
		const oak = new Mesh(mergeGeometries(slats, false)!, woodMaterial("walnut_veneer"));
		oak.receiveShadow = true;
		group.add(oak);
		// The logo and its line on a navy powder-coated plate, standing off the slats (clear of the corkboard on its left).
		const PW = 1.72;
		const plate = new Mesh(new BoxGeometry(PW, 0.98, 0.012), paint("painted_plaster_wall", 0x14235e, 0x101b4a, 0.25, 0.8));
		plate.position.set(logo.position.x, 2.0, z0 + 0.034);
		plate.receiveShadow = true;
		group.add(plate);
		// Brass: a fine edge round the plate, a cap on each of its four stand-off pins, and above it a brass picture light
		// on its arm (the warm wash down the slats is its light: room.ts, the title's lamp).
		const fittings: BoxGeometry[] = [];
		const px = logo.position.x;
		for (const s of [-1, 1]) {
			fittings.push(new BoxGeometry(PW + 0.02, 0.01, 0.016).translate(px, 2.0 + s * 0.495, z0 + 0.034));
			fittings.push(new BoxGeometry(0.01, 1.0, 0.016).translate(px + s * (PW / 2 + 0.005), 2.0, z0 + 0.034));
		}
		const caps = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new CylinderGeometry(0.014, 0.014, 0.008, 16).rotateX(Math.PI / 2).translate(px + sx * (PW / 2 - 0.045), 2.0 + sy * 0.42, z0 + 0.044)));
		const bar = new CylinderGeometry(0.022, 0.022, 0.72, 20).rotateZ(Math.PI / 2).translate(px, 2.62, z0 + 0.2);
		const arm = new CylinderGeometry(0.008, 0.008, 0.2, 10).rotateX(Math.PI / 2).translate(px, 2.62, z0 + 0.1);
		const rose = new CylinderGeometry(0.035, 0.035, 0.012, 20).rotateX(Math.PI / 2).translate(px, 2.62, z0 + 0.03);
		const brassMesh = new Mesh(mergeGeometries([...fittings, ...caps, bar, arm, rose].map((g) => (g.index ? g.toNonIndexed() : g)), false)!, brass());
		group.add(brassMesh);
		logo.position.z = z0 + 0.075;
		shadow.position.z = z0 + 0.0405;
		panel(paint("concrete_wall_008", 0xdcd7c9, 0x2d3346, 0.7, 1), DESK_END, SHOP_END, 0, h, 2.7);
		const muralMat = new MeshStandardMaterial({ map: blueprint(), normalMap: band.normalMap, roughnessMap: band.roughnessMap, roughness: 1 });
		tinted.push({ mat: muralMat, light: 0xffffff, dark: 0xb8bcd0 });
		const mural = new Mesh(new PlaneGeometry(1.92, 1.92), muralMat);
		mural.position.set(-2.46, 2.18, z0 + 0.006);
		mural.receiveShadow = true;
		group.add(mural);
		services();
	} else {
		// Board-formed concrete; the logo on a navy felt panel; felt squares high over the benches, where the noise is.
		panel(paint("concrete_layers", 0xd8d3c5, 0x2b3143, 1, 1), x0, SHOP_END, 0, h, 1.55);
		const feltNavy = paint("caban", 0x1b2d6e, 0x14235e, 1, 1);
		const feltYellow = paint("caban", 0xf5d042, 0xd9b52e, 1, 1);
		const felt = (mat: Material, x: number, y: number, w: number, hh: number) => {
			const g = new BoxGeometry(w, hh, 0.03);
			const uv = g.getAttribute("uv");
			for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.27, (uv.getY(i) * hh) / 0.27);
			const m = new Mesh(g, mat);
			m.position.set(x, y, z0 + 0.016);
			m.receiveShadow = true;
			group.add(m);
		};
		felt(feltNavy, -6, 2.0, 2.3, 1.12);
		logo.position.z = z0 + 0.075;
		shadow.position.z = z0 + 0.0315;
		const xs = [-3.9, -3.3, -2.7, -2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1, 2.7];
		xs.forEach((x, i) => felt(i % 5 === 2 ? feltYellow : feltNavy, x, i % 2 ? 2.62 : 2.98, 0.56, 0.56));
		services();
	}
	slogan.position.z = logo.position.z;
	logoOnDark(logoDark);
	trim.mesh(group);
	if (look === "b") brassy.mesh(group, brass());

	return {
		applyPalette(dark: boolean) {
			for (const t of tinted) tint(t.mat, dark ? t.dark : t.light);
		},
	};
}

/** The dado rail: a moulded rail along the back wall at `y`, over each [from, to]. */
function railGeometry(runs: [number, number][], y: number, z: number) {
	const parts = runs.map(([a, b]) => {
		const g = new BoxGeometry(b - a, 0.045, 0.022);
		metreUv(g, [b - a, 0.045, 0.022], 0.2);
		return g.translate((a + b) / 2, y, z - 0.011);
	});
	return mergeGeometries(parts, false)!;
}

/** An engineer's drawing of the F450 from above, in cream on navy, as if painted on the wall: arms, motors, the props' sweep, the frame plates, centre lines and a dimension. */
function blueprint() {
	const S = 1024;
	const c = document.createElement("canvas");
	c.width = c.height = S;
	const g = c.getContext("2d")!;
	g.fillStyle = "#1b2d6e";
	g.fillRect(0, 0, S, S);
	const ink = (a: number) => `rgba(242,238,223,${a})`;
	const line = (ax: number, ay: number, bx: number, by: number) => {
		g.beginPath();
		g.moveTo(ax, ay);
		g.lineTo(bx, by);
		g.stroke();
	};
	const ring = (x: number, y: number, r: number) => {
		g.beginPath();
		g.arc(x, y, r, 0, Math.PI * 2);
		g.stroke();
	};
	const mid = S / 2;
	const arm = 300; // centre to motor
	g.lineCap = "round";
	// The faint grid of the paper.
	g.strokeStyle = ink(0.07);
	g.lineWidth = 1;
	for (let i = 0; i <= S; i += 32) {
		line(i, 0, i, S);
		line(0, i, S, i);
	}
	// Centre lines, chain-dotted.
	g.setLineDash([22, 8, 4, 8]);
	g.strokeStyle = ink(0.35);
	g.lineWidth = 1.5;
	line(mid, 40, mid, S - 40);
	line(40, mid, S - 40, mid);
	line(90, 90, S - 90, S - 90);
	line(S - 90, 90, 90, S - 90);
	g.setLineDash([]);
	g.strokeStyle = ink(0.85);
	g.lineWidth = 3;
	const motors: [number, number][] = [];
	for (const k of [0, 1, 2, 3]) {
		const a = Math.PI / 4 + (k * Math.PI) / 2;
		const [ca, sa] = [Math.cos(a), Math.sin(a)];
		const ex = mid + ca * arm;
		const ey = mid + sa * arm;
		motors.push([ex, ey]);
		// The arm: a tapered beam, and its ribs.
		const [nx, ny] = [-sa, ca];
		const [w0, w1] = [26, 16];
		g.beginPath();
		g.moveTo(mid + ca * 70 + nx * w0, mid + sa * 70 + ny * w0);
		g.lineTo(ex - ca * 34 + nx * w1, ey - sa * 34 + ny * w1);
		g.lineTo(ex - ca * 34 - nx * w1, ey - sa * 34 - ny * w1);
		g.lineTo(mid + ca * 70 - nx * w0, mid + sa * 70 - ny * w0);
		g.closePath();
		g.stroke();
		g.lineWidth = 1.5;
		for (let t = 0.2; t < 0.9; t += 0.14) {
			const px = mid + ca * (70 + t * (arm - 104));
			const py = mid + sa * (70 + t * (arm - 104));
			const w = (w0 + (w1 - w0) * t) * 0.7;
			line(px + nx * w, py + ny * w, px - nx * w, py - ny * w);
		}
		g.lineWidth = 3;
		// The motor: its bell and shaft; the prop's sweep, dashed; its blades at rest.
		for (const r of [34, 22, 6]) ring(ex, ey, r);
		g.save();
		g.setLineDash([10, 10]);
		g.lineWidth = 1.5;
		g.strokeStyle = ink(0.45);
		ring(ex, ey, 128);
		g.restore();
		g.lineWidth = 2;
		g.beginPath();
		g.ellipse(ex, ey, 122, 13, a + 0.9, 0, Math.PI * 2);
		g.stroke();
		g.lineWidth = 3;
	}
	// The frame plates, their bolts, the battery strap.
	g.beginPath();
	g.roundRect(mid - 96, mid - 96, 192, 192, 22);
	g.stroke();
	g.beginPath();
	g.roundRect(mid - 60, mid - 60, 120, 120, 12);
	g.stroke();
	g.lineWidth = 1.5;
	for (const [x, y] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) ring(mid + x, mid + y, 5);
	g.strokeRect(mid - 110, mid - 14, 220, 28);
	// Which way is forward.
	g.lineWidth = 3;
	line(mid, mid - 130, mid, mid - 170);
	line(mid - 14, mid - 154, mid, mid - 172);
	line(mid, mid - 172, mid + 14, mid - 154);
	// A dimension, motor to motor, with its end ticks.
	g.lineWidth = 1.5;
	g.strokeStyle = ink(0.6);
	const [ma, mb] = [motors[1], motors[0]];
	const dy = ma[1] + 160;
	line(ma[0], dy, mb[0], dy);
	for (const x of [ma[0], mb[0]]) line(x, dy - 14, x, dy + 14);
	const map = new CanvasTexture(c);
	map.colorSpace = SRGBColorSpace;
	map.anisotropy = 8;
	return map;
}
