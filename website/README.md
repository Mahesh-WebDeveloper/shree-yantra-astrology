# Shree Yantra — marketing / web app (React + Vite)

Premium Vedic astrology website aligned with the **mobile app backend** and **prototype theme** (dark/light gold).

## Run locally

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API

Set `VITE_API_URL` in `.env` (see `.env.example`). Default points to the live server from `PROJECT_HANDOFF.md`:

`http://168.144.185.66:4000`

CORS: backend already allows `http://localhost:5173` in default origins.

## Home page (live data)

Same public endpoints as the logged-out / welcome flow on mobile:

| UI block | API |
|----------|-----|
| Panchang | `POST /api/panchang` |
| Daily shloka | `GET /api/daily-shloka` |
| Rashifal strip | `GET /api/horoscope?period=daily&lang=…` |
| Plans | `GET /api/plans` |
| Branding | `GET /api/app-config` |

Location: browser geolocation when allowed, else **Jaipur** (same fallback as the app).

## Stack

React 19, TypeScript, Tailwind 4, React Query, React Router, Lenis + GSAP ScrollTrigger, Framer Motion, Three.js (hero starfield, lazy-loaded).

Other routes show a “coming soon” placeholder until we build the next screens.
