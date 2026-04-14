import { v4 as uuidv4 } from 'uuid';
import { Workflow, Step, Rule, Execution, ExecutionLog } from '../db/models.js';

interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed';
  stepsExecuted: number;
  logs: any[];
}

/**
 * Safe expression evaluator — no eval().
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function evaluateSimpleCondition(condition: string, payload: Record<string, unknown>): boolean {
  condition = condition.trim();

  if (condition.toUpperCase() === 'DEFAULT') return true;

  if (condition.includes('&&')) {
    const parts = condition.split('&&');
    return parts.every(part => evaluateSimpleCondition(part.trim(), payload));
  }

  if (condition.includes('||')) {
    const parts = condition.split('||');
    return parts.some(part => evaluateSimpleCondition(part.trim(), payload));
  }

  const operators = ['>=', '<=', '!=', '==', '>', '<'];

  for (const op of operators) {
    const idx = condition.indexOf(op);
    if (idx === -1) continue;

    const left = condition.slice(0, idx).trim();
    const right = condition.slice(idx + op.length).trim();

    const leftValue = getNestedValue(payload, left);

    let rightValue: unknown;
    if ((right.startsWith("'") && right.endsWith("'")) || (right.startsWith('"') && right.endsWith('"'))) {
      rightValue = right.slice(1, -1);
    } else if (!isNaN(Number(right))) {
      rightValue = Number(right);
    } else if (right === 'true') {
      rightValue = true;
    } else if (right === 'false') {
      rightValue = false;
    } else if (right === 'null') {
      rightValue = null;
    } else {
      rightValue = right;
    }

    switch (op) {
      case '>=': return Number(leftValue) >= Number(rightValue);
      case '<=': return Number(leftValue) <= Number(rightValue);
      case '!=': return leftValue != rightValue; // eslint-disable-line eqeqeq
      case '==': return leftValue == rightValue; // eslint-disable-line eqeqeq
      case '>': return Number(leftValue) > Number(rightValue);
      case '<': return Number(leftValue) < Number(rightValue);
    }
  }

  const value = getNestedValue(payload, condition);
  return Boolean(value);
}

export async function executeWorkflow(
  workflowId: string,
  tenantId: string,
  inputPayload: Record<string, unknown>
): Promise<ExecutionResult> {
  const workflow = await Workflow.findOne({ _id: workflowId, tenant_id: tenantId }).lean();

  if (!workflow) {
    throw new Error('Workflow not found or access denied');
  }

  if (!workflow.is_active) {
    throw new Error('Workflow is not active');
  }

  const executionId = uuidv4();
  await Execution.create({
    _id: executionId,
    workflow_id: workflowId,
    tenant_id: tenantId,
    status: 'in_progress',
    input_payload: JSON.stringify(inputPayload)
  });

  const logs: any[] = [];
  let stepsExecuted = 0;
  let status: 'completed' | 'failed' = 'completed';

  try {
    const allStepsRaw = await Step.find({ workflow_id: workflowId }).sort({ step_order: 1 }).lean();
    const allSteps = allStepsRaw.map((s: any) => ({ ...s, id: s._id }));

    if (allSteps.length === 0) {
      throw new Error('Workflow has no steps');
    }

    let currentStepId: string | null = allSteps[0].id;
    const visitedSteps = new Set<string>();
    const MAX_STEPS = 50; 

    while (currentStepId !== null && stepsExecuted < MAX_STEPS) {
      if (visitedSteps.has(currentStepId)) {
        const logId = uuidv4();
        await ExecutionLog.create({
          _id: logId,
          execution_id: executionId,
          step_id: currentStepId,
          step_name: 'LOOP DETECTED',
          step_type: 'action',
          rule_evaluated: null,
          rule_result: 0,
          action_taken: 'Workflow loop detected — stopping execution',
          next_step_id: null
        });
        logs.push({
          id: logId,
          execution_id: executionId,
          step_id: currentStepId,
          step_name: 'LOOP DETECTED',
          step_type: 'action',
          rule_evaluated: null,
          rule_result: 0,
          action_taken: 'Workflow loop detected — stopping execution',
          next_step_id: null,
          timestamp: new Date().toISOString()
        });
        status = 'failed';
        break;
      }
      visitedSteps.add(currentStepId);

      const currentStep = allSteps.find(s => s.id === currentStepId);
      if (!currentStep) break;

      stepsExecuted++;

      const rulesRaw = await Rule.find({ step_id: currentStep.id }).sort({ priority: 1 }).lean();
      const rules = rulesRaw.map((r: any) => ({ ...r, id: r._id }));

      let nextStepId: string | null = null;
      let matchedCondition: string | null = null;
      let matched = false;

      if (rules.length === 0) {
        const currentIndex = allSteps.findIndex(s => s.id === currentStep.id);
        const nextStep = allSteps[currentIndex + 1];
        nextStepId = nextStep ? nextStep.id : null;
        matchedCondition = 'No rules defined — proceeding to next step';
        matched = true;
      } else {
        for (const rule of rules) {
          const ruleResult = evaluateSimpleCondition(rule.condition, inputPayload);

          const logId = uuidv4();
          const action_taken = ruleResult
              ? `Rule matched → routing to ${rule.next_step_id ? 'next step' : 'workflow end'}`
              : 'Rule did not match — trying next';

          await ExecutionLog.create({
            _id: logId,
            execution_id: executionId,
            step_id: currentStep.id,
            step_name: currentStep.name,
            step_type: currentStep.step_type,
            rule_evaluated: rule.condition,
            rule_result: ruleResult ? 1 : 0,
            action_taken,
            next_step_id: ruleResult ? rule.next_step_id : null
          });

          logs.push({
            id: logId,
            execution_id: executionId,
            step_id: currentStep.id,
            step_name: currentStep.name,
            step_type: currentStep.step_type,
            rule_evaluated: rule.condition,
            rule_result: ruleResult ? 1 : 0,
            action_taken,
            next_step_id: ruleResult ? rule.next_step_id : null,
            timestamp: new Date().toISOString()
          });

          if (ruleResult) {
            nextStepId = rule.next_step_id;
            matchedCondition = rule.condition;
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const logId = uuidv4();
        await ExecutionLog.create({
          _id: logId,
          execution_id: executionId,
          step_id: currentStep.id,
          step_name: currentStep.name,
          step_type: currentStep.step_type,
          rule_evaluated: 'No rules matched',
          rule_result: 0,
          action_taken: 'No matching rule — workflow ended',
          next_step_id: null
        });
        logs.push({
          id: logId,
          execution_id: executionId,
          step_id: currentStep.id,
          step_name: currentStep.name,
          step_type: currentStep.step_type,
          rule_evaluated: 'No rules matched',
          rule_result: 0,
          action_taken: 'No matching rule — workflow ended',
          next_step_id: null,
          timestamp: new Date().toISOString()
        });
        break;
      }

      if (rules.length === 0) {
        const logId = uuidv4();
        await ExecutionLog.create({
          _id: logId,
          execution_id: executionId,
          step_id: currentStep.id,
          step_name: currentStep.name,
          step_type: currentStep.step_type,
          rule_evaluated: matchedCondition,
          rule_result: 1,
          action_taken: `Executed step: ${currentStep.name}`,
          next_step_id: nextStepId
        });
        logs.push({
          id: logId,
          execution_id: executionId,
          step_id: currentStep.id,
          step_name: currentStep.name,
          step_type: currentStep.step_type,
          rule_evaluated: matchedCondition,
          rule_result: 1,
          action_taken: `Executed step: ${currentStep.name}`,
          next_step_id: nextStepId,
          timestamp: new Date().toISOString()
        });
      }

      currentStepId = nextStepId;
    }
  } catch (err) {
    status = 'failed';
    console.error('[Executor] Error:', err);
  }

  await Execution.updateOne({ _id: executionId }, { status, completed_at: new Date() });

  return { executionId, status, stepsExecuted, logs };
}
