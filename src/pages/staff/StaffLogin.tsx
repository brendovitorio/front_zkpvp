import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertClass, buttonVariants, labelClass, pageShellClass } from '../../components/ui/variants'
import { ApiError, staffLogin } from '../../lib/api'
import { cn } from '../../lib/cn'

/**
 * StaffLogin page (`/staff/login`): username/password form for
 * `POST /staff/login` (Task 20).
 *
 * Deliberately separate from the player Discord flow (`Cadastro.tsx`,
 * `useAuth()`/`AuthContext`, Task 15) — staff auth is its own cookie
 * (`staff_session`) and its own login mechanism (username/password, not
 * OAuth), so this component keeps its own local form state instead of
 * reaching into the player `AuthContext`.
 *
 * The backend never reveals which field was wrong on a bad login (always
 * `401 { error: "invalid_credentials" }`, regardless of whether the
 * username doesn't exist or the password is wrong — see
 * `apps/api/src/routes/staff.ts`), so there's no per-field error here, only
 * one generic message.
 */
export function StaffLogin() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    staffLogin(username, password)
      .then(() => {
        navigate('/staff')
      })
      .catch((caught) => {
        setError(
          caught instanceof ApiError && caught.status === 401
            ? 'Usuário ou senha inválidos.'
            : 'Não foi possível entrar. Tente novamente.',
        )
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <section
      className={cn(
        'staff-login-page relative isolate grid flex-1 place-items-center py-16',
        pageShellClass,
      )}
    >
      <div aria-hidden="true" className="scene-bleed -z-10">
        <div className="scene-glow absolute left-1/2 top-1/2 h-[36rem] w-[min(56rem,130vw)] -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="glow w-full max-w-md">
        <div className="frame frame-hot chamfer-lg p-8 sm:p-10">
          <div aria-hidden="true" className="mb-4 h-1 w-10 bg-accent chamfer chamfer-sm" />
          <h1 className="headline-poster text-[clamp(2.5rem,7vw,3.5rem)] text-ink">
            Acesso da <span className="headline-accent">equipe</span>
          </h1>
          <p className="mt-2 text-sm text-mute">Área restrita. Use as credenciais da equipe.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="staff-login-username" className={labelClass}>
                Usuário
              </label>
              <input
                id="staff-login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="staff-login-password" className={labelClass}>
                Senha
              </label>
              <input
                id="staff-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className={alertClass}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className={cn(buttonVariants(), 'mt-2 w-full')}
              disabled={submitting}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
