import { cn } from '../../lib/cn'

/**
 * Organic stippled dot cluster — a loose, map-like scatter of dots used as
 * background scenery (distinct from the rigid `arena-backdrop` grid lines).
 *
 * Generation is deterministic (seeded PRNG) and runs once at module load, so
 * every render, SSR pass and screenshot gets the exact same pattern and React
 * never re-computes it. Dots are emitted as three `<path>` elements (one per
 * opacity tier) instead of hundreds of `<circle>` nodes, keeping the DOM tiny.
 */

const VIEW_W = 640
const VIEW_H = 420
const STEP = 8.5

interface Blob {
  x: number
  y: number
  /** Spread (standard deviation) in viewBox units. */
  s: number
  /** Peak density 0..1. */
  w: number
}

/** Overlapping gaussian "landmasses" that shape the cluster. */
const BLOBS: Blob[] = [
  { x: 210, y: 170, s: 120, w: 0.95 },
  { x: 410, y: 120, s: 80, w: 0.8 },
  { x: 470, y: 270, s: 95, w: 0.85 },
  { x: 300, y: 320, s: 70, w: 0.6 },
  { x: 90, y: 300, s: 55, w: 0.5 },
  { x: 560, y: 80, s: 40, w: 0.45 },
]

/** mulberry32: tiny, fast, deterministic PRNG. */
function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function densityAt(x: number, y: number): number {
  let d = 0
  for (const b of BLOBS) {
    const dx = x - b.x
    const dy = y - b.y
    d = Math.max(d, b.w * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s)))
  }
  return d
}

/** SVG path data for one dot: two half-arcs forming a filled circle. */
function dot(x: number, y: number, r: number): string {
  const cy = y.toFixed(1)
  const rr = r.toFixed(2)
  return `M${(x - r).toFixed(1)} ${cy}a${rr} ${rr} 0 1 0 ${(r * 2).toFixed(2)} 0a${rr} ${rr} 0 1 0 ${(-r * 2).toFixed(2)} 0Z`
}

function buildTiers(seed: number): [string, string, string] {
  const rand = createRng(seed)
  const tiers: [string[], string[], string[]] = [[], [], []]

  for (let gy = STEP / 2; gy < VIEW_H; gy += STEP) {
    for (let gx = STEP / 2; gx < VIEW_W; gx += STEP) {
      // Jitter breaks the grid so the result reads as scatter, not halftone.
      const x = gx + (rand() - 0.5) * STEP * 0.9
      const y = gy + (rand() - 0.5) * STEP * 0.9
      const d = densityAt(x, y)
      if (rand() > d * 0.92) continue

      const r = 0.7 + d * 1.25 + rand() * 0.35
      const tier = d > 0.62 ? 2 : d > 0.32 ? 1 : 0
      tiers[tier].push(dot(x, y, r))
    }
  }

  return [tiers[0].join(''), tiers[1].join(''), tiers[2].join('')]
}

const DEFAULT_TIERS = buildTiers(0x2b7e)

interface StippleFieldProps {
  className?: string
}

export function StippleField({ className }: StippleFieldProps) {
  const [faint, mid, dense] = DEFAULT_TIERS

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn('pointer-events-none', className)}
    >
      <path d={faint} fill="var(--color-mute)" fillOpacity={0.22} />
      <path d={mid} fill="var(--color-accent)" fillOpacity={0.38} />
      <path d={dense} fill="var(--color-accent)" fillOpacity={0.62} />
    </svg>
  )
}
