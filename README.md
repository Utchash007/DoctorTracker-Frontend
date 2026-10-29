# Doctor Tracker — Frontend

Doctor Tracker brings doctor profiles, patient records, and care activity into one administrative workspace. This Next.js client uses Mantine library components, a dark slate-and-teal theme, and focused Zustand UI stores. The separately deployed Express API supplies the application data.

## Current phase

**F1 — scaffold and navigation.** `/` redirects to `/dashboard`; Dashboard, Doctors, and Patients render preview pages with loading skeletons. The responsive shell includes shared mobile-navigation state. Clerk authentication arrives in F2, the server-only API layer in F3, and data features in F4–F7.

## Setup

Use your installed **Node.js 26.x** (`.nvmrc`) and npm for local development and checks. `engines.node` accepts `24.x || 26.x` because Vercel currently offers Node 24.x as its newest hosted runtime; F8 will verify the hosted runtime. Run these commands from this repository's root:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). F1 works with placeholder environment values. For F2 onward, fill in your local `.env` using the variable names in `.env.example`; the API base URL is `http://localhost:5000/api`. Keep the Clerk secret key in server runtime.

The font is self-hosted by `next/font`; the initial development compilation and production build need access to Google Fonts to obtain Geist.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run lint` | ESLint checks |
| `npm run typecheck` | Generate Next route types and run strict TypeScript checks |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |

All direct dependencies are exact versions; `package-lock.json` makes installs reproducible. Core versions: Next.js **16.4.3**, React/React DOM **19.2.9**, Mantine **9.7.4**, Zustand **5.0.16**, and TypeScript **5.9.3**.

Next.js 16 supplies the React runtime required by Mantine 9's `useEffectEvent` usage. Development and production builds use default Turbopack; ESLint uses Next's native flat config. Cache Components is not enabled. Clerk's `src/proxy.ts` integration arrives in F2.

## Structure and state

```text
src/
  app/                  # Server-first layouts, pages, and loading boundaries
    (admin)/            # Dashboard, doctors, and patients
  components/
    layout/             # Mantine AppShell, header, and navigation compositions
    shared/             # Page heading and loading compositions
  providers/            # Mantine theme and scoped Zustand providers
  stores/               # Typed vanilla Zustand store factories
  theme.ts              # Slate + teal tokens and Mantine component defaults
```

The admin layout creates one Zustand store per mounted provider scope. The Burger, AppShell, and navigation subscribe only to the fields/actions they use. The store starts closed on both server and client, closes on link navigation or Escape, and is recreated on a full page load. Collapsed mobile navigation is also hidden from keyboard focus through Mantine's Styles API.

Shared UI belongs to Zustand; committed list filters belong to URL parameters; form values belong to Mantine Form. API access will run in Server Components and Server Actions, forwarding a fresh Clerk session token to Express.

## F1 smoke test

1. Visit `/` and confirm the redirect to `/dashboard`.
2. Use Dashboard, Doctors, and Patients in the sidebar. Each page should load and highlight its active link.
3. At a mobile width (for example 390 px), open and close the Burger. Choosing a route closes the navigation; Escape closes it and returns focus to the Burger.
4. Reload with navigation open and confirm it starts closed. Check a second tab has independent navigation state.
5. Tab from the top of the page to the skip link and activate it to reach the main content.
6. Run lint, typecheck, and build, then repeat navigation using `npm start`. Check the browser console for hydration errors and the viewport for horizontal overflow.

F1 verification passed on Node **26.13.0**: clean install, dependency checks, lint, typecheck, production build, and desktop/mobile browser smoke checks in development and production. The install audit reports zero vulnerabilities.

The complete feature walkthrough, technical-decision deep dives, deployment details, and desktop/mobile screenshots are delivered in F8.
