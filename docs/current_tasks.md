# Current Tasks

_Last updated: 2026-09-25_

This is the active task board for the Wizard-of-Oz validation MVP. Work must follow this order. Do not start a later task while the current task is unfinished, untested, and unevaluated.

## Task rules

Every task must be broken into small todos before implementation. Each todo must be completed end to end, including the user-visible behavior, the manual operating step where applicable, tests or verification, documentation, and a logical review of what could go wrong.

Agents must not move to the next task because the code compiles or because a happy-path mock works. They must run the relevant checks, fix defects, test the real handoff, and record evidence. Every feature or fix requires its own commit. Do not install packages automatically; provide the user with an exact command if a package is genuinely required.

If a task reveals a problem that affects the current validation loop, fix it before moving on. If it is unrelated, record it as deferred instead of changing direction.

## Ordered task list

### Task 1 - Confirm the dealer offer and validation hypothesis

- [ ] Write the one-sentence offer for car dealerships.
- [ ] Define the customer problem being tested: a dealership may have no website or may have a weak website that does not present the business credibly.
- [ ] Define the target lead: the owner or decision-maker of a Zimbabwean car dealership.
- [ ] Define the commercial action being tested: serious request for a dealership website, pricing discussion, deposit, or payment.
- [ ] Define the evidence threshold that will trigger continuation, revision, or stopping.

**Completion evidence:** an approved offer, target definition, hypothesis, and decision threshold recorded in `docs/plan.md`.

### Task 2 - Prepare the single dealership demo website

- [ ] Review the designs under `/designs` and select the single demo direction.
- [ ] Specify the demo pages, sections, dealership facts, vehicle examples, calls to action, and visual hierarchy.
- [ ] Use only approved or clearly labelled demo information. Do not present invented dealership results, inventory, awards, prices, or testimonials as real.
- [ ] Create the demo as a separate Next.js application when implementation is authorized.
- [ ] Keep the demo app isolated and frontend-only. Do not add a backend or connect it directly to the existing database.
- [ ] Deploy the demo to a stable public URL.
- [ ] Verify mobile layout, speed, link behavior, WhatsApp/phone actions, and private source assets.

**Current status:** documentation only. The app must not be implemented as part of the documentation update.

**Completion evidence:** a public demo URL, design/source reference, content review, and a short manual smoke-test record.

### Task 3 - Define and configure the Meta Ads test

- [ ] Write one focused campaign brief for Zimbabwean car dealerships.
- [ ] Create the advert promise around a dealership-specific website, not generic AI website creation.
- [ ] Prepare a small set of creative variants using the approved demo.
- [ ] Use WhatsApp as the destination.
- [ ] Define budget, test dates, location, campaign names, and the owner responsible for monitoring replies.
- [ ] Define how each conversation will be recorded without storing unnecessary sensitive data.
- [ ] Avoid claims that a website guarantees sales, larger deals, rankings, or revenue.

**Completion evidence:** approved campaign brief, ad copy, creative references, launch settings, and tracking record.

### Task 4 - Narrow the WhatsApp agent to dealer qualification

- [ ] Change the first response so it identifies the focused dealership offer.
- [ ] Ask for the lead's name.
- [ ] Ask for the dealership name.
- [ ] Ask what types of cars the dealership sells or deals in.
- [ ] Ask where the dealership is located.
- [ ] Ask whether the lead has seen the dealership demo.
- [ ] Provide the demo link when the lead has not seen it.
- [ ] Ask a small number of follow-up questions only when they help qualify the opportunity.
- [ ] Classify the lead as qualified, not yet qualified, unsupported, or requiring human follow-up.
- [ ] Preserve the existing deeper code where useful, but do not expose unsupported automation promises.
- [ ] Provide a clear handoff to the owner when there is an objection, buying signal, unusual request, or uncertainty.

**Completion evidence:** approved conversation script, test transcripts for common paths, and a verified human handoff.

**Current status (2026-09-25):** the qualification flow and escalation paths are implemented in `apps/whatsapp-agent`, with transcripts from `pnpm --filter @where-they-are/whatsapp-agent eval`. Still open: the owner approving the script, and a verified handoff on the real business number.

### Task 4b - Close the sale in WhatsApp (added 2026-09-25)

- [ ] Angel follows `docs/sales-script.md`: founding offer and demo link early, one qualification question per message, lead score and stages.
- [ ] Angel requests the $125 deposit through Paynow mobile checkout (EcoCash or OneMoney) and confirms it only after Paynow reports it paid.
- [ ] After payment, Angel sends the materials checklist and the 3-day delivery promise; the owner is alerted.
- [ ] The owner marks delivery with `#delivered`, and the $125 balance is requested through Paynow.
- [ ] Qualified leads, deposit requests and payments are reported to Meta through the Conversions API.
- [ ] Verify end to end against Paynow's test mode before live ads.

**Completion evidence:** a paid Paynow test transaction moving a lead from qualified to deposit paid, the customer confirmation, the owner alert, and a Meta test event.

### Task 5 - Implement truthful objection handling

- [ ] Handle the objection that the dealership is too small or not ready for a website.
- [ ] Explain that the question is not only whether the dealership already has a website, but whether its online presence presents the business strongly enough.
- [ ] Explain that a credible website may help the dealership appear more established when customers or business partners evaluate it, without promising that it will produce a specific result.
- [ ] Ask where the dealership is located when local context is useful.
- [ ] Use one competitor example only when the business owner has supplied or manually verified the example.
- [ ] Never invent a competitor, website, location, market position, or claim about a competitor.
- [ ] Escalate objections that require negotiation, custom pricing, legal claims, or unsupported promises.

**Completion evidence:** objection-response matrix, verified competitor source where used, and transcript tests showing safe escalation.

### Task 6 - Run the first controlled campaign and record demand

- [ ] Launch only after the demo, script, monitoring, and tracking record are ready.
- [ ] Record ad spend, conversations, qualified leads, demo-link delivery, demo engagement when observable, follow-ups, objections, pricing requests, and commercial commitments.
- [ ] Review conversations on a fixed cadence during the test.
- [ ] Do not optimize only for clicks. Evaluate qualified conversations and commercial intent.
- [ ] Keep changes controlled so that the team knows which creative or message changed.
- [ ] Stop or revise misleading creative, unsupported claims, or a broken handoff immediately.

**Completion evidence:** dated campaign record and conversation summary.

### Task 7 - Decide whether to continue, revise, or expand

- [ ] Compare the observed evidence with the threshold from Task 1.
- [ ] Identify the strongest message, objection, and lead type.
- [ ] Estimate the manual time required per qualified lead and per delivered site.
- [ ] Decide whether to continue the dealer offer, revise the offer or demo, or stop the experiment.
- [ ] If demand is demonstrated, define the smallest next automation task.
- [ ] If demand is not demonstrated, do not respond by building more platform features. Record the learning and change the hypothesis first.

**Completion evidence:** a written decision with supporting counts, examples, costs, and next step.

## Deferred until demand is demonstrated

- Multi-vertical acquisition.
- Full automated website generation for every supported business group.
- Production authentication replacement beyond what the dealer experiment actually needs.
- Hosting lifecycle completion (renewals, automated hosting billing). Paynow deposit and balance collection in WhatsApp is no longer deferred: see Task 4b.
- Full portal workflows.
- Modular registry expansion across all business groups.
- Queues, operations consoles, CRM, support tickets, advanced analytics, and broad automation.

## References

[1]: ./plan.md "Current car-dealership validation plan"

[2]: ./progress.md "Current validation progress"

[3]: ../plans/MVP-SCOPE.md "Current validation scope charter"
