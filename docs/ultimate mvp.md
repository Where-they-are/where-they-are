# Ultimate MVP After Demand Validation

_Last updated: 2026-09-24_  
_Status: **deferred target; not the current sprint backlog**_

## Purpose

This document preserves the broader product that Where They Are may build after the car-dealership Wizard-of-Oz experiment demonstrates demand. It prevents the team from losing the long-term direction while making clear that the broader platform is not the immediate task.

The current active plan is in [`docs/plan.md`](./plan.md). An agent must not begin work from this document unless the dealership validation decision explicitly unlocks it.

## Ultimate product promise

Where They Are can eventually help Zimbabwean small and medium-sized businesses receive modern brochure or service websites through a WhatsApp-led, highly automated flow. The customer provides facts, receives a private preview, approves and pays, and receives a hosted website on shared infrastructure.

The later platform may support several business groups, including hospitality and food, beauty and grooming, professional services, fitness and wellness, events, education, local services, and other suitable SMEs. That expansion is conditional on evidence from the first focused offer.

## Ultimate customer journey

```text
advert
  -> WhatsApp conversation
  -> text, voice-note, and image intake
  -> relevance and qualification
  -> confirmed customer facts
  -> approved module and plan selection
  -> grounded website generation
  -> private preview
  -> WhatsApp revisions
  -> payment confirmation
  -> customer approval
  -> manual domain workflow or platform subdomain
  -> publication
  -> hosting and domain lifecycle
```

## Ultimate capability groups

### Grounded WhatsApp intake

The system can accept text, English voice notes, and images. It stores the conversation, associates it with the correct business and site, extracts structured facts, and asks for confirmation before generation.

### Controlled modular generation

A versioned registry defines business groups, design levels, modules, themes, page recipes, plan entitlements, and validation rules. AI selects from approved options. It does not invent customer facts or create arbitrary product categories.

### Preview, approval, and revisions

Each release has an identifiable version. The preview is private and non-indexable until the publication conditions are satisfied. Customers request changes through WhatsApp. Revision limits follow the selected plan.

### Payments, domains, and hosting

Paynow remains the initial payment provider. Domain registration remains manual for `.co.zw` until a suitable provider workflow exists. Sites run on a shared origin rather than separate applications. Hosting includes the defined grace period, suspension, retention, and reminder behavior.

### Minimum portal

The portal shows site, preview, payment, domain, hosting, enquiry, publication, and revision state. It does not become a CMS, CRM, staff workspace, support queue, or advanced analytics suite.

## Ultimate plan model

The previously defined three-plan model remains a candidate commercial structure after demand validation:

| Plan | Website fee | Hosting | Domain | Revisions | Positioning |
|---|---:|---:|---:|---:|---|
| Starter | $50 | $5/month | $5/year | 1 | Strong focused brochure site |
| Growth | $150 | $10/month | $5/year | 3 | More pages, forms, SEO, and conversion depth |
| Premium | $450 | $20/month | $5/year | 5 | Highest design depth and priority support |

These prices and entitlements must be revalidated against the first customer segment before being treated as final. They are not a reason to build all plan machinery before the dealership offer proves demand.

## Architecture retained for later

The current monorepo and central NestJS backend may remain as technical foundation:

- `apps/server` remains the only backend application;
- workers handle WhatsApp transport and background work;
- `packages/db` owns PostgreSQL access through Prisma;
- shared contracts protect API and AI boundaries;
- a shared site origin serves tenant previews and published sites;
- the portal remains frontend-only;
- the marketing site remains frontend-only.

Existing deeper code may remain dormant, be simplified, or be activated only when a validated customer journey requires it. Existing code is not a commitment to complete every earlier plan.

## Unlock conditions

The broader platform becomes an active roadmap only after the dealership experiment has:

1. produced qualified conversations from the intended audience;
2. shown repeated commercial intent;
3. produced at least one credible paid or commissioned outcome, or an equally strong signal approved by the owner;
4. revealed a repeatable offer and objection pattern;
5. demonstrated that the manual fulfillment model has a real automation bottleneck worth solving;
6. produced a written decision to continue and an updated active task list.

If these conditions are not met, the team must revise the offer or audience before implementing the broader platform.

## Non-goals even for the ultimate MVP

The ultimate product is still not an ecommerce platform, booking system, enterprise CRM, customer-site chatbot, general page builder, mobile app, multi-provider domain marketplace, or broad operations suite.

## References

[1]: ./vision.md "Focused car-dealership vision"

[2]: ./plan.md "Current car-dealership validation plan"

[3]: ./progress.md "Current validation progress"

[4]: ../plans/MVP-SCOPE.md "Current validation scope charter"

[5]: ../CONTEXT.md "Broader project context"
