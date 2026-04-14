import { Link } from '@tanstack/react-router';
import { GitBranch, Edit2, ToggleLeft, ToggleRight, Trash2, Plus } from 'lucide-react';
import { WorkflowSummary, workflowApi } from '../../lib/api';
import { TRIGGER_EVENTS } from '../../lib/constants';

interface WorkflowTableProps {
  workflows: WorkflowSummary[];
  onRefetch: () => void;
}

export function WorkflowTable({ workflows, onRefetch }: WorkflowTableProps) {
  const getTriggerLabel = (val: string) =>
    TRIGGER_EVENTS.find((e) => e.value === val)?.label ?? val;

  const handleToggle = async (w: WorkflowSummary) => {
    await workflowApi.update(w.id, { is_active: !w.is_active });
    onRefetch();
  };

  const handleDelete = async (w: WorkflowSummary) => {
    if (!confirm(`Delete workflow "${w.name}"? This cannot be undone.`)) return;
    await workflowApi.delete(w.id);
    onRefetch();
  };

  if (workflows.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center mb-4">
          <GitBranch size={24} className="text-text-muted" />
        </div>
        <p className="text-text-secondary font-500 mb-1">No workflows yet</p>
        <p className="text-sm text-text-muted mb-4">Create your first automation to get started</p>
        <Link to="/workflows/new" className="btn-primary text-sm" id="create-first-workflow-btn">
          <Plus size={15} /> Create Workflow
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Trigger Event</th>
              <th>Steps</th>
              <th>Executions</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((w) => (
              <tr key={w.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                      <GitBranch size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-600 text-text-primary">{w.name}</p>
                      <p className="text-xs text-text-muted font-mono">{w.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td>
                  <code className="text-xs text-accent-cyan bg-[rgba(6,182,212,0.1)] px-2 py-1 rounded-md">
                    {getTriggerLabel(w.trigger_event)}
                  </code>
                </td>
                <td>
                  <span className="text-text-primary font-600">{w.step_count}</span>
                  <span className="text-text-muted text-xs ml-1">steps</span>
                </td>
                <td>
                  <span className="text-text-primary font-600">{w.execution_count}</span>
                </td>
                <td>
                  <span className={`badge ${w.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {w.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      to="/workflows/$workflowId"
                      params={{ workflowId: w.id }}
                      className="btn-ghost"
                      id={`edit-workflow-${w.id}`}
                    >
                      <Edit2 size={13} />
                    </Link>
                    <button
                      onClick={() => handleToggle(w)}
                      className="btn-ghost"
                      title={w.is_active ? 'Deactivate' : 'Activate'}
                      id={`toggle-workflow-${w.id}`}
                    >
                      {w.is_active
                        ? <ToggleRight size={16} className="text-emerald-400" />
                        : <ToggleLeft size={16} className="text-text-muted" />}
                    </button>
                    <button
                      onClick={() => handleDelete(w)}
                      className="btn-ghost text-accent-rose"
                      id={`delete-workflow-${w.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
