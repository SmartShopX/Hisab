import { CartItem, Product } from '../types';

export interface ItemMarginDetail {
  productId: string;
  productName: string;
  quantity: number;
  selectedUnit: string;
  unitMultiplier: number;
  unitCost: number; // Purchase price for 1 selling unit
  totalCost: number; // unitCost * quantity
  unitPrice: number; // Selling price for 1 unit
  totalRevenue: number; // unitPrice * quantity
  grossProfit: number; // totalRevenue - totalCost
  marginPercent: number; // (grossProfit / totalRevenue) * 100
  markupPercent: number; // (grossProfit / totalCost) * 100
  status: 'LOSS' | 'BELOW_TARGET' | 'HEALTHY' | 'HIGH_MARGIN';
  isBelowThreshold: boolean;
}

export interface BasketMarginSummary {
  totalCost: number;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  netProfit: number;
  overallMarginPercent: number;
  overallMarkupPercent: number;
  targetThresholdPercent: number;
  belowThresholdCount: number;
  hasLossItems: boolean;
  maxSafeDiscount: number; // Maximum discount possible while maintaining targetThreshold
  status: 'LOSS' | 'BELOW_TARGET' | 'HEALTHY' | 'EXCELLENT';
  items: ItemMarginDetail[];
}

export interface CostProfitSettings {
  targetMarginThreshold: number; // default: 15%
  enableLowMarginAlert: boolean;
  enableMarginBadgesInCart: boolean;
  preventLossSale: boolean;
}

const SETTINGS_STORAGE_KEY = 'smartshopx_cost_profit_settings';

const DEFAULT_SETTINGS: CostProfitSettings = {
  targetMarginThreshold: 15,
  enableLowMarginAlert: true,
  enableMarginBadgesInCart: true,
  preventLossSale: false,
};

class CostProfitService {
  public getSettings(): CostProfitSettings {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<CostProfitSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smartshopx_cost_profit_settings_changed', { detail: updated })
      );
    }
  }

  /**
   * Calculates real-time cost, profit, and margin breakdown for a cart
   */
  public calculateBasketMargin(
    cart: CartItem[],
    discountAmount: number = 0,
    customThreshold?: number
  ): BasketMarginSummary {
    const settings = this.getSettings();
    const threshold =
      customThreshold !== undefined ? customThreshold : settings.targetMarginThreshold;

    if (cart.length === 0) {
      return {
        totalCost: 0,
        subtotal: 0,
        discountAmount: 0,
        finalTotal: 0,
        netProfit: 0,
        overallMarginPercent: 0,
        overallMarkupPercent: 0,
        targetThresholdPercent: threshold,
        belowThresholdCount: 0,
        hasLossItems: false,
        maxSafeDiscount: 0,
        status: 'HEALTHY',
        items: [],
      };
    }

    let totalCost = 0;
    let subtotal = 0;
    let belowThresholdCount = 0;
    let hasLossItems = false;

    const items: ItemMarginDetail[] = cart.map((item) => {
      const multiplier = item.unitMultiplier || 1;
      const unitCost = (item.product.purchasePrice || 0) * multiplier;
      const itemTotalCost = unitCost * item.quantity;
      const itemRevenue = item.total; // unitPrice * quantity
      const grossProfit = itemRevenue - itemTotalCost;
      
      const marginPercent =
        itemRevenue > 0 ? Math.round((grossProfit / itemRevenue) * 1000) / 10 : 0;
      const markupPercent =
        itemTotalCost > 0 ? Math.round((grossProfit / itemTotalCost) * 1000) / 10 : 0;

      let status: ItemMarginDetail['status'] = 'HEALTHY';
      let isBelowThreshold = false;

      if (grossProfit < 0 || marginPercent < 0) {
        status = 'LOSS';
        isBelowThreshold = true;
        hasLossItems = true;
        belowThresholdCount++;
      } else if (marginPercent < threshold) {
        status = 'BELOW_TARGET';
        isBelowThreshold = true;
        belowThresholdCount++;
      } else if (marginPercent >= 35) {
        status = 'HIGH_MARGIN';
      } else {
        status = 'HEALTHY';
      }

      totalCost += itemTotalCost;
      subtotal += itemRevenue;

      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        selectedUnit: item.selectedUnit || 'Pcs',
        unitMultiplier: multiplier,
        unitCost,
        totalCost: itemTotalCost,
        unitPrice: item.unitPrice,
        totalRevenue: itemRevenue,
        grossProfit,
        marginPercent,
        markupPercent,
        status,
        isBelowThreshold,
      };
    });

    const finalTotal = Math.max(0, subtotal - discountAmount);
    const netProfit = finalTotal - totalCost;

    const overallMarginPercent =
      finalTotal > 0 ? Math.round((netProfit / finalTotal) * 1000) / 10 : 0;
    const overallMarkupPercent =
      totalCost > 0 ? Math.round((netProfit / totalCost) * 1000) / 10 : 0;

    // Max safe discount calculation:
    // Required revenue = totalCost / (1 - threshold/100)
    // Max safe discount = subtotal - Required revenue
    const requiredRevenue = totalCost / (1 - threshold / 100);
    const maxSafeDiscount = Math.max(0, Math.floor(subtotal - requiredRevenue));

    let overallStatus: BasketMarginSummary['status'] = 'HEALTHY';
    if (netProfit < 0 || overallMarginPercent < 0) {
      overallStatus = 'LOSS';
    } else if (overallMarginPercent < threshold) {
      overallStatus = 'BELOW_TARGET';
    } else if (overallMarginPercent >= 30) {
      overallStatus = 'EXCELLENT';
    }

    return {
      totalCost,
      subtotal,
      discountAmount,
      finalTotal,
      netProfit,
      overallMarginPercent,
      overallMarkupPercent,
      targetThresholdPercent: threshold,
      belowThresholdCount,
      hasLossItems,
      maxSafeDiscount,
      status: overallStatus,
      items,
    };
  }
}

export const costProfitService = new CostProfitService();
export default costProfitService;
