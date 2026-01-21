/**
 * Simple Token Bucket Rate Limiter
 * Note: In a distributed environment (e.g. Vercel Serverless), this in-memory cache
 * will only work per-lambda instance. For strict global rate limiting, use Redis (KV).
 * reliable enough for basic protection against single-source brute force.
 */

interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens (IPs) to track
}

interface RateLimitContext {
  check: (limit: number, token: string) => Promise<void>;
}

export default function rateLimit(options: RateLimitOptions): RateLimitContext {
  const tokenCache = new Map<string, number[]>();

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now();
        const windowStart = now - options.interval;

        // Clean up old tokens periodically or on access
        // (Simple optimization: just clean current token history first)
        const tokenHistory = tokenCache.get(token) || [];
        const validTokens = tokenHistory.filter(
          (timestamp) => timestamp > windowStart
        );

        if (validTokens.length >= limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          validTokens.push(now);
          tokenCache.set(token, validTokens);

          // Prune cache if too large (simple LRU-ish safety)
          if (tokenCache.size > options.uniqueTokenPerInterval) {
            const keysToDelete = Array.from(tokenCache.keys()).slice(0, 100);
            keysToDelete.forEach((k) => tokenCache.delete(k));
          }

          resolve();
        }
      }),
  };
}
