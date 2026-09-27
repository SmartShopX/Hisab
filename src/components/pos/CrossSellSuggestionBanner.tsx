import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  X,
  TrendingUp,
  ShoppingBag,
  Check,
  Flame,
  Layers,
  ChevronRight,
  ShieldCheck,
  Settings2,
  PackagePlus,
  Percent,
} from 'lucide-react';
import { Product } from '../../types';
import { CrossSellItem, crossSellService } from '../../services/crossSellService';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface CrossSellSuggestionBannerProps {
  triggerProduct: Product | null;
  suggestions: CrossSellItem[];
  onAddToCart: (product: Product) => void;
  onAddAllCombos?: (products: Product[]) => void;
  onDismiss: () => void;
}

export const CrossSellSuggestionBanner: React.FC<CrossSellSuggestionBannerProps> = ({
  triggerProduct,
  suggestions,
  onAddToCart,
  onAddAllCombos,
  onDismiss,
}) => {
  const { isEn } = useLanguage();
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  if (!triggerProduct || suggestions.length === 0) {
    return null;
  }

  const handleAdd = (item: CrossSellItem) => {
    onAddToCart(item.product);
    setAddedItemIds((prev) => new Set(prev).add(item.product.id));
  };

  const handleAddAll = () => {
    const unadded = suggestions
      .map((s) => s.product)
      .filter((p) => !addedItemIds.has(p.id));
    if (onAddAllCombos && unadded.length > 0) {
      onAddAllCombos(unadded);
      setAddedItemIds(new Set(suggestions.map((s) => s.product.id)));
    } else {
      unadded.forEach((p) => onAddToCart(p));
      setAddedItemIds(new Set(suggestions.map((s) => s.product.id)));
    }
  };

  const totalBundlePrice = suggestions.reduce(
    (sum, s) => sum + (s.product.sellingPrice || 0),
    0
  );

  return (
    <div className="relative mb-3 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-xl border border-emerald-500/30 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-emerald-500/20 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-100 flex items-center gap-1.5 truncate">
                <span>{isEn ? 'Frequently Bought Together' : 'সচরাচর একসাথে কেনা হয় (ক্রস-সেল)'}</span>
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-md hidden sm:inline-block">
                  AI Smart Combo
                </span>
              </h4>
            </div>
            <p className="text-[11px] text-emerald-200/80 truncate">
              <span className="font-semibold text-white">"{triggerProduct.name}"</span>{' '}
              {isEn
                ? '- customers who bought this also took:'
                : 'এর সাথে পূর্বের ক্রেতারা এই অনুষঙ্গগুলো নিয়েছেন:'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {suggestions.length > 1 && (
            <button
              type="button"
              onClick={handleAddAll}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="সবগুলো প্রস্তাবিত অনুষঙ্গ একসাথে কার্টে যোগ করুন"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isEn ? 'Add All Combos' : 'সব কম্বো যোগ করুন'}
              </span>
              <span className="sm:hidden">{isEn ? 'Add All' : 'সব যোগ'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-emerald-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="লুকিয়ে রাখুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggestion Cards Carousel / Grid */}
      <div className="relative z-10 pt-3 flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-700/50">
        {suggestions.map((item) => {
          const isAdded = addedItemIds.has(item.product.id);
          const isTopCombo = item.badge === 'TOP_COMBO';

          return (
            <div
              key={item.product.id}
              className={`min-w-[190px] sm:min-w-[210px] max-w-[220px] rounded-xl p-2.5 border transition-all flex flex-col justify-between select-none ${
                isAdded
                  ? 'bg-emerald-950/60 border-emerald-500/60 ring-1 ring-emerald-400/40'
                  : isTopCombo
                  ? 'bg-white/10 hover:bg-white/15 border-emerald-400/50 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <div>
                {/* Top badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 ${
                      isTopCombo
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {isTopCombo && <Flame className="w-2.5 h-2.5 text-amber-400" />}
                    <span>{item.confidencePercent}% ক্রেতা পছন্দ করেছেন</span>
                  </span>

                  <span className="text-[10px] text-emerald-200/70 font-mono">
                    স্টক: {item.product.stock}
                  </span>
                </div>

                {/* Product Name & Details */}
                <h5
                  className="font-bold text-xs text-white line-clamp-2 leading-tight mb-1"
                  title={item.product.name}
                >
                  {item.product.name}
                </h5>

                <p className="text-[10px] text-emerald-200/75 line-clamp-1 mb-2">
                  {item.reason}
                </p>
              </div>

              {/* Price & Add Action */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-300 leading-none">মূল্য</span>
                  <span className="text-xs font-bold text-emerald-300 font-mono">
                    {formatCurrency(item.product.sellingPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={isAdded}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-sm hover:scale-105'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>{isEn ? 'Added' : 'যোগ হয়েছে'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>{isEn ? 'Add' : 'যোগ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrossSellSuggestionBanner;
