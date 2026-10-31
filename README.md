# Doctor Tracker - Frontend

## Overview

Doctor Tracker gives a clinic administrator one secure workspace for every doctor, every patient, and who is treating whom: doctor profiles with full CRUD and directory search, patient records with directory-wide search/filter/sort, doctor-to-patient assignment, and a live dashboard of head-count, registration and activity trends. This repository is the Next.js client behind that portal: a server-first App Router app running Mantine 9 library components in a slate-and-teal light/dark theme, delegating identity and the admin role to Clerk, and consuming the separately deployed Express API exclusively from server-side rendering and Server Actions, so no session token or API endpoint is ever exposed to the browser.

---

## Architecture

```
Browser
  │  (Clerk session cookie, same-origin to this Next.js app)
  ▼
Next.js client on Vercel   (you are here)
  │  Server Runtime (RSC loaders + Server Actions)
  │  Authorization: Bearer <Clerk session token> from auth().getToken()
  │  REST/JSON over HTTPS
  ▼
Express API on Render/Railway  ──verifyToken(CLERK_JWT_KEY)──►  Clerk
  │
  ▼
Prisma 6.x
  │
  ▼
MongoDB Atlas (replica set)
```

- **Server-first data access.** Pages are React Server Components by default; every list query, mutation and token read happens in the server runtime (`src/lib/api/client.ts` transparently attaches the Bearer token from `auth().getToken()`). The browser never calls the Express API directly: there are no browser-side fetch effects and no API URLs in client bundles. Mutations are Server Actions that return a typed `ActionResult` to forms and call `router.refresh()` on success.
- **Clerk owns identity.** Sign-in uses the prebuilt `<SignIn/>` component with nested verification; the admin role arrives as `publicMetadata.role = "admin"` in the session token. Bare `clerkMiddleware()` (`src/proxy.ts`) protects route matching, while each page and action independently re-checks the session and role in the server runtime. `/forbidden` checks authentication only, so a signed-in non-admin can sign out instead of looping; tokens never cross the RSC boundary to client components.
- **State composition.** Committed list state (search, filters, sort, pagination, date ranges) lives in the URL search params and maps 1:1 to API query strings, with server-side normalization of junk/out-of-range pages. Transient UI (mobile navbar, dialog visibility) lives in small feature-scoped Zustand stores that start closed on server and client and reset per identity. Mantine Form owns form values; Mantine owns the saved color-scheme preference.
- **Recovery layers.** Expected API failures (403, 404, 401, rate limits, network) render as safe in-page callouts from server loaders, never as generic error screens. Unexpected segment failures fall to `error.tsx`, root-layout failures to `global-error.tsx` (self-contained HTML, Clerk-independent), unmatched/malformed ids to the shared not-found page, and denials to `/forbidden`.

### Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.4.3 (App Router, Turbopack, React 19.2.9) |
| UI system | Mantine 9.7.4 (`@mantine/core`, `form`, `dates`, `hooks`, `charts` on Recharts 3.10.1) |
| Icons | `@tabler/icons-react` |
| Auth | Clerk (`@clerk/nextjs` 7.9.22, prebuilt `<SignIn/>` / `<UserButton/>`) |
| Client state | Zustand 5.0.16 (transient UI stores only) |
| Validation | Zod 4.6.7 (server-side form-input contracts mirroring the API) |
| Tests | Vitest 5.0.5 (unit/contract suites, 131 tests) |
| TypeScript | 5.9.3, strict with a 0 `any` policy |

### Repository layout

```text
src/
  app/                  # Server-first layouts, pages, and loading boundaries
    (admin)/
      dashboard/        # KPI cards, patients-per-doctor ranking, activity timeline
      doctors/          # Doctors table, filters, pagination and modal CRUD
      doctor-detail/    # Doctor profile card, patients table, add/remove dialogs
      patients/         # Patients directory table, filters, edit/delete dialogs
    forbidden/          # Signed-in, non-admin landing page (no role loop)
    error.tsx           # Route-segment failure fallback (retry + digest)
    global-error.tsx    # Root-layout failure: own html/body, Clerk-independent
  components/           # Mantine-composed feature components and small client leaves
  lib/                  # Server-only env, auth/role helpers, lib/api/ server client, lib/validation/ write-input contracts
  providers/            # Mantine theme and identity-scoped Zustand providers
  stores/               # Typed vanilla Zustand store factories
  types/                # Clerk custom session-claim declarations
  theme.ts              # Light/dark slate + teal tokens and component defaults
  proxy.ts              # Clerk session middleware and route matcher

tests/                  # Vitest unit/contract suites (mocked Clerk auth + API transport)
```

The admin layout creates one Zustand store per mounted provider scope. The Burger, AppShell, and navigation subscribe only to the fields/actions they use. The store starts closed on both server and client, closes on link navigation or Escape, and is recreated on a full page load or Clerk identity/session change. Collapsed mobile navigation is also hidden from keyboard focus through Mantine's Styles API.

Every read page runs `requireAdmin()`; every mutation independently calls `authorizeAdminAction()` before API work: signed-out access redirects to sign-in (preserving deep links), a signed-in non-admin gets a safe typed 403, and direct mutation attempts are rejected server-side. Screens are composed from Mantine library components end to end: no hand-rolled tables, modals, pickers or toasts.

---

## Setup Guide

Use your installed **Node.js 26.x** (`.nvmrc`) and npm for local development and checks. `engines.node` accepts `24.x || 26.x` because Vercel currently offers Node 24.x as its newest hosted runtime; see [Deployment](#deployment-vercel). Run these commands from this repository's root:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Configure .env and your Clerk application as described below.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Fill in your local `.env` using `.env.example` before starting or building:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` locally; hosted production APIs use HTTPS |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk application's `pk_...` key |
| `CLERK_SECRET_KEY` | The matching `sk_...` key; server-only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` (optional default) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` (optional default) |

`src/lib/env.ts` validates required configuration without logging values. The dashboard needs the backend running on port 5000 and the Clerk application configured per the checklist below (its counterpart guide: `DoctorTracker-Backend/README.md`).

### Clerk application

This assessment build is configured for open access: every signed-in account carries the admin role automatically, so evaluators can sign up with any email and use the full workspace with no dashboard setup:

1. Enable your preferred sign-in methods (Google and/or email/password).
2. In **Sessions → Customize session token**, set the template that issues the admin role to every session:

   ```json
   {
     "publicMetadata": {
       "role": "admin"
     }
   }
   ```

3. Keep **Organizations** disabled for the Clerk instance (Dashboard → Organizations settings), so the prebuilt sign-in and account menus never show create-organization steps.
4. Sign out and back in after changing the template; already-issued tokens refresh with the new claim within about a minute.

The per-session role check in the code remains as defense in depth (`requireAdmin`, `authorizeAdminAction`, the API's `authorize('admin')` and the `/forbidden` page), but with the template above no per-user metadata is needed. Clerk preserves the intended return URL, including a deep link such as `/doctors?search=card`, and sign-out returns to `/sign-in`.

### Light and dark modes

The first visit follows your system preference. Use the sun/moon button on the sign-in, workspace, or access-denied page to switch modes. Mantine saves the preference across reloads and syncs it between tabs; Clerk forms and account menus use the same colors.

The font is self-hosted by `next/font`; the initial development compilation and production build need access to Google Fonts to obtain Geist.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm start` | Serve the production build on port 3000 |
| `npm run lint` | ESLint checks |
| `npm run typecheck` | Generate Next route types and run strict TypeScript checks |
| `npm run test:unit` | Vitest unit/contract tests with mocked Clerk auth and API transport |
| `npm run build` | Production build |

All direct dependencies are exact versions; `package-lock.json` makes installs reproducible. Core versions: Next.js **16.4.3**, React/React DOM **19.2.9**, Mantine (including charts) **9.7.4**, Recharts **3.10.1**, Clerk Next.js **7.9.22**, Zustand **5.0.16**, Zod **4.6.7**, Vitest **5.0.5**, and TypeScript **5.9.3**.

Next.js 16 supplies the React runtime required by Mantine 9's `useEffectEvent` usage. Development and production builds use default Turbopack; ESLint uses Next's native flat config. Cache Components is not enabled. `src/proxy.ts` uses bare `clerkMiddleware()`; each protected page independently checks the session and admin role before rendering data.

---

## Technical Decisions

### Decision 1: Server-first rendering with URL-committed list state (and why the browser never talks to the API)

The most consequential architectural choice is the direction of every data request. In the common Next.js CRUD demo pattern, client components fetch with `useEffect`, hold list state in `useState`, and talk to the API from the browser. That approach was rejected here in favor of a fully server-first data path, for three reasons.

**Security surface collapsed to zero browser-side.** The Express API authenticates every request with `Authorization: Bearer <Clerk session token>`. If the browser made those calls, the token would have to be handed to client JavaScript and the whole API surface (including every filter/route combination builders could probe) would be reachable from any logged-in context. Instead, RSC loaders read a fresh token via `auth().getToken()` and Server Actions forward mutations; the API URL appears in `NEXT_PUBLIC_` env only as a *server-runtime* base URL, customer browser bundles never resolve the Express service, and each caller is re-authorized server-side (`requireAdmin()` / `authorizeAdminAction()`), so even a crafted client-side request to the app fails before any API call exists.

**Searching, filtering, sorting and pagination happen in one engine: MongoDB.** Every list control maps 1:1 to an API query parameter (`/doctors?search=card&sort=name_asc&page=2&limit=10`), so the page renders exactly what the API computes: `where`/`orderBy`/`skip`/`take` server-side, with indexes and metadata-driven page recovery (`/doctors` redirects an out-of-range `page` to the last valid page). There is no second implementation of filtering in JavaScript to keep in sync with the API's, no possibility of handing the browser an unbounded collection to slice, and no stale local copy: mutations call `router.refresh()` and the URL is re-rendered.

**URL state doubles as the app's state store.** Because state is committed to the URL, browser Back/Forward restore both the URL and its matching data (verified with staged `DatePickerInput` drafts that only commit on apply), any filtered view is a shareable/bookmarkable deep link, and a reload restarts identically. Server-side normalization also silently canonicalizes junk parameters. What does *not* belong in the URL is separated by ownership: transient UI (mobile navbar, dialog visibility) lives in small feature-scoped Zustand stores that start closed on server and client, reset per Clerk identity change, and never persist; form values live in Mantine Form; the theme preference belongs to Mantine. This split keeps hydration-free rendering for dynamic data while leaving only genuinely ephemeral interactions in JavaScript memory.

The cost of this pattern is measured, and accepted: list pages are dynamic (rendered per request with the API's latency), which is why expected API failures render as safe in-page callouts with retry, rate-limit deadlines are surfaced, and the [deployment](#deployment-vercel) section covers API cold starts and function durations rather than papering over them client-side.

### Decision 2: Mantine 9 as the single UI system (only library components, composed and themed)

The UI policy is strict: **every visible control comes from an installed library**: Mantine 9 (`@mantine/core`, `@mantine/form`, `@mantine/dates`, `@mantine/charts`), `@tabler/icons-react`, and Clerk's prebuilt `<SignIn/>`/`<UserButton/>`. No table, modal, select, combobox, date picker, pagination, toast or form in this repo is hand-rolled. Components are *composed* (server-rendered layouts assembling Mantine parts, small client wrappers for interactive leaves) and extended through sanctioned extension points (`classNames`/`styles`, Styles API, `createTheme`, `cssVariablesResolver`) rather than by rebuilding primitives.

Why commit to one system instead of mixing specialized libraries? The failure mode of bespoke UI is well known: a hand-rolled modal without focus trapping, a custom table with broken keyboard navigation, a filter bar whose two sources of truth disagree. Mantine provides those properties for free: `Modal` ships focus management, `TextInput`/`PasswordInput`/`Select` ship accessible controls, `Pagination`, `Table`, `DatePickerInput`, `LineChart` and `EmptyState` arrive as finished, themeable components. Writing our own would be writing all of that again, twice: once for light mode and once for dark.

Mantine 9 was chosen over component sets because of three concrete capabilities the design depends on:

- **CSS variables + a first-class color-scheme manager.** F2's user-approved light/dark requirement is fulfilled by Mantine's own persistence (localStorage, `ColorSchemeScript defaultColorScheme="auto"`, cross-tab sync; no custom theme store) and the same tokens drive Clerk's appearance, so sign-in and the account menu match the workspace everywhere.
- **Uncontrolled form primitives with per-field validation.** `useForm` runs uncontrolled with `key={form.key('field')}`, validating inputs against Zod-mirrored field rules without the re-render tax of controlled inputs across a table-heavy admin UI, while Server Actions remain the only submit path and map API 4xx errors into the same form surface.
- **Dates and charts inside the same theme.** `@mantine/dates` (doctor joined-date filters, patient created-range, dashboard range) and `@mantine/charts` (activity timeline, ranking) inherit the existing tokens instead of shipping a second visual language, with their required peers (`dayjs`, `recharts`) pinned explicitly.

The one trade-off deliberately accepted: Mantine 9 requires the React runtime that Next 16 bundles (its `useEffectEvent`), which set the framework version floor. That was a single, versioned dependency decision, and materially cheaper than maintaining a patchwork of custom controls across two themes, five route families and four breakpoints.

---

## Deployment (Vercel)

1. Import `DoctorTracker-Frontend` into Vercel with **Root Directory left at the repository root (`.`)** and the Next.js framework preset. The [hosted Node version list](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), checked 2026-10-30, offers 24.x and 22.x; 24.x is permitted by `engines.node: "24.x || 26.x"` and is the expected hosted runtime until 26.x lands. Local development and CI run the user's Node 26.x. Install from the committed lockfile (`npm ci` behavior).
2. Set **all environment variables before deploying** (public values are inlined at build time): `NEXT_PUBLIC_API_URL=https://<api-host>/api`, the Clerk `pk_...` and `sk_...` keys, and the local sign-in/fallback URLs. Configure Clerk's production application/domain for the deployed frontend; keep all `NEXT_PUBLIC_*` values consistent between your build and runtime environments.
3. On the API side (`DoctorTracker-Backend`): `CLERK_JWT_KEY` set, and `CORS_ORIGIN` includes the deployed frontend URL, matching scheme/host/port exactly with no trailing slash.
4. **Timeouts.** The API timeout is 60 s; configure this app's server-render/action function duration above it (e.g. 70 s where the account/runtime supports it) so the client does not abandon requests the API can still complete. If a shorter duration is used instead, disclose cold-start read retries. Writes are never retried automatically after a timeout.
5. Then run the production smoke passes: signed-out redirect and nested sign-in; admin dashboard/CRUD as a fresh (or existing) sign-in, which carries admin automatically; direct unauthenticated mutation rejection; doctor/patient date filters; stale/last-page deletion; safe API failures; responsive navigation; sign-out.

**Cold starts:** free-tier API instances sleep when idle, so the first page load after a pause can take **30+ seconds**. That is the backend provider's cold start, not a client defect; a subsequent request is fast.

---

## Visual Evidence

Desktop and mobile screenshots are captured from the deployed application and placed in `docs/screenshots/` (referenced in this section once committed):

| # | Shot | Route | Viewport |
|---|---|---|---|
| 1 | Dashboard: KPI cards, patients-per-doctor ranking, 30-day timeline | `/dashboard` | Desktop 1280 px |
| 2 | Doctors directory with an active filter + New Doctor modal | `/doctors` | Desktop 1280 px |
| 3 | Doctor detail with assigned patients and Add Patient modal | `/doctors/<id>` | Desktop 1280 px |
| 4 | Patients directory with the Add Patient modal open (required doctor selector) + an active doctor chip | `/patients` | Desktop 1280 px |
| 5 | Patients directory (or dashboard) | same route | Mobile 390×844 |
| 6 | Dark-mode workspace (theme persisted) | `/patients` | Desktop 1280 px |
| 7 | Clerk sign-in (light or dark) | `/sign-in` | Desktop 1280 px |

Capture with browser devtools device mode at 100% zoom after seeding representative data, PNG format, and save as `docs/screenshots/NN-short-name.png` matching the table above.
