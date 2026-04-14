// Shared TypeScript types across backend

export interface Tenant {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  trigger_event: string;
  is_active: number; // 0 or 1 in SQLite
  created_at: string;
  updated_at: string;
}

export type StepType = 'action' | 'approval' | 'notification';

export interface Step {
  id: string;
  workflow_id: string;
  name: string;
  step_type: StepType;
  step_order: number;
  metadata: string; // JSON string
  created_at: string;
}

export interface Rule {
  id: string;
  step_id: string;
  condition: string;
  next_step_id: string | null;
  priority: number;
  created_at: string;
}

export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Execution {
  id: string;
  workflow_id: string;
  tenant_id: string;
  status: ExecutionStatus;
  input_payload: string; // JSON string
  started_at: string;
  completed_at: string | null;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_id: string;
  step_name: string;
  step_type: StepType;
  rule_evaluated: string | null;
  rule_result: number | null; // 0 or 1
  action_taken: string | null;
  next_step_id: string | null;
  timestamp: string;
}

// Extended types with joined data
export interface WorkflowWithSteps extends Workflow {
  steps: StepWithRules[];
}

export interface StepWithRules extends Step {
  rules: Rule[];
}

export interface ExecutionWithLogs extends Execution {
  logs: ExecutionLog[];
  workflow_name: string;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      tenantName: string;
    }
  }
}
