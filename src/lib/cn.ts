import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge needs to know about the custom `@utility` classes from
 * `global.css` that conflict with each other, otherwise it treats
 * `chamfer-sm` and `chamfer-lg` as unrelated and keeps both.
 */
const twMerge = extendTailwindMerge<'chamfer-size'>({
  extend: {
    classGroups: {
      'chamfer-size': ['chamfer-sm', 'chamfer-lg'],
    },
  },
})

/**
 * Conditional class composition (clsx) + Tailwind conflict resolution
 * (tailwind-merge): later classes win, so `cn(base, props.className)` lets a
 * caller override a primitive's defaults without `!important`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
