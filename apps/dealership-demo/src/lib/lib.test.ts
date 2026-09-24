import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { estimateFinance, financeFrom, monthlyRepayment } from "@/lib/finance";
import { formatKm, formatPrice, parseAmount } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import {
	activeFilterChips,
	applyFilters,
	emptyFilters,
	filtersToQuery,
	paginate,
	parseFilters,
	removeFilter,
} from "@/lib/stock";
import { similarVehicles, vehicles } from "@/lib/vehicles";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

describe("finance", () => {
	it("matches the design's worked example of $864 a month", () => {
		const estimate = estimateFinance(42_000, 30, 48);
		expect(estimate).toEqual({
			deposit: 12_600,
			financed: 29_400,
			monthly: 864,
		});
	});

	it("clamps the deposit between 10% and 50%", () => {
		expect(estimateFinance(10_000, 5, 24).deposit).toBe(1000);
		expect(estimateFinance(10_000, 80, 24).deposit).toBe(5000);
	});

	it("handles zero interest and empty principal", () => {
		expect(monthlyRepayment(1200, 0, 12)).toBe(100);
		expect(monthlyRepayment(0, 18, 48)).toBe(0);
	});

	it("derives the 'finance from' figure from the default terms", () => {
		expect(financeFrom(42_000)).toBe(864);
	});
});

describe("format", () => {
	it("formats prices and mileage", () => {
		expect(formatPrice(78_500)).toBe("$78,500");
		expect(formatKm(18_400)).toBe("18,400 km");
	});

	it("parses typed amounts", () => {
		expect(parseAmount("$45,000")).toBe(45_000);
		expect(parseAmount("")).toBeUndefined();
	});
});

describe("whatsappLink", () => {
	it("targets the configured number with an encoded message", () => {
		expect(whatsappLink("Hi there", "+263 77 123 4567")).toBe(
			"https://wa.me/263771234567?text=Hi%20there"
		);
	});

	it("falls back to a recipient picker without a number", () => {
		expect(whatsappLink("Hi", "")).toBe("https://wa.me/?text=Hi");
	});
});

describe("stock filters", () => {
	it("round-trips filters through the query string", () => {
		const query =
			"body=SUV,Bakkie&fuel=Diesel&gearbox=Auto&minYear=2018&maxPrice=45000&sort=price-asc";
		const filters = parseFilters(new URLSearchParams(query));
		expect(filters.body).toEqual(["SUV", "Bakkie"]);
		expect(filters.sort).toBe("price-asc");
		expect(parseFilters(new URLSearchParams(filtersToQuery(filters)))).toEqual(
			filters
		);
	});

	it("ignores invalid values", () => {
		const filters = parseFilters(
			new URLSearchParams("body=Boat&sort=random&minYear=abc&gearbox=CVT")
		);
		expect(filters).toEqual({
			...emptyFilters,
			condition: undefined,
			gearbox: undefined,
			make: undefined,
			maxPrice: undefined,
			minPrice: undefined,
			minYear: undefined,
			model: undefined,
		});
	});

	it("filters and sorts the sample stock", () => {
		const result = applyFilters(vehicles, {
			...emptyFilters,
			fuel: ["Diesel"],
			gearbox: "Auto",
			sort: "price-asc",
		});
		expect(result.length).toBeGreaterThan(0);
		for (const vehicle of result) {
			expect(vehicle.fuel).toBe("Diesel");
			expect(vehicle.gearbox).toBe("Auto");
		}
		const prices = result.map((vehicle) => vehicle.price);
		expect(prices).toEqual([...prices].sort((a, b) => a - b));
	});

	it("turns filters into removable chips", () => {
		const filters = {
			...emptyFilters,
			body: ["SUV" as const],
			maxPrice: 40_000,
		};
		const chips = activeFilterChips(filters);
		expect(chips.map((chip) => chip.label)).toEqual(["SUVs", "Under $40k"]);
		expect(removeFilter(filters, "body:SUV").body).toEqual([]);
		expect(removeFilter(filters, "maxPrice").maxPrice).toBeUndefined();
	});

	it("paginates and clamps the page number", () => {
		const list = Array.from({ length: 13 }, (_, index) => index);
		expect(paginate(list, 1, 6).items).toHaveLength(6);
		expect(paginate(list, 9, 6)).toMatchObject({ page: 3, pageCount: 3 });
		expect(paginate([], 1, 6)).toMatchObject({ items: [], pageCount: 1 });
	});
});

describe("sample stock data", () => {
	it("has unique ids and stock numbers", () => {
		expect(new Set(vehicles.map((vehicle) => vehicle.id)).size).toBe(
			vehicles.length
		);
		expect(new Set(vehicles.map((vehicle) => vehicle.stockNumber)).size).toBe(
			vehicles.length
		);
	});

	it("only references images that exist", () => {
		for (const vehicle of vehicles) {
			for (const image of vehicle.images) {
				expect(existsSync(`${publicDir}${image.src}`), image.src).toBe(true);
			}
		}
	});

	it("never labels a high-mileage car as new", () => {
		for (const vehicle of vehicles.filter((item) => item.condition === "New")) {
			expect(vehicle.mileageKm).toBeLessThan(100);
		}
	});

	it("suggests similar cars without the current one", () => {
		const [first] = vehicles;
		if (!first) {
			throw new Error("Sample stock is empty");
		}
		const similar = similarVehicles(first);
		expect(similar).toHaveLength(3);
		expect(similar.some((vehicle) => vehicle.id === first.id)).toBe(false);
	});
});
