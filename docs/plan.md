# Plan

_Last updated: 2026-09-24_  
_Status: **active execution plan for the current validation phase**_

## 1. Objective

The immediate objective is to determine whether Zimbabwean car dealerships show enough interest in a dealership-specific website offer to justify building the broader Where They Are platform.

The experiment must answer:

> Will a car dealership owner or decision-maker respond to a focused advert, engage in a WhatsApp qualification conversation, review a relevant demo website, and show credible commercial intent?

The experiment should use the smallest practical amount of software. It is acceptable for a human to review leads, answer objections, assemble a proposal, and deliver the first site manually. This is not a failure of automation. It is the intended Wizard-of-Oz method for validating demand before deeper product investment.

## 2. Active customer journey

```text
Focused Meta ad for car dealerships
  -> WhatsApp message
  -> agent identifies and qualifies the lead
  -> agent asks whether the lead has seen the demo
  -> agent shares the demo link when needed
  -> lead raises questions or objections
  -> agent responds within approved boundaries
  -> human owner takes over for serious interest
  -> proposal, deposit, or payment signal
  -> manual fulfillment and learning record
```

This replaces the broader automated journey as the active implementation target. The previous generation, payment, publication, and hosting features remain available as dormant foundation work. They are not reasons to delay the demand test.

## 3. Demo website requirement

The first demo must be designed for a car dealership and must be visually credible enough for an owner to imagine their business using it. The designs under `/designs` are the source material for the demo direction.

The demo will eventually be implemented as its own Next.js application. That application must be isolated from the existing central NestJS backend and must be frontend-only for this experiment. It should not be implemented as part of the documentation update.

The demo should show a believable dealership presentation, including only approved demo content. It may include:

- dealership identity and location;
- vehicle categories or sample inventory;
- trust and contact sections;
- WhatsApp and phone actions;
- a clear explanation of how a customer can enquire;
- a strong mobile experience.

If sample vehicles, prices, testimonials, awards, or business results are not real, they must be labelled as demo content or excluded. The demo must not imply that a real dealership achieved results that have not been verified.

## 4. Advertising hypothesis

The advert should not sell an abstract AI website service. It should sell a specific outcome for a specific audience:

> A modern dealership website that helps a car business present its vehicles, location, contact options, and credibility clearly online.

The ad should direct the lead to WhatsApp. The first campaign should remain small and controlled. Record the creative, audience, budget, dates, and message version so that the result can be interpreted.

Avoid claims such as:

- guaranteed sales or leads;
- guaranteed bigger deals;
- guaranteed search rankings;
- guaranteed credibility or trust;
- instant delivery before the process is proven;
- competitor comparisons that are not verified.

## 5. WhatsApp qualification flow

The agent should be concise and should ask one useful question at a time. It should not conduct a long generic chatbot interview.

### 5.1 Opening response

> Hi, thanks for reaching out to Where They Are. We are currently helping car dealerships present their business professionally online with a modern dealership website. May I ask your name?

### 5.2 Qualification questions

Ask the following questions in a natural order:

1. What is your name?
2. What is the name of your car dealership?
3. What types of cars do you deal in?
4. Where is the dealership located?
5. Have you seen the dealership website demo?

If the lead has not seen the demo:

> Here is the dealership demo: [approved demo link]. Have a look at how the vehicles, dealership information, and contact actions are presented, then let me know what you think.

The agent may ask one or two additional questions when needed, such as whether the dealership already has a website and how customers currently enquire. It must not collect unnecessary sensitive information.

### 5.3 Qualification states

The lead should be classified into one of these operational states:

- **New:** the conversation has started but the minimum details are not known;
- **Qualified:** the lead is connected to a car dealership and has provided enough context for a useful follow-up;
- **Demo sent:** the approved demo link was delivered;
- **Engaged:** the lead responded after receiving or discussing the demo;
- **Commercial signal:** the lead asks for price, timeline, next steps, or a proposal;
- **Human follow-up:** an owner needs to respond;
- **Not a fit:** the request is outside the dealership offer or cannot be served;
- **Closed:** the experiment records the outcome.

These states are for the validation workflow. They do not authorize building a CRM or support-ticket platform.

## 6. Objection handling

The agent may respond to common objections, but it must not argue, pressure, or invent evidence.

### Objection: “We are too small for a website.”

Approved response direction:

> You may not need a large or complicated website. The point is to give your dealership a clear, professional place online where people can understand what you sell, where you are, and how to contact you. The question is not only whether you already have a website. It is whether your current online presence presents the business strongly enough when a customer or business partner checks it.

The agent may add:

> A stronger online presence may help the dealership look more established when people evaluate it, but we cannot promise a specific number of leads, sales, or larger deals.

### Objection: “We already have a Facebook page.”

Approved response direction:

> A Facebook page can be useful. The demo shows a separate place that presents the dealership, its vehicle categories, location, and contact options in one focused experience. We can first understand what you already use and then see whether a website would add value.

### Objection: “Show me another dealership that has one.”

Use one competitor or market example only if the owner has supplied or manually verified it. The agent must not search for, invent, or exaggerate a competitor example during an unverified automated conversation.

Approved response direction:

> There are dealerships in the market that use websites to present their business. We can share a verified example if useful. The more important question is whether the website would make your own dealership easier to understand and contact.

### Objection: “How much does it cost?”

The agent should give the currently approved price or state that the owner will provide a tailored quote. It must not invent pricing, discounts, payment terms, or delivery commitments.

### Escalation triggers

Hand the conversation to the owner when the lead requests negotiation, a custom feature, a guarantee, a competitor claim, a legal or regulatory statement, a complex inventory integration, a proposal, a payment link, or a timeline that is not already approved.

## 7. Human fulfillment

The first dealership sites may be produced manually or with the existing generation foundation behind the scenes. The customer-facing promise must remain truthful. The team should record:

- the information supplied by the dealership;
- the sections and content requested;
- the time spent qualifying and fulfilling the request;
- the changes requested;
- the commercial outcome;
- the reasons a lead did not proceed.

Do not build a new operations console for this. A simple controlled record is sufficient for the experiment.

## 8. Measurement and decision gate

Track the full path:

| Stage | Meaning |
|---|---|
| Ad response | The lead starts a WhatsApp conversation from the campaign |
| Qualified lead | The lead is a car dealership decision-maker or credible contact |
| Demo sent | The approved demo link is delivered |
| Demo engagement | The lead responds after receiving or discussing the demo |
| Commercial signal | The lead asks for price, proposal, timeline, or next steps |
| Deposit/payment | The lead makes a commercial commitment |
| Fulfilled site | A site is delivered or actively commissioned |

Do not decide based only on impressions, clicks, or conversation volume. The key question is whether the campaign creates enough qualified and commercially serious conversations to justify continuing.

Before launch, define numerical thresholds for:

- minimum test duration and budget;
- acceptable cost per qualified conversation;
- minimum number of commercial signals;
- minimum number of deposits or paid commitments;
- maximum manual fulfillment time that remains economically sensible.

The business owner should approve the thresholds before the campaign begins. This document intentionally does not invent a success number without the campaign budget and price being confirmed.

## 9. Decision outcomes

At the end of the first controlled test, choose one outcome:

### Continue and deepen

Use this when qualified dealerships show repeated commercial intent. The next step should improve the demo, fulfillment repeatability, and one bottleneck in the agent workflow. Do not open multiple verticals yet.

### Revise and retest

Use this when the audience engages but the message, demo, pricing, or qualification flow is weak. Change one major assumption at a time and run another controlled test.

### Stop or change the hypothesis

Use this when the test produces no credible commercial intent after a fair trial. Do not respond by building more automation. Record the learning, revise the audience or offer, and decide whether the next experiment still belongs to car dealerships.

## 10. Explicit non-goals for this phase

Do not implement the full multi-vertical platform, a general-purpose chatbot, autonomous sales, a CRM, support tickets, a customer portal, a full payment lifecycle, advanced analytics, broad plan enforcement, or a generalized modular registry as part of this demand test unless a current task explicitly proves that it is required to run the experiment.

## References

[1]: ./vision.md "Focused car-dealership vision"

[2]: ./current_tasks.md "Current validation tasks"

[3]: ./progress.md "Current validation progress"

[4]: ../plans/MVP-SCOPE.md "Current validation scope charter"

[5]: ../plans/meta_ads.md "Meta Ads plan"

[6]: ../designs/ "Dealership design source material"
