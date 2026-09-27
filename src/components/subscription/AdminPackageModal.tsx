import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SubscriptionPackage } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Check, Sparkles, Sliders, Shield } from 'lucide-react';

interface AdminPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageToEdit?: SubscriptionPackage | null;
  onSave: (pkg: SubscriptionPackage) => void;
}

export const AdminPackageModal: React.FC<AdminPackageModalProps> = ({
  isOpen,
  onClose,
  packageToEdit,
  onSave,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [key, setKey] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(799);
  const [yearlyPrice, setYearlyPrice] = useState<number>(7999);
  const [isLifetime, setIsLifetime] = useState(false);
  const [lifetimePrice, setLifetimePrice] = useState<number>(12999);
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  // Quotas
  const [maxProducts, setMaxProducts] = useState<string>('2000');
  const [maxSalesMonthly, setMaxSalesMonthly] = useState<string>('unlimited');
  const [maxStaff, setMaxStaff] = useState<string>('3');
  const [maxBranches, setMaxBranches] = useState<string>('1');

  // Features list
  const [features, setFeatures] = useState<{ title: string; included: boolean }[]>([
    { title: 'POS বিক্রয় ও অফলাইন সিঙ্ক মোড', included: true },
    { title: 'ক্যামেরা ও বারকোড কিউআর স্ক্যানার', included: true },
    { title: 'কাস্টমার বাকি খাতা ও কালেকশন', included: true },
    { title: 'হোয়াটসঅ্যাপে সরাসরি ডিজিটাল মেমো ও রসিদ', included: true },
    { title: 'মেয়াদোত্তীর্ণ (Expiry) ও স্টক অ্যালার্ট', included: true },
    { title: 'দিনশেষে ক্যাশ ড্রয়ার ও নিট লাভ খতিয়ান', included: true },
    { title: 'বকেয়া তাগাদায় সরাসরি বিকাশ/নগদ পেমেন্ট লিংক', included: true },
    { title: 'কুরিয়ার ইন্টিগ্রেশন (Steadfast, Pathao, RedX)', included: false },
    { title: 'মাল্টি-ব্রাঞ্চ সেন্ট্রাল স্টক ট্রান্সফার', included: false },
    { title: '২৪/৭ ডেডিকেটেড রিমোট সাপোর্ট (AnyDesk)', included: false },
  ]);

  const [newFeatureText, setNewFeatureText] = useState('');

  useEffect(() => {
    if (packageToEdit) {
      setName(packageToEdit.name);
      setEnglishName(packageToEdit.englishName || '');
      setKey(packageToEdit.key);
      setMonthlyPrice(packageToEdit.monthlyPrice || 0);
      setYearlyPrice(packageToEdit.yearlyPrice || 0);
      setIsLifetime(!!packageToEdit.isLifetime);
      setLifetimePrice(packageToEdit.lifetimePrice || 14999);
      setBadge(packageToEdit.badge || '');
      setDescription(packageToEdit.description || '');
      setIsPopular(!!packageToEdit.isPopular);
      setMaxProducts(packageToEdit.maxProducts.toString());
      setMaxSalesMonthly(packageToEdit.maxSalesMonthly.toString());
      setMaxStaff(packageToEdit.maxStaff.toString());
      setMaxBranches(packageToEdit.maxBranches.toString());
      setFeatures(packageToEdit.features || []);
    } else {
      // Default reset
      setName('');
      setEnglishName('');
      setKey('');
      setMonthlyPrice(699);
      setYearlyPrice(6999);
      setIsLifetime(false);
      setLifetimePrice(12999);
      setBadge('');
      setDescription('');
      setIsPopular(false);
      setMaxProducts('2000');
      setMaxSalesMonthly('unlimited');
      setMaxStaff('2');
      setMaxBranches('1');
      setFeatures([
        { title: 'POS বিক্রয় ও অফলাইন সিঙ্ক মোড', included: true },
        { title: 'ক্যামেরা ও বারকোড কিউআর স্ক্যানার', included: true },
        { title: 'কাস্টমার বাকি খাতা ও কালেকশন', included: true },
        { title: 'হোয়াটসঅ্যাপে সরাসরি ডিজিটাল মেমো ও রসিদ', included: true },
        { title: 'মেয়াদোত্তীর্ণ (Expiry) ও স্টক অ্যালার্ট', included: true },
        { title: 'দিনশেষে ক্যাশ ড্রয়ার ও নিট লাভ খতিয়ান', included: true },
        { title: 'বকেয়া তাগাদায় সরাসরি বিকাশ/নগদ পেমেন্ট লিংক', included: true },
        { title: 'কুরিয়ার ইন্টিগ্রেশন (Steadfast, Pathao, RedX)', included: false },
        { title: 'মাল্টি-ব্রাঞ্চ সেন্ট্রাল স্টক ট্রান্সফার', included: false },
      ]);
    }
  }, [packageToEdit, isOpen]);

  const handleToggleFeature = (index: number) => {
    setFeatures((prev) =>
      (prev || []).map((f, i) => (i === index ? { ...f, included: !f.included } : f))
    );
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, { title: newFeatureText.trim(), included: true }]);
    setNewFeatureText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('অনুগ্রহ করে প্যাকেজের নাম লিখুন', 'warning');
      return;
    }

    const planKey = key.trim() || name.trim().replace(/\s+/g, '-');
    const finalPkg: SubscriptionPackage = {
      id: packageToEdit?.id || `pkg-${Date.now()}`,
      key: planKey,
      name: name.trim(),
      englishName: englishName.trim() || name.trim(),
      monthlyPrice: isLifetime ? 0 : Number(monthlyPrice) || 0,
      yearlyPrice: isLifetime ? Number(lifetimePrice) : Number(yearlyPrice) || 0,
      isLifetime,
      lifetimePrice: isLifetime ? Number(lifetimePrice) : undefined,
      badge: badge.trim() || (isPopular ? 'সবচেয়ে জনপ্রিয় ⭐' : undefined),
      description: description.trim(),
      isPopular,
      maxProducts: maxProducts === 'unlimited' ? 'unlimited' : Number(maxProducts) || 1000,
      maxSalesMonthly: maxSalesMonthly === 'unlimited' ? 'unlimited' : Number(maxSalesMonthly) || 2000,
      maxStaff: maxStaff === 'unlimited' ? 'unlimited' : Number(maxStaff) || 1,
      maxBranches: maxBranches === 'unlimited' ? 'unlimited' : Number(maxBranches) || 1,
      features,
      isCustom: true,
    };

    onSave(finalPkg);
    showToast(
      packageToEdit ? 'প্যাকেজ সফলভাবে আপডেট করা হয়েছে!' : 'নতুন প্যাকেজ সফলভাবে তৈরি হয়েছে!',
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={packageToEdit ? 'প্যাকেজ এডিট করুন (Edit Package)' : 'নতুন সাবস্ক্রিপশন প্যাকেজ তৈরি করুন (Custom Package Builder)'}
      subtitle="অ্যাডমিন হিসেবে ব্যবসার ধরন অনুযায়ী মূল্য, সীমা ও ফিচার কাস্টমাইজ করুন"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              প্যাকেজের নাম (বাংলায়) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: ফার্মেসি স্পেশাল প্যাক"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              English Name & Key
            </label>
            <input
              type="text"
              value={englishName}
              onChange={(e) => {
                setEnglishName(e.target.value);
                if (!packageToEdit && !key) {
                  setKey(e.target.value.replace(/\s+/g, '-'));
                }
              }}
              placeholder="e.g. Pharmacy Special Pack"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Pricing & Lifetime Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>মূল্য ও বিলিং নির্ধারণ (Pricing & Billing)</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLifetime}
                onChange={(e) => setIsLifetime(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                এককালীন লাইফটাইম লাইসেন্স
              </span>
            </label>
          </div>

          {isLifetime ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                এককালীন লাইফটাইম মূল্য (টাকা ৳) *
              </label>
              <input
                type="number"
                value={lifetimePrice}
                onChange={(e) => setLifetimePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মাসিক মূল্য (টাকা / মাস ৳) *
                </label>
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setMonthlyPrice(m);
                    // auto calculate ~10 months for yearly
                    if (!packageToEdit) setYearlyPrice(m * 10);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  বাৎসরিক মূল্য (টাকা / বছর ৳) *
                </label>
                <input
                  type="number"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ব্যাজ / লেবেল (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="যেমন: স্পেশাল ঈদ অফার 🔥"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">
                  "সবচেয়ে জনপ্রিয় (Most Popular)" হিসেবে হাইলাইট করুন
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Quotas */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>ধারণক্ষমতা ও কোটা লিমিট (Limits & Quotas)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ইনভেন্টরি পণ্য সীমা
              </label>
              <select
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="300">৩০০ টি</option>
                <option value="500">৫০০ টি</option>
                <option value="1000">১,০০০ টি</option>
                <option value="2000">২,০০০ টি</option>
                <option value="5000">৫,০০০ টি</option>
                <option value="10000">১০,০০০ টি</option>
                <option value="unlimited">আনলিমিটেড</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                মাসিক বিক্রয় লেনদেন
              </label>
              <select
                value={maxSalesMonthly}
                onChange={(e) => setMaxSalesMonthly(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1000">১,০০০ মেমো</option>
                <option value="2000">২,০০০ মেমো</option>
                <option value="5000">৫,০০০ মেমো</option>
                <option value="unlimited">আনলিমিটেড</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                স্টাফ/ক্যাশিয়ার সংখ্যা
              </label>
              <select
                value={maxStaff}
                onChange={(e) => setMaxStaff(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1">১ জন</option>
                <option value="2">২ জন</option>
                <option value="3">৩ জন</option>
                <option value="5">৫ জন</option>
                <option value="10">১০ জন</option>
                <option value="unlimited">আনলিমিটেড</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                শপ/ব্রাঞ্চ সংখ্যা
              </label>
              <select
                value={maxBranches}
                onChange={(e) => setMaxBranches(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1">১ টি ব্রাঞ্চ</option>
                <option value="2">২ টি ব্রাঞ্চ</option>
                <option value="5">৫ টি ব্রাঞ্চ</option>
                <option value="unlimited">আনলিমিটেড</option>
              </select>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            সংক্ষিপ্ত বিবরণ ও টার্গেট শপ
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="যেমন: মাঝারি ফার্মেসি, ডিপার্টমেন্টাল স্টোর ও ইলেকট্রনিক্স শোরুম"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Included Features Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">
              প্যাকেজের ফিচার তালিকা (Features Check & Customization)
            </span>
            <span className="text-[11px] text-slate-400">
              টিক দিয়ে অন/অফ করুন
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {(features || []).map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs"
              >
                <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={feat.included}
                    onChange={() => handleToggleFeature(idx)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={feat.included ? 'text-slate-800 font-medium' : 'text-slate-400 line-through'}>
                    {feat.title}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom feature line */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              placeholder="নতুন কোনো কাস্টম ফিচার লিখুন..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFeature}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              যোগ করুন
            </Button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            অ্যাডমিন যেকোনো সময় প্যাকেজ পরিবর্তন করতে পারবেন
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {packageToEdit ? 'আপডেট করুন' : 'প্যাকেজ সংরক্ষণ করুন'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
