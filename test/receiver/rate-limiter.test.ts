import { rateLimiter } from '../../src/receiver/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  describe('isAllowed', () => {
    it('should allow requests under the limit', () => {
      const ip = '192.168.1.1';

      // Should allow first 100 requests
      for (let i = 0; i < 100; i++) {
        expect(rateLimiter.isAllowed(ip)).toBe(true);
      }
    });

    it('should block requests over the limit', () => {
      const ip = '192.168.1.1';

      // Use up the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.isAllowed(ip);
      }

      // 101st request should be blocked
      expect(rateLimiter.isAllowed(ip)).toBe(false);
    });

    it('should allow different IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP1 uses up limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.isAllowed(ip1);
      }
      expect(rateLimiter.isAllowed(ip1)).toBe(false);

      // IP2 should still be allowed
      expect(rateLimiter.isAllowed(ip2)).toBe(true);
    });
  });

  describe('getRequestCount', () => {
    it('should return correct count for an IP', () => {
      const ip = '192.168.1.1';

      expect(rateLimiter.getRequestCount(ip)).toBe(0);

      rateLimiter.isAllowed(ip);
      expect(rateLimiter.getRequestCount(ip)).toBe(1);

      rateLimiter.isAllowed(ip);
      expect(rateLimiter.getRequestCount(ip)).toBe(2);
    });
  });

  describe('clear', () => {
    it('should reset all rate limit data', () => {
      const ip = '192.168.1.1';

      rateLimiter.isAllowed(ip);
      expect(rateLimiter.getRequestCount(ip)).toBe(1);

      rateLimiter.clear();
      expect(rateLimiter.getRequestCount(ip)).toBe(0);
    });
  });
});
