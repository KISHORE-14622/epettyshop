import { useState, useEffect, useCallback } from 'react';
import { authApi, Tenant } from '../lib/api';

export interface AuthState {
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
  login: (tenantId: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('epettyshop_token');
    const storedTenant = localStorage.getItem('epettyshop_tenant');
    if (storedToken && storedTenant) {
      setToken(storedToken);
      setTenant(JSON.parse(storedTenant));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (tenantId: string) => {
    const res = await authApi.login(tenantId);
    localStorage.setItem('epettyshop_token', res.token);
    localStorage.setItem('epettyshop_tenant', JSON.stringify(res.tenant));
    setToken(res.token);
    setTenant(res.tenant);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('epettyshop_token');
    localStorage.removeItem('epettyshop_tenant');
    setToken(null);
    setTenant(null);
  }, []);

  return { tenant, token, isLoading, login, logout };
}
