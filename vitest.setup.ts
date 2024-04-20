import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from './src/mocks/server'

global.console = {
  log: vi.fn(),
} as unknown as Console

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
