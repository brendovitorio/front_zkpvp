import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { searchInputClass } from './variants'

/**
 * `<input type="search">` with a leading magnifier glyph. Every prop is
 * forwarded to the input untouched (value/onChange/placeholder/className),
 * so callers keep full control of behavior; this only adds the visual frame.
 */
export function SearchField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" strokeLinecap="round" />
      </svg>
      <input type="search" {...props} className={cn(searchInputClass, className)} />
    </div>
  )
}
