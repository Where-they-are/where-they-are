# Current Progress

_Last updated: 2026-09-27_

## Current phase

**Direction change (2026-09-27):** Where They Are changed from website-led dealership services to a focused **social media management agency for car dealerships**. We create and publish consistent, professional Facebook and Instagram content for dealership pages. Websites, branding, paid advertising, photography, WhatsApp handling and other services are upsells, not the initial offer.

The strategic summary:

> We help car dealerships get more attention, enquiries and viewing opportunities by keeping their social media active, professional and worth following.

## What has been decided

### Target market

- **Primary:** car dealerships, vehicle importers, motor traders and used-car businesses in Zimbabwe, starting with Mutare and Harare.
- **Later:** lodges, Airbnbs, guesthouses and restaurants, through separate campaigns and creative.

### Pricing and launch offer

| Plan | Posts per month | Price | Launch first month |
|---|---:|---:|---:|
| Starter: Page Alive | 4 (about one every 7 days) | $32/month | none: $32 |
| Growth | 12 (about three a week) | $96/month | $48 |
| Pro | 30 (about one a day) | $240/month | $120 |

The 50% first-month offer applies to Growth and Pro only, for the first five dealerships. Every plan covers Facebook and Instagram. The discount is an introduction, not a guarantee of sales.

### Ad direction

Sell the transformation, not the mechanism ("This could be your dealership.", "Which dealership would you trust?", "Get more people asking about your cars."). The campaign setup:

- Leads objective, with WhatsApp (+263 77 510 1506) as the conversion location.
- Mutare and Harare, ages 25 to 65+.
- Advantage+ audience and placements.
- $7/day for a 7-day test, with the three creatives in one ad set.

Fictional mockups must be labelled.

### Sales flow

The steps:

1. A short opening.
2. The dealership name and city.
3. How they post today.
4. How often they want to appear in front of buyers.
5. One recommended plan with the correct price.
6. A hand-off to the owner, who confirms the start and collects payment.

See [`sales-script.md`](./sales-script.md).

### Upsell roadmap

- **Brand Perfection:** a one-time visual upgrade, with catalogue images sold in defined batches.
- **Content and advertising:** vehicle photography and walkaround videos; paid Facebook and Instagram ads.
- **Channel management:** WhatsApp enquiry handling, marketplace listing management, Google Business Profile management and review collection.
- **Websites:** vehicle catalogue or inventory websites, and full dealership websites.

### Staffing assumptions

- The CEO's time should go mostly to acquisition and sales (60% to 70%), then retention (15% to 20%), quality and creative direction (10% to 15%), and systems (5% to 10%).
- **Example month:** 5 Starter, 10 Growth and 3 Pro clients give $1,840/month revenue and 230 posts. At 15 minutes per post, that is about 57.5 production hours.
- **First assistant:** a part-time assistant taking 50% of production would save the CEO about 28.75 hours a month, at about $300/month ($200 salary + $100 AI subscription). Hire when recurring revenue is reliable and the recovered time goes to acquiring clients.
- The founder reviews every post until an assistant proves consistent quality.

## What exists in the repository

Built for the earlier website direction, now dormant or needing changes:

- **`apps/whatsapp-agent` ("Angel"):** the WhatsApp agent. It still runs the retired website sales script, with the $125 Paynow website deposit.
  - It must be updated to the social media script, or switched off, before any new ad points to its number.
  - Its reusable parts still fit the new flow: WhatsApp handling, the Jev spam filter, voice-note transcription, the CRM and lead tracking, owner hand-off alerts, Meta Conversions API reporting and the live eval harness.
- **`apps/dealership-demo`:** the Ridgeline Motors sample website, now only relevant to the website upsell.
- **The automated website platform** (`apps/server`, `apps/web`, `apps/site-origin`, `apps/worker-whatsapp`): retained as the foundation for the website upsell (see `plans/MVP-SCOPE.md` Appendix A and [`ultimate mvp.md`](./ultimate%20mvp.md)).

## What is not yet done

- The open commercial terms in [`plan.md`](./plan.md) section 12 are unanswered: payment method and timing, minimum term, how launch places are counted, missing photos, approval rhythm, Facebook-only clients and upsell prices.
- **Nothing for delivery exists yet:** the organisation design system, Figma templates, client design-system template, intake form and quality checklist.
- The three ad creatives do not exist yet.
- The WhatsApp sales flow is not yet live for the new offer, and Angel has not been updated.
- No campaign has run, no dealership has paid, and no renewal data exists yet.

## Evidence required

Measure:

- qualified dealership conversations and what they cost;
- paying clients by plan;
- posts delivered against posts promised;
- production minutes per post;
- quality errors caught before publishing;
- renewals and reasons for churn.

Do not judge the business on impressions, clicks, likes or conversation volume alone.

## Documentation authority

- `plans/MVP-SCOPE.md`: the scope boundary, plans and pricing.
- `MVP.md`: a short statement of the MVP.
- `docs/plan.md`: the execution plan.
- `docs/current_tasks.md`: the ordered task board.
- `docs/sales-script.md`: the WhatsApp sales flow.
- `docs/vision.md`: the product vision.
- `CONTEXT.md`: the technical and architecture record.
- `docs/ultimate mvp.md`: the deferred website platform.

## History

- **2026-09-23:** automated website platform for Zimbabwean SMEs.
- **2026-09-24:** Wizard-of-Oz website validation for car dealerships.
  - Built the Ridgeline Motors demo site.
  - Built Angel: qualification, the Jev spam filter, transcription, the CRM, and 26/26 live sales scenarios and 31/31 relevance cases passing.
- **2026-09-25:** added the Paynow $125 website deposit and balance in WhatsApp, and Meta Conversions API reporting.
- **2026-09-27:** changed to a social media management agency for car dealerships. Websites became an upsell.

## References

[1]: ./plan.md "Current execution plan"

[2]: ./current_tasks.md "Current tasks"

[3]: ./sales-script.md "Dealership social media sales script"

[4]: ../plans/MVP-SCOPE.md "MVP scope charter"

[5]: ../CONTEXT.md "Project context"
