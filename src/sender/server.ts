import crypto from 'crypto';
import express from 'express';
import { URL } from 'url';
import { WebhookEvent, WebhookPayload } from '../types.shared';
import { subscriptionStore } from './subscription-store';
import { dispatchEvent } from './delivery';
import { DispatchRequest, SubscriptionRequest } from './types';

export const app = express();
export const PORT = 3001;
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-shared-secret-key';
export { subscriptionStore };

app.use(express.json());

const validEvents = new Set<WebhookEvent>([
  'item.created',
  'item.updated',
  'item.deleted',
  'ping',
]);

/**
 * Determine whether a value is a supported webhook event.
 */
function isWebhookEvent(value: unknown): value is WebhookEvent {
  return typeof value === 'string' && validEvents.has(value as WebhookEvent);
}

/**
 * Validate that a payload contains a non-empty event list of supported events.
 */
function validateEvents(value: unknown): value is WebhookEvent[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((event) => isWebhookEvent(event))
  );
}

/**
 * Validate that callbackUrl is a valid HTTP or HTTPS URL.
 */
function validateCallbackUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/subscriptions', (req, res) => {
  const body = req.body as SubscriptionRequest;

  if (!validateCallbackUrl(body.callbackUrl)) {
    return res.status(400).json({ error: 'Invalid callbackUrl' });
  }

  if (body.events !== undefined && !validateEvents(body.events)) {
    return res.status(400).json({ error: 'Invalid events list' });
  }

  const subscription = subscriptionStore.create({
    callbackUrl: body.callbackUrl,
    events: body.events,
    secret: body.secret,
  });

  res.status(201).json(subscription);
});

app.get('/subscriptions', (_req, res) => {
  res.json(subscriptionStore.list());
});

app.get('/subscriptions/:id', (req, res) => {
  const subscription = subscriptionStore.get(req.params.id);

  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  res.json(subscription);
});

app.delete('/subscriptions/:id', (req, res) => {
  const deleted = subscriptionStore.delete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  res.status(204).send();
});

app.post('/events', async (req, res) => {
  const body = req.body as DispatchRequest;

  if (!isWebhookEvent(body.event)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  if (typeof body.data !== 'object' || body.data === null) {
    return res.status(400).json({ error: 'Invalid event data' });
  }

  const payload: WebhookPayload = {
    id: body.id || crypto.randomUUID(),
    event: body.event,
    timestamp: new Date().toISOString(),
    data: body.data,
  };

  const subscriptions = subscriptionStore.findByEvent(body.event);
  const results = await dispatchEvent(payload, subscriptions);

  res.status(200).json({ payload, deliveries: results });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sender running on port ${PORT}`);
  });
}
