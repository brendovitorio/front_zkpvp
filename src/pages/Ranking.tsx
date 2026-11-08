import { useCallback, useEffect, useState } from 'react'
import { RankingTable } from '../components/RankingTable'
import { PageHeader } from '../components/ui/PageHeader'
import { alertClass, pageShellClass, tabClass, tabListClass } from '../components/ui/variants'
import { cn } from '../lib/cn'
import { ApiError, type RankingEntry, type RankingMode, getRanking } from '../lib/api'

interface ModeTab {
  mode: RankingMode
  label: string
}

const MODE_TABS: ModeTab[] = [
  { mode: 'diario', label: 'Diario' },
  { mode: 'semanal', label: 'Semanal' },
  { mode: 'mensal', label: 'Mensal' },
  { mode: 'mvp', label: 'MVP' },
]

/**
 * Ranking page: `/ranking`. Holds the active mode tab, refetches
 * `GET /api/ranking` on every mode change, and renders the result through
 * `RankingTable`.
 */
export function Ranking() {
  const [mode, setMode] = useState<RankingMode>('diario')
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  const loadRanking = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getRanking(mode)
      if (!signal.cancelled) setEntries(response.entries)
    } catch (cause) {
      if (!signal.cancelled) {
        const status = cause instanceof ApiError ? ` (HTTP ${cause.status})` : ''
        setError(`Não foi possível carregar o ranking${status}. Verifique a conexão com a API e tente novamente.`)
      }
    } finally {
      if (!signal.cancelled) setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    const signal = { cancelled: false }
    void loadRanking(signal)
    return () => { signal.cancelled = true }
  }, [loadRanking, reload])

  return (
    <section className={cn('ranking-page pb-20', pageShellClass)}>
      <PageHeader
        title="Ranking"
        lede="Classificação por eliminações e vitórias em cada modo de jogo."
      />

      <div
        role="tablist"
        aria-label="Modo de ranking"
        className={cn('ranking-page__tabs mb-6', tabListClass)}
      >
        {MODE_TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            className={cn('ranking-page__tab', tabClass)}
            onClick={() => setMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className={cn('ranking-page__error', alertClass)} role="alert">
          <p>{error}</p>
          <button type="button" className="mt-3 underline" onClick={() => setReload((value) => value + 1)}>Tentar novamente</button>
        </div>
      ) : loading ? (
        <p role="status" className="text-mute">Carregando ranking…</p>
      ) : (
        <RankingTable entries={entries} />
      )}
    </section>
  )
}
