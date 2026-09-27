import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  VoiceCallCampaign,
  VoiceCampaignType,
  VoiceTargetAudience,
} from '../../types';
import { voiceCallService, DEFAULT_SCRIPTS } from '../../services/voiceCallService';
import { useToast } from '../../context/ToastContext';
import {
  Volume2,
  Sparkles,
  Calendar,
  Clock,
  Send,
  Users,
  CheckCircle2,
  Tag,
} from 'lucide-react';

interface NewVoiceCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customersCount?: number;
}

export const NewVoiceCampaignModal: React.FC<NewVoiceCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customersCount = 10,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [campaignType, setCampaignType] = useState<VoiceCampaignType>('due_reminder');
  const [targetAudience, setTargetAudience] = useState<VoiceTargetAudience>('due_customers_today');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [callTime, setCallTime] = useState('10:30 AM');
  const [autoTriggerOnPromiseDate, setAutoTriggerOnPromiseDate] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [voiceTone, setVoiceTone] = useState<'friendly' | 'formal' | 'urgent'>('friendly');
  const [scriptBangla, setScriptBangla] = useState(DEFAULT_SCRIPTS.due_friendly);
  const [ivrOptionsEnabled, setIvrOptionsEnabled] = useState(true);

  // Handle preset template select
  const handleSelectTemplate = (type: VoiceCampaignType) => {
    setCampaignType(type);
    if (type === 'due_reminder') {
      setScriptBangla(DEFAULT_SCRIPTS.due_friendly);
      setTargetAudience('due_customers_today');
      setAutoTriggerOnPromiseDate(true);
      setIvrOptionsEnabled(true);
    } else if (type === 'marketing_offer') {
      setScriptBangla(DEFAULT_SCRIPTS.marketing_offer);
      setTargetAudience('all_customers');
      setAutoTriggerOnPromiseDate(false);
      setIvrOptionsEnabled(false);
    } else {
      setScriptBangla(DEFAULT_SCRIPTS.welcome_greeting);
      setTargetAudience('all_customers');
      setAutoTriggerOnPromiseDate(false);
      setIvrOptionsEnabled(false);
    }
  };

  const handleInsertToken = (token: string) => {
    setScriptBangla((prev) => `${prev} ${token}`);
  };

  const handleTestAudio = () => {
    const preview = voiceCallService.interpolateScript(scriptBangla, {
      customerName: 'জনাব রহিম',
      dueAmount: 3500,
      promiseDate: 'আজ',
    });
    voiceCallService.speakBangla(preview, undefined, { gender: voiceGender });
    showToast('বাংলা এআই ভয়েস প্রিভিউ প্লে হচ্ছে', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scriptBangla.trim()) {
      showToast('ক্যাম্পেইনের নাম ও ভয়েস স্ক্রিপ্ট পূরণ করুন', 'warning');
      return;
    }

    voiceCallService.saveCampaign({
      title: title.trim(),
      campaignType,
      targetAudience,
      scheduledDate,
      callTime,
      autoTriggerOnPromiseDate,
      scriptBangla: scriptBangla.trim(),
      voiceGender,
      voiceTone,
      ivrOptionsEnabled,
      status: 'active',
      totalTargets: customersCount,
      completedCalls: 0,
      answeredCalls: 0,
      failedCalls: 0,
    });

    onSuccess();
    showToast('নতুন এআই ভয়েস কল ক্যাম্পেইন সফলভাবে তৈরি হয়েছে!', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        voiceCallService.stopSpeaking();
        onClose();
      }}
      title="নতুন এআই ভয়েস কল ক্যাম্পেইন তৈরি করুন"
      subtitle="স্বয়ংক্রিয় বকেয়া তাগাদা বা মার্কেটিং ভয়েস ব্রডকাস্ট শিডিউল"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campaign Title & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্যাম্পেইনের শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: আজকের অটো বকেয়া তাগাদা বা ঈদ অফার"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্যাম্পেইনের উদ্দেশ্য (Type)
            </label>
            <select
              value={campaignType}
              onChange={(e) => handleSelectTemplate(e.target.value as VoiceCampaignType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="due_reminder">বকেয়া পাওনা টাকা তাগিদ (Due Collection)</option>
              <option value="marketing_offer">মার্কেটিং ও বিক্রয় অফার (Sales Marketing)</option>
              <option value="welcome_greeting">শুভেচ্ছা ও ধন্যবাদ (Appreciation)</option>
              <option value="general_announcement">জরুরি সাধারণ ঘোষণা (Announcement)</option>
            </select>
          </div>
        </div>

        {/* Target Audience & Auto Date Trigger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              টার্গেট অডিয়েন্স (কাদের কল যাবে)
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as VoiceTargetAudience)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="due_customers_today">
                আজকের প্রতিশ্রুতি তারিখ যাদের (Promise Date Today)
              </option>
              <option value="overdue_customers">সকল মেয়াদোত্তীর্ণ বাকিদার (All Overdue)</option>
              <option value="all_customers">দোকানের সকল গ্রাহক (All Customers)</option>
              <option value="wholesale_only">শুধুমাত্র পাইকারি গ্রাহক (Wholesale Only)</option>
              <option value="retail_only">শুধুমাত্র খুচরা গ্রাহক (Retail Only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">কলের সময়</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <input
                type="text"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                placeholder="10:30 AM"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Auto Promise Trigger Toggle */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-950 block">
              স্বয়ংক্রিয় প্রতিশ্রুতি তারিখ শিডিউলার (Auto Trigger)
            </span>
            <span className="text-[11px] text-emerald-700 block">
              গ্রাহকের বাকি পরিশোধের প্রতিশ্রুতি তারিখ এলে সিস্টেম নিজ থেকেই স্বয়ংক্রিয় কল করবে
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoTriggerOnPromiseDate}
              onChange={(e) => setAutoTriggerOnPromiseDate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Voice Gender & Tone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ভয়েস চরিত্র</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVoiceGender('female')}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  voiceGender === 'female'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                নারী কণ্ঠ (Female)
              </button>
              <button
                type="button"
                onClick={() => setVoiceGender('male')}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  voiceGender === 'male'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                পুরুষ কণ্ঠ (Male)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">কথোপকথনের সুর</label>
            <select
              value={voiceTone}
              onChange={(e) => setVoiceTone(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="friendly">বিনম্র ও মিষ্টি (Friendly)</option>
              <option value="formal">আনুষ্ঠানিক ও ব্যবসায়িক (Formal)</option>
              <option value="urgent">জরুরি ও কড়া তাগাদা (Urgent)</option>
            </select>
          </div>
        </div>

        {/* Script & Variables */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">ভয়েস কল স্ক্রিপ্ট (বাংলা) *</label>
            <button
              type="button"
              onClick={handleTestAudio}
              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>এআই ভয়েস প্রিভিউ শুনুন</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={scriptBangla}
            onChange={(e) => setScriptBangla(e.target.value)}
            placeholder="গ্রাহকের কাছে যা যা বলা হবে তা বাংলায় লিখুন..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            required
          />

          {/* Quick dynamic tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-slate-400 font-semibold">ডায়নামিক ট্যাগ:</span>
            {[
              { label: '{{customer_name}}', name: 'নাম' },
              { label: '{{due_amount}}', name: 'বকেয়া টাকা' },
              { label: '{{shop_name}}', name: 'দোকানের নাম' },
              { label: '{{promise_date}}', name: 'প্রতিশ্রুতি তারিখ' },
              { label: '{{payment_number}}', name: 'বিকাশ নম্বর' },
            ].map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleInsertToken(tag.label)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                + {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* IVR Keypad Option Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              ইন্টারেক্টিভ আইভিআর কী-প্রেস অপশন
            </span>
            <span className="text-[11px] text-slate-500 block">
              ১ চাপলে বিকাশ নম্বর যাবে, ২ চাপলে ৩ দিন সময় বাড়বে, ৩ চাপলে কথা বলবে
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={ivrOptionsEnabled}
              onChange={(e) => setIvrOptionsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
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
            বাতিল
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
            ক্যাম্পেইন চালু করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
