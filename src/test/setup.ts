import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../../test/mocks/server'

// Global MSW lifecycle for every test file: start the mock server once,
// reset per-test handlers added via `server.use(...)` after each test so
// they don't leak across tests, and tear the server down at the end.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
