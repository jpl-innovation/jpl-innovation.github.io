// The light theme's logo, in its navy and yellow, from the original artwork (public/assets/JPL_INNOVATION.jpg, a
// transparent PNG despite the name). Run with: node scripts/make-logo-light.mjs (after make-logo-assets.mjs, which it replaces
// the light logo of). Writes public/assets/jpl-logo-light.png and its 480-wide copy.
//   Wordmark: "JPL" navy; "INNOVATION" a deep gold, because bright yellow can't be read on the light page.
//   Badge: every pixel is a mix of the artwork's dark, white and cyan, so it is remixed from navy, cream and yellow,
//   which keeps the soft edges.
import sharp from "sharp";

const NAVY = [10, 23, 78];
const CREAM = [255, 250, 230];
const YELLOW = [245, 208, 66];
const GOLD = [169, 133, 0];
const BADGE_FROM = 0.635; // the share of the width where the badge starts (src/components/Logo.astro)

const clamp = (x) => Math.min(1, Math.max(0, x));
const { data, info } = await sharp("public/assets/JPL_INNOVATION.jpg").trim().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		const i = (y * width + x) * 4;
		if (!data[i + 3]) continue;
		const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
		const cyan = clamp((g - r - 70) / 80); // dark teal (the icon's lines) stays out of it
		let out;
		if (x < width * BADGE_FROM) {
			const saturation = Math.max(r, g, b) - Math.min(r, g, b);
			const k = clamp((saturation - 30) / 60);
			out = NAVY.map((c, n) => c + (GOLD[n] - c) * k);
		} else {
			const white = clamp((r - 20) / 210) * (1 - cyan);
			const dark = clamp(1 - white - cyan);
			out = NAVY.map((c, n) => c * dark + CREAM[n] * white + YELLOW[n] * cyan);
		}
		data[i] = out[0];
		data[i + 1] = out[1];
		data[i + 2] = out[2];
	}
}
const png = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
await sharp(png).toFile("public/assets/jpl-logo-light.png");
await sharp(png).resize({ width: 480 }).webp({ quality: 92 }).toFile("public/assets/jpl-logo-light-480.webp");
console.log("wrote the light logo", width, height);
