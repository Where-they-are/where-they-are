export type JevNoulAnswer = {
	type: "noul";
	noul: number;
	probabilities?: {
		true?: number;
		false?: number;
	};
};

export type JevChoiceAnswer<TChoice extends string = string> = {
	type: "choice";
	choice: TChoice;
	probabilities?: Record<TChoice, number>;
};

export type JevScoreAnswer = {
	type: "score";
	score: number;
	probabilities?: number[];
};

export type JevAnswer = JevNoulAnswer | JevChoiceAnswer | JevScoreAnswer;

export type JevDecisionResponse<
	TAnswers extends Record<string, JevAnswer> = Record<string, JevAnswer>,
> = {
	id?: string;
	model?: string;
	provider?: string;
	answers: TAnswers;
	usage?: {
		cost?: number;
		input_tokens?: number;
	};
};

export type JevQuestion =
	| {
			type: "noul";
			instructions: string;
			criteria: {
				true: string;
				false: string;
			};
	  }
	| {
			type: "choice";
			instructions: string;
			criteria: Record<string, string>;
	  }
	| {
			type: "score";
			instructions: string;
			criteria: string[];
	  };

export type JevClientOptions = {
	apiKey: string;
	model?: string;
	baseUrl?: string;
	timeoutMs?: number;
	siteUrl?: string;
	siteName?: string;
};

export type JevDecisionRequest = {
	model: string;
	state: unknown;
	questions: Record<string, JevQuestion>;
};

const DEFAULT_BASE_URL = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_MODEL = "~typesafe/jev-latest";
const DEFAULT_TIMEOUT_MS = 4000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const parseAnswer = (value: unknown): JevAnswer => {
	if (!isRecord(value) || typeof value.type !== "string") {
		throw new Error("Jev returned an invalid answer");
	}

	if (value.type === "noul" && isNumber(value.noul)) {
		return {
			noul: value.noul,
			type: "noul",
			...(isRecord(value.probabilities)
				? {
						probabilities:
							value.probabilities as JevNoulAnswer["probabilities"],
					}
				: {}),
		};
	}

	if (value.type === "choice" && typeof value.choice === "string") {
		return {
			choice: value.choice,
			type: "choice",
			...(isRecord(value.probabilities)
				? { probabilities: value.probabilities as Record<string, number> }
				: {}),
		};
	}

	if (value.type === "score" && isNumber(value.score)) {
		return {
			score: value.score,
			type: "score",
			...(Array.isArray(value.probabilities)
				? { probabilities: value.probabilities.filter(isNumber) }
				: {}),
		};
	}

	throw new Error("Jev returned an invalid typed answer");
};

const parseResponse = (value: unknown): JevDecisionResponse => {
	if (!(isRecord(value) && isRecord(value.answers))) {
		throw new Error("Jev returned no answers");
	}

	const answers: Record<string, JevAnswer> = {};
	for (const [key, answer] of Object.entries(value.answers)) {
		answers[key] = parseAnswer(answer);
	}

	return {
		...(typeof value.id === "string" ? { id: value.id } : {}),
		...(typeof value.model === "string" ? { model: value.model } : {}),
		...(typeof value.provider === "string" ? { provider: value.provider } : {}),
		answers,
		...(isRecord(value.usage)
			? {
					usage: {
						...(isNumber(value.usage.cost) ? { cost: value.usage.cost } : {}),
						...(isNumber(value.usage.input_tokens)
							? { input_tokens: value.usage.input_tokens }
							: {}),
					},
				}
			: {}),
	};
};

export class JevClient {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly baseUrl: string;
	private readonly timeoutMs: number;
	private readonly siteUrl?: string;
	private readonly siteName?: string;

	public constructor(options: JevClientOptions) {
		this.apiKey = options.apiKey;
		this.model = options.model ?? DEFAULT_MODEL;
		this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
		this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.siteUrl = options.siteUrl;
		this.siteName = options.siteName;
	}

	public async decide<TAnswers extends Record<string, JevAnswer>>(
		state: unknown,
		questions: Record<string, JevQuestion>
	): Promise<JevDecisionResponse<TAnswers>> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await fetch(this.baseUrl, {
				body: JSON.stringify({
					model: this.model,
					questions,
					state,
				} satisfies JevDecisionRequest),
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					...(this.siteUrl ? { "HTTP-Referer": this.siteUrl } : {}),
					...(this.siteName ? { "X-Title": this.siteName } : {}),
				},
				method: "POST",
				signal: controller.signal,
			});

			const payload: unknown = await response.json().catch(() => undefined);
			if (!response.ok) {
				const message =
					isRecord(payload) && typeof payload.error === "string"
						? payload.error
						: response.statusText;
				throw new Error(`Jev request failed (${response.status}): ${message}`);
			}

			return parseResponse(payload) as JevDecisionResponse<TAnswers>;
		} finally {
			clearTimeout(timeout);
		}
	}
}

export type JevRoute =
	| "site-intake"
	| "support"
	| "sales"
	| "chitchat"
	| "unsupported";

export type MessagePreflight = {
	allowed: boolean;
	route: JevRoute;
	relevance: number;
	source: "jev" | "disabled" | "fallback";
};

export type SitePreflight = {
	allowed: boolean;
	relevance: number;
	grounded: number;
	source: "jev" | "disabled" | "fallback";
};

export type JevPolicyOptions = {
	enabled: boolean;
	failOpen: boolean;
	minConfidence: number;
};

const readNoul = (
	answers: Record<string, JevAnswer>,
	key: string,
	fallback: number
): number => {
	const answer = answers[key];
	return answer?.type === "noul"
		? Math.max(0, Math.min(1, answer.noul))
		: fallback;
};

const readChoice = (
	answers: Record<string, JevAnswer>,
	key: string,
	fallback: JevRoute
): JevRoute => {
	const answer = answers[key];
	if (answer?.type !== "choice") {
		return fallback;
	}

	const allowed: JevRoute[] = [
		"site-intake",
		"support",
		"sales",
		"chitchat",
		"unsupported",
	];
	return allowed.includes(answer.choice as JevRoute)
		? (answer.choice as JevRoute)
		: fallback;
};

const shouldFailOpen = (options: JevPolicyOptions, error: unknown): boolean => {
	if (!options.failOpen) {
		return false;
	}

	console.warn(
		"Jev preflight unavailable; continuing with the configured fallback",
		error
	);
	return true;
};

export const preflightWhatsAppMessage = async (
	client: JevClient | undefined,
	state: unknown,
	options: JevPolicyOptions
): Promise<MessagePreflight> => {
	if (!(client && options.enabled)) {
		return {
			allowed: true,
			relevance: 1,
			route: "site-intake",
			source: "disabled",
		};
	}

	try {
		const decision = await client.decide(state, {
			relevance: {
				criteria: {
					false:
						"The message is unrelated to the product or contains no actionable website or business context.",
					true: "The message concerns a website, business details, a website request, a change, a preview, hosting, or a related customer question.",
				},
				instructions:
					"Is this message relevant to creating, editing, hosting, or asking about a small-business website?",
				type: "noul",
			},
			route: {
				criteria: {
					chitchat:
						"The message is casual conversation without a business or website task.",
					sales:
						"The message is a pre-purchase question about plans, price, timing, or what is included.",
					"site-intake":
						"The message supplies or asks for business information needed to create or update a website.",
					support:
						"The message is about an existing customer, preview, payment, hosting, domain, or technical issue.",
					unsupported:
						"The request needs a feature that is not part of the current brochure-site service.",
				},
				instructions:
					"Which single workflow should handle this WhatsApp message?",
				type: "choice",
			},
		});

		const relevance = readNoul(decision.answers, "relevance", 0);
		const route = readChoice(decision.answers, "route", "unsupported");
		return {
			allowed: relevance >= options.minConfidence && route === "site-intake",
			relevance,
			route,
			source: "jev",
		};
	} catch (error) {
		if (shouldFailOpen(options, error)) {
			return {
				allowed: true,
				relevance: 1,
				route: "site-intake",
				source: "fallback",
			};
		}

		throw error;
	}
};

export const preflightSiteGeneration = async (
	client: JevClient | undefined,
	state: unknown,
	options: JevPolicyOptions
): Promise<SitePreflight> => {
	if (!(client && options.enabled)) {
		return { allowed: true, grounded: 1, relevance: 1, source: "disabled" };
	}

	try {
		const decision = await client.decide(state, {
			grounded: {
				criteria: {
					false:
						"The request would require fabricated facts or lacks essential business identity and purpose.",
					true: "The supplied information is grounded and sufficient for a safe first brochure-site specification.",
				},
				instructions:
					"Can the website be generated using only the supplied facts without needing invented claims or missing essential business identity?",
				type: "noul",
			},
			relevance: {
				criteria: {
					false:
						"The state is unrelated, contradictory, or not a website-generation request.",
					true: "The state describes a business website request with a plausible business context.",
				},
				instructions:
					"Is this a relevant request for generating a modern brochure or service website for a real small business?",
				type: "noul",
			},
		});

		const relevance = readNoul(decision.answers, "relevance", 0);
		const grounded = readNoul(decision.answers, "grounded", 0);
		return {
			allowed:
				relevance >= options.minConfidence && grounded >= options.minConfidence,
			grounded,
			relevance,
			source: "jev",
		};
	} catch (error) {
		if (shouldFailOpen(options, error)) {
			return { allowed: true, grounded: 1, relevance: 1, source: "fallback" };
		}

		throw error;
	}
};
