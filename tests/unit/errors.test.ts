import { describe, expect, it } from 'vitest'
import { toUserFacingError } from '../../server/utils/errors.ts'

describe('toUserFacingError', () => {
  it('should_map_422_to_validation_with_field_errors', () => {
    const error = toUserFacingError({
      status: 422,
      body: { detail: [{ loc: ['body', 'name'], msg: 'Field required', type: 'missing' }] },
    })

    expect(error.category).toBe('validation')
    expect(error.fieldErrors).toEqual({ name: 'Field required' })
  })

  it('should_map_409_to_conflict', () => {
    expect(toUserFacingError({ status: 409 }).category).toBe('conflict')
  })

  it('should_map_404_to_not_found', () => {
    expect(toUserFacingError({ status: 404 }).category).toBe('not_found')
  })

  it('should_map_401_to_unauthorized', () => {
    expect(toUserFacingError({ status: 401 }).category).toBe('unauthorized')
  })

  it('should_map_403_to_forbidden', () => {
    expect(toUserFacingError({ status: 403 }).category).toBe('forbidden')
  })

  it('should_map_429_to_rate_limit_with_retry_after', () => {
    const error = toUserFacingError({
      status: 429,
      body: { detail: { message: 'Too many attempts', type: 'rate_limit_exceeded', retry_after: 42 } },
    })

    expect(error.category).toBe('rate_limit')
    expect(error.retryAfterSeconds).toBe(42)
  })

  it('should_map_5xx_to_server', () => {
    expect(toUserFacingError({ status: 500 }).category).toBe('server')
    expect(toUserFacingError({ status: 503 }).category).toBe('server')
  })

  it('should_map_missing_response_to_network', () => {
    expect(toUserFacingError({}).category).toBe('network')
  })

  it('should_map_unknown_status_to_server', () => {
    expect(toUserFacingError({ status: 418 }).category).toBe('server')
  })

  it('should_never_include_raw_payload_or_stack_in_message', () => {
    const error = toUserFacingError({
      status: 500,
      body: { detail: 'Traceback (most recent call last): File "/code/app/secret.py" id=7f3a' },
    })

    expect(error.message).not.toMatch(/Traceback|secret|\/code\/|7f3a/)
  })
})
