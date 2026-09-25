import type { Agent } from "@mastra/core/agent";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IGNORED_KEY } from "../agent/tools.js";
import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import type { Transcriber } from "../media/transcriber.js";
import { ConsoleOwnerNotifier } from "../notifications/owner-notifier.js";
import type {
	RelevanceDecision,
	RelevanceGate,
} from "../relevance/relevance-gate.js";
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

const decision = (verdict: "respond" | "ignore"): RelevanceDecision => ({
	category: verdict === "ignore" ? "spam_or_scam" : "question_or_greeting",
	confidence: 0.95,
	replyProbability: verdict === "ignore" ? 0.02 : 0.98,
	source: "jev",
	verdict,
});

const setup = (options: {
	generate?: (...args: unknown[]) => Promise<{ text: string }>;
	transcriber?: Transcriber;
	verdicts?: ("respond" | "ignore")[];
}) => {
	const crm = new CrmRepository(":memory:");
	opened.push(crm);
	vi.spyOn(console, "info").mockImplementation(() => undefined);
	const verdicts = [...(options.verdicts ?? ["respond"])];
	const decide = vi.fn(() =>
		Promise.resolve(decision(verdicts.shift() ?? "respond"))
	);
	const generate = vi.fn(
		options.generate ?? (() => Promise.resolve({ text: "Hi! I'm Angel." }))
	);
	const service = new ConversationService({
		agent: { generate } as unknown as Agent,
		crm,
		demoUrl: "https://dealership-demo.wheretheyare.co.zw",
		maxRepliesPerHour: 30,
		notifier: new ConsoleOwnerNotifier(),
		pricing: () =>
			dealershipPricing(
				{
					earlyPriceUsd: 250,
					earlySlots: 5,
					earlySlotsUsedOffset: 0,
					standardPriceUsd: 400,
				},
				0
			),
		relevance: { decide } as unknown as RelevanceGate,
		...(options.transcriber ? { transcriber: options.transcriber } : {}),
	});
	const send = (messages: IncomingMessage[] | string) =>
		service.handle({
			chatId: `${ID}@c.us`,
			customerId: ID,
			displayName: "Someone",
			messages: typeof messages === "string" ? [{ text: messages }] : messages,
		});
	return { crm, decide, generate, send };
};

describe("relevance gate in conversations", () => {
	it("stays silent for ignored contacts and keeps them out of the leads", async () => {
		const { crm, generate, send } = setup({ verdicts: ["ignore"] });
		expect(await send("Win a free iPhone, click here")).toEqual({
			outcome: "ignored",
			replies: [],
		});
		expect(generate).not.toHaveBeenCalled();
		expect(crm.get(ID)).toBeUndefined();
		expect(crm.getIgnored(ID)).toMatchObject({
			category: "spam_or_scam",
			count: 1,
			lastMessage: "Win a free iPhone, click here",
		});
	});

	it("re-checks a previously ignored contact and forgets the ignore once they are a lead", async () => {
		const { crm, decide, send } = setup({ verdicts: ["ignore", "respond"] });
		await send("forwarded chain message");
		expect((await send("Actually I need a website for my salon")).outcome).toBe(
			"replied"
		);
		expect(decide).toHaveBeenCalledTimes(2);
		expect(crm.getIgnored(ID)).toBeUndefined();
		expect(crm.get(ID)).toBeDefined();
	});

	it("never gates a customer Angel is already talking to", async () => {
		const { decide, send } = setup({ verdicts: ["respond", "ignore"] });
		await send("Hi, I saw your ad");
		expect((await send("ok")).outcome).toBe("replied");
		expect(decide).toHaveBeenCalledTimes(1);
	});

	it("skips the gate for contacts the owner allowed", async () => {
		const { crm, decide, send } = setup({ verdicts: ["ignore"] });
		await send("hey");
		crm.allowContact(ID);
		expect((await send("hey, it's me again")).outcome).toBe("replied");
		expect(decide).toHaveBeenCalledTimes(1);
	});

	it("lets Angel choose to ignore a turn with its tool", async () => {
		const { crm, send } = setup({
			generate: (_messages, options) => {
				(
					options as {
						requestContext: { set: (k: string, v: unknown) => void };
					}
				).requestContext.set(IGNORED_KEY, "personal_for_owner");
				return Promise.resolve({ text: "" });
			},
		});
		expect(await send("Kin, it's mum. Call me")).toEqual({
			outcome: "ignored",
			replies: [],
		});
		expect(crm.events(ID).map((event) => event.type)).toContain("ignored");
	});
});

describe("voice note transcription", () => {
	it("replaces a voice note with its transcript before anything else sees it", async () => {
		const transcriber: Transcriber = {
			transcribe: () => Promise.resolve("Hi, I'm Tino from Tino Motors"),
		};
		const { crm, decide, generate, send } = setup({ transcriber });
		await send([
			{
				media: { base64: "AAAA", mimeType: "audio/ogg" },
				mediaKind: "audio",
				text: "",
			},
		]);
		const gateInput = decide.mock.calls[0] as unknown as [
			{ messages: string[] },
		];
		expect(gateInput[0].messages[0]).toContain("Tino Motors");
		const [messages] = generate.mock.calls[0] as unknown as [
			{ content: { text?: string; type: string }[] }[],
		];
		expect(messages[0]?.content.every((part) => part.type === "text")).toBe(
			true
		);
		expect(crm.messages(ID)[0]?.body).toBe(
			"[audio] (Voice note) Hi, I'm Tino from Tino Motors"
		);
	});

	it("falls back to the raw audio when transcription fails", async () => {
		const transcriber: Transcriber = {
			transcribe: () => Promise.resolve(null),
		};
		const { generate, send } = setup({ transcriber });
		await send([
			{
				media: { base64: "AAAA", mimeType: "audio/ogg" },
				mediaKind: "audio",
				text: "",
			},
		]);
		const [messages] = generate.mock.calls[0] as unknown as [
			{ content: { type: string }[] }[],
		];
		expect(messages[0]?.content.some((part) => part.type === "file")).toBe(
			true
		);
	});
});
