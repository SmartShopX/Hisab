import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

function getStore(namespace: string): Map<string, RateLimitRecord> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

export function createRateLimiter(options: {
  namespace: string;
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    namespace,
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message = 'Too many requests. Please try again later.',
    keyGenerator = (req: Request) => {
      const authUser = (req as any).user?.id;
      const storeId = req.headers['x-store-id'] as string;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      return authUser ? `${authUser}:${storeId || 'store'}` : `${ip}:${storeId || 'anon'}`;
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if disabled in environment
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const now = Date.now();
    const cutoff = now - windowMs;
    const store = getStore(namespace);
    const key = keyGenerator(req);

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Clean up timestamps outside window
    record.timestamps = record.timestamps.filter((t) => t > cutoff);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, maxRequests - currentCount);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

    if (currentCount >= maxRequests) {
      const oldest = record.timestamps[0] || now;
      const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter,
        requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Auth specific limiter: login, register, password, OTP
export const authRateLimiter = createRateLimiter({
  namespace: 'auth',
  windowMs: 60000,
  maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10),
  message: 'Too many authentication attempts. Please wait a minute and try again.',
  keyGenerator: (req) => `${req.ip || 'ip'}:${req.body?.mobile || 'mobile'}`,
});

// General API limiter
export const apiRateLimiter = createRateLimiter({
  namespace: 'api',
  windowMs: 60000,
  maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '300', 10),
  message: 'API rate limit exceeded. Please slow down your requests.',
});

// Financial transactions limiter (checkout, refunds)
export const financialRateLimiter = createRateLimiter({
  namespace: 'financial',
  windowMs: 60000,
  maxRequests: parseInt(process.env.FINANCIAL_RATE_LIMIT_MAX_REQUESTS || '60', 10),
  message: 'Transaction rate limit exceeded. Please wait a moment before trying again.',
});

export function resetRateLimits(): void {
  for (const store of stores.values()) {
    store.clear();
  }
}
