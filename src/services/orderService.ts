import { Order, OrderStatus, PaymentStatus, IncompleteOrder, PaymentMethod } from '../types';
import { DataStore } from './dataStorage';

export const orderService = {
  async getOrders(params?: {
    search?: string;
    status?: string;
    date?: string;
    channel?: string;
  }): Promise<Order[]> {
    // API endpoint: GET /api/v1/orders
    await new Promise((resolve) => setTimeout(resolve, 250));
    let list = DataStore.getOrders();

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerMobile.includes(q) ||
          (o.courierTrackingCode && o.courierTrackingCode.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter((o) => o.orderStatus === params.status);
    }

    if (params?.channel && params.channel !== 'all') {
      list = list.filter((o) => o.channel === params.channel);
    }

    return list;
  },

  async updateOrderStatus(id: string, newStatus: OrderStatus, user?: string, note?: string): Promise<Order> {
    // API endpoint: PUT /api/v1/orders/:id/status
    await new Promise((resolve) => setTimeout(resolve, 200));
    const orders = DataStore.getOrders();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('অর্ডারটি পাওয়া যায়নি');

    const targetOrder = orders[index];
    const previousStatus = targetOrder.orderStatus;
    targetOrder.orderStatus = newStatus;

    if (newStatus === 'Delivered') {
      targetOrder.paymentStatus = 'Paid';
      targetOrder.paidAmount = targetOrder.totalAmount;
      targetOrder.dueAmount = 0;
    }

    // Record audit timeline
    const timelineEntry = {
      id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: newStatus,
      action: `স্ট্যাটাস পরিবর্তন: ${previousStatus} ➔ ${newStatus}`,
      timestamp: new Date().toISOString(),
      user: user || 'অপারেটর',
      note: note || '',
    };
    targetOrder.timeline = [timelineEntry, ...(targetOrder.timeline || [])];

    // --- Inventory Synchronization & Duplicate Action Protection ---
    const isConfirmedState = ['Confirmed', 'Processing', 'Packed', 'Courier Assigned', 'Shipped', 'Delivered'].includes(newStatus);
    const isCancelledOrReturnedState = newStatus === 'Cancelled' || newStatus === 'Returned';

    // 1. Decrement inventory on Order Confirmation (only once)
    if (isConfirmedState && !targetOrder.stockAdjusted) {
      const products = DataStore.getProducts();
      let hasModifiedProducts = false;

      for (const item of targetOrder.items || []) {
        const prodIdx = products.findIndex((p) => p.id === item.productId);
        if (prodIdx !== -1) {
          const prevStock = products[prodIdx].stock;
          const deductedStock = Math.max(0, prevStock - item.quantity);
          products[prodIdx] = {
            ...products[prodIdx],
            stock: deductedStock,
          };
          hasModifiedProducts = true;

          // Record stock log
          const existingLogs = DataStore.getStockLogs();
          DataStore.setStockLogs([
            {
              id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              productId: item.productId,
              productName: item.productName,
              type: 'Stock Out',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock: deductedStock,
              reason: `অর্ডার নিশ্চিতকরণ (${targetOrder.orderNumber})`,
              createdAt: new Date().toISOString(),
            },
            ...existingLogs,
          ]);
        }
      }

      if (hasModifiedProducts) {
        DataStore.setProducts(products);
      }
      targetOrder.stockAdjusted = true;
    }

    // 2. Restore inventory on Order Cancellation or Return (only if previously deducted)
    if (isCancelledOrReturnedState && targetOrder.stockAdjusted) {
      const products = DataStore.getProducts();
      let hasModifiedProducts = false;

      for (const item of targetOrder.items || []) {
        const prodIdx = products.findIndex((p) => p.id === item.productId);
        if (prodIdx !== -1) {
          const prevStock = products[prodIdx].stock;
          const restoredStock = prevStock + item.quantity;
          products[prodIdx] = {
            ...products[prodIdx],
            stock: restoredStock,
          };
          hasModifiedProducts = true;

          // Record stock log
          const existingLogs = DataStore.getStockLogs();
          DataStore.setStockLogs([
            {
              id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              productId: item.productId,
              productName: item.productName,
              type: 'Stock In',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock: restoredStock,
              reason: `অর্ডার ${newStatus === 'Returned' ? 'রিটার্ন' : 'বাতিল'}পূর্বক স্টক ফেরত (${targetOrder.orderNumber})`,
              createdAt: new Date().toISOString(),
            },
            ...existingLogs,
          ]);
        }
      }

      if (hasModifiedProducts) {
        DataStore.setProducts(products);
      }
      targetOrder.stockAdjusted = false;
    }

    DataStore.setOrders([...orders]);
    return orders[index];
  },

  async bulkUpdateStatus(
    orderIds: string[],
    newStatus: OrderStatus,
    user?: string
  ): Promise<{ updatedCount: number; orders: Order[] }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const allOrders = DataStore.getOrders();
    const updatedOrders: Order[] = [];

    for (const id of orderIds) {
      const idx = allOrders.findIndex((o) => o.id === id);
      if (idx !== -1) {
        const ord = allOrders[idx];
        const prev = ord.orderStatus;
        ord.orderStatus = newStatus;
        if (newStatus === 'Delivered') {
          ord.paymentStatus = 'Paid';
          ord.paidAmount = ord.totalAmount;
          ord.dueAmount = 0;
        }

        const tl = {
          id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: newStatus,
          action: `বাল্ক স্ট্যাটাস আপডেট: ${prev} ➔ ${newStatus}`,
          timestamp: new Date().toISOString(),
          user: user || 'অ্যাডমিন (Bulk)',
        };
        ord.timeline = [tl, ...(ord.timeline || [])];
        updatedOrders.push(ord);
      }
    }

    DataStore.setOrders([...allOrders]);
    return { updatedCount: updatedOrders.length, orders: allOrders };
  },

  async recordAdvanceDeliveryCharge(
    orderId: string,
    amount: number,
    method: PaymentMethod,
    trxId: string,
    user?: string
  ): Promise<Order> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const orders = DataStore.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('অর্ডারটি পাওয়া যায়নি');

    const ord = orders[index];
    ord.advanceDeliveryChargePaid = (ord.advanceDeliveryChargePaid || 0) + amount;
    ord.advancePaymentMethod = method;
    ord.advancePaymentTrxId = trxId;

    ord.paidAmount = (ord.paidAmount || 0) + amount;
    ord.dueAmount = Math.max(0, ord.totalAmount - ord.paidAmount);
    if (ord.dueAmount === 0) {
      ord.paymentStatus = 'Paid';
    } else if (ord.paidAmount > 0) {
      ord.paymentStatus = 'Partially Paid';
    }

    // Timeline
    ord.timeline = [
      {
        id: `tl_${Date.now()}`,
        status: ord.orderStatus,
        action: `অগ্রিম ডেলিভারি চার্জ আদায়: ৳${amount} (${method}, Trx: ${trxId || 'N/A'})`,
        timestamp: new Date().toISOString(),
        user: user || 'অপারেটর',
      },
      ...(ord.timeline || []),
    ];

    DataStore.setOrders([...orders]);
    return ord;
  },

  getCustomerDeliveryStats(mobile: string) {
    if (!mobile) return { total: 0, delivered: 0, returned: 0, cancelled: 0, successRate: 100, risk: 'Low' as const, label: 'নতুন ক্রেতা' };
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const orders = DataStore.getOrders().filter((o) => {
      const om = o.customerMobile?.replace(/[^0-9]/g, '');
      return om && (om === cleanMobile || om.endsWith(cleanMobile.slice(-10)));
    });

    const customers = DataStore.getCustomers().filter((c) => {
      const cm = c.mobile?.replace(/[^0-9]/g, '');
      return cm && (cm === cleanMobile || cm.endsWith(cleanMobile.slice(-10)));
    });

    let delivered = orders.filter((o) => o.orderStatus === 'Delivered').length;
    let returned = orders.filter((o) => o.orderStatus === 'Returned').length;
    let cancelled = orders.filter((o) => o.orderStatus === 'Cancelled').length;
    let total = orders.length;

    // Supplement from Customer records if present
    if (customers.length > 0) {
      const cust = customers[0];
      if (cust.ordersDelivered) delivered = Math.max(delivered, cust.ordersDelivered);
      if (cust.ordersReturned) returned = Math.max(returned, cust.ordersReturned);
      if (cust.ordersCancelled) cancelled = Math.max(cancelled, cust.ordersCancelled);
      if (cust.ordersCount) total = Math.max(total, cust.ordersCount);
    }

    if (total === 0) {
      return {
        total: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        successRate: 100,
        risk: 'Low' as const,
        label: 'নতুন গ্রাহক (1st Order)',
      };
    }

    const calculatedSuccessRate = Math.round((delivered / (total || 1)) * 100);
    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    let label = 'বিশ্বস্ত গ্রাহক (High Trust)';

    if (returned >= 2 || (total >= 2 && calculatedSuccessRate < 50)) {
      risk = 'High';
      label = 'উচ্চ ঝুঁকি (High Return Risk)';
    } else if (returned === 1 || calculatedSuccessRate < 80) {
      risk = 'Medium';
      label = 'সতর্কতা (Moderate Risk)';
    }

    return {
      total,
      delivered,
      returned,
      cancelled,
      successRate: calculatedSuccessRate,
      risk,
      label,
    };
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paidAmount?: number): Promise<Order> {
    // API endpoint: PUT /api/v1/orders/:id/payment
    await new Promise((resolve) => setTimeout(resolve, 250));
    const orders = DataStore.getOrders();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('অর্ডারটি পাওয়া যায়নি');

    const order = orders[index];
    order.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) {
      order.paidAmount = paidAmount;
      order.dueAmount = Math.max(0, order.totalAmount - paidAmount);
    }
    DataStore.setOrders([...orders]);
    return order;
  },

  async assignCourier(
    id: string,
    courierName: string,
    trackingCode: string
  ): Promise<Order> {
    // API endpoint: POST /api/v1/orders/:id/courier
    await new Promise((resolve) => setTimeout(resolve, 300));
    const orders = DataStore.getOrders();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('অর্ডারটি পাওয়া যায়নি');

    orders[index].courierName = courierName;
    orders[index].courierTrackingCode = trackingCode;
    orders[index].orderStatus = 'Courier Assigned';
    DataStore.setOrders([...orders]);

    // Also add to Courier table
    const courierOrders = DataStore.getCourierOrders();
    const existingIdx = courierOrders.findIndex((c) => c.orderId === id);
    const courierEntry = {
      id: `courier_${Date.now()}`,
      orderId: orders[index].id,
      orderNumber: orders[index].orderNumber,
      customerName: orders[index].customerName,
      customerMobile: orders[index].customerMobile,
      courierProvider: courierName as any,
      trackingNumber: trackingCode,
      codAmount: orders[index].dueAmount,
      deliveryStatus: 'In Transit' as const,
      lastUpdated: new Date().toLocaleString('en-US'),
    };

    if (existingIdx !== -1) {
      courierOrders[existingIdx] = courierEntry;
    } else {
      courierOrders.unshift(courierEntry);
    }
    DataStore.setCourierOrders([...courierOrders]);

    return orders[index];
  },

  async getIncompleteOrders(): Promise<IncompleteOrder[]> {
    // API endpoint: GET /api/v1/orders/incomplete
    await new Promise((resolve) => setTimeout(resolve, 200));
    return DataStore.getIncompleteOrders();
  },

  async updateIncompleteOrderStatus(
    id: string,
    status: 'Abandoned' | 'Followed-Up' | 'Converted',
    notes?: string
  ): Promise<IncompleteOrder> {
    // API endpoint: PUT /api/v1/orders/incomplete/:id
    await new Promise((resolve) => setTimeout(resolve, 200));
    const list = DataStore.getIncompleteOrders();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('রেকর্ডটি পাওয়া যায়নি');

    list[idx].status = status;
    if (notes) list[idx].notes = notes;
    DataStore.setIncompleteOrders([...list]);
    return list[idx];
  },
};
