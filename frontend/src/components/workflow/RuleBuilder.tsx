import { useState } from 'react';
import { Plus, Trash2, ArrowRight, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { StepDetail, Rule, ruleApi, stepApi } from '../../lib/api';
import { RULE_FIELDS, RULE_OPERATORS } from '../../lib/constants';

interface RuleBuilderProps {
  step: StepDetail;
  allSteps: StepDetail[];
  onRefetch: () => void;
}

interface RuleRow {
  field: string;
  operator: string;
  value: string;
  nextStepId: string;
  isDefault: boolean;
}

function parseConditionToRow(condition: string, nextStepId: string | null): RuleRow {
  if (condition.toUpperCase() === 'DEFAULT') {
    return { field: '', operator: '', value: '', nextStepId: nextStepId ?? '', isDefault: true };
  }
  // Try to parse "field op value"
  const ops = ['>=', '<=', '!=', '==', '>', '<'];
  for (const op of ops) {
    const idx = condition.indexOf(op);
    if (idx !== -1) {
      const field = condition.slice(0, idx).trim();
      const value = condition.slice(idx + op.length).trim().replace(/^['"]|['"]$/g, '');
      return { field, operator: op, value, nextStepId: nextStepId ?? '', isDefault: false };
    }
  }
  return { field: condition.trim(), operator: '==', value: '', nextStepId: nextStepId ?? '', isDefault: false };
}

function rowToCondition(row: RuleRow): string {
  if (row.isDefault) return 'DEFAULT';
  const needsQuotes = isNaN(Number(row.value)) && row.value !== 'true' && row.value !== 'false';
  const val = needsQuotes ? `'${row.value}'` : row.value;
  return `${row.field} ${row.operator} ${val}`;
}

export function RuleBuilder({ step, allSteps, onRefetch }: RuleBuilderProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<RuleRow>({
    field: RULE_FIELDS[0].value,
    operator: '>',
    value: '',
    nextStepId: '',
    isDefault: false,
  });

  const otherSteps = allSteps.filter((s) => s.id !== step.id);

  const handleDelete = async (rule: Rule) => {
    setSaving(rule.id);
    await ruleApi.delete(step.id, rule.id);
    onRefetch();
    setSaving(null);
  };

  const handleAdd = async () => {
    const condition = rowToCondition(newRow);
    setAdding(true);
    await ruleApi.create(step.id, {
      condition,
      next_step_id: newRow.nextStepId || null,
      priority: step.rules.length + 1,
    });
    onRefetch();
    setAdding(false);
    setNewRow({ field: RULE_FIELDS[0].value, operator: '>', value: '', nextStepId: '', isDefault: false });
  };

  const handleMoveUp = async (rule: Rule, idx: number) => {
    if (idx === 0) return;
    const prev = step.rules[idx - 1];
    await ruleApi.update(step.id, rule.id, { priority: prev.priority });
    await ruleApi.update(step.id, prev.id, { priority: rule.priority });
    onRefetch();
  };

  return (
    <div className="mt-3 space-y-2">
      {step.rules.length === 0 && (
        <p className="text-xs text-text-muted italic px-1">No rules — step will proceed to next in sequence.</p>
      )}

      {step.rules.map((rule, idx) => {
        const parsed = parseConditionToRow(rule.condition, rule.next_step_id);
        const nextStep = allSteps.find(s => s.id === rule.next_step_id);
        return (
          <div key={rule.id} className="flex items-center gap-2 bg-bg-surface border border-border rounded-lg p-3 group">
            <GripVertical size={14} className="text-text-muted cursor-grab shrink-0" />
            <div className="flex-1 flex items-center gap-2 flex-wrap text-xs">
              {parsed.isDefault ? (
                <span className="badge badge-pending">DEFAULT (fallback)</span>
              ) : (
                <>
                  <code className="text-accent-cyan bg-[rgba(6,182,212,0.08)] px-2 py-0.5 rounded">{parsed.field.split('.').pop()}</code>
                  <span className="text-text-muted font-mono font-600">{parsed.operator}</span>
                  <code className="text-accent-violet bg-[rgba(139,92,246,0.08)] px-2 py-0.5 rounded">{parsed.value}</code>
                </>
              )}
              <ArrowRight size={12} className="text-text-muted" />
              <span className="text-accent-blue font-500">
                {rule.next_step_id ? (nextStep?.name ?? 'Unknown step') : '⛔ End workflow'}
              </span>
              <span className="ml-auto text-text-muted">Priority {rule.priority}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleMoveUp(rule, idx)} className="btn-ghost p-1" disabled={idx === 0}>
                <ChevronUp size={12} />
              </button>
              <button onClick={() => handleDelete(rule)} className="btn-danger p-1" disabled={saving === rule.id}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Rule Form */}
      <div className="bg-bg-base border border-dashed border-border rounded-lg p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-600 mb-2">Add Rule</p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={newRow.isDefault}
              onChange={(e) => setNewRow(r => ({ ...r, isDefault: e.target.checked }))}
              className="w-3.5 h-3.5 accent-blue-500"
            />
            <span className="text-text-secondary">Default (fallback)</span>
          </label>

          {!newRow.isDefault && (
            <>
              <select
                value={newRow.field}
                onChange={(e) => setNewRow(r => ({ ...r, field: e.target.value }))}
                className="text-xs py-1.5 px-2 flex-1 min-w-32"
                style={{ width: 'auto' }}
                id="rule-field-select"
              >
                {RULE_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={newRow.operator}
                onChange={(e) => setNewRow(r => ({ ...r, operator: e.target.value }))}
                className="text-xs py-1.5 px-2"
                style={{ width: 'auto' }}
                id="rule-operator-select"
              >
                {RULE_OPERATORS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Value (e.g. 500)"
                value={newRow.value}
                onChange={(e) => setNewRow(r => ({ ...r, value: e.target.value }))}
                className="text-xs py-1.5 px-2 w-32"
                id="rule-value-input"
              />
            </>
          )}

          <ArrowRight size={14} className="text-text-muted shrink-0" />

          <select
            value={newRow.nextStepId}
            onChange={(e) => setNewRow(r => ({ ...r, nextStepId: e.target.value }))}
            className="text-xs py-1.5 px-2 flex-1 min-w-36"
            style={{ width: 'auto' }}
            id="rule-next-step-select"
          >
            <option value="">⛔ End workflow</option>
            {otherSteps.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            disabled={adding || (!newRow.isDefault && !newRow.value)}
            className="btn-primary text-xs py-1.5 px-3"
            id="add-rule-btn"
          >
            <Plus size={12} /> {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
