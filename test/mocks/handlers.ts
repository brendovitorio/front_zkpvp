import type { RequestHandler } from 'msw'
import { http, HttpResponse } from 'msw'

/**
 * Default MSW request handlers shared across the whole test suite.
 *
 * This array intentionally starts empty: it is a shared seam, not a place
 * for endpoint-specific fixtures. Individual test files register their own
 * handlers per-test via `server.use(...)` (see `test/mocks/server.ts`) and
 * MSW resets back to this baseline after every test. Add a handler here only
 * if a response is needed by default across most/all tests; prefer
 * `server.use` in the test file that actually needs a given endpoint mocked.
 */
export const handlers: RequestHandler[] = []

export { http, HttpResponse }
