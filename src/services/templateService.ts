import { BusinessCategory, CanonicalCategory, ShopTemplate, Shop } from '../types';

export interface CategoryMetadata {
  id: CanonicalCategory;
  nameBn: string;
  nameEn: string;
  description: string;
  defaultTemplate: ShopTemplate;
  recommendedModules: string[];
}

export interface TemplateMetadata {
  id: ShopTemplate;
  nameBn: string;
  nameEn: string;
  description: string;
  badge: string;
  features: {
    hasBarcode: boolean;
    hasIMEI: boolean;
    hasExpiry: boolean;
    hasVariants: boolean;
    hasOnlineStore: boolean;
    hasTelecom: boolean;
    hasWholesale: boolean;
    hasAppointments: boolean;
    hasTables: boolean;
  };
}

export const CANONICAL_CATEGORY_METADATA: Record<CanonicalCategory, CategoryMetadata> = {
  'General & Trading': {
    id: 'General & Trading',
    nameBn: 'জেনারেল রিটেইল ও ট্রেডিং',
    nameEn: 'General & Trading',
    description: 'মুদি, ডিপার্টমেন্টাল, স্টেশনারি ও সাধারণ পাইকারি/খুচরা পণ্যের ব্যবসা',
    defaultTemplate: 'Grocery & Supermarket',
    recommendedModules: ['hasBarcode', 'hasWholesale', 'hasOnlineStore'],
  },
  'Pharmacy & Medicine': {
    id: 'Pharmacy & Medicine',
    nameBn: 'ফার্মেসি ও মেডিসিন',
    nameEn: 'Pharmacy & Medicine',
    description: 'ঔষধের খুচরা ও পাইকারি দোকান, ব্যাচ ও এক্সপায়ারি ট্র্যাকিং',
    defaultTemplate: 'Pharmacy & Healthcare',
    recommendedModules: ['hasBarcode', 'hasExpiry'],
  },
  'Mobile, Telecom & Accessories': {
    id: 'Mobile, Telecom & Accessories',
    nameBn: 'মোবাইল, টেলিকম ও এক্সেসরিজ',
    nameEn: 'Mobile, Telecom & Accessories',
    description: 'স্মার্টফোন বিক্রয়, আইএমইআই (IMEI) ট্র্যাকিং, রিচার্জ ও বিকাশ-নগদ হিসাব',
    defaultTemplate: 'Electronics & Telecom',
    recommendedModules: ['hasBarcode', 'hasIMEI', 'hasTelecom'],
  },
  'Fashion & Clothing': {
    id: 'Fashion & Clothing',
    nameBn: 'ফ্যাশন, গার্মেন্টস ও বুটিক',
    nameEn: 'Fashion & Clothing',
    description: 'পোশাক, জুতা ও ফ্যাশন এক্সেসরিজ সাইজ ও কালার ভ্যারিয়েন্ট সহ',
    defaultTemplate: 'Fashion & Apparel',
    recommendedModules: ['hasBarcode', 'hasVariants', 'hasOnlineStore'],
  },
  'Restaurant & Food': {
    id: 'Restaurant & Food',
    nameBn: 'রেস্তোরাঁ, ফাস্টফুড ও ক্যাফে',
    nameEn: 'Restaurant & Food',
    description: 'টেবিল ম্যানেজমেন্ট, কিচেন ও পার্সেল ফুড অর্ডার',
    defaultTemplate: 'Restaurant & Food',
    recommendedModules: ['hasTables', 'hasOnlineStore'],
  },
  'E-Commerce & Online Business': {
    id: 'E-Commerce & Online Business',
    nameBn: 'ই-কমার্স ও অনলাইন শপ',
    nameEn: 'E-Commerce & Online Business',
    description: 'ফেসবুক পেজ ও ওয়েবসাইট ভিত্তিক পণ্য বিক্রয় ও কুরিয়ার ট্র্যাকিং',
    defaultTemplate: 'Standard Retail',
    recommendedModules: ['hasOnlineStore', 'hasVariants'],
  },
  'Salon & Beauty': {
    id: 'Salon & Beauty',
    nameBn: 'স্যালুন, পার্লার ও রূপচর্চা',
    nameEn: 'Salon & Beauty',
    description: 'বিউটি পার্লার, জেন্টস স্যালুন ও সার্ভিস অ্যাপয়েন্টমেন্ট',
    defaultTemplate: 'Service & Repair',
    recommendedModules: ['hasAppointments'],
  },
  'Coaching & Academy': {
    id: 'Coaching & Academy',
    nameBn: 'কোচিং, একাডেমি ও প্রশিক্ষণ',
    nameEn: 'Coaching & Academy',
    description: 'শিক্ষার্থী ভর্তি, মাসিক বেতন ও ফি কালেকশন',
    defaultTemplate: 'Service & Repair',
    recommendedModules: ['hasAppointments'],
  },
  'Hardware & Building Materials': {
    id: 'Hardware & Building Materials',
    nameBn: 'হার্ডওয়্যার ও স্যানিটারি',
    nameEn: 'Hardware & Building Materials',
    description: 'রড, সিমেন্ট, পাইপ, ফিটিংস ও নির্মাণ সামগ্রীর ব্যবসা',
    defaultTemplate: 'Wholesaler / Distributor',
    recommendedModules: ['hasBarcode', 'hasWholesale'],
  },
  'Books, Stationery & Photocopy': {
    id: 'Books, Stationery & Photocopy',
    nameBn: 'বই, স্টেশনারি ও ফটোকপি',
    nameEn: 'Books, Stationery & Photocopy',
    description: 'বইয়ের লাইব্রেরি, খাতা-কলম ও অফিশিয়াল সাপ্লাই',
    defaultTemplate: 'Standard Retail',
    recommendedModules: ['hasBarcode'],
  },
  'Computer & Electronics': {
    id: 'Computer & Electronics',
    nameBn: 'কম্পিউটার ও ইলেকট্রনিক্স',
    nameEn: 'Computer & Electronics',
    description: 'কম্পিউটার, ল্যাপটপ, হোম এপ্লায়েন্স ও সিরিয়াল নাম্বার ওয়ারেন্টি',
    defaultTemplate: 'Electronics & Telecom',
    recommendedModules: ['hasBarcode', 'hasIMEI'],
  },
  'Mess, Hostel & Rental': {
    id: 'Mess, Hostel & Rental',
    nameBn: 'মেস, হোস্টেল ও বাড়ি ভাড়া',
    nameEn: 'Mess, Hostel & Rental',
    description: 'সদস্যদের মিল রেট, সিট ভাড়া ও মাসিক বাজার হিসাব',
    defaultTemplate: 'Service & Repair',
    recommendedModules: [],
  },
  'Savings, Loan & Cooperative': {
    id: 'Savings, Loan & Cooperative',
    nameBn: 'সমবায় ও সঞ্চয় ঋণ সমিতি',
    nameEn: 'Savings, Loan & Cooperative',
    description: 'দৈনিক ও সাপ্তাহিক সঞ্চয় জমা ও ঋণ কিস্তি আদায়',
    defaultTemplate: 'Wholesaler / Distributor',
    recommendedModules: [],
  },
  'Professional Services': {
    id: 'Professional Services',
    nameBn: 'প্রফেশনাল ও কনসালট্যান্সি',
    nameEn: 'Professional Services',
    description: 'ডাক্তার, আইনজীবী, ইঞ্জিনিয়ার ও কনসালট্যান্ট বিলিং',
    defaultTemplate: 'Service & Repair',
    recommendedModules: ['hasAppointments'],
  },
  'Auto, Bike & Transport': {
    id: 'Auto, Bike & Transport',
    nameBn: 'অটোমোবাইল ও মোটর পার্টস',
    nameEn: 'Auto, Bike & Transport',
    description: 'মোটরসাইকেল ও গাড়ির পার্টস এবং সার্ভিসিং ওয়ার্কশপ',
    defaultTemplate: 'Service & Repair',
    recommendedModules: ['hasBarcode', 'hasAppointments'],
  },
  'Agriculture, Fish & Livestock': {
    id: 'Agriculture, Fish & Livestock',
    nameBn: 'কৃষি, মৎস্য ও পোল্ট্রি খামার',
    nameEn: 'Agriculture, Fish & Livestock',
    description: 'বীজ, সার, কীটনাশক ও খামারের পাইকারি উৎপাদন ও বিক্রয়',
    defaultTemplate: 'Wholesaler / Distributor',
    recommendedModules: ['hasWholesale', 'hasExpiry'],
  },
};

export const TEMPLATE_METADATA: Record<ShopTemplate, TemplateMetadata> = {
  'Standard Retail': {
    id: 'Standard Retail',
    nameBn: 'স্ট্যান্ডার্ড রিটেইল শপ',
    nameEn: 'Standard Retail',
    description: 'যেকোনো ধরনের সাধারণ দোকান ও খুচরা ব্যবসার জন্য আদর্শ টেমপ্লেট',
    badge: 'সবচেয়ে জনপ্রিয়',
    features: {
      hasBarcode: true,
      hasIMEI: false,
      hasExpiry: false,
      hasVariants: false,
      hasOnlineStore: true,
      hasTelecom: false,
      hasWholesale: false,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Electronics & Telecom': {
    id: 'Electronics & Telecom',
    nameBn: 'ইলেকট্রনিক্স ও টেলিকম শপ',
    nameEn: 'Electronics & Telecom',
    description: 'IMEI / সিরিয়াল ট্র্যাকিং, মোবাইল রিচার্জ ও ফ্লেক্সিলোড সমৃদ্ধ বিশেষায়িত টেমপ্লেট',
    badge: 'টেলিকম ও গ্যাজেট',
    features: {
      hasBarcode: true,
      hasIMEI: true,
      hasExpiry: false,
      hasVariants: false,
      hasOnlineStore: true,
      hasTelecom: true,
      hasWholesale: false,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Fashion & Apparel': {
    id: 'Fashion & Apparel',
    nameBn: 'ফ্যাশন ও ক্লথিং বুটিক',
    nameEn: 'Fashion & Apparel',
    description: 'সাইজ, কালার, ফেব্রিক ভ্যারিয়েন্ট ও ফটো ক্যাটালগ সমৃদ্ধ ডিজাইন',
    badge: 'গার্মেন্টস ও বুটিক',
    features: {
      hasBarcode: true,
      hasIMEI: false,
      hasExpiry: false,
      hasVariants: true,
      hasOnlineStore: true,
      hasTelecom: false,
      hasWholesale: false,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Pharmacy & Healthcare': {
    id: 'Pharmacy & Healthcare',
    nameBn: 'ফার্মেসি ও ড্রাগ স্টোর',
    nameEn: 'Pharmacy & Healthcare',
    description: 'ব্যাচ নম্বর, মেয়াদ উত্তীর্ণের তারিখ (Expiry Date) ও জেনেরিক নাম ট্র্যাকিং',
    badge: 'মেডিসিন ও হেলথ',
    features: {
      hasBarcode: true,
      hasIMEI: false,
      hasExpiry: true,
      hasVariants: false,
      hasOnlineStore: false,
      hasTelecom: false,
      hasWholesale: false,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Grocery & Supermarket': {
    id: 'Grocery & Supermarket',
    nameBn: 'মুদি ও সুপারমার্কেট',
    nameEn: 'Grocery & Supermarket',
    description: 'দ্রুত বারকোড স্ক্যানিং, ওজন স্কেল সাপোর্ট ও খুচরা হিসাব',
    badge: 'দৈনন্দিন নিত্যপণ্য',
    features: {
      hasBarcode: true,
      hasIMEI: false,
      hasExpiry: true,
      hasVariants: false,
      hasOnlineStore: true,
      hasTelecom: false,
      hasWholesale: true,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Restaurant & Food': {
    id: 'Restaurant & Food',
    nameBn: 'রেস্তোরাঁ ও ক্যাফেটেরিয়া',
    nameEn: 'Restaurant & Food',
    description: 'টেবিল ম্যানেজমেন্ট, কিচেন টোকেন (KOT) ও ডাইন-ইন / পার্সেল সুবিধা',
    badge: 'খাবার ও ক্যাটারিং',
    features: {
      hasBarcode: false,
      hasIMEI: false,
      hasExpiry: false,
      hasVariants: false,
      hasOnlineStore: true,
      hasTelecom: false,
      hasWholesale: false,
      hasAppointments: false,
      hasTables: true,
    },
  },
  'Wholesaler / Distributor': {
    id: 'Wholesaler / Distributor',
    nameBn: 'পাইকারি আড়ত ও ডিস্ট্রিবিউটর',
    nameEn: 'Wholesaler / Distributor',
    description: 'কার্টন/বক্স রেট, স্পেশাল ডিলার ডিসকাউন্ট ও সরবরাহকারী খতিয়ান',
    badge: 'পাইকারি ব্যবসা',
    features: {
      hasBarcode: true,
      hasIMEI: false,
      hasExpiry: false,
      hasVariants: false,
      hasOnlineStore: false,
      hasTelecom: false,
      hasWholesale: true,
      hasAppointments: false,
      hasTables: false,
    },
  },
  'Service & Repair': {
    id: 'Service & Repair',
    nameBn: 'সার্ভিস ও রিপেয়ারিং সেন্টার',
    nameEn: 'Service & Repair',
    description: 'কাস্টমার বুকিং, কাজ গ্রহণের টোকেন ও পারিশ্রমিক বিলিং',
    badge: 'সেবা ও সার্ভিস',
    features: {
      hasBarcode: false,
      hasIMEI: false,
      hasExpiry: false,
      hasVariants: false,
      hasOnlineStore: false,
      hasTelecom: false,
      hasWholesale: false,
      hasAppointments: true,
      hasTables: false,
    },
  },
};

export class TemplateService {
  /**
   * Get default template recommendation for a category
   */
  static getDefaultTemplateForCategory(category: BusinessCategory): ShopTemplate {
    const meta = CANONICAL_CATEGORY_METADATA[category as CanonicalCategory];
    if (meta) return meta.defaultTemplate;

    // Fallbacks for legacy category strings
    if (category.includes('Mobile') || category.includes('Electronics')) return 'Electronics & Telecom';
    if (category.includes('Pharmacy') || category.includes('Medicine')) return 'Pharmacy & Healthcare';
    if (category.includes('Clothing') || category.includes('Fashion')) return 'Fashion & Apparel';
    if (category.includes('Restaurant') || category.includes('Food')) return 'Restaurant & Food';
    if (category.includes('Super') || category.includes('Grocery')) return 'Grocery & Supermarket';
    return 'Standard Retail';
  }

  /**
   * Check whether a specific feature/module is enabled for a shop
   */
  static isFeatureEnabled(shop: Shop, featureKey: keyof TemplateMetadata['features']): boolean {
    // 1. Explicit override in shop.modules takes top priority
    if (shop.modules && typeof shop.modules[featureKey] === 'boolean') {
      return shop.modules[featureKey];
    }

    // 2. Derive from shop template if specified
    if (shop.template && TEMPLATE_METADATA[shop.template as ShopTemplate]) {
      return TEMPLATE_METADATA[shop.template as ShopTemplate].features[featureKey];
    }

    // 3. Fallback to category default template
    const defaultTpl = this.getDefaultTemplateForCategory(shop.category);
    return TEMPLATE_METADATA[defaultTpl]?.features[featureKey] ?? false;
  }

  /**
   * Get active modules dictionary for a shop
   */
  static getResolvedModules(shop: Shop): Record<string, boolean> {
    const template = (shop.template as ShopTemplate) || this.getDefaultTemplateForCategory(shop.category);
    const defaults = TEMPLATE_METADATA[template]?.features || TEMPLATE_METADATA['Standard Retail'].features;
    return {
      ...defaults,
      ...(shop.modules || {}),
    };
  }
}
