import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { VoiceGatewayConfig } from '../../types';
import { voiceCallService } from '../../services/voiceCallService';
import { useToast } from '../../context/ToastContext';
import { Radio, ShieldCheck, Clock, Phone, Settings2, Sliders } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<VoiceGatewayConfig>(() =>
    voiceCallService.getGatewayConfig()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    voiceCallService.saveGatewayConfig(config);
    showToast('ভয়েস ও টেলিকম গেটওয়ে সেটিংস সংরক্ষিত হয়েছে', 'success');
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ভয়েস গেটওয়ে ও অটো শিডিউলার সেটিংস"
      subtitle="টেলিকম ওবিডি কানেকশন, কলার আইডি এবং স্বয়ংক্রিয় কল রুলস"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            টেলিকম ভয়েস ওবিডি সার্ভিস প্রোভাইডার
          </label>
          <select
            value={config.provider}
            onChange={(e) =>
              setConfig({ ...config, provider: e.target.value as any })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="browser_ai">
              ইন-অ্যাপ ব্রাউজার এআই ভয়েস ইঞ্জিন (Web Speech Synthesizer)
            </option>
            <option value="bangladesh_telecom_obd">
              বাংলাদেশ লোকাল টেলিকম ওবিডি (Banglalink/Grameenphone OBD)
            </option>
            <option value="greenweb">গ্রিনওয়েব ভয়েস গেটওয়ে (Greenweb Voice BD)</option>
            <option value="alphanet">আলফানেট ভয়েস ব্রডকাস্টিং (Alpha Net BD)</option>
            <option value="twilio">টুইলিও ক্লাউড ভয়েস এপিআই (Twilio Cloud API)</option>
          </select>
        </div>

        {/* Caller ID and API Key */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কলার আইডি (Caller ID / Display No.)
            </label>
            <input
              type="text"
              value={config.callerId}
              onChange={(e) => setConfig({ ...config, callerId: e.target.value })}
              placeholder="01700-000000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গেটওয়ে এপিআই কি (API Key / Token)
            </label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Daily Auto Call Rules */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                প্রতিশ্রুতি তারিখে দৈনিক অটো কল চালু
              </span>
              <span className="text-[11px] text-slate-500 block">
                নির্দিষ্ট দিনে বকেয়া গ্রাহকদের স্বয়ংক্রিয়ভাবে কল করা হবে
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.autoCallEnabled}
                onChange={(e) =>
                  setConfig({ ...config, autoCallEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                দৈনিক অটো কলের সময়
              </label>
              <select
                value={config.autoCallDailyHour}
                onChange={(e) =>
                  setConfig({ ...config, autoCallDailyHour: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value={9}>সকাল ৯:০০ টা</option>
                <option value={10}>সকাল ১০:০০ টা (স্ট্যান্ডার্ড)</option>
                <option value={11}>সকাল ১১:০০ টা</option>
                <option value={15}>বিকাল ৩:০০ টা</option>
                <option value={16}>বিকাল ৪:০০ টা</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ব্যস্ত থাকলে রি-ট্রাই সংখ্যা
              </label>
              <select
                value={config.maxRetries}
                onChange={(e) =>
                  setConfig({ ...config, maxRetries: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value={1}>১ বার রি-ট্রাই</option>
                <option value={2}>২ বার রি-ট্রাই</option>
                <option value={3}>৩ বার রি-ট্রাই</option>
              </select>
            </div>
          </div>
        </div>

        {/* Merchant Numbers for IVR Key 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিকাশ মার্চেন্ট / পার্সোনাল নম্বর
            </label>
            <input
              type="text"
              value={config.bKashMerchantNumber || ''}
              onChange={(e) =>
                setConfig({ ...config, bKashMerchantNumber: e.target.value })
              }
              placeholder="018XXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              আইভিআরে ১ চাপলে এই নম্বরে পেমেন্ট এসএমএস যাবে
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              নগদ মার্চেন্ট / পার্সোনাল নম্বর
            </label>
            <input
              type="text"
              value={config.nagadMerchantNumber || ''}
              onChange={(e) =>
                setConfig({ ...config, nagadMerchantNumber: e.target.value })
              }
              placeholder="019XXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              বিকল্প নগদ পেমেন্ট রিসিভিং
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="primary" size="sm">
            সেটিংস সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};
