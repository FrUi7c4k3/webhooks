import request from 'supertest';
import { app } from '../../src/receiver/server';
import { generateSignature } from '../../src/receiver/security';
import { idempotencyStore } from '../../src/receiver/idempotency';
import { rateLimiter } from '../../src/receiver/rate-limiter';

const secret = 'your-shared-secret-key';

const payload = {
  id: 'webhook-123',
  event: 'item.created',
  timestamp: new Date().toISOString(),
  data: {
    itemId: 'abc-456',
    name: 'Test Item',
  },
};

const payloadJson = JSON.stringify(payload);
const signature = generateSignature(payloadJson, secret);

describe('Webhook receiver integration', () => {
  beforeEach(() => {
    idempotencyStore.clear();
    rateLimiter.clear();
  });

  it('should accept a valid webhook request', async () => {
    const response = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', signature)
      .send(payloadJson);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'received' });
  });

  it('should reject a webhook with an invalid signature', async () => {
    const response = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', 'invalid-signature')
      .send(payloadJson);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid signature' });
  });

  it('should skip duplicate webhook processing using idempotency', async () => {
    const first = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', signature)
      .send(payloadJson);

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ status: 'received' });

    const second = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', signature)
      .send(payloadJson);

    expect(second.status).toBe(200);
    expect(second.body).toEqual({ status: 'received' });
    expect(idempotencyStore.isProcessed(payload.id)).toBe(true);
  });

  it('should reject requests without a signature header', async () => {
    const response = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send(payloadJson);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Missing X-Webhook-Signature header' });
  });

  it('should reject invalid webhook payloads after signature verification', async () => {
    const invalidPayload = JSON.stringify({ id: 'bad-1', event: 'item.created', data: 'not-an-object' });
    const invalidSignature = generateSignature(invalidPayload, secret);

    const response = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', invalidSignature)
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid webhook payload' });
  });

  it('should enforce rate limiting for repeated requests from the same IP', async () => {
    let lastResponse;

    for (let i = 0; i < 101; i += 1) {
      lastResponse = await request(app)
        .post('/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Webhook-Signature', signature)
        .send(payloadJson);
    }

    expect(lastResponse?.status).toBe(429);
    expect(lastResponse?.body).toEqual({ error: 'Too many requests' });
  });
});
