import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { pageShellClass } from '../../components/ui/variants'
import { cn } from '../../lib/cn'

export interface LegalSectionData {
  id: string
  title: string
  content: ReactNode
}

export function LegalDocument({
  title,
  titleAccent,
  lede,
  sections,
}: {
  title: string
  titleAccent: string
  lede: string
  sections: LegalSectionData[]
}) {
  return (
    <div className={cn(pageShellClass, 'legal-document flex-1 pb-20')}>
      <PageHeader title={title} titleAccent={titleAccent} lede={lede} />
      <div className="my-6 border border-accent/25 bg-accent/[.06] px-5 py-4 text-sm leading-relaxed text-mute sm:px-6">
        <strong className="text-ink">Documento inicial da ZKPVP.</strong>{' '}
        Antes da versão final, a equipe deve informar a identificação jurídica do operador e publicar o link do canal oficial de suporte no Discord.
      </div>
      <p className="mb-8 text-xs font-semibold uppercase tracking-[.14em] text-mute/75">Versão 1.0 · Atualizado em 7 de novembro de 2026</p>
      <div className="grid items-start gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Nesta página" className="lg:sticky lg:top-28">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-accent">Nesta página</p>
          <ul className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] lg:flex-col lg:overflow-visible">
            {sections.map((section) => <li key={section.id} className="shrink-0"><a className="block border-l border-line px-3 py-1.5 text-sm text-mute transition-colors hover:border-accent hover:text-ink" href={`#${section.id}`}>{section.title}</a></li>)}
          </ul>
          <div className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-mute">
            Leia também a <Link className="text-ink underline decoration-accent underline-offset-4" to="/privacidade">Política de Privacidade</Link>.
          </div>
        </nav>
        <article className="min-w-0 divide-y divide-line border-t border-line">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 py-7 sm:py-8">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink sm:text-3xl">{section.title}</h2>
              <div className="legal-copy mt-4 max-w-3xl space-y-4 text-sm leading-7 text-mute sm:text-base">{section.content}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
