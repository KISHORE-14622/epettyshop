import { v4 as uuidv4 } from 'uuid';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { connectDB } from './connection.js';
import { Tenant, Workflow, Step, Rule } from './models.js';

async function seed() {
  console.log('🌱 Seeding database...');
  await connectDB();

  // Check if already seeded
  const count = await Tenant.countDocuments();
  if (count > 0) {
    console.log('✅ Database already seeded. Skipping.');
    process.exit(0);
  }

  const tenant1Id = uuidv4();
  const tenant2Id = uuidv4();

  // Insert tenants
  await Tenant.create({ _id: tenant1Id, name: 'StyleVault', email: 'admin@stylevault.com' });
  await Tenant.create({ _id: tenant2Id, name: 'TechGadgets Pro', email: 'admin@techgadgets.com' });

  // Workflow 1: High Value Order Routing (Tenant 1)
  const wf1Id = uuidv4();
  await Workflow.create({
    _id: wf1Id, tenant_id: tenant1Id, name: 'High Value Order Routing', trigger_event: 'order.created', is_active: 1
  });

  const step1Id = uuidv4();
  const step2Id = uuidv4();
  const step3Id = uuidv4();

  await Step.create({
    _id: step1Id, workflow_id: wf1Id, name: 'Check Order Value', step_type: 'action', step_order: 1, metadata: JSON.stringify({ description: 'Evaluate order amount and customer loyalty tier' })
  });

  await Step.create({
    _id: step2Id, workflow_id: wf1Id, name: 'Apply VIP Tag & Auto-Fulfill', step_type: 'action', step_order: 2, metadata: JSON.stringify({ description: 'Apply VIP customer tag and trigger auto-fulfillment', tag: 'vip-customer', auto_fulfill: true })
  });

  await Step.create({
    _id: step3Id, workflow_id: wf1Id, name: 'Standard Processing Queue', step_type: 'action', step_order: 3, metadata: JSON.stringify({ description: 'Route to standard fulfillment queue', queue: 'standard' })
  });

  // Rules for step 1
  await Rule.create({
    _id: uuidv4(), step_id: step1Id, condition: "data.order_details.total_amount > 500 && data.customer.loyalty_tier == 'Gold'", next_step_id: step2Id, priority: 1
  });

  await Rule.create({
    _id: uuidv4(), step_id: step1Id, condition: 'DEFAULT', next_step_id: step3Id, priority: 2
  });

  // Workflow 2: Fraud Detection (Tenant 1)
  const wf2Id = uuidv4();
  await Workflow.create({
    _id: wf2Id, tenant_id: tenant1Id, name: 'Fraud Detection & Alert', trigger_event: 'order.created', is_active: 1
  });

  const fraudStep1Id = uuidv4();
  const fraudStep2Id = uuidv4();
  const fraudStep3Id = uuidv4();

  await Step.create({ _id: fraudStep1Id, workflow_id: wf2Id, name: 'Evaluate Fraud Score', step_type: 'action', step_order: 1, metadata: JSON.stringify({ description: 'Check risk_assessment fraud score' }) });
  await Step.create({ _id: fraudStep2Id, workflow_id: wf2Id, name: 'Flag for Manual Review', step_type: 'approval', step_order: 2, metadata: JSON.stringify({ assignee: 'fraud-team@stylevault.com' }) });
  await Step.create({ _id: fraudStep3Id, workflow_id: wf2Id, name: 'Send Fraud Alert Email', step_type: 'notification', step_order: 3, metadata: JSON.stringify({ channel: 'email', template: 'fraud-alert' }) });

  await Rule.create({ _id: uuidv4(), step_id: fraudStep1Id, condition: 'data.risk_assessment.fraud_score > 70', next_step_id: fraudStep2Id, priority: 1 });
  await Rule.create({ _id: uuidv4(), step_id: fraudStep1Id, condition: 'DEFAULT', next_step_id: null, priority: 2 });
  await Rule.create({ _id: uuidv4(), step_id: fraudStep2Id, condition: 'DEFAULT', next_step_id: fraudStep3Id, priority: 1 });

  // Workflow 3: Inactive workflow (Tenant 1)
  const wf3Id = uuidv4();
  await Workflow.create({ _id: wf3Id, tenant_id: tenant1Id, name: 'Low Inventory Restock Alert', trigger_event: 'inventory.low', is_active: 0 });

  // Workflow for Tenant 2
  const wf4Id = uuidv4();
  await Workflow.create({ _id: wf4Id, tenant_id: tenant2Id, name: 'New Customer Welcome', trigger_event: 'customer.created', is_active: 1 });

  const wStep1Id = uuidv4();
  await Step.create({ _id: wStep1Id, workflow_id: wf4Id, name: 'Send Welcome Email', step_type: 'notification', step_order: 1, metadata: JSON.stringify({ channel: 'email', template: 'welcome' }) });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Demo Accounts:');
  console.log(`   Tenant 1 (StyleVault):    ID = ${tenant1Id}`);
  console.log(`   Tenant 2 (TechGadgets):   ID = ${tenant2Id}`);
  console.log('');
  console.log('💡 Use these IDs to log in via the frontend tenant switcher.');

  // Save tenant IDs to a file for easy reference
  writeFileSync(
    join(process.cwd(), 'data', 'tenants.json'),
    JSON.stringify([
      { id: tenant1Id, name: 'StyleVault', email: 'admin@stylevault.com' },
      { id: tenant2Id, name: 'TechGadgets Pro', email: 'admin@techgadgets.com' }
    ], null, 2)
  );
  
  process.exit(0);
}

seed().catch(console.error);
