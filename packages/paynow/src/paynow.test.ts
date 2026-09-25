import { describe, expect, it, vi } from "vitest";

import {
	PAYNOW_REMOTE_TRANSACTION_URL,
	PaynowClient,
	parsePaynowStatus,
	paynowHash,
	toLocalWalletNumber,
	toOutcome,
	verifyPaynowHash,
} from "./paynow.js";

const KEY = "test-integration-key";
const UPPER_HEX_512 = /^[0-9A-F]{128}$/;

const signed = (fields: [string, string][]): URLSearchParams => {
	const params = new URLSearchParams(fields);
	params.append(
		"hash",
		paynowHash(
			fields.map(([, value]) => value),
			KEY
		)
	);
	return params;
};

const client = (reply: (url: string, body: URLSearchParams) => string) => {
	const fetch = vi.fn((url: string, init: { body: URLSearchParams }) =>
		Promise.resolve(new Response(reply(url, init.body)))
	);
	return {
		client: new PaynowClient({
			authEmail: "owner@example.com",
			fetch: fetch as unknown as typeof globalThis.fetch,
			integrationId: "1234",
			integrationKey: KEY,
			resultUrl: "https://angel.example.com/api/paynow/result",
			returnUrl: "https://example.com",
		}),
		fetch,
	};
};

describe("Paynow hashing", () => {
	it("hashes values in order with the key as upper-case SHA-512", () => {
		const hash = paynowHash(["1", "Paid"], KEY);
		expect(hash).toMatch(UPPER_HEX_512);
		expect(paynowHash(["Paid", "1"], KEY)).not.toBe(hash);
	});

	it("verifies messages and rejects tampered ones", () => {
		const params = signed([
			["reference", "WTA-1-DEP-1"],
			["status", "Paid"],
		]);
		const fields = [...params.entries()];
		expect(verifyPaynowHash(fields, KEY)).toBe(true);
		expect(verifyPaynowHash(fields, "wrong-key")).toBe(false);
		const tampered = fields.map(([key, value]): [string, string] =>
			key === "status" ? [key, "Cancelled"] : [key, value]
		);
		expect(verifyPaynowHash(tampered, KEY)).toBe(false);
		expect(verifyPaynowHash([["status", "Paid"]], KEY)).toBe(false);
	});
});

describe("helpers", () => {
	it("formats wallet numbers the way Paynow expects", () => {
		expect(toLocalWalletNumber("263771234567")).toBe("0771234567");
		expect(toLocalWalletNumber("+263 77 123 4567")).toBe("0771234567");
		expect(toLocalWalletNumber("0771234567")).toBe("0771234567");
		expect(toLocalWalletNumber("771234567")).toBe("0771234567");
	});

	it("maps Paynow statuses to outcomes", () => {
		expect(toOutcome("Paid")).toBe("paid");
		expect(toOutcome("Awaiting Delivery")).toBe("paid");
		expect(toOutcome("Cancelled")).toBe("cancelled");
		expect(toOutcome("Failed")).toBe("failed");
		expect(toOutcome("Sent")).toBe("pending");
		expect(toOutcome("Created")).toBe("pending");
	});
});

describe("PaynowClient", () => {
	it("sends a signed mobile payment request and returns the poll URL", async () => {
		const { client: paynow, fetch } = client(() =>
			signed([
				["status", "Ok"],
				["instructions", "Dial *151# and enter your PIN"],
				["paynowreference", "987"],
				["pollurl", "https://www.paynow.co.zw/interface/poll?guid=abc"],
			]).toString()
		);
		const result = await paynow.requestMobilePayment({
			amountUsd: 125,
			description: "Dealership website deposit",
			method: "ecocash",
			phone: "263771111111",
			reference: "WTA-263771111111-DEP-1",
		});
		expect(result).toEqual({
			instructions: "Dial *151# and enter your PIN",
			ok: true,
			paynowReference: "987",
			pollUrl: "https://www.paynow.co.zw/interface/poll?guid=abc",
		});
		const [url, init] = fetch.mock.calls[0] as [
			string,
			{ body: URLSearchParams },
		];
		expect(url).toBe(PAYNOW_REMOTE_TRANSACTION_URL);
		expect(init.body.get("amount")).toBe("125.00");
		expect(init.body.get("phone")).toBe("0771111111");
		expect(init.body.get("method")).toBe("ecocash");
		expect(verifyPaynowHash([...init.body.entries()], KEY)).toBe(true);
	});

	it("returns Paynow's error message", async () => {
		const { client: paynow } = client(() =>
			new URLSearchParams([
				["status", "Error"],
				["error", "Invalid mobile number"],
			]).toString()
		);
		expect(
			await paynow.requestMobilePayment({
				amountUsd: 125,
				description: "Deposit",
				method: "onemoney",
				phone: "12",
				reference: "WTA-1-DEP-1",
			})
		).toEqual({ error: "Invalid mobile number", ok: false });
	});

	it("rejects an unsigned success reply", async () => {
		const { client: paynow } = client(() =>
			new URLSearchParams([
				["status", "Ok"],
				["pollurl", "https://evil.example.com"],
			]).toString()
		);
		const result = await paynow.requestMobilePayment({
			amountUsd: 125,
			description: "Deposit",
			method: "ecocash",
			phone: "0771111111",
			reference: "WTA-1-DEP-1",
		});
		expect(result.ok).toBe(false);
	});

	it("polls and parses a verified status", async () => {
		const { client: paynow } = client(() =>
			signed([
				["reference", "WTA-1-DEP-1"],
				["paynowreference", "987"],
				["amount", "125.00"],
				["status", "Paid"],
				["pollurl", "https://www.paynow.co.zw/interface/poll?guid=abc"],
			]).toString()
		);
		expect(
			await paynow.poll("https://www.paynow.co.zw/interface/poll?guid=abc")
		).toMatchObject({
			amount: 125,
			outcome: "paid",
			paynowReference: "987",
			reference: "WTA-1-DEP-1",
		});
	});
});

describe("parsePaynowStatus", () => {
	it("ignores status updates with a bad hash", () => {
		expect(
			parsePaynowStatus(
				{ hash: "NOPE", reference: "WTA-1-DEP-1", status: "Paid" },
				KEY
			)
		).toBeNull();
	});
});
