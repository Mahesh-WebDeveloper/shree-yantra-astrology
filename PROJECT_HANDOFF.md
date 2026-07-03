# Shree Yantra — Project Handoff & Full Reference

> Complete handoff so another developer / AI tool can pick this project up. No secret
> values are included here — only their variable names and where they live.
> Generated 2026-07-03.

---

## 1. What this project is

**Shree Yantra** is a premium **Vedic astrology + spiritual super-app** for Indian users
(bilingual **Hindi + English**). It is a paid product, so the bar is: **100% accurate,
deterministic calculations — NO hardcoding for astrology; AI is used ONLY for phrasing /
interpretation, never to compute a number, degree, date or placement.**

Three parts in one repo:

| Part | Folder | Stack | Purpose |
|------|--------|-------|---------|
| **Mobile app** | `mobile/` | React Native + **Expo SDK 55**, TypeScript | The end-user app (Android APK) |
| **Backend API** | `backend/` | Node.js + Express + MongoDB (Mongoose) | All calculations + AI orchestration |
| **Admin panel** | `admin/` | React + Vite | Dashboard (content, users, settings, AI provider toggle) |

**Core principle everywhere:** `User form → deterministic engine (real math/rules) →
JSON → AI only rewrites it in simple Hindi/English`. The astronomy uses the local
`astronomy-engine` npm package with **Lahiri ayanamsa** (sidereal). Numerology, Vastu and
the house-plan blueprint are **pure local rules/maths** (no external API, no DB for
those). AI never invents a value.

---

## 2. Tech stack & key versions

**Mobile** (`mobile/package.json`)
- expo `^55.0.26`, react-native `0.83.6`, react 19
- Navigation: `@react-navigation/*` (native-stack + drawer + bottom-tabs)
- SVG: `react-native-svg` · Charts, blueprints, icons are hand-drawn SVG
- `expo-sensors` (magnetometer — Vastu compass), `expo-print` (PDF), `expo-sharing`,
  `expo-file-system`, `expo-haptics`, `expo-speech`, `expo-linear-gradient`,
  `@react-native-community/datetimepicker`, `expo-image-picker`, `expo-audio`
- Fonts: Cinzel, Playfair Display, Inter, Cormorant, Noto Sans Devanagari
- Google Sign-In: `@react-native-google-signin/google-signin`

**Backend** (`backend/package.json`, entry `server.js`)
- express, mongoose, jsonwebtoken, bcryptjs, cors, helmet, morgan, express-rate-limit,
  multer, dotenv, geoip-lite
- **astronomy-engine** — the local ephemeris (planets, ascendant, houses)
- No paid astrology API required (there is an optional VedAstro toggle in env)

---

## 3. Directory map (important paths)

```
backend/src/
  app.js                     Express app (helmet, cors, rate-limit, routes mount at /api)
  server.js                  (repo root of backend) boot + Mongo connect
  routes/index.js            ALL routes in one file
  controllers/               one per feature (kundli, muhurat, numerology, vastu, ai, ...)
  services/                  the deterministic engines + AI:
     vedastro.service.js     ← astronomy-engine wrapper: getPanchang, getKundli, getDasha
     ai.service.js           ← AI orchestration (provider fallback chain, writeIn(), caching)
     muhurat.service.js      ← Shubh Muhurat 0-100 scoring engine
     numerology.service.js   ← Chaldean numerology (+ numerology.test.js, 39 assertions)
     vastu.service.js        ← Vastu rules engine (deterministic) + AI Q&A
     match.service.js        ← Ashtakoot 36-guna matching
     brihatKundli / reading / remedies / lifeTimeline / transitForecast / varga / festival / horoscope / location
  data/                      rule tables & datasets (muhuratRules.js, vastuRules.js, ...)
  models/                    Mongoose schemas (User, Settings, AiCache, Library, ...)
  middleware/                auth, admin, asyncHandler, upload, rate-limit helpers
  scripts/                   seed/import scripts (see package.json scripts)

mobile/src/
  screens/                   62 screens (VastuScreen, VastuBlueprintScreen, NumerologyScreen,
                             MuhuratFinderScreen, KundliExploreScreen, AiAstrologerScreen, ...)
  components/                BlueprintCanvas, BlueprintViewer, VastuCompass, VedicChart,
                             LearnKundliChart, MuhuratCalendar, GoldButton, GoldDatePicker, ...
  lib/                       api.ts (ALL API client calls + timeouts), vastuBlueprint.ts
                             (house-plan layout engine), useAutoScroll.ts, haptics, birth, ...
  data/                      client-side content (muhuratCategories, kundliBhava, kundliLearn, ...)
  navigation/                RootNavigator.tsx (register screens here), DrawerContent.tsx
  i18n/                      strings.ts (en/hi), LanguageProvider (useLang, useT)
  theme/                     tokens.ts (gold/dark theme), ThemeProvider
```

---

## 4. Environment variables (names only — set real values in `backend/.env`)

```
# Core
PORT, NODE_ENV, MONGO_URI, JWT_SECRET, CORS_ORIGINS, ADMIN_ORIGIN

# Admin bootstrap
ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD

# AI providers (fallback chain: primary → Groq → OpenRouter → ofox)
AI_PROVIDER              # 'gemini' | 'claude' (DB Settings can override at runtime)
GEMINI_API_KEY / GEMINI_API_KEYS (multi-key)  / GEMINI_MODEL
ANTHROPIC_API_KEY
GROQ_API_KEY / GROQ_MODEL / GROQ_FALLBACK_MODELS
OPENROUTER_API_KEY / OPENROUTER_API_KEYS / OPENROUTER_MODEL / OPENROUTER_FALLBACK_MODELS
OFOX_API_KEY / OFOX_MODEL / OFOX_FALLBACK_MODELS

# Astrology data source (optional; local astronomy-engine is default)
VEDASTRO_API_KEY, VEDASTRO_AYANAMSA, VEDASTRO_TIER

# Location / maps
GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ENABLED, PHOTON_ENABLED, PHOTON_URL, LOCATION_DEFAULT_COUNTRY
GOOGLE_CLIENT_ID        # Google Sign-In (also needs SHA-1 in Google console)
YOUTUBE_API_KEY, YOUTUBE_REGION_CODE
```

**Mobile API base** (`mobile/src/lib/api.ts`):
- Dev: `DEV_API = 'http://192.168.0.234:4000'` (a LAN IP — used only when `__DEV__`).
- Prod: `EXPO_PUBLIC_API_URL` env (https) baked into the build.
- Live backend server used in this project: `http://168.144.185.66:4000`.

---

## 5. Local development — run commands

**Backend**
```bash
cd backend
npm install
# create backend/.env with the vars above (at minimum MONGO_URI, JWT_SECRET, one AI key)
npm run dev            # nodemon server.js  (or: npm start → node server.js)
# health check: GET http://localhost:4000/api/health
# seed admin/content if needed: npm run seed:admin  /  npm run seed:content  /  npm run seed:screens
```

**Mobile (Expo — live preview)**
```bash
cd mobile
npm install
# point the app at your backend: set EXPO_PUBLIC_API_URL or edit DEV_API for LAN
npx expo start        # scan QR with Expo Go / dev-client (SDK 55)
npx tsc --noEmit      # type-check (run this before every build)
```

**Admin**
```bash
cd admin
npm install
npm run dev           # Vite dev server
```

---

## 6. ⭐ Building the release APK (the exact recipe used)

This project builds the Android APK **locally with Gradle + JDK 17** using a separate
build copy at `C:\m` (Windows). The steps (adapt paths to your machine):

```powershell
# 1. Type-check first
cd mobile ; npx tsc --noEmit

# 2. Sync source into the build copy C:\m  (keeps native android/ project intact)
#    (native deps like expo-sensors must also be `npm install`-ed inside C:\m once)
robocopy "<repo>\mobile\src" "C:\m\src" /E /R:1 /W:1 /MT:16
Copy-Item "<repo>\mobile\.env"    "C:\m\.env" -Force
Copy-Item "<repo>\mobile\app.json" "C:\m\app.json" -Force
# if assets changed: robocopy "<repo>\mobile\assets" "C:\m\assets" /E

# 3. Build with JDK 17 (NOT the daemon — kill stray java first to avoid lock conflicts)
Get-Process java,node -EA SilentlyContinue | Stop-Process -Force
$env:JAVA_HOME='A:\android-build\jdk17\jdk-17.0.19+10'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd C:\m\android
.\gradlew.bat assembleRelease --no-daemon

# 4. Output APK
#    C:\m\android\app\build\outputs\apk\release\app-release.apk   (~48 MB)
#    copy it out to A:\android-build\shree-yantra-<name>.apk
```

**Gotchas learned this session**
- The Metro JS bundle step (`createBundleReleaseJsAndAssets`) sometimes crashes with exit
  `-1073740791` (Windows stack-overrun) — it is **transient**; kill java/node, delete
  `C:\m\android\app\build\generated\assets\react` and retry.
- Stray/duplicate `java` processes cause gradle lock conflicts → always `Stop-Process`
  java before building.
- After adding a **native module** (e.g. `expo-sensors`), run `npm install <pkg>` inside
  **both** `mobile/` and the build copy `C:\m/` before building.
- Build APK **only when the user explicitly asks.**

---

## 7. Deploying the backend to the live VPS

Live server: `root@168.144.185.66`, backend at `/opt/shree-backend`, run by **pm2** as
`shree-backend`, plain Node on port 4000 (no nginx/proxy). SSH key: a private key file on
the dev machine (not in repo).

**Surgical file deploy (what was used all session):**
```bash
KEY="<path-to-ssh-key>"
B="/opt/shree-backend/src"
# 1. backup on server
ssh -i "$KEY" root@168.144.185.66 "cp $B/services/X.js $B/services/X.js.bak-$(date +%H%M%S)"
# 2. push (strip CR so Windows line-endings don't break node)
tr -d '\r' < backend/src/services/X.js > /tmp/dep.js
scp -i "$KEY" /tmp/dep.js root@168.144.185.66:$B/services/X.js
# 3. syntax-check + restart + verify
ssh -i "$KEY" root@168.144.185.66 "node -c $B/services/X.js && pm2 restart shree-backend --update-env && pm2 status shree-backend | grep online"
# 4. health: curl http://168.144.185.66:4000/api/health
```
**No DB seeding is needed for Numerology or Vastu** — both are config/rules-driven, not
stored in Mongo. (Library/scripture content DOES seed via the `backend` npm `seed:*`
scripts.)

---

## 8. AI layer — how it works (important)

`backend/src/services/ai.service.js`:
- `callAI(prompt, {json})` runs a **provider fallback chain**: primary (Gemini multi-key
  or Claude) → **Groq** (fast) → **OpenRouter** (free models) → **ofox**. Each layer has a
  circuit-breaker/cooldown and only steps down on quota/5xx/down errors.
- `cached(key, type, producer)` caches AI output in the `AiCache` Mongo collection.
  **`PROMPT_VERSION`** (currently `sx8`) prefixes every cache key — **bump it to refresh
  ALL cached AI text** after changing prompts.
- `writeIn(lang)` is appended to every prompt: forces **pure Devanagari Hindi** or **pure
  English — NO Hinglish** + a "explain every technical term simply with an example"
  directive (SIMPLIFY_HI/EN).
- The AI astrologer (`askAstrologer`) is fed a **REAL ASTRO CONTEXT JSON** (kundli, dasha,
  gochar, Sade Sati, numerology, vargas) and is told to use ONLY those numbers.
- **Client timeout for AI/heavy endpoints is 120s** (`mobile/src/lib/api.ts` →
  `timeoutForPath`), because generation with fallback can take 30–90s. A shorter timeout
  caused false "network error" then instant-on-retry (server had cached the result).

---

## 9. Feature areas (what exists)

- **Kundli / Birth chart** (D1 + 16 vargas), **Brihat Kundli** report, **Dasha**, **Yoga**,
  **Panchang** (live current tithi + auto-refresh), **Choghadiya**, **Gochar/transits +
  Sade Sati**, **Kundli Milan (Ashtakoot 36-guna)**, **Remedies**, **Life Timeline**,
  **Year/Transit Forecast**, **Daily/Weekly/Monthly/Yearly Rashifal**, **AI Astrologer**
  (grounded chat), **Baby names**, **Janam Patri + PDF**.
- **Shubh Muhurat finder** — deterministic 0-100 score from tithi/vaar/nakshatra/yoga/
  karana + Chandrabal + Tara Bal, Rahu-Kaal/Bhadra/Panchak removed; festival buy-days
  (Dhanteras / Guru-Ravi Pushya / Akshaya Tritiya) boosted for purchase categories.
- **Numerology** (Chaldean) — Mulank/Bhagyank/Namank/Soul-Urge/Personality/Personal-Year,
  Master + Karmic rules, Lo Shu grid, number↔planet, mobile/vehicle matching, per-number
  meanings, beginner tutorial. Engine tested (`numerology.test.js`, 39 assertions).
- **Kundli Seekhe** — interactive: tap a Bhava tab → it highlights on a North-Indian
  chart; all 16 vargas + Moon chart explained; "Learn with AI" per house/chart.
- **Vastu Shastra** — rules engine (Mayamata/Manasara/Brihat-Samhita sourced) audit +
  score + AI Q&A; **live phone compass** (magnetometer) for users who don't know
  directions; **Vastu Map Designer** (see below).
- **Divine Library** — Gita, Ramayan, Ramcharitmanas, Vedas, Upanishads, chalisa/stotra +
  audio player.

### Vastu Map Designer (the most recent focus)
- `mobile/src/lib/vastuBlueprint.ts` — **deterministic house-plan layout engine** (NO AI).
  Assigns each room to its classical Vastu zone (SW master, SE kitchen, NE pooja + water,
  N living, NW guest/bath/parking, S store/stairs, open Brahmasthan centre), sizes rooms
  from realistic target areas, carves **attached bathrooms** into bedrooms + **utility**
  into the kitchen, adds front-garden + backyard-service bands, and (latest edit) uses a
  9-zone grid with compact sub-cell splitting.
- `mobile/src/components/BlueprintCanvas.tsx` — architect-sheet SVG renderer: double
  walls, door swings, window symbols, furniture line-art, compass rose, dimension lines,
  scale bar, site-plan inset, and a toggleable **Vastu Purusha Mandala** overlay.
- `mobile/src/components/BlueprintViewer.tsx` — fullscreen **pinch-zoom / pan / rotate**
  viewer (PanResponder, no extra native dep).
- **Deliberate decision:** NO AI floor-plan IMAGE generation — an AI image would
  hallucinate rooms/dimensions and break the "100% accurate, builder-usable" rule, and no
  reliable free API exists. The controlled SVG is the accurate output.

---

## 10. This session's work (commit log, newest first)

```
a2c1a0c Vastu blueprint: 9-zone grid layout with compact sub-cell splitting  (user edit)
3c2e556 Vastu blueprint: attached bathrooms + kitchen utility (nested partitions)
542ac7a Vastu blueprint: front garden + backyard service band + outdoor elements
2dfb46d Vastu blueprint: proportional room planner + Vastu Mandala overlay + room detail
4cf0f96 Vastu blueprint: professional architectural renderer + fullscreen zoom viewer
e7b019e Vastu: new-home blueprint designer (dimensioned SVG plan, editable rooms)
3493471 Vastu: live phone compass + current-home diagram
f9fcebf Vastu Shastra: rules-engine backend + screen (no DB, deterministic + AI Q&A)
81e5750 Kundli learn polish + AI language fixes (no-Hinglish, PROMPT_VERSION sx8)
f930ddb Kundli learn: interactive houses (tap→highlight) + all charts + Learn-with-AI
dd11c4b AI: fix false "network error" — raise client timeout for AI/heavy endpoints (120s)
2bd0075 Numerology: clearer Lo Shu cells (spaced repeats, dash for missing)
d332258 Numerology: plain-language labels + beginner tutorial
e1def65 Numerology: Lo Shu render fix, transparency note, core-number compatibility
afe4565 Numerology: dynamic per-number meanings + bigger numbers
d1091c7 Numerology: deterministic engine + tested API + AI-grounded interpret + screen
4b98d5a App-wide: auto-scroll to results when a response loads (useAutoScroll hook)
6fd5dbc Muhurat: add range presets (Next 3/6 months) + input validation
322e3aa Muhurat: fix month selection scanning beyond the chosen month
c119b6a Muhurat cards: pure-black bg + proper icon-to-title gap
f046d86 Muhurat categories: premium black + gold cards with custom SVG icons
1371fba Muhurat UI polish: themed cards, chip fix, direct reminder, year-bound calendar
6872eb3 Muhurat: festival buy-days (Dhanteras/Pushya), calendar nav, direct reminder
b281102 Muhurat: chosen-date range, auto-scroll, Ask-Jyotishi, readability
```
Latest APK built this session: `shree-yantra-vastu-v29.apk` (~48.5 MB).
Git remote: `github.com/Mahesh-WebDeveloper/shree-yantra-astrology` (branch `main`).

---

## 11. Rules / conventions to keep (non-negotiable)

1. **Never hardcode astrology outputs.** Compute deterministically; AI only phrases.
2. **AI must never invent a number/date/degree/placement.** Ground it on computed JSON.
3. **No Hinglish** — Hindi mode = pure Devanagari, English mode = pure English. Numerals
   always shown in English digits in both modes.
4. **Bilingual everywhere** — every user string has `{ en, hi }`; screens read `useLang()`.
5. **Match the existing gold/dark luxury theme** (`theme/tokens.ts`); reuse existing
   components (GoldButton, GoldDatePicker, TextField, Page, Card).
6. **Ship a "guidance only" disclaimer** on interpretive features (numerology, vastu).
7. **Deploy backend to live BEFORE building the APK** when a change spans both.
8. Prove correctness with tests where possible (see `numerology.test.js`).

---

## 12. Quick start for a new AI/dev
1. `cd backend && npm i && npm run dev` (with `.env`).
2. `cd mobile && npm i && npx expo start` (set `EXPO_PUBLIC_API_URL` to your backend).
3. Read `mobile/src/lib/api.ts` (all endpoints), `backend/src/routes/index.js` (all
   routes), and `backend/src/services/ai.service.js` (AI layer) first.
4. Type-check with `npx tsc --noEmit` before any build; build APK only on request via the
   §6 recipe.
```
