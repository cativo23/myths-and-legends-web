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

// fetch rejects with a TypeError (connection refused, DNS failure) or a DOMException (abort, timeout).
// Anything else is a bug in our own code and must not be disguised as a network problem.
function networkFailureOrThrow(error: unknown): ApiResult<never> {
  if (error === undefined || error instanceof TypeError || error instanceof DOMException) {
    return { ok: false, failure: {} }
  }
  throw error
}

export function createApiClient({ baseUrl, fetch }: ApiClientOptions): ApiClient {
  const client = createClient(createConfig({ baseUrl, fetch }))

  async function call<T>(operation: () => Promise<{ data?: T, error?: unknown, response?: Response }>): Promise<ApiResult<T>> {
    try {
      const { data, error, response } = await operation()
      if (!response) return networkFailureOrThrow(error)
      if (response.ok) return { ok: true, data: data as T }
      return { ok: false, failure: { status: response.status, body: error } }
    }
    catch (error) {
      return networkFailureOrThrow(error)
    }
  }

  return {
    healthCheck: () => call(() => healthCheckApiV1HealthGet({ client })),
  }
}
