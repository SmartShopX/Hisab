import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { biometricAuthService } from '../../services/biometricAuthService';
import { BiometricCredential, BiometricSettings, BiometricType, UserRole } from '../../types';
import { Button } from '../common/Button';
import { BiometricAuthModal } from '../auth/BiometricAuthModal';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  KeyRound,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Laptop,
  Check,
  Lock,
} from 'lucide-react';

export const BiometricSettingsTab: React.FC = () => {
  const { user, shop } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<BiometricSettings>(() => biometricAuthService.getSettings());
  const [credentials, setCredentials] = useState<BiometricCredential[]>(() =>
    biometricAuthService.getCredentials()
  );
  const [deviceInfo] = useState(() => biometricAuthService.getDeviceBiometricLabel());
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // New Credential Registration Form State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUserName, setNewUserName] = useState(user?.name || 'দোকান মালিক');
  const [newUserRole, setNewUserRole] = useState<UserRole>(user?.role || 'owner');
  const [newDeviceName, setNewDeviceName] = useState(deviceInfo.label);
  const [newBiometricType, setNewBiometricType] = useState<BiometricType>(deviceInfo.type);
  const [isRegistering, setIsRegistering] = useState(false);

  // Quick PIN Edit State
  const [pinEdit, setPinEdit] = useState(settings.quickPin || '1234');
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    const handleCredsChange = (e: any) => {
      setCredentials(e.detail || biometricAuthService.getCredentials());
    };
    const handleSettingsChange = (e: any) => {
      setSettings(e.detail || biometricAuthService.getSettings());
    };

    window.addEventListener('smartshopx_biometric_credentials_changed', handleCredsChange);
    window.addEventListener('smartshopx_biometric_settings_changed', handleSettingsChange);

    return () => {
      window.removeEventListener('smartshopx_biometric_credentials_changed', handleCredsChange);
      window.removeEventListener('smartshopx_biometric_settings_changed', handleSettingsChange);
    };
  }, []);

  const handleToggleSetting = (key: keyof BiometricSettings, val: any) => {
    const updated = biometricAuthService.saveSettings({ [key]: val });
    setSettings(updated);
    showToast('বায়োমেট্রিক সেটিংস আপডেট করা হয়েছে', 'success');
  };

  const handleSavePin = () => {
    if (pinEdit.length < 4) {
      showToast('পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে', 'error');
      return;
    }
    setIsSavingPin(true);
    biometricAuthService.saveSettings({ quickPin: pinEdit });
    showToast('ব্যাকআপ মাস্টার পিন সফলভাবে সংরক্ষিত হয়েছে', 'success');
    setIsSavingPin(false);
  };

  const handleRegisterNewDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const created = await biometricAuthService.registerBiometric({
        userName: newUserName,
        userRole: newUserRole,
        mobile: user?.mobile || '01711002233',
        deviceName: newDeviceName,
        biometricType: newBiometricType,
      });

      setCredentials(biometricAuthService.getCredentials());
      setIsAddingNew(false);
      showToast(`"${created.deviceName}" সফলভাবে বায়োমেট্রিক ডিভাইসে যুক্ত করা হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'ডিভাইস যুক্ত করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteCredential = (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${name}" বায়োমেট্রিক ডিভাইসটি মুছে ফেলতে চান?`)) {
      biometricAuthService.deleteCredential(id);
      setCredentials(biometricAuthService.getCredentials());
      showToast('বায়োমেট্রিক ডিভাইস মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handleSetDefault = (id: string) => {
    biometricAuthService.setDefaultCredential(id);
    setCredentials(biometricAuthService.getCredentials());
    showToast('ডিফল্ট বায়োমেট্রিক ডিভাইস সেট করা হয়েছে', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none pr-8">
          <Fingerprint className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            স্মার্ট সিকিউরিটি ও পাসকি সুবিধা
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            বায়োমেট্রিক অথেন্টিকেশন (Fingerprint & Face ID)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            মোবাইল বা ট্যাবলেটে পাসওয়ার্ড টাইপ না করেই আপনার ফিঙ্গারপ্রিন্ট বা ফেস আইডি দিয়ে মাত্র ১-সেকেন্ডে
            POS স্ক্রিন আনলক করুন ও ক্যাশিয়ার শিফট পরিবর্তন করুন।
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setIsAddingNew(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-lg shadow-emerald-500/30 font-bold"
            >
              নতুন বায়োমেট্রিক ডিভাইস যুক্ত করুন
            </Button>

            <Button
              type="button"
              onClick={() => setIsTestModalOpen(true)}
              variant="outline"
              size="md"
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-800 font-bold"
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            >
              বায়োমেট্রিক টেস্ট করুন
            </Button>
          </div>
        </div>
      </div>

      {/* Current Detected Hardware Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
            {deviceInfo.type === 'face' ? <ScanFace className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                শনাক্তকৃত ডিভাইস সেন্সর: {deviceInfo.label}
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                সক্রিয় ও সমর্থিত
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              W3C WebAuthn Passkeys ও হার্ডওয়্যার বায়োমেট্রিক ইন্টিগ্রেশন এনাবল করা আছে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">বায়োমেট্রিক সিস্টেম:</span>
          <button
            type="button"
            onClick={() => handleToggleSetting('enabled', !settings.enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              settings.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Add New Device Form Modal / Collapsible */}
      {isAddingNew && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/50 p-6 shadow-md animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              নতুন বায়োমেট্রিক ডিভাইস রেজিস্টার করুন
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              বাতিল
            </button>
          </div>

          <form onSubmit={handleRegisterNewDevice} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ব্যবহারকারীর নাম (User / Staff Name) *
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                রোল / ভূমিকা (Role) *
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="owner">দোকান মালিক (Shop Owner)</option>
                <option value="manager">ম্যানেজার (Manager)</option>
                <option value="cashier">ক্যাশিয়ার (Cashier)</option>
                <option value="staff">স্টাফ (Staff)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ডিভাইসের নাম (Device Tag) *
              </label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="যেমন: Samsung S24 Ultra - Counter POS"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                বায়োমেট্রিক ধরন (Sensor Type) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewBiometricType('fingerprint')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    newBiometricType === 'fingerprint'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  ফিঙ্গারপ্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={() => setNewBiometricType('face')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    newBiometricType === 'face'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  Face ID
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingNew(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isRegistering}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                ডিভাইস বায়োমেট্রিক রেজিস্টার করুন
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Enrolled Devices List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              রেজিস্ট্রিকৃত বায়োমেট্রিক ডিভাইস তালিকা ({credentials.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              এই ডিভাইসগুলো দিয়ে পিওএস (POS) ও লগইন পেজে সরাসরি আঙুলের ছাপ বা ফেস দিয়ে প্রবেশ করা যাবে।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                cred.isDefault
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    {cred.biometricType === 'face' ? (
                      <ScanFace className="w-5 h-5" />
                    ) : (
                      <Fingerprint className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{cred.userName}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {cred.userRole === 'owner' ? 'মালিক' : cred.userRole === 'manager' ? 'ম্যানেজার' : 'ক্যাশিয়ার'}
                      </span>
                      {cred.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> ডিফল্ট
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {cred.deviceName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCredential(cred.id, cred.deviceName)}
                  className="w-7 h-7 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ব্যবহার: {new Date(cred.lastUsedAt || cred.createdAt).toLocaleDateString('bn-BD')}
                </span>

                {!cred.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(cred.id)}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    ডিফল্ট করুন
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Automation Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          POS ও সিকিউরিটি পলিসি কনফিগারেশন
        </h3>

        <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* 1. POS Quick Unlock */}
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                POS স্ক্রিনে ১-ট্যাপ বায়োমেট্রিক আনলক
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                কাউন্টার থেকে মালিক বা ক্যাশিয়ার ক্ষণিকের জন্য সরলে POS লক হবে এবং স্পর্শেই আনলক হবে।
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPosQuickUnlock}
              onChange={(e) => handleToggleSetting('allowPosQuickUnlock', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 2. Fast Cashier Switch */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                বায়োমেট্রিক দিয়ে সুপার-ফাস্ট ক্যাশিয়ার শিফট পরিবর্তন
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                একাধিক স্টাফ কাজ করলে লগআউট না করেই ফিঙ্গারপ্রিন্ট দিয়ে এক ক্লিকে ইউজার অ্যাকাউন্ট সুইচ।
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowFastCashierSwitch}
              onChange={(e) => handleToggleSetting('allowFastCashierSwitch', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 3. Login Screen Prompts */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                প্রধান লগইন স্ক্রিনে বায়োমেট্রিক ট্যাব দেখান
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                মোবাইল অ্যাপ বা ব্রাউজারে লগইন স্ক্রিন খুললেই সরাসরি ফেস/ফিঙ্গারপ্রিন্ট অপশন প্রদান করবে।
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showOnLoginPage}
              onChange={(e) => handleToggleSetting('showOnLoginPage', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* 4. Auto-lock timeout */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                POS স্ক্রিন অটো-লক টাইমআউট (Auto-Lock on Idle)
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                নির্দিষ্ট সময় কোনো বিক্রয় না হলে স্বয়ংক্রিয়ভাবে পিওএস কাউন্টার লক হয়ে যাবে।
              </p>
            </div>
            <select
              value={settings.posAutoLockTimeoutMinutes}
              onChange={(e) => handleToggleSetting('posAutoLockTimeoutMinutes', Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value={0}>অটো-লক বন্ধ রাখুন</option>
              <option value={2}>২ মিনিট পর লক করুন</option>
              <option value={5}>৫ মিনিট পর লক করুন (সুপারিশকৃত)</option>
              <option value={10}>১০ মিনিট পর লক করুন</option>
              <option value={15}>১৫ মিনিট পর লক করুন</option>
            </select>
          </div>

          {/* 5. Backup Quick PIN */}
          <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                ব্যাকআপ মাস্টার পিন (৪-সংখ্যার PIN)
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                হাত ভেজা বা সেন্সরে সমস্যা হলে এই পিন কোড দিয়ে দ্রুত আনলক করা যাবে।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={pinEdit}
                onChange={(e) => setPinEdit(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-mono text-center font-bold tracking-widest text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                type="button"
                onClick={handleSavePin}
                variant="outline"
                size="sm"
                isLoading={isSavingPin}
                className="font-bold"
              >
                পিন সংরক্ষণ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Biometric Test Modal */}
      <BiometricAuthModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={(u) => {
          showToast(`টেস্ট সফল! ${u.name} বায়োমেট্রিক দিয়ে সফলভাবে আনলক হয়েছে।`, 'success');
        }}
        title="বায়োমেট্রিক টেস্ট ও ভেরিফিকেশন"
        subtitle="আপনার ডিভাইসের ফিঙ্গারপ্রিন্ট বা ফেস আইডি পরীক্ষা করুন"
      />
    </div>
  );
};
