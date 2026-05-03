import { generateSignature } from './security';

/**
 * Script helper to generate a test webhook signature locally.
 */
// Example webhook payload
const payload = {
  id: 'webhook-123',
  event: 'item.created' as const,
  timestamp: new Date().toISOString(),
  data: { itemId: 'abc-456', name: 'Test Item' },
};

const payloadString = JSON.stringify(payload);
const secret = 'your-shared-secret-key';

const signature = generateSignature(payloadString, secret);

console.log('Payload:', payloadString);
console.log('Secret:', secret);
console.log('Generated Signature:', signature);
console.log('\n--- To test with curl (or PowerShell), use: ---');
console.log(`Signature Header: X-Webhook-Signature: ${signature}`);
console.log(`Payload: ${payloadString}`);
