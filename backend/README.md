# Shree Yantra — Backend

Express + MongoDB (local) + VedAstro. Frontend (RN app) sirf isi backend se baat karega;
VedAstro/Claude isi backend ke peeche rahenge (keys kabhi app me nahi).

## Zaruri cheezein
1. **Node.js LTS** (nodejs.org)
2. **MongoDB local** — aapka **MongoDB Compass** jis local server (`mongodb://127.0.0.1:27017`)
   se connect hota hai wahi. (Compass khol ke connect rakho — matlab `mongod` chal raha hai.)

## Chalाne ke steps
```bash
cd backend
npm install
npm run dev          # nodemon (auto-restart). Ya: npm start
```
Dikhega:
```
✅ MongoDB connected: mongodb://127.0.0.1:27017/shree_yantra
🚀 Server:    http://localhost:4000
🛠  Dashboard: http://localhost:4000/dashboard.html
```

## Test karo
- **Health:** browser me `http://localhost:4000/api/health`
- **Dashboard (toggle):** `http://localhost:4000/dashboard.html` — yahin se **Free ⇄ Paid** switch.
- **Kundli (Postman / Thunder Client):**
  ```
  POST http://localhost:4000/api/kundli
  Content-Type: application/json

  { "lat": 26.91, "lng": 75.79, "dob": "01-01-2000", "tob": "06:42", "tz": "+05:30" }
  ```
  Pehli baar VedAstro se aayega; dob– wahi request → `cached: true` (DB se, fast).

## Free → Paid kab/kaise
1. VedAstro se $1/month plan le kar **API key** lo.
2. `.env` me daalo: `VEDASTRO_API_KEY=apni_key`  → **server restart**.
3. **Dashboard** kholo → toggle ON karo (Paid). Bas — ab unlimited.
   (Key ke bina paid select karoge to dashboard rok dega.)

## Folder structure
```
backend/
  server.js                  entry (DB connect → server start)
  .env / .env.example        config (secrets — .env git me nahi)
  public/dashboard.html      admin toggle (free/paid)
  src/
    config/   env.js, db.js
    models/   Settings.js (tier toggle), Kundli.js (cache)
    services/ vedastro.service.js  (tier-aware API calls + caching)
    controllers/  health, settings, kundli
    routes/   index.js
    middleware/  asyncHandler, errorHandler
    app.js    express app (middleware + routes)
```

## API
| Method | Path | Kaam |
|---|---|---|
| GET  | `/api/health`   | server + DB status |
| GET  | `/api/settings` | current tier + key set? |
| PATCH| `/api/settings` | `{ "vedastroTier": "free" \| "paid" }` toggle |
| POST | `/api/kundli`   | `{ lat, lng, dob, tob, tz }` → kundli (cached) |

## Notes
- **Caching:** kundli ek birth-time ki kabhi nahi badalti → forever cache (API calls bachte hain).
- **VedAstro endpoint path:** `vedastro.service.js` me `AllPlanetData` use kiya hai. Exact path
  [VedAstro API Builder](https://vedastro.org/APIBuilder.html) se verify/generate kar sakte ho —
  service generic hai, badalna 1-line ka kaam.
- **Aage (next phases):** Auth (JWT + bcrypt), Rashifal/AI (Claude — pay-as-you-go), Payments (Razorpay),
  Dynamic content/CMS, Google Analytics.
