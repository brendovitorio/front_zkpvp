import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StaffDashboard } from '../../../src/pages/staff/StaffDashboard'
import { http, HttpResponse } from '../../mocks/handlers'
import { server } from '../../mocks/server'

describe('StaffDashboard page', () => {
  test('shows the field error returned by the API on invalid submit', async () => {
    server.use(
      http.post('http://localhost:3000/staff/changelog', () =>
        HttpResponse.json(
          { error: 'validation_error', fields: { title: 'obrigatório' } },
          { status: 400 },
        ),
      ),
    )

    render(<StaffDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /salvar changelog/i }))

    expect(await screen.findByText('obrigatório')).toBeInTheDocument()
  })

  test('shows the field error returned by the API for the event form', async () => {
    server.use(
      http.post('http://localhost:3000/staff/events', () =>
        HttpResponse.json(
          { error: 'validation_error', fields: { category: 'obrigatório' } },
          { status: 400 },
        ),
      ),
    )

    render(<StaffDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /salvar evento/i }))

    expect(await screen.findByText('obrigatório')).toBeInTheDocument()
  })

  test('shows the field error returned by the API for the home-stat form', async () => {
    server.use(
      http.put('http://localhost:3000/staff/home-stats/:key', () =>
        HttpResponse.json(
          { error: 'validation_error', fields: { value: 'obrigatório' } },
          { status: 400 },
        ),
      ),
    )

    render(<StaffDashboard />)

    fireEvent.change(screen.getByLabelText(/chave/i), {
      target: { value: 'jogadores_online' },
    })
    fireEvent.click(screen.getByRole('button', { name: /salvar estatística/i }))

    expect(await screen.findByText('obrigatório')).toBeInTheDocument()
  })

  test('successful changelog submit shows a confirmation and clears the field error', async () => {
    server.use(
      http.post('http://localhost:3000/staff/changelog', () =>
        HttpResponse.json(
          { entry: { id: 'c1', version: '1.0', title: 't', publishedAt: '2026-01-01', categories: [], body: 'b' } },
          { status: 201 },
        ),
      ),
    )

    render(<StaffDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /salvar changelog/i }))

    expect(await screen.findByText(/changelog salvo/i)).toBeInTheDocument()
  })
})
