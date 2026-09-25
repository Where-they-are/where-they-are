FROM node:24-slim AS builder
RUN npm install -g pnpm@11
WORKDIR /app
# WhatsApp Web runs on the system Chromium installed in the runner.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY . .
RUN --mount=type=cache,target=/pnpm-store pnpm install --frozen-lockfile --store-dir /pnpm-store
RUN pnpm --filter @where-they-are/whatsapp-agent build

# Only Angel's production dependencies go into the image, not the whole
# workspace's node_modules.
RUN --mount=type=cache,target=/pnpm-store \
	pnpm --filter @where-they-are/whatsapp-agent deploy --prod --legacy --store-dir /pnpm-store /out \
	&& cp -r apps/whatsapp-agent/dist /out/dist \
	&& rm -rf /out/src /out/scripts

FROM node:24-slim AS runner
RUN apt-get update \
	&& apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium
# Conversation memory, the CRM and the WhatsApp session all live in /data:
# mount a persistent volume there or every deploy logs WhatsApp out.
ENV AGENT_DATA_DIR=/data
ENV WHATSAPP_AUTH_PATH=/data/wwebjs_auth
ENV AGENT_PORT=3104

WORKDIR /app
COPY --from=builder --chown=node:node /out ./
RUN mkdir -p /data && chown node:node /data

USER node
VOLUME ["/data"]
EXPOSE 3104
CMD ["node", "--import", "varlock/auto-load", "dist/main.js"]
