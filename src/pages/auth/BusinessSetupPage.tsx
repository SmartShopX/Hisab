import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessCategory } from '../../types';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  ShoppingBag,
  Shirt,
  Smartphone,
  Tv,
  Pill,
  Utensils,
  Sparkles,
  BookOpen,
  Wrench,
  Armchair,
  Cookie,
  Fish,
  Scissors,
  Printer,
  Store,
  HelpCircle,
  PlusCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const BusinessSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateShop } = useAuth();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('Mobile & Telecom');
  const [customCategory, setCustomCategory] = useState('');
  const [shopName, setShopName] = useState('আমার স্মার্ট শপ');
  const [isLoading, setIsLoading] = useState(false);

  const categories: {
    id: BusinessCategory;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'Mobile & Telecom',
      title: 'Mobile & Telecom + Accessories',
      subtitle: 'মোবাইল, গ্যাজেট ও অ্যাক্সেসরিজ শপ',
      icon: Smartphone,
    },
    {
      id: 'Grocery',
      title: 'Grocery (মুদি ও নিত্যপ্রয়োজনীয়)',
      subtitle: 'মুদি দোকান, চাল-ডাল ও কনফেকশনারি',
      icon: ShoppingBag,
    },
    {
      id: 'Clothing',
      title: 'Clothing (পোশাক ও ফ্যাশন)',
      subtitle: 'রেডিমেড গার্মেন্টস, শাড়ি, পাঞ্জাবি',
      icon: Shirt,
    },
    {
      id: 'Electronics',
      title: 'Electronics (ইলেকট্রনিক্স)',
      subtitle: 'হোম অ্যাপ্লায়েন্স, ফ্যান, টিভি, পার্টস',
      icon: Tv,
    },
    {
      id: 'Pharmacy',
      title: 'Pharmacy (ফার্মেসি ও ড্রাগস)',
      subtitle: 'ঔষধালয়, সার্জিক্যাল আইটেম',
      icon: Pill,
    },
    {
      id: 'Restaurant',
      title: 'Restaurant & Cafe (রেস্তোরাঁ)',
      subtitle: 'হোটেল, ক্যাফে, ফাস্ট ফুড ও জুস বার',
      icon: Utensils,
    },
    {
      id: 'Cosmetics',
      title: 'Cosmetics (প্রসাধন ও স্কিনকেয়ার)',
      subtitle: 'কসমেটিকস, পারফিউম, মেকআপ',
      icon: Sparkles,
    },
    {
      id: 'Book & Stationery',
      title: 'Book & Stationery (বই ও স্টেশনারি)',
      subtitle: 'বইয়ের দোকান, খাতা-কলম, অফিস সাপ্লাই',
      icon: BookOpen,
    },
    {
      id: 'Hardware',
      title: 'Hardware & Sanitary (হার্ডওয়্যার)',
      subtitle: 'রং, পাইপ, ফিটিংস, টাইলস ও টুলস',
      icon: Wrench,
    },
    {
      id: 'Furniture',
      title: 'Furniture (আসবাবপত্র)',
      subtitle: 'কাঠ, স্টিল ও বোর্ড ফার্নিচার শপ',
      icon: Armchair,
    },
    {
      id: 'Bakery & Sweets',
      title: 'Bakery & Sweets (মিষ্টি ও বেকারি)',
      subtitle: 'মিষ্টি, কেক, পেস্ট্রি, স্ন্যাকস',
      icon: Cookie,
    },
    {
      id: 'Fish & Meat',
      title: 'Fish & Meat (মাছ ও মাংস)',
      subtitle: 'কাঁচাবাজার, ফ্রেশ মিট ও পোলট্রি',
      icon: Fish,
    },
    {
      id: 'Salon & Beauty',
      title: 'Salon & Beauty Parlor',
      subtitle: 'সেলুন, স্পা ও বিউটি পার্লার',
      icon: Scissors,
    },
    {
      id: 'Tailoring & Boutique',
      title: 'Tailoring & Boutique (দর্জি ও বুটিক)',
      subtitle: 'লেডিস বুটিক, টেইলারিং ও থান কাপড়',
      icon: Scissors,
    },
    {
      id: 'Printing & Photocopy',
      title: 'Printing & Photocopy',
      subtitle: 'ডিজিটাল প্রেস, সাইনবোর্ড, প্রিন্টিং',
      icon: Printer,
    },
    {
      id: 'Super Shop',
      title: 'Super Shop (সুপার শপ / মার্কেট)',
      subtitle: 'মাল্টি-ক্যাটাগরি রিটেইল চেইন',
      icon: Store,
    },
    {
      id: 'Custom Category',
      title: 'Custom Category (কাস্টম ক্যাটাগরি)',
      subtitle: 'আপনার পছন্দমতো ক্যাটাগরি টাইপ করুন',
      icon: PlusCircle,
    },
    {
      id: 'Other',
      title: 'Other (অন্যান্য ব্যবসা)',
      subtitle: 'সাধারণ বাণিজ্য ও সেবা',
      icon: HelpCircle,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showToast('দোকানের নাম লিখুন', 'warning');
      return;
    }
    if (selectedCategory === 'Custom Category' && !customCategory.trim()) {
      showToast('কাস্টম ক্যাটাগরির নাম লিখুন', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await authService.completeBusinessSetup(
        selectedCategory,
        selectedCategory === 'Custom Category' ? customCategory : undefined,
        shopName.trim()
      );
      updateShop(updated);
      showToast('আপনার ব্যবসার সেটআপ সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করছেন...', 'success');
      navigate('/');
    } catch {
      showToast('সেটআপ সম্পন্ন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl mb-3">
            SX
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            আপনার ব্যবসার ধরন নির্বাচন করুন
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            আপনার ক্যাটাগরি অনুযায়ী পিওএস, ইনভেন্টরি ও অনলাইন স্টোর স্বয়ংক্রিয়ভাবে অপ্টিমাইজড হবে
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name Input */}
          <div className="max-w-md mx-auto">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              দোকান বা ব্যবসা প্রতিষ্ঠানের নাম (Shop Name) *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="যেমন: স্মার্ট ফ্যাশন অ্যান্ড গ্যাজেট"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 text-left ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pr-5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{cat.subtitle}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Category Input if selected */}
          {selectedCategory === 'Custom Category' && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার কাস্টম ক্যাটাগরি নাম লিখুন *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="যেমন: লেদার গুডস ও ফুটওয়্যার"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="px-8 shadow-md"
            >
              ব্যবসা সেটআপ সম্পন্ন করুন ও ড্যাশবোর্ডে প্রবেশ করুন
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
