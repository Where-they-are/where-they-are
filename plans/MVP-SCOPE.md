# Where They Are MVP Scope Charter

_Last updated: 2026-09-23_  
_Status: Authoritative scope-control document_

> **Scope rule:** The MVP exists to prove that Where They Are can deliver a modern, credible brochure or service website to a Zimbabwean small business in minutes and convert that delivery into recurring hosting revenue. Every feature must directly support that outcome or the minimum operation required to deliver it.

This document is binding guidance for product decisions, implementation tasks, design work, testing, and AI-agent behavior. It supplements `AGENTS.md` and `CONTEXT.md`.

## 1. MVP objective

Where They Are is a Zimbabwe-focused website creation service for small businesses. A customer begins on WhatsApp after seeing an advertisement, provides business information through text, English voice notes, or images, receives a private AI-generated website preview, pays through Paynow, approves the result or requests changes, and receives a published website.

The MVP must prove two things:

1. A high-quality, non-generic brochure or service site can be produced quickly with approximately 80% automation.
2. Customers will pay for website creation and continue paying for hosting and domain services.

The MVP is not intended to become a general-purpose website builder, enterprise CRM, booking platform, ecommerce platform, or operations suite.

## 2. Target customers

The first customers are Zimbabwean small and medium-sized businesses that need a professional online presence but do not need a complex web application. Initial business groups are:

- Restaurants and hospitality.
- Beauty and grooming.
- Fitness and wellness.
- Professional services, including lawyers, accountants, and consultants.
- Local and home services.
- Events and community organizations.
- Education and care businesses.
- General SMEs that do not fit the first groups.

The modular design guidance for these groups is maintained in `plans/MODULAR-DESIGN-SYSTEM-PLAN.md`. That document defines visual concepts and module recipes; it does not authorize additional product features.

## 3. The only approved MVP customer journey

```text
Meta advertisement
  -> WhatsApp conversation
  -> Text, English voice note, or image intake
  -> Jev relevance and routing check
  -> Structured Gemini/OpenRouter intake extraction
  -> Private or watermarked preview on a Where They Are subdomain
  -> Paynow payment
  -> Customer approves or requests changes through WhatsApp
  -> One to five included revisions according to plan
  -> Manual domain registration where required
  -> Website publication
  -> Hosting, domain, reminder, and basic performance lifecycle
```

A proposed feature must fit this journey or directly reduce the cost, risk, or time of operating it. If it does not, it is not an MVP feature.

## 4. In scope for the MVP

### 4.1 Website product

The MVP may create modern static brochure and service websites. A site may include:

- A home page.
- About or story content.
- Services, offerings, menu, programmes, practice areas, or packages.
- Galleries using approved customer or licensed assets.
- WhatsApp, phone, email, and location actions when supplied.
- Google Maps or location information when supplied.
- Basic analytics and traffic reporting.
- Basic SEO for Growth and Premium.
- Contact forms for Growth and Premium.
- Responsive layouts and accessible content structure.
- Customer-approved pages included in the purchased plan.

The site must be assembled from approved modules, variants, themes, and page recipes. AI may select from the approved registry but may not invent arbitrary layouts, module types, unsupported plan features, or business facts.

### 4.2 Plan entitlements

| Capability | Starter | Growth | Premium |
|---|---:|---:|---:|
| Website creation fee | $50 | $150 | $450 |
| Hosting | $5/month | $10/month | $20/month |
| Domain | $5/year | $5/year | $5/year |
| Included revisions | 1 | 3 | 5 |
| Primary site format | Strong single-page brochure site | Home plus up to two additional pages | Home plus up to four additional pages |
| WhatsApp actions | Yes | Yes | Yes |
| Basic analytics | Yes | Yes | Yes |
| Gallery | Yes | Yes | Yes |
| Map/location section | When supplied | When supplied | When supplied |
| Contact form | No | Yes | Yes |
| Expanded SEO | No | Yes | Yes |
| Priority support | No | Yes | Yes |
| Visual depth | Clean and focused | Editorial and conversion-focused | Art-directed and distinctive |

The plan must be selected before generation and enforced by the server. A customer request cannot unlock a higher-plan capability without an upgrade or an approved manual exception recorded outside the automated flow.

### 4.3 Customer communication

WhatsApp is the primary customer interface for the MVP. The WhatsApp worker may:

- Accept text messages.
- Accept English voice notes.
- Accept images.
- Use Jev for strict routing and relevance decisions.
- Use Gemini through OpenRouter for structured intake extraction.
- Return concise follow-up questions for missing information.
- Send or log private preview links.
- Receive approval or change requests.
- Escalate operationally necessary manual work to the business owner.

The worker must not become a general conversational assistant. It should support the website purchase and delivery journey only.

### 4.4 Customer portal and operations

The portal and backend may provide only the minimum information needed for the MVP:

- Customer and business identity.
- Site and plan information.
- Preview and publication status.
- Payment and invoice status.
- Domain request status.
- Hosting renewal reminders.
- Basic traffic, WhatsApp-click, phone-click, and contact-form metrics.
- Contact-form submissions for up to one month unless starred.
- Approval, feedback, and revision state.
- Basic support contact information rather than a full support-ticket system.

Portal editing of website content is out of scope for the MVP. Changes are requested through WhatsApp and processed through the approved revision flow.

### 4.5 Payments and domains

Paynow is the MVP payment provider. The system may store payment records, payment status, invoice information, and provider references. Hosted payment creation and callback verification are part of the payment integration work, but the payment truth must remain server-owned.

Domain registration is manual during the MVP. The initial domain scope is `.co.zw`. The team manages the domain account and DNS. A domain request, manual registration status, verification status, expiry, and renewal reminder are in scope. Building a domain-reseller marketplace or integrating multiple registrars is not.

### 4.6 Hosting and publication

The MVP uses a shared site-origin model. It must not create a separate application or container for every customer site. Preview and published sites should resolve by subdomain or custom domain against shared release metadata and static artifacts.

Coolify is an infrastructure adapter, not a product feature. While the larger server decision is pending, deployment integration may remain disabled or mocked behind a typed boundary. Do not build a new deployment platform to compensate. The MVP still needs a clear publication state and a manual or adapter-backed release path.

## 5. Explicitly out of scope

The following work must not be added to the MVP unless this charter is deliberately changed.

### 5.1 Product features to defer

- Ecommerce, shopping carts, product checkout, stock management, and online ordering.
- Booking, appointment scheduling, calendars, availability, and live reservations.
- Memberships, subscriptions for end customers, courses, gated content, and customer accounts on tenant sites.
- Full content-management systems or drag-and-drop page builders.
- Customer self-editing through the portal.
- Arbitrary custom website layouts generated from free-form prompts.
- Per-customer web applications, dashboards, or complex dynamic functionality.
- Native mobile applications.
- Multi-language website generation beyond the current English MVP.
- Automated image generation as a standard workflow. Images may be supplied or handled through an explicitly approved future process.
- Chatbots embedded on customer websites.
- Advanced forms, multi-step application workflows, file-upload workflows, or CRM pipelines.

### 5.2 Operations and account features to defer

- Teams, invitations, staff workspaces, fine-grained permissions, and role-management UX beyond the minimum tenant guard.
- Audit logs and compliance reporting.
- Full support-ticket queues, operator consoles, SLA management, and agent inboxes.
- Advanced customer relationship management.
- Automated domain registration across multiple providers.
- Automated renewal collection beyond the minimum reminders and payment lifecycle.
- Complex refunds, credit systems, coupons, affiliate systems, and reseller accounts.
- White-labeling and agency multi-account management.

### 5.3 Analytics and intelligence to defer

- Advanced analytics dashboards, funnels, cohorts, attribution, heatmaps, session recording, or ad-platform optimization.
- Predictive lead scoring, recommendation systems, autonomous sales agents, or open-ended chatbots.
- Persistent Jev decision auditing, model experimentation platforms, or model-training pipelines.
- Automatic A/B testing and personalization.
- Generated business claims, synthetic testimonials, invented credentials, or fabricated performance figures.

### 5.4 Infrastructure and architecture to defer

- A separate deployment application for every tenant.
- A second backend in Next.js, Astro, or a worker.
- Multiple databases or independent database access from frontend applications.
- Kubernetes, microservice decomposition, event-sourcing, or distributed workflow infrastructure unless a proven MVP bottleneck requires it.
- Replacing the shared static origin with a custom hosting platform before the current publication flow is validated.
- Queue infrastructure that is not needed for the current volume. Generation jobs may remain modeled and use a simple worker until scale proves the need for BullMQ.
- Object storage migration before local or VPS-backed artifact storage is a demonstrated limitation.

## 6. Scope decision test

Every proposed feature must answer all six questions below:

1. **Customer outcome:** Does it help a target SME get a credible website faster, approve it, publish it, or keep it hosted?
2. **MVP journey:** Where exactly does it fit in the approved customer journey?
3. **Revenue connection:** Does it support the website fee, hosting revenue, domain lifecycle, or the minimum cost of delivery?
4. **Automation value:** Does it reduce manual delivery work or prevent a material operational error?
5. **Smallest version:** What is the smallest implementation that proves the value without creating a new product category?
6. **Exit criteria:** What observable result would tell us to stop building it?

If a proposal cannot answer these questions clearly, it must not enter implementation.

## 7. Mandatory agent pushback protocol

Any agent working in this repository must apply the following protocol before implementing a new feature or expanding an existing one.

### If the proposal is clearly in scope

The agent should state which MVP outcome it supports, break the work into small modular todos, implement only the smallest useful version, and create a separate commit for each completed todo.

### If the proposal is ambiguous

The agent must not begin coding. It should ask the minimum questions needed to classify the proposal. It should identify the relevant MVP journey step, affected plan, customer outcome, and operational cost.

### If the proposal is outside scope or unnecessary

The agent must push back respectfully and explicitly. The response should contain:

1. The proposed feature.
2. The scope boundary it crosses.
3. Why it is unnecessary for the MVP objective.
4. The smallest in-scope alternative, if one exists.
5. The recommended defer point or validation milestone.
6. A statement that no code will be written until the scope decision changes.

A suitable response is:

> This is outside the current MVP because it creates a new product category rather than helping us deliver and host brochure websites. I recommend deferring it until we have validated the core WhatsApp-to-preview-to-payment-to-publication flow. The smallest in-scope alternative is [alternative]. I will not implement the larger feature unless you explicitly approve a scope change and we update `plans/MVP-SCOPE.md` first.

### If the user insists on the feature

An explicit user request does not silently change the charter. The agent must first present the scope impact and request confirmation to change the MVP scope. If the change is approved, the agent must:

1. Update this document before implementation.
2. Record the reason, new boundary, and deferred tradeoff.
3. Break the approved change into small modular todos.
4. Implement and commit each todo separately.
5. Update `CONTEXT.md` and relevant tests.

Without that explicit scope change, the agent must continue to push back.

## 8. Common examples

| Proposal | MVP decision | Recommended response |
|---|---|---|
| Add a contact form for Growth and Premium | In scope | Implement within plan entitlements and retention rules |
| Add live appointment booking for salons | Out of scope | Use a WhatsApp enquiry CTA and defer booking until brochure-site demand is proven |
| Add a menu section for restaurants | In scope | Implement as a vertical adaptation of the offerings module |
| Add online ordering and payment for restaurants | Out of scope | Keep menu and WhatsApp enquiry; defer ordering infrastructure |
| Add a basic portal view of traffic and form submissions | In scope | Use the defined basic metrics only |
| Add heatmaps and conversion funnels | Out of scope | Keep basic traffic and click metrics |
| Add portal text editing | Out of scope | Continue using WhatsApp revisions |
| Add more approved design modules | In scope when needed for the supported business groups | Extend the registry without creating arbitrary page-builder behavior |
| Add a mobile app for customers | Out of scope | Use WhatsApp and the responsive portal |
| Add a richer support-ticket platform | Out of scope | Keep a basic support contact and existing support state |
| Replace static shared hosting with per-tenant containers | Out of scope | Improve the shared origin and publication adapter first |
| Add a new backend inside the Next.js portal | Out of scope | Add the capability to the central NestJS server |
| Add AI-generated testimonials or business claims | Prohibited | Reject the content and request grounded customer information |
| Add manual `.co.zw` domain handling | In scope | Track the request and lifecycle without building registrar automation |

## 9. MVP completion gate

The MVP is complete enough to validate when all of the following are true:

- A WhatsApp message can become a grounded structured intake.
- Jev routes irrelevant or non-intake messages without unnecessary Gemini calls.
- A valid intake can produce a private preview using approved modules or templates.
- The customer can pay through Paynow or the payment flow is ready for the provider callback.
- The customer can approve the preview or request plan-limited changes.
- A release can be published through the shared site-origin path or its typed deployment adapter.
- `.co.zw` domain requests can be tracked manually.
- Hosting, renewal, payment, domain, and publication states are visible to the operator or customer where required.
- Growth and Premium contact submissions are retained for the defined period.
- Basic analytics are available without building an advanced analytics product.
- Cross-tenant access is rejected.
- The relevant unit, integration, smoke, and end-to-end tests pass.
- No deferred feature is required to demonstrate the core business outcome.

The team should stop adding product surface area when this gate is met and focus on customer acquisition, delivery speed, quality, reliability, and hosting retention.

## 10. Change-control record

Any approved scope change must be recorded here with the date, decision, reason, new implementation boundary, and the work that will be deferred or removed to pay for it.

| Date | Change | Reason | Tradeoff or deferred work | Approved by |
|---|---|---|---|---|
| 2026-09-23 | Initial MVP scope charter created | Prevent feature expansion before validating the core delivery and hosting model | Advanced product, operations, analytics, and infrastructure work remains deferred | Project owner |

## References

[1]: ../CONTEXT.md "Where They Are project context"

[2]: USER-STORIES.md "Where They Are product user stories"

[3]: ../TESTING.md "Where They Are testing runbook"
