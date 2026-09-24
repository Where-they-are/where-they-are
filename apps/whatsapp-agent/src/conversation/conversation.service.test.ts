import type { Agent } from "@mastra/core/agent";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TURN_CONTEXT_KEY } from "../agent/angel.js";
import type { TurnContext } from "../agent/instructions.js";
import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import {
	ConversationService,
	isTransientModelError,
} from "./conversation.service.js";
import { FALLBACK_REPLY, OPT_OUT_REPLY } from "./intents.js";

const ID = "263771234567";
const pricing = () =>
	dealershipPricing(
		{
			earlyPriceUsd: 250,
			earlySlots: 5,
			earlySlotsUsedOffset: 0,
			standardPriceUsd: 400,
		},
		0
	);

let crm: CrmRepository;
const opened: CrmRepository[] = [];
afterEach(() => {
	for (const repo of opened.splice(0)) {
		repo.close();
	}
	vi.restoreAllMocks();
});

const setup = (
	generate: (...args: unknown[]) => Promise<{ text: string }>,
	maxRepliesPerHour = 30
) => {
	crm = new CrmRepository(":memory:");
	opened.push(crm);
	const notifier = new ConsoleOwnerNotifier();
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const spy = vi.fn(generate);
	const service = new ConversationService({
		agent: { generate: spy } as unknown as Agent,
		crm,
		demoUrl: "https://dealership-demo.wheretheyare.co.zw",
		maxRepliesPerHour,
		notifier,
		pricing,
	});
	const send = (text: string) =>
		service.handle({
			chatId: `${ID}@c.us`,
			customerId: ID,
			displayName: "Tatenda",
			messages: [{ text }],
		});
	return { notifier, send, spy };
};

describe("ConversationService", () => {
	it("replies through the agent and logs both sides", async () => {
		const { send } = setup(async () => ({
			text: "Hi! I'm Angel.\n\nMay I know your name?",
		}));
		const result = await send("Hi");
		expect(result).toEqual({
			outcome: "replied",
			replies: ["Hi! I'm Angel. May I know your name?"],
		});
		expect(crm.messages(ID).map((message) => message.direction)).toEqual([
			"in",
			"out",
		]);
	});

	it("passes first contact, pricing and the customer id to the agent", async () => {
		const { send, spy } = setup(async () => ({ text: "ok" }));
		await send("Hi");
		const options = spy.mock.calls[0]?.[1] as {
			memory: { resource: string; thread: string };
			requestContext: { get: (key: string) => unknown };
		};
		const turn = options.requestContext.get(TURN_CONTEXT_KEY) as TurnContext;
		expect(turn.isFirstContact).toBe(true);
		expect(turn.pricing.currentPriceUsd).toBe(250);
		expect(options.requestContext.get("customerId")).toBe(ID);
		expect(options.memory).toEqual({ resource: ID, thread: `whatsapp-${ID}` });
	});

	it("honours opt-out and stays silent until the customer opts back in", async () => {
		const { send, spy } = setup(async () => ({ text: "ok" }));
		expect(await send("STOP")).toEqual({
			outcome: "opted_out",
			replies: [OPT_OUT_REPLY],
		});
		expect(await send("hello?")).toEqual({
			outcome: "silent_opted_out",
			replies: [],
		});
		expect((await send("start")).outcome).toBe("opted_in");
		expect(spy).not.toHaveBeenCalled();
	});

	it("stays quiet while a person from the team has the chat", async () => {
		const { send, spy } = setup(async () => ({ text: "ok" }));
		await send("Hi");
		crm.setHumanTakeover(ID, new Date(Date.now() + 60_000), "owner");
		expect(await send("Are you there?")).toEqual({
			outcome: "human_active",
			replies: [],
		});
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("shows Angel what a team member said while they had the chat", async () => {
		const { send, spy } = setup(async () => ({ text: "ok" }));
		await send("Hi");
		crm.logMessage(
			ID,
			"owner",
			"Hi Tatenda, it's the founder. I'll send a quote tonight."
		);
		await send("Thanks!");
		const options = spy.mock.calls[1]?.[1] as {
			requestContext: { get: (key: string) => unknown };
		};
		const turn = options.requestContext.get(TURN_CONTEXT_KEY) as TurnContext;
		expect(turn.humanHandledTranscript).toContain("Team member: Hi Tatenda");
	});

	it("rate limits a chat once, alerts the owner, then goes silent", async () => {
		const { notifier, send } = setup(async () => ({ text: "ok" }), 2);
		await send("one");
		await send("two");
		expect((await send("three")).outcome).toBe("rate_limited");
		expect((await send("four")).replies).toEqual([]);
		expect(notifier.sent).toHaveLength(1);
	});

	it("retries once on a transient provider error", async () => {
		let calls = 0;
		const { send } = setup(() => {
			calls += 1;
			if (calls === 1) {
				return Promise.reject(
					new Error("Provider returned error: Corrupted thought signature")
				);
			}
			return Promise.resolve({ text: "Recovered" });
		});
		expect(await send("Hi")).toEqual({
			outcome: "replied",
			replies: ["Recovered"],
		});
		expect(calls).toBe(2);
	});

	it("sends a holding reply and alerts the owner when the agent fails", async () => {
		const { notifier, send } = setup(() =>
			Promise.reject(new Error("Invalid tool schema"))
		);
		expect(await send("Hi")).toEqual({
			outcome: "fallback",
			replies: [FALLBACK_REPLY],
		});
		expect(notifier.sent[0]).toContain("Angel hit an error");
		expect(crm.events(ID).some((event) => event.type === "agent_error")).toBe(
			true
		);
	});

	it("processes one customer's turns in order", async () => {
		const order: string[] = [];
		const { send } = setup(async (messages) => {
			const text =
				(messages as { content: { text: string }[] }[])[0]?.content[0]?.text ??
				"";
			await new Promise((resolve) =>
				setTimeout(resolve, text === "first" ? 30 : 0)
			);
			order.push(text);
			return { text };
		});
		await Promise.all([send("first"), send("second")]);
		expect(order).toEqual(["first", "second"]);
	});
});

describe("isTransientModelError", () => {
	it("separates upstream failures from bugs", () => {
		expect(isTransientModelError(new Error("Request timed out"))).toBe(true);
		expect(isTransientModelError(new Error("status 503"))).toBe(true);
		expect(isTransientModelError(new Error("Invalid tool schema"))).toBe(false);
	});
});
