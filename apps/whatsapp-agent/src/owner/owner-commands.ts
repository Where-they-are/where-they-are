import type { CrmRepository } from "../crm/crm.repository.js";
import {
	type Customer,
	LEAD_STAGES,
	type LeadStage,
	PAID_STAGES,
} from "../crm/crm.types.js";
import { formatCount } from "../format/count.js";
import { type DealershipPricing, usd } from "../knowledge/pricing.js";
import type { PaymentService } from "../payments/payment.service.js";
import { checkWallet } from "../payments/wallet.js";
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
	"#stats – funnel counts and Angel's activity",
	"#pause <number> [hours|forever] – Angel stays quiet in that chat",
	"#resume <number> – hand the chat back to Angel",
	"#delivered <number> – the site is live; the balance is now due",
	"#balance <number> [wallet number] – send the Paynow request for the balance",
	"#payments [number] – recent payments, or one lead's",
	"#won <number> / #lost <number> – close a deal",
	"#stage <number> <stage> – set any stage",
	"#note <number> <text> – add a note",
	"#price – current dealership price",
	"#ignored – messages Angel stayed silent on (spam, personal, wrong numbers)",
	"#allow <number> – always let Angel reply to someone it ignored",
	"",
	`Stages: ${LEAD_STAGES.join(", ")}`,
	"Replying by hand in a customer's chat also pauses Angel there.",
].join("\n");

export interface OwnerCommandDeps {
	crm: CrmRepository;
	now?: () => Date;
	/** Needed for #balance; without it the command explains what's missing. */
	payments?: PaymentService;
	pricing: () => DealershipPricing;
	takeoverHours: number;
}

export const isOwnerCommand = (text: string): boolean =>
	COMMAND.test(text.trim());

/** The live offer and how many founding places are left. */
const offerSummary = (pricing: DealershipPricing): string =>
	[
		pricing.headline,
		pricing.isEarlyPrice
			? `Founding places left: ${pricing.earlySlotsLeft} of ${pricing.earlySlotsTotal}`
			: "All founding places are taken.",
		pricing.terms.payment,
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
		offerSummary(deps.pricing()),
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
	return `${who(customer)} moved to ${stage}.${paidDealership ? `\n${offerSummary(deps.pricing())}` : ""}`;
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
	if (!(id && deps.crm.allowContact(id))) {
		return `"${target}" isn't on the ignored list. Send #ignored to see it.`;
	}
	return "Done. Angel will reply to them from their next message.";
};

const delivered = withLead(({ customer, deps }) => {
	const result = deps.crm.setStage(customer.id, "delivered", {
		by: "owner",
		reason: "site delivered",
	});
	if (!result.applied) {
		return `${who(customer)} is already ${result.current}.`;
	}
	const balance = deps.crm.payments.latest(customer.id, "deposit");
	return `${who(customer)} moved to delivered. The ${balance ? usd(balance.amountUsd) : "remaining"} balance is now due: send #balance ${customer.id} to send the Paynow request, or Angel will send it when they ask to pay.`;
});

const requestBalance = withLead(async ({ args, customer, deps }) => {
	if (!deps.payments?.enabled) {
		return "Paynow isn't set up in Angel (PAYNOW_* settings), so send them payment details by hand.";
	}
	const deposit = deps.crm.payments.latest(customer.id, "deposit");
	const wallet = checkWallet(
		args[0] ?? deposit?.phone ?? customer.id,
		args[0] ? undefined : deposit?.method
	);
	if (!wallet.ok) {
		return "That wallet number doesn't look right. Use an EcoCash (077/078) or OneMoney (071) number: #balance <lead number> <wallet number>";
	}
	const result = await deps.payments.request({
		customerId: customer.id,
		kind: "balance",
		method: wallet.method,
		phone: wallet.phone,
	});
	if (!result.ok) {
		const reasons: Record<typeof result.reason, string> = {
			already_paid: "The balance is already paid.",
			deposit_not_paid: "Their deposit isn't paid yet.",
			not_configured: "Paynow isn't set up in Angel.",
			not_delivered: `Mark the site delivered first: #delivered ${customer.id}`,
			provider_error: `Paynow refused the request: ${result.error ?? "unknown error"}`,
			unknown_customer: notFound(customer.id),
		};
		return reasons[result.reason];
	}
	await deps.payments.messageCustomer(
		customer.id,
		`Your website is live! 🎉 We've sent a Paynow request for the ${usd(result.amountUsd)} balance to ${wallet.phone.replace("263", "0")}. Please approve it on your phone with your PIN.`
	);
	return `Sent a ${usd(result.amountUsd)} ${wallet.method} request to ${wallet.phone} (${result.reference}). You'll get an alert when it's paid.`;
});

const listPayments: Handler = ({ customer, deps, target }) => {
	if (target && !customer) {
		return notFound(target);
	}
	const payments = customer
		? deps.crm.payments.forCustomer(customer.id)
		: deps.crm.payments.recent(LIST_LIMIT);
	if (payments.length === 0) {
		return "No payments yet.";
	}
	const totals = deps.crm.payments.totals();
	return [
		`*Payments${customer ? ` · ${who(customer)}` : ""}*`,
		...payments.map(
			(payment) =>
				`• ${payment.createdAt.slice(0, 16).replace("T", " ")} · ${payment.kind} ${usd(payment.amountUsd)} · ${payment.status} · ${payment.method} ${payment.phone} · ${payment.customerId}`
		),
		"",
		`Paid in total: ${formatCount(totals.paidCount)} payments, ${usd(totals.paidUsd)}`,
	].join("\n");
};

const HANDLERS: Record<string, Handler> = {
	allow,
	balance: requestBalance,
	delivered,
	help: () => OWNER_HELP,
	ignored: listIgnored,
	lead: withLead(({ customer, deps }) => profile(deps.crm, customer)),
	leads: listLeads,
	lost: setStage,
	note: addNote,
	pause,
	payments: listPayments,
	price: ({ deps }) => offerSummary(deps.pricing()),
	resume,
	stage: setStage,
	stats: showStats,
	won: setStage,
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
