import { db } from "../client.js";
import type { Prisma } from "../generated/prisma/client.js";

export const upsertConversation = async (input: {
	businessId: string;
	channel: "WHATSAPP" | "PORTAL" | "INTERNAL";
	externalChatId: string;
}) => {
	const existing = await db.conversation.findUnique({
		where: {
			channel_externalChatId: {
				channel: input.channel,
				externalChatId: input.externalChatId,
			},
		},
	});

	if (existing && existing.businessId !== input.businessId) {
		throw new Error("External chat is already assigned to another business");
	}

	return (
		existing ??
		db.conversation.create({
			data: {
				businessId: input.businessId,
				channel: input.channel,
				externalChatId: input.externalChatId,
			},
		})
	);
};

export const findConversationForBusiness = async (
	businessId: string,
	conversationId: string
) =>
	db.conversation.findFirst({
		include: {
			intakes: { orderBy: { createdAt: "desc" } },
			messages: { orderBy: { createdAt: "asc" } },
		},
		where: { businessId, id: conversationId },
	});

export const appendMessage = async (input: {
	businessId: string;
	conversationId: string;
	authorId?: string;
	externalId?: string;
	direction: "INBOUND" | "OUTBOUND";
	kind: "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT" | "SYSTEM";
	body?: string;
	mediaUrl?: string;
	mediaMimeType?: string;
	metadata?: Prisma.InputJsonValue;
}) =>
	db.message.create({
		data: {
			authorId: input.authorId,
			body: input.body,
			conversationId: await assertConversationBelongsToBusiness(
				input.businessId,
				input.conversationId
			),
			direction: input.direction,
			externalId: input.externalId,
			kind: input.kind,
			mediaMimeType: input.mediaMimeType,
			mediaUrl: input.mediaUrl,
			metadata: input.metadata,
		},
	});

export const createIntake = async (input: {
	businessId: string;
	conversationId: string;
	sourceMessageId?: string;
	data: Prisma.InputJsonValue;
	missingFields: string[];
}) => {
	const conversationId = await assertConversationBelongsToBusiness(
		input.businessId,
		input.conversationId
	);

	return db.intake.create({
		data: {
			businessId: input.businessId,
			conversationId,
			data: input.data,
			missingFields: input.missingFields,
			sourceMessageId: input.sourceMessageId,
		},
	});
};

const assertConversationBelongsToBusiness = async (
	businessId: string,
	conversationId: string
): Promise<string> => {
	const conversation = await db.conversation.findFirst({
		select: { id: true },
		where: { businessId, id: conversationId },
	});

	if (!conversation) {
		throw new Error("Conversation does not belong to business");
	}

	return conversation.id;
};
