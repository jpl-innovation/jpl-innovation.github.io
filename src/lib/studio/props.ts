/**
 * Set dressing: the small things that make the room look worked in (shelving with bins, a plant, a rug, a toolbox,
 * a parts shelf over the drone bench, laptops on the team's table, a badge on a lanyard by the door). Plain shapes in
 * the room's own materials, placed so they sit in frame beside each scene's subject and never in front of it.
 * Positions are metres in the room's space (room.ts: the front wall is z = -3.4, the back wall z = 6.4).
 */
import {
	Box3,
	CylinderGeometry,
	DoubleSide,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	PlaneGeometry,
	SphereGeometry,
	TorusGeometry,
	Vector3,
} from "three";
import { hardware } from "../three/finish";
import { Batch, bin, binder, cardboard, cardboardBox, keyDeck, mug as realMug, notebook, shelvingFrame } from "./furniture";
import { contactShadow } from "../three/stage";
import { model } from "./models";
import { boxAt, canvasSurface, DESK, imageTexture, ROOM, woodMaterial } from "./room";
import type { RoomState } from "./room";

export interface Props {
	/** The real models are in (or have failed, and the shapes built here stand in). */
	loaded: Promise<unknown>;
	/** Puts the tools and the clock in (real models; none on the low tier): after the room is shown, so the loading screen never waits for them. */
	tools(): Promise<unknown>;
	update(state: RoomState, dt: number): void;
}

const mat = (color: number, roughness = 0.6, finish: Parameters<typeof hardware>[1] = "plastic") => hardware({ color, roughness }, finish);

/** `real`: the small plants are the real model (models.ts); false on the low tier, which keeps the ones built here. */
export function buildProps(parent: Group, real: boolean): Props {
	const { z0, z1 } = ROOM;
	const steel = hardware({ color: 0x2d3446, roughness: 0.4, metalness: 0.7 }, "anodised");
	const wood = woodMaterial("oak_veneer_01");
	const kraft = mat(0xb08a5a, 0.85, "printed");
	const accents = [0x2f7ce6, 0xf5d042, 0x1b2d6e, 0xa98500, 0xf2eedf, 0x3d4770].map((c) => mat(c, 0.5)); // the palette

	/** A potted plant: a tapered pot and a handful of leaves. */
	const plant = (x: number, y: number, z: number, scale = 1) => {
		const g = new Group();
		g.position.set(x, y, z);
		g.scale.setScalar(scale);
		parent.add(g);
		const pot = new Mesh(new CylinderGeometry(0.15, 0.11, 0.22, 20), mat(0xe9eef7, 0.4, "plastic"));
		pot.position.y = 0.11;
		g.add(pot);
		const soil = new Mesh(new CylinderGeometry(0.135, 0.135, 0.02, 20), mat(0x2a2118, 0.95));
		soil.position.y = 0.225;
		g.add(soil);
		const leaf = hardware({ color: 0x2f8f5b, roughness: 0.7, side: DoubleSide }, "fabric");
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * Math.PI * 2;
			const tilt = 0.45 + (i % 3) * 0.18;
			const stem = new Mesh(new SphereGeometry(0.1, 10, 8), leaf);
			stem.scale.set(0.5, 1.6 + (i % 3) * 0.35, 0.18);
			stem.position.set(Math.sin(a) * 0.07, 0.4 + (i % 3) * 0.06, Math.cos(a) * 0.07);
			stem.rotation.set(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt);
			g.add(stem);
		}
		return g;
	};

	/**
	 * A small plant in its pot, 27 cm tall before `scale`: the real one where the tier allows, each turned, sized and
	 * tinted its own way; otherwise (or if its file does not come) the one built here at `plain` times its size, if any.
	 */
	const loading: Promise<unknown>[] = [];
	const smallPlant = (x: number, y: number, z: number, scale: number, turn: number, tint: number, plain = 0) => {
		const builtHere = () => plain && plant(x, y, z, plain);
		if (!real) return void builtHere();
		loading.push(
			model("potted-plant").then((g) => {
				g.position.set(x, y, z);
				g.rotation.y = turn;
				g.scale.setScalar(scale);
				const lit = x < -4.55 && z < -0.6; // within the desk lamp's reach: its shadows (room.ts)
				g.traverse((o) => {
					const mesh = o as Mesh;
					if (!mesh.isMesh) return;
					mesh.castShadow = mesh.receiveShadow = lit;
					// One material for the whole scan: the leaves get their own copy, for their own green.
					if (mesh.name.endsWith("_plant")) (mesh.material = (mesh.material as MeshStandardMaterial).clone()).color.set(tint);
				});
				parent.add(g);
			}, builtHere),
		);
	};

	/**
	 * A plant on the floor, 84 cm tall before `scale`: the real one (a cream pot) where the tier allows, turned, sized and
	 * tinted its own way; otherwise (or if its file does not come) the one built here at `plain` times its size.
	 */
	const floorPlant = (x: number, z: number, scale: number, turn: number, tint: number, plain: number) => {
		const builtHere = () => void plant(x, 0, z, plain);
		if (!real) return builtHere();
		loading.push(
			model("floor-plant").then((g) => {
				g.position.set(x, 0, z);
				g.rotation.y = turn;
				g.scale.setScalar(scale);
				const lit = x < -4.55 && z < -0.6; // within the desk lamp's reach: its shadows (room.ts)
				g.traverse((o) => {
					const mesh = o as Mesh;
					if (!mesh.isMesh) return;
					mesh.castShadow = mesh.receiveShadow = lit;
					const material = mesh.material as MeshStandardMaterial;
					if (material.name.endsWith("_leaves")) (mesh.material = material.clone()).color.set(tint);
				});
				parent.add(g);
			}, builtHere),
		);
	};

	/** A model's glass (the clock's, the meter's) as plain clear glass: the files' own is dark, or (transmission) has the whole room drawn twice. */
	const clearGlass = (g: Group) =>
		g.traverse((o) => {
			const glass = (o as Mesh).material as MeshPhysicalMaterial | undefined;
			if (glass?.name?.endsWith("_glass")) Object.assign(glass, { map: null, transmission: 0, transparent: true, opacity: 0.12, depthWrite: false });
		});

	/**
	 * A real tool (models.ts) standing or, with `lay`, lying on a bench, over its own soft shadow; nothing on the low tier.
	 */
	const tool = (name: string, x: number, y: number, z: number, turn: number, lay?: [number, number, number]) =>
		model(name, lay).then(
			(g) => {
				g.position.set(x, y, z);
				g.rotation.y = turn;
				clearGlass(g);
				parent.add(g);
				const size = new Box3().setFromObject(g).getSize(new Vector3());
				const shadow = contactShadow(Math.max(size.x, size.z) * 0.6, 0.5, size.y);
				shadow.position.set(x, y + 0.004, z);
				parent.add(shadow);
			},
			() => {},
		);

	/** Open shelving: two uprights, boards, and what sits on them. */
	const shelving = (x: number, z: number, width: number, boards: number[], depth = 0.34) => {
		// A real frame where the tier allows (furniture.ts: `small` takes its posts, feet and bolts); two plain uprights otherwise.
		if (small) shelvingFrame(small, x, z, width, depth, boards);
		else for (const sx of [-1, 1]) boxAt(parent, 0.04, boards[boards.length - 1] + 0.12, depth, steel, x + sx * (width / 2 - 0.02), (boards[boards.length - 1] + 0.12) / 2, z);
		// Between the uprights and a little shallower: boards as wide and deep as them would share their faces, and flicker.
		for (const y of boards) boxAt(parent, width - 0.082, 0.03, depth - 0.03, wood, x, y, z + 0.005, 0.006);
		boxAt(parent, width - 0.08, boards[boards.length - 1] + 0.1, 0.01, mat(0x111a33, 0.9), x, (boards[boards.length - 1] + 0.1) / 2 + 0.02, z - depth / 2 + 0.005); // the back panel
	};

	/* ---------- The storage shelving by the desk (the title scene's frame, left of the desk) ---------- */
	const sx = -8.0;
	const sz = z0 + 0.2;
	// Where the tier allows, what stands on it is real (furniture.ts) and drawn as three meshes: the coloured parts
	// (`small`), the cardboard and its tape. On the low tier, the plain boxes below.
	const small = real ? new Batch([sx, 0, sz]) : undefined;
	shelving(sx, sz, 0.9, [0.12, 0.55, 0.98, 1.41, 1.84]);
	const binderColors = [0x1f5fc4, 0x0a174e, 0xa98500, 0x2f7ce6, 0xf5d042, 0x3d4770];
	const palette = [0x2f7ce6, 0xf5d042, 0x1b2d6e, 0xa98500, 0xf2eedf, 0x3d4770];
	if (small) {
		// Floor shelf: two big bins. Second: binders, one leaning on the last. Third: boxes. Fourth: small bins.
		bin(small, sx - 0.2, 0.135, sz, 0.36, 0.28, 0.28, palette[0]);
		bin(small, sx + 0.2, 0.135, sz, 0.36, 0.28, 0.28, palette[2]);
		binderColors.forEach((c, i) => binder(small, sx - 0.36 + i * 0.076 + (i === 5 ? 0.075 : 0), 0.565, sz + (i % 3) * 0.004, c, 1, i === 5 ? -0.2 : 0));
		const card = new Batch([sx, 0, sz]);
		const tape = new Batch([sx, 0, sz]);
		cardboardBox(card, tape, sx - 0.22, 0.995, sz, 0.3, 0.22, 0.26);
		cardboardBox(card, tape, sx + 0.18, 0.995, sz, 0.26, 0.16, 0.26);
		cardboardBox(card, tape, sx + 0.17, 1.155, sz + 0.01, 0.2, 0.12, 0.2);
		card.mesh(parent, cardboard());
		tape.mesh(parent);
		for (let i = 0; i < 4; i++) bin(small, sx - 0.3 + i * 0.2, 1.425, sz, 0.17, 0.12, 0.24, palette[(i + 1) % palette.length]);
		small.mesh(parent);
	} else {
		// Floor shelf: two big bins.
		boxAt(parent, 0.36, 0.28, 0.28, accents[0], sx - 0.2, 0.28, sz, 0.02);
		boxAt(parent, 0.36, 0.28, 0.28, accents[2], sx + 0.2, 0.28, sz, 0.02);
		// Second: a row of binders.
		const label = mat(0xf4efe2, 0.9, "printed");
		binderColors.forEach((c, i) => {
			boxAt(parent, 0.07, 0.3, 0.24, mat(c, 0.55), sx - 0.33 + i * 0.1, 0.72, sz, 0.005);
			boxAt(parent, 0.042, 0.085, 0.002, label, sx - 0.33 + i * 0.1, 0.76, sz + 0.1205); // a blank spine label
		});
		// Third: cardboard boxes.
		boxAt(parent, 0.3, 0.22, 0.26, kraft, sx - 0.22, 1.12, sz, 0.01);
		boxAt(parent, 0.26, 0.16, 0.26, kraft, sx + 0.18, 1.09, sz, 0.01);
		boxAt(parent, 0.2, 0.12, 0.2, kraft, sx + 0.18, 1.23, sz, 0.01);
		// Packing tape along each box's lid and a little way down its front.
		const tape = mat(0xc9a877, 0.35, "wrap");
		for (const [bx, by, bh, bd] of [[sx - 0.22, 1.12, 0.22, 0.26], [sx + 0.18, 1.09, 0.16, 0.26], [sx + 0.18, 1.23, 0.12, 0.2]]) {
			boxAt(parent, 0.048, 0.0015, bd - 0.016, tape, bx, by + bh / 2 + 0.0008, sz);
			boxAt(parent, 0.048, 0.05, 0.0015, tape, bx, by + bh / 2 - 0.03, sz + bd / 2 + 0.0008);
		}
		// Fourth: small bins in the team's colours.
		for (let i = 0; i < 4; i++) boxAt(parent, 0.17, 0.12, 0.24, accents[(i + 1) % accents.length], sx - 0.3 + i * 0.2, 1.5, sz, 0.015);
	}
	// Top: a small plant.
	smallPlant(sx, 1.855, sz + 0.02, 1.1, 0.6, 0xe4ffe0, 0.55);
	// And a taller one on the floor beside the desk.
	floorPlant(-7.98, -1.55, 1.15, 0.9, 0xffffff, 1.2); // on open floor: from the title shot, clear of the shelving and the desk

	/* ---------- A rug under the desk ---------- */
	const rugFace = canvasSurface(512, 352);
	{
		const { g } = rugFace;
		g.fillStyle = "#16213f";
		g.fillRect(0, 0, 512, 352);
		g.strokeStyle = "#f5d042";
		g.globalAlpha = 0.55;
		g.lineWidth = 5;
		g.strokeRect(24, 24, 464, 304);
		g.globalAlpha = 0.28;
		g.lineWidth = 2;
		g.strokeRect(44, 44, 424, 264);
		g.globalAlpha = 0.18;
		for (let i = 0; i < 9; i++) {
			g.beginPath();
			g.moveTo(64 + i * 48, 64);
			g.lineTo(64 + i * 48, 288);
			g.stroke();
		}
		rugFace.redraw();
	}
	const rug = new Mesh(new PlaneGeometry(3.0, 2.1), new MeshStandardMaterial({ map: rugFace.texture, roughness: 1 }));
	rug.rotation.x = -Math.PI / 2;
	rug.position.set(-6, 0.006, z0 + 1.45);
	parent.add(rug);

	/* ---------- Robotics: a toolbox and spare wheels ---------- */
	const red = mat(0xc8283a, 0.45);
	boxAt(parent, 0.52, 0.22, 0.26, red, 0.22, 0.11, -1.95, 0.02);
	boxAt(parent, 0.5, 0.05, 0.24, mat(0x9a1f2e, 0.45), 0.22, 0.245, -1.95, 0.015);
	const handle = new Mesh(new TorusGeometry(0.06, 0.008, 8, 16, Math.PI), steel);
	handle.position.set(0.22, 0.27, -1.95);
	parent.add(handle);
	const tire = mat(0x14171f, 0.9, "rubber");
	for (let i = 0; i < 3; i++) {
		const wheel = new Mesh(new CylinderGeometry(0.1, 0.1, 0.05, 20), tire);
		wheel.position.set(-1.75, 0.03 + i * 0.052, -3.0);
		parent.add(wheel);
	}

	/* ---------- Drones: a parts shelf over the bench ---------- */
	const px = 1.1;
	boxAt(parent, 1.5, 0.03, 0.26, wood, px, 1.5, z0 + 0.15, 0.006);
	boxAt(parent, 1.5, 0.03, 0.26, wood, px, 1.9, z0 + 0.15, 0.006);
	for (const bx of [-0.62, 0.62]) boxAt(parent, 0.03, 0.46, 0.04, steel, px + bx, 1.7, z0 + 0.06);
	// LiPo bags, flat, with a red label each; a stack of prop packs; a coil of wire.
	for (let i = 0; i < 3; i++) {
		boxAt(parent, 0.14, 0.05, 0.1, mat(0x161a24, 0.5, "wrap"), px - 0.5 + i * 0.17, 1.545, z0 + 0.15, 0.01);
		boxAt(parent, 0.06, 0.004, 0.04, red, px - 0.5 + i * 0.17, 1.572, z0 + 0.15);
	}
	for (let i = 0; i < 3; i++) boxAt(parent, 0.22, 0.015, 0.12, mat(0x1d2b4f, 0.5), px + 0.12, 1.53 + i * 0.016, z0 + 0.15, 0.003);
	const coil = new Mesh(new TorusGeometry(0.05, 0.016, 8, 20), mat(0xf0596b, 0.5));
	coil.rotation.x = Math.PI / 2;
	coil.position.set(px + 0.5, 1.55, z0 + 0.15);
	parent.add(coil);
	// Upper shelf: bins.
	for (let i = 0; i < 5; i++) boxAt(parent, 0.2, 0.13, 0.2, accents[i % accents.length], px - 0.55 + i * 0.27, 1.975, z0 + 0.15, 0.015);

	/* ---------- Web: a mug and a notebook by the laptop ---------- */
	// (Real ones where the tier allows, with everything else small on the benches and the table: one mesh, `bits`.)
	const bits = real ? new Batch([0, 0, 0]) : undefined;
	if (bits) {
		realMug(bits, -2.6 - 0.62, 0.85, -2.75, 0xf2f4f8, 2.2);
		notebook(bits, -2.6 + 0.62, 0.85, -2.52, 0.2, 0.28, 0xf4efe2, -0.3); // (in front of the multimeter)
	} else {
		const mug = new Mesh(new CylinderGeometry(0.04, 0.036, 0.1, 20), mat(0xf2f4f8, 0.35, "wrap"));
		mug.position.set(-2.6 - 0.62, 0.9, -2.75);
		parent.add(mug);
		boxAt(parent, 0.2, 0.016, 0.28, mat(0xf4efe2, 0.9, "printed"), -2.6 + 0.62, 0.858, -2.52, 0.003).rotation.y = -0.3; // (in front of the multimeter)
	}

	/* ---------- Networks: a cable spool at the rack's foot ---------- */
	const spool = new Mesh(new CylinderGeometry(0.11, 0.11, 0.12, 20), mat(0xc8283a, 0.5));
	spool.position.set(3.75, 0.06, -2.2);
	parent.add(spool);
	const spoolCore = new Mesh(new CylinderGeometry(0.045, 0.045, 0.14, 12), steel);
	spoolCore.position.copy(spool.position);
	parent.add(spoolCore);

	/* ---------- The crew's table: two laptops, notebooks, a plant ---------- */
	const alu = hardware({ color: 0xb4bccb, roughness: 0.32, metalness: 0.85 }, "anodised");
	const screenGlow = new MeshBasicMaterial({ color: 0x1a2a52, toneMapped: false });
	const tableTop = 0.77;
	for (const [x, turn] of [[-3.05, 0.25], [-1.75, -0.2]] as const) {
		const laptop = new Group();
		laptop.position.set(x, tableTop, 4.78);
		laptop.rotation.y = Math.PI + turn;
		parent.add(laptop);
		boxAt(laptop, 0.34, 0.012, 0.23, alu, 0, 0.006, 0, 0.005);
		if (real) {
			// Its keys, palm rest and trackpad, and the hinge the lid turns on.
			const deck = keyDeck(0.33, 0.22, true);
			deck.position.set(0, 0.0123, 0);
			laptop.add(deck);
			const hinge = new Mesh(new CylinderGeometry(0.006, 0.006, 0.26, 10), alu);
			hinge.rotation.z = Math.PI / 2;
			hinge.position.set(0, 0.012, -0.112);
			laptop.add(hinge);
		}
		const lid = new Group();
		lid.position.set(0, 0.012, -0.11);
		lid.rotation.x = -0.32;
		laptop.add(lid);
		boxAt(lid, 0.34, 0.22, 0.008, alu, 0, 0.11, 0, 0.004);
		const screen = new Mesh(new PlaneGeometry(0.32, 0.2), screenGlow);
		screen.position.set(0, 0.11, 0.005);
		lid.add(screen);
	}
	if (bits) {
		notebook(bits, -2.4, tableTop, 5.0, 0.17, 0.23, 0xf4efe2, 0.5);
		notebook(bits, -2.15, tableTop, 4.95, 0.17, 0.23, 0x23324f, -0.2);
		bits.mesh(parent);
	} else {
		boxAt(parent, 0.17, 0.014, 0.23, mat(0xf4efe2, 0.9, "printed"), -2.4, tableTop + 0.007, 5.0, 0.003).rotation.y = 0.5;
		boxAt(parent, 0.17, 0.014, 0.23, mat(0x23324f, 0.7), -2.15, tableTop + 0.007, 4.95, 0.003).rotation.y = -0.2;
	}
	floorPlant(-3.95, z1 - 0.5, 1.3, 3.6, 0xf2ffe6, 1.4);

	/* ---------- The window sill: a small plant ---------- */
	smallPlant(2.55, 0.88, z1 - 0.075, 1, 2.4, 0xfff6d8, 0.6);

	/* ---------- The desk: a small plant at its back, between the book and the monitor ---------- */
	smallPlant(DESK.x + 0.3, DESK.top, DESK.z - 0.3, 0.9, 4.1, 0xffffff);

	/* ---------- The door: a mat, and a badge on a lanyard from a hook rail ---------- */
	const doorX = -5.6;
	boxAt(parent, 0.9, 0.012, 0.5, mat(0x1c2540, 1, "fabric"), doorX, 0.006, z1 - 0.55, 0.004);
	boxAt(parent, 0.5, 0.03, 0.03, steel, doorX + 1.15, 1.72, z1 - 0.025);
	const badgeHolder = new Group();
	badgeHolder.position.set(doorX + 1.15, 1.72, z1 - 0.06);
	parent.add(badgeHolder);
	boxAt(badgeHolder, 0.012, 0.34, 0.004, mat(0x3b4fd8, 0.6, "fabric"), 0, -0.17, 0);
	const badgeFace = new Mesh(new PlaneGeometry(0.11, 0.15), new MeshBasicMaterial({ map: imageTexture("/assets/jpl-logo-dark-480.webp"), transparent: true, toneMapped: false }));
	badgeFace.rotation.y = Math.PI;
	badgeFace.position.set(0, -0.44, -0.004);
	badgeHolder.add(badgeFace);
	boxAt(badgeHolder, 0.12, 0.16, 0.006, mat(0x0b1226, 0.5), 0, -0.44, 0.002, 0.008);

	let sway = 0;
	return {
		loaded: Promise.all(loading),
		// Left out on the benches (stations.ts: their tops are at 0.85), clear of what each bench shows; a clock on the
		// back wall, over the binders.
		tools: () =>
			Promise.all(
				real
					? [
							tool("pliers", 0.84, 0.85, -2.44, 0.5, [Math.PI / 2, 0, 0]),
							tool("screwdriver", 0.88, 0.85, -2.29, -0.25, [0, 0, Math.PI / 2]),
							tool("drill", 0.93, 0.85, -2.6, 0.7),
							tool("multimeter", -1.95, 0.85, -2.86, -0.3),
							tool("measuring-tape", -3.16, 0.85, -2.42, -0.6),
							model("wall-clock").then((g) => {
								g.position.set(6.75, 2.2, z1 - 0.026);
								g.rotation.y = Math.PI;
								clearGlass(g);
								parent.add(g);
							}, () => {}),
						]
					: [],
			),
		update(_state, dt) {
			// The badge sways on its lanyard in the draught of the door.
			sway += dt;
			badgeHolder.rotation.z = Math.sin(sway * 0.9) * 0.05;
		},
	};
}
