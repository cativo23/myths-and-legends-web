# Implementation Plan: Web frontend, session 2.2 (scaffold, generated client, basic CI)

**Branch**: `feat/web-scaffold` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/001-web-frontend/spec.md`. This plan covers only roadmap session 2.2.
Catalog screens (2.3), login UI and admin panel (2.4 to 2.6), docs and fair-use pages (2.7) are out of scope here.

## Summary

Create the Nuxt project, generate a typed API client from a committed OpenAPI snapshot, lay down the
server (Nitro) foundation that later sessions build the session layer on, and add CI that fails on lint,
type, test and client-drift errors. No catalog UI, no login UI.

Requirements advanced: FR-013 (generated client + drift check), FR-019 (environment configuration),
FR-006/FR-012 groundwork (cookie policy and single error layer, as tested units). Everything else waits.

## Decisions taken with Carlos (2026-11-27)

| Topic | Decision |
|---|---|
| Package manager | pnpm, pinned through `packageManager` in `package.json` |
| Client generator | `@hey-api/openapi-ts` (types + SDK over fetch) |
| Unit and component tests | Vitest + `@nuxt/test-utils` + `@vue/test-utils` |
| BFF fixtures | One server module wraps the generated client; tests replace the wrapper with a typed fake |
| Nitro structure | `server/api/auth/*` thin routes, `server/api/admin/[...path]` proxy, logic in `server/utils/*` |
| CI | GitHub Actions: lint, typecheck, tests, client drift. See "CI scope" for the open point |

## Technical Context

**Language/Version**: TypeScript (strict), Node 24 (`.nvmrc`), Nuxt 4 / Vue 3 / Nitro.

**Primary Dependencies**: `nuxt`, `@hey-api/openapi-ts` (dev, generator; the runtime client is generated
code), `vitest`, `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom`, `@nuxt/eslint`, `vue-tsc`.
Exact versions come from the lockfile (constitution, Technical Constraints). Versions resolved on
2026-11-27 are recorded in `research.md`; each dependency gets a one-line justification in the PR.

**Storage**: None. The server layer holds no database (Constitution III). Session lives only in cookies.

**Testing**: Vitest with two projects: `unit` (node, server utils and pure code; the API wrapper takes
its base address as a parameter so it needs no Nuxt context) and `nuxt` (Nuxt environment: components and
server-route tests with `@nuxt/test-utils`, including the health route and the security headers). Playwright and axe arrive with the first screens (2.3) and are not added now.

**Target Platform**: Nuxt server (Node) behind the same site as the page; deployment is Phase 3.

**Project Type**: Web application, single Nuxt project (pages and BFF in one deployable).

**Performance Goals**: None measurable at scaffold level (SC-002 applies from 2.3).

**Constraints**: No secrets committed; API base address from `NUXT_API_BASE_URL`-style runtime config;
`.env` never read; generated code never edited.

**Scale/Scope**: About 15 source files and 4 test files in this session.

## Constitution Check

*GATE: pass before Phase 0; re-checked after Phase 1.*

| Principle | Check | Result |
|---|---|---|
| I. Test-First | Each unit (cookie policy, refresh lock, error mapping, API wrapper, drift check) gets a failing test before code. Tasks order Red before Green. The API is wrapped, third-party code is not mocked. | Pass |
| II. Security-First | Cookie policy (`httpOnly`, `Secure`, `SameSite`) is a tested unit; no tokens in logs, URLs or client state; config from env; CSP and security headers set in Nitro config; CI runs no secret. | Pass |
| III. Minimalism | Only what 2.2 needs. The refresh lock and the admin proxy are NOT built now (see Scope Boundary). No UI library, no state library, no i18n. | Pass |
| IV. Generated Contract | Snapshot committed with its source recorded; generated client in `app/api-client/` marked generated; CI drift check; one error layer created now. | Pass |
| V. Accessible | No pages yet beyond a placeholder. Base `lang`, `main` landmark, theme tokens and reduced-motion only. | Accepted temporary deviation: the axe gate in the end-to-end suite does not exist yet because there is no end-to-end suite; it MUST start with the first real pages in session 2.3 (deadline: before 2.3 merges) |

No violations, so no Complexity Tracking entries.

## Scope Boundary (what 2.2 builds and what it does not)

Carlos chose the `server/api/auth/*` + `utils` + proxy structure. The brief also says "sin pantallas".
To stay minimal (Constitution III) and avoid code without a consumer:

- **Built in 2.2**: the directory structure, `server/utils/apiClient.ts` (the single wrapper), `session.ts`
  (cookie names and options, read and clear helpers), `errors.ts` (the single error layer), runtime
  config, and a `GET /api/health` route that proves the server wiring and is covered by a test.
- **Declared, built in 2.4**: `auth/login`, `auth/refresh`, `auth/logout`, `auth/me`, `refreshLock.ts`
  and the admin guard and proxy. Their contract is written now in `contracts/bff-routes.md` so 2.4 has
  a reviewed target; no empty stub files are committed.

If you prefer the routes and lock built now, say so; it adds about two sessions' worth of tests to 2.2.

## CI scope

Your answer to the CI question arrived with only "Lint + typecheck" selected. The session brief and
FR-013/SC-008 require tests and the drift check, so the plan includes **lint, typecheck, tests and
drift**. `nuxt build` and `pnpm audit` are left out (YAGNI for a scaffold); add them in 2.8 if wanted.
This is the one item to confirm when approving the plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-frontend/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── bff-routes.md    # Phase 1: server routes that 2.4 implements
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
.github/workflows/ci.yml        # lint, typecheck, test, drift
.nvmrc
package.json  pnpm-lock.yaml  pnpm-workspace.yaml
nuxt.config.ts                  # runtimeConfig, security headers, color-mode base
tsconfig.json  eslint.config.mjs  vitest.config.ts
openapi/
├── openapi.json                # committed snapshot (deterministic, sorted keys)
├── SOURCE.md                   # API repo, commit/tag, date, how it was exported
└── openapi-ts.config.ts        # generator config (single place)
app/
├── app.vue                     # placeholder shell, no catalog
├── api-client/                 # GENERATED, committed, never edited (header says so)
└── assets/css/tokens.css       # light/dark tokens from design/mockups/mezcla (names only, no layout)
server/
├── api/health.get.ts           # thin route
└── utils/
    ├── apiClient.ts            # the one wrapper over the generated client
    ├── session.ts              # cookie names + options (httpOnly, Secure, SameSite)
    └── errors.ts               # single API-error to user-message layer (FR-012)
scripts/
└── check-client-drift.mjs      # regenerate to temp dir, compare to committed client
tests/
├── unit/                       # server utils, drift script
└── nuxt/                       # app shell render
```

**Structure Decision**: one Nuxt project; routes are adapters, logic lives in `server/utils/*` so each
unit is small, single-purpose and testable without HTTP (clean code, Constitution I and III).

## Clean-code rules for this session

- One responsibility per module; functions short, named for behavior (`buildSessionCookieOptions`,
  `toUserMessage`), no flag arguments, no commented-out code.
- No duplicated logic: cookie options and error messages are defined once and imported.
- Test names describe behavior (`should_mark_session_cookies_httponly_and_secure`).
- Generated code is excluded from lint and coverage and carries a "do not edit" header.

## Risks and notes

- **Snapshot provenance**: the API has only `v0.1.0`; `v0.2.0` does not exist (session 1.7 pending).
  The snapshot comes from API `develop` at `2bb7341`, whose `info.version` already reads `0.2.0`.
  `openapi/SOURCE.md` records this, and the snapshot is replaced from the `v0.2.0` tag in 2.3.
- **Stale API text**: descriptions and examples still mention Egyptian/Greek mythology (risk 18). They
  flow into generated doc comments only; nothing user-visible uses them. Regenerate after 1.7.
- **Export method**: the snapshot is the full `app.openapi()` schema (public and admin), exported
  with dummy env values and no `.env` read. The export command is recorded in `SOURCE.md`.
- **Tooling majors**: TypeScript 7, ESLint 10 and Vitest 5 are very new; research verifies
  compatibility with `@nuxt/eslint` and `@nuxt/test-utils` at install, falling back one major if needed.
- **Theme**: the "undyed cotton" light theme assumption from the spec is confirmed in 2.3 with real
  screens; 2.2 only ships token names.
