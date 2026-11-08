import type { RankingEntry } from '../lib/api'
import { cn } from '../lib/cn'
import { emptyClass } from './ui/variants'

interface RankingTableProps {
  entries: RankingEntry[]
}

const headCell = 'px-4 py-3 text-left text-xs font-semibold text-mute whitespace-nowrap'
const cell = 'px-4 py-3 whitespace-nowrap'

/**
 * Position numeral color: #1 is one of the three places design.md allows the
 * emphasis accent; podium (2-3) stays bright ink; everyone else recedes.
 */
function positionClass(position: number): string {
  if (position === 1) return 'text-flare glyph-glow text-3xl'
  if (position <= 3) return 'text-ink text-2xl'
  return 'text-mute text-xl'
}

/**
 * Dense, left-aligned leaderboard table (design.md: "tabelas de ranking
 * densas, alinhadas à esquerda, linhas zebradas sutis com tom roxo") — not
 * a rounded-card grid. Reused by Ranking now and, later, by Descobrir.
 *
 * Wrapped in a horizontally scrollable frame so the six columns stay
 * readable at phone widths instead of crushing.
 */
export function RankingTable({ entries }: RankingTableProps) {
  if (entries.length === 0) {
    return <p className={cn('ranking-table__empty', emptyClass)}>Sem resultados para esta etapa.</p>
  }

  return (
    <div className="frame chamfer-lg">
      <div className="overflow-x-auto">
        <table className="ranking-table w-full min-w-[40rem] border-collapse text-[0.95rem]">
          <thead className="border-b border-line-strong bg-accent/8">
            <tr>
              <th scope="col" className={cn(headCell, 'w-20 pl-6')}>#</th>
              <th scope="col" className={headCell}>Jogador</th>
              <th scope="col" className={headCell}>Clã</th>
              <th scope="col" className={headCell}>Eliminações</th>
              <th scope="col" className={headCell}>Vitórias</th>
              <th scope="col" className={headCell}>Prêmios</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.playerId}
                className={cn(
                  'ranking-table__row border-b border-line/50 transition-colors last:border-0',
                  'even:bg-accent/[0.045] hover:bg-accent/12',
                  entry.position === 1 && 'bg-flare/[0.07] shadow-[inset_3px_0_0_var(--color-flare)]',
                )}
              >
                <td className={cn(cell, 'ranking-table__position py-2 pl-6')}>
                  <span className={cn('scoreboard', positionClass(entry.position))}>
                    {entry.position}
                  </span>
                </td>
                <td className={cn(cell, 'font-semibold text-ink')}>{entry.displayName}</td>
                <td className={cn(cell, 'font-mono text-sm text-mute')}>{entry.clanTag ?? '—'}</td>
                <td className={cn(cell, 'tabular-nums text-ink')}>{entry.eliminations}</td>
                <td className={cn(cell, 'tabular-nums text-ink')}>{entry.wins}</td>
                <td className={cn(cell, 'text-mute')}>{entry.prizesText ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
