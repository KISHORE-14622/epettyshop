import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Play, RotateCcw, Info, Loader2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { ExecutionLogView } from '../components/simulator/ExecutionLog'
import { useWorkflows } from '../hooks/useWorkflows'
import { executionApi, ExecutionResult } from '../lib/api'
import { SAMPLE_ORDER_PAYLOAD } from '../lib/constants'

export const Route = createFileRoute('/simulator')({
  component: SimulatorPage,
})

function SimulatorPage() {
  const { workflows, isLoading: wfLoading } = useWorkflows()
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [payloadText, setPayloadText] = useState(JSON.stringify(SAMPLE_ORDER_PAYLOAD, null, 2))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  // Auto-select first active workflow with steps
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      // Find one with steps first so the demo isn't broken
      let active = workflows.find(w => w.is_active && w.step_count > 0)
      if (!active) active = workflows.find(w => w.is_active) ?? workflows[0]
      setSelectedWorkflowId(active.id)
    }
  }, [workflows, selectedWorkflowId])

  const validatePayload = () => {
    try {
      JSON.parse(payloadText)
      setParseError(null)
      return true
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      return false
    }
  }

  const handleRun = async () => {
    if (!validatePayload()) return
    if (!selectedWorkflowId) { setRunError('Please select a workflow'); return }

    setRunning(true)
    setResult(null)
    setRunError(null)

    try {
      const payload = JSON.parse(payloadText)
      const res = await executionApi.run(selectedWorkflowId, payload)
      setResult(res)
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setPayloadText(JSON.stringify(SAMPLE_ORDER_PAYLOAD, null, 2))
    setResult(null)
    setRunError(null)
    setParseError(null)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Execution Simulator"
        subtitle="Dry-run your workflow with a sample event payload"
      />

      <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 min-h-0">
        {/* Left: Input panel */}
        <div className="flex-1 space-y-4">
          {/* Workflow selector */}
          <div className="glass-card p-5">
            <label htmlFor="sim-workflow-select">Select Workflow</label>
            {wfLoading ? (
              <div className="skeleton h-10 rounded-lg mt-1" />
            ) : (
              <select
                id="sim-workflow-select"
                value={selectedWorkflowId}
                onChange={e => { setSelectedWorkflowId(e.target.value); setResult(null) }}
                className="mt-1"
              >
                <option value="">— Choose a workflow —</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id} disabled={!w.is_active}>
                    {w.name} {!w.is_active ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payload editor */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="payload-editor" className="block">Event Payload (JSON)</label>
              <button onClick={handleReset} className="btn-ghost text-xs" id="reset-payload-btn">
                <RotateCcw size={12} /> Reset to sample
              </button>
            </div>
            <textarea
              id="payload-editor"
              value={payloadText}
              onChange={e => { setPayloadText(e.target.value); setParseError(null) }}
              onBlur={validatePayload}
              className="json-editor w-full"
              rows={18}
              spellCheck={false}
            />
            {parseError && (
              <p className="mt-2 text-xs text-accent-rose">⚠ {parseError}</p>
            )}
          </div>

          {/* Info box */}
          <div className="flex gap-3 p-4 rounded-xl bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.15)]">
            <Info size={15} className="text-accent-blue shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted space-y-1">
              <p>Paste any valid JSON event payload. The engine evaluates your workflow rules against this data.</p>
              <p>The sample payload includes a <strong className="text-text-secondary">$750 Gold loyalty order</strong> — perfect for testing the "High Value Order Routing" workflow.</p>
            </div>
          </div>

          {/* Run button */}
          {runError && (
            <div className="px-4 py-3 rounded-xl bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.2)] text-sm text-accent-rose">
              {runError}
            </div>
          )}
          <button
            onClick={handleRun}
            disabled={running || !selectedWorkflowId || !!parseError}
            className="btn-primary w-full text-sm justify-center py-3"
            id="run-simulation-btn"
          >
            {running
              ? <><Loader2 size={16} className="animate-spin" /> Executing…</>
              : <><Play size={16} /> Execute Dry Run</>}
          </button>
        </div>

        {/* Right: Audit log */}
        <div className="flex-1">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-600 text-text-secondary uppercase tracking-wider">
                Execution Audit Log
              </h2>
              {result && (
                <span className={`badge ${result.status === 'completed' ? 'badge-completed' : 'badge-failed'}`}>
                  {result.status}
                </span>
              )}
            </div>

            {!result && !running && (
              <div className="glass-card border-2 border-dashed border-border p-16 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center mb-4">
                  <Play size={22} className="text-text-muted" />
                </div>
                <p className="text-text-secondary font-500 mb-1">Ready to execute</p>
                <p className="text-sm text-text-muted">
                  Select a workflow, paste your payload, and click Execute
                </p>
              </div>
            )}

            {running && (
              <div className="glass-card p-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border-2 border-accent-blue border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-text-secondary">Running workflow engine…</p>
                <p className="text-xs text-text-muted mt-1">Evaluating rules step by step</p>
              </div>
            )}

            {result && <ExecutionLogView result={result} />}
          </div>
        </div>
      </div>
    </div>
  )
}
