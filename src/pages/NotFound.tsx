import { Link } from 'react-router-dom'
import { buttonVariants, pageShellClass } from '../components/ui/variants'
import { cn } from '../lib/cn'

export function NotFound() {
  return (
    <section className={cn(pageShellClass, 'flex flex-1 items-center py-24 sm:py-32')}>
      <div>
        <p className="scoreboard text-sm tracking-[.24em] text-accent">ERRO 404 · FORA DA ARENA</p>
        <h1 className="headline-poster mt-4 text-7xl text-ink sm:text-9xl">Perdeu o <span className="headline-accent">drop.</span></h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-mute">Esse endereço não existe ou mudou de lugar. Volte para a arena e continue de onde parou.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className={cn(buttonVariants({ size: 'lg' }))} to="/">Ir para o início</Link>
          <Link className={cn(buttonVariants({ intent: 'outline', size: 'lg' }))} to="/painel">Minha conta</Link>
        </div>
      </div>
    </section>
  )
}
