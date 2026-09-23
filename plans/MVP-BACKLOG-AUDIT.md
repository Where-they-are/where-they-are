# Where They Are MVP Backlog Audit

_Last reviewed: 2026-09-23_  
_Basis: `plans/MVP-SCOPE.md` as the authoritative scope boundary_

## Executive conclusion

The repository has **no uncommitted changes**, no source-level `TODO` or `FIXME` markers, and no separate backlog file containing hidden implementation tasks. The current backlog is distributed across `CONTEXT.md`, `plans/TECHNICAL-SPEC.md`, `plans/api-v1.openapi.yaml`, `plans/USER-STORIES.md`, and `plans/E2E-TEST-SCENARIOS.md`.

The core MVP backlog is aligned when it is limited to the acquisition-to-publication journey:

```text
WhatsApp intake -> grounded generation -> private preview -> approval -> Paynow -> manual domain -> publication -> hosting lifecycle
```

Several items in the broader planning documents are **not aligned with the MVP Charter** and must remain deferred. The most important conflicts are full operations consoles, support queues, audit-event platforms, team and invitation management, portal content editing, object-storage migration, BullMQ adoption before a proven bottleneck, advanced analytics, and broad account-management surfaces.

## 1. Repository-state audit

| Area | Finding | Scope result |
|---|---|---|
| Git working tree | Clean at review time | No uncommitted implementation requires classification |
| Source markers | No `TODO`, `FIXME`, `XXX`, or obvious unimplemented markers found under `apps/` or `packages/` | No hidden code backlog detected |
| Current backend | Central NestJS server, Prisma/PostgreSQL repositories, WhatsApp worker, jobs worker, shared site origin, and Jev/OpenRouter routing exist | Architecture is consistent with the charter |
| Current tests | Test-kit contains contract, repository/integration, E2E, smoke, and Jev unit coverage | Testing foundation is aligned |
| Planning documents | Several documents describe P0/P1, P2, and Future work together | Backlog needs active filtering before implementation |

The clean working tree means this audit does not identify files that need to be unstaged, reverted, or committed.

## 2. Pending work that is aligned with the MVP

These items may remain in the active backlog because they directly support delivery, payment, publication, hosting revenue, or a critical security boundary.

### 2.1 Production authentication boundary

Replace the development-only `x-user-id` and business-membership headers with a real session or Better Auth integration for protected customer routes. The implementation must remain narrow: authenticate the customer, resolve the active business membership, protect tenant data, and support the minimum portal/deep-link entry required by the customer journey.

Do not expand this into teams, invitations, staff workspaces, fine-grained permissions, account-security UX, or an enterprise identity platform. Those are separate and out of scope.

### 2.2 Paynow payment creation and callback verification

Complete the Paynow adapter, hosted-payment handoff, verified callback handling, idempotent payment transitions, and server-owned payment truth. This is a direct MVP requirement because the approved customer journey includes payment before publication.

The implementation should cover the website fee and the defined hosting/domain lifecycle without adding refunds infrastructure, coupons, credits, affiliate payments, reseller billing, or multiple payment providers.

### 2.3 WhatsApp persistence mapping

Associate WhatsApp conversations and messages with the correct business and site. Preserve intake snapshots, message identifiers, deduplication, and the connection between a customer conversation, preview, release, approval, and payment.

This is aligned because the MVP starts on WhatsApp. It must not become a general inbox, omnichannel CRM, or operator messaging product.

### 2.4 Grounded intake, preview, approval, and revision flow

Complete the minimum confirmation and revision state needed to ensure that customer facts are reviewed before generation, previews are private, approvals identify an exact release, and revisions respect the plan limit. Change requests should remain WhatsApp-led for the MVP; a portal may display state but must not become a general content editor.

### 2.5 Publication and manual domain workflow

Provide a server-owned publication state and a manual `.co.zw` domain lifecycle. The deployment adapter may remain disabled or manually operated while the larger VPS decision is pending. Do not build a new deployment platform or per-tenant applications.

The minimum lifecycle is:

```text
approved -> payment confirmed -> domain work -> deployment/publication -> live
```

### 2.6 Basic retention, rate limiting, and reminders

Connect the existing contact-submission retention fields to a bounded cleanup mechanism, preserve starred submissions, apply basic public-form abuse protection, and support the minimum hosting/domain reminders. These are operational requirements for the stated MVP behavior.

They must not expand into a notification center, campaign automation platform, advanced fraud system, or customer-support suite.

### 2.7 Core verification

Continue adding tests for the customer journey, tenant isolation, payment callback idempotency, preview privacy, approval/revision limits, manual domain states, contact-form retention, and publication status. Tests should remain focused on observable MVP behavior and should not force implementation of deferred infrastructure.

## 3. Work that is aligned but should be sequenced later

These items are acceptable only after the critical path is reliable. They should not displace payment, WhatsApp association, publication, or hosting lifecycle work.

| Work | Allowed MVP boundary | Do not expand into |
|---|---|---|
| First useful portal | Show site, preview, release, payment, domain, hosting, enquiry, and publication states | Full account-management suite or portal CMS |
| Basic analytics | Traffic, WhatsApp clicks, phone clicks, and contact submissions | Funnels, cohorts, attribution, heatmaps, session recording, or ad optimization |
| Basic support | A WhatsApp/manual escalation path that preserves business, site, release, payment, and domain context | Support queues, assignments, SLAs, operator dashboards, or ticketing workflows |
| Modular design registry | Approved modules, variants, themes, and page recipes for the defined business groups and plans | Arbitrary free-form website generation or a drag-and-drop builder |
| Release history | The minimum history needed to review a candidate, request a change, approve a release, and identify the live version | A full release-management console |
| Conversation persistence | Server-owned WhatsApp records and intake snapshots | Customer inbox UI, omnichannel messaging, or CRM automation |

## 4. Backlog items that must be deferred or narrowed

### 4.1 Full operations console

`OPS-01` through `OPS-07` in the user stories are explicitly Future scope. The technical specification also proposes an operations module, operator-only contracts, retries, audit views, manual queues, and deployment reconciliation.

These must not enter the MVP implementation backlog. The MVP may retain server-side state and a manual owner escalation path, but it does not need an `/ops` product, operator dashboard, support queue, generation monitor, release console, domain queue, or support console.

### 4.2 Full support-case platform

The current technical specification and API plan describe listable support cases, assignment, severity, response deadlines, team waiting states, and operator resolution. That crosses the charter’s boundary against full support-ticket queues and SLA management.

Keep only the smallest support boundary needed for the MVP: a customer can request human help, the system preserves relevant context, and the business owner can respond through the existing operational channel. Do not build support-case listing, assignment, queue filtering, SLA dashboards, or a separate support inbox.

### 4.3 Audit-event platform

The technical specification lists `AuditEvent` as a required model and the E2E plan includes a dedicated audit trace. A full audit system is explicitly out of scope.

The MVP may retain actor, timestamp, release, payment, domain, and state-transition metadata where needed for safety and debugging. It must not add a general audit-event model, audit views, compliance reporting, immutable event history for every resource, or an operator audit console unless the scope charter is explicitly changed.

### 4.4 Teams, invitations, and fine-grained permissions

The technical specification includes member invitations, role changes, capabilities, team management, and account-team screens. These are not required to prove the core business model. Keep the minimum owner/business membership guard needed for tenant isolation and defer team workspaces, invitations, staff management, and permission UX.

### 4.5 Portal content editing

The technical specification proposes `PATCH` operations for structured setup facts and content fields. The agreed MVP decision is that customers request edits through WhatsApp rather than editing through the portal.

The portal may display confirmed facts, preview state, feedback state, and revision count. Do not implement a portal CMS, arbitrary content patching, or a customer-facing content editor.

### 4.6 BullMQ and broad queue infrastructure

The current context says generation jobs are modeled but not fully queued through BullMQ. The charter explicitly defers queue infrastructure until a proven MVP bottleneck exists.

Continue with a simple jobs worker or synchronous compatibility mode where adequate. Add BullMQ, Redis, retries, scheduling, and distributed orchestration only after measured delivery volume demonstrates that the simple path is failing.

### 4.7 Object storage and media platform

The technical specification proposes an object-storage media model with scanning and expiry. The charter defers object-storage migration until local or VPS-backed artifacts are a demonstrated limitation.

For MVP, accept WhatsApp media, process it safely, preserve only the minimum metadata needed for the intake or approved site, and clean up temporary artifacts. Do not build a general media library, media-management UI, object-storage abstraction, or malware-scanning platform prematurely.

### 4.8 Notification center and account-management screens

Profile, notifications, security, team, conversation inbox, and account-detail screens appear in the broader user stories. They should not enter the current implementation queue. Hosting and domain reminders may be delivered through the minimum approved channel, especially WhatsApp, without building a notification center.

### 4.9 Advanced analytics and intelligence

Do not implement funnels, attribution, cohorts, heatmaps, session replay, predictive lead scoring, recommendation systems, A/B testing, personalization, autonomous sales agents, or persistent Jev decision auditing. The MVP needs only basic traffic and conversion-action reporting plus Jev routing before expensive model calls.

## 5. Planning-document conflicts to resolve by interpretation

The planning documents are useful design references, but they contain more surface area than the MVP Charter permits. The following interpretation is mandatory until the charter changes:

| Planning source | Conflict or risk | Required interpretation |
|---|---|---|
| `TECHNICAL-SPEC.md` required models | `SupportCase`, `AuditEvent`, and `MediaAsset` object-storage requirements are broader than MVP | Keep only bounded support context, ordinary state metadata, and minimal media handling |
| `TECHNICAL-SPEC.md` implementation sequence | Steps 11–13 include support API, conversation API, and operations API | Split them: minimal WhatsApp support/persistence may be MVP; full support, inbox, and operations remain deferred |
| `TECHNICAL-SPEC.md` API resources | Content patching, team invitations, capability UX, and operations contracts exceed scope | Do not implement customer portal editing, teams, or operations routes |
| `api-v1.openapi.yaml` | `/support-cases` is defined as a list/create support product | Treat it as a future contract or reduce it to a minimal escalation boundary before implementation |
| `USER-STORIES.md` | Future operations stories are correctly labelled but Slice F includes them | Execute only the blocked-case-to-manual-support portion; exclude operator console and queue stories |
| `USER-STORIES.md` | Suggested order includes P1/P2 account, team, notification, and profile stories | Do not treat the suggested order as an active MVP backlog |
| `E2E-TEST-SCENARIOS.md` | Some P0 security/audit/support scenarios assume out-of-scope systems | Retain observable tenant and state-integrity checks, but remove dependencies on audit consoles, teams, or support queues |
| `MODULAR-DESIGN-SYSTEM-PLAN.md` | A large module inventory could be mistaken for a page-builder roadmap | Build only approved modules needed for the supported business groups and plans |

## 6. Recommended active backlog

The active backlog should contain only these items, in this order:

1. Replace development header authentication with a narrow production session boundary.
2. Persist WhatsApp chat and message association to business, site, and intake records.
3. Complete Paynow hosted-payment creation and verified callback reconciliation.
4. Complete the WhatsApp-led approval and revision flow with plan limits.
5. Connect manual `.co.zw` domain requests and publication status to the shared site origin.
6. Connect bounded contact-submission expiry and basic public-form abuse protection.
7. Expose the minimum portal and WhatsApp status needed for preview, payment, domain, hosting, enquiry, and publication states.
8. Add focused tests for the full customer journey and the critical tenant/payment/publication boundaries.
9. Validate delivery speed, site quality, conversion, hosting retention, and operating cost with real customers.

The active backlog must not add another product category until these items are validated.

## 7. Backlog admission rule

Before a task is added to the active backlog, the requester must identify:

- The exact approved customer-journey step it supports.
- The target plan or all-plan behavior it affects.
- The smallest implementation that proves value.
- The operational or revenue outcome expected.
- The test that demonstrates completion.
- The work that will be removed or deferred if the task increases MVP surface area.

If these details are missing, the task is not ready. If the proposal is outside the charter, an agent must push back and must not create implementation todos until the scope-change record is updated and explicitly approved.

## References

[1]: MVP-SCOPE.md "Where They Are MVP Scope Charter"

[2]: ../CONTEXT.md "Where They Are project context"

[3]: TECHNICAL-SPEC.md "Where They Are Technical Specification and API Contract Plan"

[4]: USER-STORIES.md "Where They Are Detailed User Stories"

[5]: E2E-TEST-SCENARIOS.md "Where They Are E2E Test Scenarios"
