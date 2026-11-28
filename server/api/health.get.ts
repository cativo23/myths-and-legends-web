// Liveness of this server only; it deliberately does not call the API.
export default defineEventHandler(() => ({ status: 'ok' }))
