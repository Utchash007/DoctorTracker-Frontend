# Doctor Tracker — Frontend

Doctor Tracker brings doctor profiles, patient records, and care activity into one administrative workspace. This Next.js client uses Mantine library components, light and dark slate-and-teal themes, Clerk authentication, and focused Zustand UI stores. The separately deployed Express API supplies the application data.

## Current phase

**F3 — API layer and Server Action infrastructure.** Every API call runs in server runtime through `src/lib/api/client.ts`: a fresh Clerk Bearer token, no-store caching, a bounded timeout, and runtime validation of response envelopes and DTOs with typed failure mapping into safe `ActionResult` results. Pure URL-query normalization (`src/lib/api/params.ts`) turns list state into canonical API parameters; not-found and unexpected-render fallbacks plus retry-refresh callouts are in place. Data features land in F4–F7, starting with the dashboard.

## Setup

Use your installed **Node.js 26.x** (`.nvmrc`) and npm for local development and checks. `engines.node` accepts `24.x || 26.x` because Vercel currently offers Node 24.x as its newest hosted runtime; F8 will verify the hosted runtime. Run these commands from this repository's root:

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

`src/lib/env.ts` validates required configuration without logging values. Loopback HTTP is allowed for local production-mode smoke tests. F2 previews do not need a running API.

### Clerk application

1. Enable your preferred sign-in methods (Google and/or email/password).
2. Create an administrator in the Clerk Dashboard and set their **public metadata** to `{ "role": "admin" }`.
3. In **Sessions → Customize session token**, add the claim:

   ```json
   { "publicMetadata": "{{user.public_metadata}}" }
   ```

4. Sign out and back in after changing metadata/token configuration. An absent or different role is denied access.

Clerk preserves the intended return URL, including a deep link such as `/doctors?search=card`. Sign-out returns to `/sign-in`. New accounts require explicit administrator metadata before accessing the workspace.

### Light and dark modes

The first visit follows your system preference. Use the sun/moon button on the sign-in, workspace, or access-denied page to switch modes. Mantine saves the preference across reloads and syncs it between tabs; Clerk forms and account menus use the same colors.

The font is self-hosted by `next/font`; the initial development compilation and production build need access to Google Fonts to obtain Geist.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run lint` | ESLint checks |
| `npm run typecheck` | Generate Next route types and run strict TypeScript checks |
| `npm run test:unit` | Vitest unit/contract tests with mocked Clerk auth and API transport |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |

All direct dependencies are exact versions; `package-lock.json` makes installs reproducible. Core versions: Next.js **16.4.3**, React/React DOM **19.2.9**, Mantine **9.7.4**, Clerk Next.js **7.9.22**, Zustand **5.0.16**, Zod **4.6.7**, Vitest **5.0.5**, and TypeScript **5.9.3**.

Next.js 16 supplies the React runtime required by Mantine 9's `useEffectEvent` usage. Development and production builds use default Turbopack; ESLint uses Next's native flat config. Cache Components is not enabled. `src/proxy.ts` uses bare `clerkMiddleware()`; each protected page independently checks the session and admin role before rendering data.

## Structure and state

```text
src/
  app/                  # Server-first layouts, pages, and loading boundaries
    (admin)/            # Dashboard, doctors, and patients
    sign-in/            # Public optional catch-all Clerk sign-in flow
    forbidden/          # Authenticated access-denied page with sign-out
  components/
    auth/               # Mantine auth-page shell and skeletons
    layout/             # Mantine AppShell, header, and navigation compositions
    shared/             # Page headings, loading/theme controls, error callouts, manual retry
  lib/                  # Server-only env, auth/role helpers, and lib/api/ server client
  providers/            # Mantine theme and identity-scoped Zustand providers
  stores/               # Typed vanilla Zustand store factories
  types/                # Clerk custom session-claim declarations
  theme.ts              # Light/dark slate + teal tokens and component defaults
  proxy.ts              # Clerk session middleware and route matcher

tests/                  # Vitest unit/contract suites (mocked Clerk auth + API transport)
```

The admin layout creates one Zustand store per mounted provider scope. The Burger, AppShell, and navigation subscribe only to the fields/actions they use. The store starts closed on both server and client, closes on link navigation or Escape, and is recreated on a full page load or Clerk identity/session change. Collapsed mobile navigation is also hidden from keyboard focus through Mantine's Styles API.

Shared transient UI belongs to Zustand; committed list filters belong to URL parameters; form values belong to Mantine Form. Clerk owns authentication and Mantine owns the saved theme preference. API access runs in server runtime only (`src/lib/api/client.ts`), forwarding a fresh Clerk session token to Express — the browser never calls the API.

`requireAdmin()` protects read drivers. Future actions must independently call `authorizeAdminAction()` before API work: signed-out access redirects to sign-in; signed-in non-admin access returns a safe `{ ok: false, status: 403, code: "FORBIDDEN", message }` result. The `/forbidden` page calls only `requireSession()` so denied users can sign out without an authorization loop. Tokens and full auth objects stay in server runtime.

## F2 smoke test

1. Signed out, visit `/`, `/dashboard`, `/doctors`, `/patients`, and `/forbidden`. Each should reach local `/sign-in` without showing protected content.
2. Visit `/doctors?search=card`, sign in as an admin through Clerk (including any verification step), and confirm that the deep link is restored. Check all three sidebar destinations and the account menu.
3. Switch light/dark modes; reload and open another tab to check the saved preference. Check both modes at desktop and 320/390 px mobile widths, including the Clerk form/account popover.
4. On mobile, open/close the Burger, choose a route, and press Escape. Check route-close behavior and focus return. Reload with the menu open and confirm it starts closed; another tab has independent navigation state.
5. Sign out through the account menu and confirm `/sign-in`. Sign in using an account without the admin claim: it should reach `/forbidden`, show no workspace data, and allow sign-out. Theme preference survives sign-out; transient menu state does not.
6. On the admin shell, activate the keyboard skip link to reach the main content. Run lint, typecheck and build, then repeat smoke checks with `npm start`; check for hydration errors and horizontal overflow.

F1 verification passed on Node **26.13.0**: clean install, dependency checks, lint, typecheck, production build, and desktop/mobile browser smoke checks in development and production.

The complete feature walkthrough, technical-decision deep dives, deployment details, and desktop/mobile screenshots are delivered in F8.
