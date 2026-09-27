# Current Tasks

_Last updated: 2026-09-27_

This is the active task board for the dealership social media management MVP. Work in this order. Do not start a later task while the current one is unfinished, unchecked or unevaluated, unless it is independent and the owner agrees.

## Task rules

Break every task into small todos before starting. Finish each todo end to end: the customer-visible result, the manual operating step, the checks, the documentation and a review of what could go wrong. Every feature or fix gets its own commit. Do not install packages automatically; give the owner the exact command if a package is genuinely needed.

If a task reveals a problem that affects winning, delivering or keeping clients, fix it before moving on. Otherwise record it as deferred.

The website-build tasks from the 2026-09-24 experiment are retired. Websites are now an upsell (see [`../plans/MVP-SCOPE.md`](../plans/MVP-SCOPE.md)).

## Ordered task list

### Task 1 - Finalise the three plans and pricing

- [x] Starter: Page Alive, 4 posts/month, $32/month.
- [x] Growth, 12 posts/month, $96/month; $48 for the first month for the first five dealerships.
- [x] Pro, 30 posts/month, $240/month; $120 for the first month for the first five dealerships.
- [ ] Owner answers the open questions in [`plan.md`](./plan.md) section 12: payment method and timing, minimum term and cancellation, how launch places are counted, missing photos, approval rhythm, Facebook-only clients, upsell prices.
- [ ] Record the answers in `plan.md`, `plans/MVP-SCOPE.md` and `sales-script.md`.

**Completion evidence:** every price and term the sales script quotes is confirmed by the owner and written down.

### Task 2 - Create the organisation design system and content templates

- [ ] Organisation design system in Figma: colours, typography, spacing and grid, logo usage, price badges, image treatments, post dimensions, content categories, tone of voice, approved calls to action.
- [ ] Locked Figma templates and components for each approved format: vehicle listing, new arrival, comparison, features and benefits, price update, special offer, buyer tip, customer delivery, sold vehicle, stock highlight, engagement question, dealership update.
- [ ] Facebook and Instagram sizes for each template.
- [ ] A client design-system template (logo, colours, fonts, location, contact details, vehicle categories, pricing style, tone, prohibited wording, platform requirements, approved examples).

**Completion evidence:** a sample month of posts produced from the templates in under 15 minutes per post.

### Task 3 - Create the three main ad formats

- [ ] "This could be your dealership": a polished example page using our real post formats.
- [ ] "Which dealership would you trust?": a neglected page next to an active, professional one.
- [ ] "Get more people asking about your cars": a polished vehicle post and an enquiry path.
- [ ] Square/feed and vertical Stories/Reels versions of each.
- [ ] Every fictional mockup labelled "Demo concept", "Illustrative example" or "Example dealership page"; no unlabelled fictional metrics or badges.

**Completion evidence:** three approved creatives, each checked against the claims rules.

### Task 4 - Set up the WhatsApp sales flow

- [ ] Run the flow in [`sales-script.md`](./sales-script.md) on +263 77 510 1506.
- [ ] Decide whether Angel (`apps/whatsapp-agent`) answers first or a person does. Angel still runs the retired website script with the $125 Paynow deposit, so it must be updated to the social media script, or switched off, before any ad points to its number.
- [ ] If Angel is used: new offer, plan recommendation, qualification questions and escalation rules; no in-chat payment; live evals updated and passing.
- [ ] Test the full conversation, including every objection and every escalation to the owner.

**Completion evidence:** test transcripts for the common paths and a verified hand-off to the owner.

### Task 5 - Build the client intake form

- [ ] Collect: dealership name, location, Facebook link, Instagram link (if any), plan, page access, logo, colours, contact details, vehicle photos and details (prices, mileage, engine, gearbox, duty status), offers, events and updates.
- [ ] A simple form or WhatsApp checklist; no portal.
- [ ] A way to add new vehicles during the month.

**Completion evidence:** one real or test dealership onboarded from the form without back-and-forth.

### Task 6 - Create the quality checklist

- [ ] The checklist from `plan.md` section 7.3 as a one-page, tick-box list used before every post is scheduled.
- [ ] A record of errors caught, so recurring mistakes lead to template or process fixes.

**Completion evidence:** the checklist used on the sample month from Task 2.

### Task 7 - Track qualified leads, conversions and retention

- [ ] A simple record (sheet or the existing agent CRM) of every lead: source ad, dealership, city, stage, recommended plan, outcome, reason lost.
- [ ] A client record: plan, start date, first-month price, posts promised against posts delivered, renewal date, renewed or churned and why.
- [ ] Weekly numbers: cost per qualified conversation, cost per paying client, plan mix, renewals.

**Completion evidence:** the record in use from the first ad conversation onwards.

### Task 8 - Run the first 7-day campaign

- [ ] Launch only when Tasks 1 to 7 are ready enough to answer, sell and deliver.
- [ ] Leads objective, WhatsApp conversion location, Mutare and Harare, 25 to 65+, Advantage+ audience and placements, $7/day, 7 days, the three creatives in one ad set.
- [ ] Review conversations daily; stop any misleading creative or broken hand-off immediately.

**Completion evidence:** a dated campaign record with spend, conversations, qualified leads and paying clients.

### Task 9 - Deliver the first clients

- [ ] Set up each client's design system.
- [ ] Monthly content plan matching the plan's post count.
- [ ] Produce with Claude from the templates and the supplied facts only; review every post against the checklist; publish to Facebook and Instagram.
- [ ] Measure production minutes per post.

**Completion evidence:** every promised post delivered for each client's first month.

### Task 10 - Recruit and train the first assistant

- [ ] Hire only when recurring revenue is reliable, there is enough work, and the recovered time has a clear acquisition plan (see `plan.md` section 8).
- [ ] Training examples and a review before any live client work.
- [ ] Founder reviews every post, then moves to sampling and weekly audits after consistent quality.

**Completion evidence:** an assistant producing posts that pass review without founder rework.

### Task 11 - Retention and upsells

- [ ] Check in with each client before the end of month one.
- [ ] Record renewal or churn and the reason.
- [ ] Offer upsells only where they fit: Brand Perfection, photography, paid ads, WhatsApp handling, marketplace and Google Business Profile management, review collection, catalogue sites, websites.

**Completion evidence:** month-two renewal rate and reasons recorded.

## Deferred

- Full dealership websites and catalogue sites (retained platform; upsell only).
- AI customer assistants for clients.
- A custom scheduling or publishing tool, client portal or full CRM.
- Automated in-chat payment collection.
- Lodges, Airbnbs, guesthouses and restaurants.

## References

[1]: ./plan.md "Current execution plan"

[2]: ./progress.md "Current progress"

[3]: ./sales-script.md "Dealership social media sales script"

[4]: ../plans/MVP-SCOPE.md "MVP scope charter"
