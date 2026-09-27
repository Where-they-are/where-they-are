import type { JevAnswer, JevQuestion } from "@where-they-are/jev-router";

import { CLOSE_CATEGORIES, type CloseCategory } from "../crm/crm.types.js";
import type { DecisionClient } from "./relevance-gate.js";

export const TURN_CATEGORIES = ["needs_reply", ...CLOSE_CATEGORIES] as const;
export type TurnCategory = (typeof TURN_CATEGORIES)[number];

/** Angel goes silent only when Jev is at least this sure of a close category. */
export const MIN_SILENCE_CONFIDENCE = 0.75;
/** ...and the chance that a reply is needed is at most this. */
export const MAX_REPLY_PROBABILITY_TO_SILENCE = 0.3;

export interface ConversationGateInput {
	/** Angel's last message in the chat, if any. */
	lastAngelMessage: string | null;
	/** The customer's latest messages, oldest first. */
	messages: string[];
}

export interface ConversationGateDecision {
	category: TurnCategory;
	confidence: number;
	replyProbability: number;
	source: "jev" | "fail_open";
	verdict: "respond" | "silent";
}

const CONTEXT =
	"Where They Are is a social media agency for car dealerships in Zimbabwe. Angel, its WhatsApp sales assistant, is already talking to this person. Angel should not pester people: it stays silent when someone firmly declines, firmly says they will get back to us, has ended the conversation, or sends a meaningless message. It always replies to questions, answers to its own questions, objections and interest.";

const QUESTIONS: Record<string, JevQuestion> = {
	category: {
		criteria: {
			conversation_over:
				"A closing message such as 'ok thanks', 'noted', 'cool', 'great' or a thumbs-up, when Angel's last message did not ask a question and nothing is left to answer.",
			low_quality:
				"Meaningless, random or garbled text, stray emoji or stickers with no request, forwarded chain or broadcast messages, or spam.",
			needs_reply:
				"The person asked a question, answered Angel's last question (even with just 'ok', 'yes', 'sure', a number or a name), gave new information, raised an objection or doubt that deserves an answer, showed interest, or wants to start. Also a soft, open 'hmm, let me think' that invites a reply.",
			not_interested:
				"The person firmly declines: not interested, doesn't need it, already has someone, or asks not to be messaged or sold to again.",
			will_get_back:
				"The person firmly says they will think about it, decide later, or contact us themselves when ready, and asks nothing.",
		},
		instructions:
			"Which best describes the person's latest messages, given Angel's last message?",
		type: "choice",
	},
	should_reply: {
		criteria: {
			false:
				"A firm no, a firm 'I'll get back to you', a closing message after everything is answered, or a meaningless message.",
			true: "A question, an answer to Angel's question, new information, an objection, interest, or anything a good salesperson would respond to.",
		},
		instructions:
			"Should Angel reply? When in doubt, reply: ignoring a real question is worse than one extra message.",
		type: "noul",
	},
};

const FAIL_OPEN: ConversationGateDecision = {
	category: "needs_reply",
	confidence: 0,
	replyProbability: 1,
	source: "fail_open",
	verdict: "respond",
};

const isTurnCategory = (value: unknown): value is TurnCategory =>
	(TURN_CATEGORIES as readonly unknown[]).includes(value);

const isCloseCategory = (value: TurnCategory): value is CloseCategory =>
	(CLOSE_CATEGORIES as readonly string[]).includes(value);

const QUESTION_MARK = /\?/;

/**
 * Decides with Jev whether Angel should answer a turn in an ongoing
 * conversation. Only a confident firm no, firm "I'll get back to you",
 * finished conversation or meaningless message is left unanswered; errors
 * always fail open.
 */
export class ConversationGate {
	private readonly client: DecisionClient;

	constructor(client: DecisionClient) {
		this.client = client;
	}

	async decide(
		input: ConversationGateInput
	): Promise<ConversationGateDecision> {
		let answers: Record<string, JevAnswer>;
		try {
			({ answers } = await this.client.decide(
				{
					angelLastMessage: input.lastAngelMessage?.slice(0, 800) ?? null,
					angelLastMessageAskedAQuestion: QUESTION_MARK.test(
						input.lastAngelMessage ?? ""
					),
					business: CONTEXT,
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
		const category = isTurnCategory(categoryAnswer.choice)
			? categoryAnswer.choice
			: "needs_reply";
		const probabilities = categoryAnswer.probabilities as
			| Record<string, number>
			| undefined;
		const confidence = probabilities?.[category] ?? 1;
		const replyProbability = replyAnswer.noul;
		const silent =
			isCloseCategory(category) &&
			confidence >= MIN_SILENCE_CONFIDENCE &&
			replyProbability <= MAX_REPLY_PROBABILITY_TO_SILENCE;
		return {
			category,
			confidence,
			replyProbability,
			source: "jev",
			verdict: silent ? "silent" : "respond",
		};
	}
}
