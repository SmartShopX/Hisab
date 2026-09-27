import React, { useState, useMemo } from 'react';
import { Customer, VoiceCallCampaign, VoiceCallLog } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { voiceCallService, DEFAULT_SCRIPTS } from '../../services/voiceCallService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { VoiceDialerModal } from '../../components/voice/VoiceDialerModal';
import { NewVoiceCampaignModal } from '../../components/voice/NewVoiceCampaignModal';
import { VoiceSettingsModal } from '../../components/voice/VoiceSettingsModal';
import {
  PhoneCall,
  Phone,
  Radio,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Settings,
  Plus,
  Play,
  Volume2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  Search,
  Filter,
  BarChart3,
  Flame,
  CreditCard,
  Building,
} from 'lucide-react';

export const VoiceCallsPage: React.FC = () => {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());
  const [campaigns, setCampaigns] = useState<VoiceCallCampaign[]>(() =>
    voiceCallService.getCampaigns()
  );
  const [logs, setLogs] = useState<VoiceCallLog[]>(() => voiceCallService.getLogs());

  const [activeTab, setActiveTab] = useState<'due_schedule' | 'marketing' | 'logs' | 'scripts'>(
    'due_schedule'
  );
  const [search, setSearch] = useState('');

  // Modals
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [activeCustomerForCall, setActiveCustomerForCall] = useState<Customer | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Batch Auto Call state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const refreshData = () => {
    setCustomers(DataStore.getCustomers());
    setCampaigns(voiceCallService.getCampaigns());
    setLogs(voiceCallService.getLogs());
  };

  // Customers who should receive call today
  const dueCustomersToday = useMemo(() => {
    return voiceCallService.getCustomersDueToday(customers);
  }, [customers]);

  // Key Metrics
  const metrics = useMemo(() => {
    const totalScheduled = dueCustomersToday.length;
    const answeredLogs = logs.filter((l) => l.status === 'answered');
    const answerRate = logs.length > 0 ? Math.round((answeredLogs.length / logs.length) * 100) : 0;
    const totalDueTargeted = dueCustomersToday.reduce((sum, c) => sum + c.totalDue, 0);
    const ivrKeyCount = logs.filter((l) => l.ivrKeyPressed).length;

    return {
      totalScheduled,
      answerRate,
      totalDueTargeted,
      ivrKeyCount,
      totalLogs: logs.length,
    };
  }, [dueCustomersToday, logs]);

  // Run Batch Auto Dial
  const handleStartBatchCall = async () => {
    if (dueCustomersToday.length === 0) {
      showToast('আজকে কল করার মতো কোনো বকেয়া গ্রাহক নেই', 'info');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: dueCustomersToday.length });

    for (let i = 0; i < dueCustomersToday.length; i++) {
      const cust = dueCustomersToday[i];
      setBatchProgress({ current: i + 1, total: dueCustomersToday.length });

      // Simulate network call duration
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const isAnswered = Math.random() > 0.15; // 85% answer rate
      const ivrChoice = isAnswered && Math.random() > 0.4 ? (Math.random() > 0.5 ? '1' : '2') : undefined;

      voiceCallService.addLog({
        customerId: cust.id,
        customerName: cust.name,
        customerMobile: cust.mobile,
        callType: 'due_reminder',
        dueAmount: cust.totalDue,
        promiseDate: cust.promiseDate,
        durationSeconds: isAnswered ? Math.floor(Math.random() * 25) + 20 : 0,
        status: isAnswered ? 'answered' : 'busy',
        ivrKeyPressed: ivrChoice as any,
        ivrResponseText:
          ivrChoice === '1'
            ? 'বিকাশ নম্বর চেয়েছে (Key 1)'
            : ivrChoice === '2'
            ? '৩ দিন সময় বাড়িয়েছে (Key 2)'
            : undefined,
        notes: isAnswered
          ? 'স্বয়ংক্রিয় ব্যাচ ভয়েস কল সফল'
          : 'লাইন ব্যস্ত ছিল',
      });
    }

    setIsBatchRunning(false);
    refreshData();
    showToast(`${dueCustomersToday.length} জন বকেয়া গ্রাহককে অটো ভয়েস কল সম্পন্ন হয়েছে!`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              এআই ভয়েস কল ও অটো তাগাদা হাব (AI Voice Call Hub)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              BD Robocall / OBD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            নির্ধারিত প্রতিশ্রুতি তারিখে অটো কল তাগিদ, ইন্টারেক্টিভ আইভিআর এবং বিজনেস মার্কেটিং ব্রডকাস্ট
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="ভয়েস গেটওয়ে ও সেটিংস"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>গেটওয়ে রুলস</span>
          </button>

          {/* New Campaign Button */}
          <Button
            onClick={() => setIsNewCampaignOpen(true)}
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            নতুন ক্যাম্পেইন
          </Button>

          {/* Run Batch Calls Button */}
          <Button
            onClick={handleStartBatchCall}
            variant="primary"
            size="md"
            disabled={isBatchRunning || dueCustomersToday.length === 0}
            leftIcon={
              isBatchRunning ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <PhoneCall className="w-4 h-4" />
              )
            }
          >
            {isBatchRunning
              ? `কল চলছে (${batchProgress.current}/${batchProgress.total})...`
              : 'আজকের সকলকে অটো কল'}
          </Button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">আজকের তাগাদা শিডিউল</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
            {metrics.totalScheduled} জন
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            টার্গেট বকেয়া: {formatCurrency(metrics.totalDueTargeted)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">কল গ্রহণ হার (Answer Rate)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-emerald-600 font-mono mt-1 block">
            {metrics.answerRate}%
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            মোট সম্পন্ন কল: {metrics.totalLogs} টি
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">আইভিআর রেসপন্স (DTMF)</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <span className="text-xl font-bold text-blue-700 font-mono mt-1 block">
            {metrics.ivrKeyCount} বার
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">গ্রাহক ১ বা ২ কী চেপেছেন</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">অটো ডায়ালার স্ট্যাটাস</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            সক্রিয় (সকাল ১০:০০)
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">প্রতিশ্রুতি দিনে অটো কল</span>
        </div>
      </div>

      {/* Batch In Progress Banner */}
      {isBatchRunning && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                স্বয়ংক্রিয় ব্যাচ ভয়েস কলিং চলছে...
              </h4>
              <p className="text-[11px] text-emerald-700">
                {batchProgress.current} / {batchProgress.total} জন গ্রাহকের কাছে কল ডেলিভারি হচ্ছে
              </p>
            </div>
          </div>

          <div className="w-32 bg-emerald-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('due_schedule')}
          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'due_schedule'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>আজকের শিডিউল ও তাগাদা ({dueCustomersToday.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'marketing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-indigo-600" />
          <span>মার্কেটিং ক্যাম্পেইনসমূহ ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
          <span>কল হিস্ট্রি ও আইভিআর রেসপন্স ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'scripts'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>ভয়েস স্ক্রিপ্ট লাইব্রেরি</span>
        </button>
      </div>

      {/* TAB 1: Scheduled Due Calls */}
      {activeTab === 'due_schedule' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  আজকের অটো বকেয়া কল তাগাদা তালিকা
                </h3>
                <p className="text-[11px] text-slate-500">
                  যাদের টাকা দেওয়ার প্রতিশ্রুতি তারিখ (Promise Date) আজ অথবা পূর্বে অতিবাহিত হয়েছে
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                মোট প্রাপ্য: {formatCurrency(metrics.totalDueTargeted)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">গ্রাহকের নাম ও মোবাইল</th>
                    <th className="py-3 px-4">গ্রাহক ধরন</th>
                    <th className="py-3 px-4">বকেয়ার পরিমাণ</th>
                    <th className="py-3 px-4">প্রতিশ্রুতি তারিখ</th>
                    <th className="py-3 px-4">বকেয়ার বয়স (Aging)</th>
                    <th className="py-3 px-4 text-center">এআই ভয়েস কল অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dueCustomersToday.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                        <p className="font-semibold text-slate-700">
                          আজকে কোনো গ্রাহকের বকেয়া তাগাদা কল বাকি নেই!
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          নতুন গ্রাহকের প্রতিশ্রুতি তারিখ সেট করতে গ্রাহক তালিকা পেজ ভিজিট করুন
                        </p>
                      </td>
                    </tr>
                  ) : (
                    dueCustomersToday.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{c.mobile}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                            {c.customerType || 'খুচরা'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                            {formatCurrency(c.totalDue)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-purple-700 font-medium font-mono text-[11px] block">
                            📅 {c.promiseDate || 'আজ নির্ধারিত'}
                          </span>
                          {c.reminderNotes && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                              {c.reminderNotes}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (c.oldestDueDays || 0) > 45
                                ? 'bg-rose-100 text-rose-800'
                                : (c.oldestDueDays || 0) > 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {(c.oldestDueDays || 0) > 0
                              ? `${c.oldestDueDays} দিন পুরনো`
                              : 'সাম্প্রতিক'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            onClick={() => {
                              setActiveCustomerForCall(c);
                              setIsDialerOpen(true);
                            }}
                            variant="primary"
                            size="sm"
                            leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                          >
                            এআই কল করুন
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Marketing Campaigns */}
      {activeTab === 'marketing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        camp.campaignType === 'due_reminder'
                          ? 'bg-rose-100 text-rose-800'
                          : camp.campaignType === 'marketing_offer'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {camp.campaignType === 'due_reminder'
                        ? 'বকেয়া তাগাদা'
                        : camp.campaignType === 'marketing_offer'
                        ? 'মার্কেটিং অফার'
                        : 'সাধারণ ঘোষণা'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{camp.title}</h4>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      camp.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : camp.status === 'scheduled'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {camp.status === 'active'
                      ? 'সক্রিয়'
                      : camp.status === 'scheduled'
                      ? 'শিডিউল্ড'
                      : 'সমাপ্ত'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                  "{camp.scriptBangla}"
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">মোট টার্গেট</span>
                    <span className="font-bold font-mono text-slate-800">{camp.totalTargets} জন</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">কল রিসিভড</span>
                    <span className="font-bold font-mono text-emerald-600">{camp.answeredCalls} জন</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ব্যস্ত/ফেইল্ড</span>
                    <span className="font-bold font-mono text-rose-600">{camp.failedCalls} জন</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => voiceCallService.speakBangla(camp.scriptBangla)}
                    className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>অডিও শুনুন</span>
                  </button>

                  <Button
                    onClick={() => {
                      showToast(`"${camp.title}" ক্যাম্পেইনের সকল কল শিডিউল করা হয়েছে`, 'success');
                    }}
                    variant="outline"
                    size="sm"
                    leftIcon={<PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    এখনই ডায়াল করুন
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Logs & IVR Analytics */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">কল হিস্ট্রি ও আইভিআর প্রেস রিপোর্ট</h3>
              <p className="text-[11px] text-slate-500">
                গ্রাহকের কল রিসিভ স্ট্যাটাস, কথা বলার সময় ও কী-প্যাড ইনপুট রিপোর্ট
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-4">গ্রাহক ও মোবাইল</th>
                  <th className="py-3 px-4">কলের ধরন</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4">সময়কাল</th>
                  <th className="py-3 px-4">আইভিআর রেসপন্স (Keypad)</th>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      কোনো কল লগ নেই।
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{log.customerMobile}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {log.callType === 'due_reminder' ? 'বকেয়া তাগাদা' : 'মার্কেটিং'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'answered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'busy'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status === 'answered'
                            ? 'রিসিভ হয়েছে'
                            : log.status === 'busy'
                            ? 'ব্যস্ত ছিল'
                            : 'উত্তর মেলেনি'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {log.durationSeconds > 0 ? `${log.durationSeconds} সেকেন্ড` : '—'}
                      </td>

                      <td className="py-3 px-4">
                        {log.ivrResponseText ? (
                          <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {log.ivrResponseText}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">কোনো কী চাপেননি</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Script Library */}
      {activeTab === 'scripts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              title: 'বিনম্র বকেয়া তাগাদা (Friendly Due Reminder)',
              type: 'বকেয়া তাগিদ',
              text: DEFAULT_SCRIPTS.due_friendly,
              ivr: '১: বিকাশ লিংক, ২: ৩ দিন সময় বৃদ্ধি, ৩: শপ ওনার',
            },
            {
              title: 'জরুরি ওভারডিউ তাগাদা (Urgent Overdue Alert)',
              type: 'জরুরি নোটিশ',
              text: DEFAULT_SCRIPTS.due_urgent,
              ivr: '১: মার্চেন্ট নম্বর, ৩: ম্যানেজার কানেক্ট',
            },
            {
              title: 'নতুন স্টক আগমন অফার (New Arrival Marketing)',
              type: 'মার্কেটিং',
              text: DEFAULT_SCRIPTS.marketing_offer,
              ivr: 'সরাসরি ব্রডকাস্ট মেসেজ',
            },
            {
              title: 'গ্রাহক শুভেচ্ছা ও ধন্যবাদ (Customer Greeting)',
              type: 'শুভেচ্ছা',
              text: DEFAULT_SCRIPTS.welcome_greeting,
              ivr: 'লয়্যালটি এনগেজমেন্ট',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                  {item.type}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-sans">
                "{item.text}"
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                <span>আইভিআর: {item.ivr}</span>
                <button
                  type="button"
                  onClick={() => {
                    const preview = voiceCallService.interpolateScript(item.text, {
                      customerName: 'সোহেল রানা',
                      dueAmount: 2500,
                      promiseDate: 'আজ',
                    });
                    voiceCallService.speakBangla(preview);
                  }}
                  className="text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>শুনুন</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voice Dialer Modal */}
      <VoiceDialerModal
        isOpen={isDialerOpen}
        onClose={() => setIsDialerOpen(false)}
        customer={activeCustomerForCall}
        callType="due_reminder"
        onCallCompleted={refreshData}
      />

      {/* New Campaign Modal */}
      <NewVoiceCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onSuccess={refreshData}
        customersCount={customers.length}
      />

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={refreshData}
      />
    </div>
  );
};
