import type { CalendarEvent } from '../lib/api'
import { cn } from '../lib/cn'
import { CountdownTimer } from './CountdownTimer'
import { chipVariants } from './ui/variants'

interface EventCardProps {
  event: CalendarEvent
  /** Set on the single featured event rendered at the top of Calendário. */
  showCountdown?: boolean
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' })
const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })

/**
 * Single event card, reused for both the featured slot (with a live
 * countdown) and the plain weekly agenda list on the Calendário page.
 *
 * Two visual modes off the same markup:
 *  - featured (`showCountdown`): large hot-edged panel, countdown scoreboard
 *    on the right on desktop;
 *  - agenda: compact row with a date block on the left.
 */
export function EventCard({ event, showCountdown = false }: EventCardProps) {
  const startsAt = new Date(event.startsAt)

  return (
    <article
      className={cn(
        'event-card frame',
        showCountdown
          ? 'frame-hot frame-lit chamfer-lg grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center'
          : 'grid grid-cols-[4rem_1fr] gap-x-5 gap-y-3 p-4 transition-colors hover:frame-lit sm:p-5',
      )}
    >
      {!showCountdown && (
        <div
          aria-hidden="true"
          className="flex flex-col items-center justify-center border-r border-line pr-5"
        >
          <span className="scoreboard text-4xl text-ink">{dayFormatter.format(startsAt)}</span>
          <span className="text-xs text-mute">{weekdayFormatter.format(startsAt)}</span>
        </div>
      )}

      <div className="min-w-0">
        <header className="event-card__header flex flex-wrap items-center gap-3">
          <h3
            className={cn(
              'event-card__title text-ink',
              showCountdown ? 'text-4xl sm:text-5xl' : 'text-2xl',
            )}
          >
            {event.title}
          </h3>
          {event.category && (
            <span className={chipVariants({ tone: 'accent', className: 'event-card__category' })}>
              {event.category}
            </span>
          )}
        </header>

        {event.description && (
          <p className={cn('event-card__description mt-2 text-mute', showCountdown && 'max-w-xl text-lg')}>
            {event.description}
          </p>
        )}

        <dl
          className={cn(
            'event-card__meta flex flex-wrap gap-x-8 gap-y-2 text-sm',
            showCountdown ? 'mt-6' : 'mt-3',
          )}
        >
          <div className="event-card__meta-item flex items-baseline gap-2">
            <dt className="text-mute">Início</dt>
            <dd className="font-medium tabular-nums text-ink">{dateFormatter.format(startsAt)}</dd>
          </div>
          {event.prizeText && (
            <div className="event-card__meta-item flex items-baseline gap-2">
              <dt className="text-mute">Premiação</dt>
              {/* Prize amounts are one of design.md's three emphasis-accent uses. */}
              <dd className="font-display text-lg font-bold text-flare">{event.prizeText}</dd>
            </div>
          )}
        </dl>
      </div>

      {showCountdown && <CountdownTimer targetIso={event.startsAt} />}
    </article>
  )
}
