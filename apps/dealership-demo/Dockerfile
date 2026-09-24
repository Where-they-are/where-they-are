FROM node:24-slim AS builder
RUN npm install -g pnpm@11
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/pnpm-store pnpm install --frozen-lockfile --store-dir /pnpm-store

# Public values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3002
ARG NEXT_PUBLIC_WTA_WHATSAPP_NUMBER=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_WTA_WHATSAPP_NUMBER=$NEXT_PUBLIC_WTA_WHATSAPP_NUMBER
ENV NODE_ENV=production

RUN cd apps/dealership-demo && pnpm run build && rm -f .next/standalone/.env* .next/standalone/apps/dealership-demo/.env*

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# The node user must own .next so the image optimizer can write its cache.
COPY --from=builder --chown=node:node /app/apps/dealership-demo/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/dealership-demo/.next/static ./apps/dealership-demo/.next/static
COPY --from=builder /app/apps/dealership-demo/public ./apps/dealership-demo/public
# auto-load needs the Varlock CLI and its installed dependencies.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/dealership-demo/.env.schema ./apps/dealership-demo/.env.schema

ENV HOSTNAME=0.0.0.0
ENV PORT=3002
EXPOSE 3002

USER node
WORKDIR /app/apps/dealership-demo
CMD ["node", "--import", "varlock/auto-load", "server.js"]
