# Where They Are Testing Runbook

This repository uses a layered verification strategy. Fast unit and contract tests run without external services. Smoke tests exercise the running NestJS server and site-origin proxy. Playwright tests verify browser-visible behavior and API flows. Coolify checks are separate because they require access to the real deployment control plane.

## One-time installation

The implementation intentionally does not install packages or browser binaries automatically. Run the following commands once from the repository root:

```bash
pnpm install
pnpm --dir packages/test-kit exec playwright install chromium
```

If the development machine is Linux and Playwright reports missing system libraries, use this instead:

```bash
pnpm --dir packages/test-kit exec playwright install --with-deps chromium
```

## Environment setup

Create the environment files from the committed schemas. The server needs `OPENROUTER_API_KEY` for Gemini generation. If the key is absent, the server uses the deterministic approved-template fallback, which is useful for local smoke tests.

The minimum local values are:

```env
# apps/server/.env
SERVER_PORT=3100
PREVIEW_SITE_ORIGIN=http://localhost:3103
OPENROUTER_MODEL=google/gemini-3-flash-preview

# apps/site-origin/.env
SERVER_BASE_URL=http://localhost:3100

# apps/web/.env.local
NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:3100
```

For the WhatsApp worker, add `OPENROUTER_API_KEY`, `SERVER_BASE_URL`, and the persistent WhatsApp session settings defined in `apps/worker-whatsapp/.env.schema`. For Coolify checks, add `COOLIFY_API_URL`, `COOLIFY_API_TOKEN`, and, for a write deployment check, `COOLIFY_SITE_RESOURCE_UUID`.

## Commands

Run the fast checks first:

```bash
pnpm run test:unit
pnpm run check-types
pnpm --filter server run build
pnpm --filter @where-they-are/worker-whatsapp run test
```

Start the services in separate terminals:

```bash
pnpm --filter server dev
pnpm --filter @where-they-are/site-origin dev
pnpm --filter web dev
```

Then run the service smoke test. It verifies the NestJS health endpoint, site generation, no-index preview headers, and the site-origin preview proxy:

```bash
pnpm run test:smoke
```

Run the browser tests against the portal and central API:

```bash
pnpm run test:e2e
```

The Playwright report is written to `packages/test-kit/playwright-report`. Traces and screenshots are retained for failed tests.

Run the read-only Coolify check:

```bash
pnpm run test:coolify
```

The optional write mode triggers a deployment for the configured Coolify resource. Use it only against a safe staging resource:

```bash
pnpm run test:coolify -- --write
```

## Test responsibilities

Unit tests should cover deterministic functions, Zod contracts, template selection, HTML escaping, and provider adapters through mocked fetchers. They should not require PostgreSQL, Redis, WhatsApp Web, OpenRouter, or Coolify.

Smoke tests should cover the running service boundaries. A smoke test must fail when a service returns an unexpected status, when a response misses required identifiers, when preview HTML is missing the business name, or when preview indexing protection is missing.

Playwright tests should cover user-visible outcomes. They should verify that the portal loads, reports central-server status, submits valid generation requests, displays a preview, and handles server unavailability without hanging indefinitely.

Coolify checks should be opt-in and clearly split into read-only health verification and deployment-triggering verification. The write command must never run in CI unless a staging resource is explicitly supplied.

## CI order

A production pipeline should run in this order:

1. `pnpm install --frozen-lockfile`.
2. `pnpm run test:unit`.
3. `pnpm run check-types`.
4. Build the server, portal, marketing site, workers, and site origin.
5. Start the server and site origin with deterministic fallback generation.
6. Run `pnpm run test:smoke`.
7. Start the portal and run `pnpm run test:e2e`.
8. Run the read-only Coolify check only when Coolify credentials are present.

The WhatsApp worker should be tested separately from the browser suite because it requires a persistent WhatsApp session and must never be connected to a production number by an automated CI job.
