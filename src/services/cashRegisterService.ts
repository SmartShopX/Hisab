import { DataStore } from './dataStorage';
import { Order, PaymentTransaction } from '../types';

export interface CashRegisterClosing {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string;
  closedBy: string;
  openingCash: number;
  cashSales: number;
  digitalSales: number; // bKash, Nagad, Card
  cashDueCollected: number;
  cashExpenses: number;
  expectedDrawerCash: number;
  physicalDrawerCash: number;
  difference: number; // physical - expected
  status: 'BALANCED' | 'SHORTAGE' | 'EXCESS';
  totalSalesAmount: number;
  estimatedCostOfGoods: number;
  grossProfit: number;
  netProfit: number;
  note?: string;
  breakdown: {
    ordersCount: number;
    cashOrdersCount: number;
    digitalOrdersCount: number;
  };
}

const CLOSINGS_STORAGE_KEY = 'smartshopx_cash_closings';

export const cashRegisterService = {
  getClosingHistory(): CashRegisterClosing[] {
    try {
      const data = localStorage.getItem(CLOSINGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getClosingForDate(dateStr: string): CashRegisterClosing | undefined {
    return this.getClosingHistory().find((c) => c.date === dateStr);
  },

  saveClosing(closing: CashRegisterClosing) {
    const list = this.getClosingHistory().filter((c) => c.date !== closing.date);
    list.unshift(closing);
    localStorage.setItem(CLOSINGS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_cash_closing_saved'));
    }
  },

  /**
   * Calculate live register statistics for a given date (default today)
   */
  calculateDayStats(targetDate?: string, openingBalance: number = 2000) {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];
    const orders: Order[] = DataStore.getOrders();
    const products = DataStore.getProducts();
    const expenses = DataStore.getExpenses ? DataStore.getExpenses() : [];
    const payments: PaymentTransaction[] = DataStore.getPayments();

    // Filter today's completed orders
    const todayOrders = orders.filter((o) => {
      const oDate = o.createdAt ? o.createdAt.split('T')[0] : '';
      return oDate === dateStr && o.orderStatus !== 'Cancelled';
    });

    let cashSales = 0;
    let digitalSales = 0;
    let cashOrdersCount = 0;
    let digitalOrdersCount = 0;
    let totalSalesAmount = 0;
    let estimatedCostOfGoods = 0;

    todayOrders.forEach((o) => {
      totalSalesAmount += o.totalAmount || 0;
      const isCash = o.paymentMethod === 'Cash';
      const paid = o.paidAmount || 0;

      if (isCash) {
        cashSales += paid;
        cashOrdersCount++;
      } else {
        digitalSales += paid;
        digitalOrdersCount++;
      }

      // Estimate COGS
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          const buyPrice = prod?.purchasePrice || (item.unitPrice * 0.7); // fallback 70% if unlisted
          estimatedCostOfGoods += buyPrice * (item.quantity || 1);
        });
      }
    });

    // Today's due collected in cash from payments
    const todayDuePayments = payments.filter((p: any) => {
      const pDate = p.date ? p.date.split('T')[0] : (p.createdAt ? p.createdAt.split('T')[0] : '');
      const isDueType =
        p.type === 'Due Collection' ||
        p.type === 'Customer Payment' ||
        p.type === 'CUSTOMER_DUE_COLLECTION';
      return pDate === dateStr && isDueType && p.method === 'Cash';
    });
    const cashDueCollected = todayDuePayments.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);

    // Today's cash expenses
    const todayExpenses = expenses.filter((e: any) => {
      const eDate = e.date ? e.date.split('T')[0] : '';
      const isCash = !e.paymentMethod || e.paymentMethod === 'Cash';
      return eDate === dateStr && isCash;
    });
    const cashExpenses = todayExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    // Expected cash in drawer
    const expectedDrawerCash = openingBalance + cashSales + cashDueCollected - cashExpenses;
    const grossProfit = Math.max(0, totalSalesAmount - estimatedCostOfGoods);
    const netProfit = grossProfit - cashExpenses;

    return {
      date: dateStr,
      openingCash: openingBalance,
      cashSales,
      digitalSales,
      cashDueCollected,
      cashExpenses,
      expectedDrawerCash,
      totalSalesAmount,
      estimatedCostOfGoods,
      grossProfit,
      netProfit,
      ordersCount: todayOrders.length,
      cashOrdersCount,
      digitalOrdersCount,
      todayExpensesList: todayExpenses,
    };
  },
};
