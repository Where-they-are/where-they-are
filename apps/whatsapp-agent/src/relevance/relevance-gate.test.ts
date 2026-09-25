import type { JevAnswer } from "@where-they-are/jev-router";
import { describe, expect, it } from "vitest";

import {
	type DecisionClient,
	type RelevanceCategory,
	RelevanceGate,
} from "./relevance-gate.js";

const client = (
	category: RelevanceCategory,
	categoryProbability: number,
	shouldReply: number
): DecisionClient => ({
	decide: () =>
		Promise.resolve({
			answers: {
				category: {
					choice: category,
					probabilities: { [category]: categoryProbability },
					type: "choice",
				} as JevAnswer,
				should_reply: { noul: shouldReply, type: "noul" },
			},
		}),
});

const input = {
	contact: { displayName: null, firstContact: true, previouslyIgnoredAs: null },
	messages: ["Earn $500 a day with crypto"],
};

describe("RelevanceGate", () => {
	it("ignores confident spam", async () => {
		const decision = await new RelevanceGate(
			client("spam_or_scam", 0.95, 0.03)
		).decide(input);
		expect(decision).toMatchObject({
			category: "spam_or_scam",
			source: "jev",
			verdict: "ignore",
		});
	});

	it("ignores confident personal messages for the founder", async () => {
		const decision = await new RelevanceGate(
			client("personal_for_owner", 0.9, 0.1)
		).decide(input);
		expect(decision.verdict).toBe("ignore");
	});

	it("always answers leads of any business type", async () => {
		// Even if the reply probability came back low, a lead is never ignored.
		const decisions = await Promise.all(
			(
				[
					"dealership_lead",
					"other_business_lead",
					"question_or_greeting",
				] as const
			).map((category) =>
				new RelevanceGate(client(category, 0.99, 0.05)).decide(input)
			)
		);
		expect(decisions.map((decision) => decision.verdict)).toEqual([
			"respond",
			"respond",
			"respond",
		]);
	});

	it("answers when the category is uncertain", async () => {
		const decision = await new RelevanceGate(
			client("spam_or_scam", 0.5, 0.1)
		).decide(input);
		expect(decision.verdict).toBe("respond");
	});

	it("answers when Jev thinks a reply is likely needed", async () => {
		const decision = await new RelevanceGate(
			client("wrong_number", 0.9, 0.6)
		).decide(input);
		expect(decision.verdict).toBe("respond");
	});

	it("fails open when Jev errors or returns something unexpected", async () => {
		const failing: DecisionClient = {
			decide: () => Promise.reject(new Error("timeout")),
		};
		expect((await new RelevanceGate(failing).decide(input)).source).toBe(
			"fail_open"
		);
		const odd: DecisionClient = {
			decide: () =>
				Promise.resolve({ answers: { category: { score: 1, type: "score" } } }),
		};
		const decision = await new RelevanceGate(odd).decide(input);
		expect(decision).toMatchObject({ source: "fail_open", verdict: "respond" });
	});
});
