/**
 * FRC PAGE, "THE KITBOT PLATFORM IN 3D" (/work/frc/, right after the robot photo that opens to full screen).
 * The 3D robot turns to each part as its text comes up. Phones show each part's text as a card instead.
 *
 * Edit the words between the quotes. Keep the quotes and the commas at the end of lines.
 *   - The heading, the sentence under it, the small note and the screen reader description are shared with the
 *     rest of the FRC page's words: change them in src/text/projects/frc.ts (`frcPage.model3d`).
 *   - Keep the features in this order: each one has its camera position in src/lib/three/models/frc-robot-showcase.ts.
 *   - `id` is the part's link (/work/frc/#intake) and the name of its picture for phones,
 *     public/showcase/robot/<id>.webp (made by scripts/showcase-stills.py). Without a picture the card shows text only.
 *   - Only write what the CAD and the photos of the real robot show (src/lib/three/models/frc-robot-mods.ts). No speeds
 *     or weights: the team hasn't measured them.
 *   - The small label floating in the 3D view is the feature's `title`.
 */
import { frcPage } from "../projects/frc";

export const robotShowcase = {
	heading: frcPage.model3d.heading,
	intro: frcPage.model3d.text,
	note: frcPage.model3d.note,
	/** Read aloud by screen readers instead of the 3D view. */
	modelLabel: frcPage.model3d.description,
	/** Read aloud by screen readers for the row of dots that jump to each part. */
	dotsLabel: 'Parts of the robot',
	features: [
		{
			id: 'overview',
			title: 'Our 2026 robot',
			text: 'The KitBot platform, rebuilt by our team: new intake and indexer wheels, a full-width flywheel, Kraken and NEO motors, a hopper that extends, and the electronics laid out where you can see them. It rolls on six wheels, with blue bumpers carrying our team number, 10951.',
			facts: [
				{ label: 'Base', value: 'KitBot platform' },
				{ label: 'Changes', value: 'Intake, indexer, flywheel, hood, motors, hopper' },
				{ label: 'Wheels', value: 'Six' },
				{ label: 'Bumpers', value: 'Blue, team 10951' },
			],
		},
		{
			id: 'intake',
			title: 'Intake',
			text: 'Two shafts pull FUEL, the 150 mm foam ball, off the floor: grey compliant wheels low down, then orange flex star wheels between more grey wheels. A NEO on the left plate turns them both through belts.',
			facts: [
				{ label: 'Bottom shaft', value: 'Grey compliant wheels' },
				{ label: 'Second shaft', value: 'Orange star wheels, grey wheels' },
				{ label: 'Motor', value: 'NEO, on a SPARK MAX' },
			],
		},
		{
			id: 'hopper',
			title: 'Hopper',
			text: 'The hopper is see-through polycarbonate, so the stored FUEL shows. Its extension rides on orange printed pivots: it slides up its curved slots to hold more, and folds back down.',
			facts: [
				{ label: 'Walls', value: 'See-through polycarbonate' },
				{ label: 'Extension', value: 'Slides up and folds down' },
				{ label: 'Pivots', value: '3D-printed, orange' },
			],
		},
		{
			id: 'shooter',
			title: 'Indexer, flywheel and hood',
			text: 'Blue flex star wheels and green wheels index each ball into the flywheel, a full-width stack of wheels that flings it up the hood of printed ribs and out of the top. Two Kraken X60s on the right plate drive them by belt.',
			facts: [
				{ label: 'Indexer', value: 'Blue star wheels, green wheels' },
				{ label: 'Flywheel', value: 'A stack of 16 wheels' },
				{ label: 'Hood', value: 'Printed ribs on three rods' },
				{ label: 'Motors', value: 'Two Kraken X60s' },
			],
		},
		{
			id: 'drivetrain',
			title: 'Drivetrain',
			text: 'Six wheels on an aluminium frame, driven by four motors through belts and gears, each motor on its own SPARK MAX.',
			facts: [
				{ label: 'Wheels', value: 'Six' },
				{ label: 'Motors', value: 'Four, each on a SPARK MAX' },
				{ label: 'Drive', value: 'Belts and gears' },
				{ label: 'Frame', value: 'Aluminium' },
			],
		},
		{
			id: 'electronics',
			title: 'Electronics',
			text: 'Under the clear hopper: the power hub, five SPARK MAXes (one for the NEO, four for the drive motors; the Krakens have their Talon FX built in and need none) and a CTRE Pigeon 2.0 beside them for odometry, wired with red power and a yellow-green CAN chain. The radio is on the left plate, the orange beacon on top.',
			facts: [
				{ label: 'Controllers', value: 'Five SPARK MAX, Talon FX in the Krakens' },
				{ label: 'Odometry', value: 'CTRE Pigeon 2.0' },
				{ label: 'Power', value: 'Power hub, battery low at the back' },
				{ label: 'Beacon', value: 'Orange, on top' },
			],
		},
	],
};
