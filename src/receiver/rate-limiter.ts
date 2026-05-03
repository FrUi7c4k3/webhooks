/**
 * Simple in-memory rate limiter for webhook endpoints.
 * Tracks requests per IP address over a rolling time window.
 */
class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  /**
   * Returns true when a request is allowed and logs the request.
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const ipRequests = this.requests.get(ip) || [];
    const recentRequests = ipRequests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      this.requests.set(ip, recentRequests);
      return false;
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
  }

  /**
   * Returns the number of requests seen for the IP in the current window.
   */
  getRequestCount(ip: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const ipRequests = this.requests.get(ip) || [];
    return ipRequests.filter(timestamp => timestamp > windowStart).length;
  }

  /**
   * Clear all stored rate limit data.
   */
  clear(): void {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();
