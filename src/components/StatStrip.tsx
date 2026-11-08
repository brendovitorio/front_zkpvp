import { cn } from '../lib/cn'

interface StatStripProps {
  /**
   * Dynamic `home_stats` map as returned by `GET /api/home-stats`
   * (snake_case keys, string values) — or `null` while the request is
   * still in flight / hasn't resolved yet.
   */
  stats: Record<string, string> | null
  className?: string
}

/** The fallback shown for a stat that's momentarily unavailable. */
const PLACEHOLDER = '--'

interface StatDef {
  key: string
  label: string
  /**
   * design.md restricts the emphasis accent to key numbers (prize, rating,
   * #1). Only the total prize pool qualifies on this strip.
   */
  emphasis?: boolean
}

/**
 * The 5 `home_stats` keys Task 7's seed script populates, in the fixed
 * display order design.md calls for, each paired with its PT-BR label.
 * A key missing from `stats` (still loading, or not yet seeded) falls back
 * to {@link PLACEHOLDER} rather than being omitted or throwing — the strip
 * must never crash just because one stat hasn't arrived yet.
 */
const STAT_DEFS: StatDef[] = [
  { key: 'contas_criadas', label: 'Contas Criadas' },
  { key: 'premiacao_total', label: 'Premiação Total', emphasis: true },
  { key: 'campeonatos', label: 'Campeonatos' },
  { key: 'clas', label: 'Clãs' },
  { key: 'banidos', label: 'Banidos' },
]

/**
 * The home page's "faixa de placar" (scoreboard strip) from design.md: a
 * horizontal strip with thin violet-glow borders and clipped corners —
 * deliberately not a generic rounded-corner SaaS card grid with a grey
 * box-shadow.
 *
 * Construction: the outer wrapper carries the violet `glow` (a drop-shadow
 * filter must live on a parent of the clipped element). The chamfered grid
 * paints violet hairlines as its background and lets them show through 1px
 * gaps between the cells.
 */
export function StatStrip({ stats, className }: StatStripProps) {
  return (
    <div className={cn('glow', className)}>
      <div
        className="stat-strip chamfer chamfer-lg grid grid-flow-row-dense grid-cols-2 gap-px bg-line-strong p-px sm:grid-cols-3 lg:grid-cols-[1fr_1.35fr_1fr_1fr_1fr]"
        data-testid="stat-strip"
      >
        {STAT_DEFS.map(({ key, label, emphasis }, index) => (
          <div
            key={key}
            className={cn(
              'stat-strip__item flex flex-col gap-2 bg-panel px-5 py-5 sm:px-6 sm:py-6',
              // 5 cells never fill a 2- or 3-col grid evenly. Phones: the wide
              // prize value takes its own full row (dense flow back-fills the
              // gap). 3-col tablets: the last cell spans the leftover 2 slots.
              emphasis && 'col-span-2 sm:col-span-1',
              index === STAT_DEFS.length - 1 && 'sm:col-span-2 lg:col-span-1',
              emphasis && 'bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-flare)_12%,var(--color-panel)),var(--color-panel)_65%)]',
            )}
          >
            <span className="stat-strip__label text-sm text-mute">{label}</span>
            <span
              className={cn(
                'stat-strip__value scoreboard whitespace-nowrap text-4xl sm:text-5xl',
                emphasis ? 'text-flare glyph-glow' : 'text-ink',
              )}
            >
              {stats?.[key] ?? PLACEHOLDER}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
