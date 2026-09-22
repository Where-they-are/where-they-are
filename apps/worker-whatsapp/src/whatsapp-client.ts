import { Client, LocalAuth, type Message } from "whatsapp-web.js";

import type { WorkerConfig } from "./config.js";
import { extractSiteIntake } from "./agent.js";
import { normalizeMessage } from "./normalize-message.js";
import type { SiteIntake } from "./types.js";

export type IntakeResultHandler = (input: {
  messageId: string;
  chatId: string;
  intake: SiteIntake;
}) => Promise<void>;

export const createWhatsAppClient = (
  config: WorkerConfig,
  agent: Parameters<typeof extractSiteIntake>[0],
  onIntake: IntakeResultHandler,
): Client => {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: config.WHATSAPP_CLIENT_ID,
      dataPath: config.WHATSAPP_AUTH_PATH,
    }),
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(config.CHROME_EXECUTABLE_PATH ? { executablePath: config.CHROME_EXECUTABLE_PATH } : {}),
    },
  });

  client.on("ready", () => {
    console.info("WhatsApp client is ready");
  });

  client.on("auth_failure", (message) => {
    console.error(`WhatsApp authentication failed: ${message}`);
  });

  client.on("disconnected", (reason) => {
    console.warn(`WhatsApp client disconnected: ${reason}`);
  });

  client.on("message", async (message: Message) => {
    try {
      const normalized = await normalizeMessage(message);
      const intake = await extractSiteIntake(agent, normalized);

      await onIntake({
        messageId: normalized.id,
        chatId: normalized.chatId,
        intake,
      });

      await message.reply(intake.suggestedReply);
    } catch (error) {
      console.error("WhatsApp message processing failed", error);
      await message.reply("Thanks — I could not process that message just yet. Please try sending it again.");
    }
  });

  return client;
};
