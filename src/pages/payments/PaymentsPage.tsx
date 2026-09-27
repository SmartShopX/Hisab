import React, { useState, useMemo, useEffect } from 'react';
import { PaymentRecord, PaymentType, PaymentMethod } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { cashRegisterService, CashRegisterClosing } from '../../services/cashRegisterService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { DayEndCashClosingModal } from '../../components/pos/DayEndCashClosingModal';
import {
  CreditCard,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Calculator,
  Calendar,
  History,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>(() => DataStore.getPayments());
  const [activeTab, setActiveTab] = useState<'transactions' | 'cash_management'>('transactions');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Cash Management State
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingHistory, setClosingHistory] = useState<CashRegisterClosing[]>(() =>
    cashRegisterService.getClosingHistory()
  );

  const refreshClosings = () => {
    setClosingHistory(cashRegisterService.getClosingHistory());
  };

  useEffect(() => {
    const handleClosingSaved = () => {
      refreshClosings();
    };
    window.addEventListener('smartshopx_cash_closing_saved', handleClosingSaved);
    return () => {
      window.removeEventListener('smartshopx_cash_closing_saved', handleClosingSaved);
    };
  }, []);

  const dayStats = useMemo(() => {
    return cashRegisterService.calculateDayStats(undefined, 2000);
  }, [payments, isClosingModalOpen]);

  // New Payment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<PaymentType>('Customer Payment');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterMethod !== 'all' && p.method !== filterMethod) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.customerOrSupplierName.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, search, filterType, filterMethod]);

  const totalInflow = useMemo(() => {
    return payments
      .filter((p) => p.type === 'Customer Payment' || p.type === 'Due Collection')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const totalOutflow = useMemo(() => {
    return payments
      .filter((p) => p.type === 'Supplier Payment' || p.type === 'Supplier Due Pay')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim() || amount <= 0) {
      showToast('গ্রহীতা/প্রদানকারী এবং টাকার পরিমাণ আবশ্যক', 'warning');
      return;
    }

    const rec: PaymentRecord = {
      id: `pay_${Date.now()}`,
      orderId: undefined,
      type: newType,
      customerOrSupplierName: partyName.trim(),
      amount,
      method,
      reference: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
    };

    const updated = [rec, ...payments];
    setPayments(updated);
    DataStore.setPayments(updated);
    setIsAddModalOpen(false);
    setPartyName('');
    setNotes('');
    showToast('পেমেন্ট লেনদেন সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>পেমেন্ট ও ক্যাশ খাতা (Cash & Payments)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কাস্টমার ও সরবরাহকারীদের অর্থ প্রাপ্তি-পরিশোধ এবং দৈনিক ক্যাশ ড্রয়ার ব্যালেন্স
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cash_management' ? (
            <Button
              onClick={() => setIsClosingModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              দৈনিক ক্যাশ ক্লোজিং করুন
            </Button>
          ) : (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              ম্যানুয়াল লেনদেন যোগ
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          পেমেন্ট লেনদেন খতিয়ান ({payments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cash_management')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cash_management'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>ক্যাশ ড্রয়ার ও ক্যাশ ম্যানেজমেন্ট</span>
        </button>
      </div>

      {activeTab === 'cash_management' ? (
        /* CASH MANAGEMENT & DRAWER VIEW */
        <div className="space-y-4">
          {/* Live Cash Flow Equation Card */}
          <div className="p-5 bg-linear-to-r from-emerald-500/10 via-blue-500/10 to-teal-500/10 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>আজকের ক্যাশ রেজিস্টার সমীকরণ (Cash Register Balance)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Opening Cash + Cash Sales + Due Collection - Cash Expenses = Expected Drawer Cash
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClosingModalOpen(true)}
                leftIcon={<History className="w-3.5 h-3.5" />}
              >
                ক্লোজিং হিস্ট্রি ও ড্রয়ার সমন্বয়
              </Button>
            </div>

            {/* Formula Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-semibold">প্রারম্ভিক ক্যাশ (Opening)</span>
                <span className="font-mono font-bold text-sm text-slate-800 mt-0.5 block">
                  {formatCurrency(dayStats.openingCash)}
                </span>
                <span className="text-[9px] text-slate-400">ড্রয়ার ওপেনিং</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-emerald-600 block font-semibold">(+) নগদ বিক্রয় (Sales)</span>
                <span className="font-mono font-bold text-sm text-emerald-600 mt-0.5 block">
                  {formatCurrency(dayStats.cashSales)}
                </span>
                <span className="text-[9px] text-slate-400">{dayStats.cashOrdersCount} টি ক্যাশ অর্ডার</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-emerald-600 block font-semibold">(+) নগদ বকেয়া আদায়</span>
                <span className="font-mono font-bold text-sm text-emerald-600 mt-0.5 block">
                  {formatCurrency(dayStats.cashDueCollected)}
                </span>
                <span className="text-[9px] text-slate-400">বাকির টাকা জমা</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-rose-600 block font-semibold">(-) নগদ খরচ (Expenses)</span>
                <span className="font-mono font-bold text-sm text-rose-600 mt-0.5 block">
                  {formatCurrency(dayStats.cashExpenses)}
                </span>
                <span className="text-[9px] text-slate-400">দোকান খরচ</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-800 block font-bold">(=) ড্রয়ারে থাকার কথা</span>
                <span className="font-mono font-black text-base text-emerald-700 mt-0.5 block">
                  {formatCurrency(dayStats.expectedDrawerCash)}
                </span>
                <span className="text-[9px] text-emerald-600 font-semibold">প্রত্যাশিত ক্যাশ ব্যালেন্স</span>
              </div>
            </div>
          </div>

          {/* Past Closings History */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>দৈনিক ক্যাশ ক্লোজিং ও অডিট ইতিহাস ({closingHistory.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">হাতে গোনা বনাম হিসাবের ব্যালেন্স</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">তারিখ ও সময়</th>
                    <th className="py-3 px-4">ক্লোজ করেছেন</th>
                    <th className="py-3 px-4 text-right">হিসাবের ড্রয়ার ক্যাশ</th>
                    <th className="py-3 px-4 text-right">বাস্তব গণনা ক্যাশ</th>
                    <th className="py-3 px-4 text-right">পার্থক্য (Diff)</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {closingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        কোনো অতীত ক্যাশ ক্লোজিং রেকর্ড নেই। দিনের শেষে "দৈনিক ক্যাশ ক্লোজিং করুন" বাটনে চাপুন।
                      </td>
                    </tr>
                  ) : (
                    closingHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{item.date}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(item.closedAt)}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.closedBy}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatCurrency(item.expectedDrawerCash)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.physicalDrawerCash)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              item.difference === 0
                                ? 'text-emerald-600'
                                : item.difference < 0
                                ? 'text-rose-600'
                                : 'text-blue-600'
                            }
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              item.status === 'BALANCED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'SHORTAGE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status === 'BALANCED'
                              ? 'হিসাব সঠিক ✓'
                              : item.status === 'SHORTAGE'
                              ? 'ক্যাশ ঘাটতি'
                              : 'অতিরিক্ত ক্যাশ'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TRANSACTIONS VIEW */
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">মোট অর্থ প্রাপ্তি (Inflow)</span>
                <p className="text-2xl font-black font-mono text-emerald-700 mt-1">
                  {formatCurrency(totalInflow)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">কাস্টমার বিক্রয় ও বকেয়া কালেকশন</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">মোট অর্থ প্রদান (Outflow)</span>
                <p className="text-2xl font-black font-mono text-rose-700 mt-1">
                  {formatCurrency(totalOutflow)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">সাপ্লায়ার বিল ও পাওনা পরিশোধ</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ট্রানজেকশন রেফারেন্স দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সকল লেনদেন টাইপ</option>
          <option value="Customer Payment">কাস্টমার পেমেন্ট</option>
          <option value="Due Collection">বকেয়া আদায়</option>
          <option value="Supplier Payment">সাপ্লায়ার পেমেন্ট</option>
        </select>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সকল মাধ্যম</option>
          <option value="Cash">ক্যাশ</option>
          <option value="bKash">বিকাশ</option>
          <option value="Nagad">নগদ</option>
          <option value="Bank">ব্যাংক</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">ব্যক্তি / প্রতিষ্ঠান</th>
                <th className="py-3 px-4">লেনদেন প্রকার (Type)</th>
                <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                <th className="py-3 px-4">রেফারেন্স নং</th>
                <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const isInflow = p.type === 'Customer Payment' || p.type === 'Due Collection';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(p.date)}</td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">
                        {p.customerOrSupplierName}
                      </span>
                      {p.notes && <span className="text-[11px] text-slate-400">{p.notes}</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.method}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.reference}</td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isInflow ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'} {formatCurrency(p.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
    )}

      {/* Day End Cash Closing Modal */}
      <DayEndCashClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onSaved={refreshClosings}
      />

      {/* Manual Payment Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ম্যানুয়াল পেমেন্ট লেনদেন যোগ করুন"
        maxWidth="sm"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লেনদেনের ধরন *
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Customer Payment">কাস্টমার পেমেন্ট (Customer Payment)</option>
              <option value="Due Collection">বকেয়া আদায় (Due Collection)</option>
              <option value="Supplier Payment">সাপ্লায়ার দেনা পরিশোধ (Supplier Payment)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গ্রাহক বা সাপ্লায়ারের নাম *
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="যেমন: সাকিব হাসান / ঢাকা ট্রেডার্স"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Cash">ক্যাশ</option>
              <option value="bKash">বিকাশ</option>
              <option value="Nagad">নগদ</option>
              <option value="Rocket">রকেট</option>
              <option value="Bank">ব্যাংক</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / রেফারেন্স</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: রসিদ নং / বিকাশ ট্রানজেকশন আইডি"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
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
