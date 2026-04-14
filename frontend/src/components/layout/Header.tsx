import { Bell, Search } from 'lucide-react';
import { TenantSwitcher } from './TenantSwitcher';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-border bg-bg-surface sticky top-0 z-10 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-700 text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 pb-1 md:pb-0">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search workflows..."
            className="pl-9 pr-4 py-2 text-sm bg-bg-elevated border border-border rounded-lg w-52 focus:border-accent-blue outline-none transition-all"
            id="global-search"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg border border-border bg-bg-elevated flex items-center justify-center hover:border-accent-blue transition-all">
          <Bell size={15} className="text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue" />
        </button>

        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <TenantSwitcher />
      </div>
    </header>
  );
}
