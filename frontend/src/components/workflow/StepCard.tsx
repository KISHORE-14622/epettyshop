import { useState } from 'react';
import { Trash2, Zap, UserCheck, Bell, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { StepDetail, stepApi } from '../../lib/api';
import { RuleBuilder } from './RuleBuilder';
import { STEP_TYPES } from '../../lib/constants';

const STEP_ICONS = {
  action: Zap,
  approval: UserCheck,
  notification: Bell,
};

const STEP_COLORS = {
  action: { bg: 'rgba(59,130,246,0.1)', color: 'var(--color-accent-blue)', badge: 'badge-action' },
  approval: { bg: 'rgba(245,158,11,0.1)', color: 'var(--color-accent-amber)', badge: 'badge-approval' },
  notification: { bg: 'rgba(139,92,246,0.1)', color: 'var(--color-accent-violet)', badge: 'badge-notification' },
};

interface StepCardProps {
  step: StepDetail;
  allSteps: StepDetail[];
  index: number;
  onDelete: (stepId: string) => void;
  onRefetch: () => void;
}

export function StepCard({ step, allSteps, index, onDelete, onRefetch }: StepCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(step.name);
  const [stepType, setStepType] = useState(step.step_type);
  const [saving, setSaving] = useState(false);

  const Icon = STEP_ICONS[step.step_type];
  const colors = STEP_COLORS[step.step_type];

  const handleSave = async () => {
    setSaving(true);
    await stepApi.update(step.workflow_id, step.id, { name, step_type: stepType });
    onRefetch();
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="relative animate-fade-in">
      {/* Step Card */}
      <div className="glass-card border border-border overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          {/* Step Number */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-elevated text-xs font-700 text-text-muted shrink-0">
            {index + 1}
          </div>

          {/* Step Type Icon */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
            <Icon size={15} style={{ color: colors.color }} />
          </div>

          {/* Name + type */}
          {editing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm py-1 px-2 flex-1"
                autoFocus
                id={`step-name-input-${step.id}`}
              />
              <select
                value={stepType}
                onChange={(e) => setStepType(e.target.value as typeof stepType)}
                className="text-xs py-1 px-2"
                style={{ width: 'auto' }}
                id={`step-type-select-${step.id}`}
              >
                {STEP_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-600 text-text-primary">{step.name}</span>
              <span className={`badge ${colors.badge}`}>{step.step_type}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1 px-2" id={`save-step-${step.id}`}>
                  <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setName(step.name); setStepType(step.step_type); }} className="btn-secondary text-xs py-1 px-2">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-ghost text-xs" id={`edit-step-${step.id}`}>
                Edit
              </button>
            )}
            <button onClick={() => onDelete(step.id)} className="btn-ghost text-accent-rose" id={`delete-step-${step.id}`}>
              <Trash2 size={13} />
            </button>
            <button onClick={() => setExpanded(e => !e)} className="btn-ghost">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Rules section */}
        {expanded && (
          <div className="px-4 pb-4 pt-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-600 mb-1">
              Routing Rules ({step.rules.length})
            </p>
            <RuleBuilder step={step} allSteps={allSteps} onRefetch={onRefetch} />
          </div>
        )}
      </div>

      {/* Connector line to next step */}
      <div className="flex flex-col items-center my-1">
        <div className="w-px h-8 bg-linear-to-b from-[rgba(59,130,246,0.6)] to-[rgba(6,182,212,0.2)]" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent-blue opacity-50" />
      </div>
    </div>
  );
}
