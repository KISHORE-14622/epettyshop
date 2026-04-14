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

// GET /api/steps/:stepId/rules
const getRules: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }
    const rules = await Rule.find({ step_id: step.id }).sort({ priority: 1 }).lean();
    const parsedRules = rules.map((r: any) => ({ ...r, id: r._id }));
    res.json({ rules: parsedRules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', getRules);

// POST /api/steps/:stepId/rules
const createRule: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    const { condition, next_step_id = null, priority = 0 } = req.body;
    if (!condition) {
      res.status(400).json({ error: 'condition is required' });
      return;
    }

    const id = uuidv4();
    const rule = await Rule.create({
      _id: id,
      step_id: step.id,
      condition,
      next_step_id,
      priority
    });

    const parsedRule = rule.toObject();
    res.status(201).json({ rule: parsedRule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.post('/', createRule);

// PUT /api/steps/:stepId/rules/:ruleId
const updateRule: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    const ruleDoc = await Rule.findOne({ _id: req.params.ruleId, step_id: step.id });
    if (!ruleDoc) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }

    const { condition, next_step_id, priority } = req.body;
    
    if (condition) ruleDoc.condition = condition;
    if (next_step_id !== undefined) ruleDoc.next_step_id = next_step_id;
    if (priority !== undefined) ruleDoc.priority = priority;

    await ruleDoc.save();

    const updated = ruleDoc.toObject();
    res.json({ rule: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.put('/:ruleId', updateRule);

// DELETE /api/steps/:stepId/rules/:ruleId
const deleteRule: RequestHandler = async (req, res): Promise<void> => {
  try {
    const step = await getStepWithTenantCheck(req.params.stepId as string, req.tenantId);
    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    const ruleDoc = await Rule.findOne({ _id: req.params.ruleId, step_id: step.id });
    if (!ruleDoc) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }

    await Rule.deleteOne({ _id: ruleDoc._id });
    res.json({ message: 'Rule deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.delete('/:ruleId', deleteRule);

export default router;
