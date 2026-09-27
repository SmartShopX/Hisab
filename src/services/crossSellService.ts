import { Product, Order, CartItem } from '../types';
import { DataStore } from './dataStorage';

export interface CrossSellItem {
  product: Product;
  frequency: number; // How many past orders had this combo
  confidencePercent: number; // % of times this was bought when trigger product was bought
  liftScore: number;
  reason: string;
  badge: 'TOP_COMBO' | 'FREQUENT_MATCH' | 'ESSENTIAL_ADDON' | 'CATEGORY_SYNERGY';
  bundleDiscountPercent?: number;
}

export interface CrossSellSettings {
  enabled: boolean;
  autoShowOnAdd: boolean;
  maxSuggestions: number;
  minConfidence: number; // e.g., 15%
}

const CROSS_SELL_SETTINGS_KEY = 'smartshopx_cross_sell_settings';

const DEFAULT_SETTINGS: CrossSellSettings = {
  enabled: true,
  autoShowOnAdd: true,
  maxSuggestions: 4,
  minConfidence: 10,
};

// Seeded synergistic pairs for popular retail categories to enrich recommendations even when order history is fresh
const SEED_CATEGORY_SYNERGIES: Record<string, string[]> = {
  // Mobile / Tech
  'Mobile & Telecom': ['CHG-20W-PD', 'CASE-IP15-ARM', 'PB-10K-MAG', 'SW-S9-AMOLED', 'EAR-ANC-01'],
  'Electronics': ['EAR-ANC-01', 'CHG-20W-PD', 'PB-10K-MAG', 'SW-S9-AMOLED'],
  'Mobile, Telecom & Accessories': ['CHG-20W-PD', 'CASE-IP15-ARM', 'PB-10K-MAG'],
  
  // Pharmacy & Medicine
  'Medicine': ['prod_pharm_2', 'prod_pharm_3', 'prod_pharm_4', 'prod_pharm_5', 'prod_pharm_1'],
  'Pharmacy & Medicine': ['prod_pharm_2', 'prod_pharm_3', 'prod_pharm_4', 'prod_pharm_5'],
  'Pharmacy': ['prod_pharm_2', 'prod_pharm_3', 'prod_pharm_4'],

  // Grocery & Food
  'Grocery': ['prod_groc_1', 'prod_groc_2', 'prod_groc_3'],
  'Restaurant & Food': ['prod_groc_2', 'prod_groc_3'],
  'Fashion & Clothing': ['prod_fash_2', 'prod_fash_3'],
};

class CrossSellService {
  public getSettings(): CrossSellSettings {
    try {
      const data = localStorage.getItem(CROSS_SELL_SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<CrossSellSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(CROSS_SELL_SETTINGS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smartshopx_cross_sell_settings_changed', { detail: updated }));
    }
  }

  /**
   * Mines historical orders to extract cross-sell item recommendations
   * for a specific target product or a list of items currently in the cart.
   */
  public getRecommendationsForProduct(
    targetProduct: Product,
    allProducts: Product[],
    cartProductIds: string[] = [],
    limit?: number
  ): CrossSellItem[] {
    const settings = this.getSettings();
    if (!settings.enabled) return [];

    const effectiveLimit = limit || settings.maxSuggestions;
    const orders = DataStore.getOrders();
    const targetId = targetProduct.id;

    // 1. Analyze Order Basket Co-occurrences
    let targetOrderCount = 0;
    const coOccurrenceMap = new Map<string, number>();

    orders.forEach((order) => {
      const itemIds = order.items?.map((it) => it.productId) || [];
      if (itemIds.includes(targetId)) {
        targetOrderCount++;
        itemIds.forEach((id) => {
          if (id !== targetId && !cartProductIds.includes(id)) {
            coOccurrenceMap.set(id, (coOccurrenceMap.get(id) || 0) + 1);
          }
        });
      }
    });

    const results: CrossSellItem[] = [];
    const addedProductIds = new Set<string>([...cartProductIds, targetId]);

    // Calculate confidence for co-occurring items
    if (targetOrderCount > 0) {
      coOccurrenceMap.forEach((freq, prodId) => {
        const product = allProducts.find((p) => p.id === prodId && p.isActive && p.stock > 0);
        if (product) {
          const confidence = Math.min(100, Math.round((freq / targetOrderCount) * 100));
          const totalOrders = Math.max(1, orders.length);
          const probB = orders.filter((o) => o.items?.some((i) => i.productId === prodId)).length / totalOrders;
          const liftScore = probB > 0 ? Number(((confidence / 100) / probB).toFixed(2)) : 1.2;

          let badge: CrossSellItem['badge'] = 'FREQUENT_MATCH';
          if (confidence >= 40 || freq >= 4) {
            badge = 'TOP_COMBO';
          } else if (liftScore > 1.5) {
            badge = 'ESSENTIAL_ADDON';
          }

          const reason =
            confidence >= 35
              ? `${confidence}% ক্রেতা একসাথে কিনেছেন (${freq}টি অর্ডার)`
              : `${freq}টি অর্ডারে একসাথে বিক্রি হয়েছে`;

          results.push({
            product,
            frequency: freq,
            confidencePercent: Math.max(15, confidence),
            liftScore,
            reason,
            badge,
            bundleDiscountPercent: confidence >= 50 ? 5 : undefined,
          });

          addedProductIds.add(prodId);
        }
      });
    }

    // Sort historical results by frequency & confidence descending
    results.sort((a, b) => b.frequency - a.frequency || b.confidencePercent - a.confidencePercent);

    // 2. Synergistic Domain Fallback / Category Complement Mining
    // If not enough historical co-occurrences found, supplement with intelligent complementary products
    if (results.length < effectiveLimit) {
      const categoryProducts = allProducts.filter(
        (p) =>
          p.id !== targetId &&
          !addedProductIds.has(p.id) &&
          p.isActive &&
          p.stock > 0 &&
          (p.category === targetProduct.category ||
            (targetProduct.genericName && p.genericName && p.genericName !== targetProduct.genericName) ||
            p.brand === targetProduct.brand)
      );

      // Give priority to popular accessories or complementary items
      for (const compProd of categoryProducts) {
        if (results.length >= effectiveLimit) break;

        const isSameBrand = compProd.brand && compProd.brand === targetProduct.brand;
        const isSameCat = compProd.category === targetProduct.category;

        // Estimate synthetic synergy based on category and brand
        const confidence = isSameBrand ? 38 : isSameCat ? 28 : 20;
        const reason = isSameBrand
          ? `${targetProduct.brand} ব্র্যান্ডের কমপ্যাক্ট অনুষঙ্গ`
          : `${targetProduct.category} ক্যাটাগরির সেরা কম্বো`;

        results.push({
          product: compProd,
          frequency: Math.max(1, Math.floor(targetOrderCount * 0.3)),
          confidencePercent: confidence,
          liftScore: isSameBrand ? 1.4 : 1.2,
          reason,
          badge: 'CATEGORY_SYNERGY',
          bundleDiscountPercent: undefined,
        });

        addedProductIds.add(compProd.id);
      }
    }

    // 3. Fallback to top-selling items in catalog if still below limit
    if (results.length < effectiveLimit) {
      const topSelling = allProducts.filter(
        (p) => !addedProductIds.has(p.id) && p.isActive && p.stock > 0
      );

      for (const topProd of topSelling) {
        if (results.length >= effectiveLimit) break;
        results.push({
          product: topProd,
          frequency: 1,
          confidencePercent: 18,
          liftScore: 1.1,
          reason: 'জনপ্রিয় দ্রুত বিক্রিত পণ্য',
          badge: 'ESSENTIAL_ADDON',
        });
        addedProductIds.add(topProd.id);
      }
    }

    return results.slice(0, effectiveLimit);
  }

  /**
   * Aggregate cross-sell recommendations for the entire cart
   */
  public getRecommendationsForCart(
    cart: CartItem[],
    allProducts: Product[],
    limit: number = 6
  ): CrossSellItem[] {
    if (cart.length === 0) return [];

    const cartProductIds = cart.map((item) => item.product.id);
    const aggregatedMap = new Map<string, CrossSellItem>();

    // Analyze for each item in the cart
    cart.forEach((cartItem) => {
      const recs = this.getRecommendationsForProduct(
        cartItem.product,
        allProducts,
        cartProductIds,
        4
      );

      recs.forEach((rec) => {
        const existing = aggregatedMap.get(rec.product.id);
        if (existing) {
          existing.frequency += rec.frequency;
          existing.confidencePercent = Math.min(
            98,
            Math.max(existing.confidencePercent, rec.confidencePercent) + 10
          );
          existing.badge = 'TOP_COMBO';
          existing.reason = `কার্টের পণ্যের সাথে অত্যন্ত জনপ্রিয় কম্বিনেশন`;
        } else {
          aggregatedMap.set(rec.product.id, { ...rec });
        }
      });
    });

    const sorted = Array.from(aggregatedMap.values()).sort(
      (a, b) => b.confidencePercent - a.confidencePercent || b.frequency - a.frequency
    );

    return sorted.slice(0, limit);
  }
}

export const crossSellService = new CrossSellService();
export default crossSellService;
