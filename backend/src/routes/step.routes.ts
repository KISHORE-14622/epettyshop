import { Router, Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, Step, Rule } from '../db/models.js';

const router = Router({ mergeParams: true });

// Helper: verify step belongs to tenant's workflow
async function getStepWithTenantCheck(stepId: string, tenantId: string): Promise<any | null> {
  const step = await Step.findById(stepId).lean();
  if (!step) return null;
  
  const workflow = await Workflow.findOne({ _id: step.workflow_id, tenant_id: tenantId }).lean();
  if (!workflow) return null;
  
  return { ...step, id: step._id };
}

// GET /api/workflows/:workflowId/steps
const getSteps: RequestHandler = async (req, res): Promise<void> => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.workflowId, tenant_id: req.tenantId }).lean();

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

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

    res.json({ steps: stepsWithRules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', getSteps);

// POST /api/workflows/:workflowId/steps
const createStep: RequestHandler = async (req, res): Promise<void> => {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.workflowId, tenant_id: req.tenantId }).lean();

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const { name, step_type, metadata = {} } = req.body;
    if (!name || !step_type) {
      res.status(400).json({ error: 'name and step_type are required' });
      return;
    }

    const maxOrderDoc = await Step.findOne({ workflow_id: workflow._id }).sort('-step_order');
    const step_order = maxOrderDoc ? maxOrderDoc.step_order + 1 : 1;

    const id = uuidv4();

    const step: any = await Step.create({
      _id: id,
      workflow_id: workflow._id as string,
      name,
      step_type,
      step_order,
      metadata: JSON.stringify(metadata)
    });

    const parsedStep = step.toObject();
    res.status(201).json({ step: { ...parsedStep, metadata, rules: [] } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.post('/', createStep);

// PUT /api/workflows/:workflowId/steps/:stepId
const updateStep: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    const { name, step_type, metadata, step_order } = req.body;

    const stepDoc: any = await Step.findById(step.id);
    if (!stepDoc) return;

    if (name) stepDoc.name = name;
    if (step_type) stepDoc.step_type = step_type;
    if (metadata) stepDoc.metadata = JSON.stringify(metadata);
    if (step_order !== undefined) stepDoc.step_order = step_order;

    await stepDoc.save();

    const updated = stepDoc.toObject();
    const rules = await Rule.find({ step_id: step.id }).sort({ priority: 1 }).lean();
    const parsedRules = rules.map((r: any) => ({ ...r, id: r._id }));

    res.json({ step: { ...updated, metadata: JSON.parse(updated.metadata), rules: parsedRules } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.put('/:stepId', updateStep);

// DELETE /api/workflows/:workflowId/steps/:stepId
const deleteStep: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    await Step.deleteOne({ _id: step.id });
    res.json({ message: 'Step deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.delete('/:stepId', deleteStep);

export default router;
