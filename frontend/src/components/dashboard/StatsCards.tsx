import { GitBranch, CheckCircle2, Activity, TrendingUp } from 'lucide-react';
import { WorkflowSummary } from '../../lib/api';

interface StatsCardsProps {
  workflows: WorkflowSummary[];
  executionCount: number;
}

export function StatsCards({ workflows, executionCount }: StatsCardsProps) {
  const total = workflows.length;
  const active = workflows.filter((w) => w.is_active).length;
  const totalSteps = workflows.reduce((acc, w) => acc + w.step_count, 0);

  const cards = [
    {
      label: 'Total Workflows',
      value: total,
      icon: GitBranch,
      color: 'var(--color-accent-blue)',
      bg: 'rgba(59,130,246,0.1)',
      change: `${active} active`,
    },
    {
      label: 'Active Automations',
      value: active,
      icon: CheckCircle2,
      color: 'var(--color-accent-emerald)',
      bg: 'rgba(16,185,129,0.1)',
      change: `${total - active} paused`,
    },
    {
      label: 'Total Steps',
      value: totalSteps,
      icon: Activity,
      color: 'var(--color-accent-violet)',
      bg: 'rgba(139,92,246,0.1)',
      change: 'across all workflows',
    },
    {
      label: 'Executions Run',
      value: executionCount,
      icon: TrendingUp,
      color: 'var(--color-accent-cyan)',
      bg: 'rgba(6,182,212,0.1)',
      change: 'all time',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="glass-card p-5 animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: card.bg }}
            >
              <card.icon size={18} style={{ color: card.color }} />
            </div>
          </div>
          <p className="text-3xl font-display font-700 text-text-primary mb-1">{card.value}</p>
          <p className="text-sm font-600 text-text-secondary">{card.label}</p>
          <p className="text-xs text-text-muted mt-0.5">{card.change}</p>
        </div>
      ))}
    </div>
  );
}
