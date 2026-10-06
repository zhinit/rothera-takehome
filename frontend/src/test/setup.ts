import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom has no animation engine. Visible flash behavior is tested in Chrome.
beforeEach(() => {
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: () => ({ cancel: () => undefined }),
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
