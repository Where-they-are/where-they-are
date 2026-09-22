import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_MODEL: z.string().default("google/gemini-3-flash-preview"),
  WHATSAPP_AUTH_PATH: z.string().min(1).default(".wwebjs_auth"),
  WHATSAPP_CLIENT_ID: z.string().min(1).default("wheretheyare"),
  CHROME_EXECUTABLE_PATH: z.string().optional(),
  WHATSAPP_WORKER_PORT: z.coerce.number().int().positive().default(3101),
  SERVER_BASE_URL: z.string().url().default("http://localhost:3100"),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export const readConfig = (environment: NodeJS.ProcessEnv = process.env): WorkerConfig => {
  const parsed = configSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(`Invalid WhatsApp worker configuration: ${parsed.error.message}`);
  }

  return parsed.data;
};
