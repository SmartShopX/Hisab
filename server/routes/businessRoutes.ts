import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// Profile for current active business
router.get('/profile', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const bRes = await query('SELECT * FROM businesses WHERE id = $1', [req.business?.id]);
    if (bRes.rows.length === 0) {
      return res.status(404).json({ error: 'BusinessNotFound' });
    }

    const row = bRes.rows[0];
    return res.json({
      id: row.id,
      name: row.name,
      category: row.category,
      businessType: row.business_type,
      businessModel: row.business_model,
      template: row.template,
      address: row.address,
      phone: row.phone,
      storeSlug: row.store_slug,
      plan: row.subscription_plan,
      isSuspended: row.is_suspended,
      featureOverrides: row.feature_overrides || {},
      modules: row.modules || {},
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update profile
router.put('/profile', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, address, phone, category, modules } = req.body;
  try {
    const bRes = await query(
      `UPDATE businesses
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           category = COALESCE($4, category),
           modules = COALESCE($5, modules),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, address, phone, category, modules ? JSON.stringify(modules) : null, req.business?.id]
    );

    if (bRes.rows.length === 0) {
      return res.status(404).json({ error: 'BusinessNotFound' });
    }

    return res.json(bRes.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// List user's businesses
router.get('/list', authenticateToken, async (req: TenantRequest, res: Response) => {
  try {
    const bRes = await query(
      `SELECT b.id, b.name, b.category, b.store_slug, b.subscription_plan, m.role
       FROM businesses b
       JOIN business_memberships m ON m.business_id = b.id
       WHERE m.user_id = $1 AND b.is_active = true`,
      [req.user?.id]
    );
    return res.json(bRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;
