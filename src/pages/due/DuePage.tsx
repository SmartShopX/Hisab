import React, { useState, useMemo } from 'react';
import { Customer, Supplier, DueInstallmentPlan } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { customerService } from '../../services/customerService';
import { supplierService } from '../../services/supplierService';
import { dueInstallmentService } from '../../services/dueInstallmentService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CustomerLedgerModal } from '../../components/customers/CustomerLedgerModal';
import { DueCollectionModal } from '../../components/customers/DueCollectionModal';
import { DueReminderModal } from '../../components/customers/DueReminderModal';
import { DueInstallmentModal } from '../../components/customers/DueInstallmentModal';
import { VoiceDialerModal } from '../../components/voice/VoiceDialerModal';
import {
  CreditCard,
  Send,
  Search,
  PhoneCall,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  CheckCircle2,
  Filter,
  Layers,
  MessageCircle,
  Sparkles,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Receipt,
  UserCheck,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';

export const DuePage: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => DataStore.getSuppliers());

  const [activeTab, setActiveTab] = useState<'customer_due' | 'installments' | 'supplier_due'>('customer_due');
  const [search, setSearch] = useState('');
  const [agingFilter, setAgingFilter] = useState<'All' | '0-15' | '16-30' | '31-60' | '60+'>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');

  // Modals for Customer Management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isVoiceDialerOpen, setIsVoiceDialerOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

  // Supplier Pay Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  const refreshData = () => {
    dueInstallmentService.updateOverdueInstallments();
    setCustomers(DataStore.getCustomers());
    setSuppliers(DataStore.getSuppliers());
  };

  // Total sums
  const totalCustomerDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
  }, [customers]);

  const totalSupplierPayable = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);
  }, [suppliers]);

  // All active installment plans
  const allInstallmentPlans = useMemo(() => {
    return dueInstallmentService.getAllInstallmentPlans();
  }, [customers]);

  const totalInstallmentDues = useMemo(() => {
    return allInstallmentPlans
      .filter((p) => p.status === 'Active')
      .reduce((sum, p) => sum + p.totalDueAmount, 0);
  }, [allInstallmentPlans]);

  // Aging Analysis Calculations for Customers (4-Tier)
  const agingStats = useMemo(() => {
    const b1 = { count: 0, sum: 0 }; // 0-15 days
    const b2 = { count: 0, sum: 0 }; // 16-30 days
    const b3 = { count: 0, sum: 0 }; // 31-60 days
    const b4 = { count: 0, sum: 0 }; // 60+ days (Bad Debt Risk)

    customers
      .filter((c) => c.totalDue > 0)
      .forEach((c) => {
        const days = c.oldestDueDays || 0;
        if (days <= 15) {
          b1.count++;
          b1.sum += c.totalDue;
        } else if (days <= 30) {
          b2.count++;
          b2.sum += c.totalDue;
        } else if (days <= 60) {
          b3.count++;
          b3.sum += c.totalDue;
        } else {
          b4.count++;
          b4.sum += c.totalDue;
        }
      });

    return { b1, b2, b3, b4 };
  }, [customers]);

  // Top 4 Debtors for Quick Recovery Widget
  const topDebtors = useMemo(() => {
    return [...customers]
      .filter((c) => c.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue)
      .slice(0, 4);
  }, [customers]);

  // Available customer tags
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.tags) {
        c.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => c.totalDue > 0)
      .filter((c) => {
        const days = c.oldestDueDays || 0;
        if (agingFilter === '0-15' && days > 15) return false;
        if (agingFilter === '16-30' && (days <= 15 || days > 30)) return false;
        if (agingFilter === '31-60' && (days <= 30 || days > 60)) return false;
        if (agingFilter === '60+' && days <= 60) return false;

        if (tagFilter !== 'All' && (!c.tags || !c.tags.includes(tagFilter))) {
          return false;
        }

        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.alternateMobile && c.alternateMobile.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.guarantorName && c.guarantorName.toLowerCase().includes(q)) ||
          (c.guarantorMobile && c.guarantorMobile.includes(q))
        );
      });
  }, [customers, search, agingFilter, tagFilter]);

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => s.totalPayable > 0)
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.mobile.includes(q)
        );
      });
  }, [suppliers, search]);

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;

    try {
      await supplierService.paySupplier(
        selectedSupplier.id,
        payAmount,
        'Bank',
        'বকেয়া খাতা হতে দেনা পরিশোধ'
      );
      refreshData();
      setIsPayModalOpen(false);
      showToast(`${selectedSupplier.companyName} কে ৳${payAmount} পরিশোধ সম্পন্ন হয়েছে`, 'success');
    } catch {
      showToast('পরিশোধ করতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleOpenWhatsAppDirect = (customer: Customer) => {
    if (!customer.mobile) {
      showToast('গ্রাহকের মোবাইল নম্বর নেই', 'warning');
      return;
    }
    const cleanPhone = customer.mobile.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    const shop = DataStore.getShop();
    const msg = `সম্মানিত ${customer.name}, শুভেচ্ছা নিন। ${shop.name || 'আমাদের দোকানে'} আপনার বর্তমান বকেয়া ৳${customer.totalDue.toLocaleString('bn-BD')}। সুবিধাজনক সময়ে পরিশোধ করার অনুরোধ জানাচ্ছি। ধন্যবাদ।`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>ডিজিটাল বাকি খাতা ও দেনা-পাওনা লেজার</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Auto Guard & EMI
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            গ্রাহকদের নিকট মোট পাওনা, কিস্তি শিডিউল (EMI), ডিজিটাল স্বাক্ষর ও মহাজন দেনার স্বয়ংক্রিয় হিসাব
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('customer_due')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'customer_due'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            গ্রাহক বাকি ({formatCurrency(totalCustomerDue)})
          </button>

          <button
            onClick={() => setActiveTab('installments')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'installments'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            কিস্তি ও EMI ({allInstallmentPlans.length})
          </button>

          <button
            onClick={() => setActiveTab('supplier_due')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'supplier_due'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            মহাজন দেনা ({formatCurrency(totalSupplierPayable)})
          </button>
        </div>
      </div>

      {/* CUSTOMER DUE TAB */}
      {activeTab === 'customer_due' && (
        <div className="space-y-4">
          {/* Top 4 Debtors - Quick Recovery Widget */}
          {topDebtors.length > 0 && (
            <div className="p-4 bg-linear-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>শীর্ষ বকেয়াদার তালিকা (Top Due Recovery) - দ্রুত তাগাদা ও সংগ্রহ</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  সর্বোচ্চ বকেয়ার শীর্ষ ৪ জন গ্রাহক
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {topDebtors.map((debtor) => {
                  const days = debtor.oldestDueDays || 0;
                  return (
                    <div
                      key={debtor.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {debtor.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{debtor.mobile}</p>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {days} দিন
                        </span>
                      </div>

                      <div>
                        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 block">
                          {formatCurrency(debtor.totalDue)}
                        </span>
                        {debtor.promiseDate && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block truncate">
                            প্রতিশ্রুতি: {debtor.promiseDate}
                          </span>
                        )}
                      </div>

                      {/* Quick Action Icon Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppDirect(debtor)}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                          title="WhatsApp এ তাগাদা পাঠান"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(debtor);
                            setIsVoiceDialerOpen(true);
                          }}
                          className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                          title="ভয়েস কল"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(debtor);
                            setIsInstallmentModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
                          title="কিস্তি শিডিউল তৈরি"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(debtor);
                            setIsCollectModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          আদায়
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-Tier Aging Analysis Interactive Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>বকেয়ার বয়স ভিত্তিক বিশ্লেষণ (Due Aging Analysis)</span>
              </span>
              {agingFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setAgingFilter('All')}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  ফিল্টার রিসেট করুন (সকল দেখান)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 0-15 Days */}
              <button
                type="button"
                onClick={() => setAgingFilter(agingFilter === '0-15' ? 'All' : '0-15')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  agingFilter === '0-15'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                  ০-১৫ দিন (স্বাভাবিক / Fresh)
                </span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                  {formatCurrency(agingStats.b1.sum)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {agingStats.b1.count} জন গ্রাহক
                </span>
              </button>

              {/* 16-30 Days */}
              <button
                type="button"
                onClick={() => setAgingFilter(agingFilter === '16-30' ? 'All' : '16-30')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  agingFilter === '16-30'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                  ১৬-৩০ দিন (ফলো-আপ যোগ্য)
                </span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                  {formatCurrency(agingStats.b2.sum)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {agingStats.b2.count} জন গ্রাহক
                </span>
              </button>

              {/* 31-60 Days */}
              <button
                type="button"
                onClick={() => setAgingFilter(agingFilter === '31-60' ? 'All' : '31-60')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  agingFilter === '31-60'
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-400 ring-2 ring-orange-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                }`}
              >
                <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 block">
                  ৩১-৬০ দিন (সতর্কতামূলক)
                </span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
                  {formatCurrency(agingStats.b3.sum)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {agingStats.b3.count} জন গ্রাহক
                </span>
              </button>

              {/* 60+ Days (Critical / Bad Debt) */}
              <button
                type="button"
                onClick={() => setAgingFilter(agingFilter === '60+' ? 'All' : '60+')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  agingFilter === '60+'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
                }`}
              >
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                  ৬০+ দিন (উচ্চ ঝুঁকি / খেলাপি)
                </span>
                <span className="text-base font-bold font-mono text-rose-700 dark:text-rose-400 mt-1 block">
                  {formatCurrency(agingStats.b4.sum)}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  {agingStats.b4.count} জন গ্রাহক
                </span>
              </button>
            </div>
          </div>

          {/* Search & Tag Filtering Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="গ্রাহকের নাম, মোবাইল, জামিনদার বা ঠিকানা খুঁজুন..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                ক্যাটেগরি/ট্যাগ:
              </span>
              <button
                type="button"
                onClick={() => setTagFilter('All')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer ${
                  tagFilter === 'All'
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                সব
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer transition-colors ${
                    tagFilter === tag
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Due List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">গ্রাহকের নাম ও মোবাইল</th>
                    <th className="py-3 px-4">জামিনদার ও ঠিকানা</th>
                    <th className="py-3 px-4">বকেয়ার পরিমাণ ও লিমিট</th>
                    <th className="py-3 px-4">বকেয়ার বয়স (Aging)</th>
                    <th className="py-3 px-4">পরিশোধের প্রতিশ্রুতি</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন ও তাগাদা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        কোনো বকেয়া রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const days = c.oldestDueDays || 0;
                      const creditLimit = c.creditLimit || 0;
                      const usagePct =
                        creditLimit > 0 ? Math.min(100, Math.round((c.totalDue / creditLimit) * 100)) : 0;
                      const isOverLimit = creditLimit > 0 && c.totalDue > creditLimit;
                      const hasActivePlan = c.installmentPlans?.some((p) => p.status === 'Active');

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {c.name}
                                  </span>
                                  {hasActivePlan && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-[9px]">
                                      EMI
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                                  {c.mobile}
                                </span>
                                {c.alternateMobile && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    বিকল্প: {c.alternateMobile}
                                  </span>
                                )}
                              </div>
                            </div>
                            {c.tags && c.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {c.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-semibold rounded"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {c.guarantorName ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                                  <UserPlus className="w-2.5 h-2.5" />
                                  <span>জামিনদার: {c.guarantorName}</span>
                                </span>
                                {c.guarantorMobile && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {c.guarantorMobile}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium block w-fit mb-0.5">
                                {c.customerType || 'খুচরা'}
                              </span>
                            )}
                            <span className="text-slate-600 dark:text-slate-400 text-[11px] max-w-[140px] truncate block">
                              {c.address || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className="inline-block font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-sm">
                                {formatCurrency(c.totalDue)}
                              </span>
                              {creditLimit > 0 && (
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>লিমিট: ৳{creditLimit}</span>
                                    <span className={isOverLimit ? 'text-rose-600 font-bold' : ''}>
                                      {usagePct}%
                                    </span>
                                  </div>
                                  <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isOverLimit
                                          ? 'bg-rose-600'
                                          : usagePct > 75
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${usagePct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                days > 60
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : days > 30
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                  : days > 15
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {days > 0 ? `${days} দিন পুরনো` : 'সাম্প্রতিক'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {c.promiseDate ? (
                              <div>
                                <span className="text-purple-700 dark:text-purple-400 font-medium text-[11px] block">
                                  📅 {c.promiseDate}
                                </span>
                                {c.reminderNotes && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                                    {c.reminderNotes}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">নির্ধারিত নেই</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Ledger */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg cursor-pointer"
                                title="খতিয়ান স্টেটমেন্ট দেখুন"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              {/* WhatsApp Direct */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppDirect(c)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg cursor-pointer"
                                title="হোয়াটসঅ্যাপে তাগাদা স্লিপ ও পে-লিংক পাঠান"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              {/* Installment Plan Modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setIsInstallmentModalOpen(true);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg cursor-pointer"
                                title="কিস্তি ও EMI শিডিউল পরিচালনা"
                              >
                                <Layers className="w-4 h-4" />
                              </button>

                              {/* Reminder Modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setIsReminderModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg cursor-pointer"
                                title="এসএমএস বা নোটিশ তাগাদা"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Voice Call */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setIsVoiceDialerOpen(true);
                                }}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                title="ভয়েস কল ডায়ালার"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </button>

                              {/* Collect */}
                              <Button
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setIsCollectModalOpen(true);
                                }}
                                variant="primary"
                                size="sm"
                                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                              >
                                আদায়
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSTALLMENTS & EMI TAB */}
      {activeTab === 'installments' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>চলমান কিস্তি ও ইএমআই শিডিউল মনিটরিং</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                বড় অঙ্কের বকেয়া পরিশোধের জন্য গ্রাহকদের প্রদানকৃত কিস্তিসমূহের লাইভ স্ট্যাটাস
              </p>
            </div>
            <span className="font-mono font-bold text-emerald-600 text-sm">
              মোট চলমান কিস্তি বকেয়া: {formatCurrency(totalInstallmentDues)}
            </span>
          </div>

          {allInstallmentPlans.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                কোনো কিস্তি বা ইএমআই প্ল্যান তৈরি করা হয়নি
              </p>
              <p className="text-xs text-slate-500">
                গ্রাহক বাকি খাতা ট্যাবে গিয়ে যেকোনো গ্রাহকের পাশে "Layers" আইকনে ক্লিক করে কিস্তি শিডিউল তৈরি করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allInstallmentPlans.map((plan) => {
                const paidCount = plan.installments.filter((i) => i.status === 'Paid').length;
                const overdueCount = plan.installments.filter((i) => i.status === 'Overdue').length;
                const progressPct = Math.round((paidCount / plan.numberOfInstallments) * 100);

                return (
                  <div
                    key={plan.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {plan.customerName}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {plan.customerMobile}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          plan.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : overdueCount > 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {plan.status === 'Completed'
                          ? 'পরিশোধ সম্পন্ন'
                          : overdueCount > 0
                          ? `${overdueCount} কিস্তি খেলাপি`
                          : 'সক্রিয়'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {plan.numberOfInstallments} কিস্তিতে {formatCurrency(plan.totalDueAmount)}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {paidCount}/{plan.numberOfInstallments} আদায় ({progressPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Installments Badges */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1 text-xs">
                      {plan.installments.map((inst) => (
                        <div
                          key={inst.id}
                          className={`p-1.5 rounded-lg text-center border text-[10px] font-mono ${
                            inst.status === 'Paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                              : inst.status === 'Overdue'
                              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div>#{inst.installmentNo} - ৳{inst.amount}</div>
                          <div className="text-[9px] text-slate-400">{inst.dueDate}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const c = customers.find((cust) => cust.id === plan.customerId);
                          if (c) {
                            setSelectedCustomer(c);
                            setIsInstallmentModalOpen(true);
                          }
                        }}
                        className="text-xs"
                      >
                        বিস্তারিত ও কিস্তি আদায়
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUPPLIER DUE TAB */}
      {activeTab === 'supplier_due' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">সরবরাহকারী প্রতিষ্ঠান</th>
                    <th className="py-3 px-4">যোগাযোগ</th>
                    <th className="py-3 px-4">মোট ক্রয় চালান</th>
                    <th className="py-3 px-4">দেনার পরিমাণ</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        কোনো সাপ্লায়ার দেনা নেই!
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {s.companyName}
                          </span>
                          <span className="text-[11px] text-slate-400">{s.address}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-800 dark:text-slate-200 font-medium block">{s.name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {s.mobile}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(s.totalPurchase)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-900/60 text-sm">
                            {formatCurrency(s.totalPayable)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            onClick={() => {
                              setSelectedSupplier(s);
                              setPayAmount(s.totalPayable);
                              setIsPayModalOpen(true);
                            }}
                            variant="danger"
                            size="sm"
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          >
                            দেনা পরিশোধ
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modals */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={selectedCustomer}
        onCollectDueClick={(c) => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(c);
          setIsCollectModalOpen(true);
        }}
        onSendReminderClick={(c) => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(c);
          setIsReminderModalOpen(true);
        }}
        onManageInstallmentsClick={(c) => {
          setIsLedgerModalOpen(false);
          setSelectedCustomer(c);
          setIsInstallmentModalOpen(true);
        }}
      />

      <DueCollectionModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshData}
      />

      <DueReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshData}
      />

      <DueInstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={refreshData}
      />

      <VoiceDialerModal
        isOpen={isVoiceDialerOpen}
        onClose={() => setIsVoiceDialerOpen(false)}
        customer={selectedCustomer}
        callType="due_reminder"
        onCallCompleted={refreshData}
      />

      {/* Supplier Pay Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="সরবরাহকারী দেনা পরিশোধ"
          subtitle={`প্রতিষ্ঠান: ${selectedSupplier.companyName} (মোট দেনা: ৳${selectedSupplier.totalPayable})`}
          maxWidth="sm"
        >
          <form onSubmit={handlePaySupplierSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                পরিশোধের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min={1}
                max={selectedSupplier.totalPayable}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="danger" size="sm">
                পরিশোধ নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DuePage;
