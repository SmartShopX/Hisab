/**
 * SmartShopX Unified API Services Layer
 * Provides typed REST API endpoints communicating with the centralized SmartShopX Backend/API.
 * Features graceful local DataStore fallbacks for offline development & live client preview.
 */

import { apiClient } from './apiClient';
import { DataStore } from './dataStorage';
import {
  Product,
  Order,
  IncompleteOrder,
  Customer,
  Supplier,
  Purchase,
  Shop,
  PersonalTransaction,
  TelecomTransaction,
  MobileRepairTicket,
  DrivePackOffer,
  TelecomDailyClosing,
  ReturnExchangeRecord,
  StaffUser,
  Branch,
  StockTransferRequest,
  SubscriptionPlan,
  SubscriptionStatus,
  CANONICAL_CATEGORIES,
  CanonicalCategory,
  CentralSubscriptionTier,
} from '../types';

export const authApi = {
  login: async (credentials: { mobile: string; password?: string; otp?: string }) => {
    try {
      return await apiClient.post<{ token: string; user: any; shop: Shop }>('/auth/login', credentials);
    } catch {
      const user = DataStore.getUser() || {
        id: 'usr_001',
        name: 'তানভীর আহমেদ',
        mobile: credentials.mobile,
        role: 'owner',
        shopId: 'shop_101',
      };
      const shop = DataStore.getShop();
      return { token: 'mock_jwt_token_client_' + Date.now(), user, shop };
    }
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // offline fallback
    }
  },
  register: async (data: any) => {
    try {
      return await apiClient.post('/auth/register', data);
    } catch {
      return { success: true, message: 'OTP sent to mobile' };
    }
  },
  verifyOtp: async (mobile: string, otp: string) => {
    try {
      return await apiClient.post('/auth/verify-otp', { mobile, otp });
    } catch {
      return { success: true, verified: true };
    }
  },
};

export const businessApi = {
  getProfile: async (): Promise<Shop> => {
    try {
      return await apiClient.get<Shop>('/business/profile');
    } catch {
      return DataStore.getShop();
    }
  },
  updateProfile: async (data: Partial<Shop>): Promise<Shop> => {
    try {
      const res = await apiClient.put<Shop>('/business/profile', data);
      DataStore.setShop(res);
      return res;
    } catch {
      const current = DataStore.getShop();
      const updated = { ...current, ...data };
      DataStore.setShop(updated);
      return updated;
    }
  },
  setupBusiness: async (data: Partial<Shop>): Promise<Shop> => {
    try {
      return await apiClient.post<Shop>('/business/setup', data);
    } catch {
      const current = DataStore.getShop();
      const updated = { ...current, ...data };
      DataStore.setShop(updated);
      return updated;
    }
  },
};

export const categoryApi = {
  getAll: async (): Promise<CanonicalCategory[]> => {
    try {
      return await apiClient.get<CanonicalCategory[]>('/categories');
    } catch {
      return [...CANONICAL_CATEGORIES];
    }
  },
};

export const subscriptionApi = {
  getStatus: async () => {
    try {
      return await apiClient.get<any>('/subscription/status');
    } catch {
      const shop = DataStore.getShop();
      const planName = shop.subscriptionPlan || 'Standard';
      const canonicalTier: CentralSubscriptionTier =
        planName === 'Enterprise'
          ? 'ENTERPRISE'
          : planName === 'Standard'
          ? 'BUSINESS'
          : 'STARTER';

      return {
        plan: planName,
        tier: canonicalTier,
        status: shop.subscriptionStatus || 'Active',
        startDate: shop.subscriptionStart || '2026-01-01',
        expiryDate: shop.subscriptionExpiry || '2026-12-31',
        renewalDaysLeft: 295,
        quotaUsage: {
          productsCount: DataStore.getProducts().length,
          productsMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 2000 : 200,
          ordersThisMonth: DataStore.getOrders().length,
          ordersMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 10000 : 1000,
          staffCount: DataStore.getStaff().length,
          staffMax: planName === 'Enterprise' ? 999999 : planName === 'Standard' ? 5 : 1,
          storesCount: DataStore.getBusinesses().length,
          storesMax: planName === 'Enterprise' ? 10 : planName === 'Standard' ? 3 : 1,
        },
      };
    }
  },
  upgrade: async (plan: SubscriptionPlan | CentralSubscriptionTier) => {
    try {
      return await apiClient.post('/subscription/upgrade', { plan });
    } catch {
      const shop = DataStore.getShop();
      const mappedPlan: SubscriptionPlan =
        plan === 'ENTERPRISE' ? 'Enterprise' : plan === 'BUSINESS' ? 'Standard' : plan === 'STARTER' ? 'Basic' : (plan as SubscriptionPlan);

      const updated = {
        ...shop,
        subscriptionPlan: mappedPlan,
        subscriptionStatus: 'Active' as SubscriptionStatus,
        plan: mappedPlan,
      };
      DataStore.setShop(updated);
      return { success: true, plan: mappedPlan };
    }
  },
};

export const featureApi = {
  checkAccess: async (featureKey: string): Promise<boolean> => {
    const shop = DataStore.getShop();
    const plan = (shop.subscriptionPlan || 'Standard').toUpperCase();
    if (plan === 'ENTERPRISE') return true;
    if (plan === 'STANDARD' || plan === 'BUSINESS' || plan === 'PRO') {
      return featureKey !== 'advanced_ai_fraud_detector';
    }
    // Basic / Starter plan exclusions
    const basicExclusions = ['landing_page_builder', 'courier_automation', 'sms_marketing_bulk', 'custom_domain'];
    return !basicExclusions.includes(featureKey);
  },
};

export const productApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      return await apiClient.get<Product[]>('/products');
    } catch {
      return DataStore.getProducts();
    }
  },
  create: async (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    try {
      return await apiClient.post<Product>('/products', data);
    } catch {
      const products = DataStore.getProducts();
      const newProduct: Product = {
        ...data,
        id: `prod_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      DataStore.setProducts([newProduct, ...products]);
      return newProduct;
    }
  },
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      return await apiClient.put<Product>(`/products/${id}`, data);
    } catch {
      const products = DataStore.getProducts();
      const updated = products.map((p) => (p.id === id ? { ...p, ...data } : p));
      DataStore.setProducts(updated);
      return updated.find((p) => p.id === id)!;
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {
      const products = DataStore.getProducts().filter((p) => p.id !== id);
      DataStore.setProducts(products);
    }
  },
  updateOnlineStatus: async (id: string, onlineStoreVisible: boolean): Promise<{ success: boolean; onlineStoreVisible: boolean }> => {
    try {
      const res = await apiClient.patch<{ success: boolean; onlineStoreVisible: boolean }>(`/products/${id}/online-status`, { onlineStoreVisible });
      const products = DataStore.getProducts();
      const updated = products.map((p) => (p.id === id ? { ...p, onlineStoreVisible } : p));
      DataStore.setProducts(updated);
      return res;
    } catch {
      const products = DataStore.getProducts();
      const updated = products.map((p) => (p.id === id ? { ...p, onlineStoreVisible } : p));
      DataStore.setProducts(updated);
      return { success: true, onlineStoreVisible };
    }
  },
  bulkUpdateOnlineStatus: async (productIds: string[], onlineStoreVisible: boolean): Promise<{ success: boolean; updatedCount: number }> => {
    try {
      const res = await apiClient.post<{ success: boolean; updatedCount: number }>(`/products/bulk-online-status`, { productIds, onlineStoreVisible });
      const products = DataStore.getProducts();
      const idSet = new Set(productIds);
      const updated = products.map((p) => (idSet.has(p.id) ? { ...p, onlineStoreVisible } : p));
      DataStore.setProducts(updated);
      return res;
    } catch {
      const products = DataStore.getProducts();
      const idSet = new Set(productIds);
      const updated = products.map((p) => (idSet.has(p.id) ? { ...p, onlineStoreVisible } : p));
      DataStore.setProducts(updated);
      return { success: true, updatedCount: productIds.length };
    }
  },
};

export const productsApi = productApi;

export const inventoryApi = {
  getStockLogs: async () => {
    try {
      return await apiClient.get<any[]>('/inventory/logs');
    } catch {
      return DataStore.getStockLogs();
    }
  },
  adjustStock: async (productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string) => {
    try {
      return await apiClient.post('/inventory/adjust', { productId, quantity, type, reason });
    } catch {
      const products = DataStore.getProducts();
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const prevStock = prod.stock;
        let newStock = prevStock;
        if (type === 'IN') newStock += quantity;
        else if (type === 'OUT') newStock = Math.max(0, prevStock - quantity);
        else newStock = quantity;

        prod.stock = newStock;
        DataStore.setProducts(products);

        const movements = DataStore.getStockMovements();
        movements.unshift({
          id: `mov_${Date.now()}`,
          productId,
          productName: prod.name,
          type,
          quantity,
          previousStock: prevStock,
          newStock,
          reason,
          createdAt: new Date().toISOString(),
        });
        DataStore.setStockMovements(movements);
      }
      return { success: true };
    }
  },
};

export const salesApi = {
  createSale: async (saleData: any) => {
    try {
      return await apiClient.post('/sales', saleData);
    } catch {
      const orders = DataStore.getOrders();
      const newOrder: Order = {
        ...saleData,
        id: `ord_${Date.now()}`,
        orderNumber: `SX-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${orders.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      DataStore.setOrders([newOrder, ...orders]);
      return newOrder;
    }
  },
  getAll: async (): Promise<Order[]> => {
    try {
      return await apiClient.get<Order[]>('/sales');
    } catch {
      return DataStore.getOrders();
    }
  },
};

export const purchaseApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
    try {
      const q = params ? `?page=${params.page || 1}&limit=${params.limit || 50}&search=${encodeURIComponent(params.search || '')}` : '';
      const res = await apiClient.get<any>(`/purchases${q}`);
      return res;
    } catch {
      return { data: DataStore.getPurchases() };
    }
  },
  getPriceHistory: async (productId: string) => {
    try {
      return await apiClient.get<any>(`/purchases/price-history/${productId}`);
    } catch {
      const purchases = DataStore.getPurchases();
      const product = DataStore.getProducts().find((p) => p.id === productId);
      const rates: number[] = [];
      purchases.forEach((p) => {
        if (Array.isArray(p.items)) {
          p.items.forEach((it: any) => {
            if (it.productId === productId) rates.push(it.purchasePrice || it.unitCost || 0);
          });
        }
      });
      const lowestRate = rates.length > 0 ? Math.min(...rates) : (product?.purchasePrice || 0);
      const highestRate = rates.length > 0 ? Math.max(...rates) : (product?.purchasePrice || 0);
      const averageRate =
        rates.length > 0
          ? parseFloat((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2))
          : (product?.purchasePrice || 0);
      return {
        productId,
        previousPrice: product?.purchasePrice || 0,
        lowestRate,
        highestRate,
        averageRate,
        history: [],
      };
    }
  },
  create: async (data: any): Promise<Purchase> => {
    try {
      return await apiClient.post<Purchase>('/purchases', data);
    } catch {
      const purchases = DataStore.getPurchases();
      const newPurchase: Purchase = {
        ...data,
        id: `pur_${Date.now()}`,
        purchaseNumber: `PUR-${new Date().getFullYear()}-${purchases.length + 1}`,
      };
      DataStore.setPurchases([newPurchase, ...purchases]);
      return newPurchase;
    }
  },
  createReturn: async (data: any): Promise<any> => {
    try {
      return await apiClient.post('/purchases/returns', data);
    } catch {
      return { success: true, message: 'Recorded locally' };
    }
  },
  getReturns: async (): Promise<any> => {
    try {
      return await apiClient.get('/purchases/returns');
    } catch {
      return { data: [] };
    }
  },
};

export const branchApi = {
  getAll: async (): Promise<Branch[]> => {
    try {
      return await apiClient.get<Branch[]>('/branches');
    } catch {
      return DataStore.getBranches();
    }
  },
  create: async (data: Partial<Branch>): Promise<Branch> => {
    try {
      return await apiClient.post<Branch>('/branches', data);
    } catch {
      const branches = DataStore.getBranches();
      const newBranch: Branch = {
        id: `br_${Date.now()}`,
        name: data.name || '',
        code: data.code || `BR-${branches.length + 1}`,
        address: data.address || '',
        phone: data.phone || '',
        city: data.city || 'ঢাকা',
        isMainBranch: Boolean(data.isMainBranch),
        status: 'active',
        isActive: true,
        targetMonthlySales: data.targetMonthlySales || 200000,
        managerName: data.managerName || '',
        createdAt: new Date().toISOString(),
      };
      DataStore.setBranches([...branches, newBranch]);
      return newBranch;
    }
  },
  update: async (id: string, data: Partial<Branch>): Promise<Branch> => {
    try {
      return await apiClient.put<Branch>(`/branches/${id}`, data);
    } catch {
      const branches = DataStore.getBranches();
      const updated = branches.map((b) => (b.id === id ? { ...b, ...data } : b));
      DataStore.setBranches(updated);
      return updated.find((b) => b.id === id)!;
    }
  },
  getTransfers: async (): Promise<StockTransferRequest[]> => {
    try {
      return await apiClient.get<StockTransferRequest[]>('/branches/transfers');
    } catch {
      return DataStore.getStockTransfers();
    }
  },
  createTransfer: async (data: any): Promise<StockTransferRequest> => {
    try {
      return await apiClient.post<StockTransferRequest>('/branches/transfers', data);
    } catch {
      const transfers = DataStore.getStockTransfers();
      const newTransfer: StockTransferRequest = {
        id: `bt_${Date.now()}`,
        transferNumber: `ST-${Date.now().toString().slice(-6)}`,
        status: 'In_Transit',
        ...data,
        createdAt: new Date().toISOString(),
      };
      DataStore.setStockTransfers([newTransfer, ...transfers]);
      return newTransfer;
    }
  },
  updateTransferStatus: async (id: string, status: string) => {
    try {
      return await apiClient.put(`/branches/transfers/${id}/status`, { status });
    } catch {
      const transfers = DataStore.getStockTransfers();
      const updated = transfers.map((t) => (t.id === id ? { ...t, status: status as any } : t));
      DataStore.setStockTransfers(updated);
      return { id, status };
    }
  },
};

export const customerApi = {
  getAll: async (): Promise<Customer[]> => {
    try {
      return await apiClient.get<Customer[]>('/customers');
    } catch {
      return DataStore.getCustomers();
    }
  },
  getLedger: async (customerId: string) => {
    try {
      return await apiClient.get<any>(`/customers/${customerId}/ledger`);
    } catch {
      const c = DataStore.getCustomers().find((cust) => cust.id === customerId);
      return { customer: c, entries: c?.ledger || [] };
    }
  },
  addAdjustment: async (
    customerId: string,
    data: { type: 'Debit' | 'Credit'; amount: number; notes?: string; date?: string }
  ) => {
    try {
      return await apiClient.post<any>(`/customers/${customerId}/adjustment`, data);
    } catch {
      return { success: true };
    }
  },
  create: async (data: any): Promise<Customer> => {
    try {
      return await apiClient.post<Customer>('/customers', data);
    } catch {
      const customers = DataStore.getCustomers();
      const newCustomer: Customer = {
        ...data,
        id: `cust_${Date.now()}`,
        totalPurchase: 0,
        totalPaid: 0,
        totalDue: 0,
        ordersCount: 0,
        riskLevel: 'Low',
        deliverySuccessRate: 100,
        ordersDelivered: 0,
        ordersCancelled: 0,
        ordersReturned: 0,
        createdAt: new Date().toISOString(),
      };
      DataStore.setCustomers([newCustomer, ...customers]);
      return newCustomer;
    }
  },
};

export const supplierApi = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      return await apiClient.get<Supplier[]>('/suppliers');
    } catch {
      return DataStore.getSuppliers();
    }
  },
  getLedger: async (supplierId: string) => {
    try {
      return await apiClient.get<any>(`/suppliers/${supplierId}/ledger`);
    } catch {
      const s = DataStore.getSuppliers().find((sup) => sup.id === supplierId);
      return { supplier: s, entries: [] };
    }
  },
  paySupplier: async (supplierId: string, amount: number, paymentMethod = 'Bank', notes?: string) => {
    try {
      return await apiClient.post<any>(`/suppliers/${supplierId}/pay`, { amount, paymentMethod, notes });
    } catch {
      return { success: true };
    }
  },
};

export const paymentApi = {
  getAll: async () => {
    try {
      return await apiClient.get<any[]>('/payments');
    } catch {
      return DataStore.getPayments();
    }
  },
  recordPayment: async (paymentData: any) => {
    try {
      return await apiClient.post('/payments', paymentData);
    } catch {
      const payments = DataStore.getPayments();
      payments.unshift({
        id: `pay_${Date.now()}`,
        transactionId: `TXN-${Date.now()}`,
        status: 'Paid',
        ...paymentData,
        date: new Date().toISOString(),
      });
      DataStore.setPayments(payments);
      return { success: true };
    }
  },
};

export const invoiceApi = {
  getAll: async () => {
    const orders = DataStore.getOrders();
    const purchases = DataStore.getPurchases();
    return {
      salesInvoices: orders,
      purchaseInvoices: purchases,
    };
  },
};

export const orderApi = {
  getAll: async (): Promise<Order[]> => {
    try {
      return await apiClient.get<Order[]>('/orders');
    } catch {
      return DataStore.getOrders();
    }
  },
  getIncompleteOrders: async (): Promise<IncompleteOrder[]> => {
    try {
      return await apiClient.get<IncompleteOrder[]>('/orders/incomplete');
    } catch {
      return DataStore.getIncompleteOrders();
    }
  },
  updateStatus: async (orderId: string, status: any) => {
    try {
      return await apiClient.put(`/orders/${orderId}/status`, { status });
    } catch {
      const orders = DataStore.getOrders();
      const updated = orders.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
      DataStore.setOrders(updated);
      return { success: true };
    }
  },
};

export const onlineStoreApi = {
  getSettings: async () => {
    return DataStore.getShop();
  },
  updateSettings: async (settings: Partial<Shop>) => {
    const current = DataStore.getShop();
    const updated = { ...current, ...settings };
    DataStore.setShop(updated);
    return updated;
  },
};

export const landingPageApi = {
  getAll: async () => {
    return DataStore.getLandingPages();
  },
  save: async (landingPage: any) => {
    const pages = DataStore.getLandingPages();
    const index = pages.findIndex((p) => p.id === landingPage.id);
    if (index >= 0) {
      pages[index] = landingPage;
    } else {
      pages.unshift(landingPage);
    }
    DataStore.setLandingPages(pages);
    return landingPage;
  },
};

export const courierApi = {
  getAll: async () => {
    return DataStore.getCourierOrders();
  },
  getShipments: async (params?: { search?: string; status?: string; provider?: string }) => {
    try {
      const q = params
        ? `?search=${encodeURIComponent(params.search || '')}&status=${params.status || ''}&provider=${params.provider || ''}`
        : '';
      return await apiClient.get<any>(`/courier/shipments${q}`);
    } catch {
      return { data: DataStore.getCourierOrders() };
    }
  },
  createShipment: async (data: any) => {
    try {
      return await apiClient.post<any>('/courier/shipments', data);
    } catch {
      const trackingNumber = `${(data.provider || 'SF').slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      return { success: true, trackingCode: trackingNumber, ...data };
    }
  },
  updateShipmentStatus: async (id: string, status: string, otpEntered?: string) => {
    try {
      return await apiClient.put(`/courier/shipments/${id}/status`, { status, otpEntered });
    } catch {
      return { success: true, status };
    }
  },
  bookCourier: async (orderId: string, provider: string) => {
    const trackingNumber = `${provider.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orders = DataStore.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.courierName = provider;
      order.courierTrackingCode = trackingNumber;
      order.orderStatus = 'Courier Assigned';
      DataStore.setOrders(orders);
    }
    return { success: true, trackingNumber };
  },
};

export const notificationApi = {
  getSettings: async () => {
    return DataStore.getNotificationSettings();
  },
  updateSettings: async (settings: any) => {
    DataStore.setNotificationSettings(settings);
    return settings;
  },
};

export const reportApi = {
  getSummary: async (range: string = 'today') => {
    const orders = DataStore.getOrders();
    const purchases = DataStore.getPurchases();
    const expenses = DataStore.getExpenses();
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const customerDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    const supplierPayable = purchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);
    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      customerDue,
      supplierPayable,
      grossProfit: totalSales - totalPurchases * 0.75,
      netProfit: totalSales - totalPurchases * 0.75 - totalExpenses,
      range,
    };
  },
};

export const staffApi = {
  getAll: async (): Promise<StaffUser[]> => {
    return [
      {
        id: 'stf_1',
        name: 'সাকিব আল হাসান',
        mobile: '01822334455',
        role: 'Manager',
        permissions: {
          canMakeSale: true,
          canViewProfit: true,
          canEditProduct: true,
          canDeleteOrder: false,
          canViewReports: true,
        },
        isActive: true,
        createdAt: '2026-01-15',
      },
      {
        id: 'stf_2',
        name: 'মাহমুদুল্লাহ রিয়াদ',
        mobile: '01933445566',
        role: 'Salesman',
        permissions: {
          canMakeSale: true,
          canViewProfit: false,
          canEditProduct: false,
          canDeleteOrder: false,
          canViewReports: false,
        },
        isActive: true,
        createdAt: '2026-02-01',
      },
    ];
  },
};

export const settingsApi = {
  getFacebookPixel: async () => DataStore.getFacebookSettings(),
  updateFacebookPixel: async (settings: any) => {
    DataStore.setFacebookSettings(settings);
    return settings;
  },
  getBlockedEntities: async () => DataStore.getBlockedEntities(),
  addBlockedEntity: async (entity: any) => {
    const list = DataStore.getBlockedEntities();
    const newItem = {
      ...entity,
      id: `blk_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setBlockedEntities([newItem, ...list]);
    return newItem;
  },
  removeBlockedEntity: async (id: string) => {
    const list = DataStore.getBlockedEntities().filter((i) => i.id !== id);
    DataStore.setBlockedEntities(list);
  },
};

export const telecomApi = {
  getTransactions: async (): Promise<TelecomTransaction[]> => {
    try {
      const res = await apiClient.get<TelecomTransaction[]>('/telecom/transactions');
      if (res && Array.isArray(res)) return res;
    } catch {
      // fallback
    }
    return DataStore.getTelecomTransactions();
  },
  recordTransaction: async (data: Omit<TelecomTransaction, 'id' | 'date'>): Promise<TelecomTransaction> => {
    try {
      const res = await apiClient.post<TelecomTransaction>('/telecom/transactions', data);
      if (res && res.id) {
        const list = DataStore.getTelecomTransactions();
        DataStore.setTelecomTransactions([res, ...list]);
        return res;
      }
    } catch {
      // fallback
    }
    const list = DataStore.getTelecomTransactions();
    const item: TelecomTransaction = {
      ...data,
      id: `tt_${Date.now()}`,
      date: new Date().toISOString(),
    };
    DataStore.setTelecomTransactions([item, ...list]);
    return item;
  },
  getBalances: async () => {
    return DataStore.getTelecomBalances();
  },
  updateBalance: async (id: string, balance: number) => {
    const balances = DataStore.getTelecomBalances();
    const updated = balances.map((b) => (b.id === id ? { ...b, balance, lastUpdated: new Date().toISOString().split('T')[0] } : b));
    DataStore.setTelecomBalances(updated);
    return updated;
  },

  // Device Servicing & Repair Job Sheet
  getRepairTickets: async (): Promise<MobileRepairTicket[]> => {
    try {
      const res = await apiClient.get<MobileRepairTicket[]>('/telecom/repairs');
      if (res && Array.isArray(res)) return res;
    } catch {
      // fallback
    }
    return DataStore.getMobileRepairTickets();
  },
  createRepairTicket: async (
    data: Omit<MobileRepairTicket, 'id' | 'ticketNumber' | 'receivedDate'>
  ): Promise<MobileRepairTicket> => {
    try {
      const res = await apiClient.post<MobileRepairTicket>('/telecom/repairs', data);
      if (res && res.id) {
        const list = DataStore.getMobileRepairTickets();
        DataStore.setMobileRepairTickets([res, ...list]);
        return res;
      }
    } catch {
      // fallback
    }
    const list = DataStore.getMobileRepairTickets();
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    const ticketSeq = String(list.length + 1).padStart(2, '0');
    const newTicket: MobileRepairTicket = {
      ...data,
      id: `srv_${Date.now()}`,
      ticketNumber: `JOB-${dateStr}-${ticketSeq}`,
      receivedDate: new Date().toISOString().split('T')[0],
    };
    DataStore.setMobileRepairTickets([newTicket, ...list]);
    return newTicket;
  },
  updateRepairTicket: async (ticket: MobileRepairTicket): Promise<MobileRepairTicket> => {
    try {
      await apiClient.put(`/telecom/repairs/${ticket.id}/status`, ticket);
    } catch {
      // fallback
    }
    const list = DataStore.getMobileRepairTickets();
    const updated = list.map((t) => (t.id === ticket.id ? ticket : t));
    DataStore.setMobileRepairTickets(updated);
    return ticket;
  },
  deleteRepairTicket: async (id: string): Promise<void> => {
    const list = DataStore.getMobileRepairTickets();
    DataStore.setMobileRepairTickets(list.filter((t) => t.id !== id));
  },

  // Drive Packs & Cashback Offers
  getDrivePacks: async (): Promise<DrivePackOffer[]> => {
    return DataStore.getDrivePacks();
  },
  saveDrivePack: async (pack: DrivePackOffer): Promise<DrivePackOffer> => {
    const list = DataStore.getDrivePacks();
    const existingIndex = list.findIndex((p) => p.id === pack.id);
    let updated: DrivePackOffer[];
    if (existingIndex >= 0) {
      updated = list.map((p) => (p.id === pack.id ? pack : p));
    } else {
      updated = [pack, ...list];
    }
    DataStore.setDrivePacks(updated);
    return pack;
  },
  deleteDrivePack: async (id: string): Promise<void> => {
    const list = DataStore.getDrivePacks();
    DataStore.setDrivePacks(list.filter((p) => p.id !== id));
  },

  // Daily Closing & Reconciliation
  getDailyClosings: async (): Promise<TelecomDailyClosing[]> => {
    try {
      const res = await apiClient.get<TelecomDailyClosing[]>('/telecom/closings');
      if (res && Array.isArray(res)) return res;
    } catch {
      // fallback
    }
    return DataStore.getTelecomClosings();
  },
  saveDailyClosing: async (
    data: Omit<TelecomDailyClosing, 'id' | 'createdAt'>
  ): Promise<TelecomDailyClosing> => {
    try {
      const res = await apiClient.post<TelecomDailyClosing>('/telecom/closings', data);
      if (res && res.id) {
        const list = DataStore.getTelecomClosings();
        DataStore.setTelecomClosings([res, ...list]);
        return res;
      }
    } catch {
      // fallback
    }
    const list = DataStore.getTelecomClosings();
    const item: TelecomDailyClosing = {
      ...data,
      id: `tc_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    DataStore.setTelecomClosings([item, ...list]);
    return item;
  },
  deleteDailyClosing: async (id: string): Promise<void> => {
    const list = DataStore.getTelecomClosings();
    DataStore.setTelecomClosings(list.filter((c) => c.id !== id));
  },
};

export const returnsApi = {
  getAll: async (): Promise<ReturnExchangeRecord[]> => {
    try {
      const res = await apiClient.get<{ data: ReturnExchangeRecord[] }>('/returns');
      if (res && Array.isArray(res.data)) {
        return res.data;
      }
      if (Array.isArray(res)) {
        return res;
      }
    } catch {
      // fallback
    }
    return DataStore.getReturns();
  },
  create: async (data: Omit<ReturnExchangeRecord, 'id' | 'date' | 'returnNumber'>): Promise<ReturnExchangeRecord> => {
    try {
      const serverRes = await apiClient.post<ReturnExchangeRecord>('/returns', data);
      if (serverRes && serverRes.id) {
        const list = DataStore.getReturns();
        DataStore.setReturns([serverRes, ...list]);
        return serverRes;
      }
    } catch {
      // fallback
    }
    const list = DataStore.getReturns();
    const item: ReturnExchangeRecord = {
      ...data,
      id: `ret_${Date.now()}`,
      returnNumber: `RET-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${list.length + 1}`,
      date: new Date().toISOString().split('T')[0],
    };
    DataStore.setReturns([item, ...list]);
    return item;
  },
};

export const personalApi = {
  getTransactions: async (): Promise<PersonalTransaction[]> => {
    return DataStore.getPersonalTransactions();
  },
  createTransaction: async (data: Omit<PersonalTransaction, 'id'>): Promise<PersonalTransaction> => {
    const list = DataStore.getPersonalTransactions();
    const item: PersonalTransaction = {
      ...data,
      id: `pt_${Date.now()}`,
    };
    DataStore.setPersonalTransactions([item, ...list]);
    return item;
  },
  deleteTransaction: async (id: string) => {
    const list = DataStore.getPersonalTransactions().filter((t) => t.id !== id);
    DataStore.setPersonalTransactions(list);
  },
};

export const supabaseDebugApi = {
  getStatus: async (): Promise<import('../types/supabaseDebug').SupabaseDebugResponse> => {
    return await apiClient.get<import('../types/supabaseDebug').SupabaseDebugResponse>('/settings/debug-supabase');
  },
};
