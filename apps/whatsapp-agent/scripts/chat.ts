/**
 * Talk to Angel in the terminal, exactly as a WhatsApp customer would.
 *
 *   pnpm --filter @where-they-are/whatsapp-agent chat [phone-number]
 *
 * Uses a separate data directory (./data/cli) so it never touches real leads.
 * Type /profile to see the CRM record, /events for the funnel log, /quit to exit.
 */
import { createInterface } from "node:readline/promises";

import { readConfig } from "../src/config.js";
import { ConsoleOwnerNotifier } from "../src/notifications/owner-notifier.js";
import { createRuntime } from "../src/runtime.js";

const customerId = process.argv[2] ?? "263770000001";
const config = readConfig();
const runtime = createRuntime(config, new ConsoleOwnerNotifier(), {
	dataDir: `${config.AGENT_DATA_DIR}/cli`,
});

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.info(`Chatting with Angel as ${customerId}. /profile /events /quit\n`);

for (;;) {
	// biome-ignore lint/performance/noAwaitInLoops: an interactive chat is sequential
	const line = (await rl.question("you › ")).trim();
	if (line === "/quit") {
		break;
	}
	if (line === "/profile") {
		console.info(runtime.crm.get(customerId));
		continue;
	}
	if (line === "/events") {
		console.info(runtime.crm.events(customerId, 30));
		continue;
	}
	if (!line) {
		continue;
	}
	const started = Date.now();
	const result = await runtime.conversation.handle({
		chatId: `${customerId}@c.us`,
		customerId,
		displayName: "CLI tester",
		messages: [{ text: line }],
	});
	for (const reply of result.replies) {
		console.info(`angel › ${reply}\n`);
	}
	console.info(`(${result.outcome}, ${Date.now() - started}ms)\n`);
}
rl.close();
runtime.crm.close();
