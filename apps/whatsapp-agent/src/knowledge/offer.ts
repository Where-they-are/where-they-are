/** The monthly social media plans (docs/sales-script.md §1). */
export const PLAN_IDS = ["starter", "growth", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

interface PlanDefinition {
	/** Whether the 50% first-month launch offer applies. */
	launchDiscount: boolean;
	name: string;
	postsPerMonth: number;
	priceUsd: number;
	rhythm: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
	growth: {
		launchDiscount: true,
		name: "Growth Plan",
		postsPerMonth: 12,
		priceUsd: 96,
		rhythm: "about three a week",
	},
	pro: {
		launchDiscount: true,
		name: "Pro Plan",
		postsPerMonth: 30,
		priceUsd: 240,
		rhythm: "about one a day",
	},
	starter: {
		launchDiscount: false,
		name: "Starter plan, Page Alive",
		postsPerMonth: 4,
		priceUsd: 32,
		rhythm: "about one a week",
	},
};

/** The launch offer takes this share off the first month. */
const LAUNCH_DISCOUNT = 0.5;

/** How often the dealership wants to appear in front of buyers. */
export const DESIRED_FREQUENCIES = [
	"once_a_week",
	"three_times_a_week",
	"every_day",
	"unsure",
] as const;
export type DesiredFrequency = (typeof DESIRED_FREQUENCIES)[number];

const PLAN_FOR_FREQUENCY: Record<DesiredFrequency, PlanId> = {
	every_day: "pro",
	once_a_week: "starter",
	three_times_a_week: "growth",
	unsure: "growth",
};

/** Recommends one plan from the frequency the dealership wants (script §2). */
export const recommendPlan = (frequency: DesiredFrequency): PlanId =>
	PLAN_FOR_FREQUENCY[frequency];

export interface OfferConfig {
	/** How many dealerships can take the launch offer. */
	launchPlaces: number;
	/** Launch places already used by clients signed outside Angel's CRM. */
	launchPlacesUsedOffset: number;
}

export interface PlanOffer {
	/** What they pay for the first month right now. */
	firstMonthUsd: number;
	id: PlanId;
	name: string;
	/** Whether the launch price applies to the next client on this plan. */
	onLaunchOffer: boolean;
	/** The recommendation, word for word from the sales script. */
	pitch: string;
	postsPerMonth: number;
	priceUsd: number;
	rhythm: string;
	/** One line for lists and owner replies. */
	summary: string;
}

export interface SocialMediaOffer {
	/** What every plan includes. */
	includes: string;
	launchOfferOpen: boolean;
	launchPlacesLeft: number;
	launchPlacesTotal: number;
	/** Terms the owner has not confirmed yet: never answer these. */
	notDecided: string;
	plans: Record<PlanId, PlanOffer>;
	/** All three plans in a few lines. */
	summary: string;
}

export const usd = (value: number) => `$${value.toLocaleString("en-US")}`;

const WHY =
	"We create the posts, show your cars in the best way and publish them consistently. The goal is to help more buyers notice your vehicles, remember your dealership and start conversations when they are ready to buy.";

const pitchFor = (id: PlanId, onLaunchOffer: boolean): string => {
	const plan = PLANS[id];
	const launch = `The normal price is ${usd(plan.priceUsd)} per month, but it is currently ${usd(plan.priceUsd * LAUNCH_DISCOUNT)} for the first month for the first five dealerships.`;
	const price = onLaunchOffer
		? launch
		: `It is ${usd(plan.priceUsd)} per month.`;
	if (id === "starter") {
		return `The Starter plan, Page Alive, would suit you: ${plan.postsPerMonth} posts per month, ${plan.rhythm}, across Facebook and Instagram, for ${usd(plan.priceUsd)} per month. It keeps your page active so buyers can see you're open for business.`;
	}
	if (id === "growth") {
		return `Based on that, the Growth Plan would probably suit you best. It includes ${plan.postsPerMonth} posts per month across Facebook and Instagram, ${plan.rhythm}. ${price}\n\n${WHY}`;
	}
	return `Based on that, the Pro Plan would suit you best. It includes ${plan.postsPerMonth} posts per month, ${plan.rhythm}, across Facebook and Instagram. ${price}`;
};

/**
 * The social media offer: three fixed monthly plans, and 50% off the first
 * month of Growth or Pro for the first five dealerships. Prices are fixed,
 * never negotiated.
 */
export const socialMediaOffer = (
	config: OfferConfig,
	launchClients: number
): SocialMediaOffer => {
	const used = launchClients + config.launchPlacesUsedOffset;
	const launchPlacesLeft = Math.max(0, config.launchPlaces - used);
	const launchOfferOpen = launchPlacesLeft > 0;
	const plans = {} as Record<PlanId, PlanOffer>;
	for (const id of PLAN_IDS) {
		const plan = PLANS[id];
		const onLaunchOffer = launchOfferOpen && plan.launchDiscount;
		const firstMonthUsd = onLaunchOffer
			? plan.priceUsd * LAUNCH_DISCOUNT
			: plan.priceUsd;
		plans[id] = {
			firstMonthUsd,
			id,
			name: plan.name,
			onLaunchOffer,
			pitch: pitchFor(id, onLaunchOffer),
			postsPerMonth: plan.postsPerMonth,
			priceUsd: plan.priceUsd,
			rhythm: plan.rhythm,
			summary: `${plan.name}: ${plan.postsPerMonth} posts/month (${plan.rhythm}), ${usd(plan.priceUsd)}/month${onLaunchOffer ? `, ${usd(firstMonthUsd)} for the first month` : ""}`,
		};
	}
	return {
		includes:
			"Every plan covers Facebook and Instagram. Each post is a professionally designed Facebook post, an adapted Instagram version, a caption where needed, and publishing to both pages, in the dealership's own branding. Posts show the dealership's real vehicles and details: listings, new arrivals, comparisons, features, price updates, offers, buyer tips, deliveries, sold vehicles, stock highlights, questions like 'Which one would you choose?' and dealership updates.",
		launchOfferOpen,
		launchPlacesLeft,
		launchPlacesTotal: config.launchPlaces,
		notDecided:
			"Minimum term, contracts and cancellation, payment for later months, setting up Instagram for dealerships without it, how often they approve posts, and prices for extra services are confirmed by the owner. Never answer these yourself.",
		plans,
		summary: PLAN_IDS.map((id) => plans[id].summary).join("\n"),
	};
};
