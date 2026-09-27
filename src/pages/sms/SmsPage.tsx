import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatters';
import { smsService } from '../../services/smsService';
import { SmsGatewayConfig, SmsTriggerConfig, SmsLogRecord, SmsGatewayProvider } from '../../types';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  History,
  Smartphone,
  Sparkles,
  Settings,
  Zap,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Info,
  Clock,
  Check,
} from 'lucide-react';

export const SmsPage: React.FC = () => {
  const { showToast } = useToast();

  // Active Tab: 'direct' | 'gateway' | 'triggers'
  const [activeTab, setActiveTab] = useState<'direct' | 'gateway' | 'triggers'>('direct');

  // State from smsService
  const [gatewayConfig, setGatewayConfig] = useState<SmsGatewayConfig>(() =>
    smsService.getGatewayConfig()
  );
  const [triggerConfig, setTriggerConfig] = useState<SmsTriggerConfig>(() =>
    smsService.getTriggerConfig()
  );
  const [logs, setLogs] = useState<SmsLogRecord[]>(() => smsService.getLogs());

  // Direct SMS form
  const [recipient, setRecipient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('order_confirm');
  const [customMessage, setCustomMessage] = useState(
    'প্রিয় গ্রাহক, SmartShopX এ আপনার অর্ডারটি নিশ্চিত হয়েছে। ট্র্যাকিং কোড: SX-98421। সাথে থাকার জন্য ধন্যবাদ।'
  );
  const [isSending, setIsSending] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  // Template tags
  const availableTags = [
    { tag: '{customer_name}', label: 'ক্রেতার নাম' },
    { tag: '{order_no}', label: 'অর্ডার নং' },
    { tag: '{amount}', label: 'মোট টাকা' },
    { tag: '{due_amount}', label: 'বকেয়া টাকা' },
    { tag: '{shop_name}', label: 'দোকানের নাম' },
    { tag: '{courier_name}', label: 'কুরিয়ারের নাম' },
    { tag: '{tracking_id}', label: 'ট্র্যাকিং কোড' },
  ];

  const insertTagIntoMessage = (
    tag: string,
    field: keyof SmsTriggerConfig
  ) => {
    const currentVal = triggerConfig[field] as string;
    setTriggerConfig({
      ...triggerConfig,
      [field]: currentVal + ' ' + tag,
    });
  };

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplate(tplId);
    if (tplId === 'order_confirm') {
      setCustomMessage(
        'প্রিয় গ্রাহক, আপনার অর্ডারটি সফলভাবে নিশ্চিত হয়েছে। ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য।'
      );
    } else if (tplId === 'order_dispatched') {
      setCustomMessage(
        'প্রিয় গ্রাহক, আপনার পার্সেলটি কুরিয়ারে হস্তান্তর করা হয়েছে। খুব শীঘ্রই ডেলিভারি পাবেন।'
      );
    } else if (tplId === 'due_reminder') {
      setCustomMessage(
        'সম্মানিত গ্রাহক, আপনার পূর্বের ক্রয়ের বকেয়া টাকা পরিশোধের বিনীত অনুরোধ রইল। ধন্যবাদ।'
      );
    } else {
      setCustomMessage('');
    }
  };

  // Direct SMS Submit
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !customMessage.trim()) {
      showToast('মোবাইল নম্বর ও বার্তা উভয়টি আবশ্যক', 'warning');
      return;
    }

    setIsSending(true);
    const result = smsService.sendSms(
      recipient,
      customMessage,
      selectedTemplate === 'order_confirm'
        ? 'অর্ডার নিশ্চিতকরণ'
        : selectedTemplate === 'order_dispatched'
        ? 'কুরিয়ার বুকিং'
        : selectedTemplate === 'due_reminder'
        ? 'বকেয়া তাগাদা'
        : 'সরাসরি এসএমএস'
    );

    setIsSending(false);
    if (result.success) {
      setGatewayConfig(smsService.getGatewayConfig());
      setLogs(smsService.getLogs());
      showToast(`এসএমএস সফলভাবে পাঠানো হয়েছে: ${recipient}`, 'success');
      setRecipient('');
    } else {
      showToast(result.error || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // Gateway Save
  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    smsService.saveGatewayConfig(gatewayConfig);
    showToast('এসএমএস গেটওয়ে কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে', 'success');
  };

  // Test SMS
  const handleTestConnection = () => {
    if (!gatewayConfig.apiKey || !gatewayConfig.senderId) {
      showToast('API Key এবং Sender ID দেওয়া আবশ্যক', 'warning');
      return;
    }
    const testResult = smsService.sendSms(
      '01700000000',
      `SmartShopX [${gatewayConfig.provider}]: টেস্ট কানেকশন ভেরিফিকেশন সফল হয়েছে!`,
      'টেস্ট এসএমএস'
    );
    if (testResult.success) {
      setGatewayConfig(smsService.getGatewayConfig());
      setLogs(smsService.getLogs());
      showToast(`${gatewayConfig.provider} গেটওয়ে সংযোগ সফল ও একটিভ আছে!`, 'success');
    } else {
      showToast(testResult.error || 'টেস্ট কানেকশন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Triggers Save
  const handleSaveTriggers = (e: React.FormEvent) => {
    e.preventDefault();
    smsService.saveTriggerConfig(triggerConfig);
    showToast('স্বয়ংক্রিয় এসএমএস ট্রিগার ও টেমপ্লেট সফলভাবে আপডেট হয়েছে', 'success');
  };

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (!logFilter.trim()) return true;
    const q = logFilter.toLowerCase();
    return (
      l.recipient.includes(q) ||
      l.message.toLowerCase().includes(q) ||
      l.templateType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>এসএমএস ও নোটিফিকেশন সেন্টার</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            অর্ডার নিশ্চিতকরণ, কুরিয়ার ট্র্যাকিং এবং বকেয়া তাগাদার স্বয়ংক্রিয় বাংলা এসএমএস সার্ভিস
          </p>
        </div>

        {/* Balance Card */}
        <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-2xl px-4 py-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold block text-slate-500">এসএমএস ব্যালেন্স</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-black text-emerald-700">
                {gatewayConfig.balance}
              </span>
              <span className="text-[11px] text-slate-400">টি অবশিষ্ট</span>
            </div>
          </div>
          <button
            onClick={() => {
              setGatewayConfig({ ...gatewayConfig, balance: gatewayConfig.balance + 100 });
              smsService.saveGatewayConfig({ ...gatewayConfig, balance: gatewayConfig.balance + 100 });
              showToast('১০০ টি এসএমএস ক্রেডিট রিচার্জ করা হয়েছে', 'success');
            }}
            className="ml-2 px-2 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            + রিচার্জ
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('direct')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'direct'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>সরাসরি মেসেজ ও হিস্ট্রি</span>
        </button>

        <button
          onClick={() => setActiveTab('triggers')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'triggers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>স্বয়ংক্রিয় ট্রিগার ও টেমপ্লেট</span>
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'gateway'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>গেটওয়ে এপিআই সেটিংস</span>
        </button>
      </div>

      {/* Tab 1: Direct SMS & History */}
      {activeTab === 'direct' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Send SMS Box */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>একক এসএমএস পাঠান (Send Instant SMS)</span>
            </h3>

            <form onSubmit={handleSendSms} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রেডিমেড টেমপ্লেট বাছাই করুন
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="order_confirm">অর্ডার নিশ্চিতকরণ (Order Confirm)</option>
                  <option value="order_dispatched">কুরিয়ার হস্তান্তর (Dispatched)</option>
                  <option value="due_reminder">বকেয়া তাগাদা (Due Reminder)</option>
                  <option value="custom">কাস্টম মেসেজ (Custom SMS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গ্রাহকের মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  এসএমএস মেসেজ বডি (বাংলা/ইংরেজি) *
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>অক্ষর সংখ্যা: {customMessage.length}</span>
                  <span>
                    খরচ: {Math.ceil(customMessage.length / 70) || 1} ক্রেডিট ({gatewayConfig.provider})
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSending}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full"
              >
                {isSending ? 'পাঠানো হচ্ছে...' : 'এসএমএস পাঠান'}
              </Button>
            </form>
          </div>

          {/* SMS History */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>প্রেরিত এসএমএস লগ ({filteredLogs.length})</span>
              </h3>
              <input
                type="text"
                placeholder="নম্বর বা টেক্সট খুঁজুন..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-48 bg-slate-50"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  কোনো প্রেরিত এসএমএস পাওয়া যায়নি।
                </div>
              ) : (
                filteredLogs.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{h.recipient}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-mono">
                          {h.provider}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {h.status}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">{h.message}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>{h.templateType}</span>
                      <span className="font-mono">{formatDateTime(h.sentAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Auto Triggers & Templates */}
      {activeTab === 'triggers' && (
        <form onSubmit={handleSaveTriggers} className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3 text-emerald-900 text-xs leading-relaxed">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-0.5">ডায়নামিক ট্যাগ ব্যবহারের নিয়ম:</p>
              <p className="text-emerald-800">
                মেসেজের ভেতরে নিচে দেওয়া যেকোনো ট্যাগে ক্লিক করলে তা স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট অর্ডারের তথ্য
                দিয়ে প্রতিস্থাপিত হয়ে গ্রাহকের কাছে এসএমএস পৌঁছে যাবে।
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {availableTags.map((t) => (
                  <span
                    key={t.tag}
                    className="bg-white border border-emerald-300 text-emerald-800 px-2 py-1 rounded-lg text-[11px] font-mono font-medium shadow-2xs"
                  >
                    {t.tag} ({t.label})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Order Confirmation */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">১. নতুন অর্ডার নিশ্চিতকরণ এসএমএস</h4>
                  <p className="text-[11px] text-slate-500">অর্ডার স্ট্যাটাস Confirmed হলে ট্রিগার হবে</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerConfig.onOrderConfirm}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, onOrderConfirm: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <textarea
                rows={3}
                value={triggerConfig.orderConfirmTpl}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, orderConfirmTpl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <div className="flex flex-wrap gap-1">
                {['{customer_name}', '{order_no}', '{amount}', '{shop_name}'].map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => insertTagIntoMessage(tg, 'orderConfirmTpl')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    +{tg}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Courier Handover */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">২. কুরিয়ার বুকিং ও ট্র্যাকিং এসএমএস</h4>
                  <p className="text-[11px] text-slate-500">Steadfast/Pathao/RedX এ বুকিং দিলে ট্রিগার হবে</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerConfig.onCourierDispatch}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, onCourierDispatch: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <textarea
                rows={3}
                value={triggerConfig.courierDispatchTpl}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, courierDispatchTpl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <div className="flex flex-wrap gap-1">
                {['{customer_name}', '{order_no}', '{courier_name}', '{tracking_id}'].map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => insertTagIntoMessage(tg, 'courierDispatchTpl')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    +{tg}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Order Delivered */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">৩. সফল ডেলিভারি নিশ্চিতকরণ এসএমএস</h4>
                  <p className="text-[11px] text-slate-500">পার্সেল কুরিয়ার ডেলিভারড হিসেবে মার্ক হলে ট্রিগার</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerConfig.onOrderDelivered}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, onOrderDelivered: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <textarea
                rows={3}
                value={triggerConfig.orderDeliveredTpl}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, orderDeliveredTpl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <div className="flex flex-wrap gap-1">
                {['{customer_name}', '{order_no}', '{shop_name}'].map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => insertTagIntoMessage(tg, 'orderDeliveredTpl')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    +{tg}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. POS Sale Receipt */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">৪. পিওএস মেমো এসএমএস (POS Instant Bill)</h4>
                  <p className="text-[11px] text-slate-500">দোকানে কাউন্টারে বিক্রয় শেষে স্বয়ংক্রিয় এসএমএস</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerConfig.onPosSale}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, onPosSale: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <textarea
                rows={3}
                value={triggerConfig.posSaleTpl}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, posSaleTpl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <div className="flex flex-wrap gap-1">
                {['{customer_name}', '{order_no}', '{amount}', '{shop_name}'].map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => insertTagIntoMessage(tg, 'posSaleTpl')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    +{tg}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Due Reminder */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">৫. বাকি টাকা / বকেয়া তাগাদা এসএমএস</h4>
                  <p className="text-[11px] text-slate-500">বকেয়া খাতা থেকে গ্রাহককে তাগাদা পাঠাতে ব্যবহৃত হয়</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggerConfig.onDueReminder}
                    onChange={(e) =>
                      setTriggerConfig({ ...triggerConfig, onDueReminder: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <textarea
                rows={2}
                value={triggerConfig.dueReminderTpl}
                onChange={(e) =>
                  setTriggerConfig({ ...triggerConfig, dueReminderTpl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <div className="flex flex-wrap gap-1">
                {['{customer_name}', '{due_amount}', '{shop_name}'].map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => insertTagIntoMessage(tg, 'dueReminderTpl')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    +{tg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md">
              ট্রিগার ও টেমপ্লেট পরিবর্তন সেভ করুন
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Gateway Setup */}
      {activeTab === 'gateway' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>বাংলাদেশি এসএমএস গেটওয়ে ইন্টিগ্রেশন (SMS Gateway API)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Greenweb, Onnorokom, MimSMS, SSL Wireless বা Elitbuzz এর API Key যুক্ত করে যেকোনো সময় লাইভ এসএমএস
              চালু করুন
            </p>
          </div>

          <form onSubmit={handleSaveGateway} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  এসএমএস প্রোভাইডার নির্বাচন করুন *
                </label>
                <select
                  value={gatewayConfig.provider}
                  onChange={(e) =>
                    setGatewayConfig({
                      ...gatewayConfig,
                      provider: e.target.value as SmsGatewayProvider,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Greenweb">Greenweb SMS (গ্রীনওয়েব বিডি)</option>
                  <option value="Onnorokom">Onnorokom SMS (অন্যরকম এসএমএস)</option>
                  <option value="MimSMS">MimSMS Gateway</option>
                  <option value="SSLWireless">SSL Wireless Push API</option>
                  <option value="Elitbuzz">Elitbuzz Technologies</option>
                  <option value="BulkSMSBD">BulkSMSBD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  অনুমোদিত সেন্ডার আইডি (Sender ID / Masking) *
                </label>
                <input
                  type="text"
                  value={gatewayConfig.senderId}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, senderId: e.target.value })}
                  placeholder="যেমন: SMARTSHOP বা 8809612..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  প্রোভাইডারের API Key / Token *
                </label>
                <input
                  type="password"
                  value={gatewayConfig.apiKey}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                  placeholder="আপনার গোপন API Key লিখুন"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Client ID / Username (প্রযোজ্য ক্ষেত্রে)
                </label>
                <input
                  type="text"
                  value={gatewayConfig.clientId || ''}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, clientId: e.target.value })}
                  placeholder="ঐচ্ছিক ক্লায়েন্ট আইডি"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  গেটওয়ে সংযোগ স্ট্যাটাস
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>সক্রিয় ও কানেক্টেড (Active API Endpoint)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleTestConnection}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                টেস্ট কানেকশন পাঠান
              </button>

              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                গেটওয়ে তথ্য সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
