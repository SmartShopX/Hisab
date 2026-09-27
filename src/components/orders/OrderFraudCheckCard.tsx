import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, XCircle, ShoppingBag } from 'lucide-react';
import { orderService } from '../../services/orderService';

interface OrderFraudCheckCardProps {
  customerMobile: string;
  customerName: string;
  compact?: boolean;
}

export const OrderFraudCheckCard: React.FC<OrderFraudCheckCardProps> = ({
  customerMobile,
  customerName,
  compact = false,
}) => {
  const stats = orderService.getCustomerDeliveryStats(customerMobile);

  if (compact) {
    if (stats.total === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <ShoppingBag className="w-3 h-3 text-slate-500" />
          <span>১ম অর্ডার (নতুন)</span>
        </span>
      );
    }

    if (stats.risk === 'High') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
          title={`সতর্কতা: রিটার্ন রেট বেশি (${stats.returned}টি রিটার্ন)!`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>{stats.successRate}% ঝুঁকি</span>
        </span>
      );
    }

    if (stats.risk === 'Medium') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300"
          title="মধ্যম ঝুঁকি: ডেলিভারি নিশ্চিত করতে ফোনে কথা বলুন"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>{stats.successRate}% সাকসেস</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
        title="উচ্চ বিশ্বস্ততা: ডেলিভারি সফলতার হার চমৎকার"
      >
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>{stats.successRate}% বিশ্বস্ত</span>
      </span>
    );
  }

  // Full Expanded Card for Order Details Modal
  return (
    <div
      className={`p-3.5 rounded-2xl border text-xs transition-all ${
        stats.risk === 'High'
          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
          : stats.risk === 'Medium'
          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {stats.risk === 'High' ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          ) : stats.risk === 'Medium' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              কাস্টমার ডেলিভারি ট্রাস্ট স্কোর ও ফ্রড চেকার
            </h4>
            <p className="text-[11px] text-slate-600 font-medium">
              {stats.label} • {customerName} ({customerMobile})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-base font-black">
            {stats.successRate}%
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider opacity-75">
            সাকসেস রেট
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            stats.risk === 'High'
              ? 'bg-rose-600'
              : stats.risk === 'Medium'
              ? 'bg-amber-500'
              : 'bg-emerald-600'
          }`}
          style={{ width: `${Math.max(5, stats.successRate)}%` }}
        />
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-4 gap-2 text-center py-2 bg-white/80 rounded-xl border border-slate-200/70 font-mono text-[11px]">
        <div>
          <span className="text-slate-500 block text-[10px]">মোট অর্ডার</span>
          <span className="font-bold text-slate-800">{stats.total} টি</span>
        </div>
        <div>
          <span className="text-emerald-700 block text-[10px] font-semibold">সফল ডেলিভারি</span>
          <span className="font-bold text-emerald-700">{stats.delivered} টি</span>
        </div>
        <div>
          <span className="text-rose-600 block text-[10px] font-semibold">রিটার্ন (RTO)</span>
          <span className="font-bold text-rose-700">{stats.returned} টি</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">বাতিল</span>
          <span className="font-bold text-slate-700">{stats.cancelled} টি</span>
        </div>
      </div>

      {/* Suggestion Box */}
      <div className="mt-2 text-[11px] leading-relaxed">
        {stats.risk === 'High' ? (
          <p className="font-semibold text-rose-800 flex items-center gap-1.5">
            ⚠️ <strong>সতর্কতা:</strong> এই ক্রেতার অতীতে একাধিক পার্সেল রিটার্নের রেকর্ড রয়েছে। পার্সেল পাঠানোর পূর্বে অবশ্যই বিকাশে অগ্রিম ডেলিভারি চার্জ নিশ্চিত করে নিন।
          </p>
        ) : stats.risk === 'Medium' ? (
          <p className="font-medium text-amber-800">
            ℹ️ <strong>পরামর্শ:</strong> গ্রাহকের সাথে ফোনে কথা বলে সাইজ, কালার ও ঠিকানা পুনরায় নিশ্চিত করে পার্সেল বুকিং দিন।
          </p>
        ) : stats.total === 0 ? (
          <p className="text-slate-600">
            ✨ এই নম্বরে পূর্বে কোনো অর্ডার পাওয়া যায়নি (নতুন ক্রেতা)। ফোনে ঠিকানা নিশ্চিত করা নিরাপদ।
          </p>
        ) : (
          <p className="font-semibold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> অত্যন্ত বিশ্বস্ত নিয়মিত গ্রাহক। নিঃসংকোচে দ্রুত পার্সেল পাঠানো যায়।
          </p>
        )}
      </div>
    </div>
  );
};
