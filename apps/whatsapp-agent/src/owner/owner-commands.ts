import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	LEAD_STAGES,
	type LeadStage,
} from "../crm/crm.types.js";
import type { DealershipPricing } from "../knowledge/pricing.js";
import { normalizePhone } from "./phone.js";

const COMMAND = /^#(\w+)\s*(.*)$/s;
const WHITESPACE = /\s+/;
const HOUR_MS = 60 * 60 * 1000;
const LIST_LIMIT = 10;
const TRANSCRIPT_LIMIT = 8;
const FOREVER_HOURS = 24 * 365;

export const OWNER_HELP = [
	"*Angel owner commands*",
	"#leads [stage] – latest leads",
	"#lead <number> – one lead's profile and recent chat",
	"#stats – funnel counts",
	"#pause <number> [hours|forever] – Angel stays quiet in that chat",
	"#resume <number> – hand the chat back to Angel",
	"#won <number> / #lost <number> – close a deal",
	"#stage <number> <stage> – set any stage",
	"#note <number> <text> – add a note",
	"#price – current dealership price",
	"",
	`Stages: ${LEAD_STAGES.join(", ")}`,
	"Replying by hand in a customer's chat also pauses Angel there.",
].join("\n");

export interface OwnerCommandDeps {
	crm: CrmRepository;
	now?: () => Date;
	pricing: () => DealershipPricing;
	takeoverHours: number;
}

export const isOwnerCommand = (text: string): boolean =>
	COMMAND.test(text.trim());

const who = (customer: Customer) =>
	customer.name ?? customer.displayName ?? "Unknown name";

const summaryLine = (customer: Customer) =>
	`• ${who(customer)} · ${customer.businessName ?? customer.businessType.replace("_", " ")} · ${customer.stage} · ${customer.id}`;

const profile = (crm: CrmRepository, customer: Customer): string => {
	const transcript = crm
		.messages(customer.id, TRANSCRIPT_LIMIT)
		.map((message) => {
			const label = { in: "Them", out: "Angel", owner: "You" }[
				message.direction
			];
			return `${label}: ${message.body.slice(0, 160)}`;
		});
	return [
		`*${who(customer)}* (${customer.id})`,
		`Business: ${customer.businessName ?? "?"} (${customer.businessType}${customer.otherBusinessType ? `: ${customer.otherBusinessType}` : ""})`,
		`Vehicles: ${customer.vehicleTypes ?? "?"}`,
		`Location: ${customer.location ?? "?"}`,
		`Website: ${customer.hasWebsite}${customer.websiteUrl ? ` ${customer.websiteUrl}` : ""}`,
		`Stage: ${customer.stage}${customer.demoSentAt ? " · demo sent" : ""}${customer.optedOut ? " · OPTED OUT" : ""}`,
		`Angel: ${customer.humanTakeoverUntil && new Date(customer.humanTakeoverUntil) > new Date() ? `paused until ${customer.humanTakeoverUntil.slice(0, 16)}` : "active"}`,
		customer.notes ? `Notes: ${customer.notes}` : "",
		"",
		...transcript,
		"",
		`Chat: https://wa.me/${customer.id}`,
	]
		.filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
		.join("\n");
};

/**
 * Handles "#command" messages the owner sends to Angel's own number, so the
 * pipeline can be run from WhatsApp without opening a dashboard.
 */
export const runOwnerCommand = (
	text: string,
	deps: OwnerCommandDeps
): string => {
	const match = COMMAND.exec(text.trim());
	if (!match) {
		return OWNER_HELP;
	}
	const now = deps.now ?? (() => new Date());
	const command = (match[1] ?? "").toLowerCase();
	const rest = (match[2] ?? "").trim();
	const [target = "", ...args] = rest.split(WHITESPACE);
	const id = normalizePhone(target);
	const find = () => (id ? deps.crm.get(id) : undefined);
	const notFound = `No lead found for "${target}". Send #leads to see numbers.`;

	switch (command) {
		case "help":
			return OWNER_HELP;
		case "price":
			return deps.pricing().statement;
		case "leads": {
			const stage = LEAD_STAGES.includes(target as LeadStage)
				? (target as LeadStage)
				: undefined;
			const leads = deps.crm.list({ limit: LIST_LIMIT, stage });
			return leads.length === 0
				? "No leads yet."
				: [
						`*Latest leads${stage ? ` (${stage})` : ""}*`,
						...leads.map(summaryLine),
					].join("\n");
		}
		case "stats": {
			const stats = deps.crm.stats();
			const stages = Object.entries(stats.byStage)
				.map(([stage, count]) => `${stage}: ${count}`)
				.join(", ");
			const objections = Object.entries(stats.objections)
				.map(([kind, count]) => `${kind}: ${count}`)
				.join(", ");
			return [
				"*Funnel*",
				`Conversations: ${stats.total}`,
				`Dealerships: ${stats.dealerships}`,
				`Demos sent: ${stats.demosSent}`,
				`By stage: ${stages || "none"}`,
				`Objections: ${objections || "none"}`,
				deps.pricing().statement,
			].join("\n");
		}
		case "lead": {
			const customer = find();
			return customer ? profile(deps.crm, customer) : notFound;
		}
		case "pause": {
			const customer = find();
			if (!customer) {
				return notFound;
			}
			const hours =
				args[0] === "forever"
					? FOREVER_HOURS
					: Number(args[0] ?? deps.takeoverHours);
			const safeHours =
				Number.isFinite(hours) && hours > 0 ? hours : deps.takeoverHours;
			deps.crm.setHumanTakeover(
				customer.id,
				new Date(now().getTime() + safeHours * HOUR_MS),
				"owner"
			);
			return `Angel is paused for ${who(customer)} (${args[0] === "forever" ? "until you #resume" : `${safeHours}h`}).`;
		}
		case "resume": {
			const customer = find();
			if (!customer) {
				return notFound;
			}
			deps.crm.setHumanTakeover(customer.id, null, "owner");
			return `Angel is back on for ${who(customer)}.`;
		}
		case "won":
		case "lost":
		case "stage": {
			const customer = find();
			if (!customer) {
				return notFound;
			}
			const stage = (command === "stage" ? args[0] : command) as LeadStage;
			if (!LEAD_STAGES.includes(stage)) {
				return `Unknown stage. Use one of: ${LEAD_STAGES.join(", ")}`;
			}
			const result = deps.crm.setStage(customer.id, stage, {
				by: "owner",
				reason: "set by owner",
			});
			const extra =
				stage === "won" && customer.businessType === "car_dealership"
					? `\n${deps.pricing().statement}`
					: "";
			return result.applied
				? `${who(customer)} moved to ${stage}.${extra}`
				: `${who(customer)} is already ${result.current}.`;
		}
		case "note": {
			const customer = find();
			const note = args.join(" ").trim();
			if (!customer) {
				return notFound;
			}
			if (!note) {
				return "Add the note after the number, e.g. #note 263771234567 Wants a call after 5pm.";
			}
			deps.crm.appendNote(customer.id, `Owner: ${note}`);
			return `Note saved for ${who(customer)}.`;
		}
		default:
			return `Unknown command #${command}.\n\n${OWNER_HELP}`;
	}
};
