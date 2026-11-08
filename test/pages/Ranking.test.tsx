import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Ranking } from '../../src/pages/Ranking'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('Ranking page', () => {
  test('shows table rows from the API, switches tabs by mode', async () => {
    // Mode-distinct fixtures: a different player per `mode`, so the second
    // assertion only passes if the tab click actually re-fetched with
    // mode=diario (not just re-rendered stale `diario` state).
    const entryByMode: Record<string, { displayName: string }> = {
      diario: { displayName: 'rezyam' },
      semanal: { displayName: 'esquadrao' },
      mensal: { displayName: 'emensal' },
    }

    server.use(
      http.get('http://localhost:3000/api/ranking', ({ request }) => {
        const mode = new URL(request.url).searchParams.get('mode') ?? ''
        const fixture = entryByMode[mode]
        return HttpResponse.json({
          mode,
          stage: null,
          entries: fixture
            ? [
                {
                  position: 1,
                  playerId: `p-${mode}`,
                  displayName: fixture.displayName,
                  clanTag: 'SCL',
                  eliminations: 246,
                  wins: 3,
                  prizesText: '3 Caixas',
                },
              ]
            : [],
        })
      }),
    )

    render(<Ranking />)

    expect(await screen.findByText('rezyam')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Mensal' }))

    // Refetched with mode=mensal: the diario-only player is gone, replaced by
    // the mensal-only fixture.
    expect(await screen.findByText('emensal')).toBeInTheDocument()
    expect(screen.queryByText('rezyam')).not.toBeInTheDocument()
  })
})
