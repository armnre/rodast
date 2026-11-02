# Ro Dast — Deployment & Operations

## Secrets (Settings → Secrets; never in git)
| Name | Purpose |
|---|---|
| `ZITE_AI_API_KEY` | NaraRouter API key (server-only) |

Non-secret AI config (base URL, model, timeout, retries, replies per request) lives in the **System Settings** table and is editable in `/admin → تنظیمات`. Defaults: `https://router.bynara.id/v1`, `gpt-4o-mini`, 30s, 1 retry, 3 replies.

## Auth
Email one-time code (platform-managed: expiry, attempt limits, resend limits, secure sessions). No SMS provider is connected yet; phone OTP needs an Iranian SMS provider (e.g. Kavenegar) and is a future adapter.

## Making an admin
Sign up in the app, then in the database open **Profiles**, find your row, tick **Is Admin**. `/admin` and every `admin*` endpoint check this server-side.

## Credit engine (server-side only — `src/server/`)
- `rules.ts` – pure rules (initial grant, pending referrals, 24h refill). Tests: `node --experimental-strip-types apps/app/tests/rules.test.ts`
- `credits.ts` – ledger. Every balance change writes a **Credit Transactions** row with a unique idempotency key (`init:`, `use:<request>`, `ref:<referral>`, `refill:<user>:<lastSuccessAt>`, `admin:`). Duplicate keys are detected and reverted.
- Concurrency: one in-flight AI request per user + client idempotency keys (retries never double-charge). The database API has no row locks, so this is application-level protection.
- Failed AI calls never charge; a credit is spent only after a valid reply set is parsed.

## Health
`health` endpoint → `{ ok, db, ai }`.

## PWA
Enable under **Settings → Mobile** (icon, title), then publish. The platform serves the manifest, icons and meta tags. The app ships an install prompt (Android `beforeinstallprompt`, iOS Add-to-Home-Screen guidance) and an offline banner. Generation is blocked offline, and no personal API data is cached.

## Backups
Use Database → Backups (point-in-time restore). Schema changes are additive only.
