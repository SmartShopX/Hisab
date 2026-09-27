import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Check,
  Plus,
  ChevronDown,
  Layers,
  Sparkles,
  Store,
  Tag,
  Briefcase,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CANONICAL_CATEGORIES, CanonicalCategory, ShopTemplate, Shop } from '../../types';
import { Modal } from './Modal';
import { Button } from './Button';

interface BusinessSwitcherProps {
  variant?: 'header' | 'sidebar';
}

const TEMPLATE_OPTIONS: { value: ShopTemplate; label: string; desc: string }[] = [
  { value: 'Electronics & Telecom', label: 'ইলেকট্রনিক্স ও টেলিকম', desc: 'মোবাইল রিচার্জ, এমএফএস, আইএমইআই ও অ্যাক্সেসরিজ' },
  { value: 'Fashion & Apparel', label: 'ফ্যাশন ও লাইফস্টাইল', desc: 'সাইজ, কালার ভেরিয়েন্ট ও অনলাইন ক্যাটালগ' },
  { value: 'Pharmacy & Healthcare', label: 'ফার্মেসি ও স্বাস্থ্যসেবা', desc: 'জেনেরিক নাম, ব্যাচ নম্বর ও মেয়াদ ট্র্যাকিং' },
  { value: 'Grocery & Supermarket', label: 'মুদি ও সুপারশপ', desc: 'ওজন স্কেল, দ্রুত বারকোড স্ক্যান ও লট হিস্ট্রি' },
  { value: 'Standard Retail', label: 'স্ট্যান্ডার্ড রিটেল', desc: 'সাধারণ খুচরা ব্যবসা ও বহুমুখী ইনভেন্টরি' },
  { value: 'Restaurant & Food', label: 'রেস্টুরেন্ট ও ক্যাফে', desc: 'ডাইনিং টেবিল ও কিচেন অর্ডার' },
  { value: 'Wholesaler / Distributor', label: 'পাইকারি ও ডিস্ট্রিবিউটর', desc: 'কার্টন রেট, বাল্ক সেল ও ক্রেডিট লিমিট' },
  { value: 'Service & Repair', label: 'সার্ভিসিং ও মেরামত', desc: 'জব কার্ড, ডেলিভারি ট্র্যাকিং ও বিলিং' },
];

export const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({ variant = 'header' }) => {
  const {
    shop,
    user,
    activeAccountMode,
    activeBusinessId,
    businesses,
    switchToBusiness,
    switchToPersonal,
    createBusiness,
  } = useAuth();
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Adding New Business
  const [newBizName, setNewBizName] = useState('');
  const [newBizCategory, setNewBizCategory] = useState<CanonicalCategory>('General & Trading');
  const [newBizType, setNewBizType] = useState('Retail Store');
  const [newBizModel, setNewBizModel] = useState<Shop['businessModel']>('Retail');
  const [newBizTemplate, setNewBizTemplate] = useState<ShopTemplate>('Standard Retail');
  const [newBizAddress, setNewBizAddress] = useState('ঢাকা, বাংলাদেশ');

  // Support global open event
  useEffect(() => {
    const handleOpen = () => {
      setShowAddModal(true);
      setIsOpen(false);
    };
    window.addEventListener('smartshopx_open_add_business', handleOpen);
    return () => {
      window.removeEventListener('smartshopx_open_add_business', handleOpen);
    };
  }, []);

  const handleCreateNewBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) {
      showToast('দোকান বা প্রতিষ্ঠানের নাম লিখুন', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = createBusiness({
        name: newBizName.trim(),
        category: newBizCategory,
        businessType: newBizType,
        businessModel: newBizModel,
        template: newBizTemplate,
        address: newBizAddress,
        ownerName: user?.name || 'তানভীর আহমেদ',
        mobile: user?.mobile || '01711002233',
      });

      showToast(`'${created.name}' সফলভাবে তৈরি হয়েছে এবং নতুন ডেটাবেজে সুইচ করা হয়েছে!`, 'success');
      setNewBizName('');
      setShowAddModal(false);
      setIsOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'নতুন ব্যবসা তৈরি করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHeader = variant === 'header';

  return (
    <>
      {/* Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 transition-all cursor-pointer text-left ${
            isHeader
              ? 'px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-2xs'
              : 'w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-white'
          }`}
          title="ব্যবসা বা অ্যাকাউন্ট পরিবর্তন করুন"
        >
          {activeAccountMode === 'personal' ? (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-xs font-bold truncate ${
                  isHeader ? 'text-slate-800 max-w-[150px]' : 'text-slate-100 max-w-[120px]'
                }`}
              >
                {activeAccountMode === 'personal' ? 'ব্যক্তিগত অ্যাকাউন্ট' : shop.name}
              </p>
            </div>
            <p
              className={`text-[10px] truncate ${
                isHeader ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {activeAccountMode === 'personal'
                ? 'বাজেট, দেনা-পাওনা ও ক্যাশ'
                : `${shop.template || 'Standard'} • ${shop.category || 'Trading'}`}
            </p>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
              isHeader ? 'text-slate-400' : 'text-slate-400'
            } ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className={`absolute mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs ${
                isHeader ? 'left-0 sm:left-auto sm:right-0' : 'left-0 bottom-full mb-2'
              }`}
            >
              {/* Header Mode Switcher Tab */}
              <div className="p-3 bg-slate-50 border-b border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  অ্যাকাউন্ট মোড সিলেক্ট করুন
                </p>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      if (activeAccountMode !== 'business') {
                        switchToBusiness(activeBusinessId || businesses[0]?.id || 'shop_101');
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      activeAccountMode === 'business'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>ব্যবসা ({businesses.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      switchToPersonal();
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      activeAccountMode === 'personal'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>ব্যক্তিগত হিসাব</span>
                  </button>
                </div>
              </div>

              {/* Business List */}
              <div className="max-h-64 overflow-y-auto p-2 divide-y divide-slate-100">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>আপনার নিবন্ধিত প্রতিষ্ঠানসমূহ</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded">
                    ডাটা আইসোলেটেড
                  </span>
                </div>

                {safeBusinesses.map((biz) => {
                  const isCurrent = activeAccountMode === 'business' && biz.id === activeBusinessId;
                  return (
                    <button
                      key={biz.id}
                      onClick={() => {
                        switchToBusiness(biz.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer mt-1 ${
                        isCurrent
                          ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 truncate">{biz.name}</p>
                          {isCurrent && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span className="truncate">{biz.category}</span>
                          <span>•</span>
                          <span className="truncate font-medium text-indigo-600">{biz.template}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {biz.plan || 'STARTER'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {biz.id}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-emerald-600 shrink-0">
                          সুইচ করুন
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer: Add Business Button */}
              <div className="p-2.5 border-t border-slate-100 bg-slate-50/80">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowAddModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-emerald-500/80 text-emerald-700 font-bold bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ব্যবসা বা শাখা যুক্ত করুন</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add New Business Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="নতুন ব্যবসা বা শাখা যুক্ত করুন"
        subtitle="একই লগইনে নতুন দোকানের সম্পূর্ণ পৃথক ও স্বাধীন ডাটাবেজ তৈরি করুন"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateNewBusiness} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">দোকান বা প্রতিষ্ঠানের নাম *</label>
            <input
              type="text"
              required
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              placeholder="যেমন: স্মার্ট কালেকশন মিরপুর ব্রাঞ্চ"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মূল ক্যাটাগরি (Canonical Category) *</label>
              <select
                value={newBizCategory}
                onChange={(e) => setNewBizCategory(e.target.value as CanonicalCategory)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer bg-white"
              >
                {CANONICAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">টেমপ্লেট ইঞ্জিন (UI/UX Template) *</label>
              <select
                value={newBizTemplate}
                onChange={(e) => setNewBizTemplate(e.target.value as ShopTemplate)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer bg-white font-medium text-emerald-800"
              >
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <option key={tpl.value} value={tpl.value}>
                    {tpl.label} ({tpl.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ব্যবসার ধরন (Business Type)</label>
              <select
                value={newBizType}
                onChange={(e) => setNewBizType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer bg-white"
              >
                <option value="Retail Store">রিটেল শপ (Retail Store)</option>
                <option value="Wholesale Outlet">পাইকারি সেলস সেন্টার (Wholesale)</option>
                <option value="Online E-Commerce">অনলাইন ই-কমার্স শপ (D2C Brand)</option>
                <option value="Hybrid Retail & Online">হাইব্রিড শোরুম ও অনলাইন</option>
                <option value="Service Center">সার্ভিস ও রিপেয়ারিং সেন্টার</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">বিজনেস মডেল</label>
              <select
                value={newBizModel}
                onChange={(e) => setNewBizModel(e.target.value as Shop['businessModel'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer bg-white"
              >
                <option value="Retail">রিটেল (Retail)</option>
                <option value="Wholesale">পাইকারি (Wholesale)</option>
                <option value="E-Commerce">ই-কমার্স (E-Commerce)</option>
                <option value="Hybrid">হাইব্রিড (Hybrid)</option>
                <option value="Subscription">সাবস্ক্রিপশন ভিত্তিক</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">দোকান বা শোরুমের ঠিকানা</label>
            <input
              type="text"
              value={newBizAddress}
              onChange={(e) => setNewBizAddress(e.target.value)}
              placeholder="যেমন: দোকান নং ১২, নিউ মার্কেট, ঢাকা"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              <strong>নিরাপদ ডাটা আইসোলেশন:</strong> নতুন দোকানের প্রোডাক্ট, ইনভেন্টরি, অর্ডার ও হিসেব বর্তমান দোকান থেকে সম্পূর্ণ আলাদা থাকবে। একই অ্যাকাউন্ট থেকে যেকোনো সময় এক ক্লিকেই পরিবর্তন করা যাবে।
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              নতুন ব্যবসা সক্রিয় করুন
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
