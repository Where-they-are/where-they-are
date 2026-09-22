export const siteOriginConfig = {
  port: Number(process.env.SITE_ORIGIN_PORT ?? 3103),
  serverBaseUrl: process.env.SERVER_BASE_URL ?? "http://localhost:3100",
};
