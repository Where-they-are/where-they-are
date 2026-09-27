# Angel (Where They Are WhatsApp agent): Dockerfile
#
# Adapted from the proven WD Logistics agent image, fitted to this pnpm
# monorepo. Build from the REPO ROOT, not from apps/whatsapp-agent:
#
#   docker build -f apps/whatsapp-agent/Dockerfile .
#
# (Coolify's Dockerfile build pack does exactly this when "Base Directory" is
# the repo root and the Dockerfile location is apps/whatsapp-agent/Dockerfile.)
#
# whatsapp-web.js drives a real Chromium through Puppeteer. The Puppeteer
# download is skipped before install so the apt Chromium below is the only
# browser in the image; CHROME_EXECUTABLE_PATH (read by Angel) and
# PUPPETEER_EXECUTABLE_PATH both point at it.
#
# The session, conversation memory and CRM all live in /data: mount a
# persistent volume there or every deploy logs WhatsApp out and loses leads.

# ============================================================================
# Stage 1: install, build, and collect Angel's production dependencies
# ============================================================================
FROM node:24-bookworm-slim AS builder

RUN npm install -g pnpm@11

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CI=true

WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @where-they-are/whatsapp-agent build

# Only Angel's production dependencies go into the image, not the whole
# workspace's node_modules (this is what kept the image small enough for the
# VPS disk).
RUN pnpm --filter @where-they-are/whatsapp-agent deploy --prod --legacy /out \
    && cp -r apps/whatsapp-agent/dist /out/dist \
    && rm -rf /out/src /out/scripts

# ============================================================================
# Stage 2: runtime
# ============================================================================
FROM node:24-bookworm-slim AS runtime

# Chromium plus the shared libraries whatsapp-web.js needs to launch it
# headless in a container (no X server). Angel starts Chromium with
# --no-sandbox, so no chromium-sandbox or SYS_ADMIN capability is needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
    AGENT_DATA_DIR=/data \
    WHATSAPP_AUTH_PATH=/data/wwebjs_auth \
    AGENT_PORT=3104

WORKDIR /app

COPY --from=builder --chown=node:node /out ./

# WhatsApp session (LocalAuth), Mastra memory and the CRM live here.
RUN mkdir -p /data && chown -R node:node /data /app

USER node
VOLUME ["/data"]
EXPOSE 3104

# /api/health answers as soon as the HTTP server is up, even while WhatsApp
# is still linking. Chromium makes the first start slow, hence the long
# start period.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://localhost:3104/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# The shared workspace package (jev-router) ships TypeScript source. pnpm
# deploy copies it into node_modules, where Node refuses to strip types, so
# tsx compiles it at load time. Angel's own code runs from the compiled dist/.
CMD ["node", "--import", "tsx", "--import", "varlock/auto-load", "dist/main.js"]
