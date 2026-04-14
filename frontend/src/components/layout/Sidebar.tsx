import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard, GitBranch, Play, ChevronRight,
  Zap, Settings, HelpCircle
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/workflows', label: 'Workflows', icon: GitBranch, exact: false },
  { to: '/simulator', label: 'Simulator', icon: Play, exact: false },
];

export function Sidebar() {
  const router = useRouterState();
  const pathname = router.location.pathname;

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-bg-surface h-screen sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-blue">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-700 text-sm text-text-primary leading-tight">epettyshop</p>
            <p className="text-[10px] text-text-muted leading-tight tracking-wide uppercase">Merchant Hub</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-600 uppercase tracking-widest text-text-muted">Main</p>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to) && item.to !== '/';
            const isDashboardActive = item.to === '/' && pathname === '/';
            const active = isActive || isDashboardActive;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-border pt-4 space-y-1">
          <button className="sidebar-link w-full">
            <HelpCircle size={16} />
            <span>Documentation</span>
          </button>
          <button className="sidebar-link w-full">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-bg-surface flex items-center justify-around z-50">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to) && item.to !== '/';
          const isDashboardActive = item.to === '/' && pathname === '/';
          const active = isActive || isDashboardActive;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${active ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-500">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
