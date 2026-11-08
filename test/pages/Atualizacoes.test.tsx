import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Atualizacoes } from '../../src/pages/Atualizacoes'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('Atualizacoes page', () => {
  test('shows changelog entries from the API', async () => {
    server.use(
      http.get('http://localhost:3000/api/changelog', () =>
        HttpResponse.json({
          entries: [
            {
              id: '1',
              version: 'v05.10',
              title: 'Temos novidades!',
              publishedAt: '2026-10-04',
              categories: ['novidades'],
              body: '...',
            },
          ],
        }),
      ),
    )

    render(<Atualizacoes />)

    expect(await screen.findByText('Temos novidades!')).toBeInTheDocument()
  })

  test('filters entries by category using the 4 real taxonomy strings', async () => {
    // Category-distinct fixtures (mirrors the Ranking page's mode-distinct
    // fixture pattern): the second assertion only passes if clicking the
    // "Melhorias" tab actually refetched with category=melhorias (not just
    // re-rendered stale "novidades" state).
    const entryByCategory: Record<string, { id: string; title: string }> = {
      novidades: { id: '1', title: 'Temos novidades!' },
      melhorias: { id: '2', title: 'Melhoria de performance' },
    }

    server.use(
      http.get('http://localhost:3000/api/changelog', ({ request }) => {
        const category = new URL(request.url).searchParams.get('category')
        const fixture = category ? entryByCategory[category] : undefined

        return HttpResponse.json({
          entries: fixture
            ? [
                {
                  id: fixture.id,
                  version: 'v05.10',
                  title: fixture.title,
                  publishedAt: '2026-10-04',
                  categories: [category],
                  body: '...',
                },
              ]
            : [],
        })
      }),
    )

    render(<Atualizacoes />)

    // Default "Todas" tab sends no category filter, so the handler above
    // (no category param -> no fixture) returns zero entries initially.
    expect(await screen.findByText('Nenhuma atualização encontrada.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Novidades' }))
    expect(await screen.findByText('Temos novidades!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Melhorias' }))
    expect(await screen.findByText('Melhoria de performance')).toBeInTheDocument()
    expect(screen.queryByText('Temos novidades!')).not.toBeInTheDocument()
  })
})
