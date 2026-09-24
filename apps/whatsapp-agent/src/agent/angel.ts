import { Agent } from "@mastra/core/agent";
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

export interface AngelOptions extends AngelToolDeps {
	memoryUrl: string;
	model: string;
}

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
		model: `openrouter/${options.model}`,
		name: "Angel",
		tools: createAngelTools(options),
	});
