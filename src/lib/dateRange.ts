/** Zero-pads a date component and joins as `YYYY-MM-DD`. */
function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Computes the Monday-through-Sunday window containing `reference`
 * (defaults to now), as `{ from, to }` `YYYY-MM-DD` strings for
 * `GET /api/events?from=&to=` (Task 11).
 *
 * design.md's Calendário section specifically scopes the agenda to
 * "Semana atual" (the reference screenshots show a bounded strip like
 * "02 A 08 DE NOVEMBRO") — fetching with no `from`/`to` would instead
 * return every event ever created as the table grows, defeating the point
 * of those params.
 *
 * Pulled out of `Calendario.tsx` into its own module (rather than a named
 * export alongside the page component) so that file stays component-only
 * — mixing component and plain-function exports in one `.tsx` file trips
 * the `react/only-export-components` fast-refresh lint rule.
 *
 * `Date#getDay()` is 0 (Sunday) through 6 (Saturday); Monday is 1. The
 * Sunday branch needs `-6` rather than `1 - 0 = 1` since going "back to
 * Monday" from a Sunday means going back 6 days, not forward 1.
 */
export function getCurrentWeekRange(reference: Date = new Date()): {
  from: string
  to: string
} {
  const dayOfWeek = reference.getDay()
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(reference)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() + offsetToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return { from: formatDateOnly(monday), to: formatDateOnly(sunday) }
}
