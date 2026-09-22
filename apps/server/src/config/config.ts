import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SERVER_PORT: z.coerce.number().int().positive().default(3100),
  DATABASE_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  PORTAL_ORIGIN: z.string().url().default("http://localhost:3001"),
  PUBLIC_SITE_ORIGIN: z.string().url().default("http://localhost:3103"),
  PREVIEW_SITE_ORIGIN: z.string().url().default("http://localhost:3103"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("google/gemini-3-flash-preview"),
  COOLIFY_API_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  COOLIFY_API_TOKEN: z.string().optional(),
  COOLIFY_SITE_RESOURCE_UUID: z.string().optional(),
});

export type ServerConfig = z.infer<typeof configSchema>;

export const readServerConfig = (environment: NodeJS.ProcessEnv = process.env): ServerConfig => {
  const parsed = configSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(`Invalid server configuration: ${parsed.error.message}`);
  }

  return parsed.data;
};
