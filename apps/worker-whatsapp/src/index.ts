import { createSiteIntakeAgent } from "./agent.js";
import { readConfig } from "./config.js";
import { createWhatsAppClient } from "./whatsapp-client.js";

const config = readConfig();
const agent = createSiteIntakeAgent(config);

const client = createWhatsAppClient(config, agent, async ({ messageId, chatId, intake }) => {
  console.info("Site-intake result", {
    messageId,
    chatId,
    intent: intake.intent,
    businessName: intake.businessName,
    missingFields: intake.missingFields,
  });
});

client.on("qr", (qr) => {
  console.info("Scan this WhatsApp QR code to authenticate:", qr);
});

client.initialize().catch((error: unknown) => {
  console.error("WhatsApp client initialization failed", error);
  process.exitCode = 1;
});
