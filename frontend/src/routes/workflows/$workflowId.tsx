import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Plus, Save, ToggleLeft, ToggleRight, Play, Loader2 } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import { StepCard } from '../../components/workflow/StepCard'
import { useWorkflow } from '../../hooks/useWorkflows'
import { workflowApi, stepApi } from '../../lib/api'
import { TRIGGER_EVENTS, STEP_TYPES as STEP_TYPE_OPTIONS } from '../../lib/constants'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/workflows/$workflowId')({
  component: WorkflowEditorPage,
})

function WorkflowEditorPage() {
  const { workflowId } = Route.useParams()
  const { workflow, isLoading, error, refetch } = useWorkflow(workflowId)
  const navigate = useNavigate()

  const [editingMeta, setEditingMeta] = useState(false)
  const [metaName, setMetaName] = useState('')
  const [metaTrigger, setMetaTrigger] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  const [addingStep, setAddingStep] = useState(false)
  const [newStepName, setNewStepName] = useState('')
  const [newStepType, setNewStepType] = useState<'action' | 'approval' | 'notification'>('action')
  const [creatingStep, setCreatingStep] = useState(false)

  const handleEditMetaStart = () => {
    setMetaName(workflow!.name)
    setMetaTrigger(workflow!.trigger_event)
    setEditingMeta(true)
  }

  const handleSaveMeta = async () => {
    setSavingMeta(true)
    await workflowApi.update(workflowId, { name: metaName, trigger_event: metaTrigger })
    await refetch()
    setSavingMeta(false)
    setEditingMeta(false)
  }

  const handleToggleActive = async () => {
    if (!workflow) return
    await workflowApi.update(workflowId, { is_active: !workflow.is_active })
    refetch()
  }

  const handleAddStep = async () => {
    if (!newStepName.trim()) return
    setCreatingStep(true)
    await stepApi.create(workflowId, { name: newStepName.trim(), step_type: newStepType })
    await refetch()
    setCreatingStep(false)
    setAddingStep(false)
    setNewStepName('')
    setNewStepType('action')
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step? All its rules will also be removed.')) return
    await stepApi.delete(workflowId, stepId)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <div className="skeleton h-16 m-6 rounded-xl" />
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="p-6">
        <div className="glass-card p-8 text-center text-accent-rose">
          <p>{error ?? 'Workflow not found'}</p>
          <Link to="/workflows" className="btn-secondary mt-4 inline-flex">Back to Workflows</Link>
        </div>
      </div>
    )
  }

  const triggerLabel = TRIGGER_EVENTS.find(e => e.value === workflow.trigger_event)?.label ?? workflow.trigger_event

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={workflow.name}
        subtitle={`Trigger: ${triggerLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleToggleActive} className="btn-ghost text-sm" id="toggle-active-btn">
              {workflow.is_active
                ? <><ToggleRight size={16} className="text-emerald-400" /> Active</>
                : <><ToggleLeft size={16} /> Inactive</>}
            </button>
            <Link to="/simulator" className="btn-secondary text-sm" id="simulate-btn">
              <Play size={14} /> Simulate
            </Link>
            <Link to="/workflows" className="btn-ghost text-sm">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <div className="flex gap-6 p-6">
        {/* Left: Canvas */}
        <div className="flex-1 min-w-0">
          {/* Workflow Metadata Card */}
          <div className="glass-card p-5 mb-6 border border-border">
            {editingMeta ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-wf-name">Workflow Name</label>
                  <input id="edit-wf-name" type="text" value={metaName} onChange={e => setMetaName(e.target.value)} autoFocus />
                </div>
                <div>
                  <label htmlFor="edit-wf-trigger">Trigger Event</label>
                  <select id="edit-wf-trigger" value={metaTrigger} onChange={e => setMetaTrigger(e.target.value)}>
                    {TRIGGER_EVENTS.map(ev => (
                      <option key={ev.value} value={ev.value}>{ev.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveMeta} disabled={savingMeta} className="btn-primary text-sm" id="save-meta-btn">
                    <Save size={14} /> {savingMeta ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingMeta(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-600">Workflow Configuration</p>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-600 text-text-primary">{workflow.name}</span>
                    <span className={`badge ${workflow.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${workflow.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-accent-cyan bg-[rgba(6,182,212,0.08)] px-2 py-0.5 rounded">
                      {triggerLabel}
                    </code>
                    <span className="text-xs text-text-muted">→ {workflow.steps.length} steps</span>
                  </div>
                </div>
                <button onClick={handleEditMetaStart} className="btn-ghost text-sm" id="edit-meta-btn">Edit</button>
              </div>
            )}
          </div>

          {/* Steps Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-600 text-text-secondary uppercase tracking-wider">
                Steps ({workflow.steps.length})
              </h2>
              <button onClick={() => setAddingStep(true)} className="btn-primary text-sm" id="add-step-btn">
                <Plus size={14} /> Add Step
              </button>
            </div>

            {workflow.steps.length === 0 && !addingStep && (
              <div className="glass-card border-2 border-dashed border-border p-10 flex flex-col items-center text-center">
                <p className="text-text-secondary font-500 mb-1">No steps yet</p>
                <p className="text-sm text-text-muted mb-4">Add your first step to start building the workflow</p>
                <button onClick={() => setAddingStep(true)} className="btn-primary" id="add-first-step-btn">
                  <Plus size={15} /> Add Step
                </button>
              </div>
            )}

            {/* Start indicator */}
            {workflow.steps.length > 0 && (
              <div className="flex flex-col items-center mb-2">
                <div className="badge badge-active text-xs">▶ START</div>
                <div className="w-px h-6 bg-[rgba(59,130,246,0.4)] mt-1" />
              </div>
            )}

            {/* Step Cards */}
            {workflow.steps.map((step, idx) => (
              <StepCard
                key={step.id}
                step={step}
                allSteps={workflow.steps}
                index={idx}
                onDelete={handleDeleteStep}
                onRefetch={refetch}
              />
            ))}

            {/* End indicator */}
            {workflow.steps.length > 0 && (
              <div className="flex flex-col items-center mt-0">
                <div className="badge badge-inactive text-xs">⛔ END</div>
              </div>
            )}

            {/* Add Step Form */}
            {addingStep && (
              <div className="mt-4 glass-card p-4 border border-dashed border-accent-blue animate-fade-in">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3 font-600">New Step</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label htmlFor="new-step-name">Step Name</label>
                    <input
                      id="new-step-name"
                      type="text"
                      placeholder="e.g. Send Welcome Email"
                      value={newStepName}
                      onChange={e => setNewStepName(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-step-type">Type</label>
                    <select
                      id="new-step-type"
                      value={newStepType}
                      onChange={e => setNewStepType(e.target.value as typeof newStepType)}
                      style={{ width: 'auto' }}
                    >
                      {STEP_TYPE_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pb-0.5">
                    <button onClick={handleAddStep} disabled={creatingStep || !newStepName.trim()} className="btn-primary text-sm" id="create-step-btn">
                      {creatingStep ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {creatingStep ? 'Adding…' : 'Add'}
                    </button>
                    <button onClick={() => setAddingStep(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick reference panel */}
        <div className="w-64 shrink-0 hidden xl:block">
          <div className="glass-card p-4 sticky top-20">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-600 mb-3">Step Types</p>
            {STEP_TYPE_OPTIONS.map(t => (
              <div key={t.value} className="mb-3">
                <span className={`badge badge-${t.value} mb-1`}>{t.label}</span>
                <p className="text-xs text-text-muted">{t.description}</p>
              </div>
            ))}
            <div className="border-t border-border my-3" />
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-600 mb-2">Tips</p>
            <ul className="text-xs text-text-muted space-y-1.5">
              <li>• Rules are evaluated by priority (lowest first)</li>
              <li>• Add a DEFAULT rule as a final fallback</li>
              <li>• Leave "next step" empty to end the workflow</li>
              <li>• Use Simulator to test your logic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
