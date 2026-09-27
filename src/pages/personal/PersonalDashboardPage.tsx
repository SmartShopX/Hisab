import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { personalApi } from '../../services/apiServices';
import { DataStore } from '../../services/dataStorage';
import { PersonalTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PersonalBudgetView } from './PersonalBudgetView';
import { PersonalDueView } from './PersonalDueView';
import { PersonalReportsView } from './PersonalReportsView';
import { PersonalSavingsView } from './PersonalSavingsView';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
  Filter,
  Calendar,
  PieChart,
  Tag,
  Building,
  CreditCard,
  Trash2,
  Lock,
  Scale,
  BarChart3,
  FileSpreadsheet,
  PiggyBank,
  ArrowRightLeft,
  Award,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const PersonalDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'transactions';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedWallet, setSelectedWallet] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('Family Groceries');
  const [amount, setAmount] = useState<number | ''>('');
  const [wallet, setWallet] = useState<'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Other'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Business <-> Personal Cash Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'DRAWING' | 'INJECTION'>('DRAWING');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [shopSourceAccount, setShopSourceAccount] = useState<'Cash' | 'Bank' | 'bKash'>('Cash');
  const [personalTargetWallet, setPersonalTargetWallet] = useState<'Cash' | 'Bank' | 'bKash' | 'Nagad'>('Cash');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await personalApi.getTransactions();
      setTransactions(data);
    } catch {
      showToast('ব্যক্তিগত হিসাব লোড করতে ত্রুটি হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      showToast('সঠিক বিবরণ ও টাকার পরিমাণ প্রদান করুন', 'warning');
      return;
    }

    try {
      const newTx = await personalApi.createTransaction({
        title: title.trim(),
        type,
        category,
        amount: Number(amount),
        wallet,
        date,
        notes: notes.trim() || undefined,
      });
      setTransactions([newTx, ...transactions]);
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
      showToast('ব্যক্তিগত লেনদেন সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    } catch {
      showToast('লেনদেন সংরক্ষণ করা যায়নি', 'error');
    }
  };

  const handleBusinessTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) {
      showToast('সঠিক টাকার পরিমাণ প্রদান করুন', 'warning');
      return;
    }

    const amt = Number(transferAmount);

    try {
      if (transferType === 'DRAWING') {
        // 1. Record Business Expense as Owner Drawings
        const currentExpenses = DataStore.getExpenses();
        DataStore.setExpenses([
          {
            id: `exp_draw_${Date.now()}`,
            category: 'মালিকের ব্যক্তিগত উত্তোলন (Owner Drawings)',
            amount: amt,
            date: transferDate,
            description: `দোকান থেকে ব্যক্তিগত তহবিলে নেওয়া হয়েছে (${personalTargetWallet} ওয়ালেট)`,
            paymentMethod: shopSourceAccount,
          },
          ...currentExpenses,
        ]);

        // 2. Record Personal Income under Business Dividend
        const newTx = await personalApi.createTransaction({
          title: `দোকান থেকে উত্তোলন (Owner Drawing)`,
          type: 'INCOME',
          category: 'Business Dividend (ব্যবসার মুনাফা উত্তোলন)',
          amount: amt,
          wallet: personalTargetWallet,
          date: transferDate,
          notes: transferNotes.trim()
            ? `${transferNotes.trim()} [দোকানের ${shopSourceAccount} থেকে]`
            : `দোকানের ${shopSourceAccount} তহবিল থেকে উত্তোলন`,
        });

        setTransactions([newTx, ...transactions]);
        showToast(
          `৳${amt} দোকান থেকে ব্যক্তিগত ওয়ালেটে সফলভাবে উত্তোলিত ও রেকর্ড হয়েছে`,
          'success'
        );
      } else {
        // Capital Injection: Personal Expense -> Shop Capital
        const newTx = await personalApi.createTransaction({
          title: `দোকানে মূলধন প্রদান (Capital Investment)`,
          type: 'EXPENSE',
          category: 'Business Capital (দোকানে মূলধন বিনিয়োগ)',
          amount: amt,
          wallet: personalTargetWallet,
          date: transferDate,
          notes: transferNotes.trim()
            ? `${transferNotes.trim()} [দোকানের চলতি তহবিলে]`
            : `দোকানের ব্যবসায় মূলধন সরবরাহ`,
        });

        setTransactions([newTx, ...transactions]);
        showToast(
          `৳${amt} ব্যক্তিগত তহবিল থেকে দোকানে মূলধন সরবরাহ হিসেবে রেকর্ড করা হয়েছে`,
          'success'
        );
      }

      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferNotes('');
    } catch {
      showToast('ট্রান্সফার সম্পন্ন করতে ত্রুটি হয়েছে', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ব্যক্তিগত লেনদেনটি মুছে ফেলতে চান?')) return;
    try {
      await personalApi.deleteTransaction(id);
      setTransactions(transactions.filter((t) => t.id !== id));
      showToast('লেনদেন মুছে ফেলা হয়েছে', 'info');
    } catch {
      showToast('মুছতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // External Personal Records for Total Net Worth
  const dues = DataStore.getPersonalDues();
  const savings = DataStore.getPersonalSavings();
  const budgets = DataStore.getPersonalBudgets();

  const totalReceivable = dues
    .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'Paid')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalPayable = dues
    .filter((d) => d.type === 'PAYABLE' && d.status !== 'Paid')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalSavingsAssets = savings.reduce((sum, s) => sum + s.totalDeposited, 0);

  // Comprehensive Personal Net Worth
  const personalNetWorth = netSavings + totalSavingsAssets + totalReceivable - totalPayable;

  // Current Month calculations
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(
    (t) => t.date && t.date.slice(0, 7) === currentYearMonth
  );

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthSavings = monthIncome - monthExpense;
  const savingsRate =
    monthIncome > 0 ? Math.max(0, Math.round((monthSavings / monthIncome) * 100)) : 0;

  // Month owner drawings
  const monthDrawings = currentMonthTransactions
    .filter(
      (t) =>
        t.type === 'INCOME' &&
        (t.category.includes('Business') || t.title.includes('উত্তোলন'))
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered List
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (selectedWallet !== 'ALL' && t.wallet !== selectedWallet) return false;
    return true;
  });

  const incomeCategories = [
    'Business Dividend (ব্যবসার মুনাফা উত্তোলন)',
    'Salary (বেতন)',
    'Rental Income (বাড়ি/সম্পত্তি ভাড়া)',
    'Investments (বিনিয়োগ মুনাফা)',
    'Freelancing / Other (অন্যান্য)',
  ];

  const expenseCategories = [
    'Family Groceries (বাসার বাজার)',
    'Education & Tuition (বাচ্চার পড়াশোনা)',
    'House Rent (বাড়ি ভাড়া)',
    'Utility Bills (বিদ্যুৎ, গ্যাস, ওয়াইফাই)',
    'Medical & Health (চিকিৎসা ও ঔষধ)',
    'Savings & DPS (সঞ্চয় ও ডিপিএস)',
    'Shopping & Personal (পোশাক ও শপিং)',
    'Entertainment & Dining (ঘোরাঘুরি ও রেস্তোরাঁ)',
    'Business Capital (দোকানে মূলধন বিনিয়োগ)',
    'Other Personal (অন্যান্য ব্যক্তিগত খরচ)',
  ];

  return (
    <div className="space-y-6">
      {/* Header with Privacy Note & Transfer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              ব্যক্তিগত হিসাব ও ড্যাশবোর্ড (Personal Accounting)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> ব্যক্তিগত ও গোপনীয়
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ব্যবসার তহবিলের বাইরে আপনার ব্যক্তিগত পরিবার, বেতন, খরচ, ডিপিএস ও জমার নির্ভুল খতিয়ান
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Business <-> Personal Cashflow Quick Action */}
          <Button
            onClick={() => {
              setTransferType('DRAWING');
              setIsTransferModalOpen(true);
            }}
            variant="outline"
            size="md"
            leftIcon={<ArrowRightLeft className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 shadow-2xs"
          >
            দোকান ↔ পকেট ট্রান্সফার
          </Button>

          {activeTab === 'transactions' && (
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-sm"
            >
              নতুন লেনদেন
            </Button>
          )}
        </div>
      </div>

      {/* Personal Net Worth & Financial Health Bar */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-md border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>ব্যক্তিগত প্রকৃত মোট সম্পদ (Personal Net Worth)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                লাইভ ব্যালেন্স
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {formatCurrency(personalNetWorth)}
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              (হাতের ক্যাশ + ব্যাংক ব্যালেন্স + ডিপিএস/সঞ্চয়পত্র + অন্যের কাছে পাওনা) বিয়োগ অন্যের কাছে ব্যক্তিগত দেনা
            </p>
          </div>

          {/* Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[11px] text-slate-400 font-medium">তরল তহবিল (ক্যাশ+ব্যাংক)</span>
              <span className="font-mono font-bold text-sm text-emerald-400">
                {formatCurrency(netSavings)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[11px] text-slate-400 font-medium">ডিপিএস ও সঞ্চয় জমা</span>
              <span className="font-mono font-bold text-sm text-indigo-400">
                {formatCurrency(totalSavingsAssets)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[11px] text-slate-400 font-medium">পাওনা ধার (অন্যের কাছে)</span>
              <span className="font-mono font-bold text-sm text-amber-400">
                +{formatCurrency(totalReceivable)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[11px] text-slate-400 font-medium">ব্যক্তিগত দেনা/ঋণ</span>
              <span className="font-mono font-bold text-sm text-rose-400">
                -{formatCurrency(totalPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Financial Health Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">চলতি মাসের সঞ্চয়ের হার:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                savingsRate >= 30
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : savingsRate >= 15
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {savingsRate}%
            </span>
            <span className="text-slate-400 text-[11px]">
              (আয়: {formatCurrency(monthIncome)}, ব্যয়: {formatCurrency(monthExpense)})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>দোকান থেকে চলতি মাসে উত্তোলন:</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(monthDrawings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>আয় ও ব্যয় (Transactions)</span>
        </button>

        <button
          onClick={() => setTab('savings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'savings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>ডিপিএস ও সঞ্চয় খাতা (Savings & DPS)</span>
        </button>

        <button
          onClick={() => setTab('budgets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'budgets'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>মাসিক বাজেট প্ল্যানার (Budgets)</span>
        </button>

        <button
          onClick={() => setTab('due')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'due'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>ব্যক্তিগত ধার ও দেনা-পাওনা (Dues & Loans)</span>
        </button>

        <button
          onClick={() => setTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>আর্থিক রিপোর্ট ও অ্যানালিটিক্স (Reports)</span>
        </button>
      </div>

      {activeTab === 'savings' && <PersonalSavingsView onTransactionAdded={loadData} />}

      {activeTab === 'budgets' && <PersonalBudgetView transactions={transactions} />}

      {activeTab === 'due' && <PersonalDueView />}

      {activeTab === 'reports' && <PersonalReportsView transactions={transactions} />}

      {activeTab === 'transactions' && (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Income */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">মোট ব্যক্তিগত আয়</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">ব্যবসা লভ্যাংশ, চাকরি ও অন্যান্য উৎস</p>
            </div>

            {/* Total Expense */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">মোট ব্যক্তিগত খরচ</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-rose-600">
                {formatCurrency(totalExpense)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">সংসার, বাড়ি ভাড়া ও পারিবারিক ব্যয়</p>
            </div>

            {/* Net Savings */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">ব্যক্তিগত ক্যাশ ও ব্যাংক উদ্বৃত্ত</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div
                className={`text-2xl font-black font-mono ${
                  netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(netSavings)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">হাতে ও ব্যাংকে থাকা বর্তমান তরল তহবিল</p>
            </div>
          </div>

          {/* Wallet Balances Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
              ব্যক্তিগত অ্যাকাউন্ট ও ওয়ালেট ভিত্তিক ব্যালেন্স
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Cash', 'Bank', 'bKash', 'Nagad'].map((w) => {
                const wIncome = transactions
                  .filter((t) => t.wallet === w && t.type === 'INCOME')
                  .reduce((sum, t) => sum + t.amount, 0);
                const wExpense = transactions
                  .filter((t) => t.wallet === w && t.type === 'EXPENSE')
                  .reduce((sum, t) => sum + t.amount, 0);
                const bal = wIncome - wExpense;

                return (
                  <div
                    key={w}
                    onClick={() => setSelectedWallet(selectedWallet === w ? 'ALL' : w)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedWallet === w
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>{w === 'Cash' ? 'নগদ পকেট ক্যাশ' : w === 'Bank' ? 'ব্যক্তিগত ব্যাংক একাউন্ট' : `${w} পার্সোনাল`}</span>
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(bal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter and Transaction Records */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">ব্যক্তিগত লেনদেন ইতিহাস</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {filteredTransactions.length} টি
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterType === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    সকল
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('INCOME')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterType === 'INCOME'
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    আয়
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('EXPENSE')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterType === 'EXPENSE'
                        ? 'bg-rose-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    ব্যয়
                  </button>
                </div>

                {selectedWallet !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('ALL')}
                    className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium"
                  >
                    ওয়ালেট: {selectedWallet} ✕
                  </button>
                )}
              </div>
            </div>

            {/* Transactions Table / List */}
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">কোনো ব্যক্তিগত লেনদেন পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 mt-0.5">নতুন লেনদেন যোগ করতে বাটনে চাপ দিন</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{tx.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                            {tx.category}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatDate(tx.date)}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{tx.wallet}</span>
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-400 truncate max-w-[180px]">
                                {tx.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-mono font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Business <-> Personal Cashflow Modal (Owner Drawing / Capital Injection) */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="দোকান ↔ ব্যক্তিগত ক্যাশ ট্রান্সফার"
        subtitle="দোকান ও ব্যক্তিগত হিসাবের মধ্যে অর্থ আদান-প্রদান নির্ভুলভাবে ট্র্যাক করুন"
        maxWidth="md"
      >
        <form onSubmit={handleBusinessTransfer} className="space-y-4 py-2">
          {/* Transfer Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTransferType('DRAWING')}
              className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                transferType === 'DRAWING'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              দোকান থেকে নিজের পকেটে উত্তোলন (Drawing)
            </button>
            <button
              type="button"
              onClick={() => setTransferType('INJECTION')}
              className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                transferType === 'INJECTION'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              দোকানে মূলধন প্রদান (Capital Injection)
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            {transferType === 'DRAWING' ? (
              <p>
                ℹ️ <strong>মালিকের উত্তোলন:</strong> দোকানের ক্যাশ বা ব্যাংক থেকে সংসার/ব্যক্তিগত প্রয়োজনে টাকা নিলে তা দোকানের খরচ হিসেবে বাদ যাবে এবং আপনার ব্যক্তিগত অ্যাকাউন্টে জমা হবে।
              </p>
            ) : (
              <p>
                ℹ️ <strong>মূলধন বিনিয়োগ:</strong> আপনার ব্যক্তিগত পকেট বা ব্যাংক থেকে দোকানে টাকা ঢাললে তা ব্যক্তিগত খরচ হিসেবে হিসাব হবে এবং দোকানের মূলধনে যোগ হবে।
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value) || '')}
                placeholder="১০,০০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ *</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {transferType === 'DRAWING' ? 'দোকানের কোন উৎস থেকে নেওয়া হচ্ছে?' : 'দোকানের কোন অ্যাকাউন্টে জমা হবে?'}
              </label>
              <select
                value={shopSourceAccount}
                onChange={(e) => setShopSourceAccount(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Cash">দোকানের ক্যাশ ড্রয়ার (Shop Cash)</option>
                <option value="Bank">দোকানের ব্যাংক একাউন্ট (Shop Bank)</option>
                <option value="bKash">দোকানের বিকাশ মার্চেন্ট (Shop bKash)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {transferType === 'DRAWING' ? 'আপনার কোন ব্যক্তিগত ওয়ালেটে জমা হবে?' : 'আপনার কোন ব্যক্তিগত অ্যাকাউন্ট থেকে দিচ্ছেন?'}
              </label>
              <select
                value={personalTargetWallet}
                onChange={(e) => setPersonalTargetWallet(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Cash">নগদ পকেট ক্যাশ (Personal Cash)</option>
                <option value="Bank">ব্যক্তিগত ব্যাংক অ্যাকাউন্ট (Bank)</option>
                <option value="bKash">বিকাশ পার্সোনাল (bKash)</option>
                <option value="Nagad">নগদ পার্সোনাল (Nagad)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিবরণ / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder={
                transferType === 'DRAWING'
                  ? 'যেমন: বাসার বাজার ও পরিবারের খরচের জন্য'
                  : 'যেমন: নতুন স্টক কেনার জন্য মূলধন বিনিয়োগ'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              ট্রান্সফার নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন ব্যক্তিগত লেনদেন রেকর্ড"
        subtitle="ব্যক্তিগত পরিবারের আয় অথবা খরচের হিসাব যোগ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 py-2">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('Family Groceries');
              }}
              className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ব্যক্তিগত ব্যয় (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('Business Dividend');
              }}
              className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ব্যক্তিগত আয় (Income)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিবরণ / শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'INCOME' ? 'যেমন: মাসিক লভ্যাংশ উত্তোলন' : 'যেমন: বাসার মাসিক বাজার'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || '')}
                placeholder="5000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {(type === 'INCOME' ? incomeCategories : expenseCategories).map((c) => (
                  <option key={c} value={c.split(' ')[0]}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অ্যাকাউন্ট / ওয়ালেট
              </label>
              <select
                value={wallet}
                onChange={(e) => setWallet(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Cash">নগদ ক্যাশ (Cash)</option>
                <option value="Bank">ব্যাংক একাউন্ট (Bank)</option>
                <option value="bKash">বিকাশ পার্সোনাল (bKash)</option>
                <option value="Nagad">নগদ পার্সোনাল (Nagad)</option>
                <option value="Other">অন্যান্য</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট (ঐচ্ছিক)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="অতিরিক্ত কোনো তথ্য"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
