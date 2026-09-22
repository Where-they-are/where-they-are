# Where They Are ÔÇö Project Context

_Last updated: 2026-09-22_

## Project identity

**Project:** `wheretheyare.co.zw`

Where They Are is a Zimbabwe-focused service that helps small businesses get modern brochure websites quickly and affordably. The core promise is:

> Meet your customers where they are.

The initial target customers include event organizers, small restaurants, salons, barbers, lawyers, professional services, private schools, and other small and medium-sized businesses in Zimbabwe.

## Business model

The service offers three website plans with different design depth, included features, revision limits, and support levels:

- **Starter:** $50 website fee, $5/month hosting, $5/year domain.
- **Growth:** $150 website fee, $10/month hosting, $5/year domain.
- **Premium:** $450 website fee, $20/month hosting, $5/year domain.

The initial business objective is to prove that a high-quality site can be delivered in minutes and to build recurring monthly revenue through hosting.

Domain registration is initially manual because a suitable Zimbabwean domain-registration API is not currently available. The first domain scope is `.co.zw`.

## Customer acquisition and delivery flow

The intended sales flow is:

```text
Meta advertisement
  -> WhatsApp conversation
  -> Validated customer intake
  -> AI-generated private/watermarked preview
  -> Paynow payment
  -> Customer approval or requested changes
  -> Site publication
  -> Hosting/domain lifecycle management
```

The system should be approximately 80% automated. WhatsApp is the primary customer interface for the MVP. Customers can send text, English voice notes, and images. Contact-form submissions are retained in the client area for up to one month unless starred.

## Architecture

This is a pnpm/Turborepo monorepo. Frontend applications are intentionally isolated from backend responsibilities.

```text
apps/
Ôö£ÔöÇÔöÇ web/                 # Next.js client portal; frontend-only
Ôö£ÔöÇÔöÇ marketing/           # Astro SEO marketing site; static/frontend-only
Ôö£ÔöÇÔöÇ server/              # Central NestJS backend; owns all backend logic
Ôö£ÔöÇÔöÇ worker-whatsapp/     # whatsapp-web.js transport and AI intake adapter
Ôö£ÔöÇÔöÇ worker-jobs/         # Background jobs and queue integration
ÔööÔöÇÔöÇ site-origin/         # Public tenant/preview origin; proxies to server

packages/
Ôö£ÔöÇÔöÇ config/              # Shared TypeScript/configuration conventions
Ôö£ÔöÇÔöÇ contracts/           # Shared Zod schemas and API contracts
Ôö£ÔöÇÔöÇ db/                  # Prisma 7/PostgreSQL; server-only database access
Ôö£ÔöÇÔöÇ server-client/       # Typed HTTP client used by apps/workers
Ôö£ÔöÇÔöÇ test-kit/            # Reusable unit, smoke, and Playwright verification
ÔööÔöÇÔöÇ ui/                  # Shared UI package for frontend applications
```

### Central server rule

`apps/server` is the only backend application. It is a NestJS API and is responsible for:

- Authentication and tenant authorization.
- Business/customer management.
- Conversations, messages, and intakes.
- Site-generation requests and jobs.
- Site releases and preview metadata.
- Coolify deployment orchestration.
- Billing, payments, domains, support, analytics, and lifecycle operations as they are implemented.

The Next.js portal, Astro marketing site, workers, and site-origin must not acquire independent database access or duplicate backend business logic. They communicate with the NestJS server through `@where-they-are/server-client` and shared contracts.

### Tenant hosting model

The intended hosting model is a shared static site origin rather than a separate application/container for every customer. Tenant identity is resolved by domain/subdomain and release metadata. Coolify manages the shared deployable resource, while the server manages tenant releases and publication state.

## Implemented capabilities

### Monorepo apps and workers

The monorepo contains the portal, Astro marketing application, WhatsApp worker, jobs worker, site-origin process, and central NestJS server workspace.

### WhatsApp intake

`apps/worker-whatsapp` currently:

- Uses `whatsapp-web.js` with persistent `LocalAuth`.
- Accepts text, image, and audio/voice-note messages.
- Normalizes media into structured message data.
- Uses Mastra with OpenRouter Gemini 3 Flash.
- Produces a Zod-validated intake object.
- Dispatches the validated intake to the central server.
- Logs the generated preview URL returned by the server.

### Central NestJS API

`apps/server` currently exposes:

- `GET /api/health`
- `POST /api/sites/generate`
- `GET /api/previews/:previewSlug`
- `POST /api/deployments`
- `POST /api/auth/bootstrap`
- `GET /api/auth/businesses/:businessId/membership`
- `GET /api/businesses/:businessId`
- `POST /api/businesses/:businessId/members`
- `POST /api/businesses/:businessId/sites`
- `GET /api/businesses/:businessId/sites`
- `GET /api/businesses/:businessId/sites/:siteId`
- `POST /api/businesses/:businessId/sites/:siteId/generate`
- `GET|POST /api/businesses/:businessId/payments`
- `GET /api/businesses/:businessId/payments/:paymentId`
- `POST /api/businesses/:businessId/payments/:paymentId/status`
- `GET|POST /api/businesses/:businessId/domains`
- `GET /api/businesses/:businessId/domains/:domainId`
- `POST /api/businesses/:businessId/domains/:domainId/status`
- `GET|POST /api/businesses/:businessId/billing/subscriptions`
- `POST /api/businesses/:businessId/billing/subscriptions/:subscriptionId/status`
- `GET|POST /api/businesses/:businessId/billing/invoices`
- `POST /api/businesses/:businessId/billing/invoices/:invoiceId/status`
- `POST /api/public/sites/:siteId/contact-submissions`
- `GET /api/businesses/:businessId/contact-submissions`
- `GET /api/businesses/:businessId/contact-submissions/:submissionId`
- `POST /api/businesses/:businessId/contact-submissions/:submissionId/read`
- `POST /api/businesses/:businessId/contact-submissions/:submissionId/star`
- `POST /api/businesses/:businessId/contact-submissions/:submissionId/status`
- `GET|POST /api/businesses/:businessId/sites/:siteId/feedback`
- `GET /api/businesses/:businessId/sites/:siteId/approvals/:releaseId`
- `POST /api/businesses/:businessId/sites/:siteId/approve`
- `GET /api/businesses/:businessId/sites/:siteId/publication/status`
- `POST /api/businesses/:businessId/sites/:siteId/publication/deployments`
- `POST /api/businesses/:businessId/sites/:siteId/publication/deployments/:deploymentId/status`

The server includes:

- Approved deterministic template selection.
- `service-pro`, `hospitality`, and `events-community` templates.
- Safe static HTML rendering with HTML escaping.
- Mastra/OpenRouter site-specification generation when an OpenRouter key is configured.
- Deterministic fallback generation when no OpenRouter key is configured.
- Coolify deployment triggering by resource UUID.
- No-index preview headers.
- Tenant authentication guard using active business membership and role checks.
- Business management endpoints for membership and site creation.
- Tenant-aware site listing, detail, and generation endpoints.
- Tenant-scoped payments with provider/status/purpose records; Paynow remains a provider boundary and payment truth is server-owned.
- Manual `.co.zw`/custom domain requests with registration, verification, expiry, and customer-facing lifecycle status.
- Hosting subscriptions and invoices with server-generated invoice numbers and lifecycle status.
- Public contact enquiries with consent validation, idempotency keys, one-month retention, starring, read, and archive state.
- Classified site feedback and explicit owner/admin release approval with stale-release protection.
- Publication status aggregation across approval, payment, domain, deployment, and live-site state.

### Shared contracts and client

`packages/contracts` contains Zod schemas for:

- Validated AI intake objects.
- Site plans and templates.
- Site specifications and sections.
- Generation requests/responses.
- Deployment requests/responses.

`packages/server-client` provides typed methods for:

- Central server health.
- Site generation.
- Preview URLs and HTML.
- Deployment requests.

### Prisma/PostgreSQL foundation

`packages/db` now contains a Prisma 7/PostgreSQL schema and server-only client boundary.

Implemented models include:

- `User`
- `Business`
- `BusinessMember`
- `Site`
- `SiteRelease`
- `GenerationJob`
- `Conversation`
- `Message`
- `Intake`
- `Payment`
- `Domain`
- `Subscription`
- `Invoice`
- `ContactSubmission`
- `SiteFeedback`
- `SiteApproval`
- `Deployment`

Implemented enums cover user roles, membership states, site states, generation states, conversation channels/statuses, message directions, message kinds, payment states, domain states, subscription/invoice states, contact retention states, feedback/approval states, and deployment states.

Implemented repository functions cover:

- Creating businesses with owners.
- Adding business members.
- Verifying business membership and roles.
- Creating and finding sites.
- Creating generation jobs.
- Creating tenant-scoped releases.
- Finding releases by business.
- Upserting conversations without cross-tenant reassignment.
- Appending messages.
- Creating intakes.
- Creating and updating tenant-scoped payments and domains.
- Creating and updating subscriptions and invoices.
- Creating deduplicated contact enquiries and applying retention/star behavior.
- Creating classified site feedback and release approvals.
- Creating deployment records and aggregating publication prerequisites.

### Release metadata storage

The release store supports two modes:

- `DATABASE_ENABLED=false`: local file-backed release metadata for development.
- `DATABASE_ENABLED=true`: PostgreSQL-backed release metadata and ownership validation, with generated HTML artifacts still stored on disk.

Database-backed generation requires `businessId` and `siteId` on the generation request.

### Verification package

`packages/test-kit` contains:

- Vitest contract tests.
- Mocked `ServerClient` tests.
- NestJS/site-origin smoke tests.
- Read-only Coolify health smoke tests.
- Optional Coolify deployment smoke tests.
- Playwright portal tests.
- Playwright central API and preview tests.

See [`TESTING.md`](./TESTING.md) for setup and commands.

## Current progress at last update

The Prisma client has been generated successfully and the Prisma schema has been validated successfully after approving the Prisma build scripts. The initial PostgreSQL migration is applied and `prisma migrate status` reports the database is up to date. The configured PostgreSQL database has been seeded successfully. The user has provided a valid OpenRouter key and database URL through the local environment.

The database, first tenant backend, and lean features 13–18 implementation phase is complete. The current verification status is:

1. Prisma generation, schema validation, migration status, and seed pass.
2. Five live PostgreSQL repository integration tests pass.
3. The NestJS server type check and test-kit type check pass.
4. The database-backed API E2E passes for bootstrap, membership, business lookup, authorization, site creation/list/detail, generation, release persistence, preview retrieval, and cross-tenant rejection.
5. Features 13–18 now cover payments, domains, billing, contact enquiries, site feedback/approval, and publication-state aggregation. Their Prisma migrations have been created and applied locally, and the server/database type checks pass after regeneration.
6. `packages/test-kit/src/integration/lean-features.test.ts` and the database API E2E flow cover the lean feature set; after the latest file-only edits, the user must rerun the commands below to confirm the final tree.
7. The next backend phase is production session/auth integration, Paynow callback integration, WhatsApp persistence mapping, and queue processing.

The frontend is intentionally not the current priority. Design and frontend product work will be handled separately with a designer.

The available product-planning document in `plans/` is `USER-STORIES.md`; it references `USER-FLOWS.md`, but that file is not currently present. The available stories and end-to-end slices were reviewed. The implementation intentionally keeps only the core customer journey and leaves teams, support queues, audits, advanced analytics, and future operations-console capabilities out of scope.

## Known limitations and next backend work

- Authentication currently uses a bootstrap endpoint plus `x-user-id`/business membership headers as a development boundary; a production session/auth provider is still required.
- Better Auth/session integration has not yet been wired to the NestJS server.
- Business-management HTTP endpoints now exist for membership and site creation; teams, invitations, and advanced account management remain intentionally out of scope.
- The WhatsApp worker does not yet map a WhatsApp chat to a persisted business/site.
- PostgreSQL release metadata has been implemented behind `DATABASE_ENABLED=true`; migration, seed, repository integration tests, and database-backed release E2E all pass.
- Generation jobs are modeled but are not yet fully queued through BullMQ.
- File artifacts are still local filesystem artifacts rather than object-storage artifacts.
- Coolify deployment is currently a typed adapter around deployment triggering; the new deployment record provides a server-owned lifecycle state, while external reconciliation remains pending.
- Paynow hosted-payment creation/callback verification is not yet wired; payment records and status transitions are ready for that provider adapter.
- Advanced analytics, support queues, operator consoles, audit systems, teams, invitations, and permission-management UX are intentionally out of scope for this phase.
- Public contact submissions currently have validation, idempotency, retention, starring, reading, and archiving primitives; rate limiting and scheduled expiry execution still need to be connected to the runtime.

## Development rules

1. Frontend applications must remain frontend-only.
2. `apps/server` is the only backend and database boundary.
3. Use shared contracts rather than duplicating request/response schemas.
4. Scope all customer-owned database queries by `businessId` and verify membership/role where appropriate.
5. Do not invent customer facts in AI-generated content.
6. Use deterministic approved templates; AI may produce structured content within those boundaries.
7. Break every feature into small, modular todos before implementation.
8. Create a separate Git commit for each modular todo.
9. Do not install packages automatically when the user has asked to run installation commands themselves.
10. Run the appropriate type checks, unit tests, smoke tests, and end-to-end tests before marking a feature complete.

The current database verification commands are `pnpm --filter @where-they-are/db db:generate`, `pnpm --filter @where-they-are/db db:validate`, `pnpm --filter @where-they-are/db db:seed`, `pnpm run test:db`, and `pnpm run test:e2e:db`. The new local migrations are named `add_payments`, `add_domains`, `add_billing`, `add_contact_submissions`, `add_feedback_approvals`, and `add_publication_state`.

## Context maintenance rule

Whenever a feature, migration, architecture decision, or important integration is implemented, update this file in the same task. Update at least:

- `last updated` date.
- Implemented capabilities.
- Current progress.
- Known limitations and next backend work.
- Any new environment variables or operational commands.

Keep this document factual and concise enough for a new agent to understand the project without reading the entire repository history.
