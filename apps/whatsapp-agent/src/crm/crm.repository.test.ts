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
