import { Supplier, Purchase } from '../types';
import { DataStore } from './dataStorage';

export const supplierService = {
  async getSuppliers(search?: string): Promise<Supplier[]> {
    // API endpoint: GET /api/v1/suppliers
    await new Promise((resolve) => setTimeout(resolve, 200));
    let list = DataStore.getSuppliers();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.mobile.includes(q)
      );
    }
    return list;
  },

  async addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchase' | 'totalPaid' | 'totalPayable'>): Promise<Supplier> {
    // API endpoint: POST /api/v1/suppliers
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = DataStore.getSuppliers();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      totalPurchase: 0,
      totalPaid: 0,
      totalPayable: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setSuppliers([newSupplier, ...list]);
    return newSupplier;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    // API endpoint: PUT /api/v1/suppliers/:id
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = DataStore.getSuppliers();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('সাপ্লায়ার পাওয়া যায়নি');
    list[idx] = { ...list[idx], ...updates };
    DataStore.setSuppliers([...list]);
    return list[idx];
  },

  async paySupplier(supplierId: string, amount: number, method: string, note?: string): Promise<Supplier> {
    // API endpoint: POST /api/v1/suppliers/:id/pay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = DataStore.getSuppliers();
    const idx = list.findIndex((s) => s.id === supplierId);
    if (idx === -1) throw new Error('সাপ্লায়ার পাওয়া যায়নি');

    const supplier = list[idx];
    supplier.totalPaid += amount;
    supplier.totalPayable = Math.max(0, supplier.totalPayable - amount);
    DataStore.setSuppliers([...list]);

    // Record payment
    const payments = DataStore.getPayments();
    payments.unshift({
      id: `pay_${Date.now()}`,
      transactionId: `TXN-SUP-${Date.now().toString().slice(-5)}`,
      customerOrSupplierName: supplier.companyName || supplier.name,
      type: 'Supplier Payment',
      amount,
      method: method as any,
      status: 'Paid',
      date: new Date().toLocaleString('en-US'),
      notes: note || 'সাপ্লায়ার পাওনা পরিশোধ',
    });
    DataStore.setPayments([...payments]);

    return supplier;
  },

  async getPurchases(): Promise<Purchase[]> {
    // API endpoint: GET /api/v1/purchases
    await new Promise((resolve) => setTimeout(resolve, 200));
    return DataStore.getPurchases();
  },

  async createPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber'>): Promise<Purchase> {
    // API endpoint: POST /api/v1/purchases
    await new Promise((resolve) => setTimeout(resolve, 350));
    const purchases = DataStore.getPurchases();
    const products = DataStore.getProducts();
    const movements = DataStore.getStockMovements();
    const suppliers = DataStore.getSuppliers();

    const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur_${Date.now()}`,
      purchaseNumber,
    };
    DataStore.setPurchases([newPurchase, ...purchases]);

    // 1. Update product stock & movements
    purchaseData.items.forEach((item) => {
      const prodIdx = products.findIndex((p) => p.id === item.productId);
      if (prodIdx !== -1) {
        const prev = products[prodIdx].stock;
        const nxt = prev + item.quantity;
        products[prodIdx].stock = nxt;
        products[prodIdx].purchasePrice = item.purchasePrice; // update latest purchase price

        movements.unshift({
          id: `sm_${Date.now()}_${item.productId}`,
          productId: item.productId,
          productName: item.productName,
          type: 'PURCHASE',
          quantity: item.quantity,
          previousStock: prev,
          newStock: nxt,
          reason: `ক্রয় চালান ${purchaseNumber}`,
          createdAt: new Date().toLocaleString('en-US'),
        });
      }
    });
    DataStore.setProducts([...products]);
    DataStore.setStockMovements([...movements]);

    // 2. Update supplier totals
    const supIdx = suppliers.findIndex((s) => s.id === purchaseData.supplierId);
    if (supIdx !== -1) {
      suppliers[supIdx].totalPurchase += purchaseData.totalAmount;
      suppliers[supIdx].totalPaid += purchaseData.paidAmount;
      suppliers[supIdx].totalPayable += purchaseData.dueAmount;
      suppliers[supIdx].lastPurchaseDate = purchaseData.purchaseDate;
      DataStore.setSuppliers([...suppliers]);
    }

    return newPurchase;
  },
};
