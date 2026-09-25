import { Agent } from "@mastra/core/agent";
import { ToolCallFilter } from "@mastra/core/processors";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

import { buildInstructions, type TurnContext } from "./instructions.js";
import { type AngelToolDeps, createAngelTools } from "./tools.js";

/** Request-context key holding the live facts for the current turn. */
export const TURN_CONTEXT_KEY = "turn";

/**
 * Angel's own running notes about each customer (Mastra working memory,
 * scoped to the customer so it carries across conversations). Structured
 * lead data lives in the CRM; these are the softer details.
 */
const WORKING_MEMORY_TEMPLATE = `# Angel's notes on this customer
- How they like to communicate:
- What matters most to them:
- Concerns or objections so far:
- What the team has promised or said:
- Anything else worth remembering:
`;

/** Gemini 3 models require reasoning; "minimal" is the lightest setting. */
export type ReasoningEffort = "minimal" | "low" | "medium" | "high";

/**
 * Takes over when the primary model errors or times out. Also a Gemini model,
 * so voice notes and images keep working on the fallback path.
 */
export const FALLBACK_MODEL = "google/gemini-3.5-flash";

export interface AngelOptions extends AngelToolDeps {
	memoryUrl: string;
	model: string;
	reasoningEffort: ReasoningEffort;
}

interface AngelModel {
	maxRetries: number;
	model: string;
	providerOptions: { openrouter: { reasoning: { effort: ReasoningEffort } } };
}

/** Primary model first, then the fallback; Mastra retries each before moving on. */
export const angelModels = (options: {
	model: string;
	reasoningEffort: ReasoningEffort;
}): AngelModel[] =>
	[options.model, FALLBACK_MODEL]
		.filter((model, index, all) => all.indexOf(model) === index)
		.map((model) => ({
			maxRetries: 1,
			model: `openrouter/${model}`,
			providerOptions: {
				openrouter: { reasoning: { effort: options.reasoningEffort } },
			},
		}));

export const createAngelMemory = (memoryUrl: string): Memory =>
	new Memory({
		options: {
			generateTitle: false,
			lastMessages: 30,
			semanticRecall: false,
			workingMemory: {
				enabled: true,
				scope: "resource",
				template: WORKING_MEMORY_TEMPLATE,
			},
		},
		storage: new LibSQLStore({ id: "angel-memory", url: memoryUrl }),
	});

export const createAngel = (options: AngelOptions): Agent =>
	new Agent({
		description:
			"Angel qualifies car-dealership website leads on WhatsApp for Where They Are.",
		id: "angel",
		// Earlier turns' tool calls are left out of each request: OpenRouter drops
		// the Gemini thought signatures they need, which makes Gemini reject the
		// whole history. The CRM profile in the instructions carries what they did.
		inputProcessors: [new ToolCallFilter()],
		instructions: ({ requestContext }) => {
			const turn = requestContext.get(TURN_CONTEXT_KEY) as
				| TurnContext
				| undefined;
			if (!turn) {
				throw new Error("Angel needs the turn context in the request context");
			}
			return buildInstructions(turn);
		},
		memory: createAngelMemory(options.memoryUrl),
		model: angelModels(options),
		name: "Angel",
		tools: createAngelTools(options),
	});
