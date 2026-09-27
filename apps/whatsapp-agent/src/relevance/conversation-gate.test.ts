import type { JevAnswer } from "@where-they-are/jev-router";
import { describe, expect, it, vi } from "vitest";

import { ConversationGate, type TurnCategory } from "./conversation-gate.js";
import type { DecisionClient } from "./relevance-gate.js";

const client = (
	category: TurnCategory,
	categoryProbability: number,
	shouldReply: number
): DecisionClient => ({
	decide: vi.fn(() =>
		Promise.resolve({
			answers: {
				category: {
					choice: category,
					probabilities: { [category]: categoryProbability },
					type: "choice",
				} as JevAnswer,
				should_reply: { noul: shouldReply, type: "noul" } as JevAnswer,
			},
		})
	),
});

const input = {
	lastAngelMessage: "Would you like to get started with that plan?",
	messages: ["No thanks, not interested"],
};

describe("ConversationGate", () => {
	it("goes silent on a confident firm no", async () => {
		const decision = await new ConversationGate(
			client("not_interested", 0.92, 0.08)
		).decide(input);
		expect(decision).toMatchObject({
			category: "not_interested",
			source: "jev",
			verdict: "silent",
		});
	});

	it("goes silent on a firm 'I'll get back to you' and on noise", async () => {
		const decisions = await Promise.all([
			new ConversationGate(client("will_get_back", 0.85, 0.2)).decide(input),
			new ConversationGate(client("low_quality", 0.9, 0.05)).decide(input),
			new ConversationGate(client("conversation_over", 0.8, 0.1)).decide(input),
		]);
		expect(decisions.map((decision) => decision.verdict)).toEqual([
			"silent",
			"silent",
			"silent",
		]);
	});

	it("replies when a reply is needed or Jev is unsure", async () => {
		const decisions = await Promise.all([
			new ConversationGate(client("needs_reply", 0.99, 0.02)).decide(input),
			new ConversationGate(client("not_interested", 0.6, 0.1)).decide(input),
			new ConversationGate(client("will_get_back", 0.9, 0.5)).decide(input),
		]);
		expect(decisions.map((decision) => decision.verdict)).toEqual([
			"respond",
			"respond",
			"respond",
		]);
	});

	it("tells Jev whether Angel's last message asked a question", async () => {
		const jev = client("needs_reply", 0.9, 0.9);
		await new ConversationGate(jev).decide(input);
		const [state] = (jev.decide as ReturnType<typeof vi.fn>).mock.calls[0] as [
			Record<string, unknown>,
		];
		expect(state).toMatchObject({
			angelLastMessageAskedAQuestion: true,
			latestMessages: ["No thanks, not interested"],
		});
	});

	it("fails open when Jev errors or answers oddly", async () => {
		const failing: DecisionClient = {
			decide: () => Promise.reject(new Error("timeout")),
		};
		expect(await new ConversationGate(failing).decide(input)).toMatchObject({
			source: "fail_open",
			verdict: "respond",
		});
		const odd: DecisionClient = {
			decide: () =>
				Promise.resolve({ answers: { category: { score: 1, type: "score" } } }),
		};
		expect((await new ConversationGate(odd).decide(input)).verdict).toBe(
			"respond"
		);
	});
});
