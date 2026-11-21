/**
 * Look b's two walls that stood empty (walls.ts calls this; medium and high tiers only), hung with our own work:
 *
 *   The left wall by the shelves (the title)   a gallery of framed prints: the F450 drawn from above, the robot's CAD
 *       as a line drawing (scripts/studio-prints.py), the Lifetime icon and the 10951 team emblem, under one brass
 *       picture light with its warm wash; on the oak ledge below, a spare propeller, a bare drone frame and a small
 *       plant. All of it above or below where the page's opening words lie over this wall.
 *   The front wall right of the rack (between networks and the project wall)   the CCNA lab as it is in the console
 *       (src/lib/look/ios.ts, lab(): L3SW with VLAN 10 and VLAN 20) drawn as a framed diagram; a wall-mounted patch
 *       panel with its patch leads in the VLANs' two colours, its bundle running up and along a cable tray to the rack;
 *       and navy and yellow felt panels.
 *
 * Every material is a kind the room already has (no new shader).
 */
import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, type Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, type Texture, TorusGeometry, Vector3 } from "three";
import { lab } from "../look/ios";
import { barGeometry, Batch } from "./furniture";
import { boxAt, imageTexture, loadImage, ROOM, woodMaterial } from "./room";

const GRAPHITE = 0x262c3a;
const BRASS = 0xc09a5b;
const NAVY = "#1b2d6e";
const CREAM = "#f2eedf";
const YELLOW = 0xf5d042;
const BLUE = 0x2f7ce6;

/** A canvas made into a picture for a print. */
function canvasPrint(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void | Promise<void>) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const g = c.getContext("2d")!;
	g.fillStyle = NAVY;
	g.fillRect(0, 0, w, h);
	const map = new CanvasTexture(c);
	map.colorSpace = SRGBColorSpace;
	map.anisotropy = 8;
	void Promise.resolve(draw(g)).then(() => (map.needsUpdate = true));
	return map;
}

export function buildGallery(group: Group, blueprint: CanvasTexture, felt: { navy: Material; yellow: Material }, brass: Material) {
	const { x0, z0 } = ROOM;
	const trim = new Batch([0, 0, 0]);
	const shine = new Batch([0, 0, 0]); // brass
	const oak = woodMaterial("oak_veneer_01");

	/**
	 * A framed print on a wall: `at` its middle, `turn` which way it faces (0: +z, the front wall; π/2: +x, the left
	 * wall), w x h its picture (m). A moulded frame (oak or graphite), a cream mount round the picture, a little proud of
	 * the wall on its hanging cleat.
	 */
	const print = (map: Texture, at: Vector3, turn: number, w: number, h: number, wood: boolean) => {
		const holder = new Group();
		holder.position.copy(at);
		holder.rotation.y = turn;
		group.add(holder);
		const M = 0.05; // the mount
		const F = 0.028; // the frame's face
		const D = 0.032; // its depth
		const frameMat = wood ? oak : undefined;
		const fw = w + 2 * M + 2 * F;
		const fh = h + 2 * M + 2 * F;
		for (const s of [-1, 1]) {
			if (frameMat) {
				boxAt(holder, fw, F, D, frameMat, 0, s * (fh / 2 - F / 2), D / 2, 0.004);
				boxAt(holder, F, fh - 2 * F, D, frameMat, s * (fw / 2 - F / 2), 0, D / 2, 0.004);
			}
		}
		const mount = new Mesh(new PlaneGeometry(w + 2 * M, h + 2 * M), new MeshStandardMaterial({ color: 0xf1ecdf, roughness: 0.95 }));
		mount.position.z = 0.006;
		holder.add(mount);
		const picture = new Mesh(new PlaneGeometry(w, h), new MeshStandardMaterial({ map, roughness: 0.85 }));
		picture.position.z = 0.0075;
		holder.add(picture);
		holder.updateMatrixWorld(true);
		if (!frameMat) {
			// A graphite frame: four bars in the trim's one mesh, in the room's coordinates.
			const corners = [
				[0, fh / 2 - F / 2, fw, F],
				[0, -(fh / 2 - F / 2), fw, F],
				[fw / 2 - F / 2, 0, F, fh - 2 * F],
				[-(fw / 2 - F / 2), 0, F, fh - 2 * F],
			];
			for (const [lx, ly, bw, bh] of corners) {
				const p = new Vector3(lx, ly, D / 2).applyMatrix4(holder.matrixWorld);
				trim.add(new BoxGeometry(bw, bh, D).rotateY(turn), GRAPHITE, p.x, p.y, p.z);
			}
		}
		return holder;
	};

	/* ================= The left wall by the shelves ================= */
	const side = Math.PI / 2;
	const onLeft = (z: number, y: number) => new Vector3(x0 + 0.004, y, z);
	// (The page's opening words lie over this wall between about 1.0 and 1.9 m at the title: the prints hang above them.)
	print(blueprint, onLeft(-2.49, 2.18), side, 0.44, 0.44, true);
	print(imageTexture("/studio/prints/robot-lines.webp"), onLeft(-1.86, 2.22), side, 0.48, 0.36, false);
	const lifetime = canvasPrint(800, 600, async (g) => {
		const image = await loadImage("/assets/lifetime.svg", 800);
		g.drawImage(image, 0, 0, 800, 600);
	});
	print(lifetime, onLeft(-1.33, 2.3), side, 0.24, 0.18, true);
	const team = canvasPrint(600, 600, async (g) => {
		const image = await loadImage("/assets/10951-400.webp");
		g.save();
		g.beginPath();
		g.arc(300, 300, 236, 0, Math.PI * 2);
		g.clip();
		g.drawImage(image, 300 - 240, 300 - 240, 480, 480);
		g.restore();
		g.strokeStyle = CREAM;
		g.lineWidth = 6;
		g.beginPath();
		g.arc(300, 300, 246, 0, Math.PI * 2);
		g.stroke();
	});
	print(team, onLeft(-1.33, 1.95), side, 0.2, 0.2, false);
	// The picture light over the gallery: a brass bar on two arms, and the warm wash it throws down the wall.
	shine.add(new CylinderGeometry(0.018, 0.018, 1.2, 18).rotateX(Math.PI / 2), BRASS, x0 + 0.17, 2.6, -1.95);
	for (const z of [-2.35, -1.55]) {
		shine.add(new CylinderGeometry(0.007, 0.007, 0.17, 10).rotateZ(Math.PI / 2), BRASS, x0 + 0.085, 2.6, z);
		shine.add(new CylinderGeometry(0.03, 0.03, 0.01, 18).rotateZ(Math.PI / 2), BRASS, x0 + 0.005, 2.6, z);
	}
	const washCanvas = document.createElement("canvas");
	washCanvas.width = 256;
	washCanvas.height = 128;
	const wg = washCanvas.getContext("2d")!;
	const pool = wg.createRadialGradient(128, 0, 4, 128, 0, 150);
	pool.addColorStop(0, "rgba(255,255,255,1)");
	pool.addColorStop(1, "rgba(255,255,255,0)");
	wg.fillStyle = pool;
	wg.fillRect(0, 0, 256, 128);
	const washMat = new MeshBasicMaterial({ color: 0xffc27a, map: new CanvasTexture(washCanvas), transparent: true, opacity: 0.16, depthWrite: false });
	const wash = new Mesh(new PlaneGeometry(2.0, 1.1), washMat);
	wash.rotation.y = side;
	wash.position.set(x0 + 0.002, 2.1, -1.95);
	wash.userData.shadow = false;
	group.add(wash);
	// On the oak ledge (the rail at 0.78 m becomes a ledge 9 cm deep where they stand): a spare propeller lying flat, a
	// bare drone frame (two crossed arms on a plate, motor mounts at their ends), a small potted succulent.
	const LEDGE = 0.78 + 0.0225;
	boxAt(group, 0.09, 0.022, 1.3, oak, x0 + 0.045, 0.78 + 0.011, -1.75, 0.004);
	const prop = (z: number, turn: number) => {
		trim.add(new CylinderGeometry(0.012, 0.012, 0.01, 14), GRAPHITE, x0 + 0.05, LEDGE + 0.005, z);
		for (const s of [-1, 1]) {
			const blade = new BoxGeometry(0.115, 0.004, 0.022).translate(s * 0.065, 0, 0).rotateY(turn + s * 0.12);
			trim.add(blade, 0xe9e4d6, x0 + 0.05, LEDGE + 0.006, z);
		}
	};
	prop(-2.2, 0.7);
	// The frame: a centre plate and four arms on the ledge, the motor mounts at the arms' ends.
	const fz = -1.55;
	const fx = x0 + 0.05;
	trim.box(0.06, 0.004, 0.06, fx, LEDGE + 0.012, fz, GRAPHITE, 0.003);
	for (const a of [Math.PI / 4, (3 * Math.PI) / 4]) {
		const d = new Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.11);
		trim.add(barGeometry(new Vector3(fx, LEDGE + 0.01, fz).sub(d), new Vector3(fx, LEDGE + 0.01, fz).add(d), 0.006, 8), 0xf2eedf, 0, 0, 0);
		for (const s of [-1, 1]) trim.add(new CylinderGeometry(0.014, 0.014, 0.01, 14), GRAPHITE, fx + s * d.x, LEDGE + 0.008, fz + s * d.z);
	}
	// (Seen edge-on, the arms of a frame lying flat read as a line: it stands on its side against the wall, propped.)
	// The succulent: a cream pot, a rosette of fleshy leaves.
	const pz = -1.05;
	trim.add(new CylinderGeometry(0.035, 0.028, 0.06, 18), 0xe9e4d6, x0 + 0.05, LEDGE + 0.03, pz);
	for (let i = 0; i < 9; i++) {
		const a = (i / 9) * Math.PI * 2;
		const r = i % 3 === 0 ? 0.012 : 0.022;
		trim.add(new CylinderGeometry(0.004, 0.009, 0.045, 6).rotateZ(0.6).rotateY(a), 0x4f7a52, x0 + 0.05 + Math.cos(a) * r, LEDGE + 0.075, pz + Math.sin(a) * r);
	}

	/* ================= The front wall right of the rack ================= */
	const front = 0; // (facing +z)
	const onFront = (x: number, y: number) => new Vector3(x, y, z0 + 0.004);
	// The CCNA lab, drawn from the console's own lab.
	const L = lab();
	const diagram = canvasPrint(1200, 840, (g) => drawLab(g, L));
	print(diagram, onFront(5.55, 1.45), front, 0.86, 0.6, false);
	// The patch panel on its wall bracket, and the leads from its ports into the cable manager under it.
	const PX = 4.45;
	const PY = 1.5;
	trim.box(0.5, 0.18, 0.14, PX, PY - 0.02, z0 + 0.07, GRAPHITE, 0.004); // the bracket
	trim.box(0.483, 0.044, 0.01, PX, PY + 0.03, z0 + 0.145, 0x1d2230); // 1U: 24 ports
	trim.box(0.483, 0.044, 0.04, PX, PY - 0.035, z0 + 0.13, 0x1b2029, 0.003); // the cable manager
	for (let i = 0; i < 24; i++) {
		const x = PX - 0.21 + (0.42 * i) / 23;
		trim.box(0.012, 0.011, 0.004, x, PY + 0.03, z0 + 0.151, 0x07090e);
		// Each lead in its VLAN's colour (Fa0/1-2: 10, Fa0/3-4: 20; the rest of the 24 alternate), dropping into the manager.
		const c = i % 4 < 2 ? BLUE : YELLOW;
		trim.add(barGeometry(new Vector3(x, PY + 0.022, z0 + 0.158), new Vector3(x + 0.004, PY - 0.016, z0 + 0.155), 0.0028, 6), c, 0, 0, 0);
	}
	for (const s of [-1, 1]) for (const dy of [0.015, 0.045]) trim.add(new CylinderGeometry(0.004, 0.004, 0.003, 8).rotateX(Math.PI / 2), 0xc0c6d0, PX + s * 0.232, PY + dy, z0 + 0.152);
	// On the lower half, under the patch panel: an oak shelf on two steel brackets, a spare 24-port switch lying on it and
	// two reels of patch cable in the VLANs' two colours.
	const SY = 0.86;
	const SX = 4.55;
	boxAt(group, 1.1, 0.03, 0.26, oak, SX, SY, z0 + 0.13, 0.005);
	for (const s of [-1, 1]) {
		trim.box(0.022, 0.004, 0.22, SX + s * 0.4, SY - 0.017, z0 + 0.11, GRAPHITE);
		trim.box(0.022, 0.16, 0.004, SX + s * 0.4, SY - 0.095, z0 + 0.002, GRAPHITE);
		trim.add(barGeometry(new Vector3(SX + s * 0.4, SY - 0.15, z0 + 0.004), new Vector3(SX + s * 0.4, SY - 0.02, z0 + 0.17), 0.004, 6), GRAPHITE, 0, 0, 0);
	}
	const top = SY + 0.015;
	trim.box(0.44, 0.044, 0.22, SX - 0.22, top + 0.022, z0 + 0.13, 0x3a4152, 0.003); // the switch
	trim.box(0.44, 0.044, 0.002, SX - 0.22, top + 0.022, z0 + 0.241, 0x1d2230);
	for (let i = 0; i < 24; i++) trim.box(0.011, 0.01, 0.003, SX - 0.42 + (i % 12) * 0.026 + (i >= 12 ? 0.03 : 0), top + 0.016 + (i % 2) * 0.014, z0 + 0.242, 0x07090e);
	for (const [i, c] of [BLUE, YELLOW].entries()) {
		const rx = SX + 0.2 + i * 0.19;
		for (const y of [0.006, 0.084]) trim.add(new CylinderGeometry(0.08, 0.08, 0.012, 24), GRAPHITE, rx, top + y, z0 + 0.13);
		trim.add(new CylinderGeometry(0.025, 0.025, 0.09, 12), 0x8a93a3, rx, top + 0.045, z0 + 0.13);
		for (let k = 0; k < 7; k++) trim.add(new TorusGeometry(0.058, 0.0055, 6, 24).rotateX(Math.PI / 2), c, rx, top + 0.017 + k * 0.0094, z0 + 0.13);
	}
	// The cable tray: a steel ladder on brackets from over the rack to over the panel, with the bundle in it, and the
	// bundle's two drops: into the rack's top and behind the panel.
	const TY = 2.32;
	const TX0 = 3.05;
	const TX1 = 4.8;
	for (const dz of [0.04, 0.2]) trim.box(TX1 - TX0, 0.04, 0.006, (TX0 + TX1) / 2, TY + 0.02, z0 + dz, 0x8a93a3);
	for (let x = TX0 + 0.05; x < TX1; x += 0.15) trim.box(0.02, 0.006, 0.16, x, TY + 0.003, z0 + 0.12, 0x8a93a3);
	for (const x of [TX0 + 0.2, (TX0 + TX1) / 2, TX1 - 0.2]) {
		trim.box(0.025, 0.12, 0.004, x, TY - 0.05, z0 + 0.003, 0x5d6577);
		trim.box(0.025, 0.004, 0.2, x, TY - 0.004, z0 + 0.1, 0x5d6577);
	}
	for (const [c, dz] of [[BLUE, 0.1], [YELLOW, 0.135], [BLUE, 0.155]] as const) {
		const y = TY + 0.016 + (dz - 0.1) * 0.3;
		trim.add(barGeometry(new Vector3(TX0 + 0.25, y, z0 + dz), new Vector3(TX1 - 0.25, y, z0 + dz), 0.009, 8), c, 0, 0, 0);
		trim.add(barGeometry(new Vector3(TX0 + 0.25, y, z0 + dz), new Vector3(3.3 + (dz - 0.13), 1.92, z0 + dz + 0.06), 0.009, 8), c, 0, 0, 0); // into the rack
		trim.add(barGeometry(new Vector3(TX1 - 0.25, y, z0 + dz), new Vector3(PX + (dz - 0.13) * 2, PY + 0.07, z0 + 0.05), 0.009, 8), c, 0, 0, 0); // behind the panel
	}
	// Felt panels, where a room full of fans and keyboards needs them: one block of three by two, even gaps, its top
	// lined up with the diagram's, the yellow two on a diagonal.
	const S = 0.5;
	const GAP = 0.05;
	const feltTop = 1.45 + 0.3 + 0.05 + 0.028; // the diagram's frame's top edge
	const panels: [number, number, boolean][] = [];
	for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) panels.push([6.5 + c * (S + GAP), feltTop - S / 2 - r * (S + GAP), (r === 0 && c === 1) || (r === 1 && c === 2)]);
	for (const [x, y, yellow] of panels) {
		const geometry = new BoxGeometry(S, S, 0.035);
		const uv = geometry.getAttribute("uv");
		for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * S) / 0.27, (uv.getY(i) * S) / 0.27);
		const m = new Mesh(geometry, yellow ? felt.yellow : felt.navy);
		m.position.set(x, y, z0 + 0.0185);
		m.receiveShadow = true;
		group.add(m);
	}

	/* ================= The right wall, past the project wall (between it and the window) ================= */
	// Two more of our own drawings in oak frames under a brass picture light: the mini drone, and the cybersecurity lab's
	// network (the same drawings as their pages' own).
	const { x1 } = ROOM;
	const onRight = (z: number, y: number) => new Vector3(x1 - 0.004, y, z);
	const svgPrint = (path: string, w: number, h: number) =>
		canvasPrint(w, h, async (g) => {
			const image = await loadImage(path, w);
			g.drawImage(image, 0, 0, w, h);
		});
	// (What shows of this wall, past the project wall's edge, runs from about z 4.35 to the window at 6.35.)
	print(svgPrint("/assets/mini-drone.svg", 800, 600), onRight(4.89, 1.62), -side, 0.56, 0.42, true);
	print(svgPrint("/assets/cybersecurity.svg", 1200, 750), onRight(5.79, 1.62), -side, 0.64, 0.4, true);
	shine.add(new CylinderGeometry(0.018, 0.018, 1.5, 18).rotateX(Math.PI / 2), BRASS, x1 - 0.17, 2.14, 5.35);
	for (const z of [4.85, 5.85]) {
		shine.add(new CylinderGeometry(0.007, 0.007, 0.17, 10).rotateZ(Math.PI / 2), BRASS, x1 - 0.085, 2.24, z);
		shine.add(new CylinderGeometry(0.03, 0.03, 0.01, 18).rotateZ(Math.PI / 2), BRASS, x1 - 0.005, 2.24, z);
	}
	const wash2 = new Mesh(new PlaneGeometry(2.0, 1.0), washMat);
	wash2.rotation.y = -side;
	wash2.position.set(x1 - 0.002, 1.7, 5.35);
	wash2.userData.shadow = false;
	group.add(wash2);

	trim.mesh(group);
	shine.mesh(group, brass);
	return {
		applyPalette(dark: boolean) {
			washMat.opacity = dark ? 0.16 : 0.08;
		},
	};
}

/** The CCNA lab as an engineer would draw it: the L3 switch, its two VLANs with their subnets and gateways, two PCs on each by port, the uplink. */
function drawLab(g: CanvasRenderingContext2D, d: ReturnType<typeof lab>) {
	const W = 1200;
	const ink = (a: number) => `rgba(242,238,223,${a})`;
	g.strokeStyle = ink(0.07);
	g.lineWidth = 1;
	for (let i = 0; i <= W; i += 40) {
		g.beginPath();
		g.moveTo(i, 0);
		g.lineTo(i, 840);
		g.stroke();
		g.beginPath();
		g.moveTo(0, i);
		g.lineTo(W, i);
		g.stroke();
	}
	g.font = '600 30px "Archivo Variable", "Archivo", system-ui, sans-serif';
	g.textAlign = "center";
	g.textBaseline = "middle";
	// The switch, in the middle, with its uplink up.
	const sx = 600;
	const sy = 330;
	g.strokeStyle = ink(0.9);
	g.lineWidth = 4;
	g.strokeRect(sx - 120, sy - 46, 240, 92);
	g.fillStyle = ink(0.95);
	g.fillText(d.hostname, sx, sy);
	const uplink = d.ifaces.find((f) => f.name.startsWith("Gigabit"));
	g.beginPath();
	g.moveTo(sx, sy - 46);
	g.lineTo(sx, 120);
	g.stroke();
	g.font = '500 22px "Archivo Variable", "Archivo", system-ui, sans-serif';
	if (uplink) g.fillText(uplink.name.replace("GigabitEthernet", "Gi"), sx + 70, 170);
	// The VLANs: their boxes, gateways and PCs.
	const vlans = [...d.vlans.entries()].filter(([id]) => id !== 1);
	vlans.forEach(([id, name], k) => {
		const colour = k === 0 ? "#2f7ce6" : "#f5d042";
		const bx = k === 0 ? 70 : 650;
		const bw = 480;
		g.strokeStyle = colour;
		g.lineWidth = 3;
		g.setLineDash([16, 10]);
		g.strokeRect(bx, 470, bw, 300);
		g.setLineDash([]);
		g.fillStyle = colour;
		g.font = '700 28px "Archivo Variable", "Archivo", system-ui, sans-serif';
		g.textAlign = "left";
		g.fillText(`VLAN ${id} ${name}`, bx + 20, 500);
		const svi = d.ifaces.find((f) => f.name === `Vlan${id}`);
		g.font = '500 22px "Archivo Variable", "Archivo", system-ui, sans-serif';
		g.fillStyle = ink(0.8);
		if (svi?.ip) g.fillText(`${svi.ip.replace(/\.\d+$/, ".0")}/24  ·  ${svi.ip}`, bx + 20, 535);
		// Its access ports, each to a PC.
		const ports = d.ifaces.filter((f) => f.mode === "access" && f.access === id);
		ports.forEach((port, j) => {
			const px = bx + 120 + j * 240;
			g.strokeStyle = colour;
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(sx + (k === 0 ? -60 : 60) + j * 30 * (k === 0 ? -1 : 1), sy + 46);
			g.lineTo(px, 620);
			g.stroke();
			// The PC: a screen on its stand.
			g.strokeStyle = ink(0.9);
			g.strokeRect(px - 50, 620, 100, 64);
			g.beginPath();
			g.moveTo(px, 684);
			g.lineTo(px, 706);
			g.moveTo(px - 30, 708);
			g.lineTo(px + 30, 708);
			g.stroke();
			g.fillStyle = ink(0.75);
			g.textAlign = "center";
			g.fillText(port.name.replace("FastEthernet", "Fa"), px, 740);
		});
	});
	g.textAlign = "center";
}
