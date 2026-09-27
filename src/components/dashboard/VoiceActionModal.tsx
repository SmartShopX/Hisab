import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Sparkles, X, Check, ArrowRight, CornerDownLeft, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';

interface VoiceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceActionModal: React.FC<VoiceActionModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedAction, setDetectedAction] = useState<{
    type: 'due' | 'pos' | 'product' | 'expense' | 'report' | 'unknown';
    title: string;
    details: string;
    targetPath?: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setDetectedAction(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    // Initialize Web Speech API if supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        setTranscript(resultText);
        parseVoiceCommand(resultText);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {}
    } else {
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  const parseVoiceCommand = (text: string) => {
    const q = text.toLowerCase();

    if (q.includes('বাকি') || q.includes('খাতা') || q.includes('টাকা বাকি')) {
      setDetectedAction({
        type: 'due',
        title: 'বাকির খাতায় এন্ট্রি',
        details: `'${text}' এর উপর ভিত্তি করে বাকির খাতা ওপেন করা হচ্ছে।`,
        targetPath: '/due',
      });
    } else if (q.includes('বেচা') || q.includes('বিক্রি') || q.includes('বিল') || q.includes('রশিদ')) {
      setDetectedAction({
        type: 'pos',
        title: 'POS দ্রুত বিক্রয় কাউন্টার',
        details: 'বিক্রয় বিল তৈরির জন্য ক্যাশ কাউন্টারে নিয়ে যাওয়া হচ্ছে।',
        targetPath: '/pos',
      });
    } else if (q.includes('খরচ') || q.includes('ভাড়া') || q.includes('বিল জমা')) {
      setDetectedAction({
        type: 'expense',
        title: 'খরচের খাতা',
        details: 'দৈনিক খরচের ভাউচার এন্ট্রি করতে খরচের খাতা খোলা হচ্ছে।',
        targetPath: '/expenses',
      });
    } else if (q.includes('স্টক') || q.includes('পণ্য') || q.includes('মেডিসিন') || q.includes('ওষুধ')) {
      setDetectedAction({
        type: 'product',
        title: 'ইনভেন্টরি ও প্রোডাক্ট সার্চ',
        details: 'পণ্যের স্টক ও মূল্য দেখতে ইনভেন্টরি পেজে যাওয়া হচ্ছে।',
        targetPath: '/inventory',
      });
    } else if (q.includes('রিপোর্ট') || q.includes('লাভ') || q.includes('ক্ষতি') || q.includes('হিসাব')) {
      setDetectedAction({
        type: 'report',
        title: 'ব্যবসার লাভ-ক্ষতি রিপোর্ট',
        details: 'দৈনিক ও মাসিক আর্থিক হিসাব দেখতে রিপোর্ট সেকশনে যাওয়া হচ্ছে।',
        targetPath: '/reports',
      });
    } else {
      setDetectedAction({
        type: 'unknown',
        title: 'সার্চ করা হচ্ছে',
        details: `'${text}' নিয়ে গ্লোবাল সার্চ চালানো হবে।`,
      });
    }
  };

  const handleExecuteAction = (targetPath?: string) => {
    onClose();
    if (targetPath) {
      navigate(targetPath);
      showToast('ভয়েস কমান্ড অনুযায়ী পেজ ওপেন করা হয়েছে', 'success');
    }
  };

  const handleQuickSample = (sample: string) => {
    setTranscript(sample);
    parseVoiceCommand(sample);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">বাংলা ভয়েস কমান্ড</h3>
              <p className="text-xs text-slate-500">মুখে বলুন, অ্যাপ স্বয়ংক্রিয়ভাবে কাজ করবে</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Mic Animation */}
        <div className="py-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-4">
            {isListening && (
              <span className="absolute w-24 h-24 rounded-full bg-emerald-400/30 animate-ping" />
            )}
            <button
              onClick={() => {
                if (isListening) {
                  recognitionRef.current?.stop();
                } else {
                  recognitionRef.current?.start();
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isListening ? <Mic className="w-9 h-9 animate-pulse" /> : <MicOff className="w-9 h-9" />}
            </button>
          </div>

          <p className="text-sm font-bold text-slate-800">
            {isListening ? 'শুনছি... আপনার কমান্ড বলুন' : 'মাইক্রোফোনে ট্যাপ করে কথা বলুন'}
          </p>

          {/* Transcript Display */}
          <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[56px] flex items-center justify-center text-center">
            {transcript ? (
              <span className="text-sm font-semibold text-slate-800">"{transcript}"</span>
            ) : (
              <span className="text-xs text-slate-400">যেমন: "করিমের বাকি ৫০০ টাকা" বা "আজকের লাভ কত"</span>
            )}
          </div>
        </div>

        {/* Detected Action Card */}
        {detectedAction && (
          <div className="mb-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{detectedAction.title}</span>
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">{detectedAction.details}</p>
              </div>
              <button
                onClick={() => handleExecuteAction(detectedAction.targetPath)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
              >
                <span>যান</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Sample Prompts */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ক্লিক করে ট্রাই করুন:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'বাকির খাতা দেখাও',
              'আজকের মোট বিক্রি কত',
              'নতুন বিক্রি শুরু করো',
              'দোকানের খরচ যোগ করো',
              'পণ্য তালিকা ও স্টক',
            ].map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSample(sample)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
