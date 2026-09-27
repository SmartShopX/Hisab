import { CartItem, Order, Customer, PaymentMethod } from '../types';
import { DataStore } from './dataStorage';

export interface CompletePosSalePayload {
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const salesService = {
  async completePosSale(payload: CompletePosSalePayload): Promise<Order> {
    // API endpoint: POST /api/v1/pos/checkout
    await new Promise((resolve) => setTimeout(resolve, 400));

    const orders = DataStore.getOrders();
    const products = DataStore.getProducts();
    const customers = DataStore.getCustomers();
    const movements = DataStore.getStockMovements();
    const payments = DataStore.getPayments();

    const orderNumber = `SX-POS-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customerId: payload.customer.id,
      customerName: payload.customer.name,
      customerMobile: payload.customer.mobile,
      customerAddress: payload.customer.address,
      items: payload.items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        selectedUnit: it.selectedUnit || (it.product.unit ? it.product.unit : 'Pcs'),
        genericName: it.product.genericName,
        rackLocation: it.product.rackLocation,
      })),
      subtotal: payload.subtotal,
      discount: payload.discount,
      deliveryCharge: 0,
      totalAmount: payload.total,
      paidAmount: payload.paidAmount,
      dueAmount: payload.dueAmount,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.dueAmount <= 0 ? 'Paid' : payload.paidAmount > 0 ? 'Partially Paid' : 'Pending',
      orderStatus: 'Delivered',
      channel: 'POS',
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Save new Order
    DataStore.setOrders([newOrder, ...orders]);

    // 2. Deduct inventory & create stock movements
    payload.items.forEach((item) => {
      const prodIndex = products.findIndex((p) => p.id === item.product.id);
      if (prodIndex !== -1) {
        const prevStock = products[prodIndex].stock;
        const multiplier = item.unitMultiplier || 1;
        const totalUnitsDeducted = item.quantity * multiplier;
        const newStock = Math.max(0, prevStock - totalUnitsDeducted);
        products[prodIndex].stock = newStock;

        movements.unshift({
          id: `sm_${Date.now()}_${item.product.id}`,
          productId: item.product.id,
          productName: item.product.name,
          type: 'SALE',
          quantity: totalUnitsDeducted,
          previousStock: prevStock,
          newStock,
          reason: `POS Sale: ${orderNumber} (${item.quantity} ${item.selectedUnit || 'Pcs'})`,
          createdAt: new Date().toLocaleString('en-US'),
        });
      }
    });
    DataStore.setProducts([...products]);
    DataStore.setStockMovements([...movements]);

    // 3. Update customer stats & digital ledger
    const custIndex = customers.findIndex((c) => c.id === payload.customer.id);
    if (custIndex !== -1) {
      customers[custIndex].totalPurchase += payload.total;
      customers[custIndex].totalPaid += payload.paidAmount;
      customers[custIndex].totalDue += payload.dueAmount;
      customers[custIndex].ordersCount += 1;
      customers[custIndex].lastOrderDate = new Date().toISOString().split('T')[0];

      if (payload.dueAmount > 0 && !customers[custIndex].oldestDueDays) {
        customers[custIndex].oldestDueDays = 1;
      }

      if (!customers[custIndex].ledger) {
        customers[custIndex].ledger = [];
      }

      customers[custIndex].ledger.unshift({
        id: `led_${Date.now()}_sale`,
        date: new Date().toISOString().split('T')[0],
        type: 'Sale',
        referenceId: orderNumber,
        debit: payload.total,
        credit: payload.paidAmount,
        discount: payload.discount > 0 ? payload.discount : undefined,
        balance: customers[custIndex].totalDue,
        method: payload.paymentMethod,
        notes: `বিক্রয় মেমো #${orderNumber}${payload.dueAmount > 0 ? ` (বকেয়া: ৳${payload.dueAmount})` : ''}`,
      });

      DataStore.setCustomers([...customers]);
    }

    // 4. Record payment transaction if paid > 0
    if (payload.paidAmount > 0) {
      payments.unshift({
        id: `pay_${Date.now()}`,
        transactionId: `TXN-POS-${Date.now().toString().slice(-5)}`,
        orderId: newOrder.id,
        customerOrSupplierName: payload.customer.name,
        type: 'Customer Payment',
        amount: payload.paidAmount,
        method: payload.paymentMethod,
        status: 'Paid',
        date: new Date().toLocaleString('en-US'),
        notes: `POS বিক্রয় পেমেন্ট: ${orderNumber}`,
      });
      DataStore.setPayments([...payments]);
    }

    return newOrder;
  },

  async getSalesStats() {
    // API endpoint: GET /api/v1/sales/stats
    await new Promise((resolve) => setTimeout(resolve, 200));
    const orders = DataStore.getOrders();
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  },
};
