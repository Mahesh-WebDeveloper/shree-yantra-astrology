# Shree Yantra Astrology · Static Client-Review Prototype

Mobile-first, fully clickable HTML/CSS/JS prototype for the subscription-based
astrology app. Built so the client can walk through the entire journey — from
splash to active subscription — in a real browser.

This is a **subscription-only** product. No physical goods, no checkout, no
shipping flow.

## Run

From this folder:

```bash
python -m http.server 8090 --bind 127.0.0.1
```

Open <http://127.0.0.1:8090/index.html> — the root redirects to the splash
screen.

## Architecture

- **`assets/app-shell.css` + `assets/app-shell.js`** are shared by every page.
  They inject a slide-in side drawer, a persistent bottom navigation bar
  (where the page doesn't ship its own), wire the hamburger / top-bar menu
  toggle, and provide one universal `data-sy-go="<route>"` attribute so every
  button can navigate.
- **5 fixed pages (client-approved design)** keep their own visual identity.
  They were only fine-tuned for mobile responsiveness; no design changes.
- **All new pages** (splash, onboarding, sign-in, register, predictions,
  kundli, remedies, services, manage-subscription, help) share
  `assets/sy-pages.css` to keep typography, colours, gold borders and cosmic
  background identical to the fixed pages.

## Full Screen Flow

```
splash → onboarding → signin → (register 1-3) → subscribenow → subscription-activated
                            └→ welcome (home)
                                ├→ predictions ─→ daily-prediction
                                ├→ kundli
                                ├→ remedies
                                ├→ services (chat / call astrologers)
                                ├→ profile ─→ manage-subscription
                                └→ help
```

All bottom-nav buttons and the top-bar hamburger work on every screen.

## Pages

### Client-approved (fixed)

- `pages/welcome-page` — Home
- `pages/daily-predication-page` — Daily prediction (Leo)
- `pages/subscribenow-page` — Subscription form
- `pages/subscription-activated` — Activation confirmation
- `pages/profile-page` — Profile / settings

### New (inspired by the Stitch design set)

- `pages/splash` — Animated loading screen
- `pages/onboarding` — 3-slide intro carousel
- `pages/signin` — Email + social sign-in
- `pages/register` — 3-step registration (identity, birth details, preferences)
- `pages/predictions` — Daily / weekly / monthly hub with all 12 zodiac signs
- `pages/kundli` — Birth chart, planetary positions, dasha
- `pages/remedies` — Categorised Vedic remedies (informational only)
- `pages/services` — Live astrologer consultations (chat / call)
- `pages/manage-subscription` — Current plan, plan switcher, billing history, cancel
- `pages/help` — FAQ + contact support

## Responsive notes

- Mobile-first; the app shell targets a 480 px content frame and expands
  cleanly to tablet / desktop.
- Welcome page's three "Explore Premium Features" cards stack into a row layout
  on screens ≤ 720 px (icon | title+desc | chevron).
- Every page reserves space for the fixed bottom nav using
  `--sy-bottom-nav-h` + `safe-area-inset-bottom`.
- The drawer opens via any `.menu-btn`, `[data-menu-toggle]` or
  auto-injected floating menu on pages without a top bar.

## How to swap content

All copy, names, prices and dummy data live in the page HTML. The colour
palette and shell tokens live in `assets/app-shell.css` (CSS variables under
`:root`).
