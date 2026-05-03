import { subscriptionStore } from '../../src/sender/subscription-store';

describe('Subscription Store', () => {
  beforeEach(() => {
    subscriptionStore.clear();
  });

  it('creates a subscription with default events', () => {
    const subscription = subscriptionStore.create({
      callbackUrl: 'http://example.com/webhook',
      secret: 'test-secret',
    });

    expect(subscription.events).toEqual(['item.created', 'item.updated', 'item.deleted', 'ping']);
    expect(subscription.callbackUrl).toBe('http://example.com/webhook');
    expect(subscription.secret).toBe('test-secret');
    expect(subscription.createdAt).toBeDefined();
    expect(subscription.id).toBeDefined();
  });

  it('finds subscriptions by event and deletes them correctly', () => {
    const sub1 = subscriptionStore.create({
      callbackUrl: 'http://example.com/a',
      events: ['item.created'],
    });
    const sub2 = subscriptionStore.create({
      callbackUrl: 'http://example.com/b',
      events: ['item.updated'],
    });

    expect(subscriptionStore.list()).toHaveLength(2);
    expect(subscriptionStore.findByEvent('item.created')).toEqual([sub1]);
    expect(subscriptionStore.findByEvent('item.updated')).toEqual([sub2]);

    expect(subscriptionStore.delete(sub1.id)).toBe(true);
    expect(subscriptionStore.get(sub1.id)).toBeUndefined();
    expect(subscriptionStore.list()).toHaveLength(1);
  });

  it('clears all subscriptions', () => {
    subscriptionStore.create({
      callbackUrl: 'http://example.com/a',
      events: ['item.created'],
    });
    subscriptionStore.clear();

    expect(subscriptionStore.list()).toEqual([]);
  });
});
