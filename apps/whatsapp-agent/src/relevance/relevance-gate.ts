import type { JevAnswer, JevQuestion } from "@where-they-are/jev-router";

import { IGNORE_CATEGORIES, type IgnoreCategory } from "../crm/crm.types.js";

export const RELEVANCE_CATEGORIES = [
	"dealership_lead",
	"other_business_lead",
	"question_or_greeting",
	...IGNORE_CATEGORIES,
] as const;
export type RelevanceCategory = (typeof RELEVANCE_CATEGORIES)[number];

/** Minimum probability of an ignorable category before Angel stays silent. */
export const MIN_IGNORE_CONFIDENCE = 0.7;
/** Angel stays silent only if the chance it should reply is at most this. */
export const MAX_REPLY_PROBABILITY_TO_IGNORE = 0.3;

export interface RelevanceInput {
	contact: {
		displayName: string | null;
		firstContact: boolean;
		previouslyIgnoredAs: IgnoreCategory | null;
	};
	messages: string[];
}

export interface RelevanceDecision {
	category: RelevanceCategory;
	confidence: number;
	replyProbability: number;
	source: "jev" | "fail_open";
	verdict: "respond" | "ignore";
}

/** The part of JevClient the gate needs, so tests can supply a fake. */
export interface DecisionClient {
	decide: (
		state: unknown,
		questions: Record<string, JevQuestion>
	) => Promise<{ answers: Record<string, JevAnswer> }>;
}

const BUSINESS_CONTEXT =
	"Where They Are is a Zimbabwean social media agency for car dealerships: it creates and publishes Facebook and Instagram posts for dealership pages. Its ads target car dealership owners in Mutare and Harare and show example vehicle posts, so people sometimes message asking about a car, its price or a test drive: they came from our ads and need a polite reply. Other businesses (restaurants, lodges, shops and so on) are future clients and also get a reply. Angel is its WhatsApp sales assistant. This WhatsApp number is also the founder's own number, so friends, family, acquaintances, spammers and wrong numbers sometimes message it.";

const QUESTIONS: Record<string, JevQuestion> = {
	category: {
		criteria: {
			dealership_lead:
				"Someone who sells, imports or trades vehicles, or asks about social media posts, marketing, followers or enquiries for a car dealership or car yard, or about our plans for dealerships.",
			other_business_lead:
				"Someone with any other business, organisation or project asking about social media, marketing, posts, a website or online presence (restaurant, lodge, salon, shop, church, school, clinic, services, and so on).",
			personal_for_owner:
				"A personal message meant for the founder as a friend, family member or acquaintance: family news, plans, favours, money between friends, personal calls, with no business enquiry.",
			question_or_greeting:
				"A greeting, a short reply, a question about Where They Are, its ads, plans, prices or work, a question about a car, its price or a test drive (these come from our ads), or anything a potential customer could send, including an unclear first message such as 'Hi', 'Hello' or 'Info'.",
			spam_or_scam:
				"Unsolicited promotions, scams, crypto or forex schemes, loan offers, prize or lottery messages, chain letters, forwarded broadcasts, adult content or suspicious links.",
			vendor_or_job_pitch:
				"Someone selling their own services TO Where They Are (their own marketing agency, SEO, followers packages, ads services, software) or asking for a job, with no interest in buying our service. A dealer asking us for more followers or marketing is a lead, not a pitch.",
			wrong_number:
				"Someone who clearly meant to reach a different person or business, or asks for a service unrelated to social media or marketing while clearly addressing someone else.",
		},
		instructions:
			"Which one best describes the latest WhatsApp messages from this contact, given the business context?",
		type: "choice",
	},
	should_reply: {
		criteria: {
			false:
				"Spam, scams, chain or broadcast messages, promotions, personal messages meant for the founder, wrong numbers, or people pitching services or asking for jobs.",
			true: "Any possible customer of any business type, anyone asking about social media, marketing, our ads, plans or prices, anyone asking about a car or a test drive (they came from our ads), and any greeting or unclear message that could be from a potential customer.",
		},
		instructions:
			"Should Angel, the sales assistant, reply to these messages? When in doubt, reply: missing a real customer is much worse than answering spam.",
		type: "noul",
	},
};

const isIgnorable = (category: RelevanceCategory): category is IgnoreCategory =>
	(IGNORE_CATEGORIES as readonly string[]).includes(category);

const isCategory = (value: string): value is RelevanceCategory =>
	(RELEVANCE_CATEGORIES as readonly string[]).includes(value);

const FAIL_OPEN: RelevanceDecision = {
	category: "question_or_greeting",
	confidence: 0,
	replyProbability: 1,
	source: "fail_open",
	verdict: "respond",
};

/**
 * Decides with Jev (a fast typed decision model) whether a new or previously
 * ignored contact should get a reply. Only confident spam, personal messages,
 * wrong numbers and vendor pitches are ignored; errors always fail open.
 */
export class RelevanceGate {
	private readonly client: DecisionClient;

	constructor(client: DecisionClient) {
		this.client = client;
	}

	async decide(input: RelevanceInput): Promise<RelevanceDecision> {
		let answers: Record<string, JevAnswer>;
		try {
			({ answers } = await this.client.decide(
				{
					business: BUSINESS_CONTEXT,
					contact: input.contact,
					latestMessages: input.messages.map((text) => text.slice(0, 1500)),
				},
				QUESTIONS
			));
		} catch {
			return FAIL_OPEN;
		}
		const categoryAnswer = answers.category as JevAnswer | undefined;
		const replyAnswer = answers.should_reply as JevAnswer | undefined;
		if (categoryAnswer?.type !== "choice" || replyAnswer?.type !== "noul") {
			return FAIL_OPEN;
		}
		const category = isCategory(categoryAnswer.choice)
			? categoryAnswer.choice
			: "question_or_greeting";
		const probabilities = categoryAnswer.probabilities as
			| Record<string, number>
			| undefined;
		const confidence = probabilities?.[category] ?? 1;
		const replyProbability = replyAnswer.noul;
		const ignore =
			isIgnorable(category) &&
			confidence >= MIN_IGNORE_CONFIDENCE &&
			replyProbability <= MAX_REPLY_PROBABILITY_TO_IGNORE;
		return {
			category,
			confidence,
			replyProbability,
			source: "jev",
			verdict: ignore ? "ignore" : "respond",
		};
	}
}
