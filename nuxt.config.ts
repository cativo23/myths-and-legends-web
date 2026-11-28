export default defineNuxtConfig({
  compatibilityDate: '2026-11-27',
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/tokens.css'],
  devtools: { enabled: false },
  telemetry: false,
  typescript: { strict: true },
  runtimeConfig: {
    // Server only: the browser talks to this Nuxt server, never to the API directly.
    apiBaseUrl: '', // set by NUXT_API_BASE_URL
  },
})
