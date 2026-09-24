# Ridgeline Motors — dealership demo design

Source material for Task 2 in [`docs/current_tasks.md`](../../docs/current_tasks.md): the single car-dealership demo site used in the validation experiment. It is implemented in [`apps/dealership-demo`](../../apps/dealership-demo).

Ridgeline Motors is a **fictional dealership**. Every page carries a "This is a sample website made by the team at Where They Are" banner. The stock, prices, people, phone numbers and testimonial are sample content, not facts about a real business.

## Where this came from

The designs were exported as one 21 MB self-unpacking HTML bundle (`designs/Ridgeline Motors Sample Site.html`). That file is git-ignored. This folder holds what was extracted from it:

| Path | Contents |
|---|---|
| `screens/NN-page.desktop.html` | The 1440px desktop artboard for each page, as standalone HTML |
| `screens/NN-page.mobile.html` | The 390px mobile artboard for each page (it includes a drawn phone frame, which is not part of the site) |
| `assets/*.webp` | The vehicle photos, re-encoded as WebP at 1920px maximum width |
| `fonts/*.woff2` | Geist and Geist Mono (SIL Open Font License), Latin and Latin Extended subsets |

Open any screen file in a browser to see the reference design. The files use relative paths, so they work from a local static server or straight from disk.

## Pages

| # | Page | Route | Artboard state shown |
|---|---|---|---|
| 01 | Home | `/` | Hero, stock search, makes, featured car, showroom grid, why us, finance calculator, trade-in step 1, testimonial, visit, footer |
| 02 | Stock | `/stock` | Filtered results with the filter sidebar (a filter sheet on mobile) |
| 03 | Vehicle | `/stock/[id]` | Gallery, test-drive enquiry form, specs, features, inspection, similar cars (a sticky action bar on mobile) |
| 04 | Sell your car | `/sell` | Step 2 of 2: photos |
| 05 | Finance | `/finance` | Application step 1 of 3, showing a validation error |
| 06 | Service | `/service` | Booking step 2 of 3: day and time |
| 07 | Contact | `/contact` | Writing a message |

## Design tokens

- Ink `#0E0F11`, dark panels `#15171A` and `#26282C`, muted text `#5F6368`, `#3C3F44` and `#7C7F86`
- Lines `#E3E3DF` and `#D2D2CD`, soft surface `#F3F3F1`, canvas `#E4E4E0`
- Accent orange `#FF5A1F` (tint `#FFF3EC`), error red `#D92D20`, success green `#12B76A`
- Type: Geist (UI and display, 400–700), Geist Mono (labels, specs, eyebrows)
- Radii: pill `999px` for buttons and chips, 12–14px for inputs and tiles, 20–26px for cards and section shells

## Open items

- **Photo licensing.** The vehicle photos came with the design, and their source and licence are unknown. Some show real number plates. Confirm we may use them, or replace them, before the demo is promoted in paid ads.
