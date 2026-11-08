import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  /** ISO 8601 timestamp of the moment being counted down to. */
  targetIso: string
}

const TICK_MS = 1000

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * Formats a millisecond duration as `Xd HHh MMm SSs` (days segment omitted
 * once under 24h), or `Ao vivo` once the target has passed — the countdown
 * never shows a negative duration.
 */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Ao vivo'

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const clock = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
  return days > 0 ? `${days}d ${clock}` : clock
}

interface Segment {
  value: string
  unit: string
}

/**
 * Same arithmetic as {@link formatRemaining}, split into labelled segments
 * for the scoreboard display. Returns `null` once the target has passed.
 */
function splitRemaining(ms: number): Segment[] | null {
  if (ms <= 0) return null

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const segments: Segment[] = [
    { value: pad(Math.floor((totalSeconds % 86400) / 3600)), unit: 'h' },
    { value: pad(Math.floor((totalSeconds % 3600) / 60)), unit: 'm' },
    { value: pad(totalSeconds % 60), unit: 's' },
  ]
  return days > 0 ? [{ value: pad(days), unit: 'd' }, ...segments] : segments
}

/**
 * Live countdown to `targetIso`. Ticks every second via `setInterval` while
 * mounted and clears that interval on unmount — this must never leak: a
 * stray interval calling `setState` after unmount would both warn in tests
 * and keep running across every subsequent test in the same file/process.
 *
 * Rendered as scoreboard segments (big slanted numerals + small unit). The
 * whole string from {@link formatRemaining} is exposed as the accessible
 * label so screen readers hear "2d 04h 10m 05s", not eight loose tokens.
 */
export function CountdownTimer({ targetIso }: CountdownTimerProps) {
  const target = new Date(targetIso).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [])

  const remaining = target - now
  const segments = splitRemaining(remaining)

  return (
    <span
      className="countdown-timer flex flex-wrap items-end gap-2 sm:gap-3"
      data-testid="countdown-timer"
      role="timer"
      aria-label={formatRemaining(remaining)}
    >
      {segments === null ? (
        <span className="flex items-center gap-3 font-display text-4xl font-bold text-ink">
          <span aria-hidden="true" className="size-3 animate-pulse-online rounded-full bg-online" />
          Ao vivo
        </span>
      ) : (
        segments.map(({ value, unit }) => (
          <span
            key={unit}
            aria-hidden="true"
            className="chamfer chamfer-sm flex min-w-[4.5rem] items-baseline justify-center gap-1 bg-void/70 px-3 py-2 sm:min-w-[5.5rem]"
          >
            <span className="scoreboard text-5xl text-ink sm:text-6xl">{value}</span>
            <span className="font-display text-lg font-semibold text-accent">{unit}</span>
          </span>
        ))
      )}
    </span>
  )
}
