import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  TrendingUp,
  Check,
  ChevronDown,
  Flame,
  PackagePlus,
  ShoppingBag,
} from 'lucide-react';
import { Product, CartItem } from '../../types';
import { CrossSellItem } from '../../services/crossSellService';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface CrossSellCartSectionProps {
  suggestions: CrossSellItem[];
  onAddToCart: (product: Product) => void;
  className?: string;
}

export const CrossSellCartSection: React.FC<CrossSellCartSectionProps> = ({
  suggestions,
  onAddToCart,
  className = '',
}) => {
  const { isEn } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) return null;

  const handleAdd = (item: CrossSellItem) => {
    onAddToCart(item.product);
    setAddedIds((prev) => new Set(prev).add(item.product.id));
  };

  return (
    <div
      className={`rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 overflow-hidden transition-all ${className}`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
            {isEn ? 'Recommended Add-ons' : 'প্রস্তাবিত অনুষঙ্গ ও ক্রস-সেল'}
          </span>
          <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full">
            {suggestions.length}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Suggestion list */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 border-t border-emerald-100 dark:border-emerald-900/40 max-h-48 overflow-y-auto">
          {suggestions.slice(0, 4).map((item) => {
            const isAdded = addedIds.has(item.product.id);
            return (
              <div
                key={item.product.id}
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {item.product.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.product.sellingPrice)}
                    </span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {item.confidencePercent}% ক্রেতা পছন্দ করেছেন
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={isAdded}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{isEn ? 'Added' : 'যোগ'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>{isEn ? 'Add' : 'যোগ'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrossSellCartSection;
