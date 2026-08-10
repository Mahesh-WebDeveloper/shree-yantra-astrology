# Observability API Inventory

> Auto-generated from `backend/src/routes/index.js`. Regenerate: `node backend/scripts/generate-api-inventory.mjs`

**Total endpoints:** 168  
**Base path:** `/api`  
**Database:** MongoDB (Mongoose) — no Redis in this project  
**Generated:** 2026-08-10

## Legend

| Column | Meaning |
|--------|---------|
| METHOD | HTTP verb |
| ROUTE | Full API path |
| CONTROLLER | Express controller module |
| AUTH | JWT / Admin / Optional |
| USER DATA | Categories of PII touched (never logged in full) |
| EXTERNAL | Third-party dependencies |
| DB | MongoDB collections accessed |
| STATUS | Typical HTTP outcomes |
| ERRORS | Common failure modes |

---


## Health & Settings (5)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/health` | health.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/settings` | settings.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/settings` | settings.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/settings/auth-methods` | settings.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/settings/ai-provider` | settings.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Authentication (10)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| PATCH | `/api/settings/auth-methods` | settings.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/auth/config` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/register` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/login` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/request-otp` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/verify-otp` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/google` | auth.controller | No | PII: phone, name, birth profile | None | Optional MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/auth/me` | auth.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/logout` | auth.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/auth/set-password` | auth.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Payments (6)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/payments/config` | payment.controller | Yes (JWT) | user_id from token | Razorpay | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/payments/subscriptions` | payment.controller | Yes (JWT) | user_id from token | Razorpay | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/payments/subscriptions/verify` | payment.controller | Yes (JWT) | user_id from token | Razorpay | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/payments/subscription` | payment.controller | Yes (JWT) | user_id from token | Razorpay | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/payments/subscription/cancel` | payment.controller | Yes (JWT) | user_id from token | Razorpay | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/payments/transactions` | subscriptionsCtrl.listTransactions | Yes (Admin JWT) | user_id from token | Razorpay | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Profile (5)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/profile` | profile.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/profile` | profile.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/profile/avatar` | profile.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/profile/avatar` | profile.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/numerology/profile` | numerology.controller | No | Birth data (DOB, TOB, place) | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Public Content (55)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/library` | library.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/library/:id` | library.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/media` | media.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/plans` | plans.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/app-config` | appConfig.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/faq` | faq.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/screens` | screens.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/screens/:page` | screens.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/gita` | gitaCtrl.list | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/gita/:chapter` | gitaCtrl.getChapter | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/ramayan` | ramayanCtrl.kandas | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/ramayan/:kanda` | ramayanCtrl.sargas | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/ramayan/:kanda/:sarga` | ramayanCtrl.getSarga | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/ramcharitmanas` | rcmCtrl.kandas | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/ramcharitmanas/:kanda` | rcmCtrl.getKanda | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/rigveda` | rigvedaCtrl.mandalas | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/rigveda/:mandala` | rigvedaCtrl.suktas | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/rigveda/:mandala/:sukta` | rigvedaCtrl.getSukta | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/veda/:veda` | vedaCtrl.books | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/veda/:veda/:book` | vedaCtrl.sections | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/veda/:veda/:book/:section` | vedaCtrl.getSection | No | None | None | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/daily-shloka` | dailyCtrl.today | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library/overview` | libraryCtrl.adminOverview | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library` | libraryCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/library` | libraryCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/library/reorder` | libraryCtrl.reorder | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library/:id` | libraryCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/library/:id` | libraryCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/library/:id` | libraryCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media` | mediaCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/media` | mediaCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/media/reorder` | mediaCtrl.reorder | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media/youtube/search` | mediaCtrl.youtubeSearch | Yes (Admin JWT) | user_id from token | YouTube Data API | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media/:id` | mediaCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/media/:id` | mediaCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/media/:id` | mediaCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/plans` | plansCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/plans` | plansCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/plans/:id` | plansCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/plans/:id` | plansCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/plans/:id` | plansCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/app-config` | appConfigCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/admin/app-config` | appConfigCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/faq` | faqCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/faq` | faqCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/faq/:id` | faqCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/faq/:id` | faqCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/faq/:id` | faqCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/screens` | screensCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/screens/:page` | screensCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/admin/screens/:page` | screensCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/gita-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/ramayan-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/rigveda-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/daily-shloka-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Notifications (12)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/notifications` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/notifications/unread-count` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/notifications/register-token` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/notifications/read-all` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/notifications/:id/read` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/notifications/:id` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/notifications` | notifications.controller | Yes (JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/notifications` | notificationsCtrl.adminList | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/notifications` | notificationsCtrl.create | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/notifications/:id` | notificationsCtrl.update | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/notifications/:id/send` | notificationsCtrl.send | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/notifications/:id` | notificationsCtrl.remove | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Analytics (2)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| POST | `/api/analytics/track` | analytics.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/analytics` | analyticsCtrl.stats | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Locations (2)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/locations/search` | location.controller | No | None | Google Places / geo resolution | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/locations/resolve` | location.controller | No | None | Google Places / geo resolution | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Astrology Core (25)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| POST | `/api/kundli` | kundli.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/varga` | varga.controller | No | None | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/dasha` | dasha.controller | No | None | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/yoga` | yoga.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/choghadiya` | choghadiya.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/sunrise` | sunrise.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/panchang` | panchang.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/panchang/observances` | panchang.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/panchang/festivals` | panchang.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/panchang/festival-search` | panchang.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/panchang/festival-detail` | panchang.controller | No | Birth data (DOB, TOB, place) | VedAstro API + local ephemeris fallback | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/muhurat/categories` | muhurat.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/muhurat/find` | muhurat.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/match` | match.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/gochar` | gochar.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/remedies` | remedies.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/numerology/profile` | numerology.controller | No | Birth data (DOB, TOB, place) | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/numerology/interpret` | numerology.controller | No | Birth data (DOB, TOB, place) | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/numerology/check-number` | numerology.controller | No | Birth data (DOB, TOB, place) | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/horoscope` | horoscope.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/horoscope/personalized` | horoscope.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/vastu/analyze` | vastu.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/vastu/ask` | vastu.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/choghadiya-message` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/muhurat` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## AI & Premium (23)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| POST | `/api/vedic-reading` | reading.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/name-suggestions` | reading.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/life-timeline` | lifeTimeline.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/transit-forecast` | transitForecast.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/brihat-kundli` | brihatKundli.controller | No | None | None | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/daily-prediction` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/period-prediction` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/sign-rashifal` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/baby-names` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/name-ask` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/ask-astrologer` | ai.controller | Optional JWT | user_id from token | Gemini / Groq / OpenRouter / ofox.ai | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/insights` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/choghadiya-message` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/muhurat` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/rcm-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/gita-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/ramayan-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/rigveda-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/veda-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | MongoDB (content) | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/daily-shloka-explain` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/occasion-guide` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/occasion-ask` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/ai/explain-simple` | ai.controller | No | None | Gemini / Groq / OpenRouter / ofox.ai | Optional MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## User Data & Chat (4)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| GET | `/api/me/data` | userData.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/me/data` | userData.controller | Yes (JWT) | PII: phone, name, birth profile | None | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/chat/history` | ai.controller | Yes (JWT) | user_id from token | Gemini / Groq / OpenRouter / ofox.ai | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/chat/history` | ai.controller | Yes (JWT) | user_id from token | Gemini / Groq / OpenRouter / ofox.ai | MongoDB | 200 / 400 / 500 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |

## Admin (63)

| METHOD | ROUTE | CONTROLLER | AUTH | USER DATA | EXTERNAL | DB | STATUS | ERRORS |
|--------|-------|------------|------|-----------|----------|----|--------|--------|
| POST | `/api/admin/login` | adminCtrl.login | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 400 / 401 / 429 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/stats` | adminCtrl.stats | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/uploads/image` | adminCtrl.uploadImage | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/users` | adminCtrl.listUsers | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/users/:id` | adminCtrl.getUser | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/users/:id` | adminCtrl.updateUser | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/users/:id` | adminCtrl.deleteUser | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/users/bulk-delete` | adminCtrl.bulkDeleteUsers | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library/overview` | libraryCtrl.adminOverview | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library` | libraryCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/library` | libraryCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/library/reorder` | libraryCtrl.reorder | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/library/:id` | libraryCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/library/:id` | libraryCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/library/:id` | libraryCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media` | mediaCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/media` | mediaCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/media/reorder` | mediaCtrl.reorder | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media/youtube/search` | mediaCtrl.youtubeSearch | Yes (Admin JWT) | user_id from token | YouTube Data API | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/media/:id` | mediaCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/media/:id` | mediaCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/media/:id` | mediaCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/plans` | plansCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/plans` | plansCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/plans/:id` | plansCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/plans/:id` | plansCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/plans/:id` | plansCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/notifications` | notificationsCtrl.adminList | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/notifications` | notificationsCtrl.create | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/notifications/:id` | notificationsCtrl.update | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/notifications/:id/send` | notificationsCtrl.send | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/notifications/:id` | notificationsCtrl.remove | Yes (Admin JWT) | user_id from token | FCM push (Expo) | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/app-config` | appConfigCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/admin/app-config` | appConfigCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/faq` | faqCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| POST | `/api/admin/faq` | faqCtrl.create | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/faq/:id` | faqCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/faq/:id` | faqCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/faq/:id` | faqCtrl.remove | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/ai-cache` | adminCtrl.listAiCache | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| DELETE | `/api/admin/ai-cache/:id` | adminCtrl.deleteAiCache | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/analytics` | analyticsCtrl.stats | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/overview` | analyticsCtrl.activityOverview | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/users` | analyticsCtrl.activityUsers | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/user/:id` | analyticsCtrl.activityUser | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/user/:id/ai-chat` | analyticsCtrl.activityUserAiChat | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/issues` | analyticsCtrl.activityIssues | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/activity/live` | analyticsCtrl.activityLive | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/server-monitor` | serverMetrics.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/overview` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/errors` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/errors/:fingerprint` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PATCH | `/api/admin/observability/errors/:fingerprint` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/api-stats` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/logs` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/observability/trace/:requestId` | observability.controller | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/subscriptions/overview` | subscriptionsCtrl.overview | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/subscriptions` | subscriptionsCtrl.list | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/subscriptions/:userId` | subscriptionsCtrl.detail | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/payments/transactions` | subscriptionsCtrl.listTransactions | Yes (Admin JWT) | user_id from token | Razorpay | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/screens` | screensCtrl.adminList | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| GET | `/api/admin/screens/:page` | screensCtrl.adminGet | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
| PUT | `/api/admin/screens/:page` | screensCtrl.update | Yes (Admin JWT) | user_id from token | None | MongoDB | 200 / 401 / 403 / 404 | Validation 400; Auth 401/403; Rate limit 429; Provider 502/503; Server 500 |
