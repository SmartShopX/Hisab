import React from 'react';
import { Plus, Pill, Package, AlertTriangle, Sparkles, MapPin } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import { useLanguage } from '../../context/LanguageContext';

interface PosCompactProductTableProps {
  products: Product[];
  onAddToCart: (product: Product, unit?: 'Pcs' | 'Strip' | 'Box') => void;
  onOpenSubstitute: (e: React.MouseEvent, product: Product) => void;
}

export const PosCompactProductTable: React.FC<PosCompactProductTableProps> = ({
  products,
  onAddToCart,
  onOpenSubstitute,
}) => {
  const { isEn } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
        <p className="font-bold text-sm">কোনো পণ্য পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-3">পণ্য / ওষুধ</th>
              <th className="py-2.5 px-3">বিভাগ (Category)</th>
              <th className="py-2.5 px-3">র‌্যাক / লোকেশন</th>
              <th className="py-2.5 px-3 text-right">স্টক</th>
              <th className="py-2.5 px-3 text-right">মূল্য (৳)</th>
              <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const finalPrice = p.sellingPrice - p.discount;
              const exp = getExpiryStatus(p.expiryDate);

              return (
                <tr
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddToCart(p, 'Pcs')}
                  className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors ${
                    isOutOfStock ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                        ) : p.category.toLowerCase().includes('pharmacy') ? (
                          <Pill className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          {p.genericName && (
                            <span className="text-emerald-700 dark:text-emerald-400">{p.genericName}</span>
                          )}
                          {p.sku && <span>• SKU: {p.sku}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                      {p.category}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    {p.rackLocation ? (
                      <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        {p.rackLocation}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        isOutOfStock
                          ? 'text-rose-600'
                          : p.stock <= p.minStock
                          ? 'text-amber-600'
                          : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      {p.stock} {p.unit || 'টি'}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(finalPrice)}
                  </td>

                  <td className="py-2 px-3 text-center">
                    {isOutOfStock ? (
                      p.genericName ? (
                        <button
                          type="button"
                          onClick={(e) => onOpenSubstitute(e, p)}
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          বিকল্প
                        </button>
                      ) : (
                        <span className="text-rose-500 text-[10px] font-bold">স্টকআউট</span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(p, 'Pcs');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>যোগ</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PosCompactProductTable;
