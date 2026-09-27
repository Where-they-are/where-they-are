# Where They Are MVP

_Last updated: 2026-09-27_  
_Status: **active MVP: social media management for car dealerships**_

## Current authority

Where They Are is now a **social media management agency for car dealerships**. We create and publish consistent, professional Facebook and Instagram content for dealership pages. Websites, branding, paid advertising, photography and other digital services are upsells, not the initial offer.

This replaces the 2026-09-24 website validation experiment. Agents must begin with:

1. [`plans/MVP-SCOPE.md`](./plans/MVP-SCOPE.md): the active scope boundary, plans and pricing.
2. [`docs/plan.md`](./docs/plan.md): the active execution plan.
3. [`docs/current_tasks.md`](./docs/current_tasks.md): the ordered task board.
4. [`docs/sales-script.md`](./docs/sales-script.md): the WhatsApp sales flow.
5. [`docs/vision.md`](./docs/vision.md): the product vision.
6. [`docs/progress.md`](./docs/progress.md): the current evidence and status.

## The MVP

The MVP is the smallest system that lets us win dealership clients, deliver their posts every month at a consistent quality, and keep them paying:

```text
dealership-specific Meta ad
  -> WhatsApp qualification and plan recommendation
  -> owner confirms and takes payment
  -> onboarding
  -> client design system
  -> monthly content plan
  -> Claude-assisted production from Figma templates
  -> quality review and approval
  -> scheduling and publishing to Facebook and Instagram
  -> renewal, retention and upsells
```

It consists of:

- **Dealership onboarding:** a simple intake of the dealership's name, location, Facebook and Instagram pages, chosen plan, branding, contact details and page access.
- **Client brand and design-system setup:** logo, colours, fonts, contact details, pricing style, tone, prohibited wording and approved examples, on top of the organisation's own design system.
- **Vehicle and business-information collection:** vehicle photos, prices, mileage, engine, gearbox, duty status, offers, events and dealership updates, all supplied by the client.
- **Content planning:** a monthly plan per client that matches the plan's post count and mixes the approved formats (listings, new arrivals, comparisons, offers, buyer tips, deliveries, sold posts, engagement questions, dealership updates).
- **Claude-assisted creative production:** ideation, copy and production that work only from the relevant design system and the supplied facts.
- **Figma templates and components:** locked templates for every approved post format, so every post stays consistent.
- **Review and approval:** the quality checklist on every post; the founder reviews everything until an assistant has proven consistent quality.
- **Scheduling and publishing:** to Facebook and Instagram with Meta's own tools.
- **Basic client and lead tracking:** leads and their stage, active clients and plans, posts delivered against posts promised, renewals and churn.

## Plans

| Plan | Posts per month | Price | First month for the first five dealerships |
|---|---:|---:|---:|
| Starter: Page Alive | 4 | $32/month | $32 (no launch discount) |
| Growth | 12 | $96/month | $48 |
| Pro | 30 | $240/month | $120 |

Every plan covers Facebook and Instagram. Full details are in [`plans/MVP-SCOPE.md`](./plans/MVP-SCOPE.md).

## Not in the MVP

These are upsells or future scope, sold and quoted separately:

- Brand Perfection, vehicle photography and walkaround videos.
- Paid Facebook and Instagram advertising.
- WhatsApp enquiry handling, marketplace listing management, Google Business Profile management and review collection.
- Vehicle catalogue or inventory websites and full dealership websites.
- AI customer assistants for clients.
- Lodges, Airbnbs, guesthouses and restaurants.

Do not build a custom scheduling platform, client portal, full CRM, inventory platform, automated payment flow or analytics product for the MVP.

## Required agent behaviour

Break every task into small todos, finish each one end to end, run the relevant checks, and make a separate commit for each.

Do not invent vehicle facts, prices, mileage, availability, testimonials, engagement numbers or business results. Label any fictional mockup as "Demo concept", "Illustrative example" or "Example dealership page". Escalate uncertain or commercial conversations to the owner.

## Retained foundation

The earlier website platform (`apps/server`, `apps/web`, `apps/site-origin`, `apps/worker-whatsapp`) and the website-focused parts of `apps/whatsapp-agent` and `apps/dealership-demo` remain in the repository as dormant foundation for the later website upsell. The deferred website charter is in Appendix A of [`plans/MVP-SCOPE.md`](./plans/MVP-SCOPE.md), and the broader platform target is in [`docs/ultimate mvp.md`](./docs/ultimate%20mvp.md).
