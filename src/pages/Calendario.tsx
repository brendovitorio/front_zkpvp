import { useEffect, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { PageHeader } from '../components/ui/PageHeader'
import { alertClass, emptyClass, pageShellClass } from '../components/ui/variants'
import { cn } from '../lib/cn'
import type { CalendarEvent, HallOfFameEntry } from '../lib/api'
import { getEvents, getHallOfFame } from '../lib/api'
import { getCurrentWeekRange } from '../lib/dateRange'

/**
 * Calendário page: `/calendario`. Three independent sections, each backed
 * by its own fetch (Task 11):
 *  - Featured event (with a live `CountdownTimer`) + weekly agenda, both
 *    from a single `GET /api/events` call scoped to the current
 *    Monday-Sunday window via {@link getCurrentWeekRange}.
 *  - Hall of fame, from `GET /api/hall-of-fame`.
 *
 * The two fetches are intentionally decoupled (separate `useEffect`s, each
 * swallowing its own error) so a Hall of Fame outage never blocks the
 * featured event / agenda from rendering, and vice versa.
 */
export function Calendario() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [featured, setFeatured] = useState<CalendarEvent | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)

  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([])
  const [hallOfFameError, setHallOfFameError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const { from, to } = getCurrentWeekRange()

    getEvents(from, to)
      .then((response) => {
        if (!cancelled) {
          setEvents(response.events)
          setFeatured(response.featured)
          setEventsError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setEventsError('Não foi possível carregar os eventos.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getHallOfFame()
      .then((response) => {
        if (!cancelled) {
          setHallOfFame(response.entries)
          setHallOfFameError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHallOfFameError('Não foi possível carregar o hall da fama.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className={cn('calendario-page pb-20', pageShellClass)}>
      <PageHeader
        title="Calendário"
        lede="Classificatórias, campeonatos e eventos da comunidade desta semana."
      />

      {eventsError && (
        <p className={cn('calendario-page__error mb-6', alertClass)} role="alert">
          {eventsError}
        </p>
      )}

      {featured && (
        <div className="calendario-page__featured glow mb-14">
          <h2 className="headline-poster mb-5 text-[clamp(2rem,4vw,3rem)] text-ink">
            Próximo <span className="headline-accent">evento</span>
          </h2>
          <EventCard event={featured} showCountdown />
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="calendario-page__weekly">
          <SectionTitle>Agenda da semana</SectionTitle>
          {events.length === 0 ? (
            <p className={cn('calendario-page__empty', emptyClass)}>Nenhum evento agendado.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        <div className="calendario-page__hall-of-fame">
          <SectionTitle>Hall da fama</SectionTitle>
          {hallOfFameError ? (
            <p className={cn('calendario-page__error', alertClass)} role="alert">
              {hallOfFameError}
            </p>
          ) : hallOfFame.length === 0 ? (
            <p className={cn('calendario-page__empty', emptyClass)}>
              Nenhum campeão registrado ainda.
            </p>
          ) : (
            <ul className="calendario-page__hall-of-fame-list frame chamfer-lg">
              {hallOfFame.map((entry, index) => (
                <li
                  key={entry.id}
                  className="hall-of-fame-entry grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line/60 px-5 py-4 last:border-0"
                >
                  <span
                    aria-hidden="true"
                    className="scoreboard row-span-3 pt-0.5 text-2xl text-accent/60"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="hall-of-fame-entry__event text-xs text-mute">
                    {entry.eventName}
                  </span>
                  <span className="hall-of-fame-entry__champion font-display text-xl font-bold text-ink">
                    {entry.championName}
                    {entry.championTag ? ` [${entry.championTag}]` : ''}
                  </span>
                  {entry.prizeText && (
                    <span className="hall-of-fame-entry__prize mt-0.5 text-sm font-medium text-flare">
                      {entry.prizeText}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <h2 className="shrink-0 text-3xl text-ink">{children}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  )
}
