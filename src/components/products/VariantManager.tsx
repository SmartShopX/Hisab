import React, { useState } from 'react';
import { ProductVariant } from '../../types';
import { Plus, Trash2, Layers, Sparkles, RefreshCw, Barcode } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface VariantManagerProps {
  hasVariants: boolean;
  onToggleVariants: (enabled: boolean) => void;
  variants: ProductVariant[];
  onChangeVariants: (variants: ProductVariant[]) => void;
  baseSellingPrice: number;
  basePurchasePrice: number;
  baseWholesalePrice: number;
  baseSku: string;
}

export const VariantManager: React.FC<VariantManagerProps> = ({
  hasVariants,
  onToggleVariants,
  variants,
  onChangeVariants,
  baseSellingPrice,
  basePurchasePrice,
  baseWholesalePrice,
  baseSku,
}) => {
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [customStock, setCustomStock] = useState(5);
  const [customPrice, setCustomPrice] = useState(baseSellingPrice || 0);

  // Quick preset sizes
  const presetSizes = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];
  const presetColors = ['Black', 'White', 'Navy Blue', 'Red', 'Maroon', 'Olive Green', 'Gray'];
  const presetTechSpecs = ['64GB', '128GB', '256GB', '4GB/64GB', '6GB/128GB', '8GB/128GB', '8GB/256GB'];

  const handleAddManualVariant = () => {
    if (!customName.trim()) return;
    const newVariant: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: customName.trim(),
      sku: baseSku ? `${baseSku}-${customName.trim().toUpperCase().replace(/\s+/g, '')}` : `VAR-${Date.now().toString().slice(-4)}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      purchasePrice: basePurchasePrice || 0,
      wholesalePrice: baseWholesalePrice || 0,
      sellingPrice: customPrice > 0 ? customPrice : baseSellingPrice || 0,
      stock: Number(customStock) || 0,
    };
    onChangeVariants([...variants, newVariant]);
    setCustomName('');
  };

  const handleBulkGenerate = (items: string[], type: 'size' | 'color' | 'spec') => {
    const newOnes: ProductVariant[] = items.map((item, idx) => {
      const vName = item;
      return {
        id: `var_${Date.now()}_${idx}`,
        name: vName,
        size: type === 'size' ? item : undefined,
        color: type === 'color' ? item : undefined,
        sku: baseSku ? `${baseSku}-${item.toUpperCase().replace(/[^A-Z0-9]/g, '')}` : `VAR-${Date.now().toString().slice(-4)}-${idx}`,
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        purchasePrice: basePurchasePrice || 0,
        wholesalePrice: baseWholesalePrice || 0,
        sellingPrice: baseSellingPrice || 0,
        stock: 5,
      };
    });

    // filter out existing by name
    const existingNames = new Set(variants.map((v) => v.name.toLowerCase()));
    const filtered = newOnes.filter((v) => !existingNames.has(v.name.toLowerCase()));
    onChangeVariants([...variants, ...filtered]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onChangeVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleRemoveVariant = (id: string) => {
    onChangeVariants(variants.filter((v) => v.id !== id));
  };

  const totalVariantStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return (
    <div className="space-y-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              পণ্য ভ্যারিয়েন্ট (Variants: Size, Color & Specs)
            </h4>
            <p className="text-[11px] text-slate-500">
              পোশাক, জুতা বা গ্যাজেটের বিভিন্ন সাইজ ও রঙের আলাদা স্টক ও বারকোড
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onToggleVariants(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-2 text-xs font-semibold text-slate-700">
            {hasVariants ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </span>
        </label>
      </div>

      {hasVariants && (
        <div className="space-y-4 pt-3 border-t border-slate-200/80">
          {/* Quick presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              দ্রুত ভ্যারিয়েন্ট যোগ করুন (Quick Presets):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mr-2 font-medium">
                সাইজ:
              </div>
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleBulkGenerate([sz], 'size')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                >
                  +{sz}
                </button>
              ))}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mx-2 font-medium">
                রং:
              </div>
              {['Black', 'White', 'Navy', 'Red'].map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => handleBulkGenerate([clr], 'color')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                >
                  +{clr}
                </button>
              ))}
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mx-2 font-medium">
                র‍্যাম/রম:
              </div>
              {['64GB', '128GB', '256GB'].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => handleBulkGenerate([sp], 'spec')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                >
                  +{sp}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Add Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                ভ্যারিয়েন্টের নাম (যেমন: Red - XL বা 128GB Black)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="যেমন: Blue - L"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualVariant();
                  }
                }}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">বিক্রয়মূল্য (৳)</label>
              <input
                type="number"
                min={0}
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">স্টক (Pcs)</label>
              <input
                type="number"
                min={0}
                value={customStock}
                onChange={(e) => setCustomStock(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="button"
                onClick={handleAddManualVariant}
                disabled={!customName.trim()}
                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                যোগ
              </button>
            </div>
          </div>

          {/* Variants List Table */}
          {variants.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>তালিকায় ভ্যারিয়েন্ট ({variants.length} টি)</span>
                <span className="text-purple-700 font-mono">মোট স্টক: {totalVariantStock} টি</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {variants.map((v) => (
                  <div key={v.id} className="p-2.5 hover:bg-slate-50 flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex-1 min-w-[130px]">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleUpdateVariant(v.id, { name: e.target.value })}
                        className="w-full font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none text-xs"
                      />
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>SKU: {v.sku || '—'}</span>
                        <span>•</span>
                        <span>বারকোড: {v.barcode || '—'}</span>
                      </div>
                    </div>

                    <div className="w-24">
                      <label className="block text-[9px] text-slate-400">বিক্রয়মূল্য (৳)</label>
                      <input
                        type="number"
                        min={0}
                        value={v.sellingPrice}
                        onChange={(e) =>
                          handleUpdateVariant(v.id, { sellingPrice: Number(e.target.value) || 0 })
                        }
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-[9px] text-slate-400">পাইকারি (৳)</label>
                      <input
                        type="number"
                        min={0}
                        value={v.wholesalePrice || 0}
                        onChange={(e) =>
                          handleUpdateVariant(v.id, { wholesalePrice: Number(e.target.value) || 0 })
                        }
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono text-slate-700"
                      />
                    </div>

                    <div className="w-20">
                      <label className="block text-[9px] text-slate-400">স্টক</label>
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) =>
                          handleUpdateVariant(v.id, { stock: Number(e.target.value) || 0 })
                        }
                        className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-3 text-slate-400 italic">
              কোনো ভ্যারিয়েন্ট যোগ করা হয়নি। উপরের প্রিসেট বা ফর্ম থেকে ভ্যারিয়েন্ট যোগ করুন।
            </p>
          )}
        </div>
      )}
    </div>
  );
};
