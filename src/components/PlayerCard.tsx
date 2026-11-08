import type { PlayerSummary } from '../lib/api'
import { cn } from '../lib/cn'
import { chipVariants } from './ui/variants'

interface PlayerCardProps {
  player: PlayerSummary
}

/**
 * Single player card for the Descobrir grid: identity (name + clan tag),
 * PvP metrics (K/D, wins, matches and eliminations), avoiding placement/rating
 * metrics that imply a battle royale format.
 *
 * Visual: chamfered `frame` panel (1px violet edge following the cut
 * corners), which lights up on hover instead of lifting with a grey shadow.
 */
export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article
      className={cn(
        'player-card frame chamfer-lg flex flex-col p-5 hover:frame-lit hover:[--frame-edge:var(--color-line-strong)]',
      )}
    >
      <header className="player-card__header flex items-start justify-between gap-3">
        <h3 className="player-card__name min-w-0 truncate text-2xl text-ink">{player.displayName}</h3>
        <span className={chipVariants({ className: 'player-card__clan shrink-0 font-mono' })}>
          {player.clanTag ?? '—'}
        </span>
      </header>

      <div className="mt-4 mb-5 flex items-baseline gap-2">
        <p
          className="player-card__rating display scoreboard text-5xl text-accent"
        >
          {player.kd.toFixed(2)}
        </p>
        <span className="text-sm text-mute">K/D</span>
      </div>

      <dl className="player-card__stats mt-auto grid grid-cols-3 gap-px bg-line pt-px">
        <Stat label="Partidas" value={player.matches} />
        <Stat label="K/D" value={player.kd.toFixed(2)} />
        <Stat label="Vitórias" value={player.wins} />
        <Stat label="Vitórias" value={player.wins} />
        <Stat label="Elim./partida" fullLabel="Eliminações por partida" value={player.avgKills.toFixed(2)} />
      </dl>
    </article>
  )
}

interface StatProps {
  label: string
  /** Full label for assistive tech when the visible one is abbreviated. */
  fullLabel?: string
  value: string | number
  /** Span two columns (used for the fifth stat so the 3-col grid stays filled). */
  wide?: boolean
}

function Stat({ label, fullLabel, value, wide = false }: StatProps) {
  return (
    <div className={cn(
        'player-card__stat bg-panel px-3 py-2.5 [&:nth-child(3n+1)]:pl-0',
        wide && 'col-span-2',
      )}>
      <dt className="text-xs text-mute" title={fullLabel}>
        {fullLabel ? (
          <>
            <span aria-hidden="true">{label}</span>
            <span className="sr-only">{fullLabel}</span>
          </>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  )
}
