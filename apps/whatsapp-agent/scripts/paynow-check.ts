/**
 * Live check of the Paynow integration in .env: creates a payment link (and,
 * with --mobile <number>, a mobile prompt) and polls it once. In Paynow's
 * test mode no money moves. Run: pnpm --filter @where-they-are/whatsapp-agent paynow-check
 */
import { PaynowClient } from "@where-they-are/paynow";

const id = process.env.PAYNOW_INTEGRATION_ID ?? "";
const key = process.env.PAYNOW_INTEGRATION_KEY ?? "";
const authEmail = process.env.PAYNOW_AUTH_EMAIL ?? "";
if (!(id && key)) {
	throw new Error("Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY");
}

const paynow = new PaynowClient({
	authEmail,
	integrationId: id,
	integrationKey: key,
	resultUrl: "https://example.com/api/paynow/result",
	returnUrl: "https://wa.me/263775101506",
});
const stamp = Date.now();
const POLL_EVERY_MS = 4000;
const MAX_POLLS = 10;

const link = await paynow.requestPaymentLink({
	amountUsd: 1,
	description: "Where They Are integration check",
	reference: `WTA-CHECK-LINK-${stamp}`,
});
process.stdout.write(`Payment link: ${JSON.stringify(link)}\n`);
if (link.ok) {
	process.stdout.write(
		`Poll: ${JSON.stringify(await paynow.poll(link.pollUrl))}\n`
	);
}

const mobileFlag = process.argv.indexOf("--mobile");
const phone = mobileFlag > -1 ? process.argv[mobileFlag + 1] : undefined;
if (phone) {
	const mobile = await paynow.requestMobilePayment({
		amountUsd: 1,
		description: "Where They Are integration check",
		method: "ecocash",
		phone,
		reference: `WTA-CHECK-MOBILE-${stamp}`,
	});
	process.stdout.write(`Mobile prompt: ${JSON.stringify(mobile)}\n`);
	if (mobile.ok) {
		// Waits for the prompt to be approved; Paynow's test numbers settle in seconds.
		for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
			// biome-ignore lint/performance/noAwaitInLoops: polls one after another
			await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
			const status = await paynow.poll(mobile.pollUrl);
			process.stdout.write(`Poll: ${JSON.stringify(status)}\n`);
			if (status && status.outcome !== "pending") {
				break;
			}
		}
	}
}
