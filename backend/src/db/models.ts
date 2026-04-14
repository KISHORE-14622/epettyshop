import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const transformOptions = {
  virtuals: true,
  versionKey: false,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    
    // Ensure created_at / updated_at are ISO strings to match original type definitions
    if (ret.created_at && ret.created_at instanceof Date) ret.created_at = ret.created_at.toISOString();
    if (ret.updated_at && ret.updated_at instanceof Date) ret.updated_at = ret.updated_at.toISOString();
    if (ret.started_at && ret.started_at instanceof Date) ret.started_at = ret.started_at.toISOString();
    if (ret.completed_at && ret.completed_at instanceof Date) ret.completed_at = ret.completed_at.toISOString();
    if (ret.timestamp && ret.timestamp instanceof Date) ret.timestamp = ret.timestamp.toISOString();

    return ret;
  }
};

const tenantSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
}, { toJSON: transformOptions, toObject: transformOptions });

const workflowSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  tenant_id: { type: String, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  trigger_event: { type: String, required: true },
  is_active: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { toJSON: transformOptions, toObject: transformOptions });

const stepSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  workflow_id: { type: String, ref: 'Workflow', required: true },
  name: { type: String, required: true },
  step_type: { type: String, required: true, enum: ['action', 'approval', 'notification'] },
  step_order: { type: Number, required: true },
  metadata: { type: String, default: '{}' }, // Store JSON as string to preserve old API structure
  created_at: { type: Date, default: Date.now }
}, { toJSON: transformOptions, toObject: transformOptions });

const ruleSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  step_id: { type: String, ref: 'Step', required: true },
  condition: { type: String, required: true },
  next_step_id: { type: String, ref: 'Step', default: null },
  priority: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, { toJSON: transformOptions, toObject: transformOptions });

const executionSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  workflow_id: { type: String, ref: 'Workflow', required: true },
  tenant_id: { type: String, ref: 'Tenant', required: true },
  status: { type: String, required: true, default: 'pending', enum: ['pending', 'in_progress', 'completed', 'failed'] },
  input_payload: { type: String, required: true },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null }
}, { toJSON: transformOptions, toObject: transformOptions });

const executionLogSchema = new Schema({
  _id: { type: String, default: uuidv4 },
  execution_id: { type: String, ref: 'Execution', required: true },
  step_id: { type: String, required: true },
  step_name: { type: String, required: true },
  step_type: { type: String, required: true },
  rule_evaluated: { type: String, default: null },
  rule_result: { type: Number, default: null },
  action_taken: { type: String, default: null },
  next_step_id: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, { toJSON: transformOptions, toObject: transformOptions });

export const Tenant = mongoose.model('Tenant', tenantSchema);
export const Workflow = mongoose.model('Workflow', workflowSchema);
export const Step = mongoose.model('Step', stepSchema);
export const Rule = mongoose.model('Rule', ruleSchema);
export const Execution = mongoose.model('Execution', executionSchema);
export const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);
