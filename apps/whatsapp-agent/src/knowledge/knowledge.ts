/**
 * Angel's knowledge base, drawn from docs/sales-script.md and the owner's
 * decisions. Prices come from get_offer; anything not written here or there
 * is unknown to Angel and goes to the owner rather than being guessed.
 */

export interface KnowledgeEntry {
	/** Plain-language facts or an approved response direction. */
	answer: string;
	/** When true Angel should also call request_human after answering. */
	escalate?: boolean;
	id: string;
	keywords: string[];
	title: string;
}

export const buildKnowledge = (): KnowledgeEntry[] => [
	{
		answer:
			"Where They Are is a Zimbabwean social media agency for car dealerships. We keep dealership Facebook and Instagram pages active, professional and worth following, so more buyers notice their vehicles, remember the dealership and start conversations when they're ready to buy. We are starting with dealerships in Mutare and Harare.",
		id: "about",
		keywords: [
			"who",
			"about",
			"company",
			"where they are",
			"you guys",
			"what do you do",
			"team",
			"agency",
		],
		title: "Who Where They Are is",
	},
	{
		answer:
			"Every plan covers Facebook and Instagram. Each post is a professionally designed Facebook post, an adapted Instagram version, a caption where needed, and publishing to both pages, in the dealership's own branding. Post types: vehicle listings, new arrivals, vehicle comparisons, features and benefits, price updates, special offers, buyer tips, customer deliveries, sold vehicles, stock highlights, engagement questions like 'Which one would you choose?' and dealership updates. Posts use only the dealership's real vehicles and the details they supply.",
		id: "whats_included",
		keywords: [
			"include",
			"included",
			"what do i get",
			"what will you post",
			"posts",
			"content",
			"design",
			"caption",
			"facebook",
			"instagram",
			"platforms",
		],
		title: "What every plan includes",
	},
	{
		answer:
			"How it works: once they choose a plan, the owner confirms their start and how to pay. Then they send their vehicle photos and details (price, mileage, engine, gearbox, duty status where relevant), their logo and contact details, any offers or updates, and access so we can post on their pages. We design the posts in their branding and publish them consistently on Facebook and Instagram.",
		id: "process",
		keywords: [
			"how does it work",
			"process",
			"steps",
			"next step",
			"get started",
			"start",
			"sign up",
			"what do you need",
			"onboarding",
			"access",
		],
		title: "How it works",
	},
	{
		answer:
			"Prices are fixed. Always call get_offer or recommend_plan and quote exactly. The only discount is the launch offer (50% off the first month of Growth or Pro for the first five dealerships). Never offer other discounts, trials, bundles or instalments. If someone insists, stay friendly and hand over with request_human (reason custom_package_or_discount).",
		id: "pricing_rules",
		keywords: [
			"price",
			"cost",
			"how much",
			"charge",
			"fee",
			"rate",
			"discount",
			"cheaper",
			"negotiate",
			"deal",
			"plans",
			"package",
		],
		title: "Pricing rules",
	},
	{
		answer:
			"Objection 'it's too expensive': Starter keeps the page active from $32 a month (4 posts). While the launch offer is open, Growth's first month is $48 instead of $96 so they can see the quality before paying the full price. Ask which would work better. Never discount further; a custom package goes to the owner.",
		id: "objection_price",
		keywords: [
			"expensive",
			"too much",
			"afford",
			"budget",
			"no money",
			"cheaper",
			"can't pay",
			"costly",
		],
		title: "Objection: too expensive",
	},
	{
		answer:
			"Objection 'we already post ourselves': that's good, and they know their cars best. Most owners don't have the time to post consistently with designed posts on both Facebook and Instagram. We handle that so their cars keep appearing even on busy weeks. Ask how often they manage to post now.",
		id: "objection_already_posting",
		keywords: [
			"we post ourselves",
			"already post",
			"i post",
			"my son posts",
			"we have someone",
			"do it ourselves",
			"our own posts",
			"marketplace",
		],
		title: "Objection: we already post ourselves",
	},
	{
		answer:
			"We can't honestly promise a number of sales, enquiries, followers or reach. What we do is keep the dealership active, professional and memorable, so buyers have more reasons to notice, trust and contact them when they're ready to buy.",
		id: "guarantees",
		keywords: [
			"guarantee",
			"more sales",
			"more customers",
			"results",
			"followers",
			"likes",
			"reach",
			"worth it",
			"roi",
			"will it work",
			"sell more",
			"refund",
		],
		title: "Results and guarantees",
	},
	{
		answer:
			"Objection 'I need to think about it': if it's said softly, ask once whether it's the price, what's included or the timing they'd like to think about. If they firmly say they'll think about it and get back to us, don't push: stay silent and let them come back.",
		id: "objection_think",
		keywords: [
			"think about it",
			"let me think",
			"get back to you",
			"later",
			"not now",
			"maybe",
			"consider",
		],
		title: "Objection: I need to think about it",
	},
	{
		answer:
			"If they don't have good photos: we work with the photos they have and present them as clearly as possible. Vehicle photography and walkaround videos are a separate service; if they want it, hand over with request_human (reason other_service).",
		id: "photos",
		keywords: [
			"photos",
			"pictures",
			"no good photos",
			"phone camera",
			"images",
			"photography",
			"video",
			"walkaround",
		],
		title: "Vehicle photos",
	},
	{
		answer:
			"Other services, each quoted separately by the owner and never part of a plan: Brand Perfection (logo refinement, profile and cover images, brand colours, listing templates, catalogue images in batches), vehicle photography and walkaround videos, paid Facebook and Instagram ads, WhatsApp enquiry handling, marketplace listing management, Google Business Profile management, review collection, and catalogue or full dealership websites. Say we offer it as a separate service and hand over with request_human (reason other_service).",
		escalate: true,
		id: "other_services",
		keywords: [
			"website",
			"logo",
			"branding",
			"ads",
			"advertising",
			"boost",
			"promote",
			"tiktok",
			"google",
			"reviews",
			"catalogue",
			"marketplace",
			"whatsapp business",
		],
		title: "Other services (upsells)",
	},
	{
		answer:
			"Payment method, when payment is due, contracts, minimum term, cancellation, setting up Instagram for dealers without it, how posts are approved, extra posts, multiple branches and prices for other services are confirmed by the owner. Say the owner will confirm it and hand over with request_human (reason payment_or_terms). Never take payment or share payment details.",
		escalate: true,
		id: "payment_terms",
		keywords: [
			"pay",
			"payment",
			"ecocash",
			"bank",
			"transfer",
			"contract",
			"cancel",
			"minimum",
			"term",
			"invoice",
			"receipt",
			"approve",
			"approval",
			"branches",
			"no instagram",
		],
		title: "Payment and terms",
	},
	{
		answer:
			"We absolutely help other businesses too in future, but right now our campaigns are for car dealerships. For restaurants, lodges, Airbnbs, guesthouses and other businesses, take the business name and what they need, save it (business_type other), and hand over with request_human (reason other_business). Don't quote the dealership plans.",
		escalate: true,
		id: "other_businesses",
		keywords: [
			"restaurant",
			"lodge",
			"airbnb",
			"guesthouse",
			"hotel",
			"salon",
			"shop",
			"not a dealership",
			"other business",
			"my business",
			"school",
			"church",
		],
		title: "Businesses that are not dealerships",
	},
	{
		answer:
			"We don't sell cars. If someone asks about a car they saw in our ads or posts, say kindly that we help car dealerships with their social media, and ask whether they're a dealer themselves. If they're a buyer, mark them not_a_fit.",
		id: "car_buyers",
		keywords: [
			"buy a car",
			"is it available",
			"still available",
			"price of the",
			"test drive",
			"for sale",
			"i want the car",
			"how much is the car",
			"vehicle price",
		],
		title: "People trying to buy a car",
	},
	{
		answer:
			"Angel is Where They Are's AI assistant. If someone asks whether they're talking to a person or a bot, say so honestly and add that a member of the team can step in at any time. Never pretend to be human.",
		id: "ai_disclosure",
		keywords: [
			"bot",
			"robot",
			"human",
			"real person",
			"are you ai",
			"automated",
			"chatgpt",
			"who am i talking",
		],
		title: "Is Angel a person?",
	},
	{
		answer:
			"If someone asks whether we're legit: fair question, don't be defensive. They'll see the work on their own page within their first month, and they can speak to our team directly. Never invent registrations, addresses, awards, clients or years in business; hand over with request_human (reason other) if they want more reassurance.",
		id: "trust",
		keywords: [
			"legit",
			"scam",
			"trust you",
			"fake",
			"real company",
			"registered",
			"where are you based",
			"office",
			"how do i know",
		],
		title: "Is Where They Are legit?",
	},
	{
		answer:
			"Only share examples returned by share_examples. If none are approved, say the team will send some examples here and hand over with request_human (reason examples). Never describe past clients or results, and never share fictional mockups unless they're labelled as examples.",
		id: "examples",
		keywords: [
			"examples",
			"show me",
			"portfolio",
			"your work",
			"previous clients",
			"samples",
			"see your",
		],
		title: "Examples of our work",
	},
	{
		answer:
			"Angel can't make or take calls. If someone asks for a call or meeting, say a member of the team will get in touch here on WhatsApp to arrange it, and hand over with request_human (reason call_or_meeting).",
		escalate: true,
		id: "calls",
		keywords: [
			"call me",
			"phone call",
			"can we talk",
			"meeting",
			"meet",
			"speak to someone",
			"speak to a person",
			"visit",
		],
		title: "Calls and meetings",
	},
	{
		answer:
			"We only use a dealer's details to talk to them about our service. Never ask for ID numbers, PINs, passwords or card details. If someone says stop or asks not to be contacted, the system confirms it and Angel stays silent afterwards.",
		id: "privacy",
		keywords: [
			"privacy",
			"my data",
			"details safe",
			"unsubscribe",
			"don't message",
			"delete my",
		],
		title: "Privacy and opting out",
	},
];

const NON_WORD = /[^a-z0-9.\s']/g;
const WHITESPACE = /\s+/;

const tokenize = (value: string): string[] =>
	value
		.toLowerCase()
		.replace(NON_WORD, " ")
		.split(WHITESPACE)
		.filter((token) => token.length > 2);

/** Keyword search over the knowledge base, best matches first. */
export const searchKnowledge = (
	entries: KnowledgeEntry[],
	query: string,
	limit = 3
): KnowledgeEntry[] => {
	const lowered = query.toLowerCase();
	const tokens = new Set(tokenize(query));
	const scored = entries.map((entry) => {
		let score = 0;
		for (const keyword of entry.keywords) {
			if (lowered.includes(keyword)) {
				score += keyword.includes(" ") ? 3 : 2;
			}
		}
		for (const token of tokenize(
			`${entry.title} ${entry.keywords.join(" ")}`
		)) {
			if (tokens.has(token)) {
				score += 1;
			}
		}
		return { entry, score };
	});
	return scored
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.entry);
};
