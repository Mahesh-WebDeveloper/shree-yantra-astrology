# Observability Architecture — Shree Yantra

**Version:** 1.0 (Phase 1)  
**Date:** 2026-08-10

---

## Design principles

1. **Smallest reliable stack** — extend existing MongoDB + admin tooling before adding vendors.
2. **Fail-safe logging** — observability failure must never break API responses.
3. **Privacy by default** — centralized redaction; no secrets in logs.
4. **End-to-end correlation** — `request_id` from client through backend to admin trace view.
5. **No Redis** — project does not use Redis; do not add for observability alone.

---

## Recommended stack (implemented / planned)

| Layer | Tool | Status |
|-------|------|--------|
| **Structured logs** | Custom JSON logger → stdout + MongoDB (`ObservabilityLog`) | ✅ Implemented |
| **API metrics** | Per-request documents (`ApiRequestMetric`) + aggregation | ✅ Implemented |
| **Error grouping** | Fingerprint hash → `ObservabilityErrorGroup` | ✅ Implemented |
| **Product analytics** | Existing `POST /api/analytics/track` + admin Activity | ✅ Existing |
| **Server metrics** | Existing `GET /api/admin/server-monitor` | ✅ Existing |
| **Client correlation** | `X-Request-Id`, `X-Session-Id`, platform headers | ✅ Mobile + Website |
| **Admin hub** | `/admin/observability/*` + Observability page | ✅ Implemented |
| **Crash monitoring** | Optional Sentry (`SENTRY_DSN`) | ⏳ Env documented, not wired |
| **Distributed tracing** | OpenTelemetry | ⏸ Deferred (request IDs sufficient for phase 1) |
| **Log sink (Loki/ELK)** | stdout JSON → host agent | 📋 Deploy-time choice |

---

## Architecture diagram

```mermaid
flowchart TB
  subgraph clients [Clients]
    M[Mobile App]
    W[Website]
    A[Admin Dashboard]
  end

  subgraph correlation [Correlation Headers]
    RID[X-Request-Id]
    SID[X-Session-Id]
    PLAT[X-Platform / App-Version]
  end

  subgraph backend [Backend Express]
    RC[requestContext middleware]
    RT[Routes / Controllers]
    SVC[Services]
    EH[errorHandler]
    LOG[Structured Logger]
    OBS[observability.service]
  end

  subgraph mongo [MongoDB]
    OL[ObservabilityLog]
    AM[ApiRequestMetric]
    EG[ObservabilityErrorGroup]
    AE[AnalyticsEvent]
  end

  M --> correlation
  W --> correlation
  correlation --> RC
  RC --> RT --> SVC
  RT --> EH
  RC --> OBS
  EH --> OBS
  SVC --> LOG
  OBS --> LOG
  LOG --> stdout[(stdout JSON)]
  LOG --> OL
  OBS --> AM
  OBS --> EG

  M -->|analytics events| AE
  W -->|GA4 optional| GA[Google Analytics]

  A -->|Admin JWT| OBSAPI[/admin/observability/*]
  OBSAPI --> OL
  OBSAPI --> AM
  OBSAPI --> EG
  A --> Activity[/admin/activity/*]
  Activity --> AE
```

---

## Request lifecycle

1. **Client** generates `X-Request-Id`, attaches session/platform headers in `api.ts` / `correlation.ts`.
2. **`requestContext` middleware** reads or creates IDs, sets response headers, wraps request in AsyncLocalStorage.
3. **Controller/service** runs; external calls via `httpFetch.js` record duration in context.
4. **`res.on('finish')`** → `recordApiRequest()` logs `api.request.completed|slow|failed` and writes metric.
5. **Uncaught errors** → `errorHandler` → `recordError()` → grouped fingerprint + log entry; JSON response includes `requestId`.
6. **Admin** queries logs/metrics/errors by time, route, user, request ID.

---

## Log event taxonomy (backend)

| Event | Level | When |
|-------|-------|------|
| `api.request.completed` | info | 2xx/3xx under slow threshold |
| `api.request.slow` | warn | Duration ≥ `OBS_SLOW_REQUEST_MS` |
| `api.request.failed` | error/warn | HTTP ≥ 400 or thrown error |
| `external_api.success` | info | Outbound HTTP OK |
| `external_api.failed` | warn | Outbound HTTP fail/timeout |

Auth/OTP/kundli-specific events can be added incrementally at controller level without changing the pipeline.

---

## Data retention

| Collection | TTL env | Default |
|------------|---------|---------|
| `ObservabilityLog` | `OBS_LOG_RETENTION_SEC` | 30 days |
| `ApiRequestMetric` | `OBS_METRICS_RETENTION_SEC` | 14 days |
| `ObservabilityErrorGroup` | Manual / incident workflow | Until resolved + archive policy |
| `AnalyticsEvent` | Existing app config | Per existing analytics |

---

## Performance safeguards

- Async batched MongoDB inserts (250ms flush, max queue 500)
- Log level gating (`LOG_LEVEL`, `OBS_LOG_PERSIST_LEVEL`)
- Metrics written fire-and-forget (`.catch(() => {})`)
- No synchronous external log shipping on hot path
- Optional sampling can be added via env without schema changes

---

## Security & access control

- All `/api/admin/observability/*` routes require **admin JWT** (`adminOnly` middleware)
- Fine-grained RBAC permissions (`observability.view`, etc.) documented for future; currently binary admin gate
- Logs never exposed to normal app users
- PII redaction in `backend/src/lib/observability/redact.js`

---

## Phase 2 recommendations

1. Wire **Sentry** behind `SENTRY_DSN` for mobile + backend (optional, fail-safe init).
2. Add **alert webhooks** (Slack/email) on error spike aggregation cron.
3. **OpenTelemetry** if multi-service split (separate worker, CDN edge).
4. **Log shipper** (Promtail → Loki, or CloudWatch) for long-term search outside MongoDB.
5. Expand admin UI: error detail drawer, incident notes, deployment markers.

See also: [OBSERVABILITY-SETUP.md](./OBSERVABILITY-SETUP.md), [LOGGING-PRIVACY.md](./LOGGING-PRIVACY.md), [EVENT-TAXONOMY.md](./EVENT-TAXONOMY.md).
