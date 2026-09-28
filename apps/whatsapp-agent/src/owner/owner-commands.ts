import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	LEAD_STAGES,
	type LeadStage,
	PAID_STAGES,
} from "../crm/crm.types.js";
import { formatCount } from "../format/count.js";
import {
	PLAN_IDS,
	type PlanId,
	type SocialMediaOffer,
	usd,
} from "../knowledge/offer.js";
import type { MetaReporter } from "../meta/meta-reporter.js";
import type { PaymentService } from "../payments/payment.service.js";
import { paymentLinkMessage } from "../payments/payment-messages.js";
import { checkWallet } from "../payments/wallet.js";
import { normalizePhone } from "./phone.js";

const COMMAND = /^#(\w+)\s*(.*)$/s;
const WHITESPACE = /\s+/;
const DOLLAR = /\$/g;
const HOUR_MS = 60 * 60 * 1000;
const LIST_LIMIT = 10;
const TRANSCRIPT_LIMIT = 8;
const FOREVER_HOURS = 24 * 365;

export const OWNER_HELP = [
	"*Angel owner commands*",
	"#leads [stage] – latest leads",
	"#lead <number> – one lead's profile and recent chat",
	"#stats – funnel counts and Angel's activity",
	"#pause <number> [hours|forever] – Angel stays quiet in that chat",
	"#resume <number> – hand the chat back to Angel",
	"#client <number> <starter|growth|pro> [amount] – they paid: mark them a client",
	"#bill <number> [amount] [link|ecocash|onemoney] – send a client next month's Paynow request (a link unless you say otherwise)",
	"#lost <number> – they decided not to go ahead",
	"#stage <number> <stage> – set any stage",
	"#note <number> <text> – add a note",
	"#price – the plans and launch places left",
	"#ignored – people Angel stayed silent on (no ad form, spam, personal, wrong numbers)",
	"#allow <number> – let Angel reply to someone, even without the ad form",
	"",
	`Stages: ${LEAD_STAGES.join(", ")}`,
	"Replying by hand in a customer's chat also pauses Angel there.",
].join("\n");

export interface OwnerCommandDeps {
	crm: CrmRepository;
	/** Reports paying clients to Meta; optional in tests. */
	meta?: MetaReporter;
	now?: () => Date;
	offer: () => SocialMediaOffer;
	/** Paynow requests for renewals; optional in tests. */
	payments?: PaymentService;
	takeoverHours: number;
}

export const isOwnerCommand = (text: string): boolean =>
	COMMAND.test(text.trim());

/** The plans and how many launch places are left. */
const offerSummary = (offer: SocialMediaOffer): string =>
	[
		offer.summary,
		offer.launchOfferOpen
			? `Launch places left (50% off the first month of Growth or Pro): ${offer.launchPlacesLeft} of ${offer.launchPlacesTotal}`
			: "All launch places are taken: normal prices only.",
	].join("\n");

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

interface CommandInput {
	args: string[];
	command: string;
	customer: Customer | undefined;
	deps: OwnerCommandDeps;
	now: () => Date;
	target: string;
}

type Reply = string | Promise<string>;
type Handler = (input: CommandInput) => Reply;

const notFound = (target: string) =>
	`No lead found for "${target}". Send #leads to see numbers.`;

/** Wraps a handler that needs an existing lead. */
const withLead =
	(handler: (input: CommandInput & { customer: Customer }) => Reply): Handler =>
	(input) =>
		input.customer
			? handler({ ...input, customer: input.customer })
			: notFound(input.target);

const listLeads: Handler = ({ deps, target }) => {
	const stage = LEAD_STAGES.includes(target as LeadStage)
		? (target as LeadStage)
		: undefined;
	const leads = deps.crm.list({ limit: LIST_LIMIT, stage });
	if (leads.length === 0) {
		return "No leads yet.";
	}
	return [
		`*Latest leads${stage ? ` (${stage})` : ""}*`,
		...leads.map(summaryLine),
	].join("\n");
};

const MS_PER_SECOND = 1000;

const pairs = (record: Record<string, number>) =>
	Object.entries(record)
		.map(([key, count]) => `${key}: ${formatCount(count)}`)
		.join(", ") || "none";

const showStats: Handler = ({ deps }) => {
	const stats = deps.crm.stats();
	const turns = deps.crm.turnStats();
	const seconds = (turns.averageLatencyMs / MS_PER_SECOND).toFixed(1);
	return [
		"*Funnel*",
		`Conversations: ${formatCount(stats.total)}`,
		`Dealerships: ${formatCount(stats.dealerships)}`,
		`Demos sent: ${formatCount(stats.demosSent)}`,
		`By stage: ${pairs(stats.byStage)}`,
		`Objections: ${pairs(stats.objections)}`,
		`Ignored contacts: ${formatCount(stats.ignored)}`,
		"",
		"*Angel*",
		`Messages in: ${formatCount(turns.messagesIn)} · replies sent: ${formatCount(turns.messagesOut)}`,
		`Turns: ${formatCount(turns.total)} (${pairs(turns.byOutcome)})`,
		`Average reply time: ${seconds}s · tokens used: ${formatCount(turns.totalTokens)}`,
		"",
		offerSummary(deps.offer()),
	].join("\n");
};

const pause = withLead(({ args, customer, deps, now }) => {
	const forever = args[0] === "forever";
	const requested = forever
		? FOREVER_HOURS
		: Number(args[0] ?? deps.takeoverHours);
	const hours =
		Number.isFinite(requested) && requested > 0
			? requested
			: deps.takeoverHours;
	deps.crm.setHumanTakeover(
		customer.id,
		new Date(now().getTime() + hours * HOUR_MS),
		"owner"
	);
	return `Angel is paused for ${who(customer)} (${forever ? "until you #resume" : `${hours}h`}).`;
});

const resume = withLead(({ customer, deps }) => {
	deps.crm.setHumanTakeover(customer.id, null, "owner");
	return `Angel is back on for ${who(customer)}.`;
});

const setStage = withLead(({ args, command, customer, deps }) => {
	const stage = (command === "stage" ? args[0] : command) as LeadStage;
	if (!LEAD_STAGES.includes(stage)) {
		return `Unknown stage. Use one of: ${LEAD_STAGES.join(", ")}`;
	}
	const result = deps.crm.setStage(customer.id, stage, {
		by: "owner",
		reason: "set by owner",
	});
	if (!result.applied) {
		return `${who(customer)} is already ${result.current}.`;
	}
	const paidDealership =
		PAID_STAGES.includes(stage) && customer.businessType === "car_dealership";
	return `${who(customer)} moved to ${stage}.${paidDealership ? `\n${offerSummary(deps.offer())}` : ""}`;
});

const addNote = withLead(({ args, customer, deps }) => {
	const note = args.join(" ").trim();
	if (!note) {
		return "Add the note after the number, e.g. #note 263771234567 Wants a call after 5pm.";
	}
	deps.crm.appendNote(customer.id, `Owner: ${note}`);
	return `Note saved for ${who(customer)}.`;
});

const CATEGORY_LABELS: Record<string, string> = {
	personal_for_owner: "personal",
	spam_or_scam: "spam",
	vendor_or_job_pitch: "pitch/job",
	wrong_number: "wrong number",
};

const listIgnored: Handler = ({ deps }) => {
	const ignored = deps.crm.listIgnored(LIST_LIMIT);
	if (ignored.length === 0) {
		return "Angel hasn't ignored anyone.";
	}
	return [
		"*Ignored by Angel*",
		...ignored.map(
			(contact) =>
				`• ${contact.displayName ?? contact.id} · ${CATEGORY_LABELS[contact.category] ?? contact.category}${contact.allowed ? " · allowed" : ""} · ${formatCount(contact.count)}× · "${contact.lastMessage.slice(0, 60)}" · ${contact.id}`
		),
		"",
		"Send #allow <number> if Angel should reply to someone.",
	].join("\n");
};

const allow: Handler = ({ deps, target }) => {
	const id = normalizePhone(target);
	if (!id) {
		return "Say whose number: #allow 263771234567";
	}
	deps.crm.allowContact(id);
	deps.crm.markScreened(id, "owner");
	return "Done. Angel will reply to them from their next message, even without the ad form.";
};

const signClient = withLead(async ({ args, customer, deps }) => {
	const plan = args[0]?.toLowerCase();
	if (!(plan && (PLAN_IDS as readonly string[]).includes(plan))) {
		return `Say which plan they paid for: #client ${customer.id} starter|growth|pro [amount]`;
	}
	const planId = plan as PlanId;
	// Priced before marking them paid, since they may take a launch place.
	const quoted = deps.offer().plans[planId];
	const amount = args[1]
		? Number(args[1].replace(DOLLAR, ""))
		: quoted.firstMonthUsd;
	if (!Number.isFinite(amount) || amount <= 0) {
		return `"${args[1]}" isn't an amount. Example: #client ${customer.id} ${planId} ${quoted.firstMonthUsd}`;
	}
	deps.crm.setPlan(customer.id, "paying", planId);
	const result = deps.crm.setStage(customer.id, "paying_client", {
		by: "owner",
		reason: `paid ${usd(amount)} for ${planId}`,
	});
	deps.crm.recordEvent(customer.id, "client_signed", {
		amountUsd: amount,
		plan: planId,
	});
	await deps.meta?.report({
		customerId: customer.id,
		eventName: "Purchase",
		key: `${planId}-1`,
		valueUsd: amount,
	});
	const stage = result.applied
		? "Now a paying client"
		: `Stage stays ${result.current}`;
	return [
		`${who(customer)} is on ${quoted.name} (${usd(amount)} first payment). ${stage}.`,
		offerSummary(deps.offer()),
	].join("\n");
});

const BILL_METHODS = new Set(["link", "ecocash", "onemoney"]);

/** Reads "#bill <number> [amount] [method]" in any order after the number. */
const billArgs = (args: string[]) => {
	const method = args.find((arg) => BILL_METHODS.has(arg.toLowerCase()));
	const amountArg = args.find((arg) => arg !== method);
	return {
		amount: amountArg ? Number(amountArg.replace(DOLLAR, "")) : undefined,
		amountArg,
		method: (method?.toLowerCase() ?? "link") as
			| "link"
			| "ecocash"
			| "onemoney",
	};
};

/** Sends a client next month's Paynow request; Paynow confirms it. */
const bill = withLead(async ({ args, customer, deps }) => {
	if (!deps.payments?.enabled) {
		return "Paynow isn't set up, so Angel can't send payment requests.";
	}
	const plan = customer.plan ?? customer.recommendedPlan;
	if (!(plan && PAID_STAGES.includes(customer.stage))) {
		return `${who(customer)} isn't a paying client yet. Angel takes the first month; #bill is for later months.`;
	}
	const { amount, amountArg, method } = billArgs(args);
	if (amount !== undefined && !(Number.isFinite(amount) && amount > 0)) {
		return `"${amountArg}" isn't an amount. Example: #bill ${customer.id} 96 link`;
	}
	const wallet = method === "link" ? null : checkWallet(customer.id, method);
	if (wallet && !wallet.ok) {
		return `${customer.id} can't take a ${method} prompt. Send a link instead: #bill ${customer.id} link`;
	}
	const result = await deps.payments.request({
		customerId: customer.id,
		kind: "renewal",
		method,
		plan,
		...(amount === undefined ? {} : { amountUsd: amount }),
		...(wallet ? { phone: wallet.phone } : {}),
	});
	if (!result.ok) {
		return `Paynow didn't take the request: ${result.error ?? result.reason}.`;
	}
	const payment = deps.crm.payments.byReference(result.reference);
	const text =
		result.link && payment
			? paymentLinkMessage(payment)
			: `I've sent a Paynow prompt for ${usd(result.amountUsd)} for next month to your phone. Please approve it with your PIN. We'll confirm here once it's paid.`;
	await deps.payments.messageCustomer(customer.id, text);
	const waiting =
		result.status === "already_pending"
			? " (it was already waiting, so I sent it again)"
			: "";
	return `Sent ${who(customer)} a ${usd(result.amountUsd)} renewal ${method === "link" ? "link" : `${method} prompt`}${waiting}. Ref ${result.reference}. You'll get an alert when Paynow confirms it.`;
});

const HANDLERS: Record<string, Handler> = {
	allow,
	bill,
	client: signClient,
	help: () => OWNER_HELP,
	ignored: listIgnored,
	lead: withLead(({ customer, deps }) => profile(deps.crm, customer)),
	leads: listLeads,
	lost: setStage,
	note: addNote,
	pause,
	price: ({ deps }) => offerSummary(deps.offer()),
	resume,
	stage: setStage,
	stats: showStats,
};

/**
 * Handles "#command" messages the owner sends to Angel's own number, so the
 * pipeline can be run from WhatsApp without opening a dashboard.
 */
export const runOwnerCommand = (
	text: string,
	deps: OwnerCommandDeps
): Reply => {
	const match = COMMAND.exec(text.trim());
	if (!match) {
		return OWNER_HELP;
	}
	const command = (match[1] ?? "").toLowerCase();
	const handler = HANDLERS[command];
	if (!handler) {
		return `Unknown command #${command}.\n\n${OWNER_HELP}`;
	}
	const [target = "", ...args] = (match[2] ?? "").trim().split(WHITESPACE);
	const id = normalizePhone(target);
	return handler({
		args,
		command,
		customer: id ? deps.crm.get(id) : undefined,
		deps,
		now: deps.now ?? (() => new Date()),
		target,
	});
};
