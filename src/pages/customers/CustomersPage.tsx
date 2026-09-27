import React, { useState, useMemo } from 'react';
import { Customer, CustomerType } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { BulkCustomerImportModal } from '../../components/customers/BulkCustomerImportModal';
import { CustomerLedgerModal } from '../../components/customers/CustomerLedgerModal';
import { DueCollectionModal } from '../../components/customers/DueCollectionModal';
import { DueReminderModal } from '../../components/customers/DueReminderModal';
import { CreditLimitModal } from '../../components/customers/CreditLimitModal';
import { DueInstallmentModal } from '../../components/customers/DueInstallmentModal';
import { VoiceDialerModal } from '../../components/voice/VoiceDialerModal';
import { csvHelper } from '../../utils/csvHelper';
import {
  Users,
  Search,
  UserPlus,
  CreditCard,
  FileText,
  Send,
  ShieldAlert,
  Edit2,
  Trash2,
  UploadCloud,
  Download,
  PhoneCall,
  Sliders,
  Calendar,
  AlertTriangle,
  Clock,
  UserCheck,
  Building,
  Layers,
  Tag,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | CustomerType>('All');
  const [dueFilter, setDueFilter] = useState<'All' | 'WithDue' | 'OverLimit' | 'AgingAlert'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // New Dedicated Modals
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isCollectDueModalOpen, setIsCollectDueModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isCreditLimitModalOpen, setIsCreditLimitModalOpen] = useState(false);
  const [isVoiceDialerOpen, setIsVoiceDialerOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);

  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Add/Edit Form State
  const initialForm = {
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    customerType: 'Retail' as CustomerType,
    tier: 'General' as const,
    creditLimit: 10000,
    creditTermDays: 30,
    nidOrTradeLicense: '',
    notes: '',
    guarantorName: '',
    guarantorMobile: '',
    guarantorRelation: '',
    tags: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Refresh customer list
  const refreshCustomers = () => {
    const updated = DataStore.getCustomers();
    setCustomers(updated);
    if (activeCustomer) {
      const refreshedActive = updated.find((c) => c.id === activeCustomer.id);
      if (refreshedActive) setActiveCustomer(refreshedActive);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalDue = 0;
    let overLimitCount = 0;
    let agingAlertCount = 0;
    let totalPurchases = 0;

    customers.forEach((c) => {
      totalDue += c.totalDue || 0;
      totalPurchases += c.totalPurchase || 0;
      if (c.creditLimit && c.creditLimit > 0 && c.totalDue > c.creditLimit) {
        overLimitCount++;
      }
      if (c.oldestDueDays && c.oldestDueDays > 30 && c.totalDue > 0) {
        agingAlertCount++;
      }
    });

    return {
      totalCustomers: customers.length,
      totalDue,
      overLimitCount,
      agingAlertCount,
      totalPurchases,
    };
  }, [customers]);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Type filter
      if (typeFilter !== 'All' && c.customerType !== typeFilter) {
        return false;
      }

      // Due Filter
      if (dueFilter === 'WithDue' && c.totalDue <= 0) {
        return false;
      }
      if (dueFilter === 'OverLimit') {
        const limit = c.creditLimit || 0;
        if (limit === 0 || c.totalDue <= limit) return false;
      }
      if (dueFilter === 'AgingAlert') {
        if (!c.oldestDueDays || c.oldestDueDays <= 30 || c.totalDue <= 0) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.alternateMobile && c.alternateMobile.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.customerType && c.customerType.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, search, typeFilter, dueFilter]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      showToast('গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }

    const tagArray = formData.tags
      ? formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const customerPayload = {
      ...formData,
      tags: tagArray,
    };

    try {
      if (isAddModalOpen) {
        await customerService.addCustomer({
          ...customerPayload,
          riskLevel: 'Low',
        });
        showToast('নতুন গ্রাহক সফলভাবে নিবন্ধিত হয়েছে', 'success');
      } else if (activeCustomer) {
        await customerService.updateCustomer(activeCustomer.id, customerPayload);
        showToast('গ্রাহকের তথ্য হালনাগাদ করা হয়েছে', 'success');
      }
      refreshCustomers();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(initialForm);
    } catch {
      showToast('গ্রাহকের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Bulk Import handler
  const handleBulkImportComplete = (newCusts: Customer[]) => {
    const combined = [...newCusts, ...customers];
    setCustomers(combined);
    DataStore.setCustomers(combined);
    showToast(`${newCusts.length} জন গ্রাহক সফলভাবে ইম্পোর্ট করা হয়েছে`, 'success');
  };

  // Export CSV handler
  const handleExportCustomers = () => {
    csvHelper.exportToCsv('SmartShopX_Customers_Ledger', customers, [
      { key: 'name', header: 'গ্রাহকের নাম' },
      { key: 'mobile', header: 'মোবাইল নম্বর' },
      { key: 'customerType', header: 'গ্রাহকের ধরন' },
      { key: 'creditLimit', header: 'ক্রেডিট লিমিট' },
      { key: 'totalPurchase', header: 'মোট ক্রয়' },
      { key: 'totalPaid', header: 'মোট পরিশোধ' },
      { key: 'totalDue', header: 'বর্তমান বকেয়া' },
      { key: 'oldestDueDays', header: 'বকেয়ার বয়স (দিন)' },
      { key: 'promiseDate', header: 'প্রতিশ্রুতি তারিখ' },
      { key: 'riskLevel', header: 'ঝুঁকি রেটিং' },
    ]);
    showToast('গ্রাহক তালিকা ও বাকি খাতা CSV ফাইলে ডাউনলোড হয়েছে', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">গ্রাহক তালিকা ও বকেয়া ব্যবস্থাপনা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ডিজিটাল বাকি খতিয়ান, ক্রেডিট লিমিট ও ঝুঁকি নিয়ন্ত্রণ, এবং এসএমএস/হোয়াটসঅ্যাপ তাগাদা হাব
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Import */}
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="CSV ফাইল থেকে একাধিক গ্রাহক ইম্পোর্ট করুন"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>বাল্ক ইম্পোর্ট</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCustomers}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="সকল গ্রাহক ও বকেয়া খাতা ডাউনলোড করুন"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>এক্সপোর্ট</span>
          </button>

          <Button
            onClick={() => {
              setFormData(initialForm);
              setIsAddModalOpen(true);
            }}
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            নতুন গ্রাহক যোগ
          </Button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">নিবন্ধিত গ্রাহক</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
            {metrics.totalCustomers} জন
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            মোট ক্রয়: {formatCurrency(metrics.totalPurchases)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">মোট বাজার বাকি (Total Due)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-rose-600 font-mono mt-1 block">
            {formatCurrency(metrics.totalDue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">গ্রাহকদের কাছে পাওনা</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">বাকি সীমা অতিক্রান্ত</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-amber-600 font-mono mt-1 block">
            {metrics.overLimitCount} জন
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">ক্রেডিট লিমিটের চেয়ে বেশি</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">৩০+ দিন দীর্ঘমেয়াদী বকেয়া</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-purple-700 font-mono mt-1 block">
            {metrics.agingAlertCount} জন
          </span>
          <span className="text-[11px] text-purple-600 mt-0.5 block">জরুরি তাগাদা আবশ্যক</span>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="গ্রাহকের নাম, মোবাইল নম্বর, বিকল্প ফোন বা ঠিকানা খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">ধরন:</span>
            {(['All', 'Retail', 'Wholesale', 'Corporate'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'All'
                  ? 'সকল'
                  : t === 'Retail'
                  ? 'খুচরা'
                  : t === 'Wholesale'
                  ? 'পাইকারি'
                  : 'কর্পোরেট'}
              </button>
            ))}
          </div>
        </div>

        {/* Due State Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">বকেয়া ফিল্টার:</span>
          <button
            onClick={() => setDueFilter('All')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              dueFilter === 'All'
                ? 'bg-emerald-100 text-emerald-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            সব গ্রাহক ({customers.length})
          </button>
          <button
            onClick={() => setDueFilter('WithDue')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              dueFilter === 'WithDue'
                ? 'bg-rose-100 text-rose-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            কেবলমাত্র বকেয়াদার ({customers.filter((c) => c.totalDue > 0).length})
          </button>
          <button
            onClick={() => setDueFilter('OverLimit')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              dueFilter === 'OverLimit'
                ? 'bg-amber-100 text-amber-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            সীমা অতিক্রান্ত ({metrics.overLimitCount})
          </button>
          <button
            onClick={() => setDueFilter('AgingAlert')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
              dueFilter === 'AgingAlert'
                ? 'bg-purple-100 text-purple-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ৩০+ দিন পুরোনো বাকি ({metrics.agingAlertCount})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">গ্রাহক তথ্য ও টায়ার</th>
                <th className="py-3 px-4">ঠিকানা ও যোগাযোগ</th>
                <th className="py-3 px-4">মোট ক্রয়</th>
                <th className="py-3 px-4">বর্তমান বকেয়া ও লিমিট</th>
                <th className="py-3 px-4">বকেয়ার বয়স ও প্রতিশ্রুতি</th>
                <th className="py-3 px-4">ঝুঁকি স্তর</th>
                <th className="py-3 px-4 text-center">ব্যবস্থাপনা ও অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    কোনো গ্রাহক পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const creditLimit = c.creditLimit || 0;
                  const isOverLimit = creditLimit > 0 && c.totalDue > creditLimit;
                  const usagePercent =
                    creditLimit > 0 ? Math.min(100, Math.round((c.totalDue / creditLimit) * 100)) : 0;
                  const agingDays = c.oldestDueDays || 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer Name & Tier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                                {c.customerType === 'Wholesale'
                                  ? 'পাইকারি'
                                  : c.customerType === 'Corporate'
                                  ? 'কর্পোরেট'
                                  : 'খুচরা'}
                              </span>
                              {c.tier && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                                  {c.tier}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile & Alternate */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-mono font-medium block">{c.mobile}</span>
                        {c.alternateMobile && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            বিকল্প: {c.alternateMobile}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 max-w-[150px] truncate block">
                          {c.address || '—'}
                        </span>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatCurrency(c.totalPurchase)}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.ordersCount} টি চালান</span>
                      </td>

                      {/* Due & Credit Limit */}
                      <td className="py-3.5 px-4">
                        {c.totalDue > 0 ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                {formatCurrency(c.totalDue)}
                              </span>
                              {isOverLimit && (
                                <span
                                  className="p-0.5 bg-rose-100 text-rose-700 rounded"
                                  title="ক্রেডিট লিমিট অতিক্রান্ত"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>

                            {creditLimit > 0 && (
                              <div className="mt-1.5 w-28">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                  <span>লিমিট: ৳{creditLimit.toLocaleString('bn-BD')}</span>
                                  <span className={isOverLimit ? 'text-rose-600 font-bold' : ''}>
                                    {usagePercent}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isOverLimit
                                        ? 'bg-rose-600'
                                        : usagePercent > 75
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> বকেয়া নেই
                          </span>
                        )}
                      </td>

                      {/* Aging & Commitment */}
                      <td className="py-3.5 px-4">
                        {c.totalDue > 0 ? (
                          <div>
                            {agingDays > 0 ? (
                              <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  agingDays > 60
                                    ? 'bg-rose-100 text-rose-800'
                                    : agingDays > 30
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {agingDays} দিন পুরনো
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">সাম্প্রতিক</span>
                            )}

                            {c.promiseDate && (
                              <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                                📅 দেবে: {c.promiseDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Risk Rating */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.riskLevel} type="risk" />
                        {c.isCreditLocked && (
                          <span className="text-[9px] px-1 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded block mt-1 font-bold">
                            বাকি লকড
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Digital Ledger */}
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setIsLedgerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="ডিজিটাল খতিয়ান ও বাকি খাতা দেখুন"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Collect Due */}
                          {c.totalDue > 0 && (
                            <button
                              onClick={() => {
                                setActiveCustomer(c);
                                setIsCollectDueModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="বকেয়া টাকা আদায় ও রসিদ তৈরি"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>আদায়</span>
                            </button>
                          )}

                          {/* Due Reminder */}
                          {c.totalDue > 0 && (
                            <button
                              onClick={() => {
                                setActiveCustomer(c);
                                setIsReminderModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                              title="এসএমএস বা হোয়াটসঅ্যাপে বকেয়া তাগাদা পাঠান"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* AI Voice Call */}
                          {c.totalDue > 0 && (
                            <button
                              onClick={() => {
                                setActiveCustomer(c);
                                setIsVoiceDialerOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              title="এআই আউটবাউন্ড ভয়েস কল তাগাদা"
                            >
                              <PhoneCall className="w-4 h-4 text-blue-600" />
                            </button>
                          )}

                          {/* Credit Limit & Risk Settings */}
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setIsCreditLimitModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="ক্রেডিট লিমিট ও ঝুঁকি সেটিংস"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => {
                              setActiveCustomer(c);
                              setFormData({
                                name: c.name,
                                mobile: c.mobile,
                                alternateMobile: c.alternateMobile || '',
                                email: c.email || '',
                                address: c.address,
                                customerType: c.customerType || 'Retail',
                                tier: c.tier || 'General',
                                creditLimit: c.creditLimit || 10000,
                                creditTermDays: c.creditTermDays || 30,
                                nidOrTradeLicense: c.nidOrTradeLicense || '',
                                notes: c.notes || '',
                                guarantorName: c.guarantorName || '',
                                guarantorMobile: c.guarantorMobile || '',
                                guarantorRelation: c.guarantorRelation || '',
                                tags: (c.tags || []).join(', '),
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="গ্রাহকের তথ্য সম্পাদন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* 1. Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'নতুন গ্রাহক যুক্ত করুন' : 'গ্রাহকের তথ্য হালনাগাদ'}
        subtitle="গ্রাহকের নাম, মোবাইল নম্বর, ধরন ও ক্রেডিট লিমিট নির্ধারণ করুন"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাহকের নাম (Full Name) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: সোহেল রানা"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (Primary Mobile) *
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">গ্রাহকের ধরন</label>
              <select
                value={formData.customerType}
                onChange={(e) =>
                  setFormData({ ...formData, customerType: e.target.value as CustomerType })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Retail">খুচরা ক্রেতা (Retail)</option>
                <option value="Wholesale">পাইকারি ক্রেতা (Wholesale)</option>
                <option value="Corporate">কর্পোরেট ক্লায়েন্ট (Corporate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মেম্বারশিপ টায়ার</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="General">General</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ক্রেডিট লিমিট (বাকি সীমা ৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.creditLimit}
                onChange={(e) =>
                  setFormData({ ...formData, creditLimit: Number(e.target.value) || 0 })
                }
                placeholder="10000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিকল্প ফোন নম্বর (Optional)
              </label>
              <input
                type="tel"
                value={formData.alternateMobile}
                onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ইমেইল ঠিকানা</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="বাসা/দোকান নং, রোড, থানা, জেলা..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Guarantor / Reference & Tags Section */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>জামিনদার / রেফারেন্স ও ট্যাগ (বাকি সুরক্ষার জন্য)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  জামিনদারের নাম
                </label>
                <input
                  type="text"
                  value={formData.guarantorName}
                  onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                  placeholder="যেমন: হাজী আব্দুল করিম"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  জামিনদারের মোবাইল
                </label>
                <input
                  type="tel"
                  value={formData.guarantorMobile}
                  onChange={(e) => setFormData({ ...formData, guarantorMobile: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  সম্পর্ক
                </label>
                <input
                  type="text"
                  value={formData.guarantorRelation}
                  onChange={(e) => setFormData({ ...formData, guarantorRelation: e.target.value })}
                  placeholder="যেমন: চাচা, ভাই, পরিচিত"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                কাস্টমার ট্যাগ (কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="যেমন: বিশ্বস্ত, পাইকারি, নিয়মিত, স্থানীয়"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isAddModalOpen ? 'গ্রাহক যোগ করুন' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Customer Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={activeCustomer}
        onCollectDueClick={(c) => {
          setIsLedgerModalOpen(false);
          setActiveCustomer(c);
          setIsCollectDueModalOpen(true);
        }}
        onSendReminderClick={(c) => {
          setIsLedgerModalOpen(false);
          setActiveCustomer(c);
          setIsReminderModalOpen(true);
        }}
        onManageInstallmentsClick={(c) => {
          setIsLedgerModalOpen(false);
          setActiveCustomer(c);
          setIsInstallmentModalOpen(true);
        }}
      />

      {/* 2.1 Due Installment Modal */}
      <DueInstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        customer={activeCustomer}
        onSuccess={refreshCustomers}
      />

      {/* 3. Due Collection Modal */}
      <DueCollectionModal
        isOpen={isCollectDueModalOpen}
        onClose={() => setIsCollectDueModalOpen(false)}
        customer={activeCustomer}
        onSuccess={refreshCustomers}
      />

      {/* 4. Due Reminder Modal */}
      <DueReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        customer={activeCustomer}
        onSuccess={refreshCustomers}
      />

      {/* 5. Credit Limit Modal */}
      <CreditLimitModal
        isOpen={isCreditLimitModalOpen}
        onClose={() => setIsCreditLimitModalOpen(false)}
        customer={activeCustomer}
        onSuccess={refreshCustomers}
      />

      {/* 6. AI Voice Dialer Modal */}
      <VoiceDialerModal
        isOpen={isVoiceDialerOpen}
        onClose={() => setIsVoiceDialerOpen(false)}
        customer={activeCustomer}
        callType="due_reminder"
        onCallCompleted={refreshCustomers}
      />

      {/* Bulk Customer Import Modal */}
      <BulkCustomerImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={handleBulkImportComplete}
      />
    </div>
  );
};
