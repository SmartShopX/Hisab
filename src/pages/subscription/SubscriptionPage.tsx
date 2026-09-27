import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionPackage, SubscriptionPlan, SubscriptionStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AdminPackageModal } from '../../components/subscription/AdminPackageModal';
import { subscriptionService, PaymentRecord } from '../../services/subscriptionService';
import {
  CreditCard,
  CheckCircle2,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sliders,
  Check,
  Smartphone,
  Building2,
  Clock,
  History,
  Info,
} from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  const { shop, updateShop, role } = useAuth();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<SubscriptionPackage[]>(() =>
    subscriptionService.getPackages()
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Package builder state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<SubscriptionPackage | null>(null);

  // Upgrade & payment modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPackageForUpgrade, setSelectedPackageForUpgrade] = useState<SubscriptionPackage | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Card'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(() =>
    subscriptionService.getPaymentHistory()
  );

  const currentPlan = shop.subscriptionPlan || (shop.plan as any) || 'Professional';
  const currentStatus: SubscriptionStatus = shop.subscriptionStatus || 'Active';
  const startDate = shop.subscriptionStart || '2026-01-01';
  const expiryDate = shop.subscriptionExpiry || shop.planExpiry || '2026-12-31';

  // Calculate days remaining
  const now = new Date().getTime();
  const exp = new Date(expiryDate).getTime();
  const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));

  const isAdmin = role === 'owner' || role === 'manager' || (role as string) === 'Admin';

  // Reload packages on event
  useEffect(() => {
    const handleUpdated = () => {
      setPackages(subscriptionService.getPackages());
    };
    window.addEventListener('smartshopx_packages_updated', handleUpdated);
    return () => {
      window.removeEventListener('smartshopx_packages_updated', handleUpdated);
    };
  }, []);

  const handleSavePackage = (pkg: SubscriptionPackage) => {
    const updated = subscriptionService.savePackage(pkg);
    setPackages(updated);
  };

  const handleDeletePackage = (pkgId: string, pkgName: string) => {
    if (packages.length <= 1) {
      showToast('কমপক্ষে একটি প্যাকেজ থাকা বাধ্যতামূলক!', 'warning');
      return;
    }
    if (confirm(`আপনি কি নিশ্চিত যে "${pkgName}" প্যাকেজটি মুছে ফেলতে চান?`)) {
      const updated = subscriptionService.deletePackage(pkgId);
      setPackages(updated);
      showToast(`"${pkgName}" প্যাকেজটি মুছে ফেলা হয়েছে`, 'info');
    }
  };

  const handleResetPackages = () => {
    if (confirm('আপনি কি ডিফল্ট প্যাকেজ তালিকায় ফিরে যেতে চান? আপনার কাস্টম প্যাকেজগুলো রিসেট হয়ে যাবে।')) {
      const reset = subscriptionService.resetToDefault();
      setPackages(reset);
      showToast('ডিফল্ট প্যাকেজসমূহ পুনরায় লোড করা হয়েছে!', 'success');
    }
  };

  const handleOpenUpgrade = (pkg: SubscriptionPackage) => {
    setSelectedPackageForUpgrade(pkg);
    setTrxId('');
    setSenderPhone(shop.mobile || '');
    setIsUpgradeModalOpen(true);
  };

  const calculatePayableAmount = (pkg: SubscriptionPackage | null) => {
    if (!pkg) return 0;
    if (pkg.isLifetime) return pkg.lifetimePrice || 14999;
    if (billingCycle === 'yearly') return pkg.yearlyPrice;
    return pkg.monthlyPrice;
  };

  const handleConfirmUpgrade = (isInstantDemo: boolean = false) => {
    if (!selectedPackageForUpgrade) return;

    if (!isInstantDemo && !trxId.trim()) {
      showToast('অনুগ্রহ করে পেমেন্ট ট্রানজেকশন আইডি (TrxID) দিন অথবা ডেমো অ্যাক্টিভেশন ব্যবহার করুন', 'warning');
      return;
    }

    const durationDays = selectedPackageForUpgrade.isLifetime
      ? 3650 // 10 years / lifetime
      : billingCycle === 'yearly'
      ? 365
      : 30;

    const newExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const updatedShop = {
      ...shop,
      subscriptionPlan: selectedPackageForUpgrade.key as SubscriptionPlan,
      subscriptionStatus: 'Active' as SubscriptionStatus,
      plan: selectedPackageForUpgrade.key as SubscriptionPlan,
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionExpiry: newExpiry,
    };

    updateShop(updatedShop);

    // Record payment
    const finalAmount = calculatePayableAmount(selectedPackageForUpgrade);
    const newRecord = subscriptionService.recordPayment({
      planKey: selectedPackageForUpgrade.key,
      planName: selectedPackageForUpgrade.name,
      amount: finalAmount,
      billingCycle: selectedPackageForUpgrade.isLifetime ? 'lifetime' : billingCycle,
      paymentMethod: isInstantDemo ? 'Instant Demo Activation' : paymentMethod,
      trxId: isInstantDemo ? `DEMO-${Math.floor(100000 + Math.random() * 900000)}` : trxId.trim(),
      status: 'Completed',
      expiryDate: newExpiry,
    });

    setPaymentHistory([newRecord, ...paymentHistory]);
    setIsUpgradeModalOpen(false);

    showToast(
      `অভিনন্দন! আপনার সাবস্ক্রিপশন সফলভাবে "${selectedPackageForUpgrade.name}"-এ সক্রিয় করা হয়েছে। মেয়াদ: ${formatDate(newExpiry)}`,
      'success'
    );
  };

  const getStatusBadge = (st: SubscriptionStatus) => {
    switch (st) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Trial':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Expired':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Suspended':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  // Find current plan details from package list
  const currentPkgDetails = packages.find((p) => p.key === currentPlan) || packages[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            সাবস্ক্রিপশন ও লাইসেন্স প্যাকেজ (Subscription & Licensing)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের সাবস্ক্রিপশন স্ট্যাটাস, লাইসেন্স নবায়ন এবং অ্যাডমিন প্যাকেজ কাস্টমাইজেশন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadge(
              currentStatus
            )}`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            লাইসেন্স স্ট্যাটাস: {currentStatus}
          </span>
        </div>
      </div>

      {/* Current Active Plan Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                বর্তমান সক্রিয় সাবস্ক্রিপশন
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              SmartShopX {currentPlan} প্ল্যান
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                শুরু: <strong className="text-white font-mono">{formatDate(startDate)}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                মেয়াদ শেষ: <strong className="text-white font-mono">{formatDate(expiryDate)}</strong>
              </span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-semibold font-mono">
                {daysRemaining} দিন অবশিষ্ট
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                if (currentPkgDetails) handleOpenUpgrade(currentPkgDetails);
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              লাইসেন্স নবায়ন করুন
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const pro = packages.find((p) => p.key === 'Business Pro' || p.key === 'Professional') || packages[1];
                if (pro) handleOpenUpgrade(pro);
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none"
            >
              প্যাকেজ আপগ্রেড
            </Button>
          </div>
        </div>

        {/* Quota gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] block">ইনভেন্টরি পণ্য ধারণক্ষমতা</span>
            <span className="font-mono font-bold text-base text-white">
              {currentPkgDetails?.maxProducts === 'unlimited' ? 'আনলিমিটেড' : `${currentPkgDetails?.maxProducts || 2000} টি`}
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] block">মাসিক বিক্রয় লেনদেন</span>
            <span className="font-mono font-bold text-base text-white">
              {currentPkgDetails?.maxSalesMonthly === 'unlimited' ? 'আনলিমিটেড' : `${currentPkgDetails?.maxSalesMonthly || 2000} মেমো`}
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] block">স্টাফ/ক্যাশিয়ার সংখ্যা</span>
            <span className="font-mono font-bold text-base text-white">
              {currentPkgDetails?.maxStaff === 'unlimited' ? 'আনলিমিটেড' : `${currentPkgDetails?.maxStaff || 1} জন`}
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] block">শপ/ব্রাঞ্চ সংযোগ</span>
            <span className="font-mono font-bold text-base text-white">
              {currentPkgDetails?.maxBranches === 'unlimited' ? 'আনলিমিটেড' : `${currentPkgDetails?.maxBranches || 1} টি`}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Action Bar & Billing Cycle Selector */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Billing Cycle Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">বিলিং সাইকেল:</span>
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              মাসিক বিলিং
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>বাৎসরিক বিলিং</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                ২ মাস ফ্রি!
              </span>
            </button>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setPackageToEdit(null);
                  setIsPackageModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                নতুন প্যাকেজ তৈরি করুন
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetPackages}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                title="ডিফল্ট ৪টি প্যাকেজ ফিরিয়ে আনুন"
              >
                ডিফল্ট রিসেট
              </Button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>অ্যাডমিন মোড সক্রিয়:</strong> আপনি নিজের ইচ্ছেমতো যেকোনো প্যাকেজের মূল্য, লিমিট ও ফিচার পরিবর্তন করতে বা নতুন প্যাকেজ যোগ করতে পারবেন।
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold shrink-0">
            মোট {packages.length} টি প্যাকেজ
          </span>
        </div>
      )}

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {(packages || []).map((p) => {
          const isCurrent = currentPlan === p.key;
          const displayPrice = p.isLifetime
            ? p.lifetimePrice || 14999
            : billingCycle === 'yearly'
            ? p.yearlyPrice
            : p.monthlyPrice;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-5 flex flex-col justify-between border transition-all relative ${
                isCurrent
                  ? 'bg-white border-2 border-emerald-500 shadow-lg ring-4 ring-emerald-50'
                  : p.isPopular
                  ? 'bg-white border-2 border-slate-900 shadow-md'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Badge */}
              {p.badge && (
                <span
                  className={`absolute -top-3 right-4 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${
                    p.isLifetime
                      ? 'bg-amber-500'
                      : p.isPopular
                      ? 'bg-slate-900'
                      : 'bg-emerald-600'
                  }`}
                >
                  {p.badge}
                </span>
              )}

              <div>
                {/* Header & Admin controls */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">{p.name}</h4>
                    {p.englishName && (
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {p.englishName}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPackageToEdit(p);
                          setIsPackageModalOpen(true);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="প্যাকেজ এডিট করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(p.id, p.name)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="প্যাকেজ ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 min-h-[36px] leading-relaxed">
                  {p.description}
                </p>

                {/* Price Display */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {p.isLifetime ? '/ এককালীন আজীবন' : billingCycle === 'yearly' ? '/ বাৎসরিক' : '/ মাসিক'}
                    </span>
                  </div>

                  {!p.isLifetime && billingCycle === 'yearly' && (
                    <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                      (প্রতি মাসে মাত্র {formatCurrency(Math.round(p.yearlyPrice / 12))})
                    </span>
                  )}
                </div>

                {/* Quick Quota Pills */}
                <div className="grid grid-cols-2 gap-1.5 my-3.5 text-[11px]">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">পণ্য ধারণক্ষমতা</span>
                    <strong className="text-slate-800 font-mono">
                      {p.maxProducts === 'unlimited' ? 'আনলিমিটেড' : `${p.maxProducts} টি`}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">ক্যাশিয়ার/স্টাফ</span>
                    <strong className="text-slate-800 font-mono">
                      {p.maxStaff === 'unlimited' ? 'আনলিমিটেড' : `${p.maxStaff} জন`}
                    </strong>
                  </div>
                </div>

                {/* Features list */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {(p.features || []).map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className={`flex items-start gap-2 text-xs leading-snug ${
                        feat.included ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={feat.included ? '' : 'line-through opacity-75'}>
                        {feat.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-5 border-t border-slate-100">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-emerald-700 bg-emerald-50 border-emerald-200 cursor-default font-bold"
                  >
                    বর্তমান সক্রিয় প্যাকেজ
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenUpgrade(p)}
                    variant={p.isPopular ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                  >
                    {p.isLifetime ? 'লাইফটাইম কিনুন' : 'প্ল্যানে আপগ্রেড করুন'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment History & Licensing Records */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              লাইসেন্স পেমেন্ট ও ইনভয়েস হিস্ট্রি (Payment History)
            </h3>
          </div>
          <span className="text-xs text-slate-400">সর্বশেষ লাইসেন্স রসিদসমূহ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">ইনভয়েস নং</th>
                <th className="py-2.5 px-3">প্যাকেজের নাম</th>
                <th className="py-2.5 px-3">বিলিং সাইকেল</th>
                <th className="py-2.5 px-3">পেমেন্ট মেথড</th>
                <th className="py-2.5 px-3">ট্রানজেকশন ID</th>
                <th className="py-2.5 px-3">পরিশোধিত টাকা</th>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">মেয়াদ শেষ</th>
                <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(paymentHistory || []).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.planName}</td>
                  <td className="py-2.5 px-3 capitalize">
                    {item.billingCycle === 'lifetime'
                      ? 'লাইফটাইম'
                      : item.billingCycle === 'yearly'
                      ? 'বাৎসরিক'
                      : 'মাসিক'}
                  </td>
                  <td className="py-2.5 px-3 font-medium">{item.paymentMethod}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{item.trxId}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(item.date)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(item.expiryDate)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      পরিশোধিত ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Package Builder Modal */}
      <AdminPackageModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setPackageToEdit(null);
        }}
        packageToEdit={packageToEdit}
        onSave={handleSavePackage}
      />

      {/* Upgrade & Payment Gateway Verification Modal */}
      {selectedPackageForUpgrade && (
        <Modal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          title={`SmartShopX ${selectedPackageForUpgrade.name} সক্রিয়করণ`}
          subtitle="বিকাশ, নগদ বা তাৎক্ষণিক ডেমো দিয়ে আপনার লাইসেন্স সক্রিয় করুন"
          maxWidth="md"
        >
          <div className="space-y-4 py-2 text-xs">
            {/* Package Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">নির্বাচিত প্যাকেজ:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {selectedPackageForUpgrade.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">বিলিং মেয়াদ:</span>
                <span className="font-medium text-slate-200">
                  {selectedPackageForUpgrade.isLifetime
                    ? 'আজীবন লাইসেন্স'
                    : billingCycle === 'yearly'
                    ? '১২ মাস (বাৎসরিক)'
                    : '১ মাস (মাসিক)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10 font-mono font-bold text-base text-white">
                <span>মোট প্রদেয় ফি:</span>
                <span className="text-emerald-400">
                  {formatCurrency(calculatePayableAmount(selectedPackageForUpgrade))}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">পেমেন্ট মেথড নির্বাচন করুন:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bKash')}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'bKash'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-pink-600" />
                  <span>bKash (বিকাশ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'Nagad'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  <span>Nagad (নগদ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'Card'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Card / Bank</span>
                </button>
              </div>
            </div>

            {/* Instruction box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
              <p className="font-bold text-slate-800 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>পেমেন্ট নির্দেশিকা:</span>
              </p>
              <p>
                আপনার {paymentMethod} অ্যাপ থেকে <strong>"Send Money"</strong> অথবা{' '}
                <strong>"Payment"</strong> অপশন ব্যবহার করে নিচের মার্চেন্ট নম্বরে{' '}
                <strong>{formatCurrency(calculatePayableAmount(selectedPackageForUpgrade))}</strong> টাকা পাঠান:
              </p>
              <p className="font-mono font-bold text-xs text-slate-900 bg-white p-1.5 rounded border border-slate-200 text-center">
                অফিসিয়াল পেমেন্ট নম্বর: 01836-686869 (মার্চেন্ট)
              </p>
            </div>

            {/* TrxID input */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  আপনার প্রেরক মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পেমেন্ট ট্রানজেকশন আইডি (TrxID) *
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="যেমন: 9K87TR9102"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleConfirmUpgrade(true)}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                title="কোনো টাকা ছাড়া ১ ক্লিকে সাথে সাথে ডেমো সক্রিয় করুন"
              >
                ⚡ তাৎক্ষণিক টেস্ট অ্যাক্টিভেশন
              </Button>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsUpgradeModalOpen(false)}
                >
                  বাতিল
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmUpgrade(false)}
                >
                  লাইসেন্স সক্রিয় করুন
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
