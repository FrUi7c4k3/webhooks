import { WebhookEvent, WebhookPayload } from '../types.shared';

const validEvents = new Set<WebhookEvent>(['item.created', 'item.updated', 'item.deleted', 'ping']);

/**
 * Check whether a value is a string.
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check whether a value is a non-null object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Validate the shape of an incoming webhook payload.
 */
export function isWebhookPayload(value: unknown): value is WebhookPayload {
  if (!isObject(value)) {
    return false;
  }

  return (
    isString(value.id) 
    && isString(value.event)
    && validEvents.has(value.event as WebhookEvent) 
    && isString(value.timestamp) 
    && isObject(value.data)
  );
}
