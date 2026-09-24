import { type ReactNode, type SVGProps, useId } from "react";

/** Stroke icons from the Ridgeline Motors design sprite (20×20 grid). */
const paths = {
	alert: (
		<>
			<circle cx="10" cy="10" r="7.5" />
			<path d="M10 6.5v4.5M10 13.6v.01" />
		</>
	),
	arrow: <path d="M4 10h12M11 5l5 5-5 5" />,
	calendar: (
		<>
			<rect height="12" rx="2" width="14" x="3" y="4.5" />
			<path d="M3 8.5h14M7 3v3M13 3v3" />
		</>
	),
	card: (
		<>
			<rect height="10.5" rx="2" width="14.5" x="2.75" y="4.75" />
			<path d="M2.75 8.5h14.5M6 12.5h3" />
		</>
	),
	chat: (
		<path d="M10 3c4.1 0 7 2.7 7 6.2s-2.9 6.2-7 6.2c-.9 0-1.7-.1-2.5-.4L4 16.5l1-3.1C3.7 12.3 3 10.8 3 9.2 3 5.7 5.9 3 10 3z" />
	),
	check: <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeWidth="2.2" />,
	chevronDown: <path d="M5 7.5l5 5 5-5" />,
	chevronLeft: <path d="M12 4.5L6.5 10l5.5 5.5" />,
	chevronRight: <path d="M8 4.5l5.5 5.5L8 15.5" />,
	clock: (
		<>
			<circle cx="10" cy="10" r="7.25" />
			<path d="M10 6v4l2.5 2" />
		</>
	),
	doc: (
		<>
			<path d="M5.5 2.75h6l3.75 3.75v10a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-13a.75.75 0 01.75-.75z" />
			<path d="M11.25 2.75v4h4" />
		</>
	),
	fuel: (
		<>
			<path d="M4 17V4.5A1.5 1.5 0 015.5 3h5A1.5 1.5 0 0112 4.5V17M3 17h10M12 8h2a1.5 1.5 0 011.5 1.5V14a1.5 1.5 0 003 0V7l-2.5-2.5" />
			<path d="M6 6.5h4" />
		</>
	),
	gauge: (
		<>
			<path d="M3.5 13.5a6.5 6.5 0 1113 0" />
			<path d="M10 13.5l3-4" />
		</>
	),
	gear: (
		<>
			<circle cx="5" cy="5" r="1.6" />
			<circle cx="10" cy="5" r="1.6" />
			<circle cx="15" cy="5" r="1.6" />
			<circle cx="5" cy="15" r="1.6" />
			<circle cx="10" cy="15" r="1.6" />
			<path d="M5 6.6v6.8M10 6.6v6.8M15 6.6V10H5" />
		</>
	),
	grid: (
		<>
			<rect height="6" rx="1.5" width="6" x="3" y="3" />
			<rect height="6" rx="1.5" width="6" x="11" y="3" />
			<rect height="6" rx="1.5" width="6" x="3" y="11" />
			<rect height="6" rx="1.5" width="6" x="11" y="11" />
		</>
	),
	heart: (
		<path d="M10 16.5s-6.5-3.8-6.5-8.4A3.6 3.6 0 0110 5.9a3.6 3.6 0 016.5 2.2c0 4.6-6.5 8.4-6.5 8.4z" />
	),
	key: (
		<>
			<circle cx="6.5" cy="13.5" r="3.25" />
			<path d="M8.8 11.2L16 4M13.5 6.5l2 2" />
		</>
	),
	list: (
		<path d="M7 5.5h10M7 10h10M7 14.5h10M3.5 5.5v.01M3.5 10v.01M3.5 14.5v.01" />
	),
	lock: (
		<>
			<rect height="8.5" rx="2" width="12" x="4" y="8.75" />
			<path d="M6.75 8.75V6.5a3.25 3.25 0 016.5 0v2.25" />
		</>
	),
	mail: (
		<>
			<rect height="11.5" rx="2" width="14.5" x="2.75" y="4.25" />
			<path d="M3.5 5.5L10 10.5l6.5-5" />
		</>
	),
	menu: <path d="M4 7h12M4 13h12" />,
	phone: (
		<path d="M5 3h3l1.5 4-2 1.2a9 9 0 004.3 4.3l1.2-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5A14 14 0 013.5 4.6 1.5 1.5 0 015 3z" />
	),
	pin: (
		<>
			<path d="M10 17.5s-5.5-5-5.5-9.5a5.5 5.5 0 0111 0c0 4.5-5.5 9.5-5.5 9.5z" />
			<circle cx="10" cy="8" r="2" />
		</>
	),
	play: <path d="M7 5l8 5-8 5z" />,
	plus: <path d="M10 4.5v11M4.5 10h11" />,
	search: (
		<>
			<circle cx="9" cy="9" r="5.5" />
			<path d="M13 13l4 4" />
		</>
	),
	share: (
		<path d="M10 3v9M6.5 6.5L10 3l3.5 3.5M4 12v3.5a1 1 0 001 1h10a1 1 0 001-1V12" />
	),
	shield: (
		<>
			<path d="M10 2.75l6 2.5v4.5c0 3.8-2.6 6.4-6 7.5-3.4-1.1-6-3.7-6-7.5v-4.5z" />
			<path d="M7.3 10l2 2 3.6-3.8" />
		</>
	),
	sliders: (
		<>
			<path d="M4 6h8M15 6h1M4 14h2M9 14h7" />
			<circle cx="13.5" cy="6" r="1.6" />
			<circle cx="7.5" cy="14" r="1.6" />
		</>
	),
	swap: <path d="M4 7h11l-3-3M16 13H5l3 3" />,
	upload: (
		<path d="M10 13V4M6.5 7.5L10 4l3.5 3.5M4 13v2.5a1 1 0 001 1h10a1 1 0 001-1V13" />
	),
	user: (
		<>
			<circle cx="10" cy="7" r="3.25" />
			<path d="M3.5 17c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5" />
		</>
	),
	wrench: (
		<path d="M12.5 3.5a4 4 0 00-4.6 5.4L3.5 13.3a1.6 1.6 0 002.2 2.2l4.4-4.4a4 4 0 005.4-4.6l-2.4 2.4-2.1-.5-.5-2.1z" />
	),
	x: <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
	name: IconName;
	size?: number;
};

export function Icon({ name, size = 18, ...props }: IconProps) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			focusable="false"
			height={size}
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 20 20"
			width={size}
			{...props}
		>
			{paths[name]}
		</svg>
	);
}

/** The Where They Are mark used in the sample-site banner and footer. */
export function WhereTheyAreMark({ size = 18 }: { size?: number }) {
	const id = useId();
	const gradientId = `${id}-bg`;
	const filterId = `${id}-goo`;
	return (
		<svg
			aria-hidden="true"
			className="shrink-0 rounded-[5px]"
			focusable="false"
			height={size}
			viewBox="0 0 100 100"
			width={size}
		>
			<defs>
				<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#FFA784" />
					<stop offset="1" stopColor="#F0553A" />
				</linearGradient>
				<filter height="160%" id={filterId} width="160%" x="-30%" y="-30%">
					<feGaussianBlur stdDeviation="3" />
					<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -14" />
				</filter>
			</defs>
			<rect fill={`url(#${gradientId})`} height="100" width="100" />
			<g fill="#15171A" filter={`url(#${filterId})`}>
				<circle cx="39" cy="54" r="17" />
				<circle cx="54" cy="60" r="6" />
				<circle cx="66" cy="62" r="12" />
			</g>
			<ellipse cx="43" cy="51" fill="#FFF3EC" rx="2.8" ry="4" />
			<ellipse cx="51" cy="51" fill="#FFF3EC" rx="2.8" ry="4" />
			<ellipse cx="62" cy="59.5" fill="#FFF3EC" rx="2" ry="3" />
			<ellipse cx="67.5" cy="59.5" fill="#FFF3EC" rx="2" ry="3" />
		</svg>
	);
}
