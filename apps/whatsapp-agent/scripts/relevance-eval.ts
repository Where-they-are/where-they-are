/**
 * Runs first messages from new contacts through the real pipeline (Jev
 * relevance gate, then Angel) and checks who gets a reply. Scores accuracy by
 * difficulty and separates missed leads (critical) from answered spam.
 *
 *   pnpm --filter @where-they-are/whatsapp-agent relevance-eval [level|case-id ...]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readConfig } from "../src/config.js";
import { ConsoleOwnerNotifier } from "../src/notifications/owner-notifier.js";
import { createRuntime } from "../src/runtime.js";
import {
	type Level,
	type RelevanceCase,
	relevanceCases,
} from "./relevance-cases.js";

const CONCURRENCY = 4;
const LEVELS: Level[] = ["easy", "medium", "hard"];

const config = readConfig();
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const root = resolve(config.AGENT_DATA_DIR, "relevance-eval", runId);
mkdirSync(root, { recursive: true });

const filters = process.argv.slice(2);
const cases = filters.length
	? relevanceCases.filter(
			(item) => filters.includes(item.id) || filters.includes(item.level)
		)
	: relevanceCases;

interface Result {
	actual: "respond" | "ignore";
	category: string;
	item: RelevanceCase;
	ms: number;
	reply: string;
	replyProbability: number;
}

const runCase = async (item: RelevanceCase, index: number): Promise<Result> => {
	const notifier = new ConsoleOwnerNotifier();
	const runtime = createRuntime(config, notifier, {
		dataDir: resolve(root, item.id),
	});
	const customerId = `26378${String(1_000_000 + index).slice(1)}`;
	const gate = await runtime.relevance.decide({
		contact: {
			displayName: null,
			firstContact: true,
			previouslyIgnoredAs: null,
		},
		messages: item.messages,
	});
	const started = Date.now();
	const result = await runtime.conversation.handle({
		chatId: `${customerId}@c.us`,
		customerId,
		displayName: null,
		messages: item.messages.map((text) => ({ text })),
	});
	runtime.crm.close();
	return {
		actual: result.outcome === "ignored" ? "ignore" : "respond",
		category: gate.category,
		item,
		ms: Date.now() - started,
		reply: result.replies.join(" / "),
		replyProbability: gate.replyProbability,
	};
};

const results: Result[] = [];
for (let start = 0; start < cases.length; start += CONCURRENCY) {
	const batch = cases.slice(start, start + CONCURRENCY);
	results.push(
		// biome-ignore lint/performance/noAwaitInLoops: batches bound concurrency and spend
		...(await Promise.all(
			batch.map((item, offset) => runCase(item, start + offset))
		))
	);
}

const lines = [`# Relevance eval ${runId}`, ""];
for (const level of LEVELS) {
	const inLevel = results.filter((result) => result.item.level === level);
	if (inLevel.length === 0) {
		continue;
	}
	const correct = inLevel.filter(
		(result) => result.actual === result.item.expect
	);
	const summary = `${level}: ${correct.length}/${inLevel.length} correct`;
	console.info(summary);
	lines.push(`## ${summary}`, "");
	for (const result of inLevel) {
		const ok = result.actual === result.item.expect;
		const failure =
			result.item.expect === "respond" ? "MISSED LEAD" : "ANSWERED SPAM";
		const label = ok ? "PASS" : failure;
		const line = `${ok ? "✅" : "❌"} ${label} ${result.item.id} (expected ${result.item.expect}, got ${result.actual}; Jev: ${result.category}, reply ${result.replyProbability.toFixed(2)}; ${result.ms}ms)`;
		if (!ok) {
			console.info(`  ${line}`);
		}
		lines.push(
			line,
			`   > ${result.item.messages.join(" / ")}`,
			result.reply ? `   Angel: ${result.reply}` : "   Angel: (silent)",
			""
		);
	}
}
const missedLeads = results.filter(
	(result) => result.item.expect === "respond" && result.actual === "ignore"
).length;
const answeredSpam = results.filter(
	(result) => result.item.expect === "ignore" && result.actual === "respond"
).length;
const correct = results.filter(
	(result) => result.actual === result.item.expect
).length;
const footer = `${correct}/${results.length} correct · missed leads: ${missedLeads} · answered spam: ${answeredSpam}`;
lines.push(`**${footer}**`);
const reportPath = resolve(root, "report.md");
writeFileSync(reportPath, lines.join("\n"));
console.info(`\n${footer}\nReport: ${reportPath}`);
