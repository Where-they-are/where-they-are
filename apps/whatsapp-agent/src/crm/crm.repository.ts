import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
	type BusinessType,
	type CrmEvent,
	type Customer,
	type EventType,
	type LeadStage,
	type LoggedMessage,
	type MessageDirection,
	OWNER_ONLY_STAGES,
	PROGRESS_STAGES,
	type ProfilePatch,
	type TriState,
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
`;

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
		this.now = now;
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
		mediaKind: string | null = null
	): void {
		this.db
			.prepare(
				"INSERT INTO messages (customer_id, direction, body, media_kind, created_at) VALUES (?, ?, ?, ?, ?)"
			)
			.run(id, direction, body.slice(0, 4000), mediaKind, this.stamp());
	}

	messages(id: string, limit = 30): LoggedMessage[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM messages WHERE customer_id = ? ORDER BY id DESC LIMIT ?"
			)
			.all(id, limit) as Row[];
		return rows.reverse().map((row) => ({
			body: String(row.body),
			createdAt: String(row.created_at),
			customerId: String(row.customer_id),
			direction: row.direction as MessageDirection,
			id: Number(row.id),
			mediaKind: text(row.media_kind),
		}));
	}

	/** Messages logged after a point in time, e.g. while a human had the chat. */
	messagesSince(id: string, since: string): LoggedMessage[] {
		const rows = this.db
			.prepare(
				"SELECT * FROM messages WHERE customer_id = ? AND created_at > ? ORDER BY id"
			)
			.all(id, since) as Row[];
		return rows.map((row) => ({
			body: String(row.body),
			createdAt: String(row.created_at),
			customerId: String(row.customer_id),
			direction: row.direction as MessageDirection,
			id: Number(row.id),
			mediaKind: text(row.media_kind),
		}));
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
