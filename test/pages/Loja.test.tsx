import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { Loja } from '../../src/pages/Loja'
import { AuthProvider } from '../../src/state/AuthContext'
import { CartProvider } from '../../src/state/CartContext'
import { http, HttpResponse } from '../mocks/handlers'
import { server } from '../mocks/server'

// Captured once so the redirect test's `window.location` swap (see below)
// can be undone afterward without leaking a fake `location` into other
// test files.
const ORIGINAL_LOCATION = window.location

const STORE_ITEM = {
  id: 'i1',
  name: 'Caixa Lendária',
  description: 'Item de teste',
  priceCents: 4000,
  category: 'caixas',
  imageUrl: null,
  active: true,
  stockQuantity: null,
}

function renderLoja() {
  return render(
    <AuthProvider>
      <CartProvider>
        <Loja />
      </CartProvider>
    </AuthProvider>,
  )
}

function mockStoreItems() {
  server.use(
    http.get('http://localhost:3000/api/store/items', () =>
      HttpResponse.json({ items: [STORE_ITEM] }),
    ),
  )
}

describe('Loja page', () => {
  afterEach(() => {
    // Restore the real `window.location` after the redirect test below
    // replaces it with a plain capture object; a no-op for every other
    // test since this just reassigns the same original value.
    Object.defineProperty(window, 'location', {
      value: ORIGINAL_LOCATION,
      writable: true,
      configurable: true,
    })
  })

  test('Finalizar pedido creates an order and clears the cart', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ player: { id: 'p1', displayName: 'p1' } }),
      ),
    )
    mockStoreItems()
    server.use(
      http.post('http://localhost:3000/api/store/orders', () =>
        HttpResponse.json(
          { order: { id: 'o1', status: 'pending_payment', totalCents: 4000, paymentAvailable: false, items: [] } },
          { status: 201 },
        ),
      ),
    )

    renderLoja()

    fireEvent.click(await screen.findByRole('button', { name: /adicionar/i }))
    fireEvent.click(screen.getByRole('button', { name: /registrar pedido/i }))

    expect(await screen.findByText(/registrado como aguardando pagamento/i)).toBeInTheDocument()

    // Not just UI optimism: the cart's real state cleared too, so the
    // summary falls back to its empty-cart copy instead of still listing
    // the item that was just ordered.
    expect(screen.getByText(/carrinho está vazio/i)).toBeInTheDocument()
  })

  test('sends the order body shaped as { items: [{ storeItemId, quantity }] }', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ player: { id: 'p1', displayName: 'p1' } }),
      ),
    )
    mockStoreItems()

    let capturedBody: unknown
    server.use(
      http.post('http://localhost:3000/api/store/orders', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          { order: { id: 'o1', status: 'pending_payment', totalCents: 4000, paymentAvailable: false, items: [] } },
          { status: 201 },
        )
      }),
    )

    renderLoja()

    fireEvent.click(await screen.findByRole('button', { name: /adicionar/i }))
    fireEvent.click(screen.getByRole('button', { name: /registrar pedido/i }))

    await screen.findByText(/registrado como aguardando pagamento/i)

    expect(capturedBody).toMatchObject({ items: [{ storeItemId: 'i1', quantity: 1 }] })
    expect((capturedBody as { idempotencyKey: string }).idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i)
  })

  test('reuses the idempotency key when retrying after a network failure', async () => {
    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ player: { id: 'p1', displayName: 'p1' } }),
      ),
    )
    mockStoreItems()
    const requestBodies: Array<{ idempotencyKey: string }> = []
    let attempt = 0
    server.use(
      http.post('http://localhost:3000/api/store/orders', async ({ request }) => {
        requestBodies.push(await request.json() as { idempotencyKey: string })
        attempt += 1
        if (attempt === 1) return HttpResponse.json({ error: 'temporary_failure' }, { status: 503 })
        return HttpResponse.json(
          { order: { id: 'o2', status: 'pending_payment', totalCents: 4000, paymentAvailable: false, items: [] } },
          { status: 201 },
        )
      }),
    )

    renderLoja()
    fireEvent.click(await screen.findByRole('button', { name: /adicionar/i }))
    fireEvent.click(screen.getByRole('button', { name: /registrar pedido/i }))
    expect(await screen.findByText(/não foi possível criar o pedido/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /registrar pedido/i }))
    await screen.findByText(/registrado como aguardando pagamento/i)

    expect(requestBodies).toHaveLength(2)
    expect(requestBodies[0].idempotencyKey).toBe(requestBodies[1].idempotencyKey)
  })

  test('clicking Finalizar pedido while logged out redirects instead of calling the API', async () => {
    server.use(
      http.get(
        'http://localhost:3000/auth/me',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    mockStoreItems()
    // Deliberately no handler for POST /api/store/orders: if the page called
    // it anyway, MSW's onUnhandledRequest: 'error' setup would fail this
    // test, catching the bug the brief warns about.

    // Swap in a plain capture object so setting `window.location.href`
    // never triggers jsdom's "Not implemented: navigation" path.
    const location = { href: '' }
    Object.defineProperty(window, 'location', {
      value: location,
      writable: true,
      configurable: true,
    })

    renderLoja()

    fireEvent.click(await screen.findByRole('button', { name: /adicionar/i }))
    fireEvent.click(screen.getByRole('button', { name: /registrar pedido/i }))

    expect(location.href).toBe('http://localhost:3000/auth/discord/login')
    expect(screen.queryByText(/registrado como aguardando pagamento/i)).not.toBeInTheDocument()
  })
})
