# Shree Yantra Admin Dashboard

React admin console for the Shree Yantra backend.

## Stack

- Vite + React + TypeScript
- React Router v6 lazy routes
- TanStack Query + Axios
- Tailwind CSS with shadcn-style local components
- React Hook Form + Zod
- Recharts and lucide-react

## Setup

```bash
cd admin
npm install
```

Create `.env` from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## Run

Start the backend first:

```bash
cd ../backend
npm run seed:admin
npm run dev
```

Then start the admin app:

```bash
cd ../admin
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

The client stores only the admin JWT and public admin user profile in `localStorage`. API secrets remain in `backend/.env`.

## Library Media

The Media page manages Mantra, Spiritual Music, and Bhajan content shown in the mobile Library. You can paste a direct YouTube URL/video ID or a direct audio URL. For YouTube search/import inside the admin, set these backend-only env vars:

```bash
YOUTUBE_API_KEY=
YOUTUBE_REGION_CODE=IN
```

For legal/public audio sources, keep the Rights and source fields filled in the Media form. To import official Yatharth Geeta Hindi audio links from Internet Archive as chapter-wise media items:

```bash
cd ../backend
npm run import:yatharth-geeta-audio
```

This importer stores direct archive URLs and license metadata only; it does not download, decrypt, join, or modify audio files.
