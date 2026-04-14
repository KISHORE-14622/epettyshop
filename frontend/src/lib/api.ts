import { API_BASE } from './constants';

function getToken(): string | null {
  return localStorage.getItem('epettyshop_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('epettyshop_token');
      localStorage.removeItem('epettyshop_tenant');
      window.location.reload();
    }
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  getTenants: () => request<{ tenants: Tenant[] }>('/auth/tenants'),
  login: (tenantId: string) =>
    request<{ token: string; tenant: Tenant }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    }),
};

// ── Workflows ───────────────────────────────────────────────────────
export const workflowApi = {
  list: () => request<{ workflows: WorkflowSummary[] }>('/workflows'),
  get: (id: string) => request<{ workflow: WorkflowDetail }>(`/workflows/${id}`),
  create: (data: { name: string; trigger_event: string; is_active?: boolean }) =>
    request<{ workflow: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{ name: string; trigger_event: string; is_active: boolean }>) =>
    request<{ workflow: Workflow }>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/workflows/${id}`, { method: 'DELETE' }),
};

// ── Steps ───────────────────────────────────────────────────────────
export const stepApi = {
  list: (workflowId: string) =>
    request<{ steps: StepDetail[] }>(`/workflows/${workflowId}/steps`),
  create: (workflowId: string, data: { name: string; step_type: StepType; metadata?: object }) =>
    request<{ step: StepDetail }>(`/workflows/${workflowId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (workflowId: string, stepId: string, data: Partial<StepDetail>) =>
    request<{ step: StepDetail }>(`/workflows/${workflowId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (workflowId: string, stepId: string) =>
    request<{ message: string }>(`/workflows/${workflowId}/steps/${stepId}`, {
      method: 'DELETE',
    }),
};

// ── Rules ───────────────────────────────────────────────────────────
export const ruleApi = {
  create: (stepId: string, data: { condition: string; next_step_id: string | null; priority: number }) =>
    request<{ rule: Rule }>(`/steps/${stepId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (stepId: string, ruleId: string, data: Partial<Rule>) =>
    request<{ rule: Rule }>(`/steps/${stepId}/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (stepId: string, ruleId: string) =>
    request<{ message: string }>(`/steps/${stepId}/rules/${ruleId}`, {
      method: 'DELETE',
    }),
};

// ── Executions ──────────────────────────────────────────────────────
export const executionApi = {
  run: (workflowId: string, payload: object) =>
    request<ExecutionResult>('/execute', {
      method: 'POST',
      body: JSON.stringify({ workflow_id: workflowId, payload }),
    }),
  list: (workflowId?: string) => {
    const qs = workflowId ? `?workflow_id=${workflowId}` : '';
    return request<{ executions: ExecutionSummary[] }>(`/executions${qs}`);
  },
  get: (id: string) => request<{ execution: ExecutionDetail }>(`/executions/${id}`),
};

// ── Shared Types ────────────────────────────────────────────────────
export type StepType = 'action' | 'approval' | 'notification';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Tenant {
  id: string;
  name: string;
  email: string;
}

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  trigger_event: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSummary extends Workflow {
  step_count: number;
  execution_count: number;
}

export interface Rule {
  id: string;
  step_id: string;
  condition: string;
  next_step_id: string | null;
  priority: number;
  created_at: string;
}

export interface StepDetail {
  id: string;
  workflow_id: string;
  name: string;
  step_type: StepType;
  step_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  rules: Rule[];
}

export interface WorkflowDetail extends Workflow {
  steps: StepDetail[];
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_id: string;
  step_name: string;
  step_type: StepType;
  rule_evaluated: string | null;
  rule_result: number | null;
  action_taken: string | null;
  next_step_id: string | null;
  timestamp: string;
}

export interface ExecutionSummary {
  id: string;
  workflow_id: string;
  workflow_name: string;
  tenant_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
}

export interface ExecutionDetail extends ExecutionSummary {
  input_payload: object;
  logs: ExecutionLog[];
}

export interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed';
  stepsExecuted: number;
  logs: ExecutionLog[];
}
