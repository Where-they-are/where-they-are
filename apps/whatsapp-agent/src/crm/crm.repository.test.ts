import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { CrmRepository } from "./crm.repository.js";

let clock = new Date("2026-09-24T08:00:00.000Z");
const now = () => clock;
const crm = () => new CrmRepository(":memory:", now);

let repo: CrmRepository | undefined;
afterEach(() => {
	repo?.close();
	repo = undefined;
	clock = new Date("2026-09-24T08:00:00.000Z");
});

const seed = (store: CrmRepository, id = "263771234567") =>
	store.touchInbound({
		chatId: `${id}@c.us`,
		displayName: "Tatenda",
		id,
		text: "Hi, I saw your ad",
	});

describe("CrmRepository", () => {
	it("creates a customer on first contact and keeps the first message", () => {
		repo = crm();
		const first = seed(repo);
		expect(first.created).toBe(true);
		expect(first.customer).toMatchObject({
			businessType: "unknown",
			displayName: "Tatenda",
			firstMessage: "Hi, I saw your ad",
			stage: "new",
		});
		expect(seed(repo).created).toBe(false);
	});

	it("updates profile fields and appends timestamped notes", () => {
		repo = crm();
		seed(repo);
		const updated = repo.updateProfile("263771234567", {
			businessName: "  Tatenda Motors ",
			businessType: "car_dealership",
			location: "Seke Road, Harare",
		});
		expect(updated).toMatchObject({
			businessName: "Tatenda Motors",
			businessType: "car_dealership",
			location: "Seke Road, Harare",
		});
		repo.appendNote("263771234567", "Prefers voice notes");
		repo.appendNote("263771234567", "Busy on Saturdays");
		expect(repo.get("263771234567")?.notes?.split("\n")).toHaveLength(2);
	});

	it("only lets the agent move a lead forward", () => {
		repo = crm();
		seed(repo);
		const id = "263771234567";
		expect(repo.setStage(id, "qualified", { by: "agent" }).applied).toBe(true);
		expect(repo.setStage(id, "engaged", { by: "agent" }).applied).toBe(true);
		const back = repo.setStage(id, "qualified", { by: "agent" });
		expect(back).toMatchObject({
			applied: false,
			reason: "stages only move forward",
		});
		expect(repo.setStage(id, "won", { by: "agent" }).applied).toBe(false);
		expect(repo.setStage(id, "won", { by: "owner" }).applied).toBe(true);
		expect(repo.setStage(id, "engaged", { by: "agent" }).applied).toBe(false);
		expect(repo.get(id)?.stage).toBe("won");
	});

	it("marks the demo as sent and moves new leads to demo_sent", () => {
		repo = crm();
		seed(repo);
		repo.markDemoSent("263771234567");
		const customer = repo.get("263771234567");
		expect(customer?.demoSentAt).not.toBeNull();
		expect(customer?.stage).toBe("demo_sent");
		const types = repo.events("263771234567").map((event) => event.type);
		expect(types).toContain("demo_sent");
	});

	it("tracks human takeover windows", () => {
		repo = crm();
		const { customer } = seed(repo);
		repo.setHumanTakeover(
			customer.id,
			new Date("2026-09-24T20:00:00.000Z"),
			"owner"
		);
		expect(repo.isHumanActive(repo.get(customer.id) as never)).toBe(true);
		clock = new Date("2026-09-24T21:00:00.000Z");
		expect(repo.isHumanActive(repo.get(customer.id) as never)).toBe(false);
	});

	it("counts recent agent replies for rate limiting", () => {
		repo = crm();
		const { customer } = seed(repo);
		repo.logMessage(customer.id, "out", "one");
		repo.logMessage(customer.id, "out", "two");
		repo.logMessage(customer.id, "in", "customer");
		expect(repo.countRecentReplies(customer.id, 60_000)).toBe(2);
		clock = new Date("2026-09-24T09:30:00.000Z");
		expect(repo.countRecentReplies(customer.id, 60_000)).toBe(0);
	});

	it("reports funnel stats, won dealerships and a CSV export", () => {
		repo = crm();
		seed(repo, "263770000001");
		seed(repo, "263770000002");
		repo.updateProfile("263770000001", { businessType: "car_dealership" });
		repo.setStage("263770000001", "won", { by: "owner" });
		repo.recordEvent("263770000002", "objection", { kind: "too_small" });
		repo.markDemoSent("263770000002");
		const stats = repo.stats();
		expect(stats.total).toBe(2);
		expect(stats.byStage).toMatchObject({ demo_sent: 1, won: 1 });
		expect(stats.objections).toEqual({ too_small: 1 });
		expect(stats.demosSent).toBe(1);
		expect(repo.countWonDealerships()).toBe(1);
		const csv = repo.toCsv().split("\n");
		expect(csv[0]).toContain("businessName");
		expect(csv).toHaveLength(3);
	});
});

describe("turn records", () => {
	it("records a turn with its messages, gate, model, usage and latency", () => {
		repo = crm();
		const { customer } = seed(repo);
		const turnId = repo.startTurn({
			chatId: customer.chatId,
			contactId: customer.id,
			inboundCount: 2,
		});
		repo.logMessage(customer.id, "in", "Hi", null, turnId);
		repo.logMessage(customer.id, "in", "How much?", null, turnId);
		clock = new Date(clock.getTime() + 2400);
		repo.logMessage(customer.id, "out", "It's $250", null, turnId);
		repo.finishTurn(turnId, {
			attempts: 1,
			gate: {
				category: "dealership_lead",
				confidence: 0.97,
				replyProbability: 0.99,
				source: "jev",
			},
			model: "google/gemini-3.8-flash",
			outcome: "replied",
			replyCount: 1,
			tools: ["get_pricing"],
			usage: { inputTokens: 1200, outputTokens: 80, totalTokens: 1280 },
		});

		expect(repo.turn(turnId)).toMatchObject({
			contactId: customer.id,
			gate: { category: "dealership_lead", source: "jev" },
			inboundCount: 2,
			latencyMs: 2400,
			model: "google/gemini-3.8-flash",
			outcome: "replied",
			replyCount: 1,
			tools: ["get_pricing"],
			usage: { inputTokens: 1200, outputTokens: 80, reasoningTokens: null },
		});
		expect(
			repo.messages(customer.id).every((message) => message.turnId === turnId)
		).toBe(true);
		expect(repo.turnStats()).toMatchObject({
			averageLatencyMs: 2400,
			byOutcome: { replied: 1 },
			messagesIn: 2,
			messagesOut: 1,
			total: 1,
			totalTokens: 1280,
		});
	});

	it("leaves an unfinished turn in progress so crashes are visible", () => {
		repo = crm();
		const turnId = repo.startTurn({
			chatId: "263770000000@c.us",
			contactId: "263770000000",
			inboundCount: 1,
		});
		expect(repo.turn(turnId)).toMatchObject({
			finishedAt: null,
			latencyMs: null,
			outcome: "in_progress",
		});
		expect(repo.turns({ limit: 5 })).toHaveLength(1);
	});

	it("keeps every ignored message in full, outside the lead transcripts", () => {
		repo = crm();
		const contactId = "263779999999";
		const turnId = repo.startTurn({
			chatId: `${contactId}@c.us`,
			contactId,
			inboundCount: 1,
		});
		repo.logIgnoredMessage({
			body: "Win a free iPhone",
			category: "spam_or_scam",
			contactId,
			turnId,
		});
		repo.logIgnoredMessage({
			body: "Click the link",
			category: "spam_or_scam",
			contactId,
		});
		expect(
			repo.ignoredMessages(contactId).map((message) => message.body)
		).toEqual(["Win a free iPhone", "Click the link"]);
		expect(repo.ignoredMessages(contactId)[0]?.turnId).toBe(turnId);
		expect(repo.messages(contactId)).toEqual([]);
	});

	it("adds the turn column to databases created before turns existed", () => {
		const dir = mkdtempSync(join(tmpdir(), "angel-crm-"));
		const path = join(dir, "crm.sqlite");
		const legacy = new DatabaseSync(path);
		legacy.exec(
			"CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, direction TEXT NOT NULL, body TEXT NOT NULL, media_kind TEXT, created_at TEXT NOT NULL)"
		);
		legacy.close();
		const migrated = new CrmRepository(path, now);
		seed(migrated);
		const turnId = migrated.startTurn({
			chatId: "263771234567@c.us",
			contactId: "263771234567",
			inboundCount: 1,
		});
		migrated.logMessage("263771234567", "in", "hello", null, turnId);
		expect(migrated.messages("263771234567").at(-1)?.turnId).toBe(turnId);
		migrated.close();
		rmSync(dir, { force: true, recursive: true });
	});
});
