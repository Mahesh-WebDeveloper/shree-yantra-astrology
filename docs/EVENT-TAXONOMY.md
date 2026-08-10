# Event Taxonomy — Shree Yantra Observability

> Only events that **exist in code today** or are **emitted by the observability pipeline**. Do not add tracking without updating this document.

**Last updated:** 2026-08-10

---

## Schema (all product events)

Every analytics/observability event should include where applicable:

| Field | Source | Notes |
|-------|--------|-------|
| `event_name` | Required | snake_case, stable |
| `source` | Required | `mobile` \| `website` \| `backend` \| `admin` |
| `screen` / `route` | Client | Navigation route or API route |
| `user_id` | When authenticated | MongoDB ObjectId string |
| `session_id` | Client | Mobile: analytics session; also `X-Session-Id` header |
| `app_version` | Client | Expo version / `VITE_APP_VERSION` / backend N/A |
| `timestamp` | Server or client | ISO 8601 |
| `metadata` | Optional | **Safe fields only** — see [LOGGING-PRIVACY.md](./LOGGING-PRIVACY.md) |

Backend structured logs use the same `event_name` field plus `request_id`, `trace_id`, `level`, `duration_ms`, etc.

---

## Mobile product events (`POST /api/analytics/track`)

| event_name | screen | trigger | safe metadata |
|------------|--------|---------|---------------|
| `app_open` | — | App launch / nav ready | — |
| `screen_view` | route name | Every navigation change | `{ screen }` |
| `register` | PhoneAuth | OTP/Google signup success | `{ method: 'otp' \| 'google' }` |
| `login` | PhoneAuth | OTP/Google login success | `{ method }` |
| `search` | BirthPlaceField, BabyNames | Location/name search | `{ kind, q }` (truncated query) |
| `panchang_view` | Panchang | Panchang loaded | `{ city, gps }` (coarse) |
| `kundli_view` | Kundli | Chart screen opened | — |
| `kundli_match` | MatchScreen | Match run | — |
| `brihat_generate` | BrihatKundli | Report generated | — |
| `ai_ask` | AiAstrologer | User sends question | `{ q }` truncated |
| `ai_error` | AiAstrologer | AI failure | `{ q, error }` truncated |
| `occasion_view` | Occasion | Festival page | `{ id }` |
| `jaap_complete` | DevReader | Jaap target reached | `{ id, malas, target }` |
| `subscribe_success` | Payment | Razorpay success | `{ provider, status }` |
| `subscribe_failed` | Payment | Razorpay fail/cancel | `{ provider, cancelled }` |
| `app_crash` | ErrorBoundary | Uncaught render error | `{ message, componentStack }` truncated |
| `api_error` | api.ts | Non-OK HTTP response | `{ status, code, requestId }` |

**Consent:** Disabled when user opts out in Privacy (`sy.privacy` → `analytics: false`).

---

## Website events

| event_name | source | trigger | metadata |
|------------|--------|---------|----------|
| `app_download_click` | website (GA4) | Download CTA click | `{ source, platform }` |

No backend analytics batch on website yet. API errors are not centrally tracked client-side (future: mirror mobile `api_error`).

---

## Backend observability events (structured JSON logs)

| event_name | level | trigger |
|------------|-------|---------|
| `api.request.completed` | info | Request finished 2xx/3xx, under slow threshold |
| `api.request.slow` | warn | Duration ≥ `OBS_SLOW_REQUEST_MS` |
| `api.request.failed` | error/warn | HTTP ≥ 400 or `errorHandler` |
| `external_api.success` | info | Outbound HTTP success (`httpFetch`) |
| `external_api.failed` | warn | Outbound HTTP failure |

### Planned controller-level events (not yet wired everywhere)

| event_name | When |
|------------|------|
| `auth.login.success` / `auth.login.failed` | Auth controller |
| `otp.requested` / `otp.sent` / `otp.verified` / `otp.failed` | OTP flow |
| `kundli.generation.started` / `.completed` / `.failed` | Kundli controller |
| `database.query.slow` / `.failed` | Mongoose hooks (future) |

---

## Admin / operational events

| event_name | source | notes |
|------------|--------|-------|
| Error group upsert | backend | Implicit via `ObservabilityErrorGroup` — not a separate event stream |
| Incident status change | admin PATCH | `/admin/observability/errors/:fingerprint` |

---

## Naming conventions

- Use **snake_case**: `kundli_view`, not `KundliView`
- Use **past tense** for completed actions: `subscribe_success`, not `subscribe_start`
- Use **domain prefix** for backend: `api.*`, `external_api.*`, `auth.*`, `kundli.*`
- Never include OTP, tokens, passwords, or full birth payloads in metadata

---

## Cross-reference

- User journeys: [USER-JOURNEY-MAP.md](./USER-JOURNEY-MAP.md)
- Privacy rules: [LOGGING-PRIVACY.md](./LOGGING-PRIVACY.md)
- API surface: [OBSERVABILITY-API-INVENTORY.md](./OBSERVABILITY-API-INVENTORY.md)
