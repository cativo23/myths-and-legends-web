export interface SessionCookieNames {
  access: string
  refresh: string
}

export interface SessionCookieOptions {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
}

// The __Host- prefix makes browsers reject a cookie that is not Secure, has a Domain or a Path other than "/".
// It requires Secure, so it is only usable in production (HTTPS).
export function sessionCookieNames(isProduction: boolean): SessionCookieNames {
  const prefix = isProduction ? '__Host-' : ''
  return { access: `${prefix}myl-access`, refresh: `${prefix}myl-refresh` }
}

export function buildSessionCookieOptions(
  { isProduction, maxAgeSeconds }: { isProduction: boolean, maxAgeSeconds: number },
): SessionCookieOptions {
  return { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: maxAgeSeconds }
}

/** Whole seconds from `now` until `expiresAt`, never negative. `now` is injected so the clock can be faked. */
export function secondsUntil(expiresAt: string, now: Date = new Date()): number {
  const seconds = Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000)
  return Math.max(0, seconds)
}
