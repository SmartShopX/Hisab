import React, { useState, useMemo } from 'react';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Building2,
  Receipt,
  AlertTriangle,
  PieChart,
  BarChart3,
  Clock,
  Filter,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  Banknote,
  Coins,
  ShieldCheck,
} from 'lucide-react';

type DateRangeType = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'all';

export const ReportsPage: React.FC = () => {
  const { shop } = useAuth();
  const [dateRange, setDateRange] = useState<DateRangeType>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Raw data from DataStore
  const allSales = useMemo(() => DataStore.getSales() || [], []);
  const products = useMemo(() => DataStore.getProducts() || [], []);
  const allExpenses = useMemo(() => DataStore.getExpenses() || [], []);
  const customers = useMemo(() => DataStore.getCustomers() || [], []);
  const suppliers = useMemo(() => DataStore.getSuppliers() || [], []);

  // Helper to test if a record's date matches selected range
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;

    if (isCustomDate && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === 'today') {
      return itemDate >= todayStart;
    }
    if (dateRange === 'yesterday') {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return itemDate >= yesterdayStart && itemDate < todayStart;
    }
    if (dateRange === 'last_7_days') {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return itemDate >= sevenDaysAgo;
    }
    if (dateRange === 'this_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'last_month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastMonthYear;
    }
    return true; // 'all'
  };

  // Filtered sales & expenses
  const sales = useMemo(() => {
    return (allSales || []).filter((s) => isDateInRange(s?.createdAt));
  }, [allSales, dateRange, isCustomDate, customStartDate, customEndDate]);

  const expenses = useMemo(() => {
    return (allExpenses || []).filter((e) => isDateInRange(e?.date));
  }, [allExpenses, dateRange, isCustomDate, customStartDate, customEndDate]);

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return (sales || []).reduce((sum, s) => sum + (s?.totalAmount || 0), 0);
  }, [sales]);

  const totalCogs = useMemo(() => {
    return (sales || []).reduce((sum, s) => {
      const saleCogs = (s?.items || []).reduce((iSum: number, item: any) => {
        if (!item) return iSum;
        const prod = (products || []).find((p) => p?.id === item.productId);
        const cost = prod ? (prod.purchasePrice || 0) : ((item.unitPrice || 0) * 0.7);
        return iSum + cost * (item.quantity || 1);
      }, 0);
      return sum + saleCogs;
    }, 0);
  }, [sales, products]);

  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const totalExpense = useMemo(() => {
    return (expenses || []).reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [expenses]);

  const netProfit = grossProfit - totalExpense;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Cash Flow Calculations
  const cashSales = useMemo(() => {
    return (sales || [])
      .filter((s) => s?.paymentMethod === 'Cash' || s?.paymentMethod === 'নগদ')
      .reduce((sum, s) => sum + (s?.paidAmount || s?.totalAmount || 0), 0);
  }, [sales]);

  const digitalSales = useMemo(() => {
    return (sales || [])
      .filter(
        (s) =>
          s?.paymentMethod === 'bKash' ||
          s?.paymentMethod === 'Nagad' ||
          s?.paymentMethod === 'Card' ||
          s?.paymentMethod === 'Bank' ||
          s?.paymentMethod === 'বিকাশ' ||
          s?.paymentMethod === 'নগদ'
      )
      .reduce((sum, s) => sum + (s?.paidAmount || s?.totalAmount || 0), 0);
  }, [sales]);

  const dueGiven = useMemo(() => {
    return (sales || []).reduce((sum, s) => sum + (Number(s?.dueAmount) || 0), 0);
  }, [sales]);

  // Inventory valuation
  const inventoryCostValue = useMemo(() => {
    return (products || []).reduce((sum, p) => sum + ((p?.purchasePrice || 0) * (p?.stock || 0)), 0);
  }, [products]);

  const inventoryRetailValue = useMemo(() => {
    return (products || []).reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.stock || 0)), 0);
  }, [products]);

  const projectedInventoryProfit = inventoryRetailValue - inventoryCostValue;

  const totalCustomerReceivable = useMemo(() => {
    return (customers || []).reduce((sum, c) => sum + (Number(c?.totalDue) || 0), 0);
  }, [customers]);

  const totalSupplierPayable = useMemo(() => {
    return (suppliers || []).reduce((sum, s) => sum + (Number(s?.totalPayable) || 0), 0);
  }, [suppliers]);

  // Expense categories breakdown
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    (expenses || []).forEach((e) => {
      const cat = e?.category || 'বিবিধ খরচ';
      map[cat] = (map[cat] || 0) + (Number(e?.amount) || 0);
    });
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpense]);

  // Product sales performance & profitability
  const productPerformance = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        qty: number;
        revenue: number;
        cogs: number;
        profit: number;
        margin: number;
      }
    > = {};

    (sales || []).forEach((s) => {
      (s?.items || []).forEach((item: any) => {
        if (!item) return;
        const prod = (products || []).find((p) => p?.id === item.productId);
        const cost = prod ? (prod.purchasePrice || 0) : ((item.unitPrice || 0) * 0.7);
        const itemCogs = cost * (item.quantity || 1);
        const itemRev = item.total || ((item.unitPrice || 0) * (item.quantity || 1));
        const itemId = item.productId || item.productName || 'unknown';

        if (!map[itemId]) {
          map[itemId] = {
            id: itemId,
            name: item.productName || prod?.name || 'অজানা পণ্য',
            qty: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
            margin: 0,
          };
        }
        map[itemId].qty += item.quantity || 1;
        map[itemId].revenue += itemRev;
        map[itemId].cogs += itemCogs;
      });
    });

    return Object.values(map)
      .map((item) => {
        const profit = item.revenue - item.cogs;
        const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
        return { ...item, profit, margin };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              রিপোর্ট ও প্রফিট/লস অ্যানালিটিক্স (P&L Analytics)
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
              লাইভ অডিট
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের মোট বিক্রয়, ক্রয়মূল্য (COGS), বাণিজ্যিক গ্রস লাভ, পরিচালন ব্যয় ও প্রকৃত নিট লাভ খতিয়ান
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCustomDate ? (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeType)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer shadow-2xs"
            >
              <option value="today">আজকের হিসাব (Today)</option>
              <option value="yesterday">গতকালকের হিসাব (Yesterday)</option>
              <option value="last_7_days">বিগত ৭ দিন (Last 7 Days)</option>
              <option value="this_month">চলতি মাস (This Month)</option>
              <option value="last_month">গত মাস (Last Month)</option>
              <option value="all">সর্বমোট সামগ্রিক হিসাব (All Time)</option>
            </select>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <span className="text-slate-400">থেকে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCustomDate(!isCustomDate)}
            className="text-xs"
          >
            {isCustomDate ? 'রেগুলার ফিল্টার' : 'কাস্টম তারিখ'}
          </Button>

          <Button
            onClick={handlePrint}
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            প্রিন্ট / ব্যালেন্স শিট
          </Button>
        </div>
      </div>

      {/* Primary Financial Bento KPI Cards (5 Pillars of P&L) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Gross Revenue */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>১. মোট বিক্রয় রেভিনিউ</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>মোট {sales.length} টি বিক্রয় মেমো</span>
            <span className="text-emerald-600 font-bold">১০০% আয়</span>
          </div>
        </div>

        {/* 2. Cost of Goods Sold (COGS) */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>২. পণ্যের ক্রয়মূল্য (COGS)</span>
            <span className="p-1 rounded-lg bg-slate-100 text-slate-700">
              <PackageCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-800">
            {formatCurrency(totalCogs)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>আসল পাইকারি কেনা খরচ</span>
            <span className="font-mono font-semibold text-slate-600">
              {totalRevenue > 0 ? ((totalCogs / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* 3. Gross Commercial Profit */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>৩. মোট বাণিজ্যিক লাভ</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700">
              <Coins className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-indigo-950">
            {formatCurrency(grossProfit)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-indigo-600 font-semibold mt-1">
            <span>গ্রস মার্জিন: {grossMargin.toFixed(1)}%</span>
            <span>(বিক্রয় - ক্রয়)</span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>৪. দোকান পরিচালনা খরচ</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-700">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-rose-600">
            {formatCurrency(totalExpense)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>ভাড়া, বেতন, বিদ্যুৎ বিল</span>
            <span className="font-mono text-rose-600 font-semibold">{expenses.length} টি ভাউচার</span>
          </div>
        </div>

        {/* 5. Actual Net Profit (P&L Bottom-line) */}
        <div
          className={`p-4.5 rounded-3xl border shadow-md relative overflow-hidden ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white border-emerald-800'
              : 'bg-gradient-to-br from-rose-900 via-slate-900 to-red-950 text-white border-rose-800'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className={netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                ৫. প্রকৃত নিট লাভ (Net)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black font-mono text-white">
              {formatCurrency(netProfit)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
              <span>নিট মার্জিন: {netMargin.toFixed(1)}%</span>
              <span className="font-bold">{netProfit >= 0 ? 'লাভজনক ✓' : 'ঘাটতি ✗'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Cash Flow & Drawer Status vs. Inventory Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cash Flow Drawer Analytics */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>নগদ প্রবাহ ও ক্যাশবাক্স খতিয়ান (Cash Flow Summary)</span>
            </h3>
            <span className="text-[11px] text-slate-400">এই পিরিয়ডের কালেকশন</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-slate-500 block">নগদ বিক্রয় (Cash)</span>
              <p className="text-base font-bold font-mono text-emerald-800 mt-0.5">
                {formatCurrency(cashSales)}
              </p>
              <span className="text-[10px] text-slate-400">সরাসরি ক্যাশে প্রাপ্ত</span>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <span className="text-[11px] text-slate-500 block">ডিজিটাল পেমেন্ট</span>
              <p className="text-base font-bold font-mono text-indigo-800 mt-0.5">
                {formatCurrency(digitalSales)}
              </p>
              <span className="text-[10px] text-slate-400">বিকাশ / নগদ / কার্ড</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
              <span className="text-[11px] text-slate-500 block">নতুন বাকি দেওয়া</span>
              <p className="text-base font-bold font-mono text-amber-800 mt-0.5">
                {formatCurrency(dueGiven)}
              </p>
              <span className="text-[10px] text-slate-400">বাকির হিসেবে রাখা</span>
            </div>
          </div>

          {/* Cash vs Digital Ratio Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>পেমেন্ট মাধ্যম অনুপাত:</span>
              <span className="font-mono text-[11px]">
                নগদ {totalRevenue > 0 ? ((cashSales / totalRevenue) * 100).toFixed(0) : 0}% | ডিজিটাল{' '}
                {totalRevenue > 0 ? ((digitalSales / totalRevenue) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${totalRevenue > 0 ? (cashSales / totalRevenue) * 100 : 50}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title="নগদ পেমেন্ট"
              />
              <div
                style={{
                  width: `${totalRevenue > 0 ? (digitalSales / totalRevenue) * 100 : 30}%`,
                }}
                className="bg-indigo-500 h-full transition-all"
                title="ডিজিটাল পেমেন্ট"
              />
              <div
                style={{
                  width: `${totalRevenue > 0 ? (dueGiven / totalRevenue) * 100 : 20}%`,
                }}
                className="bg-amber-400 h-full transition-all"
                title="বকেয়া"
              />
            </div>
          </div>
        </div>

        {/* Stock Valuation & Receivables/Payables */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>বর্তমান স্টক সম্পদ ও বাজার মূল্য (Stock Valuation)</span>
            </h3>
            <span className="text-[11px] text-slate-400">দোকানের মোট মজুদ</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">স্টক মূল্য (পাইকারি)</span>
              <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(inventoryCostValue)}
              </p>
              <span className="text-[10px] text-slate-400">আসল কেনা মূল্যে</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">সম্ভাব্য বিক্রয়মূল্য</span>
              <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(inventoryRetailValue)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                সম্ভাব্য লাভ: +{formatCurrency(projectedInventoryProfit)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">কাস্টমার বাকি ও দেনা</span>
              <p className="text-base font-bold font-mono text-rose-700 mt-0.5">
                {formatCurrency(totalCustomerReceivable)}
              </p>
              <span className="text-[10px] text-slate-400">
                মহাজন দেনা: {formatCurrency(totalSupplierPayable)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>দোকানের মোট চলতি মূলধন (স্টক + বকেয়া পাওনা):</span>
            </div>
            <strong className="font-mono text-indigo-900 text-sm">
              {formatCurrency(inventoryCostValue + totalCustomerReceivable)}
            </strong>
          </div>
        </div>
      </div>

      {/* Row 3: Expense Breakdown vs. Most Profitable Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Operating Expense Breakdown Category-wise */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-600" />
              <span>পরিচালন ব্যয়ের খাতসমূহ (Expense Breakdown)</span>
            </h3>
            <span className="font-mono text-xs font-bold text-rose-600">
              {formatCurrency(totalExpense)}
            </span>
          </div>

          {expenseByCategory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              এই সময়ে কোনো দোকান খরচের এন্ট্রি নেই।
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {(expenseByCategory || []).map((exp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{exp.category}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(exp.amount)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({exp.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, exp.percentage)}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>নিয়মিত খরচ ট্র্যাক করতে:</span>
            <a href="/expenses" className="text-emerald-700 font-bold hover:underline">
              খরচ ভাউচার ম্যানেজ করুন &rarr;
            </a>
          </div>
        </div>

        {/* Most Profitable Products Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>পণ্যভিত্তিক মুনাফা ও সেরা পণ্য (Product Profitability)</span>
            </h3>
            <span className="text-xs text-slate-400">অর্জিত লাভের ভিত্তিতে ক্রম</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">পণ্যের নাম</th>
                  <th className="py-2.5 px-3 text-center">বিক্রি</th>
                  <th className="py-2.5 px-3 text-right">বিক্রয় রেভিনিউ</th>
                  <th className="py-2.5 px-3 text-right">ক্রয় খরচ</th>
                  <th className="py-2.5 px-3 text-right">অর্জিত মুনাফা</th>
                  <th className="py-2.5 px-3 text-right">মার্জিন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(productPerformance || []).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[150px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {p.qty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {formatCurrency(p.cogs)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      +{formatCurrency(p.profit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {p.margin.toFixed(0)}%
                    </td>
                  </tr>
                ))}

                {productPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      এই নির্বাচিত সময়ে কোনো বিক্রয় পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Balance Sheet Footer (Visible during print or inspection) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            রিপোর্ট জেনারেট হওয়ার সময়: <strong>{new Date().toLocaleString('bn-BD')}</strong> | দোকান:{' '}
            <strong>{shop.name}</strong>
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          SmartShopX P&L Audit Engine v3.4
        </span>
      </div>
    </div>
  );
};
