import { useEffect, useState } from 'react'
import { PlayerCard } from '../components/PlayerCard'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import {
  alertClass,
  emptyClass,
  pageShellClass,
} from '../components/ui/variants'
import { cn } from '../lib/cn'
import type { PlayerSummary } from '../lib/api'
import { getPlayers } from '../lib/api'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Descobrir page: `/descobrir`. Search the community without BR-style
 * playlists; player stats focus on PvP performance.
 */
export function Descobrir() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  // Debounce: only promote the typed value to `debouncedSearch` (which
  // drives the fetch below) after the user stops typing for 300ms.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    getPlayers(debouncedSearch, 'global')
      .then((response) => {
        if (!cancelled) {
          setPlayers(response.players)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os jogadores.')
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  return (
    <section className={cn('descobrir-page pb-20', pageShellClass)}>
      <PageHeader
        title="Jogadores"
        lede="Encontre jogadores da comunidade e compare desempenho nas partidas PvP."
        aside={
          <SearchField
            placeholder="Nome ou ID do jogador..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="descobrir-page__search"
          />
        }
      />

      {error ? (
        <p className={cn('descobrir-page__error', alertClass)} role="alert">
          {error}
        </p>
      ) : players.length === 0 ? (
        <p className={cn('descobrir-page__empty', emptyClass)}>Nenhum jogador encontrado.</p>
      ) : (
        <div className="descobrir-page__grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((player) => <PlayerCard key={player.id} player={player} />)}
        </div>
      )}
    </section>
  )
}
