import { isWebhookPayload } from '../../src/receiver/validators';

describe('Webhook payload validation', () => {
  it('accepts a valid webhook payload object', () => {
    const payload = {
      id: 'webhook-1',
      event: 'item.created',
      timestamp: new Date().toISOString(),
      data: { itemId: 'abc' },
    };

    expect(isWebhookPayload(payload)).toBe(true);
  });

  it('rejects payloads with invalid event types', () => {
    const payload = {
      id: 'webhook-2',
      event: 'invalid.event',
      timestamp: new Date().toISOString(),
      data: { itemId: 'abc' },
    };

    expect(isWebhookPayload(payload)).toBe(false);
  });

  it('rejects payloads with missing fields', () => {
    const payload = {
      event: 'item.created',
      timestamp: new Date().toISOString(),
      data: { itemId: 'abc' },
    };

    expect(isWebhookPayload(payload)).toBe(false);
  });

  it('rejects payloads when data is not an object', () => {
    const payload = {
      id: 'webhook-3',
      event: 'item.created',
      timestamp: new Date().toISOString(),
      data: 'not-an-object',
    };

    expect(isWebhookPayload(payload)).toBe(false);
  });
});
