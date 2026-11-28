---

description: "Tasks for session 2.2: Nuxt scaffold, generated API client, basic CI"
---

# Tasks: Web frontend, session 2.2 (scaffold, generated client, basic CI)

**Input**: `specs/001-web-frontend/` (plan.md, spec.md, research.md, data-model.md, contracts/bff-routes.md, quickstart.md)

**Prerequisites**: plan approved 2026-11-27. Branch `feat/web-scaffold`.

**Tests**: REQUIRED (Constitution I, Test-First). In every phase the test task comes first and MUST be seen failing for the right reason before its implementation task.

**Organization**: Session 2.2 delivers foundations, not a user story, so phases are by deliverable instead of by story (no `[US]` labels). Each phase maps to the requirements it advances: FR-013/SC-008 (generated contract), FR-006/FR-012/FR-019 (server foundation), CI.

## Format: `[ID] [P?] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- Clean code applies to every task: one responsibility per module, short functions, behavior-named tests, no duplicated logic, no commented-out code.
- One concern per commit; commit message states why (conventional commits).

## Phase 1: Setup (project skeleton)

**Purpose**: a Nuxt project that installs, lints and typechecks, with nothing else in it.

- [ ] T001 Create `package.json` (name, `private`, `type: module`, `packageManager` pinned to the installed pnpm, scripts `dev`, `lint`, `typecheck`, `test`, `client:generate`, `client:check`), `.nvmrc` (Node 24) and `pnpm-workspace.yaml` if pnpm requires it
- [ ] T002 Install dependencies with pnpm and commit `pnpm-lock.yaml`: `nuxt`, `typescript` (6.x, see research R2), `vue-tsc`, `@nuxt/eslint`, `eslint`, `vitest`, `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom`, `@hey-api/openapi-ts` (exact pin); put the one-line justification per dependency in the PR body
- [ ] T003 [P] Create `nuxt.config.ts` (compatibility date, strict TypeScript, `runtimeConfig.apiBaseUrl` server-only from `NUXT_API_BASE_URL`, Nitro security headers and a restrictive Content-Security-Policy) and `tsconfig.json`
- [ ] T004 [P] Create `eslint.config.mjs` via `@nuxt/eslint` with `app/api-client/**` ignored
- [ ] T005 [P] Create `.env.example` (names only, empty values: `NUXT_API_BASE_URL=`) and verify `.env` stays ignored by `.gitignore`
- [ ] T006 [P] Create `app/app.vue` (placeholder shell with `lang`, a landmark and a title; no catalog) and `app/assets/css/tokens.css` (light and dark custom-property names derived from `design/mockups/mezcla/`, honoring `prefers-color-scheme` and `prefers-reduced-motion`)

**Checkpoint**: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck` pass on the skeleton.

---

## Phase 2: Generated contract (FR-013, SC-008)

**Purpose**: the API client exists only as generated output, and CI can prove it has not drifted.

### Tests first

- [ ] T007 Create `vitest.config.ts` with two projects, `unit` (node, `tests/unit/**`) and `nuxt` (`@nuxt/test-utils`, happy-dom, `tests/nuxt/**`), coverage excluding `app/api-client/**`
- [ ] T008 Write `tests/unit/clientDrift.test.ts` with two behaviors: `should_pass_when_generated_client_matches_snapshot` and `should_fail_and_list_files_when_generated_client_was_edited`; run it and confirm it fails because the script does not exist

### Implementation

- [ ] T009 Copy the exported snapshot to `openapi/openapi.json` (sorted keys, two-space indent, trailing newline) from `/tmp/claude-1000/-home-cativo23-projects-personal-myths-and-legends-api/a6102f26-1b57-4c3a-853e-9b92a4a27198/scratchpad/openapi.json`; if that file is gone, re-export it following research R5 (API `develop` at 2bb7341, dummy env values, no `.env` read)
- [ ] T010 [P] Write `openapi/SOURCE.md`: API repo, commit `2bb7341`, `info.version` 0.2.0 and the fact that tag `v0.2.0` does not exist yet (replace in 2.3 from the tag), export date, exact export command, and the stale-example note (API roadmap risk 18)
- [ ] T011 [P] Write `openapi/openapi-ts.config.ts` (input `openapi/openapi.json`, output `app/api-client`, fetch client, a header marking the output as generated and not to be edited); add the `client:generate` script
- [ ] T012 Run `pnpm client:generate` and commit `app/api-client/` as generated output; do not hand-edit any file in it
- [ ] T013 Implement `scripts/check-client-drift.mjs` exposing a pure `compareDirectories(expectedDir, actualDir)` function plus a CLI entry that regenerates into a temp directory and calls it (exit 1 with the differing paths); add the `client:check` script; make T008 pass

**Checkpoint**: `pnpm client:check` exits 0; editing a generated file or `openapi.json` makes it exit 1 (quickstart table).

---

## Phase 3: Server foundation (FR-006, FR-012, FR-019; groundwork for 2.4)

**Purpose**: the three server utilities and a health route that later sessions build on. Scope is limited by plan "Scope Boundary": no login routes, no refresh lock, no admin proxy.

### Tests first (write all, run, confirm each fails for the right reason)

- [ ] T014 [P] Write `tests/unit/session.test.ts`: `should_mark_session_cookies_httponly_and_samesite_lax`, `should_require_secure_cookies_in_production`, `should_use_host_prefix_names_in_production_only`, `should_derive_max_age_from_token_expiry` — cite `data-model.md` `SessionCookies` options and names
- [ ] T015 [P] Write `tests/unit/errors.test.ts`: one test per category — `should_map_422_to_validation_with_field_errors`, `should_map_409_to_conflict`, `should_map_404_to_not_found`, `should_map_401_to_unauthorized`, `should_map_403_to_forbidden`, `should_map_429_to_rate_limit_with_retry_after`, `should_map_5xx_to_server`, `should_map_missing_response_to_network`, `should_map_unknown_status_to_server`, `should_never_include_raw_payload_or_stack_in_message` — cite `data-model.md` `ApiFailure.category`, `ApiFailure.message`, `ApiFailure.retryAfterSeconds`, `ApiFailure.fieldErrors`
- [ ] T016 [P] Write `tests/unit/apiClient.test.ts`: `should_call_the_generated_client_with_the_configured_base_url` and `should_return_a_typed_fake_when_injected` (the fake is typed with generated types so contract changes break compilation) — cite `data-model.md` Runtime configuration `apiBaseUrl`
- [ ] T017 [P] Write `tests/unit/health.test.ts`: `should_respond_ok_without_calling_the_api` for `GET /api/health` using `@nuxt/test-utils` server setup

### Implementation

- [ ] T018 [P] Implement `server/utils/session.ts` (`sessionCookieNames`, `buildSessionCookieOptions`) until T014 passes; no token handling yet
- [ ] T019 [P] Implement `server/utils/errors.ts` (`toUserFacingError` mapping per `data-model.md` `ApiFailure`; messages defined once in a single table) until T015 passes
- [ ] T020 Implement `server/utils/apiClient.ts` as the only module importing `app/api-client/`, reading `apiBaseUrl` from runtime config, exposing an injectable seam for tests, until T016 passes
- [ ] T021 Implement `server/api/health.get.ts` returning `{ status: "ok" }` until T017 passes
- [ ] T022 Add `tests/nuxt/app.test.ts`: `should_render_the_shell_with_language_and_main_landmark`; implement against `app/app.vue` from T006

**Checkpoint**: `pnpm test` is green; `pnpm dev` serves the shell and `curl localhost:3000/api/health` returns `{"status":"ok"}`.

---

## Phase 4: CI (basic)

**Purpose**: the four gates run on every PR to `develop` and `main`.

- [ ] T023 Create `.github/workflows/ci.yml`: triggers `pull_request` to `develop`/`main` and `push` to `develop`/`main`; read-only `permissions: contents: read`; pnpm and Node from `.nvmrc` with a lockfile-keyed cache; jobs `lint`, `typecheck`, `test`, `client-drift` (runs `pnpm client:check`), all using `pnpm install --frozen-lockfile`; no secrets used; `NUXT_API_BASE_URL` not required
- [ ] T024 Verify locally that each CI command exits 0 on the branch and that `client:check` exits 1 after tampering with a generated file (then restore it)

**Checkpoint**: CI runs green on the PR (verified in Phase 5).

---

## Phase 5: Polish, review and delivery

- [ ] T025 [P] Write `README.md` (what the project is, prerequisites, the commands from `quickstart.md`, link to the API repo, the "never edit `app/api-client/`" rule)
- [ ] T026 Run the full `quickstart.md` validation from a clean clone state (`pnpm install --frozen-lockfile`, lint, typecheck, test, `client:check`, dev server, health curl)
- [ ] T027 Review the whole diff for clean code (no duplicated logic, no dead code, no commented-out code, names describe behavior, files single-purpose) and dispatch `superpowers:code-reviewer` on it; apply its valid findings in separate commits
- [ ] T028 Push `feat/web-scaffold`, open a PR to `develop` (title under 70 characters, dependency justifications in the body), wait for green CI and merge
- [ ] T029 Mark session 2.2 done in the API repo's `docs/ROADMAP.md` in a separate PR to its `develop`, recording the decisions and the snapshot provenance, and hand off the prompt for session 2.3 (still blocked by 1.7 on risks 16, 17 and 18)

---

## Dependencies & Execution Order

- Phase 1 blocks everything. T001 then T002; T003 to T006 can run in parallel after T002.
- Phase 2: T007 and T008 first (Red), then T009 to T012, then T013 (Green). T010 and T011 are parallel.
- Phase 3 needs Phase 1 and T007 (Vitest config) and T012 (generated client for T016, T020). T014 to T017 are parallel (Red); T018 and T019 are parallel; T020 follows T012; T021 follows T020 only for runtime-config wiring; T022 follows T006.
- Phase 4 needs the scripts from Phases 1 to 3. Phase 5 needs everything.

## Parallel Example: Phase 3 Red step

```text
Task: "Write tests/unit/session.test.ts"
Task: "Write tests/unit/errors.test.ts"
Task: "Write tests/unit/apiClient.test.ts"
Task: "Write tests/unit/health.test.ts"
```

## Implementation Strategy

1. Skeleton (Phase 1), then the contract and its drift gate (Phase 2), because every later piece depends on the generated types.
2. Server foundation (Phase 3) strictly Red, Green, Refactor per unit.
3. CI (Phase 4) last so it gates a tree that already passes locally.
4. Stop at each checkpoint and run the listed commands before moving on.
5. MVP of this session is Phases 1 to 4; Phase 5 closes it.

## Notes

- Never edit `app/api-client/`; change `openapi/openapi.json` or the generator config and regenerate.
- Do not read `.env`. Do not add routes or code outside the Scope Boundary; raise it first (Constitution III).
- If something unexpected contradicts the spec or plan, stop and ask.
