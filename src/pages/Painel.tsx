import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { buttonVariants, emptyClass, pageShellClass } from '../components/ui/variants'
import { API_BASE, ApiError, getAccountDashboard, getEvents, getServerStatus, type AccountDashboardResponse, type CalendarEvent } from '../lib/api'
import { cn } from '../lib/cn'
import { useAuth } from '../state/AuthContext'

const numberFormat = new Intl.NumberFormat('pt-BR')
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const entitlementName: Record<AccountDashboardResponse['entitlements'][number]['kind'], string> = {
  vip: 'VIP',
  skin: 'Skin',
  vehicle: 'Veículo',
}

const modeName: Record<string, string> = {
  diario: 'Diario',
  semanal: 'Semanal',
  mensal: 'Mensal',
  mvp: 'MVP',
}

function formatExpiration(expiresAt: string | null) {
  return expiresAt ? `Até ${dateFormat.format(new Date(expiresAt))}` : 'Acesso vitalício'
}

export function Painel() {
  const { player, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<AccountDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [authExpired, setAuthExpired] = useState(false)
  const [upcomingEvent, setUpcomingEvent] = useState<CalendarEvent | null>(null)
  const [onlinePlayers, setOnlinePlayers] = useState<number | null>(null)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!player) return
    let active = true
    setLoading(true)
    setError(false)
    getAccountDashboard()
      .then((result) => { if (active) setData(result) })
      .catch((caught: unknown) => {
        if (!active) return
        setError(true)
        if (caught instanceof ApiError && caught.status === 401) {
          setData(null)
          setAuthExpired(true)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    getEvents(new Date().toISOString())
      .then(({ events, featured }) => { if (active) setUpcomingEvent(featured ?? events[0] ?? null) })
      .catch(() => { if (active) setUpcomingEvent(null) })
    getServerStatus()
      .then(({ online }) => { if (active) setOnlinePlayers(online) })
      .catch(() => { if (active) setOnlinePlayers(null) })
    return () => { active = false }
  }, [player, refresh])

  if (authLoading) {
    return <section className={cn(pageShellClass, 'flex-1 py-24')}><p className="text-mute">Carregando sua conta…</p></section>
  }

  if (!player) {
    return (
      <section className={cn(pageShellClass, 'flex flex-1 items-center py-20 sm:py-28')}>
        <div className="frame frame-hot chamfer-lg max-w-3xl p-7 sm:p-12">
          <p className="scoreboard mb-3 text-sm tracking-[.24em] text-accent">ÁREA DO JOGADOR</p>
          <h1 className="headline-poster text-5xl text-ink sm:text-7xl">Seu jogo. <span className="headline-accent">Sua jornada.</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">Entre com seu Discord para acompanhar suas estatísticas, posição no ranking e os benefícios da sua conta.</p>
          <a className={cn(buttonVariants({ size: 'lg' }), 'mt-8')} href={`${API_BASE}/auth/discord/login`}>Entrar com Discord</a>
        </div>
      </section>
    )
  }

  if (loading && !data) {
    return <section className={cn(pageShellClass, 'flex-1 py-24')}><p className="text-mute">Carregando seu painel…</p></section>
  }

  if (error && !data) {
    return (
      <section className={cn(pageShellClass, 'flex-1 py-24')}>
        <div className="frame chamfer-lg max-w-xl p-7">
          <p className="text-lg text-ink">Não conseguimos carregar seu painel agora.</p>
          {authExpired && <p className="mt-2 text-sm text-mute">Sua sessão expirou. Entre com o Discord novamente para continuar.</p>}
          {authExpired && <a className={cn(buttonVariants(), 'mt-5')} href={`${API_BASE}/auth/discord/login`}>Entrar com Discord</a>}
          {!authExpired && <button className={cn(buttonVariants({ intent: 'outline' }), 'mt-5')} onClick={() => setRefresh((value) => value + 1)}>Tentar novamente</button>}
        </div>
      </section>
    )
  }

  if (!data) return null

  const globalStats = data.stats.global ?? { matches: 0, wins: 0, kd: 0, avgKills: 0, rating: 0, ranked: false }
  const initials = data.profile.displayName.trim().slice(0, 1).toUpperCase() || 'Z'
  const metrics = [
    { label: 'Posição global', value: data.globalPosition ? `#${numberFormat.format(data.globalPosition)}` : '—', note: globalStats.ranked ? 'Ranking ativo' : 'Ainda sem colocação' },
    { label: 'Partidas', value: numberFormat.format(globalStats.matches), note: 'Modo global' },
    { label: 'Vitórias', value: numberFormat.format(globalStats.wins), note: 'No histórico' },
    { label: 'K/D', value: globalStats.kd.toFixed(2).replace('.', ','), note: 'Média global' },
    { label: 'Rating', value: numberFormat.format(globalStats.rating), note: 'Pontuação atual' },
  ]

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError(false)
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      setLogoutError(true)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <section className="relative flex-1 overflow-hidden pb-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_70%_0%,rgba(153,91,255,.19),transparent_58%)]" />
      <div className={cn(pageShellClass, 'relative pt-10 sm:pt-14')}>
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.24em] text-mute">
          <span className="size-2 bg-accent" /> Central do jogador <span className="text-line-strong">/</span> temporada atual
        </div>

        <section className="relative isolate mb-6 overflow-hidden border border-line bg-panel/80 p-6 sm:p-9">
          <div aria-hidden="true" className="absolute -right-8 -top-16 -z-10 select-none font-display text-[14rem] font-black leading-none text-accent/[.045] sm:text-[20rem]">ZK</div>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="flex items-center gap-5 sm:gap-7">
              <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-accent/60 bg-accent/10 font-display text-4xl font-black text-accent shadow-[0_0_36px_rgba(168,121,255,.18)] sm:size-24 sm:text-5xl">
                {!avatarFailed && data.profile.discordAvatarUrl ? <img src={data.profile.discordAvatarUrl} alt={`Foto de perfil de ${data.profile.discordUsername}`} className="size-full rounded-full object-cover" onError={() => setAvatarFailed(true)} /> : <span aria-hidden="true">{initials}</span>}
              </div>
              <div>
                <p className="scoreboard mb-2 text-xs tracking-[.18em] text-accent">BEM-VINDO DE VOLTA</p>
                <h1 className="headline-poster text-4xl text-ink sm:text-6xl">{data.profile.displayName}</h1>
                <p className="mt-2 text-sm text-mute">Discord @{data.profile.discordUsername}{data.profile.clanTag && <span className="ml-2 border border-line px-2 py-0.5 font-semibold text-ink">[{data.profile.clanTag}]</span>}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('inline-flex items-center gap-2 border px-3 py-2 text-sm', data.profile.linkedToFiveM ? 'border-online/30 bg-online/10 text-ink' : 'border-line bg-void text-mute')}>
                <span className={cn('size-2 rounded-full', data.profile.linkedToFiveM ? 'bg-online' : 'bg-mute')} />
                {data.profile.linkedToFiveM ? 'FiveM vinculado' : 'FiveM não vinculado'}
              </span>
              {!data.profile.linkedToFiveM && <Link className={cn(buttonVariants({ size: 'sm' }))} to="/cadastro">Vincular conta</Link>}
              <button type="button" className={cn(buttonVariants({ intent: 'ghost', size: 'sm' }), 'border border-line px-3')} onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? 'Saindo…' : 'Sair da conta'}
              </button>
            </div>
          </div>
          {logoutError && <p role="alert" className="mt-5 border-l-2 border-danger bg-danger/8 px-4 py-2 text-sm text-danger">Não foi possível encerrar a sessão. Tente novamente.</p>}
        </section>

        <section aria-label="Estatísticas da conta" className="mb-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((metric, index) => (
            <article key={metric.label} className={cn('bg-panel p-5 sm:p-6', index === 0 && 'bg-accent/[.08]')}>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-mute">{metric.label}</p>
              <p className="scoreboard mt-3 text-4xl text-ink sm:text-5xl">{metric.value}</p>
              <p className="mt-2 text-xs text-mute">{metric.note}</p>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.8fr)]">
          <div className="flex flex-col gap-6">
            <section className="border border-line bg-panel/70">
              <div className="flex items-end justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
                <div><p className="scoreboard text-xs tracking-[.18em] text-accent">INVENTÁRIO</p><h2 className="mt-1 text-2xl text-ink sm:text-3xl">Seus benefícios</h2></div>
                <Link className="text-sm font-semibold text-mute transition-colors hover:text-ink" to="/loja">Ver loja <span aria-hidden="true">↗</span></Link>
              </div>
              {data.entitlements.length ? (
                <ul className="divide-y divide-line">
                  {data.entitlements.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid size-11 shrink-0 place-items-center border border-accent/25 bg-accent/10 scoreboard text-lg text-accent">{item.kind === 'vip' ? 'V' : item.kind === 'skin' ? 'S' : 'M'}</span>
                        <div className="min-w-0"><p className="truncate font-semibold text-ink">{item.key}</p><p className="mt-1 text-xs text-mute">{entitlementName[item.kind]} · {formatExpiration(item.expiresAt)}</p></div>
                      </div>
                      <span className="shrink-0 border border-online/25 bg-online/8 px-2.5 py-1 text-[.68rem] font-bold uppercase tracking-wider text-online">Ativo</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 sm:px-7">
                  <p className="text-mute">Seu inventário ainda está vazio.</p>
                  <Link className={cn(buttonVariants({ intent: 'outline', size: 'sm' }), 'mt-4')} to="/loja">Explorar benefícios</Link>
                </div>
              )}
            </section>

            <section className="border border-line bg-panel/70">
              <div className="border-b border-line px-5 py-5 sm:px-7"><p className="scoreboard text-xs tracking-[.18em] text-accent">COMPETITIVO</p><h2 className="mt-1 text-2xl text-ink sm:text-3xl">Resultados recentes</h2></div>
              {data.recentResults.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="px-5 py-3 font-medium sm:px-7">Etapa</th><th className="px-3 py-3 font-medium">Modo</th><th className="px-3 py-3 font-medium">Colocação</th><th className="px-3 py-3 font-medium">Vitórias</th><th className="px-5 py-3 font-medium sm:px-7">Abates</th></tr></thead>
                    <tbody className="divide-y divide-line">{data.recentResults.map((result, index) => <tr key={`${result.mode}-${result.stage}-${index}`} className="text-ink"><td className="px-5 py-4 font-semibold sm:px-7">{result.stage}</td><td className="px-3 py-4 text-mute">{modeName[result.mode] ?? result.mode}</td><td className="px-3 py-4 scoreboard text-lg">#{result.position}</td><td className="px-3 py-4">{result.wins}</td><td className="px-5 py-4 sm:px-7">{result.eliminations}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p className={cn(emptyClass, 'm-5 border-0')}>Seus resultados de campeonato aparecerão aqui.</p>}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="border border-line bg-panel/70 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div><p className="scoreboard text-xs tracking-[.18em] text-accent">ZKPVP AO VIVO</p><h2 className="mt-1 text-2xl text-ink">Servidor</h2></div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mute"><span className={cn('size-2 rounded-full', onlinePlayers === null ? 'bg-mute' : 'animate-pulse-online bg-online')} />{onlinePlayers === null ? 'Sem sinal' : 'Online'}</span>
              </div>
              <p className="scoreboard mt-5 text-5xl text-ink">{onlinePlayers === null ? '—' : numberFormat.format(onlinePlayers)}</p>
              <p className="mt-1 text-sm text-mute">jogadores conectados agora</p>
            </section>

            <section className="border border-line bg-panel/70 p-5 sm:p-7">
              <p className="scoreboard text-xs tracking-[.18em] text-accent">NA AGENDA</p>
              {upcomingEvent ? <><h2 className="mt-1 text-2xl text-ink">{upcomingEvent.title}</h2><p className="mt-2 text-sm text-mute">{dateFormat.format(new Date(upcomingEvent.startsAt))} · {upcomingEvent.category}</p>{upcomingEvent.prizeText && <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-ink">Premiação: {upcomingEvent.prizeText}</p>}</> : <p className="mt-3 text-sm text-mute">Nenhum evento confirmado por enquanto.</p>}
              <Link className="mt-5 inline-flex text-sm font-bold text-ink underline decoration-accent underline-offset-4" to="/calendario">Ver calendário <span className="ml-2 text-accent">→</span></Link>
            </section>

            <section className="border border-line bg-panel/70 p-5 sm:p-7">
              <p className="scoreboard text-xs tracking-[.18em] text-accent">ATALHOS</p>
              <h2 className="mt-1 text-2xl text-ink">Continue de onde parou</h2>
              <div className="mt-5 grid gap-2">
                <Link className="group flex items-center justify-between border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-accent/50 hover:bg-accent/5" to="/ranking"><span>Conferir ranking</span><span className="text-accent transition-transform group-hover:translate-x-1">→</span></Link>
                <Link className="group flex items-center justify-between border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-accent/50 hover:bg-accent/5" to="/calendario"><span>Próximos campeonatos</span><span className="text-accent transition-transform group-hover:translate-x-1">→</span></Link>
                <Link className="group flex items-center justify-between border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-accent/50 hover:bg-accent/5" to="/descobrir"><span>Encontrar jogadores</span><span className="text-accent transition-transform group-hover:translate-x-1">→</span></Link>
              </div>
            </section>

            <section className="relative isolate overflow-hidden border border-accent/25 bg-accent/[.07] p-5 sm:p-7">
              <span aria-hidden="true" className="absolute -right-3 -top-7 -z-10 font-display text-9xl font-black text-accent/[.08]">01</span>
              <p className="scoreboard text-xs tracking-[.18em] text-accent">SEU PERFIL</p>
              <h2 className="mt-1 text-2xl text-ink">Conta criada</h2>
              <p className="mt-3 text-sm leading-relaxed text-mute">Você chegou à ZKPVP em {dateFormat.format(new Date(data.profile.createdAt))}. Vincule seu personagem FiveM para ativar sua conta competitiva.</p>
              {!data.profile.linkedToFiveM && <Link className="mt-5 inline-flex text-sm font-bold text-ink underline decoration-accent underline-offset-4" to="/cadastro">Finalizar cadastro <span className="ml-2 text-accent">→</span></Link>}
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
