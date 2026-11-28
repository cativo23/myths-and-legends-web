import { createClient, createConfig } from '../../app/api-client/client'
import { healthCheckApiV1HealthGet } from '../../app/api-client'
import type { ApiFailure } from './errors.ts'

export type ApiResult<T> = { ok: true, data: T } | { ok: false, failure: ApiFailure }

/** The only surface the server code uses to talk to the API; tests replace it with a typed fake. */
export interface ApiClient {
  healthCheck: () => Promise<ApiResult<unknown>>
}

export interface ApiClientOptions {
  baseUrl: string
  fetch?: typeof globalThis.fetch
}

export function createApiClient({ baseUrl, fetch }: ApiClientOptions): ApiClient {
  const client = createClient(createConfig({ baseUrl, fetch }))

  async function call<T>(operation: () => Promise<{ data?: T, error?: unknown, response?: Response }>): Promise<ApiResult<T>> {
    try {
      const { data, error, response } = await operation()
      if (!response) return { ok: false, failure: {} }
      if (response.ok) return { ok: true, data: data as T }
      return { ok: false, failure: { status: response.status, body: error } }
    }
    catch {
      // fetch rejected: no response arrived (connection refused, DNS failure, timeout).
      return { ok: false, failure: {} }
    }
  }

  return {
    healthCheck: () => call(() => healthCheckApiV1HealthGet({ client })),
  }
}
