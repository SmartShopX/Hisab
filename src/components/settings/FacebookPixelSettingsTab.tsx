import React, { useState } from 'react';
import { FacebookPixelSettings, PixelEventLogRecord } from '../../types';
import { facebookPixelService } from '../../services/facebookPixelService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Activity,
  ShieldCheck,
  Zap,
  KeyRound,
  Sliders,
  Send,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Code,
  Layers,
} from 'lucide-react';

export const FacebookPixelSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<FacebookPixelSettings>(() =>
    facebookPixelService.getSettings()
  );
  const [logs, setLogs] = useState<PixelEventLogRecord[]>(() =>
    facebookPixelService.getLogs()
  );
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    facebookPixelService.saveSettings(settings);
    showToast('ফেসবুক পিক্সেল ও কনভার্সন এপিআই কনফিগারেশন সেভ হয়েছে', 'success');
  };

  const handleSendTest = (type: 'PageView' | 'AddToCart' | 'Purchase') => {
    setIsSendingTest(true);
    facebookPixelService.sendTestEvent(type);
    setLogs(facebookPixelService.getLogs());
    setIsSendingTest(false);
    showToast(`টেস্ট ${type} ইভেন্ট সফলভাবে ব্রাউজার ও CAPI সার্ভারে পাঠানো হয়েছে`, 'success');
  };

  const handleClearLogs = () => {
    facebookPixelService.clearLogs();
    setLogs([]);
    showToast('পিক্সেল ইভেন্ট লগ মুছে ফেলা হয়েছে', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Meta Pixel & Conversions API (CAPI) ট্র্যাকিং
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
              আইওএস ১৪+ ও অ্যাড-ব্লকার সত্ত্বেও ফেসবুক বিজ্ঞাপনের আরও নিখুঁত ডেটা পেতে ব্রাউজার পিক্সেল ও সার্ভার
              কনভার্সন এপিআই যৌথভাবে পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              settings.trackingActive && settings.pixelId
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                settings.trackingActive && settings.pixelId
                  ? 'bg-emerald-600 animate-pulse'
                  : 'bg-amber-600'
              }`}
            />
            {settings.trackingActive && settings.pixelId ? 'ট্র্যাকিং সচল আছে' : 'কনফিগারেশন বাকি'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Credentials */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">পিক্সেল আইডি ও এক্সেস টোকেন</h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.trackingActive}
                  onChange={(e) =>
                    setSettings({ ...settings, trackingActive: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Meta Pixel ID *
              </label>
              <input
                type="text"
                value={settings.pixelId}
                onChange={(e) => setSettings({ ...settings, pixelId: e.target.value })}
                placeholder="যেমন: 984128912847192"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Facebook Events Manager থেকে প্রাপ্ত ১৬ ডিজিটের পিক্সেল আইডি
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Conversions API Access Token
              </label>
              <input
                type="password"
                value={settings.accessToken}
                onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                placeholder="EAAG..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Events Manager &gt; Settings &gt; Conversions API &gt; Generate Access Token
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Test Event Code (ঐচ্ছিক - ভেরিফিকেশন কোড)
              </label>
              <input
                type="text"
                value={settings.testEventCode}
                onChange={(e) => setSettings({ ...settings, testEventCode: e.target.value })}
                placeholder="যেমন: TEST88219"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Events Manager এর &apos;Test Events&apos; ট্যাবে লাইভ ইভেন্ট দেখতে এই কোড দিন
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={settings.conversionApiStatus}
                  onChange={(e) =>
                    setSettings({ ...settings, conversionApiStatus: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>সার্ভার কনভার্সন এপিআই (CAPI) সক্রিয় রাখুন (Duplicate Prevention সহ)</span>
              </label>
            </div>
          </div>

          {/* Card 2: Event Triggers */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">ই-কমার্স ইভেন্ট ট্র্যাকিং নিয়ন্ত্রণ</h4>
            </div>

            <p className="text-xs text-slate-500">
              কোন কোন গ্রাহক কার্যকলাপ ফেসবুকে পাঠাতে চান তা নির্ধারণ করুন:
            </p>

            <div className="space-y-3 pt-1">
              {[
                {
                  id: 'trackPageView',
                  title: 'PageView (পেজ ভিউ)',
                  desc: 'গ্রাহক যখন স্টোর বা ল্যান্ডিং পেজে প্রবেশ করবেন',
                  checked: settings.trackPageView,
                },
                {
                  id: 'trackViewContent',
                  title: 'ViewContent (পণ্য দর্শন)',
                  desc: 'নির্দিষ্ট পণ্যের বিবরণ ও ছবি দেখার সময়',
                  checked: settings.trackViewContent,
                },
                {
                  id: 'trackAddToCart',
                  title: 'AddToCart (কার্টে পণ্য যোগ)',
                  desc: 'গ্রাহক পণ্য ব্যাগে বা কার্টে যুক্ত করলে',
                  checked: settings.trackAddToCart,
                },
                {
                  id: 'trackInitiateCheckout',
                  title: 'InitiateCheckout (চেকআউট শুরু)',
                  desc: 'অর্ডার ফর্ম বা চেকআউট পেজে পৌঁছালে',
                  checked: settings.trackInitiateCheckout,
                },
                {
                  id: 'trackPurchase',
                  title: 'Purchase (অর্ডার সম্পন্ন)',
                  desc: 'অর্ডার নিশ্চিত হলে মূল্য ও আইটেম সহ ক্রয় ডাটা প্রেরণ',
                  checked: settings.trackPurchase,
                },
              ].map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{ev.title}</span>
                    <span className="text-[11px] text-slate-500">{ev.desc}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ev.checked}
                      onChange={(e) =>
                        setSettings({ ...settings, [ev.id]: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md">
            পিক্সেল কনফিগারেশন সংরক্ষণ করুন
          </Button>
        </div>
      </form>

      {/* Test Event Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>লাইভ টেস্ট ইভেন্ট সিমুলেটর (Live Test Dispatcher)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              বাটনগুলোতে ক্লিক করে আপনার ফেসবুক পিক্সেল সঠিক তথ্য গ্রহণ করছে কি না তাৎক্ষণিক যাচাই করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => handleSendTest('PageView')}
              variant="outline"
              size="sm"
              disabled={isSendingTest}
            >
              টেস্ট PageView
            </Button>
            <Button
              type="button"
              onClick={() => handleSendTest('AddToCart')}
              variant="outline"
              size="sm"
              disabled={isSendingTest}
            >
              টেস্ট AddToCart
            </Button>
            <Button
              type="button"
              onClick={() => handleSendTest('Purchase')}
              variant="secondary"
              size="sm"
              disabled={isSendingTest}
            >
              টেস্ট Purchase (৳১,২৫০)
            </Button>
          </div>
        </div>

        {/* Live Logs Stream */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              সাম্প্রতিক ডিসপ্যাচ করা ইভেন্ট লগ ({logs.length})
            </span>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                লগ পরিষ্কার করুন
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50 text-xs font-mono">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-sans text-xs">
                কোনো ইভেন্ট লগ নেই। টেস্ট বাটন চেপে ইভেন্ট পাঠান।
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700">{log.eventName}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                        {log.channel}
                      </span>
                      {log.value && (
                        <span className="text-[11px] font-bold text-emerald-700">
                          ৳{log.value.toLocaleString('bn-BD')} {log.currency}
                        </span>
                      )}
                    </div>
                    {log.contentName && (
                      <p className="text-[11px] text-slate-600 font-sans">{log.contentName}</p>
                    )}
                  </div>

                  <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                    <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-sans font-semibold">
                      {log.status}
                    </span>
                    <div className="text-[10px]">{formatDateTime(log.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
