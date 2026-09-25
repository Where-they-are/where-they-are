import type { CrmRepository } from "../crm/crm.repository.js";
import type {
	MetaConversionsClient,
	MetaEventName,
	MetaSendResult,
} from "./conversions.js";

export interface MetaReport {
	customerId: string;
	eventName: MetaEventName;
	/** Makes repeatable events unique, e.g. the payment reference. */
	key?: string;
	valueUsd?: number;
}

/**
 * Reports each funnel event to Meta once per lead (or once per payment),
 * recording the attempt in the CRM. Does nothing when Meta is not set up.
 */
export class MetaReporter {
	private readonly client: MetaConversionsClient | null;
	private readonly crm: CrmRepository;
	private readonly now: () => Date;

	constructor(
		client: MetaConversionsClient | null,
		crm: CrmRepository,
		now: () => Date = () => new Date()
	) {
		this.client = client;
		this.crm = crm;
		this.now = now;
	}

	get enabled(): boolean {
		return this.client !== null;
	}

	async report(input: MetaReport): Promise<MetaSendResult | null> {
		const customer = this.crm.get(input.customerId);
		if (!(this.client && customer)) {
			return null;
		}
		const eventId = [
			"wta",
			customer.id,
			input.eventName,
			...(input.key ? [input.key] : []),
		].join("-");
		if (this.crm.hasEvent(customer.id, "meta_event", "eventId", eventId)) {
			return null;
		}
		const result = await this.client.send({
			adSource: customer.adSource,
			eventId,
			eventName: input.eventName,
			eventTime: this.now(),
			phone: customer.id,
			...(input.valueUsd === undefined ? {} : { valueUsd: input.valueUsd }),
		});
		this.crm.recordEvent(
			customer.id,
			"meta_event",
			result.ok
				? { event: input.eventName, eventId }
				: {
						error: result.error,
						event: input.eventName,
						failedEventId: eventId,
					}
		);
		return result;
	}
}
