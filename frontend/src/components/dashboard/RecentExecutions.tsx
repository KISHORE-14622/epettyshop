import { Link } from '@tanstack/react-router';
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { ExecutionSummary } from '../../lib/api';

interface RecentExecutionsProps {
  executions: ExecutionSummary[];
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'failed') return <XCircle size={14} className="text-rose-400" />;
  if (status === 'in_progress') return <Loader2 size={14} className="text-blue-400 animate-spin" />;
  return <Clock size={14} className="text-amber-400" />;
}

function formatTime(ts: string) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((new Date(ts).getTime() - Date.now()) / 60000),
    'minute'
  );
}

export function RecentExecutions({ executions }: RecentExecutionsProps) {
  if (executions.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
        <Clock size={28} className="text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">No executions yet</p>
        <p className="text-xs text-text-muted mt-1">Run the simulator to see results here</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Workflow</th>
              <th>Execution ID</th>
              <th>Started</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {executions.map((ex) => (
              <tr key={ex.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={ex.status} />
                    <span className={`badge badge-${ex.status}`}>{ex.status.replace('_', ' ')}</span>
                  </div>
                </td>
                <td>
                  <span className="text-sm font-500 text-text-primary">{ex.workflow_name}</span>
                </td>
                <td>
                  <code className="text-xs text-text-muted font-mono">{ex.id.slice(0, 12)}…</code>
                </td>
                <td>
                  <span className="text-xs text-text-muted">
                    {formatTime(ex.started_at)}
                  </span>
                </td>
                <td>
                  <Link
                    to="/simulator"
                    className="btn-ghost text-xs"
                    id={`view-execution-${ex.id}`}
                  >
                    <ExternalLink size={12} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
