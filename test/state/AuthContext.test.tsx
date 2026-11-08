import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import { Nav } from '../../src/components/Nav'
import { AuthProvider } from '../../src/state/AuthContext'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('AuthContext', () => {
  test('Nav shows Entrar com Discord when logged out', async () => {
    server.use(
      http.get(
        'http://localhost:3000/auth/me',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <Nav />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('link', { name: /Entrar com Discord/ }),
    ).toBeInTheDocument()
  })

  test('Nav shows the player name when logged in, not the login CTA', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({
          player: {
            id: 'p-1',
            displayName: 'rezyam',
            clanTag: null,
            rating: 1200,
            matches: 10,
            kd: 1.5,
            wins: 2,
            avgPosition: 3,
            avgKills: 4,
          },
        }),
      ),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <Nav />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('rezyam')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Entrar com Discord/ }),
    ).not.toBeInTheDocument()
  })
})
