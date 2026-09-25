/**
 * Sends a real voice note and a photo through Angel to check media handling
 * end to end against the live model.
 *
 *   pnpm --filter @where-they-are/whatsapp-agent media-check <voice-file> <image-file>
 */
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

import { readConfig } from "../src/config.js";
import { ConsoleOwnerNotifier } from "../src/notifications/owner-notifier.js";
import { createRuntime } from "../src/runtime.js";

const MIME: Record<string, string> = {
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".m4a": "audio/mp4",
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
	".png": "image/png",
	".wav": "audio/wav",
	".webp": "image/webp",
};

const [voicePath, imagePath] = process.argv.slice(2);
if (!(voicePath && imagePath)) {
	throw new Error("Usage: media-check <voice-file> <image-file>");
}

const load = (path: string) => ({
	base64: readFileSync(path).toString("base64"),
	mimeType: MIME[extname(path).toLowerCase()] ?? "application/octet-stream",
});

const config = readConfig();
const runtime = createRuntime(config, new ConsoleOwnerNotifier(), {
	dataDir: resolve(config.AGENT_DATA_DIR, "media-check", String(Date.now())),
});
const customerId = "263770009999";
const send = async (
	label: string,
	message: Parameters<typeof runtime.conversation.handle>[0]["messages"][number]
) => {
	const result = await runtime.conversation.handle({
		chatId: `${customerId}@c.us`,
		customerId,
		displayName: null,
		messages: [message],
	});
	console.info(`\n[${label}] ${result.outcome}`);
	for (const reply of result.replies) {
		console.info(`angel › ${reply}`);
	}
};

await send("voice note", {
	media: load(voicePath),
	mediaKind: "audio",
	text: "",
});
await send("photo", {
	media: load(imagePath),
	mediaKind: "image",
	text: "This is one of the cars on our yard",
});
console.info("\nCRM profile:", runtime.crm.get(customerId));
runtime.crm.close();
