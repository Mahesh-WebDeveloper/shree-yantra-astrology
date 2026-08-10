# Observability Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB (same instance as app)
- Backend, admin, mobile, and/or website repos checked out

---

## 1. Backend environment variables

Add to `backend/.env` (see `backend/.env.example`):

```env
OBS_SLOW_REQUEST_MS=1000
OBS_LOG_RETENTION_SEC=2592000
OBS_METRICS_RETENTION_SEC=1209600
OBS_LOG_PERSIST_LEVEL=info
LOG_LEVEL=info
LOG_FORMAT=json

# Optional — not wired in phase 1
SENTRY_DSN=
```

Restart the backend after changes. MongoDB TTL indexes on `ObservabilityLog` and `ApiRequestMetric` are created on first model load.

---

## 2. Verify middleware is active

Confirm `backend/src/app.js` includes:

```js
const requestContext = require('./middleware/requestContext');
app.use(requestContext);
```

Before route handlers. Every response should include `X-Request-Id` and `X-Trace-Id` headers.

---

## 3. Admin dashboard

1. Start admin: `cd admin && npm run dev`
2. Log in with admin credentials (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
3. Navigate to **Observability** in sidebar
4. Sections:
   - **Overview** — requests/errors/slow counts (1h)
   - **Error Center** — grouped backend 5xx/4xx fingerprints
   - **API Monitoring** — per-endpoint latency (24h)
   - **Live Logs** — searchable structured logs (polls every 10s)

Related pages:
- **Server Monitor** — VPS CPU/memory/disk
- **User Activity** — mobile product events, crashes, timelines
- **Analytics** — aggregated event stats

---

## 4. Mobile client headers

Implemented in `mobile/src/lib/correlation.ts` and merged in `mobile/src/lib/api.ts`:

| Header | Purpose |
|--------|---------|
| `X-Request-Id` | Per-request UUID |
| `X-Session-Id` | Persisted session (`sy.obs.sessionId`) |
| `X-Platform` | `ios` / `android` |
| `X-App-Version` | From `app.json` |
| `X-OS-Version` | Platform version |
| `X-Device-Brand` / `X-Device-Model` | Optional |

Rebuild mobile app after pulling changes.

---

## 5. Website client headers

Implemented in `website/src/lib/correlation.ts` → `website/src/lib/api.ts`:

| Header | Value |
|--------|-------|
| `X-Platform` | `web` |
| `X-App-Version` | `VITE_APP_VERSION` or `website` |
| `X-Session-Id` | `sessionStorage` (`sy.web.sessionId`) |

Optional: set `VITE_APP_VERSION` in `website/.env` for release tracking.

---

## 6. Regenerate API inventory

After route changes:

```bash
cd backend
node scripts/generate-api-inventory.mjs
```

Output: `docs/OBSERVABILITY-API-INVENTORY.md`

---

## 7. Run tests

```bash
cd backend
node --test src/lib/observability/redact.test.js
```

---

## 8. Production deployment

### Logs

- Set `LOG_FORMAT=json` and ship stdout to your host log agent (journald, Docker logging driver, CloudWatch, Promtail, etc.)
- MongoDB observability collections provide admin UI search; not a substitute for long-term centralized logs at very high volume

### Retention by environment

| Env | Suggested `OBS_LOG_RETENTION_SEC` | `OBS_METRICS_RETENTION_SEC` |
|-----|-----------------------------------|-----------------------------|
| development | 604800 (7d) | 259200 (3d) |
| staging | 1209600 (14d) | 604800 (7d) |
| production | 2592000 (30d) | 1209600 (14d) |

### Health check

```bash
curl -i http://localhost:4000/api/health
# Expect X-Request-Id header
```

Trigger a test 404 and confirm JSON includes `requestId`.

---

## 9. Optional: Sentry (phase 2)

1. Create Sentry project(s) for backend, mobile, website
2. Set `SENTRY_DSN` in each environment
3. Initialize with try/catch — app must start if Sentry fails

Not required for phase 1 observability.

---

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| No logs in admin | MongoDB connection; `OBS_LOG_PERSIST_LEVEL`; request volume |
| Missing request ID in errors | `requestContext` middleware order |
| Admin 401 on observability | Admin JWT; route uses `adminOnly` |
| Slow API warnings everywhere | Increase `OBS_SLOW_REQUEST_MS` or optimize hot routes |
| Logs contain secrets | Run redact tests; report bug — never disable redaction |

See [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) for operational playbooks.
