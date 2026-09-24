# Where They Are MVP Direction

_Last updated: 2026-09-24_  
_Status: **redirect to the active Wizard-of-Oz validation plan**_

## Current authority

The project has intentionally changed direction. The active MVP is now a **Wizard-of-Oz demand-validation experiment for Zimbabwean car dealerships**, not the full automated multi-vertical platform described in the former version of this document.

Agents must begin with:

1. [`docs/plan.md`](./docs/plan.md) — the active execution plan;
2. [`docs/current_tasks.md`](./docs/current_tasks.md) — the ordered task board;
3. [`docs/vision.md`](./docs/vision.md) — the focused dealership vision;
4. [`docs/progress.md`](./docs/progress.md) — the current evidence and status;
5. [`plans/MVP-SCOPE.md`](./plans/MVP-SCOPE.md) — the active scope boundary.

The current validation journey is:

```text
car-dealer Meta ad
  -> WhatsApp qualification
  -> dealership demo
  -> objection handling
  -> human follow-up
  -> demand or payment signal
```

## Required agent behavior

Finish the current task end to end before moving to the next task. Break every task into small todos. Run the relevant tests and manual checks. Fix bugs, integration failures, security problems, data problems, and logical oversights before marking the task complete. Record evidence and make a separate commit for every feature or fix.

Do not build the full multi-vertical platform, payment lifecycle, portal, generalized automation, or other deferred capabilities merely because earlier code exists. Preserve the existing deeper code as dormant foundation unless the active dealer experiment proves that a specific part is required.

Do not invent dealership facts, inventory, competitor evidence, testimonials, prices, sales claims, lead guarantees, or business results. Escalate uncertain, commercial, or objection-heavy conversations to the human owner.

## Deferred broader platform

The later automated platform is documented in [`docs/ultimate mvp.md`](./docs/ultimate%20mvp.md). It becomes active only after the dealer validation experiment produces the unlock evidence defined there and the active task board is deliberately updated.

## References

[1]: ./docs/plan.md "Current car-dealership validation plan"

[2]: ./docs/current_tasks.md "Current validation tasks"

[3]: ./docs/vision.md "Focused dealership vision"

[4]: ./docs/progress.md "Current validation progress"

[5]: ./docs/ultimate%20mvp.md "Ultimate MVP after demand validation"

[6]: ./plans/MVP-SCOPE.md "Current validation scope charter"
