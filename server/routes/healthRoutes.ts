import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../config/database.js';

const router = Router();

// GET /health - General Application Health
router.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();

  const responsePayload = {
    status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
    version: '1.0.0',
    service: 'SmartShopX Central Authority',
    timestamp: new Date().toISOString(),
    database: {
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
    },
    features: {
      multiTenancy: 'active',
      subscriptionAuthority: 'active',
      posAtomicity: 'active',
      personalIsolation: 'active',
    },
    requestId: req.id || req.headers['x-request-id'] || null,
  };

  return res.json(responsePayload);
});

// GET /health/db - Dedicated Database Connectivity Health Check
router.get('/health/db', async (req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();

  if (dbHealth.status === 'healthy') {
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      latencyMs: dbHealth.latencyMs,
      timestamp: new Date().toISOString(),
      requestId: req.id || req.headers['x-request-id'] || null,
    });
  }

  // Database failure returns appropriate 503 status without leaking credentials
  return res.status(503).json({
    status: 'unhealthy',
    database: 'unreachable',
    timestamp: new Date().toISOString(),
    requestId: req.id || req.headers['x-request-id'] || null,
  });
});

// GET /health/live - Liveness Probe (process running)
router.get('/health/live', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// GET /health/ready - Readiness Probe (dependencies available)
router.get('/health/ready', async (req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();

  // In test/dev environment with local fallback, ready is true
  if (dbHealth.status === 'healthy' || process.env.NODE_ENV !== 'production') {
    return res.status(200).json({
      status: 'ready',
      database: dbHealth.status,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'not_ready',
    reason: 'Database dependency unavailable',
    timestamp: new Date().toISOString(),
  });
});

export default router;
