import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { alertClass, buttonVariants, pageShellClass, successClass } from '../components/ui/variants'
import { ApiError, claimFivemToken } from '../lib/api'
import { cn } from '../lib/cn'
import { useAuth } from '../state/AuthContext'

type WizardStep = 1 | 2 | 3

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Verificação',
  2: 'Termos',
  3: 'Token FiveM',
}

const shellClass = cn('cadastro-page max-w-3xl pb-20', pageShellClass)
const panelClass = 'cadastro-page__step frame chamfer-lg flex flex-col gap-6 p-6 sm:p-8'

/**
/** Discord/FiveM linking wizard. The server issues the temporary token. */
export function Cadastro() {
  const { player, loading } = useAuth()
  const [step, setStep] = useState<WizardStep>(1)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [token, setToken] = useState('')
  const [tokenSubmitting, setTokenSubmitting] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [linked, setLinked] = useState(false)

  function submitToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (tokenSubmitting || linked) return
    setTokenSubmitting(true)
    setTokenError(null)
    claimFivemToken(token.trim().toUpperCase())
      .then(() => setLinked(true))
      .catch((error: unknown) => {
        const code = error instanceof ApiError && error.body && typeof error.body === 'object' && 'error' in error.body
          ? String((error.body as { error: unknown }).error)
          : ''
        setTokenError(code === 'token_expired'
          ? 'Esse token expirou. Entre novamente no servidor para gerar outro.'
          : code === 'token_replaced'
            ? 'Um token mais recente substituiu este. Use o último código exibido no jogo.'
            : code === 'token_already_used'
              ? 'Esse token já foi usado por outra conta. Gere um novo no servidor.'
              : code === 'license_already_linked'
                ? 'Esse personagem FiveM já está vinculado a outra conta.'
                : code === 'account_already_linked'
                  ? 'Sua conta já está vinculada a outro personagem FiveM.'
                  : error instanceof ApiError && error.status === 429
                    ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
                    : 'Não foi possível validar o token. Confira os 6 caracteres e tente novamente.')
      })
      .finally(() => setTokenSubmitting(false))
  }

  if (loading) {
    return (
      <section className={shellClass}>
        <p className="pt-14 text-mute">Carregando...</p>
      </section>
    )
  }

  if (!player) {
    return (
      <section className={shellClass}>
        <PageHeader title="Cadastro" />
        <div className={panelClass}>
          <p className="text-lg text-ink">Você precisa entrar com o Discord antes de continuar.</p>
        </div>
      </section>
    )
  }

  return (
    <section className={shellClass}>
      <PageHeader
        title="Cadastro"
        lede="Vincule sua conta Discord ao personagem FiveM em três etapas."
      />
      <ol
        className="cadastro-page__steps mb-6 grid grid-cols-3 gap-2"
        aria-label="Etapas do cadastro"
      >
        {([1, 2, 3] as const).map((n) => (
          <li
            key={n}
            aria-current={step === n}
            className={cn(
              'border-t-2 pt-3 text-sm transition-colors',
              n < step && 'border-accent/60 text-mute',
              n === step && 'border-accent font-semibold text-ink',
              n > step && 'border-line text-mute/70',
            )}
          >
            <span className="scoreboard mr-1.5 text-xl">{n}.</span>
            {STEP_LABELS[n]}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className={panelClass}>
          <p className="text-mute">
            Conta Discord vinculada:{' '}
            <strong className="font-display text-2xl font-bold text-ink">
              {player.discordUsername}
            </strong>
          </p>
          <div className="flex flex-col gap-4">
            <p className="text-mute">
              Entre no servidor FiveM com seu personagem. O jogo exibirá um token temporário no chat para confirmar que a conta é sua.
            </p>
            <button type="button" className={cn(buttonVariants(), 'self-start')} onClick={() => setStep(2)}>
              Próxima etapa
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={panelClass}>
          <label className="flex cursor-pointer items-start gap-3 text-ink">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <span>Li e aceito os <Link to="/termos" target="_blank" className="font-semibold underline decoration-accent underline-offset-4">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="font-semibold underline decoration-accent underline-offset-4">Política de Privacidade</Link>.</span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className={buttonVariants({ intent: 'ghost' })}
              onClick={() => setStep(1)}
            >
              Etapa anterior
            </button>
            <button
              type="button"
              className={buttonVariants()}
              disabled={!termsAccepted}
              onClick={() => setStep(3)}
            >
              Próxima etapa
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={cn(panelClass, 'frame-hot')}>
          {linked ? (
            <p role="status" className={successClass}>Conta vinculada ao FiveM. Seu cadastro foi liberado.</p>
          ) : (
            <>
              <div>
                <h2 className="text-3xl text-ink">Digite o token do jogo</h2>
                <p className="mt-2 text-mute">Ao entrar no servidor, copie o token de 6 caracteres exibido no chat. Ele expira em 10 minutos.</p>
              </div>
              {tokenError && (
                <p role="alert" className={cn('cadastro-page__error', alertClass)}>
                  {tokenError}
                </p>
              )}
              <form onSubmit={submitToken} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="fivem-link-token" className="mb-1.5 block text-sm font-medium text-mute">Token de vínculo</label>
                  <input
                    id="fivem-link-token"
                    name="token"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={6}
                    minLength={6}
                    required
                    value={token}
                    onChange={(event) => setToken(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase())}
                    className="scoreboard text-center text-3xl tracking-[0.25em] uppercase"
                    aria-describedby="fivem-link-token-hint"
                  />
                  <p id="fivem-link-token-hint" className="mt-1 text-sm text-mute">Use o token mais recente mostrado pelo servidor.</p>
                </div>
                <button type="submit" className={cn(buttonVariants(), 'self-start sm:self-auto')} disabled={tokenSubmitting || token.length !== 6}>
                  {tokenSubmitting ? 'Validando…' : 'Liberar conta'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  )
}
