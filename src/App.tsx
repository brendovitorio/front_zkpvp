import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Nav } from './components/Nav'
import { SiteFooter } from './components/SiteFooter'
import { ApiError, checkStaffSession } from './lib/api'
import { Atualizacoes } from './pages/Atualizacoes'
import { Cadastro } from './pages/Cadastro'
import { Calendario } from './pages/Calendario'
import { Descobrir } from './pages/Descobrir'
import { Home } from './pages/Home'
import { Loja } from './pages/Loja'
import { Ranking } from './pages/Ranking'
import { Painel } from './pages/Painel'
import { NotFound } from './pages/NotFound'
import { Termos } from './pages/legal/Termos'
import { Privacidade } from './pages/legal/Privacidade'
import { StaffDashboard } from './pages/staff/StaffDashboard'
import { StaffLogin } from './pages/staff/StaffLogin'
import { buttonVariants } from './components/ui/variants'
import { cn } from './lib/cn'
import { AuthProvider } from './state/AuthContext'
import { CartProvider } from './state/CartContext'

function App() {
  const location = useLocation()
  return (
    <AuthProvider>
      <CartProvider>
        <Nav />
        <main className="flex flex-1 flex-col">
          <div key={location.pathname} className="page-enter flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/descobrir" element={<Descobrir />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/atualizacoes" element={<Atualizacoes />} />
            <Route path="/loja" element={<Loja />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/painel" element={<Painel />} />
            <Route path="/staff" element={<StaffGuard />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </main>
        <SiteFooter />
      </CartProvider>
    </AuthProvider>
  )
}

function StaffGuard() {
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setChecking(true)
    setFailed(false)

    checkStaffSession()
      .then(() => {
        if (active) setAuthorized(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          navigate('/staff/login', { replace: true })
          return
        }
        setFailed(true)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => { active = false }
  }, [attempt, navigate])

  if (checking || !authorized) {
    return (
      <section className="grid flex-1 place-items-center px-6 py-20 text-center">
        <div>
          <p className="text-mute">
            {failed ? 'Não foi possível validar seu acesso ao painel.' : 'Validando acesso da equipe…'}
          </p>
          {failed && (
            <button
              type="button"
              className={cn(buttonVariants(), 'mt-5')}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tentar novamente
            </button>
          )}
        </div>
      </section>
    )
  }

  return <StaffDashboard />
}

export default App
