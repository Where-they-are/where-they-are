import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  appendMessage,
  createBusinessWithOwner,
  createIntake,
  findConversationForBusiness,
  upsertConversation,
  db,
} from "@where-they-are/db";

const databaseEnabled = Boolean(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let businessId = "";
let conversationId = "";
let messageId = "";

describe.runIf(databaseEnabled)("PostgreSQL conversation repositories", () => {
  beforeAll(async () => {
    const result = await createBusinessWithOwner({
      ownerEmail: `conversation-${suffix}@example.test`,
      businessName: `Conversation Business ${suffix}`,
      businessSlug: `conversation-${suffix}`,
    });
    businessId = result.business.id;

    const conversation = await upsertConversation({
      businessId,
      channel: "WHATSAPP",
      externalChatId: `chat-${suffix}`,
    });
    conversationId = conversation.id;
  });

  afterAll(async () => {
    if (businessId) {
      await db.business.delete({ where: { id: businessId } });
    }
    await db.$disconnect();
  });

  it("stores an inbound message and structured intake under one tenant", async () => {
    const message = await appendMessage({
      businessId,
      conversationId,
      externalId: `message-${suffix}`,
      direction: "INBOUND",
      kind: "TEXT",
      body: "We are a barber in Harare.",
    });
    messageId = message.id;

    await createIntake({
      businessId,
      conversationId,
      sourceMessageId: message.id,
      data: { businessName: "Conversation Barber", location: "Harare" },
      missingFields: ["operatingHours"],
    });

    const conversation = await findConversationForBusiness(businessId, conversationId);
    expect(conversation?.messages).toHaveLength(1);
    expect(conversation?.intakes[0]?.missingFields).toEqual(["operatingHours"]);
  });

  it("rejects writing to a conversation owned by another business", async () => {
    await expect(appendMessage({
      businessId: "different-business",
      conversationId,
      direction: "INBOUND",
      kind: "TEXT",
      body: "Cross-tenant attempt",
    })).rejects.toThrow("does not belong to business");

    expect(messageId).toBeTruthy();
  });
});
