import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getMe, logoutPlayer, type PlayerSummary } from '../lib/api'

export interface AuthState {
  player: PlayerSummary | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

/**
 * App-wide auth state: fetches `GET /auth/me` once on mount and holds the
 * result as `{ player, loading }`. A `401` (not logged in) resolves to
 * `player: null` — it is not treated as an error, so it never crashes the
 * app or surfaces an error state; see `getMe()` in `lib/api.ts`.
 *
 * Consumed by `Nav` (login CTA vs. player name) and, per the task plan, by
 * Cadastro and Loja to gate actions behind login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    await logoutPlayer()
    setPlayer(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((result) => {
        if (!cancelled) setPlayer(result)
      })
      .catch(() => {
        // Anything other than a 401 (already handled inside getMe()) —
        // network failure, 5xx, etc. Fail closed: treat as logged out
        // rather than letting the error escape and crash the app.
        if (!cancelled) setPlayer(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ player, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Reads `{ player, loading }` from the nearest `AuthProvider`. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
