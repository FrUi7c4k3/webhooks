import axios from 'axios';
import { generateSignature } from '../receiver/security';
import { DispatchResult, Subscription } from './types';
import { WebhookPayload } from '../types.shared';

/**
 * A reduced HTTP response model used for webhook delivery logic.
 */
interface HttpResponse {
  status: number;
  body: string;
}

/**
 * Send a JSON payload to a webhook callback URL using axios.
 * Returns status and body text regardless of HTTP response code.
 */
async function sendPostJson(
  callbackUrl: string,
  payload: WebhookPayload,
  headers: Record<string, string>
): Promise<HttpResponse> {
  const response = await axios.post(callbackUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    validateStatus: () => true,
  });

  return {
    status: response.status,
    body: typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data),
  };
}

/**
 * Attempt to deliver a webhook payload to a subscription endpoint.
 * Retries on network or transport failures up to maxAttempts.
 */
export async function deliverWebhook(
  subscription: Subscription,
  payload: WebhookPayload,
  maxAttempts = 3
): Promise<DispatchResult> {
  const signature = generateSignature(JSON.stringify(payload), subscription.secret);
  const headers = {
    'X-Webhook-Signature': signature,
  };

  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await sendPostJson(subscription.callbackUrl, payload, headers);
      lastStatus = response.status;

      if (response.status >= 200 && response.status < 300) {
        return {
          subscriptionId: subscription.id,
          callbackUrl: subscription.callbackUrl,
          success: true,
          status: response.status,
        };
      }

      lastError = `Unexpected status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    subscriptionId: subscription.id,
    callbackUrl: subscription.callbackUrl,
    success: false,
    status: lastStatus,
    error: lastError,
  };
}

/**
 * Dispatch a webhook payload to all subscriptions for an event.
 * Returns a delivery result for each subscription.
 */
export async function dispatchEvent(
  payload: WebhookPayload,
  subscriptions: Subscription[]
): Promise<DispatchResult[]> {
  const deliveries = subscriptions.map((subscription) =>
    deliverWebhook(subscription, payload)
  );

  const settled = await Promise.allSettled(deliveries);

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    const subscription = subscriptions[index];
    return {
      subscriptionId: subscription.id,
      callbackUrl: subscription.callbackUrl,
      success: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}
