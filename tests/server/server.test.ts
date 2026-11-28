import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

describe('server', async () => {
  await setup({ rootDir: fileURLToPath(new URL('../..', import.meta.url)) })

  it('should_render_html_with_a_language_on_first_load', async () => {
    const html = await $fetch<string>('/')

    expect(html).toMatch(/<html[^>]*\slang="en"/)
  })

  it('should_respond_ok_without_calling_the_api', async () => {
    // No API address is configured in tests, so any attempt to reach the API would fail.
    const body = await $fetch('/api/health')

    expect(body).toEqual({ status: 'ok' })
  })

  it('should_send_security_headers_and_a_restrictive_csp', async () => {
    const { headers } = await fetch('/')
    const csp = headers.get('content-security-policy') ?? ''
    const scriptSrc = csp.split(';').map(directive => directive.trim()).find(directive => directive.startsWith('script-src ')) ?? ''

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(scriptSrc).toMatch(/'nonce-[^']+'/)
    expect(scriptSrc).toContain("'strict-dynamic'")
    expect(scriptSrc).not.toContain('unsafe-inline')
    expect(headers.get('x-content-type-options')).toBe('nosniff')
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('x-frame-options')).toBe('DENY')
  })

  it('should_not_allow_cross_origin_reads_of_server_routes', async () => {
    // Session and admin routes arrive in 2.4; they must be same-origin only from the start.
    const { headers } = await fetch('/api/health')

    expect(headers.get('access-control-allow-origin')).toBeNull()
  })
})
