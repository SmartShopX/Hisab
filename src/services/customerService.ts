import { Customer, CustomerLedgerEntry, PaymentMethod } from '../types';
import { DataStore } from './dataStorage';
import { smsService } from './smsService';

export interface CollectDuePayload {
  customerId: string;
  amount: number;
  discountAdjusted?: number; // Special concession / waiver
  method: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  collectedBy?: string;
}

export interface DueCollectionReceipt {
  receiptNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  date: string;
  previousDue: number;
  collectedAmount: number;
  discountAdjusted: number;
  newDue: number;
  method: PaymentMethod;
  notes?: string;
  collectedBy?: string;
}

export const customerService = {
  async getCustomers(search?: string): Promise<Customer[]> {
    // API endpoint: GET /api/v1/customers
    await new Promise((resolve) => setTimeout(resolve, 200));
    let list = DataStore.getCustomers();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.alternateMobile && c.alternateMobile.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async addCustomer(
    customerData: Omit<
      Customer,
      | 'id'
      | 'createdAt'
      | 'totalPurchase'
      | 'totalPaid'
      | 'totalDue'
      | 'ordersCount'
      | 'ordersDelivered'
      | 'ordersCancelled'
      | 'ordersReturned'
      | 'deliverySuccessRate'
    >
  ): Promise<Customer> {
    // API endpoint: POST /api/v1/customers
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = DataStore.getCustomers();
    const today = new Date().toISOString().split('T')[0];
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      customerType: customerData.customerType || 'Retail',
      tier: customerData.tier || 'General',
      creditLimit: customerData.creditLimit ?? 10000,
      creditTermDays: customerData.creditTermDays ?? 30,
      totalPurchase: 0,
      totalPaid: 0,
      totalDue: 0,
      ordersCount: 0,
      deliverySuccessRate: 100,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersReturned: 0,
      createdAt: today,
      ledger: [
        {
          id: `led_${Date.now()}`,
          date: today,
          type: 'Opening Balance',
          debit: 0,
          credit: 0,
          balance: 0,
          notes: 'হিসাব খাতা শুরু',
        },
      ],
    };
    DataStore.setCustomers([newCustomer, ...list]);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    // API endpoint: PUT /api/v1/customers/:id
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = DataStore.getCustomers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('গ্রাহক পাওয়া যায়নি');
    list[idx] = { ...list[idx], ...updates };
    DataStore.setCustomers([...list]);
    return list[idx];
  },

  async collectDue(
    customerIdOrPayload: string | CollectDuePayload,
    amountArg?: number,
    methodArg?: string,
    noteArg?: string
  ): Promise<{ customer: Customer; receipt: DueCollectionReceipt }> {
    // API endpoint: POST /api/v1/customers/:id/collect-due
    await new Promise((resolve) => setTimeout(resolve, 300));

    let payload: CollectDuePayload;
    if (typeof customerIdOrPayload === 'string') {
      payload = {
        customerId: customerIdOrPayload,
        amount: amountArg || 0,
        discountAdjusted: 0,
        method: (methodArg as PaymentMethod) || 'Cash',
        notes: noteArg,
      };
    } else {
      payload = customerIdOrPayload;
    }

    const list = DataStore.getCustomers();
    const idx = list.findIndex((c) => c.id === payload.customerId);
    if (idx === -1) throw new Error('গ্রাহক পাওয়া যায়নি');

    const customer = list[idx];
    const previousDue = customer.totalDue;
    const discount = payload.discountAdjusted || 0;
    const totalDeduction = payload.amount + discount;

    customer.totalPaid += payload.amount;
    customer.totalDue = Math.max(0, customer.totalDue - totalDeduction);

    const receiptNumber = payload.receiptNumber || `MR-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];

    // Ensure ledger array
    if (!customer.ledger) {
      customer.ledger = [];
    }

    // Add ledger entry for Payment
    customer.ledger.unshift({
      id: `led_${Date.now()}_pay`,
      date: today,
      type: 'Due Collection',
      referenceId: receiptNumber,
      debit: 0,
      credit: payload.amount,
      discount: discount > 0 ? discount : undefined,
      balance: customer.totalDue,
      method: payload.method,
      notes: payload.notes || 'বকেয়া আদায় রসিদ',
      collectedBy: payload.collectedBy || 'ম্যানেজার',
    });

    // If discount waiver occurred, optionally note in ledger
    if (discount > 0) {
      customer.ledger.unshift({
        id: `led_${Date.now()}_disc`,
        date: today,
        type: 'Discount Adjustment',
        referenceId: receiptNumber,
        debit: 0,
        credit: 0,
        discount,
        balance: customer.totalDue,
        notes: `বকেয়া ছাড় / সমন্বয় (Waived: ৳${discount})`,
      });
    }

    // Reset aging if fully cleared
    if (customer.totalDue === 0) {
      customer.oldestDueDays = 0;
      customer.promiseDate = undefined;
    }

    DataStore.setCustomers([...list]);

    // Record system payment
    const payments = DataStore.getPayments();
    payments.unshift({
      id: `pay_${Date.now()}`,
      transactionId: `TXN-DUE-${Date.now().toString().slice(-5)}`,
      customerOrSupplierName: customer.name,
      type: 'Due Collection',
      amount: payload.amount,
      method: payload.method,
      status: 'Paid',
      date: new Date().toLocaleString('en-US'),
      notes: `${receiptNumber}: ${payload.notes || 'বাকি আদায়'}${discount > 0 ? ` (ছাড়: ৳${discount})` : ''}`,
    });
    DataStore.setPayments([...payments]);

    const receipt: DueCollectionReceipt = {
      receiptNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      date: today,
      previousDue,
      collectedAmount: payload.amount,
      discountAdjusted: discount,
      newDue: customer.totalDue,
      method: payload.method,
      notes: payload.notes,
      collectedBy: payload.collectedBy || 'দোকান স্বত্বাধিকারী',
    };

    return { customer, receipt };
  },

  /**
   * Save customer commitment or promise to pay
   */
  async recordPromise(customerId: string, promiseDate: string, notes?: string): Promise<Customer> {
    const list = DataStore.getCustomers();
    const idx = list.findIndex((c) => c.id === customerId);
    if (idx === -1) throw new Error('গ্রাহক পাওয়া যায়নি');

    list[idx].promiseDate = promiseDate;
    if (notes) {
      list[idx].reminderNotes = notes;
    }
    DataStore.setCustomers([...list]);
    return list[idx];
  },

  /**
   * Record reminder sent timestamp
   */
  async recordReminderSent(customerId: string, channel: 'sms' | 'whatsapp'): Promise<Customer> {
    const list = DataStore.getCustomers();
    const idx = list.findIndex((c) => c.id === customerId);
    if (idx === -1) throw new Error('গ্রাহক পাওয়া যায়নি');

    list[idx].lastReminderSentAt = new Date().toISOString();
    DataStore.setCustomers([...list]);
    return list[idx];
  },

  /**
   * Calculate aging bracket for a customer's due
   */
  getAgingBracket(days: number = 0): {
    label: string;
    color: 'emerald' | 'amber' | 'orange' | 'rose';
    severity: 'Normal' | 'Warning' | 'High' | 'Critical';
  } {
    if (days <= 30) {
      return { label: '০-৩০ দিন (স্বাভাবিক)', color: 'emerald', severity: 'Normal' };
    } else if (days <= 60) {
      return { label: '৩১-৬০ দিন (সতর্কতা)', color: 'amber', severity: 'Warning' };
    } else if (days <= 90) {
      return { label: '৬১-৯০ দিন (ঝুঁকিপূর্ণ)', color: 'orange', severity: 'High' };
    } else {
      return { label: '৯০+ দিন (অনাদায়ী/খেলাপি)', color: 'rose', severity: 'Critical' };
    }
  },

  /**
   * Generate text for Due Reminder with bKash/Nagad Online Payment Link
   */
  generateReminderMessage(
    customer: Customer,
    shopName: string,
    templateType: 'friendly' | 'notice' | 'urgent',
    paymentAccount?: string
  ): string {
    const dueFormatted = `৳${customer.totalDue.toLocaleString('bn-BD')}`;
    
    // Generate clean payment instruction & link
    let payInfo = '';
    if (paymentAccount) {
      const cleanNum = paymentAccount.replace(/[^0-9]/g, '');
      const payLink = cleanNum ? `https://shop.smartshopx.com/pay?to=${cleanNum}&amount=${customer.totalDue}&ref=${encodeURIComponent(customer.id)}` : '';
      payInfo = `\n💳 সরাসরি বিকাশ/নগদ পেমেন্ট:\nনম্বর: ${paymentAccount}\nরেফারেন্স: ${customer.mobile || customer.name}\nঅনলাইন পে লিংক: ${payLink || 'দোকানে যোগাযোগ করুন'}`;
    }

    if (templateType === 'friendly') {
      return `সম্মানিত গ্রাহক ${customer.name}, শুভেচ্ছা নিন। ${shopName} এ আপনার বর্তমান বকেয়া ${dueFormatted} টাকা। সুবিধাজনক সময়ে পরিশোধের অনুরোধ জানাচ্ছি। ধন্যবাদ।\n${payInfo}`;
    } else if (templateType === 'notice') {
      return `প্রিয় ${customer.name}, ${shopName} এ আপনার বকেয়া ${dueFormatted} টাকা পরিশোধের সময় অতিক্রান্ত হয়েছে। অনুগ্রহপূর্বক আগামী ৩ দিনের মধ্যে হিসাব পরিষ্কার করুন। ধন্যবাদ।\n${payInfo}`;
    } else {
      return `জরুরি নোটিশ: সম্মানিত ${customer.name}, ${shopName} এ আপনার দীর্ঘমেয়াদী বকেয়া ${dueFormatted} টাকা অবিলম্বে পরিশোধ করার জন্য বিশেষভাবে অনুরোধ করা হচ্ছে। জরুরি প্রয়োজনে যোগাযোগ করুন।\n${payInfo}`;
    }
  },
};
