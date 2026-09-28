# Where They Are MVP Scope Charter

_Last updated: 2026-09-28_  
_Status: Authoritative scope-control document_

> **Direction change — 2026-09-27 (owner approved):** Where They Are is now a **social media management agency for car dealerships**. The MVP is the service that creates and publishes consistent, professional Facebook and Instagram content for dealerships, plus the minimum acquisition, onboarding, production, quality and tracking needed to deliver it. Websites, AI customer assistants, paid advertising, photography, branding packages and other services are **upsells or future scope**, not the MVP. This replaces the 2026-09-24 website validation experiment and the 2026-09-25 in-chat Paynow website deposit. The former website-platform charter is kept in [Appendix A](#appendix-a-deferred-website-platform-charter) for the later website upsell.

This document is binding guidance for product decisions, implementation tasks, design work, testing, and AI-agent behaviour. It supplements `AGENTS.md` and `CONTEXT.md`.

> **Scope rule:** The MVP exists to prove that Where They Are can win car-dealership clients through Meta ads and WhatsApp, deliver consistent, accurate, professional Facebook and Instagram posts for them every month, and keep them paying. Every feature must directly support that outcome or the minimum operation required to deliver it.

## 1. MVP objective

We help car dealerships get more attention, enquiries and viewing opportunities by keeping their social media active, professional and worth following.

The outcome we sell is not "posts". We help dealerships:

- stay in buyers' minds when they are ready to purchase;
- present vehicles clearly and professionally;
- give buyers reasons to compare, comment and ask questions;
- start more meaningful conversations, enquiries and viewings;
- look active, credible and serious next to dealerships with neglected pages;
- save the owner the time spent designing, writing and publishing.

The MVP must prove three things:

1. Dealership owners respond to dealership-specific ads and start WhatsApp conversations.
2. Qualified dealerships pay for a monthly plan.
3. The team can deliver the promised volume at a consistent quality, and clients renew after the first month.

## 2. Target customers

**Primary:** car dealerships, vehicle importers, motor traders and used-car businesses in Zimbabwe, starting with **Mutare and Harare**.

All advertising, outreach and sales conversations are dealership-specific ("Car dealership owner?"). Generic wording such as "we help businesses grow online" is out of scope.

**Future (not in the MVP):** lodges, Airbnbs, guesthouses and restaurants, each through separate campaigns and separate creative. They must not be mixed into the dealership campaign.

## 3. The approved MVP customer journey

```text
Dealership-specific Meta ad (Leads, WhatsApp conversion location)
  -> WhatsApp conversation
  -> qualification: dealership, city, current posting, desired frequency
  -> one recommended plan (Starter, Growth or Pro) with the correct price
  -> Angel takes the first month's payment through Paynow (mobile money prompt or payment link) and confirms it only when Paynow reports it paid
  -> onboarding: page access, branding, vehicle photos and details
  -> client design system set up
  -> monthly content plan
  -> Claude-assisted production from Figma templates and supplied facts
  -> quality review and client approval where needed
  -> scheduling and publishing to Facebook and Instagram
  -> monthly renewal, retention and upsell conversations
```

A proposed feature must fit this journey or directly reduce the cost, risk or time of operating it. If it does not, it is not an MVP feature.

## 4. In scope for the MVP

### 4.1 The service

We create, adapt and publish posts on Facebook and Instagram. Each post includes:

- a professionally designed Facebook post;
- an adapted Instagram version;
- a caption or supporting copy where required;
- publishing to both platforms;
- use of the client's approved branding and content guidelines.

Approved content formats: vehicle listings, new arrivals, vehicle comparisons, features and benefits, price updates, special offers, buyer tips, customer deliveries, sold-vehicle posts, stock highlights, engagement questions ("Which one would you choose?") and dealership updates.

Posts show the client's actual vehicles and actual dealership information. Prices, mileage, specifications, availability, ownership history, results and customer claims come only from the client.

### 4.2 Plans and pricing

| Plan | Posts per month | Rhythm | Platforms | Price |
|---|---:|---|---|---:|
| Starter: Page Alive | 4 | About one post every 7 days | Facebook and Instagram | $32/month |
| Growth | 12 | About three posts a week | Facebook and Instagram | $96/month |
| Pro | 30 | About one post a day | Facebook and Instagram | $240/month |

**Launch offer:** Growth and Pro are 50% off for the first month only, for the first five dealerships:

- Growth: $48 for the first month, then $96/month.
- Pro: $120 for the first month, then $240/month.
- Starter has no launch discount: it stays $32/month.

The discounted first month is an introduction to the quality and consistency of the service, not a guarantee of sales.

### 4.3 Acquisition and sales

- Meta Leads campaign with WhatsApp as the conversion location, dealership-specific creative, Mutare and Harare.
- A WhatsApp sales flow that qualifies briefly, recommends one plan, takes the first month's payment and hands anything unusual to the owner (see [`docs/sales-script.md`](../docs/sales-script.md)).
- An AI first-line sales assistant (Angel) runs this flow inside the sales script. It may request payment through Paynow: an EcoCash or OneMoney prompt, or a Paynow payment link for card and bank payments. It confirms a payment only when Paynow reports it paid, and never negotiates, discounts, handles card or wallet details itself, or invents facts.
- Monthly renewals: the owner sends a Paynow request for the next month from WhatsApp (`#bill`). Automatic recurring billing stays out of scope.

### 4.4 Delivery operations

- Client intake: dealership name, location, Facebook and Instagram links, plan, vehicle photos and details, prices, mileage, engine, gearbox, duty status, offers and updates.
- One organisation design system and one design system per client.
- Figma components and locked templates for every approved post format.
- Claude-assisted ideation, copy and production that works only from the relevant design system and the supplied facts.
- A monthly content plan per client that matches the plan's post count.
- A quality checklist applied before anything is scheduled.
- Scheduling and publishing to Facebook and Instagram, using the platforms' own tools (for example Meta Business Suite).
- Basic client and lead tracking: leads and their stage, active clients, plan, posts delivered against posts promised, renewals and churn.

### 4.5 People

- The founder reviews every post until an assistant has proven consistent quality.
- A first part-time production assistant, trained on examples and reviewed before touching live client work, once recurring revenue justifies the cost.

## 5. Upsells and future scope (not in the MVP)

These may be mentioned and sold by the owner as separate, separately priced work, but they are not part of any plan and must not be built into the MVP:

- **Brand Perfection:** a one-time visual upgrade (logo refinement, profile and cover images, brand colours and fonts, listing templates, story highlights, WhatsApp catalogue and Google Business Profile images). Catalogue-image work is sold in defined batches (for example 10, 25 or 50 vehicles), never unlimited inside a plan.
- Vehicle photography and walkaround videos.
- Paid Facebook and Instagram advertising for the client.
- WhatsApp enquiry handling and follow-up for the client.
- Marketplace listing management.
- Google Business Profile management.
- Customer review collection.
- Vehicle catalogue or inventory website.
- Full dealership website (the former website platform in Appendix A).
- AI customer assistants for clients.
- Expansion to lodges, Airbnbs, guesthouses and restaurants.

Explicitly out of scope for the MVP:

- A custom social media scheduling or publishing platform. Use Meta's own tools.
- A client portal, client self-service editing or approval app.
- Automated post generation without human review.
- Advanced analytics dashboards, attribution or engagement-prediction tooling.
- A full CRM, support-ticket system or operations console. A simple tracking record is enough.
- Automatic recurring billing, invoices, refunds and credit systems. Renewals are requested by the owner.
- Generated business claims, invented vehicle facts, fabricated engagement metrics, synthetic testimonials or unlabelled fictional mockups.

## 6. Truth and claims rules

- Never promise a specific number of sales, enquiries, followers or reach.
- Never invent prices, mileage, specifications, availability, ownership history, results or customer claims.
- Mockups with fictional metrics, followers, verification badges or engagement figures must be labelled "Demo concept", "Illustrative example" or "Example dealership page".
- Never imply that a real dealership achieved results it did not achieve.

## 7. Scope decision test

Every proposed feature must answer all six questions:

1. **Customer outcome:** Does it help a dealership stay visible, present vehicles well, or start more buyer conversations through its social media?
2. **MVP journey:** Where exactly does it fit in the approved journey in section 3?
3. **Revenue connection:** Does it help win a plan, deliver it, or keep the client renewing?
4. **Delivery value:** Does it reduce production time or prevent a quality error such as a wrong price or phone number?
5. **Smallest version:** What is the smallest version that proves the value without creating a new product?
6. **Exit criteria:** What observable result would tell us to stop?

If a proposal cannot answer these clearly, it must not enter implementation.

## 8. Mandatory agent pushback protocol

Any agent working in this repository must apply this protocol before implementing a new feature or expanding an existing one.

- **Clearly in scope:** state which MVP outcome it supports, break the work into small modular todos, implement only the smallest useful version, and commit each todo separately.
- **Ambiguous:** do not begin coding. Ask the minimum questions needed to classify it.
- **Out of scope or unnecessary:** push back respectfully. Give the proposal, the boundary it crosses, why it is not needed for the MVP, the smallest in-scope alternative, and when to reconsider it, and state that no code will be written until the scope changes.
- **Prohibited** (invented facts, fabricated results or testimonials): refuse and keep the grounding rule.

A suitable response is:

> This is outside the current MVP because it builds a new product rather than helping us win, deliver and retain dealership social media clients. I recommend deferring it until the core acquisition-to-publishing loop is proven. The smallest in-scope alternative is [alternative]. I will not implement the larger feature unless you explicitly approve a scope change and we update `plans/MVP-SCOPE.md` first.

An explicit user request does not silently change this charter. If the owner approves a change, update this document first with the reason and tradeoff, update `CONTEXT.md`, then implement in small todos with separate commits.

## 9. Common examples

| Proposal | MVP decision | Recommended response |
|---|---|---|
| Add a new post format, such as "vehicle of the week" | In scope | Add it as a locked Figma template and a checklist item |
| Build our own post scheduler | Out of scope | Schedule with Meta Business Suite |
| Build a client portal to approve posts | Out of scope | Send drafts on WhatsApp for approval |
| Offer paid ads management to a client | Upsell | The owner quotes it separately; not part of a plan |
| Build a dealership website for a client | Upsell | Quote it separately; the Appendix A platform stays deferred |
| Track which clients got their promised posts this month | In scope | A simple delivery record per client |
| Generate engagement numbers for a mockup | Prohibited unless labelled | Label it "Demo concept" or use no numbers |
| Start a restaurant campaign | Future | Separate campaign and creative after the dealership offer is proven |
| Update Angel (the WhatsApp agent) to qualify for social media plans | In scope | Follow the new sales script |
| Angel takes the first month's payment in the chat | In scope | Paynow mobile prompt or payment link, confirmed only by Paynow |
| Automatic monthly debit orders | Out of scope | The owner sends a renewal request with `#bill` |

## 10. MVP completion gate

The MVP is proven enough to scale when all of the following are true:

- The dealership ads produce qualified WhatsApp conversations at an acceptable cost (threshold set by the owner before launch).
- At least one dealership is paying for each plan it was recommended, with the correct price and launch offer applied.
- Every active client receives the promised number of posts each month, on both platforms.
- Every published post passes the quality checklist, with no wrong prices, phone numbers or invented facts.
- The organisation and client design systems and the locked templates are in use.
- Clients renew after the first month at a rate the owner considers viable.
- A trained assistant can produce posts that pass review, or the founder's production time is still sustainable.

When this gate is met, stop adding product surface area and focus on acquisition, retention and upsells.

## 11. Change-control record

Any approved scope change must be recorded here with the date, decision, reason, new implementation boundary, and the work that is deferred or removed.

| Date | Change | Reason | Tradeoff or deferred work | Approved by |
|---|---|---|---|---|
| 2026-09-23 | Initial MVP scope charter (automated website platform) | Prevent feature expansion before validating website delivery and hosting | Advanced product, operations, analytics and infrastructure work deferred | Project owner |
| 2026-09-24 | Wizard-of-Oz car-dealership website validation experiment | Test demand from one audience before automating | Full automated platform became "ultimate MVP after validation" | Project owner |
| 2026-09-25 | Paynow deposit and balance collection in WhatsApp (Angel), Meta Conversions API feedback | A paid deposit is the strongest demand signal | Hosting billing, renewals and refunds stayed manual | Project owner |
| 2026-09-28 | Angel takes the first month's payment in WhatsApp through Paynow (mobile money prompt or payment link), verified by Paynow; the owner requests renewals with `#bill` | The owner wants the close handled end to end so a lead can pay the moment they decide | Recurring billing, invoices and refunds stay manual; Angel never handles card or wallet details | Project owner |
| 2026-09-27 | Social media management agency for car dealerships becomes the MVP | The core offer is now consistent Facebook and Instagram content for dealerships; websites and other services become upsells | Website platform, dealership website offer, in-chat Paynow website deposit, AI customer assistants, paid ads, photography, branding, marketplace management and other verticals move to upsell or future scope | Project owner |

## References

[1]: ../CONTEXT.md "Where They Are project context"

[2]: ../docs/plan.md "Current execution plan"

[3]: ../docs/sales-script.md "Dealership social media sales script"

[4]: ../TESTING.md "Where They Are testing runbook"

---

## Appendix A: Deferred website-platform charter

> **Not the active MVP.** The sections below are the former website-platform charter (2026-09-23), kept for the later **website upsell** and for the dormant platform code in `apps/server`, `apps/web`, `apps/site-origin` and `apps/worker-whatsapp`. Do not implement from this appendix unless the change-control record above reopens it.

### A.1 Website objective

Where They Are is a Zimbabwe-focused website creation service for small businesses. A customer begins on WhatsApp after seeing an advertisement, provides business information through text, English voice notes, or images, receives a private AI-generated website preview, pays through Paynow, approves the result or requests changes, and receives a published website.

The MVP must prove two things:

1. A high-quality, non-generic brochure or service site can be produced quickly with approximately 80% automation.
2. Customers will pay for website creation and continue paying for hosting and domain services.

The MVP is not intended to become a general-purpose website builder, enterprise CRM, booking platform, ecommerce platform, or operations suite.

### A.2 Target customers

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

### A.3 Website customer journey

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

### A.4 Website scope

#### A.4.1 Website product

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

#### A.4.2 Plan entitlements

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

#### A.4.3 Customer communication

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

#### A.4.4 Customer portal and operations

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

#### A.4.5 Payments and domains

Paynow is the MVP payment provider. The system may store payment records, payment status, invoice information, and provider references. Hosted payment creation and callback verification are part of the payment integration work, but the payment truth must remain server-owned.

Domain registration is manual during the MVP. The initial domain scope is `.co.zw`. The team manages the domain account and DNS. A domain request, manual registration status, verification status, expiry, and renewal reminder are in scope. Building a domain-reseller marketplace or integrating multiple registrars is not.

#### A.4.6 Hosting and publication

The MVP uses a shared site-origin model. It must not create a separate application or container for every customer site. Preview and published sites should resolve by subdomain or custom domain against shared release metadata and static artifacts.

Coolify is an infrastructure adapter, not a product feature. While the larger server decision is pending, deployment integration may remain disabled or mocked behind a typed boundary. Do not build a new deployment platform to compensate. The MVP still needs a clear publication state and a manual or adapter-backed release path.

### A.5 Out of scope for the website platform

The following work must not be added to the MVP unless this charter is deliberately changed.

#### A.5.1 Product features to defer

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

#### A.5.2 Operations and account features to defer

- Teams, invitations, staff workspaces, fine-grained permissions, and role-management UX beyond the minimum tenant guard.
- Audit logs and compliance reporting.
- Full support-ticket queues, operator consoles, SLA management, and agent inboxes.
- Advanced customer relationship management.
- Automated domain registration across multiple providers.
- Automated renewal collection beyond the minimum reminders and payment lifecycle.
- Complex refunds, credit systems, coupons, affiliate systems, and reseller accounts.
- White-labeling and agency multi-account management.

#### A.5.3 Analytics and intelligence to defer

- Advanced analytics dashboards, funnels, cohorts, attribution, heatmaps, session recording, or ad-platform optimization.
- Predictive lead scoring, recommendation systems, autonomous sales agents, or open-ended chatbots.
- Persistent Jev decision auditing, model experimentation platforms, or model-training pipelines.
- Automatic A/B testing and personalization.
- Generated business claims, synthetic testimonials, invented credentials, or fabricated performance figures.

#### A.5.4 Infrastructure and architecture to defer

- A separate deployment application for every tenant.
- A second backend in Next.js, Astro, or a worker.
- Multiple databases or independent database access from frontend applications.
- Kubernetes, microservice decomposition, event-sourcing, or distributed workflow infrastructure unless a proven MVP bottleneck requires it.
- Replacing the shared static origin with a custom hosting platform before the current publication flow is validated.
- Queue infrastructure that is not needed for the current volume. Generation jobs may remain modeled and use a simple worker until scale proves the need for BullMQ.
- Object storage migration before local or VPS-backed artifact storage is a demonstrated limitation.

### A.6 Website completion gate

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

