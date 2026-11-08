import { useEffect, useState } from 'react'
import { ChangelogEntry } from '../components/ChangelogEntry'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import {
  alertClass,
  emptyClass,
  pageShellClass,
  tabClass,
  tabListClass,
} from '../components/ui/variants'
import { cn } from '../lib/cn'
import type { ChangelogItem } from '../lib/api'
import { getChangelog } from '../lib/api'

const SEARCH_DEBOUNCE_MS = 300

interface CategoryTab {
  /** `null` is the "Todas" tab: no `category` filter sent to the API. */
  value: string | null
  label: string
}

/**
 * The 4 taxonomy strings Task 7's seed script and Task 11's API enforce —
 * not display labels. Using anything else here would silently filter to
 * zero results against the real backend.
 */
const CATEGORY_TABS: CategoryTab[] = [
  { value: null, label: 'Todas' },
  { value: 'novidades', label: 'Novidades' },
  { value: 'melhorias', label: 'Melhorias' },
  { value: 'correcoes', label: 'Correções' },
  { value: 'importantes', label: 'Importantes' },
]

/**
 * Atualizações page: `/atualizacoes`. Filterable/searchable changelog list,
 * refetching `GET /api/changelog` on either the category tab or the
 * (debounced) search box changing — same tab + debounce pattern as
 * Ranking.tsx / Descobrir.tsx.
 */
export function Atualizacoes() {
  const [category, setCategory] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entries, setEntries] = useState<ChangelogItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    getChangelog(category ?? undefined, debouncedSearch || undefined)
      .then((response) => {
        if (!cancelled) {
          setEntries(response.entries)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as atualizações.')
      })

    return () => {
      cancelled = true
    }
  }, [category, debouncedSearch])

  return (
    <section className={cn('atualizacoes-page pb-20', pageShellClass)}>
      <PageHeader
        title="Atualizações"
        lede="Tudo que mudou no servidor, versão por versão."
        aside={
          <SearchField
            placeholder="Buscar por título ou conteúdo..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="atualizacoes-page__search"
          />
        }
      />

      <div
        role="tablist"
        aria-label="Categoria"
        className={cn('atualizacoes-page__tabs mb-10', tabListClass)}
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value ?? 'todas'}
            type="button"
            role="tab"
            aria-selected={category === tab.value}
            className={cn('atualizacoes-page__tab', tabClass)}
            onClick={() => setCategory(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className={cn('atualizacoes-page__error', alertClass)} role="alert">
          {error}
        </p>
      ) : entries.length === 0 ? (
        <p className={cn('atualizacoes-page__empty', emptyClass)}>Nenhuma atualização encontrada.</p>
      ) : (
        <div className="atualizacoes-page__list relative before:absolute before:bottom-12 before:left-1.5 before:top-3 before:w-px before:bg-line sm:before:left-[12.25rem]">
          {entries.map((entry) => (
            <ChangelogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  )
}
