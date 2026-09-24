export interface PricingConfig {
	earlyPriceUsd: number;
	earlySlots: number;
	earlySlotsUsedOffset: number;
	standardPriceUsd: number;
}

export interface DealershipPricing {
	/** The price that applies to the next dealership that signs. */
	currentPriceUsd: number;
	earlyPriceUsd: number;
	earlySlotsLeft: number;
	earlySlotsTotal: number;
	isEarlyPrice: boolean;
	standardPriceUsd: number;
	/** What Angel may say, word for word if it likes. */
	statement: string;
}

const usd = (value: number) => `$${value.toLocaleString("en-US")}`;

/**
 * Dealership website pricing set by the owner: the early price for the first
 * N dealerships that sign, then the standard price. These are fixed prices,
 * not a starting point for negotiation.
 */
export const dealershipPricing = (
	config: PricingConfig,
	wonDealerships: number
): DealershipPricing => {
	const used = wonDealerships + config.earlySlotsUsedOffset;
	const earlySlotsLeft = Math.max(0, config.earlySlots - used);
	const isEarlyPrice = earlySlotsLeft > 0;
	const currentPriceUsd = isEarlyPrice
		? config.earlyPriceUsd
		: config.standardPriceUsd;
	const statement = isEarlyPrice
		? `A dealership website is a once-off ${usd(config.earlyPriceUsd)} for our first ${config.earlySlots} dealership partners (${earlySlotsLeft} of those spots still open). After that the price is ${usd(config.standardPriceUsd)}.`
		: `A dealership website is a once-off ${usd(config.standardPriceUsd)}.`;
	return {
		currentPriceUsd,
		earlyPriceUsd: config.earlyPriceUsd,
		earlySlotsLeft,
		earlySlotsTotal: config.earlySlots,
		isEarlyPrice,
		standardPriceUsd: config.standardPriceUsd,
		statement,
	};
};
