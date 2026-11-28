# Quickstart: validating session 2.2

Prerequisites: Node 24 (`.nvmrc`), pnpm 12. No API instance is needed; nothing here reads `.env`.

```bash
pnpm install --frozen-lockfile
pnpm lint            # ESLint, generated client excluded
pnpm typecheck       # nuxt typecheck
pnpm test            # Vitest: unit + nuxt projects
pnpm client:check    # regenerate to a temp dir and compare with app/api-client/
pnpm dev             # http://localhost:3000 shows the placeholder shell
curl localhost:3000/api/health   # {"status":"ok"}
```

## Expected outcomes

| Check | Expected |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | exit 0 |
| `pnpm client:check` on a clean tree | exit 0 |
| Edit any file in `app/api-client/` or `openapi/openapi.json`, run `pnpm client:check` | exit 1 and the differing files are listed (SC-008) |
| `GET /api/health` | `200 {"status":"ok"}`, no API call made |
| Open a PR to `develop` | the four CI jobs run and pass |

## Regenerating the client

```bash
pnpm client:generate   # overwrites app/api-client/ from openapi/openapi.json
```

To refresh the snapshot itself, follow `openapi/SOURCE.md` (export from an API tag), commit the new
`openapi.json`, then regenerate and commit the client in the same PR.
