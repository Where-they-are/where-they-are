/**
 * Runs scripted customer conversations against the real model and checks
 * Angel's replies, silences and CRM state. Writes a transcript report to
 * ./data/eval.
 *
 *   pnpm --filter @where-they-are/whatsapp-agent eval [scenario-id|group ...]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readConfig } from "../src/config.js";
import type { CrmEvent, Customer } from "../src/crm/crm.types.js";
import { ConsoleOwnerNotifier } from "../src/notifications/owner-notifier.js";
import { createRuntime } from "../src/runtime.js";
import { type Scenario, scenarios } from "./scenarios.js";

const MAX_WORDS = 120;
const CONCURRENCY = 3;
const QUESTION_MARK = /\?/g;
/** Things Angel must never say, in any conversation. */
const GLOBAL_FORBIDDEN = [
	/\bI am (a )?human\b|\bI'm (a )?(real )?(person|human)\b/i,
	/\{"|"\w+":\s/,
	/\bCRM\b|update_lead_stage|request_human|save_customer_details|recommend_plan|ignore_message/i,
	// No invented track record.
	/\bwe (often|usually|regularly) (work|help|build)|\bmany (dealers|dealerships|clients|businesses) (use|have|choose)|\bour (clients|customers) (include|love|say)|dealers we('ve| have) worked with/i,
	// The retired website offer.
	/\$250|\$125|\bdeposit\b|Paynow|Ridgeline|website demo/i,
	// Mechanism talk the ads and script avoid.
	/software company|we create vehicle content|get your dealership online/i,
];

const config = readConfig();
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const root = resolve(config.AGENT_DATA_DIR, "eval", runId);
mkdirSync(root, { recursive: true });

const selected = process.argv.slice(2);
const toRun = selected.length
	? scenarios.filter(
			(scenario) =>
				selected.includes(scenario.id) || selected.includes(scenario.group)
		)
	: scenarios;

interface TurnRecord {
	outcome: string;
	replies: string[];
	text: string;
}

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
	const { category, kind, plan, reason, to } = event.detail;
	return [
		event.type,
		to ? `→${String(to)}` : "",
		reason ? `(${String(reason)})` : "",
		kind ? `(${String(kind)})` : "",
		plan ? `(${String(plan)})` : "",
		category ? `(${String(category)})` : "",
	].join("");
};

/** Required and forbidden wording across all of Angel's replies. */
const checkReplies = (
	expect: Scenario["expect"],
	replies: string[]
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
	return failures;
};

/** Which turns got a reply, which stayed silent, and how many questions each asked. */
const checkTurns = (
	expect: Scenario["expect"],
	turns: TurnRecord[]
): string[] => {
	const failures: string[] = [];
	for (const index of expect.silentTurns ?? []) {
		const turn = turns[index];
		if (turn && turn.replies.length > 0) {
			failures.push(
				`turn ${index} should be silent but got: "${turn.replies.join(" / ").slice(0, 100)}"`
			);
		}
	}
	for (const index of expect.repliedTurns ?? []) {
		const turn = turns[index];
		if (turn && turn.replies.length === 0) {
			failures.push(
				`turn ${index} ("${turn.text.slice(0, 50)}") got no reply (${turn.outcome})`
			);
		}
	}
	for (const [index, turn] of turns.entries()) {
		const questions = turn.replies.join(" ").match(QUESTION_MARK)?.length ?? 0;
		if (questions > 1 && !expect.allowExtraQuestions) {
			failures.push(`turn ${index} asked ${questions} questions`);
		}
		if (turn.outcome === "fallback") {
			failures.push(`fallback reply on turn ${index} ("${turn.text}")`);
		}
		const words = wordCount(turn.replies.join("\n\n"));
		if (words > MAX_WORDS) {
			failures.push(`turn ${index} reply too long (${words} words)`);
		}
	}
	return failures;
};

/** Compares the CRM after a conversation with what the scenario expects. */
const checkCrm = (
	expect: Scenario["expect"],
	customer: Customer | undefined,
	events: CrmEvent[]
): string[] => {
	const failures: string[] = [];
	const handoffs = events.filter((event) => event.type === "handoff_requested");
	const check = (ok: boolean, message: string) => {
		if (!ok) {
			failures.push(message);
		}
	};
	if (expect.handoff !== undefined) {
		check(
			handoffs.length > 0 === expect.handoff,
			`handoff ${handoffs.length > 0}, expected ${expect.handoff}`
		);
	}
	if (expect.handoffReason) {
		check(
			handoffs.some((event) => event.detail.reason === expect.handoffReason),
			`no ${expect.handoffReason} hand-off (got ${handoffs.map((event) => String(event.detail.reason)).join(", ") || "none"})`
		);
	}
	if (expect.businessType) {
		check(
			customer?.businessType === expect.businessType,
			`businessType ${customer?.businessType}, expected ${expect.businessType}`
		);
	}
	if (expect.recommendedPlan) {
		check(
			customer?.recommendedPlan === expect.recommendedPlan,
			`recommended ${customer?.recommendedPlan ?? "nothing"}, expected ${expect.recommendedPlan}`
		);
	}
	if (expect.optedOut !== undefined) {
		check(
			customer?.optedOut === expect.optedOut,
			`optedOut ${customer?.optedOut}, expected ${expect.optedOut}`
		);
	}
	if (expect.leadScoreAtLeast !== undefined) {
		check(
			(customer?.leadScore ?? 0) >= expect.leadScoreAtLeast,
			`lead score ${customer?.leadScore ?? 0}, expected at least ${expect.leadScoreAtLeast}`
		);
	}
	if (expect.location) {
		check(
			expect.location.test(customer?.location ?? ""),
			`location ${customer?.location ?? "unknown"}, expected ${expect.location}`
		);
	}
	if (expect.stages && customer) {
		check(
			expect.stages.includes(customer.stage),
			`stage ${customer.stage}, expected ${expect.stages.join("|")}`
		);
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
	const customerId = `26377${String(10_000_000 + index).slice(1)}`;
	const transcript: string[] = [];
	const turns: TurnRecord[] = [];
	const ms: number[] = [];

	for (const step of scenario.turns) {
		const batch = Array.isArray(step) ? step : [step];
		const text = batch.join(" / ");
		transcript.push(`**Customer:** ${text}`);
		const started = Date.now();
		// biome-ignore lint/performance/noAwaitInLoops: a conversation is sequential
		const result = await runtime.conversation.handle({
			chatId: `${customerId}@c.us`,
			customerId,
			displayName: "Eval",
			messages: batch.map((message) => ({ text: message })),
		});
		ms.push(Date.now() - started);
		if (result.replies.length === 0) {
			transcript.push(`_(no reply: ${result.outcome})_`);
		}
		for (const reply of result.replies) {
			transcript.push(`**Angel:** ${reply}`);
		}
		turns.push({ outcome: result.outcome, replies: result.replies, text });
	}

	const customer = runtime.crm.get(customerId);
	const events = runtime.crm.events(customerId, 100);
	const failures = [
		...checkReplies(
			scenario.expect,
			turns.flatMap((turn) => turn.replies)
		),
		...checkTurns(scenario.expect, turns),
		...checkCrm(scenario.expect, customer, events),
	];

	transcript.push(
		"",
		"```",
		JSON.stringify(
			{
				businessName: customer?.businessName,
				businessType: customer?.businessType,
				desiredFrequency: customer?.desiredFrequency,
				facebookUrl: customer?.facebookUrl,
				instagramUrl: customer?.instagramUrl,
				isDecisionMaker: customer?.isDecisionMaker,
				leadScore: customer?.leadScore,
				leadSignals: customer?.leadSignals,
				location: customer?.location,
				name: customer?.name,
				notes: customer?.notes,
				postingHabit: customer?.postingHabit,
				recommendedPlan: customer?.recommendedPlan,
				stage: customer?.stage,
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
		`${ok ? "PASS" : "FAIL"} ${outcome.scenario.group}/${outcome.scenario.id} (avg ${avg}ms)${ok ? "" : `\n  - ${outcome.failures.join("\n  - ")}`}`
	);
	lines.push(
		`## ${ok ? "✅" : "❌"} ${outcome.scenario.id}: ${outcome.scenario.description}`,
		`${outcome.scenario.group} · avg ${avg}ms per turn`,
		...outcome.failures.map((failure) => `- FAIL: ${failure}`),
		"",
		...outcome.transcript,
		""
	);
}
const reportPath = resolve(root, "report.md");
writeFileSync(reportPath, lines.join("\n"));
console.info(`\n${passed}/${outcomes.length} passed. Report: ${reportPath}`);
