# Myths and Legends Web Constitution

This constitution governs the web frontend. It mirrors the three principles of the API's constitution
(`myths-and-legends-api`) and adds frontend-specific ones. If the two ever conflict, the API's contract
(its OpenAPI document at a tagged release) wins over this repository's assumptions.

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

Every behavior change follows Red → Green → Refactor.

- A failing test that describes the desired behavior MUST exist, and be seen failing for the
  right reason, before any implementation code is written.
- Each test MUST cover one behavior, not one component, and its name MUST describe that behavior
  (e.g. `should_keep_form_input_when_session_expires`).
- A bug fix MUST start with a test that reproduces the bug.
- External dependencies (the API, the clock, storage) MUST be wrapped and the wrapper mocked;
  third-party code MUST NOT be mocked directly.

Rationale: the frontend is the only consumer of the API's contract; regressions must be caught by
tests, not by users.

### II. Security-First

- Session credentials MUST live only in `httpOnly`, `Secure`, `SameSite` cookies managed by the
  frontend's server layer; they MUST NOT appear in `localStorage`, `sessionStorage`, the page
  bundle, client-side state, logs, URLs or error messages.
- Secrets and the API address MUST come from environment configuration; none is committed
  (`.env` is never read or committed).
- All external input (forms, query strings, route params, API responses, uploaded files) MUST be
  validated at the boundary where it enters; user-provided text MUST be rendered as text, never as
  markup.
- Admin routes and admin server routes MUST check the session server-side; hiding a button is not
  authorization. Every admin write is made with the administrator's own session.
- Error messages shown to users MUST NOT expose stack traces, internal ids, file paths or raw API
  payloads.
- Defaults MUST be secure: HTTPS in production, a restrictive Content-Security-Policy, and the
  server layer runs as a non-root user.

Rationale: the panel can change public data; its credentials are the project's most valuable
secret on the client side.

### III. Minimalism (YAGNI)

- The smallest viable solution MUST be chosen first; complexity is added only when the simple
  approach demonstrably fails.
- Abstractions, configuration, feature flags and dependencies for hypothetical needs MUST NOT be
  added. Three similar lines are preferred over a premature abstraction. Every new dependency
  needs a one-line justification in the PR.
- Work that exceeds the scope of the current spec MUST be raised with the maintainer before it
  is done.
- Unused code MUST be deleted; no compatibility shims for internal code.
- The server layer MUST NOT hold business logic or a database; it only manages the session and
  forwards calls to the API.

Rationale: a single-maintainer project survives on small, reviewable, reversible changes.

### IV. Generated Contract, Never Hand-Written

- The API client and its types MUST be generated from the API's OpenAPI document and MUST NOT be
  edited by hand.
- The OpenAPI snapshot used for generation MUST be committed, tied to an API release tag, and CI
  MUST fail when the generated client differs from the snapshot.
- API errors MUST go through one single error-handling layer; components MUST NOT interpret raw
  status codes or response bodies on their own.
- The frontend MUST NOT carry adapters for known API inconsistencies; they are fixed in the API
  and the client is regenerated. A deviation requires an amendment to the active spec.

Rationale: one source of truth for the contract prevents silent drift between the repositories.

### V. Accessible by Requirement

- Every page MUST meet WCAG 2.1 AA: contrast, keyboard operation, visible focus, text
  alternatives, labelled form fields with associated errors, and reduced-motion support.
- Light and dark themes MUST follow the system preference.
- Automated accessibility checks MUST run in the end-to-end suite and a serious or critical
  violation MUST fail the build; keyboard-only journeys are part of the end-to-end tests.
- The interface MUST work from phone width upward.

Rationale: accessibility that is not tested regresses; making it a gate keeps it honest.

## Technical Constraints

- Framework and tooling are chosen in the plan of each feature; exact versions are governed by
  the lockfile, not by this document.
- The full test suite MUST be green before a branch is merged; no merge with failing or
  skipped-to-pass tests.
- The public catalog is keyless and read-only; an API-key tier is out of scope unless the API's
  constitution is amended.

## Workflow

- Spec-Driven Development with GitHub Spec Kit: specify → clarify → plan → tasks → analyze →
  implement → converge. Every plan passes the Constitution Check against this document.
- Conventional commits (`type(scope): description`), one concern per commit, focused on why.
- Branches are `type/short-description`; `develop` requires 1 review and green CI; PR titles are
  imperative and under 70 characters. The repository has its own tags and versions.
- Roadmap sessions for the frontend (2.1 to 2.8) live in the API repository's `docs/ROADMAP.md`
  until the maintainer decides otherwise.

## Governance

This constitution supersedes other practices in this repository. Amendments require a pull
request that states the change, its reason and the date, and updates the version below.

**Version**: 1.0.0 | **Ratified**: 2026-11-25 | **Last Amended**: 2026-11-25
