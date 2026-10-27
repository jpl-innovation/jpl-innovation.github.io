/**
 * Team 10951's changes to the KitBot (./frc-robot.ts), modelled from photos of the real robot (October 2026). Sizes
 * are read off the photos against the KitBot's own CAD, so they are close, not measured.
 *
 *   Intake      the bottom shaft: six pairs of grey compliant wheels. The second shaft: three orange flex star wheels
 *               between grey wheel pairs, and a blue star at the end.
 *   Indexer     the feeder shaft: five blue flex star wheels with green wheels between them.
 *   Flywheel    the launcher shaft is a full-width stack of 16 wheels (black, blue, orange, green), not the KitBot's two.
 *   Hood        eight printed ribs across the width (blue, two black in the middle, white at the left end) on three
 *               black rods with white sleeves, where the KitBot has two white ribs.
 *   Motors      two Kraken X60s (Talon FX built in) on the right plate, on belts to the flywheel and the indexer; one
 *               NEO on the left plate, on a belt to the intake shafts. The KitBot's two upper CIMs are gone; the four
 *               CIMs that drive the wheels stay.
 *   Hopper      an extension on orange printed pivots that swings out past the back to hold more FUEL and folds
 *               inside, its back wall becoming the lid, level with the shooter (extensionPose); the team's
 *               decal on its back wall.
 *   Electronics the REV power distribution hub, five SPARK MAXes (one for the NEO, four for the drive motors; the
 *               Krakens need none), a CTRE Pigeon 2.0 next to them for odometry, the radio on the left plate, the
 *               red power and the yellow-green CAN wiring between them, and the Allen-Bradley beacon on top.
 *
 * Nothing is taped: the real star wheels wear tape where they are cracking, but this is the robot as designed.
 */
import {
	type BufferGeometry,
	CanvasTexture,
	SRGBColorSpace,
	BoxGeometry,
	CatmullRomCurve3,
	CylinderGeometry,
	DoubleSide,
	ExtrudeGeometry,
	LatheGeometry,
	type Material,
	MeshStandardMaterial,
	Path,
	PlaneGeometry,
	Shape,
	SphereGeometry,
	TubeGeometry,
	Vector2,
	Vector3,
} from "three";
import { type Finish, hardware } from "../finish";
import { textTexture } from "../stage";

export type Group3 = "intake" | "shooter" | "hopper" | "electronics" | "";

/** One new part: robot-space geometry, unless `on` says it rides a rotor (rotor-local) or the hopper extension (pivot-local). */
export interface ModPiece {
	geometry: BufferGeometry;
	material: Material;
	rotor: number;
	on?: "flaps";
	group: Group3;
}

/**
 * KitBot parts that the real robot doesn't have (indexes into frc-robot-cad.json's parts, see the list in
 * scripts/kitbot-cad.py's output), on top of everything on the four roller shafts (frc-robot.ts drops all rotor parts;
 * they're rebuilt below): the two upper CIMs and their
 * shafts and pulley, the two white hood ribs and their yellow spacers, the hood's white rods, the old belts, the
 * small signal light, the power hub and all six SPARK MAXes (redrawn, five of them, below).
 */
export const SKIP = new Set<number>([
	// upper CIMs (shooter and feeder) and their bits
	111, 112, 113, 114, 115, 121, 132, 133, 134, 135, 136, 40, 85,
	// hood ribs, their spacers and rods, and the little wheels on the top rod
	18, 82, 145, 24, 4, 101, 149, 108, 54, 6, 3,
	// belts and the bracket on the plates
	53, 28, 125,
	// signal light
	116, 117,
	// power hub and SPARK MAXes
	45, 19, 43, 67, 124, 128, 130,
	// the hopper's fixed back wall: the extension is the back now
	61,
]);

/** The hood rib (a curved printed plate) the KitBot has two of: cloned across the width. */
export const RIB_SOURCE = 18;
const RIB_X = -0.029; // where that rib sits
const RIBS: [number, "blue" | "black" | "white"][] = [
	[-0.214, "white"], [-0.155, "blue"], [-0.096, "blue"], [-0.03, "black"], [0.03, "black"], [0.096, "blue"], [0.155, "blue"], [0.214, "blue"],
];

/** Roller shafts (y, z), as in the CAD: intake, second intake, launcher (flywheel), feeder (indexer). */
type Rotors = [number, number][];

const mat = (color: number, finish: Finish, extra: Record<string, unknown> = {}) => hardware({ color, roughness: 0.55, metalness: 0.05, ...extra }, finish);

/** A wheel turning about x, centred on x = 0 in its own space: a lathe profile of [radius, half-width] pairs. */
function lathe(profile: [number, number][], segments = 40) {
	const g = new LatheGeometry(profile.map(([r, h]) => new Vector2(r, h)), segments);
	g.rotateZ(Math.PI / 2);
	return g;
}

/** A tyre: hub to tread, rounded at the edges. */
function tyre(r: number, w: number, hub = 0.012) {
	const e = Math.min(0.004, w / 4);
	return lathe([
		[hub, -w / 2], [r - e, -w / 2], [r - e * 0.3, -w / 2 + e * 0.3], [r, -w / 2 + e], [r, w / 2 - e], [r - e * 0.3, w / 2 - e * 0.3], [r - e, w / 2], [hub, w / 2],
	]);
}

/** A flex star wheel: `arms` thin curved flappers round a hub, `t` thick, turning about x. */
function star(r: number, arms: number, t: number, hub = 0.016) {
	const s = new Shape();
	const n = arms * 8;
	for (let i = 0; i <= n; i++) {
		const a = (i / n) * Math.PI * 2;
		const k = (i % 8) / 8; // 0..1 across one arm and its gap
		// the arm is the first 2/8 of each 8th: out to r, swept back a little; the rest is hub
		const out = k < 0.25 ? r : hub + 0.006;
		const sweep = k < 0.25 ? 0.12 : 0;
		const x = Math.cos(a - sweep) * out;
		const y = Math.sin(a - sweep) * out;
		if (i === 0) s.moveTo(x, y);
		else s.lineTo(x, y);
	}
	s.holes.push(hexHole(0.0068));
	const g = new ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 1 });
	g.translate(0, 0, -t / 2);
	g.rotateY(Math.PI / 2);
	return g;
}

function hexHole(r: number) {
	const p = new Path();
	for (let i = 0; i <= 6; i++) {
		const a = (i / 6) * Math.PI * 2;
		if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
		else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
	}
	return p;
}

/** A grey compliant wheel: a soft flower of six lobes. */
function compliant(r: number, w: number) {
	const s = new Shape();
	const n = 72;
	for (let i = 0; i <= n; i++) {
		const a = (i / n) * Math.PI * 2;
		const rr = r * (0.9 + 0.1 * Math.cos(a * 6));
		if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
		else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
	}
	s.holes.push(hexHole(0.0068));
	const g = new ExtrudeGeometry(s, { depth: w, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 1 });
	g.translate(0, 0, -w / 2);
	g.rotateY(Math.PI / 2);
	return g;
}

/** A 1/2" hex shaft along x. */
function hexShaft(length: number) {
	const g = new CylinderGeometry(0.0073, 0.0073, length, 6);
	g.rotateZ(Math.PI / 2);
	return g;
}

const at = (g: BufferGeometry, x: number, y = 0, z = 0) => g.translate(x, y, z);

/** A belt: a loop round two pulleys (y, z centres and radii) in the plane x. */
function belt(x: number, a: [number, number, number], b: [number, number, number], width = 0.009) {
	const [ay, az, ar] = a;
	const [by, bz, br] = b;
	const dy = by - ay, dz = bz - az;
	const d = Math.hypot(dy, dz);
	const ux = dy / d, uz = dz / d; // along the belt (in y, z)
	const nx = -uz, nz = ux; // across it
	const pts: Vector3[] = [];
	const arc = (cy: number, cz: number, r: number, from: number, to: number) => {
		for (let i = 0; i <= 10; i++) {
			const t = from + ((to - from) * i) / 10;
			pts.push(new Vector3(x, cy + Math.cos(t) * r, cz + Math.sin(t) * r));
		}
	};
	const base = Math.atan2(nz, nx);
	arc(by, bz, br, base, base - Math.PI);
	arc(ay, az, ar, base - Math.PI, base - 2 * Math.PI);
	const curve = new CatmullRomCurve3(pts, true);
	const g = new TubeGeometry(curve, 80, width / 2, 5, true);
	g.scale(1.8, 1, 1); // flatter than round: a timing belt, wide across x
	g.translate(-x * 0.8, 0, 0);
	return g;
}

/** A Kraken X60 with its Talon FX end, axis along x, back face at x = 0, sticking out toward +x (sign -1: toward -x). */
function kraken(sign: 1 | -1) {
	const body: BufferGeometry[] = [];
	const L = 0.072;
	body.push(at(new CylinderGeometry(0.0305, 0.0305, L, 32).rotateZ(Math.PI / 2), (sign * L) / 2));
	// the body is smooth (it carries the logo); only the Talon FX end, the last 2 cm, is finned
	for (let i = 0; i < 4; i++) body.push(at(new CylinderGeometry(0.0322, 0.0322, 0.003, 32).rotateZ(Math.PI / 2), sign * (0.055 + i * 0.005)));
	return body;
}

/** A NEO: a black can with a silver end, axis along x. */
function neo(sign: 1 | -1) {
	const L = 0.058;
	return at(new CylinderGeometry(0.03, 0.03, L, 32).rotateZ(Math.PI / 2), (sign * L) / 2);
}

/** A flat label on a face: text on a transparent plane, facing `normal` (+x or -x, or +y). */
function label(text: string, w: number, h: number, color: string, font: string, canvas = 512) {
	const tex = textTexture(text, { width: canvas, height: Math.round((canvas * h) / w), font, color });
	return new MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
}

/** The extension's side panel, in pivot space: the pivot is its top front corner; it reaches back (-z) and down. */
const EXT = { L: 0.4, H: 0.38 };
function flapShape() {
	const s = new Shape();
	const { L, H } = EXT;
	const r = 0.06; // the big rounded corner at the bottom back, as on the robot
	// (Shape x = robot z, Shape y = robot y)
	s.moveTo(0, 0);
	s.lineTo(-L, 0);
	s.lineTo(-L, -H + r);
	s.quadraticCurveTo(-L, -H, -L + r, -H);
	s.lineTo(-0.05, -H);
	s.quadraticCurveTo(0, -H, 0, -H + 0.05);
	s.lineTo(0, 0);
	return s;
}

/**
 * Where the extension is for `open` (1 extended, 0 folded), as the video shows it: extended, its pivot is at the top
 * of the curved slot in the fixed side panel (level with the shooter) and the box sticks out past the back of the
 * robot; folding, the back is lifted, the pivot slides down the slot and the box turns a quarter turn, so it tucks
 * inside the robot with its back wall (the decal) on top as a lid, level with the shooter.
 */
export function extensionPose(open: number) {
	const t = 1 - open; // 0 extended .. 1 folded
	const top = 0.5225; // the shooter's height (the side plates' top)
	const a = { y: top, z: -0.1 }; // pivot, extended
	const c = { y: top - EXT.L, z: 0.06 }; // pivot, folded: the lid (the back wall) ends up at `top`
	const m = { y: 0.26, z: -0.14 }; // the slot's curve
	const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * m.y + t * t * c.y;
	const z = (1 - t) * (1 - t) * a.z + 2 * (1 - t) * t * m.z + t * t * c.z;
	return { y, z, turn: (Math.PI / 2) * t };
}

export interface Mods {
	pieces: ModPiece[];
	/** Where the hopper extension's pivot starts (robot space, extended); extensionPose() moves it. */
	pivot: [number, number, number];
	/** The beacon's dome, which glows. */
	beacon: MeshStandardMaterial;
	/** The extension's polycarbonate (the showcase fades it with the hopper on the electronics stop). */
	clear: MeshStandardMaterial;
}

export function buildMods(rotors: Rotors, rib: BufferGeometry): Mods {
	const pieces: ModPiece[] = [];
	const add = (geometry: BufferGeometry, material: Material, group: Group3, rotor = -1, on?: "flaps") => pieces.push({ geometry, material, rotor, group, on });
	/** Robot-space geometry onto rotor `i` (its local space). */
	const onRotor = (g: BufferGeometry, i: number) => g.translate(0, -rotors[i][0], -rotors[i][1]);
	/** Geometry built round the origin, moved onto rotor `i` at `x` (it's already rotor-local: the shaft is the origin). */
	const put = (g: BufferGeometry, x: number) => g.translate(x, 0, 0);

	/* ---------- Materials ---------- */
	const shaft = mat(0x22252b, "metal", { metalness: 0.7, roughness: 0.4 });
	const grey = mat(0x9a9ea3, "rubber", { roughness: 0.9 });
	const orange = mat(0xf26b1d, "printed", { roughness: 0.7 });
	const blue = mat(0x2d64d8, "printed", { roughness: 0.65 });
	const green = mat(0x55c234, "printed", { roughness: 0.7 });
	const black = mat(0x1a1b1e, "rubber", { roughness: 0.85 });
	const blackPrint = mat(0x1d1e22, "printed", { roughness: 0.75 });
	const whitePrint = mat(0xeef0f2, "printed", { roughness: 0.6 });
	const pvcBlack = mat(0x16171a, "plastic", { roughness: 0.4 });
	const pvcWhite = mat(0xf2f2ee, "plastic", { roughness: 0.45 });
	const pulley = mat(0x2a2c31, "anodised", { metalness: 0.6, roughness: 0.45 });
	const beltMat = mat(0x111214, "rubber", { roughness: 0.9 });
	const motorBlack = mat(0x15171b, "plastic", { roughness: 0.42, metalness: 0.2 });
	const silver = mat(0xc9ced4, "metal", { metalness: 0.85, roughness: 0.3 });
	const printedOrange = mat(0xf57a1f, "printed", { roughness: 0.7 });
	const clear = hardware({ color: 0xcccccc, transparent: true, opacity: 0.26, roughness: 0.1, metalness: 0, depthWrite: false, side: DoubleSide }, "clear");
	const krakenLogo = (() => {
		const c = document.createElement("canvas");
		c.width = 512;
		c.height = 256;
		const g = c.getContext("2d")!;
		g.strokeStyle = "#2f8cff";
		g.lineWidth = 14;
		g.lineCap = "round";
		for (let i = 0; i < 3; i++) {
			g.beginPath();
			g.moveTo(40 + i * 40, 230);
			g.bezierCurveTo(60 + i * 60, 120, 160 + i * 30, 160, 140 + i * 50, 40);
			g.stroke();
		}
		g.fillStyle = "#ffffff";
		g.font = '800 92px "Archivo Variable", Arial, sans-serif';
		g.fillText("KRAKEN", 210, 150);
		g.font = '800 60px "Archivo Variable", Arial, sans-serif';
		g.fillText("X60", 330, 215);
		const t = new CanvasTexture(c);
		t.colorSpace = SRGBColorSpace;
		return new MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2, side: DoubleSide });
	})();
	const flywheel: Record<string, MeshStandardMaterial> = {
		k: black,
		b: mat(0x2f5fc8, "rubber", { roughness: 0.8 }),
		o: mat(0xe8642a, "rubber", { roughness: 0.8 }),
		g: mat(0x4fb43a, "rubber", { roughness: 0.8 }),
	};

	/* ---------- Shafts: the four roller shafts, hex, through both plates ---------- */
	for (let i = 0; i < 4; i++) add(hexShaft(0.56), shaft, i < 2 ? "intake" : "shooter", i);

	/* ---------- Intake: bottom shaft, six pairs of grey compliant wheels ---------- */
	for (const x of [-0.21, -0.126, -0.042, 0.042, 0.126, 0.21])
		for (const dx of [-0.008, 0.008]) add(put(compliant(0.031, 0.014), x + dx), grey, "intake", 0);
	/* ---------- Second shaft: orange stars, grey pairs between, a blue star at the end ---------- */
	for (const x of [-0.19, -0.063, 0.063]) add(put(star(0.054, 6, 0.012), x), orange, "intake", 1);
	for (const x of [-0.126, 0, 0.126]) for (const dx of [-0.008, 0.008]) add(put(compliant(0.029, 0.014), x + dx), grey, "intake", 1);
	add(put(star(0.05, 8, 0.012), 0.19), blue, "intake", 1);
	/* ---------- Indexer (feeder shaft): blue stars with green wheels between ---------- */
	for (const x of [-0.2, -0.1, 0, 0.1, 0.2]) add(put(star(0.052, 8, 0.012), x), blue, "shooter", 3);
	for (const x of [-0.15, -0.05, 0.05, 0.15]) add(put(tyre(0.036, 0.03), x), green, "shooter", 3);
	/* ---------- Flywheel: 16 wheels across, the colours as on the robot ---------- */
	const stack = "gbkkbkkookkbgkbk";
	const ww = 0.0262;
	[...stack].forEach((c, i) => add(put(tyre(0.051, ww - 0.0012, 0.02), -0.21 + i * 0.028), flywheel[c], "shooter", 2));
	// White spacers at the ends of the two intake shafts (inside the plates).
	for (const i of [0, 1]) for (const x of [-0.2265 + 0.012, 0.2265 - 0.012]) add(put(new CylinderGeometry(0.0105, 0.0105, 0.018, 16).rotateZ(Math.PI / 2), x), pvcWhite, "intake", i);

	/* ---------- Pulleys outside the plates, and the belts ---------- */
	const P = (r: number, w = 0.016) => lathe([[0.008, -w / 2], [r + 0.003, -w / 2], [r + 0.003, -w / 2 + 0.002], [r, -w / 2 + 0.002], [r, w / 2 - 0.002], [r + 0.003, w / 2 - 0.002], [r + 0.003, w / 2], [0.008, w / 2]], 32);
	const XR = 0.247, XL = -0.247; // pulley planes, right and left
	add(put(P(0.02), XL), pulley, "intake", 1);
	add(put(P(0.02, 0.026), XL), pulley, "intake", 0);

	/* ---------- Right plate (photos: the Kraken side) ---------- */
	// Two Kraken X60s low on the plate, side by side, their Talon FX ends facing out: the back one belts up to the
	// flywheel, the front one belts down to a big black pulley on the bottom intake shaft, round a white idler.
	const plateR = 0.2285, plateL = -0.2285;
	const whitePulley = mat(0xe9e9e4, "plastic", { roughness: 0.5 });
	const retainer = mat(0x2f6fe0, "printed", { roughness: 0.6 }); // the blue printed bearing retainers
	const flyPulley: [number, number, number] = [rotors[2][0], rotors[2][1], 0.032];
	const intakePulley: [number, number, number] = [rotors[0][0], rotors[0][1], 0.045];
	const idler: [number, number, number] = [0.262, 0.238, 0.013];
	add(put(P(0.032, 0.018), XR), blackPrint, "shooter", 2); // flywheel pulley, black
	add(put(P(0.045, 0.02), XR), blackPrint, "intake", 0); // the big black intake pulley
	// blue retainers round every shaft where it passes the plate
	for (const [y, z] of [rotors[0], rotors[1], rotors[2], rotors[3]])
		add(at(lathe([[0.008, -0.003], [0.021, -0.003], [0.021, 0.003], [0.008, 0.003]], 32), plateR + 0.003, y, z), retainer, "shooter");
	const krakens: { y: number; z: number; to: [number, number, number]; group: Group3; via?: [number, number, number] }[] = [
		{ y: 0.268, z: 0.105, to: flyPulley, group: "shooter" },
		{ y: 0.268, z: 0.182, to: intakePulley, group: "intake", via: idler },
	];
	for (const k of krakens) {
		for (const g of kraken(1)) add(at(g, plateR + 0.022, k.y, k.z), motorBlack, k.group);
		// the blue Kraken logo round the can, both sides
		for (const turn of [0.6, Math.PI + 0.6]) {
			const wrap = new CylinderGeometry(0.0312, 0.0312, 0.042, 24, 1, true, turn, 1.6).rotateZ(Math.PI / 2);
			add(at(wrap, plateR + 0.022 + 0.027, k.y, k.z), krakenLogo, k.group);
		}
		// the Talon FX end: finned, with its name
		const face = new PlaneGeometry(0.044, 0.016).rotateY(Math.PI / 2);
		add(at(face, plateR + 0.022 + 0.0735, k.y - 0.006, k.z), label("TALON FX", 0.044, 0.016, "#7ee03a", '800 110px "Archivo Variable", Arial, sans-serif'), k.group);
		// the motor stands off the plate on its mount; a white pulley on its shaft, behind it
		add(at(new CylinderGeometry(0.004, 0.004, 0.03, 12).rotateZ(Math.PI / 2), plateR + 0.012, k.y, k.z), silver, k.group);
		add(at(P(0.014, 0.012), XR, k.y, k.z), whitePulley, k.group);
		if (k.via) {
			// long belt: motor -> idler -> big pulley, drawn as two straight runs round the idler
			add(belt(XR, [k.y, k.z, 0.0155], k.via), beltMat, k.group);
			add(belt(XR + 0.0005, k.via, k.to), beltMat, k.group);
		} else add(belt(XR, [k.y, k.z, 0.0155], k.to), beltMat, k.group);
	}
	add(at(P(0.013, 0.012), XR, idler[0], idler[1]), whitePulley, "intake");
	add(at(new CylinderGeometry(0.004, 0.004, 0.026, 12).rotateZ(Math.PI / 2), plateR + 0.012, idler[0], idler[1]), silver, "intake");
	// The Limelight camera on the plate's top front corner.
	const ll = { y: 0.47, z: 0.3 };
	const llBody = mat(0x111215, "anodised", { metalness: 0.5, roughness: 0.45 });
	add(at(new BoxGeometry(0.03, 0.075, 0.09), plateR + 0.017, ll.y, ll.z), llBody, "electronics");
	for (let i = 0; i < 6; i++) add(at(new BoxGeometry(0.004, 0.06, 0.004), plateR + 0.034, ll.y, ll.z - 0.03 + i * 0.012), llBody, "electronics"); // fins
	add(at(new CylinderGeometry(0.009, 0.009, 0.006, 20), plateR + 0.017, ll.y + 0.02, ll.z + 0.048).rotateX(0), mat(0x0b0d12, "glass", { roughness: 0.1 }), "electronics");
	const llTag = new PlaneGeometry(0.06, 0.012).rotateY(Math.PI / 2).rotateX(Math.PI / 2);
	add(at(new PlaneGeometry(0.065, 0.012).rotateY(Math.PI / 2), plateR + 0.0325, ll.y - 0.026, ll.z), label("LIMELIGHT", 0.065, 0.012, "#ffffff", '700 96px "Archivo Variable", Arial, sans-serif'), "electronics");
	llTag.dispose();
	// The NEO on the left plate, on a belt to the second intake shaft; that shaft drives the bottom one.
	const neoAt: [number, number] = [0.37, 0.205];
	add(at(neo(-1), plateL, neoAt[0], neoAt[1]), motorBlack, "intake");
	add(at(new CylinderGeometry(0.024, 0.024, 0.003, 32).rotateZ(Math.PI / 2), plateL - 0.0595, neoAt[0], neoAt[1]), silver, "intake");
	const neoFace = new PlaneGeometry(0.04, 0.016).rotateY(-Math.PI / 2);
	add(at(neoFace, plateL - 0.0615, neoAt[0], neoAt[1]), label("NEO", 0.04, 0.016, "#ffffff", '900 120px "Archivo Variable", Arial, sans-serif'), "intake");
	// its gear (the big black one in the photos), then the belts
	add(at(lathe([[0.006, -0.004], [0.044, -0.004], [0.044, 0.004], [0.006, 0.004]], 48), XL - 0.004, neoAt[0], neoAt[1]), blackPrint, "intake");
	add(belt(XL, [neoAt[0], neoAt[1], 0.012], [rotors[1][0], rotors[1][1], 0.02]), beltMat, "intake");
	add(belt(XL - 0.012, [rotors[1][0], rotors[1][1], 0.02], [rotors[0][0], rotors[0][1], 0.02]), beltMat, "intake");

	/* ---------- Hood: eight printed ribs on three rods ---------- */
	const ribMat = { blue, black: blackPrint, white: whitePrint };
	for (const [x, colour] of RIBS) add(rib.clone().translate(x - RIB_X, 0, 0), ribMat[colour], "shooter");
	for (const [y, z] of [[0.372, 0.295], [0.437, 0.316], [0.506, 0.311], [0.434, 0.078]] as const) {
		add(at(new CylinderGeometry(0.0095, 0.0095, 0.452, 20).rotateZ(Math.PI / 2), 0, y, z), pvcBlack, "shooter");
		// white sleeves on the right half, as on the robot
		add(at(new CylinderGeometry(0.0101, 0.0101, 0.12, 20).rotateZ(Math.PI / 2), 0.155, y, z), pvcWhite, "shooter");
	}

	/* ---------- Beacon (Allen-Bradley) on top of the left plate, and the radio ---------- */
	const beacon = new MeshStandardMaterial({ color: 0xff8a1a, emissive: 0xff6a00, emissiveIntensity: 1.6, roughness: 0.3, transparent: true, opacity: 0.92 });
	add(at(new CylinderGeometry(0.02, 0.022, 0.022, 28), plateL, 0.5225 + 0.011, 0.255), motorBlack, "electronics");
	const dome = new SphereGeometry(0.022, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
	dome.scale(1, 1.25, 1);
	add(at(new CylinderGeometry(0.022, 0.022, 0.018, 28), plateL, 0.5225 + 0.031, 0.255), beacon, "electronics");
	add(at(dome, plateL, 0.5225 + 0.04, 0.255), beacon, "electronics");
	add(at(new BoxGeometry(0.03, 0.09, 0.06), plateL - 0.016, 0.45, 0.13), motorBlack, "electronics");
	const radioTag = new PlaneGeometry(0.05, 0.012).rotateY(-Math.PI / 2);
	add(at(radioTag, plateL - 0.0315, 0.41, 0.13), label("RADIO", 0.05, 0.012, "#ffffff", '800 110px "Archivo Variable", Arial, sans-serif'), "electronics");

	/* ---------- Electronics on the belly pan (under the clear hopper floor) ---------- */
	const pdhBody = mat(0x26292f, "plastic", { roughness: 0.5 });
	const lever = mat(0xf2751b, "plastic", { roughness: 0.5 });
	const display = new MeshStandardMaterial({ color: 0x0a1630, emissive: 0x2b6cff, emissiveIntensity: 1.2, roughness: 0.3 });
	// The REV power distribution hub: dark, a row of orange levers down each long side, a blue display.
	const pdh = { x: -0.058, y: 0.198, z: -0.092, w: 0.228, h: 0.04, d: 0.114 };
	add(at(new BoxGeometry(pdh.w, pdh.h, pdh.d), pdh.x, pdh.y, pdh.z), pdhBody, "electronics");
	for (const side of [-1, 1])
		for (let i = 0; i < 10; i++) add(at(new BoxGeometry(0.009, 0.012, 0.022), pdh.x - 0.1 + i * 0.0105 + (i >= 5 ? 0.06 : 0), pdh.y + 0.024, pdh.z + side * 0.04), lever, "electronics");
	add(at(new BoxGeometry(0.026, 0.004, 0.016), pdh.x + 0.075, pdh.y + 0.021, pdh.z), display, "electronics");
	// Five SPARK MAXes where the KitBot had six: dark cases, a white label, a status light.
	const spark = mat(0x1e2228, "plastic", { roughness: 0.45 });
	const sparkLabel = mat(0xe9edf2, "plastic", { roughness: 0.6 });
	const status = new MeshStandardMaterial({ color: 0x0b1020, emissive: 0x3b82f6, emissiveIntensity: 1.5 });
	const sparks: [number, number, boolean][] = [[0.133, -0.026, false], [0.133, -0.062, false], [0.133, -0.097, false], [0.133, -0.133, false], [0.075, -0.077, true]];
	for (const [x, z, turned] of sparks) {
		const [w, d] = turned ? [0.035, 0.069] : [0.069, 0.035];
		add(at(new BoxGeometry(w, 0.025, d), x, 0.191, z), spark, "electronics");
		add(at(new BoxGeometry(turned ? 0.02 : 0.036, 0.002, turned ? 0.036 : 0.02), x, 0.2045, z), sparkLabel, "electronics");
		add(at(new BoxGeometry(0.004, 0.002, 0.004), x + (turned ? 0 : 0.026), 0.2055, z + (turned ? 0.026 : 0)), status, "electronics");
	}
	// The CTRE Pigeon 2.0 (odometry), next to the SPARK MAXes.
	const pigeon = { x: 0.07, y: 0.186, z: -0.012 };
	add(at(new BoxGeometry(0.046, 0.014, 0.046), pigeon.x, pigeon.y, pigeon.z), mat(0x17191d, "plastic", { roughness: 0.4 }), "electronics");
	add(at(new PlaneGeometry(0.04, 0.012).rotateX(-Math.PI / 2), pigeon.x, pigeon.y + 0.0072, pigeon.z), label("PIGEON 2.0", 0.04, 0.012, "#7ee03a", '800 92px "Archivo Variable", Arial, sans-serif'), "electronics");
	// Wiring: red power from the hub to every SPARK MAX, and the CAN chain (yellow and green, twisted) through them all.
	const wire = (pts: [number, number, number][], color: number, r = 0.0016) =>
		add(new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p))), 24, r, 5, false), mat(color, "plastic", { roughness: 0.5 }), "electronics");
	for (const [x, z, turned] of sparks) {
		const end: [number, number, number] = [x - (turned ? 0 : 0.034), 0.195, z - (turned ? 0.034 : 0)];
		wire([[pdh.x + 0.1, 0.212, pdh.z + (z > pdh.z ? 0.03 : -0.03)], [(pdh.x + 0.1 + end[0]) / 2, 0.222, (pdh.z + z) / 2], end], 0xd01f1f);
		wire([[pdh.x + 0.098, 0.21, pdh.z + (z > pdh.z ? 0.036 : -0.036)], [(pdh.x + 0.1 + end[0]) / 2, 0.219, (pdh.z + z) / 2 + 0.004], [end[0], end[1] - 0.003, end[2] + 0.004]], 0x111111);
	}
	const canPath: [number, number, number][] = [
		[-0.13, 0.215, -0.17], [pdh.x - 0.06, 0.222, pdh.z - 0.04], [pdh.x + 0.1, 0.222, pdh.z + 0.05],
		[0.133, 0.21, -0.133], [0.16, 0.215, -0.097], [0.133, 0.21, -0.062], [0.16, 0.215, -0.026], [0.09, 0.212, -0.04], [pigeon.x, 0.197, pigeon.z],
	];
	for (const [color, off] of [[0xf5d000, 0.0018], [0x2fae4a, -0.0018]] as const) wire(canPath.map(([x, y, z]) => [x + off, y, z + off] as [number, number, number]), color, 0.0012);

	/* ---------- Hopper extension, on its pivots (it swings out the back; see extensionPose) ---------- */
	const start = extensionPose(1);
	const pivot: [number, number, number] = [0, start.y, start.z];
	const sideX = 0.2335;
	for (const s of [-1, 1]) {
		const flap = new ExtrudeGeometry(flapShape(), { depth: 0.003, bevelEnabled: false, curveSegments: 6 });
		flap.rotateY(-Math.PI / 2); // shape x -> robot z
		add(flap.translate(s * sideX + (s > 0 ? 0.003 : 0), 0, 0), clear, "hopper", -1, "flaps");
		// the orange printed pivot block and its bolt, at the top front corner
		add(at(new BoxGeometry(0.008, 0.04, 0.04), s * (sideX + 0.008), -0.022, -0.022), printedOrange, "hopper", -1, "flaps");
		add(at(new CylinderGeometry(0.004, 0.004, 0.02, 12).rotateZ(Math.PI / 2), s * (sideX + 0.012), -0.022, -0.022), silver, "hopper", -1, "flaps");
	}
	// The back wall with the decal: the back of the hopper when extended, its lid when folded.
	add(at(new BoxGeometry(2 * sideX + 0.006, EXT.H, 0.003), 0, -EXT.H / 2, -EXT.L), clear, "hopper", -1, "flaps");
	add(at(new PlaneGeometry(0.36, 0.15).rotateY(Math.PI), 0, -0.13, -EXT.L - 0.0035), label("10951", 0.36, 0.15, "rgba(230,236,244,0.8)", '800 150px "Archivo Variable", Arial, sans-serif'), "hopper", -1, "flaps");
	add(at(new PlaneGeometry(0.36, 0.06).rotateY(Math.PI), 0, -0.235, -EXT.L - 0.0035), label("SAIGON SOUTH DRAGONS", 0.36, 0.06, "rgba(230,236,244,0.8)", '800 92px "Archivo Variable", Arial, sans-serif', 1536), "hopper", -1, "flaps");

	return { pieces, pivot, beacon, clear };
}
