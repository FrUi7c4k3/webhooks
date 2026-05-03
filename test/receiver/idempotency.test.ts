import { idempotencyStore } from '../../src/receiver/idempotency';

describe('Idempotency Store', () => {
  beforeEach(() => {
    idempotencyStore.clear();
  });

  it('marks webhook IDs as processed and reports them correctly', () => {
    expect(idempotencyStore.isProcessed('abc')).toBe(false);

    idempotencyStore.markProcessed('abc');

    expect(idempotencyStore.isProcessed('abc')).toBe(true);
  });

  it('returns correct count and clears stored IDs', () => {
    idempotencyStore.markProcessed('one');
    idempotencyStore.markProcessed('two');

    expect(idempotencyStore.getCount()).toBe(2);

    idempotencyStore.clear();
    expect(idempotencyStore.getCount()).toBe(0);
  });
});
