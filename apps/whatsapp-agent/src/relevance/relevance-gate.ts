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
	"Where They Are builds websites for businesses in Zimbabwe. Its Facebook and Instagram ads currently target car dealerships, but it happily builds websites for any kind of business (restaurants, salons, shops, schools, clinics, churches, services and more). Angel is its WhatsApp sales assistant. Its demo is a sample dealership website (Ridgeline Motors) that lists cars such as a Land Cruiser Prado, so people sometimes message asking about those cars, prices or test drives: they came from our demo and need a reply explaining it's a sample. This WhatsApp number is also the founder's own number, so friends, family, acquaintances, spammers and wrong numbers sometimes message it.";

const QUESTIONS: Record<string, JevQuestion> = {
	category: {
		criteria: {
			dealership_lead:
				"Someone who sells, brokers or imports vehicles, or asks about a website for a car dealership or car yard.",
			other_business_lead:
				"Someone with any other business, organisation or project asking about a website or online presence (restaurant, salon, shop, church, school, clinic, services, and so on).",
			personal_for_owner:
				"A personal message meant for the founder as a friend, family member or acquaintance: family news, plans, favours, money between friends, personal calls, with no website or business enquiry.",
			question_or_greeting:
				"A greeting, a short reply, a question about Where They Are, its ad, prices, demo or work, a question about a car, its price or a test drive (these come from the sample dealership demo), or anything a potential customer could send, including an unclear first message such as 'Hi', 'Hello' or 'Info'.",
			spam_or_scam:
				"Unsolicited promotions, scams, crypto or forex schemes, loan offers, prize or lottery messages, chain letters, forwarded broadcasts, adult content or suspicious links.",
			vendor_or_job_pitch:
				"Someone selling their own services to Where They Are (marketing, SEO, ads, followers) or asking for a job, with no interest in buying a website.",
			wrong_number:
				"Someone who clearly meant to reach a different person or business, or asks for a service unrelated to websites while clearly addressing someone else.",
		},
		instructions:
			"Which one best describes the latest WhatsApp messages from this contact, given the business context?",
		type: "choice",
	},
	should_reply: {
		criteria: {
			false:
				"Spam, scams, chain or broadcast messages, promotions, personal messages meant for the founder, wrong numbers, or people pitching services or asking for jobs.",
			true: "Any possible customer of any business type, anyone asking about websites, the ad, the demo or prices, anyone asking about a car or a test drive (they came from the sample dealership demo), and any greeting or unclear message that could be from a potential customer.",
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
