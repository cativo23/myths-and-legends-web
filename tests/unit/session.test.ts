import { describe, expect, it } from 'vitest'
import { buildSessionCookieOptions, secondsUntil, sessionCookieNames } from '../../server/utils/session.ts'

describe('session cookie policy', () => {
  it('should_mark_session_cookies_httponly_and_samesite_lax', () => {
    const options = buildSessionCookieOptions({ isProduction: false, maxAgeSeconds: 60 })

    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' })
  })

  it('should_require_secure_cookies_in_production', () => {
    expect(buildSessionCookieOptions({ isProduction: true, maxAgeSeconds: 60 }).secure).toBe(true)
    expect(buildSessionCookieOptions({ isProduction: false, maxAgeSeconds: 60 }).secure).toBe(false)
  })

  it('should_use_host_prefix_names_in_production_only', () => {
    expect(sessionCookieNames(true)).toEqual({ access: '__Host-myl-access', refresh: '__Host-myl-refresh' })
    expect(sessionCookieNames(false)).toEqual({ access: 'myl-access', refresh: 'myl-refresh' })
  })

  it('should_derive_max_age_from_token_expiry', () => {
    const now = new Date('2026-11-27T12:00:00Z')

    expect(secondsUntil('2026-11-27T12:15:00Z', now)).toBe(900)
  })

  it('should_never_return_a_negative_max_age_for_an_expired_token', () => {
    const now = new Date('2026-11-27T12:00:00Z')

    expect(secondsUntil('2026-11-27T11:00:00Z', now)).toBe(0)
  })
})
