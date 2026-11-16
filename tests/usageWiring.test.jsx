// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

const trackEvent = vi.fn()
vi.mock('../src/utils/usage.js', () => ({ trackEvent: (...args) => trackEvent(...args), USAGE_EVENTS: [] }))

afterEach(() => {
  cleanup()
  trackEvent.mockClear()
})

it('counts one visit per tab session when the app loads, and nothing else', async () => {
  const { default: App } = await import('../src/App.jsx')
  render(<App />)
  expect(trackEvent).toHaveBeenCalledWith('visit', { once: true })
  expect(trackEvent).toHaveBeenCalledTimes(1)
})
