import { describe, expect, it } from "vitest";

import { checkWallet } from "./wallet.js";

describe("checkWallet", () => {
	it("detects EcoCash and OneMoney from the number", () => {
		expect(checkWallet("0771234567")).toEqual({
			method: "ecocash",
			ok: true,
			phone: "263771234567",
		});
		expect(checkWallet("+263 78 123 4567")).toMatchObject({
			method: "ecocash",
		});
		expect(checkWallet("0711234567")).toMatchObject({ method: "onemoney" });
	});

	it("respects an explicit wallet and rejects bad numbers", () => {
		expect(checkWallet("0731234567", "ecocash")).toMatchObject({ ok: true });
		expect(checkWallet("0731234567")).toEqual({
			ok: false,
			problem: "unsupported_network",
		});
		expect(checkWallet("12345")).toEqual({
			ok: false,
			problem: "not_a_zimbabwe_mobile",
		});
	});
});
