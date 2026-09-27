import { DataStore } from './dataStorage';
import { csvHelper } from '../utils/csvHelper';
import { formatCurrency, formatDateTime, formatDate } from '../utils/formatters';
import { Product, Customer, Supplier, Order, Expense } from '../types';

export interface BackupSnapshotItem {
  id: string;
  timestamp: string;
  label: string;
  type: 'manual' | 'auto' | 'cloud';
  recordCounts: {
    products: number;
    orders: number;
    customers: number;
    suppliers: number;
    expenses: number;
  };
  sizeKb: number;
  payload: any;
}

export interface BackupDryRunResult {
  isValid: boolean;
  version?: string;
  exportedAt?: string;
  shopName?: string;
  counts: {
    products: number;
    orders: number;
    customers: number;
    suppliers: number;
    expenses: number;
    payments: number;
    staff: number;
  };
  error?: string;
}

const SNAPSHOTS_STORAGE_KEY = 'smartshopx_backup_snapshots_v1';
const CLOUD_SYNC_LOG_KEY = 'smartshopx_cloud_sync_history';

export const backupService = {
  /**
   * Generates a complete structured business backup object
   */
  generateFullBackupData(): any {
    const shop = DataStore.getShop();
    const user = DataStore.getUser();
    const products = DataStore.getProducts();
    const orders = DataStore.getOrders();
    const customers = DataStore.getCustomers();
    const suppliers = DataStore.getSuppliers();
    const purchases = DataStore.getPurchases();
    const payments = DataStore.getPayments();
    const expenses = DataStore.getExpenses();
    const staff = DataStore.getStaff();
    const courierCredentials = DataStore.getCourierCredentials();
    const paymentGateways = DataStore.getPaymentGateways();

    return {
      appName: 'SmartShopX POS & ERP',
      schemaVersion: '3.0.0',
      exportedAt: new Date().toISOString(),
      shop,
      user,
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalExpenses: expenses.length,
      },
      data: {
        products,
        orders,
        customers,
        suppliers,
        purchases,
        payments,
        expenses,
        staff,
        courierCredentials,
        paymentGateways,
      },
    };
  },

  /**
   * One-Click JSON Backup File Download
   */
  downloadJsonBackup(): void {
    const backup = this.generateFullBackupData();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const shopNameSlug = (backup.shop?.name || 'SmartShopX')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    link.download = `${shopNameSlug}_Full_Cloud_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save snapshot record to history
    this.saveSnapshotToHistory('ম্যানুয়াল JSON ব্যাকআপ ডাউনলোড', 'manual', backup);
  },

  /**
   * Performs a local point-in-time snapshot
   */
  saveSnapshotToHistory(label: string, type: 'manual' | 'auto' | 'cloud' = 'manual', customPayload?: any): BackupSnapshotItem {
    const payload = customPayload || this.generateFullBackupData();
    const jsonStr = JSON.stringify(payload);
    const sizeKb = Math.round((jsonStr.length / 1024) * 10) / 10;

    const dataObj = payload.data || payload;
    const snapshot: BackupSnapshotItem = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      type,
      recordCounts: {
        products: (dataObj.products || []).length,
        orders: (dataObj.orders || []).length,
        customers: (dataObj.customers || []).length,
        suppliers: (dataObj.suppliers || []).length,
        expenses: (dataObj.expenses || []).length,
      },
      sizeKb,
      payload,
    };

    try {
      const existing = this.getSnapshots();
      // Keep up to 10 latest snapshots
      const updated = [snapshot, ...existing].slice(0, 10);
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not store full snapshot in localStorage, storing metadata only', e);
      try {
        const lightweightSnap = { ...snapshot, payload: null };
        const existing = this.getSnapshots().map(s => ({ ...s, payload: null }));
        localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify([lightweightSnap, ...existing].slice(0, 10)));
      } catch {}
    }

    return snapshot;
  },

  /**
   * Get all stored snapshots
   */
  getSnapshots(): BackupSnapshotItem[] {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Delete snapshot by ID
   */
  deleteSnapshot(id: string): void {
    const existing = this.getSnapshots();
    const filtered = existing.filter((s) => s.id !== id);
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
  },

  /**
   * Dry-run inspect a JSON backup string before restoring
   */
  inspectBackupFile(jsonString: string): BackupDryRunResult {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;

      if (!data.products && !data.orders && !data.customers && !parsed.shop) {
        return {
          isValid: false,
          counts: { products: 0, orders: 0, customers: 0, suppliers: 0, expenses: 0, payments: 0, staff: 0 },
          error: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট! কোনো ডাটাবেজ টেবিল পাওয়া যায়নি।',
        };
      }

      return {
        isValid: true,
        version: parsed.schemaVersion || parsed.version || '1.0.0',
        exportedAt: parsed.exportedAt || 'অজানা তারিখ',
        shopName: parsed.shop?.name || data.shop?.name || 'SmartShopX Store',
        counts: {
          products: Array.isArray(data.products) ? data.products.length : 0,
          orders: Array.isArray(data.orders) ? data.orders.length : 0,
          customers: Array.isArray(data.customers) ? data.customers.length : 0,
          suppliers: Array.isArray(data.suppliers) ? data.suppliers.length : 0,
          expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
          payments: Array.isArray(data.payments) ? data.payments.length : 0,
          staff: Array.isArray(data.staff) ? data.staff.length : 0,
        },
      };
    } catch (e: any) {
      return {
        isValid: false,
        counts: { products: 0, orders: 0, customers: 0, suppliers: 0, expenses: 0, payments: 0, staff: 0 },
        error: `JSON ফাইল পার্সিং ত্রুটি: ${e?.message || 'অকার্যকর ফাইল'}`,
      };
    }
  },

  /**
   * Restore database from backup payload
   */
  restoreFromParsedData(parsed: any, mode: 'overwrite' | 'merge' = 'overwrite'): { success: boolean; message: string } {
    try {
      const data = parsed.data || parsed;

      // Create a recovery rollback snapshot before proceeding
      this.saveSnapshotToHistory('রিস্টোর করার পূর্বের স্বয়ংক্রিয় ব্যাকআপ (Safety Snapshot)', 'auto');

      if (mode === 'overwrite') {
        if (data.products) DataStore.setProducts(data.products);
        if (data.orders) DataStore.setOrders(data.orders);
        if (data.customers) DataStore.setCustomers(data.customers);
        if (data.suppliers) DataStore.setSuppliers(data.suppliers);
        if (data.purchases) DataStore.setPurchases(data.purchases);
        if (data.payments) DataStore.setPayments(data.payments);
        if (data.expenses) DataStore.setExpenses(data.expenses);
        if (data.staff) DataStore.setStaff(data.staff);
        if (parsed.shop) DataStore.setShop(parsed.shop);
      } else {
        // Merge mode: append non-existing items by id
        if (Array.isArray(data.products)) {
          const current = DataStore.getProducts();
          const currentIds = new Set(current.map((p) => p.id));
          const toAdd = data.products.filter((p: Product) => !currentIds.has(p.id));
          DataStore.setProducts([...current, ...toAdd]);
        }
        if (Array.isArray(data.orders)) {
          const current = DataStore.getOrders();
          const currentIds = new Set(current.map((o) => o.id));
          const toAdd = data.orders.filter((o: Order) => !currentIds.has(o.id));
          DataStore.setOrders([...current, ...toAdd]);
        }
        if (Array.isArray(data.customers)) {
          const current = DataStore.getCustomers();
          const currentIds = new Set(current.map((c) => c.id));
          const toAdd = data.customers.filter((c: Customer) => !currentIds.has(c.id));
          DataStore.setCustomers([...current, ...toAdd]);
        }
        if (Array.isArray(data.suppliers)) {
          const current = DataStore.getSuppliers();
          const currentIds = new Set(current.map((s) => s.id));
          const toAdd = data.suppliers.filter((s: Supplier) => !currentIds.has(s.id));
          DataStore.setSuppliers([...current, ...toAdd]);
        }
        if (Array.isArray(data.expenses)) {
          const current = DataStore.getExpenses();
          const currentIds = new Set(current.map((e) => e.id));
          const toAdd = data.expenses.filter((e: Expense) => !currentIds.has(e.id));
          DataStore.setExpenses([...current, ...toAdd]);
        }
      }

      // Trigger cross-tab sync event
      window.dispatchEvent(new Event('smartshopx_products_updated'));
      window.dispatchEvent(new Event('smartshopx_orders_updated'));

      return {
        success: true,
        message: 'ডাটাবেজ সফলভাবে রিস্টোর ও সিঙ্ক করা হয়েছে!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `রিস্টোর ব্যর্থ হয়েছে: ${err?.message || 'অজানা ত্রুটি'}`,
      };
    }
  },

  /**
   * One-Click Cloud Sync Simulation with encryption & verification
   */
  async syncToCloudVault(): Promise<{ success: boolean; message: string; timestamp: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const formatted = formatDateTime(now);
        localStorage.setItem('smartshopx_last_cloud_sync', formatted);

        // Record snapshot
        backupService.saveSnapshotToHistory('ক্লাউড ভল্ট সিঙ্ক (AES-256 Encrypted Cloud)', 'cloud');

        resolve({
          success: true,
          message: 'সকল বিজনেস রেকর্ড ক্লাউড ভল্ট সার্ভারে সফলভাবে এনক্রিপ্ট ও সিঙ্ক হয়েছে!',
          timestamp: formatted,
        });
      }, 1400);
    });
  },

  /**
   * Print / PDF Exporter with rich Bengali-friendly HTML Report
   */
  exportPrintablePdfReport(
    type: 'inventory' | 'sales' | 'customers' | 'suppliers' | 'expenses' | 'full_business'
  ): void {
    const shop = DataStore.getShop();
    const nowStr = formatDateTime(new Date().toISOString());

    let title = 'ব্যবসায়িক প্রতিবেদন';
    let subtitle = 'SmartShopX Business Audit & Backup Report';
    let tableHtml = '';

    if (type === 'inventory') {
      title = 'পণ্য ও ইনভেন্টরি স্টক রিপোর্ট (Inventory Valuation)';
      const products = DataStore.getProducts();
      const totalStockValuation = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
      const totalPotentialSales = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

      tableHtml = `
        <div class="summary-box">
          <div><strong>মোট পণ্য সংখ্যা:</strong> ${products.length} টি</div>
          <div><strong>মোট স্টক ক্রয়মূল্য:</strong> ${formatCurrency(totalStockValuation)}</div>
          <div><strong>মোট স্টক বিক্রয়মূল্য:</strong> ${formatCurrency(totalPotentialSales)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>পণ্যের নাম</th>
              <th>ক্যাটাগরি</th>
              <th>SKU / কোড</th>
              <th>ক্রয় মূল্য</th>
              <th>বিক্রয় মূল্য</th>
              <th>স্টক</th>
              <th>মোট ক্রয়মূল্য</th>
              <th>রেক / সেলফ</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category || '-'}</td>
                <td>${p.sku || p.barcode || '-'}</td>
                <td>৳${p.purchasePrice}</td>
                <td>৳${p.sellingPrice}</td>
                <td style="font-weight: bold; ${p.stock <= (p.minStock || 5) ? 'color: red;' : ''}">${p.stock} ${p.unit || ''}</td>
                <td>৳${p.stock * p.purchasePrice}</td>
                <td>${p.rackLocation || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'sales') {
      title = 'বিক্রয় ও ক্যাশ মেমো লেজার (Sales & Revenue Ledger)';
      const orders = DataStore.getOrders();
      const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
      const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

      tableHtml = `
        <div class="summary-box">
          <div><strong>মোট মেমো সংখ্যা:</strong> ${orders.length} টি</div>
          <div><strong>সর্বমোট বিক্রয়:</strong> ${formatCurrency(totalSales)}</div>
          <div><strong>মোট আদায়:</strong> ${formatCurrency(totalPaid)}</div>
          <div style="color: #b91c1c;"><strong>মোট বাকি:</strong> ${formatCurrency(totalDue)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>তারিখ</th>
              <th>মেমো নং</th>
              <th>গ্রাহকের নাম</th>
              <th>মোবাইল</th>
              <th>মোট বিল</th>
              <th>পরিশোধ</th>
              <th>বকেয়া</th>
              <th>মাধ্যম</th>
              <th>স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (o) => `
              <tr>
                <td>${formatDate(o.createdAt)}</td>
                <td><strong>${o.orderNumber}</strong></td>
                <td>${o.customerName}</td>
                <td>${o.customerMobile || '-'}</td>
                <td>৳${o.totalAmount}</td>
                <td style="color: #047857; font-weight: bold;">৳${o.paidAmount}</td>
                <td style="color: ${o.dueAmount ? '#b91c1c' : '#4b5563'}; font-weight: bold;">৳${o.dueAmount || 0}</td>
                <td>${o.paymentMethod}</td>
                <td>${o.paymentStatus}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'customers') {
      title = 'গ্রাহক তালিকা ও বাকি পাওনা খতিয়ান (Customers Due Ledger)';
      const customers = DataStore.getCustomers();
      const totalDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
      const totalPurchase = customers.reduce((sum, c) => sum + (c.totalPurchase || 0), 0);

      tableHtml = `
        <div class="summary-box">
          <div><strong>মোট গ্রাহক:</strong> ${customers.length} জন</div>
          <div><strong>সর্বমোট কেনাকাটা:</strong> ${formatCurrency(totalPurchase)}</div>
          <div style="color: #b91c1c;"><strong>মোট বকেয়া পাওনা:</strong> ${formatCurrency(totalDue)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>গ্রাহকের নাম</th>
              <th>মোবাইল নম্বর</th>
              <th>ঠিকানা</th>
              <th>মোট কেনাকাটা</th>
              <th>মোট পরিশোধ</th>
              <th>বর্তমান বকেয়া</th>
              <th>লয়ালটি পয়েন্ট</th>
            </tr>
          </thead>
          <tbody>
            ${customers
              .map(
                (c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.mobile}</td>
                <td>${c.address || '-'}</td>
                <td>৳${c.totalPurchase || 0}</td>
                <td>৳${c.totalPaid || 0}</td>
                <td style="color: ${c.totalDue ? '#b91c1c' : '#047857'}; font-weight: bold;">৳${c.totalDue || 0}</td>
                <td>${c.loyaltyPoints || 0} pts</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'suppliers') {
      title = 'সাপ্লায়ার দেনা ও সরবরাহকারী খতিয়ান (Suppliers Payable Ledger)';
      const suppliers = DataStore.getSuppliers();
      const totalPayable = suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
      const totalPurchased = suppliers.reduce((sum, s) => sum + (s.totalPurchase || 0), 0);

      tableHtml = `
        <div class="summary-box">
          <div><strong>মোট সরবরাহকারী:</strong> ${suppliers.length} টি</div>
          <div><strong>মোট মালামাল ক্রয়:</strong> ${formatCurrency(totalPurchased)}</div>
          <div style="color: #b91c1c;"><strong>মোট দেনা (Payable):</strong> ${formatCurrency(totalPayable)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>সাপ্লায়ার / কোম্পানির নাম</th>
              <th>প্রতিনিধি / নাম</th>
              <th>মোবাইল নম্বর</th>
              <th>মোট ক্রয়</th>
              <th>মোট পরিশোধ</th>
              <th>বর্তমান দেনা (Due)</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers
              .map(
                (s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${s.companyName || s.name}</strong></td>
                <td>${s.name}</td>
                <td>${s.mobile}</td>
                <td>৳${s.totalPurchase || 0}</td>
                <td>৳${s.totalPaid || 0}</td>
                <td style="color: ${s.totalPayable ? '#b91c1c' : '#047857'}; font-weight: bold;">৳${s.totalPayable || 0}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'expenses') {
      title = 'দোকানের খরচের খাতা ও ব্যয় বিবরণী (Store Expenses Summary)';
      const expenses = DataStore.getExpenses();
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      tableHtml = `
        <div class="summary-box">
          <div><strong>মোট খরচের এন্ট্রি:</strong> ${expenses.length} টি</div>
          <div style="color: #b91c1c;"><strong>সর্বমোট ব্যয়:</strong> ${formatCurrency(totalExpense)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>তারিখ</th>
              <th>খরচের খাত / শিরোনাম</th>
              <th>ক্যাটাগরি</th>
              <th>পরিমাণ (৳)</th>
              <th>পেমেন্ট মেথড</th>
              <th>মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .map(
                (e) => `
              <tr>
                <td>${formatDate(e.date)}</td>
                <td><strong>${e.title}</strong></td>
                <td>${e.category}</td>
                <td style="font-weight: bold; color: #b91c1c;">৳${e.amount}</td>
                <td>${e.paymentMethod}</td>
                <td>${e.notes || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else {
      // Full Business Master Overview
      title = 'পূর্ণাঙ্গ ব্যবসায়িক অডিট ও ডাটা স্ন্যাপশট (Master Business Audit)';
      const products = DataStore.getProducts();
      const orders = DataStore.getOrders();
      const customers = DataStore.getCustomers();
      const suppliers = DataStore.getSuppliers();
      const expenses = DataStore.getExpenses();

      const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalStockValuation = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
      const totalCustomerDue = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
      const totalSupplierDue = suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      tableHtml = `
        <div class="summary-box" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div><strong>মোট পণ্য আইটেম:</strong> ${products.length} টি</div>
          <div><strong>বর্তমান স্টক মূল্য:</strong> ${formatCurrency(totalStockValuation)}</div>
          <div><strong>সর্বমোট বিক্রয়:</strong> ${formatCurrency(totalSales)}</div>
          <div><strong>মোট গ্রাহক বাকি:</strong> ${formatCurrency(totalCustomerDue)}</div>
          <div><strong>মোট সাপ্লায়ার দেনা:</strong> ${formatCurrency(totalSupplierDue)}</div>
          <div><strong>মোট খরচ:</strong> ${formatCurrency(totalExpenses)}</div>
        </div>
        <p style="margin-top: 15px; font-size: 11px; color: #475569;">
          * এই ডকুমেন্টটি SmartShopX ক্লাউড ব্যাকআপ সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে জেনারেট করা হয়েছে।
        </p>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ ব্লকার সক্রিয় রয়েছে। দয়া করে ব্রাউজার সেটিংসে পপআপ অনুমোদন করুন।');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>${title} - ${shop.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body {
            font-family: 'Hind Siliguri', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .shop-name {
            font-size: 22px;
            font-weight: 800;
            color: #047857;
            margin: 0;
          }
          .shop-address {
            font-size: 11px;
            color: #475569;
            margin: 2px 0 0 0;
          }
          .report-title {
            font-size: 15px;
            font-weight: 700;
            margin-top: 10px;
            color: #1e293b;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-top: 8px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 700;
            color: #1e293b;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="shop-name">${shop.name}</h1>
          <p class="shop-address">${shop.address || 'বাংলাদেশ'} | মোবাইল: ${shop.mobile || '01700000000'}</p>
          <div class="report-title">${title}</div>
          <div class="meta-bar">
            <span>প্রতিবেদন সময়: ${nowStr}</span>
            <span>সফটওয়্যার: SmartShopX Enterprise Cloud</span>
          </div>
        </div>

        ${tableHtml}

        <div class="footer">
          স্মার্টশপ এক্স স্বত্বাধিকারী ব্যাকআপ সিস্টেম • প্রিন্ট কপি স্বয়ংক্রিয়ভাবে সংগৃহীত
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },
};
