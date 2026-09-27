import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { facebookPixelService } from '../../services/facebookPixelService';
import { smsService } from '../../services/smsService';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Store,
  Package,
  Truck,
  MessageSquare,
  Activity,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PartyPopper,
} from 'lucide-react';

export const BusinessReadinessChecklist: React.FC = () => {
  const { shop } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic status evaluations
  const products = Array.isArray(DataStore.getProducts()) ? DataStore.getProducts() : [];
  const courierCreds = Array.isArray(DataStore.getCourierCredentials()) ? DataStore.getCourierCredentials() : [];
  const paymentGateways = Array.isArray(DataStore.getPaymentGateways()) ? DataStore.getPaymentGateways() : [];
  const mfsAccounts = Array.isArray(DataStore.getMfsAccounts()) ? DataStore.getMfsAccounts() : [];
  const pixelSettings = facebookPixelService?.getSettings() || { trackingActive: false, pixelId: '' };
  const smsGateway = smsService?.getGatewayConfig() || { isConnected: false, apiKey: '' };

  const isProfileReady = !!(shop?.name && shop?.mobile && shop?.address);
  const isProductsReady = products.length > 0;
  const isCourierReady = courierCreds.some((c) => c.isConnected);
  const isSmsReady = !!(smsGateway.isConnected || smsGateway.apiKey);
  const isPixelReady = !!(pixelSettings.trackingActive && pixelSettings.pixelId);
  const isPaymentReady =
    mfsAccounts.length > 0 || paymentGateways.some((g) => g.isEnabled);

  const steps = [
    {
      id: 'profile',
      title: 'দোকান প্রোফাইল ও লোগো সেটআপ',
      description: 'দোকানের নাম, ঠিকানা, লোগো ও মোবাইল নম্বর',
      isCompleted: isProfileReady,
      actionText: 'সেটিংস এ যান',
      actionPath: '/settings',
      icon: Store,
    },
    {
      id: 'products',
      title: 'পণ্য এন্ট্রি ও স্টক ক্যাটালগ',
      description: `${products.length} টি পণ্য সংরক্ষিত আছে`,
      isCompleted: isProductsReady,
      actionText: isProductsReady ? 'পণ্য তালিকায় যান' : 'নতুন পণ্য যোগ করুন',
      actionPath: isProductsReady ? '/products' : '/products?action=add',
      icon: Package,
    },
    {
      id: 'courier',
      title: 'কুরিয়ার সার্ভিস এপিআই ইন্টিগ্রেশন',
      description: isCourierReady
        ? 'Steadfast/Pathao কুরিয়ার সংযুক্ত রয়েছে'
        : 'অর্ডার এক ক্লিকে বুকিং করতে API Key যুক্ত করুন',
      isCompleted: isCourierReady,
      actionText: 'কুরিয়ার সেটিংসে যান',
      actionPath: '/courier',
      icon: Truck,
    },
    {
      id: 'sms',
      title: 'এসএমএস গেটওয়ে ও নোটিফিকেশন',
      description: isSmsReady
        ? 'গ্রাহক এসএমএস নোটিফিকেশন সচল রয়েছে'
        : 'অর্ডার ও ডেলিভারি কনফার্মেশন এসএমএস গেটওয়ে কনফিগার করুন',
      isCompleted: isSmsReady,
      actionText: 'এসএমএস সেন্টারে যান',
      actionPath: '/sms',
      icon: MessageSquare,
    },
    {
      id: 'pixel',
      title: 'মেটা পিক্সেল ও CAPI সেলস ট্র্যাকিং',
      description: isPixelReady
        ? `পিক্সেল (${pixelSettings.pixelId}) সক্রিয় রয়েছে`
        : 'বিজ্ঞাপনের রিটার্গেটিং ও সেলস ট্র্যাকিং অন করুন',
      isCompleted: isPixelReady,
      actionText: 'পিক্সেল কনফিগার করুন',
      actionPath: '/settings',
      icon: Activity,
    },
    {
      id: 'payment',
      title: 'বিকাশ / নগদ পেমেন্ট অ্যাকাউন্ট ও গেটওয়ে',
      description: isPaymentReady
        ? 'বিকাশ মার্চেন্ট ও পেমেন্ট গেটওয়ে প্রস্তুত'
        : 'গ্রাহকের কাছ থেকে পেমেন্ট গ্রহণের অ্যাকাউন্ট যুক্ত করুন',
      isCompleted: isPaymentReady,
      actionText: 'পেমেন্ট সেটিংসে যান',
      actionPath: '/settings',
      icon: CreditCard,
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isAllCompleted = completedCount === steps.length;

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/60 overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            {isAllCompleted ? (
              <PartyPopper className="w-5 h-5 text-emerald-300 animate-bounce" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {isAllCompleted
                  ? 'অভিনন্দন! আপনার স্মার্টশপ সম্পূর্ণ লাইভ ও প্রস্তুত'
                  : 'ব্যবসা চালুর প্রস্তুতি চেকলিস্ট (Business Setup Guide)'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                {completedCount}/{steps.length} সম্পন্ন ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              অনলাইন ও অফলাইনে সম্পূর্ণ নির্ভুল বিক্রয় ও ডেলিভারি নিশ্চিত করতে প্রয়োজনীয় ধাপগুলো
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="self-end sm:self-auto text-xs text-emerald-200 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer"
        >
          <span>{isCollapsed ? 'চেকলিস্ট খুলুন' : 'সংকুচিত করুন'}</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 relative z-10">
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      {!isCollapsed && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10 animate-in fade-in duration-200">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step.isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/30'
                    : 'bg-white/5 border-white/10 hover:border-emerald-400/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                          step.isCompleted
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">{step.title}</span>
                    </div>

                    {step.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-emerald-100/70 line-clamp-2 leading-relaxed pl-9">
                    {step.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => navigate(step.actionPath)}
                    className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      step.isCompleted
                        ? 'text-emerald-300 hover:text-white'
                        : 'text-amber-300 hover:text-amber-200'
                    }`}
                  >
                    <span>{step.isCompleted ? 'পরিবর্তন করুন' : step.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
