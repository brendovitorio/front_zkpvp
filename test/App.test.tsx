import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import App from '../src/App'
import { http, HttpResponse } from './mocks/handlers'
import { server } from './mocks/server'

describe('App', () => {
  test('renders nav with all top-level links', () => {
    // App now wraps everything in AuthProvider, which fetches GET /auth/me
    // on mount; mock it logged-out so this unrelated test doesn't hit an
    // unhandled request (server.listen is configured with onUnhandledRequest:
    // 'error' in src/test/setup.ts).
    // `/` now renders the real Home page (Task 22), which fetches
    // GET /api/server-status and GET /api/home-stats on mount; mock both
    // with simple fixed responses for the same reason as /auth/me above —
    // this test only checks Nav's links, not Home's rendered values, so
    // the fixtures just need to be valid shapes that keep MSW quiet.
    server.use(
      http.get(
        'http://localhost:3000/auth/me',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.get('http://localhost:3000/api/server-status', () =>
        HttpResponse.json({ online: 0, lastUpdated: null }),
      ),
      http.get('http://localhost:3000/api/home-stats', () =>
        HttpResponse.json({ stats: {} }),
      ),
    )

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    for (const label of [
      'Início',
      'Ranking',
      'Descobrir',
      'Calendário',
      'Atualizações',
      'Loja',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})
