export interface PricingConfig {
	earlyPriceUsd: number;
	earlySlots: number;
	earlySlotsUsedOffset: number;
	standardPriceUsd: number;
}

/** Fixed terms from docs/sales-script.md §1. */
export const OFFER_TERMS = {
	deliveryDays: 3,
	/** Agreed technical issues are fixed free within this many hours. */
	fixHours: 48,
	freeHostingMonths: 1,
	hostingMonthlyUsd: 15,
	/** Up to this many pages or sections in the standard package. */
	maxSections: 5,
	revisionRounds: 1,
} as const;

export interface DealershipPricing {
	/** Paid after delivery. */
	balanceUsd: number;
	/** The price that applies to the next dealership that pays a deposit. */
	currentPriceUsd: number;
	/** Paid to start the build. */
	depositUsd: number;
	earlyPriceUsd: number;
	earlySlotsLeft: number;
	earlySlotsTotal: number;
	/** The offer in one sentence, with the three free extras. Lead with this. */
	headline: string;
	isEarlyPrice: boolean;
	standardPriceUsd: number;
	/** Alias of headline, kept for the owner's #price command and the admin API. */
	statement: string;
	/** The other terms, each to be mentioned only when it becomes relevant. */
	terms: Record<
		"delivery" | "domain" | "fixes" | "hosting" | "missedDeadline" | "payment",
		string
	>;
}

export const usd = (value: number) => `$${value.toLocaleString("en-US")}`;

const FREE_EXTRAS = `a free domain, free import of your current stock and free fixes within ${OFFER_TERMS.fixHours} hours`;

/**
 * The dealership offer set by the owner: the founding price for the first N
 * dealerships that pay a deposit, then the standard price. Half is paid to
 * start and half after delivery. Prices are fixed, never negotiated.
 */
export const dealershipPricing = (
	config: PricingConfig,
	foundingDealerships: number
): DealershipPricing => {
	const used = foundingDealerships + config.earlySlotsUsedOffset;
	const earlySlotsLeft = Math.max(0, config.earlySlots - used);
	const isEarlyPrice = earlySlotsLeft > 0;
	const currentPriceUsd = isEarlyPrice
		? config.earlyPriceUsd
		: config.standardPriceUsd;
	const depositUsd = Math.ceil(currentPriceUsd / 2);
	const balanceUsd = currentPriceUsd - depositUsd;
	const headline = isEarlyPrice
		? `For our first ${config.earlySlots} dealerships, a dealership website is ${usd(config.earlyPriceUsd)} instead of ${usd(config.standardPriceUsd)}, with ${FREE_EXTRAS}.`
		: `A dealership website is ${usd(config.standardPriceUsd)}, with ${FREE_EXTRAS}.`;
	const { deliveryDays, fixHours, hostingMonthlyUsd } = OFFER_TERMS;
	return {
		balanceUsd,
		currentPriceUsd,
		depositUsd,
		earlyPriceUsd: config.earlyPriceUsd,
		earlySlotsLeft,
		earlySlotsTotal: config.earlySlots,
		headline,
		isEarlyPrice,
		standardPriceUsd: config.standardPriceUsd,
		statement: headline,
		terms: {
			delivery: `The site is ready within ${deliveryDays} days of receiving the deposit and everything we need (logo, dealership details, stock photos and details).`,
			domain:
				"We register the domain (for example yourdealership.co.zw) and keep it renewed free for as long as hosting is paid.",
			fixes: `Any agreed technical issue is fixed free within ${fixHours} hours of being reported.`,
			hosting: `Hosting is free for the first month, then ${usd(hostingMonthlyUsd)}/month.`,
			missedDeadline: `If we miss the ${deliveryDays} days for a reason within our control, the customer does not pay the ${usd(balanceUsd)} balance. The deposit is not refunded.`,
			payment: `${usd(depositUsd)} deposit to start, and the remaining ${usd(balanceUsd)} only after the site is delivered.`,
		},
	};
};
