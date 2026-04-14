import { CheckCircle2, XCircle, ArrowRight, Terminal, Clock } from 'lucide-react';
import { ExecutionLog, ExecutionResult, StepType } from '../../lib/api';

interface ExecutionLogViewProps {
  result: ExecutionResult;
}

const STEP_TYPE_COLORS: Record<StepType, string> = {
  action: '#3b82f6',
  approval: '#f59e0b',
  notification: '#8b5cf6',
};

function LogEntry({ log, index }: { log: ExecutionLog; index: number }) {
  const passed = log.rule_result === 1;
  const isInfo = log.rule_result === null;

  return (
    <div
      className="flex gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          isInfo
            ? 'border-border bg-bg-elevated'
            : passed
            ? 'border-emerald-500 bg-[rgba(16,185,129,0.1)]'
            : 'border-slate-500 bg-[rgba(100,116,139,0.1)]'
        }`}>
          {isInfo
            ? <Terminal size={13} className="text-text-muted" />
            : passed
            ? <CheckCircle2 size={14} className="text-emerald-400" />
            : <div className="w-2 h-2 rounded-full bg-slate-500" />}
        </div>
        <div className="w-px flex-1 bg-border-subtle mt-1" style={{ minHeight: 16 }} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="glass-card p-3 border border-border">
          {/* Step name + type */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-600 text-text-primary">{log.step_name}</span>
            <span
              className={`badge badge-${log.step_type}`}
              style={{ borderColor: `${STEP_TYPE_COLORS[log.step_type]}33` }}
            >
              {log.step_type}
            </span>
            {!isInfo && (
              <span className={`ml-auto badge ${passed ? 'badge-completed' : 'badge-inactive'}`}>
                {passed ? '✓ PASSED' : '○ SKIPPED'}
              </span>
            )}
          </div>

          {/* Rule evaluated */}
          {log.rule_evaluated && (
            <div className="mb-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Rule Evaluated</p>
              <code className="text-xs font-mono text-accent-cyan bg-bg-base px-3 py-1.5 rounded-md block border border-border-subtle">
                {log.rule_evaluated}
              </code>
            </div>
          )}

          {/* Action taken */}
          {log.action_taken && (
            <div className="flex items-start gap-2">
              <ArrowRight size={12} className="text-text-muted mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary">{log.action_taken}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-2">
            <Clock size={10} className="text-text-muted" />
            <span className="text-[10px] text-text-muted font-mono">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutionLogView({ result }: ExecutionLogViewProps) {
  const passed = result.logs.filter(l => l.rule_result === 1).length;
  const failed = result.logs.filter(l => l.rule_result === 0).length;

  return (
    <div className="space-y-0">
      {/* Summary bar */}
      <div className={`flex items-center gap-4 px-4 py-3 rounded-xl mb-4 border ${
        result.status === 'completed'
          ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)]'
          : 'bg-[rgba(244,63,94,0.08)] border-[rgba(244,63,94,0.2)]'
      }`}>
        {result.status === 'completed'
          ? <CheckCircle2 size={18} className="text-emerald-400" />
          : <XCircle size={18} className="text-rose-400" />}
        <div>
          <p className="text-sm font-600 text-text-primary">
            Execution {result.status === 'completed' ? 'Completed' : 'Failed'}
          </p>
          <p className="text-xs text-text-muted">
            {result.stepsExecuted} steps executed · {passed} rules passed · {failed} rules skipped
          </p>
        </div>
        <code className="ml-auto text-xs text-text-muted font-mono">{result.executionId.slice(0, 16)}…</code>
      </div>

      {/* Log entries */}
      {result.logs.length === 0 ? (
        <div className="glass-card border-2 border-dashed border-rose-500/20 p-6 flex flex-col items-center text-center text-rose-400 mt-4 mb-4">
          <XCircle size={24} className="mb-2 opacity-80" />
          <p className="font-600">Workflow execution aborted</p>
          <p className="text-sm opacity-80 mt-1">This workflow likely has no steps defined yet.</p>
        </div>
      ) : (
        result.logs.map((log, i) => (
          <LogEntry key={log.id} log={log} index={i} />
        ))
      )}

      {/* End marker */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-8 h-8 rounded-full border-2 border-border bg-bg-elevated flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-text-muted" />
        </div>
        <span className="text-xs text-text-muted">Workflow ended</span>
      </div>
    </div>
  );
}
