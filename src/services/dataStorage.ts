import {
  Shop,
  User,
  Product,
  Customer,
  Supplier,
  Order,
  IncompleteOrder,
  Purchase,
  StockMovement,
  PaymentTransaction,
  LandingPage,
  CourierOrder,
  BlockedEntity,
  NotificationSettings,
  FacebookPixelSettings,
  StaffUser,
  CourierApiCredential,
  PaymentGatewayConfig,
  MfsAccountDetail,
  CentralApiSettings,
  AccountBusiness,
  ActiveAccountMode,
  PersonalBudget,
  PersonalDueRecord,
  PersonalSavingsRecord,
  MobileRepairTicket,
  DrivePackOffer,
  TelecomDailyClosing,
  Branch,
  StockTransferRequest,
} from '../types';
import {
  initialShop,
  initialUser,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialOrders,
  initialIncompleteOrders,
  initialPurchases,
  initialStockMovements,
  initialPayments,
  initialLandingPages,
  initialCourierOrders,
  initialBlockedEntities,
  initialNotificationSettings,
  initialFacebookSettings,
  initialBusinesses,
  initialShop2,
  initialShop3,
  initialProductsShop2,
  initialProductsShop3,
} from './mockData';

const STORAGE_KEYS = {
  SHOP: 'smartshopx_shop',
  USER: 'smartshopx_user',
  PRODUCTS: 'smartshopx_products',
  CUSTOMERS: 'smartshopx_customers',
  SUPPLIERS: 'smartshopx_suppliers',
  ORDERS: 'smartshopx_orders',
  INCOMPLETE_ORDERS: 'smartshopx_incomplete_orders',
  PURCHASES: 'smartshopx_purchases',
  STOCK_MOVEMENTS: 'smartshopx_stock_movements',
  PAYMENTS: 'smartshopx_payments',
  LANDING_PAGES: 'smartshopx_landing_pages',
  COURIER_ORDERS: 'smartshopx_courier_orders',
  BLOCKED_ENTITIES: 'smartshopx_blocked_entities',
  NOTIFICATIONS: 'smartshopx_notification_settings',
  FACEBOOK: 'smartshopx_facebook_settings',
  EXPENSES: 'smartshopx_expenses',
  STOCK_LOGS: 'smartshopx_stock_logs',
  SALES: 'smartshopx_sales',
  PERSONAL_TRANSACTIONS: 'smartshopx_personal_transactions',
  TELECOM_TRANSACTIONS: 'smartshopx_telecom_transactions',
  TELECOM_BALANCES: 'smartshopx_telecom_balances',
  TELECOM_REPAIRS: 'smartshopx_telecom_repairs',
  TELECOM_DRIVE_PACKS: 'smartshopx_telecom_drive_packs',
  TELECOM_CLOSINGS: 'smartshopx_telecom_closings',
  RETURNS: 'smartshopx_returns',
  STAFF: 'smartshopx_staff',
  COURIER_CREDENTIALS: 'smartshopx_courier_credentials',
  PAYMENT_GATEWAYS: 'smartshopx_payment_gateways',
  MFS_ACCOUNTS: 'smartshopx_mfs_accounts',
  CENTRAL_API: 'smartshopx_central_api',
  COUPONS: 'smartshopx_coupons',
  REVIEWS: 'smartshopx_product_reviews',
  RESELLERS: 'smartshopx_resellers',
  BRANCHES: 'smartshopx_branches',
  STOCK_TRANSFERS: 'smartshopx_stock_transfers',
};

const initialBranches: Branch[] = [
  {
    id: 'br_main',
    name: 'প্রধান শোরুম (Main Hub)',
    code: 'BR-01',
    isMainBranch: true,
    managerName: 'কবির হোসেন (Owner)',
    phone: '01711-223344',
    email: 'main@sorkarpharmacy.com',
    address: 'দোকান #১২, গ্রাউন্ড ফ্লোর, নিউ মার্কেট',
    city: 'ঢাকা',
    status: 'active',
    openingDate: '2023-01-10',
    targetMonthlySales: 350000,
    currentMonthlySales: 285400,
    todaySales: 14200,
    totalStockQuantity: 12450,
    totalStockValuation: 1850000,
    staffCount: 4,
    createdAt: '2023-01-10T00:00:00.000Z',
  },
  {
    id: 'br_dhanmondi',
    name: 'ধানমন্ডি আউটলেট',
    code: 'BR-02',
    isMainBranch: false,
    managerName: 'আরিফুল ইসলাম',
    phone: '01822-334455',
    email: 'dhanmondi@sorkarpharmacy.com',
    address: 'রোড #২৭ (পুরাতন), ধানমন্ডি',
    city: 'ঢাকা',
    status: 'active',
    openingDate: '2024-03-15',
    targetMonthlySales: 220000,
    currentMonthlySales: 198600,
    todaySales: 9800,
    totalStockQuantity: 6200,
    totalStockValuation: 920000,
    staffCount: 2,
    createdAt: '2024-03-15T00:00:00.000Z',
  },
  {
    id: 'br_uttara',
    name: 'উত্তরা এক্সপ্রেস হাব',
    code: 'BR-03',
    isMainBranch: false,
    managerName: 'মাহমুদুল হাসান',
    phone: '01933-445566',
    email: 'uttara@sorkarpharmacy.com',
    address: 'সেক্টর #৭, রবীন্দ্র সরণি, উত্তরা',
    city: 'ঢাকা',
    status: 'active',
    openingDate: '2024-08-01',
    targetMonthlySales: 180000,
    currentMonthlySales: 142500,
    todaySales: 7400,
    totalStockQuantity: 4100,
    totalStockValuation: 615000,
    staffCount: 2,
    createdAt: '2024-08-01T00:00:00.000Z',
  },
  {
    id: 'br_chittagong',
    name: 'চট্টগ্রাম আগ্রাবাদ শাখা',
    code: 'BR-04',
    isMainBranch: false,
    managerName: 'তারেক মাহমুদ',
    phone: '01644-556677',
    email: 'ctg@sorkarpharmacy.com',
    address: 'আগ্রাবাদ বাণিজ্যিক এলাকা',
    city: 'চট্টগ্রাম',
    status: 'active',
    openingDate: '2025-02-01',
    targetMonthlySales: 150000,
    currentMonthlySales: 89000,
    todaySales: 4500,
    totalStockQuantity: 2850,
    totalStockValuation: 420000,
    staffCount: 2,
    createdAt: '2025-02-01T00:00:00.000Z',
  },
];

const initialStockTransfers: StockTransferRequest[] = [
  {
    id: 'trf_101',
    transferNumber: 'TRF-2026-001',
    sourceBranchId: 'br_main',
    sourceBranchName: 'প্রধান শোরুম (Main Hub)',
    destinationBranchId: 'br_dhanmondi',
    destinationBranchName: 'ধানমন্ডি আউটলেট',
    items: [
      {
        productId: 'prod_1',
        productName: 'Napa Extra 500mg+65mg',
        sku: 'MED-001',
        quantity: 50,
        unitPrice: 3.0,
        unit: 'Pcs',
      },
      {
        productId: 'prod_2',
        productName: 'Seclo 20mg Capsule',
        sku: 'MED-002',
        quantity: 30,
        unitPrice: 7.0,
        unit: 'Strip',
      },
    ],
    totalQuantity: 80,
    totalValue: 360,
    status: 'in_transit',
    transferDate: '2026-09-22',
    initiatedBy: 'কবির হোসেন',
    transportVehicle: 'দোকানের ডেলিভারি বাইক (ঢাকা মেট্রো-হ ১১-২২৩৩)',
    trackingNumber: 'TRK-DH-8821',
    notes: 'জরুরি প্রেসক্রিপশন স্টকের জন্য পাঠানো হলো।',
    createdAt: '2026-09-22T10:30:00.000Z',
  },
  {
    id: 'trf_102',
    transferNumber: 'TRF-2026-002',
    sourceBranchId: 'br_main',
    sourceBranchName: 'প্রধান শোরুম (Main Hub)',
    destinationBranchId: 'br_uttara',
    destinationBranchName: 'উত্তরা এক্সপ্রেস হাব',
    items: [
      {
        productId: 'prod_3',
        productName: 'Sergel 20mg Tablet',
        sku: 'MED-003',
        quantity: 40,
        unitPrice: 8.0,
        unit: 'Strip',
      },
    ],
    totalQuantity: 40,
    totalValue: 320,
    status: 'received',
    transferDate: '2026-09-20',
    receivedDate: '2026-09-20',
    initiatedBy: 'কবির হোসেন',
    receivedBy: 'মাহমুদুল হাসান',
    transportVehicle: 'সুন্দরবন কুরিয়ার',
    trackingNumber: 'SBD-99120',
    notes: 'উত্তরা শাখার স্টক রিস্টকিং সম্পন্ন।',
    createdAt: '2026-09-20T09:00:00.000Z',
  },
];

const initialCoupons: any[] = [
  {
    id: 'coup_1',
    code: 'DARAZ20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscount: 500,
    expiryDate: '2026-12-31',
    isActive: true,
    usageCount: 42,
    description: 'দারাজ মেগা মেলা ২০% ছাড় (সর্বনিম্ন ৳১,০০০ অর্ডার)',
  },
  {
    id: 'coup_2',
    code: 'EID50',
    discountType: 'fixed',
    discountValue: 150,
    minOrderAmount: 800,
    expiryDate: '2026-12-31',
    isActive: true,
    usageCount: 88,
    description: 'ঈদ ধামাকা অফার: ফ্ল্যাট ৳১৫০ ছাড়',
  },
  {
    id: 'coup_3',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 60,
    minOrderAmount: 500,
    expiryDate: '2026-12-31',
    isActive: true,
    usageCount: 156,
    description: 'ফ্রি হোম ডেলিভারি ডিসকাউন্ট (৳৬০ ছাড়)',
  },
];

const initialReviews: any[] = [
  {
    id: 'rev_1',
    productId: 'prod_101',
    shopId: 'shop_101',
    customerName: 'তানভীর আহমেদ',
    customerMobile: '01712345678',
    rating: 5,
    comment: 'একদম অরিজিনাল প্রডাক্ট! যেমন ছবিতে দেখেছি ঠিক তেমনই পেয়েছি। মাত্র ২ দিনে ডেলিভারি পেয়েছি।',
    photoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60',
    isVerifiedBuyer: true,
    createdAt: '2026-09-18T10:30:00.000Z',
    likesCount: 14,
  },
  {
    id: 'rev_2',
    productId: 'prod_101',
    shopId: 'shop_101',
    customerName: 'নুসরাত জাহান',
    customerMobile: '01898765432',
    rating: 5,
    comment: 'খুবই চমৎকার প্যাকেজিং ছিল এবং প্রডাক্ট কোয়ালিটি ১০০% খাঁটি। সেলার অনেক আন্তরিক।',
    isVerifiedBuyer: true,
    createdAt: '2026-09-19T14:15:00.000Z',
    likesCount: 8,
  },
  {
    id: 'rev_3',
    productId: 'prod_102',
    shopId: 'shop_101',
    customerName: 'মেহেদী হাসান',
    customerMobile: '01911223344',
    rating: 4,
    comment: 'কোয়ালিটি অসাধারণ, প্রাইস অনুযায়ী সেরা ডিল!',
    isVerifiedBuyer: true,
    createdAt: '2026-09-20T11:00:00.000Z',
    likesCount: 5,
  },
];

const initialResellers: any[] = [
  {
    id: 'res_1',
    name: 'রাকিবুল হাসান (অনলাইন উদ্যোক্তা)',
    mobile: '01711223344',
    bkashNumber: '01711223344',
    referralCode: 'RAKIB10',
    commissionPercent: 10,
    totalOrders: 24,
    totalSalesAmount: 38500,
    totalCommissionEarned: 3850,
    paidCommission: 2500,
    pendingCommission: 1350,
    status: 'active',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'res_2',
    name: 'ফারহানা ইয়াসমিন (এফ-কমার্স গ্রুপ)',
    mobile: '01822334455',
    bkashNumber: '01822334455',
    referralCode: 'FARHANA15',
    commissionPercent: 12,
    totalOrders: 18,
    totalSalesAmount: 29400,
    totalCommissionEarned: 3528,
    paidCommission: 2000,
    pendingCommission: 1528,
    status: 'active',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
];

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to persist to localStorage', e);
  }
}

function getActiveBid(): string {
  try {
    const stored = localStorage.getItem('smartshopx_active_business_id');
    if (stored) return stored;
  } catch {}
  return initialShop.id || 'shop_101';
}

function getStoredTenantItem<T>(baseKey: string, legacyKey: string, fallback: T, businessId?: string): T {
  try {
    const bid = businessId || getActiveBid();
    const tenantKey = `smartshopx_business_${bid}_${baseKey}`;
    const data = localStorage.getItem(tenantKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed !== null && parsed !== undefined) {
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed as T;
      }
    }

    // Backward compatibility fallback for default shop (shop_101 or initialShop.id)
    if (bid === initialShop.id || bid === 'shop_101') {
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        if (parsed !== null && parsed !== undefined) {
          if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
          localStorage.setItem(tenantKey, legacyData);
          return parsed as T;
        }
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function setStoredTenantItem<T>(baseKey: string, legacyKey: string, value: T, businessId?: string): void {
  try {
    const bid = businessId || getActiveBid();
    const tenantKey = `smartshopx_business_${bid}_${baseKey}`;
    localStorage.setItem(tenantKey, JSON.stringify(value));
    if (bid === initialShop.id || bid === 'shop_101') {
      localStorage.setItem(legacyKey, JSON.stringify(value));
    }
  } catch (e) {
    console.error('Failed to persist tenant item', e);
  }
}

export const DataStore = {
  // Multi-Business & Tenant Isolation API
  getActiveBusinessId: (): string => getActiveBid(),

  setActiveBusinessId: (id: string): void => {
    try {
      localStorage.setItem('smartshopx_active_business_id', id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartshopx_tenant_changed', { detail: { businessId: id } }));
      }
    } catch (e) {
      console.error('Failed to set active business ID', e);
    }
  },

  getActiveAccountMode: (): ActiveAccountMode => {
    try {
      const mode = localStorage.getItem('smartshopx_active_account_mode');
      if (mode === 'personal' || mode === 'business') return mode;
    } catch {}
    return 'business';
  },

  setActiveAccountMode: (mode: ActiveAccountMode): void => {
    try {
      localStorage.setItem('smartshopx_active_account_mode', mode);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smartshopx_account_mode_changed', { detail: { mode } }));
      }
    } catch (e) {
      console.error('Failed to set active account mode', e);
    }
  },

  getBusinesses: (): AccountBusiness[] => {
    const res = getStoredItem<AccountBusiness[]>('smartshopx_account_businesses', initialBusinesses);
    return Array.isArray(res) && res.length > 0 ? res : initialBusinesses;
  },

  setBusinesses: (businesses: AccountBusiness[]): void => {
    setStoredItem('smartshopx_account_businesses', businesses);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_businesses_updated', { detail: { businesses } }));
    }
  },

  addBusiness: (newShop: Partial<Shop>): AccountBusiness => {
    const currentBusinesses = DataStore.getBusinesses();
    const id = newShop.id || `shop_${Date.now()}`;
    const slug = newShop.storeSlug || newShop.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `store-${id}`;

    const accountBiz: AccountBusiness = {
      id,
      name: newShop.name || 'নতুন ব্যবসা',
      category: newShop.category || 'General & Trading',
      businessType: newShop.businessType || 'Retail Store',
      businessModel: newShop.businessModel || 'Retail',
      template: newShop.template || 'Standard Retail',
      role: 'owner',
      isActive: false,
      storeSlug: slug,
      plan: (newShop.subscriptionPlan as any) || 'STARTER',
    };

    const fullShop: Shop = {
      id,
      name: newShop.name || 'নতুন ব্যবসা',
      ownerName: newShop.ownerName || 'তানভীর আহমেদ',
      mobile: newShop.mobile || '01711002233',
      email: newShop.email,
      address: newShop.address || 'ঢাকা, বাংলাদেশ',
      category: newShop.category || 'General & Trading',
      customCategory: newShop.customCategory,
      currency: newShop.currency || 'BDT',
      subscriptionPlan: newShop.subscriptionPlan || 'Standard',
      subscriptionStatus: 'Active',
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionExpiry: '2026-12-31',
      storeSlug: slug,
      storePublished: false,
      deliveryChargeInside: newShop.deliveryChargeInside ?? 60,
      deliveryChargeOutside: newShop.deliveryChargeOutside ?? 120,
      businessType: newShop.businessType,
      businessModel: newShop.businessModel,
      template: newShop.template,
      modules: newShop.modules,
    };

    // Store isolated shop entity and initialize empty datasets for this tenant
    DataStore.setShop(fullShop, id);
    DataStore.setProducts([], id);
    DataStore.setOrders([], id);
    DataStore.setSales([], id);

    const updated = [...currentBusinesses, accountBiz];
    DataStore.setBusinesses(updated);
    return accountBiz;
  },

  // Tenant-aware entity operations
  getShop: (businessId?: string): Shop => {
    const bid = businessId || getActiveBid();
    let fallback = initialShop;
    if (bid === 'shop_102') fallback = initialShop2;
    if (bid === 'shop_103') fallback = initialShop3;
    return getStoredTenantItem('shop', STORAGE_KEYS.SHOP, fallback, bid);
  },
  setShop: (shop: Shop, businessId?: string): void => {
    const bid = businessId || shop.id || getActiveBid();
    setStoredTenantItem('shop', STORAGE_KEYS.SHOP, shop, bid);
    const businesses = DataStore.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === bid);
    if (idx !== -1) {
      businesses[idx] = {
        ...businesses[idx],
        name: shop.name,
        category: shop.category,
        storeSlug: shop.storeSlug,
        plan: shop.subscriptionPlan,
      };
      DataStore.setBusinesses(businesses);
    }
  },

  getUser: (): User | null => getStoredItem<User | null>(STORAGE_KEYS.USER, initialUser),
  setUser: (user: User | null): void => setStoredItem(STORAGE_KEYS.USER, user),

  getProducts: (businessId?: string): Product[] => {
    const bid = businessId || getActiveBid();
    let fallback = initialProducts;
    if (bid === 'shop_102') fallback = initialProductsShop2;
    if (bid === 'shop_103') fallback = initialProductsShop3;
    let items = getStoredTenantItem('products', STORAGE_KEYS.PRODUCTS, fallback, bid);

    if (Array.isArray(items)) {
      const pharmacySeeds = initialProducts.filter((p) => p.category === 'Pharmacy & Medicine');
      const existingIds = new Set(items.map((p) => p.id));
      const missingPharmacy = pharmacySeeds.filter((p) => !existingIds.has(p.id));

      let modified = false;
      let updatedItems = items.map((p) => {
        // Enforce user requirement: default zero stock for pharmacy catalog before inward
        if (p.category === 'Pharmacy & Medicine' && p.id.startsWith('med_')) {
          if (p.stock > 0 && [240, 350, 140, 80, 60, 120].includes(p.stock)) {
            modified = true;
            return { ...p, stock: 0 };
          }
        }
        return p;
      });

      if (missingPharmacy.length > 0) {
        updatedItems = [...updatedItems, ...missingPharmacy];
        modified = true;
      }

      if (modified) {
        setStoredTenantItem('products', STORAGE_KEYS.PRODUCTS, updatedItems, bid);
        return updatedItems;
      }
      return items;
    }
    return Array.isArray(items) ? items : fallback;
  },
  syncPharmacyZeroStockCatalog: (businessId?: string): Product[] => {
    const bid = businessId || getActiveBid();
    const current = DataStore.getProducts(bid);
    const pharmacySeeds = initialProducts.filter((p) => p.category === 'Pharmacy & Medicine');
    const nonPharmacy = current.filter((p) => p.category !== 'Pharmacy & Medicine');
    const existingPharmacyMap = new Map(
      current.filter((p) => p.category === 'Pharmacy & Medicine').map((p) => [p.id, p])
    );

    const mergedPharmacy = pharmacySeeds.map((seed) => {
      const existing = existingPharmacyMap.get(seed.id);
      if (existing) {
        return {
          ...seed,
          ...existing,
          // Keep whatever stock they updated, but if old mock stock, set to 0
          stock: [240, 350, 140, 80, 60, 120].includes(existing.stock) ? 0 : existing.stock,
        };
      }
      return { ...seed, stock: 0 };
    });

    const customPharmacy = current.filter(
      (p) => p.category === 'Pharmacy & Medicine' && !pharmacySeeds.some((s) => s.id === p.id)
    );

    const all = [...nonPharmacy, ...mergedPharmacy, ...customPharmacy];
    DataStore.setProducts(all, bid);
    return all;
  },
  setProducts: (items: Product[], businessId?: string): void => {
    setStoredTenantItem('products', STORAGE_KEYS.PRODUCTS, items, businessId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_products_updated', { detail: { products: items } }));
    }
  },

  getCustomers: (businessId?: string): Customer[] =>
    getStoredTenantItem('customers', STORAGE_KEYS.CUSTOMERS, initialCustomers, businessId),
  setCustomers: (items: Customer[], businessId?: string): void =>
    setStoredTenantItem('customers', STORAGE_KEYS.CUSTOMERS, items, businessId),

  getSuppliers: (businessId?: string): Supplier[] =>
    getStoredTenantItem('suppliers', STORAGE_KEYS.SUPPLIERS, initialSuppliers, businessId),
  setSuppliers: (items: Supplier[], businessId?: string): void =>
    setStoredTenantItem('suppliers', STORAGE_KEYS.SUPPLIERS, items, businessId),

  getOrders: (businessId?: string): Order[] => {
    const bid = businessId || getActiveBid();
    const fallback = (bid === 'shop_102' || bid === 'shop_103') ? [] : initialOrders;
    return getStoredTenantItem('orders', STORAGE_KEYS.ORDERS, fallback, bid);
  },
  setOrders: (items: Order[], businessId?: string): void =>
    setStoredTenantItem('orders', STORAGE_KEYS.ORDERS, items, businessId),

  getIncompleteOrders: (businessId?: string): IncompleteOrder[] =>
    getStoredTenantItem('incomplete_orders', STORAGE_KEYS.INCOMPLETE_ORDERS, initialIncompleteOrders, businessId),
  setIncompleteOrders: (items: IncompleteOrder[], businessId?: string): void =>
    setStoredTenantItem('incomplete_orders', STORAGE_KEYS.INCOMPLETE_ORDERS, items, businessId),

  getPurchases: (businessId?: string): Purchase[] =>
    getStoredTenantItem('purchases', STORAGE_KEYS.PURCHASES, initialPurchases, businessId),
  setPurchases: (items: Purchase[], businessId?: string): void =>
    setStoredTenantItem('purchases', STORAGE_KEYS.PURCHASES, items, businessId),

  getStockMovements: (businessId?: string): StockMovement[] =>
    getStoredTenantItem('stock_movements', STORAGE_KEYS.STOCK_MOVEMENTS, initialStockMovements, businessId),
  setStockMovements: (items: StockMovement[], businessId?: string): void =>
    setStoredTenantItem('stock_movements', STORAGE_KEYS.STOCK_MOVEMENTS, items, businessId),

  getPayments: (businessId?: string): PaymentTransaction[] =>
    getStoredTenantItem('payments', STORAGE_KEYS.PAYMENTS, initialPayments, businessId),
  setPayments: (items: PaymentTransaction[], businessId?: string): void =>
    setStoredTenantItem('payments', STORAGE_KEYS.PAYMENTS, items, businessId),

  getLandingPages: (businessId?: string): LandingPage[] =>
    getStoredTenantItem('landing_pages', STORAGE_KEYS.LANDING_PAGES, initialLandingPages, businessId),
  setLandingPages: (items: LandingPage[], businessId?: string): void =>
    setStoredTenantItem('landing_pages', STORAGE_KEYS.LANDING_PAGES, items, businessId),

  getCourierOrders: (businessId?: string): CourierOrder[] =>
    getStoredTenantItem('courier_orders', STORAGE_KEYS.COURIER_ORDERS, initialCourierOrders, businessId),
  setCourierOrders: (items: CourierOrder[], businessId?: string): void =>
    setStoredTenantItem('courier_orders', STORAGE_KEYS.COURIER_ORDERS, items, businessId),

  getBlockedEntities: (businessId?: string): BlockedEntity[] =>
    getStoredTenantItem('blocked_entities', STORAGE_KEYS.BLOCKED_ENTITIES, initialBlockedEntities, businessId),
  setBlockedEntities: (items: BlockedEntity[], businessId?: string): void =>
    setStoredTenantItem('blocked_entities', STORAGE_KEYS.BLOCKED_ENTITIES, items, businessId),

  getNotificationSettings: (businessId?: string): NotificationSettings =>
    getStoredTenantItem('notifications', STORAGE_KEYS.NOTIFICATIONS, initialNotificationSettings, businessId),
  setNotificationSettings: (settings: NotificationSettings, businessId?: string): void =>
    setStoredTenantItem('notifications', STORAGE_KEYS.NOTIFICATIONS, settings, businessId),

  getFacebookSettings: (businessId?: string): FacebookPixelSettings =>
    getStoredTenantItem('facebook', STORAGE_KEYS.FACEBOOK, initialFacebookSettings, businessId),
  setFacebookSettings: (settings: FacebookPixelSettings, businessId?: string): void =>
    setStoredTenantItem('facebook', STORAGE_KEYS.FACEBOOK, settings, businessId),

  getExpenses: (businessId?: string): any[] =>
    getStoredTenantItem('expenses', STORAGE_KEYS.EXPENSES, [
      {
        id: 'exp_1',
        title: 'দোকান ভাড়া (চলতি মাস)',
        category: 'Rent',
        amount: 15000,
        date: new Date().toISOString().split('T')[0],
        notes: 'মাসিক শপ রেন্ট',
      },
      {
        id: 'exp_2',
        title: 'ডেসকো বিদ্যুৎ বিল',
        category: 'Utility',
        amount: 2800,
        date: new Date().toISOString().split('T')[0],
        notes: 'মিটার রিডিং অনুযায়ী',
      },
    ], businessId),
  setExpenses: (items: any[], businessId?: string): void =>
    setStoredTenantItem('expenses', STORAGE_KEYS.EXPENSES, items, businessId),

  getStockLogs: (businessId?: string): any[] =>
    getStoredTenantItem('stock_logs', STORAGE_KEYS.STOCK_LOGS, [
      {
        id: 'log_1',
        productId: 'prod_1',
        productName: 'Samsung Galaxy A15 (6/128GB)',
        type: 'Stock In',
        quantity: 10,
        previousStock: 5,
        newStock: 15,
        reason: 'নতুন চালান রিসিভড',
        createdAt: new Date().toISOString(),
      },
    ], businessId),
  setStockLogs: (items: any[], businessId?: string): void =>
    setStoredTenantItem('stock_logs', STORAGE_KEYS.STOCK_LOGS, items, businessId),

  getSales: (businessId?: string): any[] => {
    try {
      const orders = getStoredTenantItem('orders', STORAGE_KEYS.ORDERS, initialOrders, businessId);
      const ordersList = Array.isArray(orders) ? orders : [];
      const fallbackSales = ordersList.filter(
        (o) => o && (o.orderStatus === 'Delivered' || o.channel === 'POS')
      );
      const sales = getStoredTenantItem('sales', STORAGE_KEYS.SALES, fallbackSales, businessId);
      return Array.isArray(sales) ? sales : fallbackSales;
    } catch {
      return [];
    }
  },
  setSales: (items: any[], businessId?: string): void =>
    setStoredTenantItem('sales', STORAGE_KEYS.SALES, items, businessId),

  // Personal Web Storage (Isolated from Business)
  getPersonalTransactions: (): any[] =>
    getStoredItem(STORAGE_KEYS.PERSONAL_TRANSACTIONS, [
      {
        id: 'pt_1',
        title: 'ব্যবসা থেকে লভ্যাংশ উত্তোলন',
        type: 'INCOME',
        category: 'Business Dividend',
        amount: 35000,
        wallet: 'Bank',
        date: new Date().toISOString().split('T')[0],
        notes: 'মাসিক ব্যক্তিগত উত্তোলন',
      },
      {
        id: 'pt_2',
        title: 'বাসার বাজার খরচ',
        type: 'EXPENSE',
        category: 'Family Groceries',
        amount: 6500,
        wallet: 'Cash',
        date: new Date().toISOString().split('T')[0],
        notes: 'সাপ্তাহিক বাজার',
      },
      {
        id: 'pt_3',
        title: 'বাচ্চার স্কুলের টিউশন ফি',
        type: 'EXPENSE',
        category: 'Education',
        amount: 4000,
        wallet: 'bKash',
        date: new Date().toISOString().split('T')[0],
        notes: 'মার্চ মাসের বেতন',
      },
    ]),
  setPersonalTransactions: (items: any[]): void =>
    setStoredItem(STORAGE_KEYS.PERSONAL_TRANSACTIONS, items),

  getPersonalBudgets: (): PersonalBudget[] =>
    getStoredItem<PersonalBudget[]>('smartshopx_personal_budgets', [
      {
        id: 'pb_1',
        category: 'Family Groceries',
        budgetAmount: 25000,
        month: new Date().toISOString().slice(0, 7),
        notes: 'মাসিক বাজার ও নিত্যপ্রয়োজনীয় বাজেট',
      },
      {
        id: 'pb_2',
        category: 'Education',
        budgetAmount: 12000,
        month: new Date().toISOString().slice(0, 7),
        notes: 'সন্তানের স্কুল ও কোচিং ফি',
      },
      {
        id: 'pb_3',
        category: 'Utility Bills',
        budgetAmount: 6000,
        month: new Date().toISOString().slice(0, 7),
        notes: 'বিদ্যুৎ, গ্যাস, ইন্টারনেট ও পানির বিল',
      },
    ]),
  setPersonalBudgets: (items: PersonalBudget[]): void =>
    setStoredItem('smartshopx_personal_budgets', items),

  getPersonalDues: (): PersonalDueRecord[] =>
    getStoredItem<PersonalDueRecord[]>('smartshopx_personal_dues', [
      {
        id: 'pd_1',
        personName: 'রফিক সাহেব (বন্ধু)',
        personMobile: '01811223344',
        type: 'RECEIVABLE',
        amount: 15000,
        paidAmount: 5000,
        date: '2026-02-15',
        dueDate: '2026-03-25',
        status: 'Partial',
        note: 'জরুরি প্রয়োজনে ধার নিয়েছিলেন',
        paymentHistory: [
          { id: 'pay_1', amount: 5000, date: '2026-03-01', note: 'বিকাশে ফেরত দিয়েছেন' },
        ],
      },
      {
        id: 'pd_2',
        personName: 'কামাল ভাই (আত্মীয়)',
        personMobile: '01911998877',
        type: 'PAYABLE',
        amount: 8000,
        paidAmount: 0,
        date: '2026-02-28',
        dueDate: '2026-03-31',
        status: 'Pending',
        note: 'চিকিৎসা খরচে সহযোগিতা নিয়েছিলাম',
        paymentHistory: [],
      },
    ]),
  setPersonalDues: (items: PersonalDueRecord[]): void =>
    setStoredItem('smartshopx_personal_dues', items),

  getPersonalSavings: (): PersonalSavingsRecord[] =>
    getStoredItem<PersonalSavingsRecord[]>('smartshopx_personal_savings', [
      {
        id: 'ps_1',
        title: '৫ বছর মেয়াদি মিলিওনিয়ার ডিপিএস',
        institution: 'ইসলামী ব্যাংক বাংলাদেশ লি.',
        accountNumber: '2050123456789',
        type: 'DPS',
        monthlyInstallment: 5000,
        installmentDay: 10,
        totalDeposited: 85000,
        targetAmount: 380000,
        startDate: '2025-01-10',
        maturityDate: '2030-01-10',
        status: 'Active',
        lastPaidMonth: '2026-08',
        notes: 'প্রতি মাসের ১০ তারিখের মধ্যে কিস্তি পরিশোধ বাধ্যতামূলক',
      },
      {
        id: 'ps_2',
        title: '৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র',
        institution: 'জাতীয় সঞ্চয় অধিদপ্তর / সোনালী ব্যাংক',
        accountNumber: 'SP-9923841',
        type: 'Sanchayapatra',
        monthlyInstallment: 0,
        totalDeposited: 200000,
        targetAmount: 200000,
        startDate: '2025-06-15',
        maturityDate: '2028-06-15',
        status: 'Active',
        notes: 'ত্রৈমাসিক মুনাফা ব্যাংক অ্যাকাউন্টে জমা হয়',
      },
      {
        id: 'ps_3',
        title: 'জরুরি পারিবারিক ইমার্জেন্সি ফান্ড',
        institution: 'ব্র্যাক ব্যাংক (সেভিংস অ্যাকাউন্ট)',
        accountNumber: '1501204899200',
        type: 'EmergencyFund',
        monthlyInstallment: 3000,
        installmentDay: 5,
        totalDeposited: 60000,
        targetAmount: 150000,
        startDate: '2025-03-01',
        status: 'Active',
        lastPaidMonth: '2026-09',
        notes: 'মেডিকেল বা পারিবারিক জরুরি প্রয়োজনে ব্যবহারের জন্য',
      },
    ]),
  setPersonalSavings: (items: PersonalSavingsRecord[]): void =>
    setStoredItem('smartshopx_personal_savings', items),


  getPersonalSettings: (): any =>
    getStoredItem('smartshopx_personal_settings', {
      currency: 'BDT',
      language: 'bn',
      notifyOnDueReminder: true,
      notifyOnBudgetAlert: true,
      budgetAlertThresholdPercent: 85,
    }),
  setPersonalSettings: (settings: any): void =>
    setStoredItem('smartshopx_personal_settings', settings),

  getTelecomTransactions: (businessId?: string): any[] =>
    getStoredTenantItem(STORAGE_KEYS.TELECOM_TRANSACTIONS, STORAGE_KEYS.TELECOM_TRANSACTIONS, [
      {
        id: 'tt_1',
        type: 'RECHARGE',
        provider: 'Grameenphone',
        recipientNumber: '01712345678',
        amount: 100,
        commission: 2.7,
        status: 'Success',
        transactionId: 'TRX-GP-9841',
        notes: 'মিনিট প্যাক রিচার্জ',
        date: new Date().toISOString(),
      },
      {
        id: 'tt_2',
        type: 'MFS_CASH_IN',
        provider: 'bKash',
        recipientNumber: '01888990011',
        amount: 1500,
        commission: 6.15,
        status: 'Success',
        transactionId: 'BKASH-991203',
        notes: 'গ্রাহক ক্যাশ ইন',
        date: new Date().toISOString(),
      },
      {
        id: 'tt_3',
        type: 'SIM_SALE',
        provider: 'Banglalink',
        recipientNumber: '01923456789',
        amount: 250,
        commission: 45,
        status: 'Success',
        transactionId: 'SIM-BL-4421',
        notes: 'বায়োমেট্রিক সিম বিক্রি',
        date: new Date().toISOString(),
      },
    ], businessId),
  setTelecomTransactions: (items: any[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.TELECOM_TRANSACTIONS, STORAGE_KEYS.TELECOM_TRANSACTIONS, items, businessId),

  getTelecomBalances: (businessId?: string): any[] =>
    getStoredTenantItem(STORAGE_KEYS.TELECOM_BALANCES, STORAGE_KEYS.TELECOM_BALANCES, [
      {
        id: 'tb_1',
        provider: 'Grameenphone Easyload',
        category: 'RECHARGE',
        balance: 4850,
        simNumber: '01700112233',
        lastUpdated: '২০২৬-০৩-০৯',
      },
      {
        id: 'tb_2',
        provider: 'Banglalink i-TopUp',
        category: 'RECHARGE',
        balance: 3200,
        simNumber: '01900112233',
        lastUpdated: '২০২৬-০৩-০৯',
      },
      {
        id: 'tb_3',
        provider: 'Robi / Airtel Load',
        category: 'RECHARGE',
        balance: 5100,
        simNumber: '01800112233',
        lastUpdated: '২০২৬-০৩-০৯',
      },
      {
        id: 'tb_4',
        provider: 'bKash Agent Wallet',
        category: 'MFS',
        balance: 34500,
        simNumber: '01711224455',
        lastUpdated: '২০২৬-০৩-০৯',
      },
      {
        id: 'tb_5',
        provider: 'Nagad Uddokta Wallet',
        category: 'MFS',
        balance: 21800,
        simNumber: '01611224455',
        lastUpdated: '২০২৬-০৩-০৯',
      },
    ], businessId),
  setTelecomBalances: (items: any[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.TELECOM_BALANCES, STORAGE_KEYS.TELECOM_BALANCES, items, businessId),

  getMobileRepairTickets: (businessId?: string): MobileRepairTicket[] =>
    getStoredTenantItem(STORAGE_KEYS.TELECOM_REPAIRS, STORAGE_KEYS.TELECOM_REPAIRS, [
      {
        id: 'srv_1',
        ticketNumber: 'JOB-2609-01',
        customerName: 'তানভীর আহমেদ',
        customerMobile: '01719887766',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy A52',
        imeiOrSerial: '358920112938471',
        issueDescription: 'ডিসপ্লে ভেঙে গেছে ও টাচ কাজ করে না (Original OLED ফিটিং প্রয়োজন)',
        securityLock: 'Pattern: L-shape',
        estimatedCost: 3800,
        advancePaid: 1000,
        partsCost: 2600,
        serviceCharge: 1200,
        status: 'In Repair',
        receivedDate: '2026-09-12',
        expectedDeliveryDate: '2026-09-15',
        technicianName: 'ওস্তাদ মোবারক',
        warrantyDays: 30,
        notes: 'গ্রাহককে ৩টা নাগাদ কল দিয়ে ডেলিভারি জানাতে হবে',
      },
      {
        id: 'srv_2',
        ticketNumber: 'JOB-2609-02',
        customerName: 'সুমাইয়া আক্তার',
        customerMobile: '01823344556',
        deviceBrand: 'Xiaomi',
        deviceModel: 'Redmi Note 10 Pro',
        issueDescription: 'চার্জিং পোর্ট লুজ ও চার্জ স্লো হয় (Type-C Ribbon Change)',
        securityLock: 'PIN: 2580',
        estimatedCost: 850,
        advancePaid: 500,
        partsCost: 350,
        serviceCharge: 500,
        status: 'Ready',
        receivedDate: '2026-09-13',
        expectedDeliveryDate: '2026-09-14',
        technicianName: 'মোবারক',
        warrantyDays: 15,
        notes: 'কাজ কমপ্লিট, কাস্টমারকে এসএমএস দেওয়া হয়েছে',
      },
      {
        id: 'srv_3',
        ticketNumber: 'JOB-2609-03',
        customerName: 'মোঃ রাশেদ চৌধুরী',
        customerMobile: '01912998877',
        deviceBrand: 'Vivo',
        deviceModel: 'Vivo Y20',
        issueDescription: 'ব্যাটারি ফুলে গেছে ও দ্রুত ড্রেইন হয় (New 5000mAh Battery)',
        securityLock: 'No Lock',
        estimatedCost: 1400,
        advancePaid: 1400,
        partsCost: 850,
        serviceCharge: 550,
        status: 'Delivered',
        receivedDate: '2026-09-10',
        deliveredDate: '2026-09-11',
        technicianName: 'মোবারক',
        warrantyDays: 90,
        notes: 'ফুল পেমেন্ট ক্লিয়ার ও ডেলিভারি সম্পন্ন',
      },
    ], businessId),
  setMobileRepairTickets: (items: MobileRepairTicket[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.TELECOM_REPAIRS, STORAGE_KEYS.TELECOM_REPAIRS, items, businessId),

  getDrivePacks: (businessId?: string): DrivePackOffer[] =>
    getStoredTenantItem(STORAGE_KEYS.TELECOM_DRIVE_PACKS, STORAGE_KEYS.TELECOM_DRIVE_PACKS, [
      {
        id: 'dp_1',
        operator: 'Grameenphone',
        title: '৫০ জিবি ইন্টারনেট + ৮০০ মিনিট অল-নেটওয়ার্ক',
        regularPrice: 698,
        cashbackCommission: 85,
        customerOfferPrice: 650,
        type: 'COMBO',
        validity: '৩০ দিন',
        description: 'সারাদেশে প্রযোজ্য মেগা ধামাকা প্যাক, হাউস কমিশন ৳৮৫',
      },
      {
        id: 'dp_2',
        operator: 'Banglalink',
        title: '৪০ জিবি ইন্টারনেট + ৭০০ মিনিট কম্বো',
        regularPrice: 599,
        cashbackCommission: 80,
        customerOfferPrice: 550,
        type: 'COMBO',
        validity: '৩০ দিন',
        description: 'বাংলালিংক অল-নেটওয়ার্ক সুপার ড্রাইভ',
      },
      {
        id: 'dp_3',
        operator: 'Robi',
        title: '৬০ জিবি ইন্টারনেট মেগা প্যাক',
        regularPrice: 649,
        cashbackCommission: 90,
        customerOfferPrice: 590,
        type: 'INTERNET',
        validity: '৩০ দিন',
        description: 'রবি নো-লিমিট ইন্টারনেট ড্রাইভ',
      },
      {
        id: 'dp_4',
        operator: 'Airtel',
        title: '১০০০ মিনিট অল-নেটওয়ার্ক টকটাইম',
        regularPrice: 607,
        cashbackCommission: 75,
        customerOfferPrice: 560,
        type: 'MINUTES',
        validity: '৩০ দিন',
        description: 'এয়ারটেল স্পেশাল মিনিট ড্রাইভ',
      },
      {
        id: 'dp_5',
        operator: 'Teletalk',
        title: '২৫ জিবি ইন্টারনেট সাশ্রয়ী প্যাক',
        regularPrice: 349,
        cashbackCommission: 45,
        customerOfferPrice: 320,
        type: 'INTERNET',
        validity: '৩০ দিন',
        description: 'টেলিটক জেন-জি স্পেশাল প্যাক',
      },
    ], businessId),
  setDrivePacks: (items: DrivePackOffer[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.TELECOM_DRIVE_PACKS, STORAGE_KEYS.TELECOM_DRIVE_PACKS, items, businessId),

  getTelecomClosings: (businessId?: string): TelecomDailyClosing[] =>
    getStoredTenantItem(STORAGE_KEYS.TELECOM_CLOSINGS, STORAGE_KEYS.TELECOM_CLOSINGS, [
      {
        id: 'tc_1',
        date: '2026-09-13',
        simBalances: [
          { provider: 'Grameenphone Easyload', category: 'RECHARGE', simNumber: '01700112233', closingBalance: 4850 },
          { provider: 'Banglalink i-TopUp', category: 'RECHARGE', simNumber: '01900112233', closingBalance: 3200 },
          { provider: 'Robi / Airtel Load', category: 'RECHARGE', simNumber: '01800112233', closingBalance: 5100 },
          { provider: 'bKash Agent Wallet', category: 'MFS', simNumber: '01711224455', closingBalance: 34500 },
          { provider: 'Nagad Uddokta Wallet', category: 'MFS', simNumber: '01611224455', closingBalance: 21800 },
        ],
        cashInDrawer: 18450,
        totalFloat: 69450,
        totalClosingAssets: 87900,
        notes: 'দিন শেষে কোনো শর্ট পাওয়া যায়নি, সব ব্যালেন্স মিলেছে',
        createdAt: '2026-09-13T22:30:00Z',
      },
    ], businessId),
  setTelecomClosings: (items: TelecomDailyClosing[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.TELECOM_CLOSINGS, STORAGE_KEYS.TELECOM_CLOSINGS, items, businessId),

  getReturns: (businessId?: string): any[] =>
    getStoredTenantItem(STORAGE_KEYS.RETURNS, STORAGE_KEYS.RETURNS, [
      {
        id: 'ret_1',
        returnNumber: 'RET-260309-01',
        invoiceNumber: 'SX-260308-01',
        customerName: 'কামরুল ইসলাম রনি',
        customerMobile: '01911223344',
        type: 'Exchange',
        channel: 'POS_Store',
        condition: 'Resellable',
        refundMethod: 'Adjust_With_Exchange',
        returnedItems: [
          {
            productId: 'prod_2',
            productName: 'Remax 20000mAh Power Bank',
            quantity: 1,
            unitPrice: 1450,
            refundAmount: 1450,
            condition: 'Resellable',
          },
        ],
        exchangedItems: [
          {
            productId: 'prod_3',
            productName: 'Anker 20W Fast Charger',
            quantity: 1,
            unitPrice: 1250,
          },
        ],
        refundAmount: 200,
        additionalCharge: 0,
        reason: 'পাওয়ার ব্যাংক কালার পরিবর্তন ও চার্জার এক্সচেঞ্জ',
        stockRestocked: true,
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'ret_2',
        returnNumber: 'RET-260308-02',
        invoiceNumber: 'SX-260307-04',
        customerName: 'তারেক মাহমুদ',
        customerMobile: '01722334455',
        type: 'Return',
        channel: 'Courier_RTO',
        condition: 'Damaged_Defective',
        courierProvider: 'Steadfast Courier',
        courierTrackingCode: 'ST-90281-BD',
        courierReturnFee: 100,
        refundMethod: 'Cash',
        returnedItems: [
          {
            productId: 'prod_1',
            productName: 'হ্যান্ডমেড লেদার ওয়ালেট',
            quantity: 1,
            unitPrice: 850,
            refundAmount: 0,
            condition: 'Damaged_Defective',
          },
        ],
        refundAmount: 0,
        additionalCharge: 0,
        reason: 'পার্সেল কাস্টমার রিসিভ করেনি (RTO) - প্যাকেজিং ক্ষতিগ্রস্ত',
        stockRestocked: false,
        notes: 'বক্স ছিঁড়ে গেছে, সাপ্লায়ারকে ক্লেইম জানানো হবে',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      },
      {
        id: 'ret_3',
        returnNumber: 'RET-260307-03',
        invoiceNumber: 'SX-260306-08',
        customerName: 'নুসরাত জাহান',
        customerMobile: '01833445566',
        type: 'Return',
        channel: 'POS_Store',
        condition: 'Resellable',
        refundMethod: 'Store_Credit',
        storeCreditCode: 'SC-2603-9941',
        returnedItems: [
          {
            productId: 'prod_4',
            productName: 'কটন ক্যাজুয়াল টি-শার্ট (L সাইজ)',
            quantity: 2,
            unitPrice: 650,
            refundAmount: 1300,
            condition: 'Resellable',
          },
        ],
        refundAmount: 1300,
        additionalCharge: 0,
        reason: 'সাইজ বড় হওয়ায় ফেরত, সমপরিমাণ টাকার স্টোর ভাউচার ইস্যু',
        stockRestocked: true,
        notes: 'ভাউচার কোড: SC-2603-9941 (মেয়াদ ৩০ দিন)',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      },
    ], businessId),
  setReturns: (items: any[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.RETURNS, STORAGE_KEYS.RETURNS, items, businessId),

  // Staff Management
  getStaff: (businessId?: string): StaffUser[] =>
    getStoredTenantItem(STORAGE_KEYS.STAFF, STORAGE_KEYS.STAFF, [
      {
        id: 'staff_1',
        name: 'সোহেল আহমেদ',
        mobile: '01712998877',
        role: 'Manager',
        permissions: {
          canMakeSale: true,
          canViewProfit: true,
          canEditProduct: true,
          canDeleteOrder: false,
          canViewReports: true,
          canManageCourier: true,
          canManageExpenses: true,
        },
        isActive: true,
        createdAt: '2025-01-10',
      },
      {
        id: 'staff_2',
        name: 'মাহমুদুল হাসান',
        mobile: '01812334455',
        role: 'Salesman',
        permissions: {
          canMakeSale: true,
          canViewProfit: false,
          canEditProduct: false,
          canDeleteOrder: false,
          canViewReports: false,
          canManageCourier: false,
          canManageExpenses: false,
        },
        isActive: true,
        createdAt: '2025-02-01',
      },
    ]),
  setStaff: (items: StaffUser[], businessId?: string): void =>
    setStoredTenantItem(STORAGE_KEYS.STAFF, STORAGE_KEYS.STAFF, items, businessId),

  // Courier API Credentials
  getCourierCredentials: (): CourierApiCredential[] =>
    getStoredItem(STORAGE_KEYS.COURIER_CREDENTIALS, [
      {
        provider: 'Steadfast',
        apiKey: 'sf_live_key_99882233',
        secretKey: 'sf_sec_live_77112244',
        clientId: 'SF-10492',
        webhookSecret: 'whsec_steadfast_prod',
        isLive: true,
        isConnected: true,
        lastTestedAt: '২০২৬-০৩-০৯ ১০:৩০ AM',
      },
      {
        provider: 'Pathao',
        apiKey: 'pt_client_id_445566',
        secretKey: 'pt_secret_token_112233',
        clientId: 'PT-8821',
        isLive: false,
        isConnected: false,
      },
      {
        provider: 'RedX',
        apiKey: '',
        secretKey: '',
        isLive: false,
        isConnected: false,
      },
      {
        provider: 'Paperfly',
        apiKey: '',
        secretKey: '',
        isLive: false,
        isConnected: false,
      },
      {
        provider: 'Sundarban',
        apiKey: '',
        secretKey: '',
        isLive: false,
        isConnected: false,
      },
      {
        provider: 'eCourier',
        apiKey: '',
        secretKey: '',
        isLive: false,
        isConnected: false,
      },
    ]),
  setCourierCredentials: (items: CourierApiCredential[]): void =>
    setStoredItem(STORAGE_KEYS.COURIER_CREDENTIALS, items),

  // Online Payment Gateways
  getPaymentGateways: (): PaymentGatewayConfig[] =>
    getStoredItem(STORAGE_KEYS.PAYMENT_GATEWAYS, [
      {
        gateway: 'bKash',
        appKey: 'bkash_app_key_demo',
        appSecret: 'bkash_app_secret_demo',
        username: '01711224455',
        password: 'demo_password_123',
        isLive: false,
        isEnabled: true,
        lastTestedAt: '২০২৬-০৩-০৯',
      },
      {
        gateway: 'Nagad',
        appKey: 'nagad_merchant_id_99',
        appSecret: 'nagad_public_key_demo',
        isLive: false,
        isEnabled: false,
      },
      {
        gateway: 'SSLCommerz',
        appKey: 'test_store_id_ssl',
        appSecret: 'test_store_passwd',
        isLive: false,
        isEnabled: false,
      },
      {
        gateway: 'Shurjopay',
        appKey: '',
        appSecret: '',
        isLive: false,
        isEnabled: false,
      },
      {
        gateway: 'Aamarpay',
        appKey: '',
        appSecret: '',
        isLive: false,
        isEnabled: false,
      },
    ]),
  setPaymentGateways: (items: PaymentGatewayConfig[]): void =>
    setStoredItem(STORAGE_KEYS.PAYMENT_GATEWAYS, items),

  // MFS & Receiving Accounts
  getMfsAccounts: (): MfsAccountDetail[] =>
    getStoredItem(STORAGE_KEYS.MFS_ACCOUNTS, [
      {
        id: 'mfs_1',
        provider: 'bKash',
        type: 'Merchant',
        accountNumber: '01711224455',
        accountTitle: 'SmartShopX Official',
        isActive: true,
      },
      {
        id: 'mfs_2',
        provider: 'Nagad',
        type: 'Merchant',
        accountNumber: '01611224455',
        accountTitle: 'SmartShopX Store',
        isActive: true,
      },
      {
        id: 'mfs_3',
        provider: 'Rocket',
        type: 'Personal',
        accountNumber: '01711224455-8',
        accountTitle: 'দোকান স্বত্বাধিকারী',
        isActive: true,
      },
      {
        id: 'mfs_4',
        provider: 'Bank',
        type: 'Current',
        accountNumber: '112.110.45982',
        accountTitle: 'SmartShopX Enterprise',
        bankName: 'ডাচ-বাংলা ব্যাংক পিএলসি',
        branchName: 'গুলশান শাখা, ঢাকা',
        routingNumber: '090272210',
        isActive: true,
      },
    ]),
  setMfsAccounts: (items: MfsAccountDetail[]): void =>
    setStoredItem(STORAGE_KEYS.MFS_ACCOUNTS, items),

  // Central API Configuration
  getCentralApiSettings: (): CentralApiSettings =>
    getStoredItem(STORAGE_KEYS.CENTRAL_API, {
      apiBaseUrl: 'https://api.smartshopx.com/v1',
      syncMode: 'hybrid',
      autoSyncIntervalMinutes: 5,
      lastSyncedAt: new Date().toISOString(),
      isOnline: true,
    }),
  setCentralApiSettings: (settings: CentralApiSettings): void =>
    setStoredItem(STORAGE_KEYS.CENTRAL_API, settings),

  // Coupons & Promo Vouchers
  getCoupons: (shopId?: string): any[] => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.COUPONS, initialCoupons);
    if (!shopId) return list;
    return list.filter((c) => !c.shopId || c.shopId === shopId);
  },
  setCoupons: (items: any[]): void =>
    setStoredItem(STORAGE_KEYS.COUPONS, items),
  saveCoupon: (coupon: any): void => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.COUPONS, initialCoupons);
    const existingIndex = list.findIndex((c) => c.id === coupon.id);
    if (existingIndex >= 0) {
      list[existingIndex] = coupon;
    } else {
      list.unshift(coupon);
    }
    setStoredItem(STORAGE_KEYS.COUPONS, list);
  },

  // Customer Reviews & Ratings
  getReviews: (productId?: string): any[] => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.REVIEWS, initialReviews);
    if (!productId) return list;
    return list.filter((r) => r.productId === productId);
  },
  addReview: (review: any): void => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.REVIEWS, initialReviews);
    list.unshift(review);
    setStoredItem(STORAGE_KEYS.REVIEWS, list);
  },

  // Resellers & Dropshipping
  getResellers: (): any[] =>
    getStoredItem<any[]>(STORAGE_KEYS.RESELLERS, initialResellers),
  registerReseller: (reseller: any): void => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.RESELLERS, initialResellers);
    list.unshift(reseller);
    setStoredItem(STORAGE_KEYS.RESELLERS, list);
  },
  recordResellerSale: (referralCode: string, orderAmount: number): void => {
    const list = getStoredItem<any[]>(STORAGE_KEYS.RESELLERS, initialResellers);
    const item = list.find((r) => r.referralCode.toUpperCase() === referralCode.toUpperCase());
    if (item) {
      const commission = Math.round((orderAmount * item.commissionPercent) / 100);
      item.totalOrders += 1;
      item.totalSalesAmount += orderAmount;
      item.totalCommissionEarned += commission;
      item.pendingCommission += commission;
      setStoredItem(STORAGE_KEYS.RESELLERS, list);
    }
  },

  // Customer Fraud Check & Courier Risk Score
  checkCustomerFraudScore: (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const orders = DataStore.getOrders();
    const customerOrders = orders.filter((o) => o.customerMobile?.replace(/\D/g, '').includes(cleanPhone));
    
    if (customerOrders.length === 0) {
      return {
        totalOrders: 0,
        successRate: 100,
        riskLevel: 'Safe' as const,
        returnedCount: 0,
        deliveredCount: 0,
        summary: 'নতুন কাস্টমার (সঠিক ক্যাশ অন ডেলিভারি গ্রহণযোগ্য)',
      };
    }

    const returnedCount = customerOrders.filter((o) => o.orderStatus === 'Returned' || o.orderStatus === 'Cancelled').length;
    const deliveredCount = customerOrders.filter((o) => o.orderStatus === 'Delivered').length;
    const rate = Math.round((deliveredCount / customerOrders.length) * 100);

    let riskLevel: 'Safe' | 'Moderate' | 'High Risk' = 'Safe';
    let summary = 'বিশ্বাসযোগ্য ক্রেতা (ডেলিভারি সাকসেস ১০০%)';

    if (returnedCount > 1 || rate < 60) {
      riskLevel = 'High Risk';
      summary = `উচ্চ ঝুঁকি! অতীতে ${returnedCount} টি পার্সেল রিটার্ন হয়েছে। অগ্রিম ডেলিভারি চার্জ নেওয়া আবশ্যক।`;
    } else if (returnedCount === 1) {
      riskLevel = 'Moderate';
      summary = `মাঝারি ঝুঁকি (পূর্বে ১টি পার্সেল রিটার্ন রেকর্ড রয়েছে)`;
    }

    return {
      totalOrders: customerOrders.length,
      successRate: rate,
      riskLevel,
      returnedCount,
      deliveredCount,
      summary,
    };
  },

  // Multi-Branch Management
  getBranches: (): Branch[] => {
    return getStoredItem(STORAGE_KEYS.BRANCHES, initialBranches);
  },
  saveBranches: (branches: Branch[]): void => {
    setStoredItem(STORAGE_KEYS.BRANCHES, branches);
  },
  setBranches: (branches: Branch[]): void => {
    setStoredItem(STORAGE_KEYS.BRANCHES, branches);
  },
  createBranch: (branch: Omit<Branch, 'id' | 'createdAt'>): Branch => {
    const branches = DataStore.getBranches();
    const newBranch: Branch = {
      ...branch,
      id: `br_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newBranch, ...branches];
    DataStore.saveBranches(updated);
    return newBranch;
  },
  updateBranch: (id: string, updates: Partial<Branch>): Branch | null => {
    const branches = DataStore.getBranches();
    const idx = branches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    branches[idx] = { ...branches[idx], ...updates };
    DataStore.saveBranches(branches);
    return branches[idx];
  },
  deleteBranch: (id: string): boolean => {
    const branches = DataStore.getBranches();
    const filtered = branches.filter((b) => b.id !== id);
    if (filtered.length === branches.length) return false;
    DataStore.saveBranches(filtered);
    return true;
  },

  // Stock Transfers between branches
  getStockTransfers: (): StockTransferRequest[] => {
    return getStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, initialStockTransfers);
  },
  saveStockTransfers: (transfers: StockTransferRequest[]): void => {
    setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
  },
  setStockTransfers: (transfers: StockTransferRequest[]): void => {
    setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, transfers);
  },
  createStockTransfer: (transfer: Omit<StockTransferRequest, 'id' | 'createdAt' | 'transferNumber'>): StockTransferRequest => {
    const transfers = DataStore.getStockTransfers();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const transferNumber = `TRF-${dateCode}-${String(transfers.length + 1).padStart(3, '0')}`;
    
    const newTransfer: StockTransferRequest = {
      ...transfer,
      id: `trf_${Date.now()}`,
      transferNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTransfer, ...transfers];
    DataStore.saveStockTransfers(updated);

    // If transfer is source branch, log stock movement out
    try {
      const movements = DataStore.getStockMovements();
      const newMovements: StockMovement[] = transfer.items.map((item) => ({
        id: `mov_${Date.now()}_${item.productId}`,
        productId: item.productId,
        productName: item.productName,
        type: 'TRANSFER' as const,
        quantity: item.quantity,
        previousStock: 100, // standard reference
        newStock: Math.max(0, 100 - item.quantity),
        reason: `ব্রাঞ্চ ট্রান্সফার: ${transfer.destinationBranchName} (${transferNumber})`,
        createdAt: new Date().toISOString(),
      }));
      DataStore.setStockMovements([...newMovements, ...movements]);
    } catch {}

    return newTransfer;
  },
  updateStockTransferStatus: (id: string, status: StockTransferRequest['status'], receivedBy?: string): StockTransferRequest | null => {
    const transfers = DataStore.getStockTransfers();
    const idx = transfers.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const current = transfers[idx];
    current.status = status;
    if (status === 'received') {
      current.receivedDate = new Date().toISOString().split('T')[0];
      if (receivedBy) current.receivedBy = receivedBy;

      // When received, adjust branch stock counters
      const branches = DataStore.getBranches();
      const destBranch = branches.find((b) => b.id === current.destinationBranchId);
      const srcBranch = branches.find((b) => b.id === current.sourceBranchId);

      if (destBranch) {
        destBranch.totalStockQuantity = (destBranch.totalStockQuantity || 0) + current.totalQuantity;
        destBranch.totalStockValuation = (destBranch.totalStockValuation || 0) + current.totalValue;
      }
      if (srcBranch) {
        srcBranch.totalStockQuantity = Math.max(0, (srcBranch.totalStockQuantity || 0) - current.totalQuantity);
        srcBranch.totalStockValuation = Math.max(0, (srcBranch.totalStockValuation || 0) - current.totalValue);
      }
      DataStore.saveBranches(branches);
    }

    transfers[idx] = current;
    DataStore.saveStockTransfers(transfers);
    return current;
  },

  // Full Database Export & Import
  exportAllStoreData: (): string => {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      try {
        const item = localStorage.getItem(storageKey);
        if (item) {
          data[key] = JSON.parse(item);
        }
      } catch (e) {
        console.error(`Error exporting ${key}`, e);
      }
    });
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      app: 'SmartShopX',
      storeData: data,
    }, null, 2);
  },

  importStoreData: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const storeData = parsed.storeData || parsed;
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        if (storeData[key] !== undefined) {
          localStorage.setItem(storageKey, JSON.stringify(storeData[key]));
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to import backup data', e);
      return false;
    }
  },

  // Clear for Real Production (Zero Clean State)
  clearForProduction: (businessId?: string): void => {
    const bid = businessId || getActiveBid();
    const tenantSuffixes = [
      'products', 'customers', 'suppliers', 'orders', 'incomplete_orders',
      'purchases', 'stock_movements', 'payments', 'expenses', 'stock_logs',
      'sales', 'telecom_transactions', 'returns'
    ];
    tenantSuffixes.forEach((suffix) => {
      localStorage.setItem(`smartshopx_business_${bid}_${suffix}`, JSON.stringify([]));
    });

    if (bid === 'shop_101' || bid === initialShop.id) {
      const keysToEmpty = [
        STORAGE_KEYS.PRODUCTS,
        STORAGE_KEYS.CUSTOMERS,
        STORAGE_KEYS.SUPPLIERS,
        STORAGE_KEYS.ORDERS,
        STORAGE_KEYS.INCOMPLETE_ORDERS,
        STORAGE_KEYS.PURCHASES,
        STORAGE_KEYS.STOCK_MOVEMENTS,
        STORAGE_KEYS.PAYMENTS,
        STORAGE_KEYS.EXPENSES,
        STORAGE_KEYS.STOCK_LOGS,
        STORAGE_KEYS.SALES,
        STORAGE_KEYS.PERSONAL_TRANSACTIONS,
        STORAGE_KEYS.TELECOM_TRANSACTIONS,
        STORAGE_KEYS.RETURNS,
      ];
      keysToEmpty.forEach((k) => localStorage.setItem(k, JSON.stringify([])));
    }
  },

  resetToDefault: (): void => {
    localStorage.clear();
  },
};
