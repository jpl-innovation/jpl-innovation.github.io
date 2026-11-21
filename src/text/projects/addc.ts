/**
 * ADDC WEBSITE PAGE TEXT (/work/addc/): the title block, the before-and-after, the old site against the new point by
 * point, the measured numbers and the 3D model.
 *
 * Edit the words between the quotes. Keep the quotes and the commas at the end of lines.
 *   - The page title, intro sentence and the write-up: src/text/projects/addc.md
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
			desktop: "The new ADDC home page on a desktop: the headline 'Từ bản vẽ đến chìa khóa trao tay' over a 3D view of an empty plot, where the house goes up as the visitor scrolls.",
			phone: "The new ADDC home page on a phone: the headline over the 3D plot, with call, Zalo and quote buttons along the bottom.",
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

	/**
	 * Old site against new, point by point: for each subject, the same part of both sites (a crop of each, in
	 * public/work/addc/vs/), what each one says or does, then what changed. Old: addc.vn; new: the new site; both
	 * read on 21 November 2026. Words in quotes are the sites' own.
	 */
	versus: {
		heading: "Old site, new site, point by point",
		intro: "The same subjects on both websites, side by side: what a visitor found on addc.vn, and what they find now.",
		before: "Before · addc.vn",
		after: "After · the new site",
		changed: "What changed",
		rows: [
			{
				id: "services",
				topic: "What ADDC does",
				old: { img: "/work/addc/vs/services-old.webp", alt: "The old home page's 'Lĩnh vực hoạt động': three stock photos over three services, each with two lines and a 'Xem chi tiết' link.", text: "Three blocks named after the company’s departments (Thiết kế kiến trúc, Thi công công trình, Thi công nội thất), two general lines each, such as “Nghiên cứu và phát triển gia tăng giá trị công trình”. The construction link opens a page called service-lighting.html." },
				new: { img: "/work/addc/vs/services-new.webp", alt: "The new home page's 'Bạn đang ở bước nào?': three photos from ADDC's own work over the three situations a client can be in.", text: "“Bạn đang ở bước nào?” The same three services, sorted by where the client is: land but no drawings, drawings but nothing built, a finished house that needs its interior. Each leads to its own page with its process, prices, 3D and projects." },
				changed: "The services start from the client’s situation, not from the company’s departments.",
			},
			{
				id: "process",
				topic: "How a project runs",
				old: { img: "/work/addc/vs/process-old.webp", alt: "The old home page's 'Triết lý hoạt động': a paragraph of values beside a photo of a dining room.", text: "No steps. A paragraph of values instead: “Chất lượng - An toàn - Hiệu quả - Chuyên nghiệp - Thẩm mỹ”, and a promise to meet “mọi yêu cầu của khách hàng”." },
				new: { img: "/work/addc/vs/process-new.webp", alt: "The new home page's 'Cách ADDC làm một công trình': the first of six steps, 'Lắng nghe và khảo sát', beside a 3D drawing of a house.", text: "Six steps, from the first survey to handover, with photos from ADDC’s own sites. Promises a client can check: an engineer on site, the steel inspected before every concrete pour, a reply within 24 hours after handover." },
				changed: "Adjectives became steps and promises a client can check.",
			},
			{
				id: "prices",
				topic: "Prices",
				old: { img: "/work/addc/vs/prices-old.webp", alt: "The old price page: three price cards for the 2021 rough build, from 3.5 to 4.2 million dong a square metre, each with a 'Learn more' button.", text: "A separate page of 2021 construction prices by house type: the rough build from 3.5 to 4.2 million ₫/m², turnkey from 6.5 to 9.0 million ₫/m², each card with an English “Learn More” button." },
				new: { img: "/work/addc/vs/prices-new.webp", alt: "The new home page's 'Chi phí tham khảo': four prices per square metre, from design to turnkey, with the date of each source.", text: "Prices on the home page and on each service page, from 150,000 ₫/m² for architectural design to turnkey, each with its source and date (the 2021 table, ADDC’s quote of 24/02/2022), and a quick estimate from the floor area." },
				changed: "The prices were already there; now they sit where the client reads, dated, and worked out for their floor area.",
			},
			{
				id: "projects",
				topic: "Projects",
				old: { img: "/work/addc/vs/projects-old.webp", alt: "The old home page's 'Công trình tiêu biểu': a collage of blurred building-site photos.", text: "A collage of blurred site photos on the home page. The projects page lists 12 cards with English tags such as “Planning” and “Clean / Store”, with “Zangzak Residential Tower” listed twice." },
				new: { img: "/work/addc/vs/projects-new.webp", alt: "The new home page's full project list: each project's name, place, the work ADDC did and the building type.", text: "21 projects, each with its place, the work ADDC did and the building type, filtered by type (villa, townhouse, interior, office). Five are featured with photos, one of them still being built." },
				changed: "Every project says where it is and what ADDC did there.",
			},
			{
				id: "news",
				topic: "News",
				old: { img: "/work/addc/vs/news-old.webp", alt: "The old home page's 'Tin tức & Sự kiện': three articles about other firms' buildings, the third with a grey '700x430' placeholder for its picture.", text: "“Tin tức & Sự kiện”: three articles about other firms’ buildings (a house in Hà Tĩnh from Kienviet.net, Naia House in Costa Rica from ArchDaily, a pavilion on a Belgian canal), two signed “John Smith”, one still showing a grey “700x430” placeholder." },
				new: { img: "/work/addc/vs/news-new.webp", alt: "The new home page's 'Mới từ công trường': three dated entries from ADDC's own building sites, each with a photo.", text: "“Mới từ công trường”: ADDC’s own site diary, dated. 18.11.2026, the Le Linh showroom’s rough build in An Nhơn; 03.11.2026, a villa’s piling begins in An Khánh; 21.09.2026, the showroom’s site sign goes up, with its permit date." },
				changed: "Borrowed articles gave way to ADDC’s own sites, with dates.",
			},
			{
				id: "contact",
				topic: "Getting in touch",
				old: { img: "/work/addc/vs/contact-old.webp", alt: "The old home page's 'Thư Ngỏ': a long letter to clients, with the hotline inside its second paragraph.", text: "The hotline sits inside a letter to clients (“Thư Ngỏ”) in the middle of the home page. Email, address and a message form are on a separate contact page." },
				new: { img: "/work/addc/vs/contact-new.webp", alt: "The new home page's 'Bắt đầu công trình của bạn': a short form beside the hotline, Zalo, email, office and hours.", text: "“Bắt đầu công trình của bạn”: a short form where the client picks the service, next to the hotline, Zalo, email, office and hours. On a phone, call, Zalo and quote buttons stay along the bottom of every page." },
				changed: "Getting in touch is one step away from anywhere on the site.",
			},
		],
	},
};
