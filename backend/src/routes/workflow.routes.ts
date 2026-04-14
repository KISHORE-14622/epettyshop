import { Router, Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, Step, Rule, Execution } from '../db/models.js';

const router = Router();

// GET /api/workflows — List workflows for current tenant
const getWorkflows: RequestHandler = async (req, res) => {
  try {
    const workflows = await Workflow.find({ tenant_id: req.tenantId }).sort({ created_at: -1 }).lean();
    
    // For each workflow, we need step_count and execution_count
    const enhancedWorkflows = await Promise.all(workflows.map(async (w: any) => {
      const step_count = await Step.countDocuments({ workflow_id: w._id });
      const execution_count = await Execution.countDocuments({ workflow_id: w._id });
      
      return {
        ...w,
        id: w._id,
        step_count,
        execution_count
      };
    }));

    res.json({ workflows: enhancedWorkflows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', getWorkflows);

// GET /api/workflows/:id — Get single workflow with steps and rules
const getWorkflow: RequestHandler = async (req, res): Promise<void> => {
  try {
    const workflow: any = await Workflow.findOne({ _id: req.params.id, tenant_id: req.tenantId }).lean();

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    workflow.id = workflow._id;

    const steps = await Step.find({ workflow_id: workflow._id }).sort({ step_order: 1 }).lean();

    const stepsWithRules = await Promise.all(steps.map(async (step: any) => {
      const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 }).lean();
      
      const parsedRules = rules.map((r: any) => ({ ...r, id: r._id }));
      return { 
        ...step, 
        id: step._id,
        metadata: JSON.parse(step.metadata), 
        rules: parsedRules 
      };
    }));

    res.json({ workflow: { ...workflow, steps: stepsWithRules } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/:id', getWorkflow);

// POST /api/workflows — Create a new workflow
const createWorkflow: RequestHandler = async (req, res): Promise<void> => {
  const { name, trigger_event, is_active = 1 } = req.body;

  if (!name || !trigger_event) {
    res.status(400).json({ error: 'name and trigger_event are required' });
    return;
  }

  try {
    const id = uuidv4();
    const workflow = await Workflow.create({
      _id: id,
      tenant_id: req.tenantId,
      name,
      trigger_event,
      is_active: is_active ? 1 : 0
    });

    res.status(201).json({ workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.post('/', createWorkflow);

// PUT /api/workflows/:id — Update workflow
const updateWorkflow: RequestHandler = async (req, res): Promise<void> => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, tenant_id: req.tenantId });

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const { name, trigger_event, is_active } = req.body;

    if (name) workflow.name = name;
    if (trigger_event) workflow.trigger_event = trigger_event;
    if (is_active !== undefined) workflow.is_active = is_active ? 1 : 0;
    workflow.updated_at = new Date(); // Using assignment rather than function call

    await workflow.save();

    res.json({ workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.put('/:id', updateWorkflow);

// DELETE /api/workflows/:id
const deleteWorkflow: RequestHandler = async (req, res): Promise<void> => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, tenant_id: req.tenantId });

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    await Workflow.deleteOne({ _id: req.params.id });
    res.json({ message: 'Workflow deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.delete('/:id', deleteWorkflow);

export default router;
