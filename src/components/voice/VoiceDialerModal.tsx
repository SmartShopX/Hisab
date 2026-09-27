import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { voiceCallService, DEFAULT_SCRIPTS } from '../../services/voiceCallService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  ShieldAlert,
  User,
  Sparkles,
  RefreshCw,
  Send,
  CornerDownRight,
} from 'lucide-react';

interface VoiceDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  callType?: 'due_reminder' | 'marketing' | 'manual_call';
  customScript?: string;
  onCallCompleted?: () => void;
}

export const VoiceDialerModal: React.FC<VoiceDialerModalProps> = ({
  isOpen,
  onClose,
  customer,
  callType = 'due_reminder',
  customScript,
  onCallCompleted,
}) => {
  const { showToast } = useToast();

  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>(
    'idle'
  );
  const [seconds, setSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [ivrResponse, setIvrResponse] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Initialize script text when customer changes
  useEffect(() => {
    if (customer) {
      const template =
        customScript ||
        (callType === 'due_reminder'
          ? (customer.oldestDueDays || 0) > 45
            ? DEFAULT_SCRIPTS.due_urgent
            : DEFAULT_SCRIPTS.due_friendly
          : DEFAULT_SCRIPTS.marketing_offer);

      const interpolated = voiceCallService.interpolateScript(template, {
        customerName: customer.name,
        dueAmount: customer.totalDue,
        promiseDate: customer.promiseDate || 'আজ',
      });
      setScriptText(interpolated);
      setCallState('idle');
      setSeconds(0);
      setIvrResponse(null);
    }
  }, [customer, customScript, callType, isOpen]);

  // Call timer effect
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Cleanup voice on unmount or close
  useEffect(() => {
    return () => {
      voiceCallService.stopSpeaking();
    };
  }, []);

  if (!customer) return null;

  const handleStartCall = () => {
    setCallState('calling');
    setSeconds(0);
    setIvrResponse(null);

    // Simulate Network Call Progression
    setTimeout(() => {
      setCallState('ringing');
      // After 2.5 seconds, call answered
      setTimeout(() => {
        setCallState('connected');
        // Play Bangla AI Speech
        if (!isMuted) {
          voiceCallService.speakBangla(scriptText, () => {
            // Speech ended
          });
        }
      }, 2500);
    }, 1500);
  };

  const handleEndCall = () => {
    voiceCallService.stopSpeaking();
    const duration = seconds;
    setCallState('ended');

    // Record Call Log
    voiceCallService.addLog({
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      callType: callType as 'due_reminder' | 'marketing' | 'manual_call',
      dueAmount: customer.totalDue,
      promiseDate: customer.promiseDate,
      durationSeconds: duration,
      status: duration > 0 ? 'answered' : 'no_answer',
      ivrResponseText: ivrResponse || undefined,
      notes: ivrResponse
        ? `কলের সময় গ্রাহক আইভিআর প্রেস করেছেন: ${ivrResponse}`
        : 'স্বয়ংক্রিয় এআই ভয়েস কল সম্পন্ন',
    });

    if (onCallCompleted) onCallCompleted();
    showToast(`${customer.name} এর কাছে এআই ভয়েস কল সম্পন্ন হয়েছে`, 'success');
  };

  const handlePressIVRKey = (key: '1' | '2' | '3') => {
    if (callState !== 'connected') return;

    const res = voiceCallService.handleIVRKeyPress(customer.id, key);
    setIvrResponse(res.actionMessage);

    let confirmationSpeech = '';
    if (key === '1') {
      confirmationSpeech = 'ধন্যবাদ। আপনার মোবাইলে আমাদের বিকাশ ও নগদ মার্চেন্ট নম্বর পাঠিয়ে দেওয়া হয়েছে।';
    } else if (key === '2') {
      confirmationSpeech = `ধন্যবাদ। আপনার সময় আরও তিন দিন বাড়ানো হয়েছে।`;
    } else {
      confirmationSpeech = 'ধন্যবাদ। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।';
    }

    voiceCallService.speakBangla(confirmationSpeech);
    showToast(res.actionMessage, 'info');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        voiceCallService.stopSpeaking();
        onClose();
      }}
      title="এআই আউটবাউন্ড ভয়েস কল (AI Voice Dialer)"
      subtitle={`গ্রাহক: ${customer.name} (${customer.mobile})`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Phone Call Card Display */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
          {/* Top Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  callState === 'connected'
                    ? 'bg-emerald-500 animate-ping'
                    : callState === 'ringing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              {callState === 'idle' && 'প্রস্তুত (Ready)'}
              {callState === 'calling' && 'ডায়াল হচ্ছে (Calling...)'}
              {callState === 'ringing' && 'রিং হচ্ছে (Ringing...)'}
              {callState === 'connected' && `কথা চলছে (${formatTimer(seconds)})`}
              {callState === 'ended' && 'কল সমাপ্ত (Call Ended)'}
            </span>

            <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-full text-[11px]">
              বকেয়া: {formatCurrency(customer.totalDue)}
            </span>
          </div>

          {/* Caller Avatar & Name */}
          <div className="relative z-10 my-2">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500 ${
                callState === 'connected'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-4 ring-emerald-500/20'
                  : callState === 'ringing'
                  ? 'bg-amber-500/20 text-amber-300 ring-4 ring-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {customer.name.slice(0, 1)}
            </div>

            <h3 className="text-lg font-bold text-white mt-3">{customer.name}</h3>
            <p className="text-xs text-slate-400 font-mono tracking-wider">{customer.mobile}</p>
            {customer.promiseDate && (
              <span className="inline-block mt-1 text-[11px] text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-700/50">
                প্রতিশ্রুতি তারিখ: {customer.promiseDate}
              </span>
            )}
          </div>

          {/* Connected Animation */}
          {callState === 'connected' && (
            <div className="py-2">
              <div className="flex items-center justify-center gap-1.5 h-6">
                <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></div>
                <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-5"></div>
                <div className="w-1 bg-teal-300 rounded-full animate-bounce h-6"></div>
                <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4"></div>
                <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2"></div>
              </div>
              <span className="text-[11px] text-emerald-300 block font-medium mt-1">
                স্মার্টশপ এআই কথা বলছে...
              </span>
            </div>
          )}

          {/* Call Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {callState === 'idle' || callState === 'ended' ? (
              <button
                type="button"
                onClick={handleStartCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="ভয়েস কল শুরু করুন"
              >
                <Phone className="w-7 h-7" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (!isMuted) voiceCallService.stopSpeaking();
                    setIsMuted(!isMuted);
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'আনমিউট' : 'মিউট'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="কল কেটে দিন"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* IVR Interactive Keypad (Active when Connected) */}
        {callState === 'connected' && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>ইন্টারেক্টিভ আইভিআর কী-প্যাড (গ্রাহক রেসপন্স টেস্ট)</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                DTMF Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePressIVRKey('1')}
                className="p-2.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-center shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs inline-flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white">
                  1
                </span>
                <span className="text-[11px] font-bold text-slate-800 block">বিকাশ/নগদ তথ্য</span>
                <span className="text-[9px] text-slate-500 block">পেমেন্ট লিংক যাবে</span>
              </button>

              <button
                type="button"
                onClick={() => handlePressIVRKey('2')}
                className="p-2.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-center shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs inline-flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white">
                  2
                </span>
                <span className="text-[11px] font-bold text-slate-800 block">+৩ দিন সময়</span>
                <span className="text-[9px] text-slate-500 block">তারিখ পেছাবে</span>
              </button>

              <button
                type="button"
                onClick={() => handlePressIVRKey('3')}
                className="p-2.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-center shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs inline-flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white">
                  3
                </span>
                <span className="text-[11px] font-bold text-slate-800 block">দোকানে কথা</span>
                <span className="text-[9px] text-slate-500 block">মালিকের সাথে</span>
              </button>
            </div>

            {ivrResponse && (
              <div className="mt-2.5 p-2 bg-white rounded-xl border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{ivrResponse}</span>
              </div>
            )}
          </div>
        )}

        {/* Script Preview & Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">ভয়েস কল স্ক্রিপ্ট (বাংলা টেক্সট)</label>
            <button
              type="button"
              onClick={() => voiceCallService.speakBangla(scriptText)}
              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>টেক্সট-টু-স্পিচ প্রিভিউ শুনুন</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            disabled={callState === 'connected'}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 disabled:bg-slate-100 leading-relaxed"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              voiceCallService.stopSpeaking();
              onClose();
            }}
          >
            বন্ধ করুন
          </Button>
          {callState === 'idle' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartCall}
              leftIcon={<PhoneCall className="w-4 h-4" />}
            >
              কল শুরু করুন
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
