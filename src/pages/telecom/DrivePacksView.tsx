import React, { useState } from 'react';
import { DrivePackOffer, TelecomTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { isValidBdMobile } from '../../utils/validation';
import {
  Flame,
  Plus,
  Zap,
  Tag,
  Clock,
  Sparkles,
  Phone,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';

interface DrivePacksViewProps {
  packs: DrivePackOffer[];
  onSavePack: (pack: DrivePackOffer) => Promise<void>;
  onDeletePack: (id: string) => Promise<void>;
  onRecordSale: (tx: Omit<TelecomTransaction, 'id' | 'date'>) => Promise<void>;
}

export const DrivePacksView: React.FC<DrivePacksViewProps> = ({
  packs,
  onSavePack,
  onDeletePack,
  onRecordSale,
}) => {
  const { showToast } = useToast();
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<DrivePackOffer | null>(null);
  const [selectedPackForSale, setSelectedPackForSale] = useState<DrivePackOffer | null>(null);

  // Quick Sale State
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerPaidAmount, setCustomerPaidAmount] = useState<number | ''>('');
  const [earnedCommission, setEarnedCommission] = useState<number | ''>('');
  const [isSelling, setIsSelling] = useState(false);

  // Add / Edit Form State
  const [operator, setOperator] = useState<DrivePackOffer['operator']>('Grameenphone');
  const [title, setTitle] = useState('');
  const [regularPrice, setRegularPrice] = useState<number | ''>('');
  const [cashbackCommission, setCashbackCommission] = useState<number | ''>('');
  const [customerOfferPrice, setCustomerOfferPrice] = useState<number | ''>('');
  const [type, setType] = useState<DrivePackOffer['type']>('COMBO');
  const [validity, setValidity] = useState('৩০ দিন');
  const [description, setDescription] = useState('');
  const [isSubmittingPack, setIsSubmittingPack] = useState(false);

  const operators = ['Grameenphone', 'Banglalink', 'Robi', 'Airtel', 'Teletalk'];

  const getOperatorColor = (op: string) => {
    switch (op) {
      case 'Grameenphone':
        return {
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
          badge: 'bg-sky-600 text-white',
          hover: 'hover:border-sky-400',
        };
      case 'Banglalink':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          badge: 'bg-amber-600 text-white',
          hover: 'hover:border-amber-400',
        };
      case 'Robi':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          badge: 'bg-red-600 text-white',
          hover: 'hover:border-red-400',
        };
      case 'Airtel':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          badge: 'bg-rose-600 text-white',
          hover: 'hover:border-rose-400',
        };
      case 'Teletalk':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          hover: 'hover:border-emerald-400',
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          badge: 'bg-slate-600 text-white',
          hover: 'hover:border-slate-400',
        };
    }
  };

  const filteredPacks = packs.filter((p) => {
    if (operatorFilter !== 'ALL' && p.operator !== operatorFilter) return false;
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (searchTerm) {
      const match =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!match) return false;
    }
    return true;
  });

  // KPI
  const totalPacksCount = packs.length;
  const avgCommission = packs.length > 0 ? Math.round(packs.reduce((acc, p) => acc + p.cashbackCommission, 0) / packs.length) : 0;
  const maxCommission = packs.length > 0 ? Math.max(...packs.map((p) => p.cashbackCommission)) : 0;

  const handleOpenSale = (pack: DrivePackOffer) => {
    setSelectedPackForSale(pack);
    setCustomerMobile('');
    setCustomerPaidAmount(pack.customerOfferPrice || pack.regularPrice);
    setEarnedCommission(pack.cashbackCommission);
  };

  const handleExecuteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackForSale) return;
    if (!isValidBdMobile(customerMobile)) {
      showToast('সঠিক ১১ ডিজিটের গ্রাহক মোবাইল নম্বর দিন', 'warning');
      return;
    }
    if (!customerPaidAmount || Number(customerPaidAmount) <= 0) {
      showToast('সঠিক টাকার পরিমাণ লিখুন', 'warning');
      return;
    }

    setIsSelling(true);
    try {
      await onRecordSale({
        type: 'DRIVE_PACK',
        provider: selectedPackForSale.operator as any,
        recipientNumber: customerMobile,
        amount: Number(customerPaidAmount),
        commission: Number(earnedCommission) || selectedPackForSale.cashbackCommission,
        status: 'Success',
        transactionId: `DRV-${selectedPackForSale.operator.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: `ড্রাইভ প্যাক সেল: ${selectedPackForSale.title}`,
      });

      setSelectedPackForSale(null);
      setCustomerMobile('');
      showToast(`ড্রাইভ প্যাক বিক্রয় সফল! কমিশন অর্জিত: ৳${earnedCommission}`, 'success');
    } catch {
      showToast('বিক্রয় সম্পন্ন করা যায়নি', 'error');
    } finally {
      setIsSelling(false);
    }
  };

  const handleSavePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('প্যাকের শিরোনাম লিখুন', 'warning');
      return;
    }
    if (!regularPrice || Number(regularPrice) <= 0) {
      showToast('অফিসিয়াল রেগুলার মূল্য দিন', 'warning');
      return;
    }

    const reg = Number(regularPrice);
    const cb = Number(cashbackCommission) || 0;
    const custPrice = customerOfferPrice ? Number(customerOfferPrice) : reg;

    setIsSubmittingPack(true);
    try {
      const packData: DrivePackOffer = {
        id: editingPack ? editingPack.id : `dp_${Date.now()}`,
        operator,
        title: title.trim(),
        regularPrice: reg,
        cashbackCommission: cb,
        customerOfferPrice: custPrice,
        type,
        validity: validity.trim() || '৩০ দিন',
        description: description.trim() || undefined,
      };

      await onSavePack(packData);
      setIsAddModalOpen(false);
      setEditingPack(null);
      resetPackForm();
      showToast('ড্রাইভ প্যাক সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    } catch {
      showToast('প্যাক সেভ করা যায়নি', 'error');
    } finally {
      setIsSubmittingPack(false);
    }
  };

  const resetPackForm = () => {
    setOperator('Grameenphone');
    setTitle('');
    setRegularPrice('');
    setCashbackCommission('');
    setCustomerOfferPrice('');
    setType('COMBO');
    setValidity('৩০ দিন');
    setDescription('');
  };

  const openEditPack = (pack: DrivePackOffer) => {
    setEditingPack(pack);
    setOperator(pack.operator);
    setTitle(pack.title);
    setRegularPrice(pack.regularPrice);
    setCashbackCommission(pack.cashbackCommission);
    setCustomerOfferPrice(pack.customerOfferPrice);
    setType(pack.type);
    setValidity(pack.validity);
    setDescription(pack.description || '');
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              ড্রাইভ প্যাক ও ক্যাশব্যাক অফার খাতা (Drive Packs & Offers)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              উচ্চ কমিশন
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            জিপি, বাংলালিংক, রবি ও এয়ারটেলের মেগা ইন্টারনেট ও কম্বো ড্রাইভ প্যাক বিক্রয় ও সরাসরি কমিশন লাভ
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPack(null);
            resetPackForm();
            setIsAddModalOpen(true);
          }}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          নতুন ড্রাইভ প্যাক যুক্ত করুন
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">মোট সক্রিয় ড্রাইভ অফার</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {totalPacksCount} টি প্যাক
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-700">গড় ক্যাশব্যাক কমিশন</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            {formatCurrency(avgCommission)} / প্যাক
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-700">সর্বোচ্চ একক প্যাক প্রফিট</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
            +{formatCurrency(maxCommission)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="প্যাকের নাম বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Operator Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-semibold">
            <button
              onClick={() => setOperatorFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                operatorFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সকল অপারেটর
            </button>
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => setOperatorFilter(op)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  operatorFilter === op
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Drive Pack Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredPacks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              কোনো ড্রাইভ প্যাক পাওয়া যায়নি
            </div>
          ) : (
            filteredPacks.map((pack) => {
              const color = getOperatorColor(pack.operator);
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border p-4 bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between ${color.border} ${color.hover}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${color.badge}`}>
                        {pack.operator}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pack.validity}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {pack.title}
                    </h3>

                    {pack.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{pack.description}</p>
                    )}

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs font-mono">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-500 font-sans">রেগুলার মূল্য:</span>
                        <span className="text-slate-600 line-through">
                          {formatCurrency(pack.regularPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-700 font-sans font-bold">গ্রাহক মূল্য:</span>
                        <span className="text-slate-900 font-bold text-sm">
                          {formatCurrency(pack.customerOfferPrice || pack.regularPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline border-t border-slate-200/80 pt-1 text-emerald-700 font-bold">
                        <span className="font-sans flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          দোকানের কমিশন / ক্যাশব্যাক:
                        </span>
                        <span className="text-sm">+{formatCurrency(pack.cashbackCommission)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditPack(pack)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="সম্পাদনা করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePack(pack.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Button
                      onClick={() => handleOpenSale(pack)}
                      variant="primary"
                      size="sm"
                      leftIcon={<Zap className="w-3.5 h-3.5" />}
                      className="shadow-2xs"
                    >
                      প্যাক সেল করুন
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Execute Quick Sale Modal */}
      {selectedPackForSale && (
        <Modal
          isOpen={!!selectedPackForSale}
          onClose={() => setSelectedPackForSale(null)}
          title="ড্রাইভ প্যাক বিক্রয় রেকর্ড"
          subtitle={`${selectedPackForSale.operator} - ${selectedPackForSale.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteSale} className="space-y-4 py-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>প্যাক নাম:</span>
                <span className="font-bold">{selectedPackForSale.title}</span>
              </div>
              <div className="flex justify-between">
                <span>মেয়াদ:</span>
                <span>{selectedPackForSale.validity}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 border-t border-amber-200 pt-1">
                <span>আপনার নিশ্চিত কমিশন লাভ:</span>
                <span>+{formatCurrency(selectedPackForSale.cashbackCommission)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাহকের মোবাইল নম্বর (সিম নম্বর) *
              </label>
              <input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গ্রাহকের কাছ থেকে আদায়কৃত টাকা (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={customerPaidAmount}
                  onChange={(e) => setCustomerPaidAmount(Number(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  হাউস ক্যাশব্যাক কমিশন (৳) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={earnedCommission}
                  onChange={(e) => setEarnedCommission(Number(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * বিক্রয় রেকর্ড সম্পন্ন হলে এটি সরাসরি টেলিকম খতিয়ানে ড্রাইভ প্যাক ক্যাটাগরিতে যোগ হয়ে যাবে।
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPackForSale(null)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSelling}>
                বিক্রয় ও কমিশন নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Drive Pack Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingPack ? 'ড্রাইভ প্যাক সম্পাদনা' : 'নতুন ড্রাইভ প্যাক যোগ করুন'}
        subtitle="অপারেটর বা ডিলার গ্রুপের স্পেশাল ক্যাশব্যাক প্যাকের তথ্য সংরক্ষণ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleSavePackSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">অপারেটর *</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">প্যাক টাইপ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="COMBO">কম্বো (ইন্টারনেট + মিনিট)</option>
                <option value="INTERNET">ইন্টারনেট অনলি</option>
                <option value="MINUTES">মিনিট / টকটাইম অনলি</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              প্যাকের নাম ও বিবরণ *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৫০ জিবি ইন্টারনেট + ৮০০ মিনিট"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                রেগুলার মূল্য (৳) *
              </label>
              <input
                type="number"
                min="1"
                value={regularPrice}
                onChange={(e) => setRegularPrice(Number(e.target.value) || '')}
                placeholder="698"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দোকানের ক্যাশব্যাক (৳) *
              </label>
              <input
                type="number"
                step="0.5"
                value={cashbackCommission}
                onChange={(e) => setCashbackCommission(Number(e.target.value) || '')}
                placeholder="80"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাহক অফার মূল্য (৳)
              </label>
              <input
                type="number"
                value={customerOfferPrice}
                onChange={(e) => setCustomerOfferPrice(Number(e.target.value) || '')}
                placeholder="650"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মেয়াদ</label>
              <input
                type="text"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                placeholder="৩০ দিন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">নোট বা ডিলার হাউজ</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="যেমন: ঢাকা নর্থ গ্রুপ ড্রাইভ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPack}>
              {editingPack ? 'আপডেট করুন' : 'ড্রাইভ প্যাক যুক্ত করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
