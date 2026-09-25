import { OFFER_TERMS } from "./pricing.js";

/**
 * Angel's knowledge base, drawn from docs/sales-script.md and the owner's
 * decisions. Prices and terms come from get_offer; anything not written here
 * or there is unknown to Angel and goes to a human rather than being guessed.
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

const { deliveryDays, fixHours, maxSections, revisionRounds } = OFFER_TERMS;

export const buildKnowledge = (demoUrl: string): KnowledgeEntry[] => [
	{
		answer:
			"Where They Are is a Zimbabwean team that builds modern websites for car dealerships: sites that show the dealership's stock, location and contact details clearly, especially on phones. We also build websites for other kinds of businesses.",
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
		answer: `The demo is a sample dealership website called Ridgeline Motors: ${demoUrl} . Ridgeline Motors is made up; its business, cars, prices and reviews are sample content showing the kind of site we build. Share the link once. Do not offer a free preview or mock-up of the lead's own site.`,
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
			"preview",
			"mock up",
		],
		title: "The dealership demo",
	},
	{
		answer: `The standard package: one mobile-friendly dealership website with up to ${maxSections} pages or sections; all the dealership's existing stock imported (the team confirms first for unusual volumes, like hundreds of cars, or messy spreadsheets); vehicle listings with photos, price, year, mileage, fuel, gearbox and description, where the dealer supplies them; the dealership's identity, location, opening hours and WhatsApp, call and enquiry buttons; one design direction and ${revisionRounds} consolidated round of changes; a free domain; free fixes within ${fixHours} hours. Anything else is custom work the team quotes separately: more pages, ongoing stock updates by us, online payments, customer logins, live finance approval, booking systems, integrations, multiple branches or languages, extra design rounds, or content we write or photograph.`,
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
			"booking",
			"mobile",
		],
		title: "What a dealership website includes",
	},
	{
		answer: `How it works: they pay the deposit here on WhatsApp through Paynow (EcoCash or OneMoney), then send their logo, dealership details, stock photos and details, and the domain name they want. The site is ready within ${deliveryDays} days of us receiving the deposit and everything we need. They review it, the balance is paid after delivery, and the site stays live on our hosting.`,
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
			"Prices are fixed. Always call get_offer and quote it. Never offer discounts, other instalment plans, free trials or custom deals. If someone insists on a discount, stay friendly, explain the deposit and balance split once, and hand over with request_human (reason: discount_request).",
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
		],
		title: "Pricing rules",
	},
	{
		answer:
			"Objection 'it's too expensive': ask whether it's the total or paying it all at once. They pay only the deposit to start and the balance after the site is delivered (amounts from get_offer). The domain, the stock import and the first month of hosting are free. If they still can't afford it, say you don't want it to strain the business, ask whether you can check back when the timing is better, and mark them nurture. Never discount.",
		id: "objection_price",
		keywords: [
			"expensive",
			"too much",
			"afford",
			"budget",
			"no money",
			"cheaper",
			"can't pay",
		],
		title: "Objection: too expensive",
	},
	{
		answer:
			"Hosting is free for the first month, then $15/month. We register the domain (for example yourdealership.co.zw) and keep it renewed free for as long as hosting is paid. Hosting billing after the first month is arranged by the team.",
		id: "hosting_domain",
		keywords: [
			"hosting",
			"domain",
			".co.zw",
			"monthly",
			"per month",
			"renewal",
			"subscription",
			"annual",
			"anything else to pay",
			"running costs",
		],
		title: "Hosting, domains and monthly costs",
	},
	{
		answer: `The site is ready within ${deliveryDays} days of us receiving the deposit and everything we need (logo, dealership details, stock photos and details, domain name). If we miss that for a reason within our control, they don't pay the balance (the deposit is not refunded). Mention the balance waiver only when they ask about delivery risk or guarantees.`,
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
			"Payments are taken here in WhatsApp through Paynow: Angel sends a payment prompt (request_payment) to the customer's EcoCash or OneMoney number, and they approve it on their phone with their PIN. The deposit starts the build; the balance is paid after delivery. Never ask for a PIN, card or bank details, and never give out bank or wallet numbers to send money to. Only say a payment went through when check_payment says it's paid.",
		id: "payment",
		keywords: [
			"pay",
			"payment",
			"deposit",
			"ecocash",
			"onemoney",
			"bank",
			"transfer",
			"account",
			"invoice",
			"receipt",
			"proof of payment",
			"paid",
			"paynow",
		],
		title: "Payments",
	},
	{
		answer:
			"We absolutely build websites for businesses that are not dealerships too, for example restaurants, salons, clinics, schools, professional services, shops and local services. The team quotes those sites separately. Collect the business name, what it does, where it is and what the site should do, then hand over with request_human (reason: non_dealership_lead). Never quote the dealership price or take a payment from them.",
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
			"We don't sell cars. Ridgeline Motors in the demo is a made-up sample dealership, so its cars aren't for sale. Say so kindly and ask whether they're a dealer themselves; if they are, carry on qualifying them.",
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
			"Objection 'we're too small': they don't need a big site. It's about one clear place where buyers can see what they sell, where they are and how to reach them. A clear website may help the dealership look more established, but we can't promise leads, sales or bigger deals.",
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
			"Objection 'we already use Facebook': Facebook is great for reaching people, so keep it. The website gives buyers one place to browse all their stock and contact them, and they can share the link on their Facebook posts too.",
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
		title: "Objection: we already use Facebook",
	},
	{
		answer:
			"Objection 'I need to think about it': of course. Ask whether it's the price, what's included, or the timing they'd like to think through, and answer that. If they want information first, send the demo link and the offer headline and ask when would be a good time to check back.",
		id: "objection_think",
		keywords: [
			"think about it",
			"let me think",
			"get back to you",
			"later",
			"not now",
			"send information",
			"send me info",
			"send details",
			"brochure",
		],
		title: "Objection: I need to think / send me information",
	},
	{
		answer:
			"Objection 'show me another dealership that has one': never name, invent or describe a competitor, client or another business. The demo is the example of what we build. If they insist on a real reference, hand over with request_human (reason: competitor_example).",
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
		],
		title: "Objection: show me another dealership",
	},
	{
		answer: `We can't honestly promise more sales, enquiries, bigger deals, rankings or revenue: that depends on their cars, prices and how fast they reply. What we do guarantee: the site within ${deliveryDays} days of getting their deposit and details, or they don't pay the balance; and free fixes within ${fixHours} hours of any agreed technical issue being reported.`,
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
			"refund",
		],
		title: "Results and guarantees",
	},
	{
		answer:
			"Angel is Where They Are's AI assistant. If someone asks whether they're talking to a person or a bot, say so honestly, and add that a member of the team can step in at any time. Never pretend to be human.",
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
			"If the dealership already has a website, ask for the link and what they feel is missing. We can build a new, modern dealership site to replace it. Don't criticise their current site.",
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
		answer: `Their current stock is imported free when the site is built. Ongoing stock updates by our team after launch are custom work the team quotes; technical fixes are free within ${fixHours} hours. For how updates would work for them, hand over to the team.`,
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
			"We only use a customer's details to talk to them about their website. Never ask for ID numbers, PINs, passwords, bank or card details. If someone says stop or asks not to be contacted, confirm politely and stop.",
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
			"If someone asks whether we're legit: fair question, don't be defensive. They pay only the deposit to start; the balance is due after they've seen their finished site, and if we're late they don't pay it. Payments go through Paynow, never to a personal account. Never invent registrations, addresses, awards, clients or years in business; if they want more reassurance, hand over with request_human (reason: other).",
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
			"Angel can't make or take calls. If someone asks for a call, a meeting or to speak to a person, say a member of the team will get in touch here on WhatsApp to arrange it, and hand over with request_human (reason: call_or_meeting).",
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
			"There is one dealership demo. Each dealership's website is built around its own name, colours, logo, photos and stock, with one design direction and one round of changes. Specific design requests are confirmed with the team.",
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
