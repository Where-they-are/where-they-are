import type { Agent } from "@mastra/core/agent";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { socialMediaOffer } from "../knowledge/offer.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import type { RelevanceGate } from "../relevance/relevance-gate.js";
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

const setup = () => {
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const generate = vi.fn(() =>
		Promise.resolve({ text: "Hi, thanks for your answers, I'm Angel." })
	);
	const decide = vi.fn(() =>
		Promise.resolve({
			category: "dealership_lead",
			confidence: 0.9,
			replyProbability: 0.9,
			source: "jev",
			verdict: "respond",
		})
	);
	const service = new ConversationService({
		agent: { generate } as unknown as Agent,
		crm,
		examplesUrl: "",
		maxRepliesPerHour: 30,
		notifier: new ConsoleOwnerNotifier(),
		offer: () =>
			socialMediaOffer({ launchPlaces: 5, launchPlacesUsedOffset: 0 }, 0),
		relevance: { decide } as unknown as RelevanceGate,
	});
	const send = (...messages: IncomingMessage[]) =>
		service.handle({
			chatId: `${ID}@c.us`,
			customerId: ID,
			displayName: "Hustler",
			messages,
		});
	return { crm, decide, generate, send };
};

const FORM: IncomingMessage = {
	fromForm: true,
	text: "(Ad form answers)\nBusiness name: Tino Motors\nCity: Mutare",
};

describe("ad form screening", () => {
	it("says nothing at all to someone who didn't fill in the form", async () => {
		const { crm, decide, generate, send } = setup();
		for (const text of ["Can I get more info on this?", "Hello", "?"]) {
			// biome-ignore lint/performance/noAwaitInLoops: turns run in order
			expect(await send({ text })).toEqual({ outcome: "ignored", replies: [] });
		}
		expect(generate).not.toHaveBeenCalled();
		expect(decide).not.toHaveBeenCalled();
		expect(crm.get(ID)).toBeUndefined();
		expect(crm.getIgnored(ID)).toMatchObject({ category: "no_form", count: 3 });
		expect(crm.ignoredMessages(ID).map((message) => message.body)).toEqual([
			"Can I get more info on this?",
			"Hello",
			"?",
		]);
		expect(crm.turns({ contactId: ID })[0]).toMatchObject({
			gate: { category: "no_form", source: "screening" },
			outcome: "ignored",
		});
	});

	it("replies once they submit the form, and keeps replying after", async () => {
		const { crm, generate, send } = setup();
		await send({ text: "Can I get more info on this?" });
		const result = await send(FORM);
		expect(result.outcome).toBe("replied");
		expect(crm.screenedBy(ID)).toBe("form");
		expect(crm.getIgnored(ID)).toBeUndefined();
		expect((await send({ text: "We post when stock comes in" })).outcome).toBe(
			"replied"
		);
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("replies to contacts the team started a chat with or allowed", async () => {
		const team = setup();
		team.crm.markScreened(ID, "team");
		expect((await team.send({ text: "Hi" })).outcome).toBe("replied");
		const allowed = setup();
		await allowed.send({ text: "Hi" });
		allowed.crm.allowContact(ID);
		expect((await allowed.send({ text: "Hi again" })).outcome).toBe("replied");
	});
});
