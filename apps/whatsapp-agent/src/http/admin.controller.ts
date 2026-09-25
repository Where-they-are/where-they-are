import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Header,
	Inject,
	NotFoundException,
	Param,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";

import { AGENT_CONFIG, type AgentConfig } from "../config.js";
import { LEAD_STAGES, type LeadStage } from "../crm/crm.types.js";
import { formatCount, formatCounts } from "../format/count.js";
import { normalizePhone } from "../owner/phone.js";
import type { AngelRuntime } from "../runtime.js";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import { AdminGuard } from "./admin.guard.js";
import { ANGEL_RUNTIME } from "./tokens.js";

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 100;
const DEFAULT_TURN_LIMIT = 50;
const MAX_LIMIT = 1000;

const clampLimit = (value: string | undefined, fallback: number): number =>
	Math.min(Math.max(Math.trunc(Number(value)) || fallback, 1), MAX_LIMIT);
const isStage = (value: unknown): value is LeadStage =>
	typeof value === "string" &&
	(LEAD_STAGES as readonly string[]).includes(value);

/** Read and steer Angel's CRM over HTTP, e.g. from a spreadsheet or script. */
@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
	private readonly runtime: AngelRuntime;
	private readonly whatsapp: WhatsAppService;
	private readonly config: AgentConfig;

	constructor(
		@Inject(ANGEL_RUNTIME) runtime: AngelRuntime,
		@Inject(WhatsAppService) whatsapp: WhatsAppService,
		@Inject(AGENT_CONFIG) config: AgentConfig
	) {
		this.runtime = runtime;
		this.whatsapp = whatsapp;
		this.config = config;
	}

	@Get("whatsapp")
	whatsappStatus() {
		return this.whatsapp.status();
	}

	/** Raw numbers for charts plus display strings (1.1K, 1.02K, 10K). */
	@Get("stats")
	stats() {
		const { crm } = this.runtime;
		const funnel = crm.stats();
		const turns = crm.turnStats();
		const payments = crm.payments.totals();
		return {
			...funnel,
			formatted: {
				byStage: formatCounts(funnel.byStage),
				dealerships: formatCount(funnel.dealerships),
				demosSent: formatCount(funnel.demosSent),
				depositsPaid: formatCount(funnel.depositsPaid),
				ignored: formatCount(funnel.ignored),
				objections: formatCounts(funnel.objections),
				payments: {
					paidCount: formatCount(payments.paidCount),
					paidUsd: `$${formatCount(payments.paidUsd)}`,
				},
				total: formatCount(funnel.total),
				turns: {
					byOutcome: formatCounts(turns.byOutcome),
					inputTokens: formatCount(turns.inputTokens),
					messagesIn: formatCount(turns.messagesIn),
					messagesOut: formatCount(turns.messagesOut),
					outputTokens: formatCount(turns.outputTokens),
					total: formatCount(turns.total),
					totalTokens: formatCount(turns.totalTokens),
				},
			},
			payments,
			paynowEnabled: this.runtime.payments.enabled,
			pricing: this.runtime.pricing(),
			turns,
		};
	}

	@Get("payments")
	payments(@Query("limit") limit?: string) {
		return this.runtime.crm.payments.recent(
			clampLimit(limit, DEFAULT_LIST_LIMIT)
		);
	}

	@Get("turns")
	turns(@Query("contact") contact?: string, @Query("limit") limit?: string) {
		return this.runtime.crm.turns({
			contactId: contact ? normalizePhone(contact) : undefined,
			limit: clampLimit(limit, DEFAULT_TURN_LIMIT),
		});
	}

	@Get("ignored")
	ignored(@Query("limit") limit?: string) {
		return this.runtime.crm.listIgnored(clampLimit(limit, DEFAULT_LIST_LIMIT));
	}

	@Get("ignored/:id")
	ignoredContact(@Param("id") id: string) {
		const contactId = normalizePhone(id);
		const contact = this.runtime.crm.getIgnored(contactId);
		if (!contact) {
			throw new NotFoundException();
		}
		return {
			contact,
			messages: this.runtime.crm.ignoredMessages(contactId, MAX_LIMIT),
		};
	}

	@Get("leads")
	leads(@Query("stage") stage?: string, @Query("limit") limit?: string) {
		if (stage !== undefined && !isStage(stage)) {
			throw new BadRequestException(
				`stage must be one of ${LEAD_STAGES.join(", ")}`
			);
		}
		return this.runtime.crm.list({
			limit: clampLimit(limit, DEFAULT_LIST_LIMIT),
			stage,
		});
	}

	@Get("leads.csv")
	@Header("Content-Type", "text/csv; charset=utf-8")
	@Header("Content-Disposition", 'attachment; filename="angel-leads.csv"')
	leadsCsv() {
		return this.runtime.crm.toCsv();
	}

	@Get("leads/:id")
	lead(@Param("id") id: string) {
		const customer = this.runtime.crm.get(normalizePhone(id));
		if (!customer) {
			throw new NotFoundException();
		}
		return {
			customer,
			events: this.runtime.crm.events(customer.id, 100),
			messages: this.runtime.crm.messages(customer.id, 200),
			payments: this.runtime.crm.payments.forCustomer(customer.id),
			turns: this.runtime.crm.turns({
				contactId: customer.id,
				limit: DEFAULT_TURN_LIMIT,
			}),
		};
	}

	@Post("leads/:id/pause")
	pause(@Param("id") id: string, @Body() body: { hours?: number } | undefined) {
		const customer = this.runtime.crm.get(normalizePhone(id));
		if (!customer) {
			throw new NotFoundException();
		}
		const hours =
			Number(body?.hours) > 0
				? Number(body?.hours)
				: this.config.HUMAN_TAKEOVER_HOURS;
		this.runtime.crm.setHumanTakeover(
			customer.id,
			new Date(Date.now() + hours * HOUR_MS),
			"admin_api"
		);
		return this.runtime.crm.get(customer.id);
	}

	@Post("leads/:id/resume")
	resume(@Param("id") id: string) {
		const customer = this.runtime.crm.get(normalizePhone(id));
		if (!customer) {
			throw new NotFoundException();
		}
		this.runtime.crm.setHumanTakeover(customer.id, null, "admin_api");
		return this.runtime.crm.get(customer.id);
	}

	@Post("leads/:id/stage")
	setStage(
		@Param("id") id: string,
		@Body() body: { reason?: string; stage?: string } | undefined
	) {
		const customer = this.runtime.crm.get(normalizePhone(id));
		if (!customer) {
			throw new NotFoundException();
		}
		const stage = body?.stage;
		if (!isStage(stage)) {
			throw new BadRequestException(
				`stage must be one of ${LEAD_STAGES.join(", ")}`
			);
		}
		return this.runtime.crm.setStage(customer.id, stage, {
			by: "owner",
			reason: body?.reason ?? "set via admin API",
		});
	}
}
