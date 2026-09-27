export type BusinessCategory =
  | 'General & Trading'
  | 'Pharmacy & Medicine'
  | 'Mobile, Telecom & Accessories'
  | 'Fashion & Clothing'
  | 'Restaurant & Food'
  | 'E-Commerce & Online Business'
  | 'Salon & Beauty'
  | 'Coaching & Academy'
  | 'Hardware & Building Materials'
  | 'Books, Stationery & Photocopy'
  | 'Computer & Electronics'
  | 'Mess, Hostel & Rental'
  | 'Savings, Loan & Cooperative'
  | 'Professional Services'
  | 'Auto, Bike & Transport'
  | 'Agriculture, Fish & Livestock'
  // Legacy / Direct subcategory aliases for backwards compatibility
  | 'Grocery'
  | 'Clothing'
  | 'Mobile & Telecom'
  | 'Electronics'
  | 'Pharmacy'
  | 'Restaurant'
  | 'Cosmetics'
  | 'Book & Stationery'
  | 'Hardware'
  | 'Furniture'
  | 'Bakery & Sweets'
  | 'Fish & Meat'
  | 'Tailoring & Boutique'
  | 'Printing & Photocopy'
  | 'Super Shop'
  | 'Online Store & E-Commerce'
  | 'Other'
  | 'Custom Category';

export type CanonicalCategory =
  | 'General & Trading'
  | 'Pharmacy & Medicine'
  | 'Mobile, Telecom & Accessories'
  | 'Fashion & Clothing'
  | 'Restaurant & Food'
  | 'E-Commerce & Online Business'
  | 'Salon & Beauty'
  | 'Coaching & Academy'
  | 'Hardware & Building Materials'
  | 'Books, Stationery & Photocopy'
  | 'Computer & Electronics'
  | 'Mess, Hostel & Rental'
  | 'Savings, Loan & Cooperative'
  | 'Professional Services'
  | 'Auto, Bike & Transport'
  | 'Agriculture, Fish & Livestock';

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  'General & Trading',
  'Pharmacy & Medicine',
  'Mobile, Telecom & Accessories',
  'Fashion & Clothing',
  'Restaurant & Food',
  'E-Commerce & Online Business',
  'Salon & Beauty',
  'Coaching & Academy',
  'Hardware & Building Materials',
  'Books, Stationery & Photocopy',
  'Computer & Electronics',
  'Mess, Hostel & Rental',
  'Savings, Loan & Cooperative',
  'Professional Services',
  'Auto, Bike & Transport',
  'Agriculture, Fish & Livestock',
];

export type ShopTemplate =
  | 'Standard Retail'
  | 'Electronics & Telecom'
  | 'Fashion & Apparel'
  | 'Pharmacy & Healthcare'
  | 'Grocery & Supermarket'
  | 'Restaurant & Food'
  | 'Wholesaler / Distributor'
  | 'Service & Repair';

export type ECommerceModel =
  | 'Online Store'
  | 'Social Commerce'
  | 'Multi-Vendor Marketplace'
  | 'Service Business'
  | 'Booking & Appointment'
  | 'Catalog & Order';

export type CentralSubscriptionTier = 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_keeper' | 'staff';
export type AccountType = 'business' | 'personal';

export interface UserPermission {
  canViewSales: boolean;
  canCreateSale: boolean;
  canManageProducts: boolean;
  canManageCustomers: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canManagePayments: boolean;
  canManagePurchases?: boolean;
  canManageCourier?: boolean;
  canManageSettings?: boolean;
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  accountType?: AccountType;
  permissions?: UserPermission;
  shopId: string;
}

export type SubscriptionPlan = 'Basic' | 'Standard' | 'Enterprise' | 'Starter' | 'Professional' | 'Business Pro' | 'Lifetime' | string;
export type SubscriptionStatus = 'Trial' | 'Active' | 'Expired' | 'Suspended' | 'Cancelled';

export interface SubscriptionPackage {
  id: string;
  key: string;
  name: string;
  englishName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isLifetime?: boolean;
  lifetimePrice?: number;
  badge?: string;
  description: string;
  maxProducts: number | 'unlimited';
  maxSalesMonthly: number | 'unlimited';
  maxStaff: number | 'unlimited';
  maxBranches: number | 'unlimited';
  features: { title: string; included: boolean }[];
  isCustom?: boolean;
  isPopular?: boolean;
  createdAt?: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email?: string;
  address: string;
  category: BusinessCategory;
  customCategory?: string;
  logo?: string;
  banner?: string;
  currency: string;
  timezone?: string;
  description?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStart: string;
  subscriptionExpiry: string;
  storeSlug: string;
  storePublished: boolean;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  invoiceTitle?: string;
  invoiceFooterNote?: string;
  invoiceTerms?: string;
  thermalPrinterSize?: '58mm' | '80mm' | 'a4' | 'a5';
  autoPrintReceipt?: boolean;
  showQrOnInvoice?: boolean;
  showBarcodeOnInvoice?: boolean;
  smsGatewayProvider?: string;
  smsApiKey?: string;
  smsSenderId?: string;
  smsClientId?: string;
  smsEnabledTriggers?: {
    newOrder?: boolean;
    dueReminder?: boolean;
    courierTracking?: boolean;
    dailySummary?: boolean;
  };
  smsTemplates?: {
    newOrder?: string;
    dueReminder?: string;
    courierTracking?: string;
  };
  defaultVatRate?: number;
  vatCalculationMode?: 'inclusive' | 'exclusive';
  roundOffCash?: boolean;
  lowStockThreshold?: number;
  expiryWarningDays?: number;
  plan?: SubscriptionPlan;
  planExpiry?: string;
  businessType?: string;
  businessModel?: string;
  template?: string;
  modules?: Record<string, boolean>;
  featureOverrides?: Record<string, boolean>;
  isSuspended?: boolean;
  status?: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Red - XL" or "Black - 64GB"
  sku?: string;
  barcode?: string;
  size?: string;
  color?: string;
  purchasePrice?: number;
  wholesalePrice?: number;
  sellingPrice: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  subCategory?: string;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  discount: number;
  vatPercent?: number; // VAT or Tax rate in percent (e.g., 0, 5, 7.5, 15)
  stock: number;
  minStock: number;
  unit: string;
  description: string;
  image: string;
  isActive: boolean;
  onlineStoreVisible: boolean;
  isFeatured?: boolean;
  videoUrl?: string;
  createdAt: string;

  // Variants management (Clothing, Shoes, Specs, etc.)
  hasVariants?: boolean;
  variants?: ProductVariant[];

  // IMEI / Serial numbers & Warranty tracking (Mobile, Electronics, High-value gadgets)
  hasSerialTracking?: boolean;
  serials?: string[];
  warrantyPeriod?: string; // e.g., 'No Warranty', '7 Days Replacement', '6 Months', '1 Year', '2 Years'

  // Location & Inventory
  rackLocation?: string; // e.g., 'Shelf A-3', 'Godown-2, Rack B'
  batchNumber?: string;
  expiryDate?: string; // Format: YYYY-MM-DD

  // Pharmacy & Medicine specific attributes:
  genericName?: string;
  dosageForm?: string; // e.g., 'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Eye Drop', 'Ointment'
  strength?: string; // e.g., '500mg', '20mg', '100ml'
  manufacturer?: string; // e.g., 'Square', 'Beximco', 'Incepta', 'Renata'
  piecesPerStrip?: number; // e.g., 10 tablets per strip
  stripsPerBox?: number; // e.g., 10 strips per box
  stripPrice?: number; // Selling price per strip
  boxPrice?: number; // Selling price per box
  requiresPrescription?: boolean;
}

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'Other';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  selectedUnit?: 'Pcs' | 'Strip' | 'Box';
  unitMultiplier?: number;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Corporate';
export type CustomerTier = 'General' | 'Silver' | 'Gold' | 'Platinum';

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'Sale' | 'Due Collection' | 'Discount Adjustment' | 'Return Refund' | 'Opening Balance' | 'Installment Payment';
  referenceId?: string; // invoice or receipt number
  debit: number; // amount billed (increases due)
  credit: number; // amount paid (reduces due)
  discount?: number; // waived / discounted
  balance: number; // running balance after this transaction
  method?: string; // e.g., Cash, bKash, Bank
  notes?: string;
  collectedBy?: string;
  signatureImage?: string;
}

export interface DueInstallmentItem {
  id: string;
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paidDate?: string;
  paidAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface DueInstallmentPlan {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  totalDueAmount: number;
  numberOfInstallments: number;
  intervalDays: number; // 7, 15, 30
  startDate: string;
  installments: DueInstallmentItem[];
  status: 'Active' | 'Completed' | 'Defaulted';
  createdAt: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address: string;
  customerType?: CustomerType; // Retail, Wholesale, Corporate
  tier?: CustomerTier; // General, Silver, Gold, Platinum
  nidOrTradeLicense?: string;

  // Guarantor / Reference Information
  guarantorName?: string;
  guarantorMobile?: string;
  guarantorRelation?: string;
  guarantorAddress?: string;

  // Customer Badges & Tags
  tags?: string[]; // e.g. ['বিশ্বস্ত', 'পাইকারি', 'ঝুঁকিপূর্ণ', 'নিয়মিত', 'সরকারি চাকুরিজীবী']

  // Credit Limit & Risk Control
  creditLimit?: number; // Maximum allowable due amount (e.g., 20000)
  creditTermDays?: number; // Days allowed to clear due (e.g., 15 days)
  isCreditLocked?: boolean; // If true, warns or prevents further due sales

  // Balances
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  ordersCount: number;
  lastOrderDate?: string;

  // Aging & Collections
  oldestDueDays?: number; // Days since oldest unpaid sale
  dueDate?: string; // Due date for payment
  promiseDate?: string; // Customer committed date to pay
  lastReminderSentAt?: string; // Last SMS / WhatsApp reminder date
  reminderNotes?: string; // Notes on recent follow-up

  riskLevel: 'Low' | 'Medium' | 'High';
  deliverySuccessRate: number;
  ordersDelivered: number;
  ordersCancelled: number;
  ordersReturned: number;
  notes?: string;
  createdAt: string;

  // Digital Ledger & Installments
  ledger?: CustomerLedgerEntry[];
  installmentPlans?: DueInstallmentPlan[];
  loyaltyPoints?: number;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  mobile: string;
  email?: string;
  address: string;
  totalPurchase: number;
  totalPaid: number;
  totalPayable: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'New'
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Courier Assigned'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Failed';

export type PaymentStatus = 'Pending' | 'Paid' | 'Partially Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedUnit?: string;
  genericName?: string;
  rackLocation?: string;
}

export type CourierProvider =
  | 'Steadfast'
  | 'Pathao'
  | 'RedX'
  | 'eCourier'
  | 'Paperfly'
  | 'Sundarban'
  | 'Manual';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  channel: 'POS' | 'Online Store' | 'Landing Page' | 'Manual';
  orderSource?: 'POS' | 'Online Store' | 'Landing Page' | 'Manual';
  courierName?: string;
  courierProvider?: CourierProvider;
  courierTrackingId?: string;
  courierTrackingCode?: string;
  stockAdjusted?: boolean;
  notes?: string;
  createdAt: string;
  timeline?: {
    id: string;
    status: OrderStatus;
    action: string;
    timestamp: string;
    user?: string;
    note?: string;
  }[];
  advanceDeliveryChargePaid?: number;
  advancePaymentTrxId?: string;
  advancePaymentMethod?: PaymentMethod;
  customerRiskScore?: 'High Trust' | 'Moderate' | 'High Risk';
  customerDeliveryRate?: number;
  servedByStaffName?: string;
  servedByStaffId?: string;
  pricingMode?: 'Retail' | 'Wholesale';
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
}

export interface IncompleteOrder {
  id: string;
  customerName: string;
  customerMobile: string;
  productName: string;
  quantity: number;
  amount: number;
  source: 'Online Store' | 'Landing Page';
  createdAt: string;
  status: 'Abandoned' | 'Followed-Up' | 'Converted';
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  costPrice?: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNumber?: string;
  invoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: PaymentMethod;
  purchaseDate?: string;
  notes?: string;
}

export type StockLogType = 'Stock In' | 'Stock Out' | 'Adjustment';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: StockLogType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Utility'
  | 'Salary'
  | 'Marketing'
  | 'Packaging'
  | 'Courier Charge'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
}

export type PaymentType =
  | 'Customer Payment'
  | 'Supplier Payment'
  | 'Due Collection'
  | 'Supplier Due Pay';

export interface PaymentRecord {
  id: string;
  orderId?: string;
  type: PaymentType;
  customerOrSupplierName: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  notes?: string;
}

export type StaffRole = 'Admin' | 'Manager' | 'Salesman' | 'Stock Manager';

export interface StaffPermissions {
  canMakeSale: boolean;
  canViewProfit: boolean;
  canEditProduct: boolean;
  canDeleteOrder: boolean;
  canViewReports: boolean;
  canManageCourier?: boolean;
  canManageExpenses?: boolean;
}

export interface CourierApiCredential {
  provider: CourierProvider;
  apiKey: string;
  secretKey: string;
  clientId?: string;
  webhookSecret?: string;
  isLive: boolean;
  isConnected: boolean;
  lastTestedAt?: string;
}

export interface PaymentGatewayConfig {
  gateway: 'bKash' | 'Nagad' | 'SSLCommerz' | 'Shurjopay' | 'Aamarpay';
  appKey: string;
  appSecret: string;
  merchantId?: string;
  username?: string;
  password?: string;
  isLive: boolean;
  isEnabled: boolean;
  lastTestedAt?: string;
}

export interface MfsAccountDetail {
  id: string;
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  type: 'Personal' | 'Merchant' | 'Agent' | 'Current';
  accountNumber: string;
  accountTitle: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  qrCodeUrl?: string;
  isActive: boolean;
}

export interface CentralApiSettings {
  apiBaseUrl: string;
  syncMode: 'cloud_sync' | 'offline_first' | 'hybrid';
  autoSyncIntervalMinutes: number;
  lastSyncedAt?: string;
  isOnline: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  mobile: string;
  role: StaffRole;
  permissions: StaffPermissions;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'RETURN' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  orderId?: string;
  customerOrSupplierName: string;
  type: 'Customer Payment' | 'Supplier Payment' | 'Refund' | 'Due Collection';
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  notes?: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  productId?: string;
  videoUrl?: string;
  deliveryChargeInsideDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  features?: string[];
  template?:
    | 'Product Sale'
    | 'Fashion'
    | 'Grocery'
    | 'Electronics'
    | 'Mobile'
    | 'Pharmacy'
    | 'Restaurant'
    | 'General Business';
  headline: string;
  subheadline: string;
  productName?: string;
  regularPrice: number;
  offerPrice: number;
  primaryColor?: string;
  isPublished: boolean;
  viewsCount?: number;
  ordersCount?: number;
  sections?: {
    hero: boolean;
    product: boolean;
    offer: boolean;
    features: boolean;
    benefits: boolean;
    reviews: boolean;
    faq: boolean;
    delivery: boolean;
    orderForm: boolean;
    cta: boolean;
    footer: boolean;
  };
  featuresList?: string[];
  createdAt: string;
}

export interface CourierOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  courierProvider: 'Steadfast' | 'Pathao' | 'RedX' | 'eCourier' | 'Paperfly' | 'Manual';
  trackingNumber: string;
  codAmount: number;
  deliveryStatus: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Returned' | 'Cancelled';
  lastUpdated: string;
}

export interface BlockedEntity {
  id: string;
  type: 'Mobile' | 'IP';
  value: string;
  reason: string;
  addedBy: string;
  createdAt: string;
}

export interface NotificationSettings {
  newOrderSms: boolean;
  orderConfirmationSms: boolean;
  paymentReceivedSms: boolean;
  shipmentSms: boolean;
  deliverySms: boolean;
  dueReminderSms: boolean;
  whatsappEnabled: boolean;
}

export type SmsGatewayProvider =
  | 'Greenweb'
  | 'Onnorokom'
  | 'MimSMS'
  | 'SSLWireless'
  | 'Elitbuzz'
  | 'BulkSMSBD';

export interface SmsGatewayConfig {
  provider: SmsGatewayProvider;
  apiKey: string;
  senderId: string;
  secretKey?: string;
  clientId?: string;
  isConnected: boolean;
  balance: number;
}

export interface SmsTriggerConfig {
  onOrderConfirm: boolean;
  orderConfirmTpl: string;
  onCourierDispatch: boolean;
  courierDispatchTpl: string;
  onOrderDelivered: boolean;
  orderDeliveredTpl: string;
  onPosSale: boolean;
  posSaleTpl: string;
  onDueReminder: boolean;
  dueReminderTpl: string;
}

export interface SmsLogRecord {
  id: string;
  recipient: string;
  message: string;
  templateType: string;
  provider: string;
  status: 'Sent' | 'Delivered' | 'Failed';
  sentAt: string;
}

export interface PixelEventLogRecord {
  id: string;
  eventName: string;
  channel: 'Browser (Pixel)' | 'Server (CAPI)' | 'Deduplicated (Both)';
  value?: number;
  currency: string;
  contentName?: string;
  orderId?: string;
  status: 'Sent' | 'Delivered';
  timestamp: string;
}

export interface FacebookPixelSettings {
  pixelId: string;
  accessToken: string;
  testEventCode: string;
  conversionApiStatus: boolean;
  trackingActive: boolean;
  trackPageView: boolean;
  trackViewContent: boolean;
  trackAddToCart: boolean;
  trackInitiateCheckout: boolean;
  trackPurchase: boolean;
}

export interface PersonalTransaction {
  id: string;
  title: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  wallet: 'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Other';
  date: string;
  notes?: string;
}

export interface TelecomTransaction {
  id: string;
  type: 'RECHARGE' | 'MFS_CASH_IN' | 'MFS_CASH_OUT' | 'SIM_SALE' | 'ACCESSORY_SALE' | 'DRIVE_PACK' | 'SERVICING_BILL';
  provider: 'Grameenphone' | 'Banglalink' | 'Robi' | 'Airtel' | 'Teletalk' | 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Device Repair';
  recipientNumber: string;
  amount: number;
  commission: number;
  status: 'Success' | 'Pending' | 'Failed';
  transactionId?: string;
  notes?: string;
  date: string;
}

export interface TelecomBalance {
  id: string;
  provider: string;
  category: 'RECHARGE' | 'MFS';
  balance: number;
  simNumber: string;
  lastUpdated: string;
}

export interface MobileRepairTicket {
  id: string;
  ticketNumber: string; // e.g. JOB-2609-01
  customerName: string;
  customerMobile: string;
  deviceBrand: string; // e.g. Samsung, Xiaomi, iPhone, Vivo, Realme, Oppo
  deviceModel: string; // e.g. Galaxy A52, Note 10 Pro
  imeiOrSerial?: string;
  issueDescription: string; // e.g. ডিসপ্লে ফাটা, চার্জিং পিন নষ্ট, ব্যাটারি চেঞ্জ
  securityLock?: string; // প্যাটার্ন / পিন / নো লক
  estimatedCost: number; // মোট সম্ভাব্য বিল
  advancePaid: number; // অগ্রিম জমা
  partsCost: number; // পার্টস কেনার খরচ
  serviceCharge: number; // লাভ / মেকানিক মজুরি
  status: 'Received' | 'In Repair' | 'Ready' | 'Delivered' | 'Returned_Unrepaired';
  receivedDate: string;
  expectedDeliveryDate?: string;
  deliveredDate?: string;
  technicianName?: string;
  warrantyDays?: number; // e.g. 30 days
  notes?: string;
}

export interface DrivePackOffer {
  id: string;
  operator: 'Grameenphone' | 'Banglalink' | 'Robi' | 'Airtel' | 'Teletalk';
  title: string;
  regularPrice: number;
  cashbackCommission: number;
  customerOfferPrice: number;
  type: 'COMBO' | 'INTERNET' | 'MINUTES';
  validity: string;
  description?: string;
}

export interface TelecomDailyClosing {
  id: string;
  date: string;
  simBalances: {
    provider: string;
    category: 'RECHARGE' | 'MFS';
    simNumber: string;
    closingBalance: number;
  }[];
  cashInDrawer: number;
  totalFloat: number;
  totalClosingAssets: number;
  notes?: string;
  createdAt: string;
}

export type ReturnCondition = 'Resellable' | 'Damaged_Defective';
export type ReturnChannel = 'POS_Store' | 'Courier_RTO' | 'Online';
export type RefundPaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Store_Credit' | 'Adjust_With_Exchange';

export interface ReturnExchangeRecord {
  id: string;
  returnNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerMobile: string;
  type: 'Return' | 'Exchange';
  channel?: ReturnChannel;
  condition?: ReturnCondition;
  refundMethod?: RefundPaymentMethod;
  storeCreditCode?: string;
  courierProvider?: string;
  courierTrackingCode?: string;
  courierReturnFee?: number;
  returnedItems: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    condition?: ReturnCondition;
  }[];
  exchangedItems?: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  refundAmount: number;
  additionalCharge?: number;
  reason: string;
  stockRestocked: boolean;
  date: string;
  notes?: string;
}

export type ActiveAccountMode = 'business' | 'personal';

export interface AccountBusiness {
  id: string;
  name: string;
  category: BusinessCategory;
  businessType?: string;
  businessModel?: string;
  template?: string;
  role: UserRole;
  isActive: boolean;
  storeSlug?: string;
  plan: CentralSubscriptionTier | SubscriptionPlan;
}

export interface UserAccountHierarchy {
  userId: string;
  personalAccount: {
    id: string;
    name: string;
    mobile: string;
  };
  businesses: AccountBusiness[];
  activeMode: ActiveAccountMode;
  activeBusinessId: string;
}

export interface PersonalBudget {
  id: string;
  category: string;
  budgetAmount: number;
  month: string; // YYYY-MM
  notes?: string;
}

export interface PersonalDuePayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface PersonalDueRecord {
  id: string;
  personName: string;
  personMobile?: string;
  type: 'RECEIVABLE' | 'PAYABLE'; // আমি পাবো (Receivable) | আমি দেবো (Payable)
  amount: number;
  paidAmount: number;
  dueDate?: string;
  date: string;
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  note?: string;
  paymentHistory?: PersonalDuePayment[];
}

export type PersonalSavingsType = 'DPS' | 'FDR' | 'Sanchayapatra' | 'EmergencyFund' | 'Gold' | 'Other';

export interface PersonalSavingsRecord {
  id: string;
  title: string;
  institution: string; // যেমন: ডাচ বাংলা ব্যাংক, সোনালী ব্যাংক, সঞ্চয় অধিদপ্তর
  accountNumber?: string;
  type: PersonalSavingsType;
  monthlyInstallment?: number; // ডিপিএস এর ক্ষেত্রে প্রতি মাসের কিস্তি
  installmentDay?: number; // মাসের কত তারিখের মধ্যে দিতে হবে
  totalDeposited: number; // অদ্যাবধি মোট জমা
  targetAmount?: number; // মেয়াদপূর্তিতে আনুমানিক কত পাওয়া যাবে
  startDate: string;
  maturityDate?: string;
  status: 'Active' | 'Matured' | 'Closed';
  lastPaidMonth?: string; // e.g. 2026-09
  notes?: string;
}

// ==========================================
// AI Voice Call & Auto Due Reminder Types
// ==========================================
export type VoiceCampaignType = 'due_reminder' | 'marketing_offer' | 'welcome_greeting' | 'general_announcement';
export type VoiceTargetAudience = 'all_customers' | 'due_customers_today' | 'overdue_customers' | 'wholesale_only' | 'retail_only' | 'selected_customers';
export type VoiceCallStatus = 'answered' | 'busy' | 'no_answer' | 'failed' | 'scheduled' | 'calling';

export interface VoiceCallLog {
  id: string;
  campaignId?: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  callType: 'due_reminder' | 'marketing' | 'manual_call';
  dueAmount?: number;
  promiseDate?: string;
  durationSeconds: number;
  status: VoiceCallStatus;
  ivrKeyPressed?: '1' | '2' | '3';
  ivrResponseText?: string;
  notes?: string;
  timestamp: string;
}

export interface VoiceCallCampaign {
  id: string;
  title: string;
  campaignType: VoiceCampaignType;
  targetAudience: VoiceTargetAudience;
  scheduledDate: string; // YYYY-MM-DD
  callTime: string; // e.g. 10:30 AM
  autoTriggerOnPromiseDate: boolean;
  scriptBangla: string;
  voiceGender: 'female' | 'male';
  voiceTone: 'friendly' | 'formal' | 'urgent';
  ivrOptionsEnabled: boolean;
  status: 'active' | 'scheduled' | 'completed' | 'paused';
  totalTargets: number;
  completedCalls: number;
  answeredCalls: number;
  failedCalls: number;
  ivrResponses?: {
    key1Count: number; // e.g. পেমেন্ট লিংক
    key2Count: number; // e.g. ৩ দিন সময় বাড়ানো
    key3Count: number; // e.g. শপ ওনারের সাথে কথা
  };
  createdAt: string;
}

export interface VoiceGatewayConfig {
  provider: 'bangladesh_telecom_obd' | 'greenweb' | 'alphanet' | 'twilio' | 'browser_ai';
  apiKey?: string;
  callerId: string;
  autoCallDailyHour: number; // e.g. 10 for 10 AM
  autoCallEnabled: boolean;
  retryOnBusy: boolean;
  maxRetries: number;
  bKashMerchantNumber?: string;
  nagadMerchantNumber?: string;
}

// Coupons & Promo Vouchers
export interface Coupon {
  id: string;
  shopId?: string; // If empty, platform-wide (Daraz Mall)
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
  description?: string;
}

// Customer Reviews & Ratings
export interface ProductReview {
  id: string;
  productId: string;
  shopId: string;
  customerName: string;
  customerMobile?: string;
  rating: number; // 1 to 5
  comment: string;
  photoUrl?: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  shopReply?: string;
  likesCount?: number;
}

// Reseller & Dropshipping Network
export interface ResellerAccount {
  id: string;
  name: string;
  mobile: string;
  bkashNumber: string;
  referralCode: string;
  commissionPercent: number; // e.g., 10%
  totalOrders: number;
  totalSalesAmount: number;
  totalCommissionEarned: number;
  paidCommission: number;
  pendingCommission: number;
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
}

// Branch & Multi-Location Management Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  isMainBranch?: boolean;
  isActive?: boolean;
  managerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
  openingDate?: string;
  targetMonthlySales?: number;
  currentMonthlySales?: number;
  todaySales?: number;
  totalStockQuantity?: number;
  totalStockValuation?: number;
  staffCount?: number;
  createdAt: string;
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}

export interface StockTransferRequest {
  id: string;
  transferNumber: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  items: StockTransferItem[];
  totalQuantity: number;
  totalValue: number;
  status: 'pending' | 'in_transit' | 'received' | 'rejected' | 'cancelled';
  transferDate: string;
  receivedDate?: string;
  initiatedBy: string;
  receivedBy?: string;
  transportVehicle?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

// Biometric Authentication & Passkey Types
export type BiometricType = 'fingerprint' | 'face' | 'platform';

export interface BiometricCredential {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  mobile: string;
  deviceName: string;
  biometricType: BiometricType;
  credentialId: string;
  createdAt: string;
  lastUsedAt?: string;
  isDefault?: boolean;
}

export interface BiometricSettings {
  enabled: boolean;
  allowPosQuickUnlock: boolean;
  allowFastCashierSwitch: boolean;
  showOnLoginPage: boolean;
  requirePinFallback: boolean;
  quickPin: string; // 4 or 6 digit PIN (default '1234')
  posAutoLockTimeoutMinutes: number; // 0 = never, 2, 5, 10, 15
}



