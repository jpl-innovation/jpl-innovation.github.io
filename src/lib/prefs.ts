/**
 * The visitor's own settings (the Settings panel in the header, src/components/SettingsPanel.astro), next to what the
 * system says. Stored only in this browser, and only as long as the visitor allows (`remembering` below).
 *
 *   motion   "full" | "reduced" | "read"   Reduced acts like the system's reduce-motion setting; Read also turns
 *                                          the studio into one ordinary page. BaseLayout puts html.reduce-motion and
 *                                          html.read-mode on before the first paint.
 *   quality  "high" | "low" (else auto)    The 3D stage's starting tier (src/lib/three/stage.ts).
 *   surface  "glass" | "solid" (else auto)  Glass or filled sheets (src/lib/look/surface.ts).
 *   experience "3d" | "classic"            The answer to the first-visit question; "classic" is motion = "read".
 */
export const MOTION_KEY = "motion";
export const QUALITY_KEY = "quality";
/** "glass" | "solid" (else chosen by the device: src/lib/look/surface.ts). BaseLayout applies html.solid before paint. */
export const SURFACE_KEY = "surface";
/** Set once the visitor has answered the first-visit question (ExperienceChoice.astro): "3d" or "classic". */
export const EXPERIENCE_KEY = "experience";

/**
 * "Remember my choices on this device" (Settings). On (the default): choices are kept in this browser's localStorage.
 * Off: localStorage keeps only this one "no" (so the next visit does not start remembering again), and every choice
 * lives in sessionStorage, which the browser forgets when the tab is closed. Nothing is ever sent anywhere, and the site
 * sets no cookies. BaseLayout's and Studio's inline head scripts repeat the same rule (keep them in step).
 */
export const REMEMBER_KEY = "remember";
/** Every choice the site stores, so switching Remember moves them all. */
export const KEPT_KEYS = ["theme", SURFACE_KEY, EXPERIENCE_KEY, QUALITY_KEY, MOTION_KEY, "studio-mode", "hook-seen"];

export const remembering = () => {
	try {
		return localStorage.getItem(REMEMBER_KEY) !== "no";
	} catch {
		return false;
	}
};
const store = () => (remembering() ? localStorage : sessionStorage);

/** A stored choice, from wherever choices are kept now (null if none, or if the browser keeps nothing). */
export const read = (key: string) => {
	try {
		return store().getItem(key);
	} catch {
		return null;
	}
};
/** Keep a choice (null forgets it). */
export const write = (key: string, value: string | null) => {
	try {
		const s = store();
		if (value === null) s.removeItem(key);
		else s.setItem(key, value);
	} catch {}
};

/** Turn remembering on or off: the choices in force move with it, and nothing of them is left behind. */
export function setRemembering(on: boolean) {
	try {
		const [from, to] = on ? [sessionStorage, localStorage] : [localStorage, sessionStorage];
		for (const key of KEPT_KEYS) {
			const value = from.getItem(key);
			if (value !== null) to.setItem(key, value);
			from.removeItem(key);
		}
		if (on) localStorage.removeItem(REMEMBER_KEY);
		else localStorage.setItem(REMEMBER_KEY, "no");
	} catch {}
}

/** Animation should stay still: the system asks for it, or the visitor chose Reduced or Read mode. */
export const reducedMotion = () =>
	matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");

export const qualityPref = (): "high" | "low" | null => {
	const q = read(QUALITY_KEY);
	return q === "high" || q === "low" ? q : null;
};
