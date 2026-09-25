import type { Customer } from "./crm.types.js";

export type LeadBand = "close_now" | "nurture" | "low";

export interface LeadScore {
	band: LeadBand;
	/** What earned points, for the owner alert. */
	reasons: string[];
	score: number;
}

/** Score at which a dealership counts as qualified for Meta and the funnel. */
export const QUALIFIED_SCORE = 5;
const CLOSE_NOW_SCORE = 8;

type ScoredFields = Pick<
	Customer,
	"businessType" | "isDecisionMaker" | "leadSignals"
>;

const RULES: {
	applies: (lead: ScoredFields) => boolean;
	points: number;
	reason: string;
}[] = [
	{
		applies: (lead) => lead.businessType === "car_dealership",
		points: 2,
		reason: "real dealership",
	},
	{
		applies: (lead) => lead.leadSignals.priceWithinReach === true,
		points: 2,
		reason: "price within reach",
	},
	{
		applies: (lead) => lead.leadSignals.wantsLiveWithin30Days === true,
		points: 2,
		reason: "wants it live within 30 days",
	},
	{
		applies: (lead) => lead.isDecisionMaker === "yes",
		points: 2,
		reason: "decision-maker",
	},
	{
		applies: (lead) => lead.leadSignals.stockReady === true,
		points: 1,
		reason: "stock photos and details ready",
	},
	{
		applies: (lead) => lead.leadSignals.engagedWithDemo === true,
		points: 1,
		reason: "engaged with the demo",
	},
];

/**
 * The internal 0–10 lead score from docs/sales-script.md §6. Never shown to
 * the lead. 8–10: close or alert the owner now; 5–7: nurture; 0–4: low.
 */
export const scoreLead = (lead: ScoredFields): LeadScore => {
	const earned = RULES.filter((rule) => rule.applies(lead));
	const score = earned.reduce((total, rule) => total + rule.points, 0);
	let band: LeadBand = "low";
	if (score >= CLOSE_NOW_SCORE) {
		band = "close_now";
	} else if (score >= QUALIFIED_SCORE) {
		band = "nurture";
	}
	return { band, reasons: earned.map((rule) => rule.reason), score };
};
