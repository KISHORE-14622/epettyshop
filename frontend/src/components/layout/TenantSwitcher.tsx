import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, LogOut, User, Store, Check } from 'lucide-react';
import { authApi, Tenant } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export function TenantSwitcher() {
  const { tenant, login, logout } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authApi.getTenants().then((res) => setTenants(res.tenants)).catch(() => {});
  }, []);

  const handleSwitch = async (t: Tenant) => {
    await login(t.id);
    setOpen(false);
    navigate({ to: '/' });
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate({ to: '/' });
  };

  if (!tenant) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg-elevated hover:border-accent-blue transition-all"
        id="tenant-switcher-btn"
      >
        <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
          <Store size={12} className="text-white" />
        </div>
        <span className="text-sm font-500 text-text-primary">{tenant.name}</span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-64 glass-card border border-border z-20 shadow-2xl animate-fade-in-scale overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-600">Switch Store</p>
            </div>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSwitch(t)}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors"
                id={`tenant-${t.id}`}
              >
                <div className="w-7 h-7 rounded-md gradient-purple flex items-center justify-center shrink-0">
                  <User size={13} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-500 text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.email}</p>
                </div>
                {tenant.id === t.id && <Check size={14} className="text-accent-blue" />}
              </button>
            ))}
            <div className="border-t border-border p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-accent-rose hover:bg-[rgba(244,63,94,0.1)] transition-colors"
                id="logout-btn"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
