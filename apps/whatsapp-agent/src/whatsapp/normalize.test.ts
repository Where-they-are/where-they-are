import { describe, expect, it } from "vitest";
import type { Message } from "whatsapp-web.js";

import { adSourceFrom, toIncomingMessage } from "./normalize.js";

const message = (data: unknown) => ({ _data: data }) as unknown as Message;

describe("adSourceFrom", () => {
	it("reads the Click-to-WhatsApp ad a message came from", () => {
		expect(
			adSourceFrom(
				message({
					ctwaContext: {
						ctwaClid: "clid-1",
						sourceId: "120210000",
						sourceUrl: "https://fb.me/ad",
						title: "Dealership websites",
					},
				})
			)
		).toEqual({
			ctwaClid: "clid-1",
			sourceId: "120210000",
			sourceUrl: "https://fb.me/ad",
			title: "Dealership websites",
		});
	});

	it("returns null for ordinary messages", () => {
		expect(adSourceFrom(message({ body: "Hi" }))).toBeNull();
		expect(adSourceFrom(message({ ctwaContext: { sourceId: 5 } }))).toBeNull();
	});
});

const typed = (type: string, body: string, data: unknown = {}) =>
	({ _data: data, body, hasMedia: false, type }) as unknown as Message;

describe("ad form screening signals", () => {
	it("marks a submitted form as passing screening", async () => {
		expect(
			await toIncomingMessage(
				typed("interactive", "", {
					paramsJson: '{"business_name":"Tino Motors","city":"Mutare"}',
				})
			)
		).toEqual({
			fromForm: true,
			text: "(Ad form answers)\nbusiness name: Tino Motors\ncity: Mutare",
		});
	});

	it("never treats typed text or a button tap as a form", async () => {
		expect(
			await toIncomingMessage(typed("chat", "Can I get more info?"))
		).toEqual({ text: "Can I get more info?" });
		expect(
			await toIncomingMessage(typed("buttons_response", "Fill out form"))
		).toEqual({ text: "Fill out form" });
	});
});
