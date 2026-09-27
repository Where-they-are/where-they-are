import type { Agent } from "@mastra/core/agent";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { socialMediaOffer } from "../knowledge/offer.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import type {
	ConversationGate,
	ConversationGateDecision,
	TurnCategory,
} from "../relevance/conversation-gate.js";
import {
	ConversationService,
	type IncomingMessage,
} from "./conversation.service.js";

const ID = "263771234567";
const opened: CrmRepository[] = [];
afterEach(() => {
	for (const repo of opened.splice(0)) {
		repo.close();
	}
	vi.restoreAllMocks();
});

const decision = (category: TurnCategory): ConversationGateDecision => ({
	category,
	confidence: 0.95,
	replyProbability: category === "needs_reply" ? 0.95 : 0.05,
	source: "jev",
	verdict: category === "needs_reply" ? "respond" : "silent",
});

const setup = (categories: TurnCategory[]) => {
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const notifier = new ConsoleOwnerNotifier();
	const queue = [...categories];
	const decide = vi.fn(() =>
		Promise.resolve(decision(queue.shift() ?? "needs_reply"))
	);
	const generate = vi.fn(() =>
		Promise.resolve({ text: "Would you like to get started with that plan?" })
	);
	const service = new ConversationService({
		agent: { generate } as unknown as Agent,
		conversationGate: { decide } as unknown as ConversationGate,
		crm,
		examplesUrl: "",
		maxRepliesPerHour: 30,
		notifier,
		offer: () =>
			socialMediaOffer({ launchPlaces: 5, launchPlacesUsedOffset: 0 }, 0),
	});
	const send = (messages: IncomingMessage[] | string) =>
		service.handle({
			chatId: `${ID}@c.us`,
			customerId: ID,
			displayName: "Tino",
			messages: typeof messages === "string" ? [{ text: messages }] : messages,
		});
	return { crm, decide, generate, notifier, send };
};

describe("conversation gate", () => {
	it("never gates the first message", async () => {
		const { decide, send } = setup(["not_interested"]);
		expect((await send("Hi")).outcome).toBe("replied");
		expect(decide).not.toHaveBeenCalled();
	});

	it("stays silent on a firm no, closes the lead and alerts the owner if it was qualified", async () => {
		const { crm, decide, generate, notifier, send } = setup(["not_interested"]);
		await send("Hi, I'm Tino from Tino Motors");
		crm.setLeadSignals(ID, { clearNeed: true }, 6);
		const result = await send("No thanks, not interested. Don't message me");
		expect(result).toEqual({ outcome: "ignored", replies: [] });
		expect(generate).toHaveBeenCalledTimes(1);
		expect(decide.mock.calls[0]).toMatchObject([
			{ lastAngelMessage: "Would you like to get started with that plan?" },
		]);
		expect(crm.get(ID)?.stage).toBe("lost");
		expect(crm.events(ID).map((event) => event.type)).toContain("ignored");
		expect(notifier.sent.at(-1)).toContain("said they're not interested");
		expect(crm.turns({ contactId: ID })[0]).toMatchObject({
			gate: { category: "not_interested" },
			outcome: "ignored",
		});
	});

	it("waits after a firm 'I'll get back to you' without alerting for a weak lead", async () => {
		const { crm, notifier, send } = setup(["will_get_back"]);
		await send("Hi");
		const alertsBefore = notifier.sent.length;
		expect(
			(await send("I'll think about it and get back to you")).outcome
		).toBe("ignored");
		expect(crm.get(ID)?.stage).toBe("nurture");
		expect(notifier.sent.length).toBe(alertsBefore);
	});

	it("still replies when the gate says a reply is needed", async () => {
		const { send } = setup(["needs_reply"]);
		await send("Hi");
		expect((await send("ok")).outcome).toBe("replied");
	});

	it("always answers photos and documents without asking the gate", async () => {
		const { decide, send } = setup(["low_quality"]);
		await send("Hi");
		await send([
			{
				media: { base64: "AAAA", mimeType: "image/jpeg" },
				mediaKind: "image",
				text: "",
			},
		]);
		expect(decide).not.toHaveBeenCalled();
	});
});
