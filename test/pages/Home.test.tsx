import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import { Home } from '../../src/pages/Home'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('Home page', () => {
  test('shows the live online count and stat strip values', async () => {
    server.use(
      http.get('http://localhost:3000/api/server-status', () =>
        HttpResponse.json({ online: 143, lastUpdated: '2026-11-06T18:00:00Z' }),
      ),
      http.get('http://localhost:3000/api/home-stats', () =>
        HttpResponse.json({
          stats: {
            contas_criadas: '300032',
            premiacao_total: '800000',
            campeonatos: '100',
            clas: '2770',
            banidos: '28156',
          },
        }),
      ),
    )

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(await screen.findByText('143')).toBeInTheDocument()
    expect(await screen.findByText('300032')).toBeInTheDocument()
  })

  test('does not crash when a stat is momentarily unavailable (loading/null state)', async () => {
    server.use(
      http.get('http://localhost:3000/api/server-status', () =>
        HttpResponse.json({ online: null, lastUpdated: null }),
      ),
      http.get('http://localhost:3000/api/home-stats', () =>
        HttpResponse.json({ stats: {} }),
      ),
    )

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    // Online count has no value yet -> renders a placeholder, never throws.
    expect(await screen.findAllByText('--')).not.toHaveLength(0)
  })
})
