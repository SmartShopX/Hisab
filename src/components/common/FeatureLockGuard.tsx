import React, { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

interface FeatureLockGuardProps {
  isLocked: boolean;
  featureTitle: string;
  children: ReactNode;
}

export const FeatureLockGuard: React.FC<FeatureLockGuardProps> = ({
  isLocked,
  featureTitle,
  children,
}) => {
  const navigate = useNavigate();

  if (!isLocked) return <>{children}</>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
        <Lock className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        এই ফিচারটি আপনার বর্তমান প্ল্যানে নেই
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        "{featureTitle}" ব্যবহার করতে আপনার সাবস্ক্রিপশন প্ল্যানটি আপগ্রেড করুন। স্ট্যান্ডার্ড বা
        এন্টারপ্রাইজ প্ল্যানে আপগ্রেড করে স্মার্ট বিজনেস ফিচারগুলো আনলক করুন।
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={() => navigate('/subscription')}
          variant="primary"
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          প্ল্যান আপগ্রেড করুন
        </Button>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        * ফ্রন্টএন্ড ফিচার লকিং শুধুমাত্র ইন্টারফেস প্রদর্শনের জন্য। আসল এক্সেস ব্যাকএন্ড কর্তৃক সংরক্ষিত।
      </p>
    </div>
  );
};
