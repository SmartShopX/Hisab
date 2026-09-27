import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface VoiceSearchModalProps {
  onClose: () => void;
  onApplySearch: (text: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({ onClose, onApplySearch }) => {
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  const sampleVoiceQueries = [
    'স্যামসাং গ্যালাক্সি',
    'কালো প্রিমিয়াম পাঞ্জাবি',
    'লেডিস ড্রেস কালেকশন',
    'স্মার্ট ওয়াচ ও গ্যাজেট',
    'কটন টি-শার্ট',
    'ওয়্যারলেস ইয়ারবাডস',
  ];

  useEffect(() => {
    // Check Speech Recognition API support in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('মাইক্রোফোন পারমিশন প্রয়োজন। ব্রাউজার সেটিংসে অনুমতি দিন।', 'warning');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {}
      };
    } catch (e) {
      console.warn('Failed to start speech recognition', e);
      setHasSpeechSupport(false);
    }
  }, [showToast]);

  const handleConfirmSearch = (textToSearch?: string) => {
    const query = textToSearch || transcript;
    if (!query.trim()) {
      showToast('দয়া করে কিছু বলুন বা নিচের যেকোনো সাজেশনে ট্যাপ করুন', 'info');
      return;
    }
    onApplySearch(query.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-orange-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mic Pulse Animation */}
        <div className="pt-2">
          <div className="relative inline-flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-orange-500/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-rose-500/30 animate-pulse" />
              </>
            )}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl relative z-10 transition-transform ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-orange-500 scale-110'
                  : 'bg-slate-700'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : (
                <MicOff className="w-8 h-8" />
              )}
            </div>
          </div>
        </div>

        {/* Listening Status */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">
            {isListening ? '🎙️ শুনছি... বাংলায় বলুন' : 'বাংলা ভয়েস সার্চ'}
          </h3>
          <p className="text-xs text-slate-500">
            {hasSpeechSupport
              ? 'আপনার পছন্দের পণ্য বা ব্র্যান্ডের নাম স্পষ্ট করে বলুন'
              : 'আপনার ব্রাউজারে মাইক সাপোর্ট সীমিত, নিচের তালিকা থেকে বাছাই করুন'}
          </p>
        </div>

        {/* Live Transcript Display Box */}
        <div className="min-h-[50px] p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-center">
          <p className="text-sm font-bold text-slate-900 font-sans">
            {transcript ? (
              `"${transcript}"`
            ) : (
              <span className="text-slate-400 text-xs italic">
                {isListening ? 'কথা বলুন...' : 'মাইক চালু রয়েছে'}
              </span>
            )}
          </p>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="space-y-2 text-left">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-600" />
            <span>জনপ্রিয় ভয়েস কি-ওয়ার্ডসমূহ:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleVoiceQueries.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleConfirmSearch(item)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleConfirmSearch()}
            className="w-full py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>সার্চ ফলাফল দেখুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
