export type Level = "easy" | "medium" | "hard";

export interface RelevanceCase {
	expect: "respond" | "ignore";
	id: string;
	level: Level;
	/** One message, or several sent in quick succession. */
	messages: string[];
	why: string;
}

/**
 * First messages from brand-new contacts. Leads of any business type must get
 * a reply; spam, personal messages for the founder, wrong numbers and pitches
 * must be ignored. Hard cases mix personal tone with real leads and vice versa.
 */
export const relevanceCases: RelevanceCase[] = [
	// Easy
	{
		expect: "respond",
		id: "ad_reply",
		level: "easy",
		messages: ["Hi, I saw your ad about websites for car dealers"],
		why: "Direct reply to the ad",
	},
	{
		expect: "respond",
		id: "price",
		level: "easy",
		messages: ["How much is a website?"],
		why: "Price question",
	},
	{
		expect: "respond",
		id: "restaurant",
		level: "easy",
		messages: ["Do you make websites for restaurants?"],
		why: "Non-dealership lead",
	},
	{
		expect: "ignore",
		id: "lottery",
		level: "easy",
		messages: [
			"🎉 CONGRATULATIONS! You have won $5,000 in the WhatsApp Lottery. Send your full name and ID number to claim your prize.",
		],
		why: "Lottery scam",
	},
	{
		expect: "ignore",
		id: "forex",
		level: "easy",
		messages: [
			"Earn $300 daily trading forex with my mentor. Join now: t.me/fx-profits-zw",
		],
		why: "Forex scheme",
	},
	{
		expect: "ignore",
		id: "followers",
		level: "easy",
		messages: [
			"Hi, I'm a digital marketer. I can get your page 10,000 followers for just $20. Interested?",
		],
		why: "Vendor pitch",
	},

	// Medium
	{
		expect: "respond",
		id: "bare_hi",
		level: "medium",
		messages: ["Hi"],
		why: "Unclear first message could be a lead",
	},
	{
		expect: "respond",
		id: "info",
		level: "medium",
		messages: ["Info"],
		why: "Typical ad reply",
	},
	{
		expect: "respond",
		id: "shona_ad",
		level: "medium",
		messages: ["Mhoro, ndaona advert yenyu"],
		why: "Shona: saw your advert",
	},
	{
		expect: "respond",
		id: "cars_chitungwiza",
		level: "medium",
		messages: ["I sell cars in Chitungwiza, can you help me?"],
		why: "Dealer lead",
	},
	{
		expect: "respond",
		id: "hardware_shop",
		level: "medium",
		messages: [
			"Good evening. I run a small hardware shop in Gweru, is this only for car dealers?",
		],
		why: "Non-dealership lead",
	},
	{
		expect: "ignore",
		id: "mum",
		level: "medium",
		messages: ["Kin, it's Mum. Please call me when you get a chance"],
		why: "Personal message for the founder",
	},
	{
		expect: "ignore",
		id: "soccer",
		level: "medium",
		messages: ["Bro are we still on for soccer tonight?"],
		why: "Personal plans",
	},
	{
		expect: "ignore",
		id: "plumber",
		level: "medium",
		messages: [
			"Good morning, is this Tendai the plumber? My geyser is leaking",
		],
		why: "Wrong number",
	},
	{
		expect: "ignore",
		id: "chain_prayer",
		level: "medium",
		messages: [
			"Forwarded many times: Share this prayer with 10 friends and receive a blessing today 🙏🙏",
		],
		why: "Chain message",
	},
	{
		expect: "ignore",
		id: "job",
		level: "medium",
		messages: [
			"Hello, I am looking for a job as a web developer, do you have any vacancies?",
		],
		why: "Job seeker",
	},

	// Hard
	{
		expect: "respond",
		id: "church_referral",
		level: "hard",
		messages: [
			"Kin, it's Farai from church. My brother has a car yard in Mutare and wants a website, can you help him?",
		],
		why: "Personal tone, but a real referral",
	},
	{
		expect: "respond",
		id: "friend_restaurant",
		level: "hard",
		messages: [
			"Hey bro, long time! I've just opened a restaurant in Avondale and would love a website like the ones you guys do",
		],
		why: "Friend who is also a lead",
	},
	{
		expect: "respond",
		id: "prado_buyer",
		level: "hard",
		messages: ["Is the Prado on your website still available?"],
		why: "Came from the demo; Angel should explain it is a sample",
	},
	{
		expect: "respond",
		id: "test_drive",
		level: "hard",
		messages: [
			"Is the 2024 Land Cruiser Prado still available? Can I come for a test drive on Saturday?",
		],
		why: "Sounds like a wrong number, but it came from the demo",
	},
	{
		expect: "respond",
		id: "instalments",
		level: "hard",
		messages: ["Can I pay for the website in instalments?"],
		why: "Buying signal",
	},
	{
		expect: "respond",
		id: "voice_callback",
		level: "hard",
		messages: [
			"(Voice note) Hello, my name is Grace, I sell cars in Harare, please call me back",
		],
		why: "Transcribed voice note from a dealer",
	},
	{
		expect: "respond",
		id: "legit",
		level: "hard",
		messages: ["Are you legit? My friend said this is a scam"],
		why: "Sceptical lead",
	},
	{
		expect: "respond",
		id: "association",
		level: "hard",
		messages: [
			"Hello, I'm with a motor dealers association. We have 40 members who might need websites",
		],
		why: "Partnership that is really a lead",
	},
	{
		expect: "respond",
		id: "online_store",
		level: "hard",
		messages: ["Can you build me an online store to sell clothes?"],
		why: "Out-of-scope request, still a lead to hand over",
	},
	{
		expect: "respond",
		id: "batched_garage",
		level: "hard",
		messages: ["Hi", "I'm Tino", "I need a website for my garage"],
		why: "Batched messages form a lead",
	},
	{
		expect: "ignore",
		id: "loan",
		level: "hard",
		messages: ["Kin can you lend me $50 until month end, I'll pay you back"],
		why: "Personal favour",
	},
	{
		expect: "ignore",
		id: "wrong_number_sorry",
		level: "hard",
		messages: ["Sorry, wrong number"],
		why: "Wrong number",
	},
	{
		expect: "ignore",
		id: "romance",
		level: "hard",
		messages: ["Hi dear, I saw your profile and I want to be your friend 😘"],
		why: "Romance spam",
	},
	{
		expect: "ignore",
		id: "agency_pitch",
		level: "hard",
		messages: [
			"We offer SEO and Google Ads packages for web design agencies, starting from $99/month. Interested?",
		],
		why: "Vendor pitch aimed at us",
	},
	{
		expect: "ignore",
		id: "phishing",
		level: "hard",
		messages: [
			"Your EcoCash account has been suspended. Click https://ecocash-verify.co to restore it within 24 hours",
		],
		why: "Phishing",
	},
];
