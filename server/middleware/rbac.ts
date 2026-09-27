import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant.js';

// Global Feature Lock Registry (controlled by App Controller / Environment)
const globalFeatureLocks = new Map<string, boolean>();

// Load from environment if defined
if (process.env.LOCKED_FEATURES) {
  for (const feature of process.env.LOCKED_FEATURES.split(',')) {
    if (feature.trim()) {
      globalFeatureLocks.set(feature.trim(), true);
    }
  }
}

/**
 * Configure global feature lock (App Controller Authority)
 */
export function setGlobalFeatureLock(featureKey: string, isLocked: boolean): void {
  if (isLocked) {
    globalFeatureLocks.set(featureKey, true);
  } else {
    globalFeatureLocks.delete(featureKey);
  }
}

export function isFeatureGloballyLocked(featureKey: string): boolean {
  return globalFeatureLocks.get(featureKey) === true;
}

export function resetGlobalFeatureLocks(): void {
  globalFeatureLocks.clear();
}

/**
 * Middleware: Verify feature is not locked globally or at business level
 * Store Controller and Staff CANNOT bypass a global lock.
 */
export function requireFeature(featureKey: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // 1. Check Global App Controller Lock (Unbypassable)
    if (isFeatureGloballyLocked(featureKey)) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_LOCKED_GLOBALLY',
        message: `The feature "${featureKey}" has been locked globally by App Controller. Access is disabled for all users.`,
        requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    // 2. Check Store-level lock/override
    const storeOverrides = req.business?.featureOverrides || {};
    if (storeOverrides[featureKey] === false) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_LOCKED_STORE',
        message: `The feature "${featureKey}" is disabled for this store.`,
        requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    next();
  };
}

/**
 * Middleware: Role & Permission Guard
 */
export function requireRole(allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const userRole = (req.business?.role || req.user?.role || '').toLowerCase();

    // SUPER_ADMIN and owner bypass local role checks unless feature is locked
    if (userRole === 'super_admin' || userRole === 'owner') {
      return next();
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Your role (${userRole}) is not permitted to perform this action. Required: ${allowedRoles.join(', ')}`,
        requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    next();
  };
}

/**
 * Middleware: Specific permission guard with role baseline rules
 * - Owner / Super Admin: Always allowed
 * - Manager: Operational permissions
 * - Cashier: Sales / payments / customer lookup only
 * - Stock Keeper: Inventory / products / transfers only
 * - Staff: Explicitly granted permissions only
 */
export function requirePermission(permissionName: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const userRole = (req.business?.role || req.user?.role || '').toLowerCase();

    if (userRole === 'super_admin' || userRole === 'owner') {
      return next();
    }

    const permissions = req.business?.permissions || {};

    // Cashier allowed permissions
    if (userRole === 'cashier') {
      const cashierAllowed = ['canViewSales', 'canCreateSale', 'canManagePayments', 'canViewProducts'];
      if (!cashierAllowed.includes(permissionName) && !permissions[permissionName]) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_CASHIER_RESTRICTION',
          message: `Cashier role is restricted to sales and payment operations. "${permissionName}" is forbidden.`,
          requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
        });
      }
      return next();
    }

    // Stock Keeper allowed permissions
    if (userRole === 'stock_keeper') {
      const stockKeeperAllowed = ['canManageProducts', 'canViewProducts', 'canManageTransfers', 'canManagePurchases'];
      if (!stockKeeperAllowed.includes(permissionName) && !permissions[permissionName]) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_STOCK_KEEPER_RESTRICTION',
          message: `Stock Keeper role is restricted to inventory operations. "${permissionName}" is forbidden.`,
          requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
        });
      }
      return next();
    }

    // Manager default allowed permissions
    if (userRole === 'manager') {
      const managerRestricted = ['canDeleteStore', 'canTransferOwnership', 'canManageBilling'];
      if (managerRestricted.includes(permissionName) && !permissions[permissionName]) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_MANAGER_RESTRICTION',
          message: `Manager does not have permission "${permissionName}".`,
          requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
        });
      }
      return next();
    }

    // Staff role: strictly requires explicit permission
    if (!permissions[permissionName]) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_PERMISSION',
        message: `Missing required permission: ${permissionName}`,
        requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
      });
    }

    next();
  };
}
