const UNITS = [
	{ size: 1_000_000_000_000, suffix: "T" },
	{ size: 1_000_000_000, suffix: "B" },
	{ size: 1_000_000, suffix: "M" },
	{ size: 1000, suffix: "K" },
] as const;

/** Significant figures shown once a count is abbreviated: 1.02K, 10.5K, 123K. */
const SIGNIFICANT_FIGURES = 3;

/**
 * Formats a count for people: 0–999 as-is, then three significant figures
 * with a unit (1.1K, 1.02K, 10K, 123K, 1.5M). Truncates instead of rounding so
 * a count is never overstated (1,999 is 1.99K, not 2K).
 */
export const formatCount = (value: number): string => {
	if (!Number.isFinite(value)) {
		return "0";
	}
	const sign = value < 0 ? "-" : "";
	const whole = Math.trunc(Math.abs(value));
	const unit = UNITS.find(({ size }) => whole >= size);
	if (!unit) {
		return `${sign}${whole}`;
	}
	const integerDigits = String(Math.trunc(whole / unit.size)).length;
	const decimals = Math.max(0, SIGNIFICANT_FIGURES - integerDigits);
	const step = unit.size / 10 ** decimals;
	const shown = Math.trunc(whole / step) / 10 ** decimals;
	return `${sign}${shown}${unit.suffix}`;
};

/** Formats every value of a record of counts, keeping the keys. */
export const formatCounts = <K extends string>(
	counts: Record<K, number>
): Record<K, string> => {
	const formatted = {} as Record<K, string>;
	for (const [key, count] of Object.entries(counts) as [K, number][]) {
		formatted[key] = formatCount(count);
	}
	return formatted;
};
