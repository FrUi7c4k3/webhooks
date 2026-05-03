/**
 * In-memory idempotency store to track processed webhook IDs.
 * Prevents duplicate processing of the same webhook event.
 */
class IdempotencyStore {
  private processedIds = new Set<string>();

  /**
   * Check if a webhook ID has already been processed.
   */
  isProcessed(id: string): boolean {
    return this.processedIds.has(id);
  }

  /**
   * Mark a webhook ID as processed.
   */
  markProcessed(id: string): void {
    this.processedIds.add(id);
  }

  /**
   * Clear the store (useful for testing).
   */
  clear(): void {
    this.processedIds.clear();
  }

  /**
   * Get count of processed webhooks (for monitoring).
   */
  getCount(): number {
    return this.processedIds.size;
  }
}

export const idempotencyStore = new IdempotencyStore();
