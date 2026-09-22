import type { Prisma } from "../generated/prisma/client.js";

import { db } from "../client.js";

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

  return existing ?? db.conversation.create({
    data: {
      businessId: input.businessId,
      channel: input.channel,
      externalChatId: input.externalChatId,
    },
  });
};

export const findConversationForBusiness = async (businessId: string, conversationId: string) =>
  db.conversation.findFirst({
    where: { id: conversationId, businessId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      intakes: { orderBy: { createdAt: "desc" } },
    },
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
      conversationId: await assertConversationBelongsToBusiness(input.businessId, input.conversationId),
      authorId: input.authorId,
      externalId: input.externalId,
      direction: input.direction,
      kind: input.kind,
      body: input.body,
      mediaUrl: input.mediaUrl,
      mediaMimeType: input.mediaMimeType,
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
  const conversationId = await assertConversationBelongsToBusiness(input.businessId, input.conversationId);

  return db.intake.create({
    data: {
      businessId: input.businessId,
      conversationId,
      sourceMessageId: input.sourceMessageId,
      data: input.data,
      missingFields: input.missingFields,
    },
  });
};

const assertConversationBelongsToBusiness = async (
  businessId: string,
  conversationId: string,
): Promise<string> => {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, businessId },
    select: { id: true },
  });

  if (!conversation) {
    throw new Error("Conversation does not belong to business");
  }

  return conversation.id;
};
