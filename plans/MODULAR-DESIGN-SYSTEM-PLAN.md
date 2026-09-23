# Where They Are Modular Website Design System Plan

_Last updated: 2026-09-23_

## Recommendation

Where They Are should replace the current fixed-template model with a **vertical-aware modular design system**. A generated site should be assembled from approved modules, visual variants, themes, and page recipes. This gives customers variety without allowing AI to invent arbitrary layouts.

Use these terms internally:

- **Vertical:** a broad business group, such as Hospitality & Food.
- **Niche:** a specific business type inside a vertical, such as restaurant or barber.
- **Module:** an independent website section with a purpose, content contract, responsive behavior, and visual variants.
- **Variant:** an approved visual treatment of a module, such as `split-image` or `centered-editorial`.
- **Recipe:** an approved ordered composition of modules for a page.
- **Theme:** typography, colour, spacing, imagery, and surface tokens.
- **Plan tier:** Starter, Growth, or Premium.

Use **industry** or **business type** in customer-facing language. Use **vertical** and **niche** in the internal system. The word **template** can remain temporarily in legacy code, but it should no longer be the primary design concept.

## Product constraints

The system must preserve the current product model and user stories [1] [2]:

- Starter is `$50`, Growth is `$150`, and Premium is `$450` for website creation.
- Hosting and domain charges remain separate.
- Starter must look deliberate and modern, not unfinished.
- All plans include WhatsApp actions, analytics, galleries, maps where relevant, and responsive layouts.
- Growth and Premium include contact forms, deeper SEO, additional pages, and priority support.
- Starter has one revision, Growth has three, and Premium has five.
- Growth includes two additional pages; Premium includes four.
- The generator must not invent testimonials, prices, awards, opening hours, history, or service claims.
- Version one remains focused on brochure and service websites. Booking systems, ecommerce, ordering, calendars, customer accounts, and advanced dashboards are out of scope.

## Design-system layers

### Foundations

Create the shared visual foundation before vertical-specific work. It should define typography, type scale, colour roles, surface treatments, spacing, grids, container widths, borders, radii, shadows, icons, buttons, form states, image ratios, focus states, breakpoints, and motion guidance.

There should be three levels of visual depth, not three unrelated brands:

| Plan | Design direction | Main difference |
|---|---|---|
| Starter | Clean and focused | Fewer variants, restrained type, simple grids, clear conversion |
| Growth | Editorial and conversion-focused | Richer composition, stronger image treatment, more page rhythm |
| Premium | Art-directed and distinctive | Layered composition, stronger hierarchy, richer page structures |

Accessibility, responsiveness, performance limits, and the quality threshold must be shared by all plans.

### Semantic modules

Each module must have a stable ID and specification covering its purpose, supported verticals, supported plans, required and optional fields, visual variants, image requirements, empty states, mobile behavior, accessibility, conversion action, repeatability, valid placement, and revision category.

The generator should receive structured module data. It must never generate arbitrary HTML or CSS.

### Vertical adaptations

Vertical adaptations change labels, content mapping, imagery guidance, and module priority. They should not require a completely separate renderer for every niche.

For example, the same offerings module can become menu categories for a restaurant, services for a salon, practice areas for a law firm, programmes for a school, or packages for an event organizer.

### Page recipes

Recipes are approved sequences of modules. They prevent random combinations from producing awkward layouts. Initial recipes should include:

- `local-service-home`
- `hospitality-home`
- `professional-practice-home`
- `beauty-studio-home`
- `events-community-home`
- `education-home`
- `about-page`
- `services-page`
- `gallery-page`
- `contact-page`

A recipe should define required positions and optional slots. The customer sees a finished site; recipes remain an internal composition tool.

### Release composition

Every release should store the vertical, niche, plan, theme, page recipes, module IDs, variants, grounded content, approved assets, entitlements, and module-registry version. This prevents future registry changes from silently altering an approved site.

## Initial vertical taxonomy

| Internal ID | Customer-facing label | Example niches | Main conversion |
|---|---|---|---|
| `hospitality-food` | Restaurants & Hospitality | Restaurant, cafe, caterer, bakery, lodge, guesthouse | Visit, call, WhatsApp, menu, directions |
| `beauty-grooming` | Beauty & Grooming | Salon, barber, spa, nail studio, makeup artist | WhatsApp enquiry, call, services, gallery |
| `professional-services` | Professional Services | Lawyer, accountant, consultant, agency, designer | Consultation, call, email, WhatsApp |
| `local-services` | Local & Home Services | Plumber, electrician, cleaner, builder, repair service | Quote request, call, WhatsApp |
| `events-community` | Events & Community | Event organizer, wedding supplier, church, NGO, conference | Enquiry, registration interest, WhatsApp |
| `education-care` | Education & Care | Private school, tutor, training provider, childcare | Enquiry, visit, call, programmes |
| `general-business` | General Business | Businesses outside the initial groups | Contact, call, WhatsApp, learn more |

Start with these groups. Add Retail & Lifestyle after real demand is measured. Classification should consider the category, description, services, operating model, location, and customer goal. The customer or operator must be able to correct the classification before publication.

## First module catalogue

### Global modules

The first library should include:

1. Announcement bar.
2. Site header.
3. Hero.
4. Trust strip.
5. About story.
6. Services or offerings.
7. Gallery.
8. Testimonial or quote.
9. FAQ.
10. Location and hours.
11. Contact CTA.
12. Contact form.
13. Social links.
14. Footer.

Testimonials, prices, hours, maps, and social proof must only appear when the business supplies or approves the information.

### Vertical-specific modules

**Hospitality & Food:** grouped menu, signature offering, venue story, opening-hours/location, catering callout, accommodation highlights.

**Beauty & Grooming:** service categories, before-and-after gallery, studio experience, booking enquiry CTA, opening-hours/location, seasonal service callout.

**Professional Services:** practice areas, principal profile, process steps, credentials, representative work, consultation CTA.

**Local & Home Services:** service areas, quote request, service checklist, process steps, project gallery, supplied availability notice.

**Events & Community:** event hero, date and location, programme, organizer profile, venue directions, previous-event gallery, registration-interest CTA.

**Education & Care:** programme overview, learning approach, facilities gallery, admissions steps, term notice, location and contact panel.

## Plan-level allowances

| Capability | Starter | Growth | Premium |
|---|---|---|---|
| Page model | One strong single-page site | Home plus two extra pages | Home plus four extra pages |
| Home modules | 6–8 | 8–12 | 10–16 |
| Hero variants | 2 | 4 | 6 |
| Theme depth | One restrained direction | More profiles and section contrast | Art-directed profiles and layering |
| Offerings | Basic list or cards | Grouped, featured, or richer grids | Editorial and highly composed layouts |
| Gallery | Simple grid or horizontal gallery | Multiple layouts | Editorial collage and richer treatment |
| Contact | WhatsApp, phone, email links | Contact form plus Starter actions | Contact form plus stronger conversion composition |
| SEO | Technical baseline | Expanded page metadata | Deeper page hierarchy and content fields |
| Revisions | 1 | 3 | 5 |
| Extra pages | 0 | 2 | 4 |

The server must enforce these entitlements. AI output must not unlock Growth or Premium capabilities for a Starter request.

## Required visual variants

### Hero

Create `centered-editorial`, `split-image`, `image-led`, `dark-panel`, and `minimal-service` variants. Starter should use the first two. Growth can add image-led and dark-panel. Premium can use all five, including controlled overlap and layering.

### Offerings

Create `simple-list`, `card-grid`, `grouped-categories`, `featured-item`, and `editorial-split` variants. The family must handle one item, many items, long descriptions, missing prices, and mobile stacking.

### Gallery

Create `two-column-grid`, `three-column-grid`, `editorial-collage`, `horizontal-scroll`, and `featured-with-thumbnails` variants. If no approved images exist, use an image-free alternative rather than empty image cards.

### Conversion

Create WhatsApp-first, phone-first, quote-request, consultation, visit-location, and contact-form variants. Each page should have one primary conversion goal.

## Designer deliverables

### Foundations file

The Figma file should contain brand direction, typography, colour, spacing, grid, buttons, links, form controls, navigation, footer, image treatment, responsive behavior, and accessibility states. Each foundation needs a usage note and a do/don’t example.

### Module library

Show Starter, Growth, and Premium behavior where it materially differs. Provide desktop and mobile frames, long and short content, missing optional fields, empty states, focus states, and image failures. Use stable IDs that can become code registry IDs.

### Vertical adaptation boards

For each initial vertical, show the recommended hero, offerings module, proof/story module, gallery treatment, conversion action, image guidance, and modules that should not be used.

### Recipe boards

Create at least one home recipe per vertical and plan. Create inner-page recipes for Growth and Premium. Label modules with IDs, for example:

```text
hospitality-food / growth / home
hero.split-image
trust-strip.operating-details
offerings.grouped-categories
story.short-about
gallery.editorial-grid
location.hours-map
cta.whatsapp-form
footer.standard
```

### Handoff specification

Every module needs a written specification beside the Figma component. It must state the content contract, responsive behavior, plan availability, vertical tags, registry ID, and revision category.

## Generator and registry rules

The future implementation should use a versioned registry. A simplified entry could look like this:

```ts
{
  id: "offerings.grouped-categories",
  family: "offerings",
  supportedPlans: ["starter", "growth", "premium"],
  verticals: ["hospitality-food", "education-care"],
  variants: ["compact", "editorial", "featured"],
  requiredFields: ["groups"],
  optionalFields: ["prices", "notes", "image"],
  repeatable: false,
  registryVersion: "2026.09.1"
}
```

The existing `siteTemplate` field can remain for backward compatibility. New releases should add `vertical`, `niche`, `theme`, `recipes`, `modules`, and `moduleRegistryVersion`. Existing releases should continue to render through the legacy path until migrated.

The generation flow should be:

1. Validate intake.
2. Classify vertical and niche.
3. Assign confidence and use `general-business` when confidence is low.
4. Select a plan-appropriate theme and recipe.
5. Fill modules from grounded facts and approved assets.
6. Select variants based on available content.
7. Remove modules whose required data is missing.
8. Enforce plan limits, page count, content length, CTA rules, and module ordering.
9. Render through trusted module renderers.
10. Store the composition and registry version with the release.

The AI may choose among approved options. It may not create module IDs, unsupported variants, arbitrary markup, or plan features. The deterministic fallback must use the same registry and recipes.

## Composition quality rules

The composer must enforce the following:

1. One primary hero and one primary conversion goal per page.
2. No repeated module family without a clear content reason.
3. Galleries require approved assets.
4. Testimonials require approved testimonial content.
5. Contact forms are unavailable to Starter.
6. Two visually dominant image sections must not appear consecutively.
7. Long content moves to an inner page or is shortened without changing facts.
8. Every site has a route to WhatsApp, phone, or another approved contact action.
9. The footer remains consistent across verticals.
10. Every module works at narrow mobile widths.
11. Accessibility and contrast checks run before preview generation.
12. The same intake produces a stable composition unless a new design direction is requested.

## Delivery phases

### Phase 1: Foundations

Finalize vocabulary, tokens, typography, colour, grids, buttons, navigation, footer, responsive behavior, and accessibility rules.

### Phase 2: Core library

Create and document the global modules. Prioritize complete states and excellent responsive behavior over a large number of sections.

### Phase 3: Vertical modules

Add signature modules for Hospitality & Food, Beauty & Grooming, Professional Services, Local & Home Services, Events & Community, and Education & Care.

### Phase 4: Plan depth

Apply Starter, Growth, and Premium visual depth without creating three unrelated design systems.

### Phase 5: Recipes and examples

Create one canonical home recipe per vertical and plan. Use fictional, clearly labelled content until real examples are approved.

### Phase 6: Engineering handoff

Convert IDs, variants, content contracts, and entitlements into the versioned registry. Update the shared contracts and renderer so new sites use modules rather than only the current broad template field [3].

### Phase 7: Verification

Test every module at mobile and desktop widths with long names, missing assets, missing optional fields, long lists, keyboard navigation, contrast, and no-data states. Test at least one complete composition per vertical and plan before adding more combinations.

## Readiness definition

The system is ready for implementation when every module has a stable ID, content contract, plan availability, responsive design, empty state, and accessibility behavior; every initial vertical has a canonical recipe; the AI can select only from the registry; and each release stores the exact composition and registry version.

## Immediate designer assignment

Start with **Hospitality & Food across all three plans**. Design the foundations, six core modules, three hero variants, two offerings variants, two gallery variants, two conversion variants, and one complete home recipe per plan.

This vertical is a strong first slice because it demonstrates imagery, structured offerings, location information, and WhatsApp conversion. After approval, reuse the foundations and contracts for Beauty & Grooming and Professional Services. Do not design every vertical in parallel before one complete slice has been implemented and tested.

## References

[1]: ../CONTEXT.md "Where They Are project context"

[2]: USER-STORIES.md "Where They Are detailed user stories"

[3]: ../packages/contracts/src/generator.ts "Where They Are generator contracts"

**Document owner:** Where They Are product and design team  
**Implementation owner:** Central NestJS generator and shared site-rendering system

**Revision status:** Planning baseline. Update after the first approved Figma vertical slice.

The current implementation should continue supporting existing broad template values until the module-registry migration is complete.

End of plan.
