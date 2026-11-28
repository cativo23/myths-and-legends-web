# Contract: BFF routes (Nitro server)

The browser talks only to these routes; the API address is never exposed to it. Routes are thin
adapters; logic lives in `server/utils/*`. **Only `GET /api/health` is built in 2.2.** The rest are the
reviewed target for 2.4 (login and session) and 2.5/2.6 (admin writes).

| Route | Session 2.2 | Purpose | Success | Failures |
|---|---|---|---|---|
| `GET /api/health` | built | Proves server wiring; no API call | `200 {"status":"ok"}` | none |
| `POST /api/auth/login` | 2.4 | Email and password to API login; set both cookies | `204`, cookies set | `401` generic message; `429` with wait time; `403` non-admin |
| `POST /api/auth/refresh` | 2.4 | Renew session using the refresh cookie, **serialized per session** | `204`, cookies rotated | `401` session ended, cookies cleared |
| `POST /api/auth/logout` | 2.4 | Revoke refresh token at the API; clear cookies | `204` | cookies cleared even if the API call fails |
| `GET /api/auth/me` | 2.4 | Current admin identity for the shell | `200 {id,email,is_superuser}` | `401` |
| `ALL /api/admin/[...path]` | 2.5 | Admin guard, then forward to the API with the admin's own access token; transparent refresh on `401` | API response | mapped by the single error layer |

## Invariants (tests required where the route exists)

1. Tokens are only ever in `httpOnly` cookies; no response body or header returns a token to the page.
2. Every admin route checks the session server-side before forwarding; anonymous and non-admin get
   `401`/`403` without reaching the API.
3. Concurrent refreshes for the same session run once; waiting callers reuse the rotated result
   (the API's refresh token is single-use, one session per user).
4. State-changing routes reject requests whose `Origin` does not match the site (CSRF defense on top of
   `SameSite=Lax`).
5. Error responses use the `UserFacingError` shape from `data-model.md` and never include raw API
   payloads, stack traces or internal ids.
