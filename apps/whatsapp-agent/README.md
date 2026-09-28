# Angel: the Where They Are WhatsApp agent

Angel answers the WhatsApp number that our car-dealership Meta ads point to, following [the sales script](../../docs/sales-script.md). Where They Are is a social media agency for car dealerships, and Angel's job is to turn ad conversations into our first clients. She:

- opens with the dealership outcome and asks for the dealership name and city;
- asks how they post today and how often they want to appear in front of buyers;
- recommends one plan (Starter $32, Growth $96, Pro $240 a month) with the launch offer where it applies;
- handles objections using approved facts only;
- collects the start-up details and hands ready clients to the owner, who confirms and takes payment;
- stays silent when a reply would be pushy or pointless: a firm no, a firm "I'll get back to you", a finished conversation, a meaningless message, spam, personal messages for the founder and wrong numbers.

Qualified leads and paying clients are reported to Meta's Conversions API.

It runs as a NestJS server with these parts:

- **whatsapp-web.js** carries the messages.
- **Mastra** provides the agent, its tools and its memory.
- **OpenRouter** runs the model.
- **Jev** decides who deserves a reply, on first contact and in ongoing chats.
- **Node's built-in SQLite** holds the CRM.

> **Do not run `apps/worker-whatsapp` on the same number.** Only one WhatsApp Web session can be linked per number. Both apps would fight over it and the number risks a ban.

## How a message flows

```text
WhatsApp message(s)
  -> batched for REPLY_DEBOUNCE_MS so quick messages get one answer
  -> voice notes transcribed (Shona/Ndebele translated)
  -> first contact: Jev relevance gate
       spam / personal / wrong number / pitch -> silent, kept in ignored_messages
  -> opt-out, human takeover and rate-limit guards
  -> ongoing chat: Jev conversation gate
       firm no / "I'll get back to you" / conversation over / noise -> silent
  -> Angel (Mastra agent + tools + memory), with model fallback and one retry
  -> reply bubbles with typing indicators
  -> every step saved as a turn in the CRM
```

Both gates fail open: if Jev errors or is unsure, Angel replies. Photos and documents always get a reply. A firm no moves the lead to `lost`; a firm "I'll get back to you" moves it to `nurture`. If the lead was qualified (score 5 or more), the owner is alerted and can follow up personally.

## From lead to client

```text
Qualified -> plan recommended (recommend_plan)
  -> "let's start": Angel collects Facebook, Instagram and the plan
  -> request_human (ready_to_start): the owner is alerted
  -> the owner confirms, takes payment, then sends #client <number> <plan> [amount]
  -> paying client: a launch place is used for Growth or Pro, Meta gets a Purchase
```

Angel never takes payment or shares payment details. The launch offer (50% off the first month of Growth or Pro) is for the first five dealerships. Places are counted from clients marked with `#client` (plus `LAUNCH_PLACES_USED_OFFSET` in `src/config.ts` for any sold outside Angel).

## Running it

The following steps start Angel locally:

1. Copy `.env.example` to `apps/whatsapp-agent/.env` and set `OPENROUTER_API_KEY`. The key is sensitive, so never commit it. `ADMIN_TOKEN` enables the admin API; the two `META_*` values turn on Meta reporting.
2. `pnpm dev:angel` from the repository root. It serves on port 3104.
3. Angel links the business number (263775101506) with a pairing code. The 8-character code appears in the logs and at `GET /api/admin/whatsapp`. Enter it on the business phone under *Linked devices → Link with phone number*.
4. The session is saved under `data/wwebjs_auth` (`/data/wwebjs_auth` in Docker), so you only link once.

Everything else is fixed in `src/config.ts`:

- the model and reasoning effort;
- the owner number (263789859332) and the pairing number;
- reply pacing, takeover hours and the hourly reply cap;
- the launch places;
- the approved-examples link (`EXAMPLES_URL`, empty until examples exist).

Chromium is found automatically at `/usr/bin/chromium` in Docker; locally Puppeteer uses its own Chrome.

For Docker, run `pnpm docker:angel`. It uses the `whatsapp-agent` service in the root `docker-compose.yml`, which has Chromium and 512 MB of shared memory. The session, memory and CRM all live in the `angel-data` volume, so back that volume up.

## Owner commands

The owner (`OWNER_WHATSAPP_NUMBER`) messages the business number with:

| Command | What it does |
| --- | --- |
| `#help` | List commands |
| `#leads [stage]` | Latest leads |
| `#lead <number>` | One lead's profile and recent chat |
| `#stats` | Funnel counts plus Angel's activity (messages, turns, reply time, tokens) |
| `#pause <number> [hours\|forever]` | Angel stays quiet in that chat |
| `#resume <number>` | Hand the chat back to Angel |
| `#client <number> <starter\|growth\|pro> [amount]` | They paid: mark them a client (uses a launch place on Growth or Pro, reports a Purchase to Meta) |
| `#lost <number>` | They decided not to go ahead |
| `#stage <number> <stage>` | Set any stage (e.g. `onboarded`, `active`, `renewed`, `churned`) |
| `#note <number> <text>` | Add a note |
| `#price` | The plans and launch places left |
| `#ignored` | Contacts Angel stayed silent on at first contact |
| `#allow <number>` | Always let Angel reply to someone it ignored |

Replying by hand in a customer's chat also pauses Angel there for `HUMAN_TAKEOVER_HOURS`.

## CRM data

Everything is saved in `AGENT_DATA_DIR/crm.sqlite`, ready for a future in-house dashboard:

| Table | Contents |
| --- | --- |
| `customers` | One row per lead: profile, how they post now, how often they want to appear, Facebook and Instagram, recommended and paying plan, stage, lead score and signals, the ad they came from, opt-out, takeover |
| `messages` | Every inbound message, Angel reply and owner reply, linked to its turn |
| `turns` | Every handled batch: the outcome (`replied`, `ignored`, `fallback`, `opted_out`, `human_active`, `rate_limited`, …), the Jev verdict, the model that answered, tokens, tools used, attempts, errors and latency. A turn left `in_progress` means the process died mid-turn. |
| `events` | Funnel log: stage changes, plan recommendations, score changes, objections, commercial signals, hand-offs, silences and their reasons, clients signed, Meta events |
| `ignored_contacts` / `ignored_messages` | Who was ignored at first contact and the full text of every ignored message |
| `payments` | History of the retired website deposit flow (no longer used) |

Stages: `new → qualified → plan_recommended → ready_to_start → paying_client → onboarded → active → renewed`, with side exits `human_follow_up`, `nurture`, `not_a_fit`, `no_response`, `lost` and `churned`. Stages from the website experiment are renamed automatically on startup.

Counts shown to people are formatted by `src/format/count.ts`:

- 0–999 are shown as they are.
- Larger counts show three significant figures with a unit: 1.1K, 1.02K, 10K, 123K, 1.5M.
- Counts are truncated, never rounded up.

## Admin API

All admin routes need `Authorization: Bearer $ADMIN_TOKEN`. They are disabled when `ADMIN_TOKEN` is empty.

| Route | Returns |
| --- | --- |
| `GET /api/health` | Liveness (no token) |
| `GET /api/admin/whatsapp` | Session state, QR or pairing code |
| `GET /api/admin/stats` | Funnel and turn stats, raw plus `formatted` strings, and the offer |
| `GET /api/admin/leads?stage=&limit=` | Leads |
| `GET /api/admin/leads.csv` | CSV export |
| `GET /api/admin/leads/:id` | Profile, events, messages and turns |
| `GET /api/admin/turns?contact=&limit=` | Recent turns |
| `GET /api/admin/ignored`, `GET /api/admin/ignored/:id` | Ignored contacts and their messages |
| `GET /api/admin/payments?limit=` | History of the retired website deposit flow |
| `POST /api/admin/leads/:id/pause` `{hours}` | Pause Angel in a chat |
| `POST /api/admin/leads/:id/resume` | Hand a chat back to Angel |
| `POST /api/admin/leads/:id/stage` `{stage, reason}` | Set a stage |

## Checks

```bash
pnpm --filter @where-they-are/whatsapp-agent test
```

The live checks call OpenRouter and cost a few cents:

```bash
pnpm --filter @where-they-are/whatsapp-agent eval
```

```bash
pnpm --filter @where-they-are/whatsapp-agent relevance-eval
```

```bash
pnpm --filter @where-they-are/whatsapp-agent media-check
```

`eval` accepts scenario ids or groups (`sales_flow`, `objections`, `silence`, `hand_offs`, `edge_cases`):

```bash
pnpm --filter @where-they-are/whatsapp-agent eval silence
```

To talk to Angel in the terminal without touching real leads:

```bash
pnpm --filter @where-they-are/whatsapp-agent chat
```

What each live check covers:

- `eval`: 41 scripted conversations. They cover the qualification flow and plan recommendations, every objection, when to stay silent, hand-offs, and edge cases: fake reviews, copying a competitor's photos, prompt injection, TikTok, multiple branches and angry leads.
- `relevance-eval`: 34 first-contact reply-or-ignore cases in three difficulty levels.
- `media-check`: a voice note and a photo.

## Models

| Role | Model |
| --- | --- |
| Primary (`AGENT_MODEL`) | `google/gemini-3.8-flash`. It handles tool calling and listens to voice notes. Reasoning cannot be turned off; `AGENT_REASONING_EFFORT` defaults to `low`. |
| Fallback | Hard-coded to `google/gemini-3.5-flash` (`src/agent/angel.ts`). |
| Reply gates | `~typesafe/jev-latest` via OpenRouter's decisions API, on first contact and in ongoing chats. It costs about $0.00001 per decision and fails open, so errors always mean "reply". |
