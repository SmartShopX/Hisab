import React, { useState } from 'react';
import { Tag, Sparkles, Check, Gift, ArrowRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export interface CollectableVoucherItem {
  code: string;
  title: string;
  discountBadge: string;
  minOrder: number;
  description: string;
  expiresIn: string;
}

export const marketplaceVouchers: CollectableVoucherItem[] = [
  {
    code: 'DARAZ20',
    title: 'মেগা সেভিংস ভাউচার',
    discountBadge: '২০% ছাড়',
    minOrder: 1000,
    description: 'সর্বনিম্ন ৳১,০০০ অর্ডারে সর্বোচ্চ ৳৩০০ ডিসকাউন্ট',
    expiresIn: 'আজকের জন্য প্রযোজ্য',
  },
  {
    code: 'FREESHIP',
    title: 'ফ্রি ডেলিভারি কুপন',
    discountBadge: 'ফ্রি শিপিং',
    minOrder: 800,
    description: 'ঢাকার ভেতর ও বাইরে ফ্রি ডেলিভারি সমপরিমাণ ছাড়',
    expiresIn: 'সীমিত অফার',
  },
  {
    code: 'EID50',
    title: 'উৎসব ক্যাশ ডিসকাউন্ট',
    discountBadge: '৳৫০ ফ্ল্যাট',
    minOrder: 500,
    description: 'যেকোনো ৳৫০০ এর উপরে অর্ডারে সরাসরি ৳৫০ ক্যাশ অফ',
    expiresIn: 'দ্রুত শেষ হচ্ছে',
  },
  {
    code: 'MALL100',
    title: 'SmartShopX.bd স্পেশাল',
    discountBadge: '৳১০০ মেগা অফ',
    minOrder: 1500,
    description: 'অফিসিয়াল ফ্ল্যাগশিপ শপগুলোর অর্ডারে ইনস্ট্যান্ট ৳১০০ ছাড়',
    expiresIn: 'এই সপ্তাহের সেরা',
  },
];

interface CollectableVouchersStripProps {
  collectedVouchers: string[];
  onCollect: (voucherCode: string) => void;
  onOpenCartOrCheckout: () => void;
}

export const CollectableVouchersStrip: React.FC<CollectableVouchersStripProps> = ({
  collectedVouchers,
  onCollect,
  onOpenCartOrCheckout,
}) => {
  const { showToast } = useToast();

  const handleCollect = (code: string) => {
    if (collectedVouchers.includes(code)) {
      showToast(`ভাউচার "${code}" আপনি ইতিমধ্যে কালেক্ট করেছেন!`, 'info');
      return;
    }
    onCollect(code);
    showToast(`🎉 অভিনন্দন! ভাউচার "${code}" আপনার অ্যাকাউন্টে কালেক্ট হয়েছে! চেকআউটে স্বয়ংক্রিয়ভাবে ব্যবহার করতে পারবেন।`, 'success');
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-amber-500/10 rounded-3xl p-4 sm:p-5 border border-orange-200/80 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
            <Gift className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>ShopX কালেক্টেবল ভাউচার হাব (Voucher Hub)</span>
              <span className="bg-orange-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md">
                ১-ক্লিক কালেক্ট
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              নিচের ভাউচারগুলো কালেক্ট করে রাখুন, কার্টে স্বয়ংক্রিয়ভাবে সর্বোচ্চ ছাড় কার্যকর হবে
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCartOrCheckout}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
        >
          <span>কার্টে ব্যবহার করুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Vouchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {marketplaceVouchers.map((v) => {
          const isCollected = collectedVouchers.includes(v.code);

          return (
            <div
              key={v.code}
              className={`rounded-2xl border p-3 flex flex-col justify-between transition-all relative overflow-hidden ${
                isCollected
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-white border-orange-200/80 hover:border-orange-400 hover:shadow-sm'
              }`}
            >
              {/* Ticket cutouts */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 border border-slate-200" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 border border-slate-200" />

              <div className="pl-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {v.code}
                  </span>
                  <span className="text-[11px] font-black text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-full">
                    {v.discountBadge}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{v.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {v.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between pl-1">
                <span className="text-[10px] text-slate-400 font-medium">{v.expiresIn}</span>
                <button
                  type="button"
                  onClick={() => handleCollect(v.code)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isCollected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs hover:scale-102'
                  }`}
                >
                  {isCollected ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>কালেক্টেড</span>
                    </>
                  ) : (
                    <span>কালেক্ট করুন</span>
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
