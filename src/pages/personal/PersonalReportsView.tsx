import React, { useState } from 'react';
import { PersonalTransaction, PersonalDueRecord, PersonalBudget } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DataStore } from '../../services/dataStorage';
import { Button } from '../../components/common/Button';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Printer,
  ShieldCheck,
  Scale,
  Award,
  Sparkles,
} from 'lucide-react';

interface PersonalReportsViewProps {
  transactions: PersonalTransaction[];
}

export const PersonalReportsView: React.FC<PersonalReportsViewProps> = ({ transactions }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const dues: PersonalDueRecord[] = DataStore.getPersonalDues();
  const budgets: PersonalBudget[] = DataStore.getPersonalBudgets();
  const savings = DataStore.getPersonalSavings();

  // Filter transactions for selected month
  const monthTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    return t.date.slice(0, 7) === selectedMonth;
  });

  const monthIncome = monthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round((monthSavings / monthIncome) * 100)) : 0;

  // Outstanding Dues
  const totalReceivable = dues
    .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'Paid')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalPayable = dues
    .filter((d) => d.type === 'PAYABLE' && d.status !== 'Paid')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  // DPS & Savings Schemes Assets
  const totalSavingsAssets = savings.reduce((sum, s) => sum + s.totalDeposited, 0);

  // All time liquid savings across all wallets
  const allTimeIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const totalLiquidAssets = allTimeIncome - allTimeExpense;

  // Personal Net Worth: Liquid Assets + Savings/DPS + Receivables - Payables
  const personalNetWorth = totalLiquidAssets + totalSavingsAssets + totalReceivable - totalPayable;

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const cat = t.category || 'অন্যান্য';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    });

  const sortedExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Income by category
  const incomeByCategory: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'INCOME')
    .forEach((t) => {
      const cat = t.category || 'অন্যান্য';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
    });

  const sortedIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">রিপোর্ট মাস:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          leftIcon={<Printer className="w-4 h-4" />}
        >
          রিপোর্ট প্রিন্ট বা PDF সংরক্ষণ
        </Button>
      </div>

      {/* Financial Health & Net Worth Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Net Worth Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">ব্যক্তিগত প্রাক্কলিত সম্পদ (Net Worth)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(personalNetWorth)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
            <p>• তরল তহবিল (ক্যাশ ও ব্যাংক): {formatCurrency(totalLiquidAssets)}</p>
            <p>• ডিপিএস ও সঞ্চয় সম্পদ: +{formatCurrency(totalSavingsAssets)}</p>
            <p>• পাওনা ধার: +{formatCurrency(totalReceivable)}</p>
            <p>• দেনা ধার: -{formatCurrency(totalPayable)}</p>
          </div>
        </div>

        {/* Monthly Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">চলতি মাসের সঞ্চয়ের হার (Savings Rate)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                savingsRate >= 30 ? 'text-emerald-600' : savingsRate > 10 ? 'text-indigo-600' : 'text-amber-600'
              }`}
            >
              {savingsRate}%
            </span>
            <span className="text-[11px] text-slate-500">
              ({formatCurrency(monthSavings)} সঞ্চয়)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {savingsRate >= 30
              ? 'চমৎকার আর্থিক শৃঙ্খলা! জাতীয় আদর্শের ওপরে।'
              : savingsRate > 10
              ? 'সন্তোষজনক সঞ্চয় হার। বজায় রাখুন।'
              : 'সঞ্চয় হার কম, অপ্রয়োজনীয় ব্যয় কমানোর পরামর্শ।'}
          </p>
        </div>

        {/* Monthly Cash Flow Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">মাসিক ক্যাশ-ফ্লো ({selectedMonth})</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-1.5 font-mono text-xs mt-2">
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>মোট ব্যক্তিগত আয়:</span>
              <span>+{formatCurrency(monthIncome)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>মোট ব্যক্তিগত খরচ:</span>
              <span>-{formatCurrency(monthExpense)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>মাসিক নিট ব্যালেন্স:</span>
              <span className={monthSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(monthSavings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Expense Categories Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              ব্যয়ের খাতভিত্তিক বণ্টন ({selectedMonth})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">মোট {formatCurrency(monthExpense)}</span>
          </h4>

          {sortedExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              এই মাসে কোনো খরচের রেকর্ড নেই
            </p>
          ) : (
            <div className="space-y-2.5">
              {sortedExpenses.map(([cat, amt]) => {
                const pct = monthExpense > 0 ? Math.round((amt / monthExpense) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-700 truncate">{cat}</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {formatCurrency(amt)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Sources Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              আয়ের উৎস ও বণ্টন ({selectedMonth})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">মোট {formatCurrency(monthIncome)}</span>
          </h4>

          {sortedIncome.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              এই মাসে কোনো আয়ের রেকর্ড নেই
            </p>
          ) : (
            <div className="space-y-2.5">
              {sortedIncome.map(([cat, amt]) => {
                const pct = monthIncome > 0 ? Math.round((amt / monthIncome) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-700 truncate">{cat}</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {formatCurrency(amt)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dues & Liabilities Statement */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-600" />
          ব্যক্তিগত দেনা-পাওনা বিবরণী (Balance Sheet Overview)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
            <p className="text-xs font-bold text-emerald-900 mb-1">
              প্রাপ্য অর্থ (কারো কাছে পাওনা ধার):
            </p>
            <p className="text-lg font-black font-mono text-emerald-700">
              {formatCurrency(totalReceivable)}
            </p>
            <p className="text-[10px] text-emerald-800 mt-1">
              মোট {dues.filter((d) => d.type === 'RECEIVABLE' && d.status !== 'Paid').length} জন ব্যক্তির নিকট বকেয়া
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
            <p className="text-xs font-bold text-rose-900 mb-1">
              পরিশোধযোগ্য অর্থ (অন্যদের দেনা ধার):
            </p>
            <p className="text-lg font-black font-mono text-rose-700">
              {formatCurrency(totalPayable)}
            </p>
            <p className="text-[10px] text-rose-800 mt-1">
              মোট {dues.filter((d) => d.type === 'PAYABLE' && d.status !== 'Paid').length} জনের ঋণ পরিশোধ বাকি
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
