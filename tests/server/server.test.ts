import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('server', async () => {
  await setup({ rootDir: fileURLToPath(new URL('../..', import.meta.url)) })

  it('should_render_html_with_a_language_on_first_load', async () => {
    const html = await $fetch<string>('/')

    expect(html).toMatch(/<html[^>]*\slang="en"/)
  })
})
