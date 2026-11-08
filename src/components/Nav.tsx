import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { API_BASE } from '../lib/api'
import { cn } from '../lib/cn'
import { useAuth } from '../state/AuthContext'
import { buttonVariants, pageShellClass } from './ui/variants'

interface PublicNavLink {
  to: string
  label: string
}

const PUBLIC_LINKS: PublicNavLink[] = [
  { to: '/', label: 'Início' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/descobrir', label: 'Descobrir' },
  { to: '/calendario', label: 'Calendário' },
  { to: '/atualizacoes', label: 'Atualizações' },
  { to: '/loja', label: 'Loja' },
]

/**
 * Persistent top-level navigation.
 *
 * Renders the brand mark, the six public routes, a live online-player-count
 * slot (data wired in Task 12), and the Discord login CTA. `GET
 * /auth/discord/login` is a real server-side redirect (not a client-side
 * route), so the logged-out state is a plain `<a href>` straight to the
 * backend — never a React Router `<Link>` or a JS-driven button — so a
 * click navigates the browser directly there. While logged in, the
 * player's display name is shown instead.
 *
 * Layout: one sticky row on desktop (brand · links · account). Below `md`
 * the links drop to a second, horizontally scrollable row so all six stay
 * reachable at 375px without a JS-driven hamburger menu.
 */
export function Nav() {
  const { player, loading } = useAuth()

  return (
    <header className="nav sticky top-0 z-40 border-b border-line bg-void/92 shadow-[0_10px_35px_rgba(0,0,0,.22)] backdrop-blur-xl after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-accent/55 after:to-transparent">
      <div
        className={cn(
          pageShellClass,
          'grid grid-cols-[auto_1fr_auto] items-center gap-x-3 md:h-[4.5rem] md:gap-x-6',
        )}
      >
        <NavLink
          to="/"
          className="nav__brand group relative col-start-1 row-start-1 flex h-[3.65rem] items-center overflow-hidden md:h-auto"
          end
          aria-label="ZKPVP — Início"
        >
          <img
            src="/images/zkpvp-wordmark.png"
            alt="ZKPVP"
            width="140"
            height="72"
            className="nav__brand-mark h-11 w-[5.5rem] object-cover transition-[filter] group-hover:brightness-125"
          />
        </NavLink>

        <nav
          aria-label="Principal"
          className="col-span-3 col-start-1 row-start-2 -mx-4 border-t border-line/60 px-4 py-1 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-0 md:border-0 md:px-0 md:py-0"
        >
          <ul className="nav__links flex gap-1 overflow-x-auto [scrollbar-width:none] md:justify-center">
            {PUBLIC_LINKS.map(({ to, label }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-9 items-center rounded-sm border px-3 text-[.82rem] font-semibold transition-[background,color,border-color] md:h-10 md:px-3.5',
                      isActive
                        ? 'border-accent/25 bg-panel text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.035)]'
                        : 'border-transparent text-mute hover:border-line hover:bg-panel/55 hover:text-ink',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-start-3 row-start-1 flex items-center justify-end gap-4">
          {/* Online-player count: populated in Task 12 */}
          <span
            className="nav__online-count hidden text-sm text-mute empty:hidden"
            data-testid="online-count"
          />

          {!loading &&
            (player ? (
              <Link
                to="/painel"
                className="nav__player flex min-h-10 items-center gap-2 rounded-sm border border-line bg-panel/45 px-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/60 hover:bg-panel sm:px-3"
                data-testid="nav-player"
              >
                <DiscordAvatar url={player.discordAvatarUrl} name={player.displayName} />
                <span className="max-w-24 truncate sm:max-w-36">{player.displayName}</span>
                <span className="hidden text-xs text-accent sm:inline">Meu painel</span>
              </Link>
            ) : (
              <span className="cta-halo cta-halo-sm cta-halo-hover">
                <a
                  className={cn('nav__login-cta', buttonVariants({ size: 'sm' }))}
                  href={`${API_BASE}/auth/discord/login`}
                >
                  <DiscordGlyph />
                  Entrar com Discord
                </a>
              </span>
            ))}
        </div>
      </div>
    </header>
  )
}

function DiscordAvatar({ url, name }: { url?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-accent/20 text-[.65rem] font-bold text-accent">{name.slice(0, 1).toUpperCase()}</span>
  return <img src={url} alt="" className="size-6 rounded-full border border-accent/50 object-cover" onError={() => setFailed(true)} />
}

/** Discord mark, decorative (the link text carries the accessible name). */
function DiscordGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.6 0L8.6 3a19.5 19.5 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.8 19.8 0 0 0 6 3l1.3-2.1a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.7 19.7 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7ZM8.3 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.4 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  )
}
