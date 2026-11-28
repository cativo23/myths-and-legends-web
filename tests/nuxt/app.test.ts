import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

describe('app shell', () => {
  it('should_render_a_main_landmark', async () => {
    const wrapper = await mountSuspended(App)

    expect(wrapper.find('main').exists()).toBe(true)
  })
})
