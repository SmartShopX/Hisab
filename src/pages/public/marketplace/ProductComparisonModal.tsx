import React from 'react';
import { X, Scale, ShoppingBag, Check, ShieldCheck, Award, Star, Truck, ArrowRight, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface ProductComparisonModalProps {
  comparedProducts: any[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onAddToCart: (product: any) => void;
  onClearAll: () => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  comparedProducts,
  onClose,
  onRemoveProduct,
  onAddToCart,
  onClearAll,
}) => {
  if (comparedProducts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Scale className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">পণ্য স্পেসিফিকেশন তুলনা (Side-by-Side Comparison)</h3>
              <p className="text-xs text-orange-100">
                একই সাথে {comparedProducts.length}টি পণ্যের দাম, স্পেক্স, ওয়ারেন্টি ও কোয়ালিটি তুলনা করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              সব মুছুন
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Table Grid */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[650px] border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 bg-slate-50 font-bold text-slate-500 w-36 uppercase tracking-wider text-[11px]">
                  পণ্য ওভারভিউ
                </th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="p-3 align-top min-w-[200px]">
                    <div className="space-y-2 relative">
                      <button
                        onClick={() => onRemoveProduct(p.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                        title="তুলনা তালিকা থেকে মুছুন"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-w-[150px] mx-auto">
                        <img
                          src={
                            p.image ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60'
                          }
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>

                      <button
                        onClick={() => onAddToCart(p)}
                        className="w-full py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>কার্টে যোগ করুন</span>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {/* Row: Price */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">মূল্য ও ছাড়</td>
                {comparedProducts.map((p) => {
                  const final = p.sellingPrice - (p.discount || 0);
                  return (
                    <td key={p.id} className="p-3 font-mono font-bold">
                      <div className="text-base text-orange-600">{formatCurrency(final)}</div>
                      {p.discount ? (
                        <div className="text-[11px] text-slate-400 line-through">
                          {formatCurrency(p.sellingPrice)} (৳{p.discount} ছাড়)
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Shop & Mall Status */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">বিক্রেতা ও স্টোর</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3">
                    <div className="font-bold text-slate-900">{p.shopName}</div>
                    {p.isMallStore ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 mt-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        দারাজ মল ফ্ল্যাগশিপ
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">ভেরিফাইড মার্চেন্ট</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: EMI Availability */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">০% ব্যাংক কিস্তি (EMI)</td>
                {comparedProducts.map((p) => {
                  const final = p.sellingPrice - (p.discount || 0);
                  const isEligible = final >= 2000;
                  return (
                    <td key={p.id} className="p-3">
                      {isEligible ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>উপলব্ধ (৳{Math.round(final / 12)}/মাস)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">প্রযোজ্য নয় (৳২,০০০ এর নিচে)</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row: Rating */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">কাস্টমার রেটিং</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="text-slate-900">4.9 / 5.0</span>
                      <span className="text-slate-400 font-normal text-[11px]">(ভেরিফাইড ক্রেতা)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Return Policy */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">রিটার্ন পলিসি</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3">
                    <span className="text-slate-800 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ৭ দিনের ফ্রি ক্যাশব্যাক রিটার্ন
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Delivery Coverage */}
              <tr>
                <td className="p-3 bg-slate-50 font-bold text-slate-600">ডেলিভারি কভারেজ</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 text-[11px] text-slate-600">
                    <div>• ঢাকার ভেতরে: ২৪-৪৮ ঘণ্টা (৳৬০)</div>
                    <div>• ঢাকার বাইরে: ২-৪ দিন (৳১২০)</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ComparisonFloatingBar: React.FC<{
  comparedProducts: any[];
  onOpenModal: () => void;
  onRemoveProduct: (id: string) => void;
  onClearAll: () => void;
}> = ({ comparedProducts, onOpenModal, onRemoveProduct, onClearAll }) => {
  if (comparedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3 sm:px-5 shadow-2xl border border-orange-500/40 flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
          <Scale className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-xs font-bold whitespace-nowrap">
            তুলনা তালিকা ({comparedProducts.length}/৪):
          </span>
          <div className="flex items-center -space-x-2">
            {comparedProducts.map((p) => (
              <div
                key={p.id}
                className="relative group w-7 h-7 rounded-lg overflow-hidden border border-white/40 shrink-0"
              >
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemoveProduct(p.id)}
                  className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onClearAll}
          className="text-[11px] text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
        >
          ক্লিয়ার
        </button>
        <button
          onClick={onOpenModal}
          className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-1 cursor-pointer"
        >
          <span>তুলনা দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
