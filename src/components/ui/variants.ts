import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Shared visual primitives as class-variance-authority recipes.
 *
 * These return class strings rather than wrapping elements in components, so
 * pages keep their existing semantic markup (`<button role="tab">`, plain
 * `<a href>` for server redirects, etc.) and just opt into the look.
 */

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-display font-bold tracking-wide transition-[background-color,color,filter,opacity] duration-150',
    'disabled:cursor-not-allowed disabled:opacity-45',
    // clip-path would slice an outer outline off, so focus is drawn inset.
    'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-ink)]',
  ],
  {
    variants: {
      intent: {
        /** Brand CTA: solid violet, chamfered. One per view, ideally. */
        primary: 'chamfer bg-accent text-ink hover:brightness-115 disabled:brightness-100',
        /** Secondary: hairline violet outline on the panel fill. */
        outline: 'frame text-ink hover:frame-lit focus-visible:[--frame-edge:var(--color-ink)]',
        /** Tertiary text action (remove, back). */
        ghost: 'text-mute hover:text-ink',
      },
      size: {
        sm: 'chamfer-sm h-9 px-4 text-[0.95rem]',
        md: 'h-11 px-6 text-base',
        lg: 'chamfer-lg h-14 px-9 text-xl',
      },
    },
    compoundVariants: [{ intent: 'ghost', className: 'h-auto px-0' }],
    defaultVariants: { intent: 'primary', size: 'md' },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

/** Container for a row of `role="tab"` buttons: underline-style segmented bar. */
export const tabListClass =
  'flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]'

/** A single tab; active state keyed off the existing `aria-selected` attribute. */
export const tabClass = [
  'relative -mb-px shrink-0 border-b-2 border-transparent px-4 pb-2.5 pt-1.5',
  'font-display text-lg font-semibold text-mute transition-colors duration-150',
  'hover:text-ink',
  'aria-selected:border-accent aria-selected:text-ink',
].join(' ')

/** Search / text input with a leading magnifier slot (pair with SearchIcon). */
export const searchInputClass = 'h-11 pl-10 pr-3'

/** Form field label. */
export const labelClass = 'mb-1.5 block text-sm font-medium text-mute'

/** Small categorical tag (clan tag, event category, changelog category). */
export const chipVariants = cva(
  'chamfer chamfer-sm inline-flex items-center px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral: 'bg-accent/12 text-mute',
        accent: 'bg-accent/22 text-ink',
        solid: 'bg-accent text-ink',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

/** Standard page width + gutters. Mobile gutter is 16px per the brief. */
export const pageShellClass = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

/** Inline status messages. */
export const alertClass = 'border-l-2 border-danger bg-danger/8 px-4 py-3 text-sm text-danger'
export const emptyClass = 'border border-dashed border-line px-5 py-10 text-center text-mute'
export const successClass = 'border-l-2 border-online bg-online/10 px-4 py-3 text-sm text-ink'
