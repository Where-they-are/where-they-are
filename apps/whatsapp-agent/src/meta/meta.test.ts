import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { CrmRepository } from "../crm/crm.repository.js";
import { buildMetaEvent, MetaConversionsClient } from "./conversions.js";
import { MetaReporter } from "./meta-reporter.js";

const ID = "263771234567";
const sha256 = (value: string) =>
	createHash("sha256").update(value).digest("hex");

const opened: CrmRepository[] = [];
afterEach(() => {
	for (const repo of opened.splice(0)) {
		repo.close();
	}
});

describe("buildMetaEvent", () => {
	const base = {
		eventId: "wta-1-Purchase-DEP-1",
		eventName: "Purchase" as const,
		eventTime: new Date("2026-09-25T10:00:00.000Z"),
		phone: ID,
		valueUsd: 125,
	};

	it("attributes Click-to-WhatsApp leads as business messaging", () => {
		const event = buildMetaEvent(
			{
				...base,
				adSource: {
					ctwaClid: "clid-123",
					sourceId: "ad-1",
					sourceUrl: null,
					title: null,
				},
			},
			"waba-9"
		);
		expect(event).toMatchObject({
			action_source: "business_messaging",
			custom_data: { currency: "USD", value: 125 },
			event_id: "wta-1-Purchase-DEP-1",
			event_name: "Purchase",
			event_time: 1_790_330_400,
			messaging_channel: "whatsapp",
			user_data: {
				ctwa_clid: "clid-123",
				ph: [sha256(ID)],
				whatsapp_business_account_id: "waba-9",
			},
		});
	});

	it("matches other leads on the hashed phone only", () => {
		const event = buildMetaEvent({ ...base, adSource: null });
		expect(event.action_source).toBe("system_generated");
		expect(event).not.toHaveProperty("messaging_channel");
		expect(JSON.stringify(event)).not.toContain(ID);
	});
});

describe("MetaReporter", () => {
	const setup = (ok = true) => {
		const crm = new CrmRepository(":memory:");
		opened.push(crm);
		crm.touchInbound({ chatId: `${ID}@c.us`, id: ID, text: "Hi" });
		const fetch = vi.fn(() =>
			Promise.resolve(
				new Response(ok ? "{}" : '{"error":"bad token"}', {
					status: ok ? 200 : 400,
				})
			)
		);
		const client = new MetaConversionsClient({
			accessToken: "token",
			datasetId: "123",
			fetch: fetch as unknown as typeof globalThis.fetch,
			testEventCode: "TEST1",
		});
		return { crm, fetch, reporter: new MetaReporter(client, crm) };
	};

	it("reports each event once per lead", async () => {
		const { crm, fetch, reporter } = setup();
		expect(
			await reporter.report({ customerId: ID, eventName: "QualifiedLead" })
		).toEqual({ ok: true });
		expect(
			await reporter.report({ customerId: ID, eventName: "QualifiedLead" })
		).toBeNull();
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url, init] = fetch.mock.calls[0] as unknown as [
			string,
			{ body: string },
		];
		expect(url).toBe("https://graph.facebook.com/v23.0/123/events");
		expect(JSON.parse(init.body)).toMatchObject({
			access_token: "token",
			test_event_code: "TEST1",
		});
		expect(crm.hasEvent(ID, "meta_event", "event", "QualifiedLead")).toBe(true);
	});

	it("keys repeatable events by payment and retries failures", async () => {
		const { fetch, reporter } = setup(false);
		const failed = await reporter.report({
			customerId: ID,
			eventName: "Purchase",
			key: "DEP-1",
			valueUsd: 125,
		});
		expect(failed).toMatchObject({ ok: false });
		await reporter.report({
			customerId: ID,
			eventName: "Purchase",
			key: "DEP-1",
			valueUsd: 125,
		});
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("does nothing when Meta is not configured", async () => {
		const crm = new CrmRepository(":memory:");
		opened.push(crm);
		const reporter = new MetaReporter(null, crm);
		expect(reporter.enabled).toBe(false);
		expect(
			await reporter.report({ customerId: ID, eventName: "QualifiedLead" })
		).toBeNull();
	});
});
