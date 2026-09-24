const usd = new Intl.NumberFormat("en-US", {
	currency: "USD",
	maximumFractionDigits: 0,
	style: "currency",
});

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const NON_NUMERIC = /[^\d.]/g;

export const formatPrice = (value: number): string => usd.format(value);

export const formatNumber = (value: number): string => grouped.format(value);

export const formatKm = (value: number): string =>
	`${grouped.format(value)} km`;

/** "$45,000" -> 45000; returns undefined for empty or non-numeric input. */
export const parseAmount = (value: string): number | undefined => {
	const digits = value.replace(NON_NUMERIC, "");
	if (!digits) {
		return;
	}
	const parsed = Number.parseFloat(digits);
	return Number.isFinite(parsed) ? parsed : undefined;
};
