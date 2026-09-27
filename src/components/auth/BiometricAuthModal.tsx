import React, { useState, useEffect } from 'react';
import { BiometricCredential, BiometricType, User } from '../../types';
import { biometricAuthService } from '../../services/biometricAuthService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
  title?: string;
  subtitle?: string;
  defaultMode?: 'biometric' | 'pin';
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'বায়োমেট্রিক লগইন ও আনলক',
  subtitle = 'ফিঙ্গারপ্রিন্ট অথবা ফেস আইডি দিয়ে দ্রুত প্রবেশ করুন',
  defaultMode = 'biometric',
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'biometric' | 'pin'>(defaultMode);
  const [credentials, setCredentials] = useState<BiometricCredential[]>(() =>
    biometricAuthService.getCredentials()
  );
  const [selectedCredId, setSelectedCredId] = useState<string>(() => {
    const list = biometricAuthService.getCredentials();
    const def = list.find((c) => c.isDefault) || list[0];
    return def ? def.id : '';
  });

  const [biometricType, setBiometricType] = useState<BiometricType>('fingerprint');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pinInput, setPinInput] = useState('');

  // Device label detection
  const [deviceInfo] = useState(() => biometricAuthService.getDeviceBiometricLabel());

  useEffect(() => {
    if (isOpen) {
      const list = biometricAuthService.getCredentials();
      setCredentials(list);
      const active = list.find((c) => c.id === selectedCredId) || list[0];
      if (active) {
        setSelectedCredId(active.id);
        setBiometricType(active.biometricType);
      }
      setScanState('idle');
      setErrorMessage('');
      setPinInput('');
      setMode(defaultMode);

      // Trigger automatic scan prompt after opening
      if (defaultMode === 'biometric') {
        const timer = setTimeout(() => {
          handleBiometricScan(active?.id);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCred = credentials.find((c) => c.id === selectedCredId) || credentials[0];

  const handleBiometricScan = async (credId?: string) => {
    setScanState('scanning');
    setErrorMessage('');

    try {
      // Simulate realistic biometric sensor pulse & hardware handshake
      await new Promise((resolve) => setTimeout(resolve, 850));

      const targetId = credId || selectedCredId;
      const res = await biometricAuthService.authenticateBiometric({
        credentialId: targetId,
        preferredType: biometricType,
      });

      setScanState('success');
      login(res.token, res.user, res.shop);

      setTimeout(() => {
        onSuccess(res.user, res.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setScanState('error');
      setErrorMessage(err.message || 'বায়োমেট্রিক শনাক্তকরণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন বা পিন দিন।');
      biometricAuthService.triggerHapticError();
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput || pinInput.length < 4) {
      setErrorMessage('অনুগ্রহ করে সঠিক ৪-ডিজিট পিন কোড দিন');
      return;
    }

    const isValid = biometricAuthService.verifyQuickPin(pinInput);
    if (isValid) {
      setScanState('success');
      const cred = currentCred || credentials[0];
      const res = {
        user: {
          id: cred?.userId || 'usr_owner_main',
          name: cred?.userName || 'দোকান মালিক',
          mobile: cred?.mobile || '01711002233',
          role: cred?.userRole || 'owner',
          shopId: 'shop_001',
        } as User,
        token: `sx_pintoken_${Date.now()}`,
      };
      login(res.token, res.user, {} as any);
      showToast('পিন কোড সফলভাবে যাচাই হয়েছে', 'success');

      setTimeout(() => {
        onSuccess(res.user, res.token);
        onClose();
      }, 400);
    } else {
      setErrorMessage('ভুল পিন কোড! ডিফল্ট পিন: 1234');
      biometricAuthService.triggerHapticError();
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col transition-all duration-200">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected User Badge */}
        {currentCred && (
          <div className="px-6 py-2">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                  {currentCred.userName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {currentCred.userName}
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                      {currentCred.userRole === 'owner' ? 'মালিক' : currentCred.userRole === 'manager' ? 'ম্যানেজার' : 'ক্যাশিয়ার'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {currentCred.mobile} • {currentCred.deviceName}
                  </div>
                </div>
              </div>

              {credentials.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (credentials.findIndex((c) => c.id === currentCred.id) + 1) % credentials.length;
                    setSelectedCredId(credentials[nextIdx].id);
                    setBiometricType(credentials[nextIdx].biometricType);
                    setScanState('idle');
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  পরিবর্তন
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {mode === 'biometric' ? (
            <>
              {/* Interactive Biometric Sensor Animation */}
              <div className="relative my-4 flex items-center justify-center">
                {/* Glow rings */}
                <div
                  className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                    scanState === 'scanning'
                      ? 'bg-emerald-500/20 dark:bg-emerald-400/25 animate-ping'
                      : scanState === 'success'
                      ? 'bg-emerald-500/30 dark:bg-emerald-400/40 scale-110'
                      : scanState === 'error'
                      ? 'bg-rose-500/20 dark:bg-rose-400/25'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <div
                  className={`absolute w-28 h-28 rounded-full border-2 transition-all duration-500 ${
                    scanState === 'scanning'
                      ? 'border-emerald-500 border-dashed animate-spin'
                      : scanState === 'success'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                      : scanState === 'error'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />

                {/* Central Sensor Button */}
                <button
                  type="button"
                  onClick={() => handleBiometricScan()}
                  disabled={scanState === 'scanning'}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                    scanState === 'scanning'
                      ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-4 ring-emerald-300 dark:ring-emerald-700'
                      : scanState === 'success'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/50 ring-4 ring-emerald-300 dark:ring-emerald-700 scale-105'
                      : scanState === 'error'
                      ? 'bg-rose-600 text-white shadow-rose-600/50 ring-4 ring-rose-300 dark:ring-rose-700'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/40 hover:scale-105'
                  }`}
                >
                  {scanState === 'success' ? (
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  ) : scanState === 'error' ? (
                    <AlertCircle className="w-10 h-10 animate-shake" />
                  ) : biometricType === 'face' ? (
                    <ScanFace className={`w-10 h-10 ${scanState === 'scanning' ? 'animate-pulse' : ''}`} />
                  ) : (
                    <Fingerprint className={`w-10 h-10 ${scanState === 'scanning' ? 'animate-pulse' : ''}`} />
                  )}
                </button>
              </div>

              {/* Status Text */}
              <div className="mt-2 min-h-[44px]">
                {scanState === 'scanning' ? (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    বায়োমেট্রিক স্ক্যান হচ্ছে... আঙুল রাখুন
                  </p>
                ) : scanState === 'success' ? (
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    শনাক্তকরণ সম্পন্ন! সফলভাবে আনলক হয়েছে।
                  </p>
                ) : scanState === 'error' ? (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {errorMessage}
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      সেন্সরে আঙুল রাখুন অথবা বাটনে ট্যাপ করুন
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {biometricType === 'face' ? 'Face ID ক্যামেরা স্ক্যানার সক্রিয়' : 'টাচ আইডি / ফিঙ্গারপ্রিন্ট সেন্সর প্রস্তুত'}
                    </p>
                  </div>
                )}
              </div>

              {/* Switch biometric type (Fingerprint vs Face ID) */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setBiometricType('fingerprint');
                    setScanState('idle');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    biometricType === 'fingerprint'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  ফিঙ্গারপ্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBiometricType('face');
                    setScanState('idle');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    biometricType === 'face'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  Face ID / ফেস
                </button>
              </div>
            </>
          ) : (
            /* PIN Fallback Mode */
            <div className="w-full space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">৪-ডিজিট ব্যাকআপ পিন দিন</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ডিফল্ট দ্রুত আনলক পিন: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">1234</span>
                </p>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* PIN circles indicator */}
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      pinInput.length > idx
                        ? 'bg-emerald-600 border-emerald-600 scale-110'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Custom Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'C') {
                        setPinInput('');
                        setErrorMessage('');
                      } else if (key === '✓') {
                        handlePinSubmit();
                      } else {
                        if (pinInput.length < 4) {
                          const next = pinInput + key;
                          setPinInput(next);
                          setErrorMessage('');
                          if (next.length === 4) {
                            setTimeout(() => {
                              const isValid = biometricAuthService.verifyQuickPin(next);
                              if (isValid) {
                                setScanState('success');
                                const cred = currentCred || credentials[0];
                                const res = {
                                  user: {
                                    id: cred?.userId || 'usr_owner_main',
                                    name: cred?.userName || 'দোকান মালিক',
                                    mobile: cred?.mobile || '01711002233',
                                    role: cred?.userRole || 'owner',
                                    shopId: 'shop_001',
                                  } as User,
                                  token: `sx_pintoken_${Date.now()}`,
                                };
                                login(res.token, res.user, {} as any);
                                showToast('পিন দিয়ে সফলভাবে লগইন হয়েছে', 'success');
                                onSuccess(res.user, res.token);
                                onClose();
                              } else {
                                setErrorMessage('ভুল পিন কোড! ডিফল্ট: 1234');
                                setPinInput('');
                              }
                            }, 150);
                          }
                        }
                      }
                    }}
                    className={`h-11 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                      key === '✓'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : key === 'C'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer switch: Biometrics <-> PIN */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          {mode === 'biometric' ? (
            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setErrorMessage('');
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              পিন দিয়ে আনলক করুন
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('biometric');
                setErrorMessage('');
                setScanState('idle');
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 font-medium"
            >
              <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              বায়োমেট্রিক মোডে ফিরুন
            </button>
          )}

          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            {deviceInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};
