/**
 * Lead stages from docs/plan.md §5.3, plus won/lost so the owner can close
 * the loop and early-price slots can be counted.
 */
export const LEAD_STAGES = [
	"new",
	"qualified",
	"demo_sent",
	"engaged",
	"commercial_signal",
	"human_follow_up",
	"not_a_fit",
	"won",
	"lost",
	"closed",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Forward progress an agent may make; the rest are owner decisions or exits. */
export const PROGRESS_STAGES: readonly LeadStage[] = [
	"new",
	"qualified",
	"demo_sent",
	"engaged",
	"commercial_signal",
	"human_follow_up",
];

export const OWNER_ONLY_STAGES: readonly LeadStage[] = [
	"won",
	"lost",
	"closed",
];

export const BUSINESS_TYPES = ["car_dealership", "other", "unknown"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const TRI_STATE = ["yes", "no", "unknown"] as const;
export type TriState = (typeof TRI_STATE)[number];

export interface Customer {
	businessName: string | null;
	businessType: BusinessType;
	chatId: string;
	createdAt: string;
	currentChannels: string | null;
	demoSentAt: string | null;
	displayName: string | null;
	firstMessage: string | null;
	hasWebsite: TriState;
	humanTakeoverUntil: string | null;
	/** Digits-only phone number; also the Mastra memory resource id. */
	id: string;
	isDecisionMaker: TriState;
	lastInboundAt: string | null;
	lastOutboundAt: string | null;
	location: string | null;
	name: string | null;
	notes: string | null;
	optedOut: boolean;
	otherBusinessType: string | null;
	stage: LeadStage;
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
		| "hasWebsite"
		| "isDecisionMaker"
		| "location"
		| "name"
		| "otherBusinessType"
		| "vehicleTypes"
		| "websiteUrl"
	>
>;

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
}
