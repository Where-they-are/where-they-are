import { describe, expect, it } from "vitest";

import { formatCount, formatCounts } from "./count.js";

describe("formatCount", () => {
	it.each([
		[0, "0"],
		[1, "1"],
		[42, "42"],
		[999, "999"],
		[1000, "1K"],
		[1020, "1.02K"],
		[1100, "1.1K"],
		[1130, "1.13K"],
		[1999, "1.99K"],
		[9999, "9.99K"],
		[10_000, "10K"],
		[10_500, "10.5K"],
		[99_999, "99.9K"],
		[123_456, "123K"],
		[999_999, "999K"],
		[1_000_000, "1M"],
		[1_500_000, "1.5M"],
		[25_300_000, "25.3M"],
		[2_010_000_000, "2.01B"],
		[4_000_000_000_000, "4T"],
	])("formats %d as %s", (value, expected) => {
		expect(formatCount(value)).toBe(expected);
	});

	it("never rounds a count up", () => {
		expect(formatCount(1999)).not.toBe("2K");
		expect(formatCount(999_999)).toBe("999K");
	});

	it("handles negatives, fractions and bad input", () => {
		expect(formatCount(-1500)).toBe("-1.5K");
		expect(formatCount(12.9)).toBe("12");
		expect(formatCount(Number.NaN)).toBe("0");
		expect(formatCount(Number.POSITIVE_INFINITY)).toBe("0");
	});
});

describe("formatCounts", () => {
	it("formats every value and keeps the keys", () => {
		expect(formatCounts({ demos: 1020, leads: 7 })).toEqual({
			demos: "1.02K",
			leads: "7",
		});
	});
});
