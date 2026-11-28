import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '../../server/utils/apiClient.ts'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('createApiClient', () => {
  it('should_call_the_api_at_the_given_base_url', async () => {
    const fetchSpy = vi.fn(async () => jsonResponse({ status: 'ok' }))
    const api = createApiClient({ baseUrl: 'http://api.test', fetch: fetchSpy })

    await api.healthCheck()

    const request = (fetchSpy.mock.calls[0] as unknown as [Request])[0]
    expect(request.url).toBe('http://api.test/api/v1/health')
  })

  it('should_return_the_data_when_the_api_answers_successfully', async () => {
    const api = createApiClient({ baseUrl: 'http://api.test', fetch: async () => jsonResponse({ status: 'ok' }) })

    expect(await api.healthCheck()).toEqual({ ok: true, data: { status: 'ok' } })
  })

  it('should_return_status_and_body_when_the_api_answers_with_an_error', async () => {
    const body = { detail: 'nope' }
    const api = createApiClient({ baseUrl: 'http://api.test', fetch: async () => jsonResponse(body, 503) })

    expect(await api.healthCheck()).toEqual({ ok: false, failure: { status: 503, body } })
  })

  it('should_return_a_failure_without_status_when_the_network_is_down', async () => {
    const api = createApiClient({
      baseUrl: 'http://api.test',
      fetch: async () => {
        throw new TypeError('fetch failed')
      },
    })

    expect(await api.healthCheck()).toEqual({ ok: false, failure: {} })
  })

  it('should_return_status_and_text_body_when_the_error_is_not_json', async () => {
    const html = '<html>Bad Gateway</html>'
    const api = createApiClient({
      baseUrl: 'http://api.test',
      fetch: async () => new Response(html, { status: 502, headers: { 'content-type': 'text/html' } }),
    })

    expect(await api.healthCheck()).toEqual({ ok: false, failure: { status: 502, body: html } })
  })

  it('should_not_hide_programming_errors_as_network_failures', async () => {
    const api = createApiClient({
      baseUrl: 'http://api.test',
      fetch: async () => {
        throw new RangeError('bug in our code')
      },
    })

    await expect(api.healthCheck()).rejects.toThrow('bug in our code')
  })
})
