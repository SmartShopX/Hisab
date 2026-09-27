import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Shop, UserRole, UserPermission, AccountBusiness, ActiveAccountMode } from '../types';
import { DataStore } from '../services/dataStorage';
import { authService } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  shop: Shop;
  role: UserRole;
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  switchRole: (newRole: UserRole) => void;
  updateUserPermissions: (permissions: Partial<UserPermission>) => void;
  updateShop: (updates: Partial<Shop>) => void;
  login: (token: string, user: User, shop: Shop) => void;
  logout: () => void;
  hasPermission: (permissionKey: keyof UserPermission) => boolean;
  canAccessFeature: (featureName: string) => boolean;
  isAuthenticated: boolean;
  // Multi-Business & Personal Account Architecture
  activeAccountMode: ActiveAccountMode;
  activeBusinessId: string;
  businesses: AccountBusiness[];
  switchToBusiness: (businessId: string) => void;
  switchToPersonal: () => void;
  createBusiness: (businessData: Partial<Shop>) => AccountBusiness;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => DataStore.getUser());
  const [activeBusinessId, setActiveBusinessIdState] = useState<string>(() => DataStore.getActiveBusinessId());
  const [activeAccountMode, setActiveAccountModeState] = useState<ActiveAccountMode>(() => DataStore.getActiveAccountMode());
  const [businesses, setBusinessesState] = useState<AccountBusiness[]>(() => {
    const b = DataStore.getBusinesses();
    return Array.isArray(b) ? b : [];
  });
  const [shop, setShop] = useState<Shop>(() => DataStore.getShop(DataStore.getActiveBusinessId()));
  const [language, setLanguageState] = useState<'bn' | 'en'>(() => {
    return (localStorage.getItem('smartshopx_lang') as 'bn' | 'en') || 'bn';
  });

  // Listen for storage / custom events across window
  useEffect(() => {
    const handleTenantChanged = (e: any) => {
      const newBid = e.detail?.businessId || DataStore.getActiveBusinessId();
      setActiveBusinessIdState(newBid);
      const currentShop = DataStore.getShop(newBid);
      setShop(currentShop);
      const b = DataStore.getBusinesses();
      setBusinessesState(Array.isArray(b) ? b : []);
    };

    const handleAccountModeChanged = (e: any) => {
      const mode = e.detail?.mode || DataStore.getActiveAccountMode();
      setActiveAccountModeState(mode);
    };

    const handleBusinessesUpdated = (e: any) => {
      const bList = e.detail?.businesses || DataStore.getBusinesses();
      setBusinessesState(Array.isArray(bList) ? bList : []);
    };

    const handleUnauthorized = () => {
      // 401 token expiry handler
      setUser(null);
      DataStore.setUser(null);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartshopx_auth_token' && !e.newValue) {
        setUser(null);
        DataStore.setUser(null);
      } else if (e.key === 'smartshopx_active_business_id' && e.newValue) {
        setActiveBusinessIdState(e.newValue);
        setShop(DataStore.getShop(e.newValue));
      } else if (e.key === 'smartshopx_active_account_mode' && e.newValue) {
        setActiveAccountModeState(e.newValue as ActiveAccountMode);
      }
    };

    window.addEventListener('smartshopx_tenant_changed', handleTenantChanged);
    window.addEventListener('smartshopx_account_mode_changed', handleAccountModeChanged);
    window.addEventListener('smartshopx_businesses_updated', handleBusinessesUpdated);
    window.addEventListener('smartshopx_auth_unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('smartshopx_tenant_changed', handleTenantChanged);
      window.removeEventListener('smartshopx_account_mode_changed', handleAccountModeChanged);
      window.removeEventListener('smartshopx_businesses_updated', handleBusinessesUpdated);
      window.removeEventListener('smartshopx_auth_unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setLanguage = (lang: 'bn' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('smartshopx_lang', lang);
  };

  const switchToBusiness = (businessId: string) => {
    DataStore.setActiveBusinessId(businessId);
    DataStore.setActiveAccountMode('business');
    setActiveBusinessIdState(businessId);
    setActiveAccountModeState('business');
    const targetShop = DataStore.getShop(businessId);
    setShop(targetShop);
    // Mark active in business list
    const currentList = Array.isArray(businesses) ? businesses : DataStore.getBusinesses() || [];
    const updated = currentList.map((b) => ({
      ...b,
      isActive: b.id === businessId,
    }));
    setBusinessesState(updated);
    DataStore.setBusinesses(updated);
  };

  const switchToPersonal = () => {
    DataStore.setActiveAccountMode('personal');
    setActiveAccountModeState('personal');
    const currentList = Array.isArray(businesses) ? businesses : DataStore.getBusinesses() || [];
    const updated = currentList.map((b) => ({
      ...b,
      isActive: false,
    }));
    setBusinessesState(updated);
    DataStore.setBusinesses(updated);
  };

  const createBusiness = (businessData: Partial<Shop>): AccountBusiness => {
    const created = DataStore.addBusiness(businessData);
    switchToBusiness(created.id);
    return created;
  };

  const login = (token: string, loggedUser: User, currentShop: Shop) => {
    localStorage.setItem('smartshopx_auth_token', token);
    setUser(loggedUser);
    setShop(currentShop);
    DataStore.setUser(loggedUser);
    DataStore.setShop(currentShop);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    DataStore.setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;

    let rolePermissions: UserPermission;
    switch (newRole) {
      case 'manager':
        rolePermissions = {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: true,
          canManagePayments: true,
          canManagePurchases: true,
          canManageCourier: true,
          canManageSettings: false,
        };
        break;
      case 'cashier':
        rolePermissions = {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: false,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: false,
          canManagePayments: false,
          canManagePurchases: false,
          canManageCourier: false,
          canManageSettings: false,
        };
        break;
      case 'stock_keeper':
        rolePermissions = {
          canViewSales: false,
          canCreateSale: false,
          canManageProducts: true,
          canManageCustomers: false,
          canManageOrders: false,
          canViewReports: false,
          canManagePayments: false,
          canManagePurchases: true,
          canManageCourier: true,
          canManageSettings: false,
        };
        break;
      case 'staff':
        rolePermissions = {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: false,
          canManagePayments: false,
          canManagePurchases: false,
          canManageCourier: false,
          canManageSettings: false,
        };
        break;
      case 'owner':
      default:
        rolePermissions = {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: true,
          canManagePayments: true,
          canManagePurchases: true,
          canManageCourier: true,
          canManageSettings: true,
        };
        break;
    }

    const updatedUser: User = {
      ...user,
      role: newRole,
      permissions: rolePermissions,
    };
    setUser(updatedUser);
    DataStore.setUser(updatedUser);
  };

  const updateUserPermissions = (permissions: Partial<UserPermission>) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      permissions: {
        ...(user.permissions || {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: true,
          canManagePayments: true,
        }),
        ...permissions,
      },
    };
    setUser(updatedUser);
    DataStore.setUser(updatedUser);
  };

  const updateShop = (updates: Partial<Shop>) => {
    const updated = { ...shop, ...updates };
    setShop(updated);
    DataStore.setShop(updated);
  };

  const hasPermission = (permissionKey: keyof UserPermission): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    return user.permissions ? !!user.permissions[permissionKey] : false;
  };

  const canAccessFeature = (featureName: string): boolean => {
    // 1. Mother Admin feature override check (explicit boolean override per tenant)
    if (shop.featureOverrides && typeof shop.featureOverrides[featureName] === 'boolean') {
      return shop.featureOverrides[featureName];
    }
    if (shop.modules && typeof shop.modules[featureName] === 'boolean') {
      return shop.modules[featureName];
    }

    // 2. Suspended store handling: In suspended status, write/premium capabilities are disabled
    if (shop.subscriptionStatus === 'Suspended' || shop.isSuspended) {
      return false;
    }

    // 3. Central subscription tier matrix
    const plan = (shop.subscriptionPlan || 'Standard').toUpperCase();
    if (plan === 'ENTERPRISE') return true;
    if (plan === 'STANDARD' || plan === 'BUSINESS' || plan === 'PRO') {
      return featureName !== 'advanced_ai_fraud_detector';
    }
    // Basic / Starter plan exclusions
    const basicExclusions = ['landing_page_builder', 'courier_automation', 'sms_marketing_bulk', 'custom_domain'];
    return !basicExclusions.includes(featureName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        role: user?.role || 'owner',
        language,
        setLanguage,
        switchRole,
        updateUserPermissions,
        updateShop,
        login,
        logout,
        hasPermission,
        canAccessFeature,
        isAuthenticated: !!user,
        activeAccountMode,
        activeBusinessId,
        businesses,
        switchToBusiness,
        switchToPersonal,
        createBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
