export type ErrorCategory =
  | 'validation'
  | 'conflict'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limit'
  | 'server'
  | 'network'

/** What the API wrapper reports when a call fails; no status means no response arrived. */
export interface ApiFailure {
  status?: number
  body?: unknown
}

export interface UserFacingError {
  category: ErrorCategory
  message: string
  retryAfterSeconds?: number
  fieldErrors?: Record<string, string>
}

// The single place where user-facing error text lives (FR-012). Never put API payload text here.
const MESSAGES: Record<ErrorCategory, string> = {
  validation: 'Some fields are not valid. Check them and try again.',
  conflict: 'That name is already taken.',
  not_found: 'We could not find what you were looking for.',
  unauthorized: 'Your session has ended. Sign in again to continue.',
  forbidden: 'You do not have permission to do that.',
  rate_limit: 'Too many attempts. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again later.',
  network: 'We could not reach the service. Check your connection and try again.',
}

const STATUS_CATEGORIES: Record<number, ErrorCategory> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation',
  429: 'rate_limit',
}

function categoryOf({ status }: ApiFailure): ErrorCategory {
  if (status === undefined) return 'network'
  return STATUS_CATEGORIES[status] ?? 'server'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** The field a validation item points at: loc is ["body", "<field>", ...], so drop the source segment. */
function fieldNameOf(item: unknown): string | undefined {
  if (!isRecord(item) || !Array.isArray(item.loc)) return undefined
  const name = item.loc.slice(1).join('.')
  return name === '' ? undefined : name
}

// The field message is the API's own validation text for that field (for example "Field required"),
// shown next to the input; it is the one piece of API text allowed through, and only for validation.
function fieldErrorsOf(body: unknown): Record<string, string> {
  const details = isRecord(body) && Array.isArray(body.detail) ? body.detail : []
  const fieldErrors: Record<string, string> = {}

  for (const item of details) {
    const name = fieldNameOf(item)
    const message = isRecord(item) ? item.msg : undefined
    if (name !== undefined && typeof message === 'string' && !(name in fieldErrors)) {
      fieldErrors[name] = message
    }
  }

  return fieldErrors
}

function retryAfterSecondsOf(body: unknown): number | undefined {
  if (!isRecord(body) || !isRecord(body.detail)) return undefined
  const { retry_after: retryAfter } = body.detail
  return typeof retryAfter === 'number' && retryAfter > 0 ? retryAfter : undefined
}

export function toUserFacingError(failure: ApiFailure): UserFacingError {
  const category = categoryOf(failure)
  const error: UserFacingError = { category, message: MESSAGES[category] }

  if (category === 'validation') error.fieldErrors = fieldErrorsOf(failure.body)
  if (category === 'rate_limit') error.retryAfterSeconds = retryAfterSecondsOf(failure.body)

  return error
}
