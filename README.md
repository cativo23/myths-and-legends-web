# Myths and Legends web

Frontend for [The API of Myths and Legends](https://github.com/cativo23/myths-and-legends-api): a public
catalog of Salvadoran myths and legends and an admin panel to maintain the data. Nuxt 4, with a thin
Nitro server layer that will hold the admin session in `httpOnly` cookies.

Work follows Spec-Driven Development with GitHub Spec Kit: the spec, plan and tasks live in
`specs/`, and the project rules in `.specify/memory/constitution.md`.

## Requirements

Node 24 (`.nvmrc`) and pnpm (version pinned in `package.json`).

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev             # http://localhost:3000
pnpm lint
pnpm typecheck
pnpm test            # unit, component and server (HTTP) tests
pnpm client:check    # fails if the generated API client differs from the OpenAPI snapshot
pnpm client:generate # regenerate the client from openapi/openapi.json
```

## Configuration

Copy `.env.example` to `.env` and set `NUXT_API_BASE_URL` (server only). Never commit `.env`.

## Generated API client

`app/api-client/` is generated from `openapi/openapi.json` and **must never be edited by hand**; CI fails
when it drifts. To update it, refresh the snapshot (see `openapi/SOURCE.md`), run `pnpm client:generate`
and commit both.
