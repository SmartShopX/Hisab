import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { KeyRound, RotateCw } from 'lucide-react';

export const OtpVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const mobile = (location.state as any)?.mobile || '017XXXXXXXX';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('সঠিক ওটিপি কোড লিখুন (কমপক্ষে ৪ ডিজিট)');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(mobile, otp);
      showToast('মোবাইল নম্বর সফলভাবে যাচাই হয়েছে!', 'success');
      navigate('/business-setup');
    } catch (err: any) {
      setError(err.message || 'ভুল ওটিপি কোড। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    showToast('নতুন ওটিপি কোড আপনার মোবাইলে পাঠানো হয়েছে', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">মোবাইল নম্বর যাচাইকরণ</h2>
        <p className="text-xs text-slate-500 mt-1">
          <span className="font-mono font-semibold text-slate-700">{mobile}</span> নম্বরে একটি ৪/৬
          সংখ্যার ওটিপি কোড পাঠানো হয়েছে।
        </p>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              className="w-48 mx-auto px-4 py-3 rounded-xl border border-slate-300 text-2xl text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              required
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-2">পরীক্ষার জন্য যেকোনো ৪ সংখ্যার পিন দিন (যেমন 1234)</p>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            যাচাই সম্পন্ন করুন
          </Button>
        </form>

        <div className="mt-6 text-xs text-slate-500">
          {timer > 0 ? (
            <p>পুনরায় কোড পাঠানোর সময় বাকি: <span className="font-mono font-semibold text-slate-700">{timer}s</span></p>
          ) : (
            <button
              onClick={handleResend}
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>কোড পুনরায় পাঠান</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
