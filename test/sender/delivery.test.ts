import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { deliverWebhook, dispatchEvent } from '../../src/sender/delivery';
import type { Subscription } from '../../src/sender/types';
import type { WebhookPayload } from '../../src/types.shared';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Sender delivery with axios', () => {
  const subscription: Subscription = {
    id: 'sub-123',
    callbackUrl: 'http://example.com/webhook',
    events: ['item.created'],
    secret: 'secret-key',
    createdAt: new Date().toISOString(),
  };

  const payload: WebhookPayload = {
    id: 'payload-123',
    event: 'item.created',
    timestamp: new Date().toISOString(),
    data: { itemId: 'abc-123' },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls axios.post and returns a successful dispatch result', async () => {
    const response = {
      data: { status: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} },
    } as unknown as AxiosResponse;

    mockedAxios.post.mockResolvedValue(response);

    const result = await deliverWebhook(subscription, payload);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      subscription.callbackUrl,
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Webhook-Signature': expect.any(String),
        }),
        validateStatus: expect.any(Function),
      })
    );
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it('retries on axios failures and returns a failed dispatch result', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network failure'));

    const result = await deliverWebhook(subscription, payload, 2);

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network failure');
    expect(result.status).toBeUndefined();
  });

  it('returns failure when axios responds with non-2xx status', async () => {
    const response = {
      data: 'Server error',
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} },
    } as unknown as AxiosResponse;

    mockedAxios.post.mockResolvedValue(response);

    const result = await deliverWebhook(subscription, payload, 1);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe('Unexpected status 500');
  });

  it('returns mixed success and failure results from dispatchEvent', async () => {
    const response1 = {
      data: { status: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} },
    } as unknown as AxiosResponse;

    const response2 = {
      data: 'Server error',
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} },
    } as unknown as AxiosResponse;

    mockedAxios.post.mockResolvedValueOnce(response1).mockResolvedValueOnce(response2);

    const subscriptions = [
      subscription,
      { ...subscription, id: 'sub-456', callbackUrl: 'http://example.com/fail' },
    ];

    const results = await dispatchEvent(payload, subscriptions);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].status).toBe(500);
  });
});
