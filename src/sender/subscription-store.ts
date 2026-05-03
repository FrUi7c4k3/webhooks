import crypto from 'crypto';
import { Subscription, SubscriptionRequest } from './types';
import { WebhookEvent } from '../types.shared';

const ALL_EVENTS: WebhookEvent[] = ['item.created', 'item.updated', 'item.deleted', 'ping'];

/**
 * In-memory store for sender subscriptions.
 * Provides create, list, lookup, deletion, and event matching.
 */
export class SubscriptionStore {
  private subscriptions = new Map<string, Subscription>();

  /**
   * Create and store a new subscription.
   */
  create(subscriptionRequest: SubscriptionRequest): Subscription {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const subscription: Subscription = {
      id,
      callbackUrl: subscriptionRequest.callbackUrl,
      events:
        subscriptionRequest.events && subscriptionRequest.events.length > 0
          ? subscriptionRequest.events
          : ALL_EVENTS,
      secret: subscriptionRequest.secret ?? process.env.WEBHOOK_SECRET ?? 'your-shared-secret-key',
      createdAt: now,
    };

    this.subscriptions.set(id, subscription);
    return subscription;
  }

  /**
   * Return all stored subscriptions.
   */
  list(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Return a single subscription by ID.
   */
  get(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * Remove a subscription by ID.
   */
  delete(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  /**
   * Find subscriptions that are subscribed to a specific event.
   */
  findByEvent(event: WebhookEvent): Subscription[] {
    return this.list().filter((subscription) => subscription.events.includes(event));
  }

  /**
   * Remove all subscriptions from the store.
   */
  clear(): void {
    this.subscriptions.clear();
  }
}

export const subscriptionStore = new SubscriptionStore();
