import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Descobrir } from '../../src/pages/Descobrir'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('Descobrir page', () => {
  test('searches and shows matching player cards', async () => {
    server.use(
      http.get('http://localhost:3000/api/players', ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? ''
        return HttpResponse.json({
          players:
            search === 'Thuii'
              ? [
                  {
                    id: '1',
                    displayName: 'Thuii9th',
                    clanTag: 'LZC',
                    rating: 7.011,
                    matches: 50,
                    kd: 2.59,
                    wins: 9,
                    avgPosition: 8.5,
                    avgKills: 3.16,
                  },
                ]
              : [],
        })
      }),
    )

    render(<Descobrir />)

    fireEvent.change(screen.getByPlaceholderText('Nome ou ID do jogador...'), {
      target: { value: 'Thuii' },
    })

    expect(await screen.findByText('Thuii9th')).toBeInTheDocument()
  })

  test('switching the mode toggle refetches with the new mode', async () => {
    // Mode-distinct fixtures: a different player per `mode`, so the
    // assertion only passes if the tab click genuinely re-fetched with
    // mode=squad (not just re-rendered stale global state).
    let lastMode: string | null = null
    const playerByMode: Record<string, { id: string; displayName: string }> = {
      global: { id: 'g1', displayName: 'GlobalPlayer' },
      squad: { id: 's1', displayName: 'SquadPlayer' },
    }

    server.use(
      http.get('http://localhost:3000/api/players', ({ request }) => {
        const mode = new URL(request.url).searchParams.get('mode')
        lastMode = mode
        const fixture = playerByMode[mode ?? '']
        return HttpResponse.json({
          players: fixture
            ? [
                {
                  id: fixture.id,
                  displayName: fixture.displayName,
                  clanTag: null,
                  rating: 5,
                  matches: 1,
                  kd: 1,
                  wins: 1,
                  avgPosition: 1,
                  avgKills: 1,
                },
              ]
            : [],
        })
      }),
    )

    render(<Descobrir />)

    expect(await screen.findByText('GlobalPlayer')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Squad' }))

    await waitFor(() => expect(lastMode).toBe('squad'))
    expect(await screen.findByText('SquadPlayer')).toBeInTheDocument()
    expect(screen.queryByText('GlobalPlayer')).not.toBeInTheDocument()
  })

  describe('search debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('waits 300ms after typing before refetching', async () => {
      let callCount = 0
      server.use(
        http.get('http://localhost:3000/api/players', () => {
          callCount += 1
          return HttpResponse.json({ players: [] })
        }),
      )

      await act(async () => {
        render(<Descobrir />)
      })
      // initial mount fetch
      await vi.waitFor(() => expect(callCount).toBe(1))

      fireEvent.change(screen.getByPlaceholderText('Nome ou ID do jogador...'), {
        target: { value: 'Th' },
      })

      // Not yet: debounce window hasn't elapsed.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200)
      })
      expect(callCount).toBe(1)

      // Past the 300ms debounce: the search fetch should now have fired.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150)
      })
      expect(callCount).toBe(2)
    })
  })
})
