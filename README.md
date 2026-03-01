# Local Pulse

Local Pulse is a Next.js App Router event platform with Clerk authentication, local-first data storage, and Progressive Web App support.

## App Features

- Authentication and account management with Clerk (sign in, sign up, profile, password reset).
- Single account management surface via Clerk `UserProfile` (`/profile`).
- Event discovery home with search, filters, and featured events.
- Access-controlled visibility for local, college, and department events.
- Save events to favorites from cards and event details.
- Recently viewed events history on the home page.
- Smart recommendations based on favorites and viewing behavior.
- Event detail actions: registration, share, contact organizer, map embed, add-to-calendar (`.ics`).
- Organizer verification workflow with document upload and pending/approved/rejected states.
- Organizer tools to create events and manage organizer event listings (approval required).
- Admin control panel for organizer approvals, rejections, and platform analytics.
- Ticket history page with reminder toggles, virtual ticket preview, and event-named PDF downloads.
- Local Data Hub (`/database`) to inspect totals, export backup, import backup, and clear local data.
- Progressive Web App install prompt, app manifest, service worker, and mobile-friendly icons.

## What Is Included

- App Router architecture (`src/app`)
- Clerk authentication + account management
- Local database layer in browser storage
- Event discovery UI with filters and recommendations
- Organizer flow for creating local events
- PWA install support and offline service worker registration

## New Feature Set Added

This version includes 5 major feature upgrades:

1. Saved Events (Favorites)
- Heart/save events from cards and event details.
- Favorites are persisted locally and reflected instantly across pages.

2. Recently Viewed Events
- Event detail views are tracked in local storage.
- Home page now has a "Recently Viewed" section.

3. Smart Recommendations
- Home page recommends events based on saved and recently viewed behavior.
- Uses local affinity scoring (category + city + rating bias).

4. Add To Calendar (`.ics`)
- Event details page includes one-click calendar export.
- Works with Google Calendar, Outlook, Apple Calendar, and other calendar apps.

5. Data Hub (Local Database Tools)
- New `/database` page to inspect local data counts.
- Export full local backup as JSON.
- Import backup JSON on another browser/device.
- Clear all local app data when needed.

6. Organizer Verification + Admin Governance
- Separate organizer onboarding interface at `/organizer/apply`.
- Document upload support for legitimacy checks (Aadhaar/PAN/GST/business docs).
- Admin review dashboard at `/admin` to approve/reject organizer applications.
- Platform statistics: user count, organizer count, total events, total registrations, events per organizer.

7. Ticket Experience Upgrade
- Booking confirmation now generates a real downloadable PDF ticket.
- Ticket filename is event-based (not random), including booking reference.
- Users can view ticket history and re-download virtual tickets from `/my-tickets`.

## UI and Navigation Improvements

- Simplified account management with Clerk `UserButton` as the primary profile entry.
- Reduced profile/menu duplication.
- Added Data Hub to top navigation.
- Added richer home hero and stats strip.
- Expanded event catalog with more seeded events across categories/cities.

## Tech Stack

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui components
- Clerk (`@clerk/nextjs`)
- Firebase (existing integration kept)
- Local browser storage as zero-cost local database

## Clerk Integration (App Router, Current Pattern)

The project follows the current Clerk App Router setup:

- SDK install: `@clerk/nextjs`
- Middleware: `src/proxy.ts` with `clerkMiddleware()`
- Provider: `<ClerkProvider>` in `src/app/layout.tsx`
- Auth UI components from `@clerk/nextjs` in app components

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_ADMIN_EMAILS=contact@lingadevaru.in
```

Do not commit real keys. `.env*` is already ignored by `.gitignore`.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open:

`http://localhost:9002`

## Data Model (Local Database)

The browser local database is managed by `src/lib/local-db.ts`.

Primary keys used:

- `localpulse_events_v1`
- `localpulse_registrations_v1`
- `localpulse_favorite_event_ids_v1`
- `localpulse_recently_viewed_v1`

Capabilities:

- Create/update local events
- Save registrations/tickets
- Save favorites
- Track recently viewed events
- Export/import full snapshot
- Clear database safely

## Main Routes

- `/` - Home discovery page
- `/events/[id]` - Event detail + register + share + calendar export
- `/events/create` - Organizer event creation
- `/my-tickets` - User ticket history
- `/profile` - Clerk account settings (`UserProfile`)
- `/organizer` - Organizer dashboard
- `/organizer/apply` - Organizer verification request form
- `/admin` - Admin control panel (organizer approvals + analytics)
- `/database` - Local database tools

## Progressive Web App

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Install prompt UI: `src/components/PwaInstallPrompt.tsx`
- Icons: `public/icons/`
- App icon files: `src/app/icon.png`, `src/app/apple-icon.png`

## Free Deployment

### Vercel

1. Import repository in Vercel.
2. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Deploy.

### Netlify

1. Import repository in Netlify.
2. Use default Next.js build settings.
3. Add the same Clerk environment variables.
4. Deploy.

## Quality Commands

```bash
npm run typecheck
npm run build
```

## Repository Owner Profile (Suggested)

For your GitHub profile/repo description, this summary works well:

`Local Pulse: a local-first event discovery and organizer platform with Clerk auth, PWA install support, smart recommendations, and portable browser database backups.`
