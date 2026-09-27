import type { PlanId } from "../knowledge/offer.js";

/** Lead stages from docs/sales-script.md §7: the funnel, then the side exits. */
export const LEAD_STAGES = [
	"new",
	"qualified",
	"plan_recommended",
	"ready_to_start",
	"paying_client",
	"onboarded",
	"active",
	"renewed",
	"human_follow_up",
	"nurture",
	"not_a_fit",
	"no_response",
	"lost",
	"churned",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Forward progress Angel may make before the owner takes over. */
export const PROGRESS_STAGES: readonly LeadStage[] = [
	"new",
	"qualified",
	"plan_recommended",
	"ready_to_start",
];

/**
 * Stages set only by the owner, or by the system when a lead firmly says no.
 * Once a lead is here, Angel can no longer change its stage.
 */
export const OWNER_ONLY_STAGES: readonly LeadStage[] = [
	"paying_client",
	"onboarded",
	"active",
	"renewed",
	"lost",
	"churned",
];

/** A client who has paid; on Growth or Pro they use a launch place. */
export const PAID_STAGES: readonly LeadStage[] = [
	"paying_client",
	"onboarded",
	"active",
	"renewed",
];

/** Stages from earlier releases and what they became. */
export const LEGACY_STAGES: Record<string, LeadStage> = {
	building: "paying_client",
	closed: "no_response",
	commercial_signal: "plan_recommended",
	delivered: "paying_client",
	demo_sent: "qualified",
	deposit_paid: "paying_client",
	deposit_requested: "ready_to_start",
	engaged: "qualified",
	price_discussed: "plan_recommended",
	won: "paying_client",
};

/** What Angel has learned that feeds the lead score (sales script §7). */
export interface LeadSignals {
	/** Has a Facebook page with recent activity. */
	activeFacebookPage?: boolean;
	/** Posts irregularly, or wants to appear more often. */
	clearNeed?: boolean;
	/** Has vehicle photos and details ready to send. */
	photosReady?: boolean;
	/** Said the recommended plan's price works for them. */
	priceWithinReach?: boolean;
}

/** The Click-to-WhatsApp ad a lead came from, when WhatsApp tells us. */
export interface AdSource {
	ctwaClid: string | null;
	sourceId: string | null;
	sourceUrl: string | null;
	title: string | null;
}

export const BUSINESS_TYPES = ["car_dealership", "other", "unknown"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const TRI_STATE = ["yes", "no", "unknown"] as const;
export type TriState = (typeof TRI_STATE)[number];

export interface Customer {
	adSource: AdSource | null;
	businessName: string | null;
	businessType: BusinessType;
	chatId: string;
	createdAt: string;
	currentChannels: string | null;
	demoSentAt: string | null;
	/** How often they want to appear in front of buyers, in their words. */
	desiredFrequency: string | null;
	displayName: string | null;
	facebookUrl: string | null;
	firstMessage: string | null;
	hasWebsite: TriState;
	humanTakeoverUntil: string | null;
	/** Digits-only phone number; also the Mastra memory resource id. */
	id: string;
	instagramUrl: string | null;
	isDecisionMaker: TriState;
	lastInboundAt: string | null;
	lastOutboundAt: string | null;
	/** 0–10, from the sales script's scoring table. */
	leadScore: number;
	leadSignals: LeadSignals;
	location: string | null;
	name: string | null;
	notes: string | null;
	optedOut: boolean;
	otherBusinessType: string | null;
	/** The plan they pay for, set by the owner. */
	plan: PlanId | null;
	/** How they post on Facebook and Instagram today, in their words. */
	postingHabit: string | null;
	/** The plan Angel recommended. */
	recommendedPlan: PlanId | null;
	stage: LeadStage;
	/** Roughly how many vehicles they usually have, in their words. */
	stockSize: string | null;
	/** When they want to start, in their words. */
	timing: string | null;
	updatedAt: string;
	vehicleTypes: string | null;
	websiteUrl: string | null;
}

export type ProfilePatch = Partial<
	Pick<
		Customer,
		| "businessName"
		| "businessType"
		| "currentChannels"
		| "desiredFrequency"
		| "facebookUrl"
		| "hasWebsite"
		| "instagramUrl"
		| "isDecisionMaker"
		| "location"
		| "name"
		| "otherBusinessType"
		| "postingHabit"
		| "stockSize"
		| "timing"
		| "vehicleTypes"
		| "websiteUrl"
	>
>;

export const PAYMENT_KINDS = ["deposit", "balance"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_METHODS = ["ecocash", "onemoney"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Our view of a Paynow transaction. "sent" means the customer has a prompt on
 * their phone; "paid", "failed", "cancelled" and "expired" are final.
 */
export const PAYMENT_STATUSES = [
	"created",
	"sent",
	"paid",
	"failed",
	"cancelled",
	"expired",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = [
	"paid",
	"failed",
	"cancelled",
	"expired",
];

export interface Payment {
	amountUsd: number;
	createdAt: string;
	customerId: string;
	/** Paynow's error or the reason it did not complete. */
	error: string | null;
	id: number;
	instructions: string | null;
	kind: PaymentKind;
	method: PaymentMethod;
	paidAt: string | null;
	paynowReference: string | null;
	/** The wallet number the prompt was sent to, digits only. */
	phone: string;
	pollUrl: string | null;
	/** Paynow's own wording, e.g. "Awaiting Delivery". */
	providerStatus: string | null;
	/** Our unique reference, e.g. WTA-263771234567-DEP-1. */
	reference: string;
	status: PaymentStatus;
	updatedAt: string;
}

export const EVENT_TYPES = [
	"stage_changed",
	"demo_sent",
	"objection",
	"commercial_signal",
	"handoff_requested",
	"opted_out",
	"opted_in",
	"human_takeover",
	"agent_resumed",
	"note",
	"rate_limited",
	"agent_error",
	"ignored",
	"score_changed",
	"plan_recommended",
	"examples_shared",
	"client_signed",
	"payment_requested",
	"payment_paid",
	"payment_failed",
	"meta_event",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface CrmEvent {
	createdAt: string;
	customerId: string;
	detail: Record<string, unknown>;
	id: number;
	type: EventType;
}

/** Why a message was not answered. Leads of any business type are never ignored. */
export const IGNORE_CATEGORIES = [
	"spam_or_scam",
	"personal_for_owner",
	"wrong_number",
	"vendor_or_job_pitch",
] as const;
export type IgnoreCategory = (typeof IGNORE_CATEGORIES)[number];

/**
 * Why Angel stays silent in an ongoing conversation: the lead firmly said no
 * or that they will come back, the chat has naturally ended, or the message
 * is meaningless. Leads with a question are never silenced.
 */
export const CLOSE_CATEGORIES = [
	"not_interested",
	"will_get_back",
	"conversation_over",
	"low_quality",
] as const;
export type CloseCategory = (typeof CLOSE_CATEGORIES)[number];

/** Every reason Angel may stay silent on a turn. */
export type SilenceCategory = IgnoreCategory | CloseCategory;

export interface IgnoredContact {
	/** The owner said to always let Angel reply to this contact. */
	allowed: boolean;
	category: IgnoreCategory;
	chatId: string;
	confidence: number;
	count: number;
	displayName: string | null;
	firstAt: string;
	id: string;
	lastAt: string;
	lastMessage: string;
}

export type MessageDirection = "in" | "out" | "owner";

export interface LoggedMessage {
	body: string;
	createdAt: string;
	customerId: string;
	direction: MessageDirection;
	id: number;
	mediaKind: string | null;
	/** The turn that received or produced this message; null for owner messages. */
	turnId: number | null;
}

/** A message Angel stayed silent on, kept apart from the lead transcripts. */
export interface IgnoredMessage {
	body: string;
	category: IgnoreCategory;
	contactId: string;
	createdAt: string;
	id: number;
	mediaKind: string | null;
	turnId: number | null;
}

export interface TurnUsage {
	inputTokens: number | null;
	outputTokens: number | null;
	reasoningTokens: number | null;
	totalTokens: number | null;
}

/** How the relevance check decided, stored with the turn it gated. */
export interface TurnGate {
	category: string;
	confidence: number;
	replyProbability: number;
	source: string;
}

/**
 * One batch of inbound messages and what Angel did with it: the outcome, the
 * gate decision, the model that answered, token usage, tools and latency.
 */
export interface TurnRecord {
	attempts: number;
	chatId: string;
	contactId: string;
	error: string | null;
	finishedAt: string | null;
	gate: TurnGate | null;
	id: number;
	inboundCount: number;
	latencyMs: number | null;
	model: string | null;
	/** "in_progress" until the turn finishes; a crash leaves it there. */
	outcome: string;
	replyCount: number;
	startedAt: string;
	tools: string[];
	usage: TurnUsage;
}

export interface TurnFinish {
	attempts?: number;
	error?: string | null;
	gate?: TurnGate | null;
	model?: string | null;
	outcome: string;
	replyCount: number;
	tools?: string[];
	usage?: Partial<TurnUsage>;
}

export interface TurnStats {
	averageLatencyMs: number;
	byOutcome: Record<string, number>;
	inputTokens: number;
	messagesIn: number;
	messagesOut: number;
	outputTokens: number;
	total: number;
	totalTokens: number;
}
