/**
 * Angel's knowledge base, drawn from docs/plan.md, docs/vision.md and the
 * owner's decisions. Anything not written here is unknown to Angel and must
 * go to a human rather than be guessed.
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

export const buildKnowledge = (demoUrl: string): KnowledgeEntry[] => [
	{
		answer:
			"Where They Are is a Zimbabwean team that builds modern, professional websites for businesses. Right now we are focused on car dealerships: we build dealership websites that present the vehicles, location, contact options and credibility of the business clearly, especially on phones. We also build websites for other kinds of businesses.",
		id: "about",
		keywords: [
			"who",
			"about",
			"company",
			"where they are",
			"you guys",
			"what do you do",
			"team",
		],
		title: "Who Where They Are is",
	},
	{
		answer: `The demo is a sample dealership website we built called Ridgeline Motors. Ridgeline Motors is a made-up dealership used to show what a dealership's site can look like; its cars, prices and reviews are sample content. Demo link: ${demoUrl} . Encourage the lead to look at how the vehicles, dealership information and WhatsApp/call buttons are presented on their phone.`,
		id: "demo",
		keywords: [
			"demo",
			"example",
			"sample",
			"see",
			"show me",
			"link",
			"ridgeline",
			"portfolio",
		],
		title: "The dealership demo",
	},
	{
		answer:
			"A dealership website from us is built around the dealership's own details and stock. Based on the demo it can include: a home page with the dealership's name, location and contact buttons; a stock page listing vehicles with photos, prices, mileage, year, fuel and gearbox, with filters; a page per vehicle; WhatsApp and call buttons on every page so buyers can enquire instantly; location, map directions and opening hours; and optional sections like a finance repayment estimate, a trade-in enquiry and service booking. It is designed mobile-first because most buyers browse on their phones. The exact pages are agreed with the dealership.",
		id: "whats_included",
		keywords: [
			"include",
			"included",
			"features",
			"pages",
			"what do i get",
			"what will",
			"stock page",
			"inventory",
			"finance",
			"trade in",
			"mobile",
		],
		title: "What a dealership website includes",
	},
	{
		answer:
			"How it works: we chat here on WhatsApp to understand the dealership (name, location, the cars you deal in, contact details, logo and photos if you have them). Our team then builds the site, you review it, request changes, and it goes live. A team member confirms the exact steps and timeline when we prepare your site.",
		id: "process",
		keywords: [
			"how does it work",
			"process",
			"steps",
			"next step",
			"get started",
			"start",
			"proceed",
			"sign up",
			"what do you need",
		],
		title: "How the process works",
	},
	{
		answer:
			"Pricing is fixed, not negotiable. Always call get_pricing for the current dealership price and quote it exactly. Do not offer discounts, instalments, free trials or custom deals. If someone insists on a discount or a custom deal, stay friendly, restate the price once, and hand over to the team with request_human.",
		escalate: false,
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
			"afford",
			"expensive",
		],
		title: "Pricing rules",
	},
	{
		answer:
			"Hosting, domain names (for example a .co.zw address) and any monthly costs are confirmed by the team, not by Angel. Say a team member will confirm those details, and hand over with request_human.",
		escalate: true,
		id: "hosting_domain",
		keywords: [
			"hosting",
			"domain",
			".co.zw",
			"monthly",
			"per month",
			"renewal",
			"email address",
			"subscription",
			"annual",
		],
		title: "Hosting, domains and monthly costs",
	},
	{
		answer:
			"Delivery timelines are confirmed by the team when they prepare the site. Do not promise a date or a number of days.",
		escalate: true,
		id: "timeline",
		keywords: [
			"how long",
			"timeline",
			"when will",
			"ready",
			"days",
			"weeks",
			"deadline",
			"fast",
			"urgent",
			"turnaround",
		],
		title: "Timelines",
	},
	{
		answer:
			"Payments are handled directly by the team. Angel never shares bank, EcoCash, InnBucks or any payment details, never confirms that a payment was received, and never sends payment links. When someone wants to pay or has paid, thank them and hand over with request_human (reason: payment).",
		escalate: true,
		id: "payment",
		keywords: [
			"pay",
			"payment",
			"deposit",
			"ecocash",
			"bank",
			"transfer",
			"account",
			"invoice",
			"receipt",
			"proof of payment",
			"paid",
		],
		title: "Payments",
	},
	{
		answer:
			"We absolutely build websites for businesses that are not dealerships too, for example restaurants, salons, clinics, schools, professional services, shops and local services. Right now our ads and demo are about dealerships, so for other businesses a team member follows up personally with options and pricing. Collect the business name, what the business does, where it is, and what they want the website to do, then hand over with request_human (reason: non_dealership_lead). Do not quote the dealership price for other businesses.",
		escalate: true,
		id: "other_businesses",
		keywords: [
			"salon",
			"restaurant",
			"shop",
			"not a dealership",
			"other business",
			"my business",
			"school",
			"clinic",
			"church",
			"company website",
			"ngo",
			"hotel",
			"lodge",
			"consult",
		],
		title: "Businesses that are not dealerships",
	},
	{
		answer:
			"We do not sell cars. Ridgeline Motors in the demo is a made-up sample dealership, so its cars are not for sale. If the person is looking to buy a car, kindly explain this and that Where They Are builds websites for dealerships. If they are a dealer themselves, carry on qualifying them.",
		id: "car_buyers",
		keywords: [
			"buy a car",
			"is it available",
			"still available",
			"price of the",
			"prado",
			"fortuner",
			"hilux",
			"test drive",
			"finance a car",
			"for sale",
			"vehicle price",
			"i want the car",
		],
		title: "People trying to buy a car",
	},
	{
		answer:
			"Objection 'we are too small for a website': the dealership may not need a large or complicated website. The point is a clear, professional place online where people can understand what you sell, where you are, and how to contact you. The question is not only whether you have a website, but whether your current online presence presents the business strongly enough when a customer or business partner checks it. A stronger online presence may help the dealership look more established, but we cannot promise a number of leads, sales or bigger deals.",
		id: "objection_too_small",
		keywords: [
			"too small",
			"small dealer",
			"not ready",
			"don't need",
			"dont need",
			"no need",
			"small business",
			"few cars",
			"just starting",
		],
		title: "Objection: too small for a website",
	},
	{
		answer:
			"Objection 'we already have a Facebook page': a Facebook page can be useful. The website gives the dealership its own focused place that presents the dealership, its vehicles, location and contact options together, and that it controls. Ask what they use today (Facebook, WhatsApp status, Instagram, classifieds) and whether it shows their stock and details clearly, then let them compare with the demo.",
		id: "objection_facebook",
		keywords: [
			"facebook",
			"instagram",
			"social media",
			"whatsapp status",
			"tiktok",
			"marketplace",
			"classifieds",
			"page already",
		],
		title: "Objection: we already have Facebook",
	},
	{
		answer:
			"Objection 'show me another dealership that has one': there are dealerships that use websites to present their business, and the team can share a verified example if useful. Never name, invent or describe a specific competitor, website, location or claim about another business. The more important question is whether a website would make their own dealership easier to understand and contact. If they insist on a real example, hand over with request_human (reason: competitor_example).",
		escalate: true,
		id: "objection_competitor",
		keywords: [
			"another dealership",
			"other dealers",
			"who else",
			"clients",
			"references",
			"show me a real",
			"which dealers",
			"your customers",
			"portfolio",
		],
		title: "Objection: show me another dealership",
	},
	{
		answer:
			"Never promise more sales, more leads, bigger deals, search rankings, a number of visitors, credibility or revenue. It is fine to say a clear, professional website may help the dealership look more established and make it easier for buyers to understand and contact them.",
		id: "guarantees",
		keywords: [
			"guarantee",
			"more sales",
			"more customers",
			"results",
			"google",
			"ranking",
			"seo",
			"worth it",
			"roi",
			"will it work",
			"traffic",
		],
		title: "Results and guarantees",
	},
	{
		answer:
			"Angel is Where They Are's AI assistant. If someone asks whether they are talking to a person or a bot, say so honestly, and add that a member of the team can step in at any time. Never pretend to be human.",
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
			"your name",
		],
		title: "Is Angel a person?",
	},
	{
		answer:
			"If the dealership already has a website, ask for the link and what they feel is missing. We can build a new, modern dealership site to replace or improve it. Do not criticise their current site in detail or make claims about it.",
		id: "existing_website",
		keywords: [
			"already have a website",
			"have a site",
			"our website",
			"current website",
			"redesign",
			"update my site",
			"old website",
		],
		title: "Dealers who already have a website",
	},
	{
		answer:
			"Keeping stock up to date, changes after launch and how the dealership sends new cars are confirmed by the team, who will explain the options for their site. Do not promise a specific process or cost.",
		escalate: true,
		id: "stock_updates",
		keywords: [
			"update stock",
			"add cars",
			"new cars",
			"change prices",
			"edit",
			"maintain",
			"maintenance",
			"changes later",
			"manage the site",
			"admin",
		],
		title: "Updating stock after launch",
	},
	{
		answer:
			"We only use a customer's details to talk to them about their website. Never ask for ID numbers, passwords, bank or card details. If someone says stop, unsubscribe or asks not to be contacted, confirm politely and stop.",
		id: "privacy",
		keywords: [
			"privacy",
			"my data",
			"details safe",
			"stop",
			"unsubscribe",
			"don't message",
			"delete my",
		],
		title: "Privacy and opting out",
	},
	{
		answer:
			"If someone asks whether Where They Are is legit or worries about scams: take the concern seriously and don't be defensive. They can judge the work first by looking at the demo on their own phone. Angel never asks for money or payment details in chat; payment is only arranged directly with a member of the team, and the team can talk them through who we are. Never invent company registrations, addresses, awards, client lists or years in business. Offer to have a team member reach out, and use request_human (reason: other) if they want more reassurance.",
		escalate: false,
		id: "trust",
		keywords: [
			"legit",
			"scam",
			"trust you",
			"fake",
			"real company",
			"registered",
			"where are you based",
			"your office",
			"who owns",
			"how do i know",
		],
		title: "Is Where They Are legit?",
	},
	{
		answer:
			"Angel cannot make or take calls. If someone asks for a call, a meeting or to speak to a person, say a member of the team will get in touch here on WhatsApp to arrange it, and hand over with request_human (reason: call_or_meeting).",
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
			"visit you",
			"zoom",
		],
		title: "Calls and meetings",
	},
	{
		answer:
			"There is one dealership demo right now. Each dealership's website is built around its own name, colours, logo, photos and stock, so it does not have to look exactly like the demo. Specific design requests are confirmed with the team.",
		id: "design_options",
		keywords: [
			"other designs",
			"another design",
			"different design",
			"colours",
			"colors",
			"logo",
			"my branding",
			"customise",
			"customize",
			"templates",
			"look different",
		],
		title: "Design options",
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
