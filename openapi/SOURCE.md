# OpenAPI snapshot provenance

`openapi.json` is the committed snapshot the API client in `app/api-client/` is generated from.
Never edit either by hand: refresh the snapshot, run `pnpm client:generate`, commit both.

| Field | Value |
|---|---|
| API repository | `cativo23/myths-and-legends-api` |
| Source | tag `v0.2.0` at commit `bd05cba` |
| `info.version` in the document | `0.2.0` |
| Exported on | 2026-11-28 |
| Scope | full schema: public and admin routes (31 paths, OpenAPI 3.1.0) |

## How it was exported

No database and no `.env` are needed; the three variables below are dummy values that only satisfy
settings validation. Run from a checkout of the API repository with its pinned requirements installed:

```bash
SECRET_KEY=dummy POSTGRES_PASSWORD=dummy FIRST_SUPERUSER_PASSWORD=dummy \
python -c "import json; from app.main import app; \
print(json.dumps(app.openapi(), indent=2, sort_keys=True))" > openapi.json
```

`app.openapi()` is the unfiltered schema (the API's "admin" document); keys are sorted so diffs are stable.
