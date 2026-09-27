/**
 * SmartShopX Development In-Memory Data Store
 * STRICTLY FOR DEVELOPMENT / DEMO / TESTING ONLY
 * 
 * In production (NODE_ENV === 'production'), this module is NEVER used.
 * Production exclusively connects to authoritative PostgreSQL via DATABASE_URL.
 */

export interface DevProduct {
  id: string;
  businessId: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  vatPercent: number;
  isActive: boolean;
  onlineStoreVisible: boolean;
  image?: string;
  createdAt: string;
}

export interface DevCustomer {
  id: string;
  businessId: string;
  name: string;
  mobile: string;
  address: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  totalDue: number;
  creditLimit: number;
  createdAt: string;
}

export interface DevSupplier {
  id: string;
  businessId: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  address: string;
  totalPayable: number;
  totalPaid: number;
  createdAt: string;
}

export interface DevOrder {
  id: string;
  businessId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  channel: string;
  createdAt: string;
}

export interface DevPersonalTransaction {
  id: string;
  userId: string;
  type: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  note: string;
  createdAt: string;
}

class DevDataStore {
  public products: DevProduct[] = [
    {
      id: 'prod_dev_1',
      businessId: 'shop_101',
      name: 'প্রিমিয়াম কটন শার্ট',
      category: 'পুরুষদের পোশাক',
      brand: 'SmartFit',
      sku: 'SHT-001',
      barcode: '8901234567890',
      purchasePrice: 650,
      sellingPrice: 1250,
      wholesalePrice: 950,
      stock: 45,
      minStockAlert: 10,
      unit: 'pcs',
      vatPercent: 5,
      isActive: true,
      onlineStoreVisible: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_dev_2',
      businessId: 'shop_101',
      name: 'সিল্ক কাতান শাড়ি',
      category: 'মহিলাদের পোশাক',
      brand: 'Heritage',
      sku: 'SAR-002',
      barcode: '8901234567891',
      purchasePrice: 2200,
      sellingPrice: 3800,
      wholesalePrice: 3000,
      stock: 18,
      minStockAlert: 5,
      unit: 'pcs',
      vatPercent: 7.5,
      isActive: true,
      onlineStoreVisible: true,
      createdAt: new Date().toISOString(),
    },
  ];

  public customers: DevCustomer[] = [
    {
      id: 'cust_dev_1',
      businessId: 'shop_101',
      name: 'রাশেদুল ইসলাম',
      mobile: '01711122334',
      address: 'ধানমন্ডি, ঢাকা',
      email: 'rashed@example.com',
      totalSpent: 12500,
      totalOrders: 4,
      totalDue: 1500,
      creditLimit: 5000,
      createdAt: new Date().toISOString(),
    },
  ];

  public suppliers: DevSupplier[] = [
    {
      id: 'sup_dev_1',
      businessId: 'shop_101',
      name: 'রহমান টেক্সটাইল মিলস',
      company: 'রহমান ফেব্রিক্স লিমিটেড',
      mobile: '01911998877',
      email: 'contact@rahmanfabrics.bd',
      address: 'বাবুবাজার, পুরান ঢাকা',
      totalPayable: 25000,
      totalPaid: 150000,
      createdAt: new Date().toISOString(),
    },
  ];

  public orders: DevOrder[] = [
    {
      id: 'ord_dev_1',
      businessId: 'shop_101',
      orderNumber: 'INV-20260911-1001',
      customerName: 'রাশেদুল ইসলাম',
      customerPhone: '01711122334',
      total: 2500,
      paidAmount: 2000,
      dueAmount: 500,
      paymentMethod: 'cash',
      paymentStatus: 'partial',
      orderStatus: 'completed',
      channel: 'pos',
      createdAt: new Date().toISOString(),
    },
  ];

  public personalTransactions: DevPersonalTransaction[] = [
    {
      id: 'ptxn_dev_1',
      userId: 'usr_owner_default',
      type: 'expense',
      category: 'Food & Dining',
      amount: 450,
      paymentMethod: 'cash',
      date: new Date().toISOString().slice(0, 10),
      note: 'দুপুরের খাবার',
      createdAt: new Date().toISOString(),
    },
  ];
}

export const devStore = new DevDataStore();
