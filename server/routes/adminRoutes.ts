import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

// List all stores for Mother Admin
router.get('/stores', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const storesRes = await query(
      `SELECT b.id, b.name, b.category, b.store_slug as "storeSlug",
              b.subscription_plan as "plan", b.is_suspended as "isSuspended",
              b.suspension_reason as "suspensionReason",
              b.feature_overrides as "featureOverrides",
              b.created_at as "createdAt",
              COUNT(DISTINCT p.id) as "totalProducts",
              COUNT(DISTINCT o.id) as "totalOrders"
       FROM businesses b
       LEFT JOIN products p ON p.business_id = b.id
       LEFT JOIN orders o ON o.business_id = b.id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );
    return res.json(storesRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Suspend or Unsuspend store
router.post('/stores/:id/suspend', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isSuspended, reason } = req.body;

  try {
    const bRes = await query(
      `UPDATE businesses
       SET is_suspended = $1, suspension_reason = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, is_suspended as "isSuspended"`,
      [isSuspended, reason || null, id]
    );

    if (bRes.rows.length === 0) {
      return res.status(404).json({ error: 'StoreNotFound' });
    }

    // Record admin audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, 'business', $5, $6)`,
      [
        'audit_' + Date.now(),
        req.user?.id,
        id,
        isSuspended ? 'STORE_SUSPENDED' : 'STORE_UNSUSPENDED',
        id,
        JSON.stringify({ isSuspended, reason, performedBy: req.user?.mobile }),
      ]
    );

    return res.json({
      success: true,
      message: `Store ${isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      store: bRes.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update feature overrides
router.post('/stores/:id/feature-override', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { featureKey, enabled } = req.body;

  if (!featureKey) {
    return res.status(422).json({ error: 'ValidationError', message: 'featureKey is required' });
  }

  try {
    const bRes = await query('SELECT feature_overrides FROM businesses WHERE id = $1', [id]);
    if (bRes.rows.length === 0) {
      return res.status(404).json({ error: 'StoreNotFound' });
    }

    const currentOverrides = bRes.rows[0].feature_overrides || {};
    currentOverrides[featureKey] = enabled;

    await query('UPDATE businesses SET feature_overrides = $1, updated_at = NOW() WHERE id = $2', [
      JSON.stringify(currentOverrides),
      id,
    ]);

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, 'FEATURE_OVERRIDE_UPDATED', 'business', $4, $5)`,
      [
        'audit_' + Date.now(),
        req.user?.id,
        id,
        id,
        JSON.stringify({ featureKey, enabled, performedBy: req.user?.mobile }),
      ]
    );

    return res.json({
      success: true,
      featureOverrides: currentOverrides,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Audit logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const aRes = await query(
      `SELECT id, user_id as "userId", business_id as "businessId", action,
              entity_type as "entityType", entity_id as "entityId", details, created_at as "createdAt"
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json(aRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
