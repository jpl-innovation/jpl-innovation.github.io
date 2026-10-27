/**
 * Team 10951's 2026 robot in 3D: the standard KitBot platform from the kit's CAD, with the team's changes on top
 * (./frc-robot-mods.ts, modelled from photos of the real robot): the intake and indexer wheels, the full-width
 * flywheel and its printed hood, Kraken X60 and NEO motors, the hopper extension that opens and closes, and the
 * electronics (power hub, five SPARK MAXes, Pigeon 2.0, radio, beacon, wiring).
 *
 * frc-robot-cad.json is the CAD reduced to simple shapes (scripts/kitbot-cad.py turns the 142 MB export in CAD/,
 * which stays out of the repo, into these 50 KB):
 *   - round parts (wheels, rollers, motors, pulleys, gears, spacers) are their real side profile, revolved, and
 *     coloured section by section by the CAD material on their outside
 *   - everything else (plates, panels, bumpers, belts, frame rails, hood) is its real outline, extruded to its
 *     real thickness
 * Every part sits exactly where the CAD puts it, in the CAD's colours, except the hopper, which is see-through
 * (it's polycarbonate on the real robot) so the stored FUEL shows. Fasteners, bearings and small holes are left
 * out. Metres; y up; the intake end faces +z; wheels on y = 0.
 *
 * How FUEL moves: the intake rollers pull a ball off the floor and up the intake ramp into the hopper, whose floor
 * slopes back down to the feeder roller. To shoot, the feeder pushes it up between the rollers into the launcher
 * wheel, which flings it up the curved hood and out of the top.
 *
 * buildRobot() is the robot on its own, for the FRC page's scroll showcase (./frc-robot-showcase.ts); the default
 * export adds the idle tour of labels for the plain 3D viewer.
 */
import {
	BufferAttribute,
	type BufferGeometry,
	CatmullRomCurve3,
	Color,
	DoubleSide,
	ExtrudeGeometry,
	Group,
	LatheGeometry,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
	type MeshBasicMaterial,
	Object3D,
	Path,
	PlaneGeometry,
	Shape,
	SphereGeometry,
	Vector2,
	Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { type Finish, hardware } from "../finish";
import { contactShadow, type Model, type StageContext, type StageView, textTexture } from "../stage";
import cadJson from "./frc-robot-cad.json";
import { buildMods, extensionPose, RIB_SOURCE, SKIP } from "./frc-robot-mods";

export const view: StageView = {
	camera: [1.3, 0.95, 1.45],
	target: [0, 0.22, 0],
	fov: 34,
	spin: 0.22,
	minPolar: 0.5,
	maxPolar: 1.45,
	fitWidth: 1.25,
};

interface CadData {
	/** CAD colours, "#rrggbb". */
	materials: string[];
	/** Materials drawn see-through: the hopper, so the FUEL inside shows. */
	clear: number[];
	/** Lathe: p = [radius, height, ...]. Extrude: o = outer loops, h = holes ([x, y, ...]), d = depth, r = rounded edges. */
	shapes: Array<{ p: number[] } | { o: number[][]; h: number[][]; d: number; r?: number }>;
	/** Roller shafts (y, z), intake first: intake, second intake roller, launcher, feeder. */
	rotors: [number, number][];
	anchors: Record<string, [number, number, number]>;
	/** s = shape, c = material, m = 3x4 matrix (column-major) into site coordinates, g = rotor index. */
	parts: Array<{ s: number; c: number; m: number[]; g?: number }>;
}
const cad = cadJson as unknown as CadData;

/** Named points in the CAD (intake, launcher, hood, hopper, cim, battery), metres. */
export const robotAnchors = cad.anchors as Record<string, [number, number, number]>;

const BALL_R = 0.075; // FUEL: a 150 mm foam ball

/**
 * How a CAD colour is lit. The CAD names no materials, so this only reads the colour: the bumper blue is cloth,
 * near-black is rubber and plastic, plain mid greys are bare aluminium, everything else (white panels, coloured
 * parts) is plastic. The colour itself is always the CAD's.
 */
function finishOf(hex: string): Finish {
	if (hex === "#1651b0") return "fabric";
	const c = new Color(hex);
	const max = Math.max(c.r, c.g, c.b);
	const min = Math.min(c.r, c.g, c.b);
	const value = c.getHSL({ h: 0, s: 0, l: 0 }).l;
	if (max - min < 0.04 && value > 0.12 && value < 0.55) return "anodised"; // linear values: about #646464 to #c4c4c4
	if (value <= 0.12) return "rubber";
	return "plastic";
}

type V3 = [number, number, number];

/** One CAD part, as buildRobot's `tag` sees it. */
export interface RobotPart {
	/** CAD colour, "#rrggbb". */
	color: string;
	/** Drawn see-through (the hopper). */
	clear: boolean;
	/** The roller shaft it turns with (index into `rotors` in the CAD file: intake, second intake, launcher, feeder), or -1. */
	rotor: number;
	/** Bounds in the robot's space, metres. */
	lo: V3;
	hi: V3;
	/** For the team's own parts (./frc-robot-mods.ts): the feature they belong to, so nothing has to guess. */
	group?: string;
}

export interface RobotRig {
	/** The whole robot, in metres, with its floor shadow. */
	model: Group;
	/** Named points in the CAD (intake, launcher, hood, hopper, cim, battery). */
	anchors: Record<string, V3>;
	/** An object at a point in the robot's own space, which moves with it. */
	anchor(at: V3): Object3D;
	/** The two FUEL balls (they share one material). */
	balls: Mesh[];
	/** The materials drawn in a CAD colour ("#rrggbb"), and the team numbers on the bumpers as "numbers". */
	materials(color: string): MeshStandardMaterial[];
	/** Spins the rollers and moves the FUEL. dt = 0 for a still frame. */
	animate(t: number, dt: number): void;
	/** Puts the FUEL where it is at `t` seconds into its loop, without moving anything else. */
	pose(t: number): void;
	/** The see-through polycarbonate (the hopper and its extension). */
	clear(): MeshStandardMaterial[];
	/** The hopper extension: 0 folded down, 1 swung up (open). animate() cycles it unless this pins it. */
	setOpen(open: number | null): void;
	applyPalette(p: { dark: boolean }): void;
}

/**
 * Builds the robot into `parent`. With `tag`, every vertex of every CAD part gets a `feature` attribute (the number
 * `tag` returns for its part, in CAD order), and the bumper numbers get 0, for the scroll showcase's fading
 * (src/lib/three/showcase.ts).
 */
export async function buildRobot(parent: Object3D, tag?: (parts: RobotPart[]) => number[]): Promise<RobotRig> {
	const robot = new Group();
	parent.add(robot);

	/* ---------- CAD parts ---------- */
	const pairs = (flat: number[]) => {
		const out: Vector2[] = [];
		for (let i = 0; i < flat.length; i += 2) out.push(new Vector2(flat[i], flat[i + 1]));
		return out;
	};
	const inside = (p: Vector2, poly: Vector2[]) => {
		let c = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const a = poly[i], b = poly[j];
			if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
		}
		return c;
	};
	const shapes: BufferGeometry[] = cad.shapes.map((s) => {
		if ("p" in s) {
			const points = pairs(s.p);
			const r = Math.max(...points.map((p) => p.x));
			return new LatheGeometry(points, Math.min(48, Math.max(16, Math.round(r * 500)))).toNonIndexed();
		}
		const outers = s.o.map(pairs);
		const list = outers.map((o) => new Shape(o));
		for (const h of s.h) {
			const points = pairs(h);
			list[Math.max(0, outers.findIndex((o) => inside(points[0], o)))].holes.push(new Path(points));
		}
		if (s.r) {
			// Pool-noodle bumpers: round the top and bottom edges without growing the outline.
			const g = new ExtrudeGeometry(list, {
				depth: s.d - 2 * s.r,
				bevelEnabled: true,
				bevelThickness: s.r,
				bevelSize: s.r,
				bevelOffset: -s.r,
				bevelSegments: 4,
				curveSegments: 1,
			});
			return g.translate(0, 0, s.r);
		}
		return new ExtrudeGeometry(list, { depth: s.d, bevelEnabled: false, curveSegments: 1 });
	});
	const materials = cad.materials.map((c, i) =>
		cad.clear.includes(i)
			? hardware({ color: c, transparent: true, opacity: 0.28, roughness: 0.12, metalness: 0, depthWrite: false, side: DoubleSide }, "clear")
			: hardware({ color: new Color(c), roughness: 0.55, metalness: 0.15 }, finishOf(c)),
	);

	// The roller shafts spin, with everything mounted on them.
	const rotors = cad.rotors.map(([y, z]) => {
		const g = new Group();
		g.position.set(0, y, z);
		robot.add(g);
		return g;
	});
	const buckets = new Map<string, { geometries: BufferGeometry[]; material: number; rotor: number }>();
	const m4 = new Matrix4();
	const placed = cad.parts.map((part) => {
		const m = part.m;
		m4.fromArray([m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, m[9], m[10], m[11], 1]);
		return shapes[part.s].clone().applyMatrix4(m4);
	});
	// The team's changes (./frc-robot-mods.ts): some KitBot parts go, new ones come, and the hopper gets its extension.
	const mods = buildMods(cad.rotors, placed[RIB_SOURCE].clone());
	// Everything on the four roller shafts is rebuilt there, so none of the KitBot's rotor parts stay.
	const keep = cad.parts.map((part, i) => !SKIP.has(i) && part.g === undefined);
	const flaps = new Group();
	flaps.position.set(...mods.pivot);
	robot.add(flaps);
	const box = (g: BufferGeometry) => {
		g.computeBoundingBox();
		return g.boundingBox!;
	};
	const robotSpaceBox = (piece: (typeof mods.pieces)[number]) => {
		const b = box(piece.geometry).clone();
		const off = piece.on === "flaps" ? new Vector3(...mods.pivot) : piece.rotor >= 0 ? new Vector3(0, cad.rotors[piece.rotor][0], cad.rotors[piece.rotor][1]) : new Vector3();
		return b.translate(off);
	};
	const features = tag?.([
		...placed.flatMap((geometry, i) => {
			if (!keep[i]) return [];
			const { min, max } = box(geometry);
			const c = cad.parts[i].c;
			return [{ color: cad.materials[c], clear: cad.clear.includes(c), rotor: cad.parts[i].g ?? -1, lo: min.toArray() as V3, hi: max.toArray() as V3 }];
		}),
		...mods.pieces.map((piece) => {
			const { min, max } = robotSpaceBox(piece);
			return { color: "", clear: false, rotor: piece.rotor, lo: min.toArray() as V3, hi: max.toArray() as V3, group: piece.group };
		}),
	]);
	const featureOf = (g: BufferGeometry, n: number) => {
		if (!features) return;
		const count = g.getAttribute("position").count;
		g.setAttribute("feature", new BufferAttribute(new Float32Array(count).fill(features[n] ?? 0), 1));
	};
	let n = 0;
	cad.parts.forEach((part, i) => {
		const geometry = placed[i];
		if (!keep[i]) {
			geometry.dispose();
			return;
		}
		const rotor = part.g ?? -1;
		if (rotor >= 0) geometry.translate(0, -cad.rotors[rotor][0], -cad.rotors[rotor][1]);
		featureOf(geometry, n++);
		const key = `${rotor}:${part.c}`;
		const bucket = buckets.get(key) ?? { geometries: [], material: part.c, rotor };
		bucket.geometries.push(geometry);
		buckets.set(key, bucket);
	});
	for (const { geometries, material, rotor } of buckets.values()) {
		(rotor >= 0 ? rotors[rotor] : robot).add(new Mesh(mergeGeometries(geometries, false), materials[material]));
		geometries.forEach((g) => g.dispose());
	}
	// The new parts, merged per material and per place (robot, a rotor, the extension).
	const modBuckets = new Map<string, { geometries: BufferGeometry[]; material: (typeof mods.pieces)[number]["material"]; parent: Object3D }>();
	const ids = new Map<object, number>();
	mods.pieces.forEach((piece) => {
		const g = piece.geometry.index ? piece.geometry.toNonIndexed() : piece.geometry;
		if (!g.getAttribute("uv")) g.setAttribute("uv", new BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
		featureOf(g, n++);
		const parent = piece.on === "flaps" ? flaps : piece.rotor >= 0 ? rotors[piece.rotor] : robot;
		if (!ids.has(piece.material)) ids.set(piece.material, ids.size);
		const key = `${piece.on ?? piece.rotor}:${ids.get(piece.material)}`;
		const bucket = modBuckets.get(key) ?? { geometries: [], material: piece.material, parent };
		bucket.geometries.push(g);
		modBuckets.set(key, bucket);
	});
	for (const { geometries, material, parent } of modBuckets.values()) {
		const merged = mergeGeometries(geometries.map((g) => (g.getAttribute("normal") ? g : (g.computeVertexNormals(), g))), false);
		if (merged) parent.add(new Mesh(merged, material));
		geometries.forEach((g) => g.dispose());
	}
	// The plates are bare aluminium on the real robot.
	for (const m of materials.filter((_, i) => cad.materials[i] === "#a5a5a5")) {
		m.color.set(0xc6cbd2);
		m.metalness = 0.85;
		m.roughness = 0.32;
	}
	shapes.forEach((g) => g.dispose());

	/* ---------- Team number on the bumpers (where the CAD has "KITBOT") ---------- */
	await document.fonts.load('700 96px "Archivo Variable"').catch(() => undefined);
	const TEAM = "10951";
	/** `canvasWidth` sets the aspect: 560 px wide gives ~66 mm tall digits on a 0.31 m plane. */
	const numbers: MeshStandardMaterial[] = [];
	const lettering = (width: number, canvasWidth: number) => {
		const texture = textTexture(TEAM, { width: canvasWidth, height: 120, font: '700 96px "Archivo Variable", "Arial", sans-serif', color: "#e8edf4" });
		const geometry = new PlaneGeometry(width, (width * 120) / canvasWidth);
		if (tag) geometry.setAttribute("feature", new BufferAttribute(new Float32Array(geometry.getAttribute("position").count), 1));
		const material = new MeshStandardMaterial({ map: texture, transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
		numbers.push(material);
		return new Mesh(geometry, material);
	};
	const decals: Array<[number, number, [number, number, number], number]> = [
		[0.31, 560, [0.4208, 0.137, 0.027], Math.PI / 2], // right side
		[0.31, 560, [-0.4208, 0.137, 0.027], -Math.PI / 2], // left side
		[0.31, 560, [0, 0.137, -0.4178], Math.PI], // back
		[0.17, 380, [-0.314, 0.137, 0.4178], 0], // front corners, either side of the intake
		[0.17, 380, [0.314, 0.137, 0.4178], 0],
	];
	for (const [width, canvasWidth, [x, y, z], turn] of decals) {
		const mesh = lettering(width, canvasWidth);
		mesh.position.set(x, y, z);
		mesh.rotation.y = turn;
		robot.add(mesh);
	}

	/* ---------- FUEL: floor -> intake -> hopper -> feeder -> launcher wheel -> up the hood ---------- */
	const at = (z: number, y: number) => new Vector3(0, y, z);
	// Ball centres (side view: z forward, y up), clear of the rollers and ramps except for a little squash.
	const intakePath = new CatmullRomCurve3([
		at(0.64, BALL_R), at(0.45, BALL_R), at(0.33, 0.085), at(0.275, 0.115), at(0.225, 0.165),
		at(0.17, 0.22), at(0.12, 0.25), at(0.07, 0.265), at(0.03, 0.275),
	]);
	const feedPath = new CatmullRomCurve3([
		at(0.03, 0.275), at(0.1, 0.255), at(0.16, 0.27), at(0.195, 0.33), at(0.225, 0.4), at(0.245, 0.458),
		at(0.24, 0.51), at(0.225, 0.56),
	]);
	const exit = feedPath.getPointAt(1);
	const exitDir = feedPath.getTangentAt(1);
	// Slow-motion arc that peaks about 30 cm above the hood, inside the frame.
	const flight = (ball: Mesh, s: number) =>
		ball.position.set(0, exit.y + exitDir.y * 0.9 * s - 0.7 * s * s, exit.z + exitDir.z * 0.9 * s);

	const ballGeometry = new SphereGeometry(BALL_R, 24, 16);
	const ballMaterial = hardware({ color: 0xffc20e, roughness: 0.85 }, "foam");
	const PERIOD = 5;
	const balls = [0, 0.5].map((offset) => {
		const ball = new Mesh(ballGeometry, ballMaterial);
		ball.userData.shadow = false; // it moves: the floor shadow is drawn once
		robot.add(ball);
		return { ball, offset };
	});
	const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
	const placeBall = (ball: Mesh, t: number) => {
		const phase = t % PERIOD;
		ball.visible = phase < 3.9;
		ball.scale.setScalar(1);
		if (phase < 1.5) {
			ball.position.copy(intakePath.getPointAt(easeInOut(phase / 1.5)));
			ball.scale.setScalar(Math.min(1, phase / 0.3));
			ball.rotation.x -= 0.12;
		} else if (phase < 2.2) {
			ball.position.copy(intakePath.getPointAt(1)); // waits in the hopper, against the feeder
		} else if (phase < 2.8) {
			const u = (phase - 2.2) / 0.6;
			ball.position.copy(feedPath.getPointAt(u * u)); // speeds up as the launcher wheel grabs it
			ball.scale.setScalar(u > 0.45 && u < 0.95 ? 0.86 : 1); // squashed between the wheel and the hood
			ball.rotation.x += 0.3;
		} else if (phase < 3.9) {
			const s = phase - 2.8;
			flight(ball, s);
			ball.scale.setScalar(s < 0.8 ? 1 : 1 - (s - 0.8) / 0.3);
		}
	};

	/* ---------- Floor ---------- */
	const shadow = contactShadow(0.75, 0.35, 0.5);
	shadow.position.y = 0.002;
	robot.add(shadow);

	const anchor = ([x, y, z]: V3) => {
		const point = new Object3D();
		point.position.set(x, y, z);
		robot.add(point);
		return point;
	};

	// Still pose (reduced motion): one ball waiting in the hopper, one just launched.
	balls[0].ball.position.copy(intakePath.getPointAt(1));
	flight(balls[1].ball, 0.25);

	// The extension: folded for a moment, swings up, stays open, folds again (a 12 s loop), unless pinned.
	let pinned: number | null = null;
	const setFlaps = (open: number) => {
		const p = extensionPose(open);
		flaps.position.set(0, p.y, p.z);
		flaps.rotation.x = p.turn;
	};
	const openAt = (t: number) => {
		const p = t % 12;
		const ease = (u: number) => u * u * (3 - 2 * u);
		if (p < 2.5) return 0;
		if (p < 4) return ease((p - 2.5) / 1.5);
		if (p < 10.5) return 1;
		return 1 - ease((p - 10.5) / 1.5);
	};
	setFlaps(1);

	return {
		model: robot,
		anchors: robotAnchors,
		anchor,
		balls: balls.map((b) => b.ball),
		materials: (color) => (color === "numbers" ? numbers : materials.filter((_, i) => cad.materials[i] === color)),
		animate(t, dt) {
			if (dt === 0) return;
			// Positive rotation about x: a roller's underside moves back, its front face down.
			rotors[0].rotation.x += dt * 9; // intake rollers pull the ball in underneath
			rotors[1].rotation.x += dt * 9;
			rotors[2].rotation.x -= dt * 18; // launcher wheel: front face up, along the hood
			rotors[3].rotation.x -= dt * 8; // feeder pushes the ball forward into the launcher
			for (const { ball, offset } of balls) placeBall(ball, t + offset * PERIOD);
			setFlaps(pinned ?? openAt(t));
		},
		clear: () => [...materials.filter((_, i) => cad.clear.includes(i)), mods.clear],
		setOpen(open) {
			pinned = open;
			if (open !== null) setFlaps(open);
		},
		pose(t) {
			for (const { ball, offset } of balls) placeBall(ball, t + offset * PERIOD);
		},
		applyPalette(p) {
			(shadow.material as MeshBasicMaterial).opacity = p.dark ? 0.6 : 0.32;
		},
	};
}

export default async function createRobot(ctx: StageContext): Promise<Model> {
	const rig = await buildRobot(ctx.root);
	const a = rig.anchors;
	// One part is called out at a time, so labels never pile up.
	const tourClass = "opacity-0 transition-opacity duration-500 data-[on]:opacity-100";
	const tour = [
		ctx.label("Intake", rig.anchor([-0.12, a.intake[1] + 0.04, a.intake[2] + 0.06]), tourClass),
		ctx.label("Hopper", rig.anchor([0, a.hopper[1] + 0.02, a.hopper[2]]), tourClass),
		ctx.label("Flywheel", rig.anchor([0, a.launcher[1] + 0.07, a.launcher[2]]), tourClass),
		ctx.label("Hood", rig.anchor([0, a.hood[1] + 0.12, a.hood[2]]), tourClass),
		ctx.label("Kraken X60s", rig.anchor([0.33, 0.36, 0.268]), tourClass),
		ctx.label("Electronics", rig.anchor([0.07, 0.25, -0.08]), tourClass),
		ctx.label("Battery", rig.anchor([a.battery[0], a.battery[1] + 0.06, a.battery[2]]), tourClass),
	];
	let shown = -1;

	return {
		update(t, dt) {
			const current = dt === 0 ? -2 : Math.floor(t / 2.5) % tour.length;
			if (current !== shown) {
				shown = current;
				tour.forEach((el, i) => el.toggleAttribute("data-on", current === -2 || i === current));
			}
			rig.animate(t, dt);
		},
		applyPalette: (p) => rig.applyPalette(p),
	};
}
