import { Link } from 'react-router-dom'
import { pageShellClass } from './ui/variants'

const footerLinks = [
  { to: '/ranking', label: 'Ranking' },
  { to: '/descobrir', label: 'Jogadores' },
  { to: '/calendario', label: 'Campeonatos' },
  { to: '/loja', label: 'Loja' },
  { to: '/painel', label: 'Minha conta' },
  { to: '/termos', label: 'Termos' },
  { to: '/privacidade', label: 'Privacidade' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-panel/35">
      <div className={`${pageShellClass} grid gap-8 py-9 sm:grid-cols-[1fr_auto] sm:items-center`}>
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="ZKPVP — início" className="shrink-0">
            <img src="/images/zkpvp-wordmark.png" alt="ZKPVP" width="100" height="52" className="h-10 w-20 object-cover" loading="lazy" />
          </Link>
          <div className="border-l border-line pl-4">
            <p className="font-display font-bold tracking-wide text-ink">A arena é sua.</p>
            <p className="mt-1 text-xs text-mute">Comunidade competitiva de PVP FiveM.</p>
          </div>
        </div>
        <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-mute">
          {footerLinks.map(({ to, label }) => <Link key={to} className="transition-colors hover:text-ink" to={to}>{label}</Link>)}
        </nav>
      </div>
      <div className="border-t border-line/70">
        <div className={`${pageShellClass} flex flex-col gap-2 py-4 text-xs text-mute/75 sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} ZKPVP. Todos os direitos reservados.</p>
          <p>Não afiliado à Rockstar Games ou Cfx.re.</p>
        </div>
      </div>
    </footer>
  )
}
