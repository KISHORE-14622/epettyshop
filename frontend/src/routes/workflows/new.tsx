import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Header } from '../../components/layout/Header'
import { workflowApi } from '../../lib/api'
import { TRIGGER_EVENTS } from '../../lib/constants'

export const Route = createFileRoute('/workflows/new')({
  component: NewWorkflowPage,
})

function NewWorkflowPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [triggerEvent, setTriggerEvent] = useState('order.created')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Workflow name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await workflowApi.create({ name: name.trim(), trigger_event: triggerEvent, is_active: isActive })
      navigate({ to: '/workflows/$workflowId', params: { workflowId: res.workflow.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header
        title="New Workflow"
        subtitle="Create a new automation workflow for your store"
        actions={
          <Link to="/workflows" className="btn-ghost text-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="p-6 max-w-xl">
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-5 animate-fade-in">
          <div>
            <label htmlFor="workflow-name">Workflow Name</label>
            <input
              id="workflow-name"
              type="text"
              placeholder="e.g. High Value Order Routing"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="trigger-event">Trigger Event</label>
            <select id="trigger-event" value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)}>
              {TRIGGER_EVENTS.map(ev => (
                <option key={ev.value} value={ev.value}>{ev.label}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1.5">The store event that will trigger this workflow</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated border border-border">
            <div>
              <p className="text-sm font-600 text-text-primary">Active on creation</p>
              <p className="text-xs text-text-muted">Immediately start processing events</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-all ${isActive ? 'gradient-brand' : 'bg-bg-card'} border border-border`}
              id="active-toggle"
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] text-sm text-accent-rose">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1" id="create-workflow-submit">
              <Save size={15} /> {saving ? 'Creating…' : 'Create & Add Steps'}
            </button>
            <Link to="/workflows" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
