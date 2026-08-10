# Logging Privacy & Redaction Policy

**Applies to:** Backend structured logs, MongoDB observability collections, admin log explorer, client analytics metadata.

**Implementation:** `backend/src/lib/observability/redact.js`

---

## Never log (absolute blocklist)

These values are **always replaced with `[REDACTED]`** when the field key matches or value pattern matches:

| Category | Examples |
|----------|----------|
| Credentials | `password`, `otp`, `pin` |
| Tokens | `access_token`, `refresh_token`, `jwt`, `Authorization: Bearer …` |
| API secrets | `api_key`, `secret`, `razorpay` signature fields |
| Payment | Card numbers, CVV, full PAN |
| Headers | `Authorization`, `Cookie`, `X-Api-Key` |

**Rule:** If unsure, redact.

---

## Minimize / mask (allowed in transformed form)

| Data | Treatment | Example |
|------|-----------|---------|
| Phone numbers | Mask last 4 digits | `******3210` |
| Device IDs | Short hash (`hashShort`) | `h1a2b3c4` |
| Birth details | Boolean flags only via `safeBirthMeta()` | `{ hasDob: true, hasPlace: true, tz: "Asia/Kolkata" }` — no DOB string |
| User names | Avoid in backend logs unless debugging incident; prefer `user_id` |
| IP addresses | Not collected by default in phase 1; if added, store /24 or hash only with documented justification |
| AI prompts | Truncate to 200 chars in analytics; avoid full chat in server logs |
| Stack traces | Allowed in error logs (server-side only); truncated to 4000 chars |
| Request/response bodies | **Not logged by default**; whitelist specific safe fields only |

---

## What IS logged (safe fields)

### Every API request (metrics + structured log)

- `request_id`, `trace_id`, `span_id`
- HTTP `method`, `route`, `status_code`, `duration_ms`
- `user_id` (ObjectId string, when authenticated)
- `platform`, `app_version`, `os_version`, `device_brand`, `device_model` (from client headers)
- `session_id` (opaque client-generated ID, not PII)
- `error_code`, `error_name`, `stack` (errors only)
- External dependency names + durations (no payloads)

### Product analytics (mobile → MongoDB `AnalyticsEvent`)

- Event name, screen, truncated search queries
- Device/platform/version (no raw advertising IDs)
- Coarse GPS only when user grants location for panchang (`city`, `gps` object)

### Admin visibility

- Only users with **admin JWT** can query observability APIs
- Normal app users never receive log payloads

---

## Client responsibilities

| Client | File | Behavior |
|--------|------|----------|
| Mobile | `mobile/src/lib/correlation.ts` | Correlation headers only; no tokens in headers except standard `Authorization` (redacted server-side) |
| Mobile | `mobile/src/lib/analytics.ts` | Consent gate; no OTP/password in events |
| Website | `website/src/lib/correlation.ts` | Session + request IDs only |
| Website | `website/src/lib/api.ts` | Bearer token in header (redacted in logs) |

---

## Fail-safe

Redaction runs inside `logger.js` via `redactObject()` on all metadata before stdout and MongoDB persist. Redaction errors must not throw.

---

## Verification

Run redaction tests:

```bash
cd backend
node --test src/lib/observability/redact.test.js
```

Manual check: trigger auth + kundli request, search admin logs for `password`, `Bearer eyJ`, full phone — must find **zero** matches.

---

## GDPR / retention alignment

- Log TTL: `OBS_LOG_RETENTION_SEC` (default 30 days)
- Metrics TTL: `OBS_METRICS_RETENTION_SEC` (default 14 days)
- User deletion: existing admin user delete should be extended to purge/anonymize related logs (TODO — link to user delete job)

---

## Change process

Any new log field or analytics property must be reviewed against this document and added to [EVENT-TAXONOMY.md](./EVENT-TAXONOMY.md) if it is a product event.
