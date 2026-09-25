import { afterEach, describe, expect, it, vi } from "vitest";

import { EchoTracker, MessageBatcher } from "./message-batcher.js";

afterEach(() => {
	vi.useRealTimers();
});

describe("MessageBatcher", () => {
	it("groups quick messages per chat and flushes after a quiet period", () => {
		vi.useFakeTimers();
		const flushed: [string, string[]][] = [];
		const batcher = new MessageBatcher<string>(3000, (key, items) =>
			flushed.push([key, items])
		);
		batcher.add("a", "Hi");
		vi.advanceTimersByTime(2000);
		batcher.add("a", "How much?");
		batcher.add("b", "Hello");
		vi.advanceTimersByTime(2999);
		expect(flushed).toEqual([]);
		vi.advanceTimersByTime(1);
		expect(flushed).toEqual([
			["a", ["Hi", "How much?"]],
			["b", ["Hello"]],
		]);
	});

	it("drops pending messages when cleared", () => {
		vi.useFakeTimers();
		const flush = vi.fn();
		const batcher = new MessageBatcher<string>(1000, flush);
		batcher.add("a", "Hi");
		batcher.clear();
		vi.advanceTimersByTime(5000);
		expect(flush).not.toHaveBeenCalled();
	});
});

describe("EchoTracker", () => {
	it("recognises Angel's own messages once, and not a person's", () => {
		let now = 0;
		const echoes = new EchoTracker(() => now);
		echoes.remember("chat", "Hi! I'm Angel.");
		expect(echoes.consume("chat", "Hi! I'm Angel. ")).toBe(true);
		expect(echoes.consume("chat", "Hi! I'm Angel.")).toBe(false);
		expect(echoes.consume("chat", "Hi, it's the founder here")).toBe(false);
		echoes.remember("chat", "Old message");
		now = 5 * 60 * 1000;
		expect(echoes.consume("chat", "Old message")).toBe(false);
	});
});
