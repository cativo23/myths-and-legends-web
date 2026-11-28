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

  it('should_keep_the_first_message_when_a_field_has_several_errors', () => {
    const error = toUserFacingError({
      status: 422,
      body: {
        detail: [
          { loc: ['body', 'password'], msg: 'Too short', type: 'string_too_short' },
          { loc: ['body', 'password'], msg: 'Needs a digit', type: 'value_error' },
        ],
      },
    })

    expect(error.fieldErrors).toEqual({ password: 'Too short' })
  })

  it('should_join_nested_field_locations_with_dots', () => {
    const error = toUserFacingError({
      status: 422,
      body: { detail: [{ loc: ['body', 'location', 'department'], msg: 'Invalid', type: 'enum' }] },
    })

    expect(error.fieldErrors).toEqual({ 'location.department': 'Invalid' })
  })

  it('should_skip_malformed_validation_items_instead_of_throwing', () => {
    const error = toUserFacingError({
      status: 422,
      body: { detail: [{ msg: 'no location' }, { loc: 'body', msg: 'bad loc' }, null, { loc: ['body', 'name'], msg: 'Field required' }] },
    })

    expect(error.fieldErrors).toEqual({ name: 'Field required' })
  })

  it('should_skip_root_level_validation_errors_that_name_no_field', () => {
    const error = toUserFacingError({ status: 422, body: { detail: [{ loc: ['body'], msg: 'Bad body', type: 'x' }] } })

    expect(error.fieldErrors).toEqual({})
  })

  it('should_leave_field_errors_empty_when_a_422_detail_is_plain_text', () => {
    const error = toUserFacingError({ status: 422, body: { detail: 'Something custom' } })

    expect(error.category).toBe('validation')
    expect(error.fieldErrors).toEqual({})
  })

  it('should_ignore_a_retry_after_that_is_not_a_positive_number', () => {
    for (const retry_after of [0, -5, 'soon', null]) {
      const error = toUserFacingError({ status: 429, body: { detail: { retry_after } } })

      expect(error.retryAfterSeconds).toBeUndefined()
    }
  })

  it('should_only_expose_field_errors_for_validation_and_retry_after_for_rate_limit', () => {
    const body = { detail: [{ loc: ['body', 'x'], msg: 'm' }], retry: 1 }

    expect(toUserFacingError({ status: 409, body })).not.toHaveProperty('fieldErrors')
    expect(toUserFacingError({ status: 500, body })).not.toHaveProperty('retryAfterSeconds')
  })

  it('should_never_leak_a_poisoned_body_for_any_status', () => {
    const body = { detail: 'Traceback /code/app/secret.py id=7f3a', error: 'Traceback /code/app/secret.py' }

    for (const status of [undefined, 401, 403, 404, 409, 418, 429, 500, 502, 503]) {
      const { message } = toUserFacingError({ status, body })

      expect(message).not.toMatch(/Traceback|secret|\/code\/|7f3a/)
    }
  })
})
