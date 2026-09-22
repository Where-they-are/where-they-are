import { createSiteIntakeAgent } from "./agent.js";
import { ServerClient } from "@where-they-are/server-client";
import { readConfig } from "./config.js";
import { createWhatsAppClient } from "./whatsapp-client.js";

const config = readConfig();
const agent = createSiteIntakeAgent(config);
const serverClient = new ServerClient({ baseUrl: config.SERVER_BASE_URL });

const client = createWhatsAppClient(config, agent, async ({ messageId, chatId, intake }) => {
  const site = await serverClient.generateSite({
    intake,
    plan: "starter",
    intakeMessageIds: [messageId],
  });

  console.info("Site-intake result", {
    messageId,
    chatId,
    intent: intake.intent,
    businessName: intake.businessName,
    missingFields: intake.missingFields,
    previewUrl: site.previewUrl,
  });
});

client.on("qr", (qr) => {
  console.info("Scan this WhatsApp QR code to authenticate:", qr);
});

client.initialize().catch((error: unknown) => {
  console.error("WhatsApp client initialization failed", error);
  process.exitCode = 1;
});
