import { Request, Response, NextFunction } from 'express';

export function centralizedErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const requestId = req.id || (req.headers['x-request-id'] as string) || `req_${Date.now()}`;

  // Log complete error securely server-side
  console.error('[CentralizedErrorHandler]', {
    requestId,
    method: req.method,
    route: req.originalUrl || req.url,
    errorName: err.name,
    errorMessage: err.message,
    stack: !isProduction ? err.stack : undefined,
  });

  const statusCode = err.status || err.statusCode || 500;
  let errorCode = err.code || err.name || 'INTERNAL_SERVER_ERROR';
  let clientMessage = err.message || 'An unexpected internal error occurred';

  // Sanitize internal details in production
  if (isProduction) {
    if (statusCode === 500) {
      clientMessage = 'An unexpected internal server error occurred. Please contact support with your Request ID.';
      errorCode = 'INTERNAL_SERVER_ERROR';
    } else if (
      clientMessage.toLowerCase().includes('select') ||
      clientMessage.toLowerCase().includes('postgres') ||
      clientMessage.toLowerCase().includes('database') ||
      clientMessage.toLowerCase().includes('table') ||
      clientMessage.toLowerCase().includes('column') ||
      clientMessage.toLowerCase().includes('syntax error') ||
      clientMessage.toLowerCase().includes('connection')
    ) {
      clientMessage = 'A data service operation failed. Please retry shortly.';
      errorCode = 'DATABASE_ERROR';
    }
  }

  // Ensure SQL syntax and DB connection info is NEVER sent to client in any environment
  if (
    clientMessage.includes('password=') ||
    clientMessage.includes('ECONNREFUSED 127.0.0.1') ||
    clientMessage.includes('postgres://')
  ) {
    clientMessage = 'The database service is temporarily unavailable.';
    errorCode = 'DATABASE_UNAVAILABLE';
  }

  return res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: clientMessage,
    details: err.details || undefined,
    requestId,
  });
}
