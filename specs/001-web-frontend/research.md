# Research: session 2.2 (scaffold, generated client, basic CI)

Date: 2026-11-27. Versions are what the npm registry reported that day; the lockfile is the authority.
No `NEEDS CLARIFICATION` remains: the six open choices were decided with Carlos (see plan).

## R1. Framework and runtime

- **Decision**: Nuxt 4 (4.7.0), Node 24 pinned in `.nvmrc`, pnpm 12 pinned via `packageManager`.
- **Rationale**: Nuxt includes Nitro, which the spec requires for the session layer; SSR gives readable
  public pages with JavaScript disabled (spec edge case). Node 24 matches the local toolchain and
  satisfies `@hey-api/openapi-ts` (needs Node >= 22.18).
- **Alternatives**: Next.js (would drop the Nitro decision already taken in 2.1); plain Vue SPA (no SSR,
  no server layer).

## R2. TypeScript version

- **Decision**: TypeScript 6.x (the version Nuxt 4.7 itself develops against, 6.0.3), not 7.
- **Rationale**: TypeScript 7 is the newest major and `vue-tsc` support is the weak link; matching Nuxt's
  own version removes a risk for no benefit. `@hey-api/openapi-ts` accepts `>=6`.
- **Alternatives**: TypeScript 7 (revisit when `vue-tsc` documents support).

## R3. OpenAPI client generator

- **Decision**: `@hey-api/openapi-ts` 0.99, config in `openapi/openapi-ts.config.ts`, output in
  `app/api-client/`, committed.
- **Rationale**: generates types and one typed function per operation over `fetch`; deterministic output
  (needed for the drift diff); active Nuxt usage. Input is OpenAPI 3.1, which it supports.
- **Alternatives**: `openapi-typescript` + `openapi-fetch` (no per-operation functions, routes as
  strings); Orval (more configuration than needed).
- **Pin note**: pre-1.0 package, so the version is pinned exactly and bumped deliberately; a bump that
  changes output shows up as drift in CI, which is the intended signal.

## R4. Drift check (FR-013, SC-008)

- **Decision**: `scripts/check-client-drift.mjs` regenerates the client into a temporary directory from
  `openapi/openapi.json` and compares file by file with `app/api-client/`; exit code 1 and a list of
  differing files on mismatch. CI runs it; a unit test proves it fails on a tampered file and passes
  on a clean one (that test is SC-008's evidence).
- **Rationale**: a `git diff --exit-code` after regeneration would also work but mutates the working
  tree and cannot be unit-tested cleanly; a script with a temp directory can.
- **Alternatives**: regenerate-then-`git diff` in the workflow only (untestable, no failing-test proof).

## R5. OpenAPI snapshot source

- **Decision**: export the full schema (`app.openapi()`, which includes public and admin routes; the
  API's "admin" document is the unfiltered one) from API `develop` at `2bb7341`, sorted keys, two-space
  indent. `openapi/SOURCE.md` records repo, commit, date, command and the dummy-env note.
- **Rationale**: `v0.2.0` does not exist yet (1.7 pending), brief allows `develop` if annotated. The
  export needs no database and no `.env`: three dummy environment variables satisfy settings
  validation. 31 paths, OpenAPI 3.1.0, `info.version` 0.2.0.
- **Alternatives**: fetch `/api/v1/openapi-admin.json` from a running API (needs Docker stack and a
  superuser context; not reproducible in CI).

## R6. Tests

- **Decision**: Vitest 5 with two projects: `unit` (node environment) for `server/utils`, scripts and
  pure code; `nuxt` (via `@nuxt/test-utils`, `happy-dom`) for component and shell tests.
- **Rationale**: official Nuxt stack; `@nuxt/test-utils` 4.4 declares `vitest ^4 || ^5`, `nuxt ^4`,
  `happy-dom >=20`. One runner for server and components.
- **Alternatives**: Testing Library (extra dependency; revisit when component tests need role
  queries, which are available later without changing the runner).
- **Deferred**: Playwright and axe (Constitution V gate) start in 2.3 with the first real pages.

## R7. Lint and typecheck

- **Decision**: `@nuxt/eslint` 1.17 (flat config, ESLint 10 is in its peer range) for lint; `nuxt typecheck`
  (`vue-tsc`) for types. Generated client excluded from lint.
- **Alternatives**: Biome (no Vue template support at parity); separate Prettier (style rules come from
  `@nuxt/eslint` stylistic config, one tool less).

## R8. BFF test seam (Constitution I)

- **Decision**: `server/utils/apiClient.ts` exposes the only functions that call the generated client.
  Server code depends on that module; tests inject a typed fake built from generated types.
- **Rationale**: "wrap external dependencies, then mock the wrapper." A change in the API contract
  breaks the fake at compile time, because the fake is typed with generated types.
- **Alternatives**: MSW (mocks third-party fetch layer, new dependency); stored JSON fixtures (drift
  silently).

## R9. Session cookie policy (groundwork for 2.4)

- **Decision**: `session.ts` defines cookie names and one options builder: `httpOnly: true`,
  `secure: true` in production, `sameSite: 'lax'`, `path: '/'`, `maxAge` from the token expiry.
  Names use the `__Host-` prefix in production (requires Secure, Path=/, no Domain).
- **Rationale**: `SameSite=Lax` keeps normal navigation to the panel working while blocking cross-site
  writes; admin writes additionally need an origin check in 2.4 (recorded in the contract).
- **Open for 2.4**: CSRF origin check design and the refresh-lock mechanism (in-process mutex per
  session is enough for a single Node instance; a shared lock is only needed if Phase 3 scales out).

## R10. Environment configuration (FR-019)

- **Decision**: Nuxt `runtimeConfig` with a private `apiBaseUrl` (server only), supplied by
  `NUXT_API_BASE_URL`. `.env.example` lists names with empty values. `.env` is gitignored and never read
  by tooling in this repo's workflow.
- **Alternatives**: public runtime config (would expose the address to the browser; not needed because
  the browser only talks to the Nuxt server).

## R11. Content-Security-Policy

- **Decision**: `nuxt-security` 2.x with `nonce: true`; `script-src 'self' 'nonce-{{nonce}}' 'strict-dynamic'`
  (no `unsafe-inline`, no `unsafe-eval`), `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `frame-ancestors 'none'`, plus `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
  and the module's defaults (`nosniff`, HSTS).
- **Evidence**: the production HTML carries two executable inline scripts (an import map and
  `window.__NUXT__` config) whose content changes per build, so `script-src 'self'` alone breaks
  hydration and hashes cannot be fixed in advance. Checked in Chrome against the production build:
  every script carries the nonce, Vue mounts, no console violations.
- **Alternatives**: `routeRules` with `'unsafe-inline'` (weaker); defer CSP to 2.3 (gate left open).
- **Cost**: one dependency; `style-src` keeps the module default (`'self' https: 'unsafe-inline'`)
  and is to be tightened when real components exist (2.3).
- **Module defaults left on, to revisit** (found in review): `style-src` keeps `'unsafe-inline'`
  and `font-src`/`upgrade-insecure-requests` come from defaults; the module's per-IP rate limiter
  (150 requests per 5 minutes) is enabled and would count every user behind a reverse proxy as one IP.
  Both are decided with real screens (2.3) and deployment (Phase 3). CORS is disabled explicitly
  (`corsHandler: false`) and covered by a test, because session and admin routes arrive in 2.4.
