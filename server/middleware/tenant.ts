import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { query } from '../config/database.js';

export interface TenantContext {
  id: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
  isSuspended: boolean;
  subscriptionPlan: string;
  featureOverrides: Record<string, boolean>;
}

export interface TenantRequest extends AuthRequest {
  business?: TenantContext;
}

export async function requireTenant(req: TenantRequest, res: Response, next: NextFunction) {
  const storeId = (req.headers['x-store-id'] as string) || req.query.storeId as string || req.body?.storeId;

  if (!storeId) {
    return res.status(400).json({
      error: 'MissingStoreHeader',
      message: 'X-Store-Id header is required for business operations',
    });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    // 1. Verify business existence
    const bRes = await query(
      'SELECT id, name, is_suspended, subscription_plan, feature_overrides FROM businesses WHERE id = $1',
      [storeId]
    );

    if (bRes.rows.length === 0) {
      // In development / demo mode, if database is empty or not yet migrated, provide safe isolated tenant context
      if (process.env.NODE_ENV !== 'production' && (storeId === 'shop_101' || storeId.startsWith('shop_'))) {
        req.business = {
          id: storeId,
          name: 'Demo Store',
          role: req.user.role || 'owner',
          permissions: {
            canViewSales: true,
            canCreateSale: true,
            canManageProducts: true,
            canManageCustomers: true,
            canManageOrders: true,
            canViewReports: true,
            canManagePayments: true,
          },
          isSuspended: false,
          subscriptionPlan: 'Standard',
          featureOverrides: {},
        };
        return next();
      }

      return res.status(404).json({
        error: 'StoreNotFound',
        message: 'The requested business/store does not exist',
      });
    }

    const businessRow = bRes.rows[0];

    // 2. Verify user membership/ownership for this business
    const mRes = await query(
      'SELECT role, permissions, is_active FROM business_memberships WHERE user_id = $1 AND business_id = $2',
      [req.user.id, storeId]
    );

    let role = req.user.role;
    let permissions: Record<string, boolean> = {};

    if (mRes.rows.length === 0) {
      // Check if user is owner of the business account
      const ownerCheck = await query(
        'SELECT u.id FROM users u JOIN accounts a ON a.user_id = u.id JOIN businesses b ON b.account_id = a.id WHERE u.id = $1 AND b.id = $2',
        [req.user.id, storeId]
      );

      if (ownerCheck.rows.length === 0 && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error: 'ForbiddenTenantAccess',
          message: 'You are not authorized to access this business entity',
        });
      }
      role = 'owner';
    } else {
      if (!mRes.rows[0].is_active) {
        return res.status(403).json({
          error: 'MembershipInactive',
          message: 'Your membership in this business is currently deactivated',
        });
      }
      role = mRes.rows[0].role;
      permissions = mRes.rows[0].permissions || {};
    }

    // 3. Check suspension for mutation requests
    if (businessRow.is_suspended && req.method !== 'GET') {
      return res.status(403).json({
        error: 'StoreSuspended',
        message: 'This business account has been suspended by administration. Write operations are disabled.',
      });
    }

    req.business = {
      id: businessRow.id,
      name: businessRow.name,
      role,
      permissions,
      isSuspended: businessRow.is_suspended,
      subscriptionPlan: businessRow.subscription_plan || 'Standard',
      featureOverrides: businessRow.feature_overrides || {},
    };

    next();
  } catch (err: any) {
    const isConnRefused =
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('unreachable');

    // Dev fallback if DB connection fails temporarily
    if (isConnRefused && process.env.NODE_ENV !== 'production') {
      req.business = {
        id: storeId,
        name: 'Fallback Store',
        role: req.user?.role || 'owner',
        permissions: {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: true,
          canManagePayments: true,
        },
        isSuspended: false,
        subscriptionPlan: 'Standard',
        featureOverrides: {},
      };
      return next();
    }

    console.error('Tenant verification error:', err.message);
    return res.status(500).json({ error: 'DatabaseError', message: 'Tenant verification failed' });
  }
}
