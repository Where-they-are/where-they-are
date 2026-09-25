import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
	type BusinessType,
	type CrmEvent,
	type Customer,
	type EventType,
	type IgnoreCategory,
	type IgnoredContact,
	type IgnoredMessage,
	type LeadStage,
	type LoggedMessage,
	type MessageDirection,
	OWNER_ONLY_STAGES,
	PROGRESS_STAGES,
	type ProfilePatch,
	type TriState,
	type TurnFinish,
	type TurnRecord,
	type TurnStats,
} from "./crm.types.js";

type Row = Record<string, unknown>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
	id TEXT PRIMARY KEY,
	chat_id TEXT NOT NULL,
	display_name TEXT,
	name TEXT,
	business_name TEXT,
	business_type TEXT NOT NULL DEFAULT 'unknown',
	other_business_type TEXT,
	vehicle_types TEXT,
	location TEXT,
	has_website TEXT NOT NULL DEFAULT 'unknown',
	website_url TEXT,
	current_channels TEXT,
	is_decision_maker TEXT NOT NULL DEFAULT 'unknown',
	stage TEXT NOT NULL DEFAULT 'new',
	demo_sent_at TEXT,
	first_message TEXT,
	notes TEXT,
	opted_out INTEGER NOT NULL DEFAULT 0,
	human_takeover_until TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	last_inbound_at TEXT,
	last_outbound_at TEXT
);
CREATE TABLE IF NOT EXISTS events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	customer_id TEXT NOT NULL REFERENCES customers(id),
	type TEXT NOT NULL,
	detail TEXT NOT NULL DEFAULT '{}',
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_customer ON events(customer_id, id);
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	customer_id TEXT NOT NULL REFERENCES customers(id),
	direction TEXT NOT NULL,
	body TEXT NOT NULL,
	media_kind TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_customer ON messages(customer_id, id);
CREATE TABLE IF NOT EXISTS ignored_contacts (
	id TEXT PRIMARY KEY,
	chat_id TEXT NOT NULL,
	display_name TEXT,
	category TEXT NOT NULL,
	confidence REAL NOT NULL,
	last_message TEXT NOT NULL,
	count INTEGER NOT NULL DEFAULT 1,
	allowed INTEGER NOT NULL DEFAULT 0,
	first_at TEXT NOT NULL,
	last_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS turns (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	contact_id TEXT NOT NULL,
	chat_id TEXT NOT NULL,
	outcome TEXT NOT NULL DEFAULT 'in_progress',
	inbound_count INTEGER NOT NULL,
	reply_count INTEGER NOT NULL DEFAULT 0,
	gate_category TEXT,
	gate_confidence REAL,
	gate_reply_probability REAL,
	gate_source TEXT,
	model TEXT,
	input_tokens INTEGER,
	output_tokens INTEGER,
	reasoning_tokens INTEGER,
	total_tokens INTEGER,
	tools TEXT NOT NULL DEFAULT '[]',
	attempts INTEGER NOT NULL DEFAULT 0,
	error TEXT,
	latency_ms INTEGER,
	started_at TEXT NOT NULL,
	finished_at TEXT
);
CREATE INDEX IF NOT EXISTS turns_contact ON turns(contact_id, id);
CREATE INDEX IF NOT EXISTS turns_started ON turns(started_at);
CREATE TABLE IF NOT EXISTS ignored_messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	contact_id TEXT NOT NULL,
	turn_id INTEGER REFERENCES turns(id),
	category TEXT NOT NULL,
	body TEXT NOT NULL,
	media_kind TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ignored_messages_contact ON ignored_messages(contact_id, id);
`;

/** Columns added after the first release, applied to existing databases. */
const MIGRATIONS: { column: string; sql: string; table: string }[] = [
	{
		column: "turn_id",
		sql: "ALTER TABLE messages ADD COLUMN turn_id INTEGER REFERENCES turns(id)",
		table: "messages",
	},
];

const PROFILE_COLUMNS: Record<keyof ProfilePatch, string> = {
	businessName: "business_name",
	businessType: "business_type",
	currentChannels: "current_channels",
	hasWebsite: "has_website",
	isDecisionMaker: "is_decision_maker",
	location: "location",
	name: "name",
	otherBusinessType: "other_business_type",
	vehicleTypes: "vehicle_types",
	websiteUrl: "website_url",
};

const MAX_NOTES_LENGTH = 4000;
const CSV_NEEDS_QUOTES = /[",\n]/;
const DOUBLE_QUOTE = /"/g;

const text = (value: unknown): string | null =>
	typeof value === "string" && value.length > 0 ? value : null;

const toCustomer = (row: Row): Customer => ({
	businessName: text(row.business_name),
	businessType: (row.business_type as BusinessType) ?? "unknown",
	chatId: String(row.chat_id),
	createdAt: String(row.created_at),
	currentChannels: text(row.current_channels),
	demoSentAt: text(row.demo_sent_at),
	displayName: text(row.display_name),
	firstMessage: text(row.first_message),
	hasWebsite: (row.has_website as TriState) ?? "unknown",
	humanTakeoverUntil: text(row.human_takeover_until),
	id: String(row.id),
	isDecisionMaker: (row.is_decision_maker as TriState) ?? "unknown",
	lastInboundAt: text(row.last_inbound_at),
	lastOutboundAt: text(row.last_outbound_at),
	location: text(row.location),
	name: text(row.name),
	notes: text(row.notes),
	optedOut: Number(row.opted_out) === 1,
	otherBusinessType: text(row.other_business_type),
	stage: row.stage as LeadStage,
	updatedAt: String(row.updated_at),
	vehicleTypes: text(row.vehicle_types),
	websiteUrl: text(row.website_url),
});

const toIgnored = (row: Row): IgnoredContact => ({
	allowed: Number(row.allowed) === 1,
	category: row.category as IgnoreCategory,
	chatId: String(row.chat_id),
	confidence: Number(row.confidence),
	count: Number(row.count),
	displayName: text(row.display_name),
	firstAt: String(row.first_at),
	id: String(row.id),
	lastAt: String(row.last_at),
	lastMessage: String(row.last_message),
});

const numberOrNull = (value: unknown): number | null =>
	value === null || value === undefined ? null : Number(value);

const toMessage = (row: Row): LoggedMessage => ({
	body: String(row.body),
	createdAt: String(row.created_at),
	customerId: String(row.customer_id),
	direction: row.direction as MessageDirection,
	id: Number(row.id),
	mediaKind: text(row.media_kind),
	turnId: numberOrNull(row.turn_id),
});

const toIgnoredMessage = (row: Row): IgnoredMessage => ({
	body: String(row.body),
	category: row.category as IgnoreCategory,
	contactId: String(row.contact_id),
	createdAt: String(row.created_at),
	id: Number(row.id),
	mediaKind: text(row.media_kind),
	turnId: numberOrNull(row.turn_id),
});

const parseTools = (value: unknown): string[] => {
	try {
		const parsed: unknown = JSON.parse(String(value ?? "[]"));
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
};

const toTurn = (row: Row): TurnRecord => ({
	attempts: Number(row.attempts),
	chatId: String(row.chat_id),
	contactId: String(row.contact_id),
	error: text(row.error),
	finishedAt: text(row.finished_at),
	gate:
		row.gate_category === null || row.gate_category === undefined
			? null
			: {
					category: String(row.gate_category),
					confidence: Number(row.gate_confidence),
					replyProbability: Number(row.gate_reply_probability),
					source: String(row.gate_source),
				},
	id: Number(row.id),
	inboundCount: Number(row.inbound_count),
	latencyMs: numberOrNull(row.latency_ms),
	model: text(row.model),
	outcome: String(row.outcome),
	replyCount: Number(row.reply_count),
	startedAt: String(row.started_at),
	tools: parseTools(row.tools),
	usage: {
		inputTokens: numberOrNull(row.input_tokens),
		outputTokens: numberOrNull(row.output_tokens),
		reasoningTokens: numberOrNull(row.reasoning_tokens),
		totalTokens: numberOrNull(row.total_tokens),
	},
});

const parseDetail = (value: unknown): Record<string, unknown> => {
	try {
		const parsed: unknown = JSON.parse(String(value ?? "{}"));
		return typeof parsed === "object" && parsed !== null
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
};

export type StageChangeResult =
	| { applied: true; from: LeadStage; to: LeadStage }
	| { applied: false; current: LeadStage; reason: string };

/**
 * Angel's CRM: one row per WhatsApp customer, an event log for the funnel
 * (demo sent, objections, commercial signals, hand-offs) and the transcript.
 * Uses Node's built-in SQLite so it needs no extra dependency.
 */
export class CrmRepository {
	private readonly db: DatabaseSync;
	private readonly now: () => Date;

	constructor(path: string, now: () => Date = () => new Date()) {
		if (path !== ":memory:") {
			mkdirSync(dirname(path), { recursive: true });
		}
		this.db = new DatabaseSync(path);
		this.db.exec("PRAGMA journal_mode = WAL;");
		this.db.exec("PRAGMA foreign_keys = ON;");
		this.db.exec(SCHEMA);
		this.migrate();
		this.now = now;
	}

	private migrate(): void {
		for (const migration of MIGRATIONS) {
			const columns = this.db
				.prepare(`PRAGMA table_info(${migration.table})`)
				.all() as Row[];
			if (!columns.some((column) => column.name === migration.column)) {
				this.db.exec(migration.sql);
			}
		}
		this.db.exec(
			"CREATE INDEX IF NOT EXISTS messages_turn ON messages(turn_id)"
		);
	}

	close(): void {
		this.db.close();
	}

	private stamp(): string {
		return this.now().toISOString();
	}

	get(id: string): Customer | undefined {
		const row = this.db
			.prepare("SELECT * FROM customers WHERE id = ?")
			.get(id) as Row | undefined;
		return row ? toCustomer(row) : undefined;
	}

	/** Creates the customer on first contact and records the inbound touch. */
	touchInbound(input: {
		chatId: string;
		displayName?: string | null;
		id: string;
		text: string;
	}): { created: boolean; customer: Customer } {
		const existing = this.get(input.id);
		const at = this.stamp();
		if (existing) {
			this.db
				.prepare(
					"UPDATE customers SET last_inbound_at = ?, updated_at = ?, display_name = COALESCE(?, display_name), chat_id = ? WHERE id = ?"
				)
				.run(at, at, input.displayName ?? null, input.chatId, input.id);
			return { created: false, customer: this.get(input.id) as Customer };
		}
		this.db
			.prepare(
				"INSERT INTO customers (id, chat_id, display_name, first_message, created_at, updated_at, last_inbound_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
			)
			.run(
				input.id,
				input.chatId,
				input.displayName ?? null,
				input.text.slice(0, 1000),
				at,
				at,
				at
			);
		return { created: true, customer: this.get(input.id) as Customer };
	}

	touchOutbound(id: string): void {
		const at = this.stamp();
		this.db
			.prepare(
				"UPDATE customers SET last_outbound_at = ?, updated_at = ? WHERE id = ?"
			)
			.run(at, at, id);
	}

	updateProfile(id: string, patch: ProfilePatch): Customer | undefined {
		const entries = Object.entries(patch).filter(
			([key, value]) => key in PROFILE_COLUMNS && value !== undefined
		) as [keyof ProfilePatch, string | null][];
		if (entries.length === 0) {
			return this.get(id);
		}
		const sets = entries.map(([key]) => `${PROFILE_COLUMNS[key]} = ?`);
		const values = entries.map(([, value]) =>
			typeof value === "string" ? value.trim().slice(0, 300) : value
		);
		this.db
			.prepare(
				`UPDATE customers SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`
			)
			.run(...values, this.stamp(), id);
		return this.get(id);
	}

	appendNote(id: string, note: string): void {
		const customer = this.get(id);
		if (!customer) {
			return;
		}
		const line = `[${this.stamp().slice(0, 16)}] ${note.trim()}`;
		const notes = customer.notes ? `${customer.notes}\n${line}` : line;
		this.db
			.prepare("UPDATE customers SET notes = ?, updated_at = ? WHERE id = ?")
			.run(notes.slice(-MAX_NOTES_LENGTH), this.stamp(), id);
	}

	/**
	 * Moves a lead through the funnel. The agent may only move forward along
	 * the progress stages or mark a lead as not a fit; won, lost and closed are
	 * owner decisions and are never overwritten by the agent.
	 */
	setStage(
		id: string,
		stage: LeadStage,
		options: { by: "agent" | "owner"; reason?: string }
	): StageChangeResult {
		const customer = this.get(id);
		if (!customer) {
			return { applied: false, current: "new", reason: "unknown customer" };
		}
		const from = customer.stage;
		if (from === stage) {
			return { applied: false, current: from, reason: "already at stage" };
		}
		if (options.by === "agent") {
			if (
				OWNER_ONLY_STAGES.includes(from) ||
				OWNER_ONLY_STAGES.includes(stage)
			) {
				return {
					applied: false,
					current: from,
					reason: "won, lost and closed are set by the owner",
				};
			}
			const fromRank = PROGRESS_STAGES.indexOf(from);
			const toRank = PROGRESS_STAGES.indexOf(stage);
			if (from === "not_a_fit" && toRank >= 0) {
				// A lead can come back into the funnel, e.g. a dealer's second number.
			} else if (toRank >= 0 && fromRank > toRank) {
				return {
					applied: false,
					current: from,
					reason: "stages only move forward",
				};
			}
		}
		const at = this.stamp();
		this.db
			.prepare("UPDATE customers SET stage = ?, updated_at = ? WHERE id = ?")
			.run(stage, at, id);
		if (stage === "demo_sent" && !customer.demoSentAt) {
			this.db
				.prepare("UPDATE customers SET demo_sent_at = ? WHERE id = ?")
				.run(at, id);
		}
		this.recordEvent(id, "stage_changed", {
			by: options.by,
			from,
			reason: options.reason ?? null,
			to: stage,
		});
		return { applied: true, from, to: stage };
	}

	markDemoSent(id: string): void {
		const customer = this.get(id);
		if (!customer) {
			return;
		}
		if (!customer.demoSentAt) {
			this.db
				.prepare(
					"UPDATE customers SET demo_sent_at = ?, updated_at = ? WHERE id = ?"
				)
				.run(this.stamp(), this.stamp(), id);
		}
		this.recordEvent(id, "demo_sent", {});
		const rank = PROGRESS_STAGES.indexOf(customer.stage);
		if (rank >= 0 && rank < PROGRESS_STAGES.indexOf("demo_sent")) {
			this.setStage(id, "demo_sent", {
				by: "agent",
				reason: "demo link shared",
			});
		}
	}

	setOptedOut(id: string, optedOut: boolean): void {
		this.db
			.prepare(
				"UPDATE customers SET opted_out = ?, updated_at = ? WHERE id = ?"
			)
			.run(optedOut ? 1 : 0, this.stamp(), id);
		this.recordEvent(id, optedOut ? "opted_out" : "opted_in", {});
	}

	setHumanTakeover(id: string, until: Date | null, by: string): void {
		this.db
			.prepare(
				"UPDATE customers SET human_takeover_until = ?, updated_at = ? WHERE id = ?"
			)
			.run(until ? until.toISOString() : null, this.stamp(), id);
		this.recordEvent(id, until ? "human_takeover" : "agent_resumed", {
			by,
			until: until?.toISOString() ?? null,
		});
	}

	isHumanActive(customer: Customer): boolean {
		return (
			customer.humanTakeoverUntil !== null &&
			new Date(customer.humanTakeoverUntil).getTime() > this.now().getTime()
		);
	}

	recordEvent(
		id: string,
		type: EventType,
		detail: Record<string, unknown>
	): void {
		this.db
			.prepare(
				"INSERT INTO events (customer_id, type, detail, created_at) VALUES (?, ?, ?, ?)"
			)
			.run(id, type, JSON.stringify(detail), this.stamp());
	}

	events(id: string, limit = 20): CrmEvent[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM events WHERE customer_id = ? ORDER BY id DESC LIMIT ?"
			)
			.all(id, limit) as Row[];
		return rows.reverse().map((row) => ({
			createdAt: String(row.created_at),
			customerId: String(row.customer_id),
			detail: parseDetail(row.detail),
			id: Number(row.id),
			type: row.type as EventType,
		}));
	}

	logMessage(
		id: string,
		direction: MessageDirection,
		body: string,
		mediaKind: string | null = null,
		turnId: number | null = null
	): void {
		this.db
			.prepare(
				"INSERT INTO messages (customer_id, direction, body, media_kind, turn_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
			)
			.run(id, direction, body.slice(0, 4000), mediaKind, turnId, this.stamp());
	}

	messages(id: string, limit = 30): LoggedMessage[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM messages WHERE customer_id = ? ORDER BY id DESC LIMIT ?"
			)
			.all(id, limit) as Row[];
		return rows.reverse().map(toMessage);
	}

	/** Messages logged after a point in time, e.g. while a human had the chat. */
	messagesSince(id: string, since: string): LoggedMessage[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM messages WHERE customer_id = ? AND created_at > ? ORDER BY id"
			)
			.all(id, since) as Row[];
		return rows.map(toMessage);
	}

	/** Agent replies to this customer within the last `windowMs`. */
	countRecentReplies(id: string, windowMs: number): number {
		const since = new Date(this.now().getTime() - windowMs).toISOString();
		const row = this.db
			.prepare(
				"SELECT COUNT(*) AS n FROM messages WHERE customer_id = ? AND direction = 'out' AND created_at > ?"
			)
			.get(id, since) as Row;
		return Number(row.n);
	}

	list(options: { limit?: number; stage?: LeadStage } = {}): Customer[] {
		const limit = options.limit ?? 50;
		const rows = (
			options.stage
				? this.db
						.prepare(
							"SELECT * FROM customers WHERE stage = ? ORDER BY updated_at DESC LIMIT ?"
						)
						.all(options.stage, limit)
				: this.db
						.prepare("SELECT * FROM customers ORDER BY updated_at DESC LIMIT ?")
						.all(limit)
		) as Row[];
		return rows.map(toCustomer);
	}

	/** Records a message Angel chose not to answer (spam, personal, wrong number). */
	recordIgnored(input: {
		category: IgnoreCategory;
		chatId: string;
		confidence: number;
		displayName?: string | null;
		id: string;
		text: string;
	}): void {
		const at = this.stamp();
		this.db
			.prepare(
				`INSERT INTO ignored_contacts (id, chat_id, display_name, category, confidence, last_message, first_at, last_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET category = excluded.category, confidence = excluded.confidence,
					last_message = excluded.last_message, last_at = excluded.last_at, count = count + 1,
					display_name = COALESCE(excluded.display_name, display_name)`
			)
			.run(
				input.id,
				input.chatId,
				input.displayName ?? null,
				input.category,
				input.confidence,
				input.text.slice(0, 500),
				at,
				at
			);
	}

	/** Keeps the full text of every message Angel stayed silent on. */
	logIgnoredMessage(input: {
		body: string;
		category: IgnoreCategory;
		contactId: string;
		mediaKind?: string | null;
		turnId?: number | null;
	}): void {
		this.db
			.prepare(
				"INSERT INTO ignored_messages (contact_id, turn_id, category, body, media_kind, created_at) VALUES (?, ?, ?, ?, ?, ?)"
			)
			.run(
				input.contactId,
				input.turnId ?? null,
				input.category,
				input.body.slice(0, 4000),
				input.mediaKind ?? null,
				this.stamp()
			);
	}

	ignoredMessages(contactId: string, limit = 50): IgnoredMessage[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM ignored_messages WHERE contact_id = ? ORDER BY id DESC LIMIT ?"
			)
			.all(contactId, limit) as Row[];
		return rows.reverse().map(toIgnoredMessage);
	}

	getIgnored(id: string): IgnoredContact | undefined {
		const row = this.db
			.prepare("SELECT * FROM ignored_contacts WHERE id = ?")
			.get(id) as Row | undefined;
		return row ? toIgnored(row) : undefined;
	}

	listIgnored(limit = 20): IgnoredContact[] {
		return (
			this.db
				.prepare("SELECT * FROM ignored_contacts ORDER BY last_at DESC LIMIT ?")
				.all(limit) as Row[]
		).map(toIgnored);
	}

	/** Owner override: Angel always replies to this contact from now on. */
	allowContact(id: string): boolean {
		const result = this.db
			.prepare("UPDATE ignored_contacts SET allowed = 1 WHERE id = ?")
			.run(id);
		return Number(result.changes) > 0;
	}

	/** Forgets an ignore decision once a contact turns out to be a real lead. */
	clearIgnored(id: string): void {
		this.db.prepare("DELETE FROM ignored_contacts WHERE id = ?").run(id);
	}

	/** Opens a turn for a batch of inbound messages; close it with finishTurn. */
	startTurn(input: {
		chatId: string;
		contactId: string;
		inboundCount: number;
	}): number {
		const result = this.db
			.prepare(
				"INSERT INTO turns (contact_id, chat_id, inbound_count, started_at) VALUES (?, ?, ?, ?)"
			)
			.run(input.contactId, input.chatId, input.inboundCount, this.stamp());
		return Number(result.lastInsertRowid);
	}

	finishTurn(id: number, finish: TurnFinish): void {
		const started = this.db
			.prepare("SELECT started_at FROM turns WHERE id = ?")
			.get(id) as Row | undefined;
		if (!started) {
			return;
		}
		const finishedAt = this.now();
		const latencyMs = Math.max(
			0,
			finishedAt.getTime() - new Date(String(started.started_at)).getTime()
		);
		const { gate, usage } = finish;
		this.db
			.prepare(
				`UPDATE turns SET outcome = ?, reply_count = ?, gate_category = ?, gate_confidence = ?,
					gate_reply_probability = ?, gate_source = ?, model = ?, input_tokens = ?, output_tokens = ?,
					reasoning_tokens = ?, total_tokens = ?, tools = ?, attempts = ?, error = ?, latency_ms = ?,
					finished_at = ? WHERE id = ?`
			)
			.run(
				finish.outcome,
				finish.replyCount,
				gate?.category ?? null,
				gate?.confidence ?? null,
				gate?.replyProbability ?? null,
				gate?.source ?? null,
				finish.model ?? null,
				usage?.inputTokens ?? null,
				usage?.outputTokens ?? null,
				usage?.reasoningTokens ?? null,
				usage?.totalTokens ?? null,
				JSON.stringify(finish.tools ?? []),
				finish.attempts ?? 0,
				finish.error?.slice(0, 1000) ?? null,
				latencyMs,
				finishedAt.toISOString(),
				id
			);
	}

	turn(id: number): TurnRecord | undefined {
		const row = this.db.prepare("SELECT * FROM turns WHERE id = ?").get(id) as
			| Row
			| undefined;
		return row ? toTurn(row) : undefined;
	}

	/** Most recent turns first, for one contact or across everyone. */
	turns(options: { contactId?: string; limit?: number } = {}): TurnRecord[] {
		const limit = options.limit ?? 50;
		const rows = (
			options.contactId
				? this.db
						.prepare(
							"SELECT * FROM turns WHERE contact_id = ? ORDER BY id DESC LIMIT ?"
						)
						.all(options.contactId, limit)
				: this.db
						.prepare("SELECT * FROM turns ORDER BY id DESC LIMIT ?")
						.all(limit)
		) as Row[];
		return rows.map(toTurn);
	}

	/** Volume, latency and token totals across every turn. */
	turnStats(): TurnStats {
		const byOutcome: Record<string, number> = {};
		for (const row of this.db
			.prepare("SELECT outcome, COUNT(*) AS n FROM turns GROUP BY outcome")
			.all() as Row[]) {
			byOutcome[String(row.outcome)] = Number(row.n);
		}
		const totals = this.db
			.prepare(
				`SELECT COUNT(*) AS total, COALESCE(AVG(latency_ms), 0) AS latency,
					COALESCE(SUM(input_tokens), 0) AS input, COALESCE(SUM(output_tokens), 0) AS output,
					COALESCE(SUM(total_tokens), 0) AS tokens FROM turns`
			)
			.get() as Row;
		const messageCount = (direction: MessageDirection) =>
			Number(
				(
					this.db
						.prepare("SELECT COUNT(*) AS n FROM messages WHERE direction = ?")
						.get(direction) as Row
				).n
			);
		return {
			averageLatencyMs: Math.round(Number(totals.latency)),
			byOutcome,
			inputTokens: Number(totals.input),
			messagesIn: messageCount("in"),
			messagesOut: messageCount("out"),
			outputTokens: Number(totals.output),
			total: Number(totals.total),
			totalTokens: Number(totals.tokens),
		};
	}

	countWonDealerships(): number {
		const row = this.db
			.prepare(
				"SELECT COUNT(*) AS n FROM customers WHERE stage = 'won' AND business_type = 'car_dealership'"
			)
			.get() as Row;
		return Number(row.n);
	}

	/** Funnel counts for the validation record (docs/plan.md §8). */
	stats(): {
		byStage: Record<string, number>;
		dealerships: number;
		demosSent: number;
		ignored: number;
		objections: Record<string, number>;
		total: number;
	} {
		const byStage: Record<string, number> = {};
		for (const row of this.db
			.prepare("SELECT stage, COUNT(*) AS n FROM customers GROUP BY stage")
			.all() as Row[]) {
			byStage[String(row.stage)] = Number(row.n);
		}
		const objections: Record<string, number> = {};
		for (const row of this.db
			.prepare("SELECT detail FROM events WHERE type = 'objection'")
			.all() as Row[]) {
			const kind = String(parseDetail(row.detail).kind ?? "other");
			objections[kind] = (objections[kind] ?? 0) + 1;
		}
		const count = (sql: string) =>
			Number((this.db.prepare(sql).get() as Row).n);
		return {
			byStage,
			dealerships: count(
				"SELECT COUNT(*) AS n FROM customers WHERE business_type = 'car_dealership'"
			),
			demosSent: count(
				"SELECT COUNT(*) AS n FROM customers WHERE demo_sent_at IS NOT NULL"
			),
			ignored: count(
				"SELECT COUNT(*) AS n FROM ignored_contacts WHERE allowed = 0"
			),
			objections,
			total: count("SELECT COUNT(*) AS n FROM customers"),
		};
	}

	/** CSV export for the campaign tracking record. */
	toCsv(): string {
		const columns: (keyof Customer)[] = [
			"id",
			"displayName",
			"name",
			"businessName",
			"businessType",
			"otherBusinessType",
			"vehicleTypes",
			"location",
			"hasWebsite",
			"websiteUrl",
			"currentChannels",
			"isDecisionMaker",
			"stage",
			"demoSentAt",
			"firstMessage",
			"optedOut",
			"createdAt",
			"lastInboundAt",
			"notes",
		];
		const csvCell = (value: unknown) => {
			const raw = value === null || value === undefined ? "" : String(value);
			return CSV_NEEDS_QUOTES.test(raw)
				? `"${raw.replace(DOUBLE_QUOTE, '""')}"`
				: raw;
		};
		const lines = this.list({ limit: 10_000 }).map((customer) =>
			columns.map((column) => csvCell(customer[column])).join(",")
		);
		return [columns.join(","), ...lines].join("\n");
	}
}
