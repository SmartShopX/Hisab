import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant.js';

interface RateLimitRecord {
  timestamps: number[];
}

const windowSec = parseInt(process.env.AI_RATE_LIMIT_WINDOW || '60', 10);
const maxRequests = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '30', 10);
const limitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const cutoff = now - windowSec * 1000;
  for (const [key, record] of limitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > cutoff);
    if (record.timestamps.length === 0) {
      limitStore.delete(key);
    }
  }
}, 300000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}


export function aiRateLimiter(req: TenantRequest, res: Response, next: NextFunction) {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const cutoff = now - windowMs;

  const identityKey = `${req.user?.id || 'guest'}:${req.business?.id || req.ip || 'ip'}`;

  let record = limitStore.get(identityKey);
  if (!record) {
    record = { timestamps: [] };
    limitStore.set(identityKey, record);
  }

  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter((t) => t > cutoff);

  const currentCount = record.timestamps.length;
  const remaining = Math.max(0, maxRequests - currentCount);

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

  if (currentCount >= maxRequests) {
    const oldest = record.timestamps[0] || now;
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);

    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMITED',
        message: 'AI request rate limit exceeded. Please wait a moment before trying again.',
      },
      retryAfter,
      requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
    });
  }

  record.timestamps.push(now);
  next();
}

/**
 * Helper to reset rate limits (useful for automated testing)
 */
export function resetAiRateLimits(): void {
  limitStore.clear();
}
