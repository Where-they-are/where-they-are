import { describe, expect, it } from "vitest";
import type { Message } from "whatsapp-web.js";

import { adSourceFrom } from "./normalize.js";

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
