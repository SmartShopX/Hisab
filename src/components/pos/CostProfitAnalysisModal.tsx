import React, { useState } from 'react';
import {
  Calculator,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  Info,
  Check,
  Tag,
  Package,
} from 'lucide-react';
import {
  BasketMarginSummary,
  costProfitService,
  ItemMarginDetail,
} from '../../services/costProfitService';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface CostProfitAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BasketMarginSummary;
  onApplyDiscount?: (suggestedDiscount: number) => void;
  onUpdateTargetThreshold?: (newThreshold: number) => void;
}

export const CostProfitAnalysisModal: React.FC<CostProfitAnalysisModalProps> = ({
  isOpen,
  onClose,
  summary,
  onApplyDiscount,
  onUpdateTargetThreshold,
}) => {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [threshold, setThreshold] = useState<number>(summary.targetThresholdPercent);

  if (!isOpen) return null;

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    costProfitService.saveSettings({ targetMarginThreshold: val });
    if (onUpdateTargetThreshold) {
      onUpdateTargetThreshold(val);
    }
  };

  const handleApplySafeDiscount = () => {
    if (onApplyDiscount && summary.maxSafeDiscount > 0) {
      onApplyDiscount(summary.maxSafeDiscount);
      showToast(
        `নিরাপদ সর্বোচ্চ ডিসকাউন্ট ৳${summary.maxSafeDiscount} প্রয়োগ করা হয়েছে! এতে ${threshold}% মার্জিন বজায় থাকবে।`,
        'success'
      );
      onClose();
    }
  };

  const isLoss = summary.netProfit < 0 || summary.overallMarginPercent < 0;
  const isBelowTarget = summary.overallMarginPercent < threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isEn ? 'Smart Cost-to-Profit Calculator' : 'স্মার্ট কস্ট-টু-প্রফিট ক্যালকুলেটর'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase">
                  Live Margin
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Real-time profit margins, cost analysis & threshold guard'
                  : 'রিয়েল-টাইম ক্রয়মূল্য, লাভজনকতা এবং মার্জিন বিশ্লেষণ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {isEn ? 'Total Cost' : 'মোট ক্রয়মূল্য'}
              </p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {formatCurrency(summary.totalCost)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {isEn ? 'Selling Total' : 'বিক্রয়মূল্য'}
              </p>
              <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {formatCurrency(summary.finalTotal)}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isLoss
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : isBelowTarget
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <p className="text-[10px] font-semibold uppercase opacity-80">
                {isEn ? 'Net Profit' : 'নিট মুনাফা / লাভ'}
              </p>
              <p className="text-sm font-bold font-mono mt-0.5 flex items-center gap-1">
                {summary.netProfit >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{formatCurrency(summary.netProfit)}</span>
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isLoss
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : isBelowTarget
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <p className="text-[10px] font-semibold uppercase opacity-80">
                {isEn ? 'Profit Margin' : 'সামগ্রিক মার্জিন %'}
              </p>
              <p className="text-sm font-bold font-mono mt-0.5">
                {summary.overallMarginPercent > 0 ? '+' : ''}
                {summary.overallMarginPercent}%
              </p>
            </div>
          </div>

          {/* Interactive Target Profit Threshold Slider */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Target Profit Threshold' : 'মুনাফার কাঙ্ক্ষিত লক্ষ্যমাত্রা (Target Threshold)'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
                {threshold}%
              </span>
            </div>

            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={threshold}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>৫% (ন্যূনতম)</span>
              <span>১৫% (আদর্শ)</span>
              <span>৩০% (উচ্চ মার্জিন)</span>
              <span>৫০%</span>
            </div>
          </div>

          {/* Safe Discount Optimizer Box */}
          {summary.maxSafeDiscount > 0 && (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {isEn ? 'Safe Discount Recommendation' : 'স্মার্ট নিরাপদ ডিসকাউন্ট সাজেশন'}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {threshold}% মার্জিন বজায় রেখে সর্বোচ্চ <strong>{formatCurrency(summary.maxSafeDiscount)}</strong> পর্যন্ত ছাড় দেওয়া নিরাপদ।
                  </p>
                </div>
              </div>

              {onApplyDiscount && (
                <button
                  type="button"
                  onClick={handleApplySafeDiscount}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>{isEn ? 'Apply' : 'প্রয়োগ করুন'}</span>
                </button>
              )}
            </div>
          )}

          {/* Itemized Table Breakdown */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>{isEn ? 'Product Cost-to-Profit Details' : 'পণ্যভিত্তিক ক্রয়মূল্য ও লাভ-লোকসান বিবরণী'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {summary.items.length} টি পণ্য কার্টে
              </span>
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5">পণ্য</th>
                    <th className="p-2.5 text-right">একক ক্রয়</th>
                    <th className="p-2.5 text-right">বিক্রয়</th>
                    <th className="p-2.5 text-right">মুনাফা (৳)</th>
                    <th className="p-2.5 text-center">মার্জিন %</th>
                    <th className="p-2.5 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.items.map((item) => (
                    <tr
                      key={`${item.productId}-${item.selectedUnit}`}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                        item.status === 'LOSS'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20'
                          : item.status === 'BELOW_TARGET'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} {item.selectedUnit}
                        </p>
                      </td>

                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.unitCost)}
                      </td>

                      <td className="p-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.unitPrice)}
                      </td>

                      <td className="p-2.5 text-right font-mono font-bold">
                        <span
                          className={
                            item.grossProfit < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : item.isBelowThreshold
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {formatCurrency(item.grossProfit)}
                        </span>
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.status === 'LOSS'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : item.status === 'BELOW_TARGET'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {item.marginPercent > 0 ? '+' : ''}
                          {item.marginPercent}%
                        </span>
                      </td>

                      <td className="p-2.5 text-center">
                        {item.status === 'LOSS' ? (
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-extrabold rounded uppercase">
                            লোকসান
                          </span>
                        ) : item.status === 'BELOW_TARGET' ? (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded">
                            স্বল্প লাভ
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded">
                            সন্তোষজনক
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>ক্রয়মূল্য ও মার্জিন তথ্য শুধুমাত্র অনুমোদিত শপ ম্যানেজমেন্টের জন্য দৃশ্যমান।</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            {isEn ? 'Close' : 'ঠিক আছে'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostProfitAnalysisModal;
