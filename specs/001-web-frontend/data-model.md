# Data Model: session 2.2

The server layer has no database (Constitution III). The only "data" this session defines are the
in-memory shapes used by the server utilities. API entities (entities, relations, reference data) are
**not** modeled by hand: they are the generated types in `app/api-client/`.

## SessionCookies (server-side, set in 2.4, defined in 2.2)

| Name | Holds | Lifetime | Readable by page scripts |
|---|---|---|---|
| access cookie | API access token | until `expires_at` returned by the API | No (`httpOnly`) |
| refresh cookie | API refresh token (single-use, rotated) | refresh token lifetime | No (`httpOnly`) |

Options (one builder, `buildSessionCookieOptions`): `httpOnly`, `secure` (production), `sameSite: lax`,
`path: /`, `maxAge` (seconds, derived from the token expiry). Names carry the `__Host-` prefix in production. Tokens never appear in logs, URLs, client
state or error messages.

## ApiFailure (single error layer, `errors.ts`)

Input: anything thrown or returned by the API wrapper. Output: a `UserFacingError`.

| Field | Meaning |
|---|---|
| `category` | `validation`, `conflict`, `not_found`, `forbidden`, `unauthorized`, `rate_limit`, `server`, `network` (FR-012) |
| `message` | Plain, non-technical text; never contains the raw payload, stack, path or internal id |
| `retryAfterSeconds` | Present only for `rate_limit` when the API supplies it |
| `fieldErrors` | Present only for `validation`: field name to message, for display next to the field |

Rules: every status maps to exactly one category; unknown statuses fall to `server`; a missing response
(connection failure, timeout) maps to `network`. Because the API's two 429 shapes will be unified before
2.3 (FR-018), the mapper reads one shape and has no adapter for the other.

## Runtime configuration

| Key | Visibility | Source |
|---|---|---|
| `apiBaseUrl` | server only | `NUXT_API_BASE_URL` |

## Generated client (not hand-written)

Derived from `openapi/openapi.json`; changes only by regenerating. Provenance in `openapi/SOURCE.md`.
