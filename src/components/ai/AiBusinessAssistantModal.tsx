import React, { useState } from 'react';
import { aiProductStudioService } from '../../services/aiProductStudioService';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Send, ShieldCheck, DollarSign, Package } from 'lucide-react';

interface AiBusinessAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessMetrics: {
    shopName: string;
    todaySales: number;
    monthlySales: number;
    totalProductsCount: number;
    lowStockCount: number;
    totalCustomerDue: number;
    totalSupplierPayable: number;
  };
}

interface AssistantLog {
  id: string;
  query: string;
  answer: string;
  insights: string[];
  timestamp: string;
}

export const AiBusinessAssistantModal: React.FC<AiBusinessAssistantModalProps> = ({
  isOpen,
  onClose,
  businessMetrics,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AssistantLog[]>([
    {
      id: 'init',
      query: 'বর্তমান ব্যবসার সারসংক্ষেপ',
      answer: `SmartShopX AI বিজনেস রিপোর্ট:\n• আজকের বিক্রয়: ৳${businessMetrics.todaySales.toLocaleString('en-BD')}\n• স্টোরে মোট পণ্য: ${businessMetrics.totalProductsCount}টি\n• কম স্টকের পণ্য: ${businessMetrics.lowStockCount}টি\n• কাস্টমারদের কাছে বকেয়া: ৳${businessMetrics.totalCustomerDue.toLocaleString('en-BD')}\n• সাপ্লায়ারদের প্রদেয় দেনা: ৳${businessMetrics.totalSupplierPayable.toLocaleString('en-BD')}`,
      insights: [
        `দৈনিক বিক্রয়: ${formatCurrency(businessMetrics.todaySales)}`,
        businessMetrics.lowStockCount > 0 ? `রি-স্টক প্রয়োজন: ${businessMetrics.lowStockCount}টি আইটেম` : 'স্টক সন্তোষজনক',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickQuestions = [
    'আজকের বিক্রয় ও লাভ কেমন?',
    'কোন পণ্যগুলোর স্টক কম?',
    'কাস্টমার ও সাপ্লায়ার বাকি কত?',
    'বিক্রি বাড়াতে কী পদক্ষেপ নেওয়া যায়?',
  ];

  const handleAsk = async (userQuery?: string) => {
    const q = (userQuery || query).trim();
    if (!q || loading) return;

    setLoading(true);
    try {
      const res = await aiProductStudioService.askBusinessAssistant(q, {
        todaySales: businessMetrics.todaySales,
        productsCount: businessMetrics.totalProductsCount,
        lowStockCount: businessMetrics.lowStockCount,
        customerDue: businessMetrics.totalCustomerDue,
        supplierPayable: businessMetrics.totalSupplierPayable,
      });

      setLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          query: q,
          answer: res.answer,
          insights: res.insights,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setQuery('');
    } catch {
      setLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          query: q,
          answer: 'বিশ্লেষণ সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।',
          insights: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI বিজনেস অ্যাসিস্ট্যান্ট" size="lg">
      <div className="space-y-4">
        {/* Metric Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div className="p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px]">আজকের বিক্রয়</span>
            <p className="font-black text-slate-900 text-sm mt-0.5">
              {formatCurrency(businessMetrics.todaySales)}
            </p>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px]">লো-স্টক পণ্য</span>
            <p className={`font-black text-sm mt-0.5 ${businessMetrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {businessMetrics.lowStockCount} টি
            </p>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px]">কাস্টমার বাকি</span>
            <p className="font-black text-rose-600 text-sm mt-0.5">
              {formatCurrency(businessMetrics.totalCustomerDue)}
            </p>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px]">সাপ্লায়ার প্রদেয়</span>
            <p className="font-black text-slate-900 text-sm mt-0.5">
              {formatCurrency(businessMetrics.totalSupplierPayable)}
            </p>
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickQuestions.map((qq) => (
            <button
              key={qq}
              type="button"
              onClick={() => handleAsk(qq)}
              className="text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              {qq}
            </button>
          ))}
        </div>

        {/* Chat Logs Conversation */}
        <div className="max-h-[360px] overflow-y-auto space-y-3.5 pr-1 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-slate-900 text-white rounded-2xl rounded-br-xs px-3.5 py-2 max-w-[85%] font-medium">
                  {log.query}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-emerald-50/60 border border-emerald-100 text-slate-800 rounded-2xl rounded-bl-xs p-3.5 max-w-[90%] space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI ব্যবসায়িক অন্তর্দৃষ্টি</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-slate-700">
                    {log.answer}
                  </p>

                  {log.insights && log.insights.length > 0 && (
                    <div className="pt-2 border-t border-emerald-100/80 flex flex-wrap gap-1.5">
                      {log.insights.map((ins, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]"
                        >
                          {ins}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>ব্যবসার রিয়েল-টাইম ডেটা অ্যানালাইজ করা হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 pt-2 border-t border-slate-200"
        >
          <input
            type="text"
            id="input-ai-business-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ব্যবসা বা হিসাব নিয়ে প্রশ্ন করুন (উদা: আজকের লাভ কত?)..."
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!query.trim() || loading}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            জিজ্ঞাসা
          </Button>
        </form>

        {/* Disclaimer Note */}
        <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>সকল আর্থিক ডেটা আপনার সক্রিয় স্টোরের ভেতরেই সম্পূর্ণ সুরক্ষিত ও সীমাবদ্ধ।</span>
        </div>
      </div>
    </Modal>
  );
};
