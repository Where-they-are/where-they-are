import { afterEach, describe, expect, it } from "vitest";

import { CrmRepository } from "./crm.repository.js";

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
