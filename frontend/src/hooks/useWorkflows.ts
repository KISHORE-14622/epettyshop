import { useState, useEffect, useCallback } from 'react';
import { workflowApi, WorkflowSummary, WorkflowDetail } from '../lib/api';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await workflowApi.list();
      setWorkflows(res.workflows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { workflows, isLoading, error, refetch: fetch };
}

export function useWorkflow(id: string | undefined) {
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await workflowApi.get(id);
      setWorkflow(res.workflow);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflow');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { workflow, isLoading, error, refetch: fetch };
}
