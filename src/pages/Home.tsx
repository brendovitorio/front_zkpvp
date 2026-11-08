import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TypingLine } from '../components/TypingLine'
import { StatStrip } from '../components/StatStrip'
import { buttonVariants, pageShellClass } from '../components/ui/variants'
import { cn } from '../lib/cn'
import { getHomeStats, getServerStatus } from '../lib/api'
import { useAuth } from '../state/AuthContext'

const HOW_TO_PLAY_STEPS = [
  { number: '01', title: 'Crie sua conta', description: 'Entre com Discord e vincule seu personagem para liberar o acesso.' },
  { number: '02', title: 'Entre na arena', description: 'Conecte ao servidor FiveM e jogue no seu modo competitivo favorito.' },
  { number: '03', title: 'Construa seu legado', description: 'Some vitórias, suba no ranking e conquiste seu lugar na comunidade.' },
]

const MODES = [
  { number: '01', name: 'Eliminações', detail: 'Cada confronto conta' },
  { number: '02', name: 'Vitórias', detail: 'Consistência em primeiro lugar' },
  { number: '03', name: 'Desempenho', detail: 'Evolua partida após partida' },
]

export function Home() {
  const { player } = useAuth()
  const [online, setOnline] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    let cancelled = false
    getServerStatus().then(({ online: count }) => { if (!cancelled) setOnline(count) }).catch(() => { if (!cancelled) setOnline(null) })
    getHomeStats().then(({ stats: values }) => { if (!cancelled) setStats(values) }).catch(() => { if (!cancelled) setStats(null) })
    return () => { cancelled = true }
  }, [])

  const primaryPath = player?.fivemLicense ? '/painel' : '/cadastro'
  const primaryLabel = player?.fivemLicense ? 'Abrir meu painel' : player ? 'Vincular meu FiveM' : 'Entrar na ZKPVP'

  return (
    <div className="home-page">
      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-line lg:min-h-[calc(100svh-4.5rem)]">
        <div aria-hidden="true" className="absolute inset-0 -z-20">
          <img src="/images/hero.png" alt="" className="absolute inset-0 size-full object-cover object-[68%_center]" fetchPriority="high" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#090A10_0%,rgba(9,10,16,.98)_14%,rgba(9,10,16,.82)_42%,rgba(9,10,16,.18)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#090A10_0%,rgba(9,10,16,.08)_34%,rgba(9,10,16,.22)_100%)]" />
          <div className="absolute inset-0 opacity-[.17] [background-image:linear-gradient(to_right,rgba(168,121,255,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,121,255,.22)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(90deg,black,transparent_85%)]" />
          <div className="absolute -right-32 top-1/4 size-[34rem] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className={cn(pageShellClass, 'relative flex min-h-[680px] flex-col justify-center pb-40 pt-16 sm:pb-44 lg:min-h-[calc(100svh-4.5rem)] lg:pb-44')}>
          <div className="mb-6 flex w-fit items-center gap-2.5 border border-white/10 bg-black/25 px-3 py-2 text-[.68rem] font-bold uppercase tracking-[.2em] text-white/75 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-online shadow-[0_0_14px_rgba(34,197,94,.8)]" /> FiveM competitivo <span className="text-white/25">/</span> Brasil
          </div>
          <h1 className="max-w-[10ch] font-display text-[clamp(4rem,10vw,9.5rem)] font-bold uppercase leading-[.78] tracking-[-.045em] text-ink">
            <span className="sr-only">A arena não espera.</span>
            <span aria-hidden="true"><span className="block"><TypingLine delayMs={120}>A arena</TypingLine></span><span className="mt-3 block text-accent"><TypingLine delayMs={600}>não espera.</TypingLine></span></span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Entre para uma comunidade feita de disputa, estratégia e partidas que valem cada segundo. Seu próximo destaque começa aqui.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className={cn(buttonVariants({ size: 'lg' }), 'min-h-14 px-7 text-base sm:px-9')} to={primaryPath}>{primaryLabel}<span aria-hidden="true">↗</span></Link>
            <Link className="inline-flex min-h-14 items-center gap-2 border border-white/20 bg-black/20 px-6 text-sm font-bold text-ink transition-colors hover:border-accent/60 hover:bg-panel/80" to="/ranking">Explorar ranking <span className="text-accent">→</span></Link>
          </div>

          <div className="absolute bottom-10 left-4 right-4 flex flex-col gap-5 border-t border-white/15 pt-5 sm:left-6 sm:right-6 md:flex-row md:items-end md:justify-between lg:left-8 lg:right-8">
            <div className="flex items-center gap-3 text-sm text-white/65">
              <span className="grid size-10 place-items-center border border-accent/35 bg-black/25 font-display text-lg font-bold text-accent">ZK</span>
              <span><strong className="block font-semibold text-white">PvP direto ao ponto.</strong><span className="text-xs">Mire · Enfrente · Vença</span></span>
            </div>
            <div className="flex items-end gap-3 text-white/70">
              <span className="scoreboard text-5xl leading-none text-ink">{online ?? '—'}</span>
              <span className="pb-1 text-sm">jogadores<br />na arena agora</span>
              <span className="mb-2 ml-2 size-2 rounded-full bg-online" />
            </div>
          </div>
        </div>
        <span aria-hidden="true" className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-display text-xs font-bold uppercase tracking-[.45em] text-white/30 xl:block">ZKPVP · PLAY TO WIN</span>
      </section>

      <div className={cn(pageShellClass, 'relative z-10 -mt-5')}><StatStrip stats={stats} /></div>

      <section className={cn(pageShellClass, 'reveal py-20 sm:py-28')} aria-labelledby="how-to-play">
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">Comece em três passos</p><h2 id="how-to-play" className="font-display text-4xl font-bold uppercase leading-none text-ink sm:text-6xl">Entre. Jogue. <span className="text-accent">Domine.</span></h2></div>
          <p className="max-w-md text-sm leading-relaxed text-mute sm:text-base">Tudo que você precisa para entrar na arena e acompanhar sua evolução está reunido aqui.</p>
        </div>
        <ol className="grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
          {HOW_TO_PLAY_STEPS.map((step) => <li key={step.number} className="group grid grid-cols-[3.5rem_1fr] gap-4 border-b border-line py-6 last:border-0 md:border-0 md:px-6 md:py-7 md:first:pl-0 md:last:pr-0">
            <span className="scoreboard text-3xl text-accent/60 transition-colors group-hover:text-accent">{step.number}</span>
            <div><h3 className="font-display text-2xl font-bold uppercase text-ink">{step.title}</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{step.description}</p></div>
          </li>)}
        </ol>
      </section>

      <section className="reveal border-y border-line bg-panel/40 py-16 sm:py-20" aria-labelledby="game-modes">
        <div className={pageShellClass}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-accent">O que define uma boa partida</p><h2 id="game-modes" className="font-display text-4xl font-bold uppercase text-ink sm:text-5xl">Seu PvP, <span className="text-accent">seus números</span></h2></div>
            <Link to="/ranking" className="hidden text-sm font-semibold text-mute transition-colors hover:text-ink sm:inline">Ver placares <span className="text-accent">→</span></Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map((mode, index) => <Link key={mode.name} to="/ranking" className="group relative isolate min-h-44 overflow-hidden border border-line bg-void p-6 transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-accent/60 sm:p-7">
              <span aria-hidden="true" className="absolute -right-2 -top-9 -z-10 font-display text-[9rem] font-bold leading-none text-accent/[.055] transition-colors group-hover:text-accent/10">{mode.number}</span>
              <p className="scoreboard text-xs tracking-[.2em] text-accent">MODO 0{index + 1}</p>
              <h3 className="mt-3 font-display text-4xl font-bold uppercase text-ink">{mode.name}</h3>
              <div className="mt-4 flex items-center justify-between text-sm text-mute"><span>{mode.detail}</span><span className="text-accent transition-transform group-hover:translate-x-1">→</span></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section className={cn(pageShellClass, 'reveal grid gap-4 py-16 sm:py-20 lg:grid-cols-[1.2fr_.8fr]')}>
        <article className="group relative isolate flex min-h-[360px] items-end overflow-hidden border border-line sm:min-h-[430px]">
          <img src="/images/banner.png" alt="Confronto entre jogadores em uma rua iluminada por neon" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(9,10,16,.98)_0%,rgba(9,10,16,.68)_48%,rgba(9,10,16,.06)_100%)]" />
          <div className="p-7 sm:p-9"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">A comunidade</p><h2 className="max-w-[12ch] font-display text-5xl font-bold uppercase leading-[.9] text-ink sm:text-6xl"><span className="sr-only">Encontre seu esquadrão.</span><span aria-hidden="true"><span className="block"><TypingLine>Encontre seu</TypingLine></span><span className="block text-accent"><TypingLine delayMs={500}>esquadrão.</TypingLine></span></span></h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">Conheça outros jogadores, monte sua equipe e encontre sua próxima disputa.</p><Link to="/descobrir" className={cn(buttonVariants({ intent: 'outline' }), 'mt-6 inline-flex')}>Explorar jogadores</Link></div>
        </article>
        <article className="group relative isolate flex min-h-[360px] items-end overflow-hidden border border-line sm:min-h-[430px]">
          <img src="/images/banner2.png" alt="Jogador observando a cidade de noite" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover object-[58%_center] transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(9,10,16,.98)_0%,rgba(9,10,16,.68)_48%,rgba(9,10,16,.06)_100%)]" />
          <div className="p-7 sm:p-9"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">Sua história</p><h2 className="max-w-[12ch] font-display text-5xl font-bold uppercase leading-[.9] text-ink sm:text-6xl"><span className="sr-only">Faça seu nome valer.</span><span aria-hidden="true"><span className="block"><TypingLine>Faça seu nome</TypingLine></span><span className="block text-accent"><TypingLine delayMs={500}>valer.</TypingLine></span></span></h2><p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">Acompanhe campeonatos, resultados e sua posição entre os melhores.</p><Link to="/calendario" className={cn(buttonVariants(), 'mt-6 inline-flex')}>Ver calendário</Link></div>
        </article>
      </section>
    </div>
  )
}
