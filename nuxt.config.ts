export default defineNuxtConfig({
  compatibilityDate: '2026-11-27',
  modules: ['@nuxt/eslint', 'nuxt-security'],
  css: ['~/assets/css/tokens.css'],
  devtools: { enabled: false },
  telemetry: false,
  typescript: { strict: true },
  security: {
    // Nuxt renders inline scripts (import map, runtime config); a per-request nonce
    // lets script-src stay strict without 'unsafe-inline'.
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', '\'nonce-{{nonce}}\'', '\'strict-dynamic\''],
        'object-src': ['\'none\''],
        'base-uri': ['\'self\''],
        'frame-ancestors': ['\'none\''],
      },
      xFrameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
  },
  runtimeConfig: {
    // Server only: the browser talks to this Nuxt server, never to the API directly.
    apiBaseUrl: '', // set by NUXT_API_BASE_URL
  },
})
