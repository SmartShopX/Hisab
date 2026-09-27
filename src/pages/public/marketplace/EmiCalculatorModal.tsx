import React, { useState } from 'react';
import { X, CreditCard, Building, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface EmiCalculatorModalProps {
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    discount?: number;
    image?: string;
  };
  onClose: () => void;
  onAddToCart: () => void;
}

export const EmiCalculatorModal: React.FC<EmiCalculatorModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const finalPrice = product.sellingPrice - (product.discount || 0);

  const [selectedTenure, setSelectedTenure] = useState<number>(6);
  const [selectedBank, setSelectedBank] = useState<string>('BRAC');

  const banks = [
    { id: 'BRAC', name: 'ব্র্যাক ব্যাংক (BRAC Bank)', logo: 'BRAC', maxTenure: 12, interest: 0 },
    { id: 'CITY', name: 'সিটি ব্যাংক অ্যামেক্স (City Bank Amex)', logo: 'AMEX', maxTenure: 12, interest: 0 },
    { id: 'EBL', name: 'ইস্টার্ন ব্যাংক (EBL)', logo: 'EBL', maxTenure: 12, interest: 0 },
    { id: 'SCB', name: 'স্ট্যান্ডার্ড চার্টার্ড (Standard Chartered)', logo: 'SCB', maxTenure: 12, interest: 0 },
    { id: 'DBBL', name: 'ডাচ-বাংলা ব্যাংক (DBBL)', logo: 'DBBL', maxTenure: 6, interest: 0 },
    { id: 'MTB', name: 'মিউচুয়াল ট্রাস্ট ব্যাংক (MTB)', logo: 'MTB', maxTenure: 12, interest: 0 },
  ];

  const tenures = [3, 6, 9, 12];
  const monthlyEmi = Math.round(finalPrice / selectedTenure);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold">
              <CreditCard className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black tracking-tight">০% ইন্টারেস্ট ব্যাংক ইএমআই ক্যালকুলেটর</h3>
                <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                  0% EMI
                </span>
              </div>
              <p className="text-xs text-orange-100">ক্রেডিট কার্ডের মাধ্যমে সহজ ও সুদবিহীন মাসিক কিস্তি</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Product Mini Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <img
              src={
                product.image ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=60'
              }
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{product.name}</h4>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm sm:text-base font-mono font-black text-orange-600">
                  {formatCurrency(finalPrice)}
                </span>
                {product.discount ? (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bank Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-orange-600" />
              <span>আপনার পার্টনার ব্যাংক নির্বাচন করুন:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {banks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedBank === b.id
                      ? 'border-orange-500 bg-orange-50/70 font-bold text-orange-900 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <span className="block truncate text-[11px] font-bold">{b.name}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">০% অতিরিক্ত ফি</span>
                  </div>
                  {selectedBank === b.id && <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tenure Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>কিস্তির মেয়াদ (মাস) নির্বাচন করুন:</span>
              <span className="text-[11px] text-orange-600 font-bold">নির্বাচিত: {selectedTenure} মাস</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {tenures.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedTenure(m)}
                  className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedTenure === m
                      ? 'border-orange-500 bg-orange-600 text-white font-black shadow-md shadow-orange-600/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs'
                  }`}
                >
                  <span className="block text-sm leading-tight">{m}</span>
                  <span className="text-[10px] opacity-80">মাস</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/80 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
              <span className="text-xs text-slate-600 font-medium">প্রতি মাসের কিস্তি (Monthly Installment):</span>
              <span className="font-mono text-lg font-black text-orange-600">
                {formatCurrency(monthlyEmi)} / মাস
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">ডাউন পেমেন্ট:</span>
                <span className="font-bold text-slate-900">৳০ (কোনো জমা নেই)</span>
              </div>
              <div>
                <span className="text-slate-500 block">সুদের হার:</span>
                <span className="font-bold text-emerald-600">০% (সম্পূর্ণ ফ্রি)</span>
              </div>
              <div>
                <span className="text-slate-500 block">মোট পরিশোধযোগ্য:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Terms info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ইএমআই নেওয়ার নিয়ম ও শর্তাবলী:</span>
            </div>
            <p>
              • নির্দিষ্ট ব্যাংকের ভিসা/মাস্টারকার্ড/অ্যামেক্স ক্রেডিট কার্ডধারী গ্রাহকগণ এই সুবিধা পাবেন।
            </p>
            <p>• কার্ডে পণ্যের সমপরিমাণ লিমিট থাকতে হবে। প্রতি মাসে স্বয়ংক্রিয়ভাবে কিস্তি কর্তন করা হবে।</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">মাসিক কিস্তি মাত্র:</span>
            <span className="text-base font-mono font-black text-orange-600">
              {formatCurrency(monthlyEmi)}/মাস
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToCart();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>ইএমআই তে কার্টে নিন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
