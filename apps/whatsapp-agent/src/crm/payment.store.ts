import type { DatabaseSync } from "node:sqlite";

import {
	FINAL_PAYMENT_STATUSES,
	type Payment,
	type PaymentKind,
	type PaymentMethod,
	type PaymentStatus,
} from "./crm.types.js";

type Row = Record<string, unknown>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS payments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	customer_id TEXT NOT NULL REFERENCES customers(id),
	kind TEXT NOT NULL,
	amount_usd REAL NOT NULL,
	method TEXT NOT NULL,
	phone TEXT NOT NULL,
	reference TEXT NOT NULL UNIQUE,
	status TEXT NOT NULL DEFAULT 'created',
	provider_status TEXT,
	paynow_reference TEXT,
	poll_url TEXT,
	instructions TEXT,
	error TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	paid_at TEXT
);
CREATE INDEX IF NOT EXISTS payments_customer ON payments(customer_id, id);
CREATE INDEX IF NOT EXISTS payments_status ON payments(status);
`;

const KIND_CODES: Record<PaymentKind, string> = {
	balance: "BAL",
	deposit: "DEP",
};

const text = (value: unknown): string | null =>
	typeof value === "string" && value.length > 0 ? value : null;

const toPayment = (row: Row): Payment => ({
	amountUsd: Number(row.amount_usd),
	createdAt: String(row.created_at),
	customerId: String(row.customer_id),
	error: text(row.error),
	id: Number(row.id),
	instructions: text(row.instructions),
	kind: row.kind as PaymentKind,
	method: row.method as PaymentMethod,
	paidAt: text(row.paid_at),
	paynowReference: text(row.paynow_reference),
	phone: String(row.phone),
	pollUrl: text(row.poll_url),
	providerStatus: text(row.provider_status),
	reference: String(row.reference),
	status: row.status as PaymentStatus,
	updatedAt: String(row.updated_at),
});

export interface PaymentUpdate {
	error?: string | null;
	instructions?: string | null;
	paynowReference?: string | null;
	pollUrl?: string | null;
	providerStatus?: string | null;
	status: PaymentStatus;
}

/**
 * Paynow payments taken in WhatsApp, stored next to the CRM in the same
 * SQLite database. A payment only ever moves to a final status once.
 */
export class PaymentStore {
	private readonly db: DatabaseSync;
	private readonly now: () => Date;

	constructor(db: DatabaseSync, now: () => Date = () => new Date()) {
		this.db = db;
		this.now = now;
		this.db.exec(SCHEMA);
	}

	/** Records a new payment with a unique reference such as WTA-2637…-DEP-2. */
	create(input: {
		amountUsd: number;
		customerId: string;
		kind: PaymentKind;
		method: PaymentMethod;
		phone: string;
	}): Payment {
		const at = this.now().toISOString();
		const attempt =
			Number(
				(
					this.db
						.prepare(
							"SELECT COUNT(*) AS n FROM payments WHERE customer_id = ? AND kind = ?"
						)
						.get(input.customerId, input.kind) as Row
				).n
			) + 1;
		const reference = `WTA-${input.customerId}-${KIND_CODES[input.kind]}-${attempt}`;
		const result = this.db
			.prepare(
				"INSERT INTO payments (customer_id, kind, amount_usd, method, phone, reference, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
			)
			.run(
				input.customerId,
				input.kind,
				input.amountUsd,
				input.method,
				input.phone,
				reference,
				at,
				at
			);
		return this.byId(Number(result.lastInsertRowid)) as Payment;
	}

	byId(id: number): Payment | undefined {
		const row = this.db
			.prepare("SELECT * FROM payments WHERE id = ?")
			.get(id) as Row | undefined;
		return row ? toPayment(row) : undefined;
	}

	byReference(reference: string): Payment | undefined {
		const row = this.db
			.prepare("SELECT * FROM payments WHERE reference = ?")
			.get(reference) as Row | undefined;
		return row ? toPayment(row) : undefined;
	}

	/**
	 * Applies a status update. Returns the updated payment, or undefined when
	 * the payment was already final (so callers act on each outcome once).
	 */
	update(id: number, update: PaymentUpdate): Payment | undefined {
		const current = this.byId(id);
		if (!current || FINAL_PAYMENT_STATUSES.includes(current.status)) {
			return undefined;
		}
		const at = this.now().toISOString();
		this.db
			.prepare(
				`UPDATE payments SET status = ?, provider_status = COALESCE(?, provider_status),
					paynow_reference = COALESCE(?, paynow_reference), poll_url = COALESCE(?, poll_url),
					instructions = COALESCE(?, instructions), error = COALESCE(?, error), updated_at = ?,
					paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END WHERE id = ?`
			)
			.run(
				update.status,
				update.providerStatus ?? null,
				update.paynowReference ?? null,
				update.pollUrl ?? null,
				update.instructions ?? null,
				update.error ?? null,
				at,
				update.status,
				at,
				id
			);
		return this.byId(id);
	}

	/** Newest first. */
	forCustomer(customerId: string, kind?: PaymentKind): Payment[] {
		const rows = (
			kind
				? this.db
						.prepare(
							"SELECT * FROM payments WHERE customer_id = ? AND kind = ? ORDER BY id DESC"
						)
						.all(customerId, kind)
				: this.db
						.prepare(
							"SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC"
						)
						.all(customerId)
		) as Row[];
		return rows.map(toPayment);
	}

	latest(customerId: string, kind: PaymentKind): Payment | undefined {
		return this.forCustomer(customerId, kind)[0];
	}

	/** Payments still waiting on the customer, e.g. to resume polling after a restart. */
	pending(): Payment[] {
		return (
			this.db
				.prepare(
					"SELECT * FROM payments WHERE status IN ('created', 'sent') ORDER BY id"
				)
				.all() as Row[]
		).map(toPayment);
	}

	recent(limit = 50): Payment[] {
		return (
			this.db
				.prepare("SELECT * FROM payments ORDER BY id DESC LIMIT ?")
				.all(limit) as Row[]
		).map(toPayment);
	}

	totals(): { paidCount: number; paidUsd: number } {
		const row = this.db
			.prepare(
				"SELECT COUNT(*) AS n, COALESCE(SUM(amount_usd), 0) AS total FROM payments WHERE status = 'paid'"
			)
			.get() as Row;
		return { paidCount: Number(row.n), paidUsd: Number(row.total) };
	}
}
