export type WebhookEvent = 'item.created' | 'item.updated' | 'item.deleted' | 'ping';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}