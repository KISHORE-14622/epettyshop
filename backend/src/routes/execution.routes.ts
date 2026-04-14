import { Router, Request, Response, RequestHandler } from 'express';
import { Execution, ExecutionLog, Workflow } from '../db/models.js';
import { executeWorkflow } from '../engine/executor.js';

const router = Router();

// POST /api/execute — Trigger a workflow execution
const triggerExecution: RequestHandler = async (req, res): Promise<void> => {
  const { workflow_id, payload } = req.body;

  if (!workflow_id || !payload) {
    res.status(400).json({ error: 'workflow_id and payload are required' });
    return;
  }

  try {
    const result = await executeWorkflow(workflow_id, req.tenantId, payload);
    res.status(201).json(result);
  } catch (err: any) {
    const message = err.message || 'Execution failed';
    res.status(400).json({ error: message });
  }
};
router.post('/', triggerExecution);

// GET /api/executions — List recent executions for tenant
const listExecutions: RequestHandler = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const workflowId = req.query.workflow_id as string | undefined;

    const query: any = { tenant_id: req.tenantId };
    if (workflowId) {
      query.workflow_id = workflowId;
    }

    const executionsRaw = await Execution.find(query)
      .sort({ started_at: -1 })
      .limit(limit)
      .lean();

    const executions = await Promise.all(executionsRaw.map(async (e: any) => {
      const workflow = await Workflow.findById(e.workflow_id).lean();
      return {
        ...e,
        id: e._id,
        workflow_name: workflow ? workflow.name : 'Unknown Workflow'
      };
    }));

    res.json({ executions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', listExecutions);

// GET /api/executions/:id — Get single execution with logs
const getExecution: RequestHandler = async (req, res): Promise<void> => {
  try {
    const executionRaw: any = await Execution.findOne({ _id: req.params.id, tenant_id: req.tenantId }).lean();

    if (!executionRaw) {
      res.status(404).json({ error: 'Execution not found' });
      return;
    }

    const workflow = await Workflow.findById(executionRaw.workflow_id).lean();
    const workflow_name = workflow ? workflow.name : 'Unknown Workflow';

    const logsRaw = await ExecutionLog.find({ execution_id: executionRaw._id }).sort({ timestamp: 1 }).lean();
    const logs = logsRaw.map((l: any) => ({ ...l, id: l._id }));

    res.json({
      execution: {
        ...executionRaw,
        id: executionRaw._id,
        workflow_name,
        input_payload: JSON.parse(executionRaw.input_payload),
        logs
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/:id', getExecution);

export default router;
