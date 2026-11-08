import type { ChangelogItem } from '../lib/api'
import { chipVariants } from './ui/variants'

interface ChangelogEntryProps {
  entry: ChangelogItem
}

/**
 * Display labels for the 4 taxonomy strings seeded by Task 7 and enforced
 * server-side by Task 11 (`novidades`, `melhorias`, `correcoes`,
 * `importantes`). Falls back to the raw string for anything else so an
 * unrecognized category still renders instead of disappearing.
 */
const CATEGORY_LABELS: Record<string, string> = {
  novidades: 'Novidades',
  melhorias: 'Melhorias',
  correcoes: 'Correções',
  importantes: 'Importantes',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * `importantes` is the one category that should stand out in a scan of the
 * list; every other category reads as a neutral tag.
 */
function categoryTone(category: string): 'solid' | 'neutral' {
  return category === 'importantes' ? 'solid' : 'neutral'
}

/**
 * Single changelog entry for the Atualizações timeline: version + date in a
 * left rail (desktop) with a violet node on the timeline spine, content on
 * the right.
 */
export function ChangelogEntry({ entry }: ChangelogEntryProps) {
  return (
    <article className="changelog-entry reveal relative grid gap-3 pb-12 pl-8 sm:grid-cols-[9rem_1fr] sm:gap-8 sm:pl-0">
      {/*
        Timeline node. Its x-position must match the spine drawn by the list
        container in Atualizacoes.tsx: 1.5 on phones; on sm+ it is
        rail (9rem) + column gap (2rem) + half the content padding (1.25rem).
      */}
      <span
        aria-hidden="true"
        className="absolute left-1.5 top-3 size-2.5 -translate-x-1/2 rotate-45 bg-accent shadow-[0_0_0_4px_var(--color-void)] sm:left-[12.25rem]"
      />

      <header className="changelog-entry__header flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1">
        <span className="changelog-entry__version scoreboard text-4xl text-accent">
          {entry.version}
        </span>
        <time
          className="changelog-entry__date text-sm tabular-nums text-mute"
          dateTime={entry.publishedAt}
        >
          {dateFormatter.format(new Date(entry.publishedAt))}
        </time>
      </header>

      <div className="min-w-0 sm:pl-10">
        <h3 className="changelog-entry__title text-3xl text-ink">{entry.title}</h3>

        <ul className="changelog-entry__categories mt-3 flex flex-wrap gap-2">
          {entry.categories.map((category) => (
            <li
              key={category}
              className={chipVariants({
                tone: categoryTone(category),
                className: 'changelog-entry__category',
              })}
            >
              {CATEGORY_LABELS[category] ?? category}
            </li>
          ))}
        </ul>

        <p className="changelog-entry__body mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-mute">
          {entry.body}
        </p>
      </div>
    </article>
  )
}
