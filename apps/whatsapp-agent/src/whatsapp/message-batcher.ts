/**
 * Groups messages per chat and flushes them after a quiet period, so a
 * customer who sends "Hi" / "I saw your ad" / "how much?" in quick succession
 * gets one considered reply instead of three.
 */
export class MessageBatcher<T> {
	private readonly pending = new Map<
		string,
		{ items: T[]; timer: ReturnType<typeof setTimeout> }
	>();
	private readonly delayMs: number;
	private readonly flush: (key: string, items: T[]) => void;

	constructor(delayMs: number, flush: (key: string, items: T[]) => void) {
		this.delayMs = delayMs;
		this.flush = flush;
	}

	add(key: string, item: T): void {
		const existing = this.pending.get(key);
		if (existing) {
			clearTimeout(existing.timer);
		}
		const items = [...(existing?.items ?? []), item];
		const timer = setTimeout(() => {
			this.pending.delete(key);
			this.flush(key, items);
		}, this.delayMs);
		this.pending.set(key, { items, timer });
	}

	clear(): void {
		for (const { timer } of this.pending.values()) {
			clearTimeout(timer);
		}
		this.pending.clear();
	}
}

const ECHO_WINDOW_MS = 2 * 60 * 1000;

/**
 * Remembers what Angel just sent in each chat. WhatsApp reports every sent
 * message as "message_create", including Angel's own; anything that is not an
 * echo was typed by a person on the business phone.
 */
export class EchoTracker {
	private readonly sent = new Map<string, { at: number; body: string }[]>();
	private readonly now: () => number;

	constructor(now: () => number = Date.now) {
		this.now = now;
	}

	remember(chatId: string, body: string): void {
		const fresh = this.recent(chatId);
		fresh.push({ at: this.now(), body: body.trim() });
		this.sent.set(chatId, fresh);
	}

	/** True (and forgotten) when this body was just sent by Angel. */
	consume(chatId: string, body: string): boolean {
		const fresh = this.recent(chatId);
		const index = fresh.findIndex((entry) => entry.body === body.trim());
		if (index === -1) {
			this.sent.set(chatId, fresh);
			return false;
		}
		fresh.splice(index, 1);
		this.sent.set(chatId, fresh);
		return true;
	}

	private recent(chatId: string) {
		const cutoff = this.now() - ECHO_WINDOW_MS;
		return (this.sent.get(chatId) ?? []).filter((entry) => entry.at > cutoff);
	}
}
