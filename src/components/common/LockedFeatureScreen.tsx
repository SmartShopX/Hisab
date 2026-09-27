import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';

interface LockedFeatureScreenProps {
  featureName: string;
  requiredPlan?: 'Standard' | 'Enterprise';
  description?: string;
}

export const LockedFeatureScreen: React.FC<LockedFeatureScreenProps> = ({
  featureName,
  requiredPlan = 'Standard',
  description = 'এই ফিচারটি ব্যবহার করতে আপনার সাবস্ক্রিপশন প্যাকেজ আপগ্রেড করুন।',
}) => {
  const navigate = useNavigate();
  const { shop } = useAuth();

  return (
    <div className="min-h-[420px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{requiredPlan} প্ল্যান প্রয়োজন</span>
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-2">
          {featureName} ফিচারটি বর্তমানে লক করা আছে
        </h2>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {description} আপনার বর্তমান প্ল্যান{' '}
          <span className="font-bold text-slate-800 font-mono">
            {shop.subscriptionPlan || 'Basic'}
          </span>
          । উন্নত অটোমেশন ও ব্যবসার প্রবৃদ্ধির জন্য এখনই প্যাকেজ আপগ্রেড করুন।
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>সেন্ট্রালাইজড এপিআই ভ্যালিডেশন ও সিকিউরিটি সংরক্ষিত</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>১ ক্লিকে ইনস্ট্যান্ট অ্যাক্টিভেশন ও আনলক</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            ফিরে যান
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/subscription')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-md"
          >
            সাবস্ক্রিপশন আপগ্রেড করুন
          </Button>
        </div>
      </div>
    </div>
  );
};
