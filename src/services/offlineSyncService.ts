import { CompletePosSalePayload, salesService } from './salesService';
import { Order, Customer, Product } from '../types';
import { DataStore } from './dataStorage';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface QueuedSale {
  id: string;
  payload: CompletePosSalePayload;
  queuedAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  error?: string;
  customerName?: string;
  itemCount?: number;
  totalAmount?: number;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentItemName?: string;
}

const STORAGE_KEY = 'smartshopx_offline_sales_queue';
const LAST_SYNC_KEY = 'smartshopx_last_cloud_sync';
const SIMULATED_OFFLINE_KEY = 'smartshopx_simulated_offline';

class OfflineSyncService {
  private syncState: SyncState = 'synced';
  private syncProgress: SyncProgress = { current: 0, total: 0 };
  private isProcessingSync = false;
  private lastSyncedTime: string = '';

  constructor() {
    this.lastSyncedTime = this.getLastSyncTime();
    this.updateInitialState();
    this.setupListeners();
  }

  private updateInitialState() {
    if (!this.isOnline()) {
      this.syncState = 'offline';
    } else if (this.getPendingCount() > 0) {
      this.syncState = 'synced';
    } else {
      this.syncState = 'synced';
    }
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });
  }

  public isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    const isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    if (isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public toggleOfflineSimulation(forceOffline?: boolean): boolean {
    const current = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    const next = forceOffline !== undefined ? forceOffline : !current;
    if (next) {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, 'true');
      this.handleNetworkChange(false);
    } else {
      localStorage.removeItem(SIMULATED_OFFLINE_KEY);
      this.handleNetworkChange(true);
    }
    this.notifyStateChanged();
    return next;
  }

  public isSimulatingOffline(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  }

  public getSyncState(): SyncState {
    if (!this.isOnline()) return 'offline';
    return this.syncState;
  }

  public getSyncProgress(): SyncProgress {
    return this.syncProgress;
  }

  public getLastSyncTime(): string {
    if (typeof window === 'undefined') return 'এইমাত্র';
    return localStorage.getItem(LAST_SYNC_KEY) || 'এইমাত্র';
  }

  public setLastSyncTime(timeStr?: string) {
    const formatted = timeStr || new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    this.lastSyncedTime = formatted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_SYNC_KEY, formatted);
    }
    this.notifyStateChanged();
  }

  public getQueue(): QueuedSale[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === 'PENDING').length;
  }

  public getPendingTotalAmount(): number {
    return this.getQueue()
      .filter((q) => q.status === 'PENDING')
      .reduce((sum, item) => sum + (item.totalAmount || item.payload.total || 0), 0);
  }

  public subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('smartshopx_offline_queue_updated', handler);
    window.addEventListener('smartshopx_sync_status_changed', handler);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('smartshopx_offline_queue_updated', handler);
      window.removeEventListener('smartshopx_sync_status_changed', handler);
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }

  private notifyStateChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smartshopx_sync_status_changed', {
          detail: {
            state: this.getSyncState(),
            progress: this.syncProgress,
            pendingCount: this.getPendingCount(),
            lastSyncTime: this.lastSyncedTime,
            isOnline: this.isOnline(),
          },
        })
      );
    }
  }

  public saveQueue(queue: QueuedSale[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_offline_queue_updated'));
    }
    this.notifyStateChanged();
  }

  public enqueueSale(payload: CompletePosSalePayload): QueuedSale {
    const queue = this.getQueue();
    const itemCount = payload.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || payload.items?.length || 1;
    const totalAmount = payload.total ?? 0;

    const item: QueuedSale = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payload,
      queuedAt: new Date().toISOString(),
      status: 'PENDING',
      customerName: payload.customer?.name || 'সাধারণ কাস্টমার',
      itemCount,
      totalAmount,
    };

    queue.unshift(item); // Recent first
    this.saveQueue(queue);

    // If online, auto sync immediately
    if (this.isOnline()) {
      setTimeout(() => this.syncAllPending(), 300);
    }

    return item;
  }

  /**
   * Helper to generate a demo offline sale to test synchronization
   */
  public enqueueSampleOfflineSale(): QueuedSale {
    const existingCustomers = DataStore.getCustomers();
    const existingProducts = DataStore.getProducts();

    const sampleCustomer: Customer = existingCustomers[0] || {
      id: 'cust_sample',
      name: 'আব্দুল করিম (নমুনা কাস্টমার)',
      mobile: '01711-223344',
      address: 'মিরপুর, ঢাকা',
      totalPurchase: 0,
      totalPaid: 0,
      totalDue: 0,
      ordersCount: 0,
      loyaltyPoints: 0,
      riskLevel: 'Low',
      deliverySuccessRate: 100,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersReturned: 0,
      createdAt: new Date().toISOString(),
    };

    const prod1 = existingProducts[0] || {
      id: 'prod_demo_1',
      name: 'প্যারাসিটামল ৫০০ মিগ্রা',
      sku: 'SKU-001',
      barcode: '8901234567890',
      category: 'Medicine',
      brand: 'Square',
      purchasePrice: 10,
      sellingPrice: 15,
      discount: 0,
      stock: 100,
      minStock: 10,
      unit: 'Pcs',
      description: 'জর ও ব্যথানাশক',
      image: '',
      isActive: true,
      onlineStoreVisible: true,
      createdAt: new Date().toISOString(),
    };

    const samplePayload: CompletePosSalePayload = {
      customer: sampleCustomer,
      items: [
        {
          product: prod1,
          quantity: 2,
          unitPrice: prod1.sellingPrice,
          discount: 0,
          total: prod1.sellingPrice * 2,
          selectedUnit: 'Pcs',
        },
      ],
      subtotal: prod1.sellingPrice * 2,
      discount: 0,
      total: prod1.sellingPrice * 2,
      paidAmount: prod1.sellingPrice * 2,
      dueAmount: 0,
      paymentMethod: 'Cash',
      notes: 'অফলাইন টেস্ট ট্রানজেকশন',
    };

    return this.enqueueSale(samplePayload);
  }

  public async syncAllPending(): Promise<{ synced: number; failed: number; orders: Order[] }> {
    if (this.isProcessingSync) {
      return { synced: 0, failed: 0, orders: [] };
    }

    if (!this.isOnline()) {
      this.syncState = 'offline';
      this.notifyStateChanged();
      return { synced: 0, failed: 0, orders: [] };
    }

    const queue = this.getQueue();
    const pending = queue.filter((q) => q.status === 'PENDING');
    
    if (pending.length === 0) {
      this.syncState = 'synced';
      this.setLastSyncTime();
      this.notifyStateChanged();
      return { synced: 0, failed: 0, orders: [] };
    }

    this.isProcessingSync = true;
    this.syncState = 'syncing';
    this.syncProgress = { current: 0, total: pending.length, currentItemName: '' };
    this.notifyStateChanged();

    let syncedCount = 0;
    let failedCount = 0;
    const syncedOrders: Order[] = [];

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      this.syncProgress = {
        current: i + 1,
        total: pending.length,
        currentItemName: `${item.customerName || 'অর্ডার'} (৳${item.totalAmount || 0})`,
      };
      this.notifyStateChanged();

      // Small artificial delay for visual feedback on fast networks
      await new Promise((resolve) => setTimeout(resolve, 350));

      try {
        const order = await salesService.completePosSale({
          ...item.payload,
          notes: item.payload.notes
            ? `${item.payload.notes} [অফলাইনে সংরক্ষিত ও সিঙ্ককৃত]`
            : '[অফলাইনে সংরক্ষিত ও সিঙ্ককৃত]',
        });
        
        // Find and update item status in original queue
        const targetIndex = queue.findIndex((q) => q.id === item.id);
        if (targetIndex !== -1) {
          queue[targetIndex].status = 'SYNCED';
        }
        syncedCount++;
        syncedOrders.push(order);
      } catch (err: any) {
        const targetIndex = queue.findIndex((q) => q.id === item.id);
        if (targetIndex !== -1) {
          queue[targetIndex].status = 'FAILED';
          queue[targetIndex].error = err?.message || 'সিঙ্ক ব্যর্থ হয়েছে';
        }
        failedCount++;
      }
    }

    // Keep recent synced items (last 30) plus any failed/pending items
    const syncedItems = queue.filter((q) => q.status === 'SYNCED').slice(0, 30);
    const uncompletedItems = queue.filter((q) => q.status !== 'SYNCED');
    const finalQueue = [...uncompletedItems, ...syncedItems];

    this.saveQueue(finalQueue);
    this.isProcessingSync = false;

    if (failedCount > 0 && syncedCount === 0) {
      this.syncState = 'error';
    } else {
      this.syncState = 'synced';
      this.setLastSyncTime();
    }

    this.syncProgress = { current: syncedCount, total: pending.length };
    this.notifyStateChanged();

    return {
      synced: syncedCount,
      failed: failedCount,
      orders: syncedOrders,
    };
  }

  public clearSynced() {
    const queue = this.getQueue().filter((q) => q.status !== 'SYNCED');
    this.saveQueue(queue);
  }

  public retryFailed() {
    const queue = this.getQueue().map((item) => {
      if (item.status === 'FAILED') {
        return { ...item, status: 'PENDING' as const, error: undefined };
      }
      return item;
    });
    this.saveQueue(queue);
    this.syncAllPending();
  }

  private handleNetworkChange(isOnlineNow: boolean) {
    if (!isOnlineNow) {
      this.syncState = 'offline';
      this.notifyStateChanged();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('smartshopx_toast', {
            detail: {
              message: 'ইন্টারনেট সংযোগ বিচ্ছিন্ন! অফলাইন মোড সক্রিয় — পিওএস বিক্রয় ডিভাইসে নিরাপদ থাকবে।',
              type: 'warning',
            },
          })
        );
      }
    } else {
      // Coming back online!
      const pendingCount = this.getPendingCount();
      console.log(`[OfflineSync] Connection restored. Pending items to sync: ${pendingCount}`);

      if (pendingCount > 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('smartshopx_toast', {
              detail: {
                message: `ইন্টারনেট পুনঃসংযোগ পাওয়া গেছে! ${pendingCount} টি অফলাইন বিক্রয় ক্লাউডে সিঙ্ক করা হচ্ছে...`,
                type: 'info',
              },
            })
          );
        }

        // Trigger sync automatically
        this.syncAllPending().then((res) => {
          if (res.synced > 0) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('smartshopx_toast', {
                  detail: {
                    message: `সিঙ্ক সম্পন্ন! ${res.synced} টি অফলাইন বিক্রয় ক্লাউড ডাটাবেজে সফলভাবে যুক্ত হয়েছে।`,
                    type: 'success',
                  },
                })
              );
            }
          }
        });
      } else {
        this.syncState = 'synced';
        this.setLastSyncTime();
        this.notifyStateChanged();
      }
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
