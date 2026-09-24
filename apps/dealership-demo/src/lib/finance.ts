export const FINANCE_TERMS = [24, 36, 48, 60] as const;
export type FinanceTerm = (typeof FINANCE_TERMS)[number];

export const MIN_DEPOSIT_PERCENT = 10;
export const MAX_DEPOSIT_PERCENT = 50;
export const DEFAULT_DEPOSIT_PERCENT = 30;
export const DEFAULT_TERM: FinanceTerm = 48;
/** Indicative annual rate used for estimates; banks set the real rate. */
export const INDICATIVE_ANNUAL_RATE = 18;

export interface FinanceEstimate {
	deposit: number;
	financed: number;
	monthly: number;
}

/** Standard amortised monthly repayment. */
export const monthlyRepayment = (
	principal: number,
	annualRatePercent: number,
	months: number
): number => {
	if (principal <= 0 || months <= 0) {
		return 0;
	}
	const monthlyRate = annualRatePercent / 100 / 12;
	if (monthlyRate === 0) {
		return principal / months;
	}
	return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
};

export const estimateFinance = (
	price: number,
	depositPercent: number,
	months: number,
	annualRatePercent: number = INDICATIVE_ANNUAL_RATE
): FinanceEstimate => {
	const safePrice = Math.max(0, price);
	const clampedDeposit = Math.min(
		MAX_DEPOSIT_PERCENT,
		Math.max(MIN_DEPOSIT_PERCENT, depositPercent)
	);
	const deposit = Math.round((safePrice * clampedDeposit) / 100);
	const financed = safePrice - deposit;
	return {
		deposit,
		financed,
		monthly: Math.round(monthlyRepayment(financed, annualRatePercent, months)),
	};
};

/** Monthly figure shown next to a car's price: 30% deposit over 48 months. */
export const financeFrom = (price: number): number =>
	estimateFinance(price, DEFAULT_DEPOSIT_PERCENT, DEFAULT_TERM).monthly;
