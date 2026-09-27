import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean; className?: string; variant?: 'default' | 'sidebar' }> = ({
  compact = false,
  className = '',
  variant = 'default',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={handleClick}
          title="ফোনে ইনস্টল করুন (Install App on Phone / PC)"
          className={`w-full mb-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>মোবাইলে অ্যাপ ইনস্টল</span>
          </div>
          <span className="text-[10px] bg-emerald-500/25 text-emerald-200 px-1.5 py-0.5 rounded font-bold">ইনস্টল</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          title="অ্যাপ ইনস্টল করুন (Install PWA on Phone or PC)"
          className={`flex items-center gap-2 rounded-xl font-medium transition-all ${
            compact
              ? 'px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'px-4 py-2 text-xs bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
          } ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-current" />
          <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
          <span className="sm:hidden">ইনস্টল</span>
        </button>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">iPhone / iPad এ ইনস্টল</h3>
                  <p className="text-[11px] text-slate-500">Safari ব্রাউজার দিয়ে ইনস্টল করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ১
                </span>
                <span>
                  Safari ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার)</strong> আইকনে ট্যাপ করুন।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ২
                </span>
                <span>
                  নিচে স্ক্রোল করে <strong>Add to Home Screen (হোম স্ক্রিনে যোগ করুন)</strong> এ ক্লিক করুন।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ৩
                </span>
                <span>
                  উপরে ডানপাশে <strong>Add</strong> বাটনে চাপলেই সরাসরি অ্যাপ আকারে মোবাইলে সেভ হয়ে যাবে।
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              বুঝেছি (Close)
            </button>
          </div>
        </div>
      )}

      {/* Chrome / Android Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">মোবাইল / কম্পিউটারে ইনস্টল</h3>
                  <p className="text-[11px] text-slate-500">ক্রোম বা এজ ব্রাউজার দিয়ে ইনস্টল</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ব্রাউজারের ৩ ডট মেনু (⋮) তে ক্লিক করুন।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Install app</strong> বা <strong>Add to Home screen</strong> এ ক্লিক করুন।
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>অফলাইনেও দ্রুত গতিতে ফুলস্ক্রিন অ্যাপ হিসেবে চলবে।</span>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
};
