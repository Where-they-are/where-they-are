# Where They Are Modular Website Design System Plan

_Last updated: 2026-09-23_

> This is the single authoritative design handoff for the first generation of Where They Are websites. It defines the starting business-group matrix, plan-level design concepts, module inventory, visual hierarchy, tokens, and the first two detailed vertical specifications.

## 1. Design-system direction

Where They Are should not generate an unlimited collection of unrelated templates. It should assemble each website from a controlled library of **modules**, **visual variants**, **themes**, and **page recipes**. This gives the designer room to create variety while keeping quality, accessibility, performance, and implementation predictable.

Use the following internal vocabulary:

- **Business group:** the broad customer-facing category, such as Restaurants & Hospitality.
- **Niche:** a more specific business type, such as restaurant, cafe, barber, or law firm.
- **Module:** an independent website section with a clear purpose, content contract, responsive behavior, and visual variants.
- **Variant:** an approved visual treatment of a module, such as `split-image` or `editorial-collage`.
- **Recipe:** an approved ordered composition of modules for a page.
- **Theme:** the visual token set applied to a site.
- **Plan concept:** the design direction and level of composition assigned to Starter, Growth, or Premium.

The word **template** may remain in legacy code, but the new design system should use versioned module compositions instead of one fixed template per business.

## 2. Product constraints

The design system must support the current product model and user stories [1] [2]:

- **Starter:** `$50` creation price, one revision, one strong single-page site.
- **Growth:** `$150` creation price, three revisions, up to two additional pages, contact forms, deeper SEO, and richer composition.
- **Premium:** `$450` creation price, five revisions, up to four additional pages, contact forms, deeper SEO, priority treatment, and the strongest visual direction.
- All plans include responsive layouts, WhatsApp actions, phone and email actions where supplied, analytics, galleries, and maps or location information where relevant.
- Starter must look complete and modern. Its limitation is composition depth, not basic quality.
- The system must not invent testimonials, prices, awards, opening hours, credentials, history, service claims, or business facts.
- A module that requires information the customer has not supplied must be removed or replaced by a truthful no-data alternative.
- Version one is for brochure and service websites. Booking engines, ecommerce, food ordering, calendars, customer accounts, memberships, advanced dashboards, and complex integrations are out of scope.

## 3. Concrete starting matrix

The following matrix is the initial design catalogue. Each cell is a **design concept**, not a separate codebase. All concepts use the shared foundations and approved modules.

| Business group | Starter concept | Growth concept | Premium concept |
|---|---|---|---|
| Restaurants & Hospitality | **Clean Local Welcome**: bright, direct, menu-led, with a compact hero, offerings list, location, and WhatsApp CTA | **Editorial Table**: richer food imagery, grouped menu or services, venue story, gallery rhythm, and stronger local discovery | **Signature Hospitality**: art-directed image composition, layered venue story, featured offerings, atmosphere, gallery storytelling, and premium conversion moments |
| Beauty & Grooming | **Polished Studio**: clean service cards, one strong gallery, studio details, and WhatsApp CTA | **Studio Editorial**: stronger portrait imagery, service categories, process or experience section, gallery rhythm, and enquiry form | **Artisan Beauty House**: refined editorial typography, image-led storytelling, service highlights, transformations, atmosphere, and premium enquiry path |
| Fitness & Wellness | **Active Local**: clear class or service cards, approachable imagery, location, and WhatsApp CTA | **Wellbeing Journey**: programme groups, coach or studio story, proof, gallery, and enquiry form | **Performance & Balance**: art-directed movement imagery, programme pathways, transformation story, facility narrative, and premium consultation path |
| Professional Services | **Clear Authority**: practice areas, concise about section, contact actions, and location | **Trusted Practice**: process steps, principal or team profile, representative work, FAQ, and consultation form | **Distinctive Advisory**: editorial authority, case-led proof, layered expertise sections, stronger narrative, and premium consultation journey |
| Local & Home Services | **Reliable Local Service**: service list, service area, direct call and WhatsApp actions, and simple proof | **Proven Local Operator**: process steps, service-area coverage, project gallery, quote form, and FAQ | **Craft & Confidence**: strong project imagery, detailed service journeys, proof-led composition, and premium quote experience |
| Events & Community | **Event Essentials**: event purpose, date or location when supplied, key information, gallery, and enquiry CTA | **Gathering Story**: richer event narrative, programme or offerings, previous-event gallery, directions, and enquiry form | **Immersive Occasion**: high-impact hero, event atmosphere, programme storytelling, venue experience, gallery composition, and premium registration-interest path |
| Education & Care | **Warm Learning Welcome**: programme summary, approach, contact actions, location, and simple gallery | **Guided Learning**: programme cards, learning approach, facilities, admissions steps, FAQ, and enquiry form | **Learning Community**: editorial learning story, programme pathways, facilities narrative, admissions journey, and premium enquiry composition |
| General Business | **Focused Business Introduction**: clear value proposition, services, about, and contact actions | **Structured Business Story**: richer service presentation, process, proof, FAQ, and enquiry form | **Distinctive Brand Presence**: art-directed story, stronger content hierarchy, richer proof, and premium conversion path |

### Matrix rules

1. A business group may use several recipes, but it must begin from one of these named concepts.
2. A niche changes labels, imagery direction, and module priority; it does not create an uncontrolled layout.
3. The same concept must remain recognizable across mobile and desktop.
4. Premium is not merely a darker colour palette or more animation. Its difference is composition, hierarchy, art direction, and richer page storytelling.
5. The plan entitlement must be enforced by the generator. A Starter site must not receive Growth or Premium modules because the AI selected them.
6. The customer can request a different visual direction only from the approved concepts available to the purchased plan.

## 4. Plan-level design specification

### Starter: Clean and focused

Starter sites use a restrained type scale, one primary accent, straightforward grids, compact section spacing, and a small set of reliable module variants. The page should reach the primary conversion action quickly. The recommended home page has six to eight meaningful sections.

Starter should prioritize:

- A clear hero with one primary CTA.
- A concise about or value section.
- A services or offerings section.
- A gallery when approved images exist.
- Location or operating details when supplied.
- A final WhatsApp, phone, email, or contact-link CTA.

Starter should avoid overlapping cards, large decorative backgrounds, complex scroll effects, multiple competing CTAs, and dense content blocks.

### Growth: Editorial and conversion-focused

Growth sites use more visual rhythm, more section variants, stronger image treatment, grouped content, and a clearer inner-page structure. The home page should have eight to twelve meaningful sections, with two additional pages available when the content justifies them.

Growth may use:

- Split or image-led heroes.
- Grouped offerings and featured items.
- Process, FAQ, proof, or trust sections.
- Richer galleries.
- Contact forms.
- About and services inner pages.
- Deeper page metadata and structured content.

### Premium: Art-directed and distinctive

Premium sites use the strongest approved typography, image composition, contrast, layering, editorial rhythm, and page narrative. Premium does not authorize arbitrary design. It authorizes a larger set of tested variants and more deliberate composition.

Premium may use:

- Layered or art-directed heroes.
- Controlled overlap and asymmetric grids.
- Featured offerings with supporting detail.
- Editorial galleries and story sections.
- Stronger proof and process narratives.
- Up to four additional pages.
- Premium consultation or enquiry journeys.

Motion must remain purposeful, short, and respectful of reduced-motion preferences. Visual complexity must never reduce readability or conversion clarity.

## 5. Shared visual foundations and token guidelines

The designer should create one foundation library before creating vertical-specific modules. Token names should remain stable so they can be mapped directly into the renderer.

### 5.1 Colour tokens

Use semantic roles, not raw colour names. A site theme may change the underlying values while preserving the role.

```text
color.canvas              Page background
color.surface              Card, panel, and raised-surface background
color.surface-muted        Low-emphasis section background
color.ink                  Primary text
color.ink-muted            Secondary text and metadata
color.ink-subtle           Tertiary text; never use for essential information
color.brand                Primary brand accent
color.brand-strong         Hover, active, or high-contrast brand accent
color.brand-soft           Light accent background
color.action               Primary CTA background
color.action-ink           Primary CTA text
color.border               Default border
color.border-strong        Emphasized border or divider
color.success              Success state
color.warning              Warning state
color.danger               Error and destructive state
color.focus                Keyboard focus indicator
```

Every theme must specify contrast-safe values for text, links, buttons, form controls, image overlays, and focus indicators. Do not use colour as the only way to communicate meaning.

### 5.2 Typography tokens

Typography should use a display family and a reading family only when the pairing is justified. A single-family system is acceptable for Starter.

```text
type.family-display       Headings and display statements
type.family-body          Paragraphs, labels, and UI text
type.weight-regular       Body copy
type.weight-medium        Labels and supporting emphasis
type.weight-semibold      Buttons, cards, and subheadings
type.weight-bold          Strong display emphasis
type.size-display         Large hero statement
type.size-h1              Page heading
type.size-h2              Major section heading
type.size-h3              Module heading
type.size-body            Default reading size
type.size-small           Metadata and supporting copy
type.size-label           Buttons, tags, and form labels
type.leading-display      Display line height
type.leading-heading      Heading line height
type.leading-body         Reading line height
type.tracking-display     Display letter spacing
type.tracking-label       Label letter spacing
```

Recommended hierarchy:

- One visible `h1` per page.
- `h2` for major sections.
- `h3` for module-level subheadings.
- Paragraph text should normally use 45–75 characters per line on desktop.
- A hero should communicate the business and customer benefit before decorative language.
- Uppercase labels are optional and must not replace meaningful headings.

### 5.3 Spacing and layout tokens

Use a four-point base scale with larger composition steps. Avoid one-off spacing values.

```text
space-1   4px       space-2   8px       space-3   12px
space-4   16px      space-5   20px      space-6   24px
space-8   32px      space-10  40px      space-12  48px
space-16  64px      space-20  80px      space-24  96px
space-32  128px
```

```text
layout.page-gutter-mobile   20px
layout.page-gutter-tablet   32px
layout.page-gutter-desktop  48px
layout.content-max          1200px
layout.reading-max          720px
layout.hero-max             1280px
layout.grid-gap             24px
layout.section-gap          80px Starter baseline
layout.section-gap-rich     112px Growth/Premium maximum baseline
```

The exact pixel values may be tuned during implementation, but the relationships must remain consistent. The smallest screens must never require horizontal scrolling.

### 5.4 Shape, elevation, and motion tokens

```text
radius-none       0px       radius-sm       6px
radius-md         10px      radius-lg       16px
radius-xl         24px      radius-pill     999px
shadow-none       none      shadow-soft     low-elevation card
shadow-raised     medium-elevation panel
shadow-focus      visible keyboard focus treatment
```

Use rounded surfaces intentionally. Hospitality and Beauty may use softer radii; Professional Services may use sharper geometry. The theme must not apply a radius to every element automatically.

```text
motion-fast       120ms
motion-standard   220ms
motion-slow       420ms
motion-ease       ease-out
motion-reduced    no transform, no parallax, no essential motion
```

Do not make content appear only after motion. Hover effects must have keyboard-equivalent states.

### 5.5 Responsive and media tokens

The designer must show at least these states:

- Narrow mobile: approximately 320–375px.
- Wide mobile: approximately 390–480px.
- Tablet: approximately 768px.
- Desktop: approximately 1280px.
- Wide desktop: approximately 1440px and above.

```text
media.hero-wide          16:9 or wider
media.hero-portrait      4:5
media.card-landscape     4:3
media.card-portrait      3:4
media.gallery-square     1:1
media.avatar             1:1
media.logo               intrinsic, constrained by height
```

Every image slot needs an approved crop strategy, an `alt`-text rule, a loading rule, and a no-image fallback. Decorative images should use empty alternative text; informative images need supplied descriptions.

## 6. Module specification format

Every module delivered by the designer must include the following fields:

```text
id
family
purpose
supportedBusinessGroups
supportedNiches
supportedPlans
requiredContent
optionalContent
visualVariants
primaryAction
secondaryAction
allowedPositions
mobileBehavior
emptyState
accessibilityState
imageRequirements
performanceNotes
revisionCategory
registryVersion
```

The `revisionCategory` must be one of:

- `content`: copy, label, link, image, or colour-level change.
- `composition`: module ordering, spacing, variant, or layout change.
- `new-scope`: unsupported module, new page, or plan upgrade request.

This classification will support the future intelligent edit-cost calculation.

## 7. Complete shared module inventory

The following inventory is the initial implementation catalogue. Each module should have a Figma component, mobile and desktop frames, long-content behavior, empty state, and a renderer specification.

### 7.1 Global shell modules

| Module ID | Purpose and hierarchy | Initial variants | Availability |
|---|---|---|---|
| `shell.announcement` | Optional time-sensitive notice above navigation; never compete with the hero | `quiet`, `accent`, `dismissible` | All plans when supplied |
| `shell.header` | Brand first, primary navigation second, primary action third | `simple`, `transparent`, `editorial` | All plans; richer variants Growth/Premium |
| `shell.mobile-navigation` | Accessible menu with clear close state and primary CTA | `drawer`, `compact` | All plans |
| `shell.breadcrumbs` | Context for inner pages; never needed on a single-page Starter site | `minimal`, `labelled` | Growth/Premium where useful |
| `shell.footer` | Contact summary, navigation, legal links, social links, and final action | `standard`, `expanded`, `editorial` | All plans |

### 7.2 Hero and orientation modules

| Module ID | Purpose and hierarchy | Initial variants | Required content |
|---|---|---|---|
| `hero.primary` | One `h1`, short supporting statement, one primary CTA, optional secondary action | `centered`, `split-image`, `image-led`, `dark-panel`, `minimal-service`, `layered-editorial` | Business name or supplied title; truthful value proposition |
| `hero.inner` | Page title and orientation for inner pages | `compact`, `image-strip`, `editorial` | Page title |
| `orientation.trust-strip` | Fast confidence or operating facts; only supplied facts | `inline`, `icon-row`, `metrics` | At least two factual items |
| `orientation.quick-links` | Direct links to key sections or pages | `pills`, `stacked`, `rail` | Destination labels and links |

The hero must not contain invented claims. If no approved image is available, use a strong typographic or colour-led variant rather than an empty image frame.

### 7.3 Story, offering, and proof modules

| Module ID | Purpose and hierarchy | Initial variants | Notes |
|---|---|---|---|
| `story.about` | Explain who the business is and why it exists | `short`, `split-image`, `editorial` | Use supplied facts only |
| `story.feature` | Highlight one supplied differentiator or offering | `image-text`, `dark-panel`, `large-type` | One idea, not a second hero |
| `offerings.list` | Present a scannable list of services, products, menu items, or programmes | `simple-list`, `compact-cards`, `grouped-categories` | Prices optional and never invented |
| `offerings.featured` | Give one or two supplied items visual priority | `featured-item`, `split-detail`, `editorial-card` | Must link to fuller information when needed |
| `offerings.comparison` | Compare supplied packages or programmes | `cards`, `horizontal`, `stacked-mobile` | Growth/Premium; avoid false equivalence |
| `proof.process` | Show how the business works | `three-step`, `timeline`, `numbered-list` | Use only supplied process steps |
| `proof.testimonials` | Show customer quotes | `quote-card`, `editorial-quote`, `stacked` | Only when real approved quotes exist |
| `proof.credentials` | Display supplied qualifications, associations, or certifications | `logo-row`, `credential-cards`, `text-list` | Never infer credentials |
| `proof.projects` | Show representative work or completed projects | `case-cards`, `featured-project`, `gallery-linked` | Professional and local-service groups |
| `proof.stats` | Show supplied measurable facts | `number-row`, `highlight-card` | Do not create numbers |

### 7.4 Media modules

| Module ID | Purpose and hierarchy | Initial variants | Empty behavior |
|---|---|---|---|
| `media.gallery` | Let customers inspect approved work, venue, products, or atmosphere | `two-column`, `three-column`, `horizontal-scroll`, `editorial-collage`, `featured-thumbnails` | Remove module or use image-free story section |
| `media.image-text` | Combine one approved image with a focused story | `image-left`, `image-right`, `overlap` | Fall back to text-only story |
| `media.video-placeholder` | Reserved for a supplied hosted video or approved embed | `poster-card`, `full-bleed` | Do not render if no video exists |
| `media.logo-strip` | Show supplied partners or brands | `quiet-row`, `scrolling-rail` | Remove if no approved logos |

### 7.5 Local information and conversion modules

| Module ID | Purpose and hierarchy | Initial variants | Availability |
|---|---|---|---|
| `local.location` | Address, area served, directions, and map when supplied | `map-split`, `text-card`, `dark-panel` | All groups where relevant |
| `local.hours` | Opening or operating hours supplied by the customer | `table`, `compact-list`, `highlight` | Remove when absent |
| `local.service-area` | Areas served by local businesses | `tag-list`, `map-free-list`, `split` | Local & Home Services |
| `conversion.cta` | One strong next action | `whatsapp`, `phone`, `email`, `visit`, `consultation`, `quote` | All plans |
| `conversion.contact-form` | Structured enquiry capture | `compact`, `split`, `multi-step-light` | Growth and Premium only |
| `conversion.faq` | Address approved recurring questions | `accordion`, `two-column`, `editorial` | Growth/Premium or content-rich Starter |
| `conversion.social-links` | Provide supplied social destinations | `inline`, `icon-row`, `footer-only` | All plans when supplied |
| `conversion.notice` | Important supplied notice or next step | `quiet`, `accent`, `warning` | All plans when needed |

### 7.6 Utility and state modules

| Module ID | Purpose | Required states |
|---|---|---|
| `utility.section-heading` | Consistent eyebrow, heading, and supporting copy | Short, long, no-supporting-copy |
| `utility.button-group` | Primary and secondary actions | One action, two actions, narrow mobile |
| `utility.tag-list` | Niche, service area, programme, or category labels | One tag, many tags, wrapping |
| `utility.divider` | Separate content without excessive borders | Light, strong, hidden mobile |
| `utility.empty-content` | Truthful fallback when optional content is absent | No image, no testimonial, no map |
| `utility.form-field` | Shared form input behavior | Default, focus, error, success, disabled |
| `utility.status-message` | Submission and error feedback | Success, validation error, network error |

## 8. Vertical specification: Restaurants & Hospitality

### 8.1 Design objective

The Hospitality & Food family must make the business feel real, local, and easy to visit or contact. Food and venue imagery should create appetite or atmosphere, but the first screen must still answer: what is this business, where is it, and what should I do next?

Use **Restaurants & Hospitality** as the customer-facing group. Internally use `hospitality-food`.

### 8.2 Niche adaptations

| Niche | Priority content | Primary action |
|---|---|---|
| Restaurant | Menu or offerings, signature items, location, hours, atmosphere | Visit, call, WhatsApp |
| Cafe | Menu highlights, atmosphere, location, opening hours | Visit, directions, WhatsApp |
| Bakery | Signature products, gallery, ordering or enquiry details | WhatsApp, call |
| Caterer | Catering services, event types, service area, enquiry | Quote or WhatsApp |
| Lodge or guesthouse | Accommodation highlights, facilities, location, gallery | Enquiry or call |
| Takeaway | Menu, ordering contact, collection details, operating hours | WhatsApp or call |

### 8.3 Plan concepts and page recipes

#### Starter: Clean Local Welcome

Visual direction: warm canvas, clear display heading, one prominent supplied image or a typography-led hero, compact menu or offerings cards, and a visible location/action path. Use no more than two strong image moments.

Recommended home sequence:

```text
shell.header.simple
hero.primary.split-image or hero.primary.centered
orientation.trust-strip.inline
offerings.list.grouped-categories or offerings.list.simple-list
story.about.short
media.gallery.two-column              when approved images exist
local.location + local.hours
conversion.cta.whatsapp
shell.footer.standard
```

Allowed Starter variations:

- `hero.primary.centered` for businesses without an approved hero image.
- `offerings.list.simple-list` for short menus or service lists.
- `offerings.list.grouped-categories` when the customer supplies categories.
- `media.gallery.two-column` for four to eight images.
- `local.location` may be text-only when map data is absent.

Starter should not use editorial collage, complex overlapping cards, video, or a contact form.

#### Growth: Editorial Table

Visual direction: richer food or venue imagery, stronger section rhythm, grouped offerings, one featured item, a simple venue story, gallery variety, and a contact form. Use two or three strong image moments with clear text balance.

Recommended pages:

```text
Home: hero.primary.image-led
      orientation.trust-strip.icon-row
      offerings.featured.featured-item
      offerings.list.grouped-categories
      story.about.split-image
      media.gallery.featured-thumbnails
      local.location + local.hours
      conversion.cta + conversion.contact-form

About or Visit: hero.inner.image-strip
                story.about.editorial
                media.image-text
                local.location + local.hours

Menu or Services: hero.inner.compact
                   offerings.list.grouped-categories
                   offerings.featured.split-detail
                   conversion.cta.whatsapp
```

Growth may use `media.gallery.horizontal-scroll`, `proof.process.three-step` for catering, and `conversion.faq.accordion`. The form should remain short and appropriate to an enquiry, not a booking engine.

#### Premium: Signature Hospitality

Visual direction: art-directed atmosphere, stronger typographic contrast, controlled overlap, featured offerings, editorial venue story, and a deliberate journey from desire to action. Use image depth without obscuring content or slowing the page.

Recommended pages:

```text
Home: hero.primary.layered-editorial
      orientation.quick-links.pills
      offerings.featured.editorial-card
      story.feature.image-text
      offerings.list.grouped-categories
      media.gallery.editorial-collage
      local.location.dark-panel
      proof.testimonials.editorial-quote when supplied
      conversion.cta.visit or whatsapp

About: hero.inner.editorial
       story.about.editorial
       media.image-text.overlap
       proof.process.timeline when supplied
       conversion.cta

Menu or Services: hero.inner.image-strip
                   offerings.featured.split-detail
                   offerings.list.grouped-categories
                   media.gallery.horizontal-scroll
                   conversion.contact-form.split

Visit or Contact: hero.inner.compact
                  local.location + local.hours
                  conversion.faq.two-column
                  conversion.contact-form.split
```

Premium may use `hero.primary.dark-panel`, `media.gallery.editorial-collage`, and `media.image-text.overlap`, but no more than one overlapping composition should appear in a short page sequence.

### 8.4 Hospitality module rules

- Never generate menu items, ingredients, prices, dietary claims, opening hours, or awards.
- If a menu is supplied as an image or document, show only approved extracted content and preserve an accessible text alternative where possible.
- Do not use a generic food photograph as if it were the business’s own food. Label supplied stock or placeholder imagery internally and replace it before publication.
- For lodges and guesthouses, use `offerings.featured` for accommodation types and `media.gallery` for supplied facilities or rooms.
- For caterers, replace menu language with `offerings.list` for catering packages and use `proof.process` for the enquiry journey.
- For takeaways, prioritize menu and WhatsApp or phone action above a long story section.
- Location and hours are high-priority modules but must disappear cleanly when the business has not supplied them.

## 9. Vertical specification: Beauty & Grooming

### 9.1 Design objective

The Beauty & Grooming family should communicate confidence, care, skill, and a clear path to enquire. Images should show the studio, work, or supplied products. The design should feel polished without making unsupported claims about expertise, results, or safety.

Use **Beauty & Grooming** as the customer-facing group. Internally use `beauty-grooming`.

### 9.2 Niche adaptations

| Niche | Priority content | Primary action |
|---|---|---|
| Salon | Services, style gallery, studio details, opening information | WhatsApp or call |
| Barber | Cuts and grooming services, work gallery, location | WhatsApp or call |
| Spa | Treatments, atmosphere, facilities, enquiry details | WhatsApp or enquiry |
| Nail studio | Service menu, style gallery, studio details | WhatsApp or enquiry |
| Makeup artist | Portfolio, occasion types, process, service area | Consultation enquiry |
| Wellness or beauty therapist | Treatment list, approach, location, supplied credentials | Enquiry or WhatsApp |

### 9.3 Plan concepts and page recipes

#### Starter: Polished Studio

Visual direction: light or softly tinted canvas, confident type, clear services, one gallery, and a direct WhatsApp action. The design should feel finished without excessive decoration.

Recommended home sequence:

```text
shell.header.simple
hero.primary.centered or hero.primary.split-image
story.about.short
offerings.list.simple-list or offerings.list.compact-cards
media.gallery.two-column
local.location + local.hours when supplied
conversion.cta.whatsapp
shell.footer.standard
```

Allowed variants:

- `hero.primary.centered` when the customer has no approved portrait or studio image.
- `offerings.list.compact-cards` for short service groups.
- `media.gallery.two-column` for supplied work examples.
- `utility.tag-list` for service categories or style categories.

Starter must not use invented before-and-after results, testimonials, booking availability, or product claims. It must not include a contact form.

#### Growth: Studio Editorial

Visual direction: stronger portrait or studio imagery, grouped service categories, a clear experience or process section, gallery rhythm, and contact form. The page should guide the customer from visual confidence to enquiry.

Recommended pages:

```text
Home: hero.primary.image-led
      orientation.trust-strip.inline
      offerings.list.grouped-categories
      story.feature.image-text
      media.gallery.featured-thumbnails
      proof.process.three-step when supplied
      conversion.cta + conversion.contact-form

Services: hero.inner.compact
          offerings.list.grouped-categories
          offerings.featured.featured-item
          conversion.faq.accordion when supplied
          conversion.contact-form.compact

About or Studio: hero.inner.image-strip
                  story.about.split-image
                  media.image-text.image-right
                  local.location + local.hours
```

Growth may use one `media.image-text.overlap` composition, provided the content remains readable on mobile. Use a short form with name, contact method, requested service, preferred message, and consent.

#### Premium: Artisan Beauty House

Visual direction: refined editorial type, carefully framed portraits or studio images, quiet luxury or distinctive craft, service highlights, transformations only when supplied, and a premium enquiry journey.

Recommended pages:

```text
Home: hero.primary.layered-editorial
      orientation.quick-links.pills
      offerings.featured.editorial-card
      story.feature.image-text
      media.gallery.editorial-collage
      proof.process.timeline when supplied
      local.location.dark-panel
      conversion.cta.consultation or whatsapp

Services: hero.inner.editorial
          offerings.list.grouped-categories
          offerings.featured.split-detail
          media.image-text.overlap
          conversion.faq.two-column
          conversion.contact-form.split

Studio or About: hero.inner.image-strip
                  story.about.editorial
                  media.gallery.horizontal-scroll
                  proof.credentials.logo-row when supplied
                  local.hours + location

Contact: hero.inner.compact
         conversion.cta.consultation
         conversion.contact-form.split
         local.location
```

Premium may use a quiet dark panel or a high-contrast editorial section, but it must not imply luxury, exclusivity, medical efficacy, or professional credentials unless those facts are supplied and approved.

### 9.4 Beauty module rules

- Do not invent treatment names, prices, products, qualifications, sanitation claims, or results.
- Do not present generic stock portraits as the studio’s own work.
- Before-and-after content is permitted only when supplied and explicitly approved.
- A gallery without sufficient images should be removed rather than filled with repetitive placeholders.
- Service cards should support a short title, short description, optional duration, optional price, and optional image. Missing duration or price must not produce empty labels.
- For barbers, prioritise service categories, work gallery, location, and WhatsApp action.
- For makeup artists, prioritise portfolio, occasion types, process, service area, and consultation enquiry.
- For spas and wellness businesses, use supplied treatment information and avoid health or medical claims.

## 10. Other business-group starter recipes

These are the first recipes to design after Hospitality & Food and Beauty & Grooming. They are included so the matrix has a complete starting scope without requiring full vertical specifications yet.

### Professional Services

```text
hero.primary.centered or split-image
orientation.trust-strip.inline
story.about.short
offerings.list.simple-list
proof.process.three-step when supplied
proof.credentials.logo-row when supplied
conversion.cta.consultation
```

Growth adds `proof.projects`, `conversion.faq`, and `conversion.contact-form`. Premium adds `story.feature`, `proof.projects.featured-project`, and a case-led inner page.

### Local & Home Services

```text
hero.primary.split-image
orientation.trust-strip.inline
offerings.list.compact-cards
local.service-area.tag-list
proof.process.three-step
media.gallery.two-column when supplied
conversion.cta.quote
```

Growth adds a quote form and FAQ. Premium adds project storytelling and a richer service-area composition.

### Events & Community

```text
hero.primary.image-led
orientation.quick-links.pills
story.about.short
offerings.list.grouped-categories or event details
media.gallery.two-column
local.location
conversion.cta.whatsapp or enquiry
```

Growth adds programme, previous-event gallery, and enquiry form. Premium adds an immersive event story and additional inner pages.

### Education & Care

```text
hero.primary.split-image
story.about.short
offerings.list.grouped-categories
proof.process.three-step
media.gallery.two-column
local.location
conversion.cta.enquiry
```

Growth adds admissions steps, FAQ, and contact form. Premium adds programme pathways and a richer learning-community narrative.

### General Business

```text
hero.primary.centered
story.about.short
offerings.list.simple-list
story.feature.image-text
media.gallery.two-column when supplied
conversion.cta
```

The composer should use General Business when vertical confidence is low instead of forcing a misleading niche.

## 10A. Remaining business-group modular specifications

The following specifications complete the first business-group catalogue. They use the shared module inventory and add only the variations that make each group feel credible. Each group has a clear customer goal, a controlled set of niche adaptations, and a recipe for every plan.

### 10A.1 Professional Services

#### Design objective

Professional-services sites should communicate competence, clarity, and trust without looking like a generic corporate brochure. The first screen should explain the service and the type of client helped. The page should then make expertise understandable before asking for a consultation.

Internal ID: `professional-services`.

#### Niche adaptations

| Niche | Priority content | Primary action |
|---|---|---|
| Lawyer or legal practice | Practice areas, consultation context, supplied credentials, location | Consultation enquiry |
| Accountant or financial adviser | Services, client types, process, supplied qualifications | Call or consultation enquiry |
| Consultant | Areas of expertise, process, representative work, client outcome claims only when supplied | Consultation enquiry |
| Creative or marketing agency | Services, selected work, process, industries served | Enquiry or portfolio review |
| Architect or designer | Portfolio, capabilities, approach, location | Project enquiry |
| Recruitment or HR service | Service categories, process, industries, enquiry path | Enquiry |

#### Modular variations

| Module family | Approved variations | Design rule |
|---|---|---|
| Hero | `centered`, `split-image`, `minimal-service`, `dark-panel` | Lead with the service and client problem, not a vague slogan |
| Practice areas | `simple-list`, `grouped-categories`, `featured-area`, `editorial-split` | Use customer language and supplied areas only |
| Expertise | `principal-profile`, `team-card`, `credentials-list`, `approach-panel` | Do not imply qualifications or team members that were not supplied |
| Process | `three-step`, `timeline`, `numbered-list` | Use only the business’s real process |
| Proof | `case-cards`, `project-grid`, `testimonial-quote`, `credential-row` | Each proof item needs approved source content |
| Conversion | `consultation`, `quote`, `call`, `contact-form` | Growth and Premium may use forms; Starter uses direct actions |

#### Starter: Clear Authority

```text
shell.header.simple
hero.primary.centered or hero.primary.minimal-service
orientation.trust-strip.inline
offerings.list.simple-list
story.about.short
proof.credentials.logo-row when supplied
local.location when relevant
conversion.cta.consultation
shell.footer.standard
```

Starter should use a calm canvas, strong reading width, limited decorative imagery, and one primary action. It should not use invented case studies, statistics, or client logos.

#### Growth: Trusted Practice

```text
Home: hero.primary.split-image
      orientation.trust-strip.icon-row
      offerings.list.grouped-categories
      proof.process.three-step
      story.about.split-image
      proof.projects.case-cards when supplied
      conversion.faq.accordion when supplied
      conversion.contact-form.compact

Inner page: hero.inner.compact
            offerings.featured.featured-item
            proof.credentials.logo-row
            conversion.cta.consultation
```

Growth may add a principal or team profile, provided names, roles, and biographies are supplied. The contact form should ask only for information needed to begin a conversation.

#### Premium: Distinctive Advisory

```text
Home: hero.primary.layered-editorial
      story.feature.large-type
      offerings.featured.editorial-card
      offerings.list.grouped-categories
      proof.projects.featured-project
      proof.process.timeline
      proof.credentials.credential-cards
      conversion.cta.consultation

Practice page: hero.inner.editorial
               offerings.list.grouped-categories
               media.image-text.overlap when relevant
               proof.testimonials.editorial-quote when supplied
               conversion.contact-form.split

About page: hero.inner.image-strip
            story.about.editorial
            expertise.principal-profile or team-card
            proof.credentials.logo-row
            conversion.cta
```

Premium may use asymmetric grids and editorial type, but the reading order must remain obvious. A legal or financial site should prefer authority and legibility over visual novelty.

#### Professional-services content rules

- Do not invent legal outcomes, financial returns, certifications, memberships, awards, client names, or guarantees.
- Do not turn a supplied service list into a claim of expertise beyond the supplied wording.
- Case studies require a supplied context, service, and approved result statement.
- If no team information exists, use an approach or process module instead of a fictitious profile.
- The primary CTA should normally be `consultation`, `call`, or `enquiry`, not a generic “learn more”.

### 10A.2 Fitness & Wellness

#### Design objective

Fitness and wellness sites should communicate energy, care, and a clear first step without making unsupported health or transformation claims. The design should show the experience of the place or programme, explain who it is for, and make an enquiry easy.

Internal ID: `fitness-wellness`.

#### Niche adaptations

| Niche | Priority content | Primary action |
|---|---|---|
| Gym or fitness studio | Classes, facilities, membership enquiry, location | Visit or WhatsApp enquiry |
| Personal trainer | Training approach, client type, supplied programme details | Consultation enquiry |
| Yoga or Pilates studio | Class types, approach, studio atmosphere, timetable information when supplied | Enquiry or visit |
| Dance school | Classes, age groups, programme information, showcase gallery | Enquiry |
| Sports club or academy | Programmes, age groups, facilities, supplied schedule | Enquiry or visit |
| Wellness coach | Approach, programme structure, supplied qualifications, enquiry path | Consultation enquiry |

#### Modular variations

| Module family | Approved variations | Design rule |
|---|---|---|
| Hero | `image-led`, `split-image`, `centered`, `dark-panel` | Show movement or calm, but keep the action visible |
| Programmes | `class-grid`, `grouped-categories`, `pathway-cards`, `featured-programme` | Use age, level, duration, or schedule only when supplied |
| Coach or instructor | `profile-card`, `approach-panel`, `team-row` | Names, roles, and qualifications must be grounded |
| Experience | `facility-gallery`, `studio-story`, `process-steps`, `what-to-expect` | Explain the first visit without promising results |
| Progress or proof | `testimonial-quote`, `milestone-list`, `community-panel` | Never create before-and-after or health claims |
| Conversion | `trial-enquiry`, `consultation`, `visit`, `contact-form` | Do not imply instant booking unless implemented |

#### Starter: Active Local

```text
shell.header.simple
hero.primary.split-image or hero.primary.centered
story.about.short
offerings.list.compact-cards
media.gallery.two-column when supplied
local.location + local.hours when supplied
conversion.cta.whatsapp or visit
shell.footer.standard
```

Starter should feel approachable and energetic. Use one accent colour and one strong image treatment. Avoid fake transformation statistics, membership prices, class schedules, and medical claims.

#### Growth: Wellbeing Journey

```text
Home: hero.primary.image-led
      orientation.trust-strip.inline
      offerings.list.grouped-categories
      story.feature.image-text
      proof.process.three-step or what-to-expect
      media.gallery.featured-thumbnails
      local.location + local.hours
      conversion.contact-form.compact

Programmes: hero.inner.compact
            offerings.featured.featured-item
            offerings.list.grouped-categories
            conversion.faq.accordion
            conversion.cta.trial-enquiry
```

Growth can include a coach or instructor profile, facilities gallery, and supplied testimonials. A timetable may be displayed as content, but the site must not suggest real-time availability without a booking integration.

#### Premium: Performance & Balance

```text
Home: hero.primary.layered-editorial
      orientation.quick-links.pills
      offerings.featured.editorial-card
      story.feature.image-text
      offerings.list.pathway-cards
      media.gallery.editorial-collage
      expertise.profile-card or team-row
      conversion.cta.consultation

Programmes: hero.inner.editorial
            offerings.list.grouped-categories
            proof.process.timeline
            media.image-text.overlap
            conversion.contact-form.split

Studio: hero.inner.image-strip
        story.about.editorial
        media.gallery.horizontal-scroll
        local.location.dark-panel
        conversion.cta.visit
```

#### Fitness and wellness content rules

- Do not invent health, medical, weight-loss, body-transformation, or performance claims.
- Do not invent membership prices, class times, instructor qualifications, or facility features.
- Use “enquire about a trial” only when the business actually offers a trial.
- Display supplied schedules as informational content, not as live availability.
- Use real supplied work or facility imagery. Do not use generic athletic imagery as if it were the customer’s facility.
- A wellness site should use calm composition and readable contrast even when the brand is energetic.

### 10A.3 Local & Home Services

#### Design objective

Local and home-service sites must establish reliability quickly. The customer should understand the service area, type of work, response path, and next action before reading a long story.

Internal ID: `local-services`.

#### Niche adaptations and modules

| Niche | Priority modules | Primary action |
|---|---|---|
| Plumber, electrician, or repair service | `offerings.list`, `local.service-area`, `proof.process`, `conversion.cta.quote` | Quote or call |
| Cleaner or gardener | `offerings.grouped-categories`, `proof.process`, `media.gallery`, `local.service-area` | WhatsApp or quote |
| Builder or contractor | `offerings.featured`, `proof.projects`, `media.gallery`, `proof.process` | Project enquiry |
| Automotive or appliance repair | `offerings.list`, `utility.tag-list`, `local.location`, `conversion.cta.call` | Call or visit |
| Security or technical installer | `offerings.list`, `proof.credentials`, `service-area`, `conversion.contact-form` | Quote enquiry |

#### Plan recipes

Starter uses `hero.primary.split-image`, `orientation.trust-strip.inline`, `offerings.list.compact-cards`, `local.service-area.tag-list`, `proof.process.three-step`, and `conversion.cta.quote`.

Growth adds `media.gallery.featured-thumbnails`, `proof.projects.case-cards`, `conversion.faq.accordion`, `local.location`, and `conversion.contact-form.compact`. It may use a quote-specific page when the supplied service list is long.

Premium uses `hero.primary.image-led` or `layered-editorial`, `offerings.featured.editorial-card`, `proof.projects.featured-project`, `media.gallery.editorial-collage`, `proof.process.timeline`, and `conversion.contact-form.split`.

#### Local-service content rules

- Service-area claims must come from the customer.
- Do not create emergency-response promises, response times, guarantees, prices, or licences.
- Project galleries need supplied project context and must not expose private customer information.
- The quote form should not request sensitive information that is unnecessary for an initial enquiry.

### 10A.4 Events & Community

#### Design objective

Events and community sites should make the purpose, audience, timing, and location easy to understand. Their strongest asset is usually atmosphere, so images and clear information should work together rather than compete.

Internal ID: `events-community`.

#### Niche adaptations and modules

| Niche | Priority modules | Primary action |
|---|---|---|
| Event organizer | `hero`, `offerings.list`, `media.gallery`, `conversion.contact-form` | Enquiry |
| Wedding or event supplier | `media.gallery`, `offerings.featured`, `proof.process`, `conversion.cta.quote` | Quote enquiry |
| Church or community organization | `story.about`, `offerings.list`, `local.location`, `conversion.cta.whatsapp` | Visit or contact |
| NGO or community project | `story.about`, `proof.projects`, `proof.process`, `conversion.cta.enquiry` | Enquiry or support interest |
| Conference or workshop | `hero`, `orientation.quick-links`, `offerings.list`, `local.location` | Interest or enquiry |

#### Plan recipes

Starter uses `hero.primary.image-led`, `orientation.trust-strip.inline`, `story.about.short`, `offerings.list.simple-list`, `media.gallery.two-column`, `local.location`, and `conversion.cta.whatsapp`.

Growth adds `orientation.quick-links.pills`, `offerings.list.grouped-categories`, `media.gallery.featured-thumbnails`, `proof.process.three-step`, `conversion.faq.accordion`, and `conversion.contact-form.compact`.

Premium uses `hero.primary.layered-editorial`, `story.feature.image-text`, `offerings.featured.editorial-card`, `media.gallery.editorial-collage`, `local.location.dark-panel`, `proof.projects.featured-project`, and `conversion.contact-form.split`.

#### Events and community content rules

- Dates, venues, programmes, registration status, and ticket information must be supplied.
- Do not create event schedules or registration functionality unless it is implemented.
- Use `conversion.cta` for interest or enquiry rather than implying a confirmed registration.
- Community and faith-based organizations require respectful, factual language with no invented impact claims.

### 10A.5 Education & Care

#### Design objective

Education and care sites should feel trustworthy, warm, and organized. Parents, learners, or caregivers must be able to understand the programme, audience, location, and enquiry path without navigating a dense institutional interface.

Internal ID: `education-care`.

#### Niche adaptations and modules

| Niche | Priority modules | Primary action |
|---|---|---|
| Private school | `offerings.list`, `story.about`, `proof.process`, `local.location`, `conversion.contact-form` | Admissions enquiry |
| Tutor or training provider | `offerings.grouped-categories`, `proof.process`, `conversion.cta.consultation` | Enquiry |
| Childcare or early-learning centre | `story.about`, `media.gallery`, `local.location`, `conversion.contact-form` | Visit or enquiry |
| Skills or vocational provider | `offerings.list`, `proof.credentials`, `proof.process`, `conversion.cta.enquiry` | Enquiry |
| Care or support service | `story.about`, `offerings.featured`, `proof.credentials`, `conversion.cta.call` | Call or enquiry |

#### Plan recipes

Starter uses `hero.primary.split-image`, `story.about.short`, `offerings.list.grouped-categories`, `media.gallery.two-column`, `local.location`, and `conversion.cta.enquiry`.

Growth adds `proof.process.three-step`, `proof.credentials.logo-row`, `conversion.faq.accordion`, `media.image-text.image-right`, and `conversion.contact-form.compact`.

Premium uses `hero.primary.layered-editorial`, `story.feature.image-text`, `offerings.featured.editorial-card`, `offerings.list.pathway-cards`, `media.gallery.editorial-collage`, `proof.process.timeline`, and `conversion.contact-form.split`.

#### Education and care content rules

- Do not invent accreditation, pass rates, safety claims, staff credentials, age ranges, fees, term dates, or facilities.
- Images of children require explicit approval and appropriate privacy handling.
- Use a text-based alternative when a supplied prospectus is represented visually.
- Avoid language that guarantees educational, developmental, or care outcomes.

### 10A.6 General Business

#### Design objective

General Business is the safe fallback for businesses that do not fit the initial groups or whose intake is too incomplete for confident classification. It should feel purposeful rather than generic.

Internal ID: `general-business`.

#### Niche adaptations and modules

| Business situation | Priority modules | Primary action |
|---|---|---|
| Product or trading business | `offerings.list`, `media.gallery`, `conversion.cta.whatsapp` | Enquiry |
| Small agency or studio | `story.about`, `offerings.list`, `proof.projects`, `conversion.cta.consultation` | Consultation |
| Community or nonprofit business | `story.about`, `proof.projects`, `local.location`, `conversion.cta.enquiry` | Enquiry |
| Unclassified SME | `hero`, `story.about`, `offerings.list`, `conversion.cta` | Supplied primary action |

#### Plan recipes

Starter uses `hero.primary.centered`, `story.about.short`, `offerings.list.simple-list`, `media.gallery.two-column` when supplied, `local.location` when relevant, and `conversion.cta`.

Growth adds `hero.primary.split-image`, `story.feature.image-text`, `proof.process.three-step`, `proof.projects.case-cards`, `conversion.faq.accordion`, and `conversion.contact-form.compact`.

Premium uses `hero.primary.layered-editorial`, `story.feature.large-type`, `offerings.featured.editorial-card`, `proof.projects.featured-project`, `media.gallery.editorial-collage`, and `conversion.contact-form.split`.

#### General-business content rules

- Do not force a business into a specific vertical when classification confidence is low.
- Use neutral labels such as “Services”, “What we offer”, or “Contact” when a more specific label is not grounded.
- The fallback must still have a strong visual point of view through the chosen concept, typography, and composition.
- A future review of generated sites should promote repeated General Business patterns into new vertical modules when demand is proven.

### 10A.7 Cross-group variation rules

The business groups share implementation primitives but differ in emphasis. The designer should follow these rules when adapting a module:

1. Change the content label before creating a new component. `offerings.list` can become menu, services, programmes, practice areas, classes, or packages.
2. Create a new variant only when the hierarchy, responsive behavior, or content contract materially changes.
3. Keep the primary CTA tied to the customer goal: visit, call, WhatsApp, consultation, quote, admissions enquiry, or event interest.
4. Keep proof factual. If a group has no supplied proof, use story, process, or location instead.
5. Use imagery that represents the actual business or clearly approved assets. Do not use stock imagery as implied evidence.
6. Every group must work with a text-led composition when images are missing.
7. Do not let a niche adaptation alter plan entitlements.

## 11. Page and section hierarchy

Every page should follow this hierarchy unless the recipe explicitly states otherwise:

```text
Page
└── Header
    └── Main
        ├── Hero: page identity and primary action
        ├── Orientation: trust, quick links, or essential facts
        ├── Core offer: services, menu, programmes, or practice areas
        ├── Differentiation: story, process, proof, or featured item
        ├── Evidence: gallery, credentials, projects, or supplied testimonials
        ├── Local information: location, hours, service area, or directions
        ├── Conversion: one clear next action or form
        └── Footer
```

Hierarchy rules:

1. The hero owns the page `h1`.
2. Each major section has one `h2`.
3. Cards use `h3` only when they represent a meaningful sub-item.
4. An eyebrow or label supports a heading; it never replaces it.
5. A primary CTA must be visually distinct from secondary links.
6. The page should not have more than one visually dominant section in a row.
7. The first screen should explain the business before asking for a detailed action.
8. The final section should repeat the primary action in a calmer form.
9. On mobile, visual order must follow reading order. Do not rely on image position to communicate essential meaning.
10. Every form error must be visible in text and associated with its field.

## 12. Registry and generation rules

The generator should choose from a versioned registry. A registry entry should resemble the following:

```ts
{
  id: "offerings.grouped-categories",
  family: "offerings",
  supportedPlans: ["starter", "growth", "premium"],
  businessGroups: ["hospitality-food", "beauty-grooming", "education-care"],
  variants: ["compact", "editorial", "featured"],
  requiredFields: ["groups"],
  optionalFields: ["prices", "notes", "image"],
  allowedPositions: ["home.core-offer", "services.core-offer"],
  registryVersion: "2026.09.1"
}
```

The generation flow is:

1. Validate the intake object.
2. Classify business group and niche.
3. Store classification confidence.
4. Use `general-business` when confidence is low.
5. Select the plan concept, theme, page recipe, and module variants.
6. Fill modules only from grounded intake facts and approved assets.
7. Remove modules whose required content is missing.
8. Enforce plan limits, page count, form entitlement, and module ordering.
9. Render through trusted module components.
10. Store the exact composition, theme, and registry version on the release.

The AI may choose among approved registry entries. It may not create new module IDs, unsupported variants, arbitrary markup, invented facts, or higher-plan entitlements. The deterministic fallback must use the same registry and recipes [3].

## 13. Designer handoff requirements

### Figma foundations

Deliver a foundations page containing typography, colour roles, spacing, grid, container widths, buttons, links, form controls, navigation, footer, image treatment, focus states, error states, and reduced-motion notes. Every token must have a stable name and a usage note.

### Figma module library

For each module, provide:

- Desktop and narrow-mobile frames.
- Starter, Growth, and Premium states where the difference is meaningful.
- Short, long, and missing-content examples.
- Image and no-image states.
- Keyboard focus, error, and success states where relevant.
- Content labels that map to the module contract.
- Stable component and variant IDs.

### Vertical boards

For Hospitality & Food and Beauty & Grooming, provide one board for each plan concept, one complete home recipe, the supported niche adaptations, and the prohibited or unavailable modules.

### Handoff metadata

Every module handoff must include:

```text
module ID
variant ID
business-group tags
niche tags
plan availability
required fields
optional fields
image ratio
mobile stacking rule
empty-state rule
accessibility notes
performance notes
revision category
registry version
```

## 14. Implementation sequence

### Phase 1: Hospitality & Food

Design and implement the shared foundations, global shell, six core modules, three plan concepts, and the complete home recipe for Hospitality & Food. Validate the result at mobile and desktop widths before expanding the catalogue.

### Phase 2: Beauty & Grooming

Reuse the foundations and shell. Add beauty-specific module variants, the three plan concepts, and complete home and services recipes.

### Phase 3: Remaining groups

Add Professional Services, Local & Home Services, Events & Community, Education & Care, and General Business one group at a time. Do not design all groups in parallel before the first two have passed implementation review.

### Phase 4: Registry migration

Extend the existing generator contracts with `businessGroup`, `niche`, `theme`, `recipes`, `modules`, and `moduleRegistryVersion`. Keep the legacy broad template value for backward compatibility while new releases use the registry [3].

### Phase 5: Verification

Test every module with long names, missing optional fields, missing images, many items, narrow mobile widths, keyboard navigation, contrast, reduced motion, and no-data states. Test at least one complete composition per plan and business group before adding more variants.

## 15. Readiness definition

The first designer slice is ready for engineering when:

- The three Hospitality & Food and three Beauty & Grooming concepts have approved Figma frames.
- Every used module has a stable ID and content contract.
- Every used module has mobile, desktop, empty, and accessibility states.
- The plan matrix and entitlements are reflected in the registry.
- The designer has provided image ratios, crop rules, and alt-text guidance.
- The complete recipe can be rendered without invented content.
- The approved composition and registry version can be stored on a release.

## References

[1]: ../CONTEXT.md "Where They Are project context"

[2]: USER-STORIES.md "Where They Are product user stories"

[3]: ../packages/contracts/src/generator.ts "Where They Are generator contracts"

**Document owner:** Where They Are product and design team  
**Implementation owner:** Central NestJS generator and shared site-rendering system  
**Revision status:** Expanded designer handoff; update after the first approved Figma slice.
