# Current Progress

_Last updated: 2026-09-25_

## Current phase

Where They Are has deliberately changed direction. The immediate objective is no longer to complete the automated multi-vertical website platform. The immediate objective is to test demand with a **Wizard-of-Oz MVP for Zimbabwean car dealerships**.

A Wizard-of-Oz MVP means that the customer sees a focused, credible product and receives a useful sales experience, while some delivery work remains manual behind the scenes. This is intentional. The purpose of this phase is to learn whether car dealers will respond to the offer, engage with the agent, review a dealership website demo, and pay for a site before investing in deeper automation.

## What exists

The repository already contains a broader monorepo and central NestJS architecture. It also contains earlier work for WhatsApp intake, Jev/OpenRouter routing, structured AI extraction, site generation, tenant data, releases, payments, domains, hosting, contact submissions, approvals, and publication metadata.

That code is retained as a foundation. It is **not the active delivery target for this validation phase**. Agents must not expand or polish those deeper features unless a task in `docs/current_tasks.md` explicitly requires it for the dealer experiment.

The dealership design work is available under `/designs`. It is the source material for the single demo website. A separate Next.js application for the demo website is planned, but it has not been requested for implementation in this documentation task.

## Current active outcome

The active outcome is a working validation loop:

```text
car-dealer Meta ad
  -> WhatsApp conversation
  -> dealership-specific qualification
  -> demo link
  -> objection handling
  -> human-assisted follow-up
  -> demand and payment signal
```

The agent must qualify the lead for the dealership offer. It must not pretend that the full automated website-generation platform is already the product being sold.

## Built for the experiment (2026-09-25)

- `apps/dealership-demo`: the Ridgeline Motors sample site (Next.js, Docker), set up for deployment at `https://dealership-demo.wheretheyare.co.zw`. Its vehicle-detail, sell, finance, service and contact pages are still simple placeholders.
- `apps/whatsapp-agent` ("Angel"): a new NestJS + whatsapp-web.js + Mastra agent that narrows the WhatsApp conversation to dealer qualification. It has these parts:
  - **Conversation:** it follows `docs/sales-script.md`: the founding offer ($250 instead of $400 for the first five dealerships, with a free domain, free stock import and free fixes within 48 hours) and the demo link early, one qualification question at a time, a 0–10 lead score, and objections from approved knowledge only. Non-dealership businesses are welcomed and handed over.
  - **Close (added 2026-09-25):** Angel takes the $125 deposit through Paynow mobile checkout (EcoCash or OneMoney) in the chat. When Paynow confirms, the customer gets the materials checklist and the owner gets an alert. The owner marks delivery with `#delivered` and requests the balance with `#balance`.
  - **Meta:** qualified leads, deposit requests and payments are reported to the Conversions API.
  - **Relevance and media:** a Jev relevance gate keeps Angel silent on spam, personal messages, wrong numbers and pitches. Voice notes are transcribed.
  - **CRM:** a SQLite CRM records every customer, message, turn (model, tokens, latency, outcome), funnel event, payment and ignored message. This is the tracking record Task 6 needs; a dashboard for it stays deferred.
  - **Evidence:** 26/26 live sales scenarios (Paynow faked) and 31/31 live relevance cases pass. See `apps/whatsapp-agent/README.md`.

## What is not yet complete

- The deployed demo URL has not been smoke-tested on a phone.
- The Meta campaign has not been launched for the focused dealership offer.
- Angel has not been linked to the live business number, and no human hand-off has been tested end to end on real WhatsApp.
- Paynow and the Meta Conversions API have not been tested with real credentials: a Paynow test-mode payment and a Meta test event are still needed (Task 4b).
- The exact ad creative, budget, tracking sheet, and validation thresholds still need to be approved.
- No demand conclusion has been reached.

## Evidence required before expansion

The team must collect enough evidence to decide whether car dealerships show real interest. Evidence includes qualified conversations, demo views, replies after the demo, objection patterns, requests for pricing or next steps, deposits or payments, and the amount of manual effort required to move a lead forward.

A large number of clicks without qualified conversations is not proof of demand. A positive conversation without a commercial commitment is interest, not validation. The decision to expand the product should be based on observed behavior and recorded evidence.

## Documentation authority during this phase

- `docs/plan.md` defines the immediate execution plan.
- `docs/current_tasks.md` defines the active task list.
- `docs/vision.md` defines the current focused vision.
- `docs/ultimate mvp.md` defines the later platform target and is not the current sprint backlog.
- `plans/MVP-SCOPE.md` defines the current validation scope boundary.
- `CONTEXT.md` remains the broader technical context and architecture record.

## References

[1]: ./plan.md "Current car-dealership validation plan"

[2]: ./current_tasks.md "Current validation tasks"

[3]: ./ultimate%20mvp.md "Ultimate MVP after demand validation"

[4]: ../plans/MVP-SCOPE.md "Current validation scope charter"

[5]: ../CONTEXT.md "Broader project context"

[6]: ../designs/ "Dealership design source material"
