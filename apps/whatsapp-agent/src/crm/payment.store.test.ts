import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { CrmRepository } from "./crm.repository.js";
import { PaymentStore } from "./payment.store.js";

const ID = "263771234567";
let repo: CrmRepository | undefined;
afterEach(() => {
	repo?.close();
	repo = undefined;
});

const setup = () => {
	repo = new CrmRepository(":memory:");
	repo.touchInbound({ chatId: `${ID}@c.us`, id: ID, text: "Hi" });
	return repo;
};

describe("PaymentStore", () => {
	it("creates payments with unique, readable references", () => {
		const { payments } = setup();
		const first = payments.create({
			amountUsd: 125,
			customerId: ID,
			kind: "deposit",
			method: "ecocash",
			phone: "263771111111",
		});
		const second = payments.create({
			amountUsd: 125,
			customerId: ID,
			kind: "deposit",
			method: "onemoney",
			phone: "263711111111",
		});
		expect(first).toMatchObject({
			reference: `WTA-${ID}-DEP-1`,
			status: "created",
		});
		expect(second.reference).toBe(`WTA-${ID}-DEP-2`);
		expect(payments.latest(ID, "deposit")?.id).toBe(second.id);
		expect(payments.pending()).toHaveLength(2);
	});

	it("moves to a final status only once", () => {
		const { payments } = setup();
		const payment = payments.create({
			amountUsd: 125,
			customerId: ID,
			kind: "deposit",
			method: "ecocash",
			phone: "263771111111",
		});
		payments.update(payment.id, {
			instructions: "Approve the prompt on your phone",
			pollUrl: "https://paynow.test/poll",
			status: "sent",
		});
		const paid = payments.update(payment.id, {
			paynowReference: "12345",
			providerStatus: "Paid",
			status: "paid",
		});
		expect(paid).toMatchObject({
			paynowReference: "12345",
			pollUrl: "https://paynow.test/poll",
			providerStatus: "Paid",
			status: "paid",
		});
		expect(paid?.paidAt).not.toBeNull();
		expect(payments.update(payment.id, { status: "failed" })).toBeUndefined();
		expect(payments.byReference(payment.reference)?.status).toBe("paid");
		expect(payments.pending()).toEqual([]);
		expect(payments.totals()).toEqual({ paidCount: 1, paidUsd: 125 });
	});
});

describe("PaymentStore plan payments", () => {
	it("keeps the plan and checkout link on first-month payments", () => {
		const { payments } = setup();
		const payment = payments.create({
			amountUsd: 48,
			customerId: ID,
			kind: "first_month",
			method: "link",
			phone: ID,
			plan: "growth",
		});
		expect(payment).toMatchObject({
			link: null,
			plan: "growth",
			reference: `WTA-${ID}-FM-1`,
		});
		const sent = payments.update(payment.id, {
			link: "https://www.paynow.co.zw/Payment/ConfirmPayment/1",
			pollUrl: "https://paynow.test/poll",
			status: "sent",
		});
		expect(sent?.link).toBe(
			"https://www.paynow.co.zw/Payment/ConfirmPayment/1"
		);
		expect(
			payments.create({
				amountUsd: 96,
				customerId: ID,
				kind: "renewal",
				method: "ecocash",
				phone: "263771111111",
				plan: "growth",
			}).reference
		).toBe(`WTA-${ID}-RN-1`);
	});

	it("adds the new columns to a payments table from an older release", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(
			"CREATE TABLE customers (id TEXT PRIMARY KEY); CREATE TABLE payments (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL, kind TEXT NOT NULL, amount_usd REAL NOT NULL, method TEXT NOT NULL, phone TEXT NOT NULL, reference TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'created', provider_status TEXT, paynow_reference TEXT, poll_url TEXT, instructions TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, paid_at TEXT)"
		);
		const payments = new PaymentStore(db);
		expect(
			payments.create({
				amountUsd: 32,
				customerId: ID,
				kind: "first_month",
				method: "onemoney",
				phone: "263711111111",
				plan: "starter",
			}).plan
		).toBe("starter");
		db.close();
	});
});
