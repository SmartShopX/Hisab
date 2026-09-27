import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

export const PLAN_QUOTAS: Record<string, { maxStores: number; maxProducts: number; maxStaff: number; maxAiCredits: number; allowedFeatures: string[] }> = {
  FREE: {
    maxStores: 1,
    maxProducts: 50,
    maxStaff: 1,
    maxAiCredits: 10,
    allowedFeatures: ['pos', 'basic_inventory', 'basic_reports', 'ai_product_studio'],
  },
  STARTER: {
    maxStores: 2,
    maxProducts: 250,
    maxStaff: 3,
    maxAiCredits: 60,
    allowedFeatures: ['pos', 'basic_inventory', 'basic_reports', 'customer_due', 'sms_receipts', 'ai_product_studio'],
  },
  BUSINESS: {
    maxStores: 5,
    maxProducts: 2000,
    maxStaff: 10,
    maxAiCredits: 300,
    allowedFeatures: [
      'pos',
      'basic_inventory',
      'basic_reports',
      'customer_due',
      'sms_receipts',
      'landing_page_builder',
      'courier_automation',
      'barcode_generation',
      'stock_alerts',
      'ai_product_studio',
    ],
  },
  ENTERPRISE: {
    maxStores: 999,
    maxProducts: 999999,
    maxStaff: 999,
    maxAiCredits: 2000,
    allowedFeatures: [
      'pos',
      'basic_inventory',
      'basic_reports',
      'customer_due',
      'sms_receipts',
      'landing_page_builder',
      'courier_automation',
      'barcode_generation',
      'stock_alerts',
      'sms_marketing_bulk',
      'multi_branch_sync',
      'custom_domain',
      'priority_support',
      'ai_product_studio',
    ],
  },
};

// Check subscription status & server-enforced quotas
router.get('/status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const currentPlan = (req.business?.subscriptionPlan || 'BUSINESS').toUpperCase();
  const quota = PLAN_QUOTAS[currentPlan] || PLAN_QUOTAS.STARTER;

  try {
    // 1. Current product count
    const pCountRes = await query('SELECT COUNT(*) FROM products WHERE business_id = $1 AND is_active = true', [
      req.business?.id,
    ]);
    const productCount = parseInt(pCountRes.rows[0].count, 10);

    // 2. Current staff count
    const sCountRes = await query('SELECT COUNT(*) FROM business_memberships WHERE business_id = $1 AND is_active = true', [
      req.business?.id,
    ]);
    const staffCount = parseInt(sCountRes.rows[0].count, 10);

    return res.json({
      plan: currentPlan,
      status: req.business?.isSuspended ? 'Suspended' : 'Active',
      isSuspended: req.business?.isSuspended,
      quotas: {
        products: {
          current: productCount,
          max: quota.maxProducts,
          isExceeded: productCount >= quota.maxProducts,
        },
        staff: {
          current: staffCount,
          max: quota.maxStaff,
          isExceeded: staffCount >= quota.maxStaff,
        },
        aiCredits: {
          current: 12,
          max: quota.maxAiCredits,
          isExceeded: 12 >= quota.maxAiCredits,
        },
      },
      allowedFeatures: quota.allowedFeatures,
      featureOverrides: req.business?.featureOverrides || {},
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return res.json({
        plan: currentPlan,
        status: 'Active',
        isSuspended: false,
        quotas: {
          products: { current: 2, max: quota.maxProducts, isExceeded: false },
          staff: { current: 1, max: quota.maxStaff, isExceeded: false },
        },
        allowedFeatures: quota.allowedFeatures,
        featureOverrides: req.business?.featureOverrides || {},
      });
    }
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'PostgreSQL database is currently unreachable' });
  }
});

// Upgrade plan request
router.post('/upgrade', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { plan } = req.body;
  const targetPlan = (plan || 'BUSINESS').toUpperCase();

  if (!PLAN_QUOTAS[targetPlan]) {
    return res.status(422).json({ error: 'InvalidPlan', message: 'Requested plan tier is not recognized' });
  }

  try {
    await query('UPDATE businesses SET subscription_plan = $1, updated_at = NOW() WHERE id = $2', [
      targetPlan,
      req.business?.id,
    ]);

    return res.json({
      success: true,
      message: `Subscription successfully updated to ${targetPlan}`,
      plan: targetPlan,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
