import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  title: string
  titleAccent?: string
  lede?: ReactNode
  aside?: ReactNode
  className?: string
}

/** Consistent, compact page masthead shared by all public sections. */
export function PageHeader({ title, titleAccent, lede, aside, className }: PageHeaderProps) {
  return (
    <header className={cn('page-header relative isolate flex flex-col gap-6 overflow-hidden border-b border-line pb-8 pt-11 sm:pb-10 sm:pt-14 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 size-64 rotate-12 border border-accent/10 bg-[linear-gradient(135deg,rgba(168,121,255,.08),transparent_65%)] sm:right-8 sm:size-80" />
      <div className="min-w-0">
        <p className="mb-3 flex items-center gap-2 text-[.68rem] font-bold uppercase tracking-[.2em] text-mute">
          <span className="size-1.5 bg-accent" /> ZKPVP <span className="text-line-strong">/</span> Central competitiva
        </p>
        <h1 className="headline-poster text-[clamp(2.7rem,6vw,5.5rem)] leading-[.94] tracking-[-.025em] text-ink">
          {title}{titleAccent && <><span className="sr-only"> </span>{' '}<span className="headline-accent">{titleAccent}</span></>}
        </h1>
        {lede && <p className="mt-4 max-w-2xl text-base leading-relaxed text-mute sm:text-lg">{lede}</p>}
      </div>
      {aside && <div className="w-full lg:w-auto lg:min-w-[22rem]">{aside}</div>}
    </header>
  )
}
