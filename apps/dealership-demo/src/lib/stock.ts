import type {
	BodyType,
	Condition,
	Fuel,
	Gearbox,
	Vehicle,
} from "@/lib/vehicles";

export const BODY_TYPES: readonly BodyType[] = [
	"SUV",
	"Bakkie",
	"Sedan",
	"Hatchback",
	"Van",
];
export const FUELS: readonly Fuel[] = ["Diesel", "Petrol", "Hybrid"];
export const GEARBOXES: readonly Gearbox[] = ["Auto", "Manual"];
export const CONDITIONS: readonly Condition[] = ["New", "Pre-owned", "Demo"];
export const YEAR_OPTIONS = [2015, 2016, 2018, 2020, 2022, 2024] as const;
export const PRICE_OPTIONS = [
	10_000, 15_000, 20_000, 30_000, 40_000, 45_000, 60_000, 80_000,
] as const;
export const PAGE_SIZE = 6;

export const BODY_LABELS: Record<BodyType, string> = {
	Bakkie: "Bakkies",
	Hatchback: "Hatchbacks",
	Sedan: "Sedans and coupés",
	SUV: "SUVs",
	Van: "Vans and MPVs",
};

export const SORT_OPTIONS = [
	{ label: "Newest arrivals", value: "newest" },
	{ label: "Price: low to high", value: "price-asc" },
	{ label: "Price: high to low", value: "price-desc" },
	{ label: "Lowest mileage", value: "mileage-asc" },
	{ label: "Newest year", value: "year-desc" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface StockFilters {
	body: BodyType[];
	condition?: Condition;
	fuel: Fuel[];
	gearbox?: Gearbox;
	make?: string;
	maxPrice?: number;
	minPrice?: number;
	minYear?: number;
	model?: string;
	sort: SortValue;
}

export const emptyFilters: StockFilters = {
	body: [],
	fuel: [],
	sort: "newest",
};

interface ParamReader {
	get: (name: string) => string | null;
}

const isOneOf = <T extends string>(
	values: readonly T[],
	value: string | null | undefined
): value is T =>
	typeof value === "string" && (values as readonly string[]).includes(value);

const positiveInt = (value: string | null): number | undefined => {
	if (!value) {
		return;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const splitList = <T extends string>(
	values: readonly T[],
	raw: string | null
): T[] =>
	(raw ?? "").split(",").filter((item): item is T => isOneOf(values, item));

/** Reads filters from URL search params, ignoring anything invalid. */
export const parseFilters = (params: ParamReader): StockFilters => {
	const sort = params.get("sort");
	const condition = params.get("condition");
	const gearbox = params.get("gearbox");
	const sortValues = SORT_OPTIONS.map((option) => option.value);
	return {
		body: splitList(BODY_TYPES, params.get("body")),
		condition: isOneOf(CONDITIONS, condition) ? condition : undefined,
		fuel: splitList(FUELS, params.get("fuel")),
		gearbox: isOneOf(GEARBOXES, gearbox) ? gearbox : undefined,
		make: params.get("make") || undefined,
		maxPrice: positiveInt(params.get("maxPrice")),
		minPrice: positiveInt(params.get("minPrice")),
		minYear: positiveInt(params.get("minYear")),
		model: params.get("model") || undefined,
		sort: isOneOf(sortValues, sort) ? sort : "newest",
	};
};

/** Serialises filters back to a query string, omitting defaults. */
export const filtersToQuery = (filters: StockFilters): string => {
	const params = new URLSearchParams();
	if (filters.body.length > 0) {
		params.set("body", filters.body.join(","));
	}
	if (filters.fuel.length > 0) {
		params.set("fuel", filters.fuel.join(","));
	}
	const scalars: [string, string | number | undefined][] = [
		["condition", filters.condition],
		["gearbox", filters.gearbox],
		["make", filters.make],
		["model", filters.model],
		["minYear", filters.minYear],
		["minPrice", filters.minPrice],
		["maxPrice", filters.maxPrice],
	];
	for (const [key, value] of scalars) {
		if (value !== undefined && value !== "") {
			params.set(key, String(value));
		}
	}
	if (filters.sort !== "newest") {
		params.set("sort", filters.sort);
	}
	return params.toString();
};

export const matchesFilters = (
	vehicle: Vehicle,
	filters: StockFilters
): boolean => {
	const checks = [
		filters.body.length === 0 || filters.body.includes(vehicle.body),
		filters.fuel.length === 0 || filters.fuel.includes(vehicle.fuel),
		!filters.condition || vehicle.condition === filters.condition,
		!filters.gearbox || vehicle.gearbox === filters.gearbox,
		!filters.make || vehicle.make === filters.make,
		!filters.model || vehicle.model === filters.model,
		!filters.minYear || vehicle.year >= filters.minYear,
		!filters.minPrice || vehicle.price >= filters.minPrice,
		!filters.maxPrice || vehicle.price <= filters.maxPrice,
	];
	return checks.every(Boolean);
};

const comparators: Record<SortValue, (a: Vehicle, b: Vehicle) => number> = {
	"mileage-asc": (a, b) => a.mileageKm - b.mileageKm,
	newest: (a, b) => a.arrivedDaysAgo - b.arrivedDaysAgo,
	"price-asc": (a, b) => a.price - b.price,
	"price-desc": (a, b) => b.price - a.price,
	"year-desc": (a, b) => b.year - a.year || a.arrivedDaysAgo - b.arrivedDaysAgo,
};

export const applyFilters = (
	list: readonly Vehicle[],
	filters: StockFilters
): Vehicle[] =>
	list
		.filter((vehicle) => matchesFilters(vehicle, filters))
		.sort(comparators[filters.sort]);

/** Count of vehicles per value, e.g. how many SUVs match the other filters. */
export const countBy = <K extends string>(
	list: readonly Vehicle[],
	key: (vehicle: Vehicle) => K
): Partial<Record<K, number>> => {
	const counts: Partial<Record<K, number>> = {};
	for (const vehicle of list) {
		const value = key(vehicle);
		counts[value] = (counts[value] ?? 0) + 1;
	}
	return counts;
};

export interface ActiveFilterChip {
	key: string;
	label: string;
}

/** Human-readable chips for the currently applied filters. */
export const activeFilterChips = (
	filters: StockFilters
): ActiveFilterChip[] => {
	const chips: ActiveFilterChip[] = [];
	for (const body of filters.body) {
		chips.push({ key: `body:${body}`, label: BODY_LABELS[body] });
	}
	for (const fuel of filters.fuel) {
		chips.push({ key: `fuel:${fuel}`, label: fuel });
	}
	if (filters.condition) {
		chips.push({ key: "condition", label: filters.condition });
	}
	if (filters.gearbox) {
		chips.push({
			key: "gearbox",
			label: filters.gearbox === "Auto" ? "Automatic" : "Manual",
		});
	}
	if (filters.make) {
		chips.push({ key: "make", label: filters.make });
	}
	if (filters.model) {
		chips.push({ key: "model", label: filters.model });
	}
	if (filters.minYear) {
		chips.push({ key: "minYear", label: `${filters.minYear} or newer` });
	}
	if (filters.minPrice) {
		chips.push({
			key: "minPrice",
			label: `Over $${Math.round(filters.minPrice / 1000)}k`,
		});
	}
	if (filters.maxPrice) {
		chips.push({
			key: "maxPrice",
			label: `Under $${Math.round(filters.maxPrice / 1000)}k`,
		});
	}
	return chips;
};

/** Removes the filter behind a chip key produced by activeFilterChips. */
export const removeFilter = (
	filters: StockFilters,
	chipKey: string
): StockFilters => {
	const [key, value] = chipKey.split(":");
	switch (key) {
		case "body":
			return {
				...filters,
				body: filters.body.filter((item) => item !== value),
			};
		case "fuel":
			return {
				...filters,
				fuel: filters.fuel.filter((item) => item !== value),
			};
		case "condition":
		case "gearbox":
		case "make":
		case "model":
		case "minYear":
		case "minPrice":
		case "maxPrice":
			return { ...filters, [key]: undefined };
		default:
			return filters;
	}
};

export const paginate = <T>(
	list: readonly T[],
	page: number,
	size: number = PAGE_SIZE
): { items: T[]; page: number; pageCount: number } => {
	const pageCount = Math.max(1, Math.ceil(list.length / size));
	const safePage = Math.min(Math.max(1, page), pageCount);
	return {
		items: list.slice((safePage - 1) * size, safePage * size),
		page: safePage,
		pageCount,
	};
};
