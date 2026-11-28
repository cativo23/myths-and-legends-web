---

description: "Tasks for session 2.2: Nuxt scaffold, generated API client, basic CI"
---

# Tasks: Web frontend, session 2.2 (scaffold, generated client, basic CI)

**Input**: `specs/001-web-frontend/` (plan.md, spec.md, research.md, data-model.md, contracts/bff-routes.md, quickstart.md)

**Prerequisites**: plan approved 2026-11-27; analysis findings C1 to C11 applied 2026-11-27. Branch `feat/web-scaffold`.

**Tests**: REQUIRED (Constitution I, Test-First). In every phase the test task comes first and MUST be seen failing for the right reason before its implementation task. No implementation file exists before its test.

**Organization**: Session 2.2 delivers foundations, not a user story, so phases are by deliverable instead of by story (no `[US]` labels). Each phase maps to the requirements it advances: FR-013/SC-008 (generated contract), FR-006/FR-012/FR-019 (server foundation), FR-014/FR-016 (shell and tokens, base only), CI.

## Format: `[ID] [P?] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- Clean code applies to every task: one responsibility per module, short functions, behavior-named tests, no duplicated logic, no commented-out code.
- One concern per commit; commit message states why (conventional commits).

## Phase 1: Setup (skeleton, test runner, shell)

**Purpose**: a Nuxt project that installs, lints, typechecks and runs tests, with a placeholder shell built test-first.

- [X] T001 Create `package.json` (name, `private`, `type: module`, `packageManager` pinned to the installed pnpm, scripts `dev`, `lint`, `typecheck`, `test`, `client:generate`, `client:check`), `.nvmrc` (Node 24) and `pnpm-workspace.yaml` if pnpm requires it
- [X] T002 Install dependencies with pnpm and commit `pnpm-lock.yaml`: `nuxt`, `typescript` (6.x, research R2), `vue-tsc`, `@nuxt/eslint`, `eslint`, `vitest`, `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom`, `@hey-api/openapi-ts` (exact pin); put the one-line justification per dependency in the PR body
- [X] T003 [P] Create `nuxt.config.ts` (compatibility date, strict TypeScript, `runtimeConfig.apiBaseUrl` server-only from `NUXT_API_BASE_URL`; security headers are added in T023, after their test) and `tsconfig.json`
- [X] T004 [P] Create `eslint.config.mjs` via `@nuxt/eslint` with `app/api-client/**` ignored
- [X] T005 [P] Create `.env.example` (names only, empty values: `NUXT_API_BASE_URL=`) and verify `.env` stays ignored by `.gitignore`
- [X] T006 Create `vitest.config.ts` with three projects, `unit` (node, `tests/unit/**`), `nuxt` (`@nuxt/test-utils`, happy-dom, `tests/nuxt/**`, components) and `server` (node, `tests/server/**`, boots Nuxt and calls it over HTTP), coverage excluding `app/api-client/**`
- [X] T007 Write `tests/nuxt/app.test.ts` (`should_render_a_main_landmark`) and `tests/server/server.test.ts` (`should_render_html_with_a_language_on_first_load`, SSR HTML, because the Nuxt test DOM does not apply `<html lang>`); run them and confirm they fail because `app/app.vue` does not exist
- [X] T008 [P] Create `app/app.vue` (placeholder shell with `lang`, a `main` landmark and a title; no catalog) and `app/assets/css/tokens.css` (light and dark custom-property names derived from `design/mockups/mezcla/`, honoring `prefers-color-scheme` and `prefers-reduced-motion`) until T007 passes

**Checkpoint**: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test` pass.

---

## Phase 2: Generated contract (FR-013, SC-008)

**Purpose**: the API client exists only as generated output, and CI can prove it has not drifted.

### Tests first

- [X] T009 Write `tests/unit/clientDrift.test.ts` against `compareDirectories` using on-disk fixtures in `tests/unit/fixtures/client-drift/` (`base/`, `identical/`, `changed/`): `should_report_no_difference_for_identical_directories`, `should_list_each_file_that_differs_or_is_missing`; plus CLI tests that regenerate for real (`should_fail_and_name_the_file_when_the_committed_client_was_edited`, `should_fail_with_the_regenerate_hint_when_the_committed_client_is_missing`; the passing case is the CI job itself); confirm they fail because the script does not exist

### Implementation

- [X] T010 Copy the exported snapshot to `openapi/openapi.json` (sorted keys, two-space indent, trailing newline); if the temporary export is gone, re-export it following research R5 (API `develop` at 2bb7341, dummy env values, no `.env` read) instead of hand-editing
- [X] T011 [P] Write `openapi/SOURCE.md`: API repo, commit `2bb7341`, `info.version` 0.2.0 and the fact that tag `v0.2.0` does not exist yet (replace in 2.3 from the tag), export date, exact export command, and the stale-example note (API roadmap risk 18)
- [X] T012 [P] Write `openapi/openapi-ts.config.ts` (input `openapi/openapi.json`, output `app/api-client`, fetch client, a header marking the output as generated and not to be edited); add the `client:generate` script
- [X] T013 Run `pnpm client:generate` and commit `app/api-client/` as generated output; do not hand-edit any file in it
- [X] T014 Implement `scripts/clientDrift.ts` (pure `compareDirectories(expectedDir, actualDir)`) and a thin CLI `scripts/check-client-drift.ts`; the CLI regenerates into a temp directory, compares it with the committed client (or `--client-dir`) and exits 1 listing the differing paths; add the `client:check` script; make T009 pass

**Checkpoint**: `pnpm client:check` exits 0; editing a generated file or `openapi.json` makes it exit 1 (quickstart table).

---

## Phase 3: Server foundation (FR-006, FR-012, FR-019; groundwork for 2.4)

**Purpose**: the three server utilities, a health route and the security headers that later sessions build on. Scope is limited by plan "Scope Boundary": no login routes, no refresh lock, no admin proxy.

### Tests first (write all, run, confirm each fails for the right reason)

- [X] T015 [P] Write `tests/unit/session.test.ts`: `should_mark_session_cookies_httponly_and_samesite_lax`, `should_require_secure_cookies_in_production`, `should_use_host_prefix_names_in_production_only`, `should_derive_max_age_from_token_expiry`
- [X] T016 [P] Write `tests/unit/errors.test.ts`, one test per category: `should_map_422_to_validation_with_field_errors`, `should_map_409_to_conflict`, `should_map_404_to_not_found`, `should_map_401_to_unauthorized`, `should_map_403_to_forbidden`, `should_map_429_to_rate_limit_with_retry_after`, `should_map_5xx_to_server`, `should_map_missing_response_to_network`, `should_map_unknown_status_to_server`, `should_never_include_raw_payload_or_stack_in_message`. For 429, read `detail.retry_after` as the only shape (no adapter for the default-limit `{"error": ...}` body, Constitution IV and FR-018); reconfirm against the API after session 1.7
- [X] T017 [P] Write `tests/unit/apiClient.test.ts`: `should_call_the_api_at_the_given_base_url`, `should_return_the_data_when_the_api_answers_successfully`, `should_return_status_and_body_when_the_api_answers_with_an_error`, `should_return_a_failure_without_status_when_the_network_is_down` (the wrapper normalizes outcomes into the `ApiFailure` input of the error layer; `ApiClient` is an interface so consumers can be given a fake typed with it). The wrapper takes `baseUrl` as a parameter; it never reads Nuxt runtime config itself
- [X] T018 [P] Extend `tests/server/server.test.ts` (the `server` project): `should_respond_ok_without_calling_the_api` for `GET /api/health`, and `should_send_security_headers_and_a_restrictive_csp` (checks the headers and CSP of that response)

### Implementation

- [X] T019 [P] Implement `server/utils/session.ts` (`sessionCookieNames`, `buildSessionCookieOptions`) until T015 passes, per `data-model.md` `SessionCookies` (cookie names, `httpOnly`, `secure`, `sameSite`, `path`, `maxAge`); no token handling yet
- [X] T020 [P] Implement `server/utils/errors.ts` (`toUserFacingError`, messages defined once in a single table) until T016 passes, per `data-model.md` `UserFacingError.category`, `UserFacingError.message`, `UserFacingError.retryAfterSeconds` and `UserFacingError.fieldErrors`
- [X] T021 Implement `server/utils/apiClient.ts` as the only module importing `app/api-client/`, with `baseUrl` as a parameter and an injectable seam for tests, until T017 passes, per `data-model.md` Runtime configuration `apiBaseUrl`
- [X] T022 Implement `server/api/health.get.ts` returning `{ status: "ok" }` without calling the API; makes the health test of T018 pass
- [X] T023 Add the security headers and a restrictive, nonce-based Content-Security-Policy with the `nuxt-security` module in `nuxt.config.ts` (decision 2026-11-27: Nuxt's inline import map and runtime-config scripts make a plain `routeRules` CSP either break hydration or need `unsafe-inline`); verified in a real browser against the production build; makes the headers test of T018 pass

**Checkpoint**: `pnpm test` is green; `pnpm dev` serves the shell and `curl localhost:3000/api/health` returns `{"status":"ok"}`.

---

## Phase 4: CI (basic)

**Purpose**: the four gates run on every PR to `develop` and `main`.

- [X] T024 Create `.github/workflows/ci.yml`: triggers `pull_request` to `develop`/`main` and `push` to `develop`/`main`; read-only `permissions: contents: read`; pnpm and Node from `.nvmrc` with a lockfile-keyed cache; jobs `lint`, `typecheck`, `test`, `client-drift` (runs `pnpm client:check`), all using `pnpm install --frozen-lockfile`; no secrets used; `NUXT_API_BASE_URL` not required
- [X] T025 Verify locally that each CI command exits 0 on the branch and that `client:check` exits 1 after tampering with a generated file (then restore it)

**Checkpoint**: CI runs green on the PR (verified in Phase 5).

---

## Phase 5: Polish, review and delivery

- [X] T026 [P] Write `README.md` (what the project is, prerequisites, the commands from `quickstart.md`, link to the API repo, the "never edit `app/api-client/`" rule)
- [X] T027 Run the full `quickstart.md` validation from a clean clone state (`pnpm install --frozen-lockfile`, lint, typecheck, test, `client:check`, dev server, health curl)
- [X] T028 Review the whole diff for clean code (no duplicated logic, no dead code, no commented-out code, names describe behavior, files single-purpose) and dispatch `superpowers:code-reviewer` on it; apply its valid findings in separate commits
- [X] T029 Push `feat/web-scaffold`, open a PR to `develop` (title under 70 characters, dependency justifications in the body), wait for green CI and merge
- [X] T030 Mark session 2.2 done in the API repo's `docs/ROADMAP.md` in a separate PR to its `develop`, recording the decisions and the snapshot provenance, and hand off the prompt for session 2.3 (still blocked by 1.7 on risks 16, 17 and 18)

---

## Dependencies & Execution Order

- Phase 1: T001, then T002; T003, T004, T005 are parallel after T002; T006 follows T002; T007 (Red) follows T003 and T006; T008 follows T007.
- Phase 2 needs T006. T009 (Red) first, then T010 to T013, then T014 (Green). T011 and T012 are parallel.
- Phase 3 needs Phase 1 and T013 (generated types for T017 and T021). T015 to T018 are parallel (Red). T019 and T020 are parallel; T021 follows T013; T022 and T023 follow T018 and are independent of T021 (health makes no API call).
- Phase 4 needs the scripts from Phases 1 to 3. Phase 5 needs everything.

## Parallel Example: Phase 3 Red step

```text
Task: "Write tests/unit/session.test.ts"
Task: "Write tests/unit/errors.test.ts"
Task: "Write tests/unit/apiClient.test.ts"
Task: "Extend tests/server/server.test.ts"
```

## Implementation Strategy

1. Skeleton, test runner and shell (Phase 1), then the contract and its drift gate (Phase 2), because every later piece depends on the generated types.
2. Server foundation (Phase 3) strictly Red, Green, Refactor per unit.
3. CI (Phase 4) last so it gates a tree that already passes locally.
4. Stop at each checkpoint and run the listed commands before moving on.
5. MVP of this session is Phases 1 to 4; Phase 5 closes it.

## Notes

- Never edit `app/api-client/`; change `openapi/openapi.json` or the generator config and regenerate.
- Do not read `.env`. Do not add routes or code outside the Scope Boundary; raise it first (Constitution III).
- If something unexpected contradicts the spec or plan, stop and ask.

---

## Phase 6: Convergence

- [X] T031 Mark T029 and T030 as done in `specs/001-web-frontend/tasks.md`, since web PR #2 and API PR #90 are merged per T029 and T030 (partial)
- [X] T032 Replace the stale `check-client-drift.mjs` references with `scripts/check-client-drift.ts` and `scripts/clientDrift.ts` in `specs/001-web-frontend/plan.md` and `specs/001-web-frontend/research.md` per plan: Source Code (partial)
- [X] T033 Rewrite the "CI scope" section of `specs/001-web-frontend/plan.md` as a decision taken (lint, typecheck, tests and drift; build and audit deferred) instead of an open point per plan: CI scope (partial)
- [X] T034 Align `specs/001-web-frontend/data-model.md` with the code: `ApiFailure` is the input of the error layer and `UserFacingError` its output (partial)
- [X] T035 Record in `specs/001-web-frontend/plan.md` Scope Boundary that `ApiClient.healthCheck` is the only exposed operation and is kept to give the wrapper a consumer until session 2.4 per plan: Scope Boundary (unrequested)
