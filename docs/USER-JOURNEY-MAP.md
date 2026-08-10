# User Journey Map — Shree Yantra Astrology Ecosystem

> Based on actual routes/screens in **mobile**, **website**, **backend API**, and **admin**. No invented features.

**Last updated:** 2026-08-10

---

## Platform summary

| Platform | Entry | Auth | Primary navigation |
|----------|-------|------|-------------------|
| **Mobile** (Expo/RN) | `Splash` → onboarding | OTP + Google; JWT | Bottom tabs + stack + drawer |
| **Website** (Vite SPA) | `/` marketing home | OTP; JWT in localStorage | React Router lazy routes |
| **Admin** (Vite SPA) | `/login` | Admin JWT | Sidebar nav |
| **Backend** | `/api/*` | JWT / Admin JWT | Express routes |

---

## Journey 1 — First launch & authentication

### Mobile
```
Splash → LanguageSelect → PhoneAuth (OTP / Google)
  → Subscribe (if payments enabled & no plan)
  → BirthDetails (DOB, time, place)
  → Main tabs
```

**API calls:** `GET /api/auth/config`, `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`, `POST /api/auth/google`, `GET /api/auth/me`, `PUT /api/profile`, `POST /api/locations/resolve`

**Analytics:** `app_open`, `screen_view`, `register` / `login`

### Website
```
/ → /sign-in (OTP) → /onboarding/birth → feature route or /profile
```

**API calls:** Same auth/profile/location endpoints as mobile.

**Analytics:** GA4 `app_download_click` on home/app landing only (no full product funnel yet).

---

## Journey 2 — Home & daily astrology

### Mobile (`Home` tab)
- Personal rashifal shortcut → `DailyPrediction`
- Panchang shortcut → `Panchang`
- Services grid → stack screens

**API:** `POST /api/horoscope/personalized`, `POST /api/panchang`, `POST /api/ai/daily-prediction`

**Analytics:** `screen_view`, `panchang_view`

### Website
- `/` marketing → `/rashifal`, `/my-rashifal`, `/panchang`, `/choghadiya`
- Public birth form via `useBirthProfile` on many pages

**API:** Same panchang/choghadiya/horoscope endpoints.

---

## Journey 3 — Kundli & chart tools

### Mobile (`Kundli` tab + stack)
```
KundliScreen → KundliLearn / KundliExplore / ExampleKundli
  → BrihatKundli, Gochar, Remedies, VedicReading, LifeTimeline, TransitForecast
  → KundliMatch (Gun Milan)
```

**API:** `POST /api/kundli`, `/varga`, `/dasha`, `/yoga`, `/brihat-kundli`, `/gochar`, `/remedies`, `/vedic-reading`, `/life-timeline`, `/transit-forecast`, `/match`, `POST /api/ai/insights`

**Analytics:** `kundli_view`, `kundli_match`, `brihat_generate`

### Website
- `/kundli`, `/kundli-learn`, `/kundli-match`, `/brihat-kundli`, `/gochar`, `/life-timeline`, `/transit-forecast`, `/janam-patri`
- Premium routes gated by `RequireAuth` + birth profile

---

## Journey 4 — Rashifal (horoscope)

### Mobile
- `Predictions` (12 signs), `DailyPrediction` (personal)

**API:** `GET /api/horoscope`, `POST /api/horoscope/personalized`, `POST /api/ai/sign-rashifal`, `POST /api/ai/period-prediction`

### Website
- `/rashifal` (public), `/my-rashifal` (auth + birth)

---

## Journey 5 — Panchang, muhurat, choghadiya

### Mobile
- Tabs: `Choghadiya`; stack: `Panchang`, `Muhurat`, `MuhuratFinder`

**API:** `POST /api/panchang`, `/choghadiya`, `/sunrise`, `GET /api/muhurat/categories`, `POST /api/muhurat/find`, `POST /api/panchang/festivals`

**Analytics:** `panchang_view`

### Website
- `/panchang`, `/choghadiya`, `/muhurat`, `/muhurat/:categoryKey`

---

## Journey 6 — Numerology & Vastu

### Mobile
- `Numerology`, `Vastu`, `VastuLearn`

**API:** `POST /api/numerology/profile`, `/numerology/interpret`, `/numerology/check-number`, `POST /api/vastu/analyze`, `/vastu/ask`

### Website
- `/numerology`, `/vastu`, `/vastu-learn`

---

## Journey 7 — AI features

### Mobile
- `AiAstrologer` (chat), AI explain flows on Gita/Ramayan/Veda readers, occasion guides

**API:** `POST /api/ai/ask-astrologer`, `/ai/gita-explain`, `/ai/ramayan-explain`, etc.; `GET/DELETE /api/chat/history`

**Analytics:** `ai_ask`, `ai_error`

### Website
- `/ai-astrologer`, `/baby-names`, `/remedies`, `/vedic-reading` (auth gated)

---

## Journey 8 — Sacred library & devotional content

### Mobile (`Library` tab)
```
Gita, Ramayan, Ramcharitmanas, Rigveda, Veda, HanumanChalisa
AartiSangrah, MantraSangrah, StotraSangrah
DailyShloka, Occasion, DevReader (jaap), MediaPlayer
```

**API:** Content GET routes under `/api/gita`, `/ramayan`, `/media`, `/library`, `/daily-shloka`, AI explain endpoints

**Analytics:** `occasion_view`, `jaap_complete`

### Website
- `/library`, `/gita/*`, `/ramayan/*`, `/aarti-sangrah`, `/mantra-sangrah`, `/stotra-sangrah`, `/vedas/*`, `/daily-shloka`, `/occasions/*`, `/audio/*`

---

## Journey 9 — Profile, settings, notifications

### Mobile (`Profile` tab)
```
EditProfile, PrivacySecurity, Notifications, Help, Legal
ManageSubscription, BillingOptions, SetPassword
```

**API:** `GET/PUT /api/profile`, `/api/notifications/*`, `/api/payments/*`, `GET/PUT /api/me/data`

### Website
- `/profile`, `/notifications`, `/privacy-security`, `/help`, `/plans`

---

## Journey 10 — Subscription & payments

### Mobile only (Razorpay)
```
Subscribe → Payment → SubscriptionActivated
402 handler → reset to Subscribe
```

**API:** `GET /api/payments/config`, `POST /api/payments/subscriptions`, `/verify`, `GET /api/payments/subscription`, `POST /cancel`

**Analytics:** `subscribe_success`, `subscribe_failed`

### Website
- `/plans` — view plans; payment completes in mobile app

---

## Journey 11 — Download / marketing

### Website only
```
/ → DownloadCta (Play Store / APK)
/app → App landing page
/shree-yantra → Guide pillar page
```

**Analytics:** GA4 `app_download_click`

---

## Journey 12 — Admin operations

### Admin dashboard
```
/login → Dashboard
  → Observability (errors, API stats, logs)
  → Server Monitor (VPS metrics)
  → User Activity (sessions, issues, timelines)
  → Analytics (product events)
  → Users, Library, Media, Plans, Subscriptions, Notifications, FAQ, Settings, AI Cache
```

**API:** All `/api/admin/*` routes (admin JWT required)

---

## Correlation across journeys

Every client API call should send:
- `X-Request-Id` (per request)
- `X-Session-Id` (per app/browser session)
- `X-Platform`, `X-App-Version`, device headers (mobile)

Backend responds with `X-Request-Id` and `X-Trace-Id`. Errors include `requestId` in JSON body.

Use **Admin → Observability → Live Logs** or **Trace by request ID** to reconstruct a user journey server-side. Use **User Activity** for client-side product events and crashes.

---

## Features explicitly NOT present

- Redis caching layer
- SMS OTP provider (dev console only)
- Website-native payment checkout
- Full OpenTelemetry distributed tracing (phase 1 uses request IDs + MongoDB logs)
- Screen-level error boundaries on mobile (single app-root boundary only)
