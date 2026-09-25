# Angel: the Where They Are WhatsApp agent

Angel answers the WhatsApp number that the car-dealership Meta ads point to, following [the sales script](../../docs/sales-script.md). She:

- gives the founding offer and the demo link early;
- qualifies the dealer and scores the lead;
- handles objections using approved facts only;
- takes the $125 deposit through Paynow (EcoCash or OneMoney) right in the chat, and the $125 balance after delivery;
- hands anything unusual to the owner.

Qualified leads and payments are reported to Meta's Conversions API.

Businesses that are not dealerships are welcomed: Angel tells them we build sites for them too, collects their details and hands them over. Spam, personal messages for the founder, wrong numbers and sales pitches are left unanswered.

It runs as a NestJS server with these parts:

- **whatsapp-web.js** carries the messages.
- **Mastra** provides the agent, its tools and its memory.
- **OpenRouter** runs the model.
- **Jev** decides which messages are relevant.
- **Node's built-in SQLite** holds the CRM.

> **Do not run `apps/worker-whatsapp` on the same number.** Only one WhatsApp Web session can be linked per number. Both apps would fight over it and the number risks a ban.

## How a message flows

```text
WhatsApp message(s)
  -> batched for REPLY_DEBOUNCE_MS so quick messages get one answer
  -> voice notes transcribed (Shona/Ndebele translated)
  -> Jev relevance gate (new or previously ignored contacts only)
       spam / personal / wrong number / pitch -> silent, kept in ignored_messages
  -> opt-out, human takeover and rate-limit guards
  -> Angel (Mastra agent + tools + memory), with model fallback and one retry
  -> reply bubbles with typing indicators
  -> every step saved as a turn in the CRM
```

## Taking payment

The flow from buying signal to won deal:

```text
lead says "let's go" -> Angel asks which EcoCash/OneMoney number
  -> request_payment: Paynow sends a $125 prompt to their phone (stage deposit_requested)
  -> Paynow confirms (result URL POST, or Angel's polling every 10s for up to 10 minutes)
  -> stage deposit_paid, the customer gets the materials checklist, the owner gets an alert
  -> team builds the site (within 3 days of getting everything)
  -> owner sends #delivered <number>, then #balance <number> (or the customer asks Angel to pay)
  -> balance paid: stage won
```

The rules that keep this safe:

- **Verified payments only:** a payment counts only once Paynow reports it paid. Angel never says a payment went through on the customer's word.
- **Signed results only:** result URL posts must carry a valid Paynow hash.
- **Exact amounts:** a payment for the wrong amount is never confirmed, and it alerts the owner.
- **Failures:** a cancelled or expired prompt gets one offer to retry. A second failure goes to the owner.
- **Restarts:** payments that were waiting when the server stopped are polled again after a restart.
- **No Paynow credentials:** Angel alerts the owner to send payment details by hand.

For a test run, use Paynow's integration in test mode with `PAYNOW_AUTH_EMAIL` set to the merchant login email. Paynow's test wallet numbers:

| Number | Result |
| --- | --- |
| `0771111111` | Succeeds |
| `0772222222` | Succeeds after a delay |
| `0773333333` | The user cancels |
| `0774444444` | Insufficient balance |

## Running it

The following steps start Angel locally:

1. Copy `.env.schema` values into `apps/whatsapp-agent/.env` and set `OPENROUTER_API_KEY`. The key is sensitive, so never commit it.
2. `pnpm dev:angel` from the repository root. It serves on `AGENT_PORT` (3104).
3. Link the WhatsApp number in one of two ways:
   - Set `WHATSAPP_PAIRING_NUMBER` (digits only, e.g. `263775101506`). The 8-character pairing code appears in the logs and at `GET /api/admin/whatsapp`. Enter it on the phone under *Linked devices → Link with phone number*.
   - Leave `WHATSAPP_PAIRING_NUMBER` empty and scan the QR code from the logs.
4. The session is saved under `WHATSAPP_AUTH_PATH`, so you only link once.
5. Optional settings:
   - Paynow: set `PAYNOW_INTEGRATION_ID`, `PAYNOW_INTEGRATION_KEY`, `PAYNOW_AUTH_EMAIL` and `PUBLIC_BASE_URL` (Angel's public address; Paynow posts to `<PUBLIC_BASE_URL>/api/paynow/result`).
   - Meta: set `META_DATASET_ID` and `META_CAPI_TOKEN`, plus `META_TEST_EVENT_CODE` while testing in Events Manager.

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
| `#delivered <number>` | The site is live; the balance is now due |
| `#balance <number> [wallet number]` | Send the Paynow request for the balance (defaults to the wallet that paid the deposit) |
| `#payments [number]` | Recent payments, or one lead's |
| `#won <number>` / `#lost <number>` | Close a deal by hand |
| `#stage <number> <stage>` | Set any stage |
| `#note <number> <text>` | Add a note |
| `#price` | The current offer and founding places left (a paid deposit takes a place) |
| `#ignored` | Contacts Angel stayed silent on |
| `#allow <number>` | Always let Angel reply to someone it ignored |

Replying by hand in a customer's chat also pauses Angel there for `HUMAN_TAKEOVER_HOURS`.

## CRM data

Everything is saved in `AGENT_DATA_DIR/crm.sqlite`, ready for a future in-house dashboard:

| Table | Contents |
| --- | --- |
| `customers` | One row per lead: profile, stock size, timing, stage, lead score and signals, the ad they came from, demo sent, opt-out, takeover |
| `payments` | Every Paynow deposit and balance request: amount, wallet, reference, Paynow status and when it was paid |
| `messages` | Every inbound message, Angel reply and owner reply, linked to its turn |
| `turns` | Every handled batch. Records the outcome (`replied`, `ignored`, `fallback`, `opted_out`, `human_active`, `rate_limited`, …), the Jev verdict, the model that answered, tokens, tools used, attempts, errors and latency. A turn left `in_progress` means the process died mid-turn. |
| `events` | Funnel log: stage changes, demo sent, score changes, objections, commercial signals, hand-offs, payment requests and results, Meta events |
| `ignored_contacts` / `ignored_messages` | Who was ignored and the full text of every ignored message |

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
| `POST /api/paynow/result` | Paynow's result URL (no token; the Paynow hash is checked) |
| `GET /api/admin/stats` | Funnel, turn and payment stats, raw plus `formatted` strings, and the offer |
| `GET /api/admin/payments?limit=` | Recent payments |
| `GET /api/admin/leads?stage=&limit=` | Leads |
| `GET /api/admin/leads.csv` | CSV export |
| `GET /api/admin/leads/:id` | Profile, events, messages, turns and payments |
| `GET /api/admin/turns?contact=&limit=` | Recent turns |
| `GET /api/admin/ignored`, `GET /api/admin/ignored/:id` | Ignored contacts and their messages |
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

To talk to Angel in the terminal without touching real leads:

```bash
pnpm --filter @where-they-are/whatsapp-agent chat
```

What each live check covers:

- `eval`: 26 sales scenarios from the script, including the full close to a paid deposit, a cancelled prompt, and a customer who claims to have paid. Paynow is faked; the model is real.
- `relevance-eval`: 30 reply-or-ignore cases in three difficulty levels.
- `media-check`: a voice note and a photo.

## Models

| Role | Model |
| --- | --- |
| Primary (`AGENT_MODEL`) | `google/gemini-3.8-flash`. It handles tool calling and listens to voice notes. Reasoning cannot be turned off; `AGENT_REASONING_EFFORT` defaults to `low`. |
| Fallback | Hard-coded to `google/gemini-3.5-flash` (`src/agent/angel.ts`). |
| Relevance | `~typesafe/jev-latest` via OpenRouter's decisions API. It costs about $0.00001 per decision and fails open, so errors always mean "reply". |
