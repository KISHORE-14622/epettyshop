import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { authApi, Tenant } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Store, Zap, ChevronRight } from 'lucide-react'

function LoginGate() {
  const { tenant, login, isLoading } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [fetchingTenants, setFetchingTenants] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    authApi.getTenants()
      .then(res => setTenants(res.tenants))
      .catch(() => {})
      .finally(() => setFetchingTenants(false))
  }, [])

  const handleLogin = async (tenantId: string) => {
    setLoggingIn(true)
    await login(tenantId)
    setLoggingIn(false)
  }

  if (isLoading || fetchingTenants) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'radial-gradient(ellipse at 60% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.06) 0%, transparent 60%)'
      }}>
        <div className="w-full max-w-md animate-fade-in-scale">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center glow-blue mb-4">
              <Zap size={26} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-800 gradient-text mb-2">epettyshop</h1>
            <p className="text-text-muted text-center text-sm">Merchant Automation Hub</p>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-600 text-text-primary mb-1">Select your store</h2>
            <p className="text-sm text-text-muted mb-5">Choose a merchant account to continue</p>

            {tenants.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-text-muted">No tenants found.</p>
                <p className="text-xs text-text-muted mt-1">Run <code className="text-accent-cyan">npm run seed -w backend</code> first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleLogin(t.id)}
                    disabled={loggingIn}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-elevated hover:border-accent-blue hover:bg-bg-card transition-all group"
                    id={`login-${t.id}`}
                  >
                    <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center shrink-0">
                      <Store size={18} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-600 text-text-primary">{t.name}</p>
                      <p className="text-xs text-text-muted">{t.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-accent-blue transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-text-muted mt-6">
            Demo mode — no real credentials required
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-bg-base pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <>
      <LoginGate />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
})
