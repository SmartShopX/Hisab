import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { biometricAuthService } from '../../services/biometricAuthService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { BiometricAuthModal } from '../../components/auth/BiometricAuthModal';
import { isValidBdMobile } from '../../utils/validation';
import { Phone, Lock, Sparkles, KeyRound, Fingerprint, ScanFace, ShieldCheck, Smartphone } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp' | 'biometric'>('password');
  const [mobile, setMobile] = useState('01711002233');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [deviceInfo] = useState(() => biometricAuthService.getDeviceBiometricLabel());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMethod === 'biometric') {
      setIsBiometricModalOpen(true);
      return;
    }

    if (!isValidBdMobile(mobile)) {
      setError('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01711002233)');
      return;
    }

    if (authMethod === 'password' && !password) {
      setError('পাসওয়ার্ড প্রদান করুন');
      return;
    }

    if (authMethod === 'otp' && otp.length < 4) {
      setError('৪ বা ৬ ডিজিটের ওটিপি (OTP) প্রদান করুন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({
        mobile,
        password: authMethod === 'password' ? password : undefined,
        otp: authMethod === 'otp' ? otp : undefined,
      });
      login(res.token, res.user, res.shop);
      showToast(`স্বাগতম, ${res.user.name}! Smart Hisab ড্যাশবোর্ডে আপনাকে স্বাগতম।`, 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await authService.login({ mobile: '01711002233', password: 'demo' });
      login(res.token, res.user, res.shop);
      showToast('ডেমো অ্যাকাউন্টে সফলভাবে প্রবেশ করা হয়েছে', 'success');
      navigate('/');
    } catch {
      showToast('লগইন ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 transition-colors">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Smart Hisab Logo"
            className="inline-block w-16 h-16 rounded-2xl object-contain shadow-md mb-2 bg-white p-1 border border-slate-100 dark:border-slate-800"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Smart Hisab</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">স্মার্ট হিসাব • ক্লাউড পিওএস ও ব্যবসা ব্যবস্থাপনা</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 text-xs gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('password');
              setError('');
            }}
            className={`flex-1 py-2 font-medium rounded-xl transition-all cursor-pointer ${
              authMethod === 'password'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            পাসওয়ার্ড
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('otp');
              setError('');
            }}
            className={`flex-1 py-2 font-medium rounded-xl transition-all cursor-pointer ${
              authMethod === 'otp'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            OTP ওটিপি
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('biometric');
              setError('');
              setIsBiometricModalOpen(true);
            }}
            className={`flex-1 py-2 font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              authMethod === 'biometric'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            বায়োমেট্রিক
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* 1-Tap Biometric Hero Button (For Fast Mobile POS & Store Owners) */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setIsBiometricModalOpen(true)}
            className="w-full group p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/40 hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-between cursor-pointer border border-emerald-500/30"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                {deviceInfo.type === 'face' ? (
                  <ScanFace className="w-5 h-5 text-white" />
                ) : (
                  <Fingerprint className="w-5 h-5 text-white animate-pulse" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  বায়োমেট্রিক ১-ট্যাপ লগইন
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-400/30 text-emerald-100 font-semibold">
                    সুপার-ফাস্ট
                  </span>
                </div>
                <div className="text-[11px] text-emerald-100/90 font-medium">
                  {deviceInfo.label} দিয়ে সরাসরি প্রবেশ করুন
                </div>
              </div>
            </div>

            <span className="text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-emerald-50">
              স্ক্যান
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                required
              />
            </div>
          </div>

          {authMethod === 'password' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => showToast('পাসওয়ার্ড রিসেট ওটিপি এসএমএস আকারে পাঠানো হবে', 'info')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          ) : authMethod === 'otp' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ওটিপি কোড (OTP)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="৪ বা ৬ ডিজিট কোড"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono tracking-widest text-center"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                টেস্টিংয়ের জন্য যেকোনো ৪ বা ৬ সংখ্যার কোড দিন (যেমন: 1234)
              </p>
            </div>
          ) : null}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
            লগইন করুন
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            onClick={handleDemoLogin}
            variant="outline"
            size="md"
            className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            leftIcon={<Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          >
            ১-ক্লিকে ডেমো টেস্ট একাউন্টে লগইন
          </Button>
        </div>

        {/* Registration Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            নতুন ব্যবসা নিবন্ধন করতে চান?{' '}
            <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
              অ্যাকাউন্ট তৈরি করুন
            </Link>
          </p>
        </div>
      </div>

      {/* Biometric Authentication Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={(u) => {
          showToast(`স্বাগতম, ${u.name}! বায়োমেট্রিক দিয়ে সফলভাবে লগইন হয়েছে।`, 'success');
          navigate('/');
        }}
        title="বায়োমেট্রিক অথেন্টিকেশন"
        subtitle="ফিঙ্গারপ্রিন্ট বা ফেস আইডি দিয়ে দ্রুত প্রবেশ করুন"
      />
    </div>
  );
};
