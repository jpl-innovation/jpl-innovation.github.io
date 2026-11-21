/**
 * ADDC WEBSITE PAGE TEXT (/work/addc/): the title block, the before-and-after, the measured numbers, the 3D model and
 * the screens of the new site.
 *
 * Edit the words between the quotes. Keep the quotes and the commas at the end of lines.
 *   - The page title, intro sentence and the write-up: src/text/projects/addc.md
 *   - The case at the top (problem, alternatives, answer): the `addc` entry in src/text/projects/hooks.ts
 *
 * Every number on this page was measured (see `numbers.method`): change them only by measuring again.
 */

export const addcPage = {
	/** The drawing's title block, under the page title. Links open in a new tab. */
	titleBlock: {
		label: "Title block",
		rows: [
			{ label: "Client", value: "ADDC · Kiến Trúc An Dương" },
			{ label: "Kind", value: "Website redesign" },
			{ label: "Status", value: "Live" },
			{ label: "Pages", value: "6, in Vietnamese" },
			{ label: "Made in", value: "Ho Chi Minh City, 2026" },
			{ label: "Old site", value: "addc.vn", href: "https://addc.vn/" },
			{ label: "New site", value: "See it live", href: "https://jpl-innovation.github.io/An_Duong_Site2/" },
		],
	},

	/** The before-and-after: the same first screen, old and new, with a divider to drag. */
	compare: {
		heading: "Same company. A different first impression.",
		intro: "Drag the line across the first screen of ADDC’s old website and the new one.",
		before: "Before: addc.vn",
		after: "After: the new site",
		/** The divider, for keyboards and screen readers. */
		slider: "Show more of the old or the new site",
		views: { label: "Screen", desktop: "Desktop", phone: "Phone" },
		beforeAlt: {
			desktop: "The old addc.vn home page on a desktop: a building-site photo with the company name in capitals over it.",
			phone: "The old addc.vn home page on a phone: a small slider photo and a heading for the company's fields of work.",
		},
		afterAlt: {
			desktop: "The new ADDC home page on a desktop: two men in hard hats shake hands at a groundbreaking, beside the headline 'Từ bản vẽ đến chìa khóa trao tay'.",
			phone: "The new ADDC home page on a phone: the groundbreaking photo above the headline, with call, Zalo and quote buttons along the bottom.",
		},
	},

	/** Measured figures. Old: addc.vn; new: the new site; both on 21 November 2026. */
	numbers: {
		heading: "Measured, not guessed",
		items: [
			{ value: "0.002", was: "0.61", label: "Layout shift", note: "How much the page jumps while it loads (Google counts under 0.1 as good). Desktop; on a phone 0.28 became 0.003." },
			{ value: "31", was: "0", label: "3D models", note: "Materials, furniture and a townhouse in seven stages, in seven 3D views a visitor can turn and change." },
			{ value: "161", was: "", label: "Photos from ADDC’s own work", note: "Sites, finished projects, equipment and the team, each in the section it belongs to." },
			{ value: "220", was: "", label: "Frames a second", note: "On average while scrolling the home page, 3D and all, on a 240 Hz desktop screen." },
		],
		method:
			"Measured in Microsoft Edge on 21 November 2026, three runs each on a 12 Mbit/s connection, at 1440 × 900 and on a phone screen. The new home page shows its first screen after 3.4 MB (the old one after 1.0 MB), then downloads its 3D models in the background: about 59 MB in all, against 16 MB for the old page.",
		was: "was",
	},

	/** One of the site's own 3D models, here to turn. */
	model: {
		heading: "The 3D is real",
		intro: "This walnut coffee table is one of the 31 models on ADDC’s interiors page. Drag to turn it.",
		label: "A 3D model of a round walnut coffee table on a white marble base, with a book and a small vase on top.",
		fallback: "The walnut coffee table from ADDC’s interiors page.",
	},

	/** The new site's screens, as whole-width plates. */
	plates: {
		heading: "What a visitor finds now",
		intro: "Every screen below is the live site.",
		items: [
			{ src: "/work/addc/loader.webp", alt: "The loader: a counter at 87 and a photo of a finished living room in a window, captioned 'Hoàn thiện'." },
			{ src: "/work/addc/journey.webp", alt: "The home page's build story: a townhouse going up in 3D as the visitor scrolls, beside the step 'Thi công có giám sát'." },
			{ src: "/work/addc/blueprint.webp", alt: "The architecture page: the house as a line drawing in 3D, with its view, finish and facade colour to choose." },
			{ src: "/work/addc/materials.webp", alt: "The construction page's materials: a concrete column with steel starter bars in 3D, beside its specification." },
			{ src: "/work/addc/price.webp", alt: "The price tables and a quick estimate: choose the service and the floor area, and the cost is worked out at once." },
			{ src: "/work/addc/viewer.webp", alt: "A team photo opened large over the page, with arrows to the section's other photos." },
			{ src: "/work/addc/reel.webp", alt: "The home page's project reel: photos of finished work sliding sideways as the visitor scrolls down." },
		],
	},
};
