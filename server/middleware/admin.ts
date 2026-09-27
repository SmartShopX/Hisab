import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const role = req.user.role?.toUpperCase();
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(403).json({
      error: 'ForbiddenAdminAccess',
      message: 'Mother Admin privileges required for this administrative operation',
    });
  }

  next();
}
