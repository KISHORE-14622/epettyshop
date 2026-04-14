import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus, Play, RefreshCw } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { StatsCards } from '../components/dashboard/StatsCards'
import { WorkflowTable } from '../components/dashboard/WorkflowTable'
import { RecentExecutions } from '../components/dashboard/RecentExecutions'
import { useWorkflows } from '../hooks/useWorkflows'
import { executionApi, ExecutionSummary } from '../lib/api'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { workflows, isLoading, error, refetch } = useWorkflows()
  const [executions, setExecutions] = useState<ExecutionSummary[]>([])
  const [exLoading, setExLoading] = useState(true)

  const loadExecutions = () => {
    setExLoading(true)
    executionApi.list()
      .then(res => setExecutions(res.executions.slice(0, 8)))
      .catch(() => {})
      .finally(() => setExLoading(false))
  }

  useEffect(() => { loadExecutions() }, [])

  const handleRefetch = () => { refetch(); loadExecutions() }

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        subtitle="Overview of your merchant automation workflows"
        actions={
          <div className="flex gap-2">
            <button onClick={handleRefetch} className="btn-ghost" id="refresh-btn">
              <RefreshCw size={14} />
            </button>
            <Link to="/simulator" className="btn-secondary text-sm" id="open-simulator-btn">
              <Play size={14} /> Simulator
            </Link>
            <Link to="/workflows/new" className="btn-primary text-sm" id="create-workflow-btn">
              <Plus size={14} /> New Workflow
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsCards workflows={workflows} executionCount={executions.length} />
        )}

        {/* Workflows Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-600 text-text-primary">
              All Workflows
            </h2>
            <Link to="/workflows" className="text-xs text-text-accent hover:underline">
              View all →
            </Link>
          </div>

          {error ? (
            <div className="glass-card p-6 text-center text-accent-rose">
              <p className="text-sm">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <WorkflowTable workflows={workflows} onRefetch={handleRefetch} />
          )}
        </section>

        {/* Recent Executions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-600 text-text-primary">
              Recent Executions
            </h2>
            <Link to="/simulator" className="text-xs text-text-accent hover:underline">
              Open simulator →
            </Link>
          </div>

          {exLoading ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : (
            <RecentExecutions executions={executions} />
          )}
        </section>
      </div>
    </div>
  )
}
