import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import request from 'supertest';
import { app, subscriptionStore } from '../../src/sender/server';

const WEBHOOK_SECRET = 'your-shared-secret-key';

describe('Sender subscription management and dispatch', () => {
  let callbackUrl: string;
  let callbackServer: Server | undefined;
  const receivedWebhooks: Array<{ body: unknown; headers: Record<string, unknown> }> = [];

  beforeAll((done) => {
    const callbackApp = express();
    callbackApp.use(express.json());

    callbackApp.post('/callback', (req, res) => {
      receivedWebhooks.push({ body: req.body, headers: req.headers });
      res.status(200).json({ status: 'ok' });
    });

    callbackServer = callbackApp.listen(0, () => {
      const address = callbackServer?.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to determine callback server address');
      }

      callbackUrl = `http://127.0.0.1:${address.port}/callback`;
      done();
    });
  });

  afterAll((done) => {
    callbackServer?.close(() => done());
  });

  beforeEach(() => {
    subscriptionStore.clear();
    receivedWebhooks.length = 0;
  });

  it('creates a subscription and returns it', async () => {
    const response = await request(app)
      .post('/subscriptions')
      .send({ callbackUrl, events: ['item.created'], secret: WEBHOOK_SECRET });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ callbackUrl, events: ['item.created'] });
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('dispatches events to matching subscriptions', async () => {
    const createResponse = await request(app)
      .post('/subscriptions')
      .send({ callbackUrl, events: ['item.created'], secret: WEBHOOK_SECRET });

    expect(createResponse.status).toBe(201);

    const dispatchResponse = await request(app)
      .post('/events')
      .send({ event: 'item.created', data: { itemId: 'abc-123' } });

    expect(dispatchResponse.status).toBe(200);
    expect(dispatchResponse.body).toHaveProperty('payload');
    expect(dispatchResponse.body.deliveries).toHaveLength(1);
    expect(dispatchResponse.body.deliveries[0].success).toBe(true);

    expect(receivedWebhooks).toHaveLength(1);
    const webhook = receivedWebhooks[0];
    expect((webhook.body as any).event).toBe('item.created');
    expect((webhook.body as any).data).toEqual({ itemId: 'abc-123' });
    expect(typeof webhook.headers['x-webhook-signature']).toBe('string');
  });

  it('rejects invalid callbackUrl when creating a subscription', async () => {
    const response = await request(app)
      .post('/subscriptions')
      .send({ callbackUrl: 'ftp://invalid-url', events: ['item.created'], secret: WEBHOOK_SECRET });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid callbackUrl' });
  });

  it('rejects invalid event names when creating a subscription', async () => {
    const response = await request(app)
      .post('/subscriptions')
      .send({ callbackUrl, events: ['bad.event'], secret: WEBHOOK_SECRET });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid events list' });
  });

  it('returns the subscription list and allows deletion', async () => {
    const createResponse = await request(app)
      .post('/subscriptions')
      .send({ callbackUrl, events: ['item.created'], secret: WEBHOOK_SECRET });

    const subscriptionId = createResponse.body.id;

    const listResponse = await request(app).get('/subscriptions');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const deleteResponse = await request(app).delete(`/subscriptions/${subscriptionId}`);
    expect(deleteResponse.status).toBe(204);

    const notFoundResponse = await request(app).get(`/subscriptions/${subscriptionId}`);
    expect(notFoundResponse.status).toBe(404);
  });
});
