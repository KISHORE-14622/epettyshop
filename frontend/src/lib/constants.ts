// Shared constants and sample data

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const TRIGGER_EVENTS = [
  { value: 'order.created', label: 'Order Created' },
  { value: 'order.updated', label: 'Order Updated' },
  { value: 'order.cancelled', label: 'Order Cancelled' },
  { value: 'order.refunded', label: 'Order Refunded' },
  { value: 'inventory.low', label: 'Inventory Low' },
  { value: 'inventory.out', label: 'Inventory Out of Stock' },
  { value: 'customer.created', label: 'Customer Created' },
  { value: 'customer.returning', label: 'Customer Returning' },
  { value: 'payment.failed', label: 'Payment Failed' },
  { value: 'shipment.delayed', label: 'Shipment Delayed' },
];

export const STEP_TYPES = [
  { value: 'action', label: 'Action', description: 'Automated system action' },
  { value: 'approval', label: 'Approval', description: 'Manual intervention required' },
  { value: 'notification', label: 'Notification', description: 'Send alerts via email/SMS/webhook' },
];

export const RULE_FIELDS = [
  { value: 'data.order_details.total_amount', label: 'Order Total Amount' },
  { value: 'data.order_details.item_count', label: 'Item Count' },
  { value: 'data.order_details.currency', label: 'Currency' },
  { value: 'data.order_details.shipping_country', label: 'Shipping Country' },
  { value: 'data.customer.loyalty_tier', label: 'Customer Loyalty Tier' },
  { value: 'data.customer.id', label: 'Customer ID' },
  { value: 'data.risk_assessment.fraud_score', label: 'Fraud Score' },
  { value: 'data.risk_assessment.risk_level', label: 'Risk Level' },
  { value: 'event', label: 'Event Type' },
];

export const RULE_OPERATORS = [
  { value: '>', label: 'greater than (>)' },
  { value: '<', label: 'less than (<)' },
  { value: '>=', label: 'greater than or equal (>=)' },
  { value: '<=', label: 'less than or equal (<=)' },
  { value: '==', label: 'equals (==)' },
  { value: '!=', label: 'not equals (!=)' },
];

export const SAMPLE_ORDER_PAYLOAD = {
  event: 'order.created',
  data: {
    order_id: 'ORD-99382',
    customer: {
      id: 'CUST-112',
      email: 'shopper@example.com',
      loyalty_tier: 'Gold',
    },
    order_details: {
      total_amount: 750.0,
      currency: 'USD',
      item_count: 3,
      shipping_country: 'US',
    },
    risk_assessment: {
      fraud_score: 12,
      risk_level: 'Low',
    },
  },
};
