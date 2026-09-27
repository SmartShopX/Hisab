import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  Info,
  ChevronRight,
  ShieldAlert,
  Percent,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { BasketMarginSummary } from '../../services/costProfitService';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

interface CostProfitWidgetProps {
  summary: BasketMarginSummary;
  onOpenAnalysis: () => void;
  className?: string;
}

export const CostProfitWidget: React.FC<CostProfitWidgetProps> = ({
  summary,
  onOpenAnalysis,
  className = '',
}) => {
  const { isEn } = useLanguage();

  if (summary.items.length === 0) return null;

  const isLoss = summary.netProfit < 0 || summary.overallMarginPercent < 0;
  const isBelowTarget = summary.overallMarginPercent < summary.targetThresholdPercent;
  const hasLowItems = summary.belowThresholdCount > 0;

  return (
    <div
      className={`rounded-2xl border transition-all p-2.5 ${
        isLoss
          ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40'
          : isBelowTarget
          ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
      } ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${
              isLoss
                ? 'bg-rose-600'
                : isBelowTarget
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-bold text-xs flex items-center gap-1 leading-none">
              <span>{isEn ? 'Smart Margin' : 'স্মার্ট মুনাফা ও মার্জিন'}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-extrabold ${
                  isLoss
                    ? 'bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100'
                    : isBelowTarget
                    ? 'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100'
                    : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100'
                }`}
              >
                {summary.overallMarginPercent > 0 ? '+' : ''}
                {summary.overallMarginPercent}%
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAnalysis}
          className="text-[11px] font-bold underline hover:no-underline flex items-center gap-0.5 cursor-pointer shrink-0 opacity-90 hover:opacity-100"
          title="সম্পূর্ণ কস্ট-টু-প্রফিট বিশ্লেষণ ও ব্রেকডাউন দেখুন"
        >
          <span>{isEn ? 'Details' : 'বিশ্লেষণ'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Metric details pill */}
      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-xl border border-black/5 dark:border-white/5">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">ক্রয়মূল্য</p>
          <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatCurrency(summary.totalCost)}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-xl border border-black/5 dark:border-white/5">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">নিট লাভ</p>
          <p
            className={`text-xs font-mono font-bold mt-0.5 flex items-center justify-center gap-0.5 ${
              isLoss
                ? 'text-rose-600 dark:text-rose-400'
                : isBelowTarget
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {summary.netProfit >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{formatCurrency(summary.netProfit)}</span>
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-xl border border-black/5 dark:border-white/5">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">টার্গেট</p>
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {summary.targetThresholdPercent}%
          </p>
        </div>
      </div>

      {/* Warning chip if any product is below target margin */}
      {hasLowItems && (
        <button
          type="button"
          onClick={onOpenAnalysis}
          className={`mt-2 w-full p-1.5 rounded-xl flex items-center justify-between text-left text-[11px] font-semibold cursor-pointer transition-colors ${
            summary.hasLossItems
              ? 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200'
              : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200'
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">
              {summary.hasLossItems
                ? isEn
                  ? 'Alert: Cart contains negative margin item(s)!'
                  : 'সতর্কতা: কার্টে লোকসানী পণ্য রয়েছে!'
                : isEn
                ? `${summary.belowThresholdCount} item(s) below target (${summary.targetThresholdPercent}%) margin`
                : `${summary.belowThresholdCount}টি পণ্যের লাভ লক্ষ্যমাত্রার (${summary.targetThresholdPercent}%) নিচে`}
            </span>
          </span>
          <span className="text-[10px] underline shrink-0 font-bold">
            {isEn ? 'Fix' : 'দেখুন'}
          </span>
        </button>
      )}
    </div>
  );
};

export default CostProfitWidget;
