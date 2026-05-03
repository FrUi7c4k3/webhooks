import { WebhookEvent } from '../types.shared';

export interface SubscriptionRequest {
  callbackUrl: string;
  events?: WebhookEvent[];
  secret?: string;
}

export interface Subscription {
  id: string;
  callbackUrl: string;
  events: WebhookEvent[];
  secret: string;
  createdAt: string;
}

export interface DispatchRequest {
  id?: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}

export interface DispatchResult {
  subscriptionId: string;
  callbackUrl: string;
  success: boolean;
  status?: number;
  error?: string;
}
