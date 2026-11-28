import { defineConfig } from '@hey-api/openapi-ts'

// The only place that decides how the API client is generated.
// Input is the committed snapshot; output is never edited by hand.
export default defineConfig({
  input: './openapi/openapi.json',
  output: './app/api-client',
  plugins: ['@hey-api/client-fetch'],
})
