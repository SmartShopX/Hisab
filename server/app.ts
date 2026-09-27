import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import aiStudioRoutes from './routes/aiStudioRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import courierRoutes from './routes/courierRoutes.js';
import telecomRoutes from './routes/telecomRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import supabaseDebugRoutes from './routes/supabaseDebugRoutes.js';

import { requestCorrelation } from './middleware/requestCorrelation.js';
import { structuredLogger } from './middleware/structuredLogger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { centralizedErrorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // 1. Request Correlation ID
  app.use(requestCorrelation);

  // 2. Structured JSON Logger
  app.use(structuredLogger);

  // 3. Basic security, CORS, and parsing
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Id', 'X-Request-Id', 'X-Idempotency-Key', 'X-Branch-Id'],
  }));

  // 4. Production Security Headers (Section 26)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root-level health probes (for ingress/k8s/uptime monitors)
  app.use('/', healthRoutes);

  // 5. API v1 Central Authority Endpoints
  const apiV1 = express.Router();

  // Apply general API rate limiter to apiV1
  apiV1.use(apiRateLimiter);

  apiV1.use('/', healthRoutes);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/business', businessRoutes);
  apiV1.use('/products', productRoutes);
  apiV1.use('/sales', saleRoutes);
  apiV1.use('/customers', customerRoutes);
  apiV1.use('/suppliers', supplierRoutes);
  apiV1.use('/payments', paymentRoutes);
  apiV1.use('/personal', personalRoutes);
  apiV1.use('/subscription', subscriptionRoutes);
  apiV1.use('/admin', adminRoutes);
  apiV1.use('/migration', migrationRoutes);
  apiV1.use('/ai', aiStudioRoutes);
  apiV1.use('/branches', branchRoutes);
  apiV1.use('/purchases', purchaseRoutes);
  apiV1.use('/courier', courierRoutes);
  apiV1.use('/telecom', telecomRoutes);
  apiV1.use('/returns', returnRoutes);
  apiV1.use('/settings/debug-supabase', supabaseDebugRoutes);
  apiV1.use('/admin/supabase-status', supabaseDebugRoutes);

  app.use('/api/v1', apiV1);

  // 6. Centralized Production Error Handler
  app.use(centralizedErrorHandler);

  return app;
}
