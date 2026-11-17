/**
 * Lifetime page intro: 5.6 s on a first entry; on a refresh the very same timeline plays FAST_RATE times faster.
 * Markup and CSS: src/components/LifetimeSplash.astro. Shared overlay, skip, versions, reduced motion and clean-up:
 * src/scripts/splash-core.ts.
 *
 *   0.0–1.3  the dark: the yellow light breathes twice, like a sleeping computer's power light
 *   1.3–2.7  it wakes: the screen comes on, and five dots chase once round as a loading spinner, meeting in one
 *   2.7–4.0  the yellow dot runs on round the 24-hour dial and draws the ring behind it; the counter under it counts
 *            the awake time up as it goes
 *   4.0–4.9  the dot drops into the ring's gap, the tile comes up behind, the satellite unfolds its wings and the
 *            name rises under it
 *   5.0–5.6  the name flies onto the page's own title (FLIP) while the logo and the overlay fade
 *
 * Only transform / opacity animations (and the ring's dash), so the compositor keeps it smooth.
 */
import { markSeen } from "@/lib/splash";
import { E, onScreen, runSplash, type SplashContext } from "./splash-core";

const FAST_RATE = 2.9; // refresh version: 5.6 s → 1.9 s

/* Timeline marks, in seconds of the full version. */
const WAKE = 1.3; // the screen comes on
const SPIN = 1.35; // the spinner's first dot sets off
const STAGGER = 0.08; // between the spinner's dots
const TURN = 1.0; // one dot's turn round
const RING = SPIN + 4 * STAGGER + TURN; // the yellow dot, last of the five, arrives and starts the ring (2.67)
const RING_DUR = 1.3;
const GAP = RING + RING_DUR; // the ring is drawn; the dot drops into its gap (3.97)
const FLY = 5.0;
const LAND = 5.5;
const END = 5.62;

/* Where things sit round the dial, in degrees clockwise from the top (the dots are drawn at the top). */
const RING_FROM = 72; // the ring's open end at the right (1052.1, 506.2)
const RING_TO = 373.7; // its other end at the top right (740.4, 227), a turn on
const DOT = 383.3; // the logo's dot in the gap (802.5, 262.5)
/** The awake time the counter reaches with the ring: the ring's share of the 24-hour dial. */
const HOURS = ((RING_TO - RING_FROM) / 360) * 24;

const rotate = (deg: number) => `rotate(${deg}deg)`;
/**
 * For a second (third...) animation of the same property on the same element: it holds its first frame only from its
 * own start, not from the beginning of the timeline (where it would sit on top of the earlier ones).
 */
const LATER: KeyframeAnimationOptions = { fill: "forwards" };

function play(ctx: SplashContext) {
	const { el, tween, at, endWith, onCleanup } = ctx;
	markSeen("lifetime"); // later in-site arrivals in this tab get the fast version
	const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector<T>(sel);
	const orbits = [...el.querySelectorAll<SVGGElement>("[data-lts-orbit]")];
	const dots = orbits.map((o) => o.querySelector("circle"));
	const word = q("[data-lts-word]")!;

	/* ---------- 1. The dark: the power light breathes (0–1.3 s) ---------- */
	tween(orbits[0], [{ transform: rotate(RING_FROM - 360) }, { transform: rotate(RING_FROM - 360) }], 0, 0.01);
	tween(dots[0], [{ opacity: 0 }, { opacity: 1, offset: 0.22 }, { opacity: 0.12, offset: 0.55 }, { opacity: 1, offset: 0.85 }, { opacity: 0.3 }], 0.1, WAKE - 0.1, E.inOutSine);

	/* ---------- 2. It wakes: the screen comes on, the spinner chases once round (1.3–2.7 s) ---------- */
	tween(q("[data-lts-night]"), [{ opacity: 1 }, { opacity: 0 }], WAKE, 0.6, E.out);
	tween(dots[0], [{ opacity: 0.3 }, { opacity: 1 }], WAKE, 0.12, E.out, LATER);
	// The yellow dot goes last, so the others reach the start of the ring first and it gathers them up.
	orbits.forEach((orbit, i) => {
		const lead = i === 0;
		const start = SPIN + (lead ? 4 : 4 - i) * STAGGER;
		tween(orbit, [{ transform: rotate(RING_FROM - 360) }, { transform: rotate(RING_FROM) }], start, TURN, E.inOut, lead ? LATER : undefined);
		if (!lead) {
			tween(dots[i], [{ opacity: 0 }, { opacity: 0.9 }], start, 0.15, E.out);
			tween(dots[i], [{ opacity: 0.9, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.4)" }], start + TURN - 0.05, 0.2, E.out, LATER);
		}
	});
	for (const d of dots.slice(1)) d?.setAttribute("style", "transform-box: fill-box; transform-origin: center");

	/* ---------- 3. Round the dial: the ring drawn behind the dot, the awake time counted (2.7–4.0 s) ---------- */
	const ticks = q("[data-lts-ticks]");
	tween(ticks, [{ opacity: 0 }, { opacity: 0.32 }], RING - 0.2, 0.4, E.out);
	const ring = q("[data-lts-ring]");
	tween(ring, [{ opacity: 1 }, { opacity: 1 }], RING, 0.01);
	const drawing = tween(ring, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], RING, RING_DUR, E.inOutSine);
	tween(orbits[0], [{ transform: rotate(RING_FROM) }, { transform: rotate(RING_TO) }], RING, RING_DUR, E.inOutSine, LATER);
	const count = q("[data-lts-count]");
	tween(count, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], RING - 0.1, 0.35, E.out);
	const hours = q("[data-lts-hours]")!;
	const minutes = q("[data-lts-minutes]")!;
	let frame = 0;
	const tick = () => {
		const p = Number(drawing?.effect?.getComputedTiming().progress ?? 1);
		const total = Math.round(p * HOURS * 60);
		hours.textContent = String(Math.floor(total / 60));
		minutes.textContent = String(total % 60).padStart(2, "0");
		frame = requestAnimationFrame(tick);
	};
	frame = requestAnimationFrame(tick);
	onCleanup(() => cancelAnimationFrame(frame));

	/* ---------- 4. The logo comes together (4.0–4.9 s) ---------- */
	tween(orbits[0], [{ transform: rotate(RING_TO) }, { transform: rotate(DOT) }], GAP, 0.38, E.outBack, LATER);
	tween(q("[data-lts-tile]"), [{ opacity: 0, transform: "scale(0.86)" }, { opacity: 1, transform: "none" }], GAP - 0.05, 0.55, E.out);
	tween(ticks, [{ opacity: 0.32 }, { opacity: 0 }], GAP + 0.1, 0.4, E.out, LATER);
	tween(q("[data-lts-core]"), [{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "none" }], GAP + 0.15, 0.32, E.outBack);
	for (const wing of el.querySelectorAll("[data-lts-wing]")) {
		tween(wing, [{ opacity: 1, transform: "scaleX(0)" }, { opacity: 1, transform: "none" }], GAP + 0.3, 0.45, E.outBack);
	}
	tween(word, [{ opacity: 0, transform: "translateY(40%)" }, { opacity: 1, transform: "none" }], GAP + 0.45, 0.5, E.outExpo);

	/* ---------- 5. Onto the page's title (5.0–5.6 s) ---------- */
	const icon = q(".lts-icon");
	// The logo steps back and goes as the name sets off, so the name never crosses it.
	tween(icon, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.88)" }], FLY - 0.12, 0.3, E.out);
	tween(count, [{ opacity: 1 }, { opacity: 0 }], FLY - 0.2, 0.3, E.out, LATER);
	// Measured as the flight starts: the title has finished rising into place by then, and the name stands still.
	at(FLY, () => {
		const title = document.querySelector<HTMLElement>(".page-intro__title");
		const target = title ? textBox(title) : undefined;
		if (!target || !onScreen(target)) {
			tween(word, [{ opacity: 1 }, { opacity: 0 }], 0, 0.4, E.out, LATER);
			return;
		}
		const from = textBox(word);
		const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#f2eedf";
		const onto = `translate(${target.left - from.left}px, ${target.top - from.top}px) scale(${target.width / from.width})`;
		// It keeps its cream until the overlay has mostly gone (the light theme's navy title would vanish on the navy field).
		tween(word, [{ transform: "none", color: "#f2eedf" }, { color: "#f2eedf", offset: 0.6 }, { transform: onto, color: ink }], 0, LAND - FLY, E.fly, LATER);
		tween(word, [{ opacity: 1 }, { opacity: 0 }], LAND - FLY - 0.05, END - LAND + 0.05, E.out, LATER);
	});
	at(FLY + 0.2, () => document.documentElement.classList.add("splash-leaving"));
	// The ground goes from under the flying name (the name itself stays sharp until it is on the title).
	tween(q(".splash-skip"), [{ opacity: 1 }, { opacity: 0 }], FLY, 0.25, E.out);
	endWith(tween(q("[data-splash-bg]"), [{ opacity: 1 }, { opacity: 0 }], FLY + 0.1, END - FLY - 0.1, E.out));
}

/** The box of an element's letters (not its line box), on screen now. */
function textBox(node: Element) {
	const range = document.createRange();
	range.selectNodeContents(node);
	const r = range.getBoundingClientRect();
	return r.width ? r : node.getBoundingClientRect();
}

const start = () => runSplash("lifetime", play, { fastRate: FAST_RATE });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();
document.addEventListener("astro:page-load", start);
