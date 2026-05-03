import { generateSignature, verifySignature } from '../../src/receiver/security';

describe('Webhook Security', () => {
  const secret = 'test-secret-key';
  const payload = '{"id":"123","event":"item.created"}';

  describe('generateSignature', () => {
    it('should generate a consistent HMAC-SHA256 signature', () => {
      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret);

      // Same input should produce same signature
      expect(sig1).toBe(sig2);
    });

    it('should return a 64-character hex string for SHA256', () => {
      const signature = generateSignature(payload, secret);

      // SHA256 produces 32 bytes = 64 hex characters
      expect(signature).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(signature)).toBe(true);
    });

    it('should produce different signatures for different payloads', () => {
      const payload2 = '{"id":"456","event":"item.deleted"}';

      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload2, secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const secret2 = 'different-secret';

      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const signature = generateSignature(payload, secret);
      const isValid = verifySignature(payload, secret, signature);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const invalidSignature = 'invalid-signature-12345';
      const isValid = verifySignature(payload, secret, invalidSignature);

      expect(isValid).toBe(false);
    });

    it('should reject if payload is tampered with', () => {
      const signature = generateSignature(payload, secret);
      const tamperedPayload = '{"id":"999","event":"item.created"}';

      const isValid = verifySignature(tamperedPayload, secret, signature);

      expect(isValid).toBe(false);
    });

    it('should reject if secret is wrong', () => {
      const signature = generateSignature(payload, secret);
      const wrongSecret = 'wrong-secret-key';

      const isValid = verifySignature(payload, wrongSecret, signature);

      expect(isValid).toBe(false);
    });

    it('should reject if signature format is invalid', () => {
      const malformedSignature = 'not-a-valid-hex-string-!@#$%';
      const isValid = verifySignature(payload, secret, malformedSignature);

      expect(isValid).toBe(false);
    });

    it('should handle case-insensitive hex comparison', () => {
      const signature = generateSignature(payload, secret);
      const uppercaseSignature = signature.toUpperCase();

      // Hex comparison should be case-insensitive
      const isValid = verifySignature(payload, secret, uppercaseSignature);

      expect(isValid).toBe(true);
    });
  });
});
