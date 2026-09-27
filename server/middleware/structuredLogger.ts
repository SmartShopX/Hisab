import { Request, Response, NextFunction } from 'express';

const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'token',
  'jwt',
  'otp',
  'secret',
  'apiKey',
  'api_key',
  'credit_card',
  'card_number',
  'cvv',
]);

export function sanitizeLogData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogData);
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function structuredLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.id || (req.headers['x-request-id'] as string) || null,
      businessId: (req as any).business?.id || req.headers['x-store-id'] || null,
      branchId: req.headers['x-branch-id'] || (req as any).branchId || null,
      userId: (req as any).user?.id || null,
      route: req.originalUrl || req.url,
      method: req.method,
      status: res.statusCode,
      durationMs,
      errorCode: (res as any).errorCode || (res.statusCode >= 400 ? `HTTP_${res.statusCode}` : undefined),
    };

    if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_LOGS) {
      // Keep test output clean unless explicitly requested
      return;
    }

    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ level: 'error', ...logEntry }));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify({ level: 'warn', ...logEntry }));
    } else if (process.env.DEBUG_LOGS === 'true') {
      console.log(JSON.stringify({ level: 'info', ...logEntry }));
    }
  });

  next();
}
