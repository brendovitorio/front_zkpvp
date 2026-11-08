import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Shared MSW server instance for the Vitest (jsdom) environment.
 *
 * Wired into the global test setup (`src/test/setup.ts`) with the standard
 * listen/resetHandlers/close lifecycle. Any test that calls `fetch` against
 * the API should add its own handlers with `server.use(...)` rather than
 * mutating `handlers` directly — resetHandlers() after each test restores
 * this baseline automatically.
 */
export const server = setupServer(...handlers)
