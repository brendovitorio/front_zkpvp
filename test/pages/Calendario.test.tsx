import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Calendario } from '../../src/pages/Calendario'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const ONE_DAY_MS = 24 * 60 * 60 * 1000

describe('Calendario page', () => {
  test('shows the featured event and a running countdown', async () => {
    server.use(
      http.get('http://localhost:3000/api/events', () =>
        HttpResponse.json({
          events: [],
          featured: {
            id: 'e1',
            title: 'Classificatória 2ª Etapa',
            description: 'Etapa de classificação semanal.',
            category: 'classificatoria',
            startsAt: new Date(Date.now() + 60_000).toISOString(),
            prizeText: '500 diamantes',
            featured: true,
            createdAt: new Date().toISOString(),
          },
        }),
      ),
      http.get('http://localhost:3000/api/hall-of-fame', () =>
        HttpResponse.json({ entries: [] }),
      ),
    )

    render(<Calendario />)

    expect(
      await screen.findByText('Classificatória 2ª Etapa'),
    ).toBeInTheDocument()
    // Not just a static render of the event: a live countdown is mounted
    // for the featured slot specifically (CountdownTimer.test.tsx covers
    // that it actually ticks and cleans up).
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
  })

  test('fetches events scoped to the current week, not every event ever created', async () => {
    let capturedFrom: string | null = null
    let capturedTo: string | null = null

    server.use(
      http.get('http://localhost:3000/api/events', ({ request }) => {
        const url = new URL(request.url)
        capturedFrom = url.searchParams.get('from')
        capturedTo = url.searchParams.get('to')
        return HttpResponse.json({ events: [], featured: null })
      }),
      http.get('http://localhost:3000/api/hall-of-fame', () =>
        HttpResponse.json({ entries: [] }),
      ),
    )

    render(<Calendario />)

    // Wait for the fetch to land (no featured event to assert on here, so
    // wait on the empty-state copy instead).
    await screen.findByText('Nenhum evento agendado.')

    // This is the regression this test guards against: calling getEvents()
    // with no params at all would leave both of these `null`, and the page
    // would silently fetch every event ever created instead of one week.
    expect(capturedFrom).not.toBeNull()
    expect(capturedTo).not.toBeNull()
    expect(capturedFrom).toMatch(ISO_DATE_ONLY)
    expect(capturedTo).toMatch(ISO_DATE_ONLY)

    // A real bounded week: Sunday minus Monday is exactly 6 days.
    const diffDays =
      (new Date(capturedTo as string).getTime() -
        new Date(capturedFrom as string).getTime()) /
      ONE_DAY_MS
    expect(diffDays).toBe(6)
  })
})
