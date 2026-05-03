import express from 'express';
import { isWebhookPayload } from './validators';
import { verifySignature } from './security';
import { idempotencyStore } from './idempotency';
import { rateLimiter } from './rate-limiter';
import { WebhookPayload } from '../types.shared';

export const app = express();

const PORT = 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-shared-secret-key';

app.use(express.json());

/**
 * Process a validated webhook payload.
 * This function contains the business logic for incoming events.
 */
function handleWebhook(payload: WebhookPayload) {
  console.log('Processing webhook event:', payload.event);
  console.log('Payload id:', payload.id);
  console.log('Payload data:', payload.data);
}

app.post('/webhook', (req, res) => {
  // Get client IP for rate limiting
  const clientIP = req.ip || (req.socket ? req.socket.remoteAddress : undefined) || 'unknown';

  // Check rate limit
  if (!rateLimiter.isAllowed(clientIP)) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Get signature from request headers
  const signature = req.headers['x-webhook-signature'] as string;

  if (!signature) {
    return res.status(401).json({ error: 'Missing X-Webhook-Signature header' });
  }

  // Verify signature using raw request body (before JSON parsing)
  const rawBody = JSON.stringify(req.body);
  const isValid = verifySignature(rawBody, WEBHOOK_SECRET, signature);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Now validate the payload shape
  if (!isWebhookPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  // Check idempotency - if already processed, return success without reprocessing
  if (idempotencyStore.isProcessed(req.body.id)) {
    console.log('Webhook already processed, skipping:', req.body.id);
    return res.status(200).json({ status: 'received' });
  }

  handleWebhook(req.body);

  // Mark as processed
  idempotencyStore.markProcessed(req.body.id);

  res.status(200).json({ status: 'received' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Receiver running on port ${PORT}`);
  });
}
