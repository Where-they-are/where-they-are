# Current Progress

_Last updated: 2026-09-24_

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

## What is not yet complete

- The dealership demo has not been confirmed as a deployed, public Next.js app.
- The Meta campaign has not been launched for the focused dealership offer.
- The WhatsApp agent has not yet been narrowed and tested against the dealer qualification script.
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
