import { afterEach, describe, expect, it } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { dealershipPricing } from "../knowledge/pricing.js";
import {
	isOwnerCommand,
	OWNER_HELP,
	runOwnerCommand,
} from "./owner-commands.js";
import { normalizePhone, phoneFromChatId } from "./phone.js";

const ID = "263771234567";
let crm: CrmRepository;
const opened: CrmRepository[] = [];
afterEach(() => {
	for (const repo of opened.splice(0)) {
		repo.close();
	}
});

const setup = () => {
	crm = new CrmRepository(":memory:");
	opened.push(crm);
	crm.touchInbound({
		chatId: `${ID}@c.us`,
		displayName: "Tatenda",
		id: ID,
		text: "Hi",
	});
	crm.updateProfile(ID, {
		businessName: "Tatenda Motors",
		businessType: "car_dealership",
	});
	crm.logMessage(ID, "in", "Hi");
	crm.logMessage(ID, "out", "Hi! I'm Angel.");
	return {
		crm,
		pricing: () =>
			dealershipPricing(
				{
					earlyPriceUsd: 250,
					earlySlots: 5,
					earlySlotsUsedOffset: 0,
					standardPriceUsd: 400,
				},
				crm.countPaidDealerships()
			),
		takeoverHours: 12,
	};
};

describe("phone helpers", () => {
	it("normalises local and international numbers", () => {
		expect(normalizePhone("0771 234 567")).toBe(ID);
		expect(normalizePhone("+263 77 123 4567")).toBe(ID);
		expect(phoneFromChatId(`${ID}@c.us`)).toBe(ID);
		expect(phoneFromChatId("12345@lid")).toBeUndefined();
	});
});

describe("runOwnerCommand", () => {
	it("recognises commands and shows help", () => {
		const deps = setup();
		expect(isOwnerCommand("#leads")).toBe(true);
		expect(isOwnerCommand("hello Angel")).toBe(false);
		expect(runOwnerCommand("#help", deps)).toBe(OWNER_HELP);
	});

	it("lists leads and shows one lead with its chat", () => {
		const deps = setup();
		expect(runOwnerCommand("#leads", deps)).toContain("Tatenda Motors");
		const lead = runOwnerCommand("#lead 0771234567", deps);
		expect(lead).toContain("Tatenda Motors");
		expect(lead).toContain("Angel: Hi! I'm Angel.");
		expect(lead).toContain(`https://wa.me/${ID}`);
	});

	it("pauses and resumes Angel for a chat", () => {
		const deps = setup();
		expect(runOwnerCommand(`#pause ${ID} 2`, deps)).toContain("2h");
		expect(crm.isHumanActive(crm.get(ID) as never)).toBe(true);
		runOwnerCommand(`#resume ${ID}`, deps);
		expect(crm.isHumanActive(crm.get(ID) as never)).toBe(false);
	});

	it("marks a dealership as won, which uses up an early-price slot", () => {
		const deps = setup();
		const reply = runOwnerCommand(`#won ${ID}`, deps);
		expect(reply).toContain("moved to won");
		expect(reply).toContain("Founding places left: 4 of 5");
	});

	it("rejects unknown stages and numbers politely", () => {
		const deps = setup();
		expect(runOwnerCommand(`#stage ${ID} sold`, deps)).toContain(
			"Unknown stage"
		);
		expect(runOwnerCommand("#lead 263700000000", deps)).toContain(
			"No lead found"
		);
	});

	it("saves notes and reports stats", () => {
		const deps = setup();
		runOwnerCommand(`#note ${ID} Call after 5pm`, deps);
		expect(crm.get(ID)?.notes).toContain("Owner: Call after 5pm");
		expect(runOwnerCommand("#stats", deps)).toContain("Dealerships: 1");
	});

	it("formats large figures in stats", () => {
		const deps = setup();
		const turnId = crm.startTurn({
			chatId: `${ID}@c.us`,
			contactId: ID,
			inboundCount: 1,
		});
		crm.finishTurn(turnId, {
			outcome: "replied",
			replyCount: 1,
			usage: { totalTokens: 10_240 },
		});
		const stats = runOwnerCommand("#stats", deps);
		expect(stats).toContain("Messages in: 1 · replies sent: 1");
		expect(stats).toContain("Turns: 1 (replied: 1)");
		expect(stats).toContain("tokens used: 10.2K");
	});
});

describe("ignored contacts", () => {
	it("lists ignored contacts and lets the owner allow one", () => {
		const deps = setup();
		crm.recordIgnored({
			category: "personal_for_owner",
			chatId: "263779999999@c.us",
			confidence: 0.9,
			displayName: "Mum",
			id: "263779999999",
			text: "Call me when you can",
		});
		const list = runOwnerCommand("#ignored", deps);
		expect(list).toContain("Mum · personal");
		expect(list).toContain("Call me when you can");
		expect(runOwnerCommand("#allow 0779999999", deps)).toContain("Done");
		expect(crm.getIgnored("263779999999")?.allowed).toBe(true);
		expect(runOwnerCommand("#allow 263700000000", deps)).toContain(
			"isn't on the ignored list"
		);
		expect(runOwnerCommand("#stats", deps)).toContain("Ignored contacts: 0");
	});
});
