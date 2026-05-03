import crypto from 'crypto';

/**
 * Generate an HMAC-SHA256 signature for a payload using a shared secret.
 * This is what the webhook provider does before sending.
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify that a received signature matches the payload.
 * Safe against timing attacks by using timingSafeEqual.
 */
export function verifySignature(
  payload: string,
  secret: string,
  receivedSignature: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);

  // Normalize to lowercase for case-insensitive comparison
  const expectedHex = expectedSignature.toLowerCase();
  const receivedHex = receivedSignature.toLowerCase();

  // Use timingSafeEqual to prevent timing attacks
  // (attackers can't guess the signature byte-by-byte)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHex),
      Buffer.from(receivedHex)
    );
  } catch {
    // If lengths don't match, timingSafeEqual throws
    return false;
  }
}
