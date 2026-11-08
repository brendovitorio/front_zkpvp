import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Cadastro } from '../../src/pages/Cadastro'
import { AuthProvider } from '../../src/state/AuthContext'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

function mockLoggedIn() {
  server.use(
    http.get('http://localhost:3000/auth/me', () =>
      HttpResponse.json({
        player: {
          id: 'p-1',
          discordId: 'd-1',
          discordUsername: '067_alvezx',
          displayName: '067_alvezx',
          fivemLicense: null,
        },
      }),
    ),
  )
}

describe('Cadastro page', () => {
  test('shows the pairing code once terms are accepted', async () => {
    mockLoggedIn()
    server.use(
      http.get('http://localhost:3000/api/link/code', () =>
        HttpResponse.json({ code: 'AB12CD', expiresAt: '2026-11-06T18:00:00Z' }),
      ),
    )

    render(
      <AuthProvider>
        <Cadastro />
      </AuthProvider>,
    )

    // Step 1: shows the linked Discord account, then advance.
    expect(await screen.findByText('067_alvezx')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /próxima etapa/i }))

    // Step 2: accept terms, then advance.
    fireEvent.click(await screen.findByRole('checkbox', { name: /aceito os termos/i }))
    fireEvent.click(screen.getByRole('button', { name: /próxima etapa/i }))

    // Step 3: pairing code + in-game confirmation command.
    expect(await screen.findByText('AB12CD')).toBeInTheDocument()
    expect(screen.getByText(/\/vincular AB12CD/)).toBeInTheDocument()
  })

  test('does not request the pairing code until step 3 is entered', async () => {
    mockLoggedIn()
    let codeRequests = 0
    server.use(
      http.get('http://localhost:3000/api/link/code', () => {
        codeRequests += 1
        return HttpResponse.json({ code: 'AB12CD', expiresAt: '2026-11-06T18:00:00Z' })
      }),
    )

    render(
      <AuthProvider>
        <Cadastro />
      </AuthProvider>,
    )

    // Sit on step 1 (post Discord-account load) without ever advancing.
    expect(await screen.findByText('067_alvezx')).toBeInTheDocument()
    expect(codeRequests).toBe(0)

    // Advance to step 2; still must not have requested a code.
    fireEvent.click(screen.getByRole('button', { name: /próxima etapa/i }))
    await screen.findByRole('checkbox', { name: /aceito os termos/i })
    expect(codeRequests).toBe(0)
  })
})
