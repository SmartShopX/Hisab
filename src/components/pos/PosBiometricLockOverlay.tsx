import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { biometricAuthService } from '../../services/biometricAuthService';
import { BiometricCredential, User } from '../../types';
import { Button } from '../common/Button';
import {
  Lock,
  Unlock,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  KeyRound,
  Users,
  Store,
  Sparkles,
  CheckCircle2,
  Clock,
  Smartphone,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface PosBiometricLockOverlayProps {
  isLocked: boolean;
  onUnlock: (unlockedUser?: User) => void;
}

export const PosBiometricLockOverlay: React.FC<PosBiometricLockOverlayProps> = ({
  isLocked,
  onUnlock,
}) => {
  const { user, shop, login } = useAuth();
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState<BiometricCredential[]>(() =>
    biometricAuthService.getCredentials()
  );
  const [selectedCredId, setSelectedCredId] = useState<string>(() => {
    const list = biometricAuthService.getCredentials();
    return list[0]?.id || '';
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const [deviceInfo] = useState(() => biometricAuthService.getDeviceBiometricLabel());

  // Clock updater
  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) {
      const list = biometricAuthService.getCredentials();
      setCredentials(list);
      setScanState('idle');
      setErrorMessage('');
      setPinInput('');
      setShowPinPad(false);

      // Auto-focus owner cred if available
      const ownerCred = list.find((c) => c.userRole === 'owner') || list[0];
      if (ownerCred) {
        setSelectedCredId(ownerCred.id);
      }
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const currentCred = credentials.find((c) => c.id === selectedCredId) || credentials[0];

  const handleBiometricUnlock = async (credId?: string) => {
    setScanState('scanning');
    setErrorMessage('');

    try {
      // Simulate biometric sensor read
      await new Promise((resolve) => setTimeout(resolve, 750));

      const targetId = credId || selectedCredId;
      const res = await biometricAuthService.authenticateBiometric({
        credentialId: targetId,
      });

      setScanState('success');
      login(res.token, res.user, res.shop);
      showToast(`স্বাগতম ${res.user.name}! POS টার্মিনাল আনলক হয়েছে।`, 'success');

      setTimeout(() => {
        onUnlock(res.user);
      }, 450);
    } catch (err: any) {
      setScanState('error');
      setErrorMessage(err.message || 'বায়োমেট্রিক যাচাইকরণ ব্যর্থ। আবার চেষ্টা করুন বা পিন দিন।');
      biometricAuthService.triggerHapticError();
    }
  };

  const handlePinSubmit = () => {
    if (!pinInput || pinInput.length < 4) {
      setErrorMessage('সঠিক ৪-সংখ্যার পিন দিন');
      return;
    }

    const isValid = biometricAuthService.verifyQuickPin(pinInput);
    if (isValid) {
      setScanState('success');
      showToast('পিন কোড দিয়ে POS আনলক হয়েছে', 'success');
      setTimeout(() => {
        onUnlock();
      }, 350);
    } else {
      setErrorMessage('ভুল পিন কোড! ডিফল্ট পিন: 1234');
      setPinInput('');
      biometricAuthService.triggerHapticError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="max-w-md w-full bg-slate-900/90 dark:bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Lock Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 mb-4">
          <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>POS কাউন্টার স্ক্রিন লক করা আছে</span>
        </div>

        {/* Shop Name & Current Time */}
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-400 shrink-0" />
          {shop.name || 'SmartShopX POS'}
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} •{' '}
          {currentTime.toLocaleDateString('bn-BD', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>

        {/* Cashier / User Switcher Chips */}
        <div className="w-full mt-5 mb-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            দ্রুত ক্যাশিয়ার / মালিক নির্বাচন করুন:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {credentials.map((cred) => {
              const isSelected = cred.id === currentCred?.id;
              return (
                <button
                  key={cred.id}
                  type="button"
                  onClick={() => {
                    setSelectedCredId(cred.id);
                    setScanState('idle');
                    setErrorMessage('');
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/80 border-emerald-500/80 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {cred.biometricType === 'face' ? (
                      <ScanFace className="w-4 h-4" />
                    ) : (
                      <Fingerprint className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate">{cred.userName}</div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {cred.userRole === 'owner' ? 'দোকান মালিক' : 'ক্যাশিয়ার'} • {cred.deviceName.split('(')[0]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Biometric Interactive Action */}
        {!showPinPad ? (
          <div className="w-full my-4 flex flex-col items-center">
            {/* Luminous Sensor */}
            <div className="relative my-3 flex items-center justify-center">
              <div
                className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
                  scanState === 'scanning'
                    ? 'bg-emerald-500/25 animate-ping'
                    : scanState === 'success'
                    ? 'bg-emerald-500/35 scale-110'
                    : scanState === 'error'
                    ? 'bg-rose-500/20'
                    : 'bg-slate-800/80'
                }`}
              />

              <button
                type="button"
                onClick={() => handleBiometricUnlock()}
                disabled={scanState === 'scanning'}
                className={`relative z-10 w-24 h-24 rounded-3xl flex flex-col items-center justify-center shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                  scanState === 'scanning'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50 ring-4 ring-emerald-400'
                    : scanState === 'success'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50 ring-4 ring-emerald-400 scale-105'
                    : scanState === 'error'
                    ? 'bg-rose-600 text-white shadow-rose-600/50 ring-4 ring-rose-400'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/40 hover:scale-105'
                }`}
              >
                {scanState === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 animate-bounce" />
                ) : currentCred?.biometricType === 'face' ? (
                  <ScanFace className={`w-12 h-12 ${scanState === 'scanning' ? 'animate-pulse' : ''}`} />
                ) : (
                  <Fingerprint className={`w-12 h-12 ${scanState === 'scanning' ? 'animate-pulse' : ''}`} />
                )}
                <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">
                  {scanState === 'scanning' ? 'স্ক্যানিং...' : scanState === 'success' ? 'সফল!' : 'আনলক'}
                </span>
              </button>
            </div>

            {/* Status & prompt */}
            <div className="min-h-[36px] mt-1 text-center">
              {scanState === 'scanning' ? (
                <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  বায়োমেট্রিক যাচাই করা হচ্ছে...
                </p>
              ) : scanState === 'success' ? (
                <p className="text-xs font-bold text-emerald-400">আনলক সম্পন্ন হয়েছে!</p>
              ) : scanState === 'error' ? (
                <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
              ) : (
                <p className="text-xs text-slate-300 font-medium">
                  {currentCred?.userName} হিসেবে আনলক করতে টাচ করুন
                </p>
              )}
            </div>

            {/* 1-Tap Quick Action */}
            <Button
              type="button"
              onClick={() => handleBiometricUnlock()}
              variant="primary"
              size="lg"
              className="w-full mt-3 font-bold shadow-lg shadow-emerald-600/30"
              leftIcon={<Fingerprint className="w-5 h-5" />}
            >
              বায়োমেট্রিক দিয়ে ১-ক্লিকে আনলক
            </Button>
          </div>
        ) : (
          /* PIN Input Mode */
          <div className="w-full my-3 space-y-3">
            <p className="text-xs text-slate-300 font-medium">
              ৪-সংখ্যার দ্রুত আনলক পিন দিন (ডিফল্ট: <span className="text-emerald-400 font-mono font-bold">1234</span>)
            </p>

            {errorMessage && (
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* PIN Dots */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pinInput.length > idx
                      ? 'bg-emerald-500 border-emerald-500 scale-110'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
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
                              showToast('পিন কোড সঠিক! আনলক করা হলো।', 'success');
                              onUnlock();
                            } else {
                              setErrorMessage('ভুল পিন কোড! ডিফল্ট: 1234');
                              setPinInput('');
                            }
                          }, 150);
                        }
                      }
                    }
                  }}
                  className={`h-10 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                    key === '✓'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : key === 'C'
                      ? 'bg-rose-900/60 text-rose-300 hover:bg-rose-900'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              setShowPinPad(!showPinPad);
              setErrorMessage('');
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {showPinPad ? 'বায়োমেট্রিক স্ক্যানারে ফিরুন' : 'পিন (PIN) দিয়ে আনলক'}
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            {deviceInfo.label.split('(')[0]}
          </span>
        </div>
      </div>
    </div>
  );
};
