import React, { useState } from 'react';
import {
  Pill,
  ChevronDown,
  ChevronRight,
  Plus,
  AlertTriangle,
  Sparkles,
  Layers,
  MapPin,
  Tag,
  Package,
} from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import { getCategoryIcon } from './PosCategoryDepartmentFilter';
import { useLanguage } from '../../context/LanguageContext';

interface PosGroupedProductListProps {
  productsByCategory: Record<string, Product[]>;
  onAddToCart: (product: Product, unit?: 'Pcs' | 'Strip' | 'Box') => void;
  onOpenSubstitute: (e: React.MouseEvent, product: Product) => void;
  onQuickInwardStock?: (product: Product) => void;
}

export const PosGroupedProductList: React.FC<PosGroupedProductListProps> = ({
  productsByCategory,
  onAddToCart,
  onOpenSubstitute,
  onQuickInwardStock,
}) => {
  const { isEn } = useLanguage();
  const categoryKeys = Object.keys(productsByCategory);

  // Default: all expanded
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedCategories(new Set());
  const collapseAll = () => setCollapsedCategories(new Set(categoryKeys));

  if (categoryKeys.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
        <p className="font-bold text-sm">কোনো পণ্য পাওয়া যায়নি</p>
        <p className="text-xs text-slate-400 mt-0.5">অনুগ্রহ করে ফিল্টার পরিবর্তন বা সার্চ কোয়েরি মুছে দিন</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group controls */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {categoryKeys.length} টি বিভাগে সাজানো পণ্যসমূহ
        </span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
          >
            {isEn ? 'Expand All' : 'সব খুলুন'}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-slate-500 hover:underline font-semibold cursor-pointer"
          >
            {isEn ? 'Collapse All' : 'সব বন্ধ করুন'}
          </button>
        </div>
      </div>

      {categoryKeys.map((categoryName) => {
        const categoryProducts = productsByCategory[categoryName];
        const isCollapsed = collapsedCategories.has(categoryName);
        const inStockCount = categoryProducts.filter((p) => p.stock > 0).length;

        return (
          <div
            key={categoryName}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
          >
            {/* Category Accordion Header */}
            <button
              type="button"
              onClick={() => toggleCategory(categoryName)}
              className="w-full px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  {getCategoryIcon(categoryName)}
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {categoryName}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {categoryProducts.length} টি পণ্য ({inStockCount} স্টকে)
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {/* Category Products Grid */}
            {!isCollapsed && (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50/30 dark:bg-slate-900/30">
                {categoryProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const finalPrice = p.sellingPrice - p.discount;
                  const exp = getExpiryStatus(p.expiryDate);
                  const hasPharmacyDetails = Boolean(p.genericName || p.rackLocation || p.piecesPerStrip);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && onAddToCart(p, 'Pcs')}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                        isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                              {p.category.toLowerCase().includes('pharmacy') ? (
                                <Pill className="w-8 h-8 text-emerald-300" />
                              ) : (
                                <Package className="w-8 h-8" />
                              )}
                            </div>
                          )}

                          {/* Expiry Warning Badge */}
                          {exp.isExpired && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white flex items-center gap-0.5 shadow-xs">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>মেয়াদোত্তীর্ণ</span>
                            </span>
                          )}
                          {!exp.isExpired && exp.isNearExpiry && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white flex items-center gap-0.5 shadow-xs">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>মেয়াদ শেষের পথে</span>
                            </span>
                          )}

                          {/* Out of Stock Ribbon */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                              <span className="text-white text-xs font-bold bg-rose-600 px-2 py-0.5 rounded-md">
                                স্টক আউট
                              </span>
                              {p.genericName && (
                                <button
                                  type="button"
                                  onClick={(e) => onOpenSubstitute(e, p)}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>বিকল্প দেখুন</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Product Title & Brand */}
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                            {p.name}
                          </p>

                          {hasPharmacyDetails && (
                            <div className="space-y-0.5">
                              {p.genericName && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium line-clamp-1">
                                  {p.genericName}
                                </p>
                              )}
                              {p.rackLocation && (
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 font-mono font-semibold flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{p.rackLocation}</span>
                                </p>
                              )}
                            </div>
                          )}

                          {p.brand && !hasPharmacyDetails && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {p.brand}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Stock info */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 mt-2">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatCurrency(finalPrice)}
                            </span>
                            {p.discount > 0 && (
                              <span className="text-[10px] line-through text-slate-400 font-mono">
                                {formatCurrency(p.sellingPrice)}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-mono ${
                              p.stock <= p.minStock
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            স্টক: {p.stock} {p.unit || 'টি'}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center shrink-0 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PosGroupedProductList;
