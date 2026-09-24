/**
 * Runs scripted customer conversations against the real model and checks
 * Angel's replies and CRM state. Writes a transcript report to ./data/eval.
 *
 *   pnpm --filter @where-they-are/whatsapp-agent eval [scenario-id ...]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readConfig } from "../src/config.js";
import type { CrmEvent, Customer } from "../src/crm/crm.types.js";
import { ConsoleOwnerNotifier } from "../src/notifications/owner-notifier.js";
import { createRuntime } from "../src/runtime.js";
import { type Scenario, scenarios } from "./scenarios.js";

const MAX_WORDS = 110;
const CONCURRENCY = 3;
/** Unconditional promises Angel must never make. */
const GLOBAL_FORBIDDEN = [
	/\bI am (a )?human\b|\bI'm (a )?(real )?(person|human)\b/i,
	/\{"|"\w+":\s/,
	/\bCRM\b|update_lead_stage|request_human|save_customer_details/i,
];

const config = readConfig();
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const root = resolve(config.AGENT_DATA_DIR, "eval", runId);
mkdirSync(root, { recursive: true });

const selected = process.argv.slice(2);
const toRun = selected.length
	? scenarios.filter((scenario) => selected.includes(scenario.id))
	: scenarios;

interface Outcome {
	failures: string[];
	ms: number[];
	scenario: Scenario;
	transcript: string[];
}

const WHITESPACE = /\s+/;
const wordCount = (text: string) =>
	text.split(WHITESPACE).filter(Boolean).length;

const describeEvent = (event: CrmEvent): string => {
	const { kind, reason, to } = event.detail;
	return [
		event.type,
		to ? `→${String(to)}` : "",
		reason ? `(${String(reason)})` : "",
		kind ? `(${String(kind)})` : "",
	].join("");
};

/** Compares a finished conversation with what the scenario expects. */
const checkExpectations = (
	expect: Scenario["expect"],
	replies: string[],
	customer: Customer | undefined,
	events: CrmEvent[]
): string[] => {
	const failures: string[] = [];
	const all = replies.join("\n\n");
	for (const pattern of expect.mentions ?? []) {
		if (!pattern.test(all)) {
			failures.push(`missing ${pattern}`);
		}
	}
	for (const pattern of [
		...(expect.neverMentions ?? []),
		...GLOBAL_FORBIDDEN,
	]) {
		const hit = replies.find((reply) => pattern.test(reply));
		if (hit) {
			failures.push(`forbidden ${pattern} in: "${hit.slice(0, 120)}"`);
		}
	}
	const actual = {
		businessType: customer?.businessType,
		demoSent: Boolean(customer?.demoSentAt),
		handoff: events.some((event) => event.type === "handoff_requested"),
		optedOut: customer?.optedOut,
	};
	if (expect.stages && customer && !expect.stages.includes(customer.stage)) {
		failures.push(
			`stage ${customer.stage}, expected ${expect.stages.join("|")}`
		);
	}
	for (const key of [
		"businessType",
		"demoSent",
		"handoff",
		"optedOut",
	] as const) {
		const wanted = expect[key];
		if (wanted !== undefined && actual[key] !== wanted) {
			failures.push(
				`${key} ${String(actual[key])}, expected ${String(wanted)}`
			);
		}
	}
	return failures;
};

const runScenario = async (
	scenario: Scenario,
	index: number
): Promise<Outcome> => {
	const notifier = new ConsoleOwnerNotifier();
	const runtime = createRuntime(config, notifier, {
		dataDir: resolve(root, scenario.id),
	});
	const customerId = `26377${String(1_000_000 + index).slice(1)}`;
	const transcript: string[] = [];
	const replies: string[] = [];
	const ms: number[] = [];
	const failures: string[] = [];

	for (const turn of scenario.turns) {
		transcript.push(`**Customer:** ${turn}`);
		const started = Date.now();
		// biome-ignore lint/performance/noAwaitInLoops: a conversation is sequential
		const result = await runtime.conversation.handle({
			chatId: `${customerId}@c.us`,
			customerId,
			displayName: "Eval",
			messages: [{ text: turn }],
		});
		ms.push(Date.now() - started);
		if (result.replies.length === 0) {
			transcript.push(`_(no reply: ${result.outcome})_`);
		}
		for (const reply of result.replies) {
			transcript.push(`**Angel:** ${reply}`);
			replies.push(reply);
		}
		if (result.outcome === "fallback") {
			failures.push(`fallback reply on turn "${turn}"`);
		}
		const turnText = result.replies.join("\n\n");
		if (wordCount(turnText) > MAX_WORDS) {
			failures.push(
				`reply too long (${wordCount(turnText)} words) on "${turn}"`
			);
		}
	}

	const customer = runtime.crm.get(customerId);
	const events = runtime.crm.events(customerId, 100);
	failures.push(
		...checkExpectations(scenario.expect, replies, customer, events)
	);

	transcript.push(
		"",
		"```",
		JSON.stringify(
			{
				businessName: customer?.businessName,
				businessType: customer?.businessType,
				demoSentAt: customer?.demoSentAt,
				location: customer?.location,
				name: customer?.name,
				notes: customer?.notes,
				stage: customer?.stage,
				vehicleTypes: customer?.vehicleTypes,
			},
			null,
			2
		),
		`events: ${events.map(describeEvent).join(", ")}`,
		`owner alerts: ${notifier.sent.length}`,
		"```"
	);
	runtime.crm.close();
	return { failures, ms, scenario, transcript };
};

const outcomes: Outcome[] = [];
for (let start = 0; start < toRun.length; start += CONCURRENCY) {
	const batch = toRun.slice(start, start + CONCURRENCY);
	outcomes.push(
		// biome-ignore lint/performance/noAwaitInLoops: batches bound concurrency and spend
		...(await Promise.all(
			batch.map((scenario, offset) => runScenario(scenario, start + offset))
		))
	);
}

const lines = [`# Angel eval ${runId}`, `Model: ${config.AGENT_MODEL}`, ""];
let passed = 0;
for (const outcome of outcomes) {
	const ok = outcome.failures.length === 0;
	passed += ok ? 1 : 0;
	const avg = Math.round(
		outcome.ms.reduce((sum, value) => sum + value, 0) / outcome.ms.length
	);
	console.info(
		`${ok ? "PASS" : "FAIL"} ${outcome.scenario.id} (avg ${avg}ms)${ok ? "" : `\n  - ${outcome.failures.join("\n  - ")}`}`
	);
	lines.push(
		`## ${ok ? "✅" : "❌"} ${outcome.scenario.id}: ${outcome.scenario.description}`,
		`avg ${avg}ms per turn`,
		...outcome.failures.map((failure) => `- FAIL: ${failure}`),
		"",
		...outcome.transcript,
		""
	);
}
const reportPath = resolve(root, "report.md");
writeFileSync(reportPath, lines.join("\n"));
console.info(`\n${passed}/${outcomes.length} passed. Report: ${reportPath}`);
