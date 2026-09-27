import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  PhoneCall,
  MessageSquare,
  HelpCircle,
  Video,
  Monitor,
  Send,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Search,
  Truck,
  CreditCard,
  Printer,
  WifiOff,
  ShieldCheck,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SmartHelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartHelplineModal: React.FC<SmartHelplineModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const { shop, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'hotline' | 'troubleshoot' | 'directory' | 'remote' | 'ticket'>(
    'hotline'
  );

  // Search in troubleshooting
  const [troubleshootSearch, setTroubleshootSearch] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(0);

  // Remote support form
  const [anydeskId, setAnydeskId] = useState('');
  const [remoteIssue, setRemoteIssue] = useState('');
  const [isRemoteSubmitted, setIsRemoteSubmitted] = useState(false);

  // Ticket form
  const [ticketCategory, setTicketCategory] = useState('বিলিং ও পিওএস প্রিন্টার');
  const [ticketDescription, setTicketDescription] = useState('');
  const [isTicketSubmitted, setIsTicketSubmitted] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  const HOTLINE_NUMBER = '+8801836686869';
  const HOTLINE_DISPLAY = '01836-686869 (SmartShopX Hotline)';
  const WHATSAPP_NUMBER = '8801836686869';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি করা হয়েছে!`, 'success');
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `আসসালামু আলাইকুম, আমি SmartShopX ব্যবহারকারী।\nদোকানের নাম: ${shop.name}\nইউজার: ${user?.name || 'ক্যাশিয়ার'}\nমোবাইল: ${user?.mobile || shop.mobile}\nআমার একটি বিষয়ে সহায়তা প্রয়োজন:`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleRemoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anydeskId.trim()) {
      showToast('অনুগ্রহ করে AnyDesk অথবা TeamViewer ID লিখুন', 'warning');
      return;
    }
    setIsRemoteSubmitted(true);
    showToast('রিমোট সাপোর্ট রিকোয়েস্ট পাঠানো হয়েছে! সাপোর্ট প্রতিনিধি কিছুক্ষণের মধ্যেই যোগাযোগ করবেন।', 'success');
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) {
      showToast('অনুগ্রহ করে সমস্যার বিবরণ লিখুন', 'warning');
      return;
    }
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedTicketId(ticketId);
    setIsTicketSubmitted(true);
    showToast(`টিকিট #${ticketId} সফলভাবে জমা হয়েছে!`, 'success');
  };

  // Troubleshooting items
  const faqs = [
    {
      id: 0,
      icon: <Printer className="w-4 h-4 text-emerald-600" />,
      title: 'থার্মাল প্রিন্টারে মেমো প্রিন্ট হচ্ছে না বা কাগজ খালি আসছে',
      solution:
        '১. প্রিন্টারের USB বা ব্লুটুথ কেবল সংযুক্ত কিনা এবং পাওয়ার লাইট জ্বলছে কিনা চেক করুন।\n২. পেপার রোল উল্টো ঢুকানো আছে কিনা দেখুন (থার্মাল পেপারের চকচকে দিক প্রিন্টহেডের দিকে থাকতে হয়)।\n৩. ব্রাউজারের প্রিন্ট ডায়ালগে সঠিক প্রিন্টার সিলেক্ট করুন এবং Paper Size হিসেবে 80mm বা 58mm বেছে নিন।',
    },
    {
      id: 1,
      icon: <WifiOff className="w-4 h-4 text-amber-600" />,
      title: 'দোকানে ইন্টারনেট চলে গেলে ডাটা কি সেভ থাকবে?',
      solution:
        'হ্যাঁ! SmartShopX-এ রয়েছে স্বয়ংক্রিয় অফলাইন মোড (Offline First)। নেট চলে গেলেও পিওএস-এ স্বাভাবিকভাবে বিক্রয় ও মেমো তৈরি হবে এবং ডাটা ব্রাউজারের লোকাল স্টোরেজে নিরাপদে জমা থাকবে। ইন্টারনেট ফিরে আসার সাথে সাথে ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়ে যাবে।',
    },
    {
      id: 2,
      icon: <HelpCircle className="w-4 h-4 text-indigo-600" />,
      title: 'বারকোড স্ক্যানার দিয়ে স্ক্যান করলে শব্দ হয় কিন্তু পণ্য ওঠে না',
      solution:
        '১. কিবোর্ডের Caps Lock অন আছে কিনা অথবা ভাষা বাংলায় পরিবর্তন হয়ে গেছে কিনা লক্ষ্য করুন (ইংরেজি কিবোর্ড মোডে রাখুন)।\n২. পণ্যের ক্যাটালগে ওই বারকোডটি সঠিক সংখ্যা দিয়ে সেভ করা আছে কিনা চেক করুন।\n৩. ক্যামেরা স্ক্যানার চালু করতে চাইলে পিওএস সার্চ বারের ডানের ক্যামেরা আইকন ব্যবহার করুন।',
    },
    {
      id: 3,
      icon: <CreditCard className="w-4 h-4 text-rose-600" />,
      title: 'বাকি খাতা থেকে কাস্টমারকে বিকাশ/নগদ পে-লিংক পাঠানোর নিয়ম',
      solution:
        '১. কাস্টমার মেনু থেকে গ্রাহকের প্রোফাইলে গিয়ে "বকেয়া তাগাদা" বাটনে ক্লিক করুন।\n২. আপনার বিকাশ বা নগদ মার্চেন্ট/পার্সোনাল নম্বর দিন।\n৩. সিস্টেম স্বয়ংক্রিয়ভাবে গ্রাহকের মোট বকেয়া ও সরাসরি পেমেন্ট লিংক তৈরি করে দেবে, যা এক ক্লিকে হোয়াটসঅ্যাপ বা এসএমএসে পাঠাতে পারবেন।',
    },
    {
      id: 4,
      icon: <Clock className="w-4 h-4 text-purple-600" />,
      title: 'দিনশেষে ক্যাশ ড্রয়ার ও নিট লাভ কীভাবে মেলাব?',
      solution:
        'পিওএস অথবা ড্যাশবোর্ডের "ক্যাশ ড্রয়ার ক্লোজিং" বাটনে ক্লিক করুন। সিস্টেম সারাদিনের নগদ বিক্রয়, বকেয়া আদায় এবং দোকান খরচের ভিত্তিতে ড্রয়ারে কত টাকা থাকার কথা তা হিসাব করবে। ক্যাশবাক্সের নগদ টাকা গুনে বসালে স্বয়ংক্রিয়ভাবে মিল/গরমিল ও Z-Report তৈরি হয়ে যাবে।',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.title.toLowerCase().includes(troubleshootSearch.toLowerCase()) ||
      f.solution.toLowerCase().includes(troubleshootSearch.toLowerCase())
  );

  // MFS & Courier Directory
  const directory = [
    {
      name: 'bKash Merchant Support',
      nameBn: 'বিকাশ মার্চেন্ট সাপোর্ট',
      category: 'MFS',
      hotline: '16247',
      hours: '২৪ ঘণ্টা / ৭ দিন',
      desc: 'মার্চেন্ট পেমেন্ট, স্টেটমেন্ট ও কিউআর সমস্যা',
    },
    {
      name: 'Nagad Merchant Care',
      nameBn: 'নগদ মার্চেন্ট কেয়ার',
      category: 'MFS',
      hotline: '16167',
      hours: '২৪ ঘণ্টা / ৭ দিন',
      desc: 'উদ্যোক্তা ও মার্চেন্ট লেনদেন সমাধান',
    },
    {
      name: 'Pathao Courier Support',
      nameBn: 'পাঠাও কুরিয়ার হেল্পডেস্ক',
      category: 'Courier',
      hotline: '09610003030',
      hours: 'সকাল ৯:০০ - রাত ৯:০০',
      desc: 'পার্সেল পিকআপ, ডেলিভারি স্ট্যাটাস ও পেমেন্ট',
    },
    {
      name: 'Steadfast Courier',
      nameBn: 'স্টিডফাস্ট কুরিয়ার সাপোর্ট',
      category: 'Courier',
      hotline: '09678045045',
      hours: 'সকাল ৯:০০ - রাত ৮:০০',
      desc: 'মার্চেন্ট হাব ও ক্যাশ অন ডেলিভারি (COD)',
    },
    {
      name: 'RedX Delivery Care',
      nameBn: 'রেডএক্স কুরিয়ার হেল্পলাইন',
      category: 'Courier',
      hotline: '09612444888',
      hours: 'সকাল ১০:০০ - সন্ধ্যা ৭:০০',
      desc: 'রিটার্ন পার্সেল ও ডেলিভারি অনুসন্ধান',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="স্মার্ট হেল্পলাইন ও সাপোর্ট সেন্টার (Smart Helpline)"
      subtitle="দোকানের যেকোনো সমস্যায় তাৎক্ষণিক সমাধান, হটলাইন ও সাপোর্ট ডিরেক্টরি"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('hotline')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'hotline'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>জরুরি হটলাইন ও কল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('troubleshoot')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'troubleshoot'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>দ্রুত সমাধান (FAQ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'directory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>বিকাশ/কুরিয়ার ডিরেক্টরি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remote')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'remote'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>রিমোট সাপোর্ট (AnyDesk)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'ticket'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>সাপোর্ট টিকিট</span>
          </button>
        </div>

        {/* TAB 1: HOTLINE & DIRECT CHAT */}
        {activeTab === 'hotline' && (
          <div className="space-y-4">
            {/* Primary Action Hero */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/logo.png"
                    alt="SmartShopX Logo"
                    className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shrink-0 object-contain border border-emerald-400/40 hidden sm:block"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">
                        কাস্টমার হেল্পডেস্ক সচল (সকাল ৯টা - রাত ১১টা)
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                      {HOTLINE_DISPLAY}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md">
                      বিলিং, প্রিন্টার সেটআপ, ডাটা ব্যাকআপ বা সফটওয়্যারের যেকোনো জরুরি প্রয়োজনে সরাসরি কল বা হোয়াটসঅ্যাপ করুন।
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <a
                    href={`tel:${HOTLINE_NUMBER}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>সরাসরি কল দিন</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp চ্যাট</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Support Channels Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">ইমেইল হেল্পডেস্ক</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('support@smartshopx.com', 'ইমেইল অ্যাড্রেস')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                    title="কপি করুন"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-emerald-700 font-semibold">support@smartshopx.com</p>
                <p className="text-[11px] text-slate-500">বড় ফাইল বা এক্সেল ক্যাটালগ পাঠাতে</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">টেকনিক্যাল টিম হটলাইন</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(HOTLINE_NUMBER, 'ফোন নম্বর')}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                    title="কপি করুন"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono text-emerald-700 font-semibold">01836-686869</p>
                <p className="text-[11px] text-slate-500">জরুরি সিস্টেম বিঘ্ন বা বাগ রিপোর্ট</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">অটো ব্যাকআপ ও ক্লাউড</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-700 font-medium">প্রতি ৩০ মিনিটে অটো ব্যাকআপ</p>
                <p className="text-[11px] text-slate-500">আপনার ডাটা গুগল ক্লাউডে শতভাগ নিরাপদ</p>
              </div>
            </div>

            {/* Quick 1-Minute Video Guides */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>১ মিনিটের ব্যবহার নির্দেশিকা (Video & Guide Links)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    title: '১ মিনিটে বিক্রয় ও থার্মাল মেমো প্রিন্ট করার নিয়ম',
                    tag: 'POS Guide',
                  },
                  {
                    title: 'ক্যামেরা ও বারকোড স্ক্যানার দিয়ে প্রোডাক্ট এন্ট্রি',
                    tag: 'Barcode & Inventory',
                  },
                  {
                    title: 'বাকি খাতা থেকে বিকাশ ও নগদ পেমেন্ট লিংক পাঠানো',
                    tag: 'Due Collection',
                  },
                  {
                    title: 'দিনশেষে ক্যাশ ড্রয়ার ক্লোজিং ও নিট লাভ খতিয়ান',
                    tag: 'Cash Register',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer group"
                    onClick={() => {
                      setActiveTab('troubleshoot');
                      setSelectedFaq(idx % faqs.length);
                    }}
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.tag}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TROUBLESHOOTING & FAQ */}
        {activeTab === 'troubleshoot' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={troubleshootSearch}
                onChange={(e) => setTroubleshootSearch(e.target.value)}
                placeholder="সমস্যা লিখে খুঁজুন (যেমন: প্রিন্টার, স্ক্যানার, বাকি, অফলাইন)..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Q&A Accordion Style */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredFaqs.map((faq) => {
                const isSelected = selectedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`border rounded-2xl transition-all ${
                      isSelected ? 'border-emerald-300 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFaq(isSelected ? null : faq.id)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white shadow-2xs shrink-0">{faq.icon}</div>
                        <span>{faq.title}</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isSelected ? 'rotate-90 text-emerald-600' : ''
                        }`}
                      />
                    </button>

                    {isSelected && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-emerald-200/50 leading-relaxed whitespace-pre-line animate-in fade-in duration-200">
                        {faq.solution}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  কোনো সমাধান মেলেনি। অনুগ্রহ করে সরাসরি হটলাইনে কল করুন বা হোয়াটসঅ্যাপে লিখুন।
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MFS & COURIER DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              দোকান পরিচালনার জন্য প্রয়োজনীয় বিকাশ, নগদ ও কুরিয়ার সার্ভিসের অফিসিয়াল হেল্পলাইন নম্বর:
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {directory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.nameBn}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                    <p className="text-[10px] text-slate-400">সময়: {item.hours}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-emerald-700 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {item.hotline}
                    </span>
                    <a
                      href={`tel:${item.hotline}`}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                      title="কল করুন"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REMOTE DESKTOP (AnyDesk) */}
        {activeTab === 'remote' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-900">
                <Monitor className="w-4 h-4 text-indigo-600" />
                <span>রিমোট ডেস্কটপ সাপোর্ট (AnyDesk / TeamViewer)</span>
              </div>
              <p className="text-indigo-800">
                আপনার দোকানে থার্মাল প্রিন্টার ড্রাইভার সেটআপ, বারকোড স্ক্যানার কনফিগারেশন বা জরুরি টেকনিক্যাল সমস্যায় আমাদের এক্সপার্ট টিম সরাসরি আপনার কম্পিউটারে সংযোগ নিয়ে সমাধান করে দেবে।
              </p>
            </div>

            {isRemoteSubmitted ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">অনুরোধ জমা হয়েছে!</h4>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  আমাদের টেকনিক্যাল সাপোর্ট প্রতিনিধি আপনার মোবাইল ({user?.mobile || shop.mobile})-এ কল করে সংযোগ নিচ্ছেন। অনুগ্রহ করে AnyDesk সফটওয়্যারটি ওপেন রাখুন।
                </p>
                <Button
                  onClick={() => setIsRemoteSubmitted(false)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  আরেকটি রিকোয়েস্ট পাঠান
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRemoteSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আপনার AnyDesk অথবা TeamViewer 9-Digit ID *
                  </label>
                  <input
                    type="text"
                    value={anydeskId}
                    onChange={(e) => setAnydeskId(e.target.value)}
                    placeholder="যেমন: 456 789 123"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কী বিষয়ে সাহায্য প্রয়োজন? (সংক্ষেপে লিখুন)
                  </label>
                  <input
                    type="text"
                    value={remoteIssue}
                    onChange={(e) => setRemoteIssue(e.target.value)}
                    placeholder="যেমন: নতুন ব্লুটুথ থার্মাল প্রিন্টারে মেমো কাটছে না"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    আমাদের টিম শুধুমাত্র অফিসিয়াল SmartShopX আইপি থেকে এক্সেস নেবে
                  </span>
                  <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                    রিমোট সহায়তার অনুরোধ পাঠান
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 5: SUPPORT TICKET */}
        {activeTab === 'ticket' && (
          <div className="space-y-4">
            {isTicketSubmitted ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">টিকিট গ্রহণ করা হয়েছে!</h4>
                <p className="text-xs text-emerald-800">
                  আপনার টিকিট ট্র্যাকিং আইডি: <span className="font-mono font-black">{generatedTicketId}</span>
                </p>
                <p className="text-[11px] text-emerald-700">
                  আমাদের প্রোডাক্ট টিম আপনার বিবরণ পর্যালোচনা করে সর্বোচ্চ ২ ঘণ্টার মধ্যে ব্যবস্থা নেবে।
                </p>
                <Button
                  onClick={() => {
                    setIsTicketSubmitted(false);
                    setTicketDescription('');
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  নতুন টিকিট তৈরি করুন
                </Button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সমস্যার বিষয় বা ক্যাটাগরি</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="বিলিং ও পিওএস প্রিন্টার">বিলিং ও পিওএস প্রিন্টার</option>
                    <option value="বারকোড স্ক্যানার ও লেবেল">বারকোড স্ক্যানার ও লেবেল</option>
                    <option value="ইনভেন্টরি ও স্টক হিসাব">ইনভেন্টরি ও স্টক হিসাব</option>
                    <option value="এসএমএস ও ক্যাম্পেইন গেটওয়ে">এসএমএস ও ক্যাম্পেইন গেটওয়ে</option>
                    <option value="কুরিয়ার পার্সেল ও ট্র্যাকিং">কুরিয়ার পার্সেল ও ট্র্যাকিং</option>
                    <option value="নতুন ফিচারের পরামর্শ">নতুন ফিচারের পরামর্শ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">সমস্যার বিস্তারিত বিবরণ *</label>
                  <textarea
                    rows={4}
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="কোথায় কী সমস্যা হচ্ছে বা কী এরর মেসেজ দেখাচ্ছে তা বিস্তারিত লিখুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    দোকান: {shop.name} | ইউজার: {user?.name || 'অ্যাডমিন'}
                  </span>
                  <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                    টিকিট জমা দিন
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>SmartShopX হেল্পলাইন সার্ভিস ২৪/৭ সচল</span>
          <Button onClick={onClose} variant="secondary" size="sm">
            বন্ধ করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};
