/**
 * Sample stock for the fictional Ridgeline Motors dealership. Prices, mileage,
 * specifications and inspection notes are illustrative demo content.
 */

export type BodyType = "SUV" | "Bakkie" | "Sedan" | "Hatchback" | "Van";
export type Fuel = "Petrol" | "Diesel" | "Hybrid";
export type Gearbox = "Auto" | "Manual";
export type Condition = "New" | "Pre-owned" | "Demo";
export type InspectionStatus = "pass" | "note";

export interface VehicleImage {
	alt: string;
	src: string;
}

export interface Vehicle {
	arrivedDaysAgo: number;
	body: BodyType;
	colour: string;
	condition: Condition;
	drive: string;
	engine: string;
	features: string[];
	fuel: Fuel;
	gearbox: Gearbox;
	gearboxDetail: string;
	highlights: string[];
	id: string;
	images: VehicleImage[];
	inspection: { label: string; status: InspectionStatus; value: string }[];
	justArrived: boolean;
	make: string;
	mileageKm: number;
	model: string;
	overview: string;
	owners: number;
	price: number;
	registration: string;
	seats: number;
	serviceHistory: string;
	shortName: string;
	stockNumber: string;
	year: number;
}

const interiorShots: VehicleImage[] = [
	{ alt: "Dashboard and centre screen", src: "/cars/mercedes-interior.webp" },
	{ alt: "Front seats and cabin", src: "/cars/ranger-interior.webp" },
];

const standardInspection = (
	tyres: string,
	body?: string
): Vehicle["inspection"] => [
	{ label: "Engine", status: "pass", value: "Passed" },
	{ label: "Brakes", status: "pass", value: "Passed" },
	{ label: "Tyres", status: "pass", value: tyres },
	body
		? { label: "Body", status: "note", value: body }
		: { label: "Body", status: "pass", value: "No marks" },
];

export const vehicles: Vehicle[] = [
	{
		arrivedDaysAgo: 1,
		body: "SUV",
		colour: "Heritage blue",
		condition: "Pre-owned",
		drive: "4x4 with low range",
		engine: "2.8 GD-6 diesel",
		features: [
			"Leather seats, 7 seats",
			"Sunroof",
			"Reverse camera",
			"Tow bar, 3,000 kg",
			"Cruise control",
			"Apple CarPlay",
			"Dual-zone climate",
			"Roof rails",
		],
		fuel: "Diesel",
		gearbox: "Auto",
		gearboxDetail: "8-speed automatic",
		highlights: ["One owner", "Full service history", "Duty paid"],
		id: "rm-2214",
		images: [
			{
				alt: "Toyota Land Cruiser Prado 250 VX, front three-quarter view",
				src: "/cars/prado-blue.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection(
			"New, March 2026",
			"Small mark, rear bumper"
		),
		justArrived: true,
		make: "Toyota",
		mileageKm: 18_400,
		model: "Land Cruiser Prado 250 VX",
		overview:
			"One owner from new, serviced every 10,000 km with a stamped book. Seven leather seats, sunroof, reverse camera and a tow bar rated to 3,000 kg. New tyres in March 2026 and a fresh service before delivery. Viewing at our Msasa showroom, or we can bring it to you in Harare for a test drive.",
		owners: 1,
		price: 78_500,
		registration: "Zimbabwe, duty paid",
		seats: 7,
		serviceHistory: "Full, dealer stamped",
		shortName: "Land Cruiser Prado 250 VX",
		stockNumber: "RM-2214",
		year: 2024,
	},
	{
		arrivedDaysAgo: 9,
		body: "Van",
		colour: "White",
		condition: "Pre-owned",
		drive: "Rear-wheel drive",
		engine: "2.7 petrol",
		features: [
			"14 seats",
			"Dual air conditioning",
			"Sliding side door",
			"Radio and Bluetooth",
		],
		fuel: "Petrol",
		gearbox: "Manual",
		gearboxDetail: "5-speed manual",
		highlights: ["Commuter spec", "Duty paid"],
		id: "rm-2168",
		images: [
			{
				alt: "Toyota HiAce 2.7 Commuter on the road",
				src: "/cars/hiace-road-portrait.webp",
			},
			{ alt: "Toyota HiAce van, side view", src: "/cars/hiace-van.webp" },
		],
		inspection: standardInspection("80% tread"),
		justArrived: false,
		make: "Toyota",
		mileageKm: 112_000,
		model: "HiAce 2.7 Commuter",
		overview:
			"High-roof 14-seat commuter with dual air conditioning. Serviced in our workshop with new brake pads and a fresh oil change before sale.",
		owners: 2,
		price: 31_500,
		registration: "Zimbabwe, duty paid",
		seats: 14,
		serviceHistory: "Partial, workshop records",
		shortName: "HiAce 2.7 Commuter",
		stockNumber: "RM-2168",
		year: 2019,
	},
	{
		arrivedDaysAgo: 4,
		body: "SUV",
		colour: "Pearl white",
		condition: "Demo",
		drive: "Front-wheel drive",
		engine: "1.8 hybrid",
		features: [
			"Adaptive cruise control",
			"Lane assist",
			"Wireless charging",
			"Apple CarPlay",
			"Reverse camera",
		],
		fuel: "Hybrid",
		gearbox: "Auto",
		gearboxDetail: "CVT automatic",
		highlights: ["Ex-demo", "Balance of warranty"],
		id: "rm-2201",
		images: [
			{
				alt: "Toyota Corolla Cross Hybrid Z, front three-quarter view",
				src: "/cars/corolla-cross-white.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("As new"),
		justArrived: false,
		make: "Toyota",
		mileageKm: 9400,
		model: "Corolla Cross Hybrid Z",
		overview:
			"Our own demonstrator, driven by the sales team only. Hybrid economy with the top Z specification and the balance of the manufacturer warranty.",
		owners: 1,
		price: 36_800,
		registration: "Zimbabwe, duty paid",
		seats: 5,
		serviceHistory: "Full, dealer stamped",
		shortName: "Corolla Cross Hybrid Z",
		stockNumber: "RM-2201",
		year: 2023,
	},
	{
		arrivedDaysAgo: 14,
		body: "Hatchback",
		colour: "Sonic silver",
		condition: "Pre-owned",
		drive: "Front-wheel drive",
		engine: "1.5 petrol",
		features: [
			"Head-up display",
			"Reverse camera",
			"Apple CarPlay",
			"Keyless entry",
		],
		fuel: "Petrol",
		gearbox: "Auto",
		gearboxDetail: "6-speed automatic",
		highlights: ["Two owners", "Service history"],
		id: "rm-2139",
		images: [
			{
				alt: "Mazda3 1.5 Hatchback, rear view",
				src: "/cars/mazda3-silver.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("70% tread"),
		justArrived: false,
		make: "Mazda",
		mileageKm: 46_200,
		model: "Mazda3 1.5 Hatchback",
		overview:
			"Economical and well-kept hatchback with a head-up display and a clean interior. Ideal first car or daily commuter.",
		owners: 2,
		price: 17_900,
		registration: "Zimbabwe, duty paid",
		seats: 5,
		serviceHistory: "Full, workshop records",
		shortName: "Mazda3 1.5 Hatchback",
		stockNumber: "RM-2139",
		year: 2019,
	},
	{
		arrivedDaysAgo: 2,
		body: "Hatchback",
		colour: "Super white",
		condition: "Pre-owned",
		drive: "Front-wheel drive",
		engine: "1.5 hybrid",
		features: [
			"GR Sport body kit",
			"Sports seats",
			"Push-button start",
			"Reverse camera",
		],
		fuel: "Hybrid",
		gearbox: "Auto",
		gearboxDetail: "CVT automatic",
		highlights: ["Low mileage", "Duty paid"],
		id: "rm-2209",
		images: [
			{
				alt: "Toyota Aqua GR Sport, front three-quarter view",
				src: "/cars/yaris-white.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("New, August 2026"),
		justArrived: true,
		make: "Toyota",
		mileageKm: 38_700,
		model: "Aqua GR Sport",
		overview:
			"Sporty hybrid hatchback with very low fuel use. New tyres and a fresh hybrid battery health check.",
		owners: 1,
		price: 14_500,
		registration: "Zimbabwe, duty paid",
		seats: 5,
		serviceHistory: "Full, import records",
		shortName: "Aqua GR Sport",
		stockNumber: "RM-2209",
		year: 2020,
	},
	{
		arrivedDaysAgo: 21,
		body: "Hatchback",
		colour: "Brilliant blue",
		condition: "Pre-owned",
		drive: "Front-wheel drive",
		engine: "1.3 petrol",
		features: ["Magic seats", "Bluetooth audio", "Keyless entry"],
		fuel: "Petrol",
		gearbox: "Auto",
		gearboxDetail: "CVT automatic",
		highlights: ["Budget friendly", "Duty paid"],
		id: "rm-2102",
		images: [
			{
				alt: "Honda Fit 1.3 F, front three-quarter view",
				src: "/cars/honda-fit-blue.webp",
			},
		],
		inspection: standardInspection("60% tread", "Light scratches, rear door"),
		justArrived: false,
		make: "Honda",
		mileageKm: 91_000,
		model: "Fit 1.3 F",
		overview:
			"Dependable city car with Honda's folding magic seats. A proven, low-cost runabout.",
		owners: 3,
		price: 7900,
		registration: "Zimbabwe, duty paid",
		seats: 5,
		serviceHistory: "Partial",
		shortName: "Fit 1.3 F",
		stockNumber: "RM-2102",
		year: 2015,
	},
	{
		arrivedDaysAgo: 6,
		body: "SUV",
		colour: "Brilliant white pearl",
		condition: "Pre-owned",
		drive: "All-wheel drive",
		engine: "2.0 hybrid",
		features: [
			"Around-view camera",
			"Heated seats",
			"Power tailgate",
			"Apple CarPlay",
			"Lane assist",
		],
		fuel: "Hybrid",
		gearbox: "Auto",
		gearboxDetail: "CVT automatic",
		highlights: ["Hybrid economy", "Duty paid"],
		id: "rm-2190",
		images: [
			{
				alt: "Nissan X-Trail 2.0 Hybrid, front three-quarter view",
				src: "/cars/xtrail-white.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("As new"),
		justArrived: false,
		make: "Nissan",
		mileageKm: 72_500,
		model: "X-Trail 2.0 Hybrid",
		overview:
			"Spacious family SUV with all-wheel drive and hybrid economy. Around-view camera makes town parking easy.",
		owners: 1,
		price: 19_800,
		registration: "Zimbabwe, duty paid",
		seats: 5,
		serviceHistory: "Full, import records",
		shortName: "X-Trail 2.0 Hybrid",
		stockNumber: "RM-2190",
		year: 2018,
	},
	{
		arrivedDaysAgo: 5,
		body: "Van",
		colour: "Black",
		condition: "Pre-owned",
		drive: "Front-wheel drive",
		engine: "2.0 petrol",
		features: [
			"8 seats",
			"Dual power sliding doors",
			"Rear entertainment screen",
			"Reverse camera",
		],
		fuel: "Petrol",
		gearbox: "Auto",
		gearboxDetail: "CVT automatic",
		highlights: ["8 seats", "Duty paid"],
		id: "rm-2177",
		images: [
			{
				alt: "Toyota Voxy ZS 2.0 at night in the city",
				src: "/cars/voxy-night.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("75% tread"),
		justArrived: false,
		make: "Toyota",
		mileageKm: 64_800,
		model: "Voxy ZS 2.0",
		overview:
			"Eight-seat people carrier with power sliding doors on both sides. A favourite with families and school runs.",
		owners: 2,
		price: 18_900,
		registration: "Zimbabwe, duty paid",
		seats: 8,
		serviceHistory: "Full, import records",
		shortName: "Voxy ZS 2.0",
		stockNumber: "RM-2177",
		year: 2019,
	},
	{
		arrivedDaysAgo: 3,
		body: "Van",
		colour: "White",
		condition: "Pre-owned",
		drive: "Rear-wheel drive",
		engine: "2.8 GD diesel",
		features: [
			"Panel van",
			"Cargo barrier",
			"Bluetooth audio",
			"Air conditioning",
		],
		fuel: "Diesel",
		gearbox: "Auto",
		gearboxDetail: "6-speed automatic",
		highlights: ["Business ready", "Duty paid"],
		id: "rm-2211",
		images: [
			{
				alt: "Toyota HiAce 2.8 Van parked on the street",
				src: "/cars/hiace-van.webp",
			},
		],
		inspection: standardInspection("85% tread"),
		justArrived: true,
		make: "Toyota",
		mileageKm: 58_000,
		model: "HiAce 2.8 Van",
		overview:
			"Diesel panel van with an automatic gearbox and a cargo barrier. Ready for deliveries from day one.",
		owners: 1,
		price: 33_500,
		registration: "Zimbabwe, duty paid",
		seats: 3,
		serviceHistory: "Full, dealer stamped",
		shortName: "HiAce 2.8 Van",
		stockNumber: "RM-2211",
		year: 2021,
	},
	{
		arrivedDaysAgo: 8,
		body: "SUV",
		colour: "Silver metallic",
		condition: "Pre-owned",
		drive: "4x4 with low range",
		engine: "2.8 GD-6 diesel",
		features: [
			"7 seats",
			"Leather seats",
			"Tow bar",
			"Reverse camera",
			"Cruise control",
		],
		fuel: "Diesel",
		gearbox: "Auto",
		gearboxDetail: "6-speed automatic",
		highlights: ["Full service history", "Duty paid"],
		id: "rm-2187",
		images: [
			{
				alt: "Toyota Fortuner 2.8 GD-6, front three-quarter view",
				src: "/cars/fortuner-silver.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("80% tread"),
		justArrived: false,
		make: "Toyota",
		mileageKm: 63_000,
		model: "Fortuner 2.8 GD-6",
		overview:
			"Tough seven-seat 4x4 on the proven 2.8 GD-6 diesel. Full service history and a tow bar fitted.",
		owners: 1,
		price: 44_500,
		registration: "Zimbabwe, duty paid",
		seats: 7,
		serviceHistory: "Full, dealer stamped",
		shortName: "Fortuner 2.8 GD-6",
		stockNumber: "RM-2187",
		year: 2021,
	},
	{
		arrivedDaysAgo: 11,
		body: "Bakkie",
		colour: "Black",
		condition: "New",
		drive: "4x4 with low range",
		engine: "2.7 turbo petrol",
		features: [
			"Off-road suspension",
			"Locking differentials",
			"Tow bar",
			"Reverse camera",
			"Apple CarPlay",
		],
		fuel: "Petrol",
		gearbox: "Auto",
		gearboxDetail: "8-speed automatic",
		highlights: ["Unregistered", "Full factory warranty"],
		id: "rm-2156",
		images: [
			{
				alt: "Chevrolet Colorado ZR2 double cab off road",
				src: "/cars/chevrolet-colorado-black.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("New all-terrain tyres"),
		justArrived: false,
		make: "Chevrolet",
		mileageKm: 12,
		model: "Colorado ZR2 Double Cab",
		overview:
			"Brand-new off-road double cab with locking differentials and long-travel suspension. Built for farm roads and weekends away, with the full factory warranty.",
		owners: 0,
		price: 58_900,
		registration: "Unregistered, duty paid",
		seats: 5,
		serviceHistory: "New vehicle",
		shortName: "Colorado ZR2",
		stockNumber: "RM-2156",
		year: 2026,
	},
	{
		arrivedDaysAgo: 17,
		body: "Sedan",
		colour: "Patagonia red",
		condition: "Pre-owned",
		drive: "All-wheel drive",
		engine: "3.0 turbo petrol",
		features: [
			"Leather seats",
			"Burmester sound",
			"Panoramic roof",
			"360° camera",
			"Heated seats",
		],
		fuel: "Petrol",
		gearbox: "Auto",
		gearboxDetail: "9-speed automatic",
		highlights: ["One owner", "Full service history"],
		id: "rm-2121",
		images: [
			{
				alt: "Mercedes-Benz CLE 450 coupe, rear three-quarter view",
				src: "/cars/mercedes-cle-red.webp",
			},
			...interiorShots,
		],
		inspection: standardInspection("New, June 2026"),
		justArrived: false,
		make: "Mercedes-Benz",
		mileageKm: 15_800,
		model: "CLE 450 Coupé",
		overview:
			"Low-mileage coupé with all-wheel drive, panoramic roof and Burmester sound. One owner and a full service history.",
		owners: 1,
		price: 68_000,
		registration: "Zimbabwe, duty paid",
		seats: 4,
		serviceHistory: "Full, dealer stamped",
		shortName: "CLE 450 Coupé",
		stockNumber: "RM-2121",
		year: 2024,
	},
];

/** "2019 Toyota HiAce 2.7"; skips the make when the model already names it ("2019 Mazda3"). */
export const vehicleTitle = (
	vehicle: Pick<Vehicle, "make" | "model" | "year">
): string =>
	vehicle.model.startsWith(vehicle.make)
		? `${vehicle.year} ${vehicle.model}`
		: `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

export const getVehicle = (id: string): Vehicle | undefined =>
	vehicles.find((vehicle) => vehicle.id === id);

/** The featured car on the home page. */
export const featuredVehicle = vehicles[0] as Vehicle;

/** The car pre-selected in the finance application. */
export const financeDefaultVehicle = getVehicle("rm-2187") as Vehicle;

export const similarVehicles = (vehicle: Vehicle, limit = 3): Vehicle[] => {
	const others = vehicles.filter((candidate) => candidate.id !== vehicle.id);
	const sameBody = others.filter(
		(candidate) => candidate.body === vehicle.body
	);
	const rest = others.filter((candidate) => candidate.body !== vehicle.body);
	return [...sameBody, ...rest].slice(0, limit);
};

/** Makes shown in "Shop by make"; makes without stock can still be requested. */
export const featuredMakes = [
	"Toyota",
	"Mazda",
	"Honda",
	"Nissan",
	"Mercedes-Benz",
	"Chevrolet",
	"Ford",
	"BMW",
	"Volkswagen",
	"Isuzu",
	"Mitsubishi",
	"Hyundai",
] as const;
