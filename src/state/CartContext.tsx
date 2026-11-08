import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CartItem {
  storeItemId: string
  quantity: number
}

export interface CartState {
  items: CartItem[]
  add: (storeItemId: string, quantity?: number) => void
  remove: (storeItemId: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | undefined>(undefined)

/**
 * Client-only shopping cart for the Loja page (`items: {storeItemId,
 * quantity}[]`). Kept purely in memory — not persisted to storage or the
 * backend — so a fresh page load always starts with an empty cart; the only
 * server round-trip is the eventual `POST /api/store/orders` on checkout
 * (Task 17), which takes `cart.items` as-is for its request body.
 *
 * `add` increments `quantity` on an existing line instead of pushing a
 * duplicate entry, so the cart (and the order body built from it) always has
 * at most one line per `storeItemId`.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const add = useCallback((storeItemId: string, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.storeItemId === storeItemId)
      if (existing) {
        return current.map((item) =>
          item.storeItemId === storeItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...current, { storeItemId, quantity }]
    })
  }, [])

  const remove = useCallback((storeItemId: string) => {
    setItems((current) => current.filter((item) => item.storeItemId !== storeItemId))
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartState>(
    () => ({ items, add, remove, clear }),
    [items, add, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/** Reads `{ items, add, remove, clear }` from the nearest `CartProvider`. */
export function useCart(): CartState {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
