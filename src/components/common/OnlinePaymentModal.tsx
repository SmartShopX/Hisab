import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';

export type PaymentGatewayType = 'bKash' | 'Nagad' | 'SSLCommerz';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateway: PaymentGatewayType;
  amount: number;
  orderNumber: string;
  customerMobile?: string;
  customerName?: string;
  onPaymentSuccess: (trxId: string, gateway: PaymentGatewayType) => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  gateway,
  amount,
  orderNumber,
  customerMobile = '',
  customerName = '',
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin' | 'processing' | 'success'>('mobile');
  const [mobileNumber, setMobileNumber] = useState(customerMobile || '01712345678');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [trxId, setTrxId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('mobile');
      setMobileNumber(customerMobile || '01712345678');
      setOtp('');
      setPin('');
      setErrorMsg('');
      setTrxId('');
    }
  }, [isOpen, customerMobile]);

  if (!isOpen) return null;

  // Colors & Brand Configuration
  const brandConfig = {
    bKash: {
      name: 'bKash Payment Gateway',
      themeBg: 'bg-[#e2136e]',
      btnBg: 'bg-[#e2136e] hover:bg-[#c90f61]',
      borderActive: 'border-[#e2136e]',
      lightBg: 'bg-pink-50',
      textColor: 'text-[#e2136e]',
      badge: 'বিকাশ পেমেন্ট',
      prefix: 'BK',
    },
    Nagad: {
      name: 'Nagad Direct Gateway',
      themeBg: 'bg-[#f7941d]',
      btnBg: 'bg-[#f7941d] hover:bg-[#d97d10]',
      borderActive: 'border-[#f7941d]',
      lightBg: 'bg-amber-50',
      textColor: 'text-[#f7941d]',
      badge: 'নগদ পেমেন্ট',
      prefix: 'NG',
    },
    SSLCommerz: {
      name: 'SSLCommerz Secure Checkout',
      themeBg: 'bg-[#1b3a57]',
      btnBg: 'bg-[#1b3a57] hover:bg-[#13293d]',
      borderActive: 'border-[#1b3a57]',
      lightBg: 'bg-blue-50',
      textColor: 'text-[#1b3a57]',
      badge: 'কার্ড ও ইন্টারনেট ব্যাংকিং',
      prefix: 'SSL',
    },
  }[gateway];

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    setErrorMsg('');
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg('সঠিক ওটিপি কোড লিখুন (যেমন: 123456)');
      return;
    }
    setErrorMsg('');
    setStep('pin');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('৪ বা ৫ ডিজিটের গোপন পিন দিন (যেমন: 1234)');
      return;
    }
    setErrorMsg('');
    setStep('processing');

    // Simulate instant verification and processing
    setTimeout(() => {
      const generatedTrx = `TRX-${brandConfig.prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      setTrxId(generatedTrx);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess(generatedTrx, gateway);
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Brand Header */}
        <div className={`${brandConfig.themeBg} text-white p-5 relative text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1">
            <Lock className="w-3 h-3" />
            <span>{brandConfig.badge}</span>
          </div>

          <h3 className="text-base font-bold">{brandConfig.name}</h3>

          <div className="mt-3 bg-black/20 rounded-2xl p-2.5 backdrop-blur-xs">
            <div className="text-[11px] opacity-80">পরিশোধযোগ্য সর্বমোট বিল:</div>
            <div className="text-2xl font-black font-mono tracking-tight">
              {formatCurrency(amount)}
            </div>
            <div className="text-[10px] opacity-75 font-mono">ইনভয়েস/অর্ডার: {orderNumber}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Mobile Number */}
          {step === 'mobile' && (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  আপনার {gateway} অ্যাকাউন্ট নম্বর দিন
                </p>
                <p className="text-[11px] text-slate-500">
                  যেই অ্যাকাউন্ট থেকে টাকা কর্তন করা হবে
                </p>
              </div>

              <div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full text-center py-3 text-lg font-mono font-bold tracking-wider rounded-2xl border-2 border-slate-300 focus:border-pink-600 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>১২৮-বিট এসএসএল এন্ড-টু-এন্ড এনক্রিপ্টেড</span>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${brandConfig.btnBg}`}
              >
                <span>এগিয়ে যান (Next)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">ভেরিফিকেশন কোড (OTP) লিখুন</p>
                <p className="text-[11px] text-slate-500">
                  {mobileNumber} নম্বরে প্রেরিত ৬ ডিজিটের ওটিপি দিন
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center py-3 text-2xl font-mono font-black tracking-widest rounded-2xl border-2 border-slate-300 focus:border-pink-600 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {/* Demo Helper */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                >
                  💡 টেস্ট ওটিপি বসান: 123456
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className={`w-2/3 py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${brandConfig.btnBg}`}
                >
                  <span>যাচাই করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Secret PIN */}
          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">আপনার {gateway} পিন লিখুন</p>
                <p className="text-[11px] text-slate-500">পেমেন্ট নিশ্চিত করতে গোপন পিন কোডটি দিন</p>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center py-3 text-3xl tracking-widest rounded-2xl border-2 border-slate-300 focus:border-pink-600 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {/* Demo Helper */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setPin('1234')}
                  className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                >
                  💡 টেস্ট পিন বসান: 1234
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className={`w-2/3 py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${brandConfig.btnBg}`}
                >
                  <span>পেমেন্ট সম্পন্ন করুন</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Processing State */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-pink-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">পেমেন্ট প্রসেস হচ্ছে...</p>
                <p className="text-xs text-slate-500">অনুগ্রহ করে উইন্ডোটি বন্ধ করবেন না</p>
              </div>
            </div>
          )}

          {/* STEP 5: Success State */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-900">পেমেন্ট সফল হয়েছে!</p>
                <p className="text-xs text-slate-500 font-mono font-bold text-emerald-700">
                  TrxID: {trxId}
                </p>
                <p className="text-[11px] text-slate-400">
                  অর্ডারটি স্বয়ংক্রিয়ভাবে নিশ্চিত করা হয়েছে
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
