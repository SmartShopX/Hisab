import { SubscriptionPackage, SubscriptionPlan } from '../types';

const STORAGE_KEY = 'smartshopx_subscription_packages';
const PAYMENT_HISTORY_KEY = 'smartshopx_subscription_payments';

export const DEFAULT_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'starter',
    key: 'Starter',
    name: 'স্টার্টার প্যাক (Starter)',
    englishName: 'Starter Retail Pack',
    monthlyPrice: 499,
    yearlyPrice: 4999,
    badge: 'ক্ষুদ্র ব্যবসার জন্য',
    description: 'ছোট মুদি দোকান, একক ফার্মেসি ও নতুন রিটেইল শপের জন্য সাশ্রয়ী সমাধান',
    maxProducts: 500,
    maxSalesMonthly: 1500,
    maxStaff: 1,
    maxBranches: 1,
    isPopular: false,
    features: [
      { title: 'সর্বোচ্চ ৫০০ টি পণ্য ও বারকোড সংরক্ষণ', included: true },
      { title: 'প্রতি মাসে ১,৫০০ টি POS বিক্রয় ও বাংলা মেমো', included: true },
      { title: '১ জন ক্যাশিয়ার/অ্যাডমিন অ্যাকাউন্ট', included: true },
      { title: 'অফলাইন মোড (ইন্টারনেট ছাড়াও পিওএস সচল)', included: true },
      { title: 'কাস্টমার বাকি খাতা ও কালেকশন রসিদ', included: true },
      { title: 'ক্যামেরা বারকোড ও কিউআর স্ক্যানার', included: true },
      { title: 'মেয়াদোত্তীর্ণ ও স্টক অ্যালার্ট নোটিশ', included: false },
      { title: 'হোয়াটসঅ্যাপে ডিজিটাল ইনভয়েস ও মেমো', included: false },
      { title: 'দিনশেষে ক্যাশ ড্রয়ার ও নিট লাভ খতিয়ান', included: false },
      { title: 'মাল্টি-ব্রাঞ্চ ও পাইকারি সাপ্লায়ার ট্র্যাকিং', included: false },
    ],
  },
  {
    id: 'professional',
    key: 'Professional',
    name: 'প্রফেশনাল প্যাক (Professional)',
    englishName: 'Professional Business Pack',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    badge: 'সবচেয়ে জনপ্রিয় ⭐',
    description: 'ফার্মেসি, ফ্যাশন শোরুম, ইলেকট্রনিক্স ও মাঝারি ডিপার্টমেন্টাল স্টোরের সেরা চয়েস',
    maxProducts: 5000,
    maxSalesMonthly: 'unlimited',
    maxStaff: 3,
    maxBranches: 1,
    isPopular: true,
    features: [
      { title: 'সর্বোচ্চ ৫,০০০ টি পণ্য, ভ্যারিয়েন্ট ও ব্যাচ ট্র্যাকিং', included: true },
      { title: 'আনলিমিটেড POS ও অফলাইন বিক্রয় লেনদেন', included: true },
      { title: '৩ জন স্টাফ/ক্যাশিয়ার রোল ও পারমিশন কন্ট্রোল', included: true },
      { title: 'ওষুধের মেয়াদোত্তীর্ণ (Expiry) ও স্টক অ্যালার্ট', included: true },
      { title: 'ক্যামেরা ও হ্যান্ডহেল্ড বারকোড স্ক্যানার', included: true },
      { title: 'হোয়াটসঅ্যাপে সরাসরি ডিজিটাল মেমো ও রসিদ শেয়ার', included: true },
      { title: 'বকেয়া তাগাদায় সরাসরি বিকাশ/নগদ পেমেন্ট লিংক', included: true },
      { title: 'দিনশেষে ক্যাশ ড্রয়ার ক্লোজিং ও আনুমানিক নিট লাভ', included: true },
      { title: 'কুরিয়ার ইন্টিগ্রেশন (Steadfast, Pathao, RedX)', included: true },
      { title: 'মাল্টি-ব্রাঞ্চ সেন্ট্রাল স্টক ট্রান্সফার', included: false },
    ],
  },
  {
    id: 'business-pro',
    key: 'Business Pro',
    name: 'এন্টারপ্রাইজ / চেইন (Business Pro)',
    englishName: 'Enterprise Chain Pack',
    monthlyPrice: 1999,
    yearlyPrice: 19999,
    badge: 'সব ফিচার আনলকড',
    description: 'মাল্টি-ব্রাঞ্চ শপ, সুপারশপ, পাইকারি আড়ত ও বড় ব্র্যান্ডেড শোরুমের জন্য',
    maxProducts: 'unlimited',
    maxSalesMonthly: 'unlimited',
    maxStaff: 'unlimited',
    maxBranches: 'unlimited',
    isPopular: false,
    features: [
      { title: 'আনলিমিটেড পণ্য, ইনভেন্টরি ও ভ্যারিয়েন্ট', included: true },
      { title: 'আনলিমিটেড POS অর্ডার ও সেন্ট্রাল ইনভয়েসিং', included: true },
      { title: 'আনলিমিটেড ব্রাঞ্চ ও সেন্ট্রাল স্টক ট্রান্সফার', included: true },
      { title: 'আনলিমিটেড ইউজার ও কাস্টম অ্যাক্সেস রুলস', included: true },
      { title: 'ওষুধের এক্সপায়ারি, ড্রয়ার ক্লোজিং ও নিট লাভ অডিট', included: true },
      { title: 'সাপ্লায়ার এলসি, চালান ও পাইকারি বাকির খাতা', included: true },
      { title: 'অটোমেটেড বাল্ক এসএমএস ও হোয়াটসঅ্যাপ ক্যাম্পেইন', included: true },
      { title: '২৪/৭ ডেডিকেটেড ভিআইপি রিমোট সাপোর্ট (AnyDesk)', included: true },
      { title: 'কাস্টম ব্র্যান্ডেড ডোমেইন ও এক্সক্লুসিভ ফিচার', included: true },
    ],
  },
  {
    id: 'lifetime',
    key: 'Lifetime',
    name: 'লাইফটাইম লাইসেন্স (Lifetime License)',
    englishName: 'Lifetime Ownership License',
    monthlyPrice: 0,
    yearlyPrice: 14999,
    isLifetime: true,
    lifetimePrice: 14999,
    badge: 'এককালীন পেমেন্ট — আজীবন মালিকানা',
    description: 'কোনো মাসিক চার্জ নেই! আজীবনের জন্য ফুল সফটওয়্যার লাইসেন্স ও ১ বছর ফ্রি ক্লাউড ব্যাকআপ',
    maxProducts: 10000,
    maxSalesMonthly: 'unlimited',
    maxStaff: 5,
    maxBranches: 2,
    isPopular: false,
    features: [
      { title: 'আজীবন ফুল সফটওয়্যার লাইসেন্স অ্যাক্সেস', included: true },
      { title: 'কোনো মাসিক বা বাৎসরিক সফটওয়্যার চার্জ নেই', included: true },
      { title: '১০,০০০ টি পর্যন্ত পণ্য ও ইনভেন্টরি সমর্থন', included: true },
      { title: '১ বছর ফ্রি গুগল ক্লাউড ব্যাকআপ ও ডাটা সুরক্ষা', included: true },
      { title: '৫ জন ইউজার ও ২টি শপ/ব্রাঞ্চ সংযোগ', included: true },
      { title: 'ক্যামেরা বারকোড, অফলাইন সিঙ্ক ও ক্যাশ ড্রয়ার', included: true },
      { title: 'হোয়াটসঅ্যাপ মেমো ও বিকাশ পে-লিংক সুবিধা', included: true },
      { title: 'লাইফটাইম বাগ ফিক্স ও সিকিউরিটি আপডেট', included: true },
    ],
  },
];

export interface PaymentRecord {
  id: string;
  planKey: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'Card' | string;
  trxId: string;
  status: 'Completed' | 'Pending';
  date: string;
  expiryDate: string;
}

export const subscriptionService = {
  getPackages(): SubscriptionPackage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((pkg: any) => ({
            ...pkg,
            features: Array.isArray(pkg?.features) ? pkg.features : [],
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load packages from localStorage:', e);
    }
    return DEFAULT_PACKAGES;
  },

  savePackage(pkg: SubscriptionPackage): SubscriptionPackage[] {
    const list = this.getPackages();
    const existingIndex = list.findIndex((p) => p.id === pkg.id);
    let updated: SubscriptionPackage[];

    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...pkg };
    } else {
      updated = [...list, { ...pkg, isCustom: true, createdAt: new Date().toISOString() }];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_packages_updated'));
    }
    return updated;
  },

  deletePackage(id: string): SubscriptionPackage[] {
    const list = this.getPackages();
    const updated = list.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_packages_updated'));
    }
    return updated;
  },

  resetToDefault(): SubscriptionPackage[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PACKAGES));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_packages_updated'));
    }
    return DEFAULT_PACKAGES;
  },

  getPaymentHistory(): PaymentRecord[] {
    try {
      const stored = localStorage.getItem(PAYMENT_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read payment history:', e);
    }
    return [
      {
        id: 'PAY-89211',
        planKey: 'Professional',
        planName: 'প্রফেশনাল প্যাক (Professional)',
        amount: 9999,
        billingCycle: 'yearly',
        paymentMethod: 'bKash',
        trxId: '9K87TR9102',
        status: 'Completed',
        date: '2026-01-01',
        expiryDate: '2026-12-31',
      },
    ];
  },

  recordPayment(record: Omit<PaymentRecord, 'id' | 'date'>): PaymentRecord {
    const history = this.getPaymentHistory();
    const newRecord: PaymentRecord = {
      ...record,
      id: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newRecord, ...history];
    localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(updated));
    return newRecord;
  },
};
