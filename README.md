# Local Pulse

Local Pulse is a Next.js App Router event platform with:

- Clerk authentication and profile management
- Local database persistence for user-created events and registrations
- Progressive Web App support (service worker + install prompt)
- Zero required paid backend to run locally or deploy

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Add Clerk keys in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

3. Run:

```bash
npm run dev
```

4. Open:

`http://localhost:9002`

## Data Model

- Default events are bundled in `src/lib/mockData.ts`.
- Newly created events are saved in browser local storage (`localpulse_events_v1`).
- Registrations/tickets are saved in browser local storage (`localpulse_registrations_v1`).

This makes hosting easy on free tiers (Vercel/Netlify) without provisioning a database.

## Deploy (Free)

### Vercel

1. Import the GitHub repo into Vercel.
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Project Environment Variables.
3. Deploy.

### Netlify

1. Import the GitHub repo into Netlify.
2. Netlify will auto-detect Next.js and use the Next runtime.
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Deploy.

## PWA

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Install prompt component: `src/components/PwaInstallPrompt.tsx`
- Icons: `public/icons/`
