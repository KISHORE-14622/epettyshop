import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import { WorkflowTable } from '../../components/dashboard/WorkflowTable'
import { useWorkflows } from '../../hooks/useWorkflows'

export const Route = createFileRoute('/workflows/')({
  component: WorkflowsPage,
})

function WorkflowsPage() {
  const { workflows, isLoading, error, refetch } = useWorkflows()

  return (
    <div className="flex flex-col">
      <Header
        title="Workflows"
        subtitle="Manage your store automation workflows"
        actions={
          <Link to="/workflows/new" className="btn-primary text-sm" id="new-workflow-btn">
            <Plus size={14} /> New Workflow
          </Link>
        }
      />

      <div className="p-6">
        {error ? (
          <div className="glass-card p-6 text-center text-accent-rose">
            <p className="text-sm">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : (
          <WorkflowTable workflows={workflows} onRefetch={refetch} />
        )}
      </div>
    </div>
  )
}
