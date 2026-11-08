import type { StoreItem } from '../lib/api'
import { cn } from '../lib/cn'
import { buttonVariants, chipVariants } from './ui/variants'

interface StoreItemCardProps {
  item: StoreItem
  onAdd: () => void
}

/**
 * Single store item card for the Loja grid: name, category, price in BRL,
 * and an "add to cart" action. Purely presentational — the Loja
 * page owns the cart and passes down what clicking "Adicionar" should do.
 *
 * Items have no artwork yet (`imageUrl` is null in seed data), so the top of
 * the card is a generated "display case": arena grid + a faceted diamond
 * glyph, rather than an empty grey placeholder box.
 */
export function StoreItemCard({ item, onAdd }: StoreItemCardProps) {
  return (
    <article className="store-item-card group frame chamfer-lg flex flex-col hover:[--frame-edge:var(--color-line-strong)]">
      <div className="relative grid h-36 place-items-center overflow-hidden border-b border-line">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <>
            <div aria-hidden="true" className="arena-backdrop absolute inset-0 opacity-70" />
            <DiamondGlyph className="relative size-14 text-accent transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105" />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <header className="store-item-card__header flex flex-col items-start gap-2">
          <span className={chipVariants({ className: 'store-item-card__category' })}>
            {item.category}
          </span>
          <h3 className="store-item-card__name text-2xl text-ink">{item.name}</h3>
        </header>

        <p className="store-item-card__price display mt-auto flex items-baseline gap-2 pb-5 pt-4">
          <span className="scoreboard text-4xl text-ink">{(item.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </p>

        <button
          type="button"
          onClick={onAdd}
          className={cn(buttonVariants({ intent: 'outline', size: 'sm' }), 'w-full')}
          disabled={item.stockQuantity === 0}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  )
}

function DiamondGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M14 8h20l10 12-20 22L4 20 14 8Z" fill="currentColor" fillOpacity="0.14" />
      <path
        d="M14 8h20l10 12-20 22L4 20 14 8Zm-10 12h40M14 8l10 34M34 8 24 42M14 8l4 12m16-12-4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
