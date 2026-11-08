import { useEffect, useMemo, useRef, useState } from 'react'
import { StoreItemCard } from '../components/StoreItemCard'
import { PageHeader } from '../components/ui/PageHeader'
import {
  alertClass,
  buttonVariants,
  pageShellClass,
  successClass,
} from '../components/ui/variants'
import { ApiError, API_BASE, createOrder, getStoreItems } from '../lib/api'
import { cn } from '../lib/cn'
import type { StoreItem } from '../lib/api'
import { useAuth } from '../state/AuthContext'
import { useCart } from '../state/CartContext'

type OrderStatus = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Loja page: `/loja`. Lists store items (`GET /api/store/items`, Task 17)
 * as `StoreItemCard`s with an "add to cart" action, a cart summary driven by
 * `CartContext`, and a "Finalizar pedido" checkout button.
 *
 * Checkout branches on auth state (`useAuth()`, Task 15):
 *   - Logged in: calls `POST /api/store/orders` (Task 17) with the cart's
 *     items. On success the cart is genuinely cleared via `cart.clear()`
 *     (not just hidden behind a "submitted" flag) and a confirmation shows.
 *   - Logged out: never calls the API at all — redirects the browser to
 *     Discord login instead, same destination as `Nav`'s login CTA. This is
 *     a `window.location.href` assignment rather than Nav's `<a href>`
 *     pattern because "Finalizar pedido" is a stateful button (it does
 *     something different depending on auth state), not a plain link.
 */
export function Loja() {
  const { player } = useAuth()
  const cart = useCart()

  const [items, setItems] = useState<StoreItem[]>([])
  const [itemsError, setItemsError] = useState<string | null>(null)

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle')
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const idempotencyKey = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getStoreItems()
      .then((response) => {
        if (!cancelled) {
          setItems(response.items)
          setItemsError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setItemsError('Não foi possível carregar a loja.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )

  const totalCents = cart.items.reduce((sum, cartItem) => {
    const item = itemsById.get(cartItem.storeItemId)
    return sum + (item ? item.priceCents * cartItem.quantity : 0)
  }, 0)

  const cartCount = cart.items.reduce((sum, cartItem) => sum + cartItem.quantity, 0)

  function handleFinalizarPedido() {
    if (!player) {
      window.location.href = `${API_BASE}/auth/discord/login`
      return
    }

    setOrderStatus('submitting')
    setOrderError(null)

    idempotencyKey.current ??= crypto.randomUUID()
    createOrder(cart.items, idempotencyKey.current)
      .then((response) => {
        // Real state clear, not UI optimism: the cart summary below reads
        // straight from `cart.items`, so once this resolves it goes back to
        // its empty-cart copy on its own.
        cart.clear()
        setOrderStatus('success')
        setOrderId(response.order.id)
        idempotencyKey.current = null
      })
      .catch((error) => {
        setOrderStatus('error')
        setOrderError(
          error instanceof ApiError && error.status === 400
            ? 'Seu carrinho está vazio.'
            : 'Não foi possível criar o pedido. Tente novamente.',
        )
      })
  }

  return (
    <section className={cn('loja-page pb-20', pageShellClass)}>
      <PageHeader
        title="Loja"
        lede="Produtos com preços em reais. O checkout PIX está temporariamente indisponível e nenhum pagamento será cobrado."
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        {itemsError ? (
          <p role="alert" className={cn('loja-page__error', alertClass)}>
            {itemsError}
          </p>
        ) : (
          <div className="loja-page__grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <StoreItemCard key={item.id} item={item} onAdd={() => cart.add(item.id)} />
            ))}
          </div>
        )}

        <div className="glow lg:sticky lg:top-24">
          <aside
            className="loja-page__cart frame frame-hot chamfer-lg flex flex-col gap-5 p-6"
            aria-label="Carrinho"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl text-ink">Carrinho</h2>
              <span className="text-sm tabular-nums text-mute">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {cart.items.length === 0 ? (
              <p className="border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
                Seu carrinho está vazio.
              </p>
            ) : (
              <ul className="loja-page__cart-list flex flex-col divide-y divide-line/60 border-y border-line/60">
                {cart.items.map((cartItem) => {
                  const item = itemsById.get(cartItem.storeItemId)
                  return (
                    <li
                      key={cartItem.storeItemId}
                      className="flex items-center justify-between gap-3 py-3 text-sm text-ink"
                    >
                      <span className="min-w-0">
                        {item ? item.name : cartItem.storeItemId}
                        <span className="text-mute"> x {cartItem.quantity}</span>
                      </span>
                      <button
                        type="button"
                        className={buttonVariants({ intent: 'ghost', className: 'text-sm font-semibold' })}
                        onClick={() => cart.remove(cartItem.storeItemId)}
                      >
                        Remover
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <p className="loja-page__total flex items-baseline justify-between text-mute">
              <span>Total:</span>
              <span className="scoreboard text-4xl text-ink">{(totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </p>

            <button
              type="button"
              className={cn(buttonVariants({ size: 'md' }), 'w-full')}
              disabled={cart.items.length === 0 || orderStatus === 'submitting'}
              onClick={handleFinalizarPedido}
            >
              Registrar pedido (PIX indisponível)
            </button>

            {orderStatus === 'success' && (
              <p role="status" className={successClass}>
                Pedido {orderId} registrado como aguardando pagamento. O PIX ainda não está disponível; não houve cobrança nem entrega.
              </p>
            )}
            {orderStatus === 'error' && orderError && (
              <p role="alert" className={alertClass}>
                {orderError}
              </p>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}
