import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { isValidBdMobile, isValidEmail } from '../../utils/validation';
import { User, Phone, Mail, Lock } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ownerName.trim()) {
      setError('মালিকের নাম আবশ্যক');
      return;
    }

    if (!isValidBdMobile(mobile)) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711002233)');
      return;
    }

    if (email && !isValidEmail(email)) {
      setError('সঠিক ইমেইল ঠিকানা দিন (অথবা ফাঁকা রাখুন)');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        ownerName: ownerName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        password,
      });
      showToast('নিবন্ধন সফল! আপনার মোবাইলে ওটিপি পাঠানো হয়েছে।', 'success');
      navigate('/otp-verify', { state: { mobile } });
    } catch (err: any) {
      setError(err.message || 'নিবন্ধন প্রক্রিয়ায় ত্রুটি হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Smart Hisab Logo"
            className="inline-block w-14 h-14 rounded-2xl object-contain shadow-md mb-2 bg-white p-1 border border-slate-100"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-xl font-black text-slate-900">ব্যবসার নতুন অ্যাকাউন্ট তৈরি</h1>
          <p className="text-xs text-slate-500 mt-1">Smart Hisab ক্লাউড প্ল্যাটফর্মে আপনার ব্যবসা যুক্ত করুন</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মালিকের পূর্ণ নাম (Owner Name) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নম্বর (Mobile Number) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল (Email - ঐচ্ছিক)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@example.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পাসওয়ার্ড (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কনফার্ম পাসওয়ার্ড (Confirm Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-3">
            পরবর্তী ধাপ: ওটিপি যাচাই
          </Button>
        </form>

        <div className="text-center mt-5">
          <p className="text-xs text-slate-600">
            পূর্বেই একাউন্ট রয়েছে?{' '}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
