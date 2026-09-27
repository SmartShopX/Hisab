import { Product } from '../types';

export interface ExpiryStatus {
  isExpired: boolean;
  isNearExpiry: boolean;
  daysRemaining: number;
  formattedText: string;
  badgeClass: string;
}

/**
 * Checks if a medicine is expired or near expiry (default within 90 days)
 */
export function getExpiryStatus(expiryDate?: string, thresholdDays = 90): ExpiryStatus {
  if (!expiryDate) {
    return {
      isExpired: false,
      isNearExpiry: false,
      daysRemaining: 9999,
      formattedText: 'মেয়াদ তারিখ নেই',
      badgeClass: 'text-slate-400 bg-slate-100',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      isExpired: true,
      isNearExpiry: false,
      daysRemaining,
      formattedText: `মেয়াদ শেষ (${Math.abs(daysRemaining)} দিন আগে)`,
      badgeClass: 'text-rose-700 bg-rose-100 border-rose-300 font-bold',
    };
  }

  if (daysRemaining <= thresholdDays) {
    return {
      isExpired: false,
      isNearExpiry: true,
      daysRemaining,
      formattedText: `মেয়াদ শেষ হতে ${daysRemaining} দিন বাকি`,
      badgeClass: 'text-amber-800 bg-amber-100 border-amber-300 font-bold animate-pulse',
    };
  }

  return {
    isExpired: false,
    isNearExpiry: false,
    daysRemaining,
    formattedText: `মেয়াদ: ${expiryDate}`,
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
}

/**
 * Finds alternative / substitute medicines sharing the exact or matching generic name
 */
export function findMedicineSubstitutes(currentProduct: Product, allProducts: Product[]): Product[] {
  if (!currentProduct.genericName) return [];

  const genericNormalized = currentProduct.genericName.trim().toLowerCase();

  return allProducts.filter(
    (p) =>
      p.id !== currentProduct.id &&
      p.genericName &&
      p.genericName.trim().toLowerCase() === genericNormalized &&
      p.isActive
  );
}

/**
 * Calculates price and piece-multiplier based on selected pharmacy unit (Piece vs Strip vs Box)
 */
export function getPharmacyUnitInfo(
  product: Product,
  unit: 'Pcs' | 'Strip' | 'Box' = 'Pcs'
): { unitPrice: number; multiplier: number; label: string; stockInUnit: number } {
  const basePrice = Math.max(0, product.sellingPrice - (product.discount || 0));
  const piecesPerStrip = product.piecesPerStrip || 10;
  const stripsPerBox = product.stripsPerBox || 10;
  const totalPiecesPerBox = piecesPerStrip * stripsPerBox;

  if (unit === 'Box') {
    const boxPrice = product.boxPrice || basePrice * totalPiecesPerBox * 0.95; // Default 5% bundle discount for full box if not set
    const stockInBox = Math.floor(product.stock / totalPiecesPerBox);
    return {
      unitPrice: Math.round(boxPrice),
      multiplier: totalPiecesPerBox,
      label: `১ বক্স (${totalPiecesPerBox} পিস)`,
      stockInUnit: stockInBox,
    };
  }

  if (unit === 'Strip') {
    const stripPrice = product.stripPrice || basePrice * piecesPerStrip;
    const stockInStrip = Math.floor(product.stock / piecesPerStrip);
    return {
      unitPrice: Math.round(stripPrice),
      multiplier: piecesPerStrip,
      label: `১ পাতা (${piecesPerStrip} পিস)`,
      stockInUnit: stockInStrip,
    };
  }

  // Single Piece / Tablet
  return {
    unitPrice: basePrice,
    multiplier: 1,
    label: `১ পিস/ট্যাবলেট`,
    stockInUnit: product.stock,
  };
}
